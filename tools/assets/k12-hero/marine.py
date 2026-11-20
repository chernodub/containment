"""K12 second-generation marine: build, review, bake and export. Original MIT.

  blender -b -t 4 -P tools/assets/k12-hero/marine.py -- --review        # both LODs, review contact sheet
  blender -b -t 4 -P tools/assets/k12-hero/marine.py -- --bake --export # atlas bake + public/assets/models/marine.glb
  blender -b -t 4 -P tools/assets/k12-hero/marine.py -- --hero          # close-up rigged .blend for portraits/key art

The skeleton, bind matrices and clips come untouched from
tools/assets/k10-marine/marine-contract.glb (separate CC BY-SA attribution);
contract.export_marine appends the new meshes by bone name.
"""
import json
import math
import sys
import zlib
from pathlib import Path
import bpy
from mathutils import Matrix, Vector as V

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(ROOT / 'tools/assets/k10-marine'))
import kit
import materials as M
from body import Suit, RIGS
from helmet import Helmet, SELECTED

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
WORK = ROOT / 'artifacts/nextgen/k12-work'
S = 6.8
D = Matrix(((0, -S, 0, 0), (S, 0, 0, 0), (0, 0, S, 0), (0, 0, 0, 1)))


def arg(name, default=None):
    return next((a.split('=', 1)[1] for a in ARGS if a.startswith('--' + name + '=')), default)


def load_contract():
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(ROOT / 'tools/assets/k10-marine/marine-contract.glb'))
    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    arm.animation_data_clear()
    for b in arm.pose.bones:
        b.matrix_basis.identity()
    Di = D.inverted()
    joints = {b.name: Di @ (arm.matrix_world @ b.head_local) for b in arm.data.bones}
    tails = {b.name: Di @ (arm.matrix_world @ b.tail_local) for b in arm.data.bones}
    return arm, joints, tails


def build(joints, tails, high):
    col = bpy.data.collections.new('k12 ' + ('high' if high else 'low'))
    bpy.context.scene.collection.children.link(col)
    suit = Suit(joints, tails, high, col)
    suit.build_body()
    helmet = Helmet(SELECTED, high, col)
    for part in helmet.build():
        suit.groups['body'].append(part)
    for rig in RIGS:
        suit.build_rig(rig)
        # HERO14: rig-coloured crown stripes either side of the keel (top-down identity).
        for side in (-1, 1):
            stripe = [(side * 10.0, 36), (side * 28, 30), (side * 30, -62), (side * 10.5, -72)]   # SHADE15: wider crown stripes
            obj = helmet.plate(f'{rig} crown stripe {side}', stripe, M.RIG_COLOUR[rig], helmet.top, .0262, .004, .002, 'plain', 2.5)
            helmet.parts.remove(obj); suit.groups[rig].append(obj)
    result = []
    for key, objects in suit.groups.items():
        for obj in objects:
            kit.apply_all(obj)
            name = obj.name.split('.')[0]
            painted = (
                name == 'gorget collar'
                or name.startswith(('vambrace L', 'vambrace R', 'thigh side plate ', 'thigh front plate ',
                                    'helmet crown half ', 'shoulder blade plate '))
                or any(zone in name for zone in (' pauldron ', ' crown stripe ', ' forearm guard'))
            )
            module = name in (
                'breacher accumulator', 'breacher ram barrel', 'ram gland',
                'cryo dewar', 'dewar valve', 'pyro fuel cell', 'pyro exhaust stack',
                'arc capacitor bank', 'coil cap', 'arc coil core',
            )
            if not high:
                mask = obj.data.attributes.new('rig_paint', 'FLOAT', 'FACE')
                up = obj.matrix_world.to_3x3().inverted().transposed()
                for face in obj.data.polygons:
                    mask.data[face.index].value = float(
                        painted or (module and (up @ face.normal).normalized().z > .35)
                    )
            part = zlib.crc32(name.encode()) & 0x7fffffff
            a = obj.data.attributes.get('k10_part') or obj.data.attributes.new('k10_part', 'INT', 'FACE')
            for e in a.data:
                e.value = part
        joined = kit.join(objects, ('k10-body' if key == 'body' else 'k10-rig-' + key) + ('-high' if high else ''))
        result.append(joined)
    for obj in list(col.objects):
        if obj not in result:
            bpy.data.objects.remove(obj, do_unlink=True)
    return result


