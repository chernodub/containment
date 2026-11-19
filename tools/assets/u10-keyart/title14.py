"""TITLE14 key art: the in-game toon language (banded shading + ink) in Blender. Original MIT.

  blender -b -t 4 -P tools/assets/u10-keyart/title14.py -- --preview      # 1280x720 review render
  blender -b -t 4 -P tools/assets/u10-keyart/title14.py                   # 2560x1440 final + delivery encode

The HERO14 marine (k12-hero close-up source, game palette), the K11/BOSS14 Brute Warden and two
smaller castes (plain PNG GLBs, read-only) are re-shaded with a three-band toon shader (EEVEE
Shader-to-RGB) and an inverted-hull ink outline, lit like gameplay: dark ship, the marine carries
the light, threats second with rims and lanterns. The finished frame is delivered as the
composite and as the background plate; the four parallax plates are transparent so the existing
title composition code needs no change.
"""
import math
import sys
from pathlib import Path
import bpy
import numpy as np
from mathutils import Matrix, Vector as V

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / 'tools/assets/k12-hero'))
sys.path.insert(0, str(ROOT / 'tools/assets/k10-marine'))
from hero import stage_hero

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
PREVIEW = '--preview' in ARGS
RAW = ROOT / 'artifacts/nextgen/title14-work'
RAW.mkdir(parents=True, exist_ok=True)
UI = ROOT / 'public/assets/ui/u10'

# Game palette (HERO14 / runtime quantizer values, linear).
PLATE = (.80, .85, .90)
UNDERSUIT = (.035, .040, .047)
HARDWARE = (.09, .10, .11)
METAL = (.30, .33, .35)
RIG = {'amber': (.95, .60, .04), 'ice': (.07, .36, .74), 'fire': (.74, .09, .02), 'violet': (.28, .07, .62)}
GLOW = {'glow': (.20, .85, 1.0), 'amber_glow': (1.0, .62, .08), 'ice_glow': (.25, .78, 1.0), 'fire_glow': (1, .3, .04), 'arc_glow': (.7, .52, 1)}
INK = (.006, .008, .012)

scene = bpy.context.scene
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)


# ------------------------------------------------------------------ toon shading
def toon(name, base=None, image=None, emission=None, emission_image=None, strength=1.0, bands=(.16, .52, 1.0), pale_keep=False):
    """Three value bands from real lights (Shader-to-RGB), times a base colour; plus emission."""
    m = bpy.data.materials.new('t14 ' + name); m.use_nodes = True
    n, l = m.node_tree.nodes, m.node_tree.links; n.clear()
    out = n.new('ShaderNodeOutputMaterial')
    diff = n.new('ShaderNodeBsdfDiffuse'); diff.inputs['Color'].default_value = (1, 1, 1, 1)
    s2r = n.new('ShaderNodeShaderToRGB'); l.new(diff.outputs[0], s2r.inputs[0])
    bw = n.new('ShaderNodeRGBToBW'); l.new(s2r.outputs[0], bw.inputs[0])
    ramp = n.new('ShaderNodeValToRGB'); ramp.color_ramp.interpolation = 'CONSTANT'
    e = ramp.color_ramp.elements
    e[0].position, e[0].color = 0, (bands[0],) * 3 + (1,)
    e[1].position, e[1].color = .12, (bands[1],) * 3 + (1,)
    hi = e.new(.42); hi.color = (bands[2],) * 3 + (1,)
    l.new(bw.outputs[0], ramp.inputs[0])
    mul = n.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs[0].default_value = 1
    l.new(ramp.outputs[0], mul.inputs[6])
    if image is not None:
        tex = n.new('ShaderNodeTexImage'); tex.image = image
        col = tex.outputs['Color']
        if base is not None:
            # Creature shell: darken toward the family body value but keep pale bone pale.
            lum = n.new('ShaderNodeRGBToBW'); l.new(col, lum.inputs[0])
            keep = n.new('ShaderNodeMapRange'); keep.inputs['From Min'].default_value = .35; keep.inputs['From Max'].default_value = .6
            l.new(lum.outputs[0], keep.inputs['Value'])
            dark = n.new('ShaderNodeMix'); dark.data_type = 'RGBA'; dark.blend_type = 'MULTIPLY'; dark.inputs[0].default_value = 1
            l.new(col, dark.inputs[6]); dark.inputs[7].default_value = base + (1,)
            pick = n.new('ShaderNodeMix'); pick.data_type = 'RGBA'
            l.new(keep.outputs[0], pick.inputs[0]); l.new(dark.outputs[2], pick.inputs[6]); l.new(col, pick.inputs[7])
            col = pick.outputs[2]
        l.new(col, mul.inputs[7])
    else:
        mul.inputs[7].default_value = (base or (.5, .5, .5)) + (1,)
    em = n.new('ShaderNodeEmission'); l.new(mul.outputs[2], em.inputs['Color'])
    result = em.outputs[0]
    if emission is not None or emission_image is not None:
        g = n.new('ShaderNodeEmission'); g.inputs['Strength'].default_value = strength
        if emission_image is not None:
            t = n.new('ShaderNodeTexImage'); t.image = emission_image; l.new(t.outputs['Color'], g.inputs['Color'])
        else:
            g.inputs['Color'].default_value = emission + (1,)
        add = n.new('ShaderNodeAddShader'); l.new(result, add.inputs[0]); l.new(g.outputs[0], add.inputs[1]); result = add.outputs[0]
    l.new(result, out.inputs['Surface'])
    return m


