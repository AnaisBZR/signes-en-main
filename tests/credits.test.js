// Tests de la page « Crédits et licences » et de ce qui est publié en ligne.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chargerSite, RACINE } = require("./charger");

const site = chargerSite();

test("chaque licence utilisée est expliquée, avec un lien vers son texte", () => {
  const utilisees = new Set([...site.DICTIONNAIRE.flatMap(e => e.videos.map(v => v.licence)), ...site.ALPHABET.map(p => p.licence)]);
  for (const l of utilisees) {
    assert.ok(site.LICENCES[l], `licence « ${l} » non expliquée sur la page Crédits`);
    assert.match(site.LICENCES[l].url, /^https:\/\/creativecommons\.org\//);
  }
});

test("la page Crédits compte toutes les vidéos, sans perdre d'auteur", () => {
  const auteurs = site.auteursVideos();
  const total = site.DICTIONNAIRE.reduce((s, e) => s + e.videos.length, 0);
  assert.equal(auteurs.reduce((s, a) => s + a.n, 0), total);
  assert.ok(auteurs.every(a => a.nom && a.nom !== "Auteur inconnu"), "chaque vidéo a un auteur");
  assert.equal(site.nomAuteur("Original video: Jauvert LauraVideo editing: Edouard-lopez"), "Laura Jauvert");
});

test("le site publié n'utilise que des fichiers de index.html, css/ et js/", () => {
  // .github/workflows/publier.yml ne publie que ces dossiers : un lien vers ailleurs serait cassé en ligne
  const html = fs.readFileSync(path.join(RACINE, "index.html"), "utf8");
  const locaux = [...html.matchAll(/(?:src|href)="([^"#:]+?)(?:\?[^"]*)?"/g)].map(m => m[1]).filter(u => !u.startsWith("data:"));
  for (const u of locaux) {
    if (u === "studio/") continue; // lien affiché seulement en local
    assert.match(u, /^(css|js)\//, `index.html utilise « ${u} », qui ne sera pas publié`);
    assert.ok(fs.existsSync(path.join(RACINE, u)), `${u} n'existe pas`);
  }
});
