"""Original P11 uplink, diagnostics, interlock and reactor machinery. MIT."""
import sys, math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import p11lib as L
from cpu_preview import stage as cpu_stage
L._stage = cpu_stage

def hatch(name,x,y,z,w,h):
    L.inset_panel(name,(x,y,z),w,h,.035,.045,inner_role='p11-tint-metal',inner_tint='service-blue')
    for dz in (-h*.32,h*.32):L.hinge((x-w*.46,y-.025,z+dz),.12,.018)
    L.handle((x+w*.3,y-.04,z),h*.3,'Z',.04,.015)
    L.bolt_row((x-w*.36,y-.04,z+h*.4),(x+w*.36,y-.04,z+h*.4),3,.016)

def feet(w,d):
    for x in (-w/2+.18,w/2-.18):
        for y in (-d/2+.16,d/2-.16):
            L.box('Anchor shoe',(x,y,.12),(.36,.32,.24),'e9-dark',.035)
            for dx in (-.11,.11):L.bolt((x+dx,y,.25),.025,'Z')

def uplink_base():
    feet(3.5,1.8)
    L.slab('Cast azimuth bed',[(-1.75,-.6),(-1.45,-.9),(1.45,-.9),(1.75,-.6),(1.75,.6),(1.45,.9),(-1.45,.9),(-1.75,.6)],.2,.5,'e9-dark',.04)
    L.lathe('Tapered bearing pedestal',[(.8,.48),(.76,.65),(.55,.85),(.55,1.02)],role='p11-tint-metal',segments=20,tint='service-blue')
    for x in (-1.25,1.25):
        L.profile_x('Drive cabinet',[(-.65,.5),(.6,.5),(.45,.98),(-.4,.98),(-.65,.8)],x-.35,x+.35,'e9-body',.035)
        hatch('Drive access',x,-.675,.69,.52,.3)
    L.sweep('Bearing hydraulic supply',[(-1.25,.6,.7),(-.95,.72,.7),(-.55,.45,.85)],.035,'p11-rubber',8)
    for x in (-.65,.65):
        L.profile_x('Pedestal gusset',[(-.62,.48),(.62,.48),(.28,.95),(-.28,.95)],x-.035,x+.035,'e9-trim',.012)
    L.stencil('UPLINK 10',(-.6,-.91,.34),.13)

def lab_base():
    feet(3.4,1.5)
    L.box('Instrument chassis',(0,0,.29),(3.4,1.5,.25),'e9-dark',.045)
    for x in (-1.2,1.2):
        L.profile_x('Cast instrument support',[(-.65,.4),(.6,.4),(.48,.98),(-.48,.98)],x-.38,x+.38,'e9-body',.045)
        hatch('Service access',x,-.67,.63,.6,.4)
    L.box('Precision bed',(0,0,.96),(3.35,1.4,.16),'e9-trim',.025)
    for y in (-.5,.5):
        L.box('Ground instrument rail',(0,y,1.06),(2.9,.08,.05),'p11-steel',.008)
    L.box('Vacuum manifold',(0,.35,.62),(1.35,.35,.28),'e9-dark',.03)
    for x in (-.45,0,.45):
        L.cylinder('Vacuum port',(x,.35,.8),.08,.14,'e9-trim','Z',10)
    L.box('Recessed specimen drawer',(0,-.5,.64),(1.3,.2,.42),'e9-body',.025)
    L.handle((0,-.63,.65),.6)
    L.stencil('SPECIMEN 11',(-.65,-.76,.29),.11)

def key_base():
    feet(3.6,1.4)
    L.box('Interlock bed',(0,0,.32),(3.6,1.4,.26),'e9-dark',.035)
    for x in (-1.1,0,1.1):
        L.profile_x('Key mechanism gearbox',[(-.65,.45),(.6,.45),(.6,1.05),(-.4,1.05),(-.65,.85)],x-.5,x+.5,'e9-body',.035)
        hatch('Gearcase cover',x,-.68,.67,.8,.35)
    L.box('Rear hydraulic distributor',(0,.56,.7),(3.3,.15,.25),'e9-dark',.02)
    L.stencil('INTERLOCK 12',(-.7,-.715,.33),.11)

