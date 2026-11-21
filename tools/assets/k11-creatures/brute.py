"""Brute — heavy siege caste on the `tyrant` skeleton; Brute Warden is its boss rank.

A shingled bulwark chest split along the crown by an amber lantern, a low
bone-pale prow head between two crusher arms ending in hooked cleavers (the
right one heavier), a long armoured hind body on four pillar legs.
"""

import numpy as np

import sdf as S
from sdf import AnglePlate, bezier, BONE, ARMOR, FLESH, SHELL, MEMBRANE, CLAW, ORGAN, CREST, TOOTH, CAVITY, SINEW, Ellipsoid, RoundCone, Plate, frame, v3, normalize
import species as A

ASSET = "tyrant"
FAMILY = "brute"
ASPECT = 1.8
VOXEL = 0.024
TRIS = {"body": 11500, "elite": 1600, "boss": 8400}
RANK_SCALE = {"boss": 2.3, "elite": 1.12}
RANK_PARTS = {"boss": ["body", "boss"]}   # the Warden keeps its crown without the elite horn   # Brute Warden: uniform boss-tier scale applied by the loader
ATLAS = 2048
GLOW_STRENGTH = 2.0
BANDS = {   # CREATURE18: dark chitin, warm flesh, blades at ~half the old bone value (cool grey), ochre lantern
    "chitin": (0.10, 0.05, 0.035), "flesh": (0.62, 0.36, 0.20), "bone": (0.17, 0.18, 0.20),
    "accent": (1.0, 0.45, 0.05), "eye": (1.0, 0.6, 0.15),
}
BANDS["lead"] = (0.80, 0.55, 0.32)
BANDS["plate"] = (0.30, 0.16, 0.09)   # CREATURE20: dark umber angular chest/arm armour over the ochre body   # CREATURE19: the head plate is the lightest body plane (which end is the head)
BAND_MAP = {"shell": "flesh", "crest": "flesh", "membrane": "chitin", "sinew": "chitin"}
# dorsal shingle row (hump 90/93, hind 20/23/26/29) joins the dark armour: a hard spine over ochre flanks
PLATE_BAND = {**{i: "plate" for i in range(300, 335)}, 50: "lead", **{160 + i: "lead" for i in range(8)}, **{i: "chitin" for i in (*range(90, 96), 20, 23, 26, 29)}}   # CREATURE19: the whole hump is dark armour   # top-view plates carry the mid band, gaps go dark
PALETTE = {
    "shell": (0.13, 0.035, 0.022), "edge": (0.55, 0.36, 0.20), "membrane": (0.11, 0.022, 0.026),
    "sinew": (0.26, 0.06, 0.05), "claw": (0.022, 0.014, 0.012), "tooth": (0.72, 0.60, 0.42),
    "organ": (1.0, 0.45, 0.05), "eye": (1.0, 0.6, 0.15), "crest": (0.44, 0.35, 0.26), "armor": (0.24, 0.12, 0.075), "flesh": (0.32, 0.05, 0.05),
    "cavity": (0.03, 0.005, 0.006), "under": (0.08, 0.03, 0.022),
}
GLOW = {"organ": (1.0, 0.36, 0.0), "eye": (1.0, 0.55, 0.08)}


