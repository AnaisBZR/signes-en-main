"""Construit js/descriptions.js à partir des résultats de l'outil outils/descriptions.html
(data/descriptions-brutes.jsonl, une ligne JSON par signe analysé)."""
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

RACINE = Path(__file__).resolve().parent.parent
ENTREE = RACINE / "data" / "descriptions-brutes.jsonl"
SORTIE = RACINE / "js" / "descriptions.js"
CHAMPS = ["video", "mains", "dominante", "forme", "formeSure", "taillePx", "formeAutre",
          "emplacement", "emplacementFin", "mouvement", "deuxMains", "visage", "erreur",
          "tDebut", "tFin"]  # début et fin du geste dans la vidéo (en secondes) : phrases enchaînées sans temps mort

resultats = {}
for ligne in ENTREE.read_text(encoding="utf-8").splitlines():
    if ligne.strip():
        d = json.loads(ligne)
        r = {c: d[c] for c in CHAMPS if d.get(c) not in (None, "", [])}
        for c in ("formeSure", "tDebut", "tFin"):
            if c in r:
                r[c] = round(r[c], 2)
        resultats[d["k"]] = r  # la dernière analyse d'un signe remplace les précédentes

# Relecture humaine (outils/relecture.html) : corrections et validations, appliquées par-dessus
# l'analyse automatique. Statuts : « verifiee » (tout est juste), « corrigee » (champs corrigés),
# « fausse » (description inutilisable : elle n'est plus affichée sur le site).
RELECTURE = RACINE / "data" / "relecture-descriptions.json"
MODIFIABLES = ["mains", "deuxMains", "forme", "formeAutre", "emplacement", "emplacementFin", "mouvement", "visage", "conseil"]
relues = 0
if RELECTURE.exists():
    for k, rev in json.loads(RELECTURE.read_text(encoding="utf-8")).items():
        r = resultats.get(k)
        if r is None or not isinstance(rev, dict):
            print(f"relecture ignorée : « {k} » n'a pas de description")
            continue
        statut = rev.get("statut")
        if statut == "fausse":
            r["erreur"] = "description jugée fausse à la relecture"
        elif statut in ("verifiee", "corrigee"):
            for c, v in (rev.get("champs") or {}).items():
                if c not in MODIFIABLES:
                    continue
                if c == "visage":
                    v = [x.strip() for x in (v if isinstance(v, list) else str(v).split(",")) if x.strip()]
                else:
                    v = str(v).strip()
                if v:
                    r[c] = v
                else:
                    r.pop(c, None)
            r["verifiee"] = rev.get("date") or True
            r.pop("erreur", None)
        else:
            continue
        relues += 1

ok = sum(1 for r in resultats.values() if "erreur" not in r)
SORTIE.write_text(
    "// Descriptions générées automatiquement en analysant la première vidéo de chaque signe\n"
    "// (outils/descriptions.html + scripts/construire_descriptions.py), puis relues dans outils/relecture.html.\n"
    "// « verifiee » : relue par une personne ; sinon, À VÉRIFIER : elles peuvent contenir des erreurs.\n"
    "window.DESCRIPTIONS = " + json.dumps(resultats, ensure_ascii=False, indent=0) + ";\n",
    encoding="utf-8")
verifiees = sum(1 for r in resultats.values() if r.get("verifiee") and "erreur" not in r)
print(f"{len(resultats)} signes, {ok} décrits ({verifiees} vérifiés, {relues} relus), {len(resultats) - ok} sans description -> {SORTIE}")