_ink = {}


def ink_material(width_key):
    if width_key not in _ink:
        m = bpy.data.materials.new('t14 ink ' + width_key); m.use_nodes = True
        n = m.node_tree.nodes; n.clear()
        out = n.new('ShaderNodeOutputMaterial'); em = n.new('ShaderNodeEmission'); em.inputs['Color'].default_value = INK + (1,)
        m.node_tree.links.new(em.outputs[0], out.inputs['Surface'])
        m.use_backface_culling = True
        _ink[width_key] = m
    return _ink[width_key]


def outline(obj, width, key='actor'):
    """Inverted hull: the game's outer contour as real geometry, clean at any resolution."""
    obj.data.materials.append(ink_material(key))
    mod = obj.modifiers.new('t14 ink hull', 'SOLIDIFY')
    mod.thickness = width; mod.offset = 1; mod.use_flip_normals = True; mod.use_rim = False
    mod.material_offset = len(obj.data.materials) - 1
    mod.use_even_offset = False


def marine_role(name):
    role = name.replace('k12-', '').split('.')[0]
    if role in GLOW:
        return toon(role, (0, 0, 0), emission=GLOW[role], strength=5.0)
    if role == 'visor':
        return toon(role, (.01, .04, .06), emission=(.15, .75, 1.0), strength=2.6)
    if role == 'ceramic':
        return toon(role, PLATE)
    if role == 'hazard':
        return toon(role, RIG['amber'])
    if role in RIG:
        return toon(role, tuple(c * .9 for c in RIG[role]))
    if role in ('steel', 'brass'):
        return toon(role, METAL)
    if role == 'gunmetal':
        return toon(role, HARDWARE)
    return toon(role, UNDERSUIT)


# ------------------------------------------------------------------ marine
objects, meshes, arm = stage_hero('breacher', 'rifle', brace=True, curl=55)
cache = {}
for o in objects:
    if o.type != 'MESH':
        continue
    for i, slot in enumerate(o.material_slots):
        m = slot.material
        if m is None:
            continue
        if m.name.startswith('k12-'):
            key = m.name.split('.')[0]
            cache.setdefault(key, marine_role(key))
            slot.material = cache[key]
        else:
            # Weapon (plain GLB): keep its authored grey-metal atlas, banded.
            img = next((nd.image for nd in m.node_tree.nodes if nd.type == 'TEX_IMAGE' and nd.image and 'base' in nd.image.name.lower()), None) if m.use_nodes else None
            img = img or next((nd.image for nd in m.node_tree.nodes if nd.type == 'TEX_IMAGE' and nd.image), None)
            slot.material = toon('weapon', image=img) if img else toon('weapon', METAL)
    if not o.hide_render:
        outline(o, .010 if 'k10' in o.name else .008, 'marine')
turn = Matrix.Rotation(math.radians(32), 4, 'Z')
for o in [o for o in objects if o.parent not in objects]:
    o.matrix_world = turn @ o.matrix_world