def build(sk):
    a = sk.aspect
    z = lambda x, y, zz: v3((x, y, zz * a))
    body = S.Sculpture("brute-body")
    # --- chest bulwark --------------------------------------------------------
    chest_c, chest_r, chest_R = z(0.15, 0, 3.45), v3((1.15, 1.42, 1.05 * a)), frame((1, 0, 0.25))
    # CREATURE20: an ochre chest under two large angular pectoral plates and a keeled sternum (an armoured wedge,
    # not a stack of domes); the dark hump plates stay on top
    body.add(A.mass(chest_c, chest_r, chest_R, bone="chest", zone=FLESH, lump=0.006, freq=1.5, seed=2))
    up_ = v3((0, 0, 1))
    for i, (u, phi, L, W) in enumerate(((0.55, 1.0, 1.25, 0.85), (0.15, 1.55, 1.05, 0.75))):
        for side in (1, -1):
            p, n = A.ellipsoid_surface(chest_c, chest_r, chest_R, u, phi * side)
            fwd = normalize(up_ - n * float(up_ @ n) + chest_R[:, 0] * 0.35)
            body.add(AnglePlate(p + n * 0.12, frame(fwd, n), L, W, 0.3, keel=0.22, rake=0.55, taper=0.5, lift=0.18,
                                zone=ARMOR, bone="chest", plate=300 + i * 2 + (side > 0)))
    front = normalize(chest_R[:, 0])
    st = chest_c + front * chest_r[0] * 0.92 + v3((0, 0, -0.25 * a))
    body.add(AnglePlate(st, frame(normalize(up_ - front * float(up_ @ front)), front), 1.45, 0.5, 0.3, keel=0.42, rake=0.7,
                        taper=0.45, zone=SHELL, bone="chest", plate=10))
    la, _ = A.ellipsoid_surface(chest_c, chest_r, chest_R, 0.55, 0.0)
    lb, _ = A.ellipsoid_surface(chest_c, chest_r, chest_R, -0.62, 0.0)
    body.extend(A.lantern(la + v3((0, 0, 0.08)), lb + v3((0, 0, 0.1)), 0.4, "chest", height=1.7, ribs=0.17))
    body.add(A.mass(z(0.1, 0, 2.55), (1.15, 0.95, 0.62 * a), frame((1, 0, 0.1)), bone=("blend", "chest", "tail", z(0.6, 0, 3), z(-0.8, 0, 2.3)),
                    zone=FLESH, k=0.45, lump=0.03, freq=1.2, seed=9))
    # ATTACK16: a tall shoulder hump (height, not width) so the Brute reads as the heavy of the crowd
    hump_c = chest_c + z(-0.35, 0, 0.95)
    body.add(A.mass(hump_c, (1.05, 0.85, 0.75 * a), frame((1, 0, 0.35)), bone="chest", zone=MEMBRANE, k=0.45, lump=0.02, freq=1.4, seed=17))
    body.extend(A.shingles(hump_c, v3((1.05, 0.85, 0.75 * a)), frame((1, 0, 0.35)), "chest", rows=2, phis=(0.0, 0.85), u0=0.45, u1=-0.35,
                           size=(0.7, 0.62, 0.32), thickness=0.24, lift=0.35, rings=0.008, seed=90, plate0=90))
    # --- hind body --------------------------------------------------------------
    hind_c, hind_r, hind_R = z(-1.15, 0, 2.05), v3((1.95, 0.98, 0.62 * a)), frame((1, 0, 0.18))
    body.add(A.mass(hind_c, hind_r, hind_R, bone="tail", zone=MEMBRANE, k=0.35, lump=0.01, freq=1.5, seed=3))
    body.add(Ellipsoid(z(-0.35, 0, 2.85), (0.8, 0.85, 0.45 * a), zone=MEMBRANE,
                       bone=("blend", "tail", "chest", z(-0.9, 0, 2.5), z(0.3, 0, 3.4)), k=0.3))
    body.extend(A.shingles(hind_c, hind_r, hind_R, "tail", rows=4, phis=(0.0, 1.0), u0=0.5, u1=-0.78,
                           size=(0.68, 0.62, 0.3), thickness=0.22, lift=0.4, rings=0.006, grow=-0.25, seed=60, plate0=20))
    # CREATURE19: three hard, dark, angular dorsal plates with raised sharp trailing spikes over the ochre body
    body.extend(A.dorsal_blades(hump_c, v3((1.05, 0.85, 0.75 * a)), frame((1, 0, 0.35)), "chest", (0.15,), 1.35, 0.85, 0.18,
                                lift=0.45, plate=170))
    body.extend(A.dorsal_blades(hind_c, hind_r, hind_R, "tail", (0.55, 0.05), 1.2, 0.75, 0.17, lift=0.52, plate=171))
    # --- head -------------------------------------------------------------------
    # CREATURE19: the head hangs forward and low out of a narrow dark neck, so it never sinks into the shoulders
    HO = z(0.32, 0, -0.22)
    head_c = z(1.45, 0, 4.05) + HO
    body.add(A.mass(head_c, (0.72, 0.6, 0.38 * a), frame((1, 0, -0.35)), bone="head", k=0.18))
    body.add(Ellipsoid(z(1.0, 0, 4.0), (0.42, 0.36, 0.26 * a), zone=MEMBRANE, bone=("blend", "chest", "head", z(0.4, 0, 4.0), z(1.3, 0, 4.2)), k=0.12))
    # dark armoured collar ring between shoulders and head
    body.add(S.Torus(z(0.98, 0, 4.02), (1, 0, -0.2), 0.42, 0.13, zone=ARMOR, bone=("blend", "chest", "head", z(0.4, 0, 4.0), z(1.3, 0, 4.2)), k=0.04))
    # heavy dark jaw: an underslung mandible plate jutting past the brow
    body.add(AnglePlate(head_c + z(0.35, 0, -0.32), frame((-1, 0, 0.55), (0, 0, -1)), 0.75, 0.62, 0.2, keel=0.18, rake=0.6,
                        taper=0.6, zone=ARMOR, bone="jaw", plate=55))   # trailing point forward: a jutting jaw
    body.add(AnglePlate(head_c + z(0.05, 0, 0.3), frame((1, 0, -0.45)), 0.85, 0.66, 0.2, keel=0.2, rake=0.35, taper=0.4,
                        lift=0.1, zone=CREST, bone="head", plate=50))
    body.add(RoundCone(z(0.95, 0, 4.55) + HO, z(2.05, 0, 4.0) + HO, 0.09, 0.05, zone=CREST, bone="head", k=0.06))
    body.extend(A.eyes(z(1.95, 0, 3.92) + HO, (1, 0, -0.3), 0.32, 3, 0.06, "head", spread=0.8))
    body.add(Ellipsoid(z(2.12, 0, 3.7) + HO, (0.22, 0.3, 0.12 * a), op="sub", zone=CAVITY, k=0.08))
    for s in (-1, 1):
        body.extend(A.hook([z(1.85, 0.3 * s, 3.7) + HO, z(2.2, 0.38 * s, 3.45) + HO, z(2.4, 0.3 * s, 3.1) + HO, z(2.5, 0.2 * s, 2.85) + HO],
                           0.14, 0.03, "jaw", k=0.05, tip=0.4))
    # --- crusher arms -------------------------------------------------------------
    for s, side in ((-1, "r"), (1, "l")):
        heavy = 1.36 if s < 0 else 0.9   # CREATURE19: the striking (right) arm is visibly the heavier one
        sh, el, wr = sk.h(f"shoulder.{side}"), sk.h(f"forearm.{side}"), sk.h(f"claw.{side}")
        end = sk.end(f"claw.{side}")
        body.add(RoundCone(sh, el, 0.56 * heavy, 0.42 * heavy, zone=SHELL, bone=f"shoulder.{side}", k=0.15, tint=0.8, plate=330))
        # CREATURE20: an angular umber pauldron over each shoulder, trailing point back
        ua = normalize(el - sh)
        out_ = normalize(v3((0.1, 1.0 if s > 0 else -1.0, 0.8)))
        body.add(AnglePlate(sh + out_ * 0.5 * heavy + ua * 0.15, frame(-normalize(ua - out_ * float(ua @ out_)), out_), 0.75 * heavy,
                            0.62 * heavy, 0.24 * heavy, keel=0.2 * heavy, rake=0.6, taper=0.55, lift=0.12 * heavy, zone=ARMOR,
                            bone=f"shoulder.{side}", plate=332 + (s > 0)))
        body.add(Ellipsoid(el, (0.34 * heavy,) * 3, zone=MEMBRANE, bone=("blend", f"shoulder.{side}", f"forearm.{side}", sh, wr), k=0.1))
        body.add(RoundCone(el, wr, 0.44 * heavy, 0.52 * heavy, zone=SHELL, bone=f"forearm.{side}", k=0.12, tint=0.8, plate=331))
        fa = normalize(wr - el)
        Ff = frame(fa, (s * 0.6, 1.0 if s > 0 else -1.0, 0.3) if False else (0, 0, 1))
        for i, t in enumerate((0.22, 0.5, 0.78)):
            c = el + (wr - el) * t
            for j, outward in enumerate((normalize(v3((0.35, s * 0.9, 0.5))), normalize(v3((0.9, -s * 0.2, 0.3))))):
                body.add(AnglePlate(c + outward * 0.36 * heavy, frame(-fa, outward), 0.4 * heavy, 0.36 * heavy, 0.16 * heavy,
                                    keel=0.1 * heavy, rake=0.5, taper=0.55, lift=0.06 * heavy, zone=ARMOR,
                                    bone=f"forearm.{side}", plate=310 + i * 2 + j + (s > 0) * 10))
        body.add(Ellipsoid(wr, (0.4 * heavy,) * 3, zone=MEMBRANE, bone=("blend", f"forearm.{side}", f"claw.{side}", el, end), k=0.1))
        body.extend(A.blade(wr + (end - wr) * 0.05, end + v3((0.75, 0.45 * s, 0.25)), v3((0.45, 1.0 * s, 0.6)), 1.0 * heavy, 0.18 * heavy,
                            f"claw.{side}", hook=0.5, serrations=4, zone=BONE, edge_zone=BONE))
        if s < 0:   # CREATURE19: a dark elbow spur that reads when the striking arm loads
            back = normalize(el - wr) + v3((0, -0.35, 0.3))
            body.add(RoundCone(el + v3((0, -0.1, 0.1)), el + normalize(back) * 1.05, 0.3, 0.035, zone=ARMOR,
                               bone=f"shoulder.{side}", k=0.08))
        # tendon across the elbow
        body.add(S.Tube([sh + (el - sh) * 0.5 + v3((0.15, 0, -0.1)), el + v3((0.25, 0, -0.25)), el + (wr - el) * 0.3 + v3((0.2, 0, -0.1))],
                        [0.07, 0.09, 0.07], zone=SINEW, bone=("blend", f"shoulder.{side}", f"forearm.{side}", sh, wr), k=0.05))
        # little feeding arms under the chest
        ss, lf, pm = sk.h(f"shoulders.{side}"), sk.h(f"lilforearm.{side}"), sk.h(f"palm.{side}")
        body.add(RoundCone(ss, lf, 0.13, 0.09, zone=SHELL, bone=f"shoulders.{side}", k=0.06, tint=0.7))
        body.add(RoundCone(lf, pm, 0.09, 0.08, zone=SHELL, bone=f"lilforearm.{side}", k=0.05, tint=0.7))
        for f in ("0", "1"):
            f0, f1 = sk.h(f"finger{f}.1.{side}"), sk.h(f"finger{f}.2.{side}")
            body.add(RoundCone(pm, f1 + (f1 - pm) * 0.3, 0.06, 0.01, zone=TOOTH, bone=f"finger{f}.1.{side}", k=0.03))
    # --- legs -------------------------------------------------------------------------
    for leg in ("front", "back"):
        for s, side in ((-1, "r"), (1, "l")):
            hip, knee, foot = sk.h(f"leg.{leg}.{side}"), sk.h(f"foot.{leg}.{side}"), sk.end(f"foot.{leg}.{side}")
            body.extend(A.limb(hip, knee, foot, 0.95, 0.72, 0.32, f"leg.{leg}.{side}", f"foot.{leg}.{side}",
                               seed=len(leg) + s, tint=1.0, bend=0.2))
    # --- elite: crest spines along the chest crown, shoulder spikes -------------------
    elite = S.Sculpture("brute-elite")
    # ATTACK16 elite: one overgrown pale shoulder-blade horn on the left (rank and the loaded side in one shape)
    base = chest_c + z(-0.5, 0.95, 1.05)
    elite.add(S.Tube(bezier(base, base + z(0.2, 0.35, 1.3), base + z(-0.9, 0.75, 2.4), base + z(-0.2, 1.05, 2.9), 10),
                     [0.5 - 0.045 * j for j in range(11)], zone=BONE, bone="chest", k=0.18))
    for t in (0.25, 0.5):
        q = base + z(0.05, 0.35 * t * 2, 1.3 * t * 2)
        elite.add(S.Torus(q, z(0, 0.3, 1.0), 0.42 - 0.12 * t, 0.08, zone=ARMOR, bone="chest", k=0.05))
    elite.add(Plate(chest_c + z(-0.4, 0.9, 0.95), (0.9, 0.7, 0.35), frame((1, 0, -0.1), (0.1, 0.8, 0.7)), 0.25, rings=0.01, lip=0.06,
                    chip=0.05, zone=CREST, bone="chest", plate=140))
    # CREATURE19 elite: a tall raked crest along the spine and a longer striking cleaver
    elite.extend(A.rank_fins(hump_c, v3((1.05, 0.85, 0.75 * a)), frame((1, 0, 0.35)), "chest", (0.45, 0.05, -0.35), 1.9 * a, 0.6, 0.15,
                             plate=180))
    wr_r, end_r = sk.h("claw.r"), sk.end("claw.r")
    elite.extend(A.blade(wr_r + (end_r - wr_r) * 0.2, end_r + v3((1.55, -0.75, 0.3)), v3((0.45, -1.0, 0.6)), 1.15, 0.2, "claw.r",
                         hook=0.55, serrations=5, zone=BONE, edge_zone=BONE))
    # --- boss (Brute Warden): bone collar shield and horn crown -----------------------
    boss = S.Sculpture("brute-warden")
    # --- organic crown: grown horn/bone plates rising from the shoulders, asymmetric, one broken tine
    horns = [(-1.45, 1.6, 0.25, False), (-0.75, 2.3, 0.3, False), (0.0, 2.0, 0.32, False), (0.75, 2.9, 0.34, False),
             (1.4, 3.4, 0.36, False), (1.95, 1.05, 0.3, True)]
    for i, (yy, h, r, broken) in enumerate(horns):
        base = chest_c + z(-0.15 - 0.1 * abs(yy), yy * 0.8, 0.95 - 0.12 * abs(yy))
        outward = v3((0, yy * 0.35, 0))
        h *= 1.35
        tip = base + v3((-1.6 - 0.35 * h, 0, h * 0.85)) + outward * h * 0.9
        mid = base + v3((0.15, 0, h * 0.55)) + outward * h * 0.25
        pts = bezier(base, mid, tip + v3((0.4, 0, -h * 0.15)), tip, 8)
        if broken:   # snapped tine: thick stump with a jagged end
            pts = pts[:5]
        radii = [r * (1.0 - 0.8 * j / 8) for j in range(len(pts))]
        if broken:
            radii[-1] = r * 0.62
        boss.add(S.Tube(pts, radii, zone=CREST, bone="chest", k=0.12, plate=160 + i))   # CREATURE19: crown in the light lead band
        if broken:
            for k in range(3):
                d = v3((np.cos(k * 2.1), np.sin(k * 2.1), 0.6))
                boss.add(RoundCone(pts[-1], pts[-1] + d * r * 0.7, r * 0.3, r * 0.05, zone=TOOTH, bone="chest"))
        for t in (0.25, 0.55):   # growth rings banding the horn
            j = int(t * (len(pts) - 1))
            boss.add(S.Torus(pts[j], pts[j + 1] - pts[j], radii[j] * 0.95, radii[j] * 0.18, zone=ARMOR, bone="chest", k=0.05))
    # fused bone plates knitting the horn roots into a collar over the shoulders
    for i, yy in enumerate((-1.1, -0.35, 0.4, 1.15)):
        c = chest_c + z(-0.25, yy * 0.85, 0.85)
        boss.add(Plate(c, (0.75, 0.6, 0.28), frame(v3((1, 0, 0.4)), normalize(v3((0.3, yy * 0.3, 1)))), 0.22, rings=0.014, lip=0.06,
                       chip=0.06, seed=150 + i, zone=ARMOR, bone="chest", plate=150 + i))
    # --- battering ram: massive blunt bone ram on the brow (emission region warden-ram)
    ram0, ram1 = head_c + z(-0.5, 0, 0.3), head_c + z(1.55, 0, -0.05)
    boss.add(RoundCone(ram0, ram1, 0.85, 0.8, zone=ARMOR, bone="head", k=0.25, name="warden-ram"))
    boss.add(S.Stretch(Ellipsoid(ram1 + z(0.15, 0, 0), (0.6, 1.05, 0.62 * a), frame(normalize(ram1 - ram0))),
                       normalize(ram1 - ram0), 0.2, 0.06, zone=BONE, bone="head", name="warden-ram"))   # pale ram face = charge direction
    for s_ in (-1, 1):
        boss.add(RoundCone(ram1 + v3((-0.1, 0.75 * s_, 0.1)), ram1 + v3((0.35, 1.05 * s_, 0.35)), 0.34, 0.16, zone=CREST, bone="head"))
    # CREATURE19 Warden's own head and stance: a forward-slung armoured helm hanging below the brow line,
    # and low heavy dark pauldrons that widen the shoulders at elbow height
    # CREATURE20 Warden head: a broad, forward-swept dark helm with a split crown of two raked light plates and a heavy
    # umber lower jaw projecting forward past the shoulder line, all angular plates; low angular pauldrons
    boss.add(AnglePlate(head_c + z(0.45, 0, 0.32), frame((1, 0, -0.45)), 1.75, 1.55, 0.42, keel=0.38, rake=0.25, taper=0.8,
                        lift=0.0, zone=ARMOR, bone="head", plate=158))
    for s_ in (-1, 1):
        boss.add(AnglePlate(head_c + z(-0.55, 0.75 * s_, 0.75), frame(normalize(v3((-0.55, 0.55 * s_, 1.0))), normalize(v3((0.25, s_, 0.1)))),
                            1.35, 0.55, 0.26, keel=0.16, rake=0.9, taper=0.5, zone=CREST, bone="head", plate=166 + (s_ > 0)))
    boss.add(AnglePlate(head_c + z(1.05, 0, -0.6), frame((-1, 0, 0.25), (0, 0, -1)), 1.6, 1.05, 0.36, keel=0.28, rake=0.75, taper=0.75,
                        zone=ARMOR, bone="jaw", plate=329))
    for s_ in (-1, 1):
        side_ = "r" if s_ < 0 else "l"
        sh_ = sk.h(f"shoulder.{side_}")
        boss.add(AnglePlate(sh_ + v3((0.0, 0.85 * s_, 0.1)), frame(normalize(v3((-1, 0.15 * s_, -0.1))), normalize(v3((0, s_, 0.55)))),
                            1.4, 1.05, 0.4, keel=0.3, rake=0.6, taper=0.6, lift=0.2, zone=ARMOR, bone=f"shoulder.{side_}", plate=157))
    # heavier right battering forearm: knuckle bosses along the crusher
    el, wr = sk.h("forearm.r"), sk.h("claw.r")
    for t in (0.3, 0.55, 0.8):
        c = el + (wr - el) * t + v3((0.25, -0.45, 0.2))
        boss.add(Ellipsoid(c, (0.36, 0.34, 0.3), zone=ARMOR, bone="forearm.r", k=0.05))
    return {"body": body, "elite": elite, "boss": boss}
