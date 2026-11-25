"""Crawler — small swarmer on the six-legged `dretch` skeleton.

Shingled hump abdomen split by an ember lantern, a low prow head with hooked
side mandibles, raptorial forelegs (right hook heavier), four walking legs.
"""

import numpy as np

import sdf as S
from sdf import BONE, ARMOR, FLESH, SHELL, MEMBRANE, CLAW, ORGAN, CREST, TOOTH, CAVITY, Ellipsoid, RoundCone, Plate, frame, v3, normalize
import species as A

ASSET = "dretch"
FAMILY = "crawler"
ASPECT = 2.35            # in-game height / horizontal scale (design z multiplier)
VOXEL = 0.0065
TRIS = {"body": 7600, "elite": 1400, "fins": 420}
RANK_PARTS = {"elite": ["body", "elite", "fins"]}
RANK_SCALE = {"elite": 1.12}   # ATTACK16: elite drawn ~12% larger than the regular
ATLAS = 1024
FORM_NORMALS = "proxy"
FORM_MIX = 1.0
BAND_CELL = 0.15
BANDS = {
    "chitin": (0.072, 0.032, 0.028), "flesh": (0.4990, 0.2444, 0.1263),
    "bone": (0.73, 0.69, 0.67), "accent": (0.88, 0.16, 0.32), "eye": (0.96, 0.36, 0.43),
}
BANDS["lead"] = BANDS["bone"]
BANDS["plate"] = BANDS["chitin"]
PLATE_BAND = {
    **{p: "flesh" for p in (*range(1, 17), 30, 31, *range(90, 100))},
    20: "plate", 40: "lead", 42: "bone",
}
PALETTE = {
    "shell": (0.20, 0.06, 0.02), "edge": (0.62, 0.40, 0.20), "membrane": (0.13, 0.026, 0.03),
    "sinew": (0.24, 0.05, 0.045), "claw": (0.020, 0.012, 0.010), "tooth": (0.70, 0.56, 0.36),
    "organ": (0.9, 0.12, 0.012), "eye": (1.0, 0.40, 0.08), "crest": (0.58, 0.44, 0.27),
    "cavity": (0.03, 0.005, 0.006), "under": (0.10, 0.035, 0.022),
}
GLOW_STRENGTH = 1.3030
GLOW = {"organ": (1.0, 0.18, 0.29), "eye": (1.0, 0.45, 0.10)}


def paint_marks(name, co, normals, plate, bands):
    if name != "crawler-body":
        return
    # Continue the dorsal organ across the articulated thorax and nose shield.
    # A wider tail and pointed nose give the stripe a direction at gameplay mips.
    x, y, z = co.T
    width = np.interp(x, [-1.02, -0.76, 0.20, 0.72], [0.035, 0.105, 0.075, 0.032])
    dorsal = (x > -1.02) & (x < 0.72) & (np.abs(y) < width) & (z > 0.49 * ASPECT)
    bands[plate == 504] = "accent"
    bands[dorsal & (normals[:, 2] > 0.12)] = "accent"


