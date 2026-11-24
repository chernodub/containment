"""CREATURE26 quick plan-view preview (no bake): mesh body / elite / Warden at a coarse voxel, paint the anatomy bands
(build_bands.anatomy_bands, the same call build.py makes), shade with the form normals and the game's fixed
upper-left key as two flat planes, and render from the game camera pitch facing left and facing the camera, plus a
black silhouette row. Rest pose only (motion clips are checked in game).

blender -b --factory-startup -P tools/assets/k11-creatures/creature26/preview.py -- --out=DIR [--parts=body,elite,boss]
"""
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
import brute as M
import build_bands
import pose as P

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
opt = lambda k, d: next((a.split("=", 1)[1] for a in args if a.startswith(f"--{k}=")), d)
OUT = Path(opt("out", str(K.ROOT / "artifacts/nextgen/creature26/preview")))
OUT.mkdir(parents=True, exist_ok=True)
PARTS = opt("parts", "body,elite,boss").split(",")
POSES = opt("poses", "rest,m10-idle@0.5,m10-waiting@0.6,m10-windup@0.95").split(",")
FACINGS = opt("facings", "left,down").split(",")
VOX = float(opt("voxel", "0.05"))
K.reset_scene()
arm = K.load_contract(M.ASSET)
vol = json.loads((HERE / "reference" / f"{M.ASSET}-volumes.json").read_text())["parts"]
sk = K.Skeleton(arm, M.ASPECT, vol)
parts = M.build(sk)
pitch = math.atan2(26, 19)
to_cam = np.array([0.0, -math.cos(pitch), math.sin(pitch)])
cam_up = np.array([0.0, math.sin(pitch), math.cos(pitch)])
right = np.array([1.0, 0.0, 0.0])
key = -0.52 * right + 0.42 * cam_up + 0.74 * to_cam   # GraphicSurface creature key, view space -> world
key /= np.linalg.norm(key)
RGB = {}
SKIN = {}
MOTION = P.Motion(K.ROOT / "public/assets/models/motion/brute-motion.glb")
print("RESTCHECK", np.round(P.gltf_to_blender(MOTION.rest_head("chest")[None])[0], 3), np.round(sk.heads["chest"], 3))

LIT, SHADOW = float(opt("lit", "1.0")), float(opt("shadow", "0.30"))


def mesh_for(name):
    if name == "elite":
        a = K.sculpt_mesh(parts["body"], VOX, "p-body-e")
        b = K.sculpt_mesh(parts["elite"], VOX, "p-elite")
        objs = [(a, parts["body"]), (b, parts["elite"])]
    else:
        objs = [(K.sculpt_mesh(parts[name], VOX, f"p-{name}"), parts[name])]
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
    return objs


def shade(o, yaw):
    """Flat band colour x two light planes from the key, with Taubin form normals, as a point colour."""
    rgb = RGB[o.name]
    n = build_bands.form_normals_np(o, 60)
    c, s = math.cos(yaw), math.sin(yaw)
    Rz = np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])
    facing = (n @ Rz.T) @ key
    light = np.where(facing > 0.64, LIT, SHADOW)
    col = rgb * light[:, None]
    K.write_color(o, "shade", np.hstack([np.clip(col, 0, 1), np.ones((len(col), 1), np.float32)]))


objs = []
offsets = {"body": 0.0, "elite": 9.0, "boss": 21.0}
groups = {}
for name in PARTS:
    groups[name] = mesh_for(name)
scene = bpy.context.scene
scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.light = "FLAT"
scene.display.shading.color_type = "VERTEX"
scene.view_settings.view_transform = "Standard"
scene.render.film_transparent = False
scene.world = bpy.data.worlds.new("w")
scene.world.color = (0.035, 0.045, 0.055)
cam = K.camera("ORTHO")
YAW = {"left": math.pi, "down": -math.pi / 2, "right": 0.0, "up": math.pi / 2}
for pose_name in POSES:
    skin = None
    if pose_name != "rest":
        clip, frac = pose_name.split("@")
        skin = MOTION.skin(clip, float(frac) * MOTION.duration(clip))
    for name, objs_ in groups.items():
        for o, _ in objs_:
            rest, bones, w = SKIN[o.name]
            K.set_verts(o, rest if skin is None else P.pose_points(rest, M.ASPECT, bones, w, skin))
    for tag in FACINGS:
        yaw = YAW[tag]
        allo = []
        for name, objs_ in groups.items():
            for o, _ in objs_:
                o.rotation_euler = (0, 0, yaw)
                o.location = (offsets[name], 0, 0)
                o.scale = (1.0, 1.0, 1.0) if name != "boss" else (1.0, 1.0, 0.86)
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
