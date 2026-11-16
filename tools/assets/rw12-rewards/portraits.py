"""RW12 rig gestures over the unchanged K12 hero. Original MIT scene authoring.

blender -b -t 4 -P tools/assets/rw12-rewards/portraits.py -- --preview --samples=32
Use --rig=breacher,cryo,pyro,arc to select; omit --preview for shipping PNG/WebP.
Only imported scene pose bones and scene effects change; no source asset is saved.
"""
import math
import sys
from pathlib import Path
import bpy
from mathutils import Matrix, Vector as V

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'tools/assets/k12-hero'))
sys.path.insert(0, str(ROOT / 'tools/assets/k10-marine'))
from hero import stage_hero, light_rig, deformed_points, _curl
from render_device import choose_render_device

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
PREVIEW = '--preview' in ARGS
RIGS = next((a.split('=')[1].split(',') for a in ARGS if a.startswith('--rig=')), ['breacher', 'cryo', 'pyro', 'arc'])
SAMPLES = int(next((a.split('=')[1] for a in ARGS if a.startswith('--samples=')), '32' if PREVIEW else '128'))
OUT = ROOT / ('artifacts/nextgen/rw12-work/portraits' if PREVIEW else 'public/assets/portraits/u10')


def turn(arm, name, degrees, axis):
    """Add a gesture in the current bone frame, preserving authored rest correction."""
    bone = arm.pose.bones.get(name)
    if bone is not None:
        bone.matrix = bone.matrix @ Matrix.Rotation(math.radians(degrees), 4, axis)
        bpy.context.view_layer.update()


def gesture(rig, objects, arm):
    # The weapon follows the tag after every pose edit, retaining its fitted grip.
    carrier = next(o for o in objects if o.type == 'EMPTY' and o.name.startswith('portrait held'))
    tag = arm.matrix_world @ arm.pose.bones['tag_weapon'].matrix
    held = carrier.matrix_world.copy()
    poses = {
        'breacher': [('ribs', -7, 'Y'), ('head', 9, 'Z')],
        'cryo': [('ribs', 8, 'Z'), ('head', -8, 'Y')],
        'pyro': [('ribs', -19, 'Z'), ('head', 17, 'Z')],
        'arc': [('ribs', 15, 'Z'), ('spine', -7, 'Y'), ('thigh.R', -22, 'Y'), ('shin.R', 25, 'Y'), ('thigh.L', 17, 'Y'), ('shin.L', 12, 'Y'), ('head', -12, 'Z')],
    }
    # Ankle controls are root-owned: carry them by each shin's displacement.
    shins = {s: arm.pose.bones['shin.' + s].tail.copy() for s in ('R', 'L')}
    for name, degrees, axis in poses[rig]:
        turn(arm, name, degrees, axis)
    def world_rotate(name, rotation):
        bone = arm.pose.bones[name]
        world = arm.matrix_world @ bone.matrix
        pivot = world.translation.copy()
        bone.matrix = arm.matrix_world.inverted() @ Matrix.Translation(pivot) @ rotation @ Matrix.Translation(-pivot) @ world
        bpy.context.view_layer.update()

    def aim(name, direction):
        bone = arm.pose.bones[name]
        current = arm.matrix_world.to_3x3() @ (bone.tail - bone.head)
        world_rotate(name, current.normalized().rotation_difference(V(direction).normalized()).to_matrix().to_4x4())

    if rig == 'breacher':
        # Expose the outside forearm armour as a raised brace, hand above the plate.
        aim('forearm.L', (.15, -.22, 1))
    elif rig == 'cryo':
        # Source weapon faces +X; positive world Y pitches it down, with the grip.
        world_rotate('upper_arm.R', Matrix.Rotation(math.radians(40), 4, 'Y'))
        aim('forearm.L', (.30, .75, -.30))
        _curl(arm, 'L', 65 * 1.4, 'Z')
    if rig == 'arc':
        for side in ('R', 'L'):
            ankle = arm.pose.bones.get('ankle.' + side)
            if ankle:
                delta = arm.pose.bones['shin.' + side].tail - shins[side]
                ankle.matrix = Matrix.Translation(delta) @ ankle.matrix
        bpy.context.view_layer.update()
    carrier.matrix_world = (arm.matrix_world @ arm.pose.bones['tag_weapon'].matrix) @ tag.inverted() @ held
    bpy.context.view_layer.update()


def strand(name, points, colour, radius=.004, strength=3):
    curve = bpy.data.curves.new(name, 'CURVE'); curve.dimensions = '3D'; curve.bevel_depth = radius; curve.bevel_resolution = 3
    spline = curve.splines.new('POLY'); spline.points.add(len(points) - 1)
    for p, co in zip(spline.points, points):
        p.co = (*co, 1)
    if name == 'RW12 pilot flame':
        for i, p in enumerate(spline.points): p.radius = [1.2, .7, .02][i]
    obj = bpy.data.objects.new(name, curve); bpy.context.scene.collection.objects.link(obj)
    mat = bpy.data.materials.new(name); mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*colour, 1)
    shader.inputs['Emission Color'].default_value = (*colour, 1); shader.inputs['Emission Strength'].default_value = strength
    curve.materials.append(mat)
    return obj