bpy.context.view_layer.update()
facing = (turn.to_3x3() @ V((1, 0, 0))).normalized()
side = V((facing.y, -facing.x, 0))      # marine's right


# ------------------------------------------------------------------ creatures
FAMILY = {'tyrant': (.16, .10, .07), 'dretch': (.13, .08, .05), 'basilisk': (.08, .10, .12), 'marauder': (.07, .10, .06)}


def creature(file, mesh_suffix, where, height, yaw, clip='attack', t=.45, lantern=4.0):
    before = set(bpy.data.objects); acts = set(bpy.data.actions)
    bpy.ops.import_scene.gltf(filepath=str(ROOT / f'public/assets/models/plain/{file}.glb'))
    obs = [o for o in bpy.data.objects if o not in before]
    rig = next((o for o in obs if o.type == 'ARMATURE'), None)
    new = [a for a in bpy.data.actions if a not in acts]
    act = next((a for a in new if a.name.lower().startswith(clip)), None)
    if rig and act:
        rig.animation_data_create(); rig.animation_data.action = act
        try:
            rig.animation_data.action_slot = act.slots[0]
        except Exception:
            pass
        lo, hi = act.frame_range
        scene.frame_set(int(lo + (hi - lo) * t))
    for o in obs:
        if o.type != 'MESH':
            continue
        if not o.name.endswith(mesh_suffix) or 'lod' in o.name:
            o.hide_render = True; o.hide_viewport = True
            continue
        for slot in o.material_slots:
            m = slot.material
            imgs = {nd.label or nd.name: nd.image for nd in m.node_tree.nodes if nd.type == 'TEX_IMAGE' and nd.image} if m and m.use_nodes else {}
            base = emis = None
            if m and m.use_nodes:
                bsdf = next((nd for nd in m.node_tree.nodes if nd.type == 'BSDF_PRINCIPLED'), None)
                if bsdf:
                    lk = bsdf.inputs['Base Color'].links; base = lk[0].from_node.image if lk and lk[0].from_node.type == 'TEX_IMAGE' else None
                    lk = bsdf.inputs['Emission Color'].links; emis = lk[0].from_node.image if lk and lk[0].from_node.type == 'TEX_IMAGE' else None
            slot.material = toon(file, FAMILY[file], image=base, emission_image=emis, strength=lantern, bands=(.10, .40, 1.0))
        outline(o, .022 * height / 2, 'creature')
    vis = [o for o in obs if o.type == 'MESH' and not o.hide_render]
    bpy.context.view_layer.update()
    pts = []
    dg = bpy.context.evaluated_depsgraph_get()
    for o in vis:
        ev = o.evaluated_get(dg); me = ev.to_mesh(); pts += [ev.matrix_world @ v.co for v in me.vertices]; ev.to_mesh_clear()
    lo = min(p.z for p in pts); hi = max(p.z for p in pts)
    cx = (min(p.x for p in pts) + max(p.x for p in pts)) / 2; cy = (min(p.y for p in pts) + max(p.y for p in pts)) / 2
    toward = (V((0, 0, 0)) - V(where)); toward.z = 0
    angle = math.atan2(toward.y, toward.x) + math.radians(yaw)
    m = Matrix.Translation(where) @ Matrix.Rotation(angle, 4, 'Z') @ Matrix.Scale(height / (hi - lo), 4) @ Matrix.Translation((-cx, -cy, -lo))
    for o in obs:
        if o.parent not in obs:
            o.matrix_world = m @ o.matrix_world
    return obs


ahead = facing * 7.5
WS = float(next((a.split('=')[1] for a in ARGS if a.startswith('--ws=')), '4.2'))
YAW = float(next((a.split('=')[1] for a in ARGS if a.startswith('--yaw=')), '-90'))
warden = creature('tyrant', 'boss', ahead + side * WS, 3.4, YAW, 'attack', .35, lantern=6)
creature('dretch', 'base', facing * 4.0 + side * (WS + .4), .85, YAW + 25, 'attack', .5)
creature('basilisk', 'base', facing * 9.5 + side * (WS + 1.9), 1.2, YAW - 20, 'attack', .4)


