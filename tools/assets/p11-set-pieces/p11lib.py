"""P11 shared modelling library: original industrial craft primitives for Containment.

Blender Z-up metres. Runtime is glTF Y-up; an asset's front faces Blender -Y
(glTF +Z, the camera side). Every asset is bottom-centred at the origin.

Runtime contract (src/render/world/OriginalShipKitAssets.ts): stock PBR materials
with *names* (finishes), no textures, a COLOR_0 attribute that multiplies base
colour. Instances merge by finish across all packs, so a finish name must always
carry the same material parameters. This library writes:

* ``AO`` corner colours = hemisphere AO (BVH + ground plane) x curvature
  (convex edges lifted / worn, concave creases darkened) x floor grime x a
  deterministic per-part value jitter. Emissive and glass finishes stay white.
* ``p11-tint`` / ``p11-tint-metal`` finishes have a white base colour; the part
  colour is carried in the vertex colour so labels, drawings, cables and
  stencils of any hue share one draw.

MIT, repository LICENSE. No downloaded meshes or textures.
"""
from __future__ import annotations

import hashlib
import json
import math
import random
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector, noise
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[3]

# Finish palette. e9-* values are identical to tools/assets/e9-ship-kit so the
# runtime merges P11 parts into the existing finish batches (no extra draws).
PALETTE = {
    'e9-body': '#24343c', 'e9-ceramic': '#d5ded3', 'e9-trim': '#8faaa8',
    'e9-dark': '#0e1820', 'e9-cyan': '#65d8e6', 'e9-amber': '#e0b95a',
    'e9-green': '#71c793', 'e9-violet': '#b286d1', 'e9-yellow': '#c3ab59',
    'e9-glass': '#9dcad1',
    # P11 finishes (not recoloured per room).
    'p11-steel': '#6c7a7c',        # bare worn structural steel
    'p11-rubber': '#16191b',       # hoses, cable jackets, gaskets
    'p11-tint': '#ffffff',         # colour from vertex colour (paint, labels)
    'p11-tint-metal': '#ffffff',   # painted metal, colour from vertex colour
    'p11-screen': '#9fe8ff',       # friendly-tech screens (cyan-white)
    'p11-frost': '#d6eaf0',        # frost crust / condensation
    'p11-growth': '#3a2c38',       # alien growth hide (dark mauve)
    'p11-flesh': '#6e5266',        # wet growth membrane (muted mauve)
    'p11-bio': '#9dff5a',          # alien bioluminescence (toxic green)
    'p11-bio-violet': '#cf8cff',   # alien bioluminescence (magenta-violet)
}
EMISSIVE = {
    'e9-cyan': 2.4, 'e9-amber': 2.4, 'e9-green': 2.4, 'e9-violet': 2.4,
    'p11-screen': 1.6, 'p11-bio': 2.2, 'p11-bio-violet': 2.0,
}
METALLIC = {'e9-body': .42, 'e9-trim': .42, 'p11-steel': .7, 'p11-tint-metal': .45}
ROUGHNESS = {'e9-trim': .43, 'p11-steel': .42, 'p11-rubber': .88, 'p11-frost': .32,
             'p11-growth': .5, 'p11-flesh': .34, 'e9-glass': .14, 'p11-tint-metal': .5}
WHITE_FINISHES = set(EMISSIVE) | {'e9-glass'}
TINTED = {'p11-tint', 'p11-tint-metal'}

# Reusable, non-saturated label/paint colours for the tint finishes. Saturated
# red/orange is reserved for danger and is deliberately absent.
INK = {
    'paper': '#e4e0d2', 'stencil': '#d9d7c8', 'black': '#151a1c', 'navy': '#22364a',
    'service-blue': '#3f6c8a', 'teal': '#3d7f7a', 'olive': '#6d7550', 'sand': '#b8a77f',
    'hazard': '#c9ac4a', 'mint': '#8fc4a8', 'lilac': '#9a8cb8', 'sky': '#7fb3d6',
    'grey': '#7d8789', 'dark-grey': '#3a4346', 'cream': '#d8ccb0', 'brass': '#a08a55',
    'crayon-blue': '#4f86c9', 'crayon-green': '#5aa25e', 'crayon-yellow': '#e3c44f',
    'crayon-purple': '#8a62b8', 'crayon-pink': '#d58fb2', 'mug-white': '#e9ebe6',
    'mug-blue': '#5e86a6', 'mug-green': '#6f9a7a', 'cushion': '#5c6f7e', 'blanket': '#8a8fa6',
    'wood': '#8a7358', 'wood-dark': '#5e4d3b',
}

MATERIALS: dict[str, bpy.types.Material] = {}
ASSETS: list[bpy.types.Object] = []
BUDGETS: dict[str, int] = {}
CURRENT: bpy.types.Object | None = None
RNG = random.Random(1729)


# --------------------------------------------------------------------------- setup

def linear(hex_color: str) -> tuple[float, float, float]:
    rgb = [int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in rgb)


def srgb(hex_color: str) -> tuple[float, float, float]:
    return tuple(int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5))


def reset_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.curves, bpy.data.cameras, bpy.data.lights):
        for item in list(block):
            block.remove(item)
    MATERIALS.clear()
    ASSETS.clear()
    for name, value in PALETTE.items():
        material = bpy.data.materials.new(name)
        material.use_nodes = True
        rgba = (*linear(value), 1)
        material.diffuse_color = rgba
        shader = material.node_tree.nodes.get('Principled BSDF')
        shader.inputs['Base Color'].default_value = rgba
        shader.inputs['Metallic'].default_value = METALLIC.get(name, .03)
        shader.inputs['Roughness'].default_value = ROUGHNESS.get(name, .60)
        if name in EMISSIVE:
            shader.inputs['Emission Color'].default_value = rgba
            shader.inputs['Emission Strength'].default_value = EMISSIVE[name]
        if name == 'e9-glass':
            shader.inputs['Alpha'].default_value = .24
            material.diffuse_color = (*rgba[:3], .24)
            material.surface_render_method = 'DITHERED'
        if name not in WHITE_FINISHES:
            # Preview-only: show the baked AO/curvature/tint colour attribute in
            # Blender renders. glTF export maps it to COLOR_0 regardless.
            attribute = material.node_tree.nodes.new('ShaderNodeVertexColor')
            attribute.layer_name = 'AO'
            mix = material.node_tree.nodes.new('ShaderNodeMix')
            mix.data_type = 'RGBA'
            mix.blend_type = 'MULTIPLY'
            mix.inputs['Factor'].default_value = 1
            mix.inputs[6].default_value = rgba
            material.node_tree.links.new(attribute.outputs['Color'], mix.inputs[7])
            material.node_tree.links.new(mix.outputs[2], shader.inputs['Base Color'])
        MATERIALS[name] = material