def material_tops(meshes, role, count=2):
    """Locate authored glow tips on the evaluated posed kit, without guessed offsets."""
    points = []
    graph = bpy.context.evaluated_depsgraph_get()
    for obj in meshes:
        if obj.hide_render or not obj.name.startswith('k10-rig-'):
            continue
        evaluated = obj.evaluated_get(graph); mesh = evaluated.to_mesh()
        slots = {i for i, mat in enumerate(mesh.materials) if mat and (mat.get('k12Role') == role or mat.name.startswith('k12-' + role))}
        ids = {i for poly in mesh.polygons if poly.material_index in slots for i in poly.vertices}
        points.extend(evaluated.matrix_world @ mesh.vertices[i].co for i in ids)
        evaluated.to_mesh_clear()
    tips = []
    while points and len(tips) < count:
        top = max(points, key=lambda p: p.z)
        near = [p for p in points if (p - top).length < .055]
        tips.append(sum(near, V()) / len(near))
        points = [p for p in points if (p - top).length > .13]
    return tips


def effects(rig, arm, meshes):
    def point(name, offset):
        return (arm.matrix_world @ arm.pose.bones[name].matrix) @ V(offset)
    if rig == 'cryo':
        a = point('forearm.L', (0, 0, 0)); b = point('ribs', (.10, .08, -.12))
        strand('RW12 coolant return line', [a, a.lerp(b, .25) + V((.06, .08, -.13)), a.lerp(b, .65) + V((.07, .08, -.13)), b], (.06, .65, .85), .009, .7)
        palm = point('hand.L', (0, 0, 0))
        for k in range(2):
            a = palm + V((.015 * k, .012 * k, .018))
            strand(f'RW12 coolant steam {k}', [a, a + V((.012, .008, .035)), a + V((-.012, .012, .065)), a + V((.008, .018, .095))], (.28, .65, .78), .0035, .35)
    elif rig == 'pyro':
        tips = material_tops(meshes, 'fire_glow')
        a = max(tips, key=lambda p: p.x + p.y) if tips else point('ribs', (.20, .12, .12))
        strand('RW12 pilot flame', [a, a + V((.012, .007, .055)), a + V((-.008, 0, .115))], (1, .22, .025), .008, 5)
    elif rig == 'arc':
        tips = material_tops(meshes, 'arc_glow')
        if len(tips) == 2:
            a, b = tips
            strand('RW12 coil discharge', [a, a.lerp(b, .25) + V((.012, .015, .045)), a.lerp(b, .45) + V((-.012, 0, .015)), a.lerp(b, .65) + V((.015, 0, .065)), b], (.28, .65, 1), .0035, 7)


def webp(path):
    image = bpy.data.images.load(str(path))
    scene = bpy.context.scene
    for size in (256, 640, 1024):
        copy = image.copy(); copy.scale(size, size)
        scene.render.image_settings.file_format = 'WEBP'; scene.render.image_settings.quality = 86
        copy.save_render(str(path.with_name(f'{path.stem}-{size}.webp')), scene=scene)
        bpy.data.images.remove(copy)
    bpy.data.images.remove(image)
    scene.render.image_settings.file_format = 'PNG'


def bust(rig):
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene; scene.render.engine = 'CYCLES'; choose_render_device(scene)
    scene.cycles.samples = SAMPLES; scene.cycles.use_denoising = True
    scene.render.resolution_x = scene.render.resolution_y = 512 if PREVIEW else 1024
    scene.render.resolution_percentage = 100; scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGBA'
    scene.view_settings.view_transform = 'AgX'; scene.view_settings.look = 'AgX - Medium High Contrast'; scene.view_settings.exposure = -1.1
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes['Background']; bg.inputs[0].default_value = (.04, .07, .1, 1); bg.inputs[1].default_value = .04
    objects, meshes, arm = stage_hero(rig, 'rifle', curl=65)
    gesture(rig, objects, arm); effects(rig, arm, meshes)
    for mat in bpy.data.materials:
        if mat.get('k12Role') == 'hazard' or mat.name.startswith('k12-hazard'):
            nodes = mat.node_tree.nodes; nodes.clear()
            out = nodes.new('ShaderNodeOutputMaterial'); bs = nodes.new('ShaderNodeBsdfPrincipled')
            bs.inputs['Base Color'].default_value = (.86, .34, .02, 1)
            bs.inputs['Roughness'].default_value = .32
            mat.node_tree.links.new(bs.outputs[0], out.inputs['Surface'])
    light_rig(rig)
    # Share the title's cool edge and warm face illumination across all four rigs.
    bpy.data.objects['hero rig key'].data.color = (1, .73, .46)
    bpy.ops.object.camera_add(); cam = bpy.context.object; scene.camera = cam; cam.data.type = 'ORTHO'
    d = V((5.4, 3.8, .35)).normalized(); target = V((0, 0, 1.65))
    cam.location = target + d * 5; cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    rot = cam.rotation_euler.to_matrix(); right, up = rot @ V((1, 0, 0)), rot @ V((0, 1, 0))
    pts = deformed_points(meshes, minimum_z=.95 if rig == 'arc' else 1.18)
    xs = [p.dot(right) for p in pts]; ys = [p.dot(up) for p in pts]
    cam.location += right * ((min(xs) + max(xs)) / 2 - target.dot(right)) + up * ((min(ys) + max(ys)) / 2 - target.dot(up))
    cam.data.ortho_scale = max((max(xs) - min(xs)) / .88, (max(ys) - min(ys)) / .88)
    OUT.mkdir(parents=True, exist_ok=True); path = OUT / f'{rig}-bust.png'; scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    if not PREVIEW:
        webp(path)
    print('RW12 PORTRAIT', path, flush=True)


if __name__ == '__main__':
    for rig in RIGS:
        bust(rig)
