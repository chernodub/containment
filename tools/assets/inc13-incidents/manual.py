"""An electrical flash has collapsed the port half of the hand-control dais."""
import math,sys
from pathlib import Path
import bmesh
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'p11-set-pieces'))
import p11lib as L
from compact_uv import compact_uv
L.reset_scene()
L.asset('burned-manual-dais',12000)
L.slab('Dais foundation',[(-2.22,-.62),(-2.07,-.83),(1.97,-.83),(2.21,-.60),
       (2.21,.64),(2.04,.80),(-2.07,.80),(-2.22,.6)],0,.17,'e9-dark',.04)
# Each girder shows the same thermal sag. Far-right quadrants still follow the
# original rise of the desk; port controls have melted around their cable bed.
for x in (-1.96,-1.24,-.51,.25,1.01,1.83):
    h=.52+1.04*(x+2)/4
    L.profile_x('Deformed support web',[(-.63,.16),(.63,.16),(.63,h+.17),(-.22,h),
                (-.66,h-.12),(-.41,.36)],x-.08,x+.08,'p11-steel',.023)
bm=bmesh.new();rows=[]
for i in range(14):
    x=-2.14+i*.327
    h=.62+1.01*(x+2.14)/4.25+(.14*math.sin(i*2.2) if i<7 else 0)
    rows.append([bm.verts.new((x,y,h+dz)) for y,dz in
                 [(.76,.10),(.32,.20),(-.13,.08),(-.66,-.05),(-.76,-.27)]])
for i in range(13):
    for j in range(4):
        if i in (2,3,4) and j in (1,2):continue
        bm.faces.new([rows[i][j],rows[i+1][j],rows[i+1][j+1],rows[i][j+1]])
L.mesh_object('Slumped switch desk',bm,'e9-body',.012,smooth=False)
for i in range(5):
    x=-1.92+i*.19
    L.sweep('Blistered wiring loom',[(x,.48,.86),(x+.09,.31,.54),(x+.05,-.13,.43),
            (x+.21,-.69,.58),(x+.10,-.82,.35)],.035,'p11-rubber',6)
# Big hand wheel sector has stopped hard against its pawl. One of the paired
# lever cheeks remains upright; its opposite has folded across the slot.
for x in (.70,1.17):
    L.profile_x('Quadrant cheek',[(-.52,1.32),(.41,1.52),(.40,1.79),(.03,1.92),
                (-.31,1.87),(-.52,1.63)],x-.041,x+.041,'e9-trim',.018)
L.cylinder('Lever shaft',(.93,-.04,1.57),.11,.79,'p11-steel','X',14)
L.sweep('Jammed lever',[(.94,-.04,1.57),(.78,-.23,1.98),(.55,-.44,2.38)],.08,'p11-steel',8)
L.cylinder('Two-hand control grip',(.55,-.44,2.38),.11,.82,'p11-rubber','X',12)
L.box('Broken detent pawl',(.69,-.37,1.83),(.43,.20,.12),'p11-steel',.022,rotation=(0,.35,.23))
L.stencil('MANUAL',(1.28,-.69,1.35),.10,'-Y')
# A badly warped copper contactor cage is visible where the switchboard skin
# melted through. Long droplets follow gravity from the torn lower lip.
for i in range(4):
    x=-1.69+i*.23
    L.sweep('Buckled bus bar',[(x,.35,.70),(x-.08,.23,.89),(x-.05,-.09,.98),(x+.03,-.40,.66)],
            .043,'p11-tint-metal',6,tint='#85776a')
    L.lathe('Frozen metal drip',[(.013,-.16-.08*(i%3)),(.045,-.09),(.066,0),(.032,.04)],
            (x,-.72,.57+i*.044),'p11-steel',7)
L.torus('Broken travel quadrant',(.95,-.03,1.60),.41,.038,'p11-steel','X',20,6)
for i in range(5):
    L.box('Bakelite selector', (1.39+.13*i,-.19,1.57+.036*i),(.085,.15,.07),'p11-rubber',.012)
# The conduit is sheared off its saddle; exposed conductor tips flank the arc.
for y in (-.21,.03):
    L.sweep('Conduit from rear panel',[(-1.83,y,.65),(-2.10,y,1.06),(-2.24,y,1.41),
            (-2.47,y,1.61)],.097,'p11-steel',8)
    L.sweep('Conduit stripped end',[(-2.47,y,1.61),(-2.60,y,1.65)],.036,'p11-tint-metal',6,tint='#aba089')
L.sweep('Blown return trunk',[(-3.1,0,.08),(-3.26,0,.35),(-3.17,0,.98),(-2.91,0,1.34)],.12,'e9-dark',8)
L.cylinder('Lamp mast',(1.79,.60,1.45),.072,2.6,'p11-steel','Z',10)
L.box('Emergency hood',(1.60,.54,2.78),(.81,.45,.19),'e9-body',.045)
L.lamp_strip('Hard emergency lamp',(1.60,.30,2.72),.63,'X','p11-screen',.06,.065)
# Chair thrown toward port, back with a bent neck, seat resting on its side.
L.box('Overturned seat',(-3.30,-1.06,.46),(.80,.15,.78),'p11-rubber',.086,rotation=(.31,.31,.43))
L.box('Operator chair back',(-3.82,-1.02,.41),(.16,.73,.76),'p11-rubber',.08,rotation=(0,-.56,-.21))
L.sweep('Bent chair spine',[(-3.25,-.98,.30),(-3.71,-.96,.19),(-3.83,-1.01,.42)],.055,'p11-steel',7)
for i in range(5):
    a=math.tau*i/5
    L.sweep('Chair caster leg',[(-2.88,-1.07,.32),(-2.71,-1.07+.36*math.cos(a),.41+.34*math.sin(a))],.038,'p11-steel',6)
out=L.ROOT/'public/assets/inc13/manual'
L.export('inc13-manual',out,'dais.glb','Half-melted manual station, torn supply conduit and thrown chair.',
         'blender -b -P tools/assets/inc13-incidents/manual.py')
compact_uv(out/'dais.glb',out/'manifest.json')
