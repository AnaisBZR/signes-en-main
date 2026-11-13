// Tests des profils (plusieurs personnes sur un appareil), du personnage et des chiffres du journal.
const test = require("node:test");
const assert = require("node:assert/strict");
const { chargerSite } = require("./charger");

test("sans profil, rien ne change : la progression reste sous ses clés d'origine", () => {
  const { Profils, Progression, contexte } = chargerSite();
  assert.equal(Profils.actif(), null);
  Progression.repondre("chat", true);
  assert.ok(contexte.localStorage.getItem("lsf-progression-v2"));
});

test("le premier profil reprend la progression existante, les suivants partent de zéro", () => {
  const { Profils, Progression, Records } = chargerSite();
  Progression.repondre("chat", true);
  Records.noter("sprint", 12);
  const a = Profils.creer("  Camille  ", { peau: 2 });
  assert.equal(a.nom, "Camille");
  assert.equal(a.principal, true);
  assert.ok(Progression.carte("chat"), "la progression d'avant est gardée");

  const b = Profils.creer("Lou");
  assert.equal(b.principal, false);
  assert.equal(Profils.actif().id, b.id, "le nouveau profil devient actif");
  assert.equal(Progression.carte("chat"), null);
  assert.equal(Records.meilleur("sprint"), null);
  Progression.repondre("chien", false);

  Profils.choisir(a.id);
  assert.ok(Progression.carte("chat"));
  assert.equal(Progression.carte("chien"), null, "les progressions ne se mélangent pas");
  assert.equal(Records.meilleur("sprint"), 12);
});

test("chaque profil a ses propres réglages (thème, gaucher)", () => {
  const { Profils, Reglages } = chargerSite();
  const a = Profils.creer("A");
  Reglages.changer("theme", "sombre");
  Profils.creer("B");
  assert.equal(Reglages.theme, "clair");
  Profils.choisir(a.id);
  assert.equal(Reglages.theme, "sombre");
});

test("un prénom vide est refusé, le prénom est nettoyé et limité", () => {
  const { Profils } = chargerSite();
  assert.equal(Profils.creer("   "), null);
  assert.equal(Profils.creer("<b>Zoé</b>").nom, "bZoé/b");
  assert.equal(Profils.creer("x".repeat(80)).nom.length, Profils.NOM_MAX);
});

test("supprimer un profil efface ses données et passe à un autre profil", () => {
  const { Profils, Progression, contexte } = chargerSite();
  const a = Profils.creer("A");
  const b = Profils.creer("B");
  Progression.repondre("chat", true);
  const cle = `lsf-progression-v2@${b.id}`;
  assert.ok(contexte.localStorage.getItem(cle));
  Profils.supprimer(b.id);
  assert.equal(contexte.localStorage.getItem(cle), null);
  assert.equal(Profils.actif().id, a.id);
  assert.equal(Profils.lire().liste.length, 1);
});

test("le personnage est toujours valide (valeurs inconnues remplacées)", () => {
  const { Avatar } = chargerSite();
  const a = Avatar.verifier({ peau: 99, coiffure: -1, cheveux: "3", lunettes: 1.2, inconnu: 5 });
  assert.equal(a.peau, Avatar.DEFAUT.peau);
  assert.equal(a.coiffure, Avatar.DEFAUT.coiffure);
  assert.equal(a.cheveux, 3);
  assert.equal(a.lunettes, 1);
  assert.ok(!("inconnu" in a));
  for (const [trait, n] of Object.entries(Avatar.TRAITS)) assert.equal(Avatar.CHOIX[trait].length, n, `${trait} : autant de choix que prévu`);
  const svg = Avatar.svg(Avatar.auHasard(), 40, "Portrait de \"Zoé\"");
  assert.match(svg, /^<svg class="avatar"/);
  assert.ok(!svg.includes('"Zoé"'), "le titre est échappé");
});

test("le journal compte les questions, les nouveaux signes et les signes appris du jour", () => {
  const { Progression } = chargerSite();
  Progression.repondre("chat", true);
  Progression.repondre("chat", true); // boîte 3 : appris
  Progression.repondre("chien", false);
  Progression.basculerAppris("maison");
  Progression.activite();
  const j = Progression.lire().journal[Progression.jour()];
  assert.deepEqual(j, { q: 3, j: 2, n: 3, a: 2, x: 1 });
});

test("meilleure série de jours d'affilée", () => {
  const { Progression } = chargerSite();
  const p = Progression.vide();
  p.jours = ["2026-01-01", "2026-01-02", "2026-01-03", "2026-02-10", "2026-02-11", "2026-03-31", "2026-04-01"];
  Progression.sauver(p);
  assert.equal(Progression.meilleureSerie(), 3);
});

test("la sauvegarde emporte le profil et le journal, et recrée le profil ailleurs", () => {
  const site = chargerSite();
  site.Profils.creer("Camille", { coiffure: 5 });
  site.Progression.repondre("chat", true);
  const s = JSON.parse(JSON.stringify(site.Sauvegarde.creer()));
  assert.equal(s.profil.nom, "Camille");

  const ailleurs = chargerSite();
  ailleurs.Sauvegarde.restaurer(s, "fusionner");
  assert.equal(ailleurs.Profils.actif().nom, "Camille");
  assert.equal(ailleurs.Profils.actif().avatar.coiffure, 5);
  assert.equal(ailleurs.Progression.lire().journal[ailleurs.Progression.jour()].q, 1);
});

test("fusionner deux journaux garde le plus grand compteur de chaque jour", () => {
  const { Sauvegarde } = chargerSite();
  const a = { cartes: {}, quiz: { bonnes: 0, total: 0 }, jours: ["2026-01-01"], journal: { "2026-01-01": { q: 5, j: 1, n: 0, a: 0, x: 2 } } };
  const b = { cartes: {}, quiz: { bonnes: 0, total: 0 }, jours: ["2026-01-01", "2026-01-02"], journal: { "2026-01-01": { q: 3, j: 3, n: 1, a: 0, x: 0 }, "2026-01-02": { q: 1, j: 1, n: 1, a: 0, x: 0 } } };
  const f = Sauvegarde.fusionner(a, b);
  assert.deepEqual(f.journal["2026-01-01"], { q: 5, j: 3, n: 1, a: 0, x: 2 });
  assert.equal(f.journal["2026-01-02"].q, 1);
});
