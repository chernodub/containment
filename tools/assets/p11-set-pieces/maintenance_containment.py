"""Original MIT P11 maintenance and containment machinery; Blender 5.3."""
import math,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import p11lib as L
OUT=L.ROOT/'public/assets/p11/maintenance-containment'

def pump():
 L.asset('frost-manifold-turbines',12000)
 # Open channel skid instead of a solid slab; load paths readable under machines.
 for y in (-.92,.92):
  L.profile_x('Skid folded channel',[(y-.12,0),(y+.12,0),(y+.12,.27),(y+.06,.27),(y+.06,.08),(y-.12,.08)],-2.3,2.3,'e9-dark',.012)
 for x in (-1.7,0,1.7):L.box('Skid crossmember',(x,0,.12),(.15,2.1,.15),'e9-body',.018)
 for side,x in enumerate((-1.15,1.15)):
  for y in (-.56,.62):
   L.profile_x('Splayed pump foot',[(y-.25,.25),(y+.25,.25),(y+.15,.52),(y-.1,.52)],x-.4,x+.4,'e9-body',.02)
   for dx in (-.3,.3):L.bolt((x+dx,y-.16,.29),.04,'Z')
  # Sculpted stepped volute casing and rear electric drive are different masses.
  L.lathe('Volute pump casting',[(.34,0),(.53,.08),(.65,.21),(.64,.4),(.5,.5),(.35,.56)],(x,-.64,1.02),'e9-body',20,'Y')
  L.cylinder('Volute joint flange',(x,-.7,1.02),.63,.09,'p11-steel','Y',20,.01)
  L.cylinder('Volute removable cover',(x,-.77,1.02),.56,.1,'p11-tint-metal','Y',20,.025,tint='service-blue')
  L.lathe('Suction bell',[(.22,0),(.26,.08),(.25,.19),(.18,.29)],(x,-.98,1.02),'e9-dark',14,'Y')
  L.sweep('Suction return elbow',[(x,-.98,1.02),(x,-1.04,.75),(x,-1.04,.4),(x,-.85,.27)],.12,'e9-body',8,bend=.1)
  L.flange((x,-.85,.27),.19,'Z',.06,4)
  for i in range(6):
   a=i*math.pi/3;L.bolt((x+math.cos(a)*.51,-.84,1.02+math.sin(a)*.51),.035)
  L.cylinder('Coupling shaft',(x,.04,1.02),.14,.55,'p11-steel','Y',12,.01)
  L.box('Coupling guard',(x,.04,1.04),(.51,.4,.5),'e9-dark',.06)
  L.grille_top((x,.03,1.3),.4,.3,6)
  L.cylinder('Electric drive motor',(x,.53,1.02),.4,.66,'e9-dark','Y',16,.025)
  for i in range(10):
   a=i*math.pi/5
   L.box('Motor longitudinal cooling fin',(x+math.cos(a)*.4,.53,1.02+math.sin(a)*.4),(.035,.56,.11),'e9-body',.004,rotation=(0,a,0))
  L.cylinder('Motor fan cowl',(x,.91,1.02),.44,.16,'e9-body','Y',16,.025)
  L.box('Gasketed terminal',(x,.52,1.5),(.48,.36,.22),'p11-tint-metal',.025,tint='service-blue')
  for dx in (-.15,.15):L.bolt((x+dx,.45,1.63),.025,'Z')
  L.cylinder('Terminal cable gland',(x+.28,.52,1.5),.05,.12,'p11-steel','X',8,0)
  L.sweep('Motor loom',[(x+.33,.52,1.5),(x+.5,.66,.8),(x+.5,.82,.3),(0,.9,.3)],.03,'p11-rubber',6,bend=.1)
  L.sweep('Insulated discharge',[(x-.28,-.25,1.45),(x-.28,-.25,1.98),(x,.3,2.05),(0,.3,2.05)],.13,'e9-body',10,bend=.14)
  L.flange((x-.28,-.25,1.68),.21,'Z',.07,6)
  L.cylinder('Valve body',(x-.28,-.25,1.86),.17,.2,'p11-steel','Z',12,.01)
  L.valve_wheel((x-.28,-.25,2.12),.19,'Z',tint='teal')
  L.sweep('Instrument impulse line',[(x+.3,-.3,1.4),(x+.4,-.32,1.7),(x+.13,-.36,1.75)],.018,'p11-steel',5,bend=.07)
  L.gauge((x+.13,-.36,1.75),.12)
  L.stencil('P1' if side==0 else 'P2',(x-.14,-.84,1.23),.1)
  # Frost is discontinuous crust at joints, not white unconnected pipe.
  for yy in (-.28,-.2):L.torus('Frost seam',(x-.28,yy,1.69),.205,.014,'p11-frost','Z',12,4)
 # Ruptured coupling: two separated pipe ends, displaced clamp, frost runoff.
 L.sweep('Intact return rise',[(-2.05,-.9,.25),(-2.05,-.9,2.05),(.35,-.9,2.05)],.14,'e9-body',12,bend=.17)
 L.sweep('Buckled return rise',[(.77,-.76,1.85),(1.45,-.9,2.05),(2.05,-.9,2.05),(2.05,-.9,.25)],.14,'e9-body',12,bend=.17)
 for x,y,z in ((.35,-.9,2.05),(.77,-.76,1.85)):
  L.cylinder('Black rupture mouth',(x,y,z),.11,.025,'e9-dark','X',10,0)
  L.flange((x,y,z),.23,'X',.055,4)
 for i in range(5):
  y=-.9+i*.07
  L.sweep('Frozen escaping coolant',[(.52,y,1.9),(.58+.045*i,y,1.3),(.75+.05*i,y,.1)],.032+i*.005,'p11-frost',5)
 L.slab('Asymmetric frozen catchpool',[(-.55,-1.01),(-.32,-.9),(.8,-.93),(1.2,-.8),(.82,-.47),(.1,-.4),(-.5,-.62)],.015,.038,'p11-tint',.006,tint='#536c70')
 for i in range(4):
  L.slab('Fractured ice scale',[(-.35+i*.2,-.9),(-.12+i*.2,-.83),(-.2+i*.2,-.58),(-.4+i*.2,-.67)],.041,.055,'p11-frost',0)
 L.box('Displaced coupling clamp',(.6,-.9,.14),(.42,.28,.1),'p11-steel',.02,rotation=(0,.2,.4))
 for x in (-2.05,2.05):L.flange((x,-.9,.28),.23,'Z',.1,6)
 L.sweep('Common cross connector',[(0,.3,2.05),(0,.7,2.05)],.13,'e9-body',10)
 L.flange((0,.5,2.05),.22,'Y',.06,6)
 L.profile_x('Instrument pedestal',[(-.85,.25),(-.55,.25),(-.55,1.9),(-.75,1.9)],-.22,.22,'e9-dark',.025)
 L.box('Flow transducer console',(0,-.72,1.94),(.68,.3,.43),'e9-body',.035)
 L.screen('Flow monitor',(0,-.89,1.95),.48,.23,pattern='bars')
 for x in (-.18,.18):L.cylinder('Flow selector',(x,-.9,1.81),.025,.03,'p11-steel','Y',8,0)