def uplink():
    L.asset('uplink-tracking-dish',12000)
    uplink_base()
    L.cylinder('Azimuth bearing',(0,0,1.05),.7,.25,'e9-trim','Z',24)
    for x in (-.7,.7):
        L.profile_x('Fork cheek',[(-.35,1.1),(.35,1.1),(.28,2.6),(-.25,2.6)],x-.1,x+.1,'e9-body',.03)
    L.cylinder('Elevation hub',(0,0,2.35),.3,1.8,'e9-trim','X',16)
    # Parabolic shallow dish, exposed radial ribs and a real receiver feed.
    L.lathe('Reflector',[(0,0),(.3,.025),(.7,.11),(1.1,.28),(1.5,.52),(1.55,.55),(1.55,.60),(1.1,.34),(.7,.17),(.3,.08),(0,.06)],(0,0,2.7),'e9-ceramic',32)
    for i in range(12):
        a=i*math.tau/12
        L.sweep('Dish stiffener',[(r*math.cos(a),r*math.sin(a),2.65+r*r*.24) for r in (.2,.6,1,1.5)],.035,'e9-trim',5)
    for a in (0,math.tau/3,math.tau*2/3):
        L.sweep('Feed strut',[(1.4*math.cos(a),1.4*math.sin(a),3.2),(0,0,3.7)],.035,'e9-dark',6)
    L.cylinder('Receiver feed',(0,0,3.7),.14,.32,'e9-trim','Z',12)
    L.lamp_strip('Receiver indicator',(0,-.15,3.7),.18)
    # Segment joints follow the reflector curvature instead of decorative flat stripes.
    for i in range(8):
        a=i*math.tau/8
        L.sweep('Reflector panel joint',[(r*math.cos(a),r*math.sin(a),2.77+r*r*.24) for r in (.35,.7,1.1,1.48)],.009,'e9-dark',4)
    L.flange((-.94,0,2.35),.31,'X',.07,8)
    L.cylinder('Elevation drive',(-1.12,0,2.35),.22,.3,'e9-body','X',16)
    L.cable_bundle('Drive power',(-1.28,0,2.35),(-1.2,.3,.95),3,.12)
    L.sweep('Hydraulic piston',[(.8,.35,1.15),(.8,.5,2.55)],.065,'e9-trim',8)
    L.cylinder('Azimuth motor',(.9,.3,1.1),.2,.6,'e9-body','Y',12)
    for i in range(16):
        a=i*math.tau/16
        L.box('Bearing lug',(.72*math.cos(a),.72*math.sin(a),1.08),(.11,.11,.12),'e9-dark',.01)
    L.box('Tracking control housing',(.93,-.73,.81),(.55,.2,.4),'e9-dark',.025)
    L.screen('Tracking display' ,(.93,-.845,.82),.43,.26,pattern='ring')
    for x in (-.7,.7):
        for z in (1.3,1.9):L.cylinder('Fork transverse boss',(x,0,z),.13,.27,'e9-trim','X',12)
        L.sweep('Fork rib',[(x,-.28,1.2),(x,-.23,2.15)],.035,'e9-trim',6)
    # A connected segmented harness travels around the azimuth joint.
    for i in range(10):
        a=math.pi*.15+i*.2
        L.box('Cable chain shoe',(.9*math.cos(a),.9*math.sin(a),1.15),(.13,.12,.09),'e9-dark',.01,rotation=(0,0,a))
    for z in (1.22,1.34,1.46):L.cylinder('Motor cooling fin',(.9,.3,z),.24,.025,'e9-trim','Z',12)
    L.hazard_band((-.95,-.91,.36),.35,.07)
    # Failed tracking repair: detached cover, severed loom and exposed terminal bank.
    L.box('Removed azimuth cover',(-1.16,-.48,1.1),(.58,.48,.055),'p11-tint-metal',.018,rotation=(.15,.12,.3),tint='service-blue')
    L.box('Exposed terminal recess',(1.25,-.45,1.02),(.58,.48,.06),'e9-dark',.015)
    for i in range(4):
        L.box('Terminal ceramic',(1.04+i*.14,-.45,1.075),(.08,.28,.07),'e9-ceramic',.008)
        L.sweep('Cut drive wire',[(1.04+i*.14,-.42,1.12),(1.22+i*.12,-.61,1.2),(1.28+i*.12,-.78,.8)],.015,'p11-rubber',5)
    L.stencil('MANUAL',(-1.46,-.68,1.14),.09,face='Z')


