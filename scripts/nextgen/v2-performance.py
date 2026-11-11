"""Summarize matched real-RAF stress receipts; submission timing is not GPU time."""
import json
from pathlib import Path
from PIL import Image,ImageDraw
out=Path('artifacts/nextgen/v2-final');out.mkdir(parents=True,exist_ok=True)
rows=[]
for label in ['v2-before-stress','v2-after-stress']:
 p=Path('artifacts/nextgen')/label/'manifest.json'
 if not p.exists():continue
 m=json.loads(p.read_text())
 for shot in m['shots']:
  if shot['frame']!=1:continue
  e=shot['evidence']['kitingProof'];perf=e['performance'];rows.append(dict(revision=label,rig=e['rig'],tier=e['tier'],frame=perf['frameMs']['average'],frameP95=perf['frameMs']['p95'],update=perf['updateMs']['average'],render=perf['renderSubmissionMs']['average'],draws=perf['drawCalls'],lights=e.get('peakObservedLights'),instances=e.get('peakObservedInstances'),kit=e.get('instances'),staged=e['stagedEnemies'],remaining=e['remainingEnemies'],programs=e['programs'],samples=perf['samples']))
(out/'performance.json').write_text(json.dumps(rows,indent=2)+'\n')
lines=['| Rig / tier | Before → V2 frame avg ms | Before → V2 render JS ms | Draws | Peak lights | Peak instances |', '|---|---:|---:|---:|---:|---:|']
for rig in ['breacher','cryo','pyro','arc']:
 for tier in ['high','low']:
  pair=[next((r for r in rows if r['revision']==label and r['rig']==rig and r['tier']==tier),None) for label in ['v2-before-stress','v2-after-stress']]
  if not all(pair):continue
  a,b=pair
  lines.append(f"| {rig} / {tier} | {a['frame']:.3f} → {b['frame']:.3f} | {a['render']:.3f} → {b['render']:.3f} | {a['draws']} → {b['draws']} | {a['lights']} → {b['lights']} | {a['instances']} → {b['instances']} |")
(out/'performance-table.md').write_text('\n'.join(lines)+'\n')
image=Image.new('RGB',(1200,660),'#0a151d');d=ImageDraw.Draw(image)
d.text((30,20),'25-enemy staged fight: observed CPU update + render submission (ms)',fill='white')
d.text((30,44),'Real RAF / 120 samples / M1 Pro Metal / concurrent external stream load; not GPU or worst-case certification',fill='#a7bbc8')
for i,(rig,tier) in enumerate((r,t) for r in ['breacher','cryo','pyro','arc'] for t in ['high','low']):
 y=90+i*66;d.text((28,y+15),rig+' / '+tier,fill='white')
 for j,label in enumerate(['v2-before-stress','v2-after-stress']):
  r=next((r for r in rows if r['revision']==label and r['rig']==rig and r['tier']==tier),None)
  if not r:continue
  value=r['update']+r['render'];width=min(780,value*45);color=['#567385','#ffb454'][j]
  d.rectangle((190,y+j*23,190+width,y+j*23+16),fill=color);d.text((195+width,y+j*23+2),f'{value:.2f}',fill='white')
d.text((950,625),'Blue: interim   Amber: V2',fill='white')
image.save(out/'performance.png')
print('\n'.join(lines))
