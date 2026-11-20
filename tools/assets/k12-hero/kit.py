"""K12 hard-surface toolkit: conformed armour plates, sweeps, lathes and fasteners.

Original MIT authoring code. Design coordinates are metres, X = character right,
Y = forward, Z = up. Every builder takes ``high`` so one description yields the
in-game mesh (few rings, one-segment chamfers) and the close-up source (dense
profiles, rolled three-segment chamfers, booleans and fasteners).

Core idea: armour is *designed in 2D* (an outline with filleted corners and an
edge profile: rolled lip, panel groove, crowned field) and then *conformed* onto
an anatomical target along planar, cylindrical or spherical rays. The plate keeps
its own crown and a real solidified wall, so it never reads as an inflated copy of
the body underneath.
"""
import math
import bmesh
import bpy
from mathutils import Vector, Matrix, Quaternion
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree

V = Vector


# --------------------------------------------------------------------------- scene

def link(obj, collection=None):
    (collection or bpy.context.scene.collection).objects.link(obj)
    return obj


def new_mesh(name, verts, faces, collection=None, smooth=True):
    data = bpy.data.meshes.new(name)
    data.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces])
    data.validate(clean_customdata=False)
    data.update()
    obj = bpy.data.objects.new(name, data)
    link(obj, collection)
    if smooth:
        for p in data.polygons:
            p.use_smooth = True
    return obj


def apply_all(obj):
    """Realize every modifier of ``obj`` (context-safe, no operator)."""
    if not obj.modifiers:
        return obj
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(depsgraph)
    mesh = bpy.data.meshes.new_from_object(evaluated, preserve_all_data_layers=True, depsgraph=depsgraph)
    old = obj.data
    obj.modifiers.clear()
    obj.data = mesh
    mesh.name = old.name
    if old.users == 0:
        bpy.data.meshes.remove(old)
    return obj


def bvh_of(obj, subdivide=0):
    """World-space BVH of an object's evaluated surface (optionally subdivided)."""
    temp = None
    if subdivide:
        temp = obj.modifiers.new('k12 bvh density', 'SUBSURF')
        temp.levels = subdivide
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    mesh.transform(obj.matrix_world)
    verts = [v.co.copy() for v in mesh.vertices]
    polys = [tuple(p.vertices) for p in mesh.polygons]
    evaluated.to_mesh_clear()
    if temp:
        obj.modifiers.remove(temp)
    return BVHTree.FromPolygons(verts, polys)


# ------------------------------------------------------------------------- outlines

def fillet(points, radius, segments=3, closed=True):
    """Round every corner of a 2D polyline. ``radius`` may be a list per corner."""
    pts = [V((p[0], p[1])) for p in points]
    n = len(pts)
    radii = radius if isinstance(radius, (list, tuple)) else [radius] * n
    out = []
    for i in range(n):
        if not closed and (i == 0 or i == n - 1):
            out.append(pts[i])
            continue
        p0, p1, p2 = pts[i - 1], pts[i], pts[(i + 1) % n]
        a, b = (p0 - p1), (p2 - p1)
        la, lb = a.length, b.length
        r = radii[i]
        if r <= 0 or la < 1e-6 or lb < 1e-6 or segments < 1:
            out.append(p1)
            continue
        a.normalize(); b.normalize()
        cos = max(-1, min(1, a.dot(b)))
        half = math.acos(cos) / 2
        if half < 1e-3 or half > math.pi / 2 - 1e-3:
            out.append(p1)
            continue
        dist = min(r / math.tan(half), la * .45, lb * .45)
        s, e = p1 + a * dist, p1 + b * dist
        # Quadratic bezier through the corner gives a fair, monotonic fillet.
        for k in range(segments + 1):
            t = k / segments
            out.append(s * (1 - t) ** 2 + p1 * 2 * t * (1 - t) + e * t * t)
    return [(p.x, p.y) for p in out]


def resample(points, count, closed=True):
    """Resample a polyline to ``count`` points evenly spaced by arc length."""
    pts = [V((p[0], p[1])) for p in points]
    if closed:
        pts = pts + [pts[0]]
    lengths = [0.0]
    for a, b in zip(pts, pts[1:]):
        lengths.append(lengths[-1] + (b - a).length)
    total = lengths[-1]
    out = []
    steps = count if closed else count - 1
    j = 0
    for k in range(count):
        d = total * k / steps
        while j < len(lengths) - 2 and lengths[j + 1] < d:
            j += 1
        seg = max(1e-9, lengths[j + 1] - lengths[j])
        t = (d - lengths[j]) / seg
        p = pts[j].lerp(pts[j + 1], max(0, min(1, t)))
        out.append((p.x, p.y))
    return out


