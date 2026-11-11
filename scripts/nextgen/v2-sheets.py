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
  phases=['press / cast','anticipation','impact +30ms','impact +150ms','impact +600ms','lingering','expiry']
  phase=phases[min(i,6)] if key.startswith('v2-') and not any(v in key for v in ['full-','kit-','before-']) else f'frame {s["frame"]}'
  d.text((x+8,y+thumbh+6),f"{key} | {phase} | simulation {s['simulationMs']}ms",fill='white')
 sheet.save(out/(key.replace(':','-')+'.png'))
# Every first impact frame in one contact sheet to compare the visual vocabulary.
keys=list(groups);overview=Image.new('RGB',(4*480,((len(keys)+3)//4)*290),'#081219');d=ImageDraw.Draw(overview)
for i,key in enumerate(keys):
 shots=groups[key];s=shots[min(2,len(shots)-1)];im=Image.open(root/s['file']);im.thumbnail((480,270));x=i%4*480;y=i//4*290;overview.paste(im,(x,y));d.text((x+8,y+273),key,fill='white')
overview.save(out/'overview.png')
print(f'{len(groups)} sheets: {out.resolve()}')
rigs={'breacher':['ram','seismic-slam','bulwark','railbreaker'],'cryo':['frost-trail','cryo-nova','glacier','whiteout'],'pyro':['afterburn','flashfire','napalm-charge','meltdown'],'arc':['static-step','overload','tesla-pylon','overclock']}
for rig,ids in rigs.items():
 selected=[]
 for id in ids:
  hit=next((v for k,v in groups.items() if k in [f'v2-{id}-awakening-bay',f'ability:{id}-awakening-bay']),None)
  if hit:selected.append((id,hit))
 if not selected:continue
 sheet=Image.new('RGB',(7*320,len(selected)*205),'#081219');d=ImageDraw.Draw(sheet)
 for row,(id,shots) in enumerate(selected):
  for col,s in enumerate(shots[:7]):
   im=Image.open(root/s['file']);im.thumbnail((320,180));sheet.paste(im,(col*320,row*205));d.text((col*320+5,row*205+184),f'{id} | {s["simulationMs"]}ms',fill='white')
 sheet.save(out/f'{rig}-timeline.png')
