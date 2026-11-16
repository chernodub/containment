"""Original P11 habitation landmarks. Rebuild with Blender 5.3; --render for beauty."""
import sys, math, random
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import p11lib as L
from mathutils import Matrix, Vector
OUT=L.ROOT/'public/assets/p11/habitation'
RENDERS=L.ROOT/'artifacts/nextgen/p11-final/beauty'
# Shared-machine beauty rendering: CPU avoids concurrent Metal compilation; two threads.
_stage=L._stage
def preview_stage():
    scene=_stage();scene.cycles.device='CPU';scene.cycles.samples=16;scene.render.threads=2
    return scene
L._stage=preview_stage


def painted(name,loc,size,tint,bevel=.015,rotation=(0,0,0)):
    return L.box(name,loc,size,'p11-tint',bevel,tint=tint,rotation=rotation)

def mug(x,y,z,tint):
    L.lathe('Enamel mug',[(0,0),(.065,0),(.075,.025),(.078,.17),(.067,.17),(.06,.035)],(x,y,z),'p11-tint',12,tint=tint)
    L.torus('Mug handle',(x+.095,y,z+.095),.045,.012,'p11-tint','Y',10,4,tint=tint)
    L.cylinder('Cold tea',(x,y,z+.13),.063,.004,'p11-tint','Z',12,0,tint='wood-dark')

def chair(x,y,angle=0,fallen=False):
    before=set(L.CURRENT.children)
    for sx in (-1,1):
        L.sweep('Bent tubular chair rail',[(sx*.24,-.23,.02),(sx*.24,-.27,.4),(sx*.24,.23,.47),(sx*.24,.27,.98)],.025,'p11-steel',6)
    painted('Seat cushion',(0,0,.46),(.54,.53,.095),'cushion',.04)
    painted('Chair bent plywood back',(0,.27,.81),(.55,.065,.29),'wood',.025)
    L.box('Back seam',(0,.231,.81),(.02,.008,.25),'p11-rubber',0)
    transform=Matrix.Translation((x,y,.30 if fallen else 0)) @ Matrix.Rotation(angle,4,'Z') @ Matrix.Rotation(math.radians(83) if fallen else 0,4,'Y')
    for ob in set(L.CURRENT.children)-before: ob.data.transform(transform)

def drawing(x,z,index):
    L.decal_quad('Child drawing sheet',(x,.713,z),.56,.63,'-Y','paper',rotation=.04*(index-1))
    for sx in (-1,1):
        L.decal_quad('Tape corner',(x+sx*.19,.709,z+.27),.13,.055,'-Y','sand',rotation=sx*.25)
    # A crayon house, tiny stick family and an oversized sun: clearly human, not a tech screen.
    line=lambda name,points,tint: L.sweep(name,[(x+px,.703,z+pz) for px,pz in points],.009,'p11-tint',4,tint=tint)
    line('Crayon house',[(-.18,-.17),(-.18,.02),(0,.17),(.18,.02),(.18,-.17),(-.18,-.17)],'crayon-blue')
    line('Crayon door',[(-.035,-.17),(-.035,-.04),(.045,-.04),(.045,-.17)],'crayon-purple')
    L.torus('Crayon sun',(x+.17,.703,z+.21),.055,.008,'p11-tint','Y',10,3,tint='crayon-yellow')
    line('Crayon grass',[(-.22,-.2),(.22,-.2)],'crayon-green')