def asset(name: str, budget: int = 1500) -> bpy.types.Object:
    """Start a named, bottom-centred asset group with a triangle budget."""
    global CURRENT
    CURRENT = bpy.data.objects.new(name, None)
    CURRENT.empty_display_type = 'PLAIN_AXES'
    CURRENT['originalAsset'] = True
    CURRENT['license'] = 'MIT'
    bpy.context.collection.objects.link(CURRENT)
    ASSETS.append(CURRENT)
    BUDGETS[name] = budget
    return CURRENT


def _link(mesh: bpy.types.Mesh, name: str, role: str, tint: str | None) -> bpy.types.Object:
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = CURRENT
    mesh.materials.append(MATERIALS[role])
    obj['role'] = role
    if tint:
        obj['tint'] = tint
    return obj


def _bevel(obj: bpy.types.Object, width: float, segments: int = 1, angle: float = 40) -> None:
    if width <= 0:
        return
    modifier = obj.modifiers.new('chamfer', 'BEVEL')
    modifier.width = width
    modifier.segments = segments
    modifier.limit_method = 'ANGLE'
    modifier.angle_limit = math.radians(angle)
    modifier.harden_normals = True
    modifier.miter_outer = 'MITER_ARC' if segments > 1 else 'MITER_SHARP'


def _shade(obj: bpy.types.Object, smooth: bool = True) -> None:
    for polygon in obj.data.polygons:
        polygon.use_smooth = smooth
    if smooth:
        modifier = obj.modifiers.new('weighted', 'WEIGHTED_NORMAL')
        modifier.keep_sharp = True
        modifier.weight = 50


def _apply(obj: bpy.types.Object) -> None:
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(depsgraph)
    mesh = bpy.data.meshes.new_from_object(evaluated, preserve_all_data_layers=True, depsgraph=depsgraph)
    old = obj.data
    obj.modifiers.clear()
    obj.data = mesh
    if old.users == 0:
        bpy.data.meshes.remove(old)


def finish(obj, role='e9-body', bevel=.0, segments=1, smooth=True, tint=None, angle=40):
    """Assign a finish, chamfer hard edges and bake the shading normals."""
    obj.parent = CURRENT
    if not obj.data.materials:
        obj.data.materials.append(MATERIALS[role])
    obj['role'] = role
    if tint:
        obj['tint'] = tint
    _bevel(obj, bevel, segments, angle)
    _shade(obj, smooth)
    _apply(obj)
    return obj


def mesh_object(name, bm, role='e9-body', bevel=0., segments=1, smooth=True, tint=None, angle=40):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = _link(mesh, name, role, tint)
    return finish(obj, role, bevel, segments, smooth, tint, angle)


# ----------------------------------------------------------------- primitives

def _matrix(location=(0, 0, 0), rotation=(0, 0, 0)) -> Matrix:
    return Matrix.Translation(Vector(location)) @ Matrix.Rotation(rotation[2], 4, 'Z') @ \
        Matrix.Rotation(rotation[1], 4, 'Y') @ Matrix.Rotation(rotation[0], 4, 'X')


def box(name, location, size, role='e9-body', bevel=.012, segments=1, rotation=(0, 0, 0), tint=None):
    """Chamfered box. ``size`` is full extent. Bevel is clamped to the part."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    bmesh.ops.transform(bm, matrix=_matrix(location, rotation), verts=bm.verts)
    # Parts thinner than 4cm read as crisp plates at game distance: no chamfer.
    if min(size) < .04:
        bevel = 0
    return mesh_object(name, bm, role, min(bevel, min(size) * .3), segments, tint=tint)


def slab(name, points2d, z0, z1, role='e9-body', bevel=.01, tint=None, segments=1):
    """Extruded polygon (XY outline) between z0 and z1 — for chamfered silhouettes."""
    bm = bmesh.new()
    bottom = [bm.verts.new((x, y, z0)) for x, y in points2d]
    face = bm.faces.new(bottom)
    if face.normal.z > 0:
        face.normal_flip()
    result = bmesh.ops.extrude_face_region(bm, geom=[face])
    top = [v for v in result['geom'] if isinstance(v, bmesh.types.BMVert)]
    for v in top:
        v.co.z = z1
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_object(name, bm, role, bevel, segments, tint=tint)


def profile_x(name, points_yz, x0, x1, role='e9-body', bevel=.008, tint=None):
    """Extrude a YZ profile along X (consoles, wedge bodies, rails)."""
    bm = bmesh.new()
    verts = [bm.verts.new((x0, y, z)) for y, z in points_yz]
    face = bm.faces.new(verts)
    result = bmesh.ops.extrude_face_region(bm, geom=[face])
    for v in [v for v in result['geom'] if isinstance(v, bmesh.types.BMVert)]:
        v.co.x = x1
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_object(name, bm, role, bevel, tint=tint)


def cylinder(name, location, radius, depth, role='e9-trim', axis='Z', vertices=12, bevel=.006,
             radius2=None, rotation=None, tint=None, cap=True, segments=1):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=vertices,
                          radius1=radius, radius2=radius if radius2 is None else radius2, depth=depth)
    if axis == 'X':
        bmesh.ops.rotate(bm, verts=bm.verts, matrix=Matrix.Rotation(math.pi / 2, 3, 'Y'))
    elif axis == 'Y':
        bmesh.ops.rotate(bm, verts=bm.verts, matrix=Matrix.Rotation(math.pi / 2, 3, 'X'))
    if rotation:
        bmesh.ops.transform(bm, matrix=_matrix((0, 0, 0), rotation), verts=bm.verts)
    bmesh.ops.translate(bm, vec=Vector(location), verts=bm.verts)
    if radius < .06 or depth < .03:
        bevel = 0  # small turned parts: crisp edges, fewer triangles
    return mesh_object(name, bm, role, min(bevel, radius * .25, depth * .25), segments, tint=tint, angle=50)


def lathe(name, profile_rz, location=(0, 0, 0), role='e9-body', segments=24, axis='Z', tint=None,
          smooth=True, rotation=None):
    """Revolve an (r, z) profile — tanks, turbine housings, domes, mugs."""
    bm = bmesh.new()
    rings = []
    for i in range(segments):
        a = 2 * math.pi * i / segments
        rings.append([bm.verts.new((r * math.cos(a), r * math.sin(a), z)) for r, z in profile_rz])
    for i in range(segments):
        a, b = rings[i], rings[(i + 1) % segments]
        for j in range(len(profile_rz) - 1):
            quad = [a[j], b[j], b[j + 1], a[j + 1]]
            if len(set(quad)) == 4:
                try:
                    bm.faces.new(quad)
                except ValueError:
                    pass
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    # Close caps where the profile ends off-axis.
    bmesh.ops.holes_fill(bm, edges=bm.edges, sides=segments)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if axis == 'X':
        bmesh.ops.rotate(bm, verts=bm.verts, matrix=Matrix.Rotation(math.pi / 2, 3, 'Y'))
    elif axis == 'Y':
        bmesh.ops.rotate(bm, verts=bm.verts, matrix=Matrix.Rotation(-math.pi / 2, 3, 'X'))
    if rotation:
        bmesh.ops.transform(bm, matrix=_matrix((0, 0, 0), rotation), verts=bm.verts)
    bmesh.ops.translate(bm, vec=Vector(location), verts=bm.verts)
    obj = mesh_object(name, bm, role, 0, tint=tint, smooth=smooth)
    return obj


def torus(name, location, major, minor, role='e9-trim', axis='Z', major_segments=20, minor_segments=6,
          rotation=None, tint=None, arc=2 * math.pi, matrix=None):
    bm = bmesh.new()
    rings = []
    count = major_segments + (0 if arc >= 2 * math.pi - 1e-6 else 1)
    for i in range(count):
        a = arc * i / major_segments
        center = Vector((major * math.cos(a), major * math.sin(a), 0))
        out = Vector((math.cos(a), math.sin(a), 0))
        rings.append([bm.verts.new(center + out * (minor * math.cos(2 * math.pi * j / minor_segments)) +
                                   Vector((0, 0, minor * math.sin(2 * math.pi * j / minor_segments))))
                      for j in range(minor_segments)])
    closed = count == major_segments
    for i in range(major_segments if closed else count - 1):
        a, b = rings[i], rings[(i + 1) % count]
        for j in range(minor_segments):
            bm.faces.new([a[j], b[j], b[(j + 1) % minor_segments], a[(j + 1) % minor_segments]])
    if not closed:
        bm.faces.new(list(reversed(rings[0])))
        bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if axis == 'X':
        bmesh.ops.rotate(bm, verts=bm.verts, matrix=Matrix.Rotation(math.pi / 2, 3, 'Y'))
    elif axis == 'Y':
        bmesh.ops.rotate(bm, verts=bm.verts, matrix=Matrix.Rotation(math.pi / 2, 3, 'X'))
    if rotation:
        bmesh.ops.transform(bm, matrix=_matrix((0, 0, 0), rotation), verts=bm.verts)
    if matrix is not None:
        bmesh.ops.transform(bm, matrix=matrix, verts=bm.verts)
    bmesh.ops.translate(bm, vec=Vector(location), verts=bm.verts)
    return mesh_object(name, bm, role, 0, tint=tint)


def frame(normal) -> tuple[Vector, Vector, Vector]:
    """(right, up, normal) for a face direction string or vector."""
    if isinstance(normal, str):
        normal = {'-Y': (0, -1, 0), 'Y': (0, 1, 0), 'Z': (0, 0, 1), 'X': (1, 0, 0), '-X': (-1, 0, 0)}[normal]
    n = Vector(normal).normalized()
    up_hint = Vector((0, 1, 0)) if abs(n.z) > .9 else Vector((0, 0, 1))
    right = up_hint.cross(n).normalized()
    up = n.cross(right).normalized()
    return right, up, n


def frame_matrix(normal, origin=(0, 0, 0)) -> Matrix:
    right, up, n = frame(normal)
    m = Matrix((right, up, n)).transposed().to_4x4()
    m.translation = Vector(origin)
    return m


def oriented_box(name, matrix, local_center, size, role='e9-body', bevel=.006, tint=None):
    """Box in a local frame (x=right, y=up, z=normal)."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    bmesh.ops.translate(bm, vec=Vector(local_center), verts=bm.verts)
    bmesh.ops.transform(bm, matrix=matrix, verts=bm.verts)
    return mesh_object(name, bm, role, min(bevel, min(size) * .3), tint=tint)


