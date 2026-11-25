"""Stalker — lean ambush pouncer on the mantis-like `basilisk` skeleton.

Narrow keeled head on a plated neck, two long scythes (right one longer),
a raised shingled abdomen split by a violet lantern and ending in a sting,
four stilt legs with high knees.
"""

import numpy as np

import sdf as S
from sdf import BONE, ARMOR, FLESH, SHELL, MEMBRANE, CLAW, ORGAN, CREST, TOOTH, CAVITY, SINEW, Ellipsoid, RoundCone, Plate, frame, v3, normalize
import species as A
from spitter import chain

ASSET = "basilisk"
FAMILY = "stalker"
ASPECT = 2.0
VOXEL = 0.011
TRIS = {"body": 8800, "elite": 1400, "spur": 390}
RANK_PARTS = {"elite": ["body", "elite", "spur"]}
RANK_SCALE = {"elite": 1.12}   # ATTACK16: elites drawn ~12% larger than the regular (loader: base fit x rank scale)
ATLAS = 1024
GLOW_STRENGTH = 0.9012
FORM_NORMALS = "proxy"
FORM_MIX = 1.0
BAND_CELL = 0.30
BANDS = {
    "chitin": (0.048, 0.042, 0.067), "flesh": (0.2348, 0.2017, 0.9900), "bone": (0.68, 0.69, 0.73),
    "accent": (0.55, 0.22, 1.0), "eye": (0.75, 0.45, 1.0),
}
BANDS["lead"] = BANDS["bone"]
BANDS["plate"] = BANDS["chitin"]
BANDS["edge"] = (0.70, 0.70, 0.75)
PLATE_BAND = {1: "flesh", 2: "flesh", 59: "bone", 30: "bone", 31: "bone", 500: "plate",
              **{i: "flesh" for i in (*range(40, 56), *range(90, 100))}}
BAND_MAP = {"armor": "flesh"}
PALETTE = {
    "shell": (0.15, 0.06, 0.075), "edge": (0.62, 0.50, 0.55), "armor": (0.50, 0.40, 0.46), "membrane": (0.07, 0.018, 0.04),
    "sinew": (0.20, 0.05, 0.09), "claw": (0.018, 0.012, 0.016), "tooth": (0.66, 0.58, 0.55),
    "organ": (0.55, 0.25, 1.0), "eye": (0.75, 0.45, 1.0), "crest": (0.46, 0.38, 0.36),
    "cavity": (0.02, 0.005, 0.01), "under": (0.05, 0.02, 0.03),
}
GLOW = {"edge": (0.12, 0.15, 0.33), "organ": (0.55, 0.18, 1.0), "eye": (0.8, 0.45, 1.0)}


def paint_marks(name, co, normals, plate, bands):
    if name == "stalker-body":
        # Restore the blade bevel and prow after the surrounding shell zones merge.
        upper_bevel = (plate == 503) & (normals[:, 2] > 0.35)
        bands[np.isin(plate, [30, 31, 59, 62, 502]) | upper_bevel] = "edge"