def signed_area(points):
    return sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(points, points[1:] + points[:1])) / 2


def offset_polygon(points, distance, smooth=2):
    """Inward offset (distance > 0 moves inward) along smoothed edge normals.

    No mitre amplification: on dense, filleted outlines this never produces
    the spikes a mitred offset makes at tight corners.
    """
    pts = [V(p) for p in points]
    n = len(pts)
    sign = 1 if signed_area(points) > 0 else -1
    normals = []
    for i in range(n):
        d = pts[(i + 1) % n] - pts[i - 1]
        if d.length < 1e-12:
            d = V((1, 0))
        d.normalize()
        normals.append(V((-d.y, d.x)) * sign)
    out = []
    for i in range(n):
        acc = V((0, 0))
        for k in range(-smooth, smooth + 1):
            acc += normals[(i + k) % n] * (1.0 / (1 + abs(k)))
        acc.normalize()
        out.append(tuple(pts[i] + acc * distance))
    return out


def inside(point, poly):
    x, y = point
    hit = False
    for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1 + 1e-30) + x1:
            hit = not hit
    return hit


def edge_distance(point, poly):
    p = V(point)
    best = 1e9
    for a, b in zip(poly, poly[1:] + poly[:1]):
        a, b = V(a), V(b)
        ab = b - a
        t = 0 if ab.length_squared < 1e-18 else max(0, min(1, (p - a).dot(ab) / ab.length_squared))
        best = min(best, (a + ab * t - p).length)
    return best


def ellipse(rx, ry, count=24, start=0.0):
    return [(rx * math.cos(start + math.tau * i / count), ry * math.sin(start + math.tau * i / count)) for i in range(count)]


# ---------------------------------------------------------------------- projections

class Planar:
    """Rays along ``-normal``; outline (u, v) in metres on (right, up)."""
    def __init__(self, origin, normal, up):
        self.o = V(origin); self.n = V(normal).normalized()
        self.r = V(up).cross(self.n).normalized(); self.u = self.n.cross(self.r).normalized()

    def ray(self, u, v):
        base = self.o + self.r * u + self.u * v
        return base + self.n * 2.0, -self.n

    def frame(self, u, v):
        return self.o + self.r * u + self.u * v, self.r, self.u, self.n


class Cylindrical:
    """Rays toward an axis; outline (angle degrees, distance along axis in metres).

    ``ref`` is the 0° direction, positive angles turn right-handed about ``axis``.
    """
    def __init__(self, origin, axis, ref):
        self.o = V(origin); self.a = V(axis).normalized()
        ref = V(ref); self.ref = (ref - self.a * ref.dot(self.a)).normalized()

    def direction(self, deg):
        return Quaternion(self.a, math.radians(deg)) @ self.ref

    def ray(self, deg, v):
        d = self.direction(deg)
        return self.o + self.a * v + d * 2.0, -d

    def frame(self, deg, v):
        d = self.direction(deg)
        tangent = self.a.cross(d).normalized()
        return self.o + self.a * v, tangent, self.a, d


class Spherical:
    """Rays toward a centre; outline (longitude deg, latitude deg).

    Longitude 0 looks along ``front``; positive longitude turns toward the
    character's right (+X when front is +Y and up is +Z). Latitude is up.
    """
    def __init__(self, origin, front=(0, 1, 0), up=(0, 0, 1)):
        self.o = V(origin); self.f = V(front).normalized(); self.up = V(up).normalized()
        self.right = self.f.cross(self.up).normalized()

    def direction(self, lon, lat):
        lo, la = math.radians(lon), math.radians(lat)
        return (self.f * math.cos(lo) * math.cos(la) + self.right * math.sin(lo) * math.cos(la)
                + self.up * math.sin(la)).normalized()

    def ray(self, lon, lat):
        d = self.direction(lon, lat)
        return self.o + d * 2.0, -d

    def frame(self, lon, lat):
        d = self.direction(lon, lat)
        east = self.up.cross(d)
        if east.length < 1e-6: east = self.right
        east.normalize()
        return self.o, east, d.cross(east), d


