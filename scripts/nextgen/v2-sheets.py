"""Assemble reviewable animation sheets without changing captured pixels."""
import sys,json
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(sys.argv[1]);out=root/'sheets';out.mkdir(exist_ok=True)
m=json.loads((root/'manifest.json').read_text());groups={}
for shot in m['shots']:groups.setdefault(shot['scenario']+'-'+str(shot.get('room') or ''),[]).append(shot)
thumbw,thumbh=640,360
for key,shots in groups.items():
 cols=min(3,len(shots));rows=(len(shots)+cols-1)//cols
 sheet=Image.new('RGB',(cols*thumbw,rows*(thumbh+30)),'#081219');d=ImageDraw.Draw(sheet)
 for i,s in enumerate(shots):
  x=(i%cols)*thumbw;y=(i//cols)*(thumbh+30)
  im=Image.open(root/s['file']);im.thumbnail((thumbw,thumbh));sheet.paste(im,(x,y))
  d.text((x+8,y+thumbh+6),f"{key} | frame {s['frame']} | simulation {s['simulationMs']}ms",fill='white')
 sheet.save(out/(key.replace(':','-')+'.png'))
# Every first impact frame in one contact sheet to compare the visual vocabulary.
keys=list(groups);overview=Image.new('RGB',(4*480,((len(keys)+3)//4)*290),'#081219');d=ImageDraw.Draw(overview)
for i,key in enumerate(keys):
 shots=groups[key];s=shots[min(2,len(shots)-1)];im=Image.open(root/s['file']);im.thumbnail((480,270));x=i%4*480;y=i//4*290;overview.paste(im,(x,y));d.text((x+8,y+273),key,fill='white')
overview.save(out/'overview.png')
print(f'{len(groups)} sheets: {out.resolve()}')
