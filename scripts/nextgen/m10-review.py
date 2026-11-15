#!/usr/bin/env python3
"""Native-registered silhouette IoU and exact-quarter motion review sheets."""
import json, sys
from pathlib import Path
from PIL import Image, ImageDraw
root = Path(sys.argv[1])
m = json.loads((root/'manifest.json').read_text())

def masks(shot):
    im = Image.open(root/'masks'/shot['file']).convert('L')
    w,h = shot['cellWidth'],shot['cellHeight']; origin=shot['unionCrop']
    result=[]
    for i in range(len(shot['clock'])):
        tile=im.crop(((i%shot['columns'])*w,(i//shot['columns'])*h,(i%shot['columns']+1)*w,(i//shot['columns']+1)*h))
        box=tile.getbbox()
        if not box: result.append(set());continue
        cropped=tile.crop(box);cw=cropped.width
        result.append({(n//cw+box[1]+origin['top'])*1920+(n%cw+box[0]+origin['left']) for n,v in enumerate(cropped.tobytes()) if v>127})
    return result

def iou(a,b):
    return len(a&b)/max(1,len(a|b))

by = {(s['subject'],s['action']):s for s in m['shots']}
idle_masks={(subject,action):masks(s)[len(s['clock'])//2] for (subject,action),s in by.items() if action=='idle' or action.startswith('idle-')}
rows=[]; peaks={}
for s in m['shots']:
    subject,action=s['subject'],s['action']; rig='breacher'
    for group,kind in zip([['frost-trail','cryo-nova','glacier','whiteout'],['afterburn','flashfire','napalm-charge','meltdown'],['static-step','overload','tesla-pylon','overclock']],['cryo','pyro','arc']):
        if action.removeprefix('cast-') in group:rig=kind
    idle=idle_masks.get((subject,'idle' if rig=='breacher' else 'idle-'+rig))
    if not idle: continue
    reference=idle; samples=masks(s)
    values=[iou(reference,a) for a in samples]
    windows={}
    if action=='attack':
        duration=s['presentationInputs']['attackWindupMs']
        windows={'anticipation':[i for i,t in enumerate(s['clock']) if t<duration],
                 'strike':[i for i,t in enumerate(s['clock']) if duration<=t<=duration+160]}
    else: windows={'peak':list(range(len(values)))}
    result={}
    for name,indices in windows.items():
        if not indices: continue
        peak=min(indices,key=lambda i:values[i]); result[name]={'iou':round(values[peak],4),'frame':peak,'ms':s['clock'][peak]}
        if name=='peak' and action.startswith('cast-'):peaks[(subject,action)]=samples[peak]
    threshold=.80 if action=='hit' else .75 if action.startswith('cast-') or action=='heavy-hit' else .88 if action=='light-hit' else None
    rows.append({'subject':subject,'action':action,'threshold':threshold,'peaks':result})

pairs=[]
rig_groups=[['ram','seismic-slam','bulwark','railbreaker'],['frost-trail','cryo-nova','glacier','whiteout'],['afterburn','flashfire','napalm-charge','meltdown'],['static-step','overload','tesla-pylon','overclock']]
for group in rig_groups:
    for n,a in enumerate(group):
        for b in group[n+1:]:
            if ('marine','cast-'+a) in peaks and ('marine','cast-'+b) in peaks:
                value=iou(peaks[('marine','cast-'+a)],peaks[('marine','cast-'+b)])
                pairs.append({'a':a,'b':b,'iou':round(value,4),'threshold':.85})
(root/'iou.json').write_text(json.dumps({'method':'Absolute native pixel registration; mask=RGB difference>12 from flat render background; no translation/scale fitting. Idle=middle same-rig idle frame. Peak=min IoU within declared phase.','rows':rows,'castPairs':pairs},indent=2)+'\n')
q=root/'quarter';q.mkdir(exist_ok=True)
for s in m['shots']:
    im=Image.open(root/s['file']); im.resize((max(1,im.width//4),max(1,im.height//4)),Image.Resampling.BOX).save(q/s['file'])
for subject in sorted({s['subject'] for s in m['shots']}):
    shots=[s for s in m['shots'] if s['subject']==subject]
    for start in range(0,len(shots),8):
        selected=shots[start:start+8];images=[Image.open(q/s['file']) for s in selected]
        board=Image.new('RGB',(max(im.width for im in images)+12,sum(im.height+24 for im in images)),'#11181d');draw=ImageDraw.Draw(board);y=0
        for s,im in zip(selected,images):draw.text((4,y+3),s['action'],fill='white');board.paste(im,(4,y+22));y+=im.height+24
        board.save(q/f'{subject}-contact-{start//8+1}.png')
print(json.dumps({'rows':rows,'castPairs':pairs}))
