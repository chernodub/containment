"""Original P11 uplink, diagnostics, interlock and reactor machinery. MIT."""
import sys, math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import p11lib as L

def pedestal(name,w=3,d=1.3):
    L.box(name+' foundation',(0,0,.12),(w,d,.24),'e9-dark',.05)
    L.box(name+' body',(0,0,.55),(w-.2,d-.18,.8),'e9-body',.06)
    for x in (-w*.38,w*.38):
        L.inset_panel('Access hatch',(x,-d/2,.55),.55,.55,role='e9-body')
        L.handle((x,-d/2-.04,.55),.25)
    L.vent((0,-d/2-.02,.54),.65,.32,5)
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
    L.screen('Tracking display',(.9,-.92,.65),.5,.32,pattern='ring')

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
    L.screen('Spectral display',(-1,-.77,.7),.6,.35,pattern='bars')

def interlock():
    L.asset('key-cylinder-interlock',12000)
    pedestal('KEY',3.6,1.4)
    for x in (-1.1,0,1.1):
        L.cylinder('Key drum',(x,0,1.65),.4,1.15,'e9-body','Z',16)
        for z in (1.15,1.65,2.15):
            L.torus('Key bearing',(x,0,z),.4,.055,'e9-trim','Z',16,6)
        L.box('Physical key socket',(x,-.4,1.65),(.12,.05,.55),'e9-dark',.01)
        L.lamp_strip('Key status',(x,-.43,2.05),.22)
    for x in (-1.75,1.75):
        L.box('Cage post',(x,0,1.7),(.12,1.45,1.5),'e9-trim',.02)
    L.box('Cage crown',(0,0,2.5),(3.6,1.45,.12),'e9-body',.025)
    for x in (-1.45,-.7,.7,1.45):
        L.box('Rear cage bar',(x,.65,1.7),(.04,.04,1.5),'e9-dark',0)
    L.screen('Release sequence',(0,-.72,.6),.65,.3,pattern='schematic')

def dais():
    L.asset('manual-authorisation-dais',12000)
    pedestal('CTL',4.4,1.6)
    L.profile_x('Sloped console',[(-.8,.9),(.6,.9),(.6,1.65),(-.8,1.25)],-2.1,2.1,'e9-body',.04)
    for x in (-1.4,0,1.4):
        L.screen('Control display',(x,-.81,1.1),.9,.3,pattern='schematic')
        L.box('Lever quadrant',(x,-.25,1.45),(.6,.65,.15),'e9-dark',.02)
        L.cylinder('Lever pivot',(x,-.25,1.58),.15,.5,'e9-trim','X',12)
        L.sweep('Physical lever',[(x,-.25,1.58),(x,-.6,2.05)],.055,'e9-trim',8)
        L.cylinder('Lever grip',(x,-.6,2.05),.09,.45,'p11-rubber','X',12)
    L.stencil('MANUAL',(0,-.82,.92),.18)

def crown():
    L.asset('reactor-crown',12000)
    L.cylinder('Crown plinth',(0,0,.2),2.2,.4,'e9-dark','Z',32)
    L.lathe('Reactor vessel',[(1.4,.3),(1.7,.5),(1.55,1),(1.1,1.9),(1.1,2.35),(.95,2.5)],role='e9-body',segments=32)
    for z,r in ((.55,1.7),(1.0,1.55),(2.35,1.1)):
        L.torus('Containment collar',(0,0,z),r,.12,'e9-trim','Z',32,6)
    for i in range(8):
        a=i*math.tau/8
        L.sweep('Crown prong',[(2*math.cos(a),2*math.sin(a),.4),(1.9*math.cos(a),1.9*math.sin(a),1.6),(1.3*math.cos(a),1.3*math.sin(a),2.8)],.14,'e9-ceramic',6)
        L.sweep('Feed conduit',[(1.9*math.cos(a),1.9*math.sin(a),.45),(1.6*math.cos(a),1.6*math.sin(a),1.3)],.09,'p11-rubber',8)
        L.box('Power cell',(1.6*math.cos(a),1.6*math.sin(a),.9),(.3,.3,.55),'e9-body',.04)
    L.cylinder('Reaction aperture',(0,0,2.35),.85,.07,'e9-violet','Z',24)
    L.torus('Aperture lip',(0,0,2.4),.95,.1,'e9-trim','Z',32,6)

L.reset_scene()
for f in (uplink,diagnostic,interlock,dais,crown):f()
L.export('control-heroes',L.ROOT/'public/assets/p11/control','control.glb','Original control, diagnostic and reactor hero machinery.','blender -b --factory-startup -P tools/assets/p11-set-pieces/control_heroes.py')
if '--render' in L.args():
    for a in L.ASSETS:L.render(L.ROOT/'artifacts/nextgen/p11-final/beauty'/f'{a.name}.png',[a.name],'hero')
