// Tests de la sauvegarde de la progression (fichier et code de transfert).
const test = require("node:test");
const assert = require("node:assert/strict");
const { chargerSite } = require("./charger");

const brut = x => JSON.parse(JSON.stringify(x));

test("une sauvegarde contient la progression et les réglages, et se restaure à l'identique", () => {
  const a = chargerSite();
  a.Progression.repondre("bonjour", true);
  a.Progression.repondre("merci", false);
  a.Reglages.changer("gaucher", true);
  const s = brut(a.Sauvegarde.creer());
  assert.equal(s.app, "signes-en-main");

  const b = chargerSite(); // « autre appareil »
  b.Sauvegarde.restaurer(s, "remplacer");
  assert.deepEqual(brut(b.Progression.lire()), brut(a.Progression.lire()));
  assert.equal(b.Reglages.gaucher, true);
});

test("un fichier qui n'est pas une sauvegarde est refusé avec un message clair", () => {
  const { Sauvegarde: S } = chargerSite();
  assert.throws(() => S.verifier({ cartes: {} }), /pas une sauvegarde/);
  assert.throws(() => S.verifier(null), /pas une sauvegarde/);
  assert.throws(() => S.verifier({ app: "signes-en-main", version: 99, progression: { cartes: {} } }), /plus récente/);
  assert.throws(() => S.verifier({ app: "signes-en-main", version: 1, progression: { cartes: [] } }), /abîmée/);
});

test("une sauvegarde déjà vérifiée peut être restaurée (vérifier puis restaurer, comme sur la page)", () => {
  const a = chargerSite();
  a.Progression.repondre("bonjour", true);
  const b = chargerSite();
  const verifiee = b.Sauvegarde.verifier(brut(a.Sauvegarde.creer()));
  b.Sauvegarde.restaurer(verifiee, "fusionner");
  assert.equal(b.Progression.carte("bonjour").boite, 2);
});

test("les cartes abîmées d'une sauvegarde sont ignorées, les bonnes gardées", () => {
  const { Sauvegarde: S } = chargerSite();
  const s = S.verifier({ app: "signes-en-main", version: 1, progression: {
    cartes: { ok: { boite: 2, prochaine: "2026-01-02", vues: 3, justes: 2 }, ko1: { boite: 9, prochaine: "2026-01-02" }, ko2: { boite: 1, prochaine: "demain" } },
    quiz: { bonnes: 2, total: 3 }, jours: ["2026-01-01", "pas une date", "2026-01-01"] } });
  assert.deepEqual(Object.keys(s.progression.cartes), ["ok"]);
  assert.deepEqual(s.progression.jours, ["2026-01-01"]);
});

test("fusionner garde, pour chaque signe, la version la plus travaillée", () => {
  const { Sauvegarde: S } = chargerSite();
  const ordi = { cartes: { a: { boite: 3, prochaine: "2026-02-01", vues: 5, justes: 4, appris: false }, b: { boite: 1, prochaine: "2026-01-01", vues: 1, justes: 0, appris: true } },
    quiz: { bonnes: 4, total: 6 }, jours: ["2026-01-01", "2026-01-02"] };
  const tel = { cartes: { a: { boite: 2, prochaine: "2026-01-20", vues: 2, justes: 1, appris: false }, b: { boite: 2, prochaine: "2026-01-05", vues: 3, justes: 2, appris: false }, c: { boite: 1, prochaine: "2026-01-03", vues: 1, justes: 0, appris: false } },
    quiz: { bonnes: 9, total: 10 }, jours: ["2026-01-02", "2026-01-03"] };
  const f = S.fusionner(ordi, tel);
  assert.equal(f.cartes.a.boite, 3, "a : plus de vues sur l'ordinateur");
  assert.equal(f.cartes.b.boite, 2, "b : plus de vues sur le téléphone");
  assert.equal(f.cartes.b.appris, true, "« appris » marqué d'un côté reste marqué");
  assert.ok(f.cartes.c, "c : n'existait que sur le téléphone");
  assert.deepEqual(f.jours, ["2026-01-01", "2026-01-02", "2026-01-03"]);
  assert.deepEqual(f.quiz, { bonnes: 9, total: 10 });
});

test("le code de transfert redonne exactement la sauvegarde", async () => {
  const a = chargerSite();
  for (const k of ["bonjour", "merci", "oui", "non", "maman"]) a.Progression.repondre(k, true);
  const s = a.Sauvegarde.creer();
  const code = await a.Sauvegarde.versCode(s);
  assert.match(code, /^SEM1\.[A-Za-z0-9_-]+$/);
  assert.deepEqual(brut(await a.Sauvegarde.depuisCode("  " + code + "\n")), brut(s), "les espaces et retours à la ligne sont tolérés");
  await assert.rejects(a.Sauvegarde.depuisCode("bonjour"), /SEM1/);
  await assert.rejects(a.Sauvegarde.depuisCode(code.slice(0, 30)), /incomplet/);
});

test("le rappel de sauvegarde n'apparaît qu'après quelques signes, et disparaît après une sauvegarde", () => {
  const { Progression: P, Sauvegarde: S } = chargerSite();
  assert.equal(S.conseillee(), false);
  for (let i = 0; i < 10; i++) P.repondre("signe" + i, true);
  assert.equal(S.conseillee(), true);
  S.noterExport();
  assert.equal(S.conseillee(), false);
});
