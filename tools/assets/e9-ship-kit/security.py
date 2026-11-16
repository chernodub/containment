"""Original Containment security furniture; rebuild with blender -b -P this file.

All modelling is metre-scale Blender Z-up. glTF export supplies Y-up groups with
bottom-centred origins. Geometry, seven-segment lettering and glyphs are original.
No external textures, models, fonts or add-ons are used. MIT, repository LICENSE.
"""
from __future__ import annotations

import hashlib
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree


ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'public/assets/e9-ship-kit/security'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

PALETTE = {
    'e9-body': '#24343c', 'e9-ceramic': '#d5ded3', 'e9-trim': '#8faaa8',
    'e9-dark': '#0e1820', 'e9-cyan': '#65d8e6', 'e9-amber': '#e0b95a',
    'e9-green': '#71c793', 'e9-red': '#b96755',
}
MATERIALS = {}
GROUPS = []
CURRENT = None


def linear(hex_color):
    rgb = [int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in rgb)


for name, value in PALETTE.items():
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    color = (*linear(value), 1)
    material.diffuse_color = color
    shader = material.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = color
    shader.inputs['Metallic'].default_value = .48 if name in ('e9-body', 'e9-trim') else .05
    shader.inputs['Roughness'].default_value = .24 if name == 'e9-dark' else .39 if name == 'e9-trim' else .52
    if name in ('e9-cyan', 'e9-amber', 'e9-green', 'e9-red'):
        shader.inputs['Emission Color'].default_value = color
        shader.inputs['Emission Strength'].default_value = 2.6
    MATERIALS[name] = material


def asset(name):
    global CURRENT
    CURRENT = bpy.data.objects.new(name, None)
    CURRENT.empty_display_type = 'PLAIN_AXES'
    CURRENT['originalAsset'] = True
    CURRENT['license'] = 'MIT'
    bpy.context.collection.objects.link(CURRENT)
    GROUPS.append(CURRENT)
    return CURRENT


def finish(obj, role, bevel=.025):
    obj.data.materials.append(MATERIALS[role])
    obj.parent = CURRENT
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new('Manufactured 25mm edge', 'BEVEL')
        modifier.width = bevel
        modifier.segments = 2
        modifier.affect = 'EDGES'
        modifier.harden_normals = True
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    modifier = obj.modifiers.new('Weighted broad faces', 'WEIGHTED_NORMAL')
    modifier.keep_sharp = True
    modifier.weight = 35
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    if CURRENT.name == 'security-scanner-gate':
        # Roof paint shares a stock finish. White defaults preserve every
        # unpainted scanner surface when these primitives merge by material.
        pigment = obj.data.color_attributes.new(name='Pigment', type='BYTE_COLOR', domain='CORNER')
        for loop in obj.data.loops:
            pigment.data[loop.index].color = (1, 1, 1, 1)
    return obj


def box(name, xyz, size, role='e9-body', bevel=.025, tilt=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz)
    obj = bpy.context.object
    obj.name = name
    obj.scale = size
    obj.rotation_euler[0] = tilt
    return finish(obj, role, min(bevel, min(size) * .24))


def cylinder(name, xyz, radius, depth, role='e9-trim', axis='Z', vertices=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=xyz)
    obj = bpy.context.object
    obj.name = name
    if axis == 'X':
        obj.rotation_euler[1] = math.pi / 2
    elif axis == 'Y':
        obj.rotation_euler[0] = math.pi / 2
    return finish(obj, role, min(.018, radius * .20))


def bolt(x, y, z, radius=.023):
    return cylinder('Recessed captive bolt', (x, y, z), radius, .012, 'e9-trim', 'Y', 8)


def screen(x, y, z, width, height, role='e9-cyan'):
    box('Recessed display well', (x, y, z), (width + .10, .045, height + .09), 'e9-dark', .012)
    box('Luminous display', (x, y - .025, z), (width, .008, height), role, .002)
    # Sparse original bars make an instrument, never a bright featureless plane.
    for i in range(3):
        box('Display telemetry bar', (x - width * .12, y - .031, z + (i - 1) * height * .23),
            (width * (.48 + i * .08), .004, height * .065), 'e9-dark', .001)


