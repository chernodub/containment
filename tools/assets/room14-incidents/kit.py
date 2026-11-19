"""Bevelled original accident props. Blender coordinates in metres, fronts face -Y."""
from pathlib import Path
import math
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'p11-set-pieces'))
import p11lib as L
from compact_uv import compact_uv

L.reset_scene()
steel = 'p11-steel'
body = 'e9-body'
dark = 'e9-dark'

def box(label, position, size, finish=body, tilt=0):
    L.box(label, position, size, finish, .025, rotation=(0, tilt, 0))

def tube(label, points, radius=.05, finish=steel):
    L.sweep(label, points, radius, finish, 8)

def lamp(x,y,z,width):
    box('Shielded lamp hood',(x,y,z),(width+.12,.26,.17),dark)
    L.lamp_strip('Diffuser',(x,y-.14,z-.025),width,'X','p11-screen',.075,.075)

L.asset('sealed-berth',5200)
# One upright sealed sleeper. Two panes split the cold hatch from its open
# personal drawer. An adult coat and one small boot remain in the drawer.
box('Cabinet shell',(0,0,1.18),(1.25,.79,2.36),dark)
for sx in [-.54,.54]:
    box('Pressure jamb',(sx,-.4,1.23),(.12,.18,2.23),steel)
for z in [.28,2.19]:
    box('Clamped crossbar',(0,-.45,z),(1.12,.17,.12),steel)
box('Sealed viewing hatch',(0,-.43,1.44),(.97,.14,1.32),body)
L.box('Inspection glass',(0,-.51,1.65),(.72,.05,.45),'p11-screen',.055)
box('Open effects tray',(0,-.82,.42),(1.04,.83,.11),body)
for x in [-.47,.47]:
    box('Drawer return',(x,-.82,.51),(.075,.83,.22),steel)
box('Drawer front',(0,-1.19,.53),(1.04,.08,.22),body)
L.box('Folded coat',(-.18,-.84,.54),(.44,.50,.13),'p11-tint',.04,tint='navy')
L.box('Boot sole',(.22,-.87,.55),(.20,.31,.08),'p11-rubber',.03)
L.box('Boot upper',(.22,-.80,.65),(.18,.16,.16),'p11-tint',.035,tint='wood')
lamp(0,-.46,.82,.79)

L.asset('queue-barrier',2400)
box('Fallen divider',(.1,0,.28),(2.1,.12,.19),steel,.12)
for x in [-.9,.96]:
    tube('Toppled stanchion',[(x,-.65,.13),(x,0,.28)],.075)
    L.cylinder('Weighted foot',(x,.03,.28),.29,.12,dark,'Y',12)

L.asset('crushed-bench',2400)
for x,z,a in [(-.76,.55,.24),(.76,.48,-.33)]:
    for y in [-.22,0,.22]:
        box('Split slat',(x,y,z),(1.48,.18,.13),'p11-tint',a)
for x in [-1.42,1.42]:
    tube('Cast end frame',[(x,-.30,.05),(x,-.24,.66),(x,.25,.66),(x,.34,.04)],.075)
box('Crushing roof cassette',(.15,0,1.03),(1.18,.85,1.65),body,.39)
for x in [-.28,.34]:
    tube('Snapped suspension lead',[(x,0,1.74),(x+.24,0,2.15),(x+.43,.07,2.03)],.036,dark)

L.asset('fallen-ceiling',2600)
box('Dropped ceiling tray',(0,0,.49),(1.68,.95,.11),body,-.48)
for side in [-1,1]:
    box('Folded edge stiffener',(0,side*.44,.54),(1.68,.06,.16),steel,-.48)
for x in [-.38,.34]:
    tube('Stripped ceiling cable',[(x,.24,2.65),(x-.14,.22,2.13),(x+.11,.16,1.48),(x+.22,.12,1.51)],.036,dark)
tube('Intact retention strap',[(.72,.34,2.65),(.81,.34,1.43),(.69,.30,.94)],.033,steel)

L.asset('shifted-load',4200)
for i,(x,z,a) in enumerate([(0,.49,0),(.17,1.51,.14),(.56,2.50,.31)]):
    box('Shipping container',(x,0,z),(1.38,1.04,.99),body,a)
    for side in [-1,1]:
        box('Captive band',(x+side*.47*math.cos(a),-.532,z-side*.47*math.sin(a)),(.075,.035,.96),steel,a)
box('Loose chock',(.89,-.52,.14),(.48,.36,.23),dark,-.26)

L.asset('relay-sled',3200)
for x in [-.56,.56]:
    box('Extraction runner',(x,0,.1),(.11,2.3,.14),steel)
box('Pulled card cage',(0,-.5,1.18),(1.25,.82,2.08),dark)
for i in range(5):
    box('Slide out blade',(0,-.92-.09*(i%3),.45+i*.31),(1.08,.34,.21),body)
lamp(0,-.82,2.25,.82)

L.asset('split-plenum',5200)
for s in [-1,1]:
    box('Sprung housing leaf',(s*.87,0,1.2),(.78,1.35,2.2),body,-s*.32)
    for k in range(3):
        tube('Deflected pipe',[(s*2.5,.24*k,.63),(s*1.7,.24*k,.63),(s*1.24,.24*k,1.12),(s*.74,.24*k,2.14)],.089)
for i in range(5):
    x=(i-2)*.15
    tube('Tension root',[(x,-.61,.22),(x*.4,-.45,.92),(x*.85,-.31,1.75),(x*1.9,.22,2.38),(x*4+.7,1.08,2.65),(x*5+1.5,1.28,2.72)],.11-i*.009,'p11-rubber')

L.asset('bypass',3500)
for s in [-1,1]:
    box('Exposed upright',(s*.65,0,1.55),(.13,.36,3.1),steel)
box('Rear bus enclosure',(0,.16,1.52),(1.18,.23,2.74),dark)
for x in [-.39,0,.39]:
    tube('Bypass lead',[(x,-.14,1.86),(x+.09,-.38,.56),(x+.25,-.64,.08),(x+.8,-.95,.06),(1.63,-.66+x,.21),(1.83,-.55+x,.46)],.066)
box('Field bypass box',(1.95,-.56,.34),(.65,.74,.60))
lamp(0,-.08,3.08,1.16)

L.asset('escaped-gurney',2800)
box('Bent stretcher bed',(0,0,.78),(.86,1.94,.19),steel,.21)
box('Mattress',(0,0,.91),(.8,1.88,.13),'p11-rubber',.21)
for x in [-.34,.34]:
    tube('Buckled wheeled base',[(x,-.83,.13),(x,-.55,.57),(x,.62,.7),(x,.84,.14)],.065)
    for y in [-.83,.84]:
        L.cylinder('Caster',(x,y,.13),.13,.12,dark,'X',10)

L.asset('glazing',1600)
for x,y,a in [(-.55,0,.2),(.12,-.18,-.5),(.57,.15,.3)]:
    L.slab('Fractured safety glass',[(x,y),(x+.31,y+.12),(x+.43,y+.48),(x-.12,y+.28)],.01,.037,steel,.006)

out=L.ROOT / 'public/assets/room14'
L.export('room14',out,'incidents.glb','Original accident assemblies, bevelled steel and captive hardware.',
         'blender -b -P tools/assets/room14-incidents/kit.py')
compact_uv(out/'incidents.glb',out/'manifest.json')