def residential():
    L.asset('residential-common-nook',12000)
    # Shallow wall-backed common nook; rear wall at +Y, camera-facing front -Y.
    L.box('Nook wall chassis',(0,.78,1.32),(6.8,.12,2.64),'p11-steel',.035)
    painted('Warm acoustic backing',(0,.705,1.37),(6.58,.035,2.34),'wood-dark')
    for x in (-3.22,-1.58,0,1.58,3.22):
        L.box('Acoustic frame', (x,.66,1.4),(.035,.055,2.25),'p11-steel',.006)
    for x in [-2.9+i*.18 for i in range(13)]:
        painted('Slatted acoustic battens',(x,.65,1.43),(.07,.06,2.0),'wood',.005)
    L.box('Picture rail',(1.55,.62,2.43),(2.85,.09,.05),'p11-steel',.005)
    for i,x in enumerate((.52,1.3,2.08,2.85)): drawing(x,1.85+(i%2)*.12,i)
    L.stencil('OUR NEW HOME',(1.7,.60,2.47),.12,'-Y','cream')
    L.box('Seat frame',(-1.83,.30,.25),(2.9,.73,.36),'p11-steel',.035)
    for i in range(3):
        painted('Bench cushion',(-2.79+i*.95,.24,.49),(.90,.74,.16),'cushion',.06)
        painted('Bench back cushion',(-2.79+i*.95,.60,.91),(.90,.15,.63),'cushion',.055)
    for x in (-3.25,-.37): L.handle((x,.25,.70),.64,'Y',.05,.035,'p11-steel','Z')
    # Offset cantilever table keeps the scene asymmetric.
    L.slab('Table rounded octagonal top',[(-.4,-.61),(1.7,-.61),(1.88,-.43),(1.88,.18),(1.7,.34),(-.4,.34),(-.56,.18),(-.56,-.43)],.86,.96,'p11-tint',.025,tint='wood')
    for x in (-.22,1.53):
        L.box('Table steel pedestal',(x,-.12,.44),(.12,.22,.85),'p11-steel',.015)
        L.box('Table captive foot',(x,-.1,.06),(.55,.62,.10),'p11-steel',.015)
    for y in (-.35,.05): L.box('Table underside beam',(.66,y,.83),(1.95,.06,.09),'p11-steel',.01)
    mug(.12,-.20,.96,'mug-blue');mug(1.27,.10,.96,'mug-white')
    L.decal_quad('Abandoned letter',(.75,-.15,.966),.38,.29,'Z','paper',rotation=.12)
    for i in range(4):L.decal_quad('Handwritten line',(.75,-.23+i*.045,.97),.24,.01,'Z','navy',rotation=.12)
    L.box('Crayon tin',(.98,-.42,1.00),(.33,.15,.08),'p11-steel',.012)
    for i,tint in enumerate(('crayon-blue','crayon-green','crayon-purple')):
        L.cylinder('Loose crayon',(.44+i*.08,-.40,.99),.012,.21,'p11-tint','Y',6,0,tint=tint)
    chair(2.52,-.12,.17,True)
    # Small cupboard with open cubby, hook rail, folded blanket and abandoned arrival bag.
    L.box('Cupboard feet',(-2.8,-.27,.09),(.5,.3,.12),'p11-steel',.02)
    painted('Folded blanket',(-2.45,.22,.60),(.76,.49,.09),'blanket',.02)
    for i in range(4): painted('Blanket weave border',(-2.45,.02+i*.025,.647),(.70,.009,.005),'cream',0)
    painted('Arrival case',(3.02,.23,.35),(.49,.58,.65),'navy',.06)
    for z in (.15,.55):L.box('Case compression band',(3.02,.23,z),(.51,.60,.045),'p11-rubber',.005)
    L.handle((3.02,.23,.70),.24,'X',.06,.015,'p11-steel','Z')
    L.stencil('07',(3.02,-.07,.37),.13,'-Y','cream')
    L.lamp_strip('Domestic wall reading lamp',(-1.8,.53,2.48),2.5,'X','e9-amber',.04,.045)
    L.sweep('Lamp power feed',[(-3,.65,2.46),(-3.3,.65,2.46),(-3.3,.65,.14)],.016,'p11-rubber',6)

def leaf(name,root,tip,width,tint):
    a,b=Vector(root),Vector(tip); d=b-a; side=d.cross(Vector((0,0,1))).normalized()*width
    mid=a+d*.55+Vector((0,0,.10))
    # Folded diamond leaves have real plane changes and legible tapered silhouettes.
    import bmesh
    bm=bmesh.new();vs=[bm.verts.new(v) for v in (a,mid+side,b,mid-side,mid+Vector((0,0,.05)))];
    for ids in ((0,1,4),(1,2,4),(2,3,4),(3,0,4)):bm.faces.new([vs[i] for i in ids])
    L.mesh_object(name,bm,'p11-tint',tint=tint,smooth=False)

