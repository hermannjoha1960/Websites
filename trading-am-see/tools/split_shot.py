"""Split a tall full-page screenshot into viewable chunks: python3 -I split_shot.py <png> <chunk_px> <out_prefix> [scale]"""
import sys
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
src, chunk, prefix = sys.argv[1], int(sys.argv[2]), sys.argv[3]
scale = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
im = Image.open(src)
w, h = im.size
n = 0
for top in range(0, h, chunk):
    part = im.crop((0, top, w, min(h, top + chunk)))
    if scale != 1.0:
        part = part.resize((int(part.width * scale), int(part.height * scale)), Image.LANCZOS)
    part.convert("RGB").save(f"{prefix}-{n:02d}.jpg", quality=80)
    n += 1
print(n, "chunks")
