"""UI13 ordnance bench. Run with blender -b -t 6 -P tools/assets/ui13-rewards/studies.py."""
import math
import sys
from pathlib import Path
sys.dont_write_bytecode = True
import bpy
from mathutils import Vector
ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'tools/assets/u10-keyart'))
from actors import area_light, material
OUT = ROOT / 'public/assets/ui/rewards'
PALETTE = {'kinetic': (1,.46,.065), 'cryo': (.14,.76,1), 'pyro': (1,.17,.035),
           'arc': (.57,.27,1), 'recovery': (.12,.86,.56), 'acid': (.48,.96,.08),
           'universal': (.53,.75,.87)}
GROUPS = {
    'kinetic': 'demolition kinetic afterquake reinforced-bulwark siege-plow fault-line reserve-thruster',
    'cryo': 'executioner cryo spreading-nova twin-glacier shard-harvest ice-road',
    'pyro': 'wildfire pyro scorched-fan napalm-triplet ember-relay meltdown-core',
    'arc': 'cycling arc forked-overload twin-pylon pilgrim-pylon live-wire drive-dynamo',
    'universal': 'universal slide-loader', 'acid': 'acid', 'recovery': 'recovery tactical-salvage'}
def mesh(name, vertices, faces, mat, bevel=.025):
    data=bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    data.update()
    obj=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    if bevel:
        mod=obj.modifiers.new('Machined edge','BEVEL')
        mod.width=bevel
        mod.segments=2
        obj.modifiers.new('Face normals','WEIGHTED_NORMAL')
    return obj

def plate(points,z,height,mat):
    n=len(points)
    return mesh('Profile',[(x,y,h) for h in (z,z+height) for x,y in points],
                [tuple(reversed(range(n))),tuple(range(n,2*n))]+
                [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],mat)

def box(x,y,z,w,d,h,mat):
    return plate([(x-w/2,y-d/2),(x+w/2,y-d/2),(x+w/2,y+d/2),(x-w/2,y+d/2)],z,h,mat)

def rod(a,b,r,s,mat,n=32):
    a,b=Vector(a),Vector(b)
    bpy.ops.mesh.primitive_cone_add(vertices=n,radius1=r,radius2=s,depth=(b-a).length,location=(a+b)/2)
    obj=bpy.context.object
    obj.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
    obj.data.materials.append(mat)
    return obj

def wire(points,r,mat):
    curve=bpy.data.curves.new('Formed conductor','CURVE')
    curve.dimensions='3D'
    curve.bevel_depth=r
    curve.bevel_resolution=2
    path=curve.splines.new('POLY')
    path.points.add(len(points)-1)
    for v,p in zip(path.points,points): v.co=(*p,1)
    obj=bpy.data.objects.new('Conductor',curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)

def ring(x,y,z,r,t,mat,start=0,end=math.tau):
    wire([(x+r*math.cos(start+(end-start)*i/48),y+r*math.sin(start+(end-start)*i/48),z) for i in range(49)],t,mat)

def bolt(x,y,z):
    rod((x,y,z),(x,y,z+.07),.075,.075,steel,6)
    box(x,y,z+.069,.085,.018,.008,dark)

def cartridge(x,y,z,scale=1):
    for a,b,r,s,m in [(0,.1,.2,.2,steel),(.1,.75,.18,.18,copper),(.75,.92,.18,.11,copper),(.92,1.22,.11,.016,paint)]:
        rod((x,y,z+a*scale),(x,y,z+b*scale),r*scale,s*scale,m)

def shard(x,y,z,dx,dy,h,r):
    pts=[(x+r*math.cos(i*math.tau/5),y+r*math.sin(i*math.tau/5),z) for i in range(5)]
    pts += [(a+dx*.6,b+dy*.6,z+h*.62) for a,b,_ in pts]+[(x+dx,y+dy,z+h)]
    obj=mesh('Cleaved crystal',pts,[(i,(i+1)%5,(i+1)%5+5,i+5) for i in range(5)]+[(i+5,(i+1)%5+5,10) for i in range(5)],paint,0)
    obj.data.materials.append(glow)
    obj.data.polygons[7].material_index=1

