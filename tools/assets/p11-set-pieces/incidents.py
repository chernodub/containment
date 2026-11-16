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

L.reset_scene();failed_repair();failed_shield()
names=[a.name for a in L.ASSETS]
L.export('incidents',OUT,'incidents.glb','Interrupted repairs and physical consequences on P11 machinery.','blender -b --factory-startup -P tools/assets/p11-set-pieces/incidents.py')
if '--render' in L.args():
 from cpu_preview import stage
 L._stage=stage
 for name in ([names[-1]] if '--last' in L.args() else names):L.render(L.ROOT/'artifacts/nextgen/p11-final/beauty'/(name+'-hero.png'),[name],'hero',scale=1.18)
