"""Build one Lantern Brood caste: sculpt -> mesh -> decimate -> weights -> UV -> bake -> GLB -> renders.

blender -b -P tools/assets/k11-creatures/build.py -- --caste=crawler [--review=DIR] [--no-export]
"""

import importlib
import json
import math
import shutil
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import bpy
import numpy as np
from mathutils import Vector

import kit as K
import sdf as S

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


def opt(key, default=None):
    return next((a.split("=", 1)[1] for a in args if a.startswith(f"--{key}=")), default)


CASTE = opt("caste", "crawler")
REVIEW = Path(opt("review", str(K.ROOT / "artifacts/nextgen/k11-final" / CASTE)))
EXPORT = "--no-export" not in args
BAKE_SIZE = int(opt("bake", "2048"))
M = importlib.import_module(CASTE)
RADIUS = {"crawler": 14, "stalker": 17, "spitter": 18, "brute": 28, "carrier": 24}[M.FAMILY] / 32
started = time.time()

ZONE_KEY = {S.SHELL: "shell", S.MEMBRANE: "membrane", S.SINEW: "sinew", S.CLAW: "claw", S.ORGAN: "organ",
            S.EYE: "eye", S.CREST: "crest", S.TOOTH: "tooth", S.CAVITY: "cavity", S.UNDER: "under",
            S.ARMOR: "armor", S.FLESH: "flesh", S.BONE: "bone"}

scene = K.reset_scene()
arm = K.load_contract(M.ASSET)
volumes = json.loads((HERE / "reference" / f"{M.ASSET}-volumes.json").read_text())["parts"]
sk = K.Skeleton(arm, M.ASPECT, volumes)
parts = M.build(sk)
REVIEW.mkdir(parents=True, exist_ok=True)
BAKES = HERE / "bakes" / M.FAMILY
BAKES.mkdir(parents=True, exist_ok=True)


def palette():
    P = dict(M.PALETTE)
    shell, edge = np.asarray(P["shell"], np.float32), np.asarray(P["edge"], np.float32)
    P.setdefault("armor", tuple(shell * 0.35 + edge * 0.65))
    P.setdefault("flesh", (0.30, 0.045, 0.055))
    # BOSS14 attacking plane: matte pale bone, clearly lighter than body and deck, never emissive
    P.setdefault("bone", (0.72, 0.67, 0.56))
    return P


def tertiary(high, sculpture, seed=0):
    """Baked-only surface character: pitting and scars on hard shell, creased wet flesh."""
    co, n = K.verts_np(high), K.normals_np(high)
    _, win = sculpture.evaluate_points(co, track=True)
    zone = np.array([sculpture.prims[i].zone if i >= 0 else S.SHELL for i in win])
    v = M.VOXEL
    hard = np.isin(zone, [S.SHELL, S.ARMOR, S.CREST, S.UNDER]).astype(np.float32)
    soft = np.isin(zone, [S.MEMBRANE, S.FLESH, S.SINEW]).astype(np.float32)
    d = np.zeros(len(co), np.float32)
    f, _ = S.worley(co / (v * 5.5), 11 + seed)
    d -= hard * S.smoothstep(0.34, 0.0, f) * v * 0.9
    f, _ = S.worley(co / (v * 2.8), 23 + seed)
    d -= hard * S.smoothstep(0.26, 0.0, f) * v * 0.45
    rng = np.random.default_rng(5 + seed)
    hard_idx = np.nonzero(hard)[0]
    for _ in range(14 if len(hard_idx) else 0):
        i = hard_idx[rng.integers(len(hard_idx))]
        t = np.cross(n[i], rng.normal(size=3).astype(np.float32))
        t /= max(float(np.linalg.norm(t)), 1e-6)
        a, b = co[i] - t * v * rng.uniform(8, 20), co[i] + t * v * rng.uniform(8, 20)
        ab = b - a
        h = np.clip(((co - a) @ ab) / float(ab @ ab), 0, 1)
        dist = np.linalg.norm(co - a - h[:, None] * ab, axis=1)
        d -= hard * S.smoothstep(1.8 * v, 0.0, dist) * v * 1.1
    crease = np.abs(S.fbm(co / (v * 8.0), 3, 31 + seed))
    d -= soft * (1 - S.smoothstep(0.0, 0.14, crease)) * v * 0.5
    d += soft * S.fbm(co / (v * 3.0), 2, 41 + seed) * v * 0.25
    K.set_verts(high, co + n * d[:, None])


