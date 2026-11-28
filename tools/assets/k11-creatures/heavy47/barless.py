"""HEAVY47: brood43-values.py's maxima for one label, with the champion health-bar rows removed.
A HUD bar is drawn over the actor mask; rows with 4+ pixels of Y' > .6 are the bar, and the two
rows either side carry the review reduction's ringing from it. Usage: barless.py frame.png zones.json label"""
import json, sys
from PIL import Image
img = Image.open(sys.argv[1]).convert("RGB").resize((480, 270), Image.Resampling.LANCZOS)
rects = json.load(open(sys.argv[2])).get(sys.argv[3], [])
Y = lambda p: (.2126*p[0] + .7152*p[1] + .0722*p[2]) / 255
S = lambda p: (max(p) - min(p)) / max(1, max(p))
px = [(x, y, img.getpixel((x, y))) for l, t, r, b in rects for y in range(t, b+1) for x in range(l, r+1)]
rows = {}
for x, y, p in px:
    if Y(p) > .6: rows[y] = rows.get(y, 0) + 1
bars = [y for y, n in rows.items() if n >= 4]
kept = [q for q in px if not any(abs(q[1]-b) <= 2 for b in bars)]
if kept:
    print(f"{sys.argv[3]:10} bar rows {bars or '-'}  Y' {max(Y(q[2]) for q in kept):.3f}  S {max(S(q[2]) for q in kept):.3f}  ({len(px)-len(kept)} of {len(px)} px removed)")
