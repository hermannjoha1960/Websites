"""Resize and convert the selected source photos to web-ready WebP files.

Usage: python3 -I process_images.py <source_dir> <out_dir>
The manifest (images.json) lists every photo used on the site, its source
file and its German alt text (alt texts are set in the media library).
"""
import json
import os
import sys

from PIL import Image, ImageOps

src_dir, out_dir = sys.argv[1], sys.argv[2]
manifest = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "images.json"), encoding="utf-8"))
os.makedirs(out_dir, exist_ok=True)

for item in manifest:
    im = Image.open(os.path.join(src_dir, item["src"]))
    im = ImageOps.exif_transpose(im).convert("RGB")
    im.thumbnail((item["max"], item["max"]), Image.LANCZOS)
    path = os.path.join(out_dir, item["out"] + ".webp")
    im.save(path, "WEBP", quality=item.get("q", 80), method=6)
    print(f'{item["out"]}.webp {im.width}x{im.height} {os.path.getsize(path)//1024} KB')
