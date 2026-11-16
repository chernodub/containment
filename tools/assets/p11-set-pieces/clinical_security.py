"""P11 cryogenic and security landmarks; original MIT geometry."""
import sys, math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import p11lib as L
from mathutils import Matrix
OUT=L.ROOT/'public/assets/p11/clinical-security'
RENDERS=L.ROOT/'artifacts/nextgen/p11-final/beauty'
# Shared-machine beauty rendering: CPU avoids concurrent Metal compilation; two threads.
from cpu_preview import stage as _stage
def preview_stage():
    scene=_stage();scene.cycles.device='CPU';scene.cycles.samples=16;scene.render.threads=2
    return scene
L._stage=preview_stage


def berth(x,y,open=False,index=0):
    # Recessed angled cradle, captive shoulder shell, foot manifold and service couplings.
    L.profile_x('Berth cradle',[(y-.9,.12),(y+.9,.12),(y+.9,.68),(y+.5,.95),(y-.65,.58),(y-.9,.37)],x-.48,x+.48,'p11-tint-metal',.04,tint='navy')
    L.box('Recessed patient pad',(x,y,.65),(.65,1.3,.10),'p11-rubber',.04,rotation=(.20,0,0))
    for sx in (-1,1):
        L.sweep('Cradle perimeter rail',[(x+sx*.46,y-.85,.48),(x+sx*.46,y-.55,.69),(x+sx*.46,y+.55,.94),(x+sx*.46,y+.85,.78)],.065,'p11-steel',6)
        for yy in (-.55,.55):L.cylinder('Lock piston',(x+sx*.5,y+yy,.43),.06,.5,'p11-steel','Z',8,0)
    if not open:
        L.profile_x('Frosted canopy',[(y-.62,.73),(y+.55,.99),(y+.71,1.07),(y+.48,1.31),(y-.48,1.05)],x-.35,x+.35,'p11-steel',.025)
        L.box('Canopy glass gasket',(x,y-.02,1.185),(.53,.77,.028),'p11-rubber',.025,rotation=(.28,0,0))
        L.box('Deep observation glass',(x,y-.02,1.205),(.43,.65,.02),'p11-tint',.018,rotation=(.28,0,0),tint='teal' if index%3 else 'navy')
        # Ice clings unevenly to the pressure glazing edges, leaving a viewing slit.
        for side in (-1,1):
            import bmesh
            bm=bmesh.new()
            contour=[(.215,-.30),(.215,.30),(.16,.30),(.12,.22),(.17,.13),(.13,.02),(.17,-.08),(.12,-.17),(.17,-.30)]
            bm.faces.new([bm.verts.new((x+side*xx,y-.02+yy,1.225+yy*math.sin(.28))) for xx,yy in contour])
            L.mesh_object('Uneven frost accretion',bm,'p11-frost',smooth=False)
        L.box('Glass pressure mullion',(x,y+.08,1.24),(.46,.035,.025),'p11-steel',0,rotation=(.28,0,0))
        for yy in (-.35,.4): L.box('Canopy pressure strap',(x,y+yy,1.19+yy*.27),(.8,.075,.035),'p11-steel',.008,rotation=(.28,0,0))
    else:
        L.profile_x('Retracted canopy',[(y+.6,.95),(y+.9,1.0),(y+.9,1.85),(y+.65,1.65)],x-.4,x+.4,'p11-steel',.015)
        L.box('Retracted lid frost window',(x,y+.58,1.39),(.50,.025,.48),'p11-frost',.03)
        L.box('Head cushion',(x,y+.4,.83),(.45,.30,.14),'p11-rubber',.05)
    for sx in (-1,1):
        for yy in (-.4,.35):L.cylinder('Pressure latch',(x+sx*.43,y+yy,.82+yy*.27),.055,.045,'e9-trim','X',8,0)
    L.box('Foot service pod',(x,y-.93,.39),(.8,.24,.58),'p11-tint-metal',.035,tint='navy')
    L.screen('Berth vitals',(x,y-1.06,.48),.44,.21,'-Y','bars')
    L.gauge((x+.29,y-1.06,.28),.06)
    for sx in (-1,1):
        L.sweep('Umbilical',[(x+sx*.30,y+.8,.78),(x+sx*.58,y+.85,.55),(x+sx*.63,y+.5,.18),(x+sx*.63,y-.8,.18),(x+sx*.4,y-.94,.32)],.035,'p11-rubber',7)
        L.cylinder('Umbilical connector',(x+sx*.3,y+.8,.78),.075,.13,'p11-steel','Z',8,0)