def oriented_quad(name, matrix, cx, cy, w, h, lift, role='p11-tint', tint=None):
    bm = bmesh.new()
    pts = [(cx - w / 2, cy - h / 2, lift), (cx + w / 2, cy - h / 2, lift), (cx + w / 2, cy + h / 2, lift),
           (cx - w / 2, cy + h / 2, lift)]
    bm.faces.new([bm.verts.new(matrix @ Vector(q)) for q in pts])
    return mesh_object(name, bm, role, 0, smooth=False, tint=tint)


def sweep(name, points, radius, role='e9-trim', radial=8, bend=0.0, tint=None, taper=None, closed=False,
          cap=True, twist=0.0):
    """Tube along a polyline. ``bend`` fillets corners with that radius (pipes);
    ``taper`` = (r_start, r_end) for tendrils and cables."""
    pts = [Vector(p) for p in points]
    if bend > 0 and len(pts) > 2:
        filleted = [pts[0]]
        for i in range(1, len(pts) - 1):
            a, b, c = pts[i - 1], pts[i], pts[i + 1]
            d1, d2 = (b - a), (c - b)
            r = min(bend, d1.length * .45, d2.length * .45)
            p0, p1 = b - d1.normalized() * r, b + d2.normalized() * r
            for k in range(6):
                t = k / 5
                filleted.append((1 - t) ** 2 * p0 + 2 * (1 - t) * t * b + t * t * p1)
        filleted.append(pts[-1])
        pts = filleted
    # Remove duplicates.
    clean = [pts[0]]
    for p in pts[1:]:
        if (p - clean[-1]).length > 1e-5:
            clean.append(p)
    pts = clean
    bm = bmesh.new()
    rings = []
    up = Vector((0, 0, 1))
    total = sum((pts[i + 1] - pts[i]).length for i in range(len(pts) - 1)) or 1
    run = 0
    previous_normal = None
    for i, p in enumerate(pts):
        if i == 0:
            tangent = (pts[1] - p).normalized()
        elif i == len(pts) - 1:
            tangent = (p - pts[i - 1]).normalized()
        else:
            tangent = ((p - pts[i - 1]).normalized() + (pts[i + 1] - p).normalized()).normalized()
        if i > 0:
            run += (p - pts[i - 1]).length
        if previous_normal is None:
            reference = up if abs(tangent.dot(up)) < .9 else Vector((1, 0, 0))
            normal = tangent.cross(reference).normalized()
        else:
            normal = (previous_normal - tangent * previous_normal.dot(tangent)).normalized()
        previous_normal = normal
        binormal = tangent.cross(normal).normalized()
        r = radius
        if taper:
            r = taper[0] + (taper[1] - taper[0]) * (run / total)
        scale = 1.0
        if i not in (0, len(pts) - 1) and bend <= 0:
            # Mitre compensation keeps sharp polyline corners full-bore.
            d1 = (p - pts[i - 1]).normalized()
            scale = 1 / max(.5, d1.dot(tangent))
        ring = []
        for j in range(radial):
            a = 2 * math.pi * j / radial + twist * run
            offset = normal * math.cos(a) * r + binormal * math.sin(a) * r
            if scale != 1.0:
                along = offset.dot(tangent)
                offset = offset + tangent * along * (scale - 1)
            ring.append(bm.verts.new(p + offset))
        rings.append(ring)
    segments = len(rings) if closed else len(rings) - 1
    for i in range(segments):
        a, b = rings[i], rings[(i + 1) % len(rings)]
        for j in range(radial):
            bm.faces.new([a[j], b[j], b[(j + 1) % radial], a[(j + 1) % radial]])
    if cap and not closed:
        bm.faces.new(list(reversed(rings[0])))
        bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_object(name, bm, role, 0, tint=tint)


