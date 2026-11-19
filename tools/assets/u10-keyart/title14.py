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
RAW = ROOT / 'artifacts/nextgen/title14b-work'
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
def toon(name, base=None, image=None, emission=None, emission_image=None, strength=1.0, bands=(.16, .52, 1.0), pale_keep=False, rim=None, rim_power=.35):
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
        if emission_image is not None and emission is not None:
            # Tinted lantern: authored emission map as the mask, colour from the design.
            t = n.new('ShaderNodeTexImage'); t.image = emission_image
            mk = n.new('ShaderNodeRGBToBW'); l.new(t.outputs['Color'], mk.inputs[0])
            tint = n.new('ShaderNodeMix'); tint.data_type = 'RGBA'; tint.blend_type = 'MULTIPLY'; tint.inputs[0].default_value = 1
            l.new(mk.outputs[0], tint.inputs[6]); tint.inputs[7].default_value = emission + (1,)
            l.new(tint.outputs[2], g.inputs['Color'])
        elif emission_image is not None:
            t = n.new('ShaderNodeTexImage'); t.image = emission_image; l.new(t.outputs['Color'], g.inputs['Color'])
        else:
            g.inputs['Color'].default_value = emission + (1,)
        add = n.new('ShaderNodeAddShader'); l.new(result, add.inputs[0]); l.new(g.outputs[0], add.inputs[1]); result = add.outputs[0]
    if rim is not None:
        # Backlit silhouette rim (pale), the game's contour light against dark scenery.
        lw = n.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = rim_power
        rr = n.new('ShaderNodeValToRGB'); rr.color_ramp.interpolation = 'CONSTANT'
        rr.color_ramp.elements[0].position = 0; rr.color_ramp.elements[0].color = (0, 0, 0, 1)
        rr.color_ramp.elements[1].position = .62; rr.color_ramp.elements[1].color = rim + (1,)
        l.new(lw.outputs['Facing'], rr.inputs[0])
        g2 = n.new('ShaderNodeEmission'); l.new(rr.outputs[0], g2.inputs['Color'])
        add2 = n.new('ShaderNodeAddShader'); l.new(result, add2.inputs[0]); l.new(g2.outputs[0], add2.inputs[1]); result = add2.outputs[0]
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
turn = Matrix.Rotation(math.radians(float(next((a.split('=')[1] for a in ARGS if a.startswith('--turn=')), '32'))), 4, 'Z')
for o in [o for o in objects if o.parent not in objects]:
    o.matrix_world = turn @ o.matrix_world
bpy.context.view_layer.update()
facing = (turn.to_3x3() @ V((1, 0, 0))).normalized()
side = V((facing.y, -facing.x, 0))      # marine's right


# ------------------------------------------------------------------ v2 composition (TITLE14b)
# Breach ahead along the aim; the Warden comes out of its light; camera low over his
# left shoulder (marine on the right ~40 %, cropped mid-thigh), rifle in silhouette.
aim = facing
BS = float(next((a.split('=')[1] for a in ARGS if a.startswith('--bs=')), '6.5'))
BD = 9.0
PLATES = {k: [] for k in ('background', 'midground', 'hero', 'foreground')}
PLATES['hero'] = [o for o in objects]
breach_c = aim * BD + side * BS + V((0, 0, 2.9))


