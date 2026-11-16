"""Render rebuilt E9 packs with shared four-thread P11 review stage."""
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'tools/assets/p11-set-pieces'))
import p11lib as L
import bpy
pack=sys.argv[-1]
filename='kit.glb' if pack=='industrial' else pack+'.glb'
L.reset_scene()
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/assets/e9-ship-kit'/pack/filename))
names=[o.name for o in bpy.data.objects if o.get('originalAsset')]
only=next((a.split('=',1)[1].split(',') for a in sys.argv if a.startswith('--only=')),None)
if only: names=[n for n in names if n in only]
# Two staggered rows show each module, including its manufactured upper faces.
row1=names if only else names[:(len(names)+1)//2];row2=[] if only else names[len(row1):]
L.layout_row(row1,gap=.6,y=0)
L.layout_row(row2,gap=.6,y=6)
stage=L._stage
def modest_stage():
 scene=stage();scene.cycles.samples=16;return scene
L._stage=modest_stage
L.render(ROOT/'artifacts/nextgen/p11-final/beauty'/(f'e9-{pack}-'+('detail.png' if only else 'craft.png')),names,'hero',(1600,1000),scale=1.1)
