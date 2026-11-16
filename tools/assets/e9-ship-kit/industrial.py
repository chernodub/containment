"""Original Containment industrial ship furniture, MIT.

Rebuild: Blender -b --factory-startup -P tools/assets/e9-ship-kit/industrial.py
Use --hero-only for a two-plenum export; --preview renders that hero.
Use --preview-overheads for the three separate native/480 hanging landmarks.
No external geometry, textures, fonts or procedural downloads are used.
"""
from __future__ import annotations

import hashlib
import json
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from craft import bake_craft

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'public/assets/e9-ship-kit/industrial'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

PALETTE = {
    'e9-body': '#24343c', 'e9-ceramic': '#d5ded3', 'e9-trim': '#8faaa8',
    'e9-dark': '#0e1820', 'e9-cyan': '#65d8e6', 'e9-amber': '#e0b95a',
    'e9-violet': '#b286d1', 'e9-green': '#71c793',
}
MATERIALS = {}
ASSETS = []
CURRENT = None


def linear(hex_color):
    values = [int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in values)


for name, hex_color in PALETTE.items():
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    color = (*linear(hex_color), 1)
    material.diffuse_color = color
    shader = material.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = color
    shader.inputs['Metallic'].default_value = .52 if name in ('e9-body', 'e9-trim') else .06
    shader.inputs['Roughness'].default_value = .43 if name == 'e9-body' else .36 if name == 'e9-trim' else .57
    if name in ('e9-cyan', 'e9-amber', 'e9-violet', 'e9-green'):
        shader.inputs['Emission Color'].default_value = color
        shader.inputs['Emission Strength'].default_value = 3.2 if name == 'e9-violet' else 2.4
    MATERIALS[name] = material


def asset(name):
    global CURRENT
    CURRENT = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(CURRENT)
    CURRENT['license'] = 'MIT'
    CURRENT['originalAsset'] = True
    ASSETS.append(CURRENT)
    return CURRENT


def finish(obj, role='e9-body', bevel=.025, smooth=True):
    obj.parent = CURRENT
    obj.data.materials.append(MATERIALS[role])
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel >= .01:
        modifier = obj.modifiers.new('Manufactured edge radius', 'BEVEL')
        modifier.width = bevel
        modifier.segments = 1
        modifier.affect = 'EDGES'
        modifier.harden_normals = True
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    for face in obj.data.polygons:
        face.use_smooth = smooth
    if smooth:
        modifier = obj.modifiers.new('Weighted broad faces', 'WEIGHTED_NORMAL')
        modifier.keep_sharp = True
        modifier.weight = 35
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    for layer in list(obj.data.uv_layers):
        obj.data.uv_layers.remove(layer)
    return obj


def box(name, location, size, role='e9-body', bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = size
    return finish(obj, role, min(bevel, min(size) * .22) if min(size) >= .04 else 0)


def cylinder(name, location, radius, length, role='e9-trim', axis='Z', vertices=12, bevel=.015):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=length, location=location)
    obj = bpy.context.object
    obj.name = name
    if axis == 'Y':
        obj.rotation_euler[0] = math.pi / 2
    elif axis == 'X':
        obj.rotation_euler[1] = math.pi / 2
    return finish(obj, role, min(bevel, radius * .16, length * .18))


