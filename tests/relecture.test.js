// Tests du signalement d'erreurs et de la relecture des descriptions.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chargerSite, RACINE } = require("./charger");

test("un signalement vide est refusé, un vrai est gardé et nettoyé", () => {
  const { Signalements: S } = chargerSite();
  assert.equal(S.ajouter({ k: "chat", mot: "Chat" }), null);
  assert.equal(S.ajouter({ k: "chat", mot: "Chat", texte: "   " }), null);
  const s = S.ajouter({ k: "chat", mot: "Chat", points: ["forme", "forme", "inconnu"], texte: "x".repeat(2000) });
  assert.deepEqual(s.points, ["forme"]);
  assert.equal(s.texte.length, 1000);
  S.ajouter({ k: "chien", mot: "Chien", points: ["video"] });
  assert.equal(S.pour("chat").length, 1);
  S.traiter("chat");
  assert.equal(S.pour("chat").length, 0);
  assert.equal(S.lire().length, 1, "les autres signes gardent leurs signalements");
});

test("le texte d'un signalement et le lien GitHub (seulement s'il est configuré)", () => {
  const site = chargerSite();
  const s = site.Signalements.ajouter({ k: "chat", mot: "Chat", points: ["mouvement"], texte: "Le geste est répété" });
  assert.match(site.Signalements.versTexte(s), /Signe : Chat\nProblème : le mouvement\nDétails : Le geste est répété/);
  site.CONFIG_SITE.depotGithub = "";
  assert.equal(site.Signalements.lienGithub(s), "", "pas de lien sans dépôt GitHub");
  site.CONFIG_SITE.depotGithub = "moi/signes-en-main";
  const lien = site.Signalements.lienGithub(s);
  assert.ok(lien.startsWith("https://github.com/moi/signes-en-main/issues/new?title="));
  assert.ok(!/[\s<>"]/.test(lien), "texte bien encodé dans l'adresse");
});

test("le fichier de relecture est valide et ne parle que de signes décrits", () => {
  const relecture = JSON.parse(fs.readFileSync(path.join(RACINE, "data", "relecture-descriptions.json"), "utf8"));
  const { DESCRIPTIONS } = chargerSite();
  for (const [k, r] of Object.entries(relecture)) {
    assert.ok(k in DESCRIPTIONS, `« ${k} » n'a pas de description`);
    assert.ok(["verifiee", "corrigee", "fausse"].includes(r.statut), `${k} : statut inconnu`);
    assert.match(r.date || "", /^\d{4}-\d{2}-\d{2}$/, `${k} : date`);
  }
});

test("js/descriptions.js est à jour avec la relecture", () => {
  const relecture = JSON.parse(fs.readFileSync(path.join(RACINE, "data", "relecture-descriptions.json"), "utf8"));
  const { DESCRIPTIONS } = chargerSite();
  for (const [k, r] of Object.entries(relecture)) {
    if (r.statut === "fausse") assert.ok(DESCRIPTIONS[k].erreur, `${k} devrait être masquée : lancez « Vérifier le site.bat »`);
    else assert.ok(DESCRIPTIONS[k].verifiee, `${k} devrait être vérifiée : lancez « Vérifier le site.bat »`);
  }
  for (const [k, d] of Object.entries(DESCRIPTIONS)) if (d.verifiee) assert.ok(k in relecture, `${k} : vérifiée sans relecture`);
});
