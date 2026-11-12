"""Serveur local du site (http://127.0.0.1:8766/).

Il sert les fichiers comme `python -m http.server`, et accepte en plus l'enregistrement de
l'outil de relecture des descriptions (outils/relecture.html) : la relecture est écrite dans
data/relecture-descriptions.json, puis js/descriptions.js est reconstruit tout de suite.
N'écoute que sur cet ordinateur (127.0.0.1)."""
import json
import re
import subprocess
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
RACINE = Path(__file__).resolve().parent.parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8766
RELECTURE = RACINE / "data" / "relecture-descriptions.json"
CHEMIN = "/outils/enregistrer-relecture"
STATUTS = {"verifiee", "corrigee", "fausse"}


def relecture_valide(d):
    if not isinstance(d, dict):
        return False
    for k, rev in d.items():
        if not isinstance(k, str) or len(k) > 80 or not isinstance(rev, dict) or rev.get("statut") not in STATUTS:
            return False
        if not isinstance(rev.get("champs", {}), dict):
            return False
        if "date" in rev and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(rev["date"])):
            return False
    return True


class Gestionnaire(SimpleHTTPRequestHandler):
    def end_headers(self):
        # le site change souvent pendant la relecture : pas de cache pour les données
        if self.path.startswith(("/data/", "/js/descriptions.js")):
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def repondre(self, code, donnees):
        corps = json.dumps(donnees, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corps)))
        self.end_headers()
        self.wfile.write(corps)

    def do_POST(self):
        if self.path != CHEMIN:
            return self.repondre(404, {"ok": False, "message": "adresse inconnue"})
        # seules les pages de ce serveur peuvent enregistrer (pas un autre site ouvert dans le navigateur)
        origine = self.headers.get("Origin", "")
        if origine not in (f"http://127.0.0.1:{PORT}", f"http://localhost:{PORT}"):
            return self.repondre(403, {"ok": False, "message": "origine refusée"})
        try:
            n = int(self.headers.get("Content-Length", 0))
            if n > 2_000_000:
                raise ValueError("trop gros")
            donnees = json.loads(self.rfile.read(n).decode("utf-8"))
        except Exception:
            return self.repondre(400, {"ok": False, "message": "données illisibles"})
        if not relecture_valide(donnees):
            return self.repondre(400, {"ok": False, "message": "relecture invalide"})
        RELECTURE.write_text(json.dumps(dict(sorted(donnees.items())), ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        sorties = []
        for script in ("construire_descriptions.py", "versionner.py"):
            r = subprocess.run([sys.executable, str(RACINE / "scripts" / script)], cwd=RACINE,
                               capture_output=True, text=True, encoding="utf-8", errors="replace")
            if r.returncode:
                return self.repondre(500, {"ok": False, "message": f"{script} : {r.stderr.strip()[-300:]}"})
            sorties.append(r.stdout.strip())
        print("Relecture enregistrée :", " | ".join(sorties))
        return self.repondre(200, {"ok": True, "message": sorties[0]})

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    print(f"Site : http://127.0.0.1:{PORT}/")
    print(f"Relecture des descriptions : http://127.0.0.1:{PORT}/outils/relecture.html")
    ThreadingHTTPServer(("127.0.0.1", PORT), partial(Gestionnaire, directory=str(RACINE))).serve_forever()