def sphere(name, location, scale, role='e9-dark', subdivisions=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    return finish(obj, role, 0)


def ring(name, location, radius, tube=.025, role='e9-trim', axis='Y', segments=12):
    bpy.ops.mesh.primitive_torus_add(major_segments=segments, minor_segments=4,
                                   location=location, major_radius=radius - tube, minor_radius=tube)
    obj = bpy.context.object
    obj.name = name
    if axis == 'Y':
        obj.rotation_euler[0] = math.pi / 2
    elif axis == 'X':
        obj.rotation_euler[1] = math.pi / 2
    return finish(obj, role, 0)


def tube(name, coordinates, radius, role='e9-dark', radial=8):
    """Smooth swept root/pipe, with thickness carried through every bend."""
    controls = [Vector(p) for p in coordinates]
    points = []
    for i in range(len(controls) - 1):
        p0, p1 = controls[max(0, i - 1)], controls[i]
        p2, p3 = controls[i + 1], controls[min(len(controls) - 1, i + 2)]
        for step in range(3):
            t = step / 3
            points.append((p1 * 2 + (p2 - p0) * t + (p0 * 2 - p1 * 5 + p2 * 4 - p3) * t * t +
                           (-p0 + p1 * 3 - p2 * 3 + p3) * t * t * t) * .5)
    points.append(controls[-1])
    vertices, faces = [], []
    for i, point in enumerate(points):
        tangent = (points[min(len(points) - 1, i + 1)] - points[max(0, i - 1)]).normalized()
        side = tangent.cross(Vector((0, 1, 0)))
        if side.length < .1:
            side = tangent.cross(Vector((0, 0, 1)))
        side.normalize()
        up = tangent.cross(side).normalized()
        taper = 1 - .48 * i / max(1, len(points) - 1)
        for j in range(radial):
            angle = j * math.pi * 2 / radial
            vertices.append(tuple(point + (side * math.cos(angle) + up * math.sin(angle)) * radius * taper))
        if i:
            for j in range(radial):
                a, b = (i - 1) * radial + j, (i - 1) * radial + (j + 1) % radial
                faces.append((a, b, i * radial + (j + 1) % radial, i * radial + j))
    faces.extend([tuple(reversed(range(radial))), tuple((len(points) - 1) * radial + j for j in range(radial))])
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return finish(obj, role, 0)


def bolt(x, y, z):
    cylinder('Captive service fastener', (x, y, z), .021, .012, 'e9-trim', 'Y', 8, 0)


def chassis(width, depth, height, cutaway=False):
    box('Connected cast plinth', (0, 0, .065), (width, depth, .13), 'e9-dark')
    box('Rear machinery casing', (0, depth * .25, height / 2), (width - .08, depth * .47, height - .12))
    box('Bright continuous cutaway cap', (0, 0, height - (.205 if cutaway else .055)), (width - .025, depth - .025, .11), 'e9-ceramic', .03)
    for x in [-width / 2 + .065, width / 2 - .065]:
        box('Structural end cheek', (x, 0, height / 2), (.13, depth - .04, height - .05), 'e9-body', .03)
        box('Inlaid cheek trim', (x, -depth / 2 + .03, height * .5), (.065, .028, height * .62), 'e9-trim', .009)


def instrument(x, y, z, color='e9-cyan', width=.22, height=.14):
    box('Recessed instrument bezel', (x, y, z), (width + .065, .045, height + .055), 'e9-dark', .009)
    box('Instrument phosphor', (x, y - .027, z), (width, .01, height), color, .002)
    for n in range(2):
        box('Quiet meter graduations', (x + .01, y - .033, z + (n - .5) * height * .35), (width * .58, .003, .009), 'e9-dark', 0)


def pierced_panel(name, x, y, z, width, height, hole):
    panel = box(name, (x, y, z), (width, .10, height), 'e9-ceramic', 0)
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=hole, depth=.35, location=(x, y, z), rotation=(math.pi / 2, 0, 0))
    cutter = bpy.context.object
    modifier = panel.modifiers.new('Real recessed duct aperture', 'BOOLEAN')
    modifier.operation, modifier.object = 'DIFFERENCE', cutter
    bpy.context.view_layer.objects.active = panel
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.data.objects.remove(cutter, do_unlink=True)
    modifier = panel.modifiers.new('Duct panel soft edge', 'BEVEL')
    modifier.width, modifier.segments = .022, 1
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    return panel


def plenum(name, height):
    """P11 authored low-density replacement: intact panels and captive ducts."""
    asset(name)
    width, depth = 4.8, 1.4
    box('Grounded plenum shell', (0, 0, height/2), (width, depth-.2, height), 'e9-body', .035)
    box('Rear mounting spine',(0,.68,height/2),(width,.04,height),'e9-body',0)
    box('Shadowed top service recess', (0, 0, height-.025), (width-.15, depth-.16, .05), 'e9-dark', 0)
    for sx in (-1, 1):
        box('Manufactured end stile', (sx*2.34, -.65, height/2), (.12, .08, height), 'e9-trim', .012)
    radius=.26 if height<1 else .36
    z=height*.53
    for i,x in enumerate((-1.55,0,1.55)):
        box('Independent service door', (x,-.628,z), (1.38,.025,height-.22), 'e9-body',0)
        cylinder('Recessed duct shadow', (x,-.653,z), radius+.045,.015,'e9-dark','Y',12,0)
        ring('Raised duct collar', (x,-.672,z),radius+.045,.025,'e9-trim',segments=12)
        cylinder('Fan bearing', (x,-.683,z),.06,.03,'e9-trim','Y',8,0)
        for blade in range(4):
            a=blade*math.pi/2
            obj=box('Captive fan vane',(x+math.cos(a)*radius*.45,-.678,z+math.sin(a)*radius*.45),
                    (radius*.8,.015,.045),'e9-body',0)
            obj.rotation_euler[1]=-a+.2
        for slot in range(3):
            box('Lower cooling louvre',(x,-.65,(.14+slot*.03) if height<1 else (.2+slot*.07)),(.65,.018,.012),'e9-dark',0)
        box('Service door pull',(x+.51,-.66,z-.2),(.05,.035,.18),'e9-dark',0)
        box('Crown access lid',(x,0,height+.015),(1.34,.95,.03),'e9-body',0)
        box('Crown recessed grip',(x,.15,height+.033),(.28,.04,.006),'e9-trim',0)
        box('Captive status lamp',(x+.48,-.655,height-.15),(.1,.012,.035),'e9-violet',0)
    for side in (-1,1):
        points=[(side*2.16,.45,height+.045),(side*1.5,.16,height+.055),(side*.8,-.2,height+.045),(side*.35,-.55,height*.85)]
        tube('Rooted crown conduit',points,.055,'e9-dark',6)
        # A sparse luminous seam stays distinct from the root body.
        tube('Violet root seam',[(x,y-.025,z+.018) for x,y,z in points],.009,'e9-violet',4)


