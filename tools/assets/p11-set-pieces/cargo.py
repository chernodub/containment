"""Original P11 cargo heroes. Blender metres; MIT repository license."""
import sys,math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import p11lib as L
L.reset_scene()

def cargo_pod(x,y,z,wide=4.4,deep=1.85,height=1.8):
 L.box('Pressure freight shell',(x,y,z+height/2),(wide,deep,height),'e9-body',.09)
 for sx in [-1,1]:
  L.box('Armoured end frame',(x+sx*(wide/2-.09),y,z+height/2),(.18,deep+.08,height+.08),'e9-trim',.035)
 for sy in [-1,1]:
  fy=y+sy*(deep/2+.025)
  for i in range(6):
   xx=x-wide*.38+i*wide*.152
   L.box('Corrugation',(xx,fy,z+height/2),(.055,.05,height-.22),'e9-dark',.006)
  L.box('Lower rub rail',(x,fy,z+.15),(wide-.25,.09,.13),'e9-trim',.014)
  L.box('Door header',(x,fy,z+height-.12),(wide-.25,.07,.12),'e9-trim',.012)
 for dx in [-.56,.56]:
  L.box('Door leaf',(x+dx,y-deep/2-.06,z+height/2),(1.06,.04,height-.4),'e9-body',.018)
  L.sweep('Locking rod',[(x+dx,y-deep/2-.12,z+.3),(x+dx,y-deep/2-.12,z+height-.3)],.025,'e9-trim',6)
  L.handle((x+dx,y-deep/2-.14,z+height*.5),.25)
 L.decal_quad('Shipping label',(x-1.55,y-deep/2-.07,z+height*.6),.55,.26,tint='paper')
 L.stencil('C17',(x-1.55,y-deep/2-.074,z+height*.6),.13,tint='black')
 for i in range(9):
  L.box('Roof corrugation',(x-wide*.4+i*wide*.1,y,z+height+.035),(.045,deep-.15,.04),'e9-dark',.005)
 for sx in [-1,1]:
  for sy in [-1,1]:
   L.box('Stacking socket',(x+sx*(wide/2-.13),y+sy*(deep/2-.13),z+height+.05),(.22,.22,.1),'e9-trim',.025)
   L.cylinder('Socket recess',(x+sx*(wide/2-.13),y+sy*(deep/2-.13),z+height+.103),.055,.006,'e9-dark',vertices=8,bevel=0)
 for i in [-1,1]:
  L.box('Roof reinforcement',(x+i*wide*.28,y,z+height+.03),(.12,deep,.06),'e9-trim',.01)

