"""Build the Brood growth kit: sculpt -> VDB -> decimate -> vertex-colour + AO bake -> shared normal atlas -> GLB.

blender -b --factory-startup -P tools/assets/k11-creatures/growth/build.py -- [--only=a,b] [--no-render]
Output: public/assets/brood-growth/{brood-growth.glb, brood-growth-normal.png, manifest.json}
Format follows the P11 set-piece contract (named stock-PBR finishes, COLOR_0 multiplier, normalMap only).
"""

import json
import math
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
sys.path.insert(0, str(HERE))

import bpy
import numpy as np
from mathutils import Vector

import kit as K
import sdf as S
import pieces as PC

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ONLY = next((a.split("=", 1)[1].split(",") for a in args if a.startswith("--only=")), None)
RENDER = "--no-render" not in args
OUT = K.ROOT / "public/assets/brood-growth"
REVIEW = K.ROOT / "artifacts/nextgen/growth-final"
ATLAS = 1024
started = time.time()

# Two tones (wine flesh, dusky shell/bone ribs) plus the violet lantern. Linear RGB.
PALETTE = {
    S.SHELL: (0.15, 0.065, 0.06), S.ARMOR: (0.30, 0.20, 0.18), S.CREST: (0.34, 0.25, 0.22), S.TOOTH: (0.40, 0.32, 0.28),
    S.FLESH: (0.15, 0.03, 0.055), S.MEMBRANE: (0.14, 0.03, 0.06), S.SINEW: (0.28, 0.07, 0.11),
    S.UNDER: (0.085, 0.05, 0.055), S.CAVITY: (0.02, 0.005, 0.012), S.ORGAN: (0.55, 0.22, 1.0), S.EYE: (0.2, 0.08, 0.22),
    S.CLAW: (0.03, 0.02, 0.025),
}
FINISHES = {"brood-growth": None, "brood-lantern": (0.55, 0.22, 1.0, 3.0), "brood-pod-glow": (0.42, 0.16, 0.62, 0.45)}

scene = K.reset_scene()
OUT.mkdir(parents=True, exist_ok=True)
REVIEW.mkdir(parents=True, exist_ok=True)


def colour_high(high, sculpture):
    co = K.verts_np(high)
    _, win = sculpture.evaluate_points(co, track=True)
    zone = np.array([sculpture.prims[i].zone if i >= 0 else S.FLESH for i in win])
    plate = np.array([sculpture.prims[i].plate if i >= 0 else 0 for i in win])
    voxel = high["voxel"]
    # baked-only surface character: pitting/scars on shell, creases in flesh
    n = K.normals_np(high)
    hard = np.isin(zone, [S.SHELL, S.ARMOR, S.CREST]).astype(np.float32)
    soft = np.isin(zone, [S.FLESH, S.MEMBRANE, S.SINEW, S.UNDER]).astype(np.float32)
    f, _ = S.worley(co / (voxel * 5.0), 3)
    d = -hard * S.smoothstep(0.34, 0.0, f) * voxel * 0.9
    crease = np.abs(S.fbm(co / (voxel * 9.0), 3, 5))
    d -= soft * (1 - S.smoothstep(0.0, 0.14, crease)) * voxel * 0.6
    K.set_verts(high, co + n * d[:, None])
    cv = K.curvature(high)
    cv = K.laplacian(cv, K.edges_np(high), len(co), 6, 0.5)
    cv /= np.std(cv) + 1e-6
    base = np.array([PALETTE.get(z, PALETTE[S.FLESH]) for z in zone], np.float32)
    var = 0.88 + 0.24 * ((plate * 2654435761) % 997 / 997.0)
    base[hard > 0] *= var[hard > 0, None]
    convex, concave = S.smoothstep(0.6, 1.9, cv), S.smoothstep(0.3, 1.5, -cv)
    edge = np.asarray((0.45, 0.33, 0.28), np.float32)
    wet = np.asarray((0.42, 0.16, 0.2), np.float32)
    base += (edge - base) * (convex * hard * 0.6)[:, None]
    base += (wet - base) * (convex * soft * 0.4)[:, None]
    base *= (1 - np.where(soft > 0, 0.3, 0.55) * concave)[:, None]
    base *= (1 + 0.08 * S.fbm(co * 6.0, 2, 9))[:, None]
    K.write_color(high, "base", np.hstack([np.clip(base, 0, 1), np.ones((len(co), 1), np.float32)]))
    return zone


def finish_faces(low, sculpture):
    """Material index per face from the winning zone at face centres."""
    m = low.data
    centres = np.empty(len(m.polygons) * 3, np.float32)
    m.polygons.foreach_get("center", centres)
    _, win = sculpture.evaluate_points(centres.reshape(-1, 3), track=True)
    zone = np.array([sculpture.prims[i].zone if i >= 0 else S.FLESH for i in win])
    idx = np.where(zone == S.ORGAN, 1, np.where(zone == S.EYE, 2, 0)).astype(np.int32)
    m.polygons.foreach_set("material_index", idx)
    m.update()
    low["finish_index"] = idx.tolist()
    K.log(f"{low.name}: lantern faces {int((idx == 1).sum())}, pod faces {int((idx == 2).sum())}")


