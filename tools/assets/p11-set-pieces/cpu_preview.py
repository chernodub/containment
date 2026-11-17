"""Four-thread CPU-only preview stage, avoiding shared Metal device startup."""
import bpy
from mathutils import Vector

def stage():
 scene=bpy.context.scene
 scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=16
 scene.cycles.use_denoising=False
 scene.render.threads_mode='FIXED';scene.render.threads=4
 scene.view_settings.view_transform='AgX'
 scene.world.color=(.018,.022,.026)
 scene.world.use_nodes=True
 bg=scene.world.node_tree.nodes.get('Background');bg.inputs['Color'].default_value=(.018,.022,.026,1);bg.inputs['Strength'].default_value=.6
 if 'PREVIEW floor' not in bpy.data.objects:
  bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.005))
  bpy.context.object.name='PREVIEW floor'
  m=bpy.data.materials.new('PREVIEW charcoal');m.diffuse_color=(.055,.065,.075,1);m.use_nodes=True
  bsdf=m.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=(.055,.065,.075,1);bsdf.inputs['Roughness'].default_value=.8
  bpy.context.object.data.materials.append(m)
  for name,loc,power,size in [('key',(-4,-6,8),1800,5),('fill',(5,-2,6),900,5),('rim',(0,5,7),1400,4)]:
   d=bpy.data.lights.new('PREVIEW '+name,'AREA');d.energy=power;d.shape='DISK';d.size=size
   o=bpy.data.objects.new(d.name,d);bpy.context.collection.objects.link(o);o.location=loc
   o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
 return scene
