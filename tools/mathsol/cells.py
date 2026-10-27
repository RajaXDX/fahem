# Finds table grid lines inside a region of a page image.
# usage: python -I cells.py <img> x0 y0 x1 y1   (percent)
# prints column edges (x%) right-to-left and row edges (y%) top-to-bottom
import sys, numpy as np
from PIL import Image
img = sys.argv[1]; x0, y0, x1, y1 = map(float, sys.argv[2:6])
a = np.asarray(Image.open(img).convert("RGB")).astype(int)
H, W = a.shape[:2]
X0, X1, Y0, Y1 = int(x0 / 100 * W), int(x1 / 100 * W), int(y0 / 100 * H), int(y1 / 100 * H)
r = a[Y0:Y1, X0:X1]
# line pixels: darker than background and not white; use luminance drop vs local
lum = r.mean(axis=2)
dark = lum < 200
def edges(frac, axis, off, size):
    out, prev = [], -9
    for i, v in enumerate(frac):
        if v > 0.55:
            if i - prev > 3: out.append(i)
            prev = i
    return [round((off + i) / size * 100, 2) for i in out]
rows = edges(dark.mean(axis=1), 0, Y0, H)
cols = edges(dark.mean(axis=0), 1, X0, W)
print("cols", cols[::-1])
print("rows", rows)
