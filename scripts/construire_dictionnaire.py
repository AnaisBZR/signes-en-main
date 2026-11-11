"""
Transforme data/videos_brutes.json en js/dictionnaire.js utilisé par le site.
- extrait le mot de chaque titre de fichier
- regroupe les vidéos d'un même mot (plusieurs signeurs possibles)
- ajoute la catégorie depuis data/categories.json
- écarte ce qui n'est pas un signe isolé (chansons, longues vidéos)

Usage :  python scripts/construire_dictionnaire.py
"""
import json
import re
import unicodedata
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
BRUT = RACINE / "data" / "videos_brutes.json"
CATEGORIES = RACINE / "data" / "categories.json"
CORRECTIONS = RACINE / "data" / "corrections.json"
SORTIE = RACINE / "js" / "dictionnaire.js"

EXCLURE_CATEGORIES = {"Chansignes", "French-language songs"}


def cle(mot):
    """Forme normalisée pour regrouper / chercher (minuscules, sans accents)."""
    s = unicodedata.normalize("NFD", mot.lower())
    return "".join(c for c in s if unicodedata.category(c) != "Mn").strip()


def extraire(titre):
    nom = re.sub(r"^File:", "", titre)
    nom = re.sub(r"\.(webm|ogv|mp4)$", "", nom, flags=re.I)
    m = re.match(r"LL-Q33302 \(fsl\)-(.+?)-(.+)$", nom)
    if m:
        return m.group(2).strip(), m.group(1).strip()
    m = re.match(r"(.+?) (Nm|Nf|N|V|Adj|Adv|Interj|Prep|Pron|Loc)\b.* - Elix$", nom)
    if m:
        return m.group(1).strip(), "Elix"
    return nom.strip(), None


def main():
    videos = json.loads(BRUT.read_text(encoding="utf-8"))
    # categories.json : { "Catégorie": ["Mot", ...] }  -> index { clé du mot: catégorie }
    cats = {}
    if CATEGORIES.exists():
        for cat, liste in json.loads(CATEGORIES.read_text(encoding="utf-8")).items():
            for m in liste:
                cats[cle(m)] = cat
    # corrections.json : { "clé du mot mal orthographié": "Mot corrigé" }
    corr = json.loads(CORRECTIONS.read_text(encoding="utf-8")) if CORRECTIONS.exists() else {}

    mots = {}
    ecartees = 0
    for v in videos:
        if EXCLURE_CATEGORIES & set(v["categories"]) or not v["url"]:
            ecartees += 1
            continue
        mot, signeur = extraire(v["titre"])
        mot = corr.get(cle(mot), mot)
        if not mot or len(mot) > 45 or len(mot.split()) > 6:
            ecartees += 1
            continue
        k = cle(mot)
        e = mots.setdefault(k, {"mot": mot[0].upper() + mot[1:], "videos": []})
        e["videos"].append({
            "url": v["url"].split("?")[0],
            "page": v["page"],
            "auteur": signeur if signeur and signeur != "Elix" else (v["auteur"] or "Inconnu"),
            "source": "Elix" if signeur == "Elix" else ("Lingua Libre" if "LL-Q33302" in v["titre"] else "Wikimedia Commons"),
            "licence": v["licence"],
        })

    entrees = []
    for k, e in sorted(mots.items()):
        e["categorie"] = cats.get(k, "Divers")
        entrees.append(e)

    js = ("// Fichier généré par scripts/construire_dictionnaire.py — ne pas modifier à la main.\n"
          "// Vidéos LSF sous licence libre provenant de Wikimedia Commons (Lingua Libre, Elix, etc.).\n"
          "window.DICTIONNAIRE = " + json.dumps(entrees, ensure_ascii=False, indent=0) + ";\n")
    SORTIE.write_text(js, encoding="utf-8")
    sans_cat = [e["mot"] for e in entrees if e["categorie"] == "Divers"]
    print(f"{len(entrees)} mots, {sum(len(e['videos']) for e in entrees)} vidéos, {ecartees} écartées, {len(sans_cat)} en 'Divers'")


if __name__ == "__main__":
    main()
