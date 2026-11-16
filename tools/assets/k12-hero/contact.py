"""Contact sheet from PNGs via Blender's numpy: blender -b -P contact.py -- out.png cols cell img1 img2 ...
Each image is fitted (nearest downscale) into a square ``cell``."""
import sys, bpy, numpy as np
a = sys.argv[sys.argv.index('--') + 1:]
out, cols, cell, files = a[0], int(a[1]), int(a[2]), a[3:]
rows = (len(files) + cols - 1) // cols
sheet = np.zeros((rows * cell, cols * cell, 4), np.float32); sheet[..., :3] = .04; sheet[..., 3] = 1
for i, f in enumerate(files):
    im = bpy.data.images.load(f); w, h = im.size
    px = np.array(im.pixels[:], np.float32).reshape(h, w, 4)
    s = max(w, h) / cell
    ys = (np.arange(int(h / s)) * s).astype(int); xs = (np.arange(int(w / s)) * s).astype(int)
    small = px[ys][:, xs]
    if small.shape[2] == 4:
        al = small[..., 3:4]; small = np.concatenate([small[..., :3] * al + .04 * (1 - al), np.ones_like(al)], 2)
    r, c = i // cols, i % cols
    y0 = (rows - 1 - r) * cell; x0 = c * cell
    sheet[y0:y0 + small.shape[0], x0:x0 + small.shape[1]] = small
img = bpy.data.images.new('sheet', cols * cell, rows * cell); img.pixels = sheet.ravel()
img.filepath_raw = out; img.file_format = 'PNG'; img.save()
