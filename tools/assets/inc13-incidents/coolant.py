"""Split jacket and frozen discharge main. Original MIT."""
import math
import sys
from pathlib import Path
import bmesh
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'p11-set-pieces'))
import p11lib as L
from compact_uv import compact_uv

L.reset_scene()
L.asset('frozen-header',12000)
# Open-ended jacket. Both fracture lips are jagged, with an exposed bore
# and curling strips of sheet metal on the outward-facing side.
for side in (-1,1):
    bm=bmesh.new()
    rings=[]
    for layer in range(6):
        ring=[]
        for i in range(24):
            a=math.tau*i/24
            tear=.48+.18*math.sin(5*a)+.12*math.cos(9*a)
            x=(3.75,1.6,tear+.20,tear,tear,3.75)[layer]
            r=(.49,.49,.53,.60,.42,.42)[layer]
            ring.append(bm.verts.new((side*x,r*math.cos(a),1.46+r*math.sin(a)+(.16 if side<0 else 0))))
        rings.append(ring)
    for layer in range(6):
        for i in range(24):
            j=(i+1)%24
            bm.faces.new([rings[layer][i],rings[layer][j],rings[(layer+1)%6][j],rings[(layer+1)%6][i]])
    L.mesh_object('Torn insulated pipe',bm,'p11-steel',smooth=False)
    for x in (.98,2.68):
        L.flange((side*x,0,1.46+(.16 if side<0 else 0)),.54,'X',.09,8)
    L.box('Saddle base',(side*2.68,0,.13),(.85,.99,.26),'e9-body',.055)
    L.profile_x('Saddle web',[(-.46,.26),(.46,.26),(.38,1.23),(-.38,1.23)],side*2.68-.13,side*2.68+.13,'e9-body',.028)
    # Frozen mineral teeth descend unevenly from the underside of each pipe.
    for i in range(15):
        x=side*(.64+i*.19); h=.23+.68*(.5+.5*math.cos(i*3.71))*(1-i/20)
        z=1.15+(.16 if side<0 else 0)
        L.lathe('Hanging icicle',[(.009,-h),(.064,-.25*h),(.103,0),(.065,.05)],
                (x,-.32,z),'p11-frost',6)
    for i in range(3):
        y=-.21+i*.19
        L.sweep('Burst liner',[(side*.8,y,1.24),(side*.57,y-.18,1.18),
                (side*.34,y-.31,1.07),(side*.25,y-.4,.97)],.064,'p11-frost',5)
# Two collapsed portable warning trestles at the downstream shoulder.
for x,y,angle in ((1.8,-1.13,-.24),(3.17,-1.43,.31)):
    L.box('Fallen warning blade',(x,y,.19),(.94,.45,.08),'p11-tint',.032,rotation=(.22,0,angle),tint='#a59d75')
    for side in (-1,1):
        L.sweep('Folded tubular leg',[(x+side*.32,y-.28,.06),(x+side*.42,y,.24),
                (x+side*.32,y+.28,.06)],.034,'e9-dark',6)
out=L.ROOT/'public/assets/inc13/coolant'
L.export('inc13-coolant',out,'header.glb','Split insulated main with torn liner, frozen teeth and collapsed warning trestles.',
         'blender -b -P tools/assets/inc13-incidents/coolant.py')
compact_uv(out/'header.glb',out/'manifest.json')
