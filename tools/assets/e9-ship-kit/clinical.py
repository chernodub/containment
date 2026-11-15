"""Original Containment clinical ship kit. MIT, repository LICENSE.

Rebuild: blender -b --factory-startup -P tools/assets/e9-ship-kit/clinical.py
Optional -- --hero-only or --preview. All dimensions are metres, Blender Z-up.
The exported GLB has named, bottom-centred Y-up assets, with front toward +Z.
No source models, textures, fonts or external add-ons are used.
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
OUT = ROOT / 'public/assets/e9-ship-kit/clinical'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

PALETTE = {
    'e9-body': '#24343c', 'e9-ceramic': '#d5ded3', 'e9-trim': '#8faaa8',
    'e9-dark': '#0e1820', 'e9-cyan': '#65d8e6', 'e9-amber': '#e0b95a',
}
MATERIALS = {}
GROUPS = []
CURRENT = None


def linear(hex_color):
    rgb = [int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in rgb)


for name, color in PALETTE.items():
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    rgba = (*linear(color), 1)
    material.diffuse_color = rgba
    shader = material.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = rgba
    shader.inputs['Metallic'].default_value = .58 if name in ('e9-body', 'e9-trim') else .06
    shader.inputs['Roughness'].default_value = .36 if name == 'e9-trim' else .56
    if name in ('e9-cyan', 'e9-amber'):
        shader.inputs['Emission Color'].default_value = rgba
        shader.inputs['Emission Strength'].default_value = 3.2 if name == 'e9-cyan' else 2.2
    MATERIALS[name] = material


def asset(name):
    global CURRENT
    CURRENT = bpy.data.objects.new(name, None)
    CURRENT.empty_display_type = 'PLAIN_AXES'
    CURRENT['originalAsset'] = True
    CURRENT['license'] = 'MIT'
    bpy.context.collection.objects.link(CURRENT)
    GROUPS.append(CURRENT)


def finish(obj, role, bevel=0):
    obj.data.materials.append(MATERIALS[role])
    obj.parent = CURRENT
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new('Manufactured 2-4cm radiused edge', 'BEVEL')
        modifier.width, modifier.segments = bevel, 2
        modifier.harden_normals = True
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    modifier = obj.modifiers.new('Weighted planar normals', 'WEIGHTED_NORMAL')
    modifier.keep_sharp, modifier.weight = True, 35
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    return obj


def box(name, xyz, size, role='e9-body', bevel=.025, tilt=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz)
    obj = bpy.context.object
    obj.name, obj.scale = name, size
    obj.rotation_euler[0] = tilt
    return finish(obj, role, min(bevel, min(size) * .22))


def cylinder(name, xyz, radius, length, role='e9-trim', axis='Z', vertices=12, bevel=.012):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=length, location=xyz)
    obj = bpy.context.object
    obj.name = name
    if axis == 'Y':
        obj.rotation_euler[0] = math.pi / 2
    elif axis == 'X':
        obj.rotation_euler[1] = math.pi / 2
    return finish(obj, role, min(bevel, radius * .18))


def bar(name, a, b, radius=.035, role='e9-trim'):
    start, end = Vector(a), Vector(b)
    obj = cylinder(name, tuple((start + end) / 2), radius, (end - start).length, role)
    obj.rotation_euler = (end - start).to_track_quat('Z', 'Y').to_euler()
    return obj


def cable(name, points, radius=.018, role='e9-dark'):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.resolution_u = 4
    curve.bevel_depth, curve.bevel_resolution = radius, 1
    spline = curve.splines.new('BEZIER')
    spline.bezier_points.add(len(points) - 1)
    for knot, xyz in zip(spline.bezier_points, points):
        knot.co = xyz
        knot.handle_left_type = knot.handle_right_type = 'AUTO'
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    obj = bpy.context.object
    obj.select_set(False)
    return finish(obj, role)


def bolt(x, y, z, axis='Y'):
    return cylinder('Sparse captive fastener', (x, y, z), .021, .011,
                    'e9-trim', axis, vertices=8, bevel=0)


def screen(x, y, z, width, height, role='e9-cyan', glyph='wave'):
    box('Recessed instrument display bezel', (x, y, z), (width+.07, .045, height+.06), 'e9-dark', .012)
    box('Cyan instrument glass', (x, y-.026, z), (width, .010, height), role, .002)
    # Original physical telemetry marks prevent a flat luminous rectangle.
    if glyph == 'wave':
        samples = [(-.41, -.02), (-.24, -.02), (-.17, .17), (-.09, -.23),
                   (.02, .25), (.12, -.02), (.40, -.02)]
        for a, b in zip(samples, samples[1:]):
            start = Vector((x+a[0]*width, y-.034, z+a[1]*height))
            end = Vector((x+b[0]*width, y-.034, z+b[1]*height))
            obj = box('Original waveform', tuple((start+end)/2),
                      ((end-start).length, .004, .012), 'e9-dark', 0)
            obj.rotation_euler[1] = -math.atan2(end.z-start.z, end.x-start.x)
    else:
        for i in range(3):
            box('Quiet original telemetry rule', (x-width*.08, y-.034, z+(i-1)*height*.23),
                (width*(.62-i*.09), .004, height*.07), 'e9-dark', 0)


def drawer(x, y, z, width, height, ceramic=True):
    box('Inset service drawer well', (x, y, z), (width, .035, height), 'e9-dark', .010)
    box('Bevelled drawer fascia', (x, y-.022, z+.012), (width-.07, .018, height-.055),
        'e9-ceramic' if ceramic else 'e9-body', .012)
    box('Recessed drawer pull', (x, y-.035, z+height*.23), (width*.36, .012, .028), 'e9-dark', .003)


def keyboard(x, y, z, width=.66):
    box('Flush keyboard rubber well', (x, y, z), (width, .20, .018), 'e9-dark', .003)
    for n in range(2):
        box('Keyboard continuous key row', (x-.03, y-.04+n*.077, z+.013),
            (width*.82, .025, .009), 'e9-trim', 0)


def stool(x, y, height=.43):
    cylinder('Grounded stool pedestal', (x, y, .025), .185, .05, 'e9-dark', vertices=16)
    cylinder('Stool central column', (x, y, height*.45), .055, height-.07, 'e9-trim')
    cylinder('Stool recessed seat frame', (x, y, height-.025), .218, .065, 'e9-body', vertices=16)
    cylinder('Stool padded seat', (x, y, height+.012), .200, .035, 'e9-dark', vertices=16, bevel=.008)


def analyser():
    asset('clinical-analyser')
    # A real bench with two grounded drawer pods and an open working knee bay.
    for x in (-1.45, 1.45):
        box('Analyser grounded plinth', (x, .13, .055), (1.24, .87, .11), 'e9-dark', .030)
        box('Rounded analyser cabinet', (x, .14, .325), (1.24, .86, .53), 'e9-body', .035)
        for z in (.245, .445):
            drawer(x, -.305, z, 1.10, .17)
        bolt(x-.46, -.344, .12)
        bolt(x+.46, -.344, .12)
    box('Continuous clinical instrument bench', (0, .12, .628), (4.20, .96, .096), 'e9-ceramic', .035)
    box('Worktop underside reveal', (0, .12, .572), (4.08, .86, .020), 'e9-dark', .004)
    box('Rear service rail', (0, .557, .716), (4.08, .075, .17), 'e9-body', .020)
    box('Rear rail glass strip', (0, .513, .742), (3.58, .010, .035), 'e9-cyan', .002)
    # Two upright screens remain below the .95m cutaway datum.
    for x in (-1.29, -.45):
        box('Instrument display low foot', (x, .26, .718), (.18, .18, .10), 'e9-trim', .020)
        screen(x, .215, .8025, .70, .235)
    keyboard(-1.28, -.16, .686, .72)
    keyboard(-.43, -.16, .686, .64)
    # The analyser hood has an actual recessed sample aperture and probe arm.
    for x in (.68, 1.85):
        box('Ceramic analyser hood cheek', (x, .17, .794), (.19, .62, .235), 'e9-ceramic', .030)
    box('Instrument hood top bridge', (1.265, .17, .916), (1.36, .62, .068), 'e9-ceramic', .030)
    box('Sample cavity dark back', (1.265, .441, .792), (.99, .045, .205), 'e9-dark', .008)
    box('Sample cavity cyan wash', (1.265, .408, .859), (.79, .010, .033), 'e9-cyan', .003)
    cylinder('Recessed sample carrier', (1.255, .10, .693), .245, .034, 'e9-dark', vertices=20)
    cylinder('Sample carrier machined rim', (1.255, .10, .714), .194, .012, 'e9-trim', vertices=20, bevel=0)
    cylinder('Contained specimen receiver', (1.255, .10, .742), .077, .048, 'e9-body')
    bar('Captive probe support', (.13, .20, .685), (.13, .20, .891), .045)
    cylinder('Probe shoulder pivot', (.13, .20, .877), .073, .10, 'e9-body', 'Y')
    bar('Articulated probe upper arm', (.13, .20, .877), (.43, -.13, .875), .034)
    cylinder('Probe elbow pivot', (.43, -.13, .875), .060, .08, 'e9-trim', 'Y')
    bar('Articulated probe lower arm', (.43, -.13, .875), (.55, -.21, .824), .026)
    cylinder('Probe optical head', (.55, -.21, .797), .045, .060, 'e9-body')
    cylinder('Probe cyan aperture', (.55, -.21, .764), .031, .008, 'e9-cyan', bevel=0)
    cable('Probe captive cable', [(.13, .24, .78), (.14, .24, .874), (.40, -.09, .878), (.56, -.18, .84)], .012)
    cylinder('Exposed calibration tray', (.37, -.16, .693), .145, .032, 'e9-dark', vertices=16)
    cylinder('Calibration tray inner dish', (.37, -.16, .713), .105, .010, 'e9-trim', vertices=16, bevel=0)
    box('Hood front instrument recess', (1.265, -.147, .914), (.61, .009, .031), 'e9-dark', .001)
    box('Hood source calibration indicator', (1.265, -.154, .914), (.40, .006, .014), 'e9-cyan', .001)
    for x in (-.35, .10):
        cable('Captured bench power loom', [(x-.16, .47, .57), (x-.23, .48, .27),
              (x-.05, .47, .19), (x+.12, .47, .30), (x+.12, .47, .57)], .019)
    stool(-.28, -.375, .43)


def testbench():
    asset('clinical-testbench')
    for x in (-.94, .94):
        box('Testbench grounded foot', (x, .08, .045), (.63, .78, .09), 'e9-dark', .025)
        box('Testbench support cabinet', (x, .10, .318), (.65, .79, .49), 'e9-body', .030)
        drawer(x, -.307, .35, .56, .28)
    box('Ceramic test surface', (0, 0, .635), (2.80, 1.20, .10), 'e9-ceramic', .035)
    box('Inset instrument tray', (-.44, -.08, .694), (1.42, .72, .020), 'e9-dark', .006)
    for x in (-.84, -.35):
        cylinder('Calibrated sample holder', (x, -.08, .72), .148, .032, 'e9-trim', vertices=16)
        cylinder('Sample recess', (x, -.08, .739), .105, .009, 'e9-dark', vertices=16, bevel=0)
    box('Low instrument terminal foot', (.88, .27, .735), (.18, .21, .13), 'e9-body')
    screen(.88, .24, .792, .57, .15, glyph='rules')
    keyboard(.88, -.15, .696, .58)
    box('Bench front status label', (0, -.592, .615), (.50, .010, .032), 'e9-trim', .002)
    cable('Testbench captive supply', [(-.74, .51, .59), (-.74, .51, .27),
          (-.26, .51, .22), (.28, .51, .26), (.28, .51, .59)], .020)


def diagnostic_tower():
    asset('clinical-diagnostic-tower')
    box('Instrument tower floor plinth', (0, 0, .065), (1.60, .90, .13), 'e9-dark', .030)
    box('Rounded tower shell', (0, .015, .94), (1.54, .82, 1.68), 'e9-body', .040)
    for x in (-.70, .70):
        box('Tower ceramic corner column', (x, -.396, .96), (.13, .06, 1.54), 'e9-ceramic', .022)
    screen(0, -.398, 1.295, 1.10, .47)
    box('Tower inset reader plate', (0, -.402, .805), (1.18, .035, .30), 'e9-dark', .010)
    for x in (-.36, 0, .36):
        cylinder('Instrument service socket', (x, -.429, .805), .083, .025, 'e9-trim', 'Y')
        cylinder('Socket recessed core', (x, -.445, .805), .048, .008, 'e9-dark', 'Y', bevel=0)
    drawer(0, -.401, .40, 1.18, .32)
    box('Tower continuous cap', (0, 0, 1.78), (1.60, .90, .04), 'e9-ceramic', .008)
    box('Tower source status strip', (0, -.437, 1.653), (.82, .012, .035), 'e9-cyan', .002)


def scanner_arch():
    """Wide probe gantry: 8.06m clear width, every overhead part above 2.22m.

    The two 0.31m-wide grounded supports stay at the far edges of the nave.
    No threshold, gate leaf, diagonal brace or suspended cable enters the lane.
    """
    asset('clinical-scanner-arch')
    CURRENT['clearWidthMetres'] = 8.06
    CURRENT['minimumOverheadHeightMetres'] = 2.22
    for sign in (-1, 1):
        x = sign * 4.195
        box('Scanner arch grounded foot', (x, 0, .055), (.31, 1.20, .11), 'e9-dark', .030)
        box('Scanner arch structural leg', (x, 0, 1.185), (.29, .86, 2.20), 'e9-body', .030)
        box('Scanner arch shoulder collar', (x, 0, 2.245), (.31, 1.02, .11), 'e9-trim', .022)
        for front in (-1, 1):
            box('Broad off-white probe pillar casing', (x, front*.447, 1.35),
                (.245, .035, 1.67), 'e9-ceramic', .025)
            box('Pillar recessed instrument foot panel', (x, front*.447, .295),
                (.24, .032, .235), 'e9-dark', .012)
            box('Pillar service access fascia', (x, front*.468, .295),
                (.17, .014, .16), 'e9-trim', .004)
            bolt(x, front*.480, .295)
        # Cyan windows face the clear lane rather than implying a force field.
        box('Inward clinical sensor recess', (sign*4.045, 0, 1.43),
            (.010, .59, 1.08), 'e9-dark', .002)
        box('Inward clinical instrument window', (sign*4.034, 0, 1.43),
            (.008, .45, .92), 'e9-cyan', .001)
        for z in (.68, 2.00):
            box('Pillar face module seam', (x, -.470, z), (.19, .006, .014), 'e9-dark', .001)
    box('Wide diagnostic gantry header', (0, 0, 2.425), (8.70, 1.00, .31), 'e9-body', .035)
    box('Broad off-white gantry cap', (0, 0, 2.57), (8.68, 1.04, .06), 'e9-ceramic', .018)
    box('Gantry cap underside shadow', (0, 0, 2.524), (8.58, 1.015, .025), 'e9-dark', .006)
    # Four broad instrument faces give the long beam real manufactured modules.
    for x in (-3.18, -1.06, 1.06, 3.18):
        box('Header off-white instrument casing', (x, -.516, 2.414),
            (2.035, .030, .19), 'e9-ceramic', .012)
        box('Header rear access panel', (x, .511, 2.414),
            (1.89, .022, .16), 'e9-trim', .008)
    for x in (-2.16, 0, 2.16):
        screen(x, -.542, 2.414, .78, .112, glyph='rules')
    box('Header underside service shadow', (0, 0, 2.270), (7.94, .76, .026), 'e9-dark', .006)
    box('Visible continuous task-light diffuser', (0, -.12, 2.250),
        (6.90, .095, .014), 'e9-cyan', .003)
    for x in (-2.30, 2.30):
        cylinder('Captive overhead probe gimbal', (x, .18, 2.262), .072, .060, 'e9-trim')
        cylinder('Downward optical probe housing', (x, .18, 2.243), .050, .032, 'e9-body')
        cylinder('Downward probe cyan aperture', (x, .18, 2.225), .035, .010, 'e9-cyan', bevel=0)


def cryo_console():
    asset('cryo-service-console')
    box('Cryo console shadow plinth', (0, .02, .05), (2.44, 1.04, .10), 'e9-dark', .030)
    box('Rounded cryogenic cabinet', (0, .02, .38), (2.44, 1.04, .60), 'e9-ceramic', .040)
    box('Cryogenic continuous top', (0, 0, .715), (2.50, 1.10, .10), 'e9-trim', .030)
    for x in (-.64, .64):
        drawer(x, -.513, .38, 1.09, .43, ceramic=False)
        box('Cryo control low foot', (x, .21, .770), (.16, .16, .08), 'e9-body', .015)
        screen(x, .177, .815, .88, .105, glyph='rules')
        keyboard(x, -.18, .776, .80)
        box('Cryo front light channel', (x, -.543, .635), (.73, .012, .032), 'e9-cyan', .002)
    cylinder('Cryo central pressure coupling', (0, -.535, .27), .10, .025, 'e9-trim', 'Y')
    cylinder('Coupling recessed bore', (0, -.544, .27), .061, .008, 'e9-dark', 'Y', bevel=0)
    cable('Captured cryo service hose', [(0, .52, .65), (-.15, .52, .36),
          (0, .52, .20), (.19, .52, .36), (.19, .52, .65)], .026)


def comms_rack(height, name):
    asset(name)
    box('Rack grounded plinth', (0, 0, .055), (1.80, .86, .11), 'e9-dark', .025)
    box('Rack structural shell', (0, .02, height/2), (1.74, .80, height-.04), 'e9-body', .030)
    for x in (-.795, .795):
        box('Rack corner post', (x, -.405, height/2), (.095, .055, height-.14), 'e9-ceramic', .018)
    modules=3 if height < 1 else 6
    for n in range(modules):
        z=.18+n*(height-.28)/modules
        box('Recessed relay cassette', (0, -.399, z), (1.42, .025, .16), 'e9-dark', .008)
        box('Relay broad cassette face', (0, -.418, z+.006), (1.32, .014, .105), 'e9-trim', .005)
        for x in (-.56, .56):
            box('Captive cassette pull', (x, -.437, z+.007), (.032, .025, .064), 'e9-body', .005)
        box('Relay status source', (-.35, -.433, z+.004), (.15, .006, .017),
            'e9-amber' if n==modules-1 else 'e9-cyan', .001)
    box('Rack cap', (0, 0, height-.017), (1.80, .86, .034), 'e9-ceramic', .007)
    # Recessed top cooling grille, broad enough to read from the game camera.
    for x in (-.56, -.28, 0, .28, .56):
        box('Rack top cooling louvre', (x, 0, height+.004), (.12, .50, .009), 'e9-dark', .002)


def habitation_console():
    asset('habitation-console-locker')
    box('Habitation cabinet floor plinth', (0, 0, .05), (2.40, .80, .10), 'e9-dark', .025)
    box('Habitation ceramic body', (0, .01, .435), (2.34, .74, .73), 'e9-ceramic', .035)
    for x in (-.73, .73):
        drawer(x, -.359, .42, .78, .53, ceramic=False)
    box('Habitation desktop', (0, 0, .826), (2.40, .80, .075), 'e9-trim', .025)
    box('Domestic terminal foot', (0, .16, .846), (.14, .15, .065), 'e9-body', .012)
    screen(0, .14, .820, .56, .095, role='e9-amber', glyph='rules')
    keyboard(0, -.18, .870, .56)
    for x in (-1.10, 1.10):
        bolt(x, -.386, .68)


def berth():
    asset('habitation-berth')
    box('Berth grounded shadow base', (0, 0, .105), (2.36, 1.10, .21), 'e9-dark', .030)
    box('Berth manufactured frame', (0, 0, .285), (2.40, 1.15, .20), 'e9-body', .040)
    box('Berth recessed mattress', (0, -.015, .445), (2.18, .98, .19), 'e9-ceramic', .040)
    box('Folded arrival blanket', (.33, -.015, .557), (.86, .98, .040), 'e9-trim', .008)
    box('Berth pillow', (-.78, 0, .575), (.43, .78, .10), 'e9-ceramic', .025)
    for x in (-1.16, 1.16):
        box('Berth end retaining lip', (x, 0, .49), (.08, 1.15, .34), 'e9-body', .025)
    box('Berth storage drawer', (0, -.581, .24), (1.64, .018, .17), 'e9-trim', .007)
    box('Berth recessed drawer handle', (0, -.594, .27), (.44, .009, .025), 'e9-dark', .002)
    box('Berth reading strip', (-1.204, 0, .56), (.009, .57, .035), 'e9-amber', .002)


def desk():
    asset('habitation-desk')
    box('Desk drawer foot', (-.47, .05, .045), (.53, .65, .09), 'e9-dark', .020)
    box('Desk grounded drawer cabinet', (-.47, .05, .40), (.53, .65, .63), 'e9-body', .030)
    drawer(-.47, -.285, .46, .44, .37)
    for y in (-.24, .34):
        box('Desk open knee support', (.66, y, .39), (.08, .08, .71), 'e9-trim', .018)
    box('Original compact desktop', (0, 0, .772), (1.65, .82, .09), 'e9-ceramic', .030)
    box('Desk terminal stand', (.19, .24, .824), (.13, .13, .055), 'e9-body', .010)
    screen(.19, .20, .848, .57, .08, role='e9-amber', glyph='rules')
    keyboard(.19, -.12, .833, .56)
    stool(.22, -.43, .43)


def floor_panels():
    asset('deck-access-panel')
    box('Access panel dark seam backing', (0, 0, .008), (2, 2, .016), 'e9-dark', .003)
    box('Reinforced access plate', (0, 0, .025), (1.91, 1.91, .020), 'e9-body', .004)
    for side in (-1, 1):
        box('Access panel reinforcing trim', (side*.93, 0, .037), (.045, 1.82, .006), 'e9-trim', .001)
    for x in (-.73, .73):
        for y in (-.73, .73):
            cylinder('Access captive quarter turn', (x, y, .037), .035, .006, 'e9-dark', vertices=8, bevel=0)
    box('Access lift handle recess', (0, -.64, .037), (.32, .08, .006), 'e9-dark', .001)
    asset('deck-rubber-panel')
    box('Rubber panel carrier', (0, 0, .009), (2, 2, .018), 'e9-body', .003)
    box('Quiet rubber panel', (0, 0, .023), (1.94, 1.94, .018), 'e9-dark', .004)
    for x in (-.72, -.24, .24, .72):
        box('Broad rubber drainage groove', (x, 0, .033), (.035, 1.72, .002), 'e9-body', 0)
    asset('fixture-glass-strip')
    box('Glass strip recessed housing', (0, 0, .035), (1.60, .14, .070), 'e9-body', .018)
    box('Glass strip pale retaining rail', (0, 0, .073), (1.50, .115, .014), 'e9-trim', .003)
    box('Glass strip luminous diffuser', (0, 0, .083), (1.42, .065, .012), 'e9-cyan', .002)
    for x in (-.73, .73):
        cylinder('Strip captive fixing', (x, 0, .084), .018, .006, 'e9-dark', vertices=8, bevel=0)


def join_materials(group):
    by_role = {}
    for obj in list(group.children):
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        obj.select_set(False)
        by_role.setdefault(obj.data.materials[0].name, []).append(obj)
    for role, objects in by_role.items():
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        if len(objects)>1:
            bpy.ops.object.join()
        obj = bpy.context.object
        obj.name = f'{group.name}--{role}'
        obj.parent = group
        obj['finish'] = role
        # Untextured stock PBR needs no exported UV chart.
        for uv in list(obj.data.uv_layers):
            obj.data.uv_layers.remove(uv)


def bake_ao(group):
    vertices, faces = [], []
    for obj in group.children:
        offset = len(vertices)
        vertices.extend(tuple(obj.matrix_world @ vertex.co) for vertex in obj.data.vertices)
        faces.extend(tuple(offset+i for i in face.vertices) for face in obj.data.polygons)
    tree = BVHTree.FromPolygons(vertices, faces, all_triangles=False, epsilon=.0001)
    for obj in group.children:
        mesh = obj.data
        colors = mesh.color_attributes.new(name='AO', type='BYTE_COLOR', domain='CORNER')
        mesh.color_attributes.active_color = colors
        mesh.color_attributes.render_color_index = 0
        values=[]
        emitter = mesh.materials[0].name in ('e9-cyan', 'e9-amber')
        for vertex in mesh.vertices:
            normal = vertex.normal.normalized()
            tangent = normal.cross(Vector((0, 0, 1)))
            if tangent.length < .01:
                tangent = normal.cross(Vector((0, 1, 0)))
            tangent.normalize()
            bitangent = normal.cross(tangent).normalized()
            origin = obj.matrix_world @ vertex.co + normal*.005
            shadow = 0
            if not emitter:
                for ray in range(12):
                    radius=math.sqrt((ray+.5)/12)
                    angle=ray*2.399963229728653
                    direction=(tangent*(radius*math.cos(angle)) + bitangent*(radius*math.sin(angle)) +
                               normal*math.sqrt(1-radius*radius)).normalized()
                    hit, _, _, distance = tree.ray_cast(origin, direction, .32)
                    if hit is not None:
                        shadow += (1-distance/.32)*.65
            values.append(max(.48, 1-shadow/12))
        for loop in mesh.loops:
            ao=values[loop.vertex_index]
            colors.data[loop.index].color=(ao, ao, ao, 1)
        mesh.update()


def export_pack():
    models=[]
    for group in GROUPS:
        join_materials(group)
        bake_ao(group)
        bounds=[obj.matrix_world @ Vector(corner) for obj in group.children for corner in obj.bound_box]
        low=[min(point[i] for point in bounds) for i in range(3)]
        high=[max(point[i] for point in bounds) for i in range(3)]
        triangles=0
        for obj in group.children:
            obj.data.calc_loop_triangles()
            triangles+=len(obj.data.loop_triangles)
        models.append({
            'name':group.name,
            'size':[round(high[0]-low[0], 5), round(high[2]-low[2], 5), round(high[1]-low[1], 5)],
            'bounds': {'min':[round(low[0], 5), round(low[2], 5), round(-high[1], 5)],
                       'max':[round(high[0], 5), round(high[2], 5), round(-low[1], 5)]},
            'triangles':triangles, 'primitives':len(group.children),
            'materials':sorted({obj.data.materials[0].name for obj in group.children}),
        })
    bpy.ops.object.select_all(action='DESELECT')
    for group in GROUPS:
        group.select_set(True)
        for obj in group.children:
            obj.select_set(True)
    temporary=OUT/'clinical.next.glb'
    bpy.ops.export_scene.gltf(
        filepath=str(temporary), export_format='GLB', use_selection=True,
        export_yup=True, export_apply=True, export_extras=True,
        export_materials='EXPORT', export_vertex_color='ACTIVE',
        export_all_vertex_colors=False, export_animations=False,
        export_cameras=False, export_lights=False,
    )
    path=OUT/'clinical.glb'
    temporary.replace(path)
    manifest={
        'name':'Containment original clinical ship kit', 'license':'MIT',
        'author':'Containment contributors', 'source':str(Path(__file__).relative_to(ROOT)),
        'rebuild':'blender -b --factory-startup -P tools/assets/e9-ship-kit/clinical.py',
        'coordinateSystem':'glTF Y-up, metres; bottom-centred asset groups; front +Z',
        'description':'Original diagnostics, cryogenic service, habitation and communications furnishings. No external source assets or fonts.',
        'ao':'12 deterministic BVH hemisphere rays per vertex, .32m range; normalized AO COLOR_0 multiplier',
        'marineReferenceHeightMetres':2.05, 'materials':PALETTE, 'models':models,
        'scannerArch':{
            'asset':'clinical-scanner-arch', 'clearWidthMetres':8.06,
            'minimumOverheadHeightMetres':2.22,
            'supportCentresX':[-4.195,4.195], 'supportWidthMetres':.31,
            'supportDepthMetres':1.20, 'supportInnerFacesX':[-4.04,4.04],
        },
        'output':{'file':path.name, 'bytes':path.stat().st_size,
                  'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
                  'triangles':sum(model['triangles'] for model in models)},
    }
    (OUT/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
    (OUT/'LICENSE.txt').write_text((ROOT/'LICENSE').read_text())
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'clinical.blend'))
    print('E9_CLINICAL_EXPORT '+json.dumps(manifest['output']))


def preview():
    """Asset art review only; the preview stage is added after GLB/blend export."""
    for group in GROUPS:
        for obj in group.children:
            obj.hide_render=group.name!='clinical-analyser'
    scene=bpy.context.scene
    scene.render.engine='CYCLES'
    scene.cycles.samples=24
    scene.cycles.use_denoising=True
    scene.render.resolution_x, scene.render.resolution_y=1920, 1080
    scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'
    scene.world.color=(.07, .07, .07)
    ground=bpy.data.materials.new('PREVIEW ONLY neutral deck')
    ground.use_nodes=True
    ground.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.025,.037,.045,1)
    ground.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.86
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.015))
    bpy.context.object.data.materials.append(ground)
    for location, power, size in (((3,-4,6), 1100, 5), ((-4,-1,3), 650, 4), ((0,5,5), 1250, 4)):
        data=bpy.data.lights.new('PREVIEW ONLY softbox', 'AREA')
        data.energy, data.shape, data.size=power, 'DISK', size
        obj=bpy.data.objects.new(data.name, data)
        bpy.context.collection.objects.link(obj)
        obj.location=location
        obj.rotation_euler=(Vector((0,0,.5))-obj.location).to_track_quat('-Z','Y').to_euler()
    data=bpy.data.cameras.new('PREVIEW ONLY camera')
    camera=bpy.data.objects.new(data.name,data)
    bpy.context.collection.objects.link(camera)
    camera.location=(5.8,-7.5,6.4)
    camera.rotation_euler=(Vector((0,0,.42))-camera.location).to_track_quat('-Z','Y').to_euler()
    data.type, data.ortho_scale='ORTHO', 5.8
    scene.camera=camera
    for width,height,name in ((1920,1080,'hero-preview.png'),(480,270,'hero-preview-480.png')):
        scene.render.resolution_x,scene.render.resolution_y=width,height
        scene.render.filepath=str(OUT/name)
        bpy.ops.render.render(write_still=True)


def arch_preview():
    """Arch-only art view; exported assets are already saved without staging."""
    for group in GROUPS:
        for obj in group.children:
            obj.hide_render = group.name != 'clinical-scanner-arch'
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.world.color = (.07, .07, .07)
    material = bpy.data.materials.new('PREVIEW ONLY clinical arch stage')
    material.diffuse_color = (.04, .055, .065, 1)
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.018))
    bpy.context.object.data.materials.append(material)
    for position, power, size in (((4,-5,8),1800,7),((-7,-1,5),1100,6),((0,6,7),1800,6)):
        data = bpy.data.lights.new('PREVIEW ONLY arch softbox', 'AREA')
        data.energy, data.shape, data.size = power, 'DISK', size
        obj = bpy.data.objects.new(data.name, data)
        bpy.context.collection.objects.link(obj)
        obj.location = position
        obj.rotation_euler = (Vector((0,0,1.3))-obj.location).to_track_quat('-Z','Y').to_euler()
    data = bpy.data.cameras.new('PREVIEW ONLY arch camera')
    camera = bpy.data.objects.new(data.name, data)
    bpy.context.collection.objects.link(camera)
    camera.location = (8,-13,7)
    camera.rotation_euler = (Vector((0,0,1.3))-camera.location).to_track_quat('-Z','Y').to_euler()
    data.type, data.ortho_scale = 'ORTHO', 11.1
    scene.camera = camera
    for width,height,name in ((1920,1080,'scanner-arch-preview.png'),(480,270,'scanner-arch-preview-480.png')):
        scene.render.resolution_x, scene.render.resolution_y = width,height
        scene.render.filepath = str(OUT/name)
        bpy.ops.render.render(write_still=True)


analyser()
if '--hero-only' not in sys.argv:
    testbench()
    diagnostic_tower()
    cryo_console()
    comms_rack(.88, 'comms-rack-low')
    comms_rack(1.78, 'comms-rack-tall')
    habitation_console()
    berth()
    desk()
    floor_panels()
    scanner_arch()
export_pack()
if '--preview' in sys.argv:
    preview()
if '--arch-preview' in sys.argv:
    arch_preview()