def vc_bake(kind, low, high, name, ext, dist, samples=1):
    attr = low.data.color_attributes.get(name) or low.data.color_attributes.new(name, "FLOAT_COLOR", "POINT")
    low.data.color_attributes.active_color = attr
    bpy.ops.object.select_all(action="DESELECT")
    high.select_set(True)
    low.select_set(True)
    bpy.context.view_layer.objects.active = low
    scene.render.engine = "CYCLES"
    scene.cycles.samples = samples
    b = scene.render.bake
    b.target = "VERTEX_COLORS"
    b.use_selected_to_active = True
    b.cage_extrusion = ext
    b.max_ray_distance = dist
    bpy.ops.object.bake(type=kind)
    out = np.empty(len(attr.data) * 4, np.float32)
    attr.data.foreach_get("color", out)
    return out.reshape(-1, 4)


# ------------------------------------------------------------------- materials
emit_base = K.emission_material("emit-base", "base")
plain = K.diffuse_material("plain")
normal_img = K.image("brood-growth-normal", 2048, (0.5, 0.5, 1, 1), data=True)
mats = {}
for name, glow in FINISHES.items():
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    rgba = (1, 1, 1, 1) if glow is None else (*glow[:3], 1)
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value = 0.5
    if glow:
        bsdf.inputs["Emission Color"].default_value = rgba
        bsdf.inputs["Emission Strength"].default_value = glow[3]
    vc = nt.nodes.new("ShaderNodeVertexColor")
    vc.layer_name = "AO"
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type, mix.blend_type = "RGBA", "MULTIPLY"
    mix.inputs["Factor"].default_value = 1
    mix.inputs[6].default_value = rgba
    nt.links.new(vc.outputs["Color"], mix.inputs[7])
    nt.links.new(mix.outputs[2], bsdf.inputs["Base Color"])
    mats[name] = mat

# ---------------------------------------------------------------------- pieces
built = {}
for name, fn in PC.PIECES.items():
    if ONLY and name not in ONLY:
        continue
    sculpture, budget, meta = fn()
    if meta.pop("floorCut", True):
        sculpture.add(S.Box((0, 0, -5), (40, 40, 5), op="sub", zone=S.CAVITY))   # nothing below the floor
    lo, hi = sculpture.bounds(0.0)
    voxel = float(np.clip(max(hi - lo) / 230, 0.006, 0.03))
    high = K.sculpt_mesh(sculpture, voxel, name + "-high")
    high["voxel"] = voxel
    K.smooth_mesh(high, 1, 0.4)
    low = K.duplicate(high, name)
    colour_high(high, sculpture)
    K.shade_smooth(high)
    K.decimate(low, budget)
    K.shade_smooth(low)
    K.set_material(low, mats["brood-growth"])
    low.data.materials.append(mats["brood-lantern"])
    low.data.materials.append(mats["brood-pod-glow"])
    finish_faces(low, sculpture)
    built[name] = (low, high, meta, budget, voxel)
    K.log(f"{name}: {len(low.data.polygons)} tris, voxel {voxel:.3f}, {time.time() - started:.0f}s")

# vertex colour bakes (albedo from the sculpt, AO from the high surface)
for name, (low, high, meta, budget, voxel) in built.items():
    K.set_material(high, emit_base)
    keep = [m for m in low.data.materials]
    base = vc_bake("EMIT", low, high, "Col", voxel * 6, voxel * 14)
    K.set_material(high, plain)
    ao = vc_bake("AO", low, high, "AOraw", voxel * 6, voxel * 14, samples=32)
    final = base.copy()
    final[:, :3] = base[:, :3] * (0.45 + 0.55 * ao[:, :3])
    for extra in ("Col", "AOraw"):
        low.data.color_attributes.remove(low.data.color_attributes[extra])
    loops = np.empty(len(low.data.loops), np.int64)
    low.data.loops.foreach_get("vertex_index", loops)
    attr = low.data.color_attributes.new("AO", "BYTE_COLOR", "CORNER")
    attr.data.foreach_set("color", np.clip(final[loops], 0, 1).ravel())
    low.data.color_attributes.active_color = attr
    low.data.color_attributes.render_color_index = list(low.data.color_attributes).index(attr)
    low.data.materials.clear()
    for m in keep:
        low.data.materials.append(m)

# shared normal atlas
lows = [v[0] for v in built.values()]
K.unwrap(lows, margin=0.004)
for name, (low, high, meta, budget, voxel) in built.items():
    K.set_material(high, plain)
    keep = list(low.data.materials)
    tex_mat = bpy.data.materials.new("bake-" + name)
    tex_mat.use_nodes = True
    t = tex_mat.node_tree.nodes.new("ShaderNodeTexImage")
    t.image = normal_img
    tex_mat.node_tree.nodes.active = t
    low.data.materials.clear()
    low.data.materials.append(tex_mat)
    scene.render.bake.target = "IMAGE_TEXTURES"
    K.bake("NORMAL", low, [high], normal_img, voxel * 6, voxel * 14, samples=1, margin=4)
    low.data.materials.clear()
    for m in keep:
        low.data.materials.append(m)