def creature(file, mesh_suffix, where, height, yaw, clip='attack', t=.45, lantern=4.0, lantern_colour=None, base=(.010, .011, .014)):
    before = set(bpy.data.objects); acts = set(bpy.data.actions)
    bpy.ops.import_scene.gltf(filepath=str(ROOT / f'public/assets/models/plain/{file}.glb'))
    obs = [o for o in bpy.data.objects if o not in before]
    rig = next((o for o in obs if o.type == 'ARMATURE'), None)
    act = next((a for a in bpy.data.actions if a not in acts and a.name.lower().startswith(clip)), None)
    if rig and act:
        rig.animation_data_create(); rig.animation_data.action = act
        try:
            rig.animation_data.action_slot = act.slots[0]
        except Exception:
            pass
        lo, hi = act.frame_range; scene.frame_set(int(lo + (hi - lo) * t))
    for o in obs:
        if o.type != 'MESH':
            continue
        if not o.name.split('.')[0].endswith(mesh_suffix) or 'lod' in o.name:
            o.hide_render = o.hide_viewport = True
            continue
        for slot in o.material_slots:
            m = slot.material; img = emis = None
            bsdf = next((nd for nd in m.node_tree.nodes if nd.type == 'BSDF_PRINCIPLED'), None) if m and m.use_nodes else None
            if bsdf:
                lk = bsdf.inputs['Base Color'].links; img = lk[0].from_node.image if lk and lk[0].from_node.type == 'TEX_IMAGE' else None
                lk = bsdf.inputs['Emission Color'].links; emis = lk[0].from_node.image if lk and lk[0].from_node.type == 'TEX_IMAGE' else None
            slot.material = toon(file, base, image=img, emission=lantern_colour, emission_image=emis,
                                 strength=lantern, bands=(.08, .30, .9), rim=(.50, .52, .64), rim_power=.22)
        outline(o, .010 * height / 2, 'creature')
    vis = [o for o in obs if o.type == 'MESH' and not o.hide_render]
    bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get(); pts = []
    for o in vis:
        ev = o.evaluated_get(dg); me = ev.to_mesh(); pts += [ev.matrix_world @ v.co for v in me.vertices]; ev.to_mesh_clear()
    lo = min(p.z for p in pts); hi = max(p.z for p in pts)
    cx = (min(p.x for p in pts) + max(p.x for p in pts)) / 2; cy = (min(p.y for p in pts) + max(p.y for p in pts)) / 2
    toward = -V(where); toward.z = 0
    m = Matrix.Translation(where) @ Matrix.Rotation(math.atan2(toward.y, toward.x) + math.radians(yaw), 4, 'Z') @ Matrix.Scale(height / (hi - lo), 4) @ Matrix.Translation((-cx, -cy, -lo))
    for o in obs:
        if o.parent not in obs:
            o.matrix_world = m @ o.matrix_world
    return obs


YAW = float(next((a.split('=')[1] for a in ARGS if a.startswith('--yaw=')), '-90'))
PLATES['midground'] += creature('tyrant', 'boss', aim * (BD - 1.6) + side * BS, 3.5, YAW, 'attack', .3, lantern=6)
PLATES['midground'] += creature('dretch', 'base', aim * 4.6 + side * (BS + 1.6), .8, YAW + 30, 'attack', .5, lantern=7, lantern_colour=(1, .22, .62))
PLATES['midground'] += creature('dretch', 'base', aim * 5.6 + side * (BS - 1.9), .75, YAW - 35, 'attack', .2, lantern=7, lantern_colour=(1, .22, .62))


def box(name, centre, size, mat, rot=0, ink=.02, plate='background'):
    bpy.ops.mesh.primitive_cube_add(size=1, location=centre); o = bpy.context.object; o.name = name
    o.scale = size; o.rotation_euler.z = rot; bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    o.data.materials.append(mat)
    if ink:
        outline(o, ink, 'set')
    PLATES[plate].append(o)
    return o


rot = math.atan2(aim.y, aim.x)
black = toon('silhouette', (.004, .005, .007), bands=(.4, .7, 1.0))
wall = toon('wall', (.012, .016, .022), bands=(.15, .4, .8))
trim = toon('trim', (.022, .028, .035), bands=(.15, .4, .8))
lamp = toon('lamp', (0, 0, 0), emission=(.4, .65, 1.0), strength=1.0)
# Wet deck: dark glossy metal so the breach light and his shadow run toward the camera.
deck = bpy.data.materials.new('t14 wet deck'); deck.use_nodes = True
bs = deck.node_tree.nodes['Principled BSDF']; bs.inputs['Base Color'].default_value = (.010, .013, .017, 1)
bs.inputs['Roughness'].default_value = .16; bs.inputs['Metallic'].default_value = .7
box('wet deck', aim * 5 + V((0, 0, -.05)), (30, 24, .1), deck, rot, 0)
for i in range(-4, 14):
    box('deck seam', aim * i * 1.3 + V((0, 0, .003)), (.025, 24, .004), trim, rot, 0)
for sgn in (-1, 1):
    for i in range(-2, 7):
        box('rib', aim * i * 1.9 + side * (BS + sgn * 5.2) + V((0, 0, 2.3)), (.35, .6, 4.6), trim, rot, .02)
    box('side wall', aim * 4 + side * (BS + sgn * 5.6) + V((0, 0, 2.3)), (26, .3, 5.6), wall, rot, 0)
