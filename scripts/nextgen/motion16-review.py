"""Pair reviewed native poses and room views with their MOTION14 counterparts."""
from pathlib import Path
import json
import sys
from PIL import Image, ImageDraw, ImageOps

root = Path('artifacts/nextgen/motion16')
current = Path(sys.argv[1])
references = [Path('artifacts/nextgen/motion14/after/final'), root/'supplement']
baselines = {}
for directory in references:
    manifest = directory/'manifest.json'
    if manifest.exists():
        for row in json.loads(manifest.read_text())['shots']:
            baselines.setdefault(row['file'], (directory, row))
for row in json.loads((current/'manifest.json').read_text())['shots']:
    file = row['file']
    if row['action'] == 'idle' or file not in baselines:
        continue
    before, old = baselines[file]
    rows = [(old, Image.open(before/file)), (row, Image.open(current/file))]
    for divisor, folder in [(1, 'native'), (4, 'quarter')]:
        left=min(r['unionCrop']['left'] for r,_ in rows)
        top=min(r['unionCrop']['top'] for r,_ in rows)
        w=(max(r['unionCrop']['left']+r['cellWidth'] for r,_ in rows)-left+divisor-1)//divisor
        h=(max(r['unionCrop']['top']+r['cellHeight'] for r,_ in rows)-top+divisor-1)//divisor
        out = Image.new('RGB', (w*10, (h+13)*6), '#293439')
        labels = ImageDraw.Draw(out)
        for j,(r,im) in enumerate(rows):
            cw,ch = r['cellWidth'],r['cellHeight']
            for i in range(min(30,len(r['clock']))):
                x,y=i%4*cw,i//4*ch
                tile=im.crop((x,y,x+cw,y+ch)).resize((cw//divisor,ch//divisor),Image.Resampling.BOX)
                tx,ty=i%10*w,(i//10*2+j)*(h+13)
                out.paste(tile,(tx+(r['unionCrop']['left']-left)//divisor,ty+(r['unionCrop']['top']-top)//divisor))
                labels.text((tx,ty+h),str(i+1),fill='white')
        dest=current/'pairs'/folder
        dest.mkdir(parents=True,exist_ok=True)
        out.save(dest/file)
for p in (current/'scenes').glob('*.webp'):
    # The early Stalker lane had a full-health marked animal.
    if current.name=='r1' and p.stem=='pack-stalker': continue
    before=root/'matched/scenes'/p.name
    if not before.exists(): before=root/'crowd-follow/scenes'/p.name
    if not before.exists(): before=root/'crowd-before/scenes'/p.name
    if not before.exists(): before=root/'supplement/scenes'/p.name
    if not before.exists(): continue
    a,b=Image.open(before),Image.open(p)
    for gray in (False, True):
        out=Image.new('RGB',(1920,270*16))
        for i in range(32):
            x,y=i%4*480,i//4*270
            for j,im in enumerate([a,b]):
                tile=im.crop((x,y,x+480,y+270))
                out.paste(ImageOps.grayscale(tile) if gray else tile,(x,y*2+j*270))
        dest=current/'pairs'/'room'
        dest.mkdir(parents=True,exist_ok=True)
        out.save(dest/(p.stem+('-gray' if gray else '')+'.webp'),quality=93)
    if p.stem in ('pack-crawler', 'pack-stalker'):
        # Keep the full 480px camera frame so a reader can judge the miss
        # and locate the wounded animal among all five moving bodies.
        death = 20 if p.stem == 'pack-crawler' else 18
        frames = ((3, 'Deck pass'), (8, 'Surviving contact'), (12, 'Next stride'), (death, 'Lethal contact'))
        out = Image.new('RGB', (4*480, 2*288), '#293439')
        labels = ImageDraw.Draw(out)
        for j, im in enumerate((a, b)):
            for col, (frame, label) in enumerate(frames):
                x, y = (frame-1)%4*480, (frame-1)//4*270
                labels.text((col*480+6, j*288+2), f'{"Before" if j == 0 else "After"}  F{frame}  {label}')
                out.paste(im.crop((x, y, x+480, y+270)), (col*480, j*288+18))
        out.save(dest/(p.stem+'-contacts.webp'), quality=95)

# Three consecutive camera cells during the authored hold, paired against
# the same wounded native targets in the pre-edit build.
for rig,first in [('breacher',7),('pyro',7),('arc',2),('cryo',2)]:
    before=root/'matched/overdrives'/(rig+'.webp')
    after=current/'overdrives'/(rig+'.webp')
    if not before.exists() or not after.exists(): continue
    out=Image.new('RGB',(1440,540))
    for row,path in enumerate([before,after]):
        im=Image.open(path)
        for col,i in enumerate(range(first,first+3)):
            x,y=i%4*480,i//4*270
            out.paste(im.crop((x,y,x+480,y+270)),(col*480,row*270))
    directory=current/'pairs'/'overdrives'
    directory.mkdir(exist_ok=True,parents=True)
    out.save(directory/(rig+'.webp'),quality=95)
