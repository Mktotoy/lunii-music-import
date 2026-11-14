#!/usr/bin/env bash
# Vérifie un volume Lunii après import : anciens packs et reste du volume intacts,
# nouveaux packs indexés, première piste de chaque nouveau pack déchiffrable en MP3.
# Usage : verify.sh <sauvegarde> <volume>
set -euo pipefail
B="$1"; V="$2"
n0=$(stat -c %s "$B/.pi"); n1=$(stat -c %s "$V/.pi")
cmp -s -n "$n0" "$B/.pi" "$V/.pi" || { echo "KO : début de .pi modifié"; exit 1; }
for r in $(ls "$B/.content"); do
  diff -rq "$B/.content/$r" "$V/.content/$r" >/dev/null || { echo "KO : pack existant modifié $r"; exit 1; }
done
diff -rq --exclude=.content --exclude=.pi "$B" "$V" >/dev/null || { echo "KO : volume modifié hors packs"; exit 1; }
python3 -I - "$V" "$n0" <<'EOF'
import subprocess, sys
V, start = sys.argv[1], int(sys.argv[2])
md = open(V + "/.md", "rb").read()
if int.from_bytes(md[:2], "little") not in (6, 7):
    sys.exit("KO : vérification MP3 prévue pour V3 seulement")
ks = md[64:96]
rev = lambda b: b"".join(b[i:i + 4][::-1] for i in range(0, len(b), 4))
k, iv = rev(ks[:16]), rev(ks[16:32])
pi, ok = open(V + "/.pi", "rb").read(), True
for i in range(start, len(pi), 16):
    ref = pi[i:i + 16].hex()[-8:].upper()
    p = f"{V}/.content/{ref}"
    title = next(l for l in open(p + "/md", encoding="utf-8") if l.startswith("title"))
    blk = open(p + "/sf/000/00000001", "rb").read()[:512]
    d = subprocess.run(["openssl", "enc", "-d", "-aes-128-cbc", "-nopad", "-K", k.hex(),
                        "-iv", iv.hex()], input=blk, capture_output=True).stdout
    good = d[:2] == b"\xff\xfb"
    ok &= good
    print(f"   {ref} {title.strip()} : {'OK' if good else 'MP3 illisible'}")
sys.exit(0 if ok else 1)
EOF
echo "   $(( (n1 - n0) / 16 )) pack(s) ajouté(s), anciens packs intacts"