class Isotropic:
    """Wrap a cylindrical projection so v (metres along the axis) is given in degrees too."""
    def __init__(self, projection, unit):
        self.p, self.k = projection, unit

    def ray(self, u, v):
        return self.p.ray(u, v / self.k)


def cast(bvh, projection, u, v):
    origin, direction = projection.ray(u, v)
    hit = bvh.ray_cast(origin, direction, 4.0)
    if hit[0] is None:
        # Fallback: nearest surface point to the ray's closest approach.
        near = bvh.find_nearest(origin + direction * 1.9)
        return (near[0] if near[0] is not None else origin + direction * 2.0), -direction
    return hit[0], -direction


# ---------------------------------------------------------------------- the plate

def plate(name, outline, projection, target_bvh, standoff=.012, thickness=.012,
          profile=None, crown=.006, high=False, count=None, chamfer=None,
          inner_rings=2, collection=None, unit=1.0, spacing=None, aniso=None):
    """Conform a designed 2D outline onto a target and give it a real wall.

    ``outline``: (u, v) points in projection units (already filleted); any
    simple polygon, concave crescents included.
    ``profile``: [(inset, height)] edge profile in metres from the outer edge
    (``unit`` converts metres to projection units, e.g. degrees per metre),
    e.g. a rolled lip and a panel groove; heights are relative to the conformed
    surface + ``standoff``. The inner field is a constrained Delaunay fill whose
    height rises by ``crown`` metres with distance from the edge.
    Returns the mesh object (modifiers applied) with a chamfered/rolled rim.
    """
    from mathutils.geometry import delaunay_2d_cdt
    count = count or (64 if high else 22)
    pts = resample(outline, count)
    if signed_area(pts) < 0:
        pts = list(reversed(pts))
    if profile is None:
        profile = [(0, 0), (.004, .0018)] if high else [(0, 0)]
    if not high:
        profile = [profile[0]] + ([max(profile[1:], key=lambda p: p[1])] if len(profile) > 1 else [])
    rings, heights = [], []
    for inset, h in profile:
        rings.append(offset_polygon(pts, inset * unit) if inset > 0 else pts)
        heights.append(h)
    last = rings[-1]
    n = len(pts)
    perimeter = sum((V(a) - V(b)).length for a, b in zip(last, last[1:] + last[:1]))
    step = spacing or perimeter / n * (1.15 if high else 1.6)
    us = [p[0] for p in last]; vs = [p[1] for p in last]
    interior, dists = [], []
    # HERO19: ``aniso`` = (u, v) step multipliers. Wrapped limb/torso plates need dense columns around the
    # limb (u) so flat fill triangles never chord beneath the curved undersuit, and few rows along it (v).
    su, sv = aniso or (1.0, 1.0)
    gu = min(us) + step * su * .5
    row = 0
    while gu < max(us):
        gv = min(vs) + step * sv * (.5 + (.5 if row % 2 else 0))
        while gv < max(vs):
            if inside((gu, gv), last):
                d = edge_distance((gu, gv), last)
                if d > step * min(su, sv) * .6:
                    interior.append((gu, gv)); dists.append(d)
            gv += step * sv
        gu += step * su * .866
        row += 1
    dmax = max(dists) if dists else 1
    coords = [V(p) for p in last] + [V(p) for p in interior]
    edges = [(i, (i + 1) % n) for i in range(n)]
    out_coords, _e, out_faces, orig_verts, _oe, _of = delaunay_2d_cdt(coords, edges, [list(range(n))], 1, 1e-9, True)
    base_h = heights[-1]
    field_h = []
    ring_index = {}
    for k, co in enumerate(out_coords):
        origin = [o for o in orig_verts[k] if o < len(coords)]
        if origin and origin[0] < n:
            ring_index[origin[0]] = k
            field_h.append(base_h)
        else:
            d = edge_distance((co.x, co.y), last)
            t = min(1.0, d / dmax)
            field_h.append(base_h + crown * (1 - (1 - t) ** 2))
    verts, faces = [], []
    for ring, h in zip(rings[:-1], heights[:-1]):
        for u, v in ring:
            point, outward = cast(target_bvh, projection, u, v)
            verts.append(point + outward * (standoff + h))
    offset = len(verts)
    for co, h in zip(out_coords, field_h):
        point, outward = cast(target_bvh, projection, co.x, co.y)
        verts.append(point + outward * (standoff + h))
    def ring_vertex(r, i):
        if r < len(rings) - 1:
            return r * n + i
        return offset + ring_index[i]
    for r in range(len(rings) - 1):
        for i in range(n):
            j = (i + 1) % n
            faces.append((ring_vertex(r, i), ring_vertex(r, j), ring_vertex(r + 1, j), ring_vertex(r + 1, i)))
    for f in out_faces:
        faces.append(tuple(offset + k for k in f))
    obj = new_mesh(name, verts, faces, collection)
    bm = bmesh.new(); bm.from_mesh(obj.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    total = V((0, 0, 0)); mid = V((0, 0, 0))
    for f in bm.faces:
        total += f.normal * f.calc_area()
    centre_uv = interior[len(interior) // 2] if interior else last[0]
    _p, outward = cast(target_bvh, projection, *centre_uv)
    if total.dot(outward) < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    bm.to_mesh(obj.data); bm.free()
    finish_shell(obj, thickness, high, chamfer)
    return obj


def finish_shell(obj, thickness, high, chamfer=None, angle=40):
    solid = obj.modifiers.new('k12 wall', 'SOLIDIFY')
    solid.thickness = thickness
    solid.offset = -1
    solid.use_rim = True
    solid.use_even_offset = False
    bevel = obj.modifiers.new('k12 rim chamfer', 'BEVEL')
    bevel.width = chamfer if chamfer is not None else min(.0035, thickness * .35) if high else min(.0025, thickness * .3)
    bevel.segments = 3 if high else 1
    bevel.limit_method = 'ANGLE'
    bevel.angle_limit = math.radians(angle)
    bevel.harden_normals = high
    bevel.profile = .7 if high else .5
    apply_all(obj)
    weighted(obj)
    return obj


def weighted(obj, apply=True):
    for p in obj.data.polygons:
        p.use_smooth = True
    mod = obj.modifiers.new('k12 weighted normals', 'WEIGHTED_NORMAL')
    mod.keep_sharp = True
    mod.weight = 50
    mod.thresh = .01
    if apply:
        apply_all(obj)
    return obj


# ------------------------------------------------------------------- sweeps, lathe

def catmull(points, samples_per_span=8, closed=False):
    pts = [V(p) for p in points]
    if len(pts) < 3:
        out = []
        for k in range(samples_per_span + 1):
            out.append(pts[0].lerp(pts[-1], k / samples_per_span))
        return out
    if closed:
        ext = [pts[-1]] + pts + [pts[0], pts[1]]
        spans = len(pts)
    else:
        ext = [pts[0] * 2 - pts[1]] + pts + [pts[-1] * 2 - pts[-2]]
        spans = len(pts) - 1
    out = []
    for s in range(spans):
        p0, p1, p2, p3 = ext[s], ext[s + 1], ext[s + 2], ext[s + 3]
        for k in range(samples_per_span):
            t = k / samples_per_span
            t2, t3 = t * t, t * t * t
            out.append(.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    if not closed:
        out.append(pts[-1])
    return out


def frames_along(points, up_hint=None):
    """Parallel-transport frames (tangent, normal, binormal) for a polyline."""
    tangents = []
    for i in range(len(points)):
        a = points[max(0, i - 1)]; b = points[min(len(points) - 1, i + 1)]
        t = (b - a)
        tangents.append(t.normalized() if t.length > 1e-9 else V((0, 0, 1)))
    hint = V(up_hint) if up_hint else (V((0, 0, 1)) if abs(tangents[0].z) < .9 else V((0, 1, 0)))
    normal = (hint - tangents[0] * hint.dot(tangents[0])).normalized()
    frames = []
    for i, t in enumerate(tangents):
        if i:
            prev = tangents[i - 1]
            axis = prev.cross(t)
            if axis.length > 1e-8:
                angle = math.acos(max(-1, min(1, prev.dot(t))))
                normal = Quaternion(axis.normalized(), angle) @ normal
        normal = (normal - t * normal.dot(t)).normalized()
        frames.append((t, normal, t.cross(normal)))
    return frames


def sweep(name, points, radius, sides=10, caps=True, closed=False, collection=None,
          section=None, up_hint=None, scale_xy=(1, 1)):
    """Tube along points. ``radius`` is a float or f(t∈[0,1]) → float.
    ``section`` optionally overrides the circle with a 2D outline [(x, y)]."""
    pts = [V(p) for p in points]
    frames = frames_along(pts, up_hint)
    lengths = [0.0]
    for a, b in zip(pts, pts[1:]):
        lengths.append(lengths[-1] + (b - a).length)
    total = max(lengths[-1], 1e-9)
    ring = section or [(math.cos(math.tau * k / sides), math.sin(math.tau * k / sides)) for k in range(sides)]
    m = len(ring)
    verts, faces = [], []
    for i, (p, (t, nrm, bi)) in enumerate(zip(pts, frames)):
        r = radius(lengths[i] / total) if callable(radius) else radius
        for x, y in ring:
            verts.append(p + nrm * x * r * scale_xy[0] + bi * y * r * scale_xy[1])
    rows = len(pts)
    for i in range(rows - 1 + (1 if closed else 0)):
        for k in range(m):
            a = (i % rows) * m + k; b = (i % rows) * m + (k + 1) % m
            c = ((i + 1) % rows) * m + (k + 1) % m; d = ((i + 1) % rows) * m + k
            faces.append((a, b, c, d))
    if caps and not closed:
        faces.append(tuple(reversed(range(m))))
        faces.append(tuple((rows - 1) * m + k for k in range(m)))
    obj = new_mesh(name, verts, faces, collection)
    bm = bmesh.new(); bm.from_mesh(obj.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(obj.data); bm.free()
    return obj


def corrugated(base, depth, pitch_count):
    """Radius function for ribbed hoses/bellows."""
    return lambda t: base * (1 + depth * (.5 + .5 * math.cos(t * math.tau * pitch_count)))


def lathe(name, profile, origin, axis, segments=24, ref=None, collection=None, caps=True, arc=360.0):
    """Revolve [(radius, height)] around ``axis`` through ``origin``."""
    o, a = V(origin), V(axis).normalized()
    ref = V(ref) if ref else (V((1, 0, 0)) if abs(a.x) < .9 else V((0, 1, 0)))
    ref = (ref - a * ref.dot(a)).normalized()
    full = arc >= 359.9
    cols = segments if full else segments + 1
    verts, faces = [], []
    for j in range(cols):
        q = Quaternion(a, math.radians(arc) * j / segments)
        d = q @ ref
        for r, h in profile:
            verts.append(o + a * h + d * r)
    m = len(profile)
    for j in range(segments):
        j2 = (j + 1) % cols
        for i in range(m - 1):
            faces.append((j * m + i, j2 * m + i, j2 * m + i + 1, j * m + i + 1))
    if caps and full:
        if profile[0][0] > 1e-6:
            faces.append(tuple(j * m for j in range(cols)))
        if profile[-1][0] > 1e-6:
            faces.append(tuple(j * m + m - 1 for j in reversed(range(cols))))
    obj = new_mesh(name, verts, faces, collection)
    bm = bmesh.new(); bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(obj.data); bm.free()
    return obj


def prism(name, outline, depth, origin, normal, up, collection=None, centered=True):
    """Extrude a 2D outline (metres) along ``normal``."""
    p = Planar(origin, normal, up)
    n = len(outline)
    z0, z1 = (-depth / 2, depth / 2) if centered else (0, depth)
    verts = [p.o + p.r * u + p.u * v + p.n * z for z in (z0, z1) for u, v in outline]
    faces = [tuple(reversed(range(n))), tuple(range(n, 2 * n))]
    faces += [(i, (i + 1) % n, (i + 1) % n + n, i + n) for i in range(n)]
    obj = new_mesh(name, verts, faces, collection)
    bm = bmesh.new(); bm.from_mesh(obj.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(obj.data); bm.free()
    return obj


def bevel(obj, width, segments, angle=35, harden=True, apply=True):
    mod = obj.modifiers.new('k12 bevel', 'BEVEL')
    mod.width = width; mod.segments = segments
    mod.limit_method = 'ANGLE'; mod.angle_limit = math.radians(angle)
    mod.harden_normals = harden; mod.profile = .6
    if apply:
        apply_all(obj)
    return obj


def boolean(obj, cutter, operation='DIFFERENCE', remove_cutter=True):
    mod = obj.modifiers.new('k12 boolean', 'BOOLEAN')
    mod.operation = operation; mod.object = cutter; mod.solver = 'EXACT'
    cutter.hide_render = True; cutter.hide_viewport = True
    apply_all(obj)
    if remove_cutter:
        data = cutter.data
        bpy.data.objects.remove(cutter, do_unlink=True)
        if data and data.users == 0:
            bpy.data.meshes.remove(data)
    return obj


def cylinder(name, a, b, radius, sides=12, collection=None, caps=True):
    a, b = V(a), V(b)
    axis = (b - a)
    return lathe(name, [(0, 0), (radius, 0), (radius, axis.length), (0, axis.length)] if caps else
                 [(radius, 0), (radius, axis.length)], a, axis.normalized(), sides, collection=collection, caps=False)


def fastener(name, point, normal, radius=.006, kind='hex', high=False, collection=None, height=None):
    """A machine fastener seated on a surface. Hex/torx heads get a real socket in high."""
    n = V(normal).normalized()
    h = height or radius * .55
    sides = 6 if kind == 'hex' else (16 if high else 8)
    if kind == 'rivet':
        prof = [(0, 0), (radius, 0), (radius * .92, h * .55), (radius * .55, h), (0, h * 1.08)]
        obj = lathe(name, prof, point - n * .001, n, 12 if high else 6, collection=collection)
        return obj
    prof = [(0, 0), (radius * 1.12, 0), (radius * 1.12, h * .25), (radius, h * .3), (radius, h), (0, h)]
    if high:
        prof = [(0, 0), (radius * 1.15, 0), (radius * 1.15, h * .22), (radius, h * .3), (radius, h * .85), (radius * .88, h),
                (radius * .45, h), (radius * .45, h * .55), (0, h * .55)]
    obj = lathe(name, prof, point - n * .001, n, sides, collection=collection)
    return obj


def text_mesh(name, text, size, origin, normal, up, depth=.0006, collection=None, align='CENTER'):
    """Stencil-style markings from Blender's built-in font, as thin geometry."""
    curve = bpy.data.curves.new(name, 'FONT')
    curve.body = text; curve.size = size; curve.extrude = depth * .5
    curve.align_x = align; curve.align_y = 'CENTER'
    curve.space_character = 1.08
    curve.resolution_u = 3   # SHADE15: game-LOD stencils stay cheap
    obj = bpy.data.objects.new(name, curve)
    link(obj, collection)
    p = Planar(origin, normal, up)
    rot = Matrix((p.r, p.u, p.n)).transposed().to_4x4()
    obj.matrix_world = Matrix.Translation(p.o) @ rot
    depsgraph = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph))
    mesh.transform(obj.matrix_world)
    bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.curves.remove(curve)
    out = bpy.data.objects.new(name, mesh)
    link(out, collection)
    return out


def conform_to(obj, bvh, offset, projection_dir=None):
    """Drop a thin decal mesh onto a surface along its own normal direction."""
    for v in obj.data.vertices:
        d = V(projection_dir) if projection_dir else None
        near = bvh.find_nearest(v.co)
        if near[0] is not None:
            v.co = near[0] + near[1] * offset
    obj.data.update()
    return obj


# --------------------------------------------------------------------------- weights

def rigid(obj, bone):
    obj.vertex_groups.clear()
    g = obj.vertex_groups.new(name=bone)
    g.add(list(range(len(obj.data.vertices))), 1.0, 'REPLACE')
    obj['k12Bone'] = bone
    return obj


def transfer_weights(obj, source, k=4, falloff=1.0):
    """Copy skin weights from a lofted undersuit by inverse-distance k-nearest."""
    src = source.data.vertices
    tree = KDTree(len(src))
    for v in src:
        tree.insert(source.matrix_world @ v.co, v.index)
    tree.balance()
    names = {g.index: g.name for g in source.vertex_groups}
    obj.vertex_groups.clear()
    groups = {}
    for v in obj.data.vertices:
        total = {}
        wsum = 0
        for co, index, dist in tree.find_n(obj.matrix_world @ v.co, k):
            w = 1.0 / max(dist, 1e-4) ** falloff
            wsum += w
            for g in src[index].groups:
                total[names[g.group]] = total.get(names[g.group], 0) + g.weight * w
        for name, value in total.items():
            if name not in groups:
                groups[name] = obj.vertex_groups.new(name=name)
            groups[name].add([v.index], value / wsum, 'REPLACE')
    return obj


def join(objects, name):
    objects = [o for o in objects if o and o.type == 'MESH']
    if not objects:
        return None
    for o in objects:
        apply_all(o)
    ctx = bpy.context
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:
        o.hide_set(False); o.hide_viewport = False
        o.select_set(True)
    ctx.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    out = ctx.view_layer.objects.active
    out.name = name
    return out


def triangles(obj):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(depsgraph)
    mesh = ev.to_mesh()
    mesh.calc_loop_triangles()
    n = len(mesh.loop_triangles)
    ev.to_mesh_clear()
    return n


def surface_path(bvh, projection, outline, offset=0.0, closed=True, samples=None):
    """Project a 2D path (projection units) onto a target; returns points+outward dirs."""
    pts = resample(outline, samples, closed) if samples else outline
    out = []
    for u, v in pts:
        point, outward = cast(bvh, projection, u, v)
        out.append((point + outward * offset, outward))
    return out


def ribbon(name, path, width, height, closed=True, collection=None, profile=None):
    """Rectangular (or custom profile) section swept along a surface path.

    ``path`` is [(point, outward)], the section's local X runs across the path on
    the surface, Y along the outward direction. ``profile`` overrides the box with
    [(x, y)] in metres (x ∈ ±width/2, y from 0 outward).
    """
    pts = [p for p, _ in path]
    nrm = [n for _, n in path]
    count = len(pts)
    section = profile or [(-width / 2, 0), (width / 2, 0), (width / 2, height), (-width / 2, height)]
    m = len(section)
    verts, faces = [], []
    for i in range(count):
        a = pts[i - 1] if (closed or i > 0) else pts[i]
        b = pts[(i + 1) % count] if (closed or i < count - 1) else pts[i]
        t = (b - a); t = t.normalized() if t.length > 1e-9 else V((1, 0, 0))
        n = (nrm[i] - t * nrm[i].dot(t)).normalized()
        side = t.cross(n).normalized()
        for x, y in section:
            verts.append(pts[i] + side * x + n * y)
    rows = count if closed else count - 1
    for i in range(rows):
        j = (i + 1) % count
        for k in range(m):
            k2 = (k + 1) % m
            faces.append((i * m + k, i * m + k2, j * m + k2, j * m + k))
    if not closed:
        faces.append(tuple(reversed(range(m))))
        faces.append(tuple((count - 1) * m + k for k in range(m)))
    obj = new_mesh(name, verts, faces, collection)
    bm = bmesh.new(); bm.from_mesh(obj.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(obj.data); bm.free()
    return obj


def lens(name, outline, projection, target_bvh, standoff, count=48, rings=4, collection=None):
    """A single-sided curved surface patch (visor glass, light strips)."""
    pts = resample(outline, count)
    if signed_area(pts) < 0:
        pts = list(reversed(pts))
    cx = sum(p[0] for p in pts) / len(pts); cy = sum(p[1] for p in pts) / len(pts)
    verts = []
    ring_list = [pts] + [[(cx + (u - cx) * (1 - k / rings), cy + (v - cy) * (1 - k / rings)) for u, v in pts] for k in range(1, rings)]
    for ring in ring_list:
        for u, v in ring:
            p, n = cast(target_bvh, projection, u, v)
            verts.append(p + n * standoff)
    p, n = cast(target_bvh, projection, cx, cy)
    verts.append(p + n * standoff)
    n_ = len(pts)
    faces = []
    for r in range(len(ring_list) - 1):
        for i in range(n_):
            a = r * n_ + i; b = r * n_ + (i + 1) % n_
            faces.append((a, b, b + n_, a + n_))
    c = len(verts) - 1
    last = (len(ring_list) - 1) * n_
    for i in range(n_):
        faces.append((last + i, last + (i + 1) % n_, c))
    obj = new_mesh(name, verts, faces, collection)
    bm = bmesh.new(); bm.from_mesh(obj.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    _p, outward = cast(target_bvh, projection, cx, cy)
    if bm.faces and sum((f.normal for f in bm.faces), V()).dot(outward) < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    bm.to_mesh(obj.data); bm.free()
    return obj
