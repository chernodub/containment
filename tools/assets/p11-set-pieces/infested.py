"""Original MIT P11 living machinery and brood ingress. Blender 5.3.
Rebuild: blender -b --factory-startup -P tools/assets/p11-set-pieces/infested.py -- --render
"""
import math, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import p11lib as L

OUT=L.ROOT/'public/assets/p11/infested'
RENDERS=L.ROOT/'artifacts/nextgen/p11-final/beauty'

def root(name,points,r=.12,seed=0):
    L.tendril(name,points,r,.015,radial=5,seed=seed,wobble=.025)

def growth(cx=0,cy=0,z=0,scale=1,seed=0):
    L.blob('Folded resin saddle',[(cx,cy,z+.22*scale,.55*scale),(cx+.28*scale,cy,z+.3*scale,.42*scale),(cx-.24*scale,cy+.18*scale,z+.28*scale,.4*scale)],resolution=.13*scale,displace=.06*scale,seed=seed,decimate=.45)
    for i in range(5):
        a=i*1.25+seed
        root('Anchoring root',[(cx,cy,z+.3*scale),(cx+math.cos(a)*.55*scale,cy+math.sin(a)*.55*scale,z+.11*scale),(cx+math.cos(a)*.95*scale,cy+math.sin(a)*.95*scale,z+.018)],.09*scale,seed+i)

def workshop():
    L.asset('engulfed-milling-machine',12000)
    L.slab('Machine foundation',[(-2,-.95),(1.9,-.95),(2.15,-.65),(2.15,.75),(-1.8,.95),(-2,.7)],0,.2,'e9-dark',.035)
    # Distinct off-centre upright, cantilever tool head and exposed work bed.
    L.box('Cast machine pedestal',(-1.15,.28,1.12),(1.15,1.05,1.9),'e9-body',.09)
    L.box('Column cheek',(-1.75,.28,1.2),(.12,1.12,1.9),'p11-tint-metal',.025,tint='service-blue')
    L.box('Cantilever spindle housing',(-.22,.35,2.16),(2.7,.95,.48),'e9-body',.075)
    L.inset_panel('Drive cover',(-.5,-.14,2.15),1.8,.3,.025,.035,'e9-dark','e9-trim')
    L.stencil('MILL 07',(-.65,-.175,2.15),.1)
    for x in (-1.4,-.6,.2): L.bolt((x,-.18,2.26),.025)
    L.cylinder('Spindle',(.73,.25,1.68),.19,.55,'e9-trim','Z',12,.018)
    L.cylinder('Chuck',(.73,.25,1.39),.28,.22,'e9-dark','Z',12,.018)
    L.cylinder('Cutting tool',(.73,.25,1.15),.065,.32,'p11-steel','Z',8,0)
    L.box('Work slide bed',(.6,-.12,.68),(2.3,1.35,.32),'e9-trim',.045)
    for x in (-.2,.2,.6,1,1.4): L.box('Bed T slot',(x,-.12,.847),(.035,1.15,.012),'e9-dark',0)
    for y in (-.55,.35): L.cylinder('Slide rail',(.55,y,.48),.075,2.65,'p11-steel','X',10,0)
    L.box('Feed gearbox',(1.72,-.1,.62),(.32,.7,.55),'e9-body',.04)
    L.valve_wheel((1.94,-.2,.68),.23,'X',tint='cream')
    L.box('Coolant pan',(.65,-.2,.29),(2.7,1.45,.16),'e9-dark',.025)
    L.vent((-1.15,-.26,.85),.75,.55,6)
    L.handle((-1.15,-.31,1.45),.38,'X',.06,.025)
    L.box('Control pendant',(-1.8,-.72,1.25),(.52,.22,.72),'e9-body',.045)
    L.screen('Fault terminal',(-1.8,-.845,1.36),.38,.28,pattern='schematic')
    L.cable_bundle('Pendant umbilical',(-1.8,-.6,1.6),(-1.2,.28,2.43),2,.2,.022)
    # Growth crosses mechanically purposeful surfaces, leaves the cutting throat legible.
    growth(-1.2,.15,2.2,1.15,3)
    L.blob('Column engulfing mantle',[(-1.6,-.38,1.65,.65),(-1.45,-.4,1.1,.58),(-1.6,-.3,.55,.55)],resolution=.13,displace=.08,seed=16,decimate=.5)
    growth(1.35,.52,.75,.8,7)
    for i in range(5):
        x=-1.7+i*.27
        root('Column sinew',[(-1.2,.1,2.5),(x,-.38,2.16),(x-.1,-.43,1.7),(x+.1,-.45,.6),(x+.35,-.7,.22)],.13,11+i)
    root('Crown tendon',[(-1.3,.3,2.35),(-.35,.65,2.5),(.4,.7,2.37),(1,.5,1.75)],.15,2)
    for i in range(4): L.egg('Nested machine sac',(1.3+i*.12,.45+(i%2)*.13,.76),.22,'p11-flesh',i)
    L.egg('Luminous cyst',(-1.2,-.12,2.08),.16,'p11-bio',3)