def pump_skid():
    asset('pump-skid')
    chassis(3.5, 1.3, .9)
    for x in [-.83, .83]:
        cylinder('Horizontal pump motor', (x, -.12, .44), .285, .76, 'e9-body', 'Y', 12)
        cylinder('Pump service face', (x, -.53, .44), .287, .075, 'e9-ceramic', 'Y', 12)
        ring('Pump face gasket', (x, -.579, .44), .22, .025)
        cylinder('Recessed pump centre', (x, -.58, .44), .146, .02, 'e9-dark', 'Y', 16, 0)
        for offset in [-.27, .27]:
            box('Vibration mount foot', (x + offset, -.08, .17), (.14, .86, .10), 'e9-trim', .02)
        cylinder('Pump crown outlet', (x, -.03, .77), .10, .15, 'e9-trim')
    tube('Shared lower return', [(-1.46, -.35, .25), (-1.46, -.49, .16), (1.46, -.49, .16), (1.46, -.35, .25)], .065, 'e9-trim')
    instrument(0, -.56, .66, 'e9-green', .25, .15)
    box('Pump row designation', (0, -.535, .40), (.24, .04, .17), 'e9-ceramic', .018)


def pipe_manifold():
    asset('pipe-manifold')
    box('Manifold skid', (0, 0, .055), (3.2, .7, .11), 'e9-dark')
    box('Mounted backing panel', (0, .24, .47), (3.12, .17, .86), 'e9-body')
    cylinder('Continuous return manifold', (0, -.03, .46), .145, 2.92, 'e9-trim', 'X', 16)
    for x in [-1.23, 0, 1.23]:
        cylinder('Service elbow upright', (x, -.03, .66), .085, .34, 'e9-body')
        cylinder('Valve bonnet', (x, -.17, .70), .12, .18, 'e9-ceramic', 'Y', 12)
        ring('Open valve wheel', (x, -.29, .70), .145, .022, 'e9-trim')
        for angle in [0, math.pi / 2]:
            obj = box('Valve wheel spoke', (x, -.29, .70), (.24, .022, .023), 'e9-trim', .005)
            obj.rotation_euler[1] = angle
        cylinder('Saddle fixing', (x, .06, .20), .12, .13, 'e9-body')
    instrument(.59, -.105, .72, 'e9-cyan', .22, .12)


def cargo_bank(name, height):
    asset(name)
    chassis(3.2, 1.3, height)
    for x in [-1.03, 0, 1.03]:
        box('Restraint locker cassette', (x, -.16, height * .49), (.91, .78, height * .66), 'e9-body', .03)
        box('Ceramic load panel', (x, -.57, height * .49), (.72, .055, height * .49), 'e9-ceramic', .025)
        box('Load strap restraint', (x, -.61, height * .49), (.11, .035, height * .56), 'e9-dark', .012)
        box('Captive strap ratchet', (x, -.626, height * .51), (.22, .045, .16), 'e9-trim', .018)
        for side in [-1, 1]:
            cylinder('Deck tiedown socket', (x + side * .33, -.46, .17), .07, .055, 'e9-trim', 'Z', 12)
    instrument(-1.10, -.615, height - .20, 'e9-amber', .19, .09)


def service_bay(name, reactor=False):
    asset(name)
    chassis(3.5, 1.2, .9)
    chassis_parts = set(CURRENT.children)
    if reactor:
        for x in [-1.15, 0, 1.15]:
            box('Feed regulator ceramic cassette', (x, -.19, .46), (.91, .79, .60), 'e9-ceramic', .035)
            box('Expansion socket inset', (x, -.61, .46), (.72, .045, .42), 'e9-dark', .02)
            for slot in range(4):
                box('Regulator heat fin', (x + (slot - 1.5) * .16, -.638, .46), (.075, .04, .32), 'e9-trim', .01)
            box('Human reactor status line', (x, -.645, .70), (.39, .025, .035), 'e9-amber', .006)
        instrument(0, -.67, .23, 'e9-cyan', .23, .11)
    else:
        for x in [-1.10, 1.10]:
            box('Shield coil cassette', (x, -.17, .45), (1.03, .79, .61), 'e9-body', .035)
            box('Ceramic coil end shield', (x, -.60, .45), (.82, .055, .47), 'e9-ceramic', .028)
            cylinder('Recessed shielding coupler', (x, -.64, .45), .18, .03, 'e9-dark', 'Y', 20, 0)
            ring('Shield coil collar', (x, -.664, .45), .17, .022)
            ring('Violet coupler charge', (x, -.671, .45), .113, .012, 'e9-violet', segments=12)
        box('Central diagnostic plate', (0, -.19, .45), (.84, .79, .61), 'e9-ceramic')
        instrument(0, -.624, .52, 'e9-cyan', .42, .20)
        box('Guarded physical isolator', (0, -.63, .27), (.25, .055, .10), 'e9-dark', .018)
    for obj in CURRENT.children:
        if obj not in chassis_parts:
            obj.location.y += .105


