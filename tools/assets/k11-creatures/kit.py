"""Blender side of the K11 pipeline: skeleton, meshing, weights, UVs, bakes, renders.

Design space = skeleton space with the vertical axis multiplied by the caste's
``aspect``. The game fits every creature horizontally to its collider and then
scales height by ``aspect`` (see src/render/models.ts), so sculpting in design
space shows exactly the in-game proportions.
"""

from __future__ import annotations

import json
import math
import os
from pathlib import Path

import bpy
import bmesh
import numpy as np
from mathutils import Matrix, Vector

import sdf as S

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]


def log(*args):
    print("[k11]", *args, flush=True)


# ------------------------------------------------------------------ scene
def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.threads_mode = "FIXED"
    scene.render.threads = int(os.environ.get("K11_THREADS", "4"))
    return scene


def load_contract(asset):
    """Import the stripped skeleton contract; return the armature at rest."""
    path = HERE / "contracts" / f"{asset}.glb"
    bpy.ops.import_scene.gltf(filepath=str(path))
    arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    if arm.animation_data:
        arm.animation_data.action = None
    for bone in arm.pose.bones:
        bone.matrix_basis.identity()
    for obj in list(bpy.data.objects):
        if obj.type == "MESH":
            bpy.data.objects.remove(obj)
    bpy.context.view_layer.update()
    return arm


class Skeleton:
    """Rest joints of the retained armature, in skeleton and design space."""

    def __init__(self, arm, aspect, volumes=None):
        self.arm, self.aspect = arm, float(aspect)
        self.heads, self.tails, self.parent = {}, {}, {}
        for bone in arm.data.bones:
            self.heads[bone.name] = np.array(arm.matrix_world @ bone.head_local, dtype=np.float32)
            self.tails[bone.name] = np.array(arm.matrix_world @ bone.tail_local, dtype=np.float32)
            self.parent[bone.name] = bone.parent.name if bone.parent else None
        self.volumes = volumes or {}

    def d(self, p):
        """Skeleton space point -> design space."""
        p = np.asarray(p, dtype=np.float32).copy()
        p[..., 2] *= self.aspect
        return p

    def s(self, p):
        p = np.asarray(p, dtype=np.float32).copy()
        p[..., 2] /= self.aspect
        return p

    def h(self, name):
        return self.d(self.heads[name])

    def t(self, name):
        return self.d(self.tails[name])

    def end(self, name):
        """Distal end of a bone from the legacy mesh volume (leaf bones)."""
        part = self.volumes.get(name)
        if part:
            head = self.heads[name]
            a, b = np.array(part[0]["a"]), np.array(part[0]["b"])
            far = a if np.linalg.norm(a - head) > np.linalg.norm(b - head) else b
            return self.d(far)
        return self.t(name)


# ------------------------------------------------------------------ meshing
def mesh_object(name, points, faces, collection=None):
    mesh = bpy.data.meshes.new(name)
    mesh.vertices.add(len(points))
    mesh.vertices.foreach_set("co", np.asarray(points, dtype=np.float32).ravel())
    mesh.loops.add(len(faces) * 3)
    mesh.polygons.add(len(faces))
    mesh.loops.foreach_set("vertex_index", np.asarray(faces, dtype=np.int32).ravel())
    mesh.polygons.foreach_set("loop_start", np.arange(0, len(faces) * 3, 3, dtype=np.int32))
    mesh.polygons.foreach_set("loop_total", np.full(len(faces), 3, dtype=np.int32))
    mesh.update(calc_edges=True)
    mesh.validate()
    obj = bpy.data.objects.new(name, mesh)
    (collection or bpy.context.scene.collection).objects.link(obj)
    return obj


def sculpt_mesh(sculpture, voxel, name, adaptivity=0.0):
    field, origin = sculpture.evaluate_grid(voxel, log=log)
    points, faces = S.mesh_from_grid(field, origin, voxel, adaptivity)
    del field
    log(f"{name}: {len(points)} verts {len(faces)} tris")
    obj = mesh_object(name, points, faces)
    keep_largest_parts(obj, min_fraction=0.002)
    return obj


