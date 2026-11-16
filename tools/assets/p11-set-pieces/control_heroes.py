"""Original P11 uplink, diagnostics, interlock and reactor machinery. MIT."""
import sys, math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import p11lib as L
from cpu_preview import stage as cpu_stage
L._stage = cpu_stage

def pedestal(name,w=3,d=1.3):
    L.box(name+' foundation',(0,0,.12),(w,d,.24),'e9-dark',.05)
    L.box(name+' body',(0,0,.55),(w-.2,d-.18,.8),'e9-body',.06)
    for x in (-w*.38,w*.38):
        L.inset_panel('Access hatch',(x,-d/2,.55),.55,.55,role='e9-body')
        L.handle((x,-d/2-.04,.55),.25)
    L.vent((0,-d/2-.02,.27),.65,.15,4)
    L.stencil(name[:3].upper(),(0,-d/2-.04,.87),.12)

def uplink():
    L.asset('uplink-tracking-dish',12000)
    pedestal('UPL',3.5,1.8)
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
    L.screen('Tracking display' ,(.9,-.92,.65),.5,.32,pattern='ring')

def diagnostic():
    L.asset('specimen-probe-cradle',12000)
    pedestal('LAB',3.4,1.5)
    for x in (-1,1):
        L.cylinder('Cradle roller',(x,0,1.04),.18,1.05,'e9-trim','Y',12)
    L.lathe('Specimen capsule',[(.05,0),(.32,.15),(.4,.45),(.4,1.5),(.3,1.7),(.05,1.8)],(-.9,0,1.22),'e9-glass',20,axis='X')
    L.cylinder('Probe pedestal',(1.25,.35,1.45),.25,.9,'e9-body','Z',12)
    for a,b in [((1.25,.35,1.8),(.65,.35,2.65)),((.65,.35,2.65),(-.45,.1,2.35)),((-.45,.1,2.35),(-.45,0,1.85))]:
        L.sweep('Probe articulated link',[a,b],.11,'e9-ceramic',6)
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
    L.screen('Spectral display' ,(-1,-.77,.7),.6,.35,pattern='bars')

def interlock():
    L.asset('key-cylinder-interlock',12000)
    pedestal('KEY',3.6,1.4)
    for x in (-1.1,0,1.1):
        L.cylinder('Key drum',(x,0,1.65),.4,1.15,'e9-body','Z',16)
        for z in (1.15,1.65,2.15):
            L.torus('Key bearing',(x,0,z),.4,.055,'e9-trim','Z',16,6)
        L.stencil(str(int((x+1.1)/1.1)+1),(x,-.42,1.92),.14)
        L.flange((x,0,2.23),.32,'Z',.045,6)
        L.box('Physical key socket',(x,-.4,1.65),(.12,.05,.55),'e9-dark',.01)
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
    L.screen('Release sequence',(0,-.72,.6),.65,.3,pattern='schematic')

def dais():
    L.asset('manual-authorisation-dais',12000)
    # Three independent control pods bridge a recessed service spine.
    L.box('Dais foot',(0,0,.1),(4.4,1.65,.2),'e9-dark',.045)
    L.box('Recessed service spine',(0,.35,.65),(4.1,.65,.95),'e9-dark',.045)
    for i,x in enumerate((-1.4,0,1.4)):
        L.profile_x('Angled control pedestal',[(-.7,.25),(.65,.25),(.65,1.6),(-.8,1.16),(-.8,.95),(-.45,.78)],x-.6,x+.6,'e9-body',.045)
        L.inset_panel('Service door',(x,-.46,.56),.8,.5,inner_role='e9-dark')
        L.handle((x,-.5,.56),.25)
        L.hinge((x-.33,-.49,.56),.2)
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
        L.box('Rear control cowl',(x,.5,1.64),(1.12,.22,.16),'e9-dark',.025)
        L.lamp_strip('Ready strip '+str(i),(x,.375,1.64),.3)
        L.bolt_row((x-.48,-.815,.96),(x+.48,-.815,.96),4,.017)
        L.stencil(('AUX','CORE','VENT')[i],(x,-.49,.35),.1)
    for x in (-2.1,2.1):
        L.sweep('Operator grab rail',[(x,-.68,.85),(x,-.95,1.1),(x,-.95,1.45)],.035,'e9-trim',8)
    L.sweep('Rear cable trunk',[(-2,.65,.5),(0,.65,.5),(2,.65,.5)],.08,'p11-rubber',8)
    for x in (-1.4,0,1.4):
        L.sweep('Pod power connection',[(x,.65,.5),(x,.65,1.5)],.045,'p11-rubber',8)

