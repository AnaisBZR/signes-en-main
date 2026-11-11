// Tests de la révision intelligente (boîtes de Leitner) et de la série de jours.
const test = require("node:test");
const assert = require("node:assert/strict");
const { chargerSite } = require("./charger");

test("une bonne réponse fait monter le signe d'une boîte et l'espace dans le temps", () => {
  const { Progression: P } = chargerSite();
  let c = P.repondre("bonjour", true);
  assert.equal(c.boite, 2);
  assert.equal(c.prochaine, P.jour(P.INTERVALLES[2]));
  c = P.repondre("bonjour", true);
  assert.equal(c.boite, 3);
  assert.equal(c.prochaine, P.jour(P.INTERVALLES[3]));
  assert.equal(P.estAppris("bonjour"), true, "boîte 3 = signe appris");
});

test("une mauvaise réponse renvoie en boîte 1, à revoir aujourd'hui", () => {
  const { Progression: P } = chargerSite();
  P.repondre("merci", true);
  P.repondre("merci", true);
  const c = P.repondre("merci", false);
  assert.equal(c.boite, 1);
  assert.deepEqual(P.aReviser(), ["merci"]);
});

test("la boîte ne dépasse jamais 5", () => {
  const { Progression: P } = chargerSite();
  for (let i = 0; i < 10; i++) P.repondre("oui", true);
  assert.equal(P.carte("oui").boite, 5);
  assert.equal(P.carte("oui").prochaine, P.jour(30));
});

test("les scores du quiz sont comptés", () => {
  const { Progression: P } = chargerSite();
  P.repondre("a", true); P.repondre("b", false); P.repondre("c", true);
  assert.deepEqual(P.lire().quiz, { bonnes: 2, total: 3 });
  assert.deepEqual(P.parBoite(), [0, 1, 2, 0, 0, 0]);
});

test("« Marquer comme appris » ajoute le signe aux révisions de demain, et s'annule", () => {
  const { Progression: P } = chargerSite();
  assert.equal(P.basculerAppris("rouge"), true);
  assert.equal(P.estAppris("rouge"), true);
  assert.equal(P.carte("rouge").prochaine, P.jour(1));
  assert.equal(P.basculerAppris("rouge"), false);
  assert.equal(P.estAppris("rouge"), false);
});

test("la série compte les jours d'affilée jusqu'à aujourd'hui", () => {
  const { Progression: P } = chargerSite();
  const p = P.vide();
  p.jours = [P.jour(-3), P.jour(-2), P.jour(-1), P.jour()];
  P.sauver(p);
  assert.equal(P.serie(), 4);
  p.jours = [P.jour(-3), P.jour(-1), P.jour()];
  P.sauver(p);
  assert.equal(P.serie(), 2, "un jour manqué coupe la série");
  p.jours = [P.jour(-1)];
  P.sauver(p);
  assert.equal(P.serie(), 0, "pas encore d'activité aujourd'hui");
});

test("une progression illisible ne casse pas le site", () => {
  const { Progression: P, contexte } = chargerSite();
  contexte.localStorage.setItem(P.CLE, "{pas du json");
  assert.deepEqual(P.lire(), P.vide());
  contexte.localStorage.setItem(P.CLE, JSON.stringify({ autre: 1 }));
  assert.deepEqual(P.lire(), P.vide());
});

test("réinitialiser efface tout", () => {
  const { Progression: P } = chargerSite();
  P.repondre("x", true);
  P.reinitialiser();
  assert.deepEqual(P.lire(), P.vide());
});

test("le mode gaucher est mémorisé, et n'est pas effacé avec la progression", () => {
  const { Progression: P, Reglages: R } = chargerSite();
  assert.equal(R.gaucher, false, "désactivé par défaut");
  R.changer("gaucher", true);
  assert.equal(R.gaucher, true);
  P.reinitialiser();
  assert.equal(R.gaucher, true);
});