# ------------------------------------------------------------------ ship set
def box(name, centre, size, mat, rot=0, ink=.02):
    bpy.ops.mesh.primitive_cube_add(size=1, location=centre); o = bpy.context.object; o.name = name
    o.scale = size; o.rotation_euler.z = rot; bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    o.data.materials.append(mat)
    if ink:
        outline(o, ink, 'set')
    return o


deck = toon('deck', (.020, .030, .038), bands=(.18, .45, .85))
wall = toon('wall', (.014, .020, .028), bands=(.18, .45, .85))
trim = toon('trim', (.035, .045, .055), bands=(.18, .45, .85))
lamp = toon('lamp', (0, 0, 0), emission=(.45, .7, 1.0), strength=1.2)
breach_glow = toon('breach', (0, 0, 0), emission=(.10, .05, .26), strength=1.0)
rot = math.atan2(facing.y, facing.x)
centre = facing * 5
box('deck', centre + V((0, 0, -.05)), (26, 22, .1), deck, rot, 0)
for i in range(-6, 14):
    box('deck seam', facing * i * 1.2 + side * 2 + V((0, 0, .002)), (.03, 16, .004), trim, rot, 0)
for s in (-1, 1):
    for i in range(-2, 9):
        box('wall rib', facing * i * 1.8 + side * (2 + s * (5.7 if s > 0 else 9.0)) + V((0, 0, 2)), (.35, .5, 4), trim, rot, .02)
    box('side wall', centre + side * (2 + s * (6.0 if s > 0 else 9.3)) + V((0, 0, 2)), (26, .3, 4.2), wall, rot, 0)
    for i in range(0, 8, 2):
        box('wall lamp', facing * i * 1.8 + side * (2 + s * (5.5 if s > 0 else 8.8)) + V((0, 0, 3.2)), (.9, .05, .06), lamp, rot, 0)
# Far bulkhead with a torn breach behind the Warden (violet light through it).
far = facing * 11 + side * (WS - .6)
box('bulkhead', facing * 11 + side * 2 + V((0, 0, 2.2)), (.4, 13, 4.6), wall, rot, .03)
bpy.ops.mesh.primitive_circle_add(vertices=14, radius=1.9, fill_type='NGON', location=far - facing * .25 + V((0, 0, 2.0)))
hole = bpy.context.object
for k, v in enumerate(hole.data.vertices):
    v.co *= 1 + .28 * math.sin(k * 2.7) * math.cos(k * 1.3)
hole.rotation_euler = (math.pi / 2, 0, rot + math.pi / 2); bpy.ops.object.transform_apply(rotation=True)
hole.data.materials.append(breach_glow)
for k in range(7):
    a = k / 7 * math.tau
    p = far - facing * .3 + side * (math.cos(a) * 2.0) + V((0, 0, 2.0 + math.sin(a) * 2.0))
    shard = box('torn plate', p, (.08, .5, 1.1), trim, rot + .3 * math.sin(k * 3.1), .015)
    shard.rotation_euler.x = a + .6; bpy.context.view_layer.update()


# ------------------------------------------------------------------ light
def light(kind, loc, power, colour, target, size=1.0, spot=None):
    bpy.ops.object.light_add(type=kind, location=loc); o = bpy.context.object
    o.data.energy = power; o.data.color = colour
    if kind == 'AREA':
        o.data.size = size
    if kind == 'SPOT':
        o.data.spot_size = spot or .8; o.data.spot_blend = .5
    o.rotation_euler = (V(target) - o.location).to_track_quat('-Z', 'Y').to_euler()
    return o


light('AREA', side * -1.2 + facing * 1.6 + V((0, 0, 3.4)), 520, (1, .97, .92), (0, 0, 1.3), 2.0)        # marine key (his light)
light('AREA', -facing * 2.2 + side * 1.5 + V((0, 0, 2.6)), 260, (.6, .82, 1), (0, 0, 1.5), 1.0)          # cool rim
light('POINT', V((0, 0, .25)) + facing * .4, 40, (.6, .85, 1), (0, 0, 0))                                 # marine floor glow
light('AREA', far - facing * 1.0 + V((0, 0, 2.6)), 900, (.6, .35, 1), ahead + V((0, 0, 2)), 2.5)  # breach backlight on Warden
light('SPOT', ahead + side * WS - facing * 2.5 + V((0, 0, 5)), 250, (.75, .82, 1), ahead + side * WS + V((0, 0, 2.5)), spot=.6)  # Warden crown rim
light('AREA', facing * 4 + side * WS + V((0, 0, 3.8)), 120, (.5, .7, .85), facing * 4.5 + side * WS, 3.0)                         # creature edge


