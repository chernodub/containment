"""Carrier — brood-bearer on the six-legged `dragoon` skeleton; Carrier Matron is its boss rank.

A broad shingled thorax, a raised brood bulb whose split mantle exposes a
cluster of magenta brood pods (the caste lantern), a low prow head with paired
hooked mandibles, two raptorial fore-claws and six arched legs.
"""

import math

import numpy as np

import sdf as S
from sdf import AnglePlate, bezier, BONE, UNDER, ARMOR, FLESH, SHELL, MEMBRANE, CLAW, ORGAN, CREST, TOOTH, CAVITY, SINEW, EYE, Ellipsoid, RoundCone, Plate, frame, v3, normalize
import species as A
from spitter import chain

ASSET = "dragoon"
FAMILY = "carrier"
ASPECT = 2.7
VOXEL = 0.075
TRIS = {"body": 11000, "elite": 1500, "boss": 21000}
RANK_SCALE = {"boss": 1.9, "elite": 1.12}   # Carrier Matron (BOSS14): her own full body, scaled to the boss tier
RANK_PARTS = {"boss": ["boss"]}   # the Matron rank is a complete skin, not base + addons   # Carrier Matron: uniform boss-tier scale applied by the loader
ATLAS = 2048
GLOW_STRENGTH = 1.0
BANDS = {   # CREATURE18: dark plum chitin, plum flesh, grey-rose shield, magenta accent
    "chitin": (0.09, 0.05, 0.08), "flesh": (0.54, 0.26, 0.40), "bone": (0.24, 0.22, 0.23),
    "accent": (0.75, 0.06, 0.42), "eye": (1.0, 0.35, 0.75),
}
BANDS["lead"] = (0.72, 0.55, 0.64)    # CREATURE20: the Matron's pale face plate (which end is the head)
BANDS["plate"] = (0.11, 0.05, 0.09)   # CREATURE20: dark angular thorax and abdominal segment armour
PLATE_BAND = {400: "lead", **{i: "plate" for i in range(401, 460)}}
BAND_MAP = {"shell": "flesh"}   # thorax shingles carry the mid band
PALETTE = {
    "shell": (0.13, 0.045, 0.06), "edge": (0.52, 0.38, 0.36), "membrane": (0.11, 0.025, 0.045),
    "sinew": (0.16, 0.03, 0.06), "claw": (0.02, 0.012, 0.016), "tooth": (0.7, 0.6, 0.5),
    "organ": (0.55, 0.04, 0.3), "eye": (1.0, 0.35, 0.75), "crest": (0.5, 0.4, 0.38), "flesh": (0.25, 0.05, 0.10), "wet": (0.55, 0.28, 0.36), "membrane_matron": (0.09, 0.025, 0.05),
    "cavity": (0.03, 0.005, 0.012), "under": (0.08, 0.03, 0.04),
}
GLOW_PODS = []   # (centre, radius): pods glowing through the brood skin
MATRON_PODS = []