def catenary(a, b, sag, count=10):
    a, b = Vector(a), Vector(b)
    return [a.lerp(b, i / (count - 1)) - Vector((0, 0, sag * 4 * (i / (count - 1)) * (1 - i / (count - 1))))
            for i in range(count)]


# -------------------------------------------------------------- craft details

def bolt(location, radius=.014, axis='-Y', role='e9-trim', height=.008):
    """Hex bolt head facing ``axis`` (default front, -Y)."""
    v = {'X': (1, 0, 0), '-X': (-1, 0, 0), 'Y': (0, 1, 0), '-Y': (0, -1, 0), 'Z': (0, 0, 1)}[axis]
    loc = Vector(location) + Vector(v) * height / 2
    ax = 'X' if 'X' in axis else 'Y' if 'Y' in axis else 'Z'
    return cylinder('Hex bolt', loc, radius, height, role, ax, 6, 0)


def bolt_row(start, end, count, radius=.012, axis='-Y', role='e9-trim'):
    s, e = Vector(start), Vector(end)
    for i in range(count):
        bolt(s.lerp(e, i / max(1, count - 1)), radius, axis, role)


def inset_panel(name, center, width, height, depth=.012, frame=.025, role='e9-body', inner_role='e9-trim',
                axis='-Y', bevel=.004, tint=None, inner_tint=None):
    """A panel set into a surface: dark frame reveal + raised inner plate.
    ``axis`` is the outward normal of the surface ('-Y' front, 'Z' top, 'X', '-X')."""
    c = Vector(center)
    if axis in ('-Y', 'Y'):
        s = 1 if axis == 'Y' else -1
        box(name + ' reveal', c + Vector((0, s * depth * .25, 0)), (width, depth * .5, height), 'e9-dark', .002)
        box(name, c + Vector((0, s * depth * .5, 0)), (width - frame, depth * .7, height - frame), inner_role,
            bevel, tint=inner_tint)
    elif axis in ('X', '-X'):
        s = 1 if axis == 'X' else -1
        box(name + ' reveal', c + Vector((s * depth * .25, 0, 0)), (depth * .5, width, height), 'e9-dark', .002)
        box(name, c + Vector((s * depth * .5, 0, 0)), (depth * .7, width - frame, height - frame), inner_role,
            bevel, tint=inner_tint)
    else:
        box(name + ' reveal', c + Vector((0, 0, depth * .25)), (width, height, depth * .5), 'e9-dark', .002)
        box(name, c + Vector((0, 0, depth * .5)), (width - frame, height - frame, depth * .7), inner_role,
            bevel, tint=inner_tint)


def vent(center, width, height, slats=6, axis='-Y', depth=.03, role='e9-trim'):
    """Louvred vent with real depth: dark cavity, frame and angled blades."""
    c = Vector(center)
    if axis == 'Z':
        box('Vent cavity', c + Vector((0, 0, -depth * .3)), (width, height, depth * .4), 'e9-dark', .002)
        for sx in (-1, 1):
            box('Vent frame', c + Vector((sx * (width / 2 - .008), 0, 0)), (.016, height, depth * .6), role, .003)
        for sy in (-1, 1):
            box('Vent frame', c + Vector((0, sy * (height / 2 - .008), 0)), (width, .016, depth * .6), role, .003)
        pitch = (height - .03) / slats
        for i in range(slats):
            y = -height / 2 + .015 + pitch * (i + .5)
            box('Vent louvre', c + Vector((0, y, -depth * .05)), (width - .03, pitch * .9, .006), role, 0,
                rotation=(math.radians(38), 0, 0))
        return
    s = -1 if axis == '-Y' else 1
    box('Vent cavity', c + Vector((0, -s * depth * .3, 0)), (width, depth * .4, height), 'e9-dark', .002)
    for sx in (-1, 1):
        box('Vent frame', c + Vector((sx * (width / 2 - .008), 0, 0)), (.016, depth * .6, height), role, .003)
    for sz in (-1, 1):
        box('Vent frame', c + Vector((0, 0, sz * (height / 2 - .008))), (width, depth * .6, .016), role, .003)
    pitch = (height - .03) / slats
    for i in range(slats):
        z = -height / 2 + .015 + pitch * (i + .5)
        box('Vent louvre', c + Vector((0, s * depth * .05, z)), (width - .03, .006, pitch * .95), role, 0,
            rotation=(math.radians(-40 * s), 0, 0))


def grille_top(center, width, depth, bars=8, role='e9-trim'):
    """Top-facing exhaust grille: the readable top-down vent."""
    c = Vector(center)
    box('Grille dark well', c + Vector((0, 0, -.01)), (width, depth, .02), 'e9-dark', .002)
    pitch = width / bars
    for i in range(bars):
        x = -width / 2 + pitch * (i + .5)
        box('Grille bar', c + Vector((x, 0, .002)), (pitch * .42, depth - .02, .016), role, .002)


def handle(center, length=.18, axis='X', standoff=.03, radius=.009, role='e9-trim', face='-Y'):
    """Pull handle: bar on two standoffs, projecting along ``face``."""
    c = Vector(center)
    n = frame(face)[2]
    d = Vector((1, 0, 0)) if axis == 'X' else Vector((0, 0, 1)) if axis == 'Z' else Vector((0, 1, 0))
    a, b = c - d * length / 2, c + d * length / 2
    sweep('Handle bar', [a + n * standoff, b + n * standoff], radius, role, 6)
    for p in (a, b):
        sweep('Handle standoff', [p, p + n * standoff], radius * .9, role, 4, cap=False)


def hinge(center, height=.12, radius=.012, role='e9-trim'):
    c = Vector(center)
    cylinder('Hinge knuckle', c, radius, height, role, 'Z', 6, 0)
    cylinder('Hinge pin cap', c + Vector((0, 0, height / 2 + .004)), radius * .7, .008, role, 'Z', 6, 0)


def flange(center, radius, axis='X', thickness=.025, bolts=6, role='e9-trim'):
    c = Vector(center)
    cylinder('Flange', c, radius, thickness, role, axis, 16, .003)
    a = Vector((1, 0, 0)) if axis == 'X' else Vector((0, 1, 0)) if axis == 'Y' else Vector((0, 0, 1))
    u = a.orthogonal().normalized()
    v = a.cross(u).normalized()
    for i in range(bolts):
        t = 2 * math.pi * (i + .5) / bolts
        p = c + (u * math.cos(t) + v * math.sin(t)) * radius * .8
        for s in (-1, 1):
            cylinder('Flange bolt', p + a * s * thickness * .55, radius * .09, thickness * .3, 'e9-dark', axis, 6, 0)


