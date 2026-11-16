"""Original MIT P11 maintenance and containment machinery; Blender 5.3."""
import math,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import p11lib as L
OUT=L.ROOT/'public/assets/p11/maintenance-containment'

def pump():
 L.asset('frost-manifold-turbines',12000)
 L.box('Pump skid',(0,0,.12),(4.6,2.4,.24),'e9-dark',.035)
 for x in (-1.15,1.15):
  for y in (-.7,.7): L.box('Bolted foot',(x,y,.3),(.65,.45,.2),'e9-trim',.02)
  L.cylinder('Turbine drum',(x,0,1),.65,1.55,'e9-body','Y',20,.025)
  for y in (-.72,-.45,.45,.72): L.torus('Casing reinforcing hoop',(x,y,1),.66,.055,'e9-trim','Y',20,5)
  L.cylinder('Drive end plate',(x,-.83,1),.59,.12,'p11-tint-metal','Y',20,.015,tint='service-blue')
  L.cylinder('Motor hub',(x,-.93,1),.22,.18,'e9-dark','Y',12,.012)
  for i in range(8):
   a=i*math.pi/4
   L.bolt((x+math.cos(a)*.5,-.91,1+math.sin(a)*.5),.035)
  L.box('Motor terminal',(x,.15,1.63),(.6,.45,.25),'e9-body',.035)
  L.stencil('P1' if x<0 else 'P2',(x,-.9,1.3),.13)
  L.sweep('Frosted discharge',[(x,.65,1.3),(x,.8,2.1),(0,.8,2.1)],.15,'p11-frost',10,bend=.18)
  L.flange((x,.8,1.8),.23,'Z',.07,6)
  L.valve_wheel((x,.8,2.33),.22,'Z',tint='teal')
  L.gauge((x,-.22,1.85),.13)
 L.sweep('Common return',[(-2,.85,.5),(-2,.85,2.1),(2,.85,2.1),(2,.85,.5)],.18,'e9-body',12,bend=.2)
 for x in (-2,2):
  L.cylinder('Return deck socket',(x,.85,.38),.25,.3,'e9-trim','Z',12,.01)
 L.box('Instrument pedestal',(0,-.5,1),(.16,.16,1.55),'e9-body',.015)
 for x in (-1.8,0,1.8): L.flange((x,.85,2.1),.25,'X',.08,6)
 L.box('Pump instrument bridge',(0,-.5,1.9),(.7,.3,.45),'e9-dark',.04)
 L.screen('Flow monitor',(0,-.66,1.91),.5,.25,pattern='bars')


def shaft():
 L.asset('lift-winch-machinery',12000)
 L.box('Winch foundation',(0,0,.12),(4.5,2.5,.24),'e9-dark',.03)
 for x in (-1.5,1.5):
  L.profile_x('Bearing pedestal',[(-.8,.24),(.8,.24),(.55,1.4),(-.55,1.4)],x-.2,x+.2,'e9-body',.035)
  L.cylinder('Bearing axle',(x,0,1.3),.3,.55,'e9-trim','X',16,.02)
 L.cylinder('Cable drum',(0,0,1.3),.65,2.6,'e9-dark','X',24,.02)
 for x in (-1.27,1.27): L.cylinder('Drum cheek',(x,0,1.3),.85,.12,'p11-tint-metal','X',24,.02,tint='service-blue')
 for i in range(23): L.torus('Wound lifting cable',(-1.14+i*.1,0,1.3),.69,.045,'p11-steel','X',20,4)
 L.box('Reduction gearbox',(1.85,0,1.15),(.6,1.15,1.15),'e9-body',.09)
 L.vent((1.85,-.59,1.2),.4,.6,6)
 L.cylinder('Brake flywheel',(-1.9,0,1.3),.52,.22,'e9-trim','X',18,.02)
 for i in range(8):
  a=i*math.pi/4
  L.bolt((-2.03,math.cos(a)*.4,1.3+math.sin(a)*.4),.03,'-X')
 L.box('Brake caliper',(-1.9,-.42,1.5),(.45,.35,.5),'e9-dark',.04)
 for x in (-.7,.7): L.sweep('Shaft cable',[(x,-.65,1.4),(x,-1.05,.8),(x,-1.05,.04)],.05,'p11-steel',6)
 L.stencil('LIFT 04',(0,-.85,.245),.15,'Z')
 L.handle((1.85,-.61,.8),.3,'X',.04,.02)
 L.box('Winch terminal',(1.85,.2,1.8),(.5,.5,.2),'e9-dark',.03)
 L.sweep('Brake linkage',[(-1.9,-.5,1.5),(-1.9,-.7,.7),(-1.9,-.5,.3)],.05,'e9-trim',6)


