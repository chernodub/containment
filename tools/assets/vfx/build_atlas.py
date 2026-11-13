"""Reproducible V6 atlas. Pillow + NumPy; run from repo root, never from sources.

CC0 source flipbooks are already retained in public/assets/vfx. Optional Kenney
PNG data is read from the isolated, ignored mirror extraction. Output is data only.
RGBA 2048², 16x16 tiles, 2px transparent gutters; 124px usable image/tile.
Original procedural textures are repository-MIT, independently of CC0 inputs.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import hashlib, json, math
ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT/'public/assets/vfx/containment-v6'
OUT.mkdir(parents=True, exist_ok=True)
SIZE, TILE, PAD = 2048, 128, 2
atlas = Image.new('RGBA', (SIZE,SIZE))
frames, sources = {}, []
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def place(index, im):
    im=im.convert('RGBA').resize((124,124), Image.Resampling.LANCZOS)
    atlas.paste(im, ((index%16)*TILE+PAD,(index//16)*TILE+PAD))
def source_sequence(name, cols, rows, first, count):
    path=ROOT/'public/assets/vfx'/f'{name}.png'
    im=Image.open(path).convert('RGBA'); w,h=im.width//cols,im.height//rows
    sources.append(dict(name=name, file=str(path.relative_to(ROOT)), sha256=sha(path), license='CC0-1.0', author='Thomas Iche / Unity Labs Paris', source='https://unity.com/blog/engine-platform/free-vfx-image-sequences-flipbooks'))
    frames[name]=dict(first=first,count=count,fps=24 if name!='WispySmoke02' else 18)
    for i in range(count):
        cell=im.crop(((i%cols)*w,(i//cols)*h,(i%cols+1)*w,(i//cols+1)*h))
        # Slight banding of radiance only; alpha stays continuous at silhouette.
        a=np.array(cell,dtype=np.float32)
        a[:,:,:3]=a[:,:,:3]*.62 + np.round(a[:,:,:3]/42.5)*42.5*.38
        place(first+i, Image.fromarray(np.uint8(np.clip(a,0,255))))
source_sequence('Flame02',16,4,0,64)
source_sequence('WispySmoke02',8,8,64,64)
source_sequence('Explosion01',5,5,128,25)
# Coherent offline fractal-noise fields, with deterministic lattice interpolation.
y,x=np.mgrid[-1:1:complex(124),-1:1:complex(124)]
r=np.hypot(x,y); theta=np.arctan2(y,x)
def noise(seed,scale=8):
    rng=np.random.default_rng(seed)
    a=Image.fromarray(np.uint8(rng.random((scale,scale))*255))
    return np.asarray(a.resize((124,124),Image.Resampling.BICUBIC),dtype=float)/255
n=noise(1729,9)*.55+noise(2718,23)*.3+noise(3141,47)*.15
def gray(a,lum=1):
    a=np.clip(a,0,1); out=np.zeros((124,124,4),dtype=np.uint8)
    value=np.clip(lum*255,0,255)
    out[:,:,:3]=value if np.isscalar(value) else value[:,:,None]
    out[:,:,3]=np.uint8(a*255)
    return Image.fromarray(out)
def pattern(name,index,im,count=1):
    frames[name]=dict(first=index,count=count,fps=16)
    place(index,im)
# Offline texture masks for analytic-footprint-preserving presentation.
pattern('glow',153,gray(np.maximum(0,1-r)**3))
pattern('ember',154,gray(np.exp(-(x*x*12+y*y*2.8))*np.maximum(0,1-r)))
pattern('star',155,gray(np.clip(np.maximum(0,1-r)*.35 + np.exp(-abs(x)*38-abs(y)*2)+np.exp(-abs(y)*38-abs(x)*2),0,1)*np.maximum(0,1-r)))
pattern('frost',156,gray(np.maximum(0,.8-r)*np.maximum(0,(n-.32)*1.4)+np.maximum(0,1-r)*np.maximum(0,1-abs(np.sin(theta*11+r*17)))*.2))
# Facet field is authored offline: unequal Voronoi grains and fractured veins.
rng=np.random.default_rng(615)
points=rng.uniform(-1.3,1.3,(22,2)); ds=np.stack([(x-p[0])**2+(y-p[1])**2 for p in points])
sort=np.sort(ds,axis=0); cells=np.argmin(ds,axis=0)
facets=.16+(cells%5)*.14+np.exp(-(sort[1]-sort[0])*45)*.35
pattern('crystal',157,gray(np.ones_like(x),facets))
# Crack / soot decals preserve circular support and irregular quiet centers.
crack=np.zeros_like(x)
for i in range(9):
    a=i*2.399963; along=x*math.cos(a)+y*math.sin(a); across=-x*math.sin(a)+y*math.cos(a)
    bend=np.sin(along*7+i)*.025+np.maximum(0,along-.4)*math.sin(i)*.23
    crack=np.maximum(crack,np.exp(-abs(across-bend)*95)*(along>.08)*(along<.7+(i%3)*.09))
pattern('crack',158,gray(crack*np.maximum(0,1-r*.9)))
pattern('scorch',159,gray(np.clip((n*.8+.32-r)*1.2,0,.8),.035))
pattern('ring',160,gray(np.exp(-((r-.77)*25)**2)*np.clip(n*1.6,.1,1)))
pattern('caustic',161,gray(np.exp(-abs(n-.5)*26)*.7))
hexagon=np.maximum(abs(x)*.866+abs(y)*.5,abs(y)); hexline=np.exp(-abs((hexagon*5)%1-.5)*28)
pattern('hex',162,gray(hexline*.8+.055))
pattern('scan',163,gray((np.exp(-abs((y*11)%1-.5)*20)*.6+.05)*(1-abs(x)*.08)))
pattern('snow',164,gray(np.maximum(0,1-r)**1.6*(.2+np.maximum(0,n-.47)*7)))
pattern('shard',165,gray(np.maximum(0,1-(abs(x)*1.9+abs(y)*.68))**.45,.45+np.maximum(0,x)*.55))
# Eight driven mist frames: offline advected noise, with a broken trailing edge.
for i in range(8):
    cloud=np.roll(n,i*7,axis=1); envelope=np.maximum(0,1-(x*x*.83+y*y*1.5))
    place(168+i,gray(np.clip(cloud-.23,0,1)*envelope**1.4*1.4))
frames['mist']=dict(first=168,count=8,fps=16)
# Eight bolt strips have unequal branches, authored at high resolution and reduced.
for i in range(8):
    rng=np.random.default_rng(800+i); im=Image.new('RGBA',(496,496)); draw=ImageDraw.Draw(im)
    ys=np.linspace(20,476,13); xs=248+rng.uniform(-64,64,13); xs[[0,-1]]=248
    pts=list(zip(xs,ys))
    draw.line(pts,fill=(160,160,160,180),width=14)
    draw.line(pts,fill=(255,255,255,255),width=5)
    for j in (3,6,9):
        side=1 if j%2 else -1
        draw.line([(xs[j],ys[j]),(xs[j]+side*65,ys[j]+27),(xs[j]+side*90,ys[j]+60)],fill=(215,215,215,210),width=4)
    place(176+i,im)
frames['bolt']=dict(first=176,count=8,fps=24)
# Pack artist-authored particles if the explicitly verified CC0 mirror is available.
kenney=ROOT/'tools/assets-src/kenney-mirror-v6/extracted'
chosen=[]
for names,index,alias in [(['spark_01.png','spark_02.png'],184,'kenney-spark'),(['star_04.png','star_01.png'],185,'kenney-star'),(['smoke_01.png','smoke_02.png'],186,'kenney-smoke'),(['circle_05.png','circle_01.png'],187,'kenney-ring')]:
    found=None
    for name in names:
        candidates=list(kenney.rglob(name)) if kenney.exists() else []
        if candidates: found=candidates[0]; break
    if found:
        pattern(alias,index,Image.open(found)); chosen.append(dict(name=alias,file=str(found.relative_to(ROOT)),sha256=sha(found),license='CC0-1.0',author='Kenney',source='https://kenney.nl/assets/particle-pack'))
assert len(chosen)==4, "Restore the verified Kenney data before regenerating this atlas"
sources+=chosen
# Lossless PNG compression, no random dithering. One shipped atlas/set.
path=OUT/'elements.png'; atlas.save(path,optimize=True,compress_level=9)
manifest=dict(version=1,width=SIZE,height=SIZE,columns=16,tile=TILE,gutter=PAD,frames=frames,sources=sources,output=dict(file='elements.png',bytes=path.stat().st_size,sha256=sha(path)))
assert path.stat().st_size<=3_000_000
(OUT/'atlas.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest['output']))
