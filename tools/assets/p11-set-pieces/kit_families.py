"""Original P11 service kit. Rebuild: blender -b -P tools/assets/p11-set-pieces/kit_families.py -- --render"""
import sys, math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import p11lib as L
L.reset_scene()

def tray():
 L.asset('service-cable-tray')
 for x in [-.3,.3]: L.box('Rolled side channel',(x,0,.12),(.035,2,.18),'e9-body',.008)
 for i in range(9): L.box('Tray rung',(0,-.9+i*.225,.04),(.6,.045,.035),'e9-trim',0)
 for i in range(3): L.sweep('Jacketed through cable',[(-.16+i*.16,-1,.1),(-.16+i*.16,0,.09),(-.16+i*.16,1,.1)],.032,'p11-rubber',6)
 for y in [-.75,.75]: L.box('Cable retaining band',(0,y,.15),(.55,.035,.025),'e9-trim',0)

def panel():
 L.asset('service-access-hatch')
 L.box('Recessed enclosure',(0,0,.6),(1.1,.16,1.2),'e9-dark',.025)
 L.box('Chamfered door',(0,-.095,.6),(.98,.04,1.08),'e9-body',.035)
 for z in [.25,.9]: L.hinge((-.47,-.13,z),.14,.015)
 L.handle((.36,-.14,.62),.23,'Z')
 L.vent((0,-.13,.29),.55,.18,4)
 L.decal_quad('Service plate',(0,-.135,.92),.44,.13,tint='black')
 L.stencil('A7',(0,-.14,.92),.08)

def crate(name,width,height):
 L.asset(name)
 L.box('Armoured shell',(0,0,height/2),(width,.65,height),'e9-body',.04)
 L.box('Lid gasket',(0,0,height-.06),(width+.02,.67,.025),'e9-dark',0)
 for x in [-width*.35,width*.35]:
  L.box('Raised restraint rib',(x,0,height+.005),(.065,.69,.05),'e9-trim',.006)
  L.box('Latch clasp',(x,-.34,height-.13),(.08,.035,.15),'e9-trim',.008)
 for x in [-width*.45,width*.45]:
  for y in [-.28,.28]:
   L.box('Impact corner shoe',(x,y,.08),(.13,.16,.16),'e9-trim',.018)
  L.box('End reinforcing pillar',(x,0,height*.45),(.075,.66,height*.58),'e9-dark',.008)
 for x in [-width*.35,width*.35]:
  L.box('Latch release',(x,-.365,height-.13),(.04,.018,.065),'e9-dark',.003)
 for x in [-width*.27,width*.27]:
  L.hinge((x,.34,height-.09),.12,.014)
 L.box('Recessed lid insert',(0,0,height+.022),(width*.53,.48,.012),'e9-dark',.012)
 L.handle((0,-.35,height*.5),width*.35)
 L.decal_quad('Inventory plate',(0,0,height+.035),.3,.18,'Z',tint='paper')
 L.stencil('C2',(0,0,height+.038),.09,'Z',tint='black')

def barrel():
 L.asset('service-pressure-drum')
 L.lathe('Pressure vessel',[(.24,0),(.3,.06),(.3,.7),(.25,.78)],role='e9-body',segments=12)
 for z in [.12,.64]: L.torus('Rolled hoop',(0,0,z),.305,.022,'e9-trim',major_segments=12,minor_segments=4)
 L.cylinder('Closure',(0,0,.785),.25,.025,'e9-dark',vertices=12,bevel=0)
 L.cylinder('Bung',(.1,0,.81),.06,.035,'e9-trim',vertices=6,bevel=0)
 L.handle((0,0,.85),.23,face='Z')
 L.sweep('Welded seam',[(.3,0,.18),(.3,0,.58)],.008,'e9-trim',5)
 L.gauge((0,-.305,.51),.055)
 L.decal_quad('Contents stripe',(0,-.302,.39),.22,.22,tint='service-blue')

def rail():
 L.asset('service-safety-rail')
 for x in [-.8,.8]:
  L.box('Foot plate',(x,0,.025),(.2,.2,.05),'e9-dark',.008)
  L.box('Post',(x,0,.5),(.055,.055,1),'e9-body',.008)
 for z in [.46,.98]: L.sweep('Tubular rail',[(-.8,0,z),(.8,0,z)],.03,'e9-trim',8)
 L.box('Toe guard',(0,0,.13),(1.6,.025,.12),'e9-body',.005)

def stairs():
 L.asset('service-three-step')
 for x in [-.48,.48]: L.profile_x('Stringer',[(-.6,0),(.6,0),(.6,.6),(-.6,.12)],x-.025,x+.025,'e9-body',0)
 for i in range(3):
  y=-.4+i*.4; z=.2+i*.2
  L.box('Tread',(0,y,z),(.98,.4,.055),'e9-trim',.008)
  for j in range(3): L.box('Grip groove',(0,y-.12+j*.1,z+.029),(.82,.018,.006),'e9-dark',0)

def console(pattern):
 L.asset('service-console-'+pattern)
 L.profile_x('Sloped desk',[( -.35,0),(.35,0),(.35,1.05),(-.35,.78)],-.42,.42,'e9-body',.025)
 L.screen('Dedicated display',(0,0,.94),.62,.43,face=(0,-.36,.933),pattern=pattern)
 L.vent((0,-.36,.2),.5,.16,4)
 L.inset_panel('Controller access',(0,-.36,.5),.59,.25,.015,.025,'e9-dark','e9-body')
 L.hinge((-.31,-.39,.5),.12,.012)
 L.handle((.22,-.39,.5),.12,'Z')
 L.box('Control shelf',(0,-.43,.8),(.72,.24,.04),'e9-dark',.012)
 for x in [-.2,0,.2]: L.cylinder('Selector',(x,-.43,.84),.035,.04,'e9-trim',vertices=8,bevel=0)
 L.lamp_strip('Status',(0,-.365,.73),.56)

def pipes():
 L.asset('service-valve-manifold')
 for x in [-.55,.55]: L.box('Mounting channel',(x,.12,.7),(.08,.1,1.4),'e9-body',0)
 for z in [.35,.95]:
  L.sweep('Process pipe',[(-.75,0,z),(.75,0,z)],.065,'e9-trim',8)
  for x in [-.55,.55]: L.cylinder('Pipe collar',(x,0,z),.09,.06,'e9-dark','X',8,0)
  L.valve_wheel((-.2,-.1,z),.10,axis='Y')
  L.gauge((.3,-.09,z+.12),.065)
tray(); panel(); crate('service-transit-case',.85,.48); crate('service-stowage-crate',.65,.8); barrel(); rail(); stairs(); console('bars'); console('schematic'); pipes()
L.export('service-kit',L.ROOT/'public/assets/p11/service-kit','service-kit.glb','Industrial service fittings with modelled hardware and baked AO/curvature.','blender -b -P tools/assets/p11-set-pieces/kit_families.py')
if '--render' in L.args():
 stage=L._stage
 def modest_stage():
  scene=stage();scene.cycles.samples=16;return scene
 L._stage=modest_stage
 names=[a.name for a in L.ASSETS]
 L.layout_row(names[:5]); L.render(L.ROOT/'artifacts/nextgen/p11-final/beauty/service-kit-storage.png',names[:5],'hero',(1600,900))
 L.layout_row(names[5:]); L.render(L.ROOT/'artifacts/nextgen/p11-final/beauty/service-kit-machinery.png',names[5:],'hero',(1600,900))
