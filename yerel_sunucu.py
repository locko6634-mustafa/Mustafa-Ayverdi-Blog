"""Yerel geliştirme sunucusu: yalnız yayınlanan dosyaları servis eder (beyaz liste).

Nokta dosyaları, .git/, CLAUDE.md, tests/, *.sh, *.ps1, *.py vb. 404 döner.
Kullanım: python yerel_sunucu.py [port] [host] [kök_dizin]
Varsayılan: 8000, 127.0.0.1, bu dosyanın dizini.
"""
import os, posixpath, signal, sys, urllib.parse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
host = sys.argv[2] if len(sys.argv) > 2 else "127.0.0.1"
root = os.path.realpath(sys.argv[3] if len(sys.argv) > 3 else os.path.dirname(os.path.abspath(__file__)))

# Oturumdan bağımsız çalış (terminal kapansa da sürsün); yalnız POSIX'te
if hasattr(signal, "SIGHUP"):
    signal.signal(signal.SIGHUP, signal.SIG_IGN)
if hasattr(os, "setsid"):
    try:
        os.setsid()
    except OSError:
        pass

ALLOWED_FILES = {"index.html", "404.html", "kart.html", "iletisim.html", "gizlilik.html", "robots.txt", "sitemap.xml"}
ALLOWED_DIRS = {"css", "js", "assets", "notlar", "projeler"}

class WhitelistHandler(SimpleHTTPRequestHandler):
    def _allowed(self):
        raw = urllib.parse.urlsplit(self.path).path
        path = posixpath.normpath(urllib.parse.unquote(raw))
        parts = [p for p in path.split("/") if p]
        if not parts:
            return True  # "/" -> index.html
        if any(p.startswith(".") or "\\" in p for p in parts):
            return False
        if len(parts) == 1 and parts[0] in ALLOWED_FILES:
            ok = True
        elif parts[0] in ALLOWED_DIRS:
            ok = True
        else:
            return False
        real = os.path.realpath(self.translate_path(self.path))
        if not (ok and (real == root or real.startswith(root + os.sep))):
            return False
        # Symlink hedefi de beyaz listede olmalı ve nokta bileşeni içermemeli
        rel = os.path.relpath(real, root).split(os.sep)
        if any(p.startswith(".") for p in rel):
            return False
        if len(rel) == 1:
            return rel[0] in ALLOWED_FILES or rel[0] in ALLOWED_DIRS
        return rel[0] in ALLOWED_DIRS

    def _clean_url(self):
        # nginx try_files $uri $uri.html $uri/ eşdeğeri: /x yoksa ve /x.html varsa onu sun
        split = urllib.parse.urlsplit(self.path)
        if split.path.endswith("/") or os.path.exists(self.translate_path(split.path)):
            return
        if os.path.isfile(self.translate_path(split.path) + ".html"):
            self.path = urllib.parse.urlunsplit(split._replace(path=split.path + ".html"))

    def send_head(self):
        self._clean_url()
        if not self._allowed():
            self.send_error(404, "File not found")
            return None
        return super().send_head()

    def list_directory(self, path):
        self.send_error(404, "File not found")
        return None

    def log_message(self, *args):
        pass

handler = partial(WhitelistHandler, directory=root)
with ThreadingHTTPServer((host, port), handler) as httpd:
    httpd.serve_forever()
