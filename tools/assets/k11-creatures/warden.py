"""WARDEN25 — the Brute Warden as its own animal on the shared `tyrant` skeleton.

Not the Brute body with a crown: a lopsided battering animal built around the charge. One enormous armoured ram
shoulder on the right (leading) side carries a blunt slate ram face out past the head; the trailing left shoulder is
small and its flank is bare ochre flesh strapped with dark sinew (the side the player hits while it is stunned). The
head is carried low, offset left and behind the ram, under the pale split crown (the family mark). Heavy splayed hind
legs and a short armoured counterweight tail plant it.

The ram shoulder, ram face and flank armour ride the `chest` bone so the shared Brute clips cannot swing them; the
fist arm under the ram and the small left cleaver keep their arm bones. `warden-ram` names the emission region.
"""

import math

import numpy as np

import sdf as S
from sdf import (AnglePlate, bezier, EYE, BONE, ARMOR, FLESH, SHELL, MEMBRANE, CLAW, ORGAN, CREST, TOOTH, CAVITY,
                 SINEW, Ellipsoid, RoundCone, frame, v3, normalize)
import species as A

# plate ids (bands are mapped in brute.PLATE_BAND): 400-429 dark armour, 450-451 pale crown
RAM_PLATES = range(404, 430)   # 400-403 (ram carapace and ram) take the darkest band
RAM_DARK = range(400, 404)
CROWN_PLATES = (450, 451)