def glow_pods_for(name):
    return MATRON_PODS if name == "carrier-matron" else GLOW_PODS
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
        body.extend(A.blade(wr, end, v3((1, -0.2 * s, 0.4)), 1.1 * heavy, 0.3 * heavy, f"claw.{side}", hook=0.5, serrations=4, zone=BONE, edge_zone=BONE))
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
    elite.add(Plate(p + n * 0.55 + v3((0, 0.6, 0)), (3.0, 2.4, 1.0), frame(v3((1, 0, -0.05)), normalize(n + v3((0, 0.4, 0)))), 0.6, rings=0.025,
                    ring_count=5, lip=0.15, chip=0.1, zone=BONE, bone="body.001", plate=200))   # asymmetric pale shield
    # CREATURE19 elite: a tall raked crest along the thorax so the elite outline differs from above
    elite.extend(A.rank_fins(th_c, th_r, th_R, None, (0.5, 0.1, -0.3), 3.4 * a, 1.2, 0.32, bone_fn=bf, plate=180))   # height in design z (x aspect)
    # ATTACK16: a second, visible brood cluster riding the other flank of the thorax
    for j, (u, r) in enumerate(((0.3, 0.75), (0.0, 0.85), (-0.3, 0.7), (0.15, 0.6))):
        q, n = A.ellipsoid_surface(th_c, th_r, th_R, u, -1.05)
        c = q + n * (0.55 + 0.25 * j) + v3((0, 0, 0.25 * a * (j % 2)))
        elite.add(Ellipsoid(c, (r * 1.2, r, r * a * 0.5), frame(v3((1, 0, 0.2)), n), zone=EYE, bone=bf(u), k=0.2))
        GLOW_PODS.append((c, r * 0.6))
    q, n = A.ellipsoid_surface(th_c, th_r, th_R, 0.0, -1.05)
    elite.add(Ellipsoid(q + n * 0.35, (1.5, 1.0, 0.45 * a), frame(v3((1, 0, 0)), n), zone=FLESH, bone=bf(0.0), k=0.4))
    for s_ in (-1, 1):
        q = p + n * 0.9 + v3((2.0, 1.4 * s_, 0.2))
        elite.extend(A.hook([q, q + v3((0.8, 0.5 * s_, 0.9)), q + v3((1.6, 0.7 * s_, 1.0)), q + v3((2.2, 0.4 * s_, 0.6))],
                            0.35, 0.05, "body", zone=CREST, tip_zone=TOOTH, k=0.15, tip=0.3))
    # --- boss (Carrier Matron): a hugely expanded brood and attendant pods ------------
    boss = matron(sk, a, z, bf)
    return {"body": body, "elite": elite, "boss": boss}


