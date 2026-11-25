"""Place the three inked studio subjects in the existing breach composition."""
from pathlib import Path
import sys
from PIL import Image, ImageChops, ImageFilter

raw = Path(sys.argv[1])
layer = Image.new('RGBA', (2560, 1440))
# Coordinates in the delivered background plate, before the menu's overscan.
# The Warden rises through the lower crop; the two lunging bodies cross the gap.
cast = [
    ('warden', 1260, 1130, 940, -5),
    ('stalker', 990, 865, 300, -55),
    ('crawler', 1172, 669, 286, 55),
]
# Match the foreground plate's shadow exposure. Hold the emissive peaks.
levels = [(0, 3), (30, 21), (70, 53), (120, 101), (180, 165), (225, 220), (255, 247)]
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
    if name in ('crawler', 'stalker'):
        # Expose only the inner lip of the shell to the cold breach light.
        # The matte follows the hooked limbs and keeps open gaps transparent.
        alpha = actor.getchannel('A')
        interior = alpha.filter(ImageFilter.MinFilter(7))
        edge = ImageChops.subtract(alpha, interior)
        grazing = ImageChops.subtract(alpha, ImageChops.offset(alpha, 3, 2))
        weight = ImageChops.add(edge.point(lambda v: v * .28), grazing.point(lambda v: v * .58))
        reflected = ImageChops.screen(actor.convert('RGB'), Image.new('RGB', actor.size, (107, 125, 152)))
        actor = Image.composite(reflected, actor.convert('RGB'), weight)
        actor.putalpha(alpha)
    layer.alpha_composite(actor, (cx - width // 2, cy - height // 2))

layer.save(raw / 'midground.png')
