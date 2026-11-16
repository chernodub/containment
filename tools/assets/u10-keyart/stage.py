"""Original U10 'Last operator' key art, using read-only K10 / E9 exports.

blender -b -P tools/assets/u10-keyart/stage.py -- --round=1
Add --layers on the approved round to export aligned transparent plates.
The source helper module is read for functions only; no K10 generator is run.
"""
import ast
import math
from pathlib import Path
import sys
import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[3]
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ROUND = int(next((a.split('=')[1] for a in args if a.startswith('--round=')), '1'))
ONLY = next((a.split('=')[1] for a in args if a.startswith('--plate=')), None)
LAYERS = '--layers' in args or ONLY is not None
ENDING = '--ending' in args
OUT = ROOT / 'artifacts/nextgen/u10-rounds' / ('ending' if ENDING else str(ROUND))
OUT.mkdir(parents=True, exist_ok=True)
# Retain the K10 author's exact skeleton / weapon correction functions.
helper = ROOT / 'tools/assets/k10-marine/portraits.py'
sys.path.insert(0, str(helper.parent))
namespace = {'__file__': str(helper), 'ROOT': ROOT}
module = ast.parse(helper.read_text())
# Import definitions without executing the portrait generator or creating its output dirs.
definition_nodes = [node for node in module.body if isinstance(node, (ast.Import, ast.ImportFrom, ast.FunctionDef)) or (isinstance(node, ast.Assign) and any(isinstance(target, ast.Name) and target.id in ['WEAPONS', 'ACCENTS'] for target in node.targets))]
exec(compile(ast.Module(body=definition_nodes, type_ignores=[]), str(helper), 'exec'), namespace)
for name in ['read_glb', 'pose_matrices', 'apply_pose', 'deformed_points', 'attach_weapon', 'area_light']:
    globals()[name] = namespace[name]

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
sys.path.insert(0, str(helper.parent))
from render_device import choose_render_device
choose_render_device(scene)
scene.cycles.samples = 24 if ROUND < 4 else 48
scene.cycles.use_denoising = True
scene.render.resolution_x, scene.render.resolution_y = 2560, 1440
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = -1.6 if ROUND >= 2 else -1.0
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.07, .12, .17, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .055 if ROUND >= 2 else .2
plates = {name: [] for name in ['background','midground','hero','foreground','fog']}

def remember(name, before):
    objects = [o for o in bpy.data.objects if o not in before]
    plates[name].extend(objects)
    return objects

def mat(name, color, metallic=0, rough=.5, emission=0):
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*color, 1)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Emission Color'].default_value = (*color, 1)
    bsdf.inputs['Emission Strength'].default_value = emission
    return material

steel = mat('u10 worn navy steel', (.045,.075,.085), .7, .32)
dark = mat('u10 shadow rubber', (.009,.016,.02), .1, .65)
cyan = mat('u10 emergency strip', (.26,.65,.8), .1, .3, 4)
amber = mat('u10 red service lamps', (1,.21,.055), .1, .3, 5)

def box(name, location, scale, material=steel, plate='background', bevel=.04):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    if bevel:
        mod = obj.modifiers.new('Machined arris','BEVEL'); mod.width=bevel; mod.segments=3
        obj.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    plates[plate].append(obj)
    return obj

# Original K10 body and its native held shotgun pose.
source = ROOT / 'public/assets/models/marine.glb'
document, binary = read_glb(source)
before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(source))
character = remember('hero', before)
armature = next(o for o in character if o.type == 'ARMATURE')
meshes = [o for o in character if o.type == 'MESH']
for obj in meshes:
    obj.hide_render = obj.name.startswith('k10-rig-') and obj.name != 'k10-rig-breacher'
rest = pose_matrices(document,binary)
posed = pose_matrices(document,binary,'shotgun_delta')
apply_pose(armature,rest,posed)
points=deformed_points(meshes)
low=min(p.z for p in points); factor=2.1/(max(p.z for p in points)-low)
center = ((min(p.x for p in points)+max(p.x for p in points))/2, (min(p.y for p in points)+max(p.y for p in points))/2)
print('MARINE SOURCE CENTRE',center,'scale',factor,flush=True)
normalization=Matrix.Translation((-center[0]*factor,-center[1]*factor,-low*factor)) @ Matrix.Scale(factor,4)
for obj in [o for o in character if o.parent not in character]:
    obj.matrix_world=normalization @ obj.matrix_world
