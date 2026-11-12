// Tests des outils des exercices (page « S'entraîner ») et des records.
const test = require("node:test");
const assert = require("node:assert/strict");
const { chargerSite } = require("./charger");

const site = chargerSite();

test("une réponse tapée est comparée sans accents, majuscules ni ponctuation", () => {
  const { comparerReponse: c } = site;
  assert.equal(c("ecole", "École"), "exact");
  assert.equal(c("  BONJOUR ", "Bonjour"), "exact");
  assert.equal(c("qui", "Qui ?"), "exact");
  assert.equal(c("soeur", "Sœur"), "exact");
  assert.equal(c("sœur", "Soeur"), "exact");
  assert.equal(c("aujourd’hui", "Aujourd'hui"), "exact", "apostrophe typographique");
  assert.equal(c("je ne sais pas", "Je ne sais pas"), "exact");
  assert.equal(c("week end", "Week-end"), "presque");
  assert.equal(c("bonjour", "Bonjour (salut)"), "exact", "les précisions entre parenthèses sont ignorées");
});

test("une petite faute de frappe est acceptée, pas un autre mot", () => {
  const { comparerReponse: c } = site;
  assert.equal(c("bonjur", "Bonjour"), "presque");
  assert.equal(c("bibliotheqe", "Bibliothèque"), "presque");
  assert.equal(c("bibliotek", "Bibliothèque"), "faux");
  assert.equal(c("chat", "Chien"), "faux");
  assert.equal(c("ou", "Où ?"), "exact");
  assert.equal(c("oui", "Où ?"), "faux", "pas de tolérance sur les mots très courts");
  assert.equal(c("", "Chat"), "faux");
});

test("distance entre deux mots", () => {
  const { distanceMots: d } = site;
  assert.equal(d("chat", "chat"), 0);
  assert.equal(d("chat", "chats"), 1);
  assert.equal(d("chien", "chine"), 2);
  assert.equal(d("", "abc"), 3);
});

test("le défi du jour est le même toute la journée, différent le lendemain", () => {
  const { aleaGraine, melangerAvec } = site;
  const liste = Array.from({ length: 20 }, (_, i) => i);
  const a = melangerAvec(liste, aleaGraine("defi-2026-11-11"));
  const b = melangerAvec(liste, aleaGraine("defi-2026-11-11"));
  const c = melangerAvec(liste, aleaGraine("defi-2026-11-12"));
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
  assert.deepEqual([...a].sort((x, y) => x - y), liste, "rien de perdu ni de dupliqué");
});

test("les mots à épeler n'ont que des lettres (3 à 8)", () => {
  const { motsEpelables } = site;
  assert.deepEqual(motsEpelables(["Chat", "Au revoir", "Qui ?", "Oui", "Bibliothèque", "Chat", "Week-end", "Papa"]), ["Chat", "Oui", "Papa"]);
  const lecons = site.LSF_DATA.themes.flatMap(t => t.mots);
  assert.ok(motsEpelables(lecons).length >= 20, "assez de mots pour l'exercice");
});

test("les mauvaises réponses d'une phrase sont d'autres phrases, de même structure si possible", () => {
  const { PHRASES, phrasesVoisines } = site;
  const p = PHRASES[0];
  const v = phrasesVoisines(p, PHRASES, 2);
  assert.equal(v.length, 2);
  assert.ok(!v.includes(p));
  for (const x of v) assert.equal(x.roles.join(), p.roles.join());
});

test("records : le meilleur score est gardé, dans le bon sens", () => {
  const { Records: R } = chargerSite();
  assert.equal(R.noter("sprint", 12), false, "premier score : pas un « nouveau record »");
  assert.equal(R.noter("sprint", 9), false);
  assert.equal(R.meilleur("sprint"), 12);
  assert.equal(R.noter("sprint", 15), true);
  R.noter("paires", 10);
  assert.equal(R.noter("paires", 8), true, "moins de coups = mieux");
  assert.equal(R.noter("paires", 11), false);
  assert.equal(R.meilleur("paires"), 8);
});

test("défi du jour : un score par jour, le meilleur est gardé", () => {
  const { Records: R } = chargerSite();
  assert.equal(R.defiDuJour(), null);
  R.noterDefi(6); R.noterDefi(4);
  assert.equal(R.defiDuJour(), 6);
  assert.equal(R.nbDefis(), 1);
});

test("les records sont sauvegardés, restaurés et fusionnés avec la progression", () => {
  const a = chargerSite();
  a.Records.noter("sprint", 20); a.Records.noter("paires", 9); a.Records.noterDefi(7);
  const s = JSON.parse(JSON.stringify(a.Sauvegarde.creer()));
  const b = chargerSite();
  b.Records.noter("sprint", 25); b.Records.noter("paires", 12);
  b.Progression.repondre("chat", true);
  b.Sauvegarde.restaurer(s, "fusionner");
  assert.equal(b.Records.meilleur("sprint"), 25);
  assert.equal(b.Records.meilleur("paires"), 9);
  assert.equal(b.Records.defiDuJour(), 7);
  b.Sauvegarde.restaurer(s, "remplacer");
  assert.equal(b.Records.meilleur("sprint"), 20);
});

test("une sauvegarde ancienne (sans records) reste valable", () => {
  const { Sauvegarde: S, Records: R } = chargerSite();
  const s = S.verifier({ app: "signes-en-main", version: 1, progression: { cartes: {}, quiz: {}, jours: [] } });
  assert.deepEqual(s.records, R.vide());
  assert.deepEqual(R.verifier({ meilleurs: { sprint: "abc", inconnu: 3, paires: 7 }, defis: { "pas-une-date": 3, "2026-01-01": 50 } }),
    { meilleurs: { paires: 7 }, defis: { "2026-01-01": 10 }, lecons: {} });
});

test("réinitialiser la progression efface aussi les records", () => {
  const { Progression: P, Records: R } = chargerSite();
  R.noter("sprint", 5);
  P.reinitialiser();
  assert.equal(R.meilleur("sprint"), null);
});