normal_path = OUT / "brood-growth-normal.png"
K.save_np(K.image_np(normal_img), normal_path, ATLAS, data=True)
nimg = bpy.data.images.load(str(normal_path))
nimg.colorspace_settings.name = "Non-Color"
for name in ("brood-growth",):
    nt = mats[name].node_tree
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = nimg
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nm.inputs["Strength"].default_value = 1.0
    nt.links.new(tex.outputs["Color"], nm.inputs["Color"])
    nt.links.new(nm.outputs["Normal"], nt.nodes["Principled BSDF"].inputs["Normal"])

# ---------------------------------------------------------------------- export
for name, (low, high, meta, budget, voxel) in built.items():
    low.data.polygons.foreach_set("material_index", np.asarray(low["finish_index"], np.int32))
    low.data.update()
for high in [v[1] for v in built.values()]:
    bpy.data.objects.remove(high)
models = []
for name, (low, high, meta, budget, voxel) in built.items():
    co = K.verts_np(low)
    lo3, hi3 = co.min(0), co.max(0)
    models.append({"name": name, "triangles": len(low.data.polygons), "budget": budget, "sizeNote": "size = glTF x, y (height), z",
                   "size": [round(float(hi3[0] - lo3[0]), 3), round(float(hi3[2] - lo3[2]), 3), round(float(hi3[1] - lo3[1]), 3)],
                   "bounds": {"min": [round(float(lo3[0]), 3), round(float(lo3[2]), 3), round(float(-hi3[1]), 3)],
                              "max": [round(float(hi3[0]), 3), round(float(hi3[2]), 3), round(float(-lo3[1]), 3)]},
                   "finishes": sorted({low.data.materials[p.material_index].name for p in low.data.polygons}),
                   **{("nominalWidthDepthHeight" if k == "size" else k): v for k, v in meta.items()}})
bpy.ops.object.select_all(action="DESELECT")
for low in lows:
    low.select_set(True)
bpy.context.view_layer.objects.active = lows[0]
glb = OUT / "brood-growth.glb"
if not ONLY:
    bpy.ops.export_scene.gltf(filepath=str(glb), export_format="GLB", use_selection=True, export_yup=True, export_apply=True,
                              export_extras=True, export_materials="EXPORT", export_vertex_color="ACTIVE",
                              export_all_vertex_colors=False, export_animations=False, export_cameras=False,
                              export_lights=False, export_texcoords=True)
    manifest = {
        "name": "Containment Brood growth kit", "license": "MIT", "author": "Containment contributors",
        "source": "tools/assets/k11-creatures/growth/build.py",
        "rebuild": "sh tools/assets/k11-creatures/growth/rebuild.sh",
        "coordinateSystem": "glTF Y-up, metres; bottom-centred origins, fronts face +Z (camera side); wall-backed pieces put the wall at -Z",
        "format": "P11 set-piece contract: COLOR_0 albedo x baked AO multiplier, one shared tangent normal atlas, single opaque finish + two emissive finishes",
        "finishes": {"brood-growth": "opaque organic surface (vertex colour + normal atlas)",
                     "brood-lantern": "pulse: lantern organs (violet emissive)",
                     "brood-pod-glow": "pulse slowly/dim: pods and brood-opening depths"},
        "normalAtlas": {"file": normal_path.name, "size": ATLAS},
        "models": models,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=1))
    K.log("exported", glb, glb.stat().st_size)

# ---------------------------------------------------------------------- review
if RENDER:
    K.render_setup("CYCLES", samples=24, transparent=False)
    cols = 5
    x = y = 0.0
    row_h = 0.0
    for i, low in enumerate(lows):
        co = K.verts_np(low)
        w = float(co[:, 0].max() - co[:, 0].min()) + 0.8
        low.location = (x + w / 2, y, 0)
        x += w
        row_h = max(row_h, float(co[:, 1].max() - co[:, 1].min()) + 1.0)
        if (i + 1) % cols == 0:
            x, y, row_h = 0.0, y + row_h, 0.0
    centre = sum((Vector(l.location) for l in lows), Vector()) / len(lows)
    K.review_lights(0.35, scale=6.0, center=tuple(centre))
    cam = K.camera("ORTHO")
    K.frame_objects(cam, lows, (0.6, -1.4, 1.2), pad=1.05)
    K.render(REVIEW / "kit-beauty.png", (900, 600))
    pitch = math.atan2(26, 19)
    K.frame_objects(cam, lows, (0.0, -math.cos(pitch), math.sin(pitch)), pad=1.05)
    K.render(REVIEW / "kit-gameplay.png", (900, 600))
K.log(f"GROWTH READY {len(built)} pieces {time.time() - started:.0f}s")
