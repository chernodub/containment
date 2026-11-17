"""Carrier — brood-bearer on the six-legged `dragoon` skeleton; Carrier Matron is its boss rank.

A broad shingled thorax, a raised brood bulb whose split mantle exposes a
cluster of magenta brood pods (the caste lantern), a low prow head with paired
hooked mandibles, two raptorial fore-claws and six arched legs.
"""

import math

import numpy as np

import sdf as S
from sdf import bezier, ARMOR, FLESH, SHELL, MEMBRANE, CLAW, ORGAN, CREST, TOOTH, CAVITY, SINEW, EYE, Ellipsoid, RoundCone, Plate, frame, v3, normalize
import species as A
from spitter import chain

ASSET = "dragoon"
FAMILY = "carrier"
ASPECT = 2.7
VOXEL = 0.075
TRIS = {"body": 11000, "elite": 1500, "boss": 9000}
RANK_SCALE = {"boss": 1.4}   # Carrier Matron: uniform boss-tier scale applied by the loader
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
    bb_c, bb_r, bb_R = z(-4.3, 0, 8.4), v3((3.6, 3.3, 2.75 * a)), frame((1, 0, 0.32))
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
            g = {"front": 1.0, "middle": 1.15, "back": 1.4}[leg]      # hind legs carry the brood
            chain(body, sk, names, [1.1 * g, 0.95 * g, 0.85 * g, 0.72 * g, 0.55 * g, 0.14 * g], s, plates=(1, 2, 3), tint=0.55)
            if leg != "front":   # sinew slings from the upper leg into the sagging brood: the load is carried
                knee = sk.h(f"leg_{leg}.001.{side}")
                hip = sk.h(f"leg_{leg}.{side}")
                q, _ = A.ellipsoid_surface(bb_c, bb_r, bb_R, 0.35 if leg == "middle" else -0.05, 1.75 * s)
                body.add(S.Tube(bezier(hip + (knee - hip) * 0.5, hip + (knee - hip) * 0.5 + v3((0, -0.6 * s, -0.4 * a)),
                                       q + v3((0, 0.4 * s, -0.6 * a)), q, 6), [0.38, 0.36, 0.34, 0.32, 0.3, 0.3, 0.32],
                                zone=SINEW, bone=("blend", f"leg_{leg}.{side}", "tail", hip, q), k=0.25))
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
    mb_c, mb_r, mb_R = z(-5.0, 0, 8.4), v3((4.3, 3.7, 2.9 * a)), frame((1, 0, 0.3))
    mb_bone = ("blend", "tail", "tip", z(-2.0, 0, 9.5), z(-9.0, 0, 9.5))
    boss.add(A.mass(mb_c, mb_r, mb_R, bone=mb_bone, zone=FLESH, lump=0.06, freq=0.5, seed=4))
    boss.extend(A.shingles(mb_c, mb_r, mb_R, None, rows=3, phis=(1.15, 1.75), u0=0.6, u1=-0.5, size=(1.5, 1.4, 0.65),
                           thickness=0.45, lift=0.35, rings=0.02, bone_fn=lambda u: mb_bone, seed=60, plate0=60))
    # --- towering brood spire: three ribbed chambers stacked on the brood mass, leaning back
    top = 8.4 + 2.6
    segs = [(z(-4.7, 0, top + 1.2), 2.5, 1.3), (z(-5.5, 0, top + 3.4), 2.0, 1.15), (z(-6.3, 0, top + 5.4), 1.45, 1.0)]
    tower_bone = ("blend", "tail", "tail.001", z(-2.5, 0, 10.0), z(-6.0, 0, 10.5))
    for i, (c, rh, rv) in enumerate(segs):
        boss.add(A.mass(c, (rh, rh * 0.9, rv * a), frame((1, 0, 0.35)), bone=tower_bone, zone=FLESH, lump=0.05, freq=0.7, seed=70 + i, k=0.6))
    for k in range(7):   # bone ribs climbing the spire
        ang = k * 2 * math.pi / 7 + 0.2
        d = v3((math.cos(ang), math.sin(ang), 0))
        pts = [segs[0][0] + d * 2.7 - z(0, 0, 1.4), segs[0][0] + d * 2.75, segs[1][0] + d * 2.2, segs[2][0] + d * 1.6, segs[2][0] + d * 0.4 + z(0, 0, 1.3)]
        boss.add(S.Tube(bezier(pts[0], pts[1], pts[3], pts[4], 8), [0.42 - 0.03 * j for j in range(9)], zone=ARMOR, bone=tower_bone, k=0.25))
    # ribbed hatching vents, one per chamber, facing different ways (emission region matron-vents)
    for i, (c, rh, rv) in enumerate(segs):
        ang = (-0.9, 3.0, 0.9)[i]
        n = normalize(v3((math.cos(ang), math.sin(ang), 0.35)))
        p = c + n * rh * 0.92
        r = (1.05, 0.9, 0.75)[i]
        boss.add(Ellipsoid(p, (r, r, r), op="sub", zone=CAVITY, k=0.3))
        boss.add(S.Torus(p - n * 0.1, n, r * 1.05, r * 0.36, zone=SINEW, bone=tower_bone, k=0.25, name="matron-vents"))
        for t in (-0.45, 0.45):   # ribbed lips
            boss.add(S.Torus(p - n * (0.35 - t * 0.2), n, r * (1.15 + 0.1 * t), r * 0.14, zone=ARMOR, bone=tower_bone, k=0.15, name="matron-vents"))
        boss.add(Ellipsoid(p - n * r * 0.9, (r * 0.7,) * 3, zone=ORGAN, bone=tower_bone, name="matron-vents"))
        GLOW_PODS.append((p - n * r * 0.6, r * 0.45))
    lantern = A.lantern(segs[2][0] + z(0.6, 0, 0.9), segs[2][0] + z(-0.6, 0, 1.3), 0.7, tower_bone, height=1.3, ribs=0.3)
    boss.extend(lantern)
    # --- hanging pod clusters under the brood mass, on sinew stalks
    for side in (-1, 1):
        for u in (0.15, -0.45):
            p, n = A.ellipsoid_surface(mb_c, mb_r, mb_R, u, 1.6 * side)
            hang = p + v3((0, 0.6 * side, -1.6 * a))
            boss.add(S.Tube([p - n * 0.3, p + n * 0.4 + v3((0, 0, -0.5 * a)), hang], [0.2, 0.18, 0.14], zone=SINEW, bone=mb_bone, k=0.15))
            for j, off in enumerate((v3((0.35, 0, -0.2)), v3((-0.35, 0.25, -0.35)), v3((0, -0.3, -0.6)))):
                c = hang + off * 1.4 - v3((0, 0, 0.45 * a))
                boss.add(Ellipsoid(c, (0.55, 0.55, 0.75 * a), zone=EYE, bone=mb_bone, k=0.15))
                GLOW_PODS.append((c, 0.35))
    # --- attendant stalks rising from the thorax, each bearing a pod bulb
    for i, (u, phi, lean) in enumerate(((0.35, 0.7, 0.4), (0.35, -0.7, -0.4), (-0.25, 0.95, 0.7), (-0.25, -0.95, -0.7))):
        p, n = A.ellipsoid_surface(th_c, th_r, th_R, u, phi)
        tip = p + v3((0.4, lean * 1.6, 4.2 * a))
        boss.add(S.Tube(bezier(p - n * 0.3, p + n * 1.0 + v3((0, 0, 1.0 * a)), tip - v3((0, lean * 0.5, 1.2 * a)), tip, 7),
                        [0.32, 0.3, 0.27, 0.24, 0.21, 0.19, 0.17, 0.16], zone=ARMOR, bone=bf(u), k=0.15))
        boss.add(Ellipsoid(tip + v3((0, 0, 0.5 * a)), (0.7, 0.7, 0.85 * a), zone=EYE, bone=bf(u), k=0.2))
        boss.add(S.Torus(tip + v3((0, 0, 0.05 * a)), (0, 0, 1), 0.62, 0.16, zone=SINEW, bone=bf(u), k=0.12))
        GLOW_PODS.append((tip + v3((0, 0, 0.5 * a)), 0.4))
    return {"body": body, "elite": elite, "boss": boss}
