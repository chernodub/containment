"""Crawler — small swarmer on the six-legged `dretch` skeleton.

Shingled hump abdomen split by an ember lantern, a low prow head with hooked
side mandibles, raptorial forelegs (right hook heavier), four walking legs.
"""

import numpy as np

import sdf as S
from sdf import SHELL, MEMBRANE, CLAW, ORGAN, CREST, TOOTH, CAVITY, Ellipsoid, RoundCone, Plate, frame, v3, normalize
import species as A

ASSET = "dretch"
FAMILY = "crawler"
ASPECT = 2.35            # in-game height / horizontal scale (design z multiplier)
VOXEL = 0.0065
TRIS = {"body": 7600, "elite": 1400}
ATLAS = 1024
PALETTE = {
    "shell": (0.20, 0.06, 0.02), "edge": (0.62, 0.40, 0.20), "membrane": (0.13, 0.026, 0.03),
    "sinew": (0.24, 0.05, 0.045), "claw": (0.020, 0.012, 0.010), "tooth": (0.70, 0.56, 0.36),
    "organ": (0.9, 0.12, 0.012), "eye": (1.0, 0.40, 0.08), "crest": (0.58, 0.44, 0.27),
    "cavity": (0.03, 0.005, 0.006), "under": (0.10, 0.035, 0.022),
}
GLOW_STRENGTH = 2.0
GLOW = {"organ": (1.0, 0.085, 0.0), "eye": (1.0, 0.45, 0.10)}


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
    body.extend(A.shingles(ab_c, ab_r, ab_R, None, rows=4, phis=(0.98, 1.62), u0=0.62, u1=-0.62,
                           size=(0.215, 0.22, 0.11), thickness=0.055, lift=0.38, rings=0.0025, grow=-0.18,
                           bone_fn=ab_bone, seed=10, plate0=1))
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
                           size=(0.21, 0.24, 0.09), thickness=0.05, lift=0.4, rings=0.0025, seed=30, plate0=30))
    head_c = v3((0.40, 0.0, 0.46 * sk.aspect))
    body.add(A.mass(head_c, (0.13, 0.16, 0.09 * sk.aspect), frame((1, 0, -0.35)), bone=chest, k=0.05))
    prow_F = frame((1, 0, -0.42))
    body.add(Plate(head_c + v3((0.0, 0, 0.09 * sk.aspect)), (0.17, 0.18, 0.07), prow_F, 0.05, rings=0.005, ring_count=3,
                   lip=0.015, chip=0.01, zone=CREST, bone=chest, plate=40, tint=1.0, k=0.0))
    # keel ridge on the prow
    body.add(RoundCone((0.30, 0, 0.62 * sk.aspect), (0.52, 0, 0.50 * sk.aspect), 0.022, 0.012, zone=SHELL, bone=chest,
                       k=0.02, tint=1.15))
    body.extend(A.eyes((0.47, 0.0, 0.47 * sk.aspect), (1, 0, -0.2), 0.075, 3, 0.017, chest, spread=0.8))
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
            body.extend(A.limb(hip, knee, knee + (foot - knee) * 0.25, 0.09 * heavy, 0.075 * heavy, 0.05, up, lo,
                               spurs=0, tendon=True, seed=sum(map(ord, leg)) % 50, tint=0.45))
            # raptorial scythe: crescent blade, cutting edge facing forward/inward
            shin = normalize(foot - knee)
            edge = v3((1.0, -0.35 * side, 0.6))
            body.extend(A.blade(knee + shin * 0.04, foot + v3((0.02, 0, 0.03)), edge, 0.09 * heavy, 0.028 * heavy, lo,
                                hook=0.45, serrations=3))
        else:
            body.extend(A.limb(hip, knee, foot, 0.085, 0.065, 0.022, up, lo, spurs=2, seed=sum(map(ord, leg)) % 50,
                               bend=0.03 * sk.aspect, tint=0.45))

    # --- elite rank: bone crest + heavier shoulder plates --------------------
    elite = S.Sculpture("crawler-elite")
    pts, nrm = [], []
    for u in np.linspace(0.45, -0.55, 5):
        p, n = A.ellipsoid_surface(ab_c, ab_r, ab_R, float(u), 0.0)
        pts.append(p + n * 0.02)
        nrm.append(n)
    elite.extend(A.crest_spines(pts, nrm, 0.30, 0.035, lambda p: ab_bone(0), sweep=(-1, 0, 0.2)))
    for s in (-1, 1):
        p, n = A.ellipsoid_surface(thorax_c, thorax_r, frame((1, 0, -0.15)), 0.1, 0.95 * s)
        elite.add(Plate(p + n * 0.03, (0.17, 0.12, 0.08), frame((1, 0, 0.1), n), 0.045, rings=0.006, lip=0.012,
                        chip=0.01, zone=CREST, bone=chest, plate=60 + s))
        elite.add(RoundCone(p + n * 0.06, p + n * 0.22 + v3((-0.1, 0.05 * s, 0)), 0.035, 0.004, zone=CREST, bone=chest))
    return {"body": body, "elite": elite}
