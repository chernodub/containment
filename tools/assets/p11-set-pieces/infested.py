"""Original MIT P11 living machinery and brood ingress. Blender 5.3.
Rebuild: blender -b --factory-startup -P tools/assets/p11-set-pieces/infested.py -- --render
"""
import math, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import p11lib as L
import infested_craft as C

OUT=L.ROOT/'public/assets/p11/infested'
RENDERS=L.ROOT/'artifacts/nextgen/p11-final/beauty'

def workshop():
    L.asset('engulfed-milling-machine',12000)
    # Knee mill casting: broad sump foot, tapered column, sliding knee and ram.
    L.slab('Cast iron splayed foundation',[(-1.95,-.8),(1.72,-.8),(1.95,-.55),(1.95,.72),(-1.68,.85),(-1.95,.55)],.08,.27,'e9-dark',.06)
    for x in (-1.6,1.55):
        for y in (-.62,.61):
            L.cylinder('Levelling foot',(x,y,.09),.16,.18,'p11-steel','Z',10,.02)
            L.bolt((x,y,.29),.055,'Z')
    L.profile_x('Tapered hollow column casting',[(-.26,.25),(.79,.25),(.72,2.28),(.38,2.52),(-.03,2.36),(-.18,1.05)],-1.65,-.62,'e9-dark',.065)
    # Structural ribs visibly run from the broad base into the column shoulder.
    for x in (-1.58,-.7):
        L.profile_x('Cast strengthening rib',[(-.56,.25),(-.16,1.45),(-.05,1.5),(-.14,.31)],x-.07,x+.07,'e9-body',.018)
    for x in (-1.49,-.82):
        L.box('Ground column slideway',(x,-.26,1.29),(.12,.11,1.75),'p11-steel',.014)
    L.box('Oil return channel',(-1.15,-.19,1.1),(.18,.08,1.4),'e9-dark',.01)
    L.profile_x('Sliding knee casting',[(-.77,.5),(.07,.5),(.07,1.15),(-.25,1.15),(-.72,.83)],-1.43,.7,'e9-body',.035)
    for x in (-1.2,-.65,-.1):
        L.profile_x('Knee cast web',[(-.71,.54),(-.2,1.07),(-.08,1.07),(-.57,.54)],x-.04,x+.04,'e9-dark',.009)
    L.cylinder('Vertical feed jack',(-.85,-.38,.55),.115,.62,'p11-steel','Z',12,.01)
    # Chip tray has an open cavity, rolled lips and drain rather than a solid block.
    L.slab('Pressed chip sump',[(-1.45,-.91),(1.72,-.91),(1.92,-.68),(1.92,.55),(-1.45,.55)],.53,.59,'e9-dark',.02)
    for y in (-.91,.55):L.box('Rolled sump lip',(.2,y,.66),(3.3,.06,.18),'e9-body',.015)
    L.box('Sump end lip',(1.84,-.18,.66),(.07,1.3,.18),'e9-body',.015)
    L.cylinder('Chip drain',(1.6,.3,.6),.09,.035,'p11-rubber','Z',10,0)
    # Ground ways sit under the visibly thinner T-slotted table.
    for y in (-.48,.18):L.box('Dovetail guide',(.2,y,.91),(2.6,.16,.14),'p11-steel',.025)
    L.box('Cross slide saddle',(.2,-.15,.99),(1.5,.85,.13),'e9-dark',.025)
    L.box('Milled table',(.22,-.2,1.12),(2.85,1.1,.16),'p11-steel',.025)
    for y in (-.56,-.28,0,.2):L.box('Deep longitudinal T slot',(.22,y,1.204),(2.65,.045,.016),'e9-dark',0)
    for x in (-1.05,1.5):
        L.box('Table end wiper',(x,-.2,1.06),(.1,1.04,.07),'p11-rubber',.006)
    L.cylinder('Lead screw',(.2,-.69,.93),.055,3.2,'p11-steel','X',10,0)
    L.cylinder('Feed bearing boss',(1.73,-.69,.93),.16,.2,'e9-body','X',12,.015)
    L.valve_wheel((1.88,-.69,.93),.18,'X',tint='grey')
    L.box('Feed limit carriage',(.63,-.77,.94),(.46,.16,.23),'p11-tint-metal',.025,tint='service-blue')
    L.box('Limit dog',(.82,-.84,1.08),(.1,.08,.06),'p11-steel',.01)
    # Ram profile and flange connect motor, rotating head, quill and tool.
    L.profile_x('Cantilever ram',[(-.08,2.12),(.64,2.12),(.64,2.47),(.45,2.62),(.03,2.62),(-.08,2.45)],-1.5,.72,'e9-body',.035)
    L.inset_panel('Ram belt access',(-.35,-.094,2.37),1.45,.3,.025,.045,inner_role='p11-tint-metal',inner_tint='service-blue')
    for x in (-.92,.18):
        L.cylinder('Belt cover hinge',(x,-.13,2.51),.035,.18,'p11-steel','X',8,0)
    L.handle((-.32,-.15,2.37),.3,'X',.04,.018)
    L.stencil('M07',(-.79,-.15,2.3),.09)
    L.cylinder('Head swivel flange',(.59,.24,2.27),.32,.22,'p11-steel','X',16,.025)
    for z in (2.07,2.47):L.bolt((.72,.12,z),.035,'X')
    L.lathe('Stepped spindle head',[(.21,0),(.3,.08),(.3,.35),(.24,.47),(.24,.65),(.18,.74)],(.73,.17,1.58),'e9-body',16)
    L.cylinder('Quill polished sleeve',(.73,.17,1.59),.14,.38,'p11-steel','Z',14,.01)
    L.lathe('Collet chuck',[(.09,0),(.15,.06),(.15,.18),(.12,.23)],(.73,.17,1.33),'e9-dark',12)
    L.cylinder('End mill',(.73,.17,1.28),.032,.19,'p11-steel','Z',8,0)
    L.cylinder('Motor barrel',(.13,.34,2.69),.23,.55,'e9-dark','X',14,.025)
    for x in (-.08,.02,.12,.22,.32):L.cylinder('Motor cooling fin',(x,.34,2.69),.255,.035,'e9-body','X',14,0)
    L.cylinder('Motor bearing end',(.44,.34,2.69),.2,.12,'p11-steel','X',12,.015)
    L.box('Motor junction box',(.12,.6,2.68),(.28,.2,.18),'e9-body',.025)
    L.cylinder('Motor gland',(-.03,.67,2.68),.05,.12,'p11-steel','X',8,0)
    L.sweep('Motor cable',[(-.09,.67,2.68),(-.58,.68,2.62),(-1.5,.63,2.24),(-1.7,.5,1.2)],.035,'p11-rubber',6,bend=.12)
    # A true pendant arm, recessed display, tactile controls and cable gland.
    L.sweep('Pendant articulated support',[(-1.62,.4,1.85),(-1.9,.2,1.85),(-1.99,-.48,1.65)],.055,'p11-steel',8,bend=.1)
    L.profile_x('Sloping operator pendant',[(-.76,1.1),(-.5,1.1),(-.5,1.84),(-.68,1.84),(-.82,1.58)],-2.18,-1.72,'e9-body',.025)
    L.screen('Machine fault readout',(-1.95,-.842,1.51),.34,.21,pattern='schematic')
    for x in (-2.05,-1.9):
        L.cylinder('Pendant tactile selector',(x,-.79,1.27),.035,.04,'e9-trim','Y',8,0)
    L.cylinder('Pendant umbilical gland',(-1.94,-.52,1.1),.055,.12,'p11-steel','Z',8,0)
    L.sweep('Pendant lower cable',[(-1.94,-.52,1.04),(-1.9,-.3,.82),(-1.65,.5,.65)],.027,'p11-rubber',6,bend=.1)
    # Burst access hatch identifies where the organism entered the casting.
    L.inset_panel('Column service aperture',(-1.17,-.29,1.85),.53,.65,.035,.05,inner_role='e9-dark')
    L.box('Bent open service hatch',(-1.55,-.48,1.83),(.45,.055,.64),'p11-tint-metal',.018,rotation=(0,0,-.65),tint='service-blue')
    for z in (1.59,2.06):L.cylinder('Hatch hinge',(-1.42,-.33,z),.035,.15,'p11-steel','Z',8,0)
    L.handle((-1.69,-.57,1.83),.18,'Z',.04,.018)
    L.cylinder('Coolant outlet boss',(.88,.38,2.01),.055,.08,'p11-steel','Y',8,0)
    L.sweep('Flexible coolant feed',[(.88,.42,2.01),(1.1,.5,1.94),(1.2,.18,1.66),(.94,.1,1.4)],.025,'p11-tint',6,bend=.07,tint='service-blue')
    L.sweep('Sump return hose',[(1.59,.31,.55),(1.62,.58,.4),(-1.42,.7,.4),(-1.62,.5,.65)],.035,'p11-rubber',6,bend=.1)
    # K11-derived environmental growth: thin crust wraps the burst panel and ram.
    C.crust((-1.13,-.35,2.07),.68,5,450)
    for i in range(4):
        C.shell('Overlapping column mantle',(-1.21,-.4,1.85-i*.23),(.34,.23,.09),tilt=1.2,seed=8+i,budget=300)
    C.crust((-1.25,.12,2.6),.62,19,350)
    for i in range(3):
        C.shell('Ram mantle shingle',(-1.3+i*.12,.25-i*.18,2.62-i*.05),(.4,.23,.11),tilt=i*.3,seed=22+i,budget=300)
    L.sweep('Exposed violet lantern seam',[(-.92,-.5,1.96),(-.88,-.55,1.77),(-.94,-.55,1.57)],.014,'p11-bio-violet',5)
    for z in (1.78,1.85,1.92):
        L.sweep('Lantern sinew rib',[(-1.38,-.48,z),(-1.31,-.5,z+.025),(-1.25,-.48,z)],.012,'p11-flesh',4)
    L.sweep('Top mantle lantern slit',[(-1.31,.02,2.75),(-1.22,-.02,2.73),(-1.13,-.05,2.70)],.014,'p11-bio-violet',5)
    # Taut asymmetric strands anchor to an actual base seam; no free cone tips.
    for i in range(4):
        L.sweep('Tensioned resin anchorage',[(-1.3+i*.11,-.43,1.72),(-1.53+i*.15,-.57,.93),(-1.69+i*.22,-.72,.28)],.025+i*.004,'p11-growth',5)
    C.crust((-1.25,-.53,.29),.58,13,320)
    L.box('Right service cradle',(1.55,.48,1.13),(.6,.48,.13),'e9-dark',.025)
    C.clutch((1.36,.37,1.2),.8,4,3)

