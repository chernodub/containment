"""U10 cinematic restaging. blender -b -P .../stage.py -- --round=6 [--layers]."""
import math
from pathlib import Path
import sys
import bpy
from mathutils import Matrix,Vector
from bpy_extras.object_utils import world_to_camera_view
sys.path.insert(0,str(Path(__file__).resolve().parent))
from actors import ROOT, import_marine, finish_for_render, area_light, material, deformed_points
sys.path.insert(0,str(ROOT/'tools/assets/k10-marine'))
from render_device import choose_render_device
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
ROUND=int(next((a.split('=')[1] for a in args if a.startswith('--round=')),'6'))
LAYERS='--layers' in args
ENDING='--ending' in args
OUT=ROOT/'artifacts/nextgen/u10-rounds'/('ending' if ENDING else str(ROUND))
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='CYCLES';choose_render_device(scene)
scene.cycles.samples=72 if ROUND<10 else 128;scene.cycles.use_denoising=True
scene.cycles.volume_bounces=2
scene.render.resolution_x=2560;scene.render.resolution_y=1440;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=-1.6 if ROUND>=7 else -1.2
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.025,.055,.075,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.006 if ROUND>=7 else .025
plates={name:[] for name in ['background','midground','hero','foreground','fog']}
steel=material('Cyan steel',(.025,.07,.085),.8,.24)
black=material('Unlit threat carapace',(.0005,.001,.0015),0,.85)
black.node_tree.nodes.get('Principled BSDF').inputs['Specular IOR Level'].default_value=.04
trim=material('Deck hardware',(.07,.12,.15),.8,.3)
cyan=material('Cold practical',(.3,.65,.82),.2,.3,1.2 if ROUND>=7 else 5)
violet=material('Breach violet',(.12,.02,.2),.1,.4,0 if ROUND>=7 else 2)
eyes=material('Threat pin lights',(.62,.82,.37),0,.3,4)

def box(name,position,size,mat=steel,plate='background',bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1,location=position);obj=bpy.context.object;obj.name=name;obj.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);obj.data.materials.append(mat)
    if bevel:
        mod=obj.modifiers.new('Machined edge','BEVEL');mod.width=bevel;mod.segments=3
        obj.modifiers.new('Weighted arris','WEIGHTED_NORMAL')
    plates[plate].append(obj);return obj

def curve(name,points,radius=.035,mat=black,plate='background'):
    data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.bevel_depth=radius;data.bevel_resolution=3
    spline=data.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
    for index,(knot,point) in enumerate(zip(spline.bezier_points,points)):
        knot.co=point
        if ROUND>=8 and 'Near claw' in name:knot.radius=[1.3,1.0,.5,.015][min(index,3)] if len(points)==4 else [1,.55,.015][index]
        knot.handle_left_type='VECTOR' if ROUND>=7 and ('silhouette' in name or 'foreclaw' in name) else 'AUTO';knot.handle_right_type=knot.handle_left_type
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);obj.data.materials.append(mat);plates[plate].append(obj);return obj

def sphere(name,position,size,mat=black,plate='background'):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=24,radius=1,location=position)
    obj=bpy.context.object;obj.name=name;obj.scale=size;obj.data.materials.append(mat)
    for face in obj.data.polygons:face.use_smooth=True
    plates[plate].append(obj);return obj

objects,meshes,armature=import_marine('breacher',True)
finish_for_render(objects,meshes,'breacher');plates['hero'].extend(objects)
hidden_hero={o for o in objects if o.hide_render}
# Complete character and weapon remain in the native grip, with an authored forward brace.
transform=Matrix.Rotation(math.radians(23 if ROUND>=7 else -6),4,'Z')
for obj in [o for o in objects if o.parent not in objects]:obj.matrix_world=transform @ obj.matrix_world
bpy.context.view_layer.update()

# Read-only E9 library, instanced into an interrupted pressure passage.
library={}
for path in ['structure/structure.glb','clinical/clinical.glb','industrial/kit.glb']:
    before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/assets/e9-ship-kit'/path))
    imported=[o for o in bpy.data.objects if o not in before]
    for obj in imported:
        if obj.parent not in imported and obj.type=='EMPTY':library[obj.name.split('.')[0]]=obj
        obj.hide_render=True

def kit(name,position,scale=(1,1,1),angle=0,plate='background'):
    source=library[name]
    def clone(obj,parent=None):
        copy=obj.copy();bpy.context.collection.objects.link(copy);copy.hide_render=False;copy.parent=parent
        copy.matrix_parent_inverse=Matrix.Identity(4);copy.matrix_basis=obj.matrix_local.copy();plates[plate].append(copy)
        for child in obj.children:clone(child,copy)
        return copy
    obj=clone(source);obj.matrix_world=Matrix.Translation(position) @ Matrix.Rotation(math.radians(angle),4,'Z') @ Matrix.Diagonal((*scale,1)) @ source.matrix_world

