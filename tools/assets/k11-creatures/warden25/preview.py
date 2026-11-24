"""WARDEN25 quick shape preview: mesh the Warden and the Brute body at a coarse voxel, colour by band, and render
them side by side top-down and from the game pitch (Brute at the Warden's in-game size ratio).
blender -b --factory-startup -P tools/assets/k11-creatures/warden25/preview.py -- --out=DIR [--ratio=1.5]"""
import json, math, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
import bpy
import numpy as np
import kit as K
import brute as M

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
opt = lambda k, d: next((a.split("=", 1)[1] for a in args if a.startswith(f"--{k}=")), d)
OUT = Path(opt("out", str(K.ROOT / "artifacts/nextgen/warden25-preview")))
OUT.mkdir(parents=True, exist_ok=True)
ratio = float(opt("ratio", "1.0"))   # Warden size relative to the elite Brute in game
K.reset_scene()
arm = K.load_contract(M.ASSET)
vol = json.loads((HERE / "reference" / f"{M.ASSET}-volumes.json").read_text())["parts"]
sk = K.Skeleton(arm, M.ASPECT, vol)
parts = M.build(sk)
import build_bands  # noqa: E402  (band colours without the bake)
objs = []
for i, (name, scale) in enumerate((("body", 1.0), ("boss", ratio))):
    o = K.sculpt_mesh(parts[name], 0.06, f"p-{name}")
    build_bands.paint(o, parts[name], M)
    co = K.verts_np(o)
    lo, hi = co.min(0), co.max(0)
    c = (lo + hi) / 2
    r = float(np.max(np.linalg.norm(co[:, :2] - c[:2], axis=1)))
    print("PREVIEW", name, "radial", round(r, 2), "extent", np.round(hi - lo, 2).tolist())
    o.scale = (scale * 5.3 / r,) * 3   # equal footprint radius before the rank ratio
    o.location = (0, i * 12.0, 0)
    objs.append(o)
K.render_setup("CYCLES", samples=16)
K.review_lights(1.0, scale=8, center=(0, 6, 2))
cam = K.camera("ORTHO")
for tag, d in (("top", (0, 0, 1)), ("game", (0.0, -math.cos(math.atan2(26, 19)), math.sin(math.atan2(26, 19))))):
    K.frame_objects(cam, objs, d, pad=1.1)
    K.render(OUT / f"preview-{tag}.png", (700, 700))