def cable_tray():
    asset('cabletray-open-cover')
    box('Cable tray bottom', (0, 0, .012), (3, .8, .024), 'e9-dark', .005)
    for y in [-.38, .38]:
        box('Flush tray edge', (0, y, .059), (3, .04, .082), 'e9-trim', .008)
    for x in [-1.47, 1.47]:
        box('Tray end', (x, 0, .055), (.06, .76, .08), 'e9-body', .009)
    for y in [-.23, -.07, .10, .24]:
        tube('Visible sleeved cable', [(-1.39, y, .048), (-.54, y + .015, .050), (.36, y - .012, .048), (1.39, y, .048)], .024, 'e9-body', 6)
        box('Cable bridge clamp', (.40, y, .074), (.06, .075, .025), 'e9-trim', .004)
    box('Slid-open service lid', (-.88, 0, .089), (1.12, .69, .018), 'e9-ceramic', .004)
    box('Recessed lid grip', (-.88, 0, .099), (.25, .11, .002), 'e9-dark', 0)


def drain_grating():
    asset('drainage-grating')
    box('Wet channel bed', (0, 0, .012), (3, 1, .024), 'e9-dark', .005)
    for y in [-.475, .475]:
        box('Drain edge frame', (0, y, .066), (3, .05, .108), 'e9-body', .009)
    for x in [-1.47, 1.47]:
        box('Drain end frame', (x, 0, .066), (.06, .90, .108), 'e9-body', .009)
    for y in [-.25, .25]:
        cylinder('Visible pipe below grating', (0, y, .048), .030, 2.86, 'e9-trim', 'X', 10, 0)
    for i in range(15):
        box('Drain grating rib', (-1.34 + i * .192, 0, .105), (.055, .88, .03), 'e9-trim', .005)
    box('Removable inspection crosspiece', (.04, 0, .106), (2.8, .052, .028), 'e9-body', .005)


def bottom_origin(group):
    """Only new hanging assets use this: their lowest metal point is local Z0."""
    bpy.context.view_layer.update()
    low = min((obj.matrix_world @ Vector(corner)).z
              for obj in group.children for corner in obj.bound_box)
    for obj in group.children:
        obj.location.z -= low
    group['mount'] = 'overhead; renderer places bottom at approximately 5m'
    group['floorCollider'] = False


def cargo_hoist_header():
    group = asset('cargo-hoist-header')
    # A deep fabricated beam, with broad upper inspection panels, carries a
    # travelling motor/drum and a genuine curved forged hook below it.
    box('Hoist lower structural flange', (0, 0, 1.355), (6, 1.30, .13), 'e9-body', .035)
    box('Hoist deep continuous web', (0, .18, 1.62), (5.84, .48, .48), 'e9-body', .035)
    box('Hoist broad upper flange', (0, 0, 1.925), (6, 1.50, .15), 'e9-trim', .035)
    for x in (-2.13, 0, 2.13):
        box('Hoist top hatch dark reveal', (x, -.01, 2.008), (1.74, 1.18, .016), 'e9-dark', 0)
        box('Hoist broad ceramic inspection cover', (x, -.01, 2.026), (1.57, 1.02, .025), 'e9-ceramic', 0)
        box('Hoist hatch inset lifting eye', (x, .22, 2.042), (.39, .10, .009), 'e9-dark', 0)
        for side in (-1, 1):
            cylinder('Hoist top captive fixing', (x+side*.61, -.36, 2.044), .027, .012,
                     'e9-trim', 'Z', 8, 0)
    for x in (-2.76, 2.76):
        box('Hoist end mounting cheek', (x, 0, 1.63), (.22, 1.39, .58), 'e9-body', .030)
        box('Hoist end inset ceramic plate', (x, -.709, 1.65), (.15, .023, .34), 'e9-ceramic', 0)
    for x in (-1.86, 1.86):
        box('Hoist front maintenance recess', (x, -.287, 1.62), (1.07, .026, .27), 'e9-dark', 0)
        box('Hoist sparse amber ready lamp', (x, -.308, 1.64), (.29, .010, .037), 'e9-amber', 0)
    # Keep the upper winding motor exposed to the gameplay camera, rather
    # than describing the hoist only through a hidden underside drum.
    for obj in group.children:
        obj.location.z -= .16
    cylinder('Visible upper hoist winding motor', (.36, -.15, 1.91), .24, 1.05,
             'e9-body', 'X', 24)
    for x in (-.195, .915):
        cylinder('Upper winding motor machined end', (x, -.15, 1.91), .25, .060,
                 'e9-trim', 'X', 24)
    box('Upper motor amber status recess', (.36, -.15, 2.156), (.46, .18, .018), 'e9-dark', 0)
    box('Upper motor sparse amber source', (.36, -.15, 2.169), (.24, .060, .010), 'e9-amber', 0)
    box('Travelling hoist carriage', (.36, -.06, 1.28), (1.32, 1.06, .23), 'e9-ceramic', .035)
    for x in (-.12, .84):
        cylinder('Captured carriage wheel', (x, -.53, 1.32), .14, .13, 'e9-body', 'Y', 16)
    cylinder('Hoist cable winding drum', (.36, -.39, 1.06), .24, .87, 'e9-body', 'X', 20)
    for x in (-.105, .825):
        cylinder('Drum machined end flange', (x, -.39, 1.06), .275, .055, 'e9-trim', 'X', 20)
    for y in (-.64, -.53):
        cylinder('Taut captive suspension cable', (.46, y, .91), .022, .30,
                 'e9-dark', 'Z', 8, 0)
    cylinder('Hook upper swivel', (.46, -.60, .78), .104, .17, 'e9-trim', 'Z', 16)
    # A J-shaped forged throat, rather than a straight hanging pin.
    tube('Large forged cargo hook', [(.46, -.60, .78), (.48, -.60, .43),
         (.62, -.60, .17), (.42, -.60, .06), (.05, -.60, .10),
         (-.12, -.60, .35), (.05, -.60, .56)], .14, 'e9-trim', 12)
    bar = box('Hook sprung safety latch', (.25, -.60, .63), (.40, .060, .040), 'e9-body', .008)
    bar.rotation_euler[1] = -.18
    # Captured power loom follows the beam and drops only at its own motor.
    tube('Hoist captured electrical loom', [(-2.61, .42, 1.77), (-1.49, .42, 1.76),
         (-.18, .42, 1.73), (.47, .37, 1.51), (.51, .28, 1.25)], .035, 'e9-dark')
    bottom_origin(group)