def diagnostic():
    L.asset('specimen-probe-cradle',12000)
    lab_base()
    for x in (-1,1):
        L.cylinder('Cradle roller',(x,0,1.04),.18,1.05,'e9-trim','Y',12)
    L.lathe('Specimen capsule',[(.05,0),(.32,.15),(.4,.45),(.4,1.5),(.3,1.7),(.05,1.8)],(-.9,0,1.22),'e9-glass',20,axis='X')
    L.cylinder('Probe pedestal',(1.25,.35,1.45),.25,.9,'e9-body','Z',12)
    for a,b in [((1.25,.35,1.8),(.65,.35,2.65)),((.65,.35,2.65),(-.45,.1,2.35)),((-.45,.1,2.35),(-.45,0,1.85))]:
        L.sweep('Probe articulated link',[a,b],.11,'e9-body',6)
        L.sweep('Link edge rib',[(a[0],a[1]-.12,a[2]),(b[0],b[1]-.12,b[2])],.025,'e9-trim',6)
        L.cylinder('Joint bearing',a,.18,.28,'e9-trim','Y',12)
    L.cylinder('Probe lens',(-.45,0,1.84),.15,.14,'p11-screen','Z',12)
    L.cable_bundle('Probe harness',(1.25,.5,1.3),(-.4,.2,2.2),3,.25)
    for x in (-.76,.65):
        L.torus('Capsule seal',(x,0,1.22),.4,.045,'e9-trim','X',20,6)
    for x in (-1,1):
        L.flange((x,-.56,1.04),.2,'Y',.045,6)
    for x,y,z in ((1.25,.35,1.8),(.65,.35,2.65),(-.45,.1,2.35)):
        L.flange((x,y-.16,z),.18,'Y',.04,6)
    L.sweep('Arm hydraulic ram',[(1.4,.2,1.45),(.8,.2,2.5)],.045,'e9-trim',8)
    L.cylinder('Specimen core',(-.15,0,1.22),.23,1.2,'p11-tint','X',12,tint='olive')
    for i in range(4):
        L.torus('Capsule retaining strap',(-.6+i*.36,0,1.22),.41,.025,'e9-dark','X',16,4)
    L.box('Spectral control head',(-1.22,-.69,.79),(.72,.16,.35),'e9-dark',.025)
    L.screen('Spectral display' ,(-1.22,-.79,.79),.6,.25,pattern='wave')
    L.flange((1.25,.35,1.09),.35,'Z',.07,6)
    L.cylinder('Probe drive motor',(1.25,.66,1.5),.21,.3,'e9-dark','Y',12)
    for i in range(5):L.cylinder('Probe motor fin',(1.25,.56+i*.045,1.5),.24,.015,'e9-trim','Y',12)
    L.cylinder('Capsule vacuum gland',(.82,0,1.22),.08,.16,'e9-trim','X',10)
    L.sweep('Specimen vacuum hose',[(.9,0,1.22),(1.05,.36,1.2),(.45,.35,.8)],.035,'p11-rubber',8)
    for x in (-.76,.65):
        L.box('Capsule saddle',(x,0,1.08),(.2,1,.08),'e9-dark',.02)
        for y in (-.4,.4):L.bolt((x,y,1.13),.025,'Z')
    L.box('Instrument serial plate',(.1,-.76,.93),(.75,.015,.1),'p11-tint',0,tint='cream')
    L.stencil('VAC - 02',(-.23,-.775,.93),.065,tint='black')
    # Interrupted diagnosis: live specimen cassette removed from an occupied berth.
    L.box('Open evidence drawer',(-.4,-.6,1.07),(1.25,.32,.07),'e9-dark',.025)
    for i in range(3):
        x=-.83+i*.42
        L.box('Patient evidence cassette',(x,-.6,1.15),(.32,.28,.1),'e9-ceramic',.02)
        L.box('Casette observation window',(x,-.6,1.21),(.23,.22,.012),'e9-dark',.005)
        L.box('Life reading',(x,-.6,1.222),(.025,.16,.012),'e9-cyan',0)
        L.stencil(str(41+i),(x-.1,-.68,1.234),.07,face='Z',tint='cream')
    L.sweep('Detached patient lead',[(-.8,-.6,1),(-1.1,-.65,1.2),(-1.5,-.5,1.05)],.024,'p11-rubber',6)