def valve_wheel(center, radius=.09, axis='Z', role='p11-tint-metal', tint='service-blue', stem=.08):
    """Handwheel valve: bonnet, stem, hub, three spokes and rim along ``axis``."""
    c = Vector(center)
    right, up, a = frame(axis)
    sweep('Valve bonnet', [c, c + a * stem * .45], radius * .32, 'e9-trim', 10)
    hub = c + a * stem
    sweep('Valve stem', [c, hub], radius * .1, 'p11-steel', 6)
    m = frame_matrix(axis)
    m.translation = Vector((0, 0, 0))
    torus('Valve rim', hub, radius, radius * .12, role, 'Z', 18, 6, tint=tint, matrix=m)
    for i in range(3):
        t = 2 * math.pi * i / 3 + .3
        sweep('Valve spoke', [hub, hub + (right * math.cos(t) + up * math.sin(t)) * radius], radius * .07, role, 5,
              tint=tint)
    sweep('Valve hub', [hub - a * radius * .1, hub + a * radius * .1], radius * .18, role, 8, tint=tint)


def gauge(center, radius=.05, face='-Y', role='e9-trim', reading=.35):
    """Round pressure gauge: case, bezel, paper dial, needle and safe-band ticks."""
    c = Vector(center)
    right, up, n = frame(face)
    m = frame_matrix(face)
    m.translation = Vector((0, 0, 0))
    sweep('Gauge case', [c, c + n * .03], radius, 'e9-dark', 14)
    torus('Gauge bezel', c + n * .03, radius * .95, radius * .1, role, 'Z', 14, 5, matrix=m)
    sweep('Gauge dial', [c + n * .03, c + n * .033], radius * .84, 'p11-tint', 14, tint='paper')
    angle = math.radians(225 - 270 * reading)
    tip = c + n * .036 + (right * math.cos(angle) + up * math.sin(angle)) * radius * .7
    sweep('Gauge needle', [c + n * .036, tip], radius * .05, 'p11-tint', 4, tint='black')
    for k in range(3):
        a2 = math.radians(160 - 25 * k)
        p = c + n * .035 + (right * math.cos(a2) + up * math.sin(a2)) * radius * .72
        box('Gauge safe tick', p, (radius * .12,) * 3, 'p11-tint', 0, tint='mint')


SEGMENTS = {  # 7-segment-ish stencil glyphs: (x0, y0, x1, y1) in a 0..1 x 0..1.6 cell
    'a': (0, 1.45, 1, 1.6), 'b': (.85, .8, 1, 1.6), 'c': (.85, 0, 1, .8), 'd': (0, 0, 1, .15),
    'e': (0, 0, .15, .8), 'f': (0, .8, .15, 1.6), 'g': (0, .72, 1, .88),
}
GLYPHS = {
    '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc',
    '7': 'abc', '8': 'abcdefg', '9': 'abfgcd', 'A': 'abcefg', 'B': 'fedcg', 'C': 'afed', 'D': 'bcdeg',
    'E': 'afged', 'F': 'afge', 'H': 'fbgec', 'L': 'fed', 'P': 'abfge', 'S': 'afgcd', 'U': 'fedcb', '-': 'g',
    'R': 'efab', 'O': 'abcdef', 'T': 'fge', 'N': 'ecgab', 'I': 'fe', 'Y': 'fgbcd', 'G': 'afedc', 'M': 'abcef',
    'K': 'fegbc', 'V': 'fedcb', 'X': 'fbgec', 'W': 'fedcb', 'Z': 'abged', 'J': 'bcde', 'Q': 'abcdefg',
}


def stencil(text, origin, height=.08, face='-Y', tint='stencil', role='p11-tint', spacing=.35, merge=True):
    """Blocky stencil label as thin geometry on a face. ``origin`` = text centre."""
    cell_w = height / 1.6
    total = len(text) * cell_w * (1 + spacing) - cell_w * spacing
    n = {'-Y': Vector((0, -1, 0)), 'Z': Vector((0, 0, 1)), 'X': Vector((1, 0, 0)), '-X': Vector((-1, 0, 0)),
         'Y': Vector((0, 1, 0))}[face]
    if face == '-Y':
        right, up = Vector((1, 0, 0)), Vector((0, 0, 1))
    elif face == 'Y':
        right, up = Vector((-1, 0, 0)), Vector((0, 0, 1))
    elif face == 'Z':
        right, up = Vector((1, 0, 0)), Vector((0, 1, 0))
    elif face == 'X':
        right, up = Vector((0, 1, 0)), Vector((0, 0, 1))
    else:
        right, up = Vector((0, -1, 0)), Vector((0, 0, 1))
    o = Vector(origin) - right * total / 2 - up * height / 2 + n * .0015
    bm = bmesh.new()
    for i, ch in enumerate(text.upper()):
        base = o + right * i * cell_w * (1 + spacing)
        for seg in GLYPHS.get(ch, ''):
            x0, y0, x1, y1 = SEGMENTS[seg]
            s = height / 1.6
            quad = [base + right * x0 * s + up * y0 * s, base + right * x1 * s + up * y0 * s,
                    base + right * x1 * s + up * y1 * s, base + right * x0 * s + up * y1 * s]
            bm.faces.new([bm.verts.new(q) for q in quad])
    for f in bm.faces:
        if f.normal.dot(n) < 0:
            f.normal_flip()
    return mesh_object('Stencil ' + text, bm, role, 0, smooth=False, tint=tint)


def decal_quad(name, center, width, height, face='-Y', tint='paper', role='p11-tint', rotation=0.0, lift=.0015):
    n = {'-Y': Vector((0, -1, 0)), 'Z': Vector((0, 0, 1)), 'X': Vector((1, 0, 0)), '-X': Vector((-1, 0, 0)),
         'Y': Vector((0, 1, 0))}[face]
    if face in ('-Y', 'Y'):
        right, up = Vector((1, 0, 0)), Vector((0, 0, 1))
    elif face == 'Z':
        right, up = Vector((1, 0, 0)), Vector((0, 1, 0))
    else:
        right, up = Vector((0, 1, 0)), Vector((0, 0, 1))
    r = Matrix.Rotation(rotation, 3, n)
    right, up = r @ right, r @ up
    c = Vector(center) + n * lift
    bm = bmesh.new()
    pts = [c - right * width / 2 - up * height / 2, c + right * width / 2 - up * height / 2,
           c + right * width / 2 + up * height / 2, c - right * width / 2 + up * height / 2]
    f = bm.faces.new([bm.verts.new(p) for p in pts])
    if f.normal.dot(n) < 0:
        f.normal_flip()
    return mesh_object(name, bm, role, 0, smooth=False, tint=tint)


def hazard_band(center, width, height, face='-Y', stripes=6, tint='hazard'):
    """Diagonal hazard chevrons on a dark backing (muted yellow, never red)."""
    c = Vector(center)
    decal_quad('Hazard band backing', c, width, height, face, 'black')
    pitch = width / stripes
    for i in range(stripes):
        off = -width / 2 + pitch * (i + .5)
        if face in ('-Y', 'Y'):
            p = c + Vector((off, 0, 0))
        elif face == 'Z':
            p = c + Vector((off, 0, 0))
        else:
            p = c + Vector((0, off, 0))
        decal_quad('Hazard chevron', p, pitch * .45, height * 1.25, face, tint, rotation=math.radians(35), lift=.0025)


