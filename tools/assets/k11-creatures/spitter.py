"""Spitter — ranged artillery strider on the `marauder` skeleton.

A swollen acid lantern (the caste's pressure vessel) cradled by shingled flank
plates, a long plated neck ending in a downturned mortar mouth with a green
throat, and high-arched legs like a harvestman's.
"""

import numpy as np

import sdf as S
from sdf import BONE, ARMOR, FLESH, SHELL, MEMBRANE, CLAW, ORGAN, CREST, TOOTH, CAVITY, SINEW, EYE, Ellipsoid, RoundCone, Plate, frame, v3, normalize
import species as A

ASSET = "marauder"
FAMILY = "spitter"
ASPECT = 3.0
VOXEL = 0.03
TRIS = {"body": 9500, "elite": 1400}
RANK_SCALE = {"elite": 1.12}   # ATTACK16
ATLAS = 1024
GLOW_STRENGTH = 0.9   # CREATURE18: a lantern, not a glow blob
BANDS = {   # CREATURE18: dark chitin, olive-ochre flesh (mid mass), pale mortar mouth, acid accent
    "chitin": (0.08, 0.075, 0.04), "flesh": (0.54, 0.50, 0.26), "bone": (0.48, 0.46, 0.34),
    "accent": (0.35, 0.95, 0.08), "eye": (0.55, 1.0, 0.25),
}
BAND_MAP = {"shell": "flesh"}
PALETTE = {
    "shell": (0.12, 0.06, 0.028), "edge": (0.55, 0.45, 0.24), "membrane": (0.09, 0.03, 0.02),
    "sinew": (0.22, 0.08, 0.04), "claw": (0.02, 0.015, 0.01), "tooth": (0.68, 0.62, 0.42),
    "organ": (0.35, 0.9, 0.08), "eye": (0.55, 1.0, 0.25), "crest": (0.5, 0.44, 0.28),
    "cavity": (0.02, 0.01, 0.005), "under": (0.08, 0.05, 0.025),
}
GLOW = {"organ": (0.2, 1.0, 0.02), "eye": (0.5, 1.0, 0.2)}


def chain(body, sk, names, radii, side, plates=(), tint=0.5, claw_hook=False, planted=True):
    """Jointed leg along a bone chain: armoured segments, knuckles, planted foot."""
    pts = [sk.h(n) for n in names] + [sk.end(names[-1])]
    for i, name in enumerate(names):
        p, q = pts[i], pts[i + 1]
        if float(np.linalg.norm(q - p)) < 1e-4:
            continue
        last = i == len(names) - 1
        if last and planted:
            stop = q + (p - q) * 0.12
            body.extend(A.armour_segment(p, stop, radii[i], max(radii[i + 1], radii[i] * 0.45), name, side,
                                         tint=tint * 1.6, plate=100 + i + 10 * (side > 0)))
            body.extend(A.foot(q, q - p, max(radii[i] * 0.55, radii[-2] * 0.5), name))
        elif last:
            body.add(RoundCone(p, q, radii[i], radii[i + 1], zone=CLAW, bone=name, k=radii[i] * 0.35))
        else:
            body.extend(A.armour_segment(p, q, radii[i], radii[i + 1], name, side, tint=tint * 1.6,
                                         plate=100 + i + 10 * (side > 0)))
        if 0 < i:
            prev = names[i - 1]
            body.extend(A.knuckle(p, radii[i] * 0.95, prev, name, pts[i - 1], q))
    return pts