# CREATURE18 three-band finish: dark chitin, mid flesh, one saturated accent (+ a matte "bone" plane).
BAND_OF = {S.SHELL: "chitin", S.UNDER: "chitin", S.CLAW: "chitin", S.ARMOR: "chitin", S.CREST: "chitin",
           S.CAVITY: "chitin", S.MEMBRANE: "flesh", S.FLESH: "flesh", S.SINEW: "flesh", S.BONE: "bone",
           S.TOOTH: "bone", S.ORGAN: "accent", S.EYE: "accent"}
ELITE_GOLD = (0.90, 0.76, 0.42)   # CREATURE21: paler rank crest (still below the marine plates)


def colorize_bands(high, sculpture):
    """Large deliberate value shapes that survive two-band shading at 60-140 px: no grain, no blotches."""
    co = K.verts_np(high)
    _, win = sculpture.evaluate_points(co, track=True)
    zone = np.array([sculpture.prims[i].zone if i >= 0 else S.SHELL for i in win])
    plate = np.array([sculpture.prims[i].plate if i >= 0 else 0 for i in win])
    cv = K.curvature(high)
    cv = K.laplacian(cv, K.edges_np(high), len(co), 6, 0.5)
    cv = cv / (np.std(cv) + 1e-6)
    B = M.BANDS
    base = np.zeros((len(co), 3), np.float32)
    remap = getattr(M, "BAND_MAP", {})   # caste override: zone key -> band
    bands = np.empty(len(co), object)
    for z, band in BAND_OF.items():
        band = remap.get(ZONE_KEY[z], band)
        sel = zone == z
        bands[sel] = band
    for pid, band in getattr(M, "PLATE_BAND", {}).items():   # chosen plates keep a deliberate band
        bands[plate == pid] = band
    for band in set(bands.tolist()):
        sel = bands == band
        base[sel] = B[band]
    base[zone == S.EYE] = B.get("eye", B["accent"])
    base[zone == S.CAVITY] *= 0.5
    chitin = bands == "chitin"
    elite = sculpture.name.endswith("-elite")
    if elite:   # rank reads as a gold crest/plating that adds silhouette, not only a tint
        hard = np.isin(zone, [S.SHELL, S.UNDER, S.ARMOR, S.CREST, S.CLAW, S.BONE, S.TOOTH])
        base[hard] = ELITE_GOLD
        chitin &= ~hard
    # one quiet plate step so shingles stay legible without becoming camouflage
    # CREATURE23: no per-plate value step: three flat values per material (dark plate, mid flesh, one lit edge)
    convex = S.smoothstep(0.9, 2.2, cv)
    concave = S.smoothstep(0.6, 1.8, -cv)
    lift = np.where(chitin, 0.12, np.where(bands == "bone", 0.06, 0.0))
    base = base + (np.minimum(base * 2.2 + 0.03, 1.0) - base) * (convex * lift)[:, None]
    base *= (1 - 0.10 * concave)[:, None]
    glow = np.zeros((len(co), 3), np.float32)
    for key in ("organ", "eye"):
        sel = zone == (S.ORGAN if key == "organ" else S.EYE)
        glow[sel] = np.asarray(M.GLOW[key], np.float32) * (0.75 + 0.25 * np.clip(1 - concave[sel], 0, 1))[:, None]
    if elite:   # CREATURE21: emissive seams along the rank crest's creases and edges (family lantern hue at runtime)
        seam = hard & (S.smoothstep(0.6, 1.6, cv) > 0.3)
        glow[seam] = np.maximum(glow[seam], np.asarray(M.GLOW["organ"], np.float32) * 0.55)
    ones = np.ones((len(co), 1), np.float32)
    K.write_color(high, "glow", np.hstack([glow, ones]))
    K.write_color(high, "base", np.hstack([np.clip(base, 0, 1), ones]))