def workshop_tool_bridge():
    group = asset('workshop-tool-bridge')
    box('Tool bridge continuous spine', (0, .10, .89), (6, .62, .29), 'e9-body', .035)
    for y in (-.675, .675):
        box('Tool bridge captive carriage rail', (0, y, 1.045), (6, .15, .16), 'e9-trim', .028)
    for x in (-2.85, 2.85):
        box('Tool bridge broad end saddle', (x, 0, .95), (.30, 1.50, .42), 'e9-body', .035)
        box('End saddle ceramic top plate', (x, 0, 1.17), (.22, 1.26, .035), 'e9-ceramic', 0)
    for index, x in enumerate((-1.82, 0, 1.82)):
        box('Independent tool carriage shoe', (x, 0, .895), (1.34, 1.31, .18), 'e9-dark', .030)
        box('Three shaped ceramic carriage housings', (x, -.02, .997), (1.14, 1.15, .10), 'e9-ceramic', .030)
        cylinder('Exposed rounded spindle motor upper face', (x, -.23, 1.005), .225, .83,
                 'e9-body', 'X', 20)
        for side in (-1, 1):
            cylinder('Spindle motor service end cap', (x+side*.44, -.23, 1.005), .227, .05,
                     'e9-trim', 'X', 20)
        box('Motor top inset status recess', (x, -.24, 1.235), (.44, .16, .018), 'e9-dark', 0)
        box('Sparse motor amber status source', (x, -.24, 1.248), (.20, .052, .009), 'e9-amber', 0)
        # Three unlike working ends make the purpose legible from the sides too.
        cylinder('Hanging tool spindle neck', (x, -.27, .625), .115, .35, 'e9-trim', 'Z', 16)
        if index == 0:
            cylinder('Broad cutter head', (x, -.27, .30), .235, .23, 'e9-body', 'Z', 20)
            cylinder('Cutter machined lower flange', (x, -.27, .169), .27, .055, 'e9-trim', 'Z', 20)
            for side in (-1, 1):
                box('Captive cutting insert', (x+side*.14, -.27, .11), (.075, .26, .067), 'e9-ceramic', .012)
        elif index == 1:
            box('Fork press tool shoulder', (x, -.27, .41), (.65, .46, .18), 'e9-body', .025)
            for side in (-1, 1):
                box('Open fork press jaw', (x+side*.25, -.27, .21), (.15, .42, .36), 'e9-trim', .022)
            box('Fork press contained punch', (x, -.27, .20), (.09, .13, .30), 'e9-ceramic', .014)
        else:
            cylinder('Precision drive collet', (x, -.27, .29), .175, .36, 'e9-body', 'Z', 16)
            for z in (.15, .29, .43):
                ring('Machined tool collet race', (x, -.27, z), .185, .025, 'e9-trim', 'Z', 20)
            cylinder('Captured narrow driver', (x, -.27, .055), .065, .12, 'e9-trim', 'Z', 12)
        for side in (-1, 1):
            cylinder('Carriage front captive wheel', (x+side*.44, -.63, .88), .075, .075,
                     'e9-body', 'Y', 12)
    for offset in (-.07, 0, .07):
        tube('Continuous captive upper cable bundle', [(-2.64, .43+offset, 1.08),
             (-1.82, .45+offset, 1.13), (-.87, .43+offset, 1.10),
             (0, .45+offset, 1.13), (.90, .43+offset, 1.10),
             (1.82, .45+offset, 1.13), (2.64, .43+offset, 1.08)], .029, 'e9-dark')
    for x in (-2.60, -.90, .90, 2.60):
        box('Cable bundle retained bridge clamp', (x, .43, 1.12), (.09, .32, .10), 'e9-trim', .018)
    bottom_origin(group)


