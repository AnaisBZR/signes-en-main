"""Vérifie que toutes les vidéos du dictionnaire et les photos de l'alphabet sont
toujours en ligne sur Wikimedia Commons (les liens externes finissent par casser).

Utilisation :  python scripts/verifier_videos.py
Résultat     :  la liste des liens cassés s'affiche, et le rapport complet est
                écrit dans data/verification-videos.txt.
"""
import json
import re
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # accents dans la console Windows

RACINE = Path(__file__).resolve().parent.parent
RAPPORT = RACINE / "data" / "verification-videos.txt"
# Wikimedia demande d'identifier les programmes qui interrogent ses serveurs.
AGENT = "SignesEnMain-verification/1.0 (site personnel d'apprentissage de la LSF)"
EN_PARALLELE = 4  # rester raisonnable avec les serveurs de Wikimedia


def lire_js(nom, variable):
    texte = (RACINE / "js" / nom).read_text(encoding="utf-8")
    debut = texte.index(f"window.{variable} =") + len(f"window.{variable} =")
    return json.loads(texte[debut:].strip().rstrip(";"))


def tester(url):
    """Renvoie (url, None) si le lien marche, sinon (url, message d'erreur)."""
    erreur = "pas de réponse"
    for essai in range(3):
        try:
            req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": AGENT})
            with urllib.request.urlopen(req, timeout=20) as r:
                return url, None if r.status == 200 else f"code {r.status}"
        except urllib.error.HTTPError as e:
            erreur = f"code {e.code}"
            if e.code == 429 or e.code >= 500:  # trop de requêtes ou panne passagère : on réessaie
                time.sleep(3 * (essai + 1))
                continue
            return url, erreur
        except Exception as e:  # réseau coupé, délai dépassé…
            erreur = str(e)
            time.sleep(2)
    return url, erreur


def main():
    liens = []  # (description, url)
    for e in lire_js("dictionnaire.js", "DICTIONNAIRE"):
        for v in e["videos"]:
            liens.append((f"vidéo « {e['mot']} » ({v['auteur']})", v["url"]))
    for l in lire_js("alphabet.js", "ALPHABET"):
        liens.append((f"photo de la lettre {l['lettre']}", re.sub(r"\?.*$", "", l["image"])))

    print(f"Vérification de {len(liens)} liens…")
    quoi = {url: desc for desc, url in liens}
    casses = []
    with ThreadPoolExecutor(EN_PARALLELE) as pool:
        for i, (url, erreur) in enumerate(pool.map(tester, quoi), 1):
            if erreur:
                casses.append((quoi[url], url, erreur))
                print(f"  ✗ {quoi[url]} : {erreur}")
            if i % 100 == 0:
                print(f"  … {i}/{len(quoi)}")

    lignes = [f"Vérification du {datetime.now():%d/%m/%Y à %H:%M} : {len(quoi)} liens, {len(casses)} cassés.", ""]
    lignes += [f"✗ {d}\n    {u}\n    {err}" for d, u, err in casses] or ["Tous les liens fonctionnent."]
    RAPPORT.write_text("\n".join(lignes) + "\n", encoding="utf-8")
    print(f"\n{len(casses)} lien(s) cassé(s) sur {len(quoi)}. Rapport : {RAPPORT}")
    sys.exit(1 if casses else 0)


if __name__ == "__main__":
    main()
