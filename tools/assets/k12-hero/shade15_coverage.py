"""Approximate rig-colour coverage of the marine's top-down silhouette in calm captures.
blender -b -P shade15_coverage.py -- "<capture-glob>"
Figure pixels = inside marineBounds and clearly not floor (differs from the bounds' border median by > .06
in linear RGB); rig pixels = figure pixels whose hue lies in the rig window with saturation > .40."""
import sys, glob, json, colorsys, bpy, numpy as np

pattern = sys.argv[sys.argv.index('--') + 1]
HUES = {'breacher': (28, 58), 'cryo': (190, 225), 'pyro': (0, 26), 'arc': (250, 295)}
rows = []
for path in sorted(glob.glob(pattern)):
    try:
        man = json.load(open(f'{path}/manifest.json'))
    except OSError:
        continue
    for v in man.values():
        if not (isinstance(v, list) and v and isinstance(v[0], dict) and 'scenario' in v[0]):
            continue
        for s in v:
            if not s['scenario'].startswith('k10-calm-'):
                continue
            rig = s['scenario'].split('-')[-1]
            b = None
            def f(o):
                if isinstance(o, dict):
                    if isinstance(o.get('marineBounds'), dict):
                        return o['marineBounds']
                    for x in o.values():
                        r = f(x)
                        if r: return r
                if isinstance(o, list):
                    for x in o:
                        r = f(x)
                        if r: return r
            b = f(s)
            im = bpy.data.images.load(f"{path}/{s['file']}"); w, h = im.size
            px = np.array(im.pixels[:], np.float32).reshape(h, w, 4)[::-1, :, :3]
            x0, x1, y0, y1 = int(b['left']), int(b['right']), int(b['top']), int(b['bottom'])
            box = px[y0:y1, x0:x1]
            border = np.concatenate([box[0], box[-1], box[:, 0], box[:, -1]])
            floor = np.median(border, 0)
            figure = np.abs(box - floor).max(2) > .06
            srgb = np.clip(box, 0, 1)   # PNG pixels are already sRGB-encoded
            mx, mn = srgb.max(2), srgb.min(2)
            sat = (mx - mn) / np.maximum(mx, 1e-4)
            r, g, bb = srgb[..., 0], srgb[..., 1], srgb[..., 2]
            hue = np.degrees(np.arctan2(np.sqrt(3) * (g - bb), 2 * r - g - bb)) % 360
            lo, hi = HUES[rig]
            rigpx = figure & (sat > .35) & (hue >= lo) & (hue <= hi) & (mx > .25)
            rows.append((rig, s.get('room'), float(rigpx.sum()) / max(1, figure.sum()), int(figure.sum())))
for rig, room, cov, n in rows:
    print(f'COVERAGE {rig:9s} {room:16s} {cov * 100:5.1f}% of {n} figure px')