floor=box('Wet pressure deck',(0,-2,-.16),(14,16,.3),steel)
# Broad wet reflections, restrained micro roughness rather than a noisy floor pattern.
shader=steel.node_tree.nodes.get('Principled BSDF');shader.inputs['Roughness'].default_value=.15
for y in [-2,-5,-8]:
    kit('wall-bulkhead',(3.6,y,0),scale=(1,1,2.7),angle=90)
    kit('wall-bulkhead',(-3.6,y,0),scale=(1,1,2.7),angle=90)
    box('Overhead pressure rib',(0,y,3.5),(7.6,.25,.3),trim)
    box('Ceiling practical',(0,y+.1,3.32),(2.5,.07,.045),cyan)
kit('comms-rack-tall',(3,-3.4,0),angle=15)
kit('pipe-manifold',(-2.8,-3.4,0),angle=90)
kit('cryo-service-console',(-2.6,-1.6,0),angle=-45,plate='midground')
kit('floor-glass-channel',(1.6,-3,.002),angle=90)
# A torn throat in a dark pressure bulkhead. The upper-left is a quiet unlit steel field.
box('Left sealed bulkhead',(3.1,-5,1.9),(3.0,.4,4),black)
box('Right torn bulkhead',(-2.9,-5,1.9),(2.0,.4,4),black)
box('Breach lintel',(.2,-5,3.8),(5.0,.6,.6),trim)
for side in [-1,1]:
    for index in range(5):
        obj=box('Torn pressure tooth',(side*(1.8+index*.035),-4.75,.35+index*.59),(.2,.28,.66),trim)
        obj.rotation_euler.y=math.radians(side*(18+index*3))
box('Violet rear pressure wall',(0,-7.6,1.7),(4.2,.16,3.6),violet)
area_light('Breach backlight',(0,-7.0,2.3),500,2.7,(.35,.12,1),target=(0,-3,1.5))
area_light('Breach sickly side spill',(1.7,-6.3,1.4),120,1,(.35,.54,.3),target=(0,-3.5,1.3))

# Several original shapes at different depths, outlined against the breach, never front-lit.
def creature(x,y,z,scale=1,turn=0):
    def p(a,b,c):return (x+a*scale,y+b*scale,z+c*scale)
    sphere('Silhouette thorax',p(0,0,.8),((.29 if ROUND>=7 else .22)*scale,.24*scale,.38*scale))
    if ROUND>=9:
        # A flattened armored mask and overlapping back plates break the two-oval read.
        coords=[(-.15,-.06,1.24),(.15,-.06,1.24),(.2,.18,1.17),(.12,.43,1.11),(0,.5,1.23),(-.12,.43,1.11),(-.2,.18,1.17),(0,.12,1.37)]
        mesh=bpy.data.meshes.new('Threat blade mask');mesh.from_pydata([p(*v) for v in coords],[],[(0,1,7),(1,2,7),(2,3,4,7),(4,5,6,7),(6,0,7),(0,6,5,4,3,2,1)])
        obj=bpy.data.objects.new('Silhouette blade mask',mesh);bpy.context.collection.objects.link(obj);mesh.materials.append(black);plates['background'].append(obj)
        for i in range(3):
            shell=sphere('Silhouette overlapping carapace',p(0,-.26+i*.17,.99+i*.055),(.34*scale,.21*scale,.23*scale))
            shell.rotation_euler.x=math.radians(-18)
        for side in [-1,1]:
            curve('silhouette dorsal hook',[p(side*.22,-.27,1.12),p(side*.39,-.4,1.35),p(side*.32,-.24,1.3)],.028*scale)
    else:
        sphere('Silhouette blade head',p(0,.22,1.17),(.11*scale,.24*scale,.19*scale))
    for side in [-1,1]:
        for i in range(3):
            curve('Articulated silhouette limb',[p(side*.12,-.16+i*.16,.85),p(side*(.5+i*.08),.06+i*.12,.75+i*.03),p(side*(.65+i*.1),.26+i*.14,.06)],.026*scale)
        curve('Raised foreclaw',[p(side*.12,.2,1.0),p(side*(.57 if ROUND>=9 else .46),.35,1.1 if ROUND>=9 else 1.35),p(side*(.72 if ROUND>=9 else .32),.58,.92 if ROUND>=9 else 1.18)],.034*scale)
        if ROUND>=9:
            curve('silhouette pincer',[p(side*.72,.58,.92),p(side*.68,.72,1.1),p(side*.59,.73,1.02)],.02*scale)
        sphere('Eye glint',p(side*.062,.414,1.21),(.018*scale,.018*scale,.012*scale),eyes)
creature(-.5 if ROUND>=9 else .2,-5.4,.35 if ROUND>=8 else 0,1.65 if ROUND>=8 else 1.2)
creature(-1.1,-6.4,.05,.8)
creature(1.15,-6.9,.2,.65)
if ROUND>=7:
    for obj in plates['background']:
        if any(token in obj.name for token in ['bulkhead','Breach','Torn pressure','Silhouette','silhouette','foreclaw','Eye glint']):obj.location.x-=.9
    for obj in bpy.data.objects:
        if obj.type=='LIGHT' and 'Breach' in obj.name:obj.location.x-=.9
