"""Construit js/descriptions.js à partir des résultats de l'outil outils/descriptions.html
(data/descriptions-brutes.jsonl, une ligne JSON par signe analysé)."""
import json
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
ENTREE = RACINE / "data" / "descriptions-brutes.jsonl"
SORTIE = RACINE / "js" / "descriptions.js"
CHAMPS = ["video", "mains", "dominante", "forme", "formeSure", "taillePx", "formeAutre",
          "emplacement", "emplacementFin", "mouvement", "deuxMains", "visage", "erreur"]

resultats = {}
for ligne in ENTREE.read_text(encoding="utf-8").splitlines():
    if ligne.strip():
        d = json.loads(ligne)
        r = {c: d[c] for c in CHAMPS if d.get(c) not in (None, "", [])}
        if "formeSure" in r:
            r["formeSure"] = round(r["formeSure"], 2)
        resultats[d["k"]] = r  # la dernière analyse d'un signe remplace les précédentes

ok = sum(1 for r in resultats.values() if "erreur" not in r)
SORTIE.write_text(
    "// Descriptions générées automatiquement en analysant la première vidéo de chaque signe\n"
    "// (outils/descriptions.html + scripts/construire_descriptions.py). À VÉRIFIER : elles peuvent contenir des erreurs.\n"
    "window.DESCRIPTIONS = " + json.dumps(resultats, ensure_ascii=False, indent=0) + ";\n",
    encoding="utf-8")
print(f"{len(resultats)} signes, {ok} décrits, {len(resultats) - ok} en échec -> {SORTIE}")
