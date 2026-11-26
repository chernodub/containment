"""Light the current actors from the aperture, using their alpha and live marks."""
from pathlib import Path
import sys
from PIL import Image, ImageChops, ImageFilter, ImageOps
from ink_contour import contour

raw = Path(sys.argv[1])
variant_b = '--alternate' in sys.argv
layer = Image.new('RGBA', (2560, 1440))
# The three-quarter calm profile keeps the prow and forward fist apart.
cast = [
    ('warden-b', 1250, 1170, 910, -6) if variant_b else ('warden', 1274, 1028, 736, 29),
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
    # The studio already draws the live pigment, ink and cel lighting. Keep them
    # together when banking the figures. The Warden lip encloses a recessed throat.
    body = actor
    if name.startswith('warden'):
        mouth = ImageChops.multiply(alpha, actor.getchannel('R').point(lambda v: min(255,max(0,(v-198)*10))))
        # The shipped jaw has a white throat inside a bone-coloured lip. Keep
        # the authored aperture when later model revisions move or reshape it.
        core = ImageChops.multiply(mouth, actor.getchannel('B').point(lambda v: min(255,max(0,(v-185)*9))))
        body = Image.composite(Image.new('RGBA',actor.size,'#5c392c'),body,mouth)
        body = Image.composite(Image.new('RGBA',actor.size,'#965335'),body,core)
        inner = core.filter(ImageFilter.MinFilter(9))
        tongue = ImageChops.subtract(inner, ImageChops.offset(inner,-8,-12))
        body = Image.composite(Image.new('RGBA',actor.size,'#f4b769'),body,tongue)
        body.putalpha(alpha)
    elif name == 'crawler':
        amber = ImageChops.multiply(alpha,actor.getchannel('R').point(lambda v: min(255,max(0,(v-185)*8))))
        body = Image.composite(Image.new('RGBA',actor.size,'#e89d49'),body,amber)
        body.putalpha(alpha)
    body = contour(body, 2 if width > 300 else 1)
    layer.alpha_composite(body,(cx-width//2,cy-body.height//2))
out = raw / 'alternate' if variant_b else raw
out.mkdir(exist_ok=True)
layer.save(out / 'midground.png')

if not variant_b:
    marine = Image.open(raw / 'breacher.png').convert('RGBA')
    marine = marine.crop(marine.getchannel('A').point(lambda a: 255 if a > 110 else 0).getbbox())
    height = 1330
    marine = marine.resize((round(height * marine.width / marine.height), height), Image.Resampling.LANCZOS)
    hero = Image.new('RGBA', layer.size)
    hero.alpha_composite(contour(marine,4), (1525, 358))
    hero.save(out / 'hero.png')