def build(sk):
    a = sk.aspect
    z = lambda x, y, zz: v3((x, y, zz * a))
    body = S.Sculpture("stalker-body")
    # --- thorax and neck --------------------------------------------------------
    body.add(A.mass(z(0.05, 0, 1.47), (0.44, 0.32, 0.21 * a), frame((1, 0, 0.2)), bone="torso", zone=MEMBRANE, lump=0.004, freq=4))
    body.extend(A.shingles(z(0.05, 0, 1.47), (0.44, 0.32, 0.21 * a), frame((1, 0, 0.2)), "torso", rows=2, phis=(0.0,),
                           u0=0.35, u1=-0.4, size=(0.3, 0.32, 0.1), zone=ARMOR, thickness=0.06, lift=0.4, rings=0.004, seed=5, plate0=1, angular=True))
    chest_a, chest_b = sk.h("chest"), sk.h("neck_lo")
    body.add(RoundCone(chest_a, chest_b, 0.17, 0.14, zone=MEMBRANE, bone="chest", k=0.08))
    nl, nh, hd = sk.h("neck_lo"), sk.h("neck_hi"), sk.h("head")
    body.add(RoundCone(nl, nh, 0.11, 0.09, zone=MEMBRANE, bone="neck_lo", k=0.05, plate=500))   # CREATURE21: dark neck break
    body.add(RoundCone(nh, hd, 0.09, 0.085, zone=MEMBRANE, bone="neck_hi", k=0.04, plate=500))
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
    body.add(A.mass(head_c, (0.3, 0.17, 0.15 * a), frame(hdir), zone=BONE, bone="head", k=0.06))
    body.add(Plate(head_c + v3((-0.03, 0, 0.13 * a)), (0.46, 0.27, 0.11), frame(hdir, (0, 0, 1)), 0.05, rings=0.004,
                   lip=0.012, chip=0.01, zone=CREST, bone="head", plate=30))
    body.add(RoundCone(head_c + v3((-0.25, 0, 0.18 * a)), head_c + hdir * 0.3 + v3((0, 0, 0.04)), 0.03, 0.008, zone=CREST, bone="head", k=0.03))
    body.extend(A.eyes(head_c + hdir * 0.12 + v3((0, 0, 0.02 * a)), hdir, 0.09, 3, 0.03, "head", spread=0.8))
    # CREATURE21: one forward-facing pale face plane at the snout
    body.add(S.AnglePlate(head_c + hdir * 0.27 + v3((0, 0, 0.02 * a)), frame(v3((0, 0, 1)), hdir), 0.13, 0.15, 0.05, keel=0.04,
                          rake=0.5, taper=0.55, zone=CREST, bone="head", plate=31))
    for s, side in ((-1, "R"), (1, "L")):
        m0, m1 = sk.h(f"mandible.{side}"), sk.end(f"mandible.{side}")
        body.extend(A.hook([m0, m0 + (m1 - m0) * 0.4 + v3((0.05, 0.06 * s, 0)), m1 + v3((0.05, 0.03 * s, 0)), m1 + v3((0.02, -0.06 * s, -0.04))],
                           0.035, 0.006, f"mandible.{side}", k=0.015, tip=0.4))
    # --- abdomen with lantern and sting ------------------------------------------
    ab_c, ab_r, ab_R = z(-0.76, 0, 1.72), v3((0.78, 0.48, 0.3 * a)), frame((1, 0, -0.08))
    body.add(A.mass(ab_c, ab_r, ab_R, bone=("blend", "big_butt", "mid_butt", z(-0.3, 0, 1.6), z(-1.25, 0, 1.75)),
                    zone=MEMBRANE, k=0.12, lump=0.004, freq=4))
    bf = lambda u: ("blend", "big_butt", "mid_butt", z(-0.3, 0, 1.6), z(-1.25, 0, 1.75))
    body.extend(A.shingles(ab_c, ab_r, ab_R, None, rows=4, phis=(0.95, 1.65), u0=0.6, u1=-0.62, size=(0.26, 0.24, 0.1), zone=ARMOR,
                           thickness=0.06, lift=0.38, rings=0.003, grow=-0.2, bone_fn=bf, seed=50, plate0=40, angular=True))
    la, _ = A.ellipsoid_surface(ab_c, ab_r, ab_R, 0.5, 0.0)
    lb, _ = A.ellipsoid_surface(ab_c, ab_r, ab_R, -0.62, 0.0)
    body.extend(A.lantern(la + v3((0, 0, 0.02)), lb + v3((0, 0, 0.06)), 0.19, bf(0), height=1.7, ribs=0.06))
    st0, st1 = sk.h("sting"), sk.end("sting")
    body.add(RoundCone(sk.h("mid_butt"), st0, 0.18, 0.12, zone=MEMBRANE, bone="mid_butt", k=0.08))
    body.extend(A.hook([st0, st0 + v3((-0.15, 0, 0.1)), st1 + v3((-0.05, 0, 0.15)), st1 + v3((0.12, 0, 0))], 0.1, 0.01,
                       "sting", zone=CLAW, k=0.04, tip=0.35))
    # pale dorsal ridge: the light line that separates the stalker from dark floors
    ridge = [hd + v3((-0.05, 0, 0.12)), nh + v3((0, 0, 0.13)), nl + v3((0, 0, 0.16)), z(0.05, 0, 1.47) + v3((0, 0, 0.23 * a)),
             z(-0.35, 0, 1.75) + v3((0, 0, 0.26 * a)), z(-1.1, 0, 1.75) + v3((0, 0, 0.24 * a))]
    bones_r = ["neck_hi", "neck_lo", "chest", "torso", "big_butt", "mid_butt"]
    for i in range(len(ridge) - 1):
        body.add(RoundCone(ridge[i], ridge[i + 1], 0.045, 0.04, zone=CREST, bone=bones_r[i], k=0.03))
    # --- scythe arms ------------------------------------------------------------------
    for s, side in ((-1, "R"), (1, "L")):
        heavy = 1.3 if s < 0 else 1.0   # CREATURE19: right scythe is clearly the striking one
        up, el, wr, end = sk.h(f"arm_up.{side}"), sk.h(f"arm_mid.{side}"), sk.h(f"claw.{side}"), sk.end(f"claw.{side}")
        body.extend(A.armour_segment(up, el, 0.14, 0.12, f"arm_up.{side}", s, plate=61 + s))
        body.add(Ellipsoid(el, (0.06,) * 3, zone=MEMBRANE, bone=("blend", f"arm_up.{side}", f"arm_mid.{side}", up, wr), k=0.03))
        body.extend(A.armour_segment(el, wr, 0.14 * heavy, 0.115 * heavy, f"arm_mid.{side}", s, plate=63 + s))
        fa = normalize(wr - el)
        body.add(Plate((el + wr) / 2 + v3((0, 0.03 * s, 0.06)), (float(np.linalg.norm(wr - el)) * 0.5, 0.09, 0.05),
                       frame(fa, (0, 0.3 * s, 1)), 0.04, rings=0.003, lip=0.01, zone=CREST, bone=f"arm_mid.{side}", plate=60 + s))
        # ATTACK16: long broad scythes folded back along the flanks, flat face up, edge outward, a dark gap
        # to the body; at least as long as the body so the loaded limb is the largest light shape from above
        root = wr + v3((0.05, 0.12 * s, 0.05 * a))
        # CREATURE19: the off scythe is slimmer and both splay away from the flanks so the body shows between them
        tip = v3((-0.95, 1.38 * s, 1.0 * a)) if s < 0 else v3((-0.62, 1.4, 1.05 * a))   # same footprint radius
        scythe = A.blade(root, tip, v3((0.1, 1.0 * s, 0.35)), (0.52 * heavy) if s < 0 else 0.3, 0.06 * heavy, f"claw.{side}",
                            hook=0.62, serrations=4, zone=BONE if s < 0 else MEMBRANE, edge_zone=CREST if s < 0 else MEMBRANE)
        for segment in scythe:
            if s < 0:
                segment.plate = 502 if segment.zone == CREST else 503
        body.extend(scythe)
        # a short dark hook at the wrist keeps the joint and claw read
        body.add(RoundCone(wr, end + (wr - end) * 0.55, 0.07, 0.02, zone=CLAW, bone=f"claw.{side}", k=0.03))
        # flared shoulder hood: the pouncer's wide key silhouette
        hood_n = normalize(v3((0.1, 0.85 * s, 0.6)))
        body.add(Plate(up + v3((-0.05, 0.3 * s, 0.1 * a)), (0.42, 0.36, 0.12), frame(v3((1, 0, 0.25)), hood_n), 0.08,
                       rings=0.004, lip=0.025, chip=0.015, zone=ARMOR, bone=f"arm_up.{side}", plate=66 + s))
        body.add(Plate(up + v3((-0.25, 0.42 * s, 0.02 * a)), (0.32, 0.28, 0.1), frame(v3((1, 0, 0.1)), hood_n), 0.07,
                       rings=0.004, lip=0.02, chip=0.015, zone=ARMOR, bone=f"arm_up.{side}", plate=68 + s))
    # --- stilt legs -------------------------------------------------------------------
    for leg in ("front", "back"):
        for s, side in ((-1, "R"), (1, "L")):
            n = lambda part: f"leg_{leg}_{part}.{side}"
            chain(body, sk, [n("up"), n("up1"), n("mid"), n("lo"), n("lo1")], [0.19, 0.17, 0.15, 0.11, 0.08, 0.025], s,
                  tint=0.75)
    # --- elite: dorsal spine fan on the abdomen ---------------------------------------
    elite = S.Sculpture("stalker-elite")
    # one overgrown right scythe: a second, larger bone blade fused along the arm
    wr, end, el = sk.h("claw.R"), sk.end("claw.R"), sk.h("arm_mid.R")
    # ATTACK16 elite: one hugely exaggerated hooked scythe on the right, from the same striking joint
    elite.extend(A.blade(wr + v3((0.05, -0.15, 0.08 * a)), v3((-1.6, -1.35, 0.95 * a)), v3((0.25, -1.0, 0.4)), 0.62, 0.07,
                         "claw.R", hook=0.75, serrations=6, zone=BONE, edge_zone=BONE))
    pts, nrm = [], []
    for u in np.linspace(0.45, -0.5, 4):
        p, n = A.ellipsoid_surface(ab_c, ab_r, ab_R, float(u), 0.0)
        pts.append(p + n * 0.05)
        nrm.append(n)
    elite.extend(A.crest_spines(pts, nrm, 1.0 * a, 0.1, lambda p: bf(0), sweep=(-1, 0, 0.3)))   # CREATURE19: tall rank crest
    elite.extend(A.rank_mantle(ab_c, ab_r, ab_R, None, 0.0, scale=1.45, bone_fn=lambda u: bf(u)))   # CREATURE21
    elite.extend(A.rank_mantle(z(0.05, 0, 1.47), v3((0.44, 0.32, 0.21 * a)), frame((1, 0, 0.2)), "torso", 0.1, scale=1.3, plate=191))
    # A swept lateral hook leaves a notch outside the folded raptorial scythe.
    spur = S.Sculpture("stalker-spur")
    spur.extend(A.blade(wr, z(-1.12, -2.06, 1.24), (0.58, -0.8, 0.28),
                        0.27, 0.072, "claw.R", hook=0.48, serrations=0, zone=SHELL, edge_zone=BONE))
    return {"body": body, "elite": elite, "spur": spur}
