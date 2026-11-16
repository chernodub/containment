"""Original P11 habitation landmarks. Rebuild with Blender 5.3; --render for beauty."""
import sys, math, random
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import p11lib as L
from mathutils import Matrix, Vector
OUT=L.ROOT/'public/assets/p11/habitation'
RENDERS=L.ROOT/'artifacts/nextgen/p11-final/beauty'
# Shared-machine beauty rendering: CPU avoids concurrent Metal compilation; two threads.
from cpu_preview import stage as _stage
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
    L.decal_quad('Child drawing sheet',(x,.61,z),.56,.63,'-Y','paper',rotation=.04*(index-1))
    for sx in (-1,1):
        L.decal_quad('Tape corner',(x+sx*.19,.605,z+.27),.13,.055,'-Y','sand',rotation=sx*.25)
    # Four individual keepsakes: home, family, garden and the colony ship.
    def line(name,points,tint):
        # Ink is a flat ribbon on paper, not miniature pipework to bevel-bake.
        import bmesh
        bm=bmesh.new();rows=[]
        for i,(px,pz) in enumerate(points):
            prev=Vector(points[max(0,i-1)]);nxt=Vector(points[min(len(points)-1,i+1)])
            d=nxt-prev
            if d.length<.001:d=Vector((1,0))
            d.normalize();side=Vector((-d.y,d.x))*.008
            rows.append([bm.verts.new((x+px+side.x*s,.589,z+pz+side.y*s)) for s in (-1,1)])
        for i in range(len(rows)-1):bm.faces.new([rows[i][0],rows[i+1][0],rows[i+1][1],rows[i][1]])
        L.mesh_object(name,bm,'p11-tint',tint=tint,smooth=False)
    if index==0:
        line('Crayon house',[(-.18,-.17),(-.18,.02),(0,.17),(.18,.02),(.18,-.17),(-.18,-.17)],'crayon-blue')
        line('Crayon door',[(-.035,-.17),(-.035,-.04),(.045,-.04),(.045,-.17)],'crayon-purple')
        L.torus('Crayon sun',(x+.17,.60,z+.21),.055,.008,'p11-tint','Y',10,3,tint='crayon-yellow')
    elif index==1:
        for px,h in ((-.15,.10),(0,-.01),(.15,.08)):
            L.torus('Family head',(x+px,.60,z+h+.08),.045,.008,'p11-tint','Y',8,3,tint='crayon-purple')
            line('Family body',[(px,h+.03),(px,h-.12),(px-.05,-.2),(px,h-.12),(px+.05,-.2)],'crayon-blue')
            line('Family linked hands',[(px-.07,h-.07),(px,h-.02),(px+.07,h-.07)],'crayon-blue')
    elif index==2:
        line('Garden trunk',[(0,-.20),(.01,.12),(-.10,.19),(.01,.12),(.13,.20)],'wood-dark')
        line('Garden crown',[(-.18,.03),(-.20,.15),(-.10,.24),(.03,.27),(.18,.20),(.21,.07),(.08,.01),(-.18,.03)],'crayon-green')
        for px in (-.12,.1):L.torus('Garden fruit',(x+px,.60,z+.13),.026,.008,'p11-tint','Y',8,3,tint='crayon-yellow')
    else:
        line('Colony rocket',[(-.07,-.13),(-.07,.13),(0,.25),(.07,.13),(.07,-.13),(-.07,-.13)],'crayon-purple')
        line('Rocket fins',[(-.07,-.03),(-.17,-.18),(-.07,-.13),(.07,-.13),(.17,-.18),(.07,-.03)],'crayon-blue')
        L.torus('Rocket window',(x,.60,z+.07),.037,.008,'p11-tint','Y',8,3,tint='crayon-blue')
        for px,pz in ((-.18,.18),(.18,.06)):
            line('Distant star',[(px-.03,pz),(px+.03,pz),(px,pz),(px,pz-.03),(px,pz+.03)],'crayon-yellow')
    if index!=3:line('Crayon grass',[(-.22,-.22),(.22,-.22)],'crayon-green')

