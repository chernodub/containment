"""Pack Blender bakes to bounded, lossless WebP maps; AO in R, roughness in G."""
from pathlib import Path
from PIL import Image
import hashlib,json
root=Path(__file__).resolve().parents[3]/'public/assets/e10-floors'
records=[]
for folder in root.iterdir():
 if not folder.is_dir():continue
 for file in folder.glob('*.png'):
  if file.stem=='ao':
   ao=Image.open(file).convert('L')
   # AO is intentionally soft; rough steel with restrained smoother wear.
   rough=ao.point(lambda x: int(214+(255-x)*.10))
   img=Image.merge('RGB',(ao,rough,Image.new('L',ao.size,0)))
   out=folder/'orm.webp'
  else:
   img=Image.open(file).convert('RGB');out=file.with_suffix('.webp')
  img.save(out,lossless=True,method=6)
  # Lower resolution source available for the inexpensive tier and offline use.
  img.resize((img.width//2,img.height//2),Image.Resampling.BOX).save(out.with_name(out.stem+'-low.webp'),lossless=True,method=6)
  file.unlink()
for file in sorted(root.rglob('*.webp')):
 records.append({'path':str(file.relative_to(root)),'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
(root/'manifest.json').write_text(json.dumps({'license':'MIT','author':'Containment original overhaul','generator':'tools/assets/e10-floors/bake.py','tileMetres':2.8,'variants':4,'textures':records},indent=2)+'\n')
