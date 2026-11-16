"""Carrier — brood-bearer on the six-legged `dragoon` skeleton; Carrier Matron is its boss rank.

A broad shingled thorax, a raised brood bulb whose split mantle exposes a
cluster of magenta brood pods (the caste lantern), a low prow head with paired
hooked mandibles, two raptorial fore-claws and six arched legs.
"""

import numpy as np

import sdf as S
from sdf import ARMOR, FLESH, SHELL, MEMBRANE, CLAW, ORGAN, CREST, TOOTH, CAVITY, SINEW, EYE, Ellipsoid, RoundCone, Plate, frame, v3, normalize
import species as A
from spitter import chain

ASSET = "dragoon"
FAMILY = "carrier"
ASPECT = 2.7
VOXEL = 0.075
TRIS = {"body": 11000, "elite": 1500, "boss": 4500}
ATLAS = 2048
GLOW_STRENGTH = 1.0
PALETTE = {
    "shell": (0.13, 0.045, 0.06), "edge": (0.52, 0.38, 0.36), "membrane": (0.11, 0.025, 0.045),
    "sinew": (0.26, 0.06, 0.1), "claw": (0.02, 0.012, 0.016), "tooth": (0.7, 0.6, 0.5),
    "organ": (0.55, 0.04, 0.3), "eye": (1.0, 0.35, 0.75), "crest": (0.5, 0.4, 0.38), "flesh": (0.25, 0.05, 0.10), "wet": (0.55, 0.28, 0.36),
    "cavity": (0.03, 0.005, 0.012), "under": (0.08, 0.03, 0.04),
}
GLOW_PODS = []   # (centre, radius): pods glowing through the brood skin
GLOW = {"organ": (0.9, 0.03, 0.45), "eye": (1.0, 0.3, 0.7)}