bpy.context.view_layer.update()
weapons=attach_weapon('breacher',posed['tag_weapon'],normalization)
plates['hero'].extend(weapons)
hero_position = ((-.85,-.4,.025) if ROUND >= 4 else (-1.6,.2,.025)) if ROUND >= 3 else (1.45,-1.1,.025)
hero_transform=Matrix.Translation(hero_position) @ Matrix.Rotation(math.radians(55 if ROUND >= 5 else 16 if ROUND >= 3 else -8),4,'Z')
for obj in [o for o in character+weapons if o.parent not in character+weapons]:
    obj.matrix_world=hero_transform @ obj.matrix_world
hidden_hero = {o for o in plates['hero'] if o.hide_render}

# Load E9 kits once, then instance only the named kit groups. Authored GLBs untouched.
library={}
for pack,path in [('structure','structure/structure.glb'),('clinical','clinical/clinical.glb'),('industrial','industrial/kit.glb')]:
    before=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/assets/e9-ship-kit'/path))
    imported=[o for o in bpy.data.objects if o not in before]
    roots=[o for o in imported if o.parent not in imported]
    for root in roots:
        # glTF groups are named by the exported kit asset.
        if root.type=='EMPTY' and root.name not in ['Scene']:
            library[root.name.split('.')[0]]=root
    # All source library objects stay outside rendering.
    for o in imported:o.hide_render=True
    print('U10 kit',pack,[(o.name,o.type) for o in roots],flush=True)

def kit(name, location, scale=(1,1,1), angle=0, plate='background'):
    source=library.get(name)
    if not source:
        print('MISSING KIT',name,list(library),flush=True);return
    transform=Matrix.Translation(location) @ Matrix.Rotation(math.radians(angle),4,'Z') @ Matrix.Diagonal((*scale,1))
    def clone(obj, parent=None):
        copy=obj.copy();bpy.context.collection.objects.link(copy)
        copy.hide_render=False
        copy.parent=parent
        copy.matrix_parent_inverse=Matrix.Identity(4)
        copy.matrix_basis=obj.matrix_local.copy()
        plates[plate].append(copy)
        for child in obj.children:clone(child,copy)
        return copy
    copy=clone(source)
    copy.matrix_world=transform @ source.matrix_world
    if ROUND==2: print('KIT',name,'source matrix',list(source.location),list(source.rotation_euler),flush=True)

# Deep service nave. Lateral camera views the diagonal across an interrupted arch.
box('unbroken pressure deck',(0,-5,-.13),(14,23,.25),steel)
for y in [1,-3,-7,-11,-15]:
    for x in [-4.8,4.8]:
        kit('wall-bulkhead',(x,y,0),scale=(1,1,2.8),angle=90)
    box('overhead pressure rib',(0,y,3.8),(10,.3,.34),dark)
    box('motivated ceiling strip',(0,y+.14,3.61),(3.3,.065,.04),cyan)
    area_light('cold overhead',(0,y,3.5),100,3,(.28,.64,.8),target=(0,y,0))
for y in [-2,-6,-10]:
    kit('floor-glass-channel',(-1,y,.005),scale=(1,1,1))
    kit('comms-rack-tall',(-3.8,y,.05),angle=25)
    kit('cargo-restraintbank-tall',(4,y-2,0),angle=-90)
kit('clinical-scanner-arch',(0,-5.5,0),scale=(.8,1,1.25))
kit('pipe-manifold',(-3,-5,0),angle=90)
kit('airway-exchanger',(0,-10,1),scale=(1,1,1))
kit('cargo-hoist-header',(0,-7,1.8),angle=0)
kit('cryo-service-console',(-3.7,-2,0) if ROUND >= 3 else (3.7,-2,0),angle=-55,plate='midground')
kit('drainage-grating',(2,-1,.01),plate='midground')
kit('cabletray-open-cover',(1.9,.2,.02) if ROUND >= 5 else (-2.8,1.3,.02),angle=70,plate='foreground')
if ROUND < 5:
    kit('pump-skid',(4,2.4,-.2),angle=-25,plate='foreground')
# Thin access rails lead the eye toward the threat, never across title text.
for x in [-1.5,2.5]:
    box('deck guide',(x,-5,.012),(.025,17,.008),steel)
for y in [-4,-10]:
    box('warning fixture',(3.7,y,2.9),(.08,.65,.12),amber)
    area_light('amber failure spill',(3.4,y,2.9),110,1,(1,.18,.04),target=(0,y,1))
# An original barely resolved segmented organism, half occluded in the rear bay.
for i,(x,z,r) in enumerate([(0,1.05,.36),(.06,1.5,.3),(.15,1.85,.22)]):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=r,location=(x,-7,z))
    obj=bpy.context.object;obj.name='threat carapace';obj.scale=(.75,.8,1.3);obj.data.materials.append(dark);plates['background'].append(obj)