def coil(x,y,z,r,h):
    rod((x,y,z),(x,y,z+h),r*.6,r*.6,dark)
    wire([(x+r*math.cos(i*.15),y+r*math.sin(i*.15),z+h*i/240) for i in range(241)],.045,copper)
    for level in (z,z+h): rod((x,y,level),(x,y,level+.09),r*1.18,r*1.18,steel)

def study(name):
    if name=='demolition':
        for x in (-.7,0,.7):
            box(x,0,.03,.6,1.28,.43,paint)
            box(x,0,.47,.18,1.3,.08,dark)
        box(0,.18,.56,1.62,.25,.14,steel)
        wire([(-.7,-.45,.48),(-.6,-.8,.52),(.55,-.83,.64),(.7,-.4,.5)],.048,glow)
    elif name=='executioner':
        for sign in (-1,1):
            shard(0,0,.16,sign*1.48,.15,1.18,.25)
            rod((0,0,.22),(sign*.87,-.1,.03),.18,.12,dark)
        bolt(0,0,.4)
    elif name=='wildfire':
        for i in range(6):
            angle=i*math.tau/6
            vertices=[]
            for step in range(13):
                t=step/12
                a=angle+t*1.8
                radius=.8-.48*t
                width=.34*(1-t)+.012
                for side in (-1,1):
                    vertices.append((radius*math.cos(a+side*width),radius*math.sin(a+side*width),.06+t*(1.3+(i%3)*.18)))
            flame=mesh('Curling flame front',vertices,[(2*j,2*j+1,2*j+3,2*j+2) for j in range(12)],glow if i%2 else paint,0)
            flame.modifiers.new('Flame thickness','SOLIDIFY').thickness=.028
        ring(0,0,.07,.87,.055,copper)
    elif name=='cycling':
        for i in range(12):
            a=i*math.tau/12
            x,y=math.cos(a),math.sin(a)
            rod((x*.66,y*.66,.32),(x*1.03,y*1.03,.32),.17,.2,copper,8)
        for z in (.16,.49): ring(0,0,z,.83,.1,steel)
        ring(0,0,.36,.64,.042,glow)
    elif name=='kinetic':
        for i in range(6): cartridge((i%3-1)*.49,(i//3-.5)*.5,.1,1.25)
        box(0,0,.15,1.55,1,.28,dark)
    elif name=='afterquake':
        for a,b,r,s,m in [(0,.25,.9,.72,steel),(.25,.55,.45,.34,paint),(.55,1.4,.2,.2,steel),(1.4,1.7,.54,.54,dark)]:
            rod((0,0,a),(0,0,b),r,s,m,12)
        for r in (1.1,1.45): ring(0,0,.04,r,.028,glow,.3,5.6)
    elif name=='reinforced-bulwark':
        for i in (-1,0,1):
            x=i*.78
            obj=plate([(x-.46,-.55),(x+.44,-.55),(x+.42,.42),(x,.74),(x-.42,.42)],0,.16,steel)
            obj.rotation_euler.x=1.03
            obj.location=(0,abs(i)*.25,.85-abs(i)*.2)
            for j in (-1,1): bolt(x+j*.25,abs(i)*.25,.62)
        wire([(-1.14,-.42,.72),(0,-.66,.95),(1.14,-.42,.72)],.04,glow)
    elif name=='siege-plow':
        for sign in (-1,1):
            mesh('Dozer wing',[(0,-.9,.03),(sign*1.5,.3,.03),(sign*1.5,.54,.89),(0,-.52,1.12)],[(0,1,2,3)],paint,0)
            rod((0,-.9,.05),(sign*1.5,.3,.05),.085,.085,steel)
            rod((sign*.75,.1,.65),(sign*.6,1,.24),.15,.22,dark)
        for i in range(-3,4): rod((i*.37,abs(i)*.29-.85,.12),(i*.37,abs(i)*.29-1.1,.025),.14,.02,steel,4)
    elif name=='fault-line':
        edge=[(-1.5,-.35),(-.8,.12),(-.45,-.1),(.12,.26),(.48,.02),(1.55,.28)]
        for s in (-1,1):
            p=[(x,y+s*.09) for x,y in edge]+[(1.55,s*.95),(-1.5,s*.95)]
            plate(p if s==1 else p[::-1],0,.18 if s<0 else .32,steel)
            for x in (-1.3,1.3):bolt(x,s*.76,.18 if s<0 else .32)
        wire([(x,y,.1) for x,y in edge],.075,glow)
    elif name=='reserve-thruster':
        for y in (-.42,.42):
            for a,b,r,s,m in [(-1,-.4,.52,.25,dark),(-.4,.6,.27,.38,steel),(.6,.9,.38,.23,paint)]:
                rod((a,y,.65),(b,y,.65),r,s,m)
            rod((-1.01,y,.65),(-1,y,.65),.35,.35,glow)
        box(.15,0,.82,.8,1,.16,steel)
    elif name=='cryo':
        rod((-1.2,0,.55),(.65,0,.55),.44,.29,steel,8)
        for x in (-.9,-.55,-.2,.15): rod((x,0,.55),(x+.08,0,.55),.5,.5,paint,8)
        for i in range(6): shard(.55,.15*math.sin(i),.45,.5+i*.08,(i-3)*.13,.24+i*.12,.13)
    elif name=='spreading-nova':
        for i in range(10):
            a=i*math.tau/10
            shard(.45*math.cos(a),.45*math.sin(a),.04,.85*math.cos(a),.85*math.sin(a),.65+(i%3)*.16,.23)
        ring(0,0,.15,.64,.1,steel)
    elif name=='twin-glacier':
        for y in (-.65,.48):
            for i in range(6):shard((i-2.5)*.36,y,.02,.13,.12,1.05+.36*math.sin(i*1.4),.29)
    elif name=='shard-harvest':
        rod((-1.55,0,.12),(-.7,0,.43),.13,.14,dark)
        rod((-.78,-.43,.38),(-.78,.43,.38),.11,.1,steel)
        shard(-.65,0,.4,2.12,.12,.97,.34)
    elif name=='ice-road':
        for i in range(8):
            x=(i-3.5)*.4
            plate([(x-.2,-.54),(x-.1,-.76),(x+.22,-.57),(x+.17,.64),(x-.21,.72)],0,.12+(i%2)*.03,paint)
        for y in (-.52,.52):wire([(-1.52,y,.16),(1.43,y,.16)],.028,glow)
    elif name=='pyro':
        box(-.14,0,.03,1.44,.75,.92,paint)
        for x in (-.68,.4):box(x,0,.02,.12,.8,.99,steel)
        wire([(-.47,0,.93),(-.47,0,1.25),(.19,0,1.25),(.19,0,.93)],.09,dark)
        wire([(.55,0,.66),(.95,0,.66),(1.04,0,.89)],.12,copper)
        rod((1.04,0,.91),(1.15,0,1.48),.13,0,glow,7)
    elif name=='scorched-fan':
        for i in range(-3,4):
            a=i*.25
            rod((-.5,0,.35),(1.1*math.cos(a),1.35*math.sin(a),.48),.12,.19,copper)
            rod((1.1*math.cos(a),1.35*math.sin(a),.48),(1.2*math.cos(a),1.48*math.sin(a),.49),.19,.17,dark)
        rod((-1.45,0,.32),(-.44,0,.35),.23,.35,paint,8)
    elif name=='napalm-triplet':
        for x,y in [(-.72,-.2),(.54,-.35),(.04,.64)]:
            rod((x,y,.09),(x,y,.64),.31,.46,paint,8)
            rod((x,y,.64),(x,y,.94),.46,.16,steel,8)
            ring(x,y,.62,.44,.042,glow)
            wire([(x,y,.94),(x+.05,y,1.11),(x+.24,y,1.14)],.05,dark)
    elif name=='ember-relay':
        for i in range(4):
            x=i*.69-1
            box(x,(i%2)*.45,0,.38,.38,.42+i*.19,steel)
            rod((x,(i%2)*.45,.42+i*.19),(x,(i%2)*.45,.59+i*.19),.2,.06,glow)
        wire([(-1,0,.59),(-.66,.19,.94),(-.31,.45,.79),(.07,.16,1.27),(.38,0,.99),(.7,.25,1.38),(1.07,.45,1.16)],.035,glow)
    elif name=='meltdown-core':
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.67,location=(0,0,.92))
        bpy.context.object.data.materials.append(glow)
        for i in range(8):
            a=i*math.tau/8
            wire([(r*math.cos(a),r*math.sin(a),z) for r,z in [(.36,.05),(.89,.56),(.95,1.16),(.66,1.62)]],.145,steel)
    elif name=='arc':
        coil(-.78,0,0,.35,1.14);coil(.74,0,0,.29,1.46)
        wire([(-.78,0,1.24),(-.44,0,1.52),(-.57,0,1.29),(.14,0,1.71),(.03,0,1.45),(.74,0,1.56)],.039,glow)
    elif name=='forked-overload':
        rod((-1.5,0,.24),(-.36,0,.51),.2,.26,dark)
        for i in (-1,0,1):
            wire([(-.4,0,.52),(.15,.55*i,.66),(1.22,i*.67,.92)],.13,copper)
            rod((1.2,i*.67,.92),(1.52,i*.7,1.03),.14,.012,glow)
    elif name in ('twin-pylon','pilgrim-pylon'):
        if name=='twin-pylon':
            for x in (-.84,.84):
                rod((x,0,.06),(x,0,1.14),.46,.06,steel,4)
                rod((x,0,1.14),(x,0,1.55),.05,.24,paint,4)
            wire([(-.84,0,1.51),(-.3,0,1.15),(0,0,1.42),(.84,0,1.51)],.035,glow)
        else:
            coil(0,0,.66,.32,.84)
            for x,y in [(-1,-.54),(.94,-.58),(.25,.92)]:
                wire([(0,0,.83),(x*.75,y*.75,.99),(x,y,.12),(x*1.17,y,.04)],.11,steel)
    elif name=='live-wire':
        pts=[(-1.45+i*.032,.55*math.sin(i*.099),.22+.08*math.sin(i*.18)) for i in range(90)]
        wire(pts,.072,dark)
        wire([(x,y,z+.064) for x,y,z in pts],.025,glow)
        for x,y,z in (pts[0],pts[-1]):
            rod((x,y,z),(x,y,z+.52),.15,.21,copper,8)
            for d in (-.1,.1):rod((x+d,y,z+.5),(x+d,y,z+.83),.045,.045,steel)
    elif name=='drive-dynamo':
        for x,r,m in [(-.75,.35,steel),(-.44,.74,copper),(-.22,.69,dark),(0,.7,paint),(.22,.69,dark),(.44,.74,copper),(.75,.35,steel)]:
            rod((x-.1,0,.8),(x+.1,0,.8),r,r,m)
        rod((-1.26,0,.8),(1.26,0,.8),.2,.2,steel,8)
    elif name=='universal':
        for x,r,s,m in [(-.7,.32,.43,dark),(-.37,.43,.39,steel),(-.04,.39,.46,paint),(.29,.46,.65,steel)]:
            rod((x,0,.68),(x+.34,0,.68),r,s,m)
        rod((.63,0,.68),(.7,0,.68),.55,.47,glow)
        box(0,0,.04,.95,.44,.34,dark)
    elif name=='slide-loader':
        plate([(-1.13,-.35),(.63,-.35),(1.26,.29),(.88,.57),(.48,.15),(-1.13,.15)],0,.62,steel)
        for y in (-.24,.08): rod((-1.54,y,.74),(.58,y,.74),.069,.069,steel)
        box(-1.3,-.08,.61,.37,.55,.37,dark)
        cartridge(.67,.12,.5,.66)
        box(-.17,-.36,.13,1.62,.04,.13,paint)
    elif name=='acid':
        for i in range(3):
            x=(i-1)*.58
            rod((x,0,.2),(x+.22,0,1.36),.18,.18,paint)
            rod((x+.22,0,1.36),(x+.25,0,1.52),.22,.22,dark)
        box(0,0,.43,1.68,.48,.25,steel)
        for x in (-.4,.18): wire([(x,-.27,.52),(x+.13,-.27,.52)],.035,glow)
    elif name=='recovery':
        for a,b,r,s,m in [(-1.6,-1.1,.015,.05,steel),(-1.1,-.8,.09,.24,steel),(-.8,.42,.24,.24,paint),(.42,.53,.44,.44,steel),(.53,1.12,.08,.08,steel),(1.12,1.25,.34,.34,dark)]:
            rod((a,0,.46),(b,0,.46),r,s,m)
        for i in range(6):box(-.65+i*.17,-.23,.45,.038,.038,.11,steel)
    elif name=='tactical-salvage':
        for y in (-1,1):
            wire([(-1.3,y*.35,.18),(-.23,y*.14,.27),(.36,y*.59,.34),(1.09,y*.42,.47),(1.25,y*.21,.52)],.15,steel)
            rod((-1.43,y*.39,.16),(-.52,y*.22,.23),.18,.16,paint)
        bolt(-.24,0,.38)

for family,names in GROUPS.items():
    for name in names.split():
        if "--" in sys.argv and name not in sys.argv[sys.argv.index("--")+1:]: continue
        bpy.ops.wm.read_factory_settings(use_empty=True)
        scene=bpy.context.scene
        scene.world=bpy.data.worlds.new('Bench ambient')
        scene.world.color=(.16,.18,.21)
        steel=material('Bead blasted alloy',(.27,.33,.39),.78,.3)
        dark=material('Graphite',(.052,.073,.09),.56,.36)
        copper=material('Bronze contact',(.61,.3,.13),.78,.3)
        paint=material('Rig ceramic',PALETTE[family],.44,.32)
        glow=material('Active face',PALETTE[family],.24,.21,1.8)
        study(name)
        bpy.context.view_layer.update()
        bounds=[o.matrix_world @ Vector(v) for o in scene.objects for v in o.bound_box]
        direction=Vector((3,-6,3.6)).normalized()
        rot=(-direction).to_track_quat('-Z','Y')
        projected=[rot.inverted() @ p for p in bounds]
        low=Vector([min(v[i] for v in projected) for i in range(3)])
        high=Vector([max(v[i] for v in projected) for i in range(3)])
        target=rot @ ((low+high)/2)
        box(0,0,-.13,200,200,.12,material('Graphite deck',(.013,.022,.031),.35,.42))
        area_light('Softbox',(-2,-4,6),520,4,(.91,.96,1),target=target)
        area_light('Rim',(1,3,3),380,2.5,PALETTE[family],target=target)
        area_light('Fill',(4,-2,2),190,3,(.94,.82,.72),target=target)
        bpy.ops.object.camera_add(location=target+direction*9)
        cam=bpy.context.object
        cam.rotation_euler=rot.to_euler()
        cam.data.type='ORTHO'
        cam.data.ortho_scale=max(high.x-low.x,(high.y-low.y)*1.6)*1.13
        scene.camera=cam
        scene.render.engine='CYCLES'
        scene.cycles.samples=10
        scene.cycles.use_denoising=True
        scene.render.resolution_x=768
        scene.render.resolution_y=480
        scene.render.resolution_percentage=100
        scene.render.filepath=str(OUT/(name+'.png'))
        bpy.ops.render.render(write_still=True)
        scene.render.image_settings.file_format='WEBP'
        scene.render.image_settings.quality=88
        bpy.data.images['Render Result'].save_render(str(OUT/(name+'.webp')),scene=scene)