def atrium():
    L.asset('atrium-conservatory',12000)
    # Raised stepped garden island, a dying fruit tree under the broken conservatory frame.
    L.slab('Conservatory planter rim',[(-2,-1),(-1.7,-1.3),(1.7,-1.3),(2,-1),(2,1),(1.7,1.3),(-1.7,1.3),(-2,1)],0,.48,'p11-steel',.045)
    painted('Garden dark soil',(0,0,.49),(3.63,2.22,.10),'wood-dark',.02)
    for x in (-1.8,1.8):
        L.box('Planter capped ledge',(x,0,.55),(.18,2.3,.12),'p11-steel',.018)
        L.sweep('Irrigation manifold',[(x,-.9,.58),(x,.9,.58)],.035,'p11-rubber',7)
        L.valve_wheel((x,-.8,.67),.09)
    for i in range(6):
        x=-1.45+i*.58
        L.box('Planter service seam',(x,-1.31,.27),(.028,.018,.35),'p11-rubber',0)
    L.inset_panel('Irrigation service hatch',(0,-1.32,.27),.75,.27,.02,.035,'p11-steel','e9-dark')
    L.gauge((.21,-1.36,.28),.055)
    L.stencil('GARDEN 03',(-.58,-1.335,.28),.085,'-Y','cream')
    L.sweep('Tree twisted trunk',[(0,0,.5),(-.15,.02,1),(.08,.05,1.65),(-.08,0,2.4),(.16,.03,2.9)],.16,'p11-tint',8,taper=(.16,.035),tint='wood-dark')
    rng=random.Random(42)
    for i in range(9):
        a=i*2.39996; z=1.1+i*.17; end=(math.cos(a)*(1.0 if i<5 else .7),math.sin(a)*.8,z+.6)
        L.sweep('Branch',[(0,0,z),(.4*end[0],.4*end[1],z+.4),end],.045,'p11-tint',6,taper=(.045,.012),tint='wood')
        for j in range(5):
            off=Vector(end)+Vector((rng.uniform(-.3,.3),rng.uniform(-.3,.3),rng.uniform(-.16,.18)))
            leaf('Garden leaf',off,off+Vector((math.cos(a+j)*.35,math.sin(a+j)*.35,.09)),.14,'olive' if j%2 else 'mint')
    for i in range(14):
        x=rng.uniform(-1.5,1.5);y=rng.uniform(-.9,.9)
        for j in range(3):leaf('Ground fern',(x,y,.55),(x+math.cos(j*2.1)*.35,y+math.sin(j*2.1)*.3,.85),.10,'olive')
    # Broken overhead glazing ribs: cutaway owner handles marine clearance.
    for x in (-1.9,1.9):
        L.sweep('Skylight support',[(x,1.05,.1),(x,1.05,3.3),(x,.2,3.65),(x,-.9,3.25)],.045,'p11-steel',6)
    L.sweep('Skylight crossbar',[(-1.9,1.05,3.3),(1.9,1.05,3.3)],.05,'p11-steel',6)
    L.sweep('Cracked glazing diagonal',[(-1.8,.98,3.34),(-.7,.52,3.52),(-.35,.57,3.50),(.5,-.16,3.54),(1.8,-.8,3.29)],.016,'e9-cyan',4)
    L.lamp_strip('Horticultural fixture',(0,.97,3.22),2.9,'X','e9-cyan',.035,.035)

L.reset_scene();residential();atrium()
L.export('habitation',OUT,'habitation.glb','Original lived-in common nook and conservatory garden.', 'blender -b --factory-startup -P tools/assets/p11-set-pieces/habitation.py')
if '--render' in L.args():
    for name in [a.name for a in L.ASSETS]:
        L.render(RENDERS/(name+'-game.png'),[name],'game');L.render(RENDERS/(name+'-hero.png'),[name],'hero')