def build(sk):
    body = S.Sculpture("crawler-body")
    chest, tail = "chest", "tail"
    # --- masses -------------------------------------------------------------
    thorax_c = v3((0.17, 0.0, 0.47 * sk.aspect))
    thorax_r = v3((0.31, 0.27, 0.135 * sk.aspect))
    body.add(A.mass(thorax_c, thorax_r, frame((1, 0, -0.15)), bone=chest, zone=MEMBRANE, lump=0.003, freq=7, seed=3))
    ab_c = v3((-0.46, 0.0, 0.53 * sk.aspect))
    ab_r = v3((0.56, 0.40, 0.205 * sk.aspect))
    ab_R = frame((1, 0, -0.32))
    body.add(A.mass(ab_c, ab_r, ab_R, bone=("blend", chest, tail, (0.0, 0, 0.9), (-0.9, 0, 1.0)), zone=MEMBRANE, k=0.10, lump=0.003,
                    freq=6, seed=5))
    # waist membrane between thorax and abdomen
    body.add(Ellipsoid((-0.06, 0, 0.45 * sk.aspect), (0.14, 0.17, 0.10 * sk.aspect), zone=MEMBRANE,
                       bone=("blend", chest, tail, (0.05, 0, 0.9), (-0.2, 0, 0.9)), k=0.06))
    # underside keel
    body.add(Ellipsoid((-0.2, 0, 0.36 * sk.aspect), (0.42, 0.17, 0.07 * sk.aspect), frame((1, 0, -0.1)),
                       zone=S.UNDER, bone=("blend", chest, tail, (0.1, 0, 0.7), (-0.6, 0, 0.7)), k=0.08))

    # --- shingled abdomen mantle with dorsal split --------------------------
    ab_bone = lambda u: ("blend", chest, tail, (0.0, 0, 0.9), (-0.9, 0, 1.0))
    body.extend(A.shingles(ab_c, ab_r, ab_R, None, rows=4, phis=(0.80, 1.45), u0=0.62, u1=-0.62,   # CREATURE18b: wider dorsal cap
                           size=(0.25, 0.26, 0.11), thickness=0.055, lift=0.38, rings=0.0025, grow=-0.18,
                           bone_fn=ab_bone, seed=10, plate0=1, angular=True))
    # tail cap plate
    p, n = A.ellipsoid_surface(ab_c, ab_r, ab_R, -0.88, 0.0)
    body.add(Plate(p + n * 0.01, (0.17, 0.2, 0.09), frame(normalize(-ab_R[:, 0]), n), 0.045, rings=0.006,
                   lip=0.01, chip=0.012, zone=SHELL, bone=tail, plate=20, tint=0.95))
    # lantern: ribbed ember organ in the dorsal split
    a, _ = A.ellipsoid_surface(ab_c, ab_r, ab_R, 0.55, 0.0)
    b, _ = A.ellipsoid_surface(ab_c, ab_r, ab_R, -0.62, 0.0)
    body.extend(A.lantern(a + v3((0, 0, 0.03)), b + v3((0, 0, 0.05)), 0.13, ("blend", chest, tail, a, b), height=1.7, ribs=0.05))

    # --- thorax mantle and prow head -----------------------------------------
    body.extend(A.shingles(thorax_c, thorax_r, frame((1, 0, -0.15)), chest, rows=2, phis=(0.0,), u0=0.15, u1=-0.45,
                           size=(0.21, 0.24, 0.09), thickness=0.05, lift=0.4, rings=0.0025, seed=30, plate0=30, angular=True))
    head_c = v3((0.40, 0.0, 0.46 * sk.aspect))
    body.add(A.mass(head_c, (0.13, 0.16, 0.09 * sk.aspect), frame((1, 0, -0.35)), bone=chest, k=0.05))
    prow_F = frame((1, 0, -0.42))
    body.add(Plate(head_c + v3((0.07, 0, 0.11 * sk.aspect)), (0.32, 0.5, 0.085), frame((1, 0, -0.12)), 0.065, rings=0.005, ring_count=3,
                   lip=0.015, chip=0.01, zone=BONE, bone=chest, plate=40, tint=1.0, k=0.0))
    # keel ridge on the prow
    body.add(RoundCone((0.30, 0, 0.62 * sk.aspect), (0.52, 0, 0.50 * sk.aspect), 0.022, 0.012, zone=SHELL, bone=chest,
                       k=0.02, tint=1.15))
    body.extend(A.eyes((0.47, 0.0, 0.47 * sk.aspect), (1, 0, -0.2), 0.075, 3, 0.017, chest, spread=0.8))
    # ATTACK16: two broad pale hooks sweep out from the wedge corners and curl inward: a "C" from above,
    # with a dark gap between the hooks and the head plate
    for s_, bn in ((-1, "antenna_right0"), (1, "antenna_left0")):
        body.extend(A.hook([(0.47, 0.32 * s_, 0.48 * sk.aspect), (0.85, 0.62 * s_, 0.46 * sk.aspect),
                            (1.15, 0.36 * s_, 0.42 * sk.aspect), (1.08, 0.06 * s_, 0.39 * sk.aspect)],
                           0.12, 0.02, bn, zone=BONE, tip_zone=BONE, k=0.025, n=10, tip=0.35))
    # wet flesh in the waist seam
    body.add(Ellipsoid((-0.04, 0, 0.52 * sk.aspect), (0.09, 0.2, 0.07 * sk.aspect), zone=FLESH,
                       bone=("blend", chest, tail, (0.05, 0, 0.9), (-0.2, 0, 0.9)), k=0.03))
    # mouth cavity and hooked side mandibles
    body.add(Ellipsoid((0.53, 0, 0.40 * sk.aspect), (0.05, 0.07, 0.035 * sk.aspect), op="sub", zone=CAVITY, k=0.02))
    for s, name in ((-1, "antenna_right1"), (1, "antenna_left1")):
        body.extend(A.hook([(0.46, 0.09 * s, 0.42 * sk.aspect), (0.60, 0.16 * s, 0.40 * sk.aspect),
                            (0.68, 0.07 * s, 0.34 * sk.aspect), (0.62, 0.0 * s + 0.02 * s, 0.30 * sk.aspect)],
                           0.03, 0.006, name, k=0.012, tip=0.35))

    # --- legs ------------------------------------------------------------------
    legs = [("leg0", -1, True), ("leg5", 1, True), ("leg1", -1, False), ("leg4", 1, False), ("leg2", -1, False), ("leg3", 1, False)]
    for leg, side, raptor in legs:
        up, lo = f"{leg}_upper", f"{leg}_lower"
        hip, knee, foot = sk.h(up), sk.h(lo), sk.end(lo)
        heavy = 1.25 if (raptor and side < 0) else 1.0   # the off-hand: right hook is heavier
        if raptor:
            forelimb = A.limb(hip, knee, knee + (foot - knee) * 0.25, 0.15 * heavy, 0.12 * heavy, 0.07, up, lo,
                               spurs=0, tendon=True, seed=sum(map(ord, leg)) % 50, tint=1.0, planted=False)
            for surface in forelimb:
                if surface.bone == lo and surface.zone in (ARMOR, SHELL):
                    surface.plate = 42
            body.extend(forelimb)
            # raptorial scythe: crescent blade, cutting edge facing forward/inward
            shin = normalize(foot - knee)
            edge = v3((1.0, -0.35 * side, 0.6))
            # CREATURE19: forefeet splay forward and outward so the two raptor blades separate from the head
            bite = A.blade(knee + shin * 0.04, foot + v3((0.14, 0.16 * side, 0.03)), edge, 0.16 * heavy, 0.03 * heavy, lo, zone=BONE, edge_zone=BONE,
                                hook=0.45, serrations=3)
            for segment in bite:
                segment.plate = 504
            body.extend(bite)
        else:
            body.extend(A.limb(hip, knee, foot, 0.165, 0.125, 0.04, up, lo, seed=sum(map(ord, leg)) % 50,
                               bend=0.03 * sk.aspect, tint=1.0))

    # --- elite rank: bone crest + heavier shoulder plates --------------------
    elite = S.Sculpture("crawler-elite")
    # ATTACK16 elite: a forked, raised dorsal shell (two plates splayed up like a V), each carrying a tall pale fin
    for side, scale in ((1, 1.9), (-1, 1.6)):   # CREATURE19: taller rank fins
        p, n = A.ellipsoid_surface(ab_c, ab_r, ab_R, 0.0, 0.42 * side)
        lift = normalize(n + v3((0, 0.35 * side, 1.4)))
        elite.add(Plate(p + n * 0.12, (0.48 * scale, 0.3 * scale, 0.11), frame(v3((1, 0, 0.25)), lift), 0.065, rings=0.004, lip=0.015,
                        chip=0.012, zone=CREST, bone=ab_bone(0), plate=60 + side))
        base = p + n * 0.16
        for i, (dx, h) in enumerate(((0.28, 0.75 * scale), (-0.05, 1.0 * scale), (-0.33, 0.7 * scale))):
            a0 = base + v3((dx, 0, 0))
            elite.add(Plate(a0 + v3((0, 0.12 * side, h * 0.5)), (0.17, h * 0.55, 0.035), frame(v3((1, 0, 0.6)), v3((0, 1, 0.25 * side))), 0.028,
                            rings=0.003, lip=0.01, chip=0.012, zone=BONE, bone=ab_bone(0), plate=70 + i + 3 * (side > 0)))
    elite.extend(A.rank_mantle(thorax_c, thorax_r, frame((1, 0, -0.15)), chest, -0.1, scale=1.25))   # CREATURE21
    # second lantern bulging from the thorax
    p, n = A.ellipsoid_surface(thorax_c, thorax_r, frame((1, 0, -0.15)), -0.15, 0.0)
    elite.extend(A.lantern(p - v3((0.12, 0, 0)), p + v3((0.12, 0, 0)), 0.1, chest, height=1.5, ribs=0.045))
    # A forked tail fan projects past the flank on either side of the dorsal stripe.
    fins = S.Sculpture("crawler-fins")
    for side in (-1, 1):
        start = v3((-0.57, 0.26 * side, 0.66 * sk.aspect))
        end = v3((-1.04, 0.87 * side, 0.60 * sk.aspect))
        fins.extend(A.blade(start, end, (0.4, 0.1 * side, 0.8), 0.19, 0.052, tail,
                            hook=0.25, serrations=0, zone=SHELL, edge_zone=BONE))
    return {"body": body, "elite": elite, "fins": fins}
