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
 verts=[];faces=[];n=16
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
 for edge in (0,n):
  for j in range(4):
   a=j*(n+1)+edge;b=(j+1)*(n+1)+edge
   k=len(verts);verts.extend([(verts[a][0],verts[a][1],verts[a][2]-.055),(verts[b][0],verts[b][1],verts[b][2]-.055)])
   faces.append((a,b,k+1,k))
 mesh=bpy.data.meshes.new('Split diaphragm');mesh.from_pydata(verts,[],faces);mesh.update()
 obj=L._link(mesh,'Split bowed pressure diaphragm','e9-body',None);L.finish(obj,'e9-body',0)
 L.lathe('Contained dark membrane',[(.05,.2),(1.2,.25),(1.3,.42)],(0,0,0),'e9-dark',8)
 for i,x in enumerate((-.14,0,.14)):
  L.cylinder('Exposed pale pressure channel',(x,-.66,1.04),.075,1.15,'e9-trim','Y',8,.005)
  for y in (-.96,-.55,-.23):L.cylinder('Pressure channel coupling',(x,y,1.04),.094,.07,'e9-dark','Y',8,0)
 for r in (.65,1.1):
  for side in (-1,1):L.bolt((side*(.22*r+.09),-r,1.5-.68*(r/1.42)**2),.04,'Z')
 L.box('Live pressure-channel status',(0,-1.25,1.04),(.08,.015,.035),'e9-violet',0)
 for x in (-.72,.72):
  L.sweep('Bowed restraint strap',[(x,-1.22,.65),(x,-.85,1.3),(x,0,1.7),(x,.85,1.3),(x,1.22,.65)],.055,'p11-steel',5)
  for y in (-1.25,1.25):
   L.box('Strap anchor shoe',(x,y,.68),(.27,.24,.17),'e9-dark',.015)
   L.bolt((x,y,.79),.055,'Z')
 L.cylinder('Relief valve neck',(1.08,.3,1.12),.12,.4,'p11-steel','Z',10,.01)
 L.cylinder('Lifted relief cap',(1.12,.32,1.48),.2,.06,'e9-trim','Z',12,.01)
 L.sweep('Captive relief cap tether',[(1.22,.31,1.14),(1.35,.32,1.4),(1.2,.32,1.5)],.018,'p11-steel',4)


def angular_scale(name,c,size=(.46,.3,.2),turn=0,tilt=0):
 import bpy,bmesh
 from mathutils import Matrix,Vector
 outline=[(-1,-.35),(-.55,-.92),(.28,-.8),(.86,-.35),(.72,-.08),(1,.12),(.18,.86),(-.68,.6)]
 verts=[];faces=[];n=len(outline)
 rotation=Matrix.Rotation(turn,3,'Z')@Matrix.Rotation(tilt,3,'X')
 for r,h in ((1,0),(.8,.22),(.55,.52)):
  for x,y in outline:verts.append(rotation@Vector((x*size[0]*r,y*size[1]*r,h*size[2]))+Vector(c))
 for row in range(2):
  for i in range(n):faces.append((row*n+i,row*n+(i+1)%n,(row+1)*n+(i+1)%n,(row+1)*n+i))
 verts.append(rotation@Vector((-.12*size[0],0,size[2]))+Vector(c))
 for i in range(n):faces.append((2*n+i,2*n+(i+1)%n,3*n))
 faces.append(tuple(range(n-1,-1,-1)))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
 bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(mesh);bm.free()
 obj=L._link(mesh,name,'p11-tint','#625947');L.finish(obj,'p11-tint',0,smooth=False,tint='#625947')
 lip=[rotation@Vector((outline[i][0]*size[0],outline[i][1]*size[1],.01))+Vector(c) for i in (2,3,4,5,6)]
 L.sweep(name+' chipped bone edge',lip,.017,'p11-tint',4,tint='#a2977f')


