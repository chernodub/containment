"""Machinery buried under an outflow from a split extraction duct."""
import math,sys
from pathlib import Path
import bmesh
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'p11-set-pieces'))
import p11lib as L
from compact_uv import compact_uv
L.reset_scene()
L.asset('swallowed-workbay',12000)
# Rectangular extraction duct. Separate flaps flare and twist out of the outlet.
L.box('Extraction plenum',(-2.25,.18,.97),(1.35,1.07,1.85),'e9-body',.08)
L.vent((-2.25,-.37,1.12),.95,.72,6)
for i in range(8):
    a=math.tau*i/8
    bm=bmesh.new();rings=[]
    for t in (0,.46,1):
        ring=[]
        for edge in (-1,1):
            angle=a+edge*.37+t*t*.16
            r=.51+.38*t*t
            ring.append(bm.verts.new((-1.7+t*(.94+.18*math.sin(3*a)),.13+math.cos(angle)*r,1.08+math.sin(angle)*r)))
        rings.append(ring)
    for j in (0,1):bm.faces.new([rings[j][0],rings[j+1][0],rings[j+1][1],rings[j][1]])
    L.mesh_object('Rolled duct petals',bm,'p11-steel',smooth=False)
# Low second machine beside the existing mill. Bare steel visible through ribs.
L.box('Spindle housing',(1.77,0,.45),(2.22,1.04,.84),'e9-body',.085)
L.cylinder('Tool spindle',(1.84,-.54,.65),.28,1.66,'p11-steel','X',12)
L.box('Benchtop',(1.72,0,.93),(2.47,1.22,.15),'p11-steel',.05)
# Continuous helical ribbed shroud, narrowing onto the surviving spindle.
for i in range(9):
    t=i/8; x=-1.13+i*.407+.059*math.sin(i*2.37)
    ring=[(x-.41,.47,.20),(x-.23,.51,1.07),(x-.13,.26,1.43+.15*math.cos(t*6)),
          (x+.04,-.27,1.55-.31*t),(x+.24,-.57,1.11),(x+.36,-.67,.63),(x+.49,-.8,.15)]
    L.sweep('Arching resin rib',ring,.12+.055*math.sin(t*3),'p11-growth',7,
            taper=(.20+.035*math.sin(i),.081))
    if i%2==0:
        L.sweep('Scute seam',[(a,b-.021,c+.10) for a,b,c in ring[1:5]],.046,'p11-flesh',6)
# Stretched skin sags in the gaps between the structural ribs. Leave two
# windows through which bare machinery and the lantern blisters are visible.
for i in (0,1,3,4,5,7):
    x=-1.10+i*.407
    bm=bmesh.new();rows=[]
    for j in range(4):
        t=j/3; sag=.14*math.sin(math.pi*t)
        rows.append([bm.verts.new((x+.43*t+dx,y,z-sag)) for dx,y,z in
                     [(-.18,.46,1.11),(-.10,.23,1.43),(.04,-.27,1.48-i*.021),
                      (.22,-.55,1.09),(.35,-.65,.61)]])
    for j in range(3):
        for k in range(4):
            bm.faces.new([rows[j][k+1],rows[j+1][k+1],rows[j+1][k],rows[j][k]])
    L.mesh_object('Sagging resin between ribs',bm,'p11-flesh',smooth=True)
for side in (-1,1):
    L.sweep('Longitudinal tendon',[(-1.66,side*.32,1.12),(-.91,side*.45,1.42),
            (-.03,side*.33,1.51),(.67,side*.27,1.49),(1.58,side*.41,1.29),(2.79,side*.45,.89)],.15,'p11-flesh',7)
for i in range(4):
    x=-.48+i*.28
    L.egg('Lantern blister',(x,-.46,1.32),.24+.07*math.sin(i),'p11-bio-violet',i,.5)
# Narrow coaxial roots break away from the belly and stick to the floor.
for i in range(5):
    x=-.99+.52*i
    L.tendril('Gripping root',[(x,.1,1.42),(x-.12,-.38,1.26),(x+.17,-.68,.75),
              (x+.29,-.78,.26),(x+.12,-1.0,.075),(x-.32,-1.24,.045),(x-.48,-1.52,.026)],
              .087,.012,'p11-growth',5,i+62,.027)
# The brood hangs beneath the overhanging tool bench, held by a resin sling.
for i in range(6):
    x=.83+i*.34
    L.egg('Egg under carriage',(x,-.57,.10),.34,'p11-flesh',i,.28)
L.sweep('Pod sling',[(.50,-.49,.82),(.72,-.76,.31),(1.43,-.72,.17),
        (2.32,-.73,.24),(2.73,-.49,.88)],.08,'p11-growth',7)
# A portable barricade was never raised. Only its left shoe was pinned.
L.box('Pinned barricade shoe',(-2.61,-.8,.08),(.42,.46,.15),'e9-trim',.04)
L.sweep('Bent barrier tube',[(-2.6,-.8,.1),(-2.6,-.8,.99),(-2.18,-.91,.99),
        (-1.94,-1.05,.71),(-1.43,-1.14,.18)],.057,'p11-steel')
L.cylinder('Abandoned ratchet',(-1.91,-1.21,.07),.039,.49,'e9-trim','X',8)
out=L.ROOT/'public/assets/inc13/workshop'
L.export('inc13-workshop',out,'duct.glb','Split extraction duct discharging a continuous resin shroud over a machine bench.',
         'blender -b -P tools/assets/inc13-incidents/workshop.py')
compact_uv(out/'duct.glb',out/'manifest.json')