def screen(name, center, width, height, face='-Y', pattern='bars', seed=0, bezel=.025, role='p11-screen',
           tilt=0.0):
    """Recessed display: bevelled bezel, dark glass and a distinct emissive glyph
    pattern. Patterns: bars, wave, text, grid, ring, schematic. ``tilt`` leans
    the screen back about its horizontal axis (radians)."""
    rnd = random.Random(sum(map(ord, name)) * 31 + seed)
    m = frame_matrix(face, center)
    if tilt:
        m = m @ Matrix.Rotation(-tilt, 4, 'X')
    t = .014
    for sx in (-1, 1):
        oriented_box(name + ' bezel', m, (sx * (width + bezel) / 2, 0, t / 2), (bezel, height + 2 * bezel, t),
                     'e9-dark', .004)
    for sy in (-1, 1):
        oriented_box(name + ' bezel', m, (0, sy * (height + bezel) / 2, t / 2), (width, bezel, t), 'e9-dark', .004)
    oriented_quad(name + ' glass', m, 0, 0, width, height, .002, 'p11-tint', 'black')
    w, h = width * .9, height * .86

    def glyph(cx, cy, gw, gh):
        oriented_quad(name + ' glyph', m, cx, cy, gw, gh, .004, role)

    if pattern == 'bars':
        count = rnd.randint(7, 11)
        for i in range(count):
            bh = h * rnd.uniform(.2, .85)
            glyph(-w / 2 + w * (i + .5) / count, -h / 2 + bh / 2, w / count * .55, bh)
    elif pattern == 'wave':
        steps = 16
        pts = [(-w / 2 + w * i / (steps - 1), h * .3 * math.sin(i * .9 + seed) * (1.5 if i % 5 == 2 else 1))
               for i in range(steps)]
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            glyph((x0 + x1) / 2, (y0 + y1) / 2, abs(x1 - x0) + .004, abs(y1 - y0) + h * .06)
        glyph(0, -h * .42, w, h * .03)
    elif pattern == 'text':
        lines = max(3, min(9, int(h / .04)))
        for i in range(lines):
            lw = w * rnd.uniform(.35, .95)
            glyph(-w / 2 + lw / 2, h / 2 - h * (i + .5) / lines, lw, h / lines * .4)
    elif pattern == 'grid':
        cols, rows = 6, 4
        for i in range(cols):
            for j in range(rows):
                if rnd.random() < .75:
                    glyph(-w / 2 + w * (i + .5) / cols, -h / 2 + h * (j + .5) / rows, w / cols * .72, h / rows * .62)
    elif pattern == 'ring':
        steps = 16
        r = min(w, h) * .38
        for i in range(steps):
            if i % 4 != 3:
                a = 2 * math.pi * i / steps
                glyph(math.cos(a) * r, math.sin(a) * r, r * .3, r * .3)
        glyph(0, 0, r * .28, r * .28)
    else:  # schematic
        glyph(0, 0, w * .8, h * .05)
        for i in range(4):
            x = -w * .35 + w * .23 * i
            glyph(x, 0, w * .035, h * .5)
            glyph(x, h * .28, w * .12, h * .14)


def lamp_strip(name, center, length, axis='X', role='e9-cyan', depth=.02, height=.02):
    """Captive emissive strip with a dark housing (an actual fixture source)."""
    c = Vector(center)
    size = (length, depth, height) if axis == 'X' else (depth, length, height) if axis == 'Y' else (depth, height, length)
    hsize = tuple(s + .02 for s in size)
    box(name + ' housing', c, hsize, 'e9-dark', .004)
    off = Vector((0, -depth * .3, 0)) if axis != 'Z' else Vector((0, -height * .3, 0))
    box(name, c + off, size, role, 0)


def cable_bundle(name, a, b, count=4, sag=.25, radius=.012, spread=.035, tints=('black', 'dark-grey', 'navy'),
                 role='p11-tint', seed=0):
    rnd = random.Random(seed)
    a, b = Vector(a), Vector(b)
    d = (b - a)
    side = d.cross(Vector((0, 0, 1)))
    side = side.normalized() if side.length > 1e-4 else Vector((1, 0, 0))
    for i in range(count):
        o = side * (i - (count - 1) / 2) * spread
        s = sag * rnd.uniform(.8, 1.25)
        sweep(name, catenary(a + o, b + o * rnd.uniform(.6, 1.4), s, 12), radius * rnd.uniform(.8, 1.25), role, 6,
              tint=tints[i % len(tints)])


# ------------------------------------------------------------ organic forms

def blob(name, centers, role='p11-growth', resolution=.06, threshold=.6, displace=.04, seed=0,
         decimate=None, tint=None):
    """Metaball mass converted to mesh, noise displaced and decimated.
    ``centers`` = [(x, y, z, radius[, (sx, sy, sz)])]."""
    meta = bpy.data.metaballs.new(name)
    meta.resolution = resolution
    meta.render_resolution = resolution
    meta.threshold = threshold
    for c in centers:
        element = meta.elements.new()
        element.co = c[:3]
        element.radius = c[3]
        if len(c) > 4:
            element.type = 'ELLIPSOID'
            element.size_x, element.size_y, element.size_z = c[4]
    obj = bpy.data.objects.new(name, meta)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph), depsgraph=depsgraph)
    bpy.data.objects.remove(obj)
    bpy.data.metaballs.remove(meta)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bpy.data.meshes.remove(mesh)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=resolution * .2)
    bm.normal_update()
    off = Vector((seed * 1.37, seed * .71, seed * 2.11))
    for v in bm.verts:
        n = noise.noise(v.co * 6 + off) * .7 + noise.noise(v.co * 15 + off) * .3
        v.co += v.normal * n * displace
        if v.co.z < 0:
            v.co.z = 0
    if decimate:
        bmesh.ops.triangulate(bm, faces=bm.faces)
        mesh = bpy.data.meshes.new(name)
        bm.to_mesh(mesh)
        bm.free()
        obj = _link(mesh, name, role, tint)
        modifier = obj.modifiers.new('decimate', 'DECIMATE')
        modifier.ratio = decimate
        _apply(obj)
        return finish(obj, role, 0, tint=tint)
    return mesh_object(name, bm, role, 0, tint=tint)


def tendril(name, points, r0, r1, role='p11-growth', radial=6, seed=0, wobble=.04):
    """Tapering organic root along a path with noise wobble."""
    pts = [Vector(p) for p in points]
    dense = []
    for a, b in zip(pts, pts[1:]):
        steps = max(2, int((b - a).length / .08))
        for i in range(steps):
            dense.append(a.lerp(b, i / steps))
    dense.append(pts[-1])
    off = Vector((seed, seed * .5, seed * .25))
    wob = [p + Vector((noise.noise(p * 3 + off), noise.noise(p * 3 + off + Vector((5, 0, 0))),
                       noise.noise(p * 3 + off + Vector((0, 9, 0))) * .5)) * wobble for p in dense]
    wob[0], wob[-1] = dense[0], dense[-1]
    return sweep(name, wob, r0, role, radial, taper=(r0, r1))