def consuming_mantle():
 import infested_craft as C
 S=C.S
 L.asset('consuming-workstation-mantle',912)
 parts=[S.Displace(S.Ellipsoid((-.25,.05,.65),(.65,.26,.43)),.055,12,8),S.Ellipsoid((.38,.03,.65),(.49,.24,.33)),S.Ellipsoid((.12,-.23,.52),(.3,.22,.3),op='sub')]
 C.sculpt('Dark ridged panel-consuming membrane',parts,role='p11-tint',tint='#40363e',budget=210,voxel=.035)
 for i,(x,y,z,t) in enumerate([(-.62,.08,1.02,.15),(-.25,.12,1.16,.05),(.15,.11,1.12,-.1),(.54,.07,.98,-.18),(-.02,-.22,.98,.7),(-.66,-.13,.65,.65),(.6,-.13,.56,.6)]):
  angular_scale('Overlapping column scute '+str(i),(x,y,z),(.38,.27,.23),turn=(i%2-.5)*.3,tilt=t)
 L.profile_x('Bowed seized hatch',[(-.01,.16),(.07,.16),(.07,.72),(-.22,.96),(-.28,.9),(-.01,.62)],-.72,.64,'e9-body',0)
 for x in (-.7,.62):
  L.sweep('Taut anchored column tendon',[(x,-.08,.72),(x*1.08,-.22,.35),(x*.95,-.25,.08)],.018,'p11-flesh',4)
 L.lathe('Recessed mantle lumen',[(.01,0),(.045,.02),(.01,.04)],(.1,-.22,.53),'p11-bio-violet',6,'Y')


def brood_bastion():
 import infested_craft as C
 S=C.S
 L.asset('brood-stronghold-wall',1500)
 C.sculpt('Hollow ridged brood membrane',[S.Displace(S.Ellipsoid((0,0,.62),(1.1,.34,.6)),.065,12,21),S.Ellipsoid((.05,-.22,.52),(.64,.4,.4),op='sub')],role='p11-tint',tint='#40363e',budget=260,voxel=.04)
 for i,(x,y,z,t) in enumerate([(-.77,.12,1.05,.15),(-.38,.14,1.3,.08),(.06,.16,1.34,0),(.5,.12,1.23,-.14),(.87,.06,.98,-.2),(-.87,-.12,.61,.7),(.86,-.12,.5,.65)]):
  angular_scale('Brood wall shingle '+str(i),(x,y,z),(.43,.31,.25),turn=(i%3-1)*.3,tilt=t)
 # Exposed duct braces are deliberately in FRONT of membrane, visibly forced apart.
 for side in (-1,1):
  L.profile_x('Burst duct upright',[(-.35,.08),(-.24,.08),(-.24,.55),(-.52,.91),(-.64,1.04),(-.71,.98),(-.35,.5)],side*.91-.05,side*.91+.05,'e9-trim',0)
 L.slab('Torn duct roof leaf',[(-.8,-.18),(-.55,-.45),(.08,-.32),(.3,-.5),(.76,-.22),(.72,.1),(-.75,.08)],.82,.88,'e9-body',0)
 for i,x in enumerate((-.35,0,.35)):
  L.lathe('Ribbed egg in brood opening',[(.025,0),(.11,.07),(.13,.12),(.1,.18),(.12,.23),(.08,.29),(.01,.35)],(x,-.33,.12+.03*(i%2)),'p11-flesh',6)
  L.lathe('Faint egg slit',[(.01,0),(.035,.02),(.01,.04)],(x,-.435,.28),'p11-bio-violet',5,'Y')
 for side in (-1,1):
  for offset in (0,.12):L.sweep('Tensioned duct anchor',[(side*.8,-.1,.65),(side*(.96+offset),-.27,.3),(side*.97,-.4,.04)],.018,'p11-flesh',4)

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
 for name in (names[3:5] if '--growth' in L.args() else ([names[2]] if '--pressure' in L.args() else ([names[-1]] if '--last' in L.args() else names))):L.render(L.ROOT/'artifacts/nextgen/p11-final/beauty'/(name+'-hero.png'),[name],'hero',scale=1.18)
