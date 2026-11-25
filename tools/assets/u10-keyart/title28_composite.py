"""Light the current actors from the aperture, using their alpha and live marks."""
from pathlib import Path
import sys
from PIL import Image, ImageChops, ImageFilter, ImageOps

raw = Path(sys.argv[1])
variant_b = '--alternate' in sys.argv
layer = Image.new('RGBA', (2560, 1440))
# The three-quarter calm profile keeps the prow and forward fist apart.
cast = [
    ('warden-b', 1250, 1170, 910, -6) if variant_b else ('warden', 1298, 1058, 760, 29),
    ('crawler', 1230, 670, 253, 48) if variant_b else ('crawler', 1250, 587, 245, 54),
    ('stalker', 1040, 780, 265, -53) if variant_b else ('stalker', 999, 756, 220, -55),
]
for name, cx, cy, width, bank in cast:
    actor = Image.open(raw / f'{name}.png').convert('RGBA')
    actor = actor.crop(actor.getchannel('A').point(lambda a: 255 if a > 110 else 0).getbbox())
    if name == 'warden-b':
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
    if warm:
        # Print the ledges on the lit side of each plate. The broad flats stay dark.
        value = ImageOps.grayscale(actor.convert('RGB')).filter(ImageFilter.GaussianBlur(2))
        ledge = ImageChops.subtract(value, ImageChops.offset(value, -6, 8))
        ledge = ledge.point(lambda v: min(113, v * 3.8))
        body = Image.composite(Image.new('RGBA', actor.size, '#99a5ba'), body, ledge)
        # Catch the bone in reflected amber and retain a dark throat inside the lip.
        bone = channel.point(lambda v: max(0, min(95, (v - 64) * 2)))
        body = Image.composite(Image.new('RGBA', actor.size, '#63514b'), body, bone)
        prow = ImageChops.subtract(bone, ImageChops.offset(bone, 3, 7))
        body = Image.composite(Image.new('RGBA', actor.size, '#e6cfb6'), body, prow)
        spill = mark.filter(ImageFilter.GaussianBlur(27))
        body = Image.composite(Image.new('RGBA', actor.size, '#da7640'), body, spill)
        body = Image.composite(Image.new('RGBA', actor.size, '#f4ab60'), body, mark)
        # The light falls across projecting ridges of the nearer knuckle and jaw.
        reach = mark.filter(ImageFilter.GaussianBlur(115)).point(lambda v: min(255, v * 16))
        bounce = ImageChops.multiply(reach, ImageChops.add(ledge, edge))
        body = Image.composite(Image.new('RGBA', actor.size, '#ca845a'), body, bounce)
        throat = mark.filter(ImageFilter.MinFilter(15)).filter(ImageFilter.GaussianBlur(3))
        body = Image.composite(Image.new('RGBA', actor.size, '#78371f'), body, throat)
        body.putalpha(alpha)
    layer.alpha_composite(body,(cx-width//2,cy-body.height//2))
out = raw / 'alternate' if variant_b else raw
out.mkdir(exist_ok=True)
layer.save(out / 'midground.png')

if not variant_b:
    marine = Image.open(raw / 'breacher.png').convert('RGBA')
    marine = marine.crop(marine.getchannel('A').point(lambda a: 255 if a > 110 else 0).getbbox())
    height = 1330
    marine = marine.resize((round(height * marine.width / marine.height), height), Image.Resampling.LANCZOS)
    # Extend the soft shadow from the frame edge across the lower suit.
    falloff = Image.linear_gradient('L').resize(marine.size).point(lambda v: max(0, (v-58)*.45))
    shaded = Image.composite(Image.new('RGB', marine.size, '#10121a'), marine.convert('RGB'), falloff)
    shaded.putalpha(marine.getchannel('A'))
    hero = Image.new('RGBA', layer.size)
    hero.alpha_composite(shaded, (1525, 358))
    hero.save(out / 'hero.png')
