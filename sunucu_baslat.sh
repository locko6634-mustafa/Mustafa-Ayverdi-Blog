#!/usr/bin/env bash

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Betiğin bulunduğu proje kök dizini
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR" || exit 1

PORT="${PORT:-8000}"
BIND_HOST="127.0.0.1"

# Python kontrolü (python3 veya python)
if command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_CMD="python"
else
    echo -e "${RED}Hata: Python bulunamadı. Python kurulumunu ve PATH ayarını kontrol edin.${NC}" >&2
    exit 1
fi

# Port kullanımda mı kontrolü
PORT_IN_USE=$("$PYTHON_CMD" -c "
import socket, sys
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(0.5)
try:
    s.connect(('${BIND_HOST}', int('${PORT}')))
    s.close()
    sys.exit(0)
except Exception:
    sys.exit(1)
" >/dev/null 2>&1 && echo "1" || echo "0")

if [ "$PORT_IN_USE" = "1" ]; then
    echo -e "${YELLOW}Port ${PORT} zaten kullanımda. Tarayıcıdan http://${BIND_HOST}:${PORT}/ adresini açabilir veya PORT=8080 ./sunucu_baslat.sh ile farklı port seçebilirsiniz.${NC}"
    exit 0
fi

# Sunucuyu arka planda bağımsız bir süreç olarak başlat
echo -e "${CYAN}Yerel sunucu başlatılıyor...${NC}"
if command -v setsid >/dev/null 2>&1; then
    setsid "$PYTHON_CMD" -m http.server "$PORT" --bind "$BIND_HOST" </dev/null >/dev/null 2>&1 &
    SERVER_PID=$!
else
    nohup "$PYTHON_CMD" -m http.server "$PORT" --bind "$BIND_HOST" </dev/null >/dev/null 2>&1 &
    SERVER_PID=$!
    disown "$SERVER_PID" 2>/dev/null || true
fi

sleep 0.5

if kill -0 "$SERVER_PID" 2>/dev/null; then
    echo -e "${GREEN}Sunucu başlatıldı: http://${BIND_HOST}:${PORT}/ (PID: ${SERVER_PID})${NC}"
    echo -e "${GREEN}Proje kökü: ${PROJECT_DIR}${NC}"
    echo -e "${CYAN}Durdurmak için: kill ${SERVER_PID}${NC}"
else
    echo -e "${RED}Hata: Sunucu başlatılamadı.${NC}" >&2
    exit 1
fi

# GUI ortamı varsa ve NO_OPEN=1 verilmediyse varsayılan tarayıcıda aç
if [ "${NO_OPEN:-0}" != "1" ] && [ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ] && command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://${BIND_HOST}:${PORT}/index.html" >/dev/null 2>&1 &
fi