def residential():
    wall=L.asset('residential-story-wall',12000)
    # Shallow wall-backed common nook; rear wall at +Y, camera-facing front -Y.
    L.box('Nook wall chassis',(0,.78,1.32),(6.8,.12,2.64),'p11-steel',.035)
    painted('Warm acoustic backing',(0,.705,1.37),(6.58,.035,2.34),'wood-dark')
    for x in (-3.22,-1.58,0,1.58,3.22):
        L.box('Acoustic frame', (x,.66,1.4),(.035,.055,2.25),'p11-steel',.006)
    for x in [-2.9+i*.18 for i in range(13)]:
        painted('Slatted acoustic battens',(x,.65,1.43),(.07,.06,2.0),'wood',.005)
    L.box('Picture rail',(1.55,.62,2.43),(2.85,.09,.05),'p11-steel',.005)
    for i,x in enumerate((.52,1.3,2.08,2.85)): drawing(x,1.85+(i%2)*.12,i)
    L.stencil('OUR NEW HOME',(1.7,.60,2.35),.12,'-Y','cream')
    # Keep waist-high furniture visible when the taller story wall cuts away.
    L.asset('residential-common-nook',12000)
    L.box('Seat frame',(-1.83,.30,.25),(2.9,.73,.36),'p11-steel',.035)
    for i in range(3):
        painted('Bench cushion',(-2.79+i*.95,.24,.49),(.90,.74,.16),'cushion',.06)
        painted('Bench back cushion',(-2.79+i*.95,.60,.91),(.90,.15,.63),'cushion',.055)
        cx=-2.79+i*.95
        L.sweep('Seat sewn piping',[(cx-.39,-.08,.57),(cx+.39,-.08,.57),(cx+.42,.0,.57),(cx+.42,.5,.57)],.009,'p11-tint',4,tint='navy')
        L.sweep('Back upholstery welt',[(cx-.39,.515,.65),(cx-.39,.515,1.16),(cx+.39,.515,1.16),(cx+.39,.515,.65)],.008,'p11-tint',4,tint='navy')
        for xx in (-.2,.2):L.box('Back upholstery tuck',(cx+xx,.517,.92),(.008,.006,.35),'p11-tint',0,tint='navy')
    for x in (-3.25,-.37): L.handle((x,.25,.70),.64,'Y',.05,.035,'p11-steel','Z')
    # Offset cantilever table keeps the scene asymmetric.
    L.slab('Table rounded octagonal top',[(-.4,-.61),(1.7,-.61),(1.88,-.43),(1.88,.18),(1.7,.34),(-.4,.34),(-.56,.18),(-.56,-.43)],.86,.96,'p11-tint',.025,tint='wood')
    for x in (-.22,1.53):
        L.box('Table steel pedestal',(x,-.12,.44),(.12,.22,.85),'p11-steel',.015)
        L.box('Table captive foot',(x,-.1,.06),(.55,.62,.10),'p11-steel',.015)
    for y in (-.35,.05): L.box('Table underside beam',(.66,y,.83),(1.95,.06,.09),'p11-steel',.01)
    mug(.12,-.20,.96,'mug-blue')
    before=set(L.CURRENT.children);mug(0,0,0,'mug-white')
    tipped=Matrix.Translation((1.27,.12,1.04)) @ Matrix.Rotation(math.pi/2,4,'X') @ Matrix.Rotation(.25,4,'Z')
    for ob in set(L.CURRENT.children)-before:ob.data.transform(tipped)
    # A half-eaten meal and overturned tea sit in the same abandoned activity.
    L.slab('Tea spilled toward table edge',[(1.32,-.08),(1.17,-.04),(.99,-.11),(.93,-.23),(1.03,-.31),(1.22,-.29),(1.39,-.38),(1.54,-.33),(1.48,-.19)],.961,.965,'p11-tint',0,tint='wood-dark')
    L.lathe('Meal enamel plate',[(0,0),(.15,0),(.22,.035),(.23,.055),(.21,.065),(.14,.025),(0,.025)],(1.57,-.24,.969),'p11-tint',16,tint='cream')
    L.slab('Bitten ration',[(-.11,-.07),(.08,-.07),(.10,-.02),(.06,.01),(.08,.05),(.02,.08),(-.11,.08)],.01,.055,'p11-tint',.008,tint='sand').data.transform(Matrix.Translation((1.57,-.24,1.0)))
    L.box('Abandoned fork',(.35,.09,.98),(.024,.28,.018),'p11-steel',.003,rotation=(0,0,.35))
    for i in range(3):L.box('Fork tine',(.33+i*.019,.24,.981),(.009,.075,.012),'p11-steel',0)
    L.box('Unpacked meal sleeve',(-.15,.11,.98),(.27,.25,.025),'p11-tint',.004,tint='paper')
    L.decal_quad('Meal sleeve print',(-.15,.11,.997),.18,.025,'Z','navy')
    L.decal_quad('Abandoned letter',(.75,-.15,.966),.38,.29,'Z','paper',rotation=.12)
    for i in range(4):L.decal_quad('Handwritten line',(.75,-.23+i*.045,.97),.24,.01,'Z','navy',rotation=.12)
    L.box('Crayon tin',(.98,-.42,1.00),(.33,.15,.08),'p11-steel',.012)
    for i,tint in enumerate(('crayon-blue','crayon-green','crayon-purple')):
        L.cylinder('Loose crayon',(.44+i*.08,-.40,.99),.012,.21,'p11-tint','Y',6,0,tint=tint)
    chair(2.40,-.30,-.62,True)
    # Small cupboard with open cubby, hook rail, folded blanket and abandoned arrival bag.
    # A blanket slumps over the bench lip; irregular folds catch the light.
    import bmesh
    for j in range(8):
        bm=bmesh.new();rows=[]
        for jj in (j,j+1):
            t=jj/8;yy=.45-t*.75
            rows.append([bm.verts.new((-2.45+(i/8-.5)*.76,yy,.625+.018*math.sin(i*2+jj*.7)-max(0,t-.65)*.65)) for i in range(9)])
        for i in range(8):bm.faces.new([rows[0][i],rows[0][i+1],rows[1][i+1],rows[1][i]])
        L.mesh_object('Woven blanket band',bm,'p11-tint',tint='cream' if j==6 else 'blanket',smooth=True)
    painted('Arrival case',(3.02,.23,.35),(.49,.58,.65),'navy',.06)
    for z in (.15,.55):L.box('Case compression band',(3.02,.23,z),(.51,.60,.045),'p11-rubber',.005)
    L.handle((3.02,.23,.70),.24,'X',.06,.015,'p11-steel','Z')
    L.stencil('07',(3.02,-.07,.37),.13,'-Y','cream')
    L.CURRENT=wall
    L.lamp_strip('Drawing rail lamp',(1.7,.53,2.60),1.8,'X','e9-amber',.04,.025)
    L.lamp_strip('Domestic wall reading lamp',(-1.8,.53,2.48),2.5,'X','e9-amber',.04,.045)
    L.sweep('Lamp power feed',[(-3,.65,2.46),(-3.3,.65,2.46),(-3.3,.65,.14)],.016,'p11-rubber',6)

