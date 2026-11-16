"""P11 incident sculpture. Original MIT, attached to existing machinery solids."""
import math,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import p11lib as L
OUT=L.ROOT/'public/assets/p11/incidents'

def failed_repair():
 L.asset('abandoned-winch-repair',1500)
 # A cut rope, not a decorative complete coil: ends splay beside a clamp.
 L.sweep('Cut hauling cable',[(-1.1,-.7,.12),(-.8,-.7,.18),(-.45,-.6,.21),(-.2,-.45,.17)],.075,'p11-rubber',7)
 for i in range(5):
  L.sweep('Splayed exposed strand',[(-.22,-.45,.17),(-.04+i*.04,-.36+i*.025,.19+i*.018),(.15+i*.025,-.23+i*.035,.12)],.012,'p11-steel',4)
 L.box('Temporary rope clamp',(-.72,-.7,.19),(.22,.3,.12),'e9-body',.015)
 for y in (-.8,-.6):L.bolt((-.72,y,.27),.04,'Z')
 L.slab('Tool roll backing',[(.08,-.95),(.95,-.9),(1.03,-.28),(.12,-.33)],.03,.045,'p11-tint',0,tint='#655b4c')
 for i in range(3):
  x=.24+i*.22
  L.box('Socket wrench handle',(x,-.61,.075),(.055,.42,.035),'p11-steel',.01,rotation=(0,0,.15*i))
  L.cylinder('Socket wrench head',(x,-.38,.075),.055,.06,'e9-dark','Z',8,0)
  L.cylinder('Socket wrench well',(x,-.38,.108),.027,.005,'p11-steel','Z',8,0)
 L.box('Unlatched diagnostic meter',(.4,.02,.13),(.56,.35,.18),'e9-body',.025)
 L.box('Unlit meter display',(.4,.01,.225),(.36,.19,.012),'e9-dark',.005)
 L.sweep('Meter test lead',[(.13,.02,.15),(-.05,.08,.07),(-.35,-.05,.045),(-.45,-.34,.1)],.018,'p11-rubber',5)
 # Lid rests open, with its hinge retained and disconnected fuse exposed.
 L.box('Open meter cover',(.4,.24,.31),(.56,.035,.34),'e9-dark',.015,rotation=(.35,0,0))
 L.cylinder('Withdrawn ceramic fuse',(.85,.06,.1),.05,.28,'e9-trim','X',8,.005)

def failed_shield():
 L.asset('failed-shield-leaves',1500)
 # Heavy folded leaves are forced apart at a failed seal, not another doorway.
 for side in (-1,1):
  x0,x1=(-1.4,-.16) if side<0 else (.16,1.4)
  L.profile_x('Buckled armored leaf',[(-.15,.25),(.14,.25),(.14,2.75),(-.12,2.75),(-.31,1.7),(-.15,.9)],x0,x1,'e9-body',.025)
  for z in (.5,2.42):
   L.box('Leaf horizontal stiffener',((x0+x1)/2,-.24,z),(1.18,.17,.12),'e9-dark',.015)
  for x in (x0+.13,x1-.13):
   L.box('Leaf structural spine',(x,-.26,1.5),(.12,.15,2.15),'e9-trim',.015)
   for z in (.5,2.45):L.bolt((x,-.35,z),.045)
  L.box('Seal monitoring window',((x0+x1)/2,-.33,2.15),(.56,.045,.24),'e9-dark',.015)
  L.box('Cold field leak',((x0+x1)/2,-.36,2.15),(.43,.01,.08),'e9-violet',0)
  # Captive hinge pins remain in their sockets despite the distorted leaf.
  for z in (.72,2.28):
   L.cylinder('Captured leaf hinge',(side*1.4,-.06,z),.11,.36,'p11-steel','Z',10,.01)
 L.sweep('Torn hanging seal',[(-.12,-.28,2.65),(-.21,-.47,2.1),(.05,-.48,1.5),(-.15,-.4,.55)],.055,'p11-rubber',6)
 L.box('Sheared locking bolt',(.15,-.38,.8),(.46,.16,.13),'p11-steel',.012,rotation=(0,.15,.24))
 L.box('Detached seal clamp',(.6,-.38,.08),(.55,.26,.1),'e9-dark',.015,rotation=(0,0,.35))

