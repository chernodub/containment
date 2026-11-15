"""K10 curved anatomical suit, original MIT geometry and surface art.
blender -b -P tools/assets/k10-marine/marine.py -- --round=11 --helmet=3 --bake
"""
import bpy,sys,math,json
from pathlib import Path
from mathutils import Vector,Matrix
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
sys.path.insert(0,str(HERE))
from anatomy import Anatomy
from contract import export_marine
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
ROUND=int(next((x.split('=')[1] for x in args if x.startswith('--round=')),'11'))
BAKE='--bake' in args
OPTION=int(next((x.split('=')[1] for x in args if x.startswith('--helmet=')),'3'))
OUT=ROOT/('artifacts/nextgen/k10-final/turnarounds' if ROUND>=11 else f'artifacts/nextgen/k10-final/revision/round{ROUND}')
OUT.mkdir(parents=True,exist_ok=True)
BAKES=HERE/'bakes';BAKES.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(HERE/'marine-contract.glb'))
arm=next(o for o in bpy.data.objects if o.type=='ARMATURE');arm.animation_data_clear()
for bone in arm.pose.bones:bone.matrix_basis.identity()
S=6.8
D=Matrix(((0,-S,0,0),(S,0,0,0),(0,0,S,0),(0,0,0,1)))
Di=D.inverted()
joints={b.name:Di@(arm.matrix_world@b.head_local) for b in arm.data.bones}
tails={b.name:Di@(arm.matrix_world@b.tail_local) for b in arm.data.bones}
colours={
 'white':(.79,.76,.66,1),'steel':(.31,.39,.42,1),'metal':(.18,.24,.27,1),
 'silver':(.59,.66,.67,1),'fabric':(.025,.037,.046,1),'dark':(.012,.019,.025,1),
 'amber':(.96,.56,.055,1),'ice':(.15,.59,.91,1),'fire':(.91,.12,.035,1),
 'violet':(.40,.115,.75,1),'visor':(.012,.055,.07,1),
 'light':(.13,.83,1,1),'amber_glow':(1,.57,.045,1),'ice_glow':(.16,.75,1,1),
 'fire_glow':(1,.20,.035,1),'arc_glow':(.68,.51,1,1),
}
materials={}
for name,colour in colours.items():
 m=bpy.data.materials.new('k10-v2-'+name);m.diffuse_color=colour;m.use_nodes=True
 shader=m.node_tree.nodes.get('Principled BSDF');shader.inputs['Base Color'].default_value=colour
 shader.inputs['Roughness'].default_value=.83 if name in ['fabric','dark'] else .39 if name=='visor' else .53
 shader.inputs['Metallic'].default_value=.06 if name in ['fabric','white','ice'] else .45 if name in ['metal','silver','steel'] else .17
 if name=='light' or name.endswith('_glow'):
  shader.inputs['Emission Color'].default_value=colour;shader.inputs['Emission Strength'].default_value=3.2
 materials[name]=m


# Painted diagonal hazard bands follow the curved ram shoulder without geometry
# hovering above its shell. The procedural source is baked into the RGB atlas.
hazard=materials['amber'].copy();hazard.name='k10-v2-hazard';materials['hazard']=hazard
nodes=hazard.node_tree.nodes;links=hazard.node_tree.links
position=nodes.new('ShaderNodeNewGeometry');dot=nodes.new('ShaderNodeVectorMath');dot.operation='DOT_PRODUCT';dot.inputs[1].default_value=(1,0,.72)
links.new(position.outputs['Position'],dot.inputs[0])
frequency=nodes.new('ShaderNodeMath');frequency.operation='MULTIPLY';frequency.inputs[1].default_value=17
links.new(dot.outputs['Value'],frequency.inputs[0]);fract=nodes.new('ShaderNodeMath');fract.operation='FRACT';links.new(frequency.outputs[0],fract.inputs[0])
threshold=nodes.new('ShaderNodeMath');threshold.operation='LESS_THAN';threshold.inputs[1].default_value=.37;links.new(fract.outputs[0],threshold.inputs[0])
paint=nodes.new('ShaderNodeMixRGB');paint.inputs[1].default_value=colours['amber'];paint.inputs[2].default_value=colours['dark'];links.new(threshold.outputs[0],paint.inputs[0]);links.new(paint.outputs[0],nodes.get('Principled BSDF').inputs['Base Color'])

