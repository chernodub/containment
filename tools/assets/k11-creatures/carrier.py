"""Carrier — brood-bearer on the six-legged `dragoon` skeleton; Carrier Matron is its boss rank.

A broad shingled thorax, a raised brood bulb whose split mantle exposes a
cluster of magenta brood pods (the caste lantern), a low prow head with paired
hooked mandibles, two raptorial fore-claws and six arched legs.
"""

import numpy as np

import sdf as S
from sdf import SHELL, MEMBRANE, CLAW, ORGAN, CREST, TOOTH, CAVITY, SINEW, EYE, Ellipsoid, RoundCone, Plate, frame, v3, normalize
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
    "organ": (0.55, 0.04, 0.3), "eye": (1.0, 0.35, 0.75), "crest": (0.5, 0.4, 0.38),
    "cavity": (0.03, 0.005, 0.012), "under": (0.08, 0.03, 0.04),
}
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
    # --- brood bulb (tail chain) with exposed pods --------------------------------------
    bb_c, bb_r, bb_R = z(-4.6, 0, 11.3), v3((3.3, 3.0, 2.2 * a)), frame((1, 0, -0.25))
    tf = lambda u: "tail" if u > 0.3 else ("tail.001" if u > -0.45 else "tip")
    body.add(A.mass(bb_c, bb_r, bb_R, bone=("blend", "tail", "tip", z(-2.5, 0, 10.5), z(-7, 0, 12)), zone=MEMBRANE, k=0.8, lump=0.06, freq=0.6))
    body.extend(A.shingles(bb_c, bb_r, bb_R, None, rows=4, phis=(1.35, 2.05), u0=0.65, u1=-0.7, size=(1.3, 1.2, 0.6),
                           thickness=0.42, lift=0.35, rings=0.02, bone_fn=tf, seed=30, plate0=20))
    pods = []
    rng = np.random.default_rng(7)
    for i, (u, phi, r) in enumerate([(0.45, 0.0, 1.05), (0.05, -0.45, 1.15), (0.05, 0.45, 1.1), (-0.35, 0.0, 1.2),
                                     (-0.62, -0.35, 0.9), (-0.62, 0.35, 0.95), (0.4, -0.75, 0.8), (0.4, 0.75, 0.8)]):
        p, n = A.ellipsoid_surface(bb_c, bb_r, bb_R, u, phi)
        c = p + n * r * 0.25
        pod = Ellipsoid(c, (r * 1.2, r, r * 0.95 * 1.2), frame(normalize(v3(rng.normal(size=3)) + n * 2), n), zone=ORGAN, bone=tf(u))
        body.add(S.Stretch(pod, n, r * 0.45, r * 0.08, sharp=3, zone=ORGAN, bone=tf(u)))
        body.add(Ellipsoid(c - n * r * 0.35, (r * 1.35, r * 1.15, r * 0.5), frame(normalize(v3((1, 0, 0)) - n * float(n[0])), n),
                           zone=SINEW, bone=tf(u), k=0.25))
        pods.append((p, n, r))
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
            chain(body, sk, names, [0.75, 0.62, 0.58, 0.5, 0.4, 0.08], s, plates=(1, 2, 3), tint=0.55)
    # --- elite: crest along the thorax --------------------------------------------------
    elite = S.Sculpture("carrier-elite")
    pts, nrm = [], []
    for u in np.linspace(0.5, -0.4, 4):
        for phi in (-0.45, 0.45):
            p, n = A.ellipsoid_surface(th_c, th_r, th_R, float(u), phi)
            pts.append(p + n * 0.4)
            nrm.append(n)
    elite.extend(A.crest_spines(pts, nrm, 2.4, 0.3, lambda p: bf(float(p[0] - th_c[0]) / th_r[0]), sweep=(-1, 0, 0.2)))
    # --- boss (Carrier Matron): spine crown around the brood and two great pods ----------
    boss = S.Sculpture("carrier-matron")
    ring_pts, ring_n = [], []
    for k in range(9):
        ang = -0.95 + 1.9 * k / 8
        p, n = A.ellipsoid_surface(bb_c, bb_r, bb_R, 0.15, ang * 1.3)
        ring_pts.append(p + n * 0.3)
        ring_n.append(n)
    boss.extend(A.crest_spines(ring_pts, ring_n, 3.2, 0.38, lambda p: "tail.001", sweep=(0, 0, 0.6), plate=300))
    for u, phi in ((0.2, -1.0), (0.2, 1.0)):
        p, n = A.ellipsoid_surface(bb_c, bb_r, bb_R, u, phi)
        pod = Ellipsoid(p + n * 0.6, (1.6, 1.4, 1.5), frame(v3((1, 0, 0.3)), n), zone=ORGAN, bone="tail.001")
        boss.add(S.Stretch(pod, n, 0.6, 0.12, sharp=3, zone=ORGAN, bone="tail.001"))
        boss.add(Plate(p + n * 1.6 + v3((0.8, 0, 0)), (1.4, 1.2, 0.6), frame(v3((1, 0, 0.2)), n), 0.4, rings=0.02, lip=0.1,
                       chip=0.06, zone=CREST, bone="tail.001", plate=320 + int(phi)))
    return {"body": body, "elite": elite, "boss": boss}
