"""Stalker — lean ambush pouncer on the mantis-like `basilisk` skeleton.

Narrow keeled head on a plated neck, two long scythes (right one longer),
a raised shingled abdomen split by a violet lantern and ending in a sting,
four stilt legs with high knees.
"""

import numpy as np

import sdf as S
from sdf import SHELL, MEMBRANE, CLAW, ORGAN, CREST, TOOTH, CAVITY, SINEW, Ellipsoid, RoundCone, Plate, frame, v3, normalize
import species as A

ASSET = "basilisk"
FAMILY = "stalker"
ASPECT = 2.0
VOXEL = 0.011
TRIS = {"body": 8800, "elite": 1400}
ATLAS = 1024
GLOW_STRENGTH = 1.5
PALETTE = {
    "shell": (0.13, 0.05, 0.06), "edge": (0.50, 0.36, 0.38), "membrane": (0.07, 0.018, 0.04),
    "sinew": (0.20, 0.05, 0.09), "claw": (0.018, 0.012, 0.016), "tooth": (0.66, 0.58, 0.55),
    "organ": (0.55, 0.25, 1.0), "eye": (0.75, 0.45, 1.0), "crest": (0.46, 0.38, 0.36),
    "cavity": (0.02, 0.005, 0.01), "under": (0.05, 0.02, 0.03),
}
GLOW = {"organ": (0.55, 0.18, 1.0), "eye": (0.8, 0.45, 1.0)}


