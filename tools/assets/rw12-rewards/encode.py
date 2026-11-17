from PIL import Image
from pathlib import Path
root=Path(__file__).resolve().parents[3]
out=root/'public/assets/ui/rewards';out.mkdir(exist_ok=True,parents=True)
for p in (root/'artifacts/nextgen/rw12-work/rewards').glob('*.png'):
 im=Image.open(p);im.save(out/(p.stem+'.webp'),quality=88,method=6);im.save(out/p.name,optimize=True)
