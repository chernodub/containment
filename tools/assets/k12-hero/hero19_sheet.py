"""HERO19 identity sheet: crops shown at native, at 480x270 (box-downscaled full frame) and in greyscale.

  blender -b -P tools/assets/k12-hero/hero19_sheet.py -- out.png H img:x0:y0:x1:y1 ...

Crop boxes are in source pixels with a top-left origin. Row 1 colour native, row 2 colour as seen at 480x270
(nearest-upscaled back to H), rows 3-4 the same in luma. Blender numpy only.
"""
import sys
import bpy
import numpy as np

a = sys.argv[sys.argv.index('--') + 1:]
out, H, specs = a[0], int(a[1]), a[2:]


def load(f):
    im = bpy.data.images.load(f); w, h = im.size
    px = np.array(im.pixels[:], np.float32).reshape(h, w, 4)[::-1, :, :3].copy()
    if im.channels == 4:
        al = np.array(im.pixels[:], np.float32).reshape(h, w, 4)[::-1, :, 3:4]
        px = px * al + .04 * (1 - al)
    return px


def resize(px, nh, nw):
    h, w = px.shape[:2]
    ys = np.minimum((np.arange(nh) * h / nh).astype(int), h - 1); xs = np.minimum((np.arange(nw) * w / nw).astype(int), w - 1)
    return px[ys][:, xs]


def box(px, f):
    h, w = px.shape[:2]; h2, w2 = h // f, w // f
    return px[:h2 * f, :w2 * f].reshape(h2, f, w2, f, 3).mean((1, 3))


rows = [[], []]
for spec in specs:
    f, x0, y0, x1, y1 = spec.rsplit(':', 4); x0, y0, x1, y1 = map(int, (x0, y0, x1, y1))
    px = load(f)
    crop = px[y0:y1, x0:x1]
    W = int(round(crop.shape[1] * H / crop.shape[0]))
    rows[0].append(resize(crop, H, W))
    k = max(1, px.shape[1] // 480)
    small = box(px, k)[y0 // k:max(y0 // k + 1, y1 // k), x0 // k:max(x0 // k + 1, x1 // k)]
    rows[1].append(resize(small, H, W))
grey = lambda t: np.repeat((t @ np.array([.2126, .7152, .0722], np.float32))[..., None], 3, 2)
rows += [[grey(t) for t in rows[0]], [grey(t) for t in rows[1]]]
gap = 6
Wt = sum(t.shape[1] for t in rows[0]) + gap * (len(specs) - 1)
sheet = np.full((4 * H + 3 * gap, Wt, 4), .02, np.float32); sheet[..., 3] = 1
for r, row in enumerate(rows):
    x = 0
    for t in row:
        sheet[r * (H + gap):r * (H + gap) + H, x:x + t.shape[1], :3] = t; x += t.shape[1] + gap
img = bpy.data.images.new('sheet', Wt, sheet.shape[0]); img.pixels = sheet[::-1].ravel()
img.filepath_raw = out; img.file_format = 'PNG'; img.save()
print('HERO19 SHEET', out)
