"""
Récupère les vidéos de Langue des Signes Française (LSF) publiées sous licence libre
sur Wikimedia Commons (projet Lingua Libre + catégorie "Videos of French Sign Language").

Résultat : data/videos_brutes.json (liste des vidéos avec mot, auteur, licence, URL).

Usage :  python scripts/recuperer_videos.py
"""
import json
import re
import time
import urllib.parse
import urllib.error
import urllib.request
from pathlib import Path

API = "https://commons.wikimedia.org/w/api.php"
UA = "SignesEnMain/0.1 (prototype educatif d'apprentissage de la LSF)"
RACINE = Path(__file__).resolve().parent.parent
SORTIE = RACINE / "data" / "videos_brutes.json"


def appel(params):
    params = {**params, "format": "json", "formatversion": "2"}
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for essai in range(6):
        try:
            time.sleep(1)  # politesse envers l'API
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code != 429 or essai == 5:
                raise
            attente = int(e.headers.get("Retry-After") or 0) or 10 * (essai + 1)
            print(f"  trop de requêtes, nouvelle tentative dans {attente} s…")
            time.sleep(attente)


def fichiers_categorie(cat, vus_cats=None):
    """Tous les fichiers d'une catégorie, sous-catégories comprises."""
    vus_cats = vus_cats if vus_cats is not None else set()
    if cat in vus_cats:
        return set()
    vus_cats.add(cat)
    titres, suite = set(), {}
    while True:
        d = appel({"action": "query", "list": "categorymembers", "cmtitle": cat,
                   "cmtype": "file|subcat", "cmlimit": "500", **suite})
        for m in d["query"]["categorymembers"]:
            if m["ns"] == 6:
                titres.add(m["title"])
            elif m["ns"] == 14:
                titres |= fichiers_categorie(m["title"], vus_cats)
        if "continue" not in d:
            return titres
        suite = d["continue"]


def fichiers_lingua_libre():
    """Tous les enregistrements Lingua Libre en LSF (Q33302 = LSF sur Wikidata)."""
    titres, suite = set(), {}
    while True:
        d = appel({"action": "query", "list": "search", "srsearch": 'intitle:"LL-Q33302"',
                   "srnamespace": "6", "srlimit": "500", **suite})
        titres |= {r["title"] for r in d["query"]["search"]}
        if "continue" not in d:
            return titres
        suite = d["continue"]


def infos(titres):
    """URL, licence, auteur et catégories de chaque fichier (par paquets de 50)."""
    res = []
    titres = sorted(titres)
    for i in range(0, len(titres), 50):
        d = appel({"action": "query", "titles": "|".join(titres[i:i + 50]),
                   "prop": "imageinfo|categories", "cllimit": "max",
                   "iiprop": "url|mime|extmetadata",
                   "iiextmetadatafilter": "LicenseShortName|Artist|LicenseUrl"})
        for p in d["query"]["pages"]:
            ii = (p.get("imageinfo") or [{}])[0]
            meta = ii.get("extmetadata", {})
            res.append({
                "titre": p["title"],
                "url": ii.get("url"),
                "page": ii.get("descriptionurl"),
                "mime": ii.get("mime"),
                "licence": meta.get("LicenseShortName", {}).get("value"),
                "licence_url": meta.get("LicenseUrl", {}).get("value"),
                "auteur": re.sub(r"<[^>]+>", "", meta.get("Artist", {}).get("value", "")).strip(),
                "categories": [c["title"].replace("Category:", "") for c in p.get("categories", [])],
            })
        time.sleep(0.5)  # politesse envers l'API
    return res


if __name__ == "__main__":
    titres = fichiers_lingua_libre()
    print(f"Lingua Libre : {len(titres)} fichiers")
    for cat in ["Category:Videos of French Sign Language", "Category:French manual alphabet"]:
        t = fichiers_categorie(cat)
        print(f"{cat} : {len(t)} fichiers")
        titres |= t
    videos = [v for v in infos(titres) if v["mime"] and v["mime"].startswith("video/")]
    SORTIE.parent.mkdir(exist_ok=True)
    SORTIE.write_text(json.dumps(videos, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(videos)} vidéos enregistrées dans {SORTIE}")
