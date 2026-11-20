"""HERO19 diagnostic: the shipped marine GLB's baked albedo (emission only, no lighting) on the posed game mesh.

  blender -b -P tools/assets/k12-hero/atlas_view.py -- out.png [rig] [clip] [frame]

Renders four game-camera yaws (52° down) of the given rig with the given clip, so atlas values can be told
apart from runtime shading. Works on the unpacked (PNG) GLB; KTX2-packed files need the plain/ copy.
"""
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector as V

a = sys.argv[sys.argv.index('--') + 1:]
out = a[0]; rig = a[1] if len(a) > 1 else 'breacher'; clip = a[2] if len(a) > 2 else ''; frame = int(a[3]) if len(a) > 3 else 10
ROOT = Path(__file__).resolve().parents[3]
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete()
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'public/assets/models/marine.glb'))
for o in list(bpy.data.objects):
    if o.type == 'MESH' and (o.name.endswith('__lod_low') or (o.name.startswith('k10-rig-') and o.name != 'k10-rig-' + rig) or not o.name.startswith('k10-')):
        o.hide_render = True
for m in bpy.data.materials:
    if not m.use_nodes:
        continue
    nt = m.node_tree
    img = next((n for n in nt.nodes if n.type == 'TEX_IMAGE' and any(l.to_socket.name == 'Base Color' for l in n.outputs[0].links)), None)
    if img is None:
        continue
    em = nt.nodes.new('ShaderNodeEmission'); nt.links.new(img.outputs[0], em.inputs[0])
    outn = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'); nt.links.new(em.outputs[0], outn.inputs[0])
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
acts = [x.name for x in bpy.data.actions]
print('ACTIONS', acts)
if clip:
    act = next((x for x in bpy.data.actions if clip in x.name), None)
    if act:
        arm.animation_data_create(); arm.animation_data.action = act
        if hasattr(arm.animation_data, 'action_slot') and act.slots:
            arm.animation_data.action_slot = act.slots[0]
bpy.context.scene.frame_set(frame)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE_NEXT'
scene.view_settings.view_transform = 'Standard'
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = 420
bpy.ops.object.camera_add(); cam = bpy.context.object; scene.camera = cam; cam.data.lens = 50
meshes = [o for o in bpy.data.objects if o.type == 'MESH' and not o.hide_render]
dg = bpy.context.evaluated_depsgraph_get()
pts = []
for o in meshes:
    ev = o.evaluated_get(dg); me = ev.to_mesh(); pts += [ev.matrix_world @ v.co for v in list(me.vertices)[::7]]; ev.to_mesh_clear()
lo = V((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))); hi = V((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
tgt = (lo + hi) / 2; size = (hi - lo).length
print('BOUNDS', lo, hi)
files = []
for k, yaw in enumerate((0, 90, 180, 270)):
    t = math.radians(yaw + 90)
    d = V((-math.sin(t) * .62, -math.cos(t) * .62, .8)).normalized()
    cam.location = tgt + d * size * 1.05
    cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    p = str(Path(out).with_name(Path(out).stem + f'-{yaw}.png')); scene.render.filepath = p
    bpy.ops.render.render(write_still=True); files.append(p)
print('ATLAS VIEW', files)