def colorize(high, sculpture):
    """Flat readable zones + painted edge wear from curvature, as vertex colours."""
    if hasattr(M, "BANDS"):
        return colorize_bands(high, sculpture)
    co = K.verts_np(high)
    _, win = sculpture.evaluate_points(co, track=True)
    zone = np.array([sculpture.prims[i].zone if i >= 0 else S.SHELL for i in win])
    tint = np.array([sculpture.prims[i].tint if i >= 0 else 1.0 for i in win], np.float32)
    plate = np.array([sculpture.prims[i].plate if i >= 0 else 0 for i in win])
    cv = K.curvature(high)
    cv = K.laplacian(cv, K.edges_np(high), len(co), 6, 0.5)
    cv = cv / (np.std(cv) + 1e-6)
    P = palette()
    base = np.zeros((len(co), 3), np.float32)
    glow = np.zeros((len(co), 3), np.float32)
    for z, key in ZONE_KEY.items():
        sel = zone == z
        if sel.any():
            base[sel] = P.get(key, P["shell"])
    plate_var = 0.9 + 0.2 * ((plate * 2654435761) % 997 / 997.0)
    shellish = np.isin(zone, [S.SHELL, S.CREST, S.UNDER, S.ARMOR])
    base[shellish] *= (tint * plate_var)[shellish, None]
    convex = S.smoothstep(0.6, 1.9, cv)
    concave = S.smoothstep(0.3, 1.5, -cv)
    edge = np.asarray(P["edge"], np.float32)
    wear = np.where(shellish, 0.85, np.where(zone == S.CLAW, 0.35, 0.15))
    base = base + (edge - base) * (convex * wear)[:, None]
    soft_z = np.isin(zone, [S.FLESH, S.MEMBRANE, S.ORGAN])
    base *= (1 - np.where(soft_z, 0.25, 0.55) * concave)[:, None]
    # wet flesh: raw saturated tissue, dark creases, pale wet highlights
    wet = np.isin(zone, [S.FLESH, S.MEMBRANE])
    hi_col = np.asarray(P.get("wet", (0.62, 0.30, 0.26)), np.float32)
    base[wet] = base[wet] + (hi_col - base[wet]) * (0.55 * convex[wet])[:, None]
    grain = S.fbm(co * 40.0, 2, 7)
    base *= (1 + 0.08 * grain)[:, None]
    for key in ("organ", "eye"):
        z = S.ORGAN if key == "organ" else S.EYE
        sel = zone == z
        g = np.asarray(M.GLOW[key], np.float32)
        glow[sel] = g * (0.55 + 0.45 * np.clip(1 - concave[sel], 0, 1))[:, None]
    # translucent brood: pods glow through soft skin with distance falloff
    pods = M.glow_pods_for(sculpture.name) if hasattr(M, "glow_pods_for") else getattr(M, "GLOW_PODS", [])
    if pods:
        soft = np.isin(zone, [S.FLESH, S.MEMBRANE, S.SINEW])
        g = np.asarray(M.GLOW["organ"], np.float32)
        through = np.zeros(len(co), np.float32)
        for c, r in pods:
            dd = np.linalg.norm(co - np.asarray(c, np.float32), axis=1)
            through = np.maximum(through, np.exp(-np.maximum(dd - r * 0.9, 0) / (r * 0.35)))
        through *= soft * (0.55 + 0.45 * (1 - concave))
        glow += g[None, :] * (0.5 * through)[:, None]
        base += (np.asarray(P["organ"], np.float32) - base) * (0.45 * through)[:, None]
    ones = np.ones((len(co), 1), np.float32)
    K.write_color(high, "glow", np.hstack([glow, ones]))
    K.write_color(high, "base", np.hstack([np.clip(base, 0, 1), ones]))


# ------------------------------------------------------------------- sculpt
highs, lows = {}, {}
for name, sculpture in parts.items():
    high = K.sculpt_mesh(sculpture, M.VOXEL, f"{M.FAMILY}-{name}-high")
    K.smooth_mesh(high, 1, 0.4)
    K.shade_smooth(high)
    low = K.duplicate(high, f"{M.FAMILY}-{name}-low")
    tertiary(high, sculpture)
    colorize(high, sculpture)
    for attr in list(low.data.color_attributes):
        low.data.color_attributes.remove(attr)
    K.decimate(low, M.TRIS[name])
    K.shade_smooth(low)
    K.skin_weights(low, sculpture, sigma=M.VOXEL * 2.5, smooth=2)
    # named emission regions from the sculpture (prim.name), carried as a 2-channel point attribute
    reg_prims = [(i, p) for i, p in enumerate(sculpture.prims) if p.name in ("warden-ram", "matron-vents")]
    if reg_prims:
        lco = K.verts_np(low)
        reg = np.zeros((len(lco), 2), np.float32)
        for i, p in reg_prims:
            lo_, hi_ = p.bounds()
            sel = np.all((lco >= lo_ - M.VOXEL * 6) & (lco <= hi_ + M.VOXEL * 6), axis=1)
            if sel.any():
                ch = 0 if p.name == "warden-ram" else 1
                w = 1 - S.smoothstep(M.VOXEL * 1.0, M.VOXEL * 5.0, p.field(lco[sel]))
                reg[sel, ch] = np.maximum(reg[sel, ch], w)
        attr = low.data.attributes.new("k11_region", "FLOAT2", "POINT")
        attr.data.foreach_set("vector", reg.ravel())
    highs[name], lows[name] = high, low
    K.log(f"{name}: sculpted in {time.time() - started:.0f}s")

