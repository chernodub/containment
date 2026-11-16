"""Original P11 cargo heroes. Blender metres; MIT repository license."""
import sys,math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import p11lib as L
L.reset_scene()

def cargo_pod(x,y,z,wide=4.4,deep=1.85,height=1.8):
 # Welded pressure liner, external corner posts and genuinely open cast sockets.
 L.box('Welded pressure liner',(x,y,z+height/2),(wide-.12,deep-.10,height-.08),'e9-dark',.045)
 for sx in [-1,1]:
  for sy in [-1,1]:
   xx=x+sx*(wide/2-.12); yy=y+sy*(deep/2-.12)
   L.box('Corner load post',(xx,yy,z+height/2),(.13,.13,height),'e9-body',.012)
   for zz in [z+.08,z+height-.04]:
    # Four casting bars surround a through pocket rather than a painted dot.
    for off in [-.095,.095]:
     L.box('Socket casting side',(xx+off,yy,zz),(.075,.27,.18),'e9-trim',.01)
     L.box('Socket casting bridge',(xx,yy+off,zz),(.12,.075,.18),'e9-trim',.01)
 for sy in [-1,1]:
  fy=y+sy*(deep/2+.01)
  L.box('Lower longitudinal skid',(x,fy,z+.13),(wide-.2,.11,.15),'e9-body',.015)
  L.box('Structural door header',(x,fy,z+height-.15),(wide-.2,.10,.15),'e9-body',.015)
  if sy==1:
   for i in range(8):
    xx=x-wide*.40+i*wide*.114
    L.box('Pressed rear wall rib',(xx,fy,z+height/2),(.10,.07,height-.38),'e9-body',.012)
 front=y-deep/2-.045
 for side in [-1,1]:
  cx=x+side*wide*.235; width=wide*.45
  L.box('Continuous recessed door seal',(cx,front,z+height/2),(width,.055,height-.34),'p11-rubber',.022)
  L.box('Recessed door skin',(cx,front-.035,z+height/2),(width-.085,.035,height-.43),'e9-body',.018)
  for rib in [-.56,0,.56]:
   L.box('Folded door stiffener',(cx+rib*width*.5,front-.065,z+height*.5),(.075,.075,height-.56),'e9-body',.012)
  rod=cx-side*width*.28
  L.sweep('Door cam lock rod',[(rod,front-.13,z+.25),(rod,front-.13,z+height-.25)],.026,'e9-trim',8)
  for zz in [z+.30,z+height-.30]:
   L.box('Cam keeper',(rod+.055*side,front-.08,zz),(.22,.12,.10),'e9-dark',.008)
   L.cylinder('Rotating cam boss',(rod,front-.15,zz),.067,.065,'e9-trim','Y',8,0)
   L.box('Cam lock tongue',(rod+side*.07,front-.19,zz),(.18,.045,.045),'e9-trim',.006)
  L.box('Lever cradle',(rod+side*.12,front-.09,z+.65),(.30,.10,.17),'e9-dark',.008)
  L.sweep('Cam lever',[(rod,front-.15,z+.67),(rod+side*.10,front-.21,z+.62),(rod+side*.29,front-.21,z+.62)],.025,'e9-trim',6)
  L.box('Tamper tag',(rod+side*.22,front-.24,z+.55),(.07,.012,.11),'e9-trim',0)
  for zz in [z+.42,z+height-.42]:
   hx=x+side*(wide/2-.26)
   L.box('Hinge welded ear',(hx,front-.04,zz),(.25,.07,.14),'e9-body',.01)
   L.hinge((hx,front-.11,zz),.17,.027)
  L.decal_quad('Scraped shipping placard',(cx+side*.32,front-.086,z+height*.65),.39,.23,tint='paper')
  L.stencil('17' if side<0 else 'B4',(cx+side*.32,front-.091,z+height*.65),.105,tint='black')
  for i in range(3): L.box('Label abrasion',(cx+side*.32-.13+i*.10,front-.097,z+height*.65+.075),(.045,.003,.016),'e9-body',0)
 # Top remains legible from the gameplay camera: split lids and diagonal ribs.
 for side in [-1,1]:
  L.box('Roof gasket',(x+side*wide*.235,y,z+height-.015),(wide*.45,deep-.28,.035),'p11-rubber',.008)
  L.box('Pressed roof bay',(x+side*wide*.235,y,z+height+.005),(wide*.45-.05,deep-.33,.035),'e9-body',.012)
  for i in range(4):
   xx=x+side*wide*.235+(i-1.5)*wide*.09
   L.box('Roof stiffening bead',(xx,y,z+height+.036),(.055,deep-.37,.035),'e9-trim',.006)
 L.box('Roof expansion joint',(x,y,z+height+.03),(.09,deep-.2,.06),'e9-dark',.008)
 for end in [-1,1]:
  xx=x+end*(wide/2-.055)
  L.inset_panel('End pressure inspection',(xx,y,z+height*.56),deep*.62,height*.50,.03,.04,inner_role='e9-body',axis='X' if end>0 else '-X')

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
 # Load paths are visible: triangular gussets brace the beam into each leg.
 for x in [-3.5,3.5]:
  for y in [-.43,.43]:
   gusset=L.slab('Bolted beam haunch',[(0,0),(.70,0),(0,-.72)],0,.045,'e9-body',.006)
   gusset.rotation_euler=(math.pi/2,0,0 if x<0 else math.pi)
   gusset.location=(x,y,4.24)
   for dx,dz in [(0,.12),(.12,0),(.32,0)]:L.bolt((x+(dx if x<0 else -dx),y-.03,4.18-dz),.035,'Y')
 L.box('Crane control junction',(-3.5,.58,2.8),(.42,.25,.6),'e9-dark',.025)
 L.sweep('Rigid leg power feed',[(-3.5,.58,3.1),(-3.5,.58,4.65),(-3.4,.6,4.75)],.04,'e9-trim',8)
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
 # Brake disc and reduction gearbox connect the motor shaft to the cable drum.
 L.box('Reduction gearbox',(.95,0,3.8),(.38,.60,.48),'e9-dark',.025)
 L.cylinder('Inspection bearing cap',(1.16,0,3.8),.19,.055,'e9-body','X',10,0)
 L.cylinder('Fail-safe brake disc',(-.40,0,3.8),.31,.05,'e9-dark','X',16,0)
 L.box('Brake caliper',(-.42,-.26,3.8),(.18,.20,.30),'e9-body',.015)
 for x in [-.3,.8]:
  L.box('Wheel bearing yoke',(x,-.59,4.2),(.38,.07,.32),'e9-body',.018)
  L.bolt((x,-.64,4.27),.06,'Y')
 L.sweep('Motor power gland',[(1.35,0,4.04),(1.44,.12,4.04),(1.44,.58,4.1)],.04,'p11-rubber',7)
 L.lamp_strip('Hoist status' ,(.25,-.7,4.07),1.0)
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
 for a in L.ASSETS: L.render(L.ROOT/'artifacts/nextgen/p11-final/beauty'/f'{a.name}.png',[a.name],'hero',(1280,960),scale=1.35)