def crown():
    L.asset('reactor-crown',12000)
    L.cylinder('Crown plinth',(0,0,.2),2.2,.4,'e9-dark','Z',32)
    L.lathe('Reactor vessel',[(1.4,.3),(1.7,.5),(1.55,1),(1.1,1.9),(1.1,2.35),(.95,2.5)],role='e9-body',segments=32)
    for z,r in ((.55,1.7),(1.0,1.55),(2.35,1.1)):
        L.torus('Containment collar',(0,0,z),r,.12,'e9-trim','Z',32,6)
    for i in range(8):
        a=i*math.tau/8
        L.sweep('Crown prong',[(2*math.cos(a),2*math.sin(a),.4),(1.9*math.cos(a),1.9*math.sin(a),1.6),(1.3*math.cos(a),1.3*math.sin(a),2.8)],.1,'e9-trim',8)
        L.sweep('Feed conduit',[(1.9*math.cos(a),1.9*math.sin(a),.45),(1.6*math.cos(a),1.6*math.sin(a),1.3)],.09,'p11-rubber',8)
        L.box('Power cell',(1.6*math.cos(a),1.6*math.sin(a),.9),(.3,.3,.55),'e9-body',.04)
    for i in range(8):
        a=i*math.tau/8
        L.box('Crown fin armour',(1.72*math.cos(a),1.72*math.sin(a),1.75),(.48,.22,1.45),'e9-body',.045,rotation=(0,-.22,a))
        for z in (1.25,1.55,1.85,2.15):
            L.box('Fin cooling slot',(1.88*math.cos(a),1.88*math.sin(a),z),(.28,.075,.055),'e9-dark',0,rotation=(0,0,a))
        L.cylinder('Feed gland',(1.55*math.cos(a),1.55*math.sin(a),.72),.18,.12,'e9-trim','Z',12)
        L.box('Capacitor window',(1.47*math.cos(a),1.47*math.sin(a),1.25),(.18,.18,.5),'e9-violet',.02)
    for i in range(4):
        a=i*math.tau/4
        L.box('Radial maintenance hatch',(1.57*math.cos(a),1.57*math.sin(a),.9),(.55,.13,.5),'e9-trim',.025,rotation=(0,0,a+math.pi/2))
    L.cylinder('Reaction well',(0,0,2.54),.85,.07,'e9-dark','Z',24)
    for r in (.25,.48,.72):
        L.torus('Aperture induction coil',(0,0,2.6),r,.035,'e9-violet','Z',24,5)
    L.cylinder('Aperture hub',(0,0,2.62),.15,.13,'e9-trim','Z',12)
    for i in range(8):
        a=i*math.tau/8
        L.box('Aperture radial shield',(.53*math.cos(a),.53*math.sin(a),2.66),(.57,.08,.06),'e9-dark',.01,rotation=(0,0,a))
    L.torus('Aperture lip',(0,0,2.57),.95,.1,'e9-trim','Z',32,6)

L.reset_scene()
for f in (uplink,diagnostic,interlock,dais,crown):f()
L.export('control-heroes',L.ROOT/'public/assets/p11/control','control.glb','Original control, diagnostic and reactor hero machinery.','blender -b --factory-startup -P tools/assets/p11-set-pieces/control_heroes.py')
if '--render' in L.args():
    for a in L.ASSETS:L.render(L.ROOT/'artifacts/nextgen/p11-final/beauty'/f'{a.name}.png',[a.name],'hero')
