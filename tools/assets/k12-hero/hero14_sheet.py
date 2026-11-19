"""HERO14 review sheet: each capture area-reduced to 480x270, a 96x96 window around the marine,
rows = rigs, columns = rooms x (calm, heavy-02). Colour + greyscale outputs.
blender -b -P hero14_sheet.py -- <capture-dir> <out-prefix>"""
import sys, json, bpy, numpy as np
cap, out = sys.argv[sys.argv.index('--') + 1:][:2]
man = json.load(open(f'{cap}/manifest.json'))
shots = {(s['scenario'], s['room'], s.get('frame')): s for s in man['shots']} if 'shots' in man else {}
if not shots:
    for v in man.values():
        if isinstance(v, list) and v and isinstance(v[0], dict) and 'scenario' in v[0]:
            shots = {(s['scenario'], s['room'], s.get('frame')): s for s in v}
W = 96
rigs, rooms = ['breacher', 'cryo', 'pyro', 'arc'], ['crew-checkpoint', 'relay-racks', 'freight-hold']
sheet = np.zeros((4 * W, 6 * W, 3), np.float32)
def bounds(s):
    def f(o):
        if isinstance(o, dict):
            if isinstance(o.get('marineBounds'), dict): return o['marineBounds']
            for v in o.values():
                r = f(v)
                if r: return r
        if isinstance(o, list):
            for v in o:
                r = f(v)
                if r: return r
    return f(s)
for r, rig in enumerate(rigs):
    for c, (room, kind) in enumerate([(room, k) for room in rooms for k in ('calm', 'heavy')]):
        key = next((k for k in shots if k[0] == f'k10-{kind}-{rig}' and k[1] == room and (kind == 'calm' or k[2] in (2, '02', 1))), None)
        if not key: continue
        s = shots[key]; im = bpy.data.images.load(f"{cap}/{s['file']}"); w, h = im.size
        px = np.array(im.pixels[:], np.float32).reshape(h, w, 4)[::-1, :, :3]
        f = w // 480; small = px[:270 * f, :480 * f].reshape(270, f, 480, f, 3).mean((1, 3))
        b = bounds(s) or {'left': w / 2 - 50, 'right': w / 2 + 50, 'top': h / 2 - 50, 'bottom': h / 2 + 50}
        cx = int((b['left'] + b['right']) / 2 / f); cy = int((b['top'] + b['bottom']) / 2 / f)
        x0 = max(0, min(480 - W, cx - W // 2)); y0 = max(0, min(270 - W, cy - W // 2))
        sheet[r * W:(r + 1) * W, c * W:(c + 1) * W] = small[y0:y0 + W, x0:x0 + W]
for name, data in (('colour', sheet), ('grey', np.repeat((sheet @ np.array([.2126, .7152, .0722], np.float32))[..., None], 3, 2))):
    big = np.repeat(np.repeat(data, 2, 0), 2, 1)
    rgba = np.concatenate([big, np.ones(big.shape[:2] + (1,), np.float32)], 2)[::-1]
    img = bpy.data.images.new(name, big.shape[1], big.shape[0]); img.pixels = rgba.ravel()
    img.filepath_raw = f'{out}-{name}.png'; img.file_format = 'PNG'; img.save()
print('SHEET', len(shots))
