#!/usr/bin/env bash
# Installation unique : clone lunii-admin-web (version figée) et les dépendances Node de l'outil.
# Usage : scripts/setup.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENDOR="$ROOT/vendor/lunii-admin-web"
REPO="${LUNII_ADMIN_REPO:-https://github.com/Mktotoy/lunii-admin-web}"
COMMIT="${LUNII_ADMIN_COMMIT:-d8ad84f8867a4b7e6f55930916e7bd880802098e}"

for bin in git node npm ffmpeg python3 openssl; do
  command -v "$bin" >/dev/null || { echo "ERREUR : $bin absent" >&2; exit 1; }
done
python3 -c "import PIL, numpy" 2>/dev/null || { echo "ERREUR : python3 a besoin de Pillow et numpy (pip install pillow numpy)" >&2; exit 1; }
[[ "$(ffmpeg -hide_banner -encoders 2>/dev/null)" == *libmp3lame* ]] || { echo "ERREUR : ffmpeg sans libmp3lame" >&2; exit 1; }

if [ ! -d "$VENDOR/.git" ]; then
  git clone --quiet "$REPO" "$VENDOR"
fi
git -C "$VENDOR" fetch --quiet origin "$COMMIT" 2>/dev/null || true
git -C "$VENDOR" checkout --quiet "$COMMIT"
echo "lunii-admin-web : $(git -C "$VENDOR" log -1 --format='%h %s')"

cd "$ROOT/scripts/lunii-cli"
npm install --no-audit --no-fund --silent
node bundle.mjs
echo "Installation terminée."
