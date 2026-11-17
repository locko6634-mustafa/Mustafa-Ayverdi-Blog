#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Bağımsız yerel sunucu başlatılıyor..."
chmod +x "$SCRIPT_DIR/sunucu_baslat.sh" 2>/dev/null || true
exec "$SCRIPT_DIR/sunucu_baslat.sh" "$@"