def interlock():
    L.asset('key-cylinder-interlock',12000)
    key_base()
    for x in (-1.1,0,1.1):
        L.cylinder('Key drum',(x,0,1.65),.4,1.15,'e9-body','Z',16)
        for z in (1.15,1.65,2.15):
            L.torus('Key bearing',(x,0,z),.4,.055,'e9-trim','Z',16,6)
        L.stencil(str(int((x+1.1)/1.1)+1),(x,-.42,1.92),.14)
        L.flange((x,0,2.23),.32,'Z',.045,6)
        L.box('Physical key socket',(x,-.4,1.65),(.16,.05,.55),'e9-dark',.01)
        L.box('Key shank',(x,-.44,1.65),(.055,.05,.43),'e9-trim',.008)
        for dz in (-.14,.02,.15):L.box('Key ward',(x+.055,-.44,1.65+dz),(.08,.05,.045),'e9-trim',0)
        L.handle((x,-.49,1.44),.25,'X',.07,.018)
        L.sweep('Cylinder lock ram',[(x+.46,.2,1.2),(x+.46,.2,2.05)],.055,'e9-dark',8)
        L.cylinder('Lock piston gland',(x+.46,.2,1.96),.085,.08,'e9-trim','Z',12)
        L.lamp_strip('Key status',(x,-.43,2.05),.22)
    for x in (-1.75,1.75):
        L.box('Cage post',(x,0,1.7),(.12,1.45,1.5),'e9-trim',.02)
    L.box('Cage crown rear',(0,.58,2.5),(3.6,.22,.12),'e9-body',.025)
    L.box('Cage crown front',(0,-.58,2.5),(3.6,.22,.12),'e9-body',.025)
    for x in (-1.45,-.7,.7,1.45):
        L.box('Rear cage bar',(x,.65,1.7),(.04,.04,1.5),'e9-dark',0)
    for x in (-1.1,0,1.1):
        for i in range(10):
            a=i*math.tau/10
            L.box('Indexing tooth',(x+.33*math.cos(a),.33*math.sin(a),2.29),(.09,.08,.08),'e9-dark',.005,rotation=(0,0,a))
        L.cylinder('Key lock spindle',(x,0,2.36),.1,.2,'e9-trim','Z',12)
        L.sweep('Key actuator feed',[(x,.45,1.2),(x,.53,.75)],.035,'p11-rubber',8)
    for x in (-1.75,1.75):
        L.bolt_row((x,-.73,1.05),(x,-.73,2.3),5,.02)
    L.sweep('Interlock service rail',[(-1.6,.58,.6),(0,.58,.6),(1.6,.58,.6)],.06,'e9-trim',8)
    L.screen('Release sequence',(0,-.715,.69),.65,.23,pattern='schematic')
    # Emergency lock welded shut from the operator side; a snapped release handle.
    L.box('Seal weld backing',(0,-.61,1.53),(2.9,.075,.24),'e9-dark',.018,rotation=(0,.08,0))
    for i in range(19):
        L.box('Irregular weld bead',(-1.3+i*.145,-.66,1.53+.035*math.sin(i*2.1)),(.17,.045,.07),'p11-steel',.012)
    L.sweep('Broken release lever',[(1.1,-.45,1.8),(1.35,-.57,1.88),(1.53,-.55,1.76)],.055,'e9-trim',6)
    L.stencil('SEALED',(-.36,-.66,1.56),.1)