def digits_05(x, y, z, height, role='e9-ceramic'):
    width, thickness = height * .48, height * .085
    segments = [
        (0, height / 2, width, thickness),
        (width / 2, height / 4, thickness, height / 2),
        (width / 2, -height / 4, thickness, height / 2),
        (0, -height / 2, width, thickness),
        (-width / 2, -height / 4, thickness, height / 2),
        (-width / 2, height / 4, thickness, height / 2),
        (0, 0, width, thickness),
    ]
    for digit, selected in enumerate(((0, 1, 2, 3, 4, 5), (0, 2, 3, 5, 6))):
        cx = x + (digit - .5) * width * 1.45
        for index in selected:
            sx, sz, w, h = segments[index]
            box('Original 05 segment', (cx + sx, y, z + sz), (w, .008, h), role, .001)


def scanner_glyph(x, y, z, size=.42, role='e9-cyan'):
    for side in (-1, 1):
        for sign in (-1, 1):
            box('Scanner glyph corner', (x + side * size * .42, y, z + sign * size * .29),
                (size * .07, .008, size * .30), role, .001)
            box('Scanner glyph return', (x + side * size * .32, y, z + sign * size * .42),
                (size * .26, .008, size * .07), role, .001)
    box('Scanner glyph subject', (x, y, z), (size * .12, .008, size * .40), role, .001)
    box('Scanner glyph scanline', (x, y - .003, z - size * .08), (size * .62, .008, size * .05), 'e9-ceramic', .001)


def roof_digits_05(x, y, z, height=.64):
    """Original seven-segment identifier laid flat on the upward camera face."""
    width, thickness = height * .48, height * .085
    segments = [
        (0, height / 2, width, thickness),
        (width / 2, height / 4, thickness, height / 2),
        (width / 2, -height / 4, thickness, height / 2),
        (0, -height / 2, width, thickness),
        (-width / 2, -height / 4, thickness, height / 2),
        (-width / 2, height / 4, thickness, height / 2),
        (0, 0, width, thickness),
    ]
    for digit, selected in enumerate(((0, 1, 2, 3, 4, 5), (0, 2, 3, 5, 6))):
        cx = x + (digit - .5) * width * 1.45
        for index in selected:
            dx, dy, w, h = segments[index]
            box('Upward original 05 stencil', (cx + dx, y + dy, z), (w, h, .004), 'e9-ceramic', 0)


def roof_scanner_glyph(x, y, z, size=.58):
    for side in (-1, 1):
        for sign in (-1, 1):
            box('Upward scanner stencil corner', (x + side * size * .42, y + sign * size * .29, z),
                (size * .07, size * .30, .004), 'e9-ceramic', 0)
            box('Upward scanner stencil return', (x + side * size * .32, y + sign * size * .42, z),
                (size * .26, size * .07, .004), 'e9-ceramic', 0)
    box('Upward scanner subject', (x, y, z), (size * .12, size * .40, .004), 'e9-ceramic', 0)
    box('Upward scanner active scanline', (x, y - size * .08, z + .0005),
        (size * .62, size * .045, .004), 'e9-cyan', 0)


def roof_paint(name, points, z, color='#b7a161'):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([(x, y, z) for x, y in points], [], [tuple(range(len(points)))])
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    finish(obj, 'e9-ceramic', 0)
    # Desaturated yellow pigment is a nonemissive vertex multiplier on the
    # existing ceramic material, so no new finish or shader is introduced.
    desired, source = linear(color), linear(PALETTE['e9-ceramic'])
    tint = tuple(min(1, desired[i] / source[i]) for i in range(3))
    for loop in mesh.loops:
        mesh.color_attributes['Pigment'].data[loop.index].color = (*tint, 1)