# Large soft foreground claw/cables enter at the extreme edge, leaving the lock-up untouched.
curve('Near claw',[(-1.3,1.5,.3),(-1.0,1.1,1.15),(-.7,.65,1.8),(-.45,.3,1.6)],.095,black,'foreground')
curve('Near claw inner talon',[(-1.0,1.1,1.1),(-.5,.7,1.5),(-.25,.4,1.3)],.055,black,'foreground')
curve('Suspended loose cable',[(2.6,1.0,3.8),(2.4,.7,2.8),(2.8,.3,2.1)],.033,black,'foreground')

if ROUND>=8:
    for obj in plates['foreground']:
        if 'Near claw' in obj.name:obj.location+=Vector((1.05,.8,.05) if ROUND>=10 else (1.3,.7,0))
# Clear focal hierarchy: visor, amber key, cold white shoulder/helmet edge, violet breach.
area_light('Cold white crown rim',(-1.6,-1.3,3.0),(650 if ROUND>=7 else 1150),.7,(.64,.87,1),target=(0,0,1.65))
area_light('Amber emergency key',(2.5,1.2,2.6),(240 if ROUND>=7 else 360),1.2,(1,.6,.27),target=(0,0,1.6))
area_light('Quiet face support',(3.0,3.3,2.0),25,2.2,(.38,.66,.8),target=(0,0,1.6))
# Physical spot cones through low-density volume, with sources above the nave.
for x,y in [(-1.8,-1.5),(1.6,-3.0)]:
    bpy.ops.object.light_add(type='SPOT',location=(x,y,3.3));lamp=bpy.context.object;lamp.name='Cold condensation cone'
    lamp.data.energy=90 if ROUND>=7 else 260;lamp.data.color=(.45,.72,.9);lamp.data.spot_size=.7;lamp.data.spot_blend=.4
    lamp.rotation_euler=(Vector((x+.7,y+1.0,0))-lamp.location).to_track_quat('-Z','Y').to_euler()
volume=bpy.data.materials.new('Condensation volume');volume.use_nodes=True;nodes=volume.node_tree.nodes;nodes.clear()
out=nodes.new('ShaderNodeOutputMaterial');fog=nodes.new('ShaderNodeVolumePrincipled');fog.inputs['Density'].default_value=.012 if ROUND>=7 else .035;fog.inputs['Color'].default_value=(.3,.45,.58,1);fog.inputs['Anisotropy'].default_value=.25
volume.node_tree.links.new(fog.outputs['Volume'],out.inputs['Volume']);box('Layered pressure haze',(0,-2,1.9),(10,13,3.8),volume,'fog',0)

bpy.ops.object.camera_add(location=(2.7,3.1,1.05) if ROUND>=7 else (3.7,4.2,1.05));camera=bpy.context.object;scene.camera=camera
camera.rotation_euler=(Vector((0,0,1.25))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=44
# Place the visor on the right third without using a high camera or stretching the image.
focus=Vector((.1,-.08,1.92))
bpy.context.view_layer.update()
def place_projection(axis,target):
    before=world_to_camera_view(scene,camera,focus)[axis]
    prop='shift_x' if axis==0 else 'shift_y';setattr(camera.data,prop,.01);bpy.context.view_layer.update()
    after=world_to_camera_view(scene,camera,focus)[axis];setattr(camera.data,prop,(target-before)*.01/(after-before));bpy.context.view_layer.update()
place_projection(0,.735);place_projection(1,.62 if ROUND>=7 else .71)
camera.data.dof.use_dof=True;camera.data.dof.focus_distance=(camera.location-focus).length;camera.data.dof.aperture_fstop=2.3
if ENDING:
    for obj in plates['hero']:obj.hide_render=True
    for obj in plates['background']:
        if any(token in obj.name.lower() for token in ['silhouette','eye glint','foreclaw']):obj.hide_render=True
    for obj in plates['foreground']:
        if 'Near claw' in obj.name:obj.hide_render=True
    camera.data.shift_x=0;camera.data.shift_y=0;camera.data.lens=48
    camera.location=(.9,3.4,1.2);camera.rotation_euler=(Vector((0,-5,1.5))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.dof.focus_distance=(camera.location-Vector((-.9,-5,1.9))).length
scene.render.film_transparent=False;scene.render.filepath=str(OUT/'composition.png');bpy.ops.render.render(write_still=True)
if LAYERS:
    for plate in plates:
        for name,items in plates.items():
            for obj in items:obj.hide_render=obj in hidden_hero;obj.visible_camera=name==plate
        scene.render.film_transparent=plate!='background';scene.render.filepath=str(OUT/(plate+'.png'));bpy.ops.render.render(write_still=True)
print('U10 CINEMATIC ROUND',ROUND,OUT,flush=True)
