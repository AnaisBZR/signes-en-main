"""Petit récepteur local : ajoute chaque résultat POSTé à data/descriptions-brutes.jsonl."""
import json, sys
from http.server import BaseHTTPRequestHandler, HTTPServer

SORTIE = sys.argv[1]

class H(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "http://127.0.0.1:8766")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")

    def do_OPTIONS(self):
        self.send_response(204); self._cors(); self.end_headers()

    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        donnees = json.loads(self.rfile.read(n).decode("utf-8"))
        with open(SORTIE, "a", encoding="utf-8") as f:
            f.write(json.dumps(donnees, ensure_ascii=False) + "\n")
        self.send_response(200); self._cors(); self.end_headers(); self.wfile.write(b"ok")

    def log_message(self, *a):
        pass

HTTPServer(("127.0.0.1", 8767), H).serve_forever()