def build(sk):
    a = sk.aspect
    z = lambda x, y, zz: v3((x, y, zz * a))
    body = S.Sculpture("carrier-body")
    # --- thorax ----------------------------------------------------------------------
    th_c, th_r, th_R = z(0.6, 0, 9.6), v3((3.1, 2.7, 1.6 * a)), frame((1, 0, 0.05))
    bf = lambda u: "body" if u > 0.35 else ("body.001" if u > -0.3 else "body.002")
    body.add(A.mass(th_c, th_r, th_R, bone=("blend", "body", "body.002", z(3, 0, 9.5), z(-1.5, 0, 9.8)), zone=MEMBRANE, lump=0.05, freq=0.6))
    body.extend(A.shingles(th_c, th_r, th_R, None, rows=3, phis=(0.0, 0.85, 1.55), u0=0.6, u1=-0.55, size=(1.4, 1.25, 0.6),
                           thickness=0.45, lift=0.35, rings=0.02, bone_fn=bf, seed=10, plate0=1))
    # --- sagging brood sac (tail chain): stretched skin over pods, brood opening -------
    bb_c, bb_r, bb_R = z(-4.4, 0, 9.0), v3((3.5, 3.2, 2.5 * a)), frame((1, 0, 0.32))
    tf = lambda u: "tail" if u > 0.3 else ("tail.001" if u > -0.45 else "tip")
    sac_bone = ("blend", "tail", "tip", z(-2.0, 0, 10.0), z(-7.0, 0, 10.5))
    body.add(A.mass(bb_c, bb_r, bb_R, bone=sac_bone, zone=FLESH, k=0.9, lump=0.05, freq=0.6))
    # the hard mantle only covers the root and upper flanks; the burden hangs bare
    body.extend(A.shingles(bb_c, bb_r, bb_R, None, rows=2, phis=(0.0, 0.75), u0=0.72, u1=0.32, size=(1.4, 1.3, 0.6),
                           thickness=0.42, lift=0.35, rings=0.02, bone_fn=tf, seed=30, plate0=20))
    rng = np.random.default_rng(7)
    for u, phi, r in [(0.05, -0.2, 1.1), (0.0, 0.55, 1.0), (-0.3, -0.65, 1.15), (-0.35, 0.1, 1.2), (-0.6, 0.7, 0.95),
                      (-0.62, -0.35, 1.0), (0.15, 1.25, 0.9), (0.1, -1.3, 0.9), (-0.45, 1.6, 0.85), (-0.4, -1.65, 0.85)]:
        p, n = A.ellipsoid_surface(bb_c, bb_r, bb_R, u, phi)
        c = p - n * r * 0.45
        body.add(Ellipsoid(c, (r * 1.15, r, r), frame(normalize(v3(rng.normal(size=3)) + n * 2), n), zone=FLESH, bone=tf(u), k=0.35))
        GLOW_PODS.append((c, r))
    for x0, x1 in ((-2.2, -6.5), (-3.0, -7.2)):
        for side in (-1, 1):
            q0, _ = A.ellipsoid_surface(bb_c, bb_r, bb_R, 0.55, 0.4 * side + (0.5 if x0 < -2.5 else 0) * side)
            q1, _ = A.ellipsoid_surface(bb_c, bb_r, bb_R, -0.7, 0.9 * side)
            body.add(S.Tube([q0, (q0 + q1) / 2 + v3((0, 0.3 * side, 0.15)), q1], [0.12, 0.14, 0.1], zone=SINEW, bone=sac_bone, k=0.1))
    # brood opening at the low rear: lipped, glowing deep inside
    p, n = A.ellipsoid_surface(bb_c, bb_r, bb_R, -0.9, 2.5)
    body.add(Ellipsoid(p, (0.95, 0.95, 0.95), op="sub", zone=CAVITY, k=0.3))
    body.add(S.Torus(p - n * 0.15, n, 0.95, 0.32, zone=SINEW, bone="tip", k=0.25))
    body.add(Ellipsoid(p - n * 0.85, (0.6, 0.6, 0.6), zone=ORGAN, bone="tip"))
    GLOW_PODS.append((p - n * 0.6, 0.9))
    # --- head ---------------------------------------------------------------------------
    head_c = z(4.9, 0, 8.6)
    body.add(Ellipsoid(z(3.2, 0, 8.9), (1.4, 1.7, 1.2 * a), zone=MEMBRANE, bone=("blend", "body", "head", z(2.5, 0, 9), z(4.5, 0, 8.6)), k=0.5))
    body.add(A.mass(head_c, (1.7, 1.5, 1.0 * a), frame((1, 0, -0.35)), bone="head", k=0.5))
    body.add(Plate(head_c + z(-0.2, 0, 0.75), (1.9, 1.6, 0.6), frame((1, 0, -0.4)), 0.45, rings=0.02, ring_count=3,
                   lip=0.12, chip=0.08, zone=CREST, bone="head", plate=50))
    body.add(RoundCone(z(3.6, 0, 9.9), z(6.4, 0, 8.6), 0.22, 0.1, zone=CREST, bone="head", k=0.15))
    for eye in ("eye_front", "eye_mid", "eye_back"):
        for side in ("R", "L"):
            body.add(Ellipsoid(sk.h(f"{eye}.{side}"), (0.28, 0.28, 0.28 * a), zone=EYE, bone="head"))
    body.add(Ellipsoid(z(6.4, 0, 7.6), (0.7, 0.8, 0.45 * a), op="sub", zone=CAVITY, k=0.2))
    for s, side in ((-1, "R"), (1, "L")):
        for m in ("up", "low"):
            p0, p1 = sk.h(f"mandible_{m}.{side}"), sk.h(f"mandible_{m}.001.{side}")
            e = sk.end(f"mandible_{m}.001.{side}")
            bone = f"mandible_{m}.001.{side}"
            body.add(RoundCone(p0, p1, 0.35, 0.28, zone=SHELL, bone=f"mandible_{m}.{side}", k=0.15))
            body.extend(A.hook([p1, p1 + (e - p1) * 0.4 + v3((0, 0.3 * s, 0)), e + v3((0.2, 0.2 * s, 0)), e + v3((0.1, -0.5 * s, -0.1))],
                               0.28, 0.05, bone, k=0.1, tip=0.4))
    # --- fore-claws and legs ---------------------------------------------------------------
    for s, side in ((-1, "R"), (1, "L")):
        heavy = 1.15 if s < 0 else 1.0
        names = [f"upper_arm.{side}", f"upper_arm.001.{side}", f"upper_arm.002.{side}"]
        chain(body, sk, names, [0.75 * heavy, 0.6 * heavy, 0.55 * heavy, 0.5 * heavy], s, plates=(0, 1), tint=0.7)
        wr, end = sk.h(f"claw.{side}"), sk.end(f"claw.{side}")
        body.extend(A.blade(wr, end, v3((1, -0.2 * s, 0.4)), 1.0 * heavy, 0.3 * heavy, f"claw.{side}", hook=0.5, serrations=4))
        for leg in ("front", "middle", "back"):
            names = [f"leg_{leg}.{side}", f"leg_{leg}.001.{side}", f"leg_{leg}.002.{side}", f"leg_{leg}.003.{side}", f"leg_{leg}.004.{side}"]
            chain(body, sk, names, [1.1, 0.95, 0.85, 0.72, 0.55, 0.12], s, plates=(1, 2, 3), tint=0.55)
    # --- elite: crest along the thorax --------------------------------------------------
    elite = S.Sculpture("carrier-elite")
    # one great bone shield over the thorax, horned at the front
    p, n = A.ellipsoid_surface(th_c, th_r, th_R, 0.1, 0.0)
    elite.add(Plate(p + n * 0.55, (3.0, 2.7, 1.0), frame(v3((1, 0, -0.05)), n), 0.6, rings=0.025, ring_count=5, lip=0.15,
                    chip=0.1, zone=CREST, bone="body.001", plate=200))
    for s_ in (-1, 1):
        q = p + n * 0.9 + v3((2.0, 1.4 * s_, 0.2))
        elite.extend(A.hook([q, q + v3((0.8, 0.5 * s_, 0.9)), q + v3((1.6, 0.7 * s_, 1.0)), q + v3((2.2, 0.4 * s_, 0.6))],
                            0.35, 0.05, "body", zone=CREST, tip_zone=TOOTH, k=0.15, tip=0.3))
    # --- boss (Carrier Matron): a hugely expanded brood and attendant pods ------------
    boss = S.Sculpture("carrier-matron")
    mb_c, mb_r, mb_R = z(-5.4, 0, 8.2), v3((4.6, 4.2, 2.9 * a)), frame((1, 0, 0.3))
    mb_bone = ("blend", "tail", "tip", z(-2.0, 0, 9.5), z(-9.0, 0, 9.5))
    boss.add(A.mass(mb_c, mb_r, mb_R, bone=mb_bone, zone=FLESH, lump=0.06, freq=0.5, seed=4))
    rng = np.random.default_rng(11)
    for u, phi, r in [(0.3, 0.0, 1.3), (-0.1, -0.6, 1.4), (-0.1, 0.6, 1.4), (-0.5, 0.0, 1.5), (-0.4, -1.3, 1.2),
                      (-0.4, 1.3, 1.2), (0.2, 1.2, 1.1), (0.2, -1.2, 1.1), (-0.75, 0.8, 1.1), (-0.75, -0.8, 1.1)]:
        p, n = A.ellipsoid_surface(mb_c, mb_r, mb_R, u, phi)
        c = p - n * r * 0.4
        boss.add(Ellipsoid(c, (r * 1.2, r, r), frame(normalize(v3(rng.normal(size=3)) + n * 2), n), zone=FLESH, bone=mb_bone, k=0.4))
        GLOW_PODS.append((c, r))
    for phi in (-1.0, 0.0, 1.0):   # hatching vents along the flank
        p, n = A.ellipsoid_surface(mb_c, mb_r, mb_R, -0.55, phi * 1.2 + (0.0 if phi else 0.4))
        boss.add(Ellipsoid(p, (0.75, 0.75, 0.75), op="sub", zone=CAVITY, k=0.25))
        boss.add(S.Torus(p - n * 0.1, n, 0.8, 0.28, zone=SINEW, bone=mb_bone, k=0.2))
        boss.add(Ellipsoid(p - n * 0.7, (0.5, 0.5, 0.5), zone=ORGAN, bone=mb_bone))
        GLOW_PODS.append((p - n * 0.5, 0.75))
    # attendant pods clinging to the thorax flanks on sinew stalks
    for i, (u, phi) in enumerate(((0.35, 1.45), (-0.25, 1.55), (0.35, -1.45), (-0.25, -1.55))):
        p, n = A.ellipsoid_surface(th_c, th_r, th_R, u, phi)
        c = p + n * 0.9 - v3((0, 0, 0.6))
        boss.add(S.Tube([p - n * 0.2, p + n * 0.5, c], [0.22, 0.2, 0.18], zone=SINEW, bone=bf(u), k=0.15))
        boss.add(Ellipsoid(c, (0.95, 0.8, 0.85), frame(v3((1, 0, -0.3)), n), zone=FLESH, bone=bf(u), k=0.2))
        GLOW_PODS.append((c, 0.8))
    return {"body": body, "elite": elite, "boss": boss}
