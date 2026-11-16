"""K12 close-up hero: rigged high-detail marine, one pose and one light rig.

Original MIT code. ``marine.py --hero`` saves the subdivided close-up source,
skinned to the untouched contract armature, as
artifacts/nextgen/k12-work/hero/marine-hero.blend. ``stage_hero`` appends it
into any scene, applies the retained rifle hold (``rifle_delta`` over ``stand``),
closes the gloves around the K10 grip, attaches the shipping K10 weapon and
normalizes the figure (feet on z=0, ~2.1 m, centred at the origin) — the same
frame U10's key art uses, so a set can be built around it.
"""
import ast
import math
import sys
from pathlib import Path
import bpy
from mathutils import Matrix, Quaternion, Vector as V

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
HERO_BLEND = ROOT / 'artifacts/nextgen/k12-work/hero/marine-hero.blend'
K10 = ROOT / 'tools/assets/k10-marine'
sys.path.insert(0, str(K10))

# Reuse K10's verified clip sampler / rest correction / weapon frame code.
_ns = {'__file__': str(K10 / 'portraits.py'), 'ROOT': ROOT}
_mod = ast.parse((K10 / 'portraits.py').read_text())
_keep = [n for n in _mod.body if isinstance(n, (ast.Import, ast.ImportFrom, ast.FunctionDef)) or
         (isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id in ('WEAPONS', 'ACCENTS') for t in n.targets))]
exec(compile(ast.Module(body=_keep, type_ignores=[]), 'k10-portraits', 'exec'), _ns)
read_glb, pose_matrices, apply_pose, attach_weapon, deformed_points = (_ns[k] for k in
    ('read_glb', 'pose_matrices', 'apply_pose', 'attach_weapon', 'deformed_points'))
ACCENTS = _ns['ACCENTS']
FIT = {'pistol': .65146, 'rifle': .60640, 'shotgun': .65039, 'plasma': .84341, 'rocket': .84286}
CLIP = {'pistol': 'blaster_delta', 'rifle': 'rifle_delta', 'shotgun': 'shotgun_delta', 'plasma': 'prifle_delta', 'rocket': 'lcannon_delta'}


def save_hero(arm, high, D):
    """Skin the high source to the contract armature and save the close-up file."""
    for o in high:
        o.data.transform(D); o.data.update()
        o.parent = arm
        mod = o.modifiers.new('k12 skin', 'ARMATURE'); mod.object = arm
        o.hide_render = o.name.startswith('k10-rig-')
    HERO_BLEND.parent.mkdir(parents=True, exist_ok=True)
    keep = set(high) | {arm} | set(arm.children_recursive)
    for o in list(bpy.data.objects):
        if o not in keep:
            bpy.data.objects.remove(o, do_unlink=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(HERO_BLEND), compress=True)
    print('K12 HERO saved', HERO_BLEND, flush=True)


def _curl(arm, side, amount):
    """Close the glove around a grip: proximal → distal flexion about each finger's own axis."""
    for f, gain in (('index', .85), ('middle', 1.0), ('ring', 1.05), ('pinky', 1.1)):
        for k, share in ((1, .9), (2, 1.1), (3, .8)):
            bone = arm.pose.bones.get(f'finger_{f}.0{k}.{side}')
            if bone:
                bone.matrix = bone.matrix @ Matrix.Rotation(math.radians(amount * gain * share), 4, 'X')
                bpy.context.view_layer.update()
    for k in (2, 3):
        bone = arm.pose.bones.get(f'thumb.0{k}.{side}')
        if bone:
            bone.matrix = bone.matrix @ Matrix.Rotation(math.radians(amount * .5), 4, 'X')
            bpy.context.view_layer.update()


def stage_hero(rig='breacher', weapon='rifle', brace=True, curl=34.0):
    """Append the hero into the current scene; returns (objects, meshes, armature)."""
    before = set(bpy.data.objects)
    with bpy.data.libraries.load(str(HERO_BLEND), link=False) as (src, dst):
        dst.objects = list(src.objects)
    objects = [o for o in dst.objects if o]
    for o in objects:
        bpy.context.scene.collection.objects.link(o)
    arm = next(o for o in objects if o.type == 'ARMATURE')
    meshes = [o for o in objects if o.type == 'MESH']
    for o in meshes:
        o.hide_render = o.name.startswith('k10-rig-') and not o.name.startswith('k10-rig-' + rig)
    document, binary = read_glb(K10 / 'marine-contract.glb')
    rest = pose_matrices(document, binary)
    posed = pose_matrices(document, binary, CLIP[weapon])
    apply_pose(arm, rest, posed)
    for side in ('R', 'L'):
        _curl(arm, side, curl if side == 'R' else curl * .8)
    pts = deformed_points(meshes)
    low = min(p.z for p in pts); factor = 2.1 / (max(p.z for p in pts) - low)
    cx = (min(p.x for p in pts) + max(p.x for p in pts)) / 2; cy = (min(p.y for p in pts) + max(p.y for p in pts)) / 2
    norm = Matrix.Translation((-cx * factor, -cy * factor, -low * factor)) @ Matrix.Scale(factor, 4)
    roots = [o for o in objects if o.parent not in objects]
    for o in roots:
        o.matrix_world = norm @ o.matrix_world
    bpy.context.view_layer.update()
    _ns['WEAPONS'][rig] = (weapon, CLIP[weapon], FIT[weapon])
    gun = attach_weapon(rig, posed['tag_weapon'], norm)
    carrier = next(o for o in gun if o.type == 'EMPTY' and o.name.startswith('portrait held'))
    if brace:
        # Forward brace: lean the ribs into the shot and drop the head to the sight,
        # carrying the weapon with the hand so the grip never slips.
        held = carrier.matrix_world.copy()
        tag0 = arm.matrix_world @ arm.pose.bones['tag_weapon'].matrix
        for name, angle, axis in (('ribs', -12, 'Y'), ('head', -8, 'Z')):
            b = arm.pose.bones.get(name)
            b.matrix = b.matrix @ Matrix.Rotation(math.radians(angle), 4, axis)
            bpy.context.view_layer.update()
        tag1 = arm.matrix_world @ arm.pose.bones['tag_weapon'].matrix
        carrier.matrix_world = tag1 @ tag0.inverted() @ held
        bpy.context.view_layer.update()
    return objects + gun, meshes, arm


def light_rig(rig, scale=1.0, target=(0, 0, 1.65)):
    """The single hero light rig: cold rim, rig-coloured motivated key, low fill, visor kicker."""
    def area(name, loc, power, size, colour):
        bpy.ops.object.light_add(type='AREA', location=loc); l = bpy.context.object; l.name = name
        l.data.energy = power * scale; l.data.size = size; l.data.color = colour
        l.rotation_euler = (V(target) - l.location).to_track_quat('-Z', 'Y').to_euler()
        return l
    return [area('hero cold rim', (-1.5, -1.6, 3.0), 900, .9, (.62, .84, 1)),
            area('hero rig key', (2.6, 1.2, 2.5), 330, 1.4, ACCENTS[rig]),
            area('hero neutral key', (2.2, 2.6, 2.2), 120, 1.6, (1, .92, .84)),
            area('hero floor bounce', (1.2, 1.8, .2), 40, 2.5, (.35, .5, .6)),
            area('hero visor kicker', (1.4, 2.4, 1.9), 25, .5, (.5, .85, 1))]