def build(high=False):
 body=Anatomy(joints,tails,materials,high,ROUND)
 body.build_body()
 from helmets import create_helmet
 create_helmet(OPTION,materials,body.attach,high=high)
 for rig in ['breacher','cryo','pyro','arc']:body.build_rig(rig)
 return body.join()
low=build(False)
high=build(True) if BAKE else []
for obj in high:obj.hide_render=True
arm.hide_render=True;arm.hide_viewport=True
# Per-face semantic colour survives the preview export without a photo remap.
for obj in low+high:
 for slot in obj.material_slots:
  if slot.material is None:slot.material=materials['dark']
for obj in low:
 color=obj.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
 for face in obj.data.polygons:
  material=obj.data.materials[face.material_index]
  for i in face.loop_indices:color.data[i].color=material.diffuse_color
 obj.data.color_attributes.active_color=color

scene=bpy.context.scene;scene.render.engine='CYCLES'
from render_device import choose_render_device
choose_render_device(scene)
# Export an unbaked preview with original flat vertex zones and a real emissive mask.
# The final --bake path replaces it with actual high-to-low maps.
if BAKE:
 from baking import bake_character
 for obj in low+high:obj.hide_render=False
 paths=bake_character(low,high,BAKES,size=2048,cage_extrusion=.035,samples=24)
 material={'name':'k10-curved-original-marine','extras':{'k10Original':True},'pbrMetallicRoughness':{'baseColorTexture':{'index':0},'metallicFactor':.18,'roughnessFactor':.58},'normalTexture':{'index':1,'scale':.55},'occlusionTexture':{'index':2,'strength':.55},'emissiveTexture':{'index':3},'emissiveFactor':[1,1,1], 'extensions':{'KHR_materials_emissive_strength':{'emissiveStrength':paths['emissive_strength']}}}
 images=[paths[x] for x in ['basecolor','normal','ao','emissive']]
 for obj in low:
  for c in obj.data.color_attributes.active_color.data:c.color=(1,1,1,1)
else:
 # Only emission needs an atlas in form-review builds. Original colour zones are
 # stored directly in the skin's vertex colours; final review uses baked albedo.
 bpy.ops.object.select_all(action='DESELECT')
 for obj in low:obj.hide_render=False;obj.select_set(True)
 bpy.context.view_layer.objects.active=low[0];bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.005);bpy.ops.object.mode_set(mode='OBJECT')
 image=bpy.data.images.new('preview emission',width=1024,height=1024,alpha=False)
 original=[]
 for m in set(m for obj in low for m in obj.data.materials if m):
  nodes=m.node_tree.nodes;links=m.node_tree.links;out=nodes.get('Material Output');original.append((out,[link.from_socket for link in out.inputs['Surface'].links]))
  p=nodes.get('Principled BSDF');e=nodes.new('ShaderNodeEmission');strength=p.inputs['Emission Strength'].default_value
  e.inputs['Color'].default_value=tuple(v*strength/3.2 if i<3 else 1 for i,v in enumerate(p.inputs['Emission Color'].default_value));links.new(e.outputs[0],out.inputs['Surface'])
  dest=nodes.new('ShaderNodeTexImage');dest.image=image;nodes.active=dest
 scene.cycles.samples=8;scene.render.bake.use_clear=False;scene.render.bake.margin=4
 bpy.ops.object.bake(type='EMIT');image.filepath_raw=str(BAKES/'preview-emissive.png');image.file_format='PNG';image.save()
 for output,sockets in original:
  for socket in sockets:output.id_data.links.new(socket,output.inputs['Surface'])
 material={'name':'k10-curved-original-preview','extras':{'k10Original':True},'pbrMetallicRoughness':{'metallicFactor':.16,'roughnessFactor':.62},'emissiveTexture':{'index':0},'emissiveFactor':[1,1,1], 'extensions':{'KHR_materials_emissive_strength':{'emissiveStrength':3.2}}}
 images=[BAKES/'preview-emissive.png']