def awakening():
    L.asset('awakening-berth-array',12000)
    for i,x in enumerate([-4.55+i*1.3 for i in range(8)]):
        berth(x,0,i==3,i)
        L.stencil(str(i+1).zfill(2),(x,-1.065,.22),.10,'-Y')
    L.box('Supply spine',(0,1.0,.22),(10.6,.3,.38),'p11-tint-metal',.03,tint='navy')
    L.box('Open supply junction recess',(4.9,1.0,.43),(.48,.27,.08),'p11-rubber',.01)
    for x in (4.74,4.89,5.04):L.box('Exposed coolant contact',(x,1.0,.49),(.035,.21,.035),'e9-trim',0)
    L.box('Hinged service cover',(5.18,1.0,.60),(.28,.28,.035),'p11-tint-metal',.01,rotation=(0,.8,0),tint='navy')
    for i in range(21):L.box('Cooling fin',(-4.95+i*.47,1.0,.44),(.18,.32,.06),'e9-trim',.006)
    L.lamp_strip('Cryo bank status',(0,1.16,.28),10.0,'X','e9-cyan',.025,.025)

def passenger():
    L.asset('passenger-sleeper-carrier',12000)
    for sx in (-1,1):
        L.box('Carrier corner beam',(sx*1.4,0,1.55),(.13,1.4,3.1),'p11-steel',.025)
        L.box('Captive rail',(sx*1.25,-.68,1.55),(.07,.07,2.9),'e9-trim',.01)
    for row in range(4):
        z=.3+row*.7
        before=set(L.CURRENT.children)
        L.box('Sleeper drawer',(0,0,z),(2.55,1.25,.57),'p11-steel',.035)
        L.inset_panel('Sleeper lid',(0,-.64,z),2.3,.43,.035,.04,'e9-ceramic','p11-steel')
        L.handle((.75,-.69,z),.48,'X',.055,.022)
        L.stencil('C'+str(row+11),(-.72,-.70,z),.14,'-Y')
        L.lamp_strip('Occupant life strip',(-.1,-.70,z),.42,'X','e9-cyan',.015,.025)
        for sx in (-1,1):L.hinge((sx*1.08,-.69,z),.28,.022)
        L.inset_panel('Sleeper ID window',(-.72,-.71,z+.13),.39,.075,.008,.009,'p11-steel','e9-glass')
        for sx in (-1,1):
            L.cylinder('Captive lock',(sx*.98,-.72,z),.055,.025,'e9-trim','Y',8,0)
            L.box('Lock tongue',(sx*.98,-.74,z),(.06,.01,.015),'p11-rubber',0)
        if row==1:
            for ob in set(L.CURRENT.children)-before:ob.data.transform(Matrix.Translation((0,-.15,0)))
            L.box('Released slide carriage',(0,-.65,z-.31),(2.45,.28,.045),'p11-rubber',.004)

    L.box('Carrier base',(0,0,.08),(2.95,1.5,.16),'p11-steel',.025)
    for sx in (-1,1):
        L.cylinder('Carrier trolley wheel',(sx*1.06,.35,.1),.14,.13,'p11-rubber','X',10,0)
        L.sweep('Coolant return',[(sx*1.42,.6,.2),(sx*1.42,.6,2.9),(sx*.8,.6,3.13)],.045,'p11-rubber',8)
    L.box('Rack destination placard',(0,-.55,3.04),(1.4,.09,.16),'p11-steel',.01)
    L.stencil('NEW EARTH',(0,-.60,3.04),.10,'-Y')

def scanner():
    L.asset('checkpoint-scanner-gate',12000)
    for sx in (-1,1):
        x=sx*2.546
        L.profile_x('Scanner swept pylon',[(-.5,0),(.55,0),(.55,2.8),(.2,3.25),(-.3,3.25),(-.5,2.8)],x-.304,x+.304,'p11-tint-metal',.035,tint='navy')
        L.box('Scanner inset',(x-sx*.26,0,1.65),(.05,.60,2.2),'e9-dark',.015)
        for z in (.7,1.2,1.7,2.2,2.7):
            L.cylinder('Optical sensor',(x-sx*.30,0,z),.10,.06,'e9-trim','X',12,0)
            L.cylinder('Sensor pupil',(x-sx*.34,0,z),.05,.012,'e9-cyan','X',10,0)
        L.inset_panel('Scanner access hatch',(x,-.52,1.35),.36,1.30,.02,.025,'p11-steel','e9-trim')
        L.vent((x,-.54,.42),.35,.24,4)
        for z in (.8,1.85):L.hinge((x-.17,-.55,z),.15,.018)
    L.box('Scanner header',(0,0,3.15),(5.7,.9,.28),'p11-tint-metal',.04,tint='navy')
    for x in (-1.65,1.65):
        L.grille_top((x,0,3.30),1.1,.57,7)
        L.bolt_row((x-.5,-.35,3.30),(x+.5,-.35,3.30),4,.022,'Z')
    for x in (-.85,.85):L.box('Header assembly seam',(x,0,3.30),(.035,.88,.012),'p11-rubber',0)
    L.screen('Scan result',(0,-.46,3.15),1.28,.17,'-Y','bars')
    L.box('Scanner threshold',(0,0,.035),(5.7,1.1,.07),'p11-steel',.01)
    for sx in (-1,1):L.lamp_strip('Gate strip',(sx*2.22,-.3,1.65),2.35,'Z','e9-cyan',.025,.03)
    L.stencil('BIO SCAN',(0,-.46,2.98),.11,'-Y')

