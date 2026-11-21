"""Encode the two replacement actor plates and their static title composite."""
from pathlib import Path
import sys
from PIL import Image

raw = Path(sys.argv[1])
ui = Path(__file__).resolve().parents[3] / 'public/assets/ui/u10'
resize = Image.Resampling.LANCZOS
size = (2560, 1440)
background = next((Path(arg.split('=', 1)[1]) for arg in sys.argv[2:]
                   if arg.startswith('--background=')), None)
if background:
    hull = Image.open(background).convert('RGB')
    if hull.size != size:
        raise ValueError(f'Background must be rendered at {size}')
    for width in (2560, 1280):
        plate = hull.resize((width, width * 9 // 16), resize)
        plate.save(ui / f'background-{width}.webp', quality=86, method=6)
        if width == 1280:
            plate.quantize(colors=256, method=Image.Quantize.FASTOCTREE).save(
                ui / 'background-1280.png', optimize=True)
frame = Image.open(ui / 'background-2560.webp').convert('RGBA')

for name in ('midground', 'hero', 'foreground', 'fog'):
    if name == 'hero' and '--keep-hero' in sys.argv[2:]:
        layer = Image.open(ui / 'hero-2560.webp').convert('RGBA')
    elif name in ('midground', 'hero'):
        layer = Image.open(raw / f'{name}.png').convert('RGBA')
        if layer.size != size:
            raise ValueError(f'{name} must be rendered at {size}')
        for width in (2560, 1280):
            plate = layer.resize((width, width * 9 // 16), resize)
            plate.save(ui / f'{name}-{width}.webp', quality=86, method=6)
            if width == 1280:
                plate.quantize(colors=256, method=Image.Quantize.FASTOCTREE).save(
                    ui / f'{name}-1280.png', optimize=True)
    else:
        width = 1280 if name == 'fog' else 2560
        layer = Image.open(ui / f'{name}-{width}.webp').convert('RGBA').resize(size, resize)
        if name == 'fog':
            layer.putalpha(layer.getchannel('A').point(lambda alpha: round(alpha * .55)))
    frame = Image.alpha_composite(frame, layer)

for width in (2560, 1920, 1280):
    image = frame.convert('RGB').resize((width, width * 9 // 16), resize)
    image.save(ui / f'title-{width}.webp', quality=86, method=6)
    if width == 1280:
        image.save(ui / 'title-1280.jpg', quality=87, optimize=True)
