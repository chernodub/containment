"""File-only E9/E10 matched tour comparison, native crops and exact area480.
Usage: python review.py <raw capture> <output> [room,...]
"""
from pathlib import Path
from PIL import Image,ImageDraw
import sys,json
raw=Path(sys.argv[1]);out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
before=Path('/Users/chernodub/.t3/worktrees/containment-game/t3-84b6dc1b/artifacts/nextgen/e9-final/native')
rooms=sys.argv[3].split(',') if len(sys.argv)>3 else ['shielding-gate','coolant-plant','relay-racks']
for room in rooms:
 files=[f'room-tour-{room}-{i:02d}.png' for i in range(1,6)]
 board=Image.new('RGB',(2400,588),(15,20,24));d=ImageDraw.Draw(board)
 for i,name in enumerate(files):
  for row,source in enumerate([before,raw]):
   im=Image.open(source/name).convert('RGB');small=im.resize((480,270),Image.Resampling.BOX)
   board.paste(small,(i*480,row*294+24));d.text((i*480+8,row*294+5),('E9' if row==0 else 'E10')+f' / {room} / {i+1}',fill=(224,235,232))
   if row==1:small.save(out/name)
 board.save(out/f'tour-{room}.png')
 for file in raw.glob(f'g6-kiting-{room}-[0-9][0-9].png'):
  Image.open(file).convert('RGB').resize((480,270),Image.Resampling.BOX).save(out/file.name)
