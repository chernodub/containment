"""Convert original PNG renders into responsive browser delivery images (Pillow)."""
import sys
from pathlib import Path
from PIL import Image, ImageFilter, ImageEnhance
ROOT = Path(__file__).resolve().parents[3]
PORTRAITS = ROOT / 'public/assets/portraits/u10'
for source in ([] if '--ui-only' in sys.argv else PORTRAITS.glob('*-bust.png')):
    image = Image.open(source)
    for size in [256, 640, 1024]:
        scaled = image.copy()
        scaled.thumbnail((size, int(size * image.height / image.width)), Image.Resampling.LANCZOS)
        scaled.save(PORTRAITS / f'{source.stem}-{size}.webp', quality=86, method=6)

UI = ROOT / 'public/assets/ui/u10'
UI.mkdir(parents=True, exist_ok=True)
raw = ROOT / next((a.split('=',1)[1] for a in sys.argv if a.startswith('--raw=')), 'artifacts/nextgen/u10-rounds/10')
if '--ending-only' not in sys.argv and (raw / 'composition.png').exists():
    for name in (['composition','foreground'] if '--foreground-only' in sys.argv else ['composition','background','midground','hero','foreground','fog']):
        source = raw / f'{name}.png'
        if not source.exists():
            continue
        image = Image.open(source).convert('RGBA')
        if name == 'foreground':
            image = ImageEnhance.Brightness(image).enhance(.85)
        if name == 'fog':
            image = image.filter(ImageFilter.GaussianBlur(12))
        if name == 'composition' and (raw / 'foreground.png').exists():
            image = Image.open(raw / 'background.png').convert('RGBA')
            for layer in ['midground','hero','foreground','fog']:
                plate = Image.open(raw / f'{layer}.png').convert('RGBA')
                if layer == 'foreground':
                    plate = ImageEnhance.Brightness(plate).enhance(.85)
                if layer == 'fog':
                    plate = plate.filter(ImageFilter.GaussianBlur(12))
                    plate.putalpha(plate.getchannel('A').point(lambda alpha: round(alpha * .55)))
                image = Image.alpha_composite(image, plate)
        widths = [1280,1920,2560] if name == 'composition' else [640,1280] if name == 'fog' else [1280,2560]
        for width in widths:
            scaled = image.resize((width, width * 9 // 16), Image.Resampling.LANCZOS)
            stem = 'title' if name == 'composition' else name
            scaled.save(UI / f'{stem}-{width}.webp', quality=86, method=6)
            if width == 1280:
                if name == 'composition':
                    scaled.convert('RGB').save(UI / f'title-{width}.jpg', quality=87, optimize=True)
                else:
                    if name == 'hero':
                        scaled.save(UI / f'{name}-{width}.png', optimize=True)
                    else:
                        scaled.quantize(colors=256,method=Image.Quantize.FASTOCTREE).save(UI / f'{name}-{width}.png', optimize=True)
ending = ROOT / next((a.split('=',1)[1] for a in sys.argv if a.startswith('--ending=')), 'artifacts/nextgen/u10-rounds/ending/composition.png')
if ending.exists():
    image = Image.open(ending).convert('RGB')
    for width in [1280,1920]:
        scaled = image.resize((width,width*9//16),Image.Resampling.LANCZOS)
        scaled.save(UI / f'ending-{width}.webp',quality=86,method=6)
        if width==1280:scaled.save(UI / 'ending-1280.jpg',quality=87,optimize=True)
