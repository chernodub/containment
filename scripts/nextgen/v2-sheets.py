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
# A focused, self-contained index makes the sixteen requested sheets easy to review.
import base64,html,io
cards=[]
for rig,ids in rigs.items():
 for id in ids:
  path=out/f'v2-{id}-awakening-bay.png'
  if not path.exists():continue
  im=Image.open(path).convert('RGB');im.thumbnail((640,390));buffer=io.BytesIO();im.save(buffer,format='JPEG',quality=84)
  data=base64.b64encode(buffer.getvalue()).decode()
  cards.append(f'<figure><h2>{html.escape(id)}</h2><a href="{html.escape(path.name)}"><img src="data:image/jpeg;base64,{data}" alt="{html.escape(id)} seven-phase sheet"></a></figure>')
(out/'index.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>Containment ability sheets</title><style>body{background:#081219;color:#dceaf0;font:16px system-ui;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(560px,1fr));gap:20px}figure{margin:0}h2{font-size:18px}img{width:100%;height:auto}a{color:#9fe8ff}</style><h1>Sixteen ability timelines</h1><p>Press/cast → anticipation → impact → +150ms → +600ms → lingering → expiry. Click a sheet for its full PNG.</p><main>'+''.join(cards)+'</main></html>')