def upward_fan_blade(x, y, z, angle, radius):
    """Original swept impeller vane, with a broad curved face and real depth."""
    outline = []
    for r, turn in ((.16,.02),(.46,.02),(.57,.21),(.54,.48),(.36,.53),(.16,.30)):
        theta=angle+turn
        outline.append((x+radius*r/.57*math.cos(theta),y+radius*r/.57*math.sin(theta)))
    vertices=[(px,py,z+dz) for dz in (-.021,.021) for px,py in outline]
    count=len(outline)
    faces=[tuple(reversed(range(count))),tuple(range(count,count*2))]
    faces.extend((i,(i+1)%count,(i+1)%count+count,i+count) for i in range(count))
    mesh=bpy.data.meshes.new('Swept fan impeller blade')
    mesh.from_pydata(vertices,[],faces);mesh.update()
    obj=bpy.data.objects.new('Swept stopped fan impeller blade',mesh)
    bpy.context.collection.objects.link(obj)
    return finish(obj,'e9-trim',.012)


def airway_exchanger():
    group=asset('airway-exchanger')
    box('Air exchanger captive lower pan', (0,0,.075), (4.8,2,.15), 'e9-dark', .035)
    for y in (-.92,.92):
        box('Exchanger long structural sidewall', (0,y,.37), (4.8,.16,.59), 'e9-body', .030)
    for x in (-2.32,2.32):
        box('Exchanger structural end cap', (x,0,.37), (.16,1.75,.59), 'e9-body', .030)
    for index,x in enumerate((-1.55,0,1.55)):
        plate=box('Upward-facing exchanger mouth panel', (x,0,.665), (1.43,1.72,.10), 'e9-ceramic', 0)
        bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.565,depth=.34,location=(x,0,.665))
        cutter=bpy.context.object
        modifier=plate.modifiers.new('Real upward air intake aperture','BOOLEAN')
        modifier.operation,modifier.object='DIFFERENCE',cutter
        bpy.context.view_layer.objects.active=plate
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        bpy.data.objects.remove(cutter,do_unlink=True)
        modifier=plate.modifiers.new('Soft manufactured intake panel edge','BEVEL')
        modifier.width,modifier.segments=.025,1
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        cylinder('Deep upward fan throat', (x,0,.215), .54,.035, 'e9-dark','Z',32,0)
        ring('Fat round upward fan mouth', (x,0,.72), .625,.075, 'e9-trim','Z',32)
        ring('Fan mouth inner black gasket', (x,0,.665), .555,.020, 'e9-dark','Z',32)
        for blade in range(5):
            upward_fan_blade(x,0,.43,blade*math.pi*2/5,.48)
        cylinder('Upward stationary impeller hub', (x,0,.465), .125,.10, 'e9-body','Z',20)
        cylinder('Impeller hub pale machined crown', (x,0,.522), .088,.018, 'e9-ceramic','Z',16)
        for side in (-1,1):
            cylinder('Exchanger top captive fastening', (x+side*.59,.68,.731), .027,.014,
                     'e9-trim','Z',8,0)
    roots=[
        [(-2.22,.77,.69),(-1.70,.65,.77),(-.91,.69,.74),(-.46,.50,.77),(.12,.64,.72)],
        [(2.20,-.72,.67),(1.72,-.65,.77),(.96,-.72,.73),(.50,-.52,.78),(-.20,-.66,.72)],
    ]
    for path in roots:
        tube('Heavy roots captured across exchanger frame', path,.115,'e9-dark')
        tube('Exchanger violet root vessel',[(x,y-.025,z+.047) for x,y,z in path],.020,'e9-violet',6)
    for x,y,z in ((-.82,.67,.80),(.75,-.68,.79),(2.12,.65,.73)):
        sphere('Rooted exchanger cyst shell',(x,y,z),(.24,.19,.14),'e9-dark',2)
        sphere('Exchanger violet cyst opening',(x+.018,y-.018,z+.115),(.085,.070,.045),'e9-violet',2)
    bottom_origin(group)


def merge_finishes(group):
    buckets = {}
    for obj in list(group.children):
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        buckets.setdefault(obj.data.materials[0].name, []).append(obj)
    for role, objects in buckets.items():
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        if len(objects) > 1:
            bpy.ops.object.join()
        obj = bpy.context.object
        obj.name = group.name + '--' + role
        obj.parent = group
        obj['finish'] = role