def gantry():
 L.asset('freight-suspension-gantry',12000)
 for x in [-3.5,3.5]:
  L.box('Anchored bogie foot',(x,0,.13),(.65,2.8,.26),'e9-dark',.04)
  L.profile_x('Tapered portal leg',[(-1.1,.26),(.9,.26),(.42,4.7),(-.42,4.7)],x-.17,x+.17,'e9-body',.025)
  for sy in [-1,1]:
   L.box('Leg service rib',(x,sy*.4,3),(.4,.08,2.8),'e9-trim',.012)
  L.inset_panel('Leg inspection door',(x,-.72,.9),.28,.6,.02,.035,'e9-body','e9-dark')
  L.hazard_band((x,-1.11,.25),.55,.13,stripes=4)
  for y in [-.8,.8]: L.bolt((x,y,.265),.055,'Z')
 for i in range(3):
  L.box('Portal inspection tread',(3.5,-1.1+i*.23,.12+i*.14),(.54,.25,.055),'e9-trim',.008)
  L.box('Tread grip',(3.5,-1.1+i*.23,.15+i*.14),(.44,.04,.008),'e9-dark',0)
 # Guard the rear maintenance walkway without obscuring the trolley side.
 for x in [-3.3,-1.1,1.1,3.3]: L.box('Walkway guard upright',(x,.46,5.18),(.045,.045,.88),'e9-body',.006)
 for z in [5.12,5.6]: L.sweep('Walkway safety rail',[(-3.3,.46,z),(3.3,.46,z)],.025,'e9-trim',6)
 L.box('Crane upper flange',(0,0,4.72),(7.6,1.1,.16),'e9-body',.025)
 for y in [-.35,.35]: L.box('Trolley running rail',(0,y,4.83),(7.4,.06,.06),'e9-trim',.006)
 for x in [-3,-1.5,0,1.5,3]:
  for y in [-.35,.35]: L.bolt((x,y,4.87),.025,'Z')
 L.box('Crane load web',(0,0,4.48),(7.4,.35,.42),'e9-body',.015)
 L.box('Crane lower flange',(0,0,4.25),(7.6,1.1,.14),'e9-body',.025)
 for x in [-3,-2,-1,0,1,2,3]: L.box('Web stiffener',(x,0,4.49),(.06,.7,.4),'e9-dark',.008)
 L.box('Travelling hoist carriage',(.25,0,4.04),(1.45,1.35,.3),'e9-body',.04)
 L.cylinder('Winch drum',(.25,0,3.8),.28,1.1,'e9-trim','X',16,.015)
 for x in [-.25,.75]: L.torus('Winch flange',(x,0,3.8),.29,.045,'e9-dark','X',16,4)
 for x in [-1.5,1.5]:
  for y in [-.65,.65]: L.sweep('Taut lifting cable',[(x*.2+.25,y*.5,3.9),(x,y,2.85)],.025,'p11-rubber',6)
 for x in [-1.5,1.5]:
  for y in [-.65,.65]:
   L.torus('Certified lifting eye',(x,y,2.86),.08,.025,'e9-trim','Y',12,5)
   L.box('Eye welded foot',(x,y,2.73),(.22,.18,.08),'e9-body',.012)
 for x in [-.3,.8]:
  for y in [-.5,.5]:
   L.cylinder('Trolley wheel',(x,y,4.27),.16,.12,'e9-dark','Y',12,0)
   L.cylinder('Wheel hub',(x,y*1.14,4.27),.075,.04,'e9-trim','Y',8,0)
 L.cylinder('Drive motor',(1.1,0,4.04),.22,.55,'e9-body','X',14,.02)
 for x in [.9,1.05,1.2]: L.torus('Motor cooling ring',(x,0,4.04),.225,.015,'e9-trim','X',12,4)
 for x in [-.15,0,.15,.3,.45,.6]: L.torus('Wound lifting cable',(x,0,3.8),.285,.018,'p11-rubber','X',16,4)
 L.sweep('Terminated power conduit',[(1.3,0,4.1),(1.45,.5,4.1),(.25,.65,4.3)],.035,'p11-rubber',7,bend=.1)
 for y in [-.65,.65]: L.box('Spreader side beam',(0,y,2.9),(3.4,.14,.18),'e9-body',.02)
 for x in [-1.5,1.5]: L.box('Spreader cross beam',(x,0,2.9),(.14,1.5,.18),'e9-trim',.02)
 cargo_pod(0,0,.9)
 L.lamp_strip('Hoist status',(.25,-.7,4.07),1.0)
 L.stencil('LIFT 7',(0,-.19,4.48),.22)
 L.sweep('Festoon cable',[(-3.4,.6,4.75),(-2.2,.6,4.15),(-.8,.6,4.75),(.25,.6,4.35)],.045,'p11-rubber',7)

def tear():
 L.asset('loading-wedged-pod',12000)
 cargo_pod(0,0,.22,4.4,1.65,1.6)
 # Two torn pressure-skin bands curl outward around an exposed rib skeleton.
 for side in [-1,1]:
  for i in range(7):
   x=-3+i
   rise=[.4,.85,1.25,.65,1.4,.9,.3][i]
   shard=L.slab('Torn pressure skin',[(x-.45,0),(x+.45,0),(x+.4,rise*.48),(x+.23,rise*.95),(x+.03,rise*.6),(x-.12,rise),(x-.29,rise*.56),(x-.45,rise*.72)],0,.055,'e9-body',.006)
   shard.rotation_euler[0]=math.radians(90-side*10)
   shard.location.y=side*.94
   L.sweep('Exposed bright fracture',[(x-.45,side*1.03,rise*.72),(x-.29,side*1.08,rise*.56),(x-.12,side*1.12,rise)],.013,'e9-trim',5)
   L.box('Exposed hull rib',(x,side*.96,.19),(.08,.24,.38),'e9-trim',.012)
  L.box('Severed longitudinal girder',(0,side*1.08,.12),(6.7,.13,.15),'e9-dark',.012)
 for x in [-2.6,2.6]:
  L.sweep('Ruptured hose',[(x,.8,.5),(x+.1,.5,1),(x-.15,-.1,.75)],.055,'p11-rubber',7,bend=.1)
  L.sweep('Exposed cut conduit',[(x,-.85,.4),(x+.15,-.4,.55),(x+.1,-.3,.8)],.035,'e9-trim',7)
 L.box('Cargo crush contact',(0,0,.1),(4.8,1.75,.2),'e9-dark',.025)
 L.hazard_band((0,-.94,.4),2.6,.14,stripes=9)

gantry();tear()
L.export('cargo',L.ROOT/'public/assets/p11/cargo','cargo.glb','Suspended working gantry and grounded torn hull around a wedged freight pod.','blender -b -P tools/assets/p11-set-pieces/cargo.py')
if '--render' in L.args():
 stage=L._stage
 def modest_stage():
  scene=stage();scene.cycles.samples=16;return scene
 L._stage=modest_stage
 for a in L.ASSETS: L.render(L.ROOT/'artifacts/nextgen/p11-final/beauty'/f'{a.name}.png',[a.name],'hero',(1280,960))
