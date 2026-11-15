"""Artist pose turntables of the shipping skin; no exported skeleton changes."""
import bpy,math,sys
from pathlib import Path
from mathutils import Vector,Quaternion
sys.path.insert(0,str(Path(__file__).resolve().parent))
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'artifacts/nextgen/k10-final/poses';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/assets/models/marine.glb'))
arm=next(o for o in bpy.data.objects if o.type=='ARMATURE');arm.animation_data_clear()
for b in arm.pose.bones:b.matrix_basis.identity()
meshes=[o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith('k10-')]
# Native source units, source facing -X. Camera looks down over the back.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24
from render_device import choose_render_device
choose_render_device(scene)
scene.render.resolution_x=640;scene.render.resolution_y=640;scene.render.resolution_percentage=100
scene.world.use_nodes=True;scene.world.node_tree.nodes.get('Background').inputs[0].default_value=(.13,.17,.20,1);scene.world.node_tree.nodes.get('Background').inputs[1].default_value=.65
for pos,power in [((-18,10,30),12000),((15,-15,25),10000)]:
 bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.data.energy=power;o.data.size=22;o.rotation_euler=(Vector((0,0,7))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(20,25,38));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=18;cam.rotation_euler=(Vector((0,0,7))-cam.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam
# Rotate around source-world axes expressed in each actual bone's local frame.
def turn(name,axis,deg):
 b=arm.pose.bones[name];world=arm.matrix_world@arm.data.bones[name].matrix_local;local=world.to_3x3().inverted()@Vector(axis);b.rotation_mode='QUATERNION';b.rotation_quaternion=Quaternion(local.normalized(),math.radians(deg))
for rig in ['breacher','cryo','pyro','arc']:
 for o in meshes:o.hide_render=o.name.startswith('k10-rig-') and o.name!='k10-rig-'+rig
 for pose in ['twist70','crouch']:
  for b in arm.pose.bones:b.matrix_basis.identity()
  if pose=='twist70':turn('ribs',(0,0,1),70)
  else:
   for side in ['R','L']:
    turn('thigh.'+side,(0,1,0),-50);turn('shin.'+side,(0,1,0),85)
   turn('spine',(0,1,0),25)
   bpy.context.view_layer.update()
   # The retained rig has root-owned ankle controls. Move them with the bent
   # shins for this artist pose, just as a clip supplies their independent tracks.
   for side in ['R','L']:
    shin=arm.pose.bones['shin.'+side]
    delta=arm.matrix_world@(shin.tail-arm.data.bones[shin.name].tail_local)
    ankle=arm.pose.bones['ankle.'+side]
    parent=arm.matrix_world@ankle.parent.matrix
    ankle.location+=parent.to_3x3().inverted()@delta
  scene.render.filepath=str(OUT/f'{rig}-{pose}.png');bpy.ops.render.render(write_still=True)
print('K10 artist pose previews rendered; production GLB unchanged')
