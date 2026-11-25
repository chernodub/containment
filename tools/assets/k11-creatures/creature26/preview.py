"""Preview a caste in its motion poses from the game pitch, with flat anatomy colours and silhouette rows.

blender -b --factory-startup -P tools/assets/k11-creatures/creature26/preview.py -- --caste=crawler --out=DIR
"""
import importlib
import math
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE / "creature26"))
import json
import bpy
import numpy as np
import kit as K
import build_bands
import pose as P

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
opt = lambda k, d: next((a.split("=", 1)[1] for a in args if a.startswith(f"--{k}=")), d)
M = importlib.import_module(opt("caste", "brute"))
OUT = Path(opt("out", str(K.ROOT / "artifacts/nextgen/creature26/preview")))
OUT.mkdir(parents=True, exist_ok=True)
POSES = opt("poses", "rest,m10-idle@0.5,m10-waiting@0.6,m10-windup@0.95").split(",")
FACINGS = opt("facings", "left,down").split(",")
VOX = float(opt("voxel", str(0.05 if M.FAMILY == "brute" else max(0.05, 3 * M.VOXEL))))
K.reset_scene()
arm = K.load_contract(M.ASSET)
vol = json.loads((HERE / "reference" / f"{M.ASSET}-volumes.json").read_text())["parts"]
sk = K.Skeleton(arm, M.ASPECT, vol)
parts = M.build(sk)
PARTS = opt("parts", ",".join(k for k in ("body", "elite", "boss") if k in parts)).split(",")
pitch = math.atan2(26, 19)
to_cam = np.array([0.0, -math.cos(pitch), math.sin(pitch)])
cam_up = np.array([0.0, math.sin(pitch), math.cos(pitch)])
right = np.array([1.0, 0.0, 0.0])
key = -0.52 * right + 0.42 * cam_up + 0.74 * to_cam   # GraphicSurface creature key, view space -> world
key /= np.linalg.norm(key)
RGB = {}
SKIN = {}
HARD = {}
MOTION = P.Motion(K.ROOT / f"public/assets/models/motion/{M.FAMILY}-motion.glb")


LIT, SHADOW = float(opt("lit", "1.0")), float(opt("shadow", "0.30"))


def mesh_for(name):
    members = getattr(M, "RANK_PARTS", {}).get(name, ["body", "elite"] if name == "elite" else [name])
    objs = [(K.sculpt_mesh(parts[part], VOX, f"p-{name}-{part}"), parts[part]) for part in members]
    for o, sc in objs:
        K.shade_smooth(o)
        bands, rgb = build_bands.anatomy_rgb(o, sc, M)
        RGB[o.name] = rgb
        K.skin_weights(o, sc, sigma=VOX * 2.5, smooth=2)
        names = {g.index: g.name for g in o.vertex_groups}
        bones = np.full((len(o.data.vertices), 4), None, object)
        w = np.zeros((len(o.data.vertices), 4))
        for v in o.data.vertices:
            gs = sorted(((names[g.group], g.weight) for g in v.groups if g.weight > 0), key=lambda x: -x[1])[:4]
            tot = sum(x[1] for x in gs) or 1.0
            for j, (b, wt) in enumerate(gs):
                bones[v.index, j], w[v.index, j] = b, wt / tot
        SKIN[o.name] = (K.verts_np(o).copy(), bones, w)
        HARD[o.name] = build_bands.hard_weights(K.verts_np(o), sc)
    return objs


def shade(o, yaw):
    """Flat band colour x two light planes from the key, with Taubin form normals, as a point colour."""
    rgb = RGB[o.name]
    n = build_bands.form_normals_np(o, 60, hard=HARD[o.name])
    c, s = math.cos(yaw), math.sin(yaw)
    Rz = np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])
    facing = (n @ Rz.T) @ key
    light = np.where(facing > 0.64, LIT, SHADOW)
    col = rgb * light[:, None]
    K.write_color(o, "shade", np.hstack([np.clip(col, 0, 1), np.ones((len(col), 1), np.float32)]))


objs = []
offsets = {}
groups = {}
for name in PARTS:
    groups[name] = mesh_for(name)
cursor = 0.0
for name, meshes in groups.items():
    co = np.vstack([K.verts_np(o) for o, _ in meshes])
    radius = float(np.max(np.linalg.norm(co[:, :2], axis=1)))
    offsets[name] = cursor + radius
    cursor += 2.4 * radius
scene = bpy.context.scene
scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.light = "FLAT"
scene.display.shading.color_type = "VERTEX"
scene.view_settings.view_transform = "Standard"
scene.render.film_transparent = False
scene.world = bpy.data.worlds.new("w")
scene.world.color = (0.035, 0.045, 0.055)
cam = K.camera("ORTHO")
YAW = {"left": math.pi, "down": -math.pi / 2, "right": 0.0, "up": math.pi / 2, **{f"h{k}": k * math.pi / 4 for k in range(8)}}
for pose_name in POSES:
    skin = None
    if pose_name != "rest":
        clip, frac = pose_name.split("@")
        skin = MOTION.skin(clip, float(frac) * MOTION.duration(clip))
    for name, objs_ in groups.items():
        for o, _ in objs_:
            rest, bones, w = SKIN[o.name]
            K.set_verts(o, rest if skin is None else P.pose_points(rest, M.ASPECT, bones, w, skin))
        co_ = np.vstack([K.verts_np(o) for o, _ in objs_])
        print("POSE", pose_name, name, "radial", round(float(np.max(np.linalg.norm(co_[:, :2], axis=1))), 3),
              "top", round(float(co_[:, 2].max()), 3),
              "top-at-rest", np.round(np.vstack([SKIN[o.name][0] for o, _ in objs_])[int(np.argmax(co_[:, 2]))], 2).tolist(),
              "radial-at-rest", np.round(np.vstack([SKIN[o.name][0] for o, _ in objs_])[int(np.argmax(np.linalg.norm(co_[:, :2], axis=1)))], 2).tolist())
    for tag in FACINGS:
        yaw = YAW[tag]
        allo = []
        for name, objs_ in groups.items():
            for o, _ in objs_:
                o.rotation_euler = (0, 0, yaw)
                o.location = (offsets[name], 0, 0)
                o.scale = (1.0, 1.0, 1.0) if name != "boss" or M.FAMILY != "brute" else (1.0, 1.0, 0.86)
                shade(o, yaw)
                allo.append(o)
        bpy.context.view_layer.update()
        fw, fh = K.frame_objects(cam, allo, tuple(to_cam), pad=1.08)
        cam.data.ortho_scale = max(fw, fh * 16 / 9) * 1.08
        stem = pose_name.replace("@", "-").replace("m10-", "")
        K.render(OUT / f"plan-{stem}-{tag}.png", (1100, 1100 * 9 // 16))
        for o in allo:   # silhouette
            K.write_color(o, "shade", np.hstack([np.zeros((len(o.data.vertices), 3), np.float32), np.ones((len(o.data.vertices), 1), np.float32)]))
        scene.world.color = (0.92, 0.92, 0.92)
        K.render(OUT / f"sil-{stem}-{tag}.png", (550, 550 * 9 // 16))
        scene.world.color = (0.035, 0.045, 0.055)
for name, objs_ in groups.items():
    co = np.vstack([K.verts_np(o) for o, _ in objs_])
    print("PREVIEW", name, "radial-from-origin", round(float(np.max(np.linalg.norm(co[:, :2], axis=1))), 2),
          "extent", np.round(co.max(0) - co.min(0), 2).tolist(), "top", round(float(co[:, 2].max()), 2))