for side in [-1,1]:
    for i in range(3):
        a=Vector((side*.2,-6.9,1.6-i*.27));b=Vector((side*(.7+i*.14),-6.7,1.5-i*.45));c=Vector((side*(1.1+i*.1),-6.5,.15))
        for start,end in [(a,b),(b,c)]:
            delta=end-start
            bpy.ops.mesh.primitive_cone_add(vertices=12,radius1=.065,radius2=.025,depth=delta.length,location=(start+end)/2)
            obj=bpy.context.object;obj.rotation_euler=delta.to_track_quat('Z','Y').to_euler();obj.data.materials.append(dark);plates['background'].append(obj)
if ROUND >= 4:
    for obj in plates['background']:
        if obj.name.startswith('threat carapace') or (obj.type=='MESH' and obj.name.startswith('Cone')):
            obj.location.x=obj.location.x*.65-.4
            obj.location.y=-8+(obj.location.y+7)*.65
            obj.location.z*=.65
            obj.scale*=.65
area_light('threat sliver',(-1.4,-8.2,2.2),100,1,(.37,.56,.44),target=(0,-7,1.5))
# Portrait lighting is motivated by the service bay, but gives the crown a clear edge.
area_light('operator soft key',(-.3,3.3,4.3) if ROUND >= 3 else (4.2,2.8,4.7),400,3,(.63,.83,1),target=(-1.6,.2,1.3) if ROUND >= 3 else (1.15,-.85,1.3))
area_light('operator amber rim',(-3,-2,3.1) if ROUND >= 3 else (-.7,-3.6,3.1),650,2,(1,.36,.12),target=(-1.6,.2,1.4) if ROUND >= 3 else (1.15,-.85,1.4))
area_light('operator face fill',(1,4,2.6),85,2,(.43,.7,.9),target=(-1.6,.2,1.6) if ROUND >= 3 else (1,-.8,1.6))
# A real volume produces the aligned light/fog plate; density changes in critique rounds.
volume=bpy.data.materials.new('low pressure condensation');volume.use_nodes=True
nodes=volume.node_tree.nodes;nodes.clear();out=nodes.new('ShaderNodeOutputMaterial');v=nodes.new('ShaderNodeVolumePrincipled')
v.inputs['Density'].default_value=.018
v.inputs['Color'].default_value=(.35,.5,.57,1)
v.inputs['Anisotropy'].default_value=.3
volume.node_tree.links.new(v.outputs['Volume'],out.inputs['Volume'])
box('condensation volume',(0,-6,1.8),(11,20,3.6),volume,'fog',0)
bpy.ops.object.camera_add(location=(1.6,6.5,2.25) if ROUND >= 3 else (4.8,5.8,2.7))
camera=bpy.context.object;scene.camera=camera
camera.rotation_euler=(Vector((0,-2.5,1.0 if ROUND >= 4 else 1.4) if ROUND >= 3 else (0,-.7,1.25))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.lens=46 if ROUND >= 3 else 50
camera.data.dof.use_dof=True
camera.data.dof.focus_distance=(camera.location-Vector((-.85,-.4,1.25) if ROUND >= 4 else (-1.6,.2,1.25) if ROUND >= 3 else (1.15,-.85,1.25))).length
camera.data.dof.aperture_fstop=5.6
scene.render.film_transparent=False
print('MARINE WORLD BOUNDS',[(min(p[i] for p in deformed_points(meshes)),max(p[i] for p in deformed_points(meshes))) for i in range(3)],flush=True)
if ENDING:
    for obj in plates['hero']: obj.hide_render=True
    for obj in bpy.data.objects:
        if obj.type=='LIGHT':
            obj.data.color=(1,.24,.09) if 'overhead' in obj.name else (.24,.65,.85)
    scene.view_settings.exposure=-1.3
    camera.location=(-.8,4.8,2.0)
    camera.rotation_euler=(Vector((0,-4.5,1.7))-camera.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(OUT/'composition.png')
if not ONLY:
    bpy.ops.render.render(write_still=True)
if LAYERS:
    for plate in ([ONLY] if ONLY else plates):
        for name,objects in plates.items():
            for obj in objects:
                obj.hide_render=obj in hidden_hero
                obj.visible_camera=name==plate
        scene.render.film_transparent=plate!='background'
        scene.render.filepath=str(OUT/(plate+'.png'))
        bpy.ops.render.render(write_still=True)
print('U10 round rendered',ROUND,OUT,flush=True)