def nest():
    L.asset('ruptured-brood-plenum',12000)
    # Folded HVAC elbow with an actual hollow mouth, service spigot and burst door.
    for sx in (-1,1):
        L.profile_x('Folded elbow wall',[(-.48,.2),(.95,.2),(.95,1.52),(.38,2.05),(-.48,2.05)],sx*1.35-.055,sx*1.35+.055,'e9-body',.025)
        L.box('Mouth flange',(sx*1.43,-.46,1.05),(.16,.17,1.95),'p11-steel',.016)
        for z in (.35,.9,1.5,1.9):L.bolt((sx*1.43,-.56,z),.035)
        L.box('Longitudinal flange seam',(sx*1.4,.25,.27),(.1,1.5,.1),'p11-steel',.01)
        L.sweep('Crimped wall rib',[(sx*1.42,-.26,.4),(sx*1.42,.65,.4),(sx*1.42,.65,1.45),(sx*1.42,.25,1.85)],.025,'e9-dark',5)
    L.profile_x('Elbow roof sheet',[(-.48,2.05),(.38,2.05),(.98,1.48),(.98,1.58),(.42,2.15),(-.48,2.15)],-1.4,1.4,'e9-body',.02)
    L.box('Throat deep shadow',(0,.94,1),(2.6,.06,1.5),'e9-dark',0)
    L.box('Drain pan',(0,.14,.15),(3.05,1.65,.2),'e9-dark',.025)
    L.box('Rolled sill',(0,-.66,.3),(3.05,.1,.16),'p11-steel',.016)
    L.cylinder('Roof extraction spigot',(.6,.25,2.19),.35,.12,'e9-dark','Z',16,.015)
    L.flange((.6,.25,2.25),.43,'Z',.07,8)
    L.grille_top((.6,.25,2.3),.46,.4,6)
    L.inset_panel('Filter service access',(-.65,.2,2.17),.7,.6,.03,.045,axis='Z',inner_role='p11-tint-metal',inner_tint='service-blue')
    for x in (-.9,-.45):L.cylinder('Service hinge',(x,.47,2.2),.025,.15,'p11-steel','X',8,0)
    L.handle((-.65,0,2.21),.3,'X',.06,.02)
    L.stencil('A09',(-.85,-.3,2.17),.11,'Z')
    # Broken dampers are still hinged at roof; alternate bent/split leaves expose nest.
    for i in range(5):
        x=-1.12+i*.55
        endz=(1.52 if i in (1,3) else 1.0+i*.08)
        L.profile_x('Burst damper leaf',[(-.45,2.02),(-.56,1.7),(-.78-(i%2)*.12,endz),(-.7-(i%2)*.12,endz-.04),(-.43,1.69),(-.37,2.02)],x-.15,x+.15,'p11-tint-metal',.012,tint='service-blue')
        L.cylinder('Damper pivot',(x,-.43,1.97),.06,.36,'p11-steel','X',10,.005)
        L.box('Damper rib',(x,-.56,1.7),(.12,.055,.33),'e9-dark',.008,rotation=(.15,0,0))
    # Mantle grows from the duct's side seam and shingles around its open mouth.
    C.crust((-.76,.15,.31),.85,8,550)
    C.crust((.76,.35,.31),.75,14,450)
    for side in (-1,1):
        for i in range(3):
            C.shell('Duct climbing mantle',(side*1.2,-.38,.63+i*.33),(.31,.24,.12),tilt=1.1,seed=i+side*4,budget=240)
    C.clutch((-.65,-.3,.33),1.15,9,4)
    C.clutch((.45,-.28,.33),1.1,15,2)
    for i in range(5):
        L.sweep('Membrane tension web',[(-1.25,-.35,1.5-i*.18),(-.6,.05,.6),(.5,.1,.4),(1.24,-.3,1.12+i*.1)],.022,'p11-growth',5)
    for i in range(3):
        L.sweep('Duct floor anchorage',[(-1.18+i*.18,-.4,.6),(-1.1+i*.22,-.63,.36),(-.8+i*.3,-.65,.25)],.024,'p11-flesh',5)


