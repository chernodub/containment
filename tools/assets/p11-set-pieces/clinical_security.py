"""P11 cryogenic and security landmarks; original MIT geometry."""
import sys, math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import p11lib as L
OUT=L.ROOT/'public/assets/p11/clinical-security'
RENDERS=L.ROOT/'artifacts/nextgen/p11-final/beauty'
# Shared-machine beauty rendering: CPU avoids concurrent Metal compilation; two threads.
from cpu_preview import stage as _stage
def preview_stage():
    scene=_stage();scene.cycles.device='CPU';scene.cycles.samples=16;scene.render.threads=2
    return scene
L._stage=preview_stage


def berth(x,y,open=False):
    # Recessed angled cradle, captive shoulder shell, foot manifold and service couplings.
    L.profile_x('Berth cradle',[(y-.9,.12),(y+.9,.12),(y+.9,.68),(y+.5,.95),(y-.65,.58),(y-.9,.37)],x-.48,x+.48,'p11-steel',.04)
    L.box('Recessed patient pad',(x,y,.65),(.65,1.3,.10),'p11-rubber',.04,rotation=(.20,0,0))
    for sx in (-1,1):
        L.sweep('Cradle perimeter rail',[(x+sx*.46,y-.85,.48),(x+sx*.46,y-.55,.69),(x+sx*.46,y+.55,.94),(x+sx*.46,y+.85,.78)],.065,'e9-ceramic',6)
        for yy in (-.55,.55):L.cylinder('Lock piston',(x+sx*.5,y+yy,.43),.06,.5,'p11-steel','Z',8,0)
    if not open:
        L.profile_x('Frosted canopy',[(y-.62,.73),(y+.55,.99),(y+.71,1.07),(y+.48,1.31),(y-.48,1.05)],x-.35,x+.35,'p11-frost',.025)
        for yy in (-.35,.4): L.box('Canopy pressure strap',(x,y+yy,1.03+yy*.3),(.8,.075,.035),'p11-steel',.008,rotation=(.28,0,0))
    else:
        L.profile_x('Retracted canopy',[(y+.6,.95),(y+.9,1.0),(y+.9,1.85),(y+.65,1.65)],x-.4,x+.4,'p11-frost',.015)
        L.box('Head cushion',(x,y+.4,.83),(.45,.30,.14),'p11-rubber',.05)
    L.box('Foot service pod',(x,y-.93,.39),(.8,.24,.58),'p11-steel',.035)
    L.screen('Berth vitals',(x,y-1.06,.48),.44,.21,'-Y','bars')
    L.gauge((x+.29,y-1.06,.28),.06)
    for sx in (-1,1):
        L.sweep('Umbilical',[(x+sx*.30,y+.8,.78),(x+sx*.58,y+.85,.55),(x+sx*.63,y+.5,.18),(x+sx*.63,y-.8,.18),(x+sx*.4,y-.94,.32)],.035,'p11-rubber',7)
        L.cylinder('Umbilical connector',(x+sx*.3,y+.8,.78),.075,.13,'p11-steel','Z',8,0)

def awakening():
    L.asset('awakening-berth-array',12000)
    for i,x in enumerate((-1.25,0,1.25)):
        berth(x,0,i==1)
        L.stencil(str(i+1).zfill(2),(x,-1.065,.22),.10,'-Y')
    L.box('Supply spine',(0,1.0,.22),(3.8,.3,.38),'p11-steel',.03)
    for i in range(8):L.box('Cooling fin',(-1.65+i*.47,1.0,.44),(.18,.32,.06),'e9-trim',.006)
    L.lamp_strip('Cryo bank status',(0,1.16,.28),3.4,'X','e9-cyan',.025,.025)

def passenger():
    L.asset('passenger-sleeper-carrier',12000)
    for sx in (-1,1):
        L.box('Carrier corner beam',(sx*1.4,0,1.55),(.13,1.4,3.1),'p11-steel',.025)
        L.box('Captive rail',(sx*1.25,-.68,1.55),(.07,.07,2.9),'e9-trim',.01)
    for row in range(4):
        z=.3+row*.7
        L.box('Sleeper drawer',(0,0,z),(2.55,1.25,.57),'p11-steel',.035)
        L.inset_panel('Sleeper lid',(0,-.64,z),2.3,.43,.035,.04,'e9-ceramic','p11-steel')
        L.handle((.75,-.69,z),.48,'X',.055,.022)
        L.stencil('C'+str(row+11),(-.72,-.70,z),.14,'-Y')
        L.lamp_strip('Occupant life strip',(-.1,-.70,z),.42,'X','e9-cyan',.015,.025)
        for sx in (-1,1):L.hinge((sx*1.08,-.69,z),.28,.022)
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
        L.profile_x('Scanner swept pylon',[(-.5,0),(.55,0),(.55,2.8),(.2,3.25),(-.3,3.25),(-.5,2.8)],x-.304,x+.304,'p11-steel',.035)
        L.box('Scanner inset',(x-sx*.26,0,1.65),(.05,.60,2.2),'e9-dark',.015)
        for z in (.7,1.2,1.7,2.2,2.7):
            L.cylinder('Optical sensor',(x-sx*.30,0,z),.10,.06,'e9-trim','X',12,0)
            L.cylinder('Sensor pupil',(x-sx*.34,0,z),.05,.012,'e9-cyan','X',10,0)
        L.inset_panel('Scanner access hatch',(x,-.52,1.35),.36,1.30,.02,.025,'p11-steel','e9-trim')
        L.vent((x,-.54,.42),.35,.24,4)
        for z in (.8,1.85):L.hinge((x-.17,-.55,z),.15,.018)
    L.box('Scanner header',(0,0,3.15),(5.7,.9,.28),'p11-steel',.04)
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
        # Distinct hard-surface rifle silhouette, stock receiver barrel magazine.
        L.box('Weapon receiver',(x,y,1.3),(.14,.24,.65),'p11-rubber',.02,rotation=(0,0,a))
        L.box('Weapon stock',(x,y,.85),(.15,.20,.30),'p11-steel',.02,rotation=(0,0,a))
        L.cylinder('Weapon barrel',(x,y,1.9),.035,.65,'p11-steel','Z',8,0)
        L.box('Weapon magazine',(x+math.cos(a)*.13,y+math.sin(a)*.13,1.13),(.15,.18,.26),'e9-trim',.014,rotation=(0,0,a))
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
 for a in L.ASSETS:L.render(RENDERS/(a.name+'-game.png'),[a.name],'game')
