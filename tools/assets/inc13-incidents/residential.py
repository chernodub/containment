"""The last cabin. Original MIT. Cabinet and bed jammed into a split pressure door."""
import math
import sys
from pathlib import Path
import bmesh

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'p11-set-pieces'))
import p11lib as L
from compact_uv import compact_uv

L.reset_scene()
L.asset('last-cabin', 12000)
# The missing bite starts high on the latch side and flares out toward the aisle.
def leaf(name, outline, face, finish):
    bm=bmesh.new()
    front=[bm.verts.new((x,face,z)) for x,z in outline]
    back=[bm.verts.new((x,face+.10,z)) for x,z in outline]
    bm.faces.new(front)
    bm.faces.new(list(reversed(back)))
    for i in range(len(front)):
        j=(i+1)%len(front)
        bm.faces.new([front[i],back[i],back[j],front[j]])
    L.mesh_object(name,bm,finish,.025,smooth=False)

leaf('Ripped leaf',[(-1.45,.03),(-.08,.03),(.05,.78),(-.39,.99),(-.21,1.11),
                    (-.64,1.42),(-.41,1.51),(-.78,1.75),(-.57,2.17),
                    (-.14,2.09),(-.12,2.74),(-1.45,2.74)],.38,'e9-trim')
leaf('Warped leaf',[(.18,.03),(1.45,.03),(1.45,2.74),(.15,2.74),(.27,2.28),
                    (.87,1.97),(.51,1.87),(.96,1.56),(.68,1.43),(.76,1.24),(.22,.96)],.34,'e9-body')
for x in (-1.60,1.60):
    L.box('Cabin jamb',(x,.51,1.41),(.21,.43,2.82),'e9-dark',.04)
L.box('Cabin lintel',(0,.50,2.83),(3.4,.46,.22),'e9-body',.05)
# Recesses give the intact right-hand stile a recognizable cabin-door section.
for z in (.38,1.02,2.40):
    L.box('Press-formed door rib',(1.18,.31,z),(.43,.055,.06),'p11-steel',.019)
L.box('Lock strike',(1.25,.275,1.48),(.16,.09,.30),'e9-dark',.026)
L.handle((1.25,.20,1.49),.25,axis='Z',face='-Y')
L.stencil('06',(-1.30,.36,2.22),.29,'-Y')
# A mattress sags between two intact ends of its tipped tubular bed frame.
for x in (-1.32,1.32):
    L.sweep('Bed end',[(x,-.87,.11),(x,-1,.25),(x,-.93,.60),(x,-.49,1.37),
                        (x,-.36,1.44),(x,-.24,1.36),(x,-.25,1.10)],.055,'p11-steel')
for y,z in ((-.95,.27),(-.37,1.35)):
    L.cylinder('Long side rail',(0,y,z),.055,2.72,'p11-steel','X',10)
for i in range(7):
    x=-1.15+i*.38
    L.sweep('Curved spring slat',[(x,-.93,.29),(x,-.80,.85),(x,-.37,1.33)],.046,'e9-trim',6)
L.box('Crushed mattress',(-.43,-.69,.78),(1.49,.27,1.19),'p11-tint',.105,
      rotation=(-.43,-.10,-.06),tint='#85968e')
for i in range(4):
    L.box('Quilt channels',(-.98+i*.34,-.835,.79),(.05,.03,.97),'p11-tint',.014,
          rotation=(-.43,-.10,-.06),tint='#637d78')
# Dent and gouges cross a locker that fell sideways against the bed.
L.box('Locker carcase',(.97,-.91,.49),(.75,.63,1.73),'e9-body',.052,rotation=(0,-.96,0))
L.box('Sprung locker door',(1,-1.26,.57),(.64,.055,1.64),'p11-tint-metal',.031,
      rotation=(-.14,-.96,-.05),tint='#7e8679')
for i in range(3):
    L.sweep('Parallel deep gouge',[(.22+i*.10,-1.31,.98),(.42+i*.10,-1.32,.81),
            (.74+i*.10,-1.37,.67)],.017,'e9-dark',4)
L.lamp_strip('Reading light',(-1.04,.24,2.58),.73,'X','e9-amber',.06,.065)
# Meal tray on the drop-leaf table beside the cabin.
L.box('Fold-out table',(-2.59,.04,.80),(1.40,.88,.12),'p11-tint',.067,tint='#897660')
for x in (-3.10,-2.08):
    L.box('Table support',(x,.22,.4),(.085,.13,.8),'e9-dark',.015)
for x,y in ((-2.89,.13),(-2.36,-.12)):
    L.lathe('Dinner bowl',[(.065,0),(.15,.05),(.18,.13),(.15,.135),(.095,.06)],(x,y,.87),'e9-ceramic',16)
    L.cylinder('Unfinished meal',(x,y,.945),.125,.012,'p11-tint','Z',12,tint='#787456')
    L.cylinder('Cup',(x+.23,y+.08,.98),.073,.21,'p11-steel','Z',10)
out=L.ROOT/'public/assets/inc13/residential'
L.export('inc13-residential',out,'cabin.glb','Split door, jammed spring bed, locker and family supper.',
         'blender -b -P tools/assets/inc13-incidents/residential.py')
compact_uv(out/'cabin.glb',out/'manifest.json')