def modules():
    L.asset('root-saddle',1500)
    C.crust((0,0,.14),1,9,550)
    for i in range(2):C.shell('Root shell seam',(-.16+i*.27,0,.26),(.31,.28,.1),seed=i,budget=150)
    for i in range(3):L.sweep('Anchored creeping vein',[(-.45+i*.3,-.1,.16),(-.4+i*.3,-.4,.06),(-.32+i*.25,-.62,.025)],.025,'p11-growth',5)
    L.asset('egg-clutch',1500)
    C.crust((0,0,.06),.65,4,220)
    C.clutch((-.14,-.13,.07),1,4,2)
    L.asset('resin-web',1500)
    C.crust((-.6,0,.1),.4,5,200);C.crust((.6,0,1.1),.4,8,200)
    for i in range(6):
        z=.1+i*.17
        L.sweep('Tensioned web cord',[(-.65,0,z),(-.12,.04,z*.6),(.65,0,z+.17)],.012+(i%2)*.004,'p11-growth',4)
    for i in range(4):
        x=-.5+i*.33
        L.sweep('Cross linked membrane',[(x,0,.16),(x*.3,.04,.55),(x+.1,0,1.1)],.013,'p11-flesh',4)

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
    L.cylinder('Vise screw hub',(1.25,0,.72),.07,.08,'e9-dark','X',8,0)
    L.cylinder('Vise sliding handle',(1.3,0,.72),.018,.38,'p11-steel','Z',6,0)
    for x in (.54,1.04):L.box('Replaceable vise jaw plate',(x,-.01,.85),(.03,.28,.13),'p11-steel',0)
    C.clutch((-.65,.1,.71),.7,9,1)
    for i in range(2): L.sweep('Bench tensioned resin',[(.2,.35,.73),(.1-i*.35,-.05,.72),(-.1-i*.35,-.5,.4)],.018,'p11-growth',5)