# ---------------------------------------------------------------------- uv
K.unwrap(list(lows.values()), margin=0.006)

# -------------------------------------------------------------------- bake
emit_base = K.emission_material("emit-base", "base")
emit_glow = K.emission_material("emit-glow", "glow")
plain = K.diffuse_material("plain")
images = {kind: K.image(f"{M.FAMILY}-{kind}", BAKE_SIZE, (0.2, 0.05, 0.02, 1), data=kind in ("normal", "ao"))
          for kind in ("base", "glow", "normal", "ao")}
images["normal"].generated_color = (0.5, 0.5, 1, 1)
images["ao"].generated_color = (1, 1, 1, 1)
images["glow"].generated_color = (0, 0, 0, 1)
ext, dist = M.VOXEL * 8, M.VOXEL * 18
for name in parts:
    high, low = highs[name], lows[name]
    for kind, mat, bake_type, samples in [("base", emit_base, "EMIT", 1), ("glow", emit_glow, "EMIT", 1),
                                          ("normal", plain, "NORMAL", 1), ("ao", plain, "AO", 24)]:
        K.set_material(high, mat)
        K.bake(bake_type, low, [high], images[kind], ext, dist, samples=samples)
    K.log(f"{name}: baked in {time.time() - started:.0f}s")

base = K.image_np(images["base"])
ao = K.image_np(images["ao"])
glow = K.image_np(images["glow"])
normal = K.image_np(images["normal"])
# Bake AO into the albedo (actors draw without an AO sampler on the flat path).
if hasattr(M, "BANDS"):   # CREATURE18: light occlusion only, so crevices do not turn the mid band to mud
    base[..., :3] *= 0.88 + 0.12 * ao[..., :3]   # CREATURE23: flatter fold
else:
    base[..., :3] *= (0.42 + 0.58 * ao[..., :3]) ** 1.15