if BAKE:
    stage=bpy.data.materials.new('k10 baked game surface');stage.use_nodes=True
    nodes=stage.node_tree.nodes;links=stage.node_tree.links;p=nodes.get('Principled BSDF')
    p.inputs['Metallic'].default_value=.18;p.inputs['Roughness'].default_value=.58
    for key,socket in [('basecolor','Base Color'),('emissive','Emission Color')]:
        texture=nodes.new('ShaderNodeTexImage');texture.image=bpy.data.images.load(str(paths[key]),check_existing=True)
        texture.image.colorspace_settings.name='sRGB';links.new(texture.outputs['Color'],p.inputs[socket])
    p.inputs['Emission Strength'].default_value=paths['emissive_strength']
    texture=nodes.new('ShaderNodeTexImage');texture.image=bpy.data.images.load(str(paths['normal']),check_existing=True);texture.image.colorspace_settings.name='Non-Color'
    normal=nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.55;links.new(texture.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs['Normal'],p.inputs['Normal'])
    for obj in low:
        obj.data.materials.clear();obj.data.materials.append(stage)
        for face in obj.data.polygons:face.material_index=0
    for obj in high:obj.hide_render=True

scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48
scene.render.resolution_x=1000;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=-.3;scene.render.film_transparent=False
scene.world.use_nodes=True;scene.world.node_tree.nodes.get('Background').inputs[0].default_value=(.035,.05,.065,1);scene.world.node_tree.nodes.get('Background').inputs[1].default_value=.45
for point,power,size,colour in [((3,4,5),600,4,(1,.86,.70)),((-4,1,3),400,3,(.65,.82,1)),((1,-4,4),850,3,(.70,.87,1))]:
 bpy.ops.object.light_add(type='AREA',location=point);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.data.color=colour;o.rotation_euler=(Vector((0,0,1.05))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();camera=bpy.context.object;scene.camera=camera;camera.data.type='ORTHO';camera.data.ortho_scale=2.4
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.008));floor=bpy.context.object
floor.name='review ground only';ground=bpy.data.materials.new('review charcoal');ground.diffuse_color=(.025,.035,.045,1);ground.use_nodes=True;ground.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=ground.diffuse_color;ground.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.9;floor.data.materials.append(ground)
views={'beauty':(3,4,2.6),'gameplay':(3,-4,7)}
if ROUND>=10:views.update({'front':(0,5,1.4),'side':(5,0,1.4),'back':(0,-5,1.4),'top':(0,.01,8)})
for rig in ['breacher','cryo','pyro','arc']:
 for obj in low:obj.hide_render=obj.name.startswith('k10-rig-') and obj.name!='k10-rig-'+rig
 for view,point in views.items():
  floor.hide_render=view=='gameplay';scene.render.film_transparent=view=='gameplay'
  camera.location=Vector(point)+Vector((0,0,.95));camera.rotation_euler=(Vector((0,0,1.04))-camera.location).to_track_quat('-Z','Y').to_euler()
  scene.render.filepath=str(OUT/f'{rig}-{view}.png');bpy.ops.render.render(write_still=True)

bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'authoring.blend'))
stats={}
for obj in low:
 stats[obj.name]=sum(len(p.vertices)-2 for p in obj.data.polygons)
 obj.data.transform(D);obj.data.update()
export_marine(low,ROOT/'public/assets/models/marine.glb',material=material,images=images)
(OUT/'stats.json').write_text(json.dumps(stats,indent=2));(BAKES/'stats.json').write_text(json.dumps(stats,indent=2));print('CURVED MARINE',stats)
