#!/usr/bin/env bash
set -euo pipefail

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Betiğin bulunduğu proje kök dizini
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

PORT="${PORT:-8000}"
BIND_HOST="127.0.0.1"

# PORT doğrulaması: yalnız rakam ve 1-65535 aralığı (kod enjeksiyonuna karşı)
if ! [[ "$PORT" =~ ^[0-9]{1,5}$ ]] || [ "$((10#$PORT))" -lt 1 ] || [ "$((10#$PORT))" -gt 65535 ]; then
    echo -e "${RED}Hata: PORT geçersiz. 1-65535 arasında bir sayı olmalı.${NC}" >&2
    exit 1
fi
PORT="$((10#$PORT))"

# Python kontrolü (python3 veya python)
if command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_CMD="python"
else
    echo -e "${RED}Hata: Python bulunamadı. Python kurulumunu ve PATH ayarını kontrol edin.${NC}" >&2
    exit 1
fi

# Port dinleniyor mu? (değerler argv ile geçer, koda gömülmez)
port_listening() {
    "$PYTHON_CMD" -c '
import socket, sys
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(0.5)
try:
    s.connect((sys.argv[1], int(sys.argv[2])))
    s.close()
    sys.exit(0)
except Exception:
    sys.exit(1)
' "$BIND_HOST" "$PORT" >/dev/null 2>&1
}

# Porttaki sunucu bu blogu mu servis ediyor? (index.html'deki canonical işaretine bakar; değerler argv ile geçer)
SITE_MARKER='<link rel="canonical" href="https://mustafaayverdi.dev/">'
serves_this_blog() {
    "$PYTHON_CMD" -c '
import sys, urllib.request
url = "http://%s:%d/index.html" % (sys.argv[1], int(sys.argv[2]))
try:
    with urllib.request.urlopen(url, timeout=2) as r:
        body = r.read(512 * 1024).decode("utf-8", "replace")
except Exception:
    sys.exit(1)
sys.exit(0 if sys.argv[3] in body else 1)
' "$BIND_HOST" "$PORT" "$SITE_MARKER" >/dev/null 2>&1
}

if port_listening; then
    if serves_this_blog; then
        echo -e "${YELLOW}Blog sunucusu zaten çalışıyor: http://${BIND_HOST}:${PORT}/${NC}"
        exit 0
    fi
    echo -e "${RED}Hata: Port ${PORT} başka bir uygulama tarafından kullanılıyor (bu blog yanıt vermiyor). Farklı port için: PORT=8080 ./sunucu_baslat.sh${NC}" >&2
    exit 1
fi

# Yalnız yayınlanan dosyaları servis eden küçük sunucu (beyaz liste).
# Nokta dosyaları, .git/, CLAUDE.md, tests/, *.sh vb. 404 döner.
# PORT / host / kök dizin argv ile geçer.
SERVER_CODE='
import os, posixpath, signal, sys, urllib.parse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

port, host, root = int(sys.argv[1]), sys.argv[2], os.path.realpath(sys.argv[3])

# Oturumdan bağımsız çalış (terminal kapansa da sürsün)
signal.signal(signal.SIGHUP, signal.SIG_IGN)
try:
    os.setsid()
except OSError:
    pass

ALLOWED_FILES = {"index.html", "robots.txt", "sitemap.xml"}
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

    def send_head(self):
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
'

echo -e "${CYAN}Yerel sunucu başlatılıyor...${NC}"
# Python doğrudan arka plana alınır; $! python sürecinin kendi PID'idir.
"$PYTHON_CMD" -c "$SERVER_CODE" "$PORT" "$BIND_HOST" "$PROJECT_DIR" </dev/null >/dev/null 2>&1 &
SERVER_PID=$!
disown "$SERVER_PID" 2>/dev/null || true

# Portun gerçekten dinlendiğini ve sürecin yaşadığını doğrula (en fazla ~5 sn)
ready=0
for _ in $(seq 1 25); do
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
        break
    fi
    if port_listening; then
        ready=1
        break
    fi
    sleep 0.2
done

if [ "$ready" != "1" ] || ! kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    echo -e "${RED}Hata: Sunucu başlatılamadı (port ${PORT} başka bir süreç tarafından alınmış olabilir).${NC}" >&2
    exit 1
fi

echo -e "${GREEN}Sunucu başlatıldı: http://${BIND_HOST}:${PORT}/ (PID: ${SERVER_PID})${NC}"
echo -e "${GREEN}Proje kökü: ${PROJECT_DIR} (yalnız yayınlanan dosyalar servis edilir)${NC}"
echo -e "${CYAN}Durdurmak için: kill ${SERVER_PID}${NC}"

# GUI ortamı varsa ve NO_OPEN=1 verilmediyse varsayılan tarayıcıda aç
if [ "${NO_OPEN:-0}" != "1" ] && [ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ] && command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://${BIND_HOST}:${PORT}/index.html" >/dev/null 2>&1 &
fi