def scanner_roof():
    # A single shell remains underneath the independently serviced lid panels.
    # Everything is contained below the existing3.40m upper datum.
    for x in (-2.42, -1.21, 1.21, 2.42):
        box('Manufactured roof panel joint', (x, 0, 3.382), (.022, .99, .004), 'e9-dark', 0)
    for side in (-1, 1):
        box('Upward identity frame long rail', (0, side * .405, 3.382), (2.30, .06, .026), 'e9-trim', .008)
        box('Upward identity frame end rail', (side * 1.12, 0, 3.382), (.06, .75, .026), 'e9-trim', .008)
    box('Inset identity black field', (0, 0, 3.384), (2.16, .73, .010), 'e9-dark', .004)
    roof_digits_05(-.35, 0, 3.397, .58)
    roof_scanner_glyph(.65, 0, 3.397, .58)
    for x in (-1.83, 1.83):
        for side in (-1, 1):
            box('Bevelled service hatch long rail', (x, side * .315, 3.382), (1.04, .06, .026), 'e9-trim', .008)
            box('Bevelled service hatch end rail', (x + side * .49, 0, 3.382), (.06, .57, .026), 'e9-trim', .008)
        box('Inset roof service hatch', (x, 0, 3.383), (.88, .53, .010), 'e9-dark', .004)
        box('Hatch recessed pull socket', (x, .10, 3.390), (.32, .09, .006), 'e9-body', .002)
        box('Hatch lift handle', (x, .10, 3.395), (.23, .026, .006), 'e9-ceramic', 0)
        for dx in (-.41, .41):
            for y in (-.25, .25):
                cylinder('Roof captive flush fastener', (x + dx, y, 3.394), .021, .008, 'e9-trim', 'Z', 8)
        for side in (-1, 1):
            y = side * .46
            box('Inset roof hazard paint bed', (x, y, 3.383), (1.09, .11, .006), 'e9-dark', 0)
            for n in range(4):
                left = x - .49 + n * .25
                roof_paint('Muted painted roof edge hazard', [
                    (left, y - .049), (left + .115, y - .049),
                    (left + .165, y + .049), (left + .05, y + .049),
                ], 3.387)
    for x, role in ((-2.60, 'e9-green'), (2.60, 'e9-red')):
        box('Upward status lamp inset', (x, 0, 3.383), (.27, .28, .016), 'e9-dark', .006)
        # Green is active; the muted red standby lens is painted on the same
        # ceramic batch so this roof retains the scanner's original six finish batches.
        lamp = box('Upward visible status lamp', (x, 0, 3.395), (.12, .16, .006),
                   role if role == 'e9-green' else 'e9-ceramic', .002)
        if role == 'e9-red':
            desired, source = linear(PALETTE[role]), linear(PALETTE['e9-ceramic'])
            tint = tuple(min(1, desired[i] / source[i]) for i in range(3))
            for loop in lamp.data.loops:
                lamp.data.color_attributes['Pigment'].data[loop.index].color = (*tint, 1)


def scanner_gate():
    asset('security-scanner-gate')
    for sign in (-1, 1):
        x = sign * 2.55
        box('Grounded pillar foot', (x, 0, .075), (.60, 1.20, .15), 'e9-dark', .035)
        box('Pillar structural core', (x, 0, 1.57), (.60, .90, 2.99), 'e9-body', .035)
        box('Pillar crown', (x, 0, 2.99), (.60, 1.08, .12), 'e9-trim', .025)
        for front in (-1, 1):
            y = front * .47
            box('Ceramic pillar fascia', (x, y, 1.79), (.46, .055, 2.20), 'e9-ceramic', .025)
            box('Pillar service recess', (x, front * .508, .42), (.39, .025, .36), 'e9-dark', .015)
            for dx in (-.13, .13):
                bolt(x + dx, front * .525, .42)
            for n in range(3):
                box('Pillar lower louvre', (x, front * .49, .18 + n * .08), (.31, .018, .025), 'e9-trim', .003)
        # The 4.5m passage has no centre post, gate leaf or raised threshold.
        box('Inward sensor recess', (sign * 2.258, 0, 1.93), (.018, .71, 1.85), 'e9-dark', .004)
        box('Continuous sensor light', (sign * 2.247, 0, 1.93), (.010, .56, 1.70), 'e9-cyan', .002)
        box('Access status bezel', (x, -.519, 2.67), (.24, .035, .24), 'e9-dark', .008)
        box('Access status lamp', (x, -.541, 2.67), (.16, .008, .13), 'e9-green', .003)
    box('Open passage header', (0, 0, 3.205), (5.70, 1.02, .31), 'e9-body', .035)
    box('Header lit cap', (0, 0, 3.35), (5.66, 1.04, .06), 'e9-ceramic', .018)
    box('Header underside shadow', (0, 0, 3.065), (4.48, .80, .025), 'e9-dark', .005)
    box('Header downlight diffuser', (0, -.18, 3.047), (3.80, .11, .016), 'e9-cyan', .003)
    box('Header identity recess', (0, -.522, 3.223), (1.30, .025, .235), 'e9-dark', .008)
    digits_05(-.20, -.540, 3.225, .16)
    scanner_glyph(.34, -.540, 3.225, .17)
    for x in (-1.85, -1.20, 1.20, 1.85):
        box('Header maintenance inset', (x, -.522, 3.22), (.42, .012, .13), 'e9-trim', .006)
    scanner_roof()