def build(sk):
    a = sk.aspect
    z = lambda x, y, zz: v3((x, y, zz * a))
    body = S.Sculpture("stalker-body")
    # --- thorax and neck --------------------------------------------------------
    body.add(A.mass(z(0.05, 0, 1.47), (0.36, 0.24, 0.17 * a), frame((1, 0, 0.2)), bone="torso", zone=MEMBRANE, lump=0.004, freq=4))
    body.extend(A.shingles(z(0.05, 0, 1.47), (0.36, 0.24, 0.17 * a), frame((1, 0, 0.2)), "torso", rows=2, phis=(0.0,),
                           u0=0.35, u1=-0.4, size=(0.25, 0.25, 0.08), thickness=0.06, lift=0.4, rings=0.004, seed=5, plate0=1))
    chest_a, chest_b = sk.h("chest"), sk.h("neck_lo")
    body.add(RoundCone(chest_a, chest_b, 0.17, 0.14, zone=MEMBRANE, bone="chest", k=0.08))
    nl, nh, hd = sk.h("neck_lo"), sk.h("neck_hi"), sk.h("head")
    body.add(RoundCone(nl, nh, 0.13, 0.11, zone=MEMBRANE, bone="neck_lo", k=0.06))
    body.add(RoundCone(nh, hd, 0.11, 0.1, zone=MEMBRANE, bone="neck_hi", k=0.05))
    for t, bone, ab in ((0.3, "chest", (chest_a, chest_b)), (0.5, "neck_lo", (nl, nh)), (0.5, "neck_hi", (nh, hd))):
        p0, p1 = v3(ab[0]), v3(ab[1])
        c = p0 + (p1 - p0) * t
        ax = normalize(p1 - p0)
        body.add(Plate(c + v3((-0.06, 0, 0.12)), (float(np.linalg.norm(p1 - p0)) * 0.55, 0.16, 0.08),
                       frame(ax, normalize(v3((-0.6, 0, 1)))), 0.05, rings=0.004, lip=0.012, chip=0.01, zone=SHELL,
                       bone=bone, plate=10 + int(t * 10)))
    # --- head: narrow keeled wedge, mandibles, violet eye row -----------------------
    head_c = hd + (sk.end("head") - hd) * 0.5 + v3((0.08, 0, 0.0))
    hdir = normalize(sk.end("jaw") - hd)
    body.add(A.mass(head_c, (0.3, 0.17, 0.15 * a), frame(hdir), bone="head", k=0.06))
    body.add(Plate(head_c + v3((-0.03, 0, 0.13 * a)), (0.37, 0.2, 0.1), frame(hdir, (0, 0, 1)), 0.05, rings=0.004,
                   lip=0.012, chip=0.01, zone=CREST, bone="head", plate=30))
    body.add(RoundCone(head_c + v3((-0.25, 0, 0.18 * a)), head_c + hdir * 0.3 + v3((0, 0, 0.04)), 0.03, 0.008, zone=CREST, bone="head", k=0.03))
    body.extend(A.eyes(head_c + hdir * 0.12 + v3((0, 0, 0.02 * a)), hdir, 0.09, 3, 0.022, "head", spread=0.8))
    for s, side in ((-1, "R"), (1, "L")):
        m0, m1 = sk.h(f"mandible.{side}"), sk.end(f"mandible.{side}")
        body.extend(A.hook([m0, m0 + (m1 - m0) * 0.4 + v3((0.05, 0.06 * s, 0)), m1 + v3((0.05, 0.03 * s, 0)), m1 + v3((0.02, -0.06 * s, -0.04))],
                           0.035, 0.006, f"mandible.{side}", k=0.015, tip=0.4))
    # --- abdomen with lantern and sting ------------------------------------------
    ab_c, ab_r, ab_R = z(-0.74, 0, 1.7), v3((0.64, 0.37, 0.24 * a)), frame((1, 0, -0.08))
    body.add(A.mass(ab_c, ab_r, ab_R, bone=("blend", "big_butt", "mid_butt", z(-0.3, 0, 1.6), z(-1.25, 0, 1.75)),
                    zone=MEMBRANE, k=0.12, lump=0.004, freq=4))
    bf = lambda u: ("blend", "big_butt", "mid_butt", z(-0.3, 0, 1.6), z(-1.25, 0, 1.75))
    body.extend(A.shingles(ab_c, ab_r, ab_R, None, rows=4, phis=(0.9, 1.6), u0=0.6, u1=-0.62, size=(0.22, 0.18, 0.08),
                           thickness=0.05, lift=0.38, rings=0.003, grow=-0.2, bone_fn=bf, seed=50, plate0=40))
    la, _ = A.ellipsoid_surface(ab_c, ab_r, ab_R, 0.5, 0.0)
    lb, _ = A.ellipsoid_surface(ab_c, ab_r, ab_R, -0.62, 0.0)
    body.extend(A.lantern(la + v3((0, 0, 0.02)), lb + v3((0, 0, 0.05)), 0.12, bf(0), height=1.7, ribs=0.05))
    st0, st1 = sk.h("sting"), sk.end("sting")
    body.add(RoundCone(sk.h("mid_butt"), st0, 0.18, 0.12, zone=MEMBRANE, bone="mid_butt", k=0.08))
    body.extend(A.hook([st0, st0 + v3((-0.15, 0, 0.1)), st1 + v3((-0.05, 0, 0.15)), st1 + v3((0.12, 0, 0))], 0.1, 0.01,
                       "sting", zone=CLAW, k=0.04, tip=0.35))
    # --- scythe arms ------------------------------------------------------------------
    for s, side in ((-1, "R"), (1, "L")):
        heavy = 1.15 if s < 0 else 1.0
        up, el, wr, end = sk.h(f"arm_up.{side}"), sk.h(f"arm_mid.{side}"), sk.h(f"claw.{side}"), sk.end(f"claw.{side}")
        body.add(RoundCone(up, el, 0.075, 0.065, zone=SHELL, bone=f"arm_up.{side}", k=0.04, tint=0.9))
        body.add(Ellipsoid(el, (0.06,) * 3, zone=MEMBRANE, bone=("blend", f"arm_up.{side}", f"arm_mid.{side}", up, wr), k=0.03))
        body.add(RoundCone(el, wr, 0.07 * heavy, 0.06 * heavy, zone=SHELL, bone=f"arm_mid.{side}", k=0.03, tint=0.9))
        fa = normalize(wr - el)
        body.add(Plate((el + wr) / 2 + v3((0, 0.03 * s, 0.06)), (float(np.linalg.norm(wr - el)) * 0.5, 0.09, 0.05),
                       frame(fa, (0, 0.3 * s, 1)), 0.04, rings=0.003, lip=0.01, zone=CREST, bone=f"arm_mid.{side}", plate=60 + s))
        body.extend(A.blade(wr, end + (end - wr) * 0.12 * (heavy - 1) * 4, v3((-0.6, 0.15 * -s, 0.2)), 0.12 * heavy,
                            0.035 * heavy, f"claw.{side}", hook=0.5, serrations=4))
    # --- stilt legs -------------------------------------------------------------------
    for leg in ("front", "back"):
        for s, side in ((-1, "R"), (1, "L")):
            n = lambda part: f"leg_{leg}_{part}.{side}"
            p0, p1, p2, p3, p4 = sk.h(n("up")), sk.h(n("up1")), sk.h(n("mid")), sk.h(n("lo")), sk.h(n("lo1"))
            foot = sk.end(n("lo1"))
            body.add(RoundCone(p0, p1, 0.12, 0.1, zone=SHELL, bone=n("up"), k=0.05, tint=0.8))
            body.add(RoundCone(p1, p2, 0.11, 0.095, zone=SHELL, bone=n("up1"), k=0.03, tint=0.8))
            body.add(Ellipsoid(p2, (0.085,) * 3, zone=MEMBRANE, bone=("blend", n("up1"), n("mid"), p1, p3), k=0.03))
            body.add(RoundCone(p2, p3, 0.09, 0.06, zone=SHELL, bone=n("mid"), k=0.03, tint=0.75))
            body.add(RoundCone(p3, p4, 0.06, 0.045, zone=SHELL, bone=n("lo"), k=0.02, tint=0.7))
            body.add(RoundCone(p4, foot, 0.045, 0.01, zone=CLAW, bone=n("lo1"), k=0.015))
            for q0, q1, bone, r in ((p1, p2, n("up1"), 0.1), (p2, p3, n("mid"), 0.085)):
                ax = normalize(q1 - q0)
                out = normalize(v3((0.0, s, 0.35)))
                body.add(Plate((q0 + q1) / 2 + out * r * 0.55, (float(np.linalg.norm(q1 - q0)) * 0.42, r * 1.3, r * 0.8),
                               frame(ax, out), r * 0.5, rings=0.003, lip=r * 0.15, zone=SHELL, bone=bone, tint=1.05,
                               plate=80 + len(leg) + s))
            for t in (0.3, 0.6):
                b = p2 + (p3 - p2) * t
                body.add(RoundCone(b, b + v3((-0.06 if leg == "back" else 0.06, 0.05 * s, 0.05)), 0.02, 0.003, zone=CLAW, bone=n("mid")))
    # --- elite: dorsal spine fan on the abdomen ---------------------------------------
    elite = S.Sculpture("stalker-elite")
    pts, nrm = [], []
    for u in np.linspace(0.45, -0.5, 5):
        for phi in (-0.55, 0.55):
            p, n = A.ellipsoid_surface(ab_c, ab_r, ab_R, float(u), phi)
            pts.append(p + n * 0.03)
            nrm.append(n)
    elite.extend(A.crest_spines(pts, nrm, 0.32, 0.035, lambda p: bf(0), sweep=(-1, 0, 0.3)))
    return {"body": body, "elite": elite}
