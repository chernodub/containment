"""Place the three inked studio subjects in the existing breach composition."""
from pathlib import Path
import sys
from PIL import Image

raw = Path(sys.argv[1])
layer = Image.new('RGBA', (2560, 1440))
# Coordinates in the delivered background plate, before the menu's overscan.
# The Warden rises through the lower crop; the two lunging bodies cross the gap.
cast = [
    ('warden', 1260, 1130, 940, -5),
    ('stalker', 925, 907, 312, -55),
    ('crawler', 1063, 708, 297, 60),
]
# Match the foreground plate's shadow exposure. Hold the emissive peaks.
levels = [(0, 3), (30, 9), (70, 26), (120, 62), (180, 128), (225, 207), (255, 247)]
curve = []
for (x, y), (end_x, end_y) in zip(levels, levels[1:]):
    for value in range(x, end_x):
        curve.append(round(y + (value - x) * (end_y - y) / (end_x - x)))
curve.append(levels[-1][1])
for name, cx, cy, width, bank in cast:
    actor = Image.open(raw / f'{name}.png').convert('RGBA')
    bounds = actor.getchannel('A').point(lambda a: 255 if a > 127 else 0).getbbox()
    if not bounds:
        raise ValueError(f'Empty studio capture for {name}')
    actor = actor.point(curve * 3 + list(range(256)))
    actor = actor.crop(bounds).rotate(bank, Image.Resampling.BICUBIC, expand=True)
    actor = actor.crop(actor.getbbox())
    height = round(width * actor.height / actor.width)
    actor = actor.resize((width, height), Image.Resampling.LANCZOS)
    layer.alpha_composite(actor, (cx - width // 2, cy - height // 2))

layer.save(raw / 'midground.png')
