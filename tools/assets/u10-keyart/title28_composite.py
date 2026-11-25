"""Light the current actors from the aperture, using their alpha and live marks."""
from pathlib import Path
import sys
from PIL import Image, ImageChops, ImageFilter, ImageOps

raw = Path(sys.argv[1])
variant_b = '--alternate' in sys.argv
layer = Image.new('RGBA', (2560, 1440))
# The charging profile exposes the maw on the near cheek. Reverse the printed
# profile to put the marine, muzzle and charging head on the same sightline.
cast = [
    ('warden-b', 1250, 1170, 910, -6) if variant_b else ('warden', 1305, 1140, 840, 8),
    ('crawler', 1230, 670, 253, 48) if variant_b else ('crawler', 1135, 660, 245, 54),
    ('stalker', 1040, 780, 265, -53) if variant_b else ('stalker', 934, 851, 248, -55),
]
for name, cx, cy, width, bank in cast:
    actor = Image.open(raw / f'{name}.png').convert('RGBA')
    actor = actor.crop(actor.getchannel('A').point(lambda a: 255 if a > 110 else 0).getbbox())
    if name.startswith('warden'):
        actor = ImageOps.mirror(actor)
    actor = actor.rotate(bank, Image.Resampling.BICUBIC, expand=True)
    actor = actor.crop(actor.getbbox())
    actor = actor.resize((width, round(width * actor.height / actor.width)), Image.Resampling.LANCZOS)
    alpha = actor.getchannel('A')
    # Sample only the luminous range. Albedo and cel boundaries never enter the body.
    warm = name.startswith('warden')
    channel = actor.getchannel('R' if warm or name == 'crawler' else 'B')
    threshold = 204 if warm else 183
    mark = channel.point(lambda v: min(255, max(0, (v - threshold) * 7)))
    mark = ImageChops.multiply(alpha, mark).filter(ImageFilter.MedianFilter(3))
    # A grazing edge exists only on surfaces facing the breach above and right.
    step = 6 if warm else 3
    edge = ImageChops.subtract(alpha, ImageChops.offset(alpha, -step, step))
    soft = edge.filter(ImageFilter.GaussianBlur(step * 1.5))
    rim = ImageChops.add(edge.point(lambda v: v * .63), soft)
    body = Image.composite(Image.new('RGB',actor.size,'#8498b1'),
                           Image.new('RGB',actor.size,'#080c13'), rim)
    hue = '#ffba66' if warm else '#e693a7' if name == 'crawler' else '#bcbedb'
    glow = mark.filter(ImageFilter.GaussianBlur(11 if warm else 4))
    body = Image.composite(Image.new('RGB',actor.size,hue), body, glow.point(lambda v:v*.48))
    body = Image.composite(Image.new('RGB',actor.size,hue), body, mark.filter(ImageFilter.GaussianBlur(1.5)))
    core = mark.filter(ImageFilter.MinFilter(7 if warm else 3)).filter(ImageFilter.GaussianBlur(2))
    body = Image.composite(Image.new('RGB',actor.size,'#ffe3b1' if warm else hue),body,core)
    body.putalpha(alpha)
    layer.alpha_composite(body,(cx-width//2,cy-body.height//2))
out = raw / 'alternate' if variant_b else raw
out.mkdir(exist_ok=True)
layer.save(out / 'midground.png')
