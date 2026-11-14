#!/usr/bin/env python3
"""Helpers pour lunii-cli.

  prep.py raw <image>          -> RGBA brut 320x240 sur stdout (même cadrage que converters/image.ts)
  prep.py cover <titre> <png>  -> crée une jaquette 320x240 avec le titre (remplace le placeholder canvas)
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H = 320, 240


def raw(path):
    im = Image.open(path).convert("RGBA")
    iw, ih = im.size
    scale = max(W / iw, H / ih)
    nw, nh = max(1, round(iw * scale)), max(1, round(ih * scale))
    src = np.array(im.resize((nw, nh), Image.BILINEAR)).astype(np.uint16)
    # composite sur fond noir, comme un canvas transparent rendu en gris
    a = src[:, :, 3:4]
    rgb = (src[:, :, :3] * a // 255).astype(np.uint8)
    rgba = np.concatenate([rgb, np.full((nh, nw, 1), 255, np.uint8)], axis=2)
    canvas = np.zeros((H, W, 4), dtype=np.uint8)
    # transform canvas : scale(1,-1) puis translate(0,-H) => ligne image k rendue en y = H - k
    for c in range(H):
        k = H - c
        if 0 <= k < nh:
            w = min(nw, W)
            canvas[c, :w] = rgba[k, :w]
    sys.stdout.buffer.write(canvas.tobytes())


def cover(title, out):
    img = Image.new("RGB", (W, H), (30, 30, 30))
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("DejaVuSans-Bold.ttf", 22)
    except OSError:
        font = ImageFont.load_default()
    words, lines, cur = title.split(), [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if d.textlength(test, font=font) > W - 20:
            lines.append(cur)
            cur = w
        else:
            cur = test
    lines.append(cur)
    y = (H - len(lines) * 30) // 2
    for line in lines:
        d.text((W // 2, y), line, fill=(240, 240, 240), font=font, anchor="mt")
        y += 30
    img.save(out)


if __name__ == "__main__":
    if sys.argv[1] == "raw":
        raw(sys.argv[2])
    elif sys.argv[1] == "cover":
        cover(sys.argv[2], sys.argv[3])