def guard_booth():
    asset('security-guard-booth')
    box('Booth plinth', (0, 0, .075), (2.80, 1.40, .15), 'e9-dark', .035)
    box('Booth lower cabinet', (0, 0, .43), (2.70, 1.30, .64), 'e9-body', .035)
    for x in (-.87, 0, .87):
        box('Booth ceramic skirt panel', (x, -.663, .43), (.79, .035, .46), 'e9-ceramic', .018)
        box('Booth skirt service slot', (x, -.686, .29), (.40, .012, .035), 'e9-dark', .003)
    box('Booth continuous sill', (0, 0, .80), (2.80, 1.40, .10), 'e9-trim', .025)
    for x in (-1.32, 0, 1.32):
        for y in (-.61, .61):
            box('Glazing mullion', (x, y, 1.31), (.075, .085, .98), 'e9-ceramic', .018)
    # Dark polished infill presents closed smoked glazing using stock PBR only.
    for x in (-.66, .66):
        for y in (-.605, .605):
            box('Smoked glazing', (x, y, 1.31), (1.22, .028, .88), 'e9-dark', .012)
            box('Glazing highlight', (x - .43, y - .019, 1.46), (.018, .009, .42), 'e9-trim', .002)
    for x in (-1.30, 1.30):
        box('Booth side glazing', (x, 0, 1.31), (.028, 1.16, .88), 'e9-dark', .012)
    box('Booth roof beam', (0, 0, 1.83), (2.80, 1.40, .12), 'e9-body', .030)
    box('Booth roof cap', (0, 0, 1.90), (2.76, 1.36, .035), 'e9-ceramic', .008)
    box('Booth forward task light', (0, -.704, 1.80), (1.52, .015, .045), 'e9-cyan', .003)
    screen(.61, -.639, 1.02, .39, .15)


def baggage_conveyor():
    asset('security-baggage-conveyor')
    for x in (-1.12, 1.12):
        for y in (-.35, .35):
            box('Conveyor foot', (x, y, .055), (.31, .32, .11), 'e9-dark', .025)
            box('Conveyor pedestal', (x, y, .31), (.18, .20, .50), 'e9-body', .025)
    box('Conveyor belt shadow', (0, 0, .55), (3.12, .93, .18), 'e9-dark', .025)
    for n in range(15):
        cylinder('Transverse steel roller', (-1.42 + n * .203, 0, .64), .075, .84, 'e9-trim', 'Y')
    for y in (-.50, .50):
        box('Conveyor side rail', (0, y, .63), (3.20, .10, .24), 'e9-body', .028)
        box('Conveyor ceramic side insert', (0, y * 1.095, .65), (2.74, .005, .095), 'e9-ceramic', .001)
    box('Retained baggage tray', (.60, 0, .755), (.67, .66, .10), 'e9-body', .025)
    box('Tray recessed bed', (.60, 0, .811), (.52, .51, .016), 'e9-dark', .004)
    screen(-1.02, -.558, .64, .25, .10, 'e9-green')


def lockers(height, name):
    asset(name)
    box('Locker floor plinth', (0, 0, .065), (3, .80, .13), 'e9-dark', .025)
    box('Locker case', (0, .01, height / 2), (2.96, .72, height - .035), 'e9-body', .030)
    for index in range(5):
        x = (index - 2) * .58
        box('Individual locker door recess', (x, -.362, height / 2), (.552, .024, height - .18), 'e9-dark', .012)
        box('Individual ceramic door', (x, -.381, height / 2 + .015), (.512, .018, height - .23), 'e9-ceramic', .015)
        box('Recessed locker latch', (x + .155, -.396, height * .48), (.055, .008, .13), 'e9-dark', .003)
        box('Locker nameplate', (x -.08, -.395, height * .73), (.18, .006, .055), 'e9-trim', .001)
        for n in range(3):
            box('Locker ventilation slot', (x, -.396, height * .25 + n * .048), (.28, .006, .014), 'e9-dark', .001)
    box('Locker continuous top trim', (0, 0, height - .018), (3, .79, .036), 'e9-trim', .008)