# ------------------------------------------------------------------ camera + render
cam_pos = -facing * float(next((a.split('=')[1] for a in ARGS if a.startswith('--back=')), '2.6')) - side * 3.8 + V((0, 0, 1.35))
bpy.ops.object.camera_add(location=cam_pos); cam = bpy.context.object; scene.camera = cam
look = facing * 3.0 + side * .8 + V((0, 0, 1.7))
cam.rotation_euler = (look - cam_pos).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = 30
cam.data.shift_x = 0
from bpy_extras.object_utils import world_to_camera_view
bpy.context.view_layer.update()
chest = V((0, 0, 1.45))
a = world_to_camera_view(scene, cam, chest).x; cam.data.shift_x = .05; bpy.context.view_layer.update()
b = world_to_camera_view(scene, cam, chest).x; cam.data.shift_x = (.78 - a) * .05 / (b - a); bpy.context.view_layer.update()
print('FRAME marine', [round(c, 2) for c in world_to_camera_view(scene, cam, chest)][:2], 'warden', [round(c, 2) for c in world_to_camera_view(scene, cam, ahead + side * WS + V((0, 0, 1.8)))][:2],
      'muzzle-ish', [round(c, 2) for c in world_to_camera_view(scene, cam, facing * .9 + V((0, 0, 1.5)))][:2], flush=True)
if '--frame' in ARGS:
    raise SystemExit
scene.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'
scene.eevee.taa_render_samples = 32 if PREVIEW else 96
scene.render.resolution_x, scene.render.resolution_y = (1280, 720) if PREVIEW else (2560, 1440)
scene.render.resolution_percentage = 100
scene.render.film_transparent = False
scene.view_settings.view_transform = 'Standard'; scene.view_settings.look = 'None'; scene.view_settings.exposure = 0
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes['Background']; bg.inputs[0].default_value = (.004, .006, .010, 1); bg.inputs[1].default_value = 1
try:
    scene.eevee.use_bloom = True
except AttributeError:
    pass
scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGB'
raw = RAW / ('preview.png' if PREVIEW else 'title14-2560.png')
scene.render.filepath = str(raw)
bpy.ops.render.render(write_still=True)
print('TITLE14 RAW', raw, flush=True)


# ------------------------------------------------------------------ delivery
def save(img, path, fmt, quality=82, alpha=False):
    scene.render.image_settings.file_format = fmt; scene.render.image_settings.quality = quality
    scene.render.image_settings.color_mode = 'RGBA' if alpha else 'RGB'
    if fmt == 'PNG':
        scene.render.image_settings.compression = 100
    img.save_render(str(path), scene=scene)


if not PREVIEW:
    src = bpy.data.images.load(str(raw))
    for w in (1280, 1920, 2560):
        im = src.copy(); im.scale(w, w * 9 // 16)
        save(im, UI / f'title-{w}.webp', 'WEBP', 80)
        if w in (1280, 2560):
            save(im, UI / f'background-{w}.webp', 'WEBP', 80)
        if w == 1280:
            save(im, UI / 'title-1280.jpg', 'JPEG', 84)
            save(im, UI / 'background-1280.png', 'PNG')
    # Parallax plates: transparent (the finished frame lives in the background plate).
    for layer, widths in (('midground', (1280, 2560)), ('hero', (1280, 2560)), ('foreground', (1280, 2560)), ('fog', (640, 1280))):
        for w in widths:
            im = bpy.data.images.new(f'{layer}{w}', w, w * 9 // 16, alpha=True)
            im.pixels.foreach_set(np.zeros(w * (w * 9 // 16) * 4, np.float32))
            save(im, UI / f'{layer}-{w}.webp', 'WEBP', 80, alpha=True)
            if w == 1280:
                save(im, UI / f'{layer}-1280.png', 'PNG', alpha=True)
    print('TITLE14 DELIVERED', flush=True)