def pressure_chamber():
 import bpy
 L.asset('strained-containment-diaphragm',1500)
 L.lathe('Pressure vessel recessed skirt',[(1.22,.1),(1.4,.23),(1.46,.55),(1.43,.8)],(0,0,0),'e9-dark',24)
 # The buckled pressure diaphragm has a real missing wedge exposing its contents.
 verts=[];faces=[];n=20
 for j in range(5):
  t=j/4;r=.06+1.36*t;z=1.48-.68*t*t
  for i in range(n+1):
   a=.22+i*(math.tau-.44)/n-math.pi/2
   if i in (0,n):
    a+=(.07,-.04,.1,-.02,.04)[j]*(1 if i==0 else -1)
    zedge=z+(0,.06,.19,.08,.025)[j]
   else:zedge=z
   verts.append((r*math.cos(a),r*math.sin(a),zedge+.08*math.cos(a*3)*t))
   if j and i: k=j*(n+1)+i;faces.append((k,k-1,k-n-2,k-n-1))
 mesh=bpy.data.meshes.new('Split diaphragm');mesh.from_pydata(verts,[],faces);mesh.update()
 obj=L._link(mesh,'Split bowed pressure diaphragm','e9-body',None);L.finish(obj,'e9-body',0)
 L.lathe('Contained dark membrane',[(.05,.25),(.75,.45),(1.18,.8),(.85,1.15),(.2,1.32)],(0,0,0),'p11-flesh',16)
 for z in (.65,.9,1.14):L.box('Exposed inspection lumen',(0,-.88,z),(.12,.06,.045),'e9-violet',.008)
 for x in (-.72,.72):
  L.sweep('Bowed restraint strap',[(x,-1.22,.65),(x,-.85,1.3),(x,0,1.7),(x,.85,1.3),(x,1.22,.65)],.055,'p11-steel',5)
  for y in (-1.25,1.25):
   L.box('Strap anchor shoe',(x,y,.68),(.27,.24,.17),'e9-dark',.015)
   L.bolt((x,y,.79),.055,'Z')
 L.cylinder('Relief valve neck',(1.08,.3,1.12),.12,.4,'p11-steel','Z',10,.01)
 L.cylinder('Lifted relief cap',(1.12,.32,1.48),.2,.06,'e9-trim','Z',12,.01)
 L.sweep('Captive relief cap tether',[(1.22,.31,1.14),(1.35,.32,1.4),(1.2,.32,1.5)],.018,'p11-steel',4)
 L.gauge((-.65,-1.51,.85),.16)

def consuming_mantle():
 import infested_craft as C
 S=C.S
 L.asset('consuming-workstation-mantle',1500)
 # A load-bearing wrap with a vertical throat, sculpted rather than piled capsules.
 primitives=[S.Ellipsoid((-.4,0,.7),(.62,.34,.68)),S.Ellipsoid((.1,.02,.9),(.68,.32,.32)),S.Ellipsoid((.62,.02,.65),(.34,.28,.43))]
 primitives=[S.Displace(p,.035,13,4+i) for i,p in enumerate(primitives)]
 primitives.append(S.Ellipsoid((.12,-.25,.6),(.36,.23,.28),op='sub'))
 C.sculpt('Pitted mass swallowing column',primitives,budget=360,voxel=.03)
 C.shell('Overlapping anterior armor',(-.35,-.03,1.17),(.65,.39,.22),tilt=.3,seed=9,budget=200)
 C.shell('Second mantle armor',(.38,-.02,.95),(.56,.34,.18),tilt=.25,seed=12,budget=200)
 L.lathe('Enclosed violet brood fissure',[(.01,0),(.09,.025),(.08,.05),(.01,.075)],(.08,-.25,.65),'p11-bio-violet',8,'Y')
 # A consumed service panel remains legible around the mass, forced into a bow.
 L.profile_x('Distorted service hatch',[(-.05,.18),(.08,.18),(.08,.9),(-.22,1.13),(-.3,1.04),(-.05,.72)],-.78,.6,'e9-body',.015)
 for x in (-.68,.48):
  L.cylinder('Retained hatch fixing',(x,-.12,.24),.045,.04,'p11-steel','Y',8,0)
 L.sweep('Mantle tension tendon',[(-.8,-.1,.8),(-.87,-.2,.37),(-.8,-.25,.03)],.06,'p11-flesh',5)