def build(sk, a):
    z = lambda x, y, zz: v3((x, y, zz * a))
    w = S.Sculpture("brute-warden")
    # --- torso: a deep ochre chest shifted toward the ram, a short heavy hind body ---------------------------------
    chest_c, chest_r, chest_R = z(0.15, -0.3, 3.1), v3((1.35, 1.4, 0.95 * a)), frame((1, 0, 0.12))
    w.add(A.mass(chest_c, chest_r, chest_R, bone="chest", zone=FLESH, lump=0.006, freq=1.5, seed=2))
    # CREATURE29: a narrower waist between chest and hind body
    w.add(A.mass(z(-0.65, 0.05, 2.5), (1.1, 0.78, 0.5 * a), frame((1, 0, 0.08)), zone=FLESH, k=0.4, lump=0.0, freq=1.2,
                 seed=9, bone=("blend", "chest", "tail", z(0.3, 0, 3.0), z(-1.2, 0, 2.3))))
    hind_c, hind_r, hind_R = z(-1.3, 0.05, 2.25), v3((1.2, 1.1, 0.72 * a)), frame((1, 0, 0.1))   # CREATURE26: rear pulled in
    w.add(A.mass(hind_c, hind_r, hind_R, bone="tail", zone=MEMBRANE, k=0.35, lump=0.0, freq=1.5, seed=3))
    w.extend(A.shingles(hind_c, hind_r, hind_R, "tail", rows=2, phis=(0.0,), u0=0.5, u1=-0.45, size=(0.95, 0.9, 0.3),
                        thickness=0.26, lift=0.4, grow=-0.2, seed=60, plate0=420, angular=True))
    # --- counterweight: a short thick tail ending in an armoured club, swung slightly left (away from the ram) ------
    # CREATURE26: the counterweight is a short club tucked under the hind body (the drawn body must not promise a
    # target far outside the 2.0 m collider)
    tail = bezier(z(-2.2, 0.1, 2.0), z(-2.7, 0.25, 1.7), z(-3.0, 0.4, 1.35), z(-3.15, 0.45, 1.05), 6)
    w.add(S.Tube(tail, [0.72, 0.68, 0.62, 0.58, 0.54, 0.5, 0.48], zone=MEMBRANE, bone="tail", k=0.2))
    w.add(Ellipsoid(z(-3.15, 0.45, 1.0), (0.66, 0.66, 0.4 * a), frame((1, -0.1, 0.4)), zone=ARMOR, bone="tail", k=0.15,
                    plate=419))
    # --- the ram shoulder (right / leading): one huge armoured mass, rigid with the chest ---------------------------
    sh_c, sh_r, sh_R = z(0.65, -2.05, 3.45), v3((1.8, 1.45, 1.0 * a)), frame((1, -0.12, -0.08))
    w.add(A.mass(sh_c, sh_r, sh_R, bone="chest", zone=ARMOR, k=0.45, lump=0.01, freq=1.3, seed=31))   # its crown under plate 400 is the idle top
    # dorsal carapace: two stacked angular plates, trailing points raked back over the hind body
    for i, (dx, dy, dz, L, W_, T) in enumerate(((0.35, -2.05, 4.5, 1.55, 1.2, 0.34), (-0.85, -1.75, 4.15, 1.05, 0.95, 0.3))):   # CREATURE26: smaller
        w.add(AnglePlate(z(dx, dy, dz), frame(normalize(v3((1, -0.15, -0.22))), normalize(v3((0.05, -0.35, 1)))), L, W_, T,
                         keel=0.42, rake=0.55, taper=0.8, lift=0.2, zone=ARMOR, bone="chest", plate=400 + i))
    # outer flank plate hanging over the right legs (the widest point of the outline)
    w.add(AnglePlate(z(0.35, -3.3, 3.15), frame(normalize(v3((1, 0, -0.15))), normalize(v3((0, -1, 0.45)))), 1.75, 0.95,
                     0.3, keel=0.3, rake=0.45, taper=0.75, lift=0.15, zone=ARMOR, bone="chest", plate=402))
    # the ram: a blunt armoured boss driven out past the head, with a slate ribbed face (emission region)
    ram0, ram1 = z(1.4, -1.85, 3.35), z(2.95, -1.65, 3.0)
    w.add(RoundCone(ram0, ram1, 1.15, 1.05, zone=ARMOR, bone="chest", k=0.3, plate=403, name="warden-ram"))
    w.add(S.Stretch(Ellipsoid(ram1 + z(0.32, 0, 0), (0.55, 1.3, 0.85 * a), frame(normalize(ram1 - ram0))),
                    normalize(ram1 - ram0), 0.22, 0.07, zone=ARMOR, bone="chest", name="warden-ram"))   # CREATURE26: dark slate, so crest and maw lead
    for s_, dz in ((-1, 0.0), (1, 0.15)):   # two blunt horn bosses at the ram's corners
        w.add(RoundCone(ram1 + z(0.1, 0.8 * s_, 0.35 + dz), ram1 + z(0.65, 0.95 * s_, 0.55 + dz), 0.34, 0.14,
                        zone=TOOTH, bone="chest", k=0.08))
    # armoured right hind flank down to the tail (the whole leading side is plate)
    for i, (x, zz) in enumerate(((-1.2, 2.7),)):
        w.add(AnglePlate(z(x, -1.3, zz), frame(normalize(v3((1, 0.05, -0.05))), normalize(v3((0, -1, 0.75)))), 0.75, 0.62,
                         0.24, keel=0.22, rake=0.55, taper=0.7, lift=0.12, zone=ARMOR, bone="tail", plate=404 + i))
    # --- trailing left shoulder: small, low, bare -------------------------------------------------------------------
    w.add(A.mass(z(0.2, 1.05, 3.4), (0.78, 0.6, 0.55 * a), frame((1, 0.2, 0)), bone="chest", zone=FLESH, k=0.4, lump=0.0, seed=33))
    w.add(AnglePlate(z(0.05, 1.2, 3.95), frame(normalize(v3((-1, 0.1, -0.1))), normalize(v3((0, 0.6, 1)))), 0.55, 0.45,
                     0.18, keel=0.14, rake=0.6, taper=0.55, lift=0.1, zone=ARMOR, bone="chest", plate=406))
    # bare left flank: dark sinew straps over ochre flesh (the opening while stunned)
    for i, x in enumerate((0.35, -1.0)):
        pts = [z(x + 0.15, 0.25, 3.9 - 0.25 * (x < 0)), z(x, 1.2, 3.3 - 0.25 * (x < 0)), z(x - 0.15, 1.35, 2.5 - 0.15 * (x < 0))]
        w.add(S.Tube(pts, [0.1, 0.12, 0.09], zone=SINEW, bone="chest" if x > 0 else "tail", k=0.06))
    # family lantern: the amber split runs down the bare left back
    w.extend(A.lantern(z(0.15, 0.55, 3.85), z(-0.9, 0.6, 3.45), 0.17, "chest", height=1.0, ribs=0.12))
    # --- head (CREATURE29): a distinct wedge carried forward on a dark neck, under the pale crest -------------------
    head_c = z(1.85, 0.6, 3.05)   # crest, maw, eyes and jaw keep their CREATURE26 anchor (the maw stays the brightest point)
    neck = ("blend", "chest", "head", z(0.8, 0.3, 3.4), z(1.9, 0.6, 3.05))
    w.add(Ellipsoid(z(1.2, 0.45, 3.2), (0.6, 0.45, 0.3 * a), zone=MEMBRANE, bone=neck, k=0.12))
    hfwd = normalize(v3((1, 0.12, -0.25)))
    w.add(S.Prism(head_c - hfwd * 0.55, head_c + hfwd * 1.3 + z(0, 0, -0.12), 0.74, 0.34, sides=4, up=(0, 0, 1), roll=0.0, squash=0.8,
                  zone=MEMBRANE, bone="head", k=0.1, hard=1.0))
    w.add(AnglePlate(head_c + z(0.45, 0.05, -0.36), frame((-1, -0.1, 0.5), (0, 0, -1)), 0.9, 0.7, 0.24, keel=0.22, rake=0.6,
                     taper=0.6, zone=ARMOR, bone="jaw", plate=407))
    # the Warden's own bone crest: one broad pale plate over the skull rising into a swept keel back over the neck
    w.add(AnglePlate(head_c + z(0.0, 0.0, 0.42), frame(normalize(v3((-1, -0.18, 0.2))), normalize(v3((0.15, 0, 1)))), 1.2, 0.78,
                     0.22, keel=0.34, rake=0.9, taper=0.5, lift=0.55, zone=CREST, bone="head", plate=CROWN_PLATES[0], hard=1.0))
    w.add(AnglePlate(head_c + z(-0.85, -0.15, 0.62), frame(normalize(v3((-1, -0.2, 0.55))), normalize(v3((0.4, 0, 1)))), 0.7, 0.2,
                     0.16, keel=0.3, rake=0.8, taper=0.4, lift=0.3, zone=CREST, bone="head", plate=CROWN_PLATES[1]))
    # the lit maw at the front of the wedge: the brightest thing on the body
    w.add(Ellipsoid(head_c + z(0.8, 0.0, 0.45), (0.42, 0.78, 0.2 * a), frame((1, 0.18, 0.75)), zone=ORGAN, bone="head"))
    for s_ in (-1, 1):
        w.add(Ellipsoid(head_c + z(0.72, 0.36 * s_, 0.0), (0.12, 0.12, 0.12 * a), zone=EYE, bone="head"))
        w.extend(A.hook([head_c + z(0.55, 0.3 * s_, -0.35), head_c + z(0.85, 0.36 * s_, -0.55), head_c + z(1.0, 0.3 * s_, -0.8),
                         head_c + z(1.05, 0.2 * s_, -0.98)], 0.12, 0.03, "jaw", k=0.05, tip=0.4))
    # --- chest keel and forelimbs (CREATURE29) -----------------------------------------------------------------
    # a dark keeled plate down the front of the chest breaks the pale underbody; two massive forelimbs (shoulder,
    # a clear elbow standing out and back, a forearm down to a three-clawed foot planted wide of the body)
    w.add(AnglePlate(z(1.35, -0.25, 2.55), frame(normalize(v3((-0.3, 0, -1))), normalize(v3((1, 0, -0.15)))), 0.95, 0.8, 0.26,
                     keel=0.45, rake=0.6, taper=0.7, lift=0.1, zone=ARMOR, bone="chest", plate=409, hard=1.0))
    for s_, side in ((-1, "r"), (1, "l")):
        big = 1.15 if s_ < 0 else 1.0
        sh = sk.h(f"shoulder.{side}")
        elbow = z(0.35, 2.45 * s_, 2.7)
        wrist = z(1.45, 2.45 * s_, 0.7)
        pad = z(1.7, 2.5 * s_, 0.2)
        w.add(Ellipsoid(sh + v3((0.1, 0.35 * s_, 0)), (0.7 * big,) * 3, zone=MEMBRANE, bone=f"shoulder.{side}", k=0.15))
        w.add(S.Prism(sh + v3((0.1, 0.35 * s_, 0)), elbow, 0.72 * big, 0.5 * big, sides=4, zone=SHELL, bone=f"shoulder.{side}",
                      k=0.1, hard=1.0))
        w.add(Ellipsoid(elbow, (0.5 * big,) * 3, zone=ARMOR, bone=("blend", f"shoulder.{side}", f"forearm.{side}", sh, wrist), k=0.06))
        w.add(S.Prism(elbow, wrist, 0.52 * big, 0.42 * big, sides=4, zone=SHELL, bone=f"forearm.{side}", k=0.08, hard=1.0))
        w.add(S.Prism(wrist, pad + z(0.35, 0.1 * s_, 0.05), 0.5 * big, 0.42 * big, sides=4, squash=0.7, zone=SHELL,
                      bone=f"claw.{side}", k=0.08, hard=1.0))
        for i in (-1, 0, 1):   # three big pale claws
            t = normalize(v3((1.0, 0.45 * i + 0.25 * s_, 0)))
            base = pad + t * 0.45 * big + v3((0, 0, 0.12))
            w.add(S.Prism(base, base + t * 0.8 * big * (1 - 0.15 * abs(i)) - v3((0, 0, 0.12)), 0.26 * big, 0.03, sides=3,
                          roll=math.pi / 2, squash=0.7, zone=TOOTH, bone=f"claw.{side}", k=0.04, hard=1.0))
    # --- legs (CREATURE29): heavy hind legs with a visible knee; the middle pair tucked under the waist -----------
    import brute as B
    for leg in ("front", "back"):
        for s, side in ((-1, "r"), (1, "l")):
            hip, knee, foot = sk.h(f"leg.{leg}.{side}"), sk.h(f"foot.{leg}.{side}"), sk.end(f"foot.{leg}.{side}")
            if leg == "back":
                w.extend(B.hard_leg(hip, knee, foot, 1.15, 0.78, 0.48, f"leg.{leg}.{side}", f"foot.{leg}.{side}", forward=0.2,
                                    claw_len=1.0))
            else:
                w.add(S.Prism(hip, knee, 0.55, 0.4, sides=4, zone=SHELL, bone=f"leg.{leg}.{side}", k=0.1, hard=1.0))
    return w
