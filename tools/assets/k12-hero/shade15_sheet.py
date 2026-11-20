"""SHADE15 before/after sheets (Blender numpy, no Pillow).
blender -b -P shade15_sheet.py -- <before-dir> <after-dir> <out-dir>
Writes marine-native, marine-480, scenes-480 (colour + grey): rows before/after."""
import sys, json, bpy, numpy as np

before, after, out = sys.argv[sys.argv.index('--') + 1:][:3]


import glob


def shots(d):
    """``d`` is a capture dir or a glob prefix (``prefix-*``); file paths are made absolute."""
    out = []
    for path in sorted(glob.glob(d)) or [d]:
        try:
            man = json.load(open(f'{path}/manifest.json'))
        except OSError:
            continue
        for v in man.values():
            if isinstance(v, list) and v and isinstance(v[0], dict) and 'scenario' in v[0]:
                out += [dict(s, file=f"{path}/{s['file']}") for s in v]
    return out


def bounds(s):
    def f(o):
        if isinstance(o, dict):
            if isinstance(o.get('marineBounds'), dict):
                return o['marineBounds']
            for v in o.values():
                r = f(v)
                if r:
                    return r
        if isinstance(o, list):
            for v in o:
                r = f(v)
                if r:
                    return r
    return f(s)


def pick(d, scenario, room=None, frame=None):
    for s in shots(d):
        if s['scenario'] == scenario and (room is None or s.get('room') == room) and (frame is None or s.get('frame') in (frame, f'{frame:02d}' if isinstance(frame, int) else frame)):
            return s
    for s in shots(d):
        if s['scenario'] == scenario and (room is None or s.get('room') == room):
            return s


def load(d, s):
    im = bpy.data.images.load(s['file']); w, h = im.size
    px = np.array(im.pixels[:], np.float32).reshape(h, w, 4)[::-1, :, :3]
    bpy.data.images.remove(im)
    return px


def crop(px, b, size, scale=1):
    h, w = px.shape[:2]
    if scale > 1:
        px = px[:h // scale * scale, :w // scale * scale].reshape(h // scale, scale, w // scale, scale, 3).mean((1, 3)); h, w = px.shape[:2]
    cx = int((b['left'] + b['right']) / 2 / scale) if b else w // 2; cy = int((b['top'] + b['bottom']) / 2 / scale) if b else h // 2
    x0 = max(0, min(w - size, cx - size // 2)); y0 = max(0, min(h - size, cy - size // 2))
    return px[y0:y0 + size, x0:x0 + size]


def write(name, rows):
    img = np.concatenate([np.concatenate(r, 1) for r in rows], 0)
    for tag, data in (('colour', img), ('grey', np.repeat((img @ np.array([.2126, .7152, .0722], np.float32))[..., None], 3, 2))):
        rgba = np.concatenate([data, np.ones(data.shape[:2] + (1,), np.float32)], 2)[::-1]
        im = bpy.data.images.new(name, data.shape[1], data.shape[0]); im.pixels = rgba.ravel()
        im.filepath_raw = f'{out}/{name}-{tag}.png'; im.file_format = 'PNG'; im.save()


marine = []
for rig in ('breacher', 'cryo', 'pyro', 'arc'):
    marine += [(f'k10-calm-{rig}', 'crew-checkpoint', None), (f'k10-calm-{rig}', 'relay-racks', None), (f'value14-overlap-{rig}', None, 4)]
rows_n, rows_s = [], []
for d in (before, after):
    rn, rs = [], []
    for sc, room, fr in marine:
        s = pick(d, sc, room, fr)
        if not s:
            rn.append(np.zeros((220, 220, 3), np.float32)); rs.append(np.zeros((80, 80, 3), np.float32)); continue
        px = load(d, s); b = bounds(s)
        rn.append(crop(px, b, 220)); rs.append(np.repeat(np.repeat(crop(px, b, 40, px.shape[1] // 480), 2, 0), 2, 1))
    rows_n.append(rn); rows_s.append(rs)
write('marine-native', [rows_n[0][:6], rows_n[1][:6], rows_n[0][6:], rows_n[1][6:]])
write('marine-480', [rows_s[0], rows_s[1]])
scenes = [('value14-crowd-relay-racks', None, 4), ('value14-crowd-swarm-junction', None, 4), ('value14-crowd-crew-checkpoint', None, 4), ('combat-heavy', 'communal-atrium', 2)]
rows = []
for d in (before, after):
    r = []
    for sc, room, fr in scenes:
        s = pick(d, sc, room, fr)
        if not s:
            r.append(np.zeros((270, 480, 3), np.float32)); continue
        px = load(d, s); f = px.shape[1] // 480
        r.append(px[:270 * f, :480 * f].reshape(270, f, 480, f, 3).mean((1, 3)))
    rows.append(r)
write('scenes-480', [[rows[0][0], rows[0][1]], [rows[1][0], rows[1][1]], [rows[0][2], rows[0][3]], [rows[1][2], rows[1][3]]])
print('SHADE15 SHEETS', out)