def leaf(name,root,tip,width,tint):
    import bmesh
    a,b=Vector(root),Vector(tip);d=b-a;side=d.cross(Vector((0,0,1))).normalized()
    bm=bmesh.new();rows=[]
    for i in range(7):
        t=i/6;center=a+d*t+Vector((0,0,math.sin(t*math.pi)*width*.7))
        w=max(.002,math.sin(math.pi*t)**.8*width)
        rows.append([bm.verts.new(center+side*w*sign+Vector((0,0,sign*w*math.sin(t*4)*.6-abs(sign)*w*.4))) for sign in (-1,0,1)])
    for i in range(6):
        for j in range(2):bm.faces.new([rows[i][j],rows[i+1][j],rows[i+1][j+1],rows[i][j+1]])
    L.mesh_object(name,bm,'p11-tint',tint=tint,smooth=True)
    L.sweep('Leaf midrib',[a+d*(i/6)+Vector((0,0,math.sin(i/6*math.pi)*width*.7+.003)) for i in range(7)],.004,'p11-tint',3,tint='wood')

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
            L.sweep('Leaf petiole',[Vector(end),off],.009,'p11-tint',4,tint='wood')
            leaf('Garden leaf',off,off+Vector((math.cos(a+j)*.48,math.sin(a+j)*.48,rng.uniform(-.15,.25))),.085,'#89946c' if j%3 else '#6c7b55')
    for i in range(14):
        x=rng.uniform(-1.5,1.5);y=rng.uniform(-.9,.9)
        for j in range(3):leaf('Ground fern',(x,y,.55),(x+math.cos(j*2.1)*.35,y+math.sin(j*2.1)*.3,.85),.10,'#89946c')
    # Closed water circuit: supply canister, regulator, branch feeds and drip ring.
    L.cylinder('Irrigation pressure vessel',(-1.37,.62,.88),.23,.65,'p11-tint-metal','Z',12,.025,tint='navy')
    L.torus('Vessel retaining strap',(-1.37,.62,.78),.24,.025,'p11-steel','Z',12,4)
    L.cylinder('Regulator neck',(-1.37,.62,1.26),.09,.14,'p11-steel','Z',10,0)
    L.valve_wheel((-1.37,.62,1.36),.12)
    L.sweep('Regulated supply',[(-1.37,.62,1.28),(-1.65,.62,1.28),(-1.8,.62,.6),(-1.8,-.75,.6)],.035,'p11-steel',7)
    L.sweep('Cross bed supply',[(-1.8,-.75,.6),(0,-.75,.6),(1.8,-.75,.6)],.025,'p11-rubber',6)
    L.torus('Root drip ring',(0,0,.57),.38,.025,'p11-rubber','Z',20,5)
    L.sweep('Root branch feed',[(0,-.75,.6),(0,-.38,.57)],.025,'p11-rubber',6)
    for x in (-1.8,1.8):
        for y in (-.65,.2,.8):L.cylinder('Pipe captive fitting',(x,y,.59),.055,.075,'p11-steel','Y',8,0)
    for x in (-1.72,1.72):L.bolt_row((x,-.9,.62),(x,.9,.62),4,.022,'Z')
    # Broken overhead glazing ribs: cutaway owner handles marine clearance.
    for x in (-1.9,1.9):
        points=[(x,1.05,.1),(x,1.05,3.3),(x,.2,3.65),(x,-.9,3.25)] if x<0 else [(x,1.05,.1),(x,1.05,2.1),(x-.15,.8,2.35),(x-.42,.44,2.16)]
        L.sweep('Intact left rib and buckled right support',points,.045,'p11-steel',6)
    L.sweep('Collapsed glazing rib embedded in garden',[(1.48,.76,.61),(.95,.3,.65),(.65,-.05,.84),(.12,-.58,.61)],.05,'p11-steel',6)
    L.slab('Fallen glazing shard',[(-.25,-.83),(.45,-.51),(.72,-.71),(.21,-1.05)],.56,.572,'e9-glass',0)
    # Someone stopped repairing the ruptured irrigation circuit to leave.
    L.box('Open gardener tool satchel',(-1.13,-.84,.72),(.72,.40,.29),'p11-tint',.035,tint='navy')
    L.box('Satchel dark opening',(-1.13,-.84,.875),(.59,.29,.018),'p11-rubber',.025)
    L.box('Flap thrown back',(-1.13,-.59,.90),(.70,.30,.035),'p11-tint',.012,rotation=(.32,0,0),tint='navy')
    L.sweep('Abandoned bag shoulder strap',[(-1.46,-.85,.79),(-1.51,-1.05,.61),(-1.24,-1.23,.58),(-.87,-1.04,.64),(-.80,-.85,.79)],.018,'p11-rubber',5)
    for xx in (-1.28,-1.03):L.box('Satchel tool grip',(xx,-.86,.93),(.06,.14,.25),'p11-steel',.009,rotation=(.18,0,0))
    L.sweep('Severed irrigation hose',[(-1.8,-.75,.6),(-1.6,-.65,.63),(-1.2,-.35,.6),(-.83,-.35,.67)],.035,'p11-rubber',6)
    L.cylinder('Torn hose union',(-.83,-.35,.68),.065,.10,'p11-steel','Z',8,0)
    L.slab('Wet soil below broken union',[(-1.2,-.4),(-1,-.58),(-.55,-.65),(-.34,-.4),(-.6,-.16),(-.98,-.17)],.55,.558,'p11-tint',0,tint='navy')
    L.sweep('Skylight crossbar',[(-1.9,1.05,3.3),(1.9,1.05,3.3)],.05,'p11-steel',6)
    import bmesh
    for points in [[(-1.8,.98,3.34),(-1.8,-.25,3.48),(-.9,.45,3.52),(-.25,1,3.34)],[(.5,1,3.34),(1.8,1,3.34),(1.8,.35,3.53)]]:
        bm=bmesh.new();bm.faces.new([bm.verts.new(p) for p in points]);L.mesh_object('Fractured skylight pane',bm,'e9-glass',smooth=False)
    L.sweep('Cracked glazing diagonal',[(-1.8,.98,3.34),(-1.4,.65,3.44),(-1.35,.58,3.46),(-.9,.45,3.52)],.009,'e9-cyan',4)
    for points in [[(-1.8,.98,3.35),(-1.4,.68,3.44),(-1.25,.75,3.42),(-.9,.67,3.44)],[(1.65,.95,3.36),(1.52,.75,3.43),(1.68,.58,3.47)]]:
        L.sweep('Glazing impact hairline',points,.006,'p11-tint',3,tint='paper')
    L.lamp_strip('Horticultural fixture',(0,.97,3.22),2.9,'X','e9-cyan',.035,.035)

L.reset_scene();residential();atrium()
L.export('habitation',OUT,'habitation.glb','Original lived-in common nook and conservatory garden.', 'blender -b --factory-startup -P tools/assets/p11-set-pieces/habitation.py')
if '--render' in L.args():
    for name in [a.name for a in L.ASSETS if not any(v.startswith('--only=') for v in L.args()) or '--only='+a.name in L.args()]:
        if name=='residential-story-wall':continue
        targets=[name,'residential-story-wall'] if name=='residential-common-nook' else [name]
        L.render(RENDERS/(name+'-game.png'),targets,'game');L.render(RENDERS/(name+'-hero.png'),targets,'hero')
