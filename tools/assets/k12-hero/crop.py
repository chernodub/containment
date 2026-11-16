"""Crop PNG regions side by side (native pixels): blender -b -P crop.py -- out.png img:x0:y0:x1:y1 ..."""
import sys, bpy, numpy as np
a = sys.argv[sys.argv.index('--') + 1:]
tiles = []
for spec in a[1:]:
    f, x0, y0, x1, y1 = spec.rsplit(':', 4); x0, y0, x1, y1 = map(int, (x0, y0, x1, y1))
    im = bpy.data.images.load(f); w, h = im.size
    px = np.array(im.pixels[:], np.float32).reshape(h, w, 4)[::-1]
    tiles.append(px[y0:y1, x0:x1])
H = max(t.shape[0] for t in tiles); W = sum(t.shape[1] for t in tiles)
out = np.zeros((H, W, 4), np.float32); out[..., 3] = 1; x = 0
for t in tiles:
    out[:t.shape[0], x:x + t.shape[1]] = t; x += t.shape[1]
img = bpy.data.images.new('crop', W, H); img.pixels = out[::-1].ravel()
img.filepath_raw = a[0]; img.file_format = 'PNG'; img.save()