box('ceiling', aim * 4 + V((0, 0, 5.5)), (26, 24, .2), wall, rot, 0)
# Torn bulkhead: a wall with a jagged boolean opening; the glow plane behind it is the light.
bulk = box('bulkhead', aim * BD + side * BS + V((0, 0, 2.8)), (.35, 13, 5.6), wall, rot, .03)
pts = []
for k in range(18):
    a = k / 18 * math.tau; r = 1.0 + .30 * math.sin(k * 2.3) * math.cos(k * 1.7) + (.22 if k % 4 == 0 else 0)
    pts.append((math.cos(a) * 2.6 * r, math.sin(a) * 2.3 * r))
import bmesh
me = bpy.data.meshes.new('breach cutter'); bm = bmesh.new()
lo_v = [bm.verts.new((x, -1.0, y)) for x, y in pts]; hi_v = [bm.verts.new((x, 1.0, y)) for x, y in pts]
bm.faces.new(lo_v[::-1]); bm.faces.new(hi_v)
for i in range(len(pts)):
    j = (i + 1) % len(pts); bm.faces.new((lo_v[i], lo_v[j], hi_v[j], hi_v[i]))
bm.to_mesh(me); bm.free()
cutter = bpy.data.objects.new('breach cutter', me); scene.collection.objects.link(cutter)
cutter.matrix_world = Matrix.Translation(breach_c) @ Matrix.Rotation(rot + math.pi / 2, 4, 'Z')
mod = bulk.modifiers.new('breach', 'BOOLEAN'); mod.object = cutter; mod.operation = 'DIFFERENCE'
bulk.modifiers.move(len(bulk.modifiers) - 1, 0)
cutter.hide_render = cutter.hide_viewport = True
glow = bpy.data.materials.new('t14 breach glow'); glow.use_nodes = True
n, l = glow.node_tree.nodes, glow.node_tree.links; n.clear()
out = n.new('ShaderNodeOutputMaterial'); em = n.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = 1
tc = n.new('ShaderNodeTexCoord'); gr = n.new('ShaderNodeTexGradient'); gr.gradient_type = 'SPHERICAL'
mp = n.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (.13, .13, .13)
l.new(tc.outputs['Object'], mp.inputs[0]); l.new(mp.outputs[0], gr.inputs[0])
ramp = n.new('ShaderNodeValToRGB'); e = ramp.color_ramp.elements
e[0].position, e[0].color = 0, (.004, .003, .012, 1); e[1].position, e[1].color = 1, (4.0, 3.8, 5.0, 1)
mid = e.new(.5); mid.color = (.35, .24, .95, 1)
l.new(gr.outputs['Fac'], ramp.inputs[0]); l.new(ramp.outputs[0], em.inputs['Color']); l.new(em.outputs[0], out.inputs['Surface'])
bpy.ops.mesh.primitive_plane_add(size=12, location=breach_c + aim * 2.5)
gp = bpy.context.object; gp.rotation_euler = (math.pi / 2, 0, rot + math.pi / 2); gp.data.materials.append(glow); PLATES['background'].append(gp)
# Bent hull shards around the opening and hanging cables, black against the glow.
import random
rng = random.Random(14)
for k in range(11):
    a = k / 11 * math.tau + rng.uniform(-.2, .2)
    r = 2.0 + rng.uniform(-.1, .35)
    p = breach_c - aim * (.3 + rng.uniform(0, .9)) + side * math.cos(a) * r + V((0, 0, math.sin(a) * r * .95))
    sh = box('hull shard', p, (rng.uniform(.04, .09), rng.uniform(.25, .7), rng.uniform(.6, 1.5)), black, rot, .012)
    sh.rotation_euler = (a + rng.uniform(-.6, .6), rng.uniform(-.7, .7), rot + rng.uniform(-.8, .8))
for k, (off, drop, near) in enumerate([(-2.6, 1.6, 2.2), (-1.1, 2.4, 3.0), (1.0, 1.2, 1.6), (2.4, 2.0, 2.6), (.2, 2.8, 4.2)]):
    top = aim * (BD - near) + side * (BS + off) + V((0, 0, 5.4))
    pts3 = [top, top + V((0, 0, -drop * .5)) + side * .3, top + V((0, 0, -drop)) + side * .1 - aim * .2]
    cable = kit_sweep = None
    d = bpy.data.curves.new('cable', 'CURVE'); d.dimensions = '3D'; d.bevel_depth = .03; d.bevel_resolution = 2
    sp = d.splines.new('BEZIER'); sp.bezier_points.add(2)
    for b, co in zip(sp.bezier_points, pts3):
        b.co = co; b.handle_left_type = b.handle_right_type = 'AUTO'
    c = bpy.data.objects.new('hanging cable', d); scene.collection.objects.link(c); c.data.materials.append(black)
    PLATES['foreground' if near > 3.5 else 'background'].append(c)