def bake_ao(group):
    """Bake eight geometric hemisphere rays into a stock COLOR_0 multiplier."""
    vertices, polygons = [], []
    for obj in group.children:
        offset = len(vertices)
        vertices.extend(tuple(vertex.co) for vertex in obj.data.vertices)
        polygons.extend(tuple(offset + i for i in polygon.vertices) for polygon in obj.data.polygons)
    tree = BVHTree.FromPolygons(vertices, polygons, epsilon=.0001)
    for obj in group.children:
        mesh = obj.data
        colors = mesh.color_attributes.new(name='AO', type='BYTE_COLOR', domain='CORNER')
        mesh.color_attributes.active_color = colors
        mesh.color_attributes.render_color_index = 0
        emitter = obj.data.materials[0].name in ('e9-cyan', 'e9-amber', 'e9-violet', 'e9-green')
        values = []
        for vertex in mesh.vertices:
            if emitter:
                values.append(1)
                continue
            normal = vertex.normal.normalized()
            tangent = normal.cross(Vector((0, 0, 1)))
            if tangent.length < .01:
                tangent = normal.cross(Vector((0, 1, 0)))
            tangent.normalize()
            side = normal.cross(tangent).normalized()
            occlusion = 0
            for sample in range(8):
                radius, angle = math.sqrt((sample + .5) / 8), sample * 2.399963229728653
                direction = (tangent * (radius * math.cos(angle)) + side * (radius * math.sin(angle)) + normal * math.sqrt(1 - radius * radius)).normalized()
                hit, _, _, distance = tree.ray_cast(vertex.co + normal * .006, direction, .45)
                if hit is not None:
                    occlusion += (1 - distance / .45) * .70
            values.append(max(.48, 1 - occlusion / 8))
        for loop in mesh.loops:
            value = values[loop.vertex_index]
            colors.data[loop.index].color = (value, value, value, 1)
        mesh.update()