def queue_rail():
    asset('security-queue-rail')
    for x in (-1.08, 1.08):
        cylinder('Rail foot plate', (x, 0, .025), .18, .05, 'e9-dark', vertices=16)
        cylinder('Rail upright', (x, 0, .34), .052, .62, 'e9-trim')
        cylinder('Rail top collar', (x, 0, .656), .070, .06, 'e9-ceramic')
    cylinder('Continuous queue handrail', (0, 0, .66), .040, 2.32, 'e9-trim', 'X')
    cylinder('Queue lower barrier', (0, 0, .34), .025, 2.16, 'e9-body', 'X')
    box('Rail occupancy marker', (-1.08, -.057, .60), (.08, .008, .09), 'e9-green', .002)


def bench():
    asset('security-bench')
    for x in (-.74, .74):
        box('Bench grounded foot', (x, 0, .055), (.36, .67, .11), 'e9-dark', .025)
        box('Bench support', (x, 0, .26), (.22, .52, .42), 'e9-body', .030)
    box('Bench seat frame', (0, 0, .46), (2.20, .75, .12), 'e9-body', .030)
    for x in (-.70, 0, .70):
        box('Bench clean seat module', (x, -.035, .535), (.65, .63, .045), 'e9-ceramic', .010)
    box('Bench shallow back lip', (0, .31, .59), (2.16, .10, .12), 'e9-trim', .025)


def console():
    asset('security-console')
    box('Workstation shadow plinth', (0, 0, .055), (2.65, 1.06, .11), 'e9-dark', .028)
    box('Workstation cabinet', (0, 0, .365), (2.70, 1.08, .61), 'e9-body', .035)
    for x in (-.68, .68):
        box('Desk drawer reveal', (x, -.550, .40), (1.20, .025, .42), 'e9-dark', .012)
        box('Desk drawer fascia', (x, -.568, .43), (1.10, .016, .31), 'e9-ceramic', .018)
        box('Desk inset drawer pull', (x, -.580, .49), (.42, .009, .026), 'e9-dark', .003)
    box('Workstation bevelled worktop', (0, 0, .715), (2.80, 1.20, .09), 'e9-trim', .025)
    for x in (-.68, .68):
        box('Sloped console display bezel', (x, .25, .806), (1.16, .39, .065), 'e9-dark', .020, math.radians(20))
        box('Console luminous inset', (x, .24, .843), (1.01, .29, .010), 'e9-cyan', .002, math.radians(20))
        for n in range(3):
            box('Console original telemetry bar', (x -.12, .18+n*.062, .849+(n-1)*.021),
                (.55+n*.06, .014, .008), 'e9-dark', .001, math.radians(20))
        box('Console keyboard recess', (x, -.27, .771), (.84, .24, .012), 'e9-dark', .003)
        for n in range(2):
            box('Console continuous key row', (x -.10, -.32 + n*.085, .781), (.58, .028, .010), 'e9-ceramic', .002)
    box('Workstation status recess', (1.10, -.586, .24), (.24, .014, .10), 'e9-dark', .004)
    for n, role in enumerate(('e9-green', 'e9-amber', 'e9-red')):
        box('Workstation status diode', (1.03+n*.068, -.596, .24), (.036, .006, .035), role, .001)


def signage():
    asset('security-sign-05')
    box('Wall sign shadow reveal', (0, 0, .36), (1.80, .08, .72), 'e9-dark', .025)
    box('Wall sign ceramic upper rail', (0, -.041, .68), (1.67, .009, .045), 'e9-ceramic', .003)
    digits_05(-.39, -.047, .35, .40)
    scanner_glyph(.47, -.047, .36, .46)
    for x in (-.80, .80):
        bolt(x, -.048, .09, .020)


def merge_material_primitives(group):
    by_material = {}
    for obj in list(group.children):
        if obj.type != 'MESH':
            continue
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        obj.select_set(False)
        by_material.setdefault(obj.data.materials[0].name, []).append(obj)
    for role, objects in by_material.items():
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        if len(objects) > 1:
            bpy.ops.object.join()
        merged = bpy.context.object
        merged.name = f'{group.name}--{role}'
        merged.parent = group
        merged['finish'] = role