def armory():
    L.asset('armory-weapon-carousel',12000)
    L.cylinder('Carousel base',(0,0,.16),1.45,.32,'p11-steel','Z',24,.025)
    L.cylinder('Rotary bearing',(0,0,.38),1.23,.14,'e9-trim','Z',24,.015)
    L.cylinder('Weapon hub',(0,0,1.4),.36,2.0,'p11-steel','Z',12,.02)
    L.torus('Upper retaining hoop',(0,0,2.2),1.02,.065,'p11-steel','Z',24,6)
    L.torus('Lower retaining hoop',(0,0,.60),1.02,.06,'p11-steel','Z',24,6)
    for i in range(8):
        a=i*math.pi/4;x,y=math.cos(a)*.93,math.sin(a)*.93
        # Authored rifle silhouette: swept butt, trigger well, angled magazine,
        # vented handguard and offset optic; all geometry rotates with its rack.
        before=set(L.CURRENT.children)
        L.profile_x('Weapon swept stock',[(-.09,.7),(.21,.7),(.21,.82),(.10,.94),(.10,1.05),(-.07,1.05)],-.075,.075,'p11-rubber',.012)
        L.box('Weapon receiver',(0,0,1.30),(.14,.22,.51),'p11-tint-metal',.016,tint='navy')
        L.profile_x('Weapon pistol grip',[(-.10,1.30),(-.23,1.22),(-.28,1.02),(-.17,1.02),(-.09,1.19)],-.055,.055,'p11-rubber',.008)
        L.torus('Trigger guard',(0,-.13,1.29),.07,.012,'p11-steel','X',10,4)
        L.box('Weapon magazine',(0,.15,1.10),(.10,.15,.30),'p11-steel',.008,rotation=(.22,0,0))
        L.box('Vented handguard',(0,0,1.65),(.16,.15,.30),'p11-rubber',.012)
        for z in (1.56,1.64,1.72):L.box('Handguard cooling slot',(0,-.079,z),(.105,.012,.025),'e9-trim',0)
        L.cylinder('Weapon barrel',(0,0,2.0),.032,.44,'p11-steel','Z',8,0)
        L.cylinder('Weapon muzzle',(0,0,2.23),.045,.10,'p11-rubber','Z',8,0)
        L.cylinder('Weapon optic',(0,-.13,1.66),.038,.22,'p11-steel','Z',10,0)
        transform=Matrix.Translation((x,y,0)) @ Matrix.Rotation(a,4,'Z')
        for ob in set(L.CURRENT.children)-before:ob.data.transform(transform)
        L.box('Captive rifle clamp',(x,y,1.55),(.22,.26,.08),'e9-trim',.01,rotation=(0,0,a))
        L.sweep('Carousel spoke',[(0,0,.61),(x,y,.61)],.035,'p11-steel',6)
        L.cylinder('Slot status',(x,y,.44),.035,.01,'e9-cyan','Z',8,0)
    L.box('Issue console',(0,-1.15,.64),(.65,.36,.48),'p11-steel',.03)
    L.screen('Issue inventory',(0,-1.34,.7),.48,.26,'-Y','grid')
    L.stencil('ISSUE 04',(0,-1.35,.46),.09,'-Y')

L.reset_scene()
for f in (awakening,passenger,scanner,armory):f()
L.export('clinical-security',OUT,'clinical-security.glb','Cryogenic recovery and security landmarks.', 'blender -b --factory-startup -P tools/assets/p11-set-pieces/clinical_security.py')
if '--render' in L.args():
 for a in [v for v in L.ASSETS if not any(a.startswith('--only=') for a in L.args()) or '--only='+v.name in L.args()]:L.render(RENDERS/(a.name+'-game.png'),[a.name],'game',scale=1.25 if a.name=='armory-weapon-carousel' else 1.0)