def studio(scene, samples=48):
    from render_device import choose_render_device
    scene.render.engine = 'CYCLES'; choose_render_device(scene)
    scene.cycles.samples = samples; scene.cycles.use_denoising = True
    scene.view_settings.view_transform = 'AgX'; scene.view_settings.look = 'AgX - Medium High Contrast'; scene.view_settings.exposure = -.7
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes['Background']; bg.inputs[0].default_value = (.03, .04, .05, 1); bg.inputs[1].default_value = .5
    for name, loc, power, size, colour in [('key', (2.6, 3.2, 3.2), 520, 2.2, (1, .9, .8)), ('rim', (-2.4, -2.6, 3.0), 700, 1.5, (.6, .8, 1)),
                                           ('fill', (-3, 2.5, 1.2), 110, 3, (.6, .75, .9))]:
        bpy.ops.object.light_add(type='AREA', location=loc); l = bpy.context.object; l.name = name
        l.data.energy = power; l.data.size = size; l.data.color = colour
        l.rotation_euler = (V((0, 0, 1.1)) - l.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, -.002)); floor = bpy.context.object
    m = bpy.data.materials.new('review floor'); m.use_nodes = True
    m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.02, .025, .03, 1)
    m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .6
    floor.data.materials.append(m)
    return floor


def review(low, high):
    scene = bpy.context.scene
    out = WORK / ('review-' + arg('round', '0')); out.mkdir(parents=True, exist_ok=True)
    floor = studio(scene, int(arg('samples', '40')))
    bpy.ops.object.camera_add(); cam = bpy.context.object; scene.camera = cam
    files = []
    views = arg('views', 'beauty,back,game').split(',')
    for rig in RIGS:
        for view in views:
            if view == 'face' and rig != 'breacher':
                continue
            use_high = view != 'game'
            for o in low + high:
                is_high = o.name.endswith('-high')
                o.hide_render = (is_high != use_high) or (o.name.startswith('k10-rig-') and not o.name.startswith('k10-rig-' + rig))
            if view == 'beauty':
                d, tgt, lens, res = V((.75, 1, .12)), V((0, 0, 1.04)), 78, (540, 720)
            elif view == 'face':
                d, tgt, lens, res = V((.55, 1, .15)), V((0, .02, 1.70)), 85, (700, 700)
            elif view == 'back':
                d, tgt, lens, res = V((-.7, -1, .45)), V((0, 0, 1.08)), 78, (540, 720)
            else:   # in-game: 50° down, marine ~130 px tall
                d, tgt, lens, res = V((.3, -.9, 1.6)), V((0, 0, 1.0)), 50, (200, 200)
            d.normalize()
            cam.location = tgt + d * (6.2 if view != 'face' else 2.2); cam.data.lens = lens
            if view == 'game':
                cam.location = tgt + d * 3.6
            cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
            scene.render.resolution_x, scene.render.resolution_y = res
            floor.hide_render = view == 'game'
            scene.render.film_transparent = view == 'game'
            path = out / f'{rig}-{view}.png'; scene.render.filepath = str(path)
            bpy.ops.render.render(write_still=True)
            files.append(str(path))
    (out / 'files.json').write_text(json.dumps(files))
    print('K12 REVIEW', out, flush=True)


def stats(objs):
    return {o.name: kit.triangles(o) for o in objs}


def main():
    arm, joints, tails = load_contract()
    arm.hide_render = True
    low = build(joints, tails, False)
    high = build(joints, tails, True) if ('--review' in ARGS or '--bake' in ARGS or '--hero' in ARGS) else []
    s = stats(low)
    print('K12 TRIANGLES', json.dumps(s), 'body+rig max', s['k10-body'] + max(v for k, v in s.items() if k.startswith('k10-rig')), flush=True)
    if '--review' in ARGS:
        review(low, high)
    if '--bake' in ARGS:
        from bake import bake_and_export
        bake_and_export(arm, low, high, D)
    if '--hero' in ARGS:
        from hero import save_hero
        save_hero(arm, high, D)


main()
