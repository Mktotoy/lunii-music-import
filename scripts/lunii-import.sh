#!/usr/bin/env bash
# Import d'albums audio sur une Lunii V3, en ligne de commande.
# Usage : scripts/lunii-import.sh <dossier_albums> [--run]
#   <dossier_albums> : un sous-dossier par album, fichiers audio dedans, ordre = tri alphabétique.
#                      Préfixer "01 ", "02 "... : le préfixe fixe l'ordre et disparaît du titre.
#   sans --run : sauvegarde, conversion, test complet sur une COPIE. Rien n'est écrit sur la Lunii.
#   avec --run : idem, puis écriture sur la Lunii (ajout seulement), vérification, démontage.
# Variables : LUNII_VOLUME (point de montage, détecté sinon), LUNII_WORK (défaut ./lunii-work).
set -euo pipefail

SRC="${1:?usage: lunii-import.sh <dossier_albums> [--run]}"
RUN="${2:-}"
ROOT="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
TOOL="$ROOT/scripts/lunii-cli"
WORK="${LUNII_WORK:-$ROOT/lunii-work}"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$WORK/backup-$STAMP"; PREP="$WORK/prepared-$STAMP"; STAGING="$WORK/staging-$STAMP"

die() { echo "ERREUR : $*" >&2; exit 1; }
detect_volume() {
  findmnt -rn -o TARGET -t vfat,exfat 2>/dev/null | sed 's/\\x20/ /g' | while read -r m; do
    [ -f "$m/.md" ] && [ -f "$m/.pi" ] && [ -d "$m/.content" ] && echo "$m" && break
  done
}
VOL="${LUNII_VOLUME:-$(detect_volume)}"
[ -d "$SRC" ] || die "dossier source introuvable : $SRC"
[ -n "$VOL" ] && [ -f "$VOL/.md" ] || die "Lunii non détectée (brancher, vérifier avec lsblk, ou définir LUNII_VOLUME)"
[ -f "$TOOL/build.js" ] || die "outil non installé : lancer d'abord scripts/setup.sh"
mdv=$(od -An -tu2 -N2 "$VOL/.md" | tr -d ' ')
[ "$mdv" = "6" ] || [ "$mdv" = "7" ] || die "Lunii non V3 (.md version $mdv) : non pris en charge"
echo "== Lunii : $VOL (.md version $mdv)"
mkdir -p "$WORK"

# 1. Sauvegarde complète du volume
echo "== Sauvegarde : $BACKUP"
cp -a "$VOL/." "$BACKUP/"
diff -q <(cd "$VOL" && find . -type f | sort) <(cd "$BACKUP" && find . -type f | sort) >/dev/null \
  || die "sauvegarde incomplète"

# 2. Conversion des pistes en copies : MP3 mono 44100 Hz 64 kbit/s sans tags
echo "== Conversion : $PREP"
for album in "$SRC"/*/; do
  a="$(basename "$album")"; mkdir -p "$PREP/$a"
  for f in "$album"*; do
    case "${f,,}" in *.mp3|*.m4a|*.wav|*.ogg|*.flac|*.aac|*.opus) ;; *) continue ;; esac
    ffmpeg -hide_banner -loglevel error -y -i "$f" -map 0:a -ar 44100 -ac 1 -b:a 64k \
      -map_metadata -1 -write_xing 0 -id3v2_version 0 -c:a libmp3lame "$PREP/$a/$(basename "${f%.*}").mp3"
  done
  n=$(find "$PREP/$a" -name '*.mp3' | wc -l); echo "   $a : $n pistes"
  [ "$n" -gt 0 ] || die "album vide : $a"
done

# 3. Test complet sur une copie de la sauvegarde
echo "== Test sur copie : $STAGING"
cp -a "$BACKUP" "$STAGING"
LUNII_SCRATCH="$WORK/scratch" node "$TOOL/build.js" "$STAGING" "$PREP" | grep -E '^(Appareil|OK|Installation)'
"$TOOL/verify.sh" "$BACKUP" "$STAGING" || die "test KO, rien n'a été écrit sur la Lunii"
rm -rf "$STAGING"

if [ "$RUN" != "--run" ]; then
  echo "== Test OK. Relancer avec --run pour écrire sur la Lunii."
  exit 0
fi

# 4. Écriture réelle : la Lunii doit être identique à la sauvegarde
diff -rq "$BACKUP" "$VOL" >/dev/null || die "la Lunii a changé depuis la sauvegarde, relancer"
echo "== Écriture sur $VOL"
LUNII_SCRATCH="$WORK/scratch" node "$TOOL/build.js" "$VOL" "$PREP" | grep -E '^(Appareil|OK|Installation)'
sync
"$TOOL/verify.sh" "$BACKUP" "$VOL" || die "vérification KO : restaurer depuis $BACKUP"
# démonte seulement si VOL est lui-même un point de montage (jamais le système de fichiers parent)
dev="$(findmnt -n -o SOURCE --mountpoint "$VOL" || true)"
if [ -n "$dev" ] && command -v udisksctl >/dev/null && udisksctl unmount -b "$dev" >/dev/null 2>&1; then
  echo "== Terminé, Lunii démontée. Sauvegarde : $BACKUP"
else
  echo "== Terminé. Éjecter la Lunii proprement avant de la débrancher. Sauvegarde : $BACKUP"
fi