def brood_bastion():
 import infested_craft as C
 S=C.S
 L.asset('brood-stronghold-wall',1500)
 # Thick annular nest has consumed the duct wall; the cavity is actual geometry.
 mass=S.Displace(S.Ellipsoid((0,0,.66),(1.15,.46,.64)),.055,11,21)
 C.sculpt('Hollow brood buttress',[mass,S.Ellipsoid((.16,-.28,.62),(.59,.45,.4),op='sub')],budget=440,voxel=.035)
 C.shell('Shingled brood roof',(-.3,.03,1.17),(.88,.51,.22),tilt=.12,seed=14,budget=200)
 # Metal roof ripped into angular sections by the expanding brood, still hinged.
 for side in (-1,1):
  L.profile_x('Bowed duct wall rib',[(-.12,.12),(.1,.12),(.1,.62),(-.24,1),(-.42,1.1),(-.45,.99),(-.12,.51)],side*.88-.06,side*.88+.06,'e9-trim',.012)
 L.slab('Torn duct roof leaf',[(-.91,-.12),(-.45,-.38),(.13,-.25),(.4,-.43),(.85,-.2),(.8,.29),(-.8,.28)],.88,.94,'e9-body',.008)
 L.lathe('Brood egg in dark throat',[(.03,0),(.13,.08),(.17,.14),(.14,.2),(.16,.26),(.12,.32),(.07,.39),(.01,.44)],(-.12,-.28,.23),'p11-flesh',8)
 C.shell('Brood egg protective shingle',(-.15,-.21,.55),(.24,.18,.08),tilt=.25,seed=17,budget=65)
 L.lathe('Enclosed egg glow',[(.02,0),(.05,.025),(.02,.05)],(-.12,-.43,.47),'p11-bio-violet',6,'Y')
 # Strong braided roots transmit load into the seized duct footings.
 for side in (-1,1):
  L.sweep('Anchored brood root',[(side*.8,-.05,.65),(side*1.01,-.18,.35),(side*.99,-.32,.05)],.09,'p11-growth',5)

def failed_patch():
 L.asset('failed-relay-patch',1500)
 # Jumper ends descend from the open middle-rack bay; the repair was interrupted.
 for i in range(3):
  x=-.55+i*.16
  L.sweep('Severed rack fibre',[(x,.68,1.2),(x,.53,.85),(x-.05,.25,.55),(x+.1,.05,.4)],.028,'p11-tint',6,tint='teal')
  L.cylinder('Broken fibre ferrule',(x+.1,.05,.4),.045,.1,'p11-steel','Z',8,0)
  L.sweep('Loose jumper tail',[(x+.18,-.25,.05),(x+.3,-.48,.04),(x+.12,-.75,.04),(x-.08,-.8,.04)],.025,'p11-tint',5,tint='teal')
 # Molded equipment case: recessed tray, perimeter rim, open lid and latches.
 L.box('Open service case bottom',(.62,-.35,.1),(.72,.68,.16),'e9-dark',.025)
 for x in (.28,.96):L.box('Case side lip',(x,-.35,.22),(.045,.65,.13),'e9-body',.008)
 for y in (-.66,-.04):L.box('Case end lip',(.62,y,.22),(.7,.045,.13),'e9-body',.008)
 L.box('Molded tool insert',(.62,-.35,.19),(.54,.48,.03),'p11-rubber',.008)
 L.box('Hinged case lid',(.62,.02,.47),(.72,.06,.58),'e9-body',.025,rotation=(.22,0,0))
 L.box('Lid inset',(.62,-.04,.46),(.56,.025,.4),'e9-dark',.01,rotation=(.22,0,0))
 for x in (.39,.85):
  L.cylinder('Case hinge',(x,-.005,.22),.03,.12,'p11-steel','X',8,0)
  L.box('Open case latch',(x,-.7,.22),(.1,.08,.06),'p11-steel',.006)
 L.handle((.62,-.72,.13),.25,'X',.04,.02)
 L.box('Withdrawn circuit card',(.57,-.32,.24),(.3,.38,.025),'p11-tint',.004,tint='olive')
 for i in range(3):L.box('Card package',(.57,-.45+i*.12,.27),(.13,.075,.025),'e9-dark',.004)
 for i in range(5):L.box('Card edge contact',(.46+i*.045,-.52,.26),(.02,.045,.008),'p11-tint-metal',0,tint='brass')
 L.box('Fibre extraction tool',(.84,-.35,.25),(.045,.32,.045),'p11-steel',.005)

L.reset_scene();failed_repair();failed_shield();pressure_chamber();consuming_mantle();brood_bastion();failed_patch()
names=[a.name for a in L.ASSETS]
L.export('incidents',OUT,'incidents.glb','Interrupted repairs and physical consequences on P11 machinery.','blender -b --factory-startup -P tools/assets/p11-set-pieces/incidents.py')
if '--render' in L.args():
 from cpu_preview import stage
 L._stage=stage
 for name in ([names[-1]] if '--last' in L.args() else names):L.render(L.ROOT/'artifacts/nextgen/p11-final/beauty'/(name+'-hero.png'),[name],'hero',scale=1.18)