def emitter():
 L.asset('shield-field-emitter',12000)
 for x in (-1.65,1.65):
  L.slab('Emitter foot',[(x-.55,-.8),(x+.55,-.8),(x+.7,.6),(x-.7,.6)],0,.25,'e9-dark',.04)
  L.profile_x('Swept emitter pillar',[(-.55,.25),(.45,.25),(.4,2.9),(-.05,3.4),(-.4,3.1),(-.6,1)],x-.25,x+.25,'e9-body',.035)
  for z in (.8,1.3,1.8,2.3):
   L.box('Emitter cooling collar',(x,0,z),(.7,1.05,.12),'e9-trim',.02)
   L.box('Violet field lens',(x,-.57,z+.18),(.3,.06,.23),'e9-violet',.02)
  L.box('Insulated spine',(x,.47,1.75),(.22,.22,2.5),'p11-tint-metal',.025,tint='cream')
  L.gauge((x,-.58,.5),.13)
  L.inset_panel('Calibration hatch',(x+.265,0,2.72),.55,.52,.02,.04,'e9-body','e9-dark','X')
  for zz in (.75,1.8,2.9): L.bolt((x-.18,-.59,zz),.025)
  L.stencil('E1' if x<0 else 'E2',(x,-.48,2.85),.12)
  L.sweep('Field return conduit',[(x+.36,.3,.3),(x+.36,.3,2.7),(x,.3,3.12)],.065,'p11-steel',8,bend=.14)
  for side in (-1,1):
   L.profile_x('Crown fork',[(-.5,3.1),(-.4,3.65),(-.15,3.8),(.05,3.65),(-.1,3.2)],x+side*.18-.065,x+side*.18+.065,'e9-trim',.015)
  L.box('Recessed crown optic',(x,-.18,3.5),(.14,.18,.2),'e9-violet',.02)
 L.box('Field ground bus',(0,.3,.14),(3.2,.32,.25),'e9-dark',.025)
 L.stencil('FIELD',(0,.12,.23),.14)


def annulus():
 L.asset('containment-ring-cradle',12000)
 # Horizontal containment ring rests on four mechanically distinct quadrant shoes.
 L.torus('Containment armored ring',(0,0,1.35),1.9,.22,'e9-body','Z',48,8)
 L.torus('Field channel',(0,0,1.38),1.68,.055,'e9-violet','Z',48,5)
 L.torus('Outer guard',(0,0,1.4),2.12,.055,'e9-trim','Z',48,5)
 for i in range(8):
  a=i*math.pi/4;x=1.9*math.cos(a);y=1.9*math.sin(a)
  L.box('Radial clamp',(x,y,1.38),(.62,.3,.38),'e9-trim',.035,rotation=(0,0,a))
  L.box('Insulator',(x,y,1.61),(.32,.18,.08),'p11-tint-metal',.015,rotation=(0,0,a),tint='cream')
  for d in (-.2,.2): L.bolt((x+math.cos(a)*d,y+math.sin(a)*d,1.59),.028,'Z')
  # Segmented outer shield panels expose their dark gasket joints.
  b=a+math.pi/8
  px=2.02*math.cos(b);py=2.02*math.sin(b)
  L.box('Shield sector',(px,py,1.32),(.12,1.02,.38),'e9-body',.035,rotation=(0,0,b))
  L.box('Sector inset',(px*1.035,py*1.035,1.32),(.025,.72,.17),'e9-dark',.008,rotation=(0,0,b))
  L.box('Sector identification',(px*.95,py*.95,1.56),(.22,.32,.025),'e9-trim',.006,rotation=(0,0,b))
 for i in range(4):
  a=i*math.pi/2;x=1.9*math.cos(a);y=1.9*math.sin(a)
  L.box('Support shoe',(x,y,.12),(1,.8,.24),'e9-dark',.03,rotation=(0,0,a))
  L.box('Hydraulic support',(x,y,.7),(.45,.45,1.1),'e9-body',.04)
  L.cylinder('Piston',(x,y,1.15),.12,.5,'p11-steel','Z',10,.008)
  L.sweep('Hydraulic feed',[(x*1.1,y*1.1,.2),(x*1.1,y*1.1,.9),(x,y,1.1)],.045,'p11-rubber',6)
  for d in (-.3,.3): L.bolt((x+d,y,.25),.035,'Z')
 L.box('Ring controller',(0,-2.2,.65),(1.2,.5,.85),'e9-body',.05)
 L.screen('Ring phase',(0,-2.46,.8),.9,.4,pattern='ring')
 L.stencil('C4',(0,-2.46,.42),.12)

L.reset_scene();pump();shaft();emitter();annulus()
names=[a.name for a in L.ASSETS]
L.export('maintenance-containment',OUT,'maintenance-containment.glb','Original pump turbines, lift machinery, paired field emitters and containment ring.','blender -b --factory-startup -P tools/assets/p11-set-pieces/maintenance_containment.py')
if '--render' in L.args():
 from cpu_preview import stage
 L._stage=stage
 for name in ([names[2]] if '--emitter' in L.args() else names): L.render(L.ROOT/'artifacts/nextgen/p11-final/beauty'/(name+'-hero.png'),[name],'hero',scale=1.18)
