// Tests de cohérence des données : leçons, dictionnaire, alphabet, descriptions.
const test = require("node:test");
const assert = require("node:assert/strict");
const { chargerSite } = require("./charger");

const site = chargerSite();
const { LSF_DATA, Dico, ALPHABET, DESCRIPTIONS } = site;
const LICENCES_LIBRES = /^(CC BY(-SA)? [0-9.]+( [A-Z]+)?|CC0( 1\.0)?|Domaine public|Public domain)$/i;

test("chaque thème a un identifiant unique, une couleur, une icône et un niveau 1 à 3", () => {
  const ids = new Set();
  for (const t of LSF_DATA.themes) {
    assert.ok(t.id && !ids.has(t.id), `identifiant en double ou vide : ${t.id}`);
    ids.add(t.id);
    assert.match(t.couleur, /^#[0-9a-f]{6}$/i, t.id);
    assert.ok(t.icone, t.id);
    assert.ok([1, 2, 3].includes(t.niveau), t.id);
  }
});

test("chaque mot des leçons existe dans le dictionnaire", () => {
  const absents = LSF_DATA.themes.flatMap(t => t.mots.filter(m => !Dico.trouver(m)).map(m => `${t.id} : ${m}`));
  assert.deepEqual(absents, [], "mots des leçons sans vidéo");
});

test("chaque thème a assez de signes pour un quiz à 4 choix", () => {
  for (const t of LSF_DATA.themes) {
    const n = t.mots.filter(m => Dico.trouver(m)).length;
    assert.ok(n >= 4, `${t.id} n'a que ${n} signes`);
  }
});

test("chaque mot du dictionnaire a au moins une vidéo complète et sous licence libre", () => {
  const cles = new Set();
  for (const e of Dico.entrees) {
    assert.ok(!cles.has(e.k), `mot en double : ${e.mot}`);
    cles.add(e.k);
    assert.ok(e.videos.length > 0, `${e.mot} sans vidéo`);
    for (const v of e.videos) {
      assert.match(v.url, /^https:\/\/upload\.wikimedia\.org\//, e.mot);
      assert.match(v.page, /^https:\/\/commons\.wikimedia\.org\//, e.mot);
      assert.ok(v.auteur, `${e.mot} : auteur manquant (obligatoire pour les licences CC BY)`);
      assert.match(v.licence, LICENCES_LIBRES, `${e.mot} : licence « ${v.licence} »`);
    }
  }
});

test("l'alphabet contient les 26 lettres, avec auteur et licence", () => {
  assert.deepEqual(ALPHABET.map(l => l.lettre).join(""), "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  for (const l of ALPHABET) {
    assert.ok(l.image && l.page && l.auteur, l.lettre);
    assert.match(l.licence, LICENCES_LIBRES, l.lettre);
  }
});

test("chaque description automatique correspond à un mot du dictionnaire", () => {
  const cles = new Set(Dico.entrees.map(e => e.k));
  const orphelines = Object.keys(DESCRIPTIONS).filter(k => !cles.has(k));
  assert.deepEqual(orphelines, []);
});

test("la recherche du dictionnaire trouve un mot sans accent ni majuscule", () => {
  assert.equal(Dico.chercher("ecole")[0]?.k, Dico.trouver("École")?.k);
  assert.equal(Dico.trouver("bonjour")?.mot, "Bonjour");
  assert.ok(Dico.trouver("Pourquoi ?"), "un « ? » final est toléré");
});

test("les directions des descriptions deviennent « votre droite / gauche », inversables en mode gaucher", () => {
  const { directions } = site;
  assert.equal(directions("vers sa droite et vers le haut"), 'vers votre <span class="dir" data-d="droite"></span> et vers le haut');
  assert.equal(directions("vers sa gauche"), 'vers votre <span class="dir" data-d="gauche"></span>');
  assert.equal(directions("devant la poitrine"), "devant la poitrine");
});

test("chaque signe des phrases d'exercice existe dans le dictionnaire, avec un rôle expliqué", () => {
  const { PHRASES, REGLES_PHRASES } = site;
  assert.ok(PHRASES.length >= 30);
  const absents = [];
  for (const p of PHRASES) {
    assert.equal(p.signes.length, p.roles.length, p.fr);
    for (const s of p.signes) if (!Dico.trouver(s)) absents.push(`${s} (${p.fr})`);
    assert.match(p.fr, /^[A-ZÀ-Ý].*[.?]$/, p.fr);
  }
  assert.deepEqual(absents, []);
  assert.equal(new Set(PHRASES.map(p => p.fr)).size, PHRASES.length, "phrases en double");
  // le temps est toujours en premier, la question toujours en dernier
  for (const p of PHRASES) {
    if (p.roles.includes("temps")) assert.equal(p.roles[0], "temps", p.fr);
    if (p.roles.includes("question")) assert.equal(p.roles.at(-1), "question", p.fr);
  }
  const rolesExpliques = PHRASES.flatMap(p => p.roles).filter(r => !["qui", "chose", "sujet"].includes(r));
  for (const r of rolesExpliques) assert.ok(REGLES_PHRASES[r], `règle manquante pour « ${r} »`);
});