def egg(name, location, size, role='p11-flesh', seed=0, tilt=.2):
    loc = Vector(location)
    profile = []
    for i in range(8):
        t = i / 7
        z = t * size * 1.4
        r = size * .5 * math.sin(math.pi * min(1, t * 1.05 + .02)) ** .8 * (1 - .25 * t)
        profile.append((max(r, .002), z))
    profile[-1] = (0.0, size * 1.4)
    rot = (tilt * math.cos(seed), tilt * math.sin(seed), 0)
    return lathe(name, profile, loc, role, 10, rotation=rot)


# ---------------------------------------------------------- bake and export

def _merge(group):
    by_finish = {}
    for obj in list(group.children):
        obj.data.transform(obj.matrix_basis)
        obj.matrix_basis = Matrix()
        by_finish.setdefault(obj['role'], []).append(obj)
    for role, objects in by_finish.items():
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        if len(objects) > 1:
            bpy.ops.object.join()
        obj = bpy.context.view_layer.objects.active
        obj.name = f'{group.name}--{role}'
        obj.parent = group
        obj['finish'] = role


def _bake(group, rays=16, distance=.32, ground=True, wear=1.0):
    """AO x curvature x grime x tint into the 'AO' corner colour attribute."""
    vertices, faces = [], []
    parts = list(group.children)
    for obj in parts:
        offset = len(vertices)
        vertices.extend(tuple(obj.matrix_world @ v.co) for v in obj.data.vertices)
        faces.extend(tuple(offset + i for i in p.vertices) for p in obj.data.polygons)
    tree = BVHTree.FromPolygons(vertices, faces, all_triangles=False, epsilon=.0001)
    directions = []
    for ray in range(rays):
        radius, angle = math.sqrt((ray + .5) / rays), ray * 2.399963229728653
        directions.append((radius * math.cos(angle), radius * math.sin(angle), math.sqrt(1 - radius * radius)))
    for obj in parts:
        mesh = obj.data
        role = obj['role']
        tint_value = obj.get('tint')
        white = role in WHITE_FINISHES
        # Per-part tint (joined objects lose custom props, so tint is stored
        # before merge in a per-vertex layer; see _stamp_tint).
        tint_layer = mesh.attributes.get('p11_tint')
        colors = mesh.color_attributes.new(name='AO', type='BYTE_COLOR', domain='CORNER')
        mesh.color_attributes.active_color = colors
        mesh.color_attributes.render_color_index = colors_index(mesh, 'AO')
        if white:
            for loop in mesh.loops:
                colors.data[loop.index].color = (1, 1, 1, 1)
            continue
        bm = bmesh.new()
        bm.from_mesh(mesh)
        bm.verts.ensure_lookup_table()
        curvature = []
        for v in bm.verts:
            if not v.link_edges:
                curvature.append(0)
                continue
            n = v.normal
            total = 0
            for e in v.link_edges:
                other = e.other_vert(v)
                d = other.co - v.co
                if d.length > 1e-6:
                    total += -n.dot(d.normalized())
            curvature.append(total / len(v.link_edges))
        bm.free()
        values = []
        for index, vertex in enumerate(mesh.vertices):
            normal = (obj.matrix_world.to_3x3() @ vertex.normal).normalized()
            tangent = normal.cross(Vector((0, 0, 1)))
            if tangent.length < .01:
                tangent = normal.cross(Vector((0, 1, 0)))
            tangent.normalize()
            bitangent = normal.cross(tangent).normalized()
            origin = obj.matrix_world @ vertex.co + normal * .003
            occlusion = 0.0
            for dx, dy, dz in directions:
                direction = (tangent * dx + bitangent * dy + normal * dz).normalized()
                hit, _, _, d = tree.ray_cast(origin, direction, distance)
                if hit is not None:
                    occlusion += (1 - d / distance)
                elif ground and direction.z < -.05 and origin.z > 0:
                    t = origin.z / -direction.z
                    if t < distance:
                        occlusion += (1 - t / distance) * .8
            ao = max(.38, 1 - .72 * occlusion / rays)
            k = curvature[index]
            edge = max(-1, min(1, k * 4))
            # Convex: worn bright edge. Concave: grime.
            wear_term = 1 + .12 * wear * max(0, edge) - .16 * max(0, -edge)
            z = origin.z
            grime = 1 - .12 * max(0, 1 - z / .35)
            value = max(.3, min(1, ao * wear_term * grime * .94))
            values.append(value)
        for loop in mesh.loops:
            v = values[loop.vertex_index]
            r = g = b = v
            if tint_layer is not None:
                tr, tg, tb = tint_layer.data[loop.vertex_index].vector
                r, g, b = r * tr, g * tg, b * tb
            colors.data[loop.index].color = (r, g, b, 1)
        if tint_layer is not None:
            mesh.attributes.remove(tint_layer)
        mesh.update()


def colors_index(mesh, name):
    for i, attribute in enumerate(mesh.color_attributes):
        if attribute.name == name:
            return i
    return 0


def _stamp_tint(group):
    """Before merge: store each part's colour (tint or jittered white) per vertex."""
    for obj in group.children:
        mesh = obj.data
        layer = mesh.attributes.new('p11_tint', 'FLOAT_VECTOR', 'POINT')
        role = obj['role']
        h = int(hashlib.md5((group.name + obj.name + str(len(mesh.vertices))).encode()).hexdigest()[:6], 16)
        jitter = 1 - (h % 1000) / 1000 * .07  # +-3.5% value variation per part
        if role in TINTED:
            name = obj.get('tint', 'grey')
            rgb = srgb(INK.get(name, name if name.startswith('#') else '#7d8789'))
            rgb = tuple(c * (1 - (h % 1000) / 1000 * .05) for c in rgb)
        else:
            rgb = (jitter, jitter, jitter)
        for d in layer.data:
            d.vector = rgb