def dais():
    L.asset('manual-authorisation-dais',12000)
    # Three independent control pods bridge a recessed service spine.
    L.box('Dais foot',(0,0,.1),(4.4,1.65,.2),'e9-dark',.045)
    L.box('Recessed service spine',(0,.35,.65),(4.1,.65,.95),'e9-dark',.045)
    for i,x in enumerate((-1.4,0,1.4)):
        L.profile_x('Angled control pedestal',[(-.7,.25),(.65,.25),(.65,1.6),(-.8,1.16),(-.8,.95),(-.45,.78)],x-.6,x+.6,'e9-body',.045)
        hatch('Service door',x,-.69,.52,.8,.35)
        L.screen('Control display '+str(i),(x,-.83,1.09),.85,.24,pattern=('wave','schematic','bars')[i])
        L.box('Quadrant inset',(x,-.18,1.43),(.7,.7,.08),'e9-dark',.025)
        for dx in (-.24,.24):
            L.profile_x('Quadrant cheek',[(-.52,1.43),(.19,1.6),(.12,1.76),(-.32,1.65)],x+dx-.035,x+dx+.035,'e9-trim',.012)
        L.cylinder('Lever pivot',(x,-.2,1.59),.09,.65,'e9-trim','X',12)
        L.flange((x-.34,-.2,1.59),.12,'X',.025,5)
        y=-.56+i*.15
        L.sweep('Physical lever',[(x,-.2,1.59),(x,y,1.98)],.045,'e9-trim',8)
        L.cylinder('Lever grip',(x,y,1.98),.065,.4,'p11-rubber','X',12)
        for tick in range(5):
            L.box('Detent index',(x+.35,-.45+tick*.12,1.49+tick*.035),(.06,.025,.015),'e9-ceramic',0)
        for dx in (-.4,.4):
            L.cylinder('Selector switch',(x+dx,-.46,1.4),.045,.06,'e9-trim','Z',10)
        L.box('Rear control cowl' ,(x,.5,1.64),(1.12,.22,.16),'e9-dark',.025)
        L.lamp_strip('Ready strip '+str(i),(x,.375,1.64),.3)
        L.bolt_row((x-.48,-.815,.96),(x+.48,-.815,.96),4,.017)
        L.stencil(('AUX','CORE','VENT')[i],(x,-.705,.32),.1)
    for x in (-2.1,2.1):
        L.sweep('Operator grab rail',[(x,-.68,.85),(x,-.95,1.1),(x,-.95,1.45)],.035,'e9-trim',8)
    L.sweep('Rear cable trunk',[(-2,.65,.5),(0,.65,.5),(2,.65,.5)],.08,'p11-rubber',8)
    for x in (-1.4,0,1.4):
        L.sweep('Pod power connection',[(x,.65,.5),(x,.65,1.5)],.045,'p11-rubber',8)

    L.box('Broken automatic control cover',(0,.22,1.82),(.85,.52,.06),'e9-body',.025,rotation=(.3,0,.18))
    for x in (-.25,0,.25):
        L.box('Bypass contact',(x,-.14,1.55),(.08,.4,.07),'p11-steel',.01)
    L.sweep('Hardwired override lead',[(-.22,-.3,1.62),(-.55,-.52,1.8),(-.85,-.52,1.6)],.035,'p11-rubber',6)
    L.stencil('HAND ONLY',(-.48,-.81,1.17),.1)