def export_pack():
    models = []
    for group in ASSETS:
        merge_finishes(group)
        bake_ao(group)
        bake_craft(group)
        points = [obj.matrix_world @ Vector(corner) for obj in group.children for corner in obj.bound_box]
        lo = [min(p[i] for p in points) for i in range(3)]
        hi = [max(p[i] for p in points) for i in range(3)]
        triangles = 0
        for obj in group.children:
            obj.data.calc_loop_triangles()
            triangles += len(obj.data.loop_triangles)
        models.append({'name': group.name, 'dimensions': [round(hi[0] - lo[0], 4), round(hi[2] - lo[2], 4), round(hi[1] - lo[1], 4)],
                       'bounds': {'min': [round(lo[0], 4), round(lo[2], 4), round(-hi[1], 4)],
                                  'max': [round(hi[0], 4), round(hi[2], 4), round(-lo[1], 4)]},
                       'triangles': triangles, 'materials': sorted({obj.data.materials[0].name for obj in group.children}),
                       'primitives': len(group.children)})
        if group.get('mount'):
            models[-1]['mount']='overhead; bottom approximately 5m above deck'
            models[-1]['floorCollider']=False
    import sys
    sys.path.insert(0, str(ROOT / 'tools/assets/p11-set-pieces'))
    from normal_atlas import bake_normal_atlas
    normal_bake = bake_normal_atlas(ASSETS, OUT / 'industrial-normal.png', size=512)
    bpy.ops.object.select_all(action='DESELECT')
    for group in ASSETS:
        group.select_set(True)
        for obj in group.children:
            obj.select_set(True)
    path = OUT / 'kit.glb'
    temporary = OUT / 'kit.next.glb'
    bpy.ops.export_scene.gltf(filepath=str(temporary), export_format='GLB', use_selection=True,
                             export_yup=True, export_apply=True, export_extras=True,
                             export_materials='EXPORT', export_vertex_color='ACTIVE',
                             export_all_vertex_colors=False, export_animations=False,
                             export_texcoords=True, export_cameras=False, export_lights=False)
    temporary.replace(path)
    manifest = {'name': 'Containment original industrial ship kit', 'license': 'MIT',
                'author': 'Containment contributors', 'source': str(Path(__file__).relative_to(ROOT)),
                'rebuild': 'blender -b --factory-startup -P tools/assets/e9-ship-kit/industrial.py',
                'coordinateSystem': 'glTF Y-up, metres; named group origins bottom-centred',
                'description': 'Original low-cutaway ship machinery, embedded infestation, flush access surfaces and overhead hoist/tool/exchanger landmarks; no external source art.',
                'ao': 'Eight deterministic BVH hemisphere rays per vertex, .45m range; baked BYTE_COLOR AO exported as COLOR_0',
                'materials': PALETTE, 'models': models,
                'output': {'file': path.name, 'bytes': path.stat().st_size,
                           'triangles': sum(model['triangles'] for model in models),
                           'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}}
    manifest['normalAtlas'] = normal_bake
    manifest['craft'] = 'P11 single-facet industrial chamfers; sub-centimetre hardware stays crisp; deterministic convex wear and concave grime multiply original vertex AO, excluding emissive/glass/deck finishes.'
    (OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    (OUT / 'LICENSE.txt').write_text((ROOT / 'LICENSE').read_text())
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'industrial.blend'))
    print('E9_INDUSTRIAL_EXPORT ' + json.dumps(manifest['output']))


def preview(whole_pack=False):
    for index, group in enumerate(ASSETS):
        if whole_pack:
            group.location = ((index % 3 - 1) * 5.8, (1.5 - index // 3) * 3.4, 0)
        for obj in group.children:
            obj.hide_render = False if whole_pack else group.name != 'swarm-plenum-low'
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = (1920, 1080) if whole_pack else (1280, 720)
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.world.color = (.035, .045, .055)
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.012))
    ground = bpy.data.materials.new('PREVIEW ONLY neutral floor')
    ground.diffuse_color = (.045, .058, .067, 1)
    bpy.context.object.data.materials.append(ground)
    for location, power, size in [((2, -5, 7), 1350, 5), ((-5, -1, 3), 700, 4), ((1, 5, 6), 1400, 4)]:
        light = bpy.data.lights.new('PREVIEW ONLY softbox', 'AREA')
        light.energy, light.shape, light.size = power * (5 if whole_pack else 1), 'DISK', size * (3 if whole_pack else 1)
        obj = bpy.data.objects.new(light.name, light)
        bpy.context.collection.objects.link(obj)
        obj.location = tuple(v * 2.7 for v in location) if whole_pack else location
        obj.rotation_euler = (Vector((0, 0, .45)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
    data = bpy.data.cameras.new('PREVIEW ONLY camera')
    camera = bpy.data.objects.new(data.name, data)
    bpy.context.collection.objects.link(camera)
    camera.location = (15, -23, 24) if whole_pack else (6, -9, 6)
    camera.rotation_euler = (Vector((0, 0, .40)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    data.type, data.ortho_scale = 'ORTHO', 26 if whole_pack else 6.4
    scene.camera = camera
    scene.render.filepath = str(OUT / ('kit-preview.png' if whole_pack else 'hero-preview.png'))
    bpy.ops.render.render(write_still=True)


def preview_overheads():
    """Three separate asset-art views, after export; no stage enters the GLB."""
    scene=bpy.context.scene
    scene.render.engine='CYCLES'
    scene.cycles.samples=20
    scene.cycles.use_denoising=True
    scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'
    scene.world.color=(.045,.055,.065)
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.018))
    ground=bpy.data.materials.new('PREVIEW ONLY neutral slate deck')
    ground.use_nodes=True
    ground.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.025,.038,.048,1)
    ground.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.87
    bpy.context.object.data.materials.append(ground)
    for location,power,size in (((3,-5,8),1500,6),((-5,-1,5),900,5),((1,6,8),1700,5)):
        light=bpy.data.lights.new('PREVIEW ONLY softbox','AREA')
        light.energy,light.shape,light.size=power,'DISK',size
        obj=bpy.data.objects.new(light.name,light)
        bpy.context.collection.objects.link(obj)
        obj.location=location
        obj.rotation_euler=(Vector((0,0,.7))-obj.location).to_track_quat('-Z','Y').to_euler()
    data=bpy.data.cameras.new('PREVIEW ONLY overhead review camera')
    camera=bpy.data.objects.new(data.name,data)
    bpy.context.collection.objects.link(camera)
    camera.location=(5.8,-7.5,10.5)
    camera.rotation_euler=(Vector((0,0,.7))-camera.location).to_track_quat('-Z','Y').to_euler()
    data.type='ORTHO'
    scene.camera=camera
    for name,scale in (('cargo-hoist-header',8.7),('workshop-tool-bridge',7.6),('airway-exchanger',6.3)):
        data.ortho_scale=scale
        target=Vector((0,0,1.12 if name=='cargo-hoist-header' else .7))
        camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
        for group in ASSETS:
            for obj in group.children:
                obj.hide_render=group.name!=name
        for width,height,suffix in ((1920,1080,''),(480,270,'-480')):
            scene.render.resolution_x,scene.render.resolution_y=width,height
            scene.render.filepath=str(OUT/(name+'-preview'+suffix+'.png'))
            bpy.ops.render.render(write_still=True)


plenum('swarm-plenum-low', .95)
plenum('swarm-plenum-tall', 1.7)
if '--hero-only' not in sys.argv:
    pump_skid()
    pipe_manifold()
    cargo_bank('cargo-restraintbank', .9)
    cargo_bank('cargo-restraintbank-tall', 1.7)
    service_bay('shielding-servicebay')
    service_bay('reactor-servicebay', True)
    cable_tray()
    drain_grating()
    cargo_hoist_header()
    workshop_tool_bridge()
    airway_exchanger()
export_pack()
if '--preview' in sys.argv or '--preview-pack' in sys.argv:
    preview('--preview-pack' in sys.argv)

if '--preview-overheads' in sys.argv:
    preview_overheads()