def bake_vertex_ao(group):
    """Small deterministic geometric AO bake, stored as exported vertex colour.

    Twelve hemisphere rays per vertex sample the asset's own static geometry.
    This remains a plain stock-PBR vertex multiplier, with no runtime shader.
    """
    vertices, faces = [], []
    for obj in group.children:
        offset = len(vertices)
        vertices.extend(tuple(obj.matrix_world @ vertex.co) for vertex in obj.data.vertices)
        faces.extend(tuple(offset + i for i in polygon.vertices) for polygon in obj.data.polygons)
    tree = BVHTree.FromPolygons(vertices, faces, all_triangles=False, epsilon=.0001)
    for obj in group.children:
        mesh = obj.data
        pigment = mesh.color_attributes.get('Pigment')
        colors = mesh.color_attributes.new(name='AO', type='BYTE_COLOR', domain='CORNER')
        mesh.color_attributes.active_color = colors
        mesh.color_attributes.render_color_index = 0
        emission = obj.data.materials[0].name in ('e9-cyan', 'e9-green', 'e9-amber', 'e9-red')
        values = []
        for vertex in mesh.vertices:
            if emission:
                values.append(1)
                continue
            normal = vertex.normal.normalized()
            tangent = normal.cross(Vector((0, 0, 1)))
            if tangent.length < .01:
                tangent = normal.cross(Vector((0, 1, 0)))
            tangent.normalize()
            bitangent = normal.cross(tangent).normalized()
            origin = obj.matrix_world @ vertex.co + normal * .006
            occlusion = 0
            for ray in range(12):
                radius = math.sqrt((ray + .5) / 12)
                angle = ray * 2.399963229728653
                direction = (tangent * (radius * math.cos(angle)) +
                             bitangent * (radius * math.sin(angle)) +
                             normal * math.sqrt(1 - radius * radius)).normalized()
                hit, _, _, distance = tree.ray_cast(origin, direction, .38)
                if hit is not None:
                    occlusion += (1 - distance / .38) * .58
            values.append(max(.50, 1 - occlusion / 12))
        for loop in mesh.loops:
            ao = values[loop.vertex_index]
            tint = pigment.data[loop.index].color if pigment else (1, 1, 1, 1)
            colors.data[loop.index].color = (ao * tint[0], ao * tint[1], ao * tint[2], 1)
        if pigment:
            mesh.color_attributes.remove(pigment)
        mesh.color_attributes.active_color = colors
        mesh.color_attributes.render_color_index = 0
        mesh.update()


def export_pack():
    models = []
    for group in GROUPS:
        merge_material_primitives(group)
        bake_vertex_ao(group)
        points = [obj.matrix_world @ Vector(corner) for obj in group.children for corner in obj.bound_box]
        low = [min(point[i] for point in points) for i in range(3)]
        high = [max(point[i] for point in points) for i in range(3)]
        triangles = 0
        for obj in group.children:
            obj.data.calc_loop_triangles()
            triangles += len(obj.data.loop_triangles)
        models.append({
            'name': group.name,
            'size': [round(high[0]-low[0], 5), round(high[2]-low[2], 5), round(high[1]-low[1], 5)],
            'bounds': {'min': [round(low[0], 5), round(low[2], 5), round(-high[1], 5)],
                       'max': [round(high[0], 5), round(high[2], 5), round(-low[1], 5)]},
            'triangles': triangles,
            'materials': sorted({obj.data.materials[0].name for obj in group.children}),
            'primitives': len(group.children),
        })
    bpy.ops.object.select_all(action='DESELECT')
    for group in GROUPS:
        group.select_set(True)
        for obj in group.children:
            obj.select_set(True)
    path = OUT / 'security.glb'
    bpy.ops.export_scene.gltf(
        filepath=str(path), export_format='GLB', use_selection=True,
        export_yup=True, export_apply=True, export_extras=True,
        export_materials='EXPORT', export_vertex_color='ACTIVE',
        export_all_vertex_colors=False, export_animations=False,
        export_cameras=False, export_lights=False,
    )
    manifest = {
        'name': 'Containment original security interiors', 'license': 'MIT',
        'author': 'Containment contributors', 'source': str(Path(__file__).relative_to(ROOT)),
        'rebuild': 'blender -b --factory-startup -P tools/assets/e9-ship-kit/security.py',
        'coordinateSystem': 'glTF Y-up, metres; each named asset origin bottom-centred',
        'description': 'Original manufactured ship security family; no third-party source assets or fonts.',
        'ao': '12 deterministic BVH hemisphere rays per vertex, 0.38m distance; normalized AO COLOR_0 vertex multiplier',
        'scannerPassage': {'clearWidthMetres': 4.484, 'minimumBeamUndersideMetres': 3.039},
        'scannerRoof': 'Framed inset hatches; original upward05/scanner stencil; muted nonemissive edge-hazard paint; green active/red standby status. Six existing finish batches.',
        'materials': PALETTE, 'models': models,
        'output': {'file': path.name, 'bytes': path.stat().st_size,
                   'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                   'triangles': sum(model['triangles'] for model in models)},
    }
    (OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    (OUT / 'LICENSE.txt').write_text((ROOT / 'LICENSE').read_text())
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'security.blend'))
    print('E9_SECURITY_EXPORT ' + json.dumps(manifest['output']))