# Gameplay review: preserve the dark casting, lift painted bodies and ground metal
# enough to separate the ram/table/column beneath the room's ink lighting.
L.PALETTE.update({'e9-body':'#637f82','p11-steel':'#a5b8b4','p11-growth':'#625264','p11-flesh':'#9b8191'})
L.METALLIC.update({'e9-body':.18,'p11-steel':.38})
L.reset_scene(); workshop(); nest(); modules(); bench()
names=[a.name for a in L.ASSETS]
L.export('infested',OUT,'infested.glb','Engulfed milling machinery, ruptured brood plenum and three infestation modules.','blender -b --factory-startup -P tools/assets/p11-set-pieces/infested.py')
if '--render' in L.args():
    from cpu_preview import stage
    L._stage = stage
    for name in ([names[0]] if '--workshop' in L.args() else ([names[1]] if '--nest' in L.args() else names[:2])):
        L.render(RENDERS/(name+'-hero.png'),[name],'hero',scale=1.18)
        L.render(RENDERS/(name+'-game.png'),[name],'game')

if '--modules' in L.args():
    from cpu_preview import stage
    L._stage = stage
    L.layout_row(names[2:])
    L.render(RENDERS/'infestation-modules.png',names[2:],'hero',resolution=(1280,640),scale=1.2)
