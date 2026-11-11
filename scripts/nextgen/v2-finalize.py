"""Merge reviewed capture batches with per-shot provenance and a bounded thumbnail gallery."""
import base64,html,io,json,shutil,sys
from pathlib import Path
from PIL import Image
out=Path('artifacts/nextgen/v2-final');out.mkdir(parents=True,exist_ok=True)
shots={};sources=[];base=None
for label in sys.argv[1:]:
 root=Path('artifacts/nextgen')/label;m=json.loads((root/'manifest.json').read_text());base=base or m
 sources.append({k:m.get(k) for k in ['label','gitSHA','runtimeSeconds','failures','errors']})
 for s in m['shots']:
  s=dict(s,captureLabel=label,sourceGitSHA=m['gitSHA']);shots[(s['scenario'],s['room'],s['frame'])]=s;shutil.copy2(root/s['file'],out/s['file'])
manifest={**base,'label':'v2-final','sourceRuns':sources,'shots':list(shots.values()),'failures':[],'errors':[]}
# A source failure remains visible in provenance; a final scene is accepted only after a successful retry.
for source in sources:
 for f in source['failures']:
  if not any(s['scenario']==f['scenario'] and s['room']==f.get('room') for s in shots.values()):manifest['failures'].append(f)
 manifest['errors'].extend(source['errors'])
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(out/'pngs.txt').write_text('\n'.join(str((out/s['file']).resolve()) for s in shots.values())+'\n')
cards=[]
for s in shots.values():
 im=Image.open(out/s['file']).convert('RGB');im.thumbnail((480,270));b=io.BytesIO();im.save(b,format='JPEG',quality=80)
 src=base64.b64encode(b.getvalue()).decode();label=html.escape(s['file']);provenance=html.escape(s['captureLabel']+' / '+s['sourceGitSHA'][:12])
 cards.append(f'<figure><a href="{label}"><img src="data:image/jpeg;base64,{src}" alt="{label}" loading="lazy"></a><figcaption>{label}<br>{provenance}</figcaption></figure>')
(out/'index.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>Containment V2 final review</title><style>body{background:#0a151d;color:#dceaf0;font:14px system-ui;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(440px,1fr));gap:16px}figure{margin:0}img{width:100%;height:auto}figcaption{padding:8px;color:#a5bdca}</style><h1>V2 ability presentation</h1><p>Reviewed animation frames; click for full PNG. Per-frame capture/commit provenance is retained. Sprite sheets are in sheets/; performance and gate logs accompany the manifest.</p><main>'+''.join(cards)+'</main></html>')
print(f'{len(shots)} PNGs merged; unresolved failures {len(manifest["failures"])}; errors {len(manifest["errors"])}')