def matron(sk, a, z, bf):
    """BOSS14 Carrier Matron: heavy low thorax on splayed uneven legs, huge veined brood sac holding glowing shapes,
    flank egg clusters, small armoured head, ground stain. Same dragoon armature."""
    m = S.Sculpture("carrier-matron")
    # --- ground stain (presentation-only decal skinned to the static root)
    m.add(S.Displace(Ellipsoid(z(-1.2, 0, 0.02), (8.6, 7.6, 0.045 * a)), 0.05, 0.35, 21, zone=UNDER, bone="root"))
    # --- heavy low thorax carried between the legs
    th_c, th_r, th_R = z(0.7, 0, 8.2), v3((3.3, 3.1, 2.0 * a)), frame((1, 0, 0.08))
    m.add(A.mass(th_c, th_r, th_R, bone=("blend", "body", "body.002", z(3, 0, 8.5), z(-1.5, 0, 8.8)), zone=MEMBRANE, lump=0.06, freq=0.6, seed=31))
    # CREATURE20: the thorax is a dark angular cuirass (three rows of faceted plates), clearly not the swollen sac
    th_up = v3((0, 0, 1))
    for i, u in enumerate((0.55, 0.1, -0.35)):
        for j, phi in enumerate((0.0, 0.95, -0.95)):
            p, n = A.ellipsoid_surface(th_c, th_r, th_R, u, phi)
            fwd = normalize(th_R[:, 0] - n * float(th_R[:, 0] @ n))
            m.add(AnglePlate(p + n * 0.2, frame(-fwd, n), 1.75, 1.7 if j == 0 else 1.45, 0.5, keel=0.4, rake=0.55, taper=0.7,
                             lift=0.25, zone=ARMOR, bone=bf(u), plate=401 + i * 3 + j))
    # --- a distinct head with a face end, forward of a narrow dark neck
    head_c = z(5.1, 0, 7.4)
    m.add(Ellipsoid(z(3.2, 0, 7.9), (1.1, 1.0, 0.6 * a), zone=ARMOR, bone=("blend", "body", "head", z(2.4, 0, 8.3), z(4.3, 0, 7.7)), k=0.3))
    m.add(A.mass(head_c, (1.75, 1.45, 0.82 * a), frame((1, 0, -0.35)), bone="head", k=0.3))
    m.add(AnglePlate(head_c + z(-0.2, 0, 0.62), frame((1, 0, -0.4)), 1.8, 1.4, 0.4, keel=0.4, rake=0.45, taper=0.6, lift=0.2,
                     zone=ARMOR, bone="head", plate=420))   # dark crested carapace
    m.add(AnglePlate(head_c + z(1.25, 0, -0.05), frame((0, 0, 1), (1, 0, -0.2)), 1.05, 1.0, 0.3, keel=0.3, rake=0.4, taper=0.55,
                     zone=CREST, bone="head", plate=400))   # pale face plate on the front
    for s_ in (-1, 1):
        m.add(Ellipsoid(head_c + z(1.35, 0.75 * s_, 0.15), (0.34, 0.34, 0.34 * a), zone=EYE, bone="head"))
    for s_, side in ((-1, "R"), (1, "L")):
        p0, p1 = sk.h(f"mandible_low.{side}"), sk.h(f"mandible_low.001.{side}")
        e = sk.end(f"mandible_low.001.{side}")
        m.extend(A.hook([p0, p1, e + v3((0.1, 0.25 * s_, 0)), e + v3((0.0, -0.4 * s_, -0.1))], 0.3, 0.05, f"mandible_low.001.{side}",
                        zone=BONE, tip_zone=BONE, k=0.12, tip=0.4))
    # --- splayed, bent, uneven load-bearing legs (thick femurs, knuckled knees, planted pads)
    girth = {("front", "R"): 1.35, ("front", "L"): 1.25, ("middle", "R"): 1.6, ("middle", "L"): 1.75, ("back", "R"): 1.95, ("back", "L"): 1.8}
    for s_, side in ((-1, "R"), (1, "L")):
        for leg in ("front", "middle", "back"):
            g = girth[(leg, side)]
            names = [f"leg_{leg}.{side}", f"leg_{leg}.001.{side}", f"leg_{leg}.002.{side}", f"leg_{leg}.003.{side}", f"leg_{leg}.004.{side}"]
            chain(m, sk, names, [1.15 * g, 1.0 * g, 0.9 * g, 0.75 * g, 0.6 * g, 0.16 * g], s_, plates=(1, 2, 3), tint=0.55)
            knee = sk.h(f"leg_{leg}.002.{side}")
            m.add(Plate(knee + v3((0, 0.45 * s_ * g, 0.6 * g)), (1.0 * g, 0.75 * g, 0.4 * g), frame(v3((0, 0, 1)), v3((0.2, s_, 0.6))), 0.3 * g,
                        rings=0.015, lip=0.08, chip=0.06, zone=ARMOR, bone=f"leg_{leg}.002.{side}", plate=80 + len(leg) + (s_ > 0)))
        # fore-claws, pale attacking plane
        wr, end = sk.h(f"claw.{side}"), sk.end(f"claw.{side}")
        chain(m, sk, [f"upper_arm.{side}", f"upper_arm.001.{side}", f"upper_arm.002.{side}"], [0.95, 0.8, 0.72, 0.65], s_, plates=(0, 1), tint=0.7)
        m.extend(A.blade(wr, end, v3((1, -0.2 * s_, 0.4)), 1.25, 0.32, f"claw.{side}", hook=0.5, serrations=4, zone=BONE, edge_zone=BONE))
    # --- the brood: a huge swollen sac rising behind, veined, holding glowing shapes, with hatch vents
    sc, sr, sR = z(-5.6, 0, 11.6), v3((5.2, 4.5, 3.9 * a)), frame((1, 0, 0.45))
    sac_bone = ("blend", "tail", "tip", z(-2.0, 0, 10.0), z(-8.5, 0, 12.0))
    m.add(A.mass(sc, sr, sR, bone=sac_bone, zone=MEMBRANE, lump=0.12, freq=0.45, seed=33, k=1.2))
    m.add(A.mass(z(-2.6, 0, 9.2), (2.6, 2.8, 1.6 * a), None, bone=("blend", "body.002", "tail", z(-1.2, 0, 9), z(-3.5, 0, 10)),
                 zone=FLESH, lump=0.05, freq=0.6, seed=34, k=1.0))   # the neck of the brood, fused onto the thorax
    m.extend(A.shingles(sc, sr, sR, None, rows=2, phis=(1.7, 2.2), u0=0.75, u1=0.35, size=(1.6, 1.4, 0.6), thickness=0.45,
                        lift=0.35, rings=0.02, bone_fn=lambda u: sac_bone, seed=35, plate0=20))
    # CREATURE20: dark dorsal segment plates banding the swollen abdomen (tergites), plum skin bulging between them
    for i, u in enumerate((0.66, 0.38, 0.1, -0.18, -0.46)):
        for j, phi in enumerate((0.0, 0.62, -0.62)):
            p, n = A.ellipsoid_surface(sc, sr, sR, u, phi)
            fwd = normalize(sR[:, 0] - n * float(sR[:, 0] @ n))
            m.add(AnglePlate(p + n * 0.2, frame(-fwd, n), 1.35, 3.0 if j == 0 else 2.3, 0.5, keel=0.4, rake=0.35, taper=0.85,
                             lift=0.35, zone=ARMOR, bone=sac_bone, plate=430 + i * 3 + j))
    rng = np.random.default_rng(37)
    for u, phi, r in [(0.45, 0.1, 1.5), (0.1, -0.55, 1.7), (0.1, 0.65, 1.6), (-0.3, 0.0, 1.8), (-0.35, -1.1, 1.4),
                      (-0.3, 1.15, 1.5), (0.35, -1.25, 1.2), (0.4, 1.3, 1.25), (-0.65, -0.5, 1.3), (-0.65, 0.55, 1.3), (-0.05, 1.7, 1.1),
                      (-0.05, -1.75, 1.1)]:
        p, n = A.ellipsoid_surface(sc, sr, sR, u, phi)
        c = p - n * r * 0.55
        m.add(Ellipsoid(c, (r * 1.25, r, r * 1.05), frame(normalize(v3(rng.normal(size=3)) + n * 2), n), zone=MEMBRANE, bone=sac_bone, k=0.5))
        MATRON_PODS.append((c, r * 0.62))
    for k in range(14):   # veins crawling over the sac
        u0, u1 = rng.uniform(0.3, 0.8), rng.uniform(-0.8, -0.2)
        ph = rng.uniform(-1.8, 1.8)
        pts = [A.ellipsoid_surface(sc, sr * 1.01, sR, u0 + (u1 - u0) * t, ph + 0.4 * np.sin(t * 3 + k))[0] for t in np.linspace(0, 1, 6)]
        m.add(S.Tube(pts, [0.34, 0.38, 0.34, 0.3, 0.25, 0.18], zone=SINEW, bone=sac_bone, k=0.2))
    for i, (u, phi) in enumerate(((-0.55, 1.35), (-0.75, 0.0), (-0.55, -1.35))):   # hatch vents (matron-vents)
        p, n = A.ellipsoid_surface(sc, sr, sR, u, phi)
        r = 1.1
        m.add(Ellipsoid(p, (r, r, r), op="sub", zone=CAVITY, k=0.35))
        m.add(S.Torus(p - n * 0.1, n, r * 1.05, r * 0.38, zone=SINEW, bone=sac_bone, k=0.3, name="matron-vents"))
        m.add(Ellipsoid(p - n * r * 0.9, (r * 0.75,) * 3, zone=ORGAN, bone=sac_bone, name="matron-vents"))
        MATRON_PODS.append((p - n * r * 0.6, r * 0.5))
    # --- egg clusters along the thorax flanks
    for s_ in (-1, 1):
        for j, u in enumerate((0.45, 0.0, -0.45)):
            p, n = A.ellipsoid_surface(th_c, th_r, th_R, u, 1.45 * s_)
            m.add(Ellipsoid(p + n * 0.2, (0.9, 0.7, 0.55 * a), frame(v3((1, 0, 0)), n), zone=FLESH, bone=bf(u), k=0.3))
            for q in range(3):
                off = v3((np.cos(q * 2.1 + j), np.sin(q * 2.1 + j) * 0.6, 0.3))
                c = p + n * 0.75 + off * 0.55
                m.add(Ellipsoid(c, (0.5, 0.45, 0.45 * a), zone=EYE, bone=bf(u), k=0.15))
                MATRON_PODS.append((c, 0.3))
    return m