def keep_largest_parts(obj, min_fraction=0.002):
    """Drop tiny disconnected voxel crumbs."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.verts.ensure_lookup_table()
    seen, islands = set(), []
    for v in bm.verts:
        if v.index in seen:
            continue
        stack, island = [v], []
        seen.add(v.index)
        while stack:
            cur = stack.pop()
            island.append(cur)
            for e in cur.link_edges:
                o = e.other_vert(cur)
                if o.index not in seen:
                    seen.add(o.index)
                    stack.append(o)
        islands.append(island)
    total = len(bm.verts)
    doomed = [v for island in islands if len(island) < total * min_fraction for v in island]
    if doomed:
        bmesh.ops.delete(bm, geom=doomed, context="VERTS")
        bm.to_mesh(obj.data)
        log(f"{obj.name}: removed {len(doomed)} crumb verts in {sum(1 for i in islands if len(i) < total * min_fraction)} islands")
    bm.free()


def verts_np(obj):
    co = np.empty(len(obj.data.vertices) * 3, dtype=np.float32)
    obj.data.vertices.foreach_get("co", co)
    return co.reshape(-1, 3)


def set_verts(obj, co):
    obj.data.vertices.foreach_set("co", np.asarray(co, dtype=np.float32).ravel())
    obj.data.update()


def normals_np(obj):
    n = np.empty(len(obj.data.vertices) * 3, dtype=np.float32)
    obj.data.vertices.foreach_get("normal", n)
    return n.reshape(-1, 3)


def edges_np(obj):
    e = np.empty(len(obj.data.edges) * 2, dtype=np.int64)
    obj.data.edges.foreach_get("vertices", e)
    return e.reshape(-1, 2)


def laplacian(values, edges, count, iterations=1, factor=0.5, mask=None):
    """Average per-vertex values with their edge neighbours."""
    values = np.asarray(values, dtype=np.float32).copy()
    deg = np.bincount(edges.ravel(), minlength=count).astype(np.float32)
    deg = np.maximum(deg, 1)
    for _ in range(iterations):
        acc = np.zeros_like(values)
        np.add.at(acc, edges[:, 0], values[edges[:, 1]])
        np.add.at(acc, edges[:, 1], values[edges[:, 0]])
        avg = acc / (deg[:, None] if values.ndim == 2 else deg)
        f = factor if mask is None else factor * (mask[:, None] if values.ndim == 2 else mask)
        values = values + (avg - values) * f
    return values


def smooth_mesh(obj, iterations=2, factor=0.5):
    co = verts_np(obj)
    co = laplacian(co, edges_np(obj), len(co), iterations, factor)
    set_verts(obj, co)


def curvature(obj):
    """Signed mean-curvature proxy per vertex (positive = convex ridge)."""
    co, n = verts_np(obj), normals_np(obj)
    e = edges_np(obj)
    avg = laplacian(co, e, len(co), 1, 1.0)
    length = np.zeros(len(co), np.float32)
    deg = np.maximum(np.bincount(e.ravel(), minlength=len(co)), 1)
    seg = np.linalg.norm(co[e[:, 0]] - co[e[:, 1]], axis=1)
    np.add.at(length, e[:, 0], seg)
    np.add.at(length, e[:, 1], seg)
    length = length / deg
    return -np.einsum("ij,ij->i", avg - co, n) / np.maximum(length * length, 1e-9) * length


def decimate(obj, target_tris):
    tris = sum(len(p.vertices) - 2 for p in obj.data.polygons)
    ratio = min(1.0, target_tris / max(tris, 1))
    mod = obj.modifiers.new("decimate", "DECIMATE")
    mod.decimate_type = "COLLAPSE"
    mod.ratio = ratio
    mod.use_collapse_triangulate = True
    apply_modifier(obj, mod)
    log(f"{obj.name}: decimated {tris} -> {len(obj.data.polygons)} tris")


def apply_modifier(obj, mod):
    with bpy.context.temp_override(object=obj, active_object=obj, selected_objects=[obj]):
        bpy.ops.object.modifier_apply(modifier=mod.name)


def duplicate(obj, name):
    copy = obj.copy()
    copy.data = obj.data.copy()
    copy.name = copy.data.name = name
    bpy.context.scene.collection.objects.link(copy)
    return copy


def shade_smooth(obj):
    obj.data.polygons.foreach_set("use_smooth", np.ones(len(obj.data.polygons), dtype=bool))
    obj.data.update()


# -------------------------------------------------------------- attributes
def write_color(obj, name, rgba):
    attr = obj.data.color_attributes.get(name) or obj.data.color_attributes.new(name=name, type="FLOAT_COLOR", domain="POINT")
    attr.data.foreach_set("color", np.asarray(rgba, dtype=np.float32).ravel())
    obj.data.color_attributes.active_color = attr
    return attr


def skin_weights(obj, sculpture, sigma, smooth=2, keep=4, exclude_zones=()):
    """Bone weights from the winning sculpture primitives (soft nearest)."""
    co = verts_np(obj)
    prims = [p for p in sculpture.prims if p.op == "add" and p.bone is not None and p.zone not in exclude_zones]
    bones = sorted({name for p in prims for name, _ in p.bone_weights(co[:1])})
    index = {b: i for i, b in enumerate(bones)}
    count = len(co)
    dist = np.full((len(prims), count), 1e3, dtype=np.float32)
    for i, prim in enumerate(prims):
        lo, hi = prim.bounds()
        sel = np.all((co >= lo - 6 * sigma) & (co <= hi + 6 * sigma), axis=1)
        if sel.any():
            dist[i, sel] = prim.field(co[sel])
    best = dist.min(axis=0)
    W = np.zeros((count, len(bones)), dtype=np.float32)
    for i, prim in enumerate(prims):
        w = np.exp(-np.maximum(dist[i] - best, 0) / sigma)
        w[dist[i] - best > 6 * sigma] = 0
        if not w.any():
            continue
        for bone, bw in prim.bone_weights(co):
            W[:, index[bone]] += w * bw
    W /= np.maximum(W.sum(axis=1, keepdims=True), 1e-9)
    if smooth:
        W = laplacian(W, edges_np(obj), count, smooth, 0.5)
    # Keep the strongest ``keep`` influences.
    order = np.argsort(-W, axis=1)
    mask = np.zeros_like(W, dtype=bool)
    np.put_along_axis(mask, order[:, :keep], True, axis=1)
    W = np.where(mask, W, 0)
    W[W < 0.02] = 0
    W /= np.maximum(W.sum(axis=1, keepdims=True), 1e-9)
    obj.vertex_groups.clear()
    for bone, i in index.items():
        group = obj.vertex_groups.new(name=bone)
        nz = np.nonzero(W[:, i])[0]
        for v in nz:
            group.add([int(v)], float(W[v, i]), "REPLACE")
    return bones


def bind_armature(obj, arm):
    mod = obj.modifiers.new("armature", "ARMATURE")
    mod.object = arm
    return mod


# ------------------------------------------------------------------ uv/bake
def unwrap(objects, margin=0.004):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(62), island_margin=margin, area_weight=0.0,
                             correct_aspect=True, scale_to_bounds=False)
    bpy.ops.uv.pack_islands(margin=margin, rotate=True, shape_method="CONCAVE")
    bpy.ops.object.mode_set(mode="OBJECT")


def image(name, size, color=(0, 0, 0, 1), data=False):
    img = bpy.data.images.get(name)
    if img:
        bpy.data.images.remove(img)
    img = bpy.data.images.new(name, size, size, alpha=False, float_buffer=False)
    img.generated_color = color
    if data:
        img.colorspace_settings.name = "Non-Color"
    return img


def bake_material(obj, target):
    mat = bpy.data.materials.new(f"bake-{obj.name}")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = target
    nodes.active = tex
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    return mat


def emission_material(name, attribute, strength=1.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = attribute
    emit.inputs["Strength"].default_value = strength
    nt.links.new(attr.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs[0], out.inputs["Surface"])
    return mat


def diffuse_material(name):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    return mat


def set_material(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def bake(kind, low, highs, target, extrusion, distance, samples=16, margin=6):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = samples
    bake_material(low, target)
    bpy.ops.object.select_all(action="DESELECT")
    for h in highs:
        h.select_set(True)
        h.hide_render = False
    low.select_set(True)
    bpy.context.view_layer.objects.active = low
    settings = scene.render.bake
    settings.use_selected_to_active = True
    settings.cage_extrusion = extrusion
    settings.max_ray_distance = distance
    settings.margin = margin
    settings.margin_type = "EXTEND"
    settings.use_clear = False
    settings.normal_space = "TANGENT"
    kw = {"type": kind}
    if kind == "EMIT":
        pass
    bpy.ops.object.bake(**kw)


def image_np(img):
    px = np.empty(img.size[0] * img.size[1] * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    return px.reshape(img.size[1], img.size[0], 4)


def save_np(arr, path, size=None, data=False):
    h, w = arr.shape[:2]
    img = bpy.data.images.new(Path(path).stem, w, h, alpha=False, float_buffer=False)
    if data:
        img.colorspace_settings.name = "Non-Color"
    img.pixels.foreach_set(np.ascontiguousarray(arr, dtype=np.float32).ravel())
    if size and size != w:
        img.scale(size, size)
    img.filepath_raw = str(path)
    img.file_format = "PNG"
    img.save()
    bpy.data.images.remove(img)


# ------------------------------------------------------------------ renders
def look_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def review_lights(strength=1.0, scale=1.0, center=(0, 0, 0.4)):
    for name, loc, energy, size, color in [
        ("key", (2.6, -3.0, 4.2), 900, 2.5, (1.0, 0.86, 0.72)),
        ("rim", (-3.4, 2.4, 2.2), 700, 2.0, (0.55, 0.75, 1.0)),
        ("fill", (3.5, 3.2, 1.2), 160, 4.0, (0.75, 0.85, 1.0)),
    ]:
        light = bpy.data.lights.new(name, "AREA")
        light.energy = energy * strength * scale * scale
        light.size = size * scale
        light.color = color
        obj = bpy.data.objects.new(name, light)
        obj.location = Vector(center) + Vector(loc) * scale
        bpy.context.scene.collection.objects.link(obj)
        look_at(obj, center)


def render_setup(engine="CYCLES", samples=48, transparent=True):
    scene = bpy.context.scene
    scene.render.engine = engine
    if engine == "CYCLES":
        scene.cycles.device = "CPU"
        scene.cycles.samples = samples
        scene.cycles.use_denoising = True
    scene.render.film_transparent = transparent
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    world = bpy.data.worlds.new("k11-world")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.05, 0.065, 0.08, 1)
    bg.inputs[1].default_value = 0.35
    scene.world = world


def camera(kind="ORTHO"):
    cam = bpy.data.cameras.new("cam")
    cam.type = kind
    obj = bpy.data.objects.new("cam", cam)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.scene.camera = obj
    return obj


def frame_objects(cam, objects, direction, pad=1.12, depsgraph=True):
    direction = Vector(direction).normalized()
    dg = bpy.context.evaluated_depsgraph_get()
    pts = []
    for obj in objects:
        ev = obj.evaluated_get(dg)
        mesh = ev.to_mesh()
        pts.extend(ev.matrix_world @ v.co for v in mesh.vertices)
        ev.to_mesh_clear()
    center = sum(pts, Vector()) / len(pts)
    cam.location = center + direction * 20
    look_at(cam, center)
    R = cam.rotation_euler.to_matrix()
    right, up = R @ Vector((1, 0, 0)), R @ Vector((0, 1, 0))
    xs = [(p - center).dot(right) for p in pts]
    ys = [(p - center).dot(up) for p in pts]
    cam.location += right * ((min(xs) + max(xs)) / 2) + up * ((min(ys) + max(ys)) / 2)
    cam.data.ortho_scale = max(max(xs) - min(xs), max(ys) - min(ys)) * pad
    cam.data.clip_end = 100
    return max(xs) - min(xs), max(ys) - min(ys)


def render(path, size):
    scene = bpy.context.scene
    scene.render.resolution_x = size[0]
    scene.render.resolution_y = size[1]
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
