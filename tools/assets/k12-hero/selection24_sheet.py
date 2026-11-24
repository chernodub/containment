"""Compare the shipped and revised portraits on a common background."""
import io
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

output = Path('artifacts/nextgen/portrait24-after')
output.mkdir(parents=True, exist_ok=True)
source = Path('public/assets/ui/studio')
font = ImageFont.load_default(size=20)
background = (17, 29, 36)
tile = 320
sheet = Image.new('RGB', (tile * 6, 4 * (tile + 30) + 46), background)
draw = ImageDraw.Draw(sheet)
text_colour = (224, 229, 234)

for column, medium in enumerate(('Outline', 'Greyscale', 'Colour')):
    for edition, label in enumerate(('Shipped', 'PORTRAIT24')):
        draw.text(((2 * column + edition) * tile + 14, 12), f'{label} · {medium}', font=font, fill=text_colour)

for row, rig in enumerate(('breacher', 'cryo', 'pyro', 'arc')):
    current = source / f'portrait-{rig}.png'
    shipped = subprocess.check_output(['git', 'show', f'f4212bf2:{current}'])
    y = row * (tile + 30)
    draw.text((12, y + 47), rig.title(), font=font, fill=text_colour)
    for column, file in enumerate((io.BytesIO(shipped), current)):
        image = Image.open(file).convert('RGBA')
        alpha = image.getchannel('A')
        outline = Image.new('RGB', image.size, (177, 186, 192))
        outline.paste((6, 10, 12), (0, 0, *image.size), alpha.point(lambda a: 255 if a > 150 else 0))
        colour = Image.new('RGB', image.size, background)
        colour.paste(image, mask=alpha)
        for index, layer in enumerate((outline, ImageOps.grayscale(colour), colour)):
            thumb = layer.resize((tile, tile), Image.Resampling.LANCZOS)
            sheet.paste(thumb, ((index * 2 + column) * tile, y + 74))
sheet.save(output / 'rig-comparison.png', optimize=True)

for name in ('rig-select', 'rig-select-cryo', 'rig-select-pyro', 'rig-select-arc', 'rig-inspect-open', 'play22-death'):
    screenshot = Image.open(output / f'{name}.png')
    screenshot.resize((480, 270), Image.Resampling.LANCZOS).save(output / f'{name}-480.png')