def crown():
    L.asset('reactor-crown',12000)
    # A pressure vessel is captured by eight structural quadrants. No loose rods.
    L.cylinder('Foundation ring',(0,0,.16),2.2,.32,'e9-dark','Z',32,bevel=.025)
    L.lathe('Pressure vessel',[(1.5,.3),(1.65,.45),(1.65,1.05),(1.35,1.65),(1.18,2.15),(1.18,2.45),(1.05,2.55)],role='e9-dark',segments=32)
    for z,r in ((.48,1.65),(1.08,1.65),(2.38,1.18)):
        L.torus('Pressure flange',(0,0,z),r,.075,'e9-trim','Z',32,6)
    for i in range(8):
        a=i*math.tau/8
        # A folded polygon bracket follows the pressure shell; broad facets read from above.
        obj=L.profile_x('Structural quadrant',[(1.72,.3),(2.02,.3),(2.02,.7),(1.78,1.7),(1.35,2.65),(1.16,2.65),(1.43,1.65),(1.62,.72)],-.17,.17,'p11-tint-metal',.025,tint='service-blue')
        obj.rotation_euler.z=a-math.pi/2
        c,d=math.cos(a),math.sin(a)
        L.box('Quadrant anchor shoe',(1.93*c,1.93*d,.32),(.4,.5,.16),'e9-body',.025,rotation=(0,0,a))
        for side in (-1,1):L.bolt((1.96*c-side*.16*d,1.96*d+side*.16*c,.42),.03,'Z')
        L.cylinder('Coolant service boss',(1.83*c,1.83*d,.72),.12,.16,'e9-trim','Z',12)
        L.sweep('Coolant supply hose',[(1.83*c,1.83*d,.8),(1.89*c,1.89*d,1.15),(1.48*c,1.48*d,1.75)],.045,'p11-rubber',8)
        L.cylinder('Upper coolant port',(1.48*c,1.48*d,1.74),.075,.12,'e9-trim','Z',10)
        # Tangential bolted shield cartridge behind each cast arm.
        L.box('Shield cartridge',(1.5*c,1.5*d,1.55),(.18,.65,.5),'e9-body',.03,rotation=(0,0,a))
        L.box('Cartridge panel',(1.61*c,1.61*d,1.55),(.035,.48,.34),'e9-trim',0,rotation=(0,0,a))
        for j in range(4):
            L.box('Cartridge cooling slot',(1.635*c,1.635*d,1.44+j*.075),(.02,.35,.025),'e9-dark',0,rotation=(0,0,a))
        L.cylinder('Flange stud',(1.1*c,1.1*d,2.58),.045,.09,'e9-trim','Z',8)
    L.cylinder('Reaction well',(0,0,2.46),1.02,.05,'e9-dark','Z',32)
    for r in (.28,.52,.77):L.torus('Induction winding',(0,0,2.60),r,.025,'e9-violet','Z',32,5)
    L.cylinder('Reaction hub',(0,0,2.64),.15,.12,'e9-trim','Z',16)
    for i in range(6):
        a=i*math.tau/6
        L.box('Aperture safety rib',(.55*math.cos(a),.55*math.sin(a),2.66),(.7,.055,.04),'e9-trim',0,rotation=(0,0,a))
    L.torus('Aperture collar',(0,0,2.55),1.03,.07,'e9-body','Z',32,6)
    L.box('Core control housing',(0,-1.93,.63),(.8,.3,.55),'e9-body',.035)
    L.screen('Core temperature',(0,-2.1,.7),.58,.23,pattern='bars')
    L.stencil('CORE 20',(-.36,-2.1,.43),.1)

for pack, builders in (('control',(uplink,diagnostic,interlock)),('reactor',(dais,crown))):
    L.reset_scene()
    for f in builders:f()
    L.export(pack+'-heroes',L.ROOT/('public/assets/p11/'+pack),pack+'.glb','Original mechanical control, diagnostic and reactor hero machinery.','blender -b --factory-startup -P tools/assets/p11-set-pieces/control_heroes.py')
    if '--render' in L.args():
        for a in L.ASSETS:
            if '--only' in L.args() and a.name != L.args()[L.args().index('--only')+1]:continue
            L.render(L.ROOT/'artifacts/nextgen/p11-final/beauty'/f'{a.name}.png',[a.name],'hero')