def render_preview(only_pack=False):
    """Optional asset-art review only; preview geometry is never exported."""
    for group in GROUPS:
        hidden = group.name != 'security-scanner-gate'
        for obj in group.children:
            obj.hide_render = hidden
    # Preview the same AO/paint multiplication that glTF's COLOR_0 supplies in
    # the game. This is added after export/save and never changes the GLB PBR.
    for material in MATERIALS.values():
        nodes, links = material.node_tree.nodes, material.node_tree.links
        shader = nodes.get('Principled BSDF')
        attribute = nodes.new('ShaderNodeAttribute')
        attribute.attribute_name = 'AO'
        multiply = nodes.new('ShaderNodeMixRGB')
        multiply.blend_type = 'MULTIPLY'
        multiply.inputs[0].default_value = 1
        multiply.inputs[1].default_value = material.diffuse_color
        links.new(attribute.outputs['Color'], multiply.inputs[2])
        links.new(multiply.outputs['Color'], shader.inputs['Base Color'])
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.world.color = (.07, .07, .07)
    ground = bpy.data.materials.new('PREVIEW ONLY neutral stage')
    ground.diffuse_color = (.045, .058, .067, 1)
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.018))
    bpy.context.object.data.materials.append(ground)
    for location, power, size in (((3, -5, 8), 1500, 6), ((-5, -1, 4), 800, 5), ((0, 5, 7), 1800, 5)):
        data = bpy.data.lights.new('PREVIEW ONLY softbox', 'AREA')
        data.energy, data.shape, data.size = power, 'DISK', size
        obj = bpy.data.objects.new(data.name, data)
        bpy.context.collection.objects.link(obj)
        obj.location = location
        obj.rotation_euler = (Vector((0, 0, 1.5)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
    data = bpy.data.cameras.new('PREVIEW ONLY camera')
    camera = bpy.data.objects.new(data.name, data)
    bpy.context.collection.objects.link(camera)
    camera.location = (8, -11, 7)
    camera.rotation_euler = (Vector((0, 0, 1.5)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    data.type, data.ortho_scale = 'ORTHO', 8.3
    scene.camera = camera
    if not only_pack:
        scene.render.filepath = str(OUT / 'hero-preview.png')
        bpy.ops.render.render(write_still=True)
        # Match the steep gameplay tilt as well as the conventional asset view.
        scene.render.resolution_x, scene.render.resolution_y = 1280, 720
        camera.location = (6, -8, 15.5)
        camera.rotation_euler = (Vector((0, 0, 3.23)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
        data.ortho_scale = 7.7
        scene.render.filepath = str(OUT / 'roof-preview.png')
        bpy.ops.render.render(write_still=True)

    # Complete original family overview; parent transforms are preview-only.
    for index, group in enumerate(GROUPS):
        group.location = ((index % 3 - 1) * 5.8, (1 - index // 3) * 3.6, 0)
        for obj in group.children:
            obj.hide_render = False
    for obj in scene.objects:
        if obj.type == 'LIGHT':
            obj.location *= 2.7
            obj.data.energy *= 5
            obj.data.size *= 3
            obj.rotation_euler = (Vector((0, 0, .8)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.resolution_x, scene.render.resolution_y = 1920, 1080
    camera.location = (15, -23, 24)
    camera.rotation_euler = (Vector((0, 0, .8)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    data.ortho_scale = 28
    scene.render.filepath = str(OUT / 'kit-preview.png')
    bpy.ops.render.render(write_still=True)



scanner_gate()
guard_booth()
baggage_conveyor()
lockers(.90, 'security-lockers-low')
lockers(1.80, 'security-lockers-tall')
queue_rail()
bench()
console()
signage()
export_pack()
if '--preview' in sys.argv:
    render_preview()
