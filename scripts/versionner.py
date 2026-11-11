"""Met à jour tout seul les numéros de version des fichiers CSS et JS dans index.html.

Chaque fichier reçoit une empreinte de son contenu (ex. style.css?v=3fa2c1d0) : quand un
fichier change, son adresse change, et le navigateur recharge la nouvelle version au lieu
de garder l'ancienne en mémoire. Plus besoin de Ctrl+F5 ni de changer les ?v=8 à la main.

Utilisation : python scripts/versionner.py   (lancé aussi par « Vérifier le site.bat »)
"""
import hashlib
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # accents dans la console Windows

RACINE = Path(__file__).resolve().parent.parent
PAGES = [RACINE / "index.html"]
LIEN = re.compile(r'((?:src|href)=")((?!https?:|//)[^"?#]+\.(?:css|js))(?:\?v=[^"]*)?(")')


def empreinte(fichier):
    return hashlib.sha256(fichier.read_bytes()).hexdigest()[:8]


def versionner(page):
    texte = page.read_text(encoding="utf-8")
    manquants = []

    def remplacer(m):
        fichier = (page.parent / m.group(2)).resolve()
        if not fichier.exists():
            manquants.append(m.group(2))
            return m.group(0)
        return f"{m.group(1)}{m.group(2)}?v={empreinte(fichier)}{m.group(3)}"

    nouveau = LIEN.sub(remplacer, texte)
    if nouveau != texte:
        page.write_text(nouveau, encoding="utf-8", newline="")
        print(f"{page.name} : versions mises à jour")
    else:
        print(f"{page.name} : déjà à jour")
    return manquants


if __name__ == "__main__":
    manquants = [f for p in PAGES for f in versionner(p)]
    for f in manquants:
        print(f"  ✗ fichier introuvable : {f}")
    sys.exit(1 if manquants else 0)