paths = {kind: BAKES / f"{M.FAMILY}-{kind}.png" for kind in ("base", "normal", "glow")}
K.save_np(base, paths["base"], M.ATLAS)
K.save_np(normal, paths["normal"], M.ATLAS, data=True)
K.save_np(glow, paths["glow"], M.ATLAS // 2)

# --------------------------------------------------------- game material
game = bpy.data.materials.new(f"k11-{M.FAMILY}")
game.use_nodes = True
nt = game.node_tree
bsdf = nt.nodes["Principled BSDF"]
bsdf.inputs["Roughness"].default_value = 0.6
for kind, socket in (("base", "Base Color"), ("glow", "Emission Color")):
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(str(paths[kind]))
    nt.links.new(tex.outputs["Color"], bsdf.inputs[socket])
bsdf.inputs["Emission Strength"].default_value = 3.0
tex = nt.nodes.new("ShaderNodeTexImage")
tex.image = bpy.data.images.load(str(paths["normal"]))
tex.image.colorspace_settings.name = "Non-Color"
nmap = nt.nodes.new("ShaderNodeNormalMap")
nt.links.new(tex.outputs["Color"], nmap.inputs["Color"])
nt.links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
for low in lows.values():
    K.set_material(low, game)
for high in highs.values():
    high.hide_render = True
    high.hide_set(True)

# ---------------------------------------------------------------- variants
ranks = ["base", "elite"] + (["boss"] if "boss" in parts else [])
variants = {}
for rank in ranks:
    members = ["body"] + (["elite"] if rank in ("elite", "boss") and "elite" in lows else []) + (["boss"] if rank == "boss" else [])
    members = getattr(M, "RANK_PARTS", {}).get(rank, members)
    copies = [K.duplicate(lows[m], f"k11-{M.FAMILY}-{rank}") for m in members]
    bpy.ops.object.select_all(action="DESELECT")
    for c in copies:
        c.select_set(True)
    bpy.context.view_layer.objects.active = copies[0]
    if len(copies) > 1:
        bpy.ops.object.join()
    v = bpy.context.view_layer.objects.active
    v.name = v.data.name = f"k11-{M.FAMILY}-{rank}"
    variants[rank] = v
    if getattr(M, "RANK_SCALE", {}).get(rank):
        v["k11RankScale"] = M.RANK_SCALE[rank]
for low in lows.values():
    low.hide_render = True
    low.hide_set(True)

stats = {rank: len(v.data.polygons) for rank, v in variants.items()}
co = K.verts_np(variants["base"])
lo, hi = co.min(0), co.max(0)
centre = (lo + hi) / 2
radial = float(np.max(np.linalg.norm(co[:, :2] - centre[:2], axis=1)))
hs = 0.94 * RADIUS / radial   # metres per design unit, mirrors the runtime fit
stats.update({"hs": hs, "height_m": float((hi[2] - lo[2]) * hs), "radial": radial, "seconds": round(time.time() - started)})
for rank, v in variants.items():   # per-rank in-game estimate incl. boss-tier scale (rest pose, bounds centre)
    rc = K.verts_np(v)
    rlo, rhi = rc.min(0), rc.max(0)
    rr = float(np.max(np.linalg.norm(rc[:, :2] - ((rlo + rhi) / 2)[:2], axis=1)))
    scale = getattr(M, "RANK_SCALE", {}).get(rank, 1.0)
    rhs = scale * 0.94 * RADIUS / rr
    stats[f"{rank}_estimate"] = {"rankScale": scale, "height_m": round(float((rhi[2] - rlo[2]) * rhs), 2),
                                 "collider_radius_m": round(RADIUS * scale, 3), "metres_per_design_unit": round(rhs, 4)}
K.log("stats", stats)
(REVIEW / "stats.json").write_text(json.dumps(stats, indent=1))

# ------------------------------------------------------------------ renders
K.render_setup("CYCLES", samples=40)
K.review_lights(1.0, scale=float(max(hi - lo)) / 1.6, center=tuple(float(c) for c in centre))
cam = K.camera("ORTHO")
offset = (hi[1] - lo[1]) * 1.15
for i, rank in enumerate(ranks):
    variants[rank].location = (0, -offset * i, 0)
names = list(variants.values())
K.frame_objects(cam, names, (1.0, -1.25, 0.85), pad=1.08)
K.render(REVIEW / "beauty.png", (900, 640))
# gameplay angle at in-game pixel size (~124 px per metre at 1080p, camera pitch 53.8 deg)
pitch = math.atan2(26, 19)
direction = (0.0, -math.cos(pitch), math.sin(pitch))
w, h = K.frame_objects(cam, names, direction, pad=1.1)
px_per_unit = 124 * hs
size = (max(32, int(round(cam.data.ortho_scale * px_per_unit))),) * 2
K.render(REVIEW / "gameplay.png", size)
for v in variants.values():
    v.location = (0, 0, 0)

# ------------------------------------------------------- deformation check
if arm and EXPORT:
    for v in variants.values():
        v.scale = (1, 1, 1 / M.ASPECT)
pose_out = []
for rank in ["base"]:
    v = variants[rank]
    v.scale = (1, 1, 1 / M.ASPECT)
    mod = K.bind_armature(v, arm)
    for o in variants.values():
        o.hide_render = o is not v
    arm.animation_data_create()
    for clip in ("attack", "die"):
        action = bpy.data.actions.get(clip)
        if not action:
            continue
        arm.animation_data.action = action
        if hasattr(arm.animation_data, "action_slot") and action.slots:
            arm.animation_data.action_slot = action.slots[0]
        f0, f1 = action.frame_range
        frame = int(f0 + (f1 - f0) * (0.45 if clip == "attack" else 0.8))
        scene.frame_set(frame)
        bpy.context.view_layer.update()
        K.frame_objects(cam, [v], (1.0, -1.25, 0.85), pad=1.1)
        K.render(REVIEW / f"pose-{clip}.png", (450, 360))
        pose_out.append(clip)
    arm.animation_data.action = None
    for pb in arm.pose.bones:
        pb.matrix_basis.identity()
    v.modifiers.remove(mod)
    scene.frame_set(0)

# -------------------------------------------------------------------- export
if EXPORT:
    from contract import export_creature
    for v in variants.values():
        v.location = (0, 0, 0)
        v.scale = (1, 1, 1 / M.ASPECT)
        v.hide_set(False)
    bpy.context.view_layer.update()
    material = {
        "name": f"k11-{M.FAMILY}",
        "pbrMetallicRoughness": {"baseColorTexture": {"index": 0}, "metallicFactor": 0.0, "roughnessFactor": 0.62},
        "normalTexture": {"index": 1, "scale": 0.8},
        "emissiveTexture": {"index": 2},
        "emissiveFactor": [1, 1, 1],
        "extensions": {"KHR_materials_emissive_strength": {"emissiveStrength": getattr(M, "GLOW_STRENGTH", 4.0)}},
    }
    export_creature(list(variants.values()), K.ROOT / f"public/assets/models/{M.ASSET}.glb", material,
                    [paths["base"], paths["normal"], paths["glow"]], HERE / "contracts" / f"{M.ASSET}.glb",
                    extras={"k11Aspect": M.ASPECT, "k11Family": M.FAMILY})
K.log(f"K11 READY {M.FAMILY} {stats} {time.time() - started:.0f}s")