def nest():
    L.asset('ruptured-brood-plenum',12000)
    # Duct is built as a torn mouth rather than a solid box with growth on it.
    for sx in (-1,1):
        L.box('Duct folded side',(sx*1.4,.35,1.05),(.12,1.45,1.8),'e9-body',.025)
        L.box('Mouth flange',(sx*1.48,-.45,1.05),(.18,.16,2.05),'e9-trim',.02)
    L.box('Duct roof',(0,.35,2),(2.85,1.45,.12),'e9-body',.025)
    L.box('Duct dark throat',(0,1.03,1.0),(2.7,.05,1.8),'e9-dark',0)
    L.grille_top((0,.35,2.08),1.9,.8,9)
    L.stencil('AIR 09',(-.7,-.23,2.065),.14,'Z')
    for x in (-1.1,1.1):
        for y in (-.2,.8): L.bolt((x,y,2.07),.025,'Z')
    L.box('Duct sill',(0,.25,.12),(3.15,1.6,.24),'e9-dark',.025)
    for i in range(5):
        x=-1.15+i*.56
        L.profile_x('Bent torn louvre',[(-.42,1.98),(-.5,1.6),(-.8-(i%2)*.18,.8+i*.08),(-.73-(i%2)*.18,.76+i*.08),(-.42,1.58),(-.34,1.98)],x-.08,x+.08,'e9-trim',.012)
    growth(-.5,.2,.17,.9,4)
    growth(.8,.45,.2,.75,8)
    for i in range(8):
        x=-.95+(i%4)*.48; y=-.35+(i//4)*.48
        L.egg('Brood egg',(x,y,.38),.42+(i%3)*.06,'p11-flesh',i,.25)
        root('Egg binding',[(x-.2,y,.3),(x-.23,y,.68),(x,y,.92)],.045,i)
    for i in range(5): root('Web brace',[(-1.4,.7,1.8-i*.25),(-.5,.6,.8),(.4,.6,.4),(1.4,.65,.7+i*.2)],.06,i)
    for x in (-1.1,.7): L.egg('Brood lumen',(x,-.25,.5),.18,'p11-bio',3)

def modules():
    L.asset('root-saddle',1500); growth(0,0,0,.9,9)
    L.asset('egg-clutch',1500)
    for i in range(4): L.egg('Bound egg',((i%2)*.32-.16,(i//2)*.32-.16,.04),.34,'p11-flesh',i)
    for i in range(3): root('Resin foot',[(-.45+i*.35,-.4,.03),(-.35+i*.3,0,.2),(-.2+i*.3,.45,.02)],.05,i)
    L.asset('resin-web',1500)
    for i in range(5):
        z=.15+i*.22
        L.sweep('Web cord',[(-.7,0,z),(-.2,.1,z*.5),(.25,.08,z*.7),(.7,0,z+.12)],.017,'p11-growth',4)
    for x in (-.6,0,.6): L.sweep('Web cross cord',[(x,0,.12),(x*.6,.1,.6),(x,0,1.25)],.019,'p11-flesh',4)

def bench():
    L.asset('engulfed-repair-bench',1500)
    L.box('Bent worktop',(0,0,.65),(2.6,1.1,.1),'e9-trim',.025)
    for x in (-1,1):
        for y in (-.35,.35): L.box('Bench foot',(x,y,.3),(.12,.12,.6),'e9-body',.012)
    L.box('Drawer pedestal',(-.65,0,.36),(.85,.8,.5),'e9-body',.025)
    for z in (.25,.45):
        L.box('Drawer face',(-.65,-.42,z),(.73,.04,.16),'e9-dark',.005)
        L.handle((-.65,-.46,z),.3,'X',.035,.012)
    L.box('Vise fixed jaw',(.65,0,.8),(.2,.3,.2),'e9-body',.015)
    L.box('Vise sliding jaw',(.95,0,.8),(.15,.3,.2),'e9-body',.015)
    L.cylinder('Vise screw',(.9,0,.72),.035,.65,'e9-trim','X',8,0)
    for i in range(3): L.egg('Bench clutch',(-.65+i*.28,.2,.71),.22,'p11-flesh',i)
    for i in range(3): root('Bench resin',[(.2,.35,.73),(.1-i*.35,-.05,.72),(-.1-i*.35,-.5,.4)],.045,i)

L.reset_scene(); workshop(); nest(); modules(); bench()
names=[a.name for a in L.ASSETS]
L.export('infested',OUT,'infested.glb','Engulfed milling machinery, ruptured brood plenum and three infestation modules.','blender -b --factory-startup -P tools/assets/p11-set-pieces/infested.py')
if '--render' in L.args():
    from cpu_preview import stage
    L._stage = stage
    for name in ([names[0]] if '--workshop' in L.args() else names[:2]):
        L.render(RENDERS/(name+'-hero.png'),[name],'hero')
        L.render(RENDERS/(name+'-game.png'),[name],'game')