def export(pack: str, out_dir: Path, filename: str, description: str, rebuild: str, preview=None):
    """Merge parts per finish, bake, export GLB + manifest. Returns manifest."""
    out_dir.mkdir(parents=True, exist_ok=True)
    models = []
    over = []
    for group in ASSETS:
        if '--breakdown' in sys.argv:
            parts = {}
            for obj in group.children:
                obj.data.calc_loop_triangles()
                key = obj.name.split('.')[0]
                parts[key] = parts.get(key, 0) + len(obj.data.loop_triangles)
            top = sorted(parts.items(), key=lambda kv: -kv[1])[:14]
            print('P11_BREAKDOWN ' + group.name + ' ' + ', '.join(f'{k}={v}' for k, v in top))
        _stamp_tint(group)
        _merge(group)
        _bake(group)
        points = [obj.matrix_world @ Vector(corner) for obj in group.children for corner in obj.bound_box]
        low = [min(p[i] for p in points) for i in range(3)]
        high = [max(p[i] for p in points) for i in range(3)]
        triangles = 0
        for obj in group.children:
            obj.data.calc_loop_triangles()
            triangles += len(obj.data.loop_triangles)
        budget = BUDGETS.get(group.name, 1500)
        if triangles > budget:
            over.append(f'{group.name}: {triangles} > {budget}')
        models.append({
            'name': group.name,
            'size': [round(high[0] - low[0], 4), round(high[2] - low[2], 4), round(high[1] - low[1], 4)],
            'bounds': {'min': [round(low[0], 4), round(low[2], 4), round(-high[1], 4)],
                       'max': [round(high[0], 4), round(high[2], 4), round(-low[1], 4)]},
            'triangles': triangles, 'budget': budget,
            'finishes': sorted({obj['finish'] for obj in group.children}),
        })
    bpy.ops.object.select_all(action='DESELECT')
    for group in ASSETS:
        group.select_set(True)
        for obj in group.children:
            obj.select_set(True)
    path = out_dir / filename
    bpy.ops.export_scene.gltf(
        filepath=str(path), export_format='GLB', use_selection=True, export_yup=True, export_apply=True,
        export_extras=True, export_materials='EXPORT', export_vertex_color='ACTIVE',
        export_all_vertex_colors=False, export_animations=False, export_cameras=False, export_lights=False,
        export_texcoords=False,
    )
    manifest = {
        'name': f'Containment P11 {pack}', 'license': 'MIT', 'author': 'Containment contributors',
        'source': rebuild.split(' -P ')[-1].split(' ')[0], 'rebuild': rebuild,
        'coordinateSystem': 'glTF Y-up, metres; bottom-centred origins, fronts face +Z (camera side)',
        'description': description,
        'bake': '16 BVH hemisphere rays + ground plane (0.32m) x per-vertex convex wear / concave grime x '
                'floor grime x per-part value jitter; p11-tint finishes carry part colour. COLOR_0 multiplier.',
        'textures': 'none (texture memory 0); detail is modelled geometry',
        'materials': {k: PALETTE[k] for k in sorted({f for m in models for f in m['finishes']})},
        'models': models,
        'output': {'file': filename, 'bytes': path.stat().st_size,
                   'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                   'triangles': sum(m['triangles'] for m in models)},
        'overBudget': over,
    }
    (out_dir / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    license_path = ROOT / 'LICENSE'
    if license_path.exists():
        (out_dir / 'LICENSE.txt').write_text(license_path.read_text())
    print('P11_EXPORT ' + json.dumps(manifest['output']) + (' OVER ' + '; '.join(over) if over else ''))
    for m in models:
        print(f"P11_MODEL {m['name']} tris={m['triangles']} budget={m['budget']} size={m['size']}")
    return manifest


# ------------------------------------------------------------------ renders

def _stage():
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    try:
        prefs.compute_device_type = 'METAL'
        prefs.get_devices()
        for d in prefs.devices:
            d.use = d.type == 'METAL'
        scene.cycles.device = 'GPU'
    except Exception:
        scene.cycles.device = 'CPU'
    scene.cycles.samples = 48
    scene.cycles.use_denoising = True
    scene.render.threads_mode = 'FIXED'
    scene.render.threads = 4
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'
    if scene.world is None:
        scene.world = bpy.data.worlds.new('PREVIEW world')
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = (.018, .022, .026, 1)
    bg.inputs['Strength'].default_value = 1
    if 'PREVIEW floor' not in bpy.data.objects:
        material = bpy.data.materials.new('PREVIEW ONLY deck')
        material.diffuse_color = (.05, .062, .07, 1)
        material.use_nodes = True
        material.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.035, .045, .05, 1)
        material.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .7
        bpy.ops.mesh.primitive_plane_add(size=400, location=(0, 0, -.001))
        bpy.context.object.name = 'PREVIEW floor'
        bpy.context.object.data.materials.append(material)
        for name, position, power, size, color in (
                ('key', (-5, -7, 9), 2200, 5, (1, .96, .9)), ('fill', (8, -4, 5), 700, 7, (.75, .85, 1)),
                ('rim', (2, 9, 6), 1600, 4, (.8, .95, 1))):
            data = bpy.data.lights.new('PREVIEW ' + name, 'AREA')
            data.energy, data.shape, data.size, data.color = power, 'DISK', size, color
            obj = bpy.data.objects.new(data.name, data)
            bpy.context.collection.objects.link(obj)
            obj.location = position
            obj.rotation_euler = (Vector((0, 0, .5)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
    return scene


def render(path: Path, targets, view='game', resolution=(1280, 960), scale=1.0):
    """Beauty render of ``targets`` (asset group names). view: 'game' (the
    in-game 54 degree long-lens camera) or 'hero' (3/4 close look)."""
    scene = _stage()
    groups = [bpy.data.objects[n] for n in targets]
    for obj in bpy.data.objects:
        if obj.get('originalAsset'):
            visible = obj in groups
            obj.hide_render = not visible
            for child in obj.children:
                child.hide_render = not visible
    points = [obj.matrix_world @ Vector(c) for g in groups for obj in g.children for c in obj.bound_box]
    low = Vector([min(p[i] for p in points) for i in range(3)])
    high = Vector([max(p[i] for p in points) for i in range(3)])
    centre = (low + high) / 2
    size = max((high - low).x, (high - low).y, (high - low).z * 1.2)
    data = bpy.data.cameras.get('PREVIEW camera') or bpy.data.cameras.new('PREVIEW camera')
    camera = bpy.data.objects.get('PREVIEW camera') or bpy.data.objects.new('PREVIEW camera', data)
    if camera.name not in bpy.context.collection.objects:
        bpy.context.collection.objects.link(camera)
    if view == 'game':
        data.type = 'PERSP'
        data.angle = math.radians(28)
        pitch = math.atan2(26, 19)
        distance = size * 2.6 * scale
        camera.location = centre + Vector((0, -math.cos(pitch) * distance, math.sin(pitch) * distance))
    else:
        data.type = 'PERSP'
        data.angle = math.radians(32)
        distance = size * 2.0 * scale
        camera.location = centre + Vector((-.55, -.8, .62)).normalized() * distance
    camera.rotation_euler = (centre - camera.location).to_track_quat('-Z', 'Y').to_euler()
    data.clip_end = 500
    scene.camera = camera
    scene.render.resolution_x, scene.render.resolution_y = resolution
    scene.render.resolution_percentage = 100
    scene.render.filepath = str(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.render.render(write_still=True)


def layout_row(names, gap=.6, y=0.0):
    """Lay assets out in a row for a pack overview render (preview only)."""
    x = 0.0
    widths = []
    for n in names:
        g = bpy.data.objects[n]
        pts = [c for obj in g.children for c in (obj.matrix_world @ Vector(v) for v in obj.bound_box)]
        widths.append(max(p.x for p in pts) - min(p.x for p in pts))
    total = sum(widths) + gap * (len(names) - 1)
    x = -total / 2
    for n, w in zip(names, widths):
        bpy.data.objects[n].location = (x + w / 2, y, 0)
        x += w + gap
    bpy.context.view_layer.update()


def args():
    return sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
