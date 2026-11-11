// Charge les fichiers du site (écrits pour le navigateur, sans modules) dans un
// « faux navigateur » minimal, pour pouvoir les tester avec Node.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const RACINE = path.join(__dirname, "..");
const FICHIERS = ["js/data.js", "js/progress.js", "js/dictionnaire.js", "js/alphabet.js", "js/phrases.js", "js/exercices.js",
  "js/descriptions.js", "js/page-dictionnaire.js"];

function fauxStockage() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
    clear: () => m.clear()
  };
}

/** Renvoie les objets globaux du site : LSF_DATA, Progression, Dico, ALPHABET, DESCRIPTIONS… */
// (chaque appel recharge tout : chaque test part d'une progression vide)
const CODE = FICHIERS.map(f => fs.readFileSync(path.join(RACINE, f), "utf8")).join("\n;\n")
  + "\n;return { Progression, Reglages, Sauvegarde, Records, Dico, directions, normaliserReponse, comparerReponse, distanceMots, aleaGraine, melangerAvec, motsEpelables, phrasesVoisines, EXERCICES };";

function chargerSite() {
  const contexte = { localStorage: fauxStockage() };
  contexte.window = contexte;
  const site = new Function("window", "localStorage", CODE)(contexte, contexte.localStorage);
  return { ...site, PHRASES: contexte.PHRASES, REGLES_PHRASES: contexte.REGLES_PHRASES, LSF_DATA: contexte.LSF_DATA, ALPHABET: contexte.ALPHABET,
    DESCRIPTIONS: contexte.DESCRIPTIONS, DICTIONNAIRE: contexte.DICTIONNAIRE, contexte };
}

module.exports = { chargerSite, RACINE };
