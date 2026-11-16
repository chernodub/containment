"""File-only E10 presentation for the existing guarded gallery assembler.

Usage: python gallery.py <assembled-final-directory>
Native images and source receipts remain unchanged. Pillow is required.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import html
import json
import sys

out = Path(sys.argv[1])
report = json.loads((out / 'gallery.json').read_text())
before = Path('/Users/chernodub/.t3/worktrees/containment-game/t3-84b6dc1b/artifacts/nextgen/e9-final/native')

def small(path):
    return Image.open(path).convert('RGB').resize((480, 270), Image.Resampling.BOX)

comparison = Image.new('RGB', (960, len(report['rooms']) * 294), '#10171c')
draw = ImageDraw.Draw(comparison)
sections = []
for row, room in enumerate(report['rooms']):
    room_id = room['id']
    calm = f'combat-calm-{room_id}.png'
    for column, (label, path) in enumerate([('E9', before / calm), ('E10', out / 'native' / calm)]):
        comparison.paste(small(path), (column * 480, row * 294 + 24))
        draw.text((column * 480 + 6, row * 294 + 5), f'{room_id} / {label}', fill='#dce9e8')
    tour = Image.new('RGB', (2400, 588), '#10171c')
    labels = ImageDraw.Draw(tour)
    for column in range(5):
        name = f'room-tour-{room_id}-{column + 1:02d}.png'
        for tier, (label, path) in enumerate([('E9', before / name), ('E10', out / 'native' / name)]):
            tour.paste(small(path), (column * 480, tier * 294 + 24))
            labels.text((column * 480 + 6, tier * 294 + 5), f'{label} / {room_id} / {column + 1}', fill='#dce9e8')
    matched = f'compare-tour-{room_id}.png'
    tour.save(out / matched)
    links = ' · '.join(f'<a href="native/{name}">{html.escape(name)}</a>' for name in room['files'])
    sections.append(f'<section><h2>{html.escape(room["name"])}</h2><p>Source {room["sourceSHA"]}</p>'
                    f'<a href="{matched}"><img src="{matched}" alt="E9 above, E10 below; five matching room views"></a><p>{links}</p></section>')
comparison.save(out / 'twenty-before-after.png')
# The inherited residential-reference sheet was an E9-specific editorial aid.
(out / 'residential-standard-comparison.png').unlink(missing_ok=True)
(out / 'index.html').write_text('''<!doctype html><meta charset="utf-8">
<title>E10 — floors, light and depth</title><style>
body{background:#10171c;color:#dce9e8;font:16px system-ui;margin:24px;line-height:1.5}
img{max-width:100%;height:auto}a{color:#9cd6dc}section{margin:48px 0}code{font-size:13px}
</style><h1>E10 / floors, light and depth</h1>
<p>Twenty rooms. Native 1920×1080 PNGs; exact area reductions to 480×270.
Matched tours show E9 above E10. Staged G6 kiting is visual evidence, not hardware timing.</p>
<p><a href="gallery.json">Source receipts and room metrics</a> ·
<a href="benchmark/benchmark.json">Live 25-enemy benchmark</a> ·
<a href="benchmark/preparation.json">Fresh-room preparation</a> ·
<a href="campaign/index.html">Native Cryo campaign</a> ·
<a href="shadow-final/index.html">Final shadow / Low / recovery captures, HUD hidden</a></p>
<p>The live benchmark and final shadow supplement use runtime 086a4d8.
The twenty-room gallery preserves its two earlier, individually recorded build identities.
The later runtime change removes unnecessary architecture-shadow invalidation on actor pool churn.
Draws and combat compilation pass; the 20ms frame-p95 target remains unmet on this shared host.
<a href="benchmark-before/benchmark.json">Original benchmark</a> and
<a href="benchmark-before/draw-audit.json">draw audit</a> retain the measured misses.</p>
<h2>Calm</h2><a href="twenty-calm.png"><img src="twenty-calm.png"></a>
<h2>Staged native kiting</h2><a href="twenty-kiting.png"><img src="twenty-kiting.png"></a>
<h2>E9 / E10</h2><a href="twenty-before-after.png"><img src="twenty-before-after.png"></a>
''' + ''.join(sections))
