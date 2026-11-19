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
K10 = ROOT / 'tools/assets/k10-marine'
sys.path.insert(0, str(K10))

# Reuse K10's verified clip sampler / rest correction / weapon frame code.
_ns = {'__file__': str(K10 / 'portraits.py'), 'ROOT': ROOT}
# Shipping weapons are KTX2 (Blender cannot decode Basis); stage from the plain/ PNG fallbacks.
_mod = ast.parse((K10 / 'portraits.py').read_text().replace("'public/assets/models' / (weapon_id", "'public/assets/models/plain' / (weapon_id"))
_keep = [n for n in _mod.body if isinstance(n, (ast.Import, ast.ImportFrom, ast.FunctionDef)) or
         (isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id in ('WEAPONS', 'ACCENTS') for t in n.targets))]
exec(compile(ast.Module(body=_keep, type_ignores=[]), 'k10-portraits', 'exec'), _ns)
read_glb, pose_matrices, apply_pose, attach_weapon, deformed_points = (_ns[k] for k in
    ('read_glb', 'pose_matrices', 'apply_pose', 'attach_weapon', 'deformed_points'))
ACCENTS = _ns['ACCENTS']
LEFT_AXIS = 'Z'
LEFT_GAIN = -1.4
FIT = {'pistol': .65146, 'rifle': .60640, 'shotgun': .65039, 'plasma': .84341, 'rocket': .84286}
CLIP = {'pistol': 'blaster_delta', 'rifle': 'rifle_delta', 'shotgun': 'shotgun_delta', 'plasma': 'prifle_delta', 'rocket': 'lcannon_delta'}


HERO_GLB = ROOT / 'artifacts/nextgen/k12-work/hero/marine-hero.glb'


def save_hero(arm, high, D):
    """Write the close-up source through the same contract writer as the game GLB.

    Each face's material role is encoded in COLOR_0 red ((index + .5) / 64) so
    stage_hero can restore the procedural close-up shaders after import.
    """
    import materials as M
    from contract import export_marine
    roles = sorted(M.ROLES)
    for o in high:
        attr = o.data.color_attributes.new('Color', 'FLOAT_COLOR', 'CORNER')
        for poly in o.data.polygons:
            mat = o.data.materials[poly.material_index] if o.data.materials else None
            role = mat.get('k12Role', 'graphite') if mat else 'graphite'
            value = (roles.index(role) + .5) / 64
            for li in poly.loop_indices:
                attr.data[li].color = (value, 0, 0, 1)
        o.data.color_attributes.active_color = attr
        o.data.transform(D); o.data.update()
    HERO_GLB.parent.mkdir(parents=True, exist_ok=True)
    export_marine(high, HERO_GLB)
    print('K12 HERO saved', HERO_GLB, flush=True)


def _restore_roles(meshes):
    import materials as M
    M.COORD_SCALE = 1 / 6.8; M._cache.clear()
    roles = sorted(M.ROLES)
    for o in meshes:
        attr = o.data.color_attributes.get('Color') or (o.data.color_attributes[0] if o.data.color_attributes else None)
        if attr is None:
            continue
        o.data.materials.clear()
        slots = {}
        for poly in o.data.polygons:
            li = poly.loop_indices[0]
            value = attr.data[li if attr.domain == 'CORNER' else o.data.loops[li].vertex_index].color[0]
            role = roles[max(0, min(len(roles) - 1, int(value * 64)))]
            if role not in slots:
                slots[role] = len(o.data.materials); o.data.materials.append(M.get(role))
            poly.material_index = slots[role]
        for poly in o.data.polygons:
            poly.use_smooth = True


def _curl(arm, side, amount, axis='X'):
    """Close the glove around a grip: proximal → distal flexion about each finger's own axis."""
    for f, gain in (('index', .85), ('middle', 1.0), ('ring', 1.05), ('pinky', 1.1)):
        for k, share in ((1, .9), (2, 1.1), (3, .8)):
            bone = arm.pose.bones.get(f'finger_{f}.0{k}.{side}')
            if bone:
                bone.matrix = bone.matrix @ Matrix.Rotation(math.radians(amount * gain * share), 4, axis)
                bpy.context.view_layer.update()
    for k in (2, 3):
        bone = arm.pose.bones.get(f'thumb.0{k}.{side}')
        if bone:
            bone.matrix = bone.matrix @ Matrix.Rotation(math.radians(amount * .5), 4, axis)
            bpy.context.view_layer.update()


def stage_hero(rig='breacher', weapon='rifle', brace=True, curl=40.0, axis='X'):
    """Append the hero into the current scene; returns (objects, meshes, armature)."""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(HERO_GLB))
    objects = [o for o in bpy.data.objects if o not in before]
    arm = next(o for o in objects if o.type == 'ARMATURE')
    meshes = [o for o in objects if o.type == 'MESH']
    _restore_roles(meshes)
    for o in meshes:
        o.hide_render = o.name.startswith('k10-rig-') and not o.name.startswith('k10-rig-' + rig)
    document, binary = read_glb(K10 / 'marine-contract.glb')
    rest = pose_matrices(document, binary)
    posed = pose_matrices(document, binary, CLIP[weapon])
    apply_pose(arm, rest, posed)
    for side in ('R', 'L'):
        _curl(arm, side, curl if side == 'R' else curl * LEFT_GAIN, axis if side == 'R' else LEFT_AXIS)
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