def shaft():
 L.asset('lift-winch-machinery',12000)
 for y in (-.95,.95):L.box('Winch runner',(0,y,.12),(4.5,.27,.24),'e9-dark',.025)
 for x in (-1.55,0,1.55):L.box('Skid tie',(x,0,.12),(.25,2.15,.2),'e9-body',.02)
 for x in (-1.5,1.5):
  L.profile_x('A frame bearing pedestal',[(-.82,.24),(.82,.24),(.48,1.56),(-.48,1.56)],x-.19,x+.19,'e9-body',.03)
  for y in (-.65,.65):
   L.box('Bearing mounting pad',(x,y,.28),(.55,.35,.1),'p11-steel',.015)
   L.bolt((x,y,.35),.055,'Z')
  L.cylinder('Split bearing cartridge',(x,0,1.3),.34,.52,'e9-dark','X',16,.025)
  L.cylinder('Bearing flange',(x-.29,0,1.3),.39,.08,'p11-steel','X',16,.01)
  L.box('Bearing cap seam',(x,0,1.51),(.55,.62,.04),'p11-steel',0)
  for y in (-.25,.25):L.bolt((x,y,1.6),.04,'Z')
  L.cylinder('Grease nipple',(x,0,1.7),.035,.13,'p11-steel','Z',8,0)
 L.cylinder('Cable drum',(0,0,1.3),.65,2.6,'e9-dark','X',24,.02)
 for x in (-1.27,1.27):
  L.cylinder('Drum cheek',(x,0,1.3),.85,.12,'p11-tint-metal','X',24,.02,tint='service-blue')
  for i in range(6):
   a=i*math.pi/3
   L.box('Drum cheek radial rib',(x+(-.08 if x<0 else .08),.44*math.cos(a),1.3+.44*math.sin(a)),(.065,.5,.065),'e9-dark',.01,rotation=(a,0,0))
 # One continuous wound cable, with both real ends reaching fairlead sheaves.
 points=[]
 for i in range(20*12+1):
  t=i/(20*12);a=t*20*math.tau
  points.append((-1.14+t*2.28,.69*math.cos(a),1.3+.69*math.sin(a)))
 L.sweep('Continuous helical lift rope',points,.04,'p11-steel',4)
 L.profile_x('Reduction gearbox casting',[(-.6,.44),(.6,.44),(.6,1.4),(.3,1.72),(-.35,1.72),(-.6,1.4)],1.65,2.18,'e9-body',.045)
 L.inset_panel('Gearbox inspection hatch',(1.91,-.615,1.12),.37,.55,.02,.035,inner_role='p11-tint-metal',inner_tint='service-blue')
 L.handle((1.91,-.65,1.13),.19,'Z',.04,.018)
 for z in (.92,1.33):L.cylinder('Hatch hinge',(1.73,-.65,z),.025,.13,'p11-steel','Z',8,0)
 L.cylinder('Brake disc',(-1.96,0,1.3),.55,.12,'p11-steel','X',24,.01)
 L.cylinder('Brake hub',(-2.06,0,1.3),.2,.13,'e9-dark','X',12,.015)
 for i in range(8):
  a=i*math.pi/4;L.bolt((-2.04,.42*math.cos(a),1.3+.42*math.sin(a)),.025,'-X')
 L.profile_x('Spring brake caliper',[(-.58,.9),(-.58,1.55),(-.25,1.75),(-.2,1.5),(-.35,1.15)],-2.18,-1.72,'e9-dark',.025)
 L.cylinder('Brake hydraulic actuator',(-1.95,-.65,1.42),.11,.38,'e9-body','Z',12,.015)
 L.sweep('Brake pressure line',[(-1.95,-.65,1.2),(-2.1,-.65,.58),(-1.8,.65,.35),(1.9,.65,.35),(1.9,.61,1.4)],.022,'p11-steel',5,bend=.08)
 for x in (-1.14,1.14):
  L.cylinder('Fairlead sheave',(x,-.91,.56),.2,.15,'e9-dark','X',14,.01)
  L.torus('Fairlead groove',(x,-.91,.56),.19,.025,'p11-steel','X',14,4)
  L.profile_x('Fairlead bracket',[(-1.16,.22),(-.64,.22),(-.72,.63),(-1.05,.63)],x-.15,x+.15,'e9-body',.015)
  L.sweep('Shaft cable',[(x,.69,1.3),(x,.48,1.8),(x,0,2),(x,-.48,1.8),(x,-.69,1.3),(x,-1.07,.67),(x,-1.1,.08)],.04,'p11-steel',5)
 L.box('Winch terminal',(1.9,.26,1.8),(.45,.44,.18),'e9-dark',.025)
 L.cylinder('Terminal gland',(1.9,.54,1.8),.04,.12,'p11-steel','Y',8,0)
 L.stencil('L04',(0,-.96,.25),.12,'Z')

