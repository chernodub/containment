"""CREATURE20 kit check: the dome Plate next to AnglePlate variants, meshed and rendered like a caste.

blender -b --factory-startup -P tools/assets/k11-creatures/plate_test.py -- --out=artifacts/nextgen/c20-kit/plates.png
"""
import sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import math
import numpy as np
import kit as K
import sdf as S

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
out = Path(next((a.split("=", 1)[1] for a in args if a.startswith("--out=")), str(K.ROOT / "artifacts/nextgen/c20-kit/plates.png")))
out.parent.mkdir(parents=True, exist_ok=True)
probe = S.AnglePlate((0, 0, 0), S.frame((1, 0, 0)), 1.0, 0.6, 0.2, keel=0.15, rake=0.7, taper=0.5, lift=0.1)
pts = np.array([[0, 0, 0], [0, 0, 1], [0.9, 0, 0], [1.2, 0, 0], [-1.6, 0, 0.1], [-1.8, 0, 0.1], [0, 0.7, 0]], np.float32)
K.log("probe field", np.round(probe.field(pts), 3).tolist())
K.reset_scene()
sc = S.Sculpture("plates")
sc.add(S.Plate((0, 0, 0.2), (1.0, 0.7, 0.3), S.frame((1, 0, 0)), 0.2, rings=0.01, lip=0.04, chip=0.03, zone=S.SHELL))
for i, (keel, rake, taper, lift) in enumerate(((0.12, 0.5, 0.6, 0.0), (0.2, 0.9, 0.45, 0.15), (0.3, 1.2, 0.35, 0.3))):
    sc.add(S.AnglePlate((0, 1.8 + 1.7 * i, 0.15), S.frame((1, 0, 0)), 1.0, 0.65, 0.18, keel=keel, rake=rake, taper=taper,
                        lift=lift, zone=S.ARMOR))
mesh = K.sculpt_mesh(sc, 0.02, "plates-high")
K.smooth_mesh(mesh, 1, 0.4)
K.shade_smooth(mesh)
K.set_material(mesh, K.diffuse_material("plain"))
co = K.verts_np(mesh)
lo, hi = co.min(0), co.max(0)
K.render_setup("CYCLES", samples=24)
K.review_lights(1.0, scale=float(max(hi - lo)) / 1.6, center=tuple(float(c) for c in (lo + hi) / 2))
cam = K.camera("ORTHO")
K.frame_objects(cam, [mesh], (0.9, -1.0, 1.1), pad=1.1)
K.render(out, (1000, 640))
K.log("PLATE TEST READY", str(out))
