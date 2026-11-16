"""Render the four rig portraits and the title hero layer from the close-up hero.

Original MIT code. One pose (rifle brace) and one light rig for everything:
  blender -b -t 4 -P tools/assets/k12-hero/portraits.py -- [--rig=arc] [--samples=128] [--preview] [--title]

Outputs (same names/sizes U10's UI loads):
  public/assets/portraits/u10/{rig}-bust.png   1024² RGBA
  public/assets/portraits/u10/{rig}-bust-{256,640,1024}.webp
  --title: artifacts/nextgen/k12-final/hero-layer-2560.png (2560×1440 RGBA, U10 title camera)
--preview writes small review images to artifacts/nextgen/k12-work/portraits/ only.
"""
import sys
from pathlib import Path
import bpy
from mathutils import Vector as V

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE.parents[1] / 'k10-marine'))
from hero import stage_hero, light_rig, deformed_points, ROOT
from render_device import choose_render_device

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
PREVIEW = '--preview' in ARGS
RIGS = next((a.split('=')[1].split(',') for a in ARGS if a.startswith('--rig=')), ['breacher', 'cryo', 'pyro', 'arc'])
SAMPLES = int(next((a.split('=')[1] for a in ARGS if a.startswith('--samples=')), '32' if PREVIEW else '128'))
UI = ROOT / 'public/assets/portraits/u10'
REVIEW = ROOT / 'artifacts/nextgen/k12-work/portraits'
FINAL = ROOT / 'artifacts/nextgen/k12-final'


def setup(scene, res, transparent=True):
    scene.render.engine = 'CYCLES'; choose_render_device(scene)
    scene.cycles.samples = SAMPLES; scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = res; scene.render.resolution_percentage = 100
    scene.render.film_transparent = transparent
    scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGBA'
    scene.view_settings.view_transform = 'AgX'; scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.view_settings.exposure = -1.1
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes['Background']; bg.inputs[0].default_value = (.04, .07, .1, 1); bg.inputs[1].default_value = .04


def clear():
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)


def webp(src, sizes):
    img = bpy.data.images.load(str(src))
    for size in sizes:
        copy = img.copy(); copy.scale(size, size)
        copy.filepath_raw = str(src.with_name(f'{src.stem}-{size}.webp')); copy.file_format = 'WEBP'
        scene = bpy.context.scene
        scene.render.image_settings.file_format = 'WEBP'; scene.render.image_settings.quality = 86
        copy.save_render(copy.filepath_raw, scene=scene)
        bpy.data.images.remove(copy)
    scene.render.image_settings.file_format = 'PNG'


def bust(rig):
    clear(); scene = bpy.context.scene; setup(scene, (512, 512) if PREVIEW else (1024, 1024))
    objects, meshes, arm = stage_hero(rig, 'rifle')
    light_rig(rig)
    bpy.ops.object.camera_add(); cam = bpy.context.object; scene.camera = cam
    cam.data.type = 'ORTHO'
    d = V((5.4, 3.8, .35)).normalized(); target = V((0, 0, 1.65))
    cam.location = target + d * 5; cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    rot = cam.rotation_euler.to_matrix(); right, up = rot @ V((1, 0, 0)), rot @ V((0, 1, 0))
    pts = deformed_points(meshes, minimum_z=1.18)
    xs = [p.dot(right) for p in pts]; ys = [p.dot(up) for p in pts]
    cam.location += right * ((min(xs) + max(xs)) / 2 - target.dot(right)) + up * ((min(ys) + max(ys)) / 2 - target.dot(up))
    cam.data.ortho_scale = max((max(xs) - min(xs)) / .9, (max(ys) - min(ys)) / .9)
    out = (REVIEW if PREVIEW else UI); out.mkdir(parents=True, exist_ok=True)
    path = out / f'{rig}-bust.png'; scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    if not PREVIEW:
        webp(path, (256, 640, 1024))
    print('K12 PORTRAIT', path, flush=True)


def title_layer(rig='breacher'):
    """Hero plate in U10's title frame: 23° brace turn, 44mm low camera, visor on the right third."""
    import math
    from mathutils import Matrix
    from bpy_extras.object_utils import world_to_camera_view
    clear(); scene = bpy.context.scene; setup(scene, (1280, 720) if PREVIEW else (2560, 1440))
    objects, meshes, arm = stage_hero(rig, 'rifle')
    turn = Matrix.Rotation(math.radians(23), 4, 'Z')
    for o in [o for o in objects if o.parent not in objects]:
        o.matrix_world = turn @ o.matrix_world
    bpy.context.view_layer.update()
    light_rig(rig, 1.2)
    bpy.ops.object.camera_add(location=(2.7, 3.1, 1.05)); cam = bpy.context.object; scene.camera = cam
    cam.rotation_euler = (V((0, 0, 1.25)) - cam.location).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = 44
    focus = V((.1, -.08, 1.92)); bpy.context.view_layer.update()
    for axis, target in ((0, .735), (1, .62)):
        prop = 'shift_x' if axis == 0 else 'shift_y'
        b = world_to_camera_view(scene, cam, focus)[axis]; setattr(cam.data, prop, .01); bpy.context.view_layer.update()
        a = world_to_camera_view(scene, cam, focus)[axis]; setattr(cam.data, prop, (target - b) * .01 / (a - b)); bpy.context.view_layer.update()
    out = REVIEW if PREVIEW else FINAL; out.mkdir(parents=True, exist_ok=True)
    scene.render.filepath = str(out / ('hero-layer-2560.png' if not PREVIEW else 'hero-layer-preview.png'))
    bpy.ops.render.render(write_still=True)
    print('K12 TITLE LAYER', scene.render.filepath, flush=True)


def hands():
    """Grip study: right and left hand close-ups for several curl axes/amounts."""
    for axis, amount in (('X', 0), ('X', 40), ('X', -40), ('Z', 40), ('Z', -40)):
        clear(); scene = bpy.context.scene; setup(scene, (360, 360))
        objects, meshes, arm = stage_hero('breacher', 'rifle', curl=amount, axis=axis)
        light_rig('breacher')
        body = next(o for o in meshes if o.name.startswith('k10-body'))
        gi = {g.index for g in body.vertex_groups if g.name.endswith('.R') and (g.name.startswith('finger') or g.name.startswith('thumb'))}
        ids = [v.index for v in body.data.vertices if any(g.group in gi and g.weight > .5 for g in v.groups)]
        ev = body.evaluated_get(bpy.context.evaluated_depsgraph_get()); me = ev.to_mesh()
        pts = [body.matrix_world @ me.vertices[i].co for i in ids]; ev.to_mesh_clear()
        hand = sum(pts, V()) / len(pts)
        bpy.ops.object.camera_add(); cam = bpy.context.object; scene.camera = cam
        d = V((.6, 1.2, .2)).normalized(); cam.location = hand + d * .6; cam.data.lens = 70
        cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
        REVIEW.mkdir(parents=True, exist_ok=True)
        scene.render.filepath = str(REVIEW / f'hand-{axis}{amount}.png'); bpy.ops.render.render(write_still=True)


if '--hands' in ARGS:
    hands()
elif '--title' in ARGS:
    title_layer()
else:
    for rig in RIGS:
        bust(rig)
