"""Vérifie que toutes les vidéos du dictionnaire et les photos de l'alphabet existent
toujours sur Wikimedia Commons (un fichier peut être supprimé ou renommé).

On interroge l'API de Commons par paquets de 50 fichiers (une vingtaine de requêtes en
tout) plutôt que de télécharger chaque fichier : c'est rapide et respectueux de leurs
serveurs, qui bloquent les programmes trop pressés.

Utilisation :  python scripts/verifier_videos.py
Résultat     :  la liste des fichiers disparus s'affiche, et le rapport complet est
                écrit dans data/verification-videos.txt.
"""
import json
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # accents dans la console Windows

RACINE = Path(__file__).resolve().parent.parent
RAPPORT = RACINE / "data" / "verification-videos.txt"
API = "https://commons.wikimedia.org/w/api.php"
# Wikimedia demande d'identifier les programmes qui interrogent ses serveurs.
AGENT = "SignesEnMain-verification/1.0 (site personnel d'apprentissage de la LSF)"
PAQUET = 50  # nombre maximal de titres par requête autorisé par l'API


def lire_js(nom, variable):
    texte = (RACINE / "js" / nom).read_text(encoding="utf-8")
    debut = texte.index(f"window.{variable} =") + len(f"window.{variable} =")
    return json.loads(texte[debut:].strip().rstrip(";"))


def titre(page):
    """https://commons.wikimedia.org/wiki/File:Abc.webm -> « File:Abc.webm »"""
    return urllib.parse.unquote(page.split("/wiki/", 1)[1]).replace("_", " ")


def interroger(titres):
    params = urllib.parse.urlencode({"action": "query", "titles": "|".join(titres), "prop": "imageinfo",
                                     "iiprop": "url", "format": "json", "formatversion": 2, "redirects": 1})
    for essai in range(4):
        try:
            req = urllib.request.Request(f"{API}?{params}", headers={"User-Agent": AGENT})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)["query"]
        except Exception as e:  # réseau coupé, serveur surchargé : on attend puis on réessaie
            if essai == 3:
                raise
            print(f"  (nouvel essai dans {5 * (essai + 1)} s : {e})")
            time.sleep(5 * (essai + 1))


def main():
    liens = {}  # titre Commons -> (description, adresse utilisée par le site)
    for e in lire_js("dictionnaire.js", "DICTIONNAIRE"):
        for v in e["videos"]:
            liens[titre(v["page"])] = (f"vidéo « {e['mot']} » ({v['auteur']})", v["url"].split("?")[0])
    for l in lire_js("alphabet.js", "ALPHABET"):
        liens[titre(l["page"])] = (f"photo de la lettre {l['lettre']}", l["image"].split("?")[0])

    print(f"Vérification de {len(liens)} fichiers sur Wikimedia Commons…")
    problemes = []
    titres = list(liens)
    for i in range(0, len(titres), PAQUET):
        q = interroger(titres[i:i + PAQUET])
        # l'API normalise et suit les renommages : on retrouve le titre d'origine
        origine = {t: t for t in titres[i:i + PAQUET]}
        for n in q.get("normalized", []):
            origine[n["to"]] = origine.pop(n["from"], n["from"])
        for r in q.get("redirects", []):
            origine[r["to"]] = origine.get(r["from"], r["from"])
        for p in q["pages"]:
            t = origine.get(p["title"], p["title"])
            desc, url = liens.get(t, (t, ""))
            if p.get("missing") or not p.get("imageinfo"):
                problemes.append((desc, t, "fichier supprimé ou introuvable"))
            elif (nouvelle := p["imageinfo"][0]["url"].split("?")[0]) and urllib.parse.unquote(nouvelle) != urllib.parse.unquote(url):
                problemes.append((desc, t, f"fichier déplacé : nouvelle adresse {nouvelle}"))
        print(f"  … {min(i + PAQUET, len(titres))}/{len(titres)}")
        time.sleep(1)  # une requête par seconde au plus

    for d, t, err in problemes:
        print(f"  ✗ {d} : {err}")
    lignes = [f"Vérification du {datetime.now():%d/%m/%Y à %H:%M} : {len(liens)} fichiers, {len(problemes)} problème(s).", ""]
    lignes += [f"✗ {d}\n    {t}\n    {err}" for d, t, err in problemes] or ["Tous les fichiers sont en ligne."]
    RAPPORT.write_text("\n".join(lignes) + "\n", encoding="utf-8")
    print(f"\n{len(problemes)} problème(s) sur {len(liens)} fichiers. Rapport : {RAPPORT}")
    sys.exit(1 if problemes else 0)


if __name__ == "__main__":
    main()