for i in range(0, 6, 2):
    box('wall lamp', aim * i * 1.9 + side * (BS + 5.0) + V((0, 0, 3.6)), (.8, .05, .05), lamp, rot, 0)
# Haze in front of the breach (EEVEE volume; scatters the breach light).
hz = bpy.data.materials.new('t14 haze'); hz.use_nodes = True; hn = hz.node_tree.nodes; hn.clear()
ho = hn.new('ShaderNodeOutputMaterial'); hv = hn.new('ShaderNodeVolumePrincipled'); hv.inputs['Density'].default_value = .035
hv.inputs['Color'].default_value = (.7, .7, .9, 1); hv.inputs['Anisotropy'].default_value = .55
hz.node_tree.links.new(hv.outputs['Volume'], ho.inputs['Volume'])
bpy.ops.mesh.primitive_cube_add(size=1, location=aim * 5.5 + side * BS + V((0, 0, 2.3)))
haze = bpy.context.object; haze.scale = (8.5, 10, 4.6); haze.rotation_euler.z = rot; haze.data.materials.append(hz); haze['volume'] = True
PLATES['background'].append(haze)


def light(kind, loc, power, colour, target, size=1.0, spot=None):
    bpy.ops.object.light_add(type=kind, location=loc); o = bpy.context.object
    o.data.energy = power; o.data.color = colour
    if kind == 'AREA':
        o.data.size = size
    if kind == 'SPOT':
        o.data.spot_size = spot or .8; o.data.spot_blend = .6
    o.rotation_euler = (V(target) - o.location).to_track_quat('-Z', 'Y').to_euler()
    return o


light('AREA', breach_c + aim * .4, 4200, (.82, .78, 1.0), V((0, 0, 1.0)) - aim * 3, 3.2)              # the breach: backlight + long shadows
light('SPOT', breach_c - aim * .2 + V((0, 0, .6)), 1800, (.85, .82, 1.0), aim * (BD - 1.6) + side * BS + V((0, 0, 3.0)), spot=1.0)  # crown rim
light('AREA', -aim * 1.2 - side * 2.2 + V((0, 0, 3.2)), 380, (.70, .86, 1.0), V((0, 0, 1.4)), 1.4)      # his cool key on the plates
light('POINT', V((0, 0, .3)) + aim * .5, 30, (.6, .85, 1), (0, 0, 0))                                   # suit floor glow

# Torso/aim twist toward the breach (marine only; camera stays on the original aim frame).
TWIST = float(next((x.split('=')[1] for x in ARGS if x.startswith('--twist=')), '22'))
hero_roots = [o for o in PLATES['hero'] if o.parent not in PLATES['hero']]
for o in hero_roots:
    o.matrix_world = Matrix.Rotation(math.radians(-TWIST), 4, 'Z') @ o.matrix_world
# ------------------------------------------------------------------ camera (solved framing)
from bpy_extras.object_utils import world_to_camera_view
CB = float(next((a.split('=')[1] for a in ARGS if a.startswith('--cb=')), '2.4'))
CS = float(next((a.split('=')[1] for a in ARGS if a.startswith('--cs=')), '3.0'))
cam_pos = -aim * CB - side * CS + V((0, 0, 1.55))
bpy.ops.object.camera_add(location=cam_pos); cam = bpy.context.object; scene.camera = cam
look = aim * 6 + side * (BS * .6) + V((0, 0, 1.6))
cam.rotation_euler = (look - cam_pos).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = 28
scene.render.resolution_x, scene.render.resolution_y = (1280, 720) if PREVIEW else (2560, 1440)


def proj(p):
    bpy.context.view_layer.update(); return world_to_camera_view(scene, cam, V(p))


for _ in range(3):
    top, thigh = proj((0, 0, 2.08)), proj((0, 0, .62))
    cam.data.lens *= max(.5, min(2, (.84 - .0) / max(.05, top.y - thigh.y)))
    for axis, target, ref in ((0, .76, (0, 0, 1.45)), (1, .0, (0, 0, .62))):
        prop = 'shift_x' if axis == 0 else 'shift_y'
        a0 = proj(ref)[axis]; setattr(cam.data, prop, getattr(cam.data, prop) + .03)
        a1 = proj(ref)[axis]; setattr(cam.data, prop, getattr(cam.data, prop) - .03 + (target - a0) * .03 / (a1 - a0))
