"""KA12 cinematic staging. Blender5.3: -- --round=16 --layers; --ending for abandoned nave."""
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
OUT=ROOT/'artifacts/nextgen/u10-rounds'/(('ending-'+str(ROUND)) if ENDING else str(ROUND))
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='CYCLES';choose_render_device(scene)
scene.cycles.samples=32 if '--preview' in args else 128;scene.cycles.use_denoising=True
scene.cycles.volume_bounces=2
scene.render.resolution_x=2560;scene.render.resolution_y=1440;scene.render.resolution_percentage=75 if '--preview' in args else 100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=-1.6 if ROUND>=7 else -1.2
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.025,.055,.075,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.006 if ROUND>=7 else .025
plates={name:[] for name in ['background','midground','hero','foreground','fog']}
steel=material('Cyan steel',(.025,.07,.085),.8,.24)
black=material('Unlit threat carapace',(.0005,.001,.0015),0,.85)
black.node_tree.nodes.get('Principled BSDF').inputs['Specular IOR Level'].default_value=.04
trim=material('Deck hardware',(.07,.12,.15),.8,.3)
cyan=material('Cold practical',(.3,.65,.82),.2,.3,1.2 if ROUND>=7 else 5)
violet=material('Breach violet',(.12,.02,.2),.1,.4,.6 if ROUND>=7 else 2)
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

sys.path.insert(0,str(ROOT/'tools/assets/k12-hero'))
from hero import stage_hero
objects,meshes,armature=stage_hero('breacher',curl=65.0)
plates['hero'].extend(objects)
hidden_hero={o for o in objects if o.hide_render}
for mat in bpy.data.materials:
    if 'visor' in mat.name.lower() and mat.use_nodes:
        bs=mat.node_tree.nodes.get('Principled BSDF')
        if bs:bs.inputs['Emission Strength'].default_value=8.0

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
area_light('Breach backlight',(0,-7.0,2.3),850,2.7,(.35,.12,1),target=(0,-3,1.5))
area_light('Breach sickly side spill',(1.7,-6.3,1.4),120,1,(.35,.54,.3),target=(0,-3.5,1.3))

# Shipping Lantern Brood meshes are imported read-only, with their authored lantern atlas.
brood_objects=[]
for file, location, height in [('tyrant',(-1.5,-6.0,0),1.8),('dretch',(-2.2,-4.3,0),.9),('basilisk',(.4,-6.8,0),1.65),('marauder',(-.8,-7.3,.25),1.5)]:
    before=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/assets/models'/f'{file}.glb'))
    imported=[o for o in bpy.data.objects if o not in before]
    meshes=[o for o in imported if o.type=='MESH']
    for o in meshes:
        if 'elite' in o.name.lower() or 'boss' in o.name.lower():o.hide_render=True
    points=[o.matrix_world @ Vector(c) for o in meshes if not o.hide_render for c in o.bound_box]
    low=min(p.z for p in points);high=max(p.z for p in points)
    cx=(min(p.x for p in points)+max(p.x for p in points))/2
    cy=(min(p.y for p in points)+max(p.y for p in points))/2
    scale=height/(high-low)
    transform=Matrix.Translation(location) @ Matrix.Rotation(math.radians(155),4,'Z') @ Matrix.Scale(scale,4) @ Matrix.Translation((-cx,-cy,-low))
    for o in imported:
        if o.parent not in imported:o.matrix_world=transform @ o.matrix_world
    plates['midground'].extend(imported)
    brood_objects.extend(imported)
    hidden_hero.update(o for o in imported if o.hide_render)
for i in range(5):
    x=1+i*.35
    curve('Service conduit',[(x,-4.5,3.2),(x,-2,3.2),(x,0,3.0)],.025,trim)
for i in range(18):
    bar=box('Deck grating',(-1,-3+i*.12,.008),(3,.025,.018),trim,bevel=.004)