def build(sk):
    a = sk.aspect
    z = lambda x, y, zz: v3((x, y, zz * a))
    body = S.Sculpture("spitter-body")
    # --- trunk ---------------------------------------------------------------------
    body.add(A.mass(z(-0.75, 0, 3.05), (0.95, 0.95, 0.72 * a), frame((1, 0, 0.25)), bone="bum", zone=MEMBRANE, lump=0.02, freq=1.5))
    body.add(A.mass(z(0.6, 0, 3.45), (1.15, 1.0, 0.7 * a), frame((1, 0, 0.05)), bone=("blend", "spine", "spine1", z(0, 0, 3.4), z(1.3, 0, 3.5)),
                    zone=MEMBRANE, k=0.4, lump=0.02, freq=1.5))
    body.add(A.mass(z(1.75, 0, 3.4), (0.7, 0.8, 0.6 * a), frame((1, 0, -0.2)), bone="spine2", zone=MEMBRANE, k=0.35))
    trunk_c, trunk_r, trunk_R = z(0.2, 0, 3.35), v3((2.1, 1.05, 0.72 * a)), frame((1, 0, 0.1))
    bf = lambda u: "bum" if u < -0.35 else ("spine" if u < 0.1 else ("spine1" if u < 0.55 else "spine2"))
    body.extend(A.shingles(trunk_c, trunk_r, trunk_R, None, rows=4, phis=(1.25, 1.95), u0=0.7, u1=-0.7,
                           size=(0.78, 0.6, 0.3), thickness=0.2, lift=0.35, rings=0.01, bone_fn=bf, seed=20, plate0=1))
    # --- the acid vessel ------------------------------------------------------------
    sac_c = z(-0.15, 0, 4.3)
    sac = Ellipsoid(sac_c, (1.55, 0.95, 0.66 * a), frame((1, 0, 0.12)), zone=ORGAN, bone=("blend", "bum", "spine1", z(-1.2, 0, 4), z(1.0, 0, 4)))
    body.add(S.Stretch(sac, (1, 0, 0.1), 0.32, 0.06, sharp=3, zone=ORGAN, bone=sac.bone))
    for s in (-1, 1):
        body.add(Ellipsoid(sac_c + v3((0, 0.72 * s, -0.25)), (1.5, 0.22, 0.32 * a), frame((1, 0, 0.12)), zone=SINEW, bone=sac.bone, k=0.15))
    for i, x in enumerate((-1.0, -0.35, 0.3, 0.95)):
        body.add(RoundCone(z(x, -0.78, 3.85), z(x - 0.05, 0.78, 3.85), 0.06, 0.06, zone=SINEW, bone=bf(x / 2.1), k=0.05))
    # --- neck and mortar head -------------------------------------------------------
    nk, hd = sk.h("neck"), sk.h("head")
    body.add(RoundCone(sk.h("spine2"), nk, 0.6, 0.5, zone=MEMBRANE, bone="spine2", k=0.25))
    body.add(RoundCone(nk, hd, 0.5, 0.45, zone=MEMBRANE, bone="neck", k=0.2))
    for t, bone, p0, p1 in ((0.5, "spine2", sk.h("spine2"), nk), (0.5, "neck", nk, hd)):
        ax = normalize(p1 - p0)
        body.add(Plate(p0 + (p1 - p0) * t + v3((0, 0, 0.32 * a)), (float(np.linalg.norm(p1 - p0)) * 0.6, 0.55, 0.22),
                       frame(ax, (0, 0, 1)), 0.18, rings=0.008, lip=0.04, chip=0.03, zone=SHELL, bone=bone, plate=40 + int(t * 3)))
    head_c = z(3.2, 0, 3.05)
    body.add(A.mass(head_c, (0.7, 0.62, 0.42 * a), frame((1, 0, -0.5)), bone="head", k=0.2))
    body.add(Plate(head_c + z(-0.1, 0, 0.32), (0.8, 0.66, 0.26), frame((1, 0, -0.45)), 0.18, rings=0.008, ring_count=3,
                   lip=0.05, chip=0.03, zone=CREST, bone="head", plate=50))
    mz0, mz1 = z(3.5, 0, 2.7), z(4.0, 0, 2.25)
    # glowing acid duct: sac -> along the neck crest -> into the mortar mouth (the shot's path is visible)
    path = [sac_c + v3((1.3, 0, 0.1 * a)), sk.h("spine2") + v3((0, 0, 0.62 * a)), sk.h("neck") + v3((0, 0, 0.55 * a)),
            sk.h("head") + v3((0.2, 0, 0.42 * a)), mz0 + v3((0.0, 0, 0.3 * a)), mz1 + v3((-0.15, 0, 0.12 * a))]
    duct_bones = ["spine1", "spine2", "neck", "head", "jaw"]
    for i in range(len(path) - 1):
        seg = RoundCone(path[i], path[i + 1], 0.26 - 0.02 * i, 0.24 - 0.02 * i, zone=ORGAN, bone=duct_bones[i], k=0.08)
        body.add(S.Stretch(seg, normalize(path[i + 1] - path[i]), 0.22, 0.05, sharp=3, zone=ORGAN, bone=duct_bones[i]))
        for t in (0.25, 0.75):   # sinew collars hold the duct to the neck plates
            body.add(S.Torus(path[i] + (path[i + 1] - path[i]) * t, path[i + 1] - path[i], 0.27 - 0.02 * i, 0.07, zone=SINEW,
                             bone=duct_bones[i], k=0.05))
    body.add(RoundCone(mz0, mz1, 0.46, 0.4, zone=BONE, bone="jaw", k=0.15))   # pale mortar mouth: the aiming face
    body.add(Ellipsoid(mz1, (0.24, 0.28, 0.28 * a), frame(normalize(mz1 - mz0)), op="sub", zone=CAVITY, k=0.06))
    body.add(Ellipsoid(mz1 - normalize(mz1 - mz0) * 0.22, (0.14, 0.2, 0.2 * a), frame(normalize(mz1 - mz0)), zone=ORGAN, bone="jaw"))
    for s in (-1, 1):
        body.extend(A.hook([mz1 + v3((-0.1, 0.32 * s, 0.1)), mz1 + v3((0.25, 0.4 * s, -0.1)), mz1 + v3((0.35, 0.22 * s, -0.4)),
                            mz1 + v3((0.25, 0.08 * s, -0.6))], 0.1, 0.02, "jaw", k=0.04, tip=0.4))
    for eye in ("eye_h", "eye_m", "eye_l"):
        for side in ("R", "L"):
            body.add(Ellipsoid(sk.h(f"{eye}.{side}") + v3((0.05, 0, 0)), (0.09, 0.09, 0.09 * a), zone=EYE, bone="head"))
    # --- arched legs and fore-limbs -------------------------------------------------
    for s, side in ((-1, "R"), (1, "L")):
        for leg in ("m", "b"):
            names = [f"leg_{leg}{i if i else ''}.{side}" for i in range(8)]
            chain(body, sk, names, [0.5, 0.4, 0.36, 0.33, 0.3, 0.22, 0.17, 0.13, 0.04], s, plates=(2, 4), tint=0.8)
        names = [f"hand.{side}", f"hand1.{side}", f"hand2.{side}", f"claw.{side}"]
        chain(body, sk, names, [0.45, 0.36, 0.33, 0.27, 0.05], s, plates=(0, 2), tint=0.8)
    # --- elite: crown of spines around the vessel -----------------------------------
    elite = S.Sculpture("spitter-elite")
    # a second acid vessel swelling on the neck root, ringed with sinew
    nc = sk.h("spine2") + (sk.h("neck") - sk.h("spine2")) * 0.5 + v3((0, 0, 0.75 * a))
    ves = Ellipsoid(nc, (0.85, 0.7, 0.42 * a), frame((1, 0, 0.3)), zone=ORGAN, bone=("blend", "spine2", "neck", sk.h("spine2"), sk.h("neck")))
    elite.add(S.Stretch(ves, (1, 0, 0.3), 0.26, 0.05, sharp=3, zone=ORGAN, bone=ves.bone))
    for x in (-0.45, 0.0, 0.45):
        elite.add(S.Torus(nc + v3((x, 0, -0.03 * a)), (1, 0, 0.3), 0.62 - abs(x) * 0.4, 0.07, zone=SINEW, bone=ves.bone, k=0.05))
    elite.add(Ellipsoid(nc - v3((0, 0, 0.35 * a)), (0.9, 0.75, 0.25 * a), zone=FLESH, bone=ves.bone, k=0.2))
    # pale crest fin riding the main vessel (rank read from above)
    for i, x in enumerate((-0.9, -0.2, 0.5)):
        c = sac_c + v3((x, 0, (0.62 + 0.05 * i) * a))
        elite.add(Plate(c + v3((0, 0, 0.35 * a)), (0.5, 1.05 - 0.15 * abs(i - 1), 0.1), frame(v3((1, 0, 0.3)), v3((0, 1, 0))), 0.07, rings=0.005, lip=0.02,
                        chip=0.02, zone=BONE, bone="spine" if x < 0 else "spine1", plate=90 + i))
    return {"body": body, "elite": elite}