print('FRAME lens', round(cam.data.lens, 1), 'marine', [round(c, 2) for c in proj((0, 0, 1.45))][:2], 'breach', [round(c, 2) for c in proj(breach_c)][:2],
      'muzzle', [round(c, 2) for c in proj(aim * 1.0 + V((0, 0, 1.55)))][:2], 'crown', [round(c, 2) for c in proj(aim * (BD - 1.6) + side * BS + V((0, 0, 3.4)))][:2], flush=True)
if '--frame' in ARGS:
    raise SystemExit

# ------------------------------------------------------------------ render
scene.render.engine = 'BLENDER_EEVEE'
scene.eevee.taa_render_samples = 32 if PREVIEW else 96
for attr, value in (('use_raytracing', True), ('volumetric_tile_size', '4'), ('volumetric_samples', 64), ('volumetric_end', 40.0)):
    try:
        setattr(scene.eevee, attr, value)
    except (AttributeError, TypeError):
        pass
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'Standard'; scene.view_settings.look = 'None'; scene.view_settings.exposure = 0
scene.world.use_nodes = True
bgn = scene.world.node_tree.nodes['Background']; bgn.inputs[0].default_value = (.002, .003, .005, 1); bgn.inputs[1].default_value = 1


def render(path, plate=None):
    everything = [o for v in PLATES.values() for o in v]
    for o in everything:
        o.is_holdout = False
    scene.render.film_transparent = plate not in (None, 'background')
    if plate:
        for name, obs in PLATES.items():
            for o in obs:
                if o.get('volume'):
                    o.hide_render = name != plate
                else:
                    o.is_holdout = name != plate
    else:
        haze.hide_render = False
    scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGBA' if scene.render.film_transparent else 'RGB'
    scene.render.filepath = str(path); bpy.ops.render.render(write_still=True)


raw = RAW / ('preview.png' if PREVIEW else 'composition.png')
render(raw)
print('TITLE14 RAW', raw, flush=True)
if PREVIEW:
    raise SystemExit
for plate in PLATES:
    render(RAW / f'{plate}.png', plate)


# ------------------------------------------------------------------ delivery (same names/sizes)
def save(img, path, fmt, quality=80, alpha=False):
    st = scene.render.image_settings
    st.file_format = fmt; st.quality = quality; st.color_mode = 'RGBA' if alpha else 'RGB'
    if fmt == 'PNG':
        st.compression = 100
    img.save_render(str(path), scene=scene)


def scaled(path, w, posterize=None):
    im = bpy.data.images.load(str(path)).copy(); im.scale(w, w * 9 // 16)
    if posterize:
        px = np.empty(len(im.pixels), np.float32); im.pixels.foreach_get(px)
        px = px.reshape(-1, 4); px[:, :3] = np.round(px[:, :3] ** (1 / 2.2) * posterize) / posterize
        px[:, :3] = px[:, :3] ** 2.2; px[:, 3] = np.round(px[:, 3] * 8) / 8
        im.pixels.foreach_set(px.ravel())
    return im


for w in (1280, 1920, 2560):
    save(scaled(raw, w), UI / f'title-{w}.webp', 'WEBP', 80)
save(scaled(raw, 1280), UI / 'title-1280.jpg', 'JPEG', 84)
for plate, ui in (('background', 'background'), ('midground', 'midground'), ('hero', 'hero'), ('foreground', 'foreground')):
    alpha = plate != 'background'
    for w in (1280, 2560):
        save(scaled(RAW / f'{plate}.png', w), UI / f'{ui}-{w}.webp', 'WEBP', 80, alpha)
    save(scaled(RAW / f'{plate}.png', 1280, posterize=12), UI / f'{ui}-1280.png', 'PNG', alpha=alpha)
for w in (640, 1280):   # fog plate: transparent
    im = bpy.data.images.new(f'fog{w}', w, w * 9 // 16, alpha=True); im.pixels.foreach_set(np.zeros(w * (w * 9 // 16) * 4, np.float32))
    save(im, UI / f'fog-{w}.webp', 'WEBP', 80, True)
    if w == 1280:
        save(im, UI / 'fog-1280.png', 'PNG', alpha=True)
print('TITLE14 DELIVERED', flush=True)