for i in range(9):
    shard=box('Torn debris',(-2+(i%3)*.6,-4+(i//3)*.4,.08),(.35,.23,.035),trim,'midground')
    shard.rotation_euler=(.1*i,.07*i,.6*i)
area_light('Lantern reveal',(-2,-2,2.6),140,3,(.65,.45,.35),target=(-1,-5,1.2))
if ROUND>=7:
    for obj in plates['background']:
        if any(token in obj.name for token in ['bulkhead','Breach','Torn pressure','Silhouette','silhouette','foreclaw','Eye glint']):obj.location.x-=.9
    for obj in bpy.data.objects:
        if obj.type=='LIGHT' and 'Breach' in obj.name:obj.location.x-=.9
# Torn sheets and a sparse fall of hot fragments catch the breach light.
for i in range(10):
    x=-2.7+(i%2)*3.0;z=.3+(i//2)*.6
    reach=.22+.16*math.sin(i*2.7);rise=.3+.16*math.cos(i*1.4)
    mesh=bpy.data.meshes.new('Ruptured sheet')
    mesh.from_pydata([(x,-4.6,z),(x+reach,-4.8,z+rise),(x+.12,-4.5,z+.17)],[],[(0,1,2)])
    ob=bpy.data.objects.new('Peeling breach sheet',mesh);bpy.context.collection.objects.link(ob);mesh.materials.append(trim);plates['midground'].append(ob)
spark=material('Hot falling fragments',(1,.22,.015),0,.3,8)
for i in range(13):
    x=-2.0+math.sin(i*2.3)*.5;z=.6+(i%7)*.3;y=-4.7+(i%3)*.12
    curve('Falling hot fragment',[(x,y,z),(x+.015,y,z-.035-(i%3)*.02)],.004,spark,'midground')
# Large soft foreground claw/cables enter at the extreme edge, leaving the lock-up untouched.
curve('Near claw',[(-1.3,1.5,.3),(-1.0,1.1,1.15),(-.7,.65,1.8),(-.45,.3,1.6)],.14,black,'foreground')
curve('Near claw inner talon',[(-1.0,1.1,1.1),(-.5,.7,1.5),(-.25,.4,1.3)],.055,black,'foreground')
curve('Suspended loose cable',[(2.6,1.0,3.8),(2.4,.7,2.8),(2.8,.3,2.1)],.033,black,'foreground')

if ROUND>=8:
    for obj in plates['foreground']:
        if 'Near claw' in obj.name:obj.location+=Vector((1.05,.8,.05) if ROUND>=10 else (1.3,.7,0))
# Clear focal hierarchy: visor, amber key, cold white shoulder/helmet edge, violet breach.
area_light('Cold white crown rim',(-1.6,-1.3,3.0),(650 if ROUND>=7 else 1150),.7,(.64,.87,1),target=(0,0,1.65))
area_light('Amber emergency key',(2.5,1.2,2.6),(240 if ROUND>=7 else 360),1.2,(1,.6,.27),target=(0,0,1.6))
area_light('Quiet face support',(3.0,3.3,2.0),25,2.2,(.38,.66,.8),target=(0,0,1.6))
# Motivated emergency fixture opposite the cool rim.
amber=material('Emergency amber lens',(1,.24,.025),.1,.25,5)
box('Emergency lamp housing',(-2.9,-2.5,2.85),(.32,.16,.2),trim,'background')
box('Emergency lamp lens',(-2.9,-2.4,2.85),(.24,.025,.10),amber,'background')
# Deck identity is physical type on the rear bulkhead.
bpy.ops.object.text_add(location=(-.8,-4.65,2.65),rotation=(math.pi/2,0,math.pi))
sign=bpy.context.object;sign.name='Deck 07 pressure warning';sign.data.body='DECK 07';sign.data.size=.13;sign.data.extrude=.001;sign.data.materials.append(cyan);plates['background'].append(sign)
# Physical spot cones through low-density volume, with sources above the nave.
for x,y in [(-1.8,-1.5),(1.6,-3.0)]:
    bpy.ops.object.light_add(type='SPOT',location=(x,y,3.3));lamp=bpy.context.object;lamp.name='Cold condensation cone'
    lamp.data.energy=9.6 if ROUND>=7 else 260;lamp.data.color=(.45,.72,.9);lamp.data.spot_size=.7;lamp.data.spot_blend=.4
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
camera.data.dof.use_dof=True;camera.data.dof.focus_distance=(camera.location-focus).length;camera.data.dof.aperture_fstop=3.5
if ENDING:
    # Keep the warning receipt over dark space, away from the pale console face.
    for obj in plates['midground']:
        if obj.name.startswith('cryo-service-console') and obj.parent is None:obj.location.x-=.65
    curve('Disconnected uplink cable',[(-3.2,-1.5,.55),(-2.5,-2,.08),(-1.8,-2.7,.04),(-2.2,-3.5,.04)],.028,black,'background')
    for obj in brood_objects:obj.hide_render=True
    for obj in plates['hero']:obj.hide_render=True
    for obj in plates['background']:
        if any(token in obj.name.lower() for token in ['silhouette','eye glint','foreclaw']):obj.hide_render=True
    for obj in plates['foreground']:
        if 'Near claw' in obj.name:obj.hide_render=True
    for obj in bpy.data.objects:
        if obj.name.startswith(('Falling hot fragment','Peeling breach sheet')):obj.hide_render=True
        if obj.name=='Violet rear pressure wall':obj.location.y-=5
        if obj.type=='LIGHT' and obj.name=='Breach backlight':obj.data.energy=160
    camera.data.shift_x=0;camera.data.shift_y=0;camera.data.lens=36
    camera.location=(.9,3.8,1.55);camera.rotation_euler=(Vector((0,-5,1.0))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.dof.focus_distance=(camera.location-Vector((-.9,-5,1.9))).length
for name,items in plates.items():
    for obj in items:obj['ka12Plate']=name
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'stage.blend'))
scene.render.film_transparent=False;scene.render.filepath=str(OUT/'composition.png')
if '--layers-only' not in args:bpy.ops.render.render(write_still=True)
if LAYERS:
    for plate in plates:
        selected=next((a.split('=',1)[1].split(',') for a in args if a.startswith('--plates=')),list(plates))
        if plate not in selected:continue
        for name,items in plates.items():
            for obj in items:
                obj.hide_render=obj in hidden_hero
                masked=plate not in ('background','fog')
                obj.visible_camera=(name!='fog') if masked else name==plate
                obj.is_holdout=masked and name not in (plate,'fog')
        scene.render.film_transparent=plate!='background';scene.render.filepath=str(OUT/(plate+'.png'));bpy.ops.render.render(write_still=True)
print('U10 CINEMATIC ROUND',ROUND,OUT,flush=True)