def emitter():
 L.asset('shield-field-emitter',12000)
 for x in (-1.65,1.65):
  L.slab('Emitter foot',[(x-.55,-.8),(x+.55,-.8),(x+.7,.6),(x-.7,.6)],0,.25,'e9-dark',.04)
  L.profile_x('Swept emitter pillar',[(-.55,.25),(.45,.25),(.4,2.9),(-.05,3.4),(-.4,3.1),(-.6,1)],x-.25,x+.25,'e9-body',.035)
  for z in (.8,1.3,1.8,2.3):
   L.box('Emitter cooling collar',(x,0,z),(.7,1.05,.12),'e9-trim',.02)
   L.box('Recessed lens socket',(x,-.58,z+.18),(.4,.08,.31),'e9-dark',.02)
   L.box('Violet field lens',(x,-.627,z+.18),(.28,.025,.21),'e9-violet',.008)
  L.box('Insulated spine',(x,.47,1.75),(.22,.22,2.5),'p11-tint-metal',.025,tint='cream')
  L.gauge((x,-.58,.5),.13)
  L.inset_panel('Calibration hatch',(x+.265,0,2.72),.55,.52,.02,.04,'e9-body','e9-dark','X')
  for zz in (.75,1.8,2.9): L.bolt((x-.18,-.59,zz),.025)
  L.stencil('E1' if x<0 else 'E2',(x,-.48,2.92),.12)
  L.sweep('Field return conduit',[(x+.36,.3,.3),(x+.36,.3,2.7),(x,.3,3.12)],.065,'p11-steel',8,bend=.14)
  for side in (-1,1):
   L.profile_x('Crown fork',[(-.5,3.1),(-.4,3.65),(-.15,3.8),(.05,3.65),(-.1,3.2)],x+side*.18-.065,x+side*.18+.065,'e9-trim',.015)
  L.box('Recessed crown optic',(x,-.18,3.5),(.14,.18,.2),'e9-violet',.02)
  # Replace bare appliance-like pillar sides with modular field cartridges and
  # bolted access hardware. Each connection ends in an actual socket or gland.
  L.profile_x('Emitter shoulder gusset',[(-.65,.25),(.3,.25),(.25,.7),(-.38,1.08)],x-.36,x+.36,'e9-dark',.025)
  for xx in (-.42,.42):L.bolt((x+xx,-.5,.27),.045,'Z')
  for z in (1.05,2.05):
   L.cylinder('Flux capacitor can',(x+.34,.12,z),.18,.54,'e9-dark','Z',12,.02)
   for zz in (z-.24,z+.24):L.cylinder('Capacitor end collar',(x+.34,.12,zz),.205,.06,'p11-steel','Z',12,.008)
   L.box('Capacitor specification plate',(x+.34,-.07,z),(.18,.02,.2),'p11-tint',0,tint='cream')
   L.sweep('Capacitor busbar',[(x+.34,.12,z+.3),(x+.34,.12,z+.43),(x,.12,z+.43)],.035,'p11-steel',5)
  for zz in (1.1,2.4):
   L.cylinder('Panel hinge',(x-.25,-.61,zz),.025,.16,'p11-steel','Z',8,0)
  L.handle((x+.15,-.63,1.55),.22,'Z',.04,.018)
  L.inset_panel('Interlock recess',(x,-.62,.7),.25,.18,.03,.03,inner_role='e9-dark')
  L.cylinder('Interlock key barrel',(x,-.66,.7),.04,.05,'p11-steel','Y',8,0)
  for z in (2.75,):L.vent((x,-.61,z),.3,.18,3,depth=.035)
  L.cylinder('Base cable gland',(x,.45,.43),.08,.16,'p11-steel','Y',10,.005)
  L.sweep('Interlocked ground cable',[(x,.53,.43),(x,.56,.22),(0,.56,.22),(0,.3,.16)],.035,'p11-rubber',6,bend=.06)
  # Recessed crown aperture with physically separated fins and front ceramic lip.
  for zz in (3.23,3.35,3.47):
   L.box('Crown field focusing fin',(x,-.17,zz),(.26,.18,.035),'p11-steel',0)
  L.bolt((x,-.4,3.1),.03)
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
  L.box('Radial clamp',(x,y,1.38),(.62,.3,.5),'e9-trim',.035,rotation=(0,0,a))
  L.box('Insulator',(x,y,1.67),(.32,.18,.08),'p11-tint-metal',.015,rotation=(0,0,a),tint='cream')
  for d in (-.2,.2): L.bolt((x+math.cos(a)*d,y+math.sin(a)*d,1.65),.028,'Z')
  # Segmented outer shield panels expose their dark gasket joints.
  b=a+math.pi/8
  px=2.22*math.cos(b);py=2.22*math.sin(b)
  L.box('Shield sector',(px,py,1.32),(.12,1.02,.38),'e9-body',.035,rotation=(0,0,b))
  L.box('Sector inset',(px*1.035,py*1.035,1.32),(.025,.72,.17),'e9-dark',.008,rotation=(0,0,b))
  L.box('Sector identification',(1.9*math.cos(b),1.9*math.sin(b),1.62),(.22,.32,.025),'e9-trim',.006,rotation=(0,0,b))
 for i in range(4):
  a=i*math.pi/2;x=1.9*math.cos(a);y=1.9*math.sin(a)
  L.box('Support shoe',(x,y,.12),(1,.8,.24),'e9-dark',.03,rotation=(0,0,a))
  L.box('Hydraulic support',(x,y,.7),(.45,.45,1.1),'e9-body',.04)
  L.cylinder('Piston',(x,y,1.15),.12,.5,'p11-steel','Z',10,.008)
  L.sweep('Hydraulic feed',[(x*1.1,y*1.1,.2),(x*1.1,y*1.1,.9),(x,y,1.1)],.045,'p11-rubber',6)
  for d in (-.3,.3): L.bolt((x+d,y,.25),.035,'Z')
 L.box('Ring controller',(0,-2.14,.65),(1.2,.5,.85),'e9-body',.05)
 L.screen('Ring phase',(0,-2.4,.8),.9,.4,pattern='ring')
 L.stencil('C4',(0,-2.4,.42),.12)
 # Field ring is carried by keyed radial actuators and supplied through a
 # lower cable race; support cylinders and split collars have real load paths.
 for i in range(4):
  a=i*math.pi/2;c=math.cos(a);s=math.sin(a);x=1.9*c;y=1.9*s
  for side in (-1,1):
   xx=x-side*.31*s;yy=y+side*.31*c
   L.cylinder('Support tie rod',(xx,yy,.73),.045,.88,'p11-steel','Z',8,0)
   L.bolt((xx,yy,.3),.045,'Z')
  L.cylinder('Hydraulic gland collar',(x,y,1.13),.23,.12,'p11-steel','Z',12,.01)
  L.cylinder('Hydraulic pressure port',(x+.25*c,y+.25*s,.85),.07,.16,'e9-dark','Z',10,.005)
  L.profile_x('Forked saddle bracket',[(y-.24,1.05),(y+.24,1.05),(y+.24,1.37),(y-.24,1.37)],x-.28,x+.28,'e9-dark',.025)
  # Narrow structural brace sits below the active band.
  L.sweep('Saddle brace',[(x*.74,y*.74,.32),(x,y,1.1)],.07,'e9-body',8)
 for i in range(8):
  a=i*math.pi/4+math.pi/8;c=math.cos(a);s=math.sin(a)
  for j in (-1,1):
   xx=2.26*c-j*.3*s;yy=2.26*s+j*.3*c
   L.cylinder('Shield quarter turn fastener',(xx,yy,1.52),.035,.04,'p11-steel','Z',8,0)
  L.sweep('Sector insulated jumper',[(1.7*c,1.7*s,1.22),(1.72*c,1.72*s,1.06),(2.08*c,2.08*s,1.06),(2.08*c,2.08*s,1.22)],.027,'p11-rubber',4)
  L.box('Sector service latch',(2.3*c,2.3*s,1.25),(.06,.14,.08),'p11-steel',.01,rotation=(0,0,a))
 L.torus('Lower cable race',(0,0,.97),1.92,.055,'p11-rubber','Z',40,5)
 L.sweep('Controller power conduit',[(0,-1.92,.97),(.3,-2.13,.97),(.3,-2.14,.81)],.055,'e9-body',6,bend=.1)
 for z in (.42,.91):L.cylinder('Controller hinge',(-.55,-2.41,z),.025,.16,'p11-steel','Z',8,0)
 L.handle((.47,-2.42,.62),.22,'Z',.04,.018)
 L.vent((0,-2.41,.43),.45,.12,3)

L.reset_scene();pump();shaft();emitter();annulus()
names=[a.name for a in L.ASSETS]
L.export('maintenance-containment',OUT,'maintenance-containment.glb','Original pump turbines, lift machinery, paired field emitters and containment ring.','blender -b --factory-startup -P tools/assets/p11-set-pieces/maintenance_containment.py')
from compact_uv import compact_uv
compact_uv(OUT/'maintenance-containment.glb',OUT/'manifest.json')
if '--render' in L.args():
 from cpu_preview import stage
 L._stage=stage
 for name in ([names[0]] if '--pump' in L.args() else ([names[2]] if '--emitter' in L.args() else names)): L.render(L.ROOT/'artifacts/nextgen/p11-final/beauty'/(name+'-hero.png'),[name],'hero',scale=1.18)
