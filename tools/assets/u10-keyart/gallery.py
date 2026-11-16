"""Assemble existing KA12 review images, without modifying or judging sources."""
from pathlib import Path
import shutil
from html import escape
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'artifacts/nextgen/ka12-final'
OUT.mkdir(parents=True,exist_ok=True)
for n in range(1,6):
    source=ROOT/f'artifacts/nextgen/u10-rounds/{n+10}'
    dest=OUT/f'title/round-{n}'
    for name in ('composition.png','480.png'):
        if (source/name).exists():
            dest.mkdir(parents=True,exist_ok=True)
            shutil.copy2(source/name,dest/name)
sections=[]
def section(title,items,note=''):
    cards=[]
    for label,path in items:
        path=Path(path)
        if not path.exists(): continue
        rel=path.relative_to(OUT).as_posix()
        cards.append(f'<figure><a href="{escape(rel)}"><img loading="lazy" src="{escape(rel)}" alt="{escape(label)}"></a><figcaption>{escape(label)} · {path.stat().st_size:,} bytes</figcaption></figure>')
    if cards: sections.append(f'<section><h2>{escape(title)}</h2><p>{escape(note)}</p><div class="grid">'+''.join(cards)+'</div></section>')
section('Before',[(name,OUT/f'before/{name}-1920.webp') for name in ('title','ending')],'Previous shipping image assets, not screenshots of the full interface.')
section('Reference title screenshot', [('User supplied baseline', OUT/'before/current-title.png')])
section('Final title delivery', [(p.stem,p) for p in sorted((OUT/'title/final').glob('*.png'))])
for n in range(1,6):
    section(f'Title render round {n}',[(f'Round {n} full render',OUT/f'title/round-{n}/composition.png'),(f'Round {n} 480×270',OUT/f'title/round-{n}/480.png')],'Offline Cycles artwork. Review availability does not imply acceptance; see KA12-review.md.')
for n in range(1,4):
    section(f'Weapons round {n}',[(weapon,OUT/f'weapons/round-{n}/{weapon}-three-quarter.png') for weapon in ('pistol','rifle','shotgun','plasma','rocket')],'Offline asset beauty renders; round 3 uses baked shipping meshes. Native held-weapon contact is separate.')
for directory,title in [('native-weapons','Native weapon captures'),('ending','Ending renders'),('ui-1080','Final interface 1920×1080'),('ui-720','Final interface 1280×720')]:
    section(title,[(p.stem,p) for p in sorted((OUT/directory).rglob('*.png'))] if (OUT/directory).exists() else [])
(OUT/'index.html').write_text('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>KA12 art review</title><style>body{background:#11171d;color:#e4e9ec;font:16px system-ui;margin:32px}h1,h2{font-weight:600}p,figcaption{color:#aebdc8}section{margin:40px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:20px}figure{margin:0;background:#1c2630;padding:12px}img{width:100%;height:auto;display:block}figcaption{padding-top:10px}a{color:inherit}</style><h1>KA12 art review</h1><p>Original review images, retained before assets and native captures when available. Click any image for its source pixels. This gallery makes no performance or visual acceptance claim.</p>'+''.join(sections))
print(OUT/'index.html')
