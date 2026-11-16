"""Shared Lantern Brood anatomy: shingled mantle, lantern split, sinew-strung limbs.

Every function returns sdf primitives in design space. Castes compose them.
"""

from __future__ import annotations

import math
import numpy as np

import sdf as S
from sdf import (SHELL, MEMBRANE, SINEW, CLAW, ORGAN, EYE, CREST, TOOTH, CAVITY, UNDER, ARMOR, FLESH,
                 Ellipsoid, RoundCone, Plate, Tube, Torus, Displace, Stretch, bezier, frame, normalize, v3)


def lerp(a, b, t):
    return v3(a) + (v3(b) - v3(a)) * t


def ellipsoid_surface(c, r, R, u, phi):
    """Point/normal on an ellipsoid; u in [-1,1] along local x, phi around x (0 = up)."""
    c, r = v3(c), v3(r)
    R = np.eye(3, dtype=np.float32) if R is None else np.asarray(R, np.float32)
    s = math.sqrt(max(0.0, 1 - u * u))
    q = np.array([u * r[0], -math.sin(phi) * s * r[1], math.cos(phi) * s * r[2]], np.float32)
    n = normalize(q / (r * r))
    return c + R @ q, normalize(R @ n)


def mass(c, r, R=None, bone=None, zone=SHELL, k=0.0, lump=0.0, freq=6.0, seed=0, **kw):
    e = Ellipsoid(c, r, R, zone=zone, bone=bone, k=k, **kw)
    if lump <= 0:
        return e
    return Displace(e, lump, freq, seed, zone=zone, bone=bone, k=k, **kw)


def shingles(c, r, R, bone, rows, *, phis=(0.42,), u0=0.75, u1=-0.85, size=(0.26, 0.2, 0.08),
             thickness=0.04, lift=0.25, rings=0.008, tint=1.0, zone=SHELL, grow=0.0, seed=0, bone_fn=None,
             plate0=1, k=0.0):
    """Overlapping roof-tile plates over an ellipsoid mass, front plates on top.

    ``phis``: plate columns (radians from the dorsal line; mirrored if non-zero).
    ``grow``: relative size change from front to rear row.
    """
    out = []
    plate_id = plate0
    for i in range(rows):
        t = i / max(rows - 1, 1)
        u = u0 + (u1 - u0) * t
        scale = 1 + grow * t
        for phi0 in phis:
            for side in ((1, -1) if phi0 else (1,)):
                phi = phi0 * side
                p, n = ellipsoid_surface(c, r, R, u, phi)
                fwd = (np.eye(3, dtype=np.float32) if R is None else np.asarray(R, np.float32)) @ np.array([1, 0, 0], np.float32)
                fwd = normalize(fwd - n * float(fwd @ n))
                F = frame(fwd, n)
                sz = v3(size) * scale
                centre = p + n * (thickness * lift) - fwd * sz[0] * 0.15
                b = bone_fn(u) if bone_fn else bone
                out.append(Plate(centre, sz, F, thickness * scale, rings=rings, ring_count=4, lip=thickness * 0.25,
                                 chip=thickness * 0.35, seed=seed + plate_id, zone=zone, bone=b, tint=tint * (1 - 0.04 * i),
                                 plate=plate_id, k=k))
                plate_id += 1
    return out


def lantern(a, b, radius, bone, height=1.0, ribs=0.035, seed=0):
    """The exposed glowing organ in the dorsal split, ribbed, with wet membrane lips."""
    a, b = v3(a), v3(b)
    axis = normalize(b - a)
    c = (a + b) / 2
    length = float(np.linalg.norm(b - a)) / 2
    core = Ellipsoid(c, (length, radius, radius * height), frame(axis), zone=ORGAN, bone=bone)
    ribbed = Stretch(core, axis, ribs, radius * 0.18, sharp=3, zone=ORGAN, bone=bone)
    lips = []
    for side in (-1, 1):
        off = np.cross(axis, np.array([0, 0, 1], np.float32)) * side
        lips.append(Ellipsoid(c + normalize(off) * radius * 0.95 - np.array([0, 0, radius * 0.15], np.float32),
                              (length * 1.04, radius * 0.38, radius * 0.75 * height), frame(axis),
                              zone=SINEW, bone=bone, k=radius * 0.3))
    return [ribbed] + lips


def armour_segment(a, b, r0, r1, bone, side, *, tint=1.0, plate=0, outward=None, k=None):
    """A load-bearing limb segment: dark core tube with a pale armour plate on its outward face."""
    a, b = v3(a), v3(b)
    out = [RoundCone(a, b, r0, r1, zone=SHELL, bone=bone, k=(r0 * 0.35 if k is None else k), tint=tint * 0.8)]
    L = float(np.linalg.norm(b - a))
    if L < 1e-4:
        return out
    ax = normalize(b - a)
    o = normalize(v3(outward) if outward is not None else v3((0, side, 0.75)))
    o = normalize(o - ax * float(o @ ax))
    r = (r0 + r1) / 2
    out.append(Plate(lerp(a, b, 0.48) + o * r * 0.42, (L * 0.47, r * 1.6, r * 1.05), frame(ax, o), r * 0.55,
                     rings=r * 0.05, ring_count=3, lip=r * 0.16, chip=r * 0.08, zone=ARMOR, bone=bone, plate=plate, tint=tint))
    return out


def knuckle(p, r, first, second, a, b):
    """A visible joint: wet flesh sleeve under a pale knuckle ring."""
    p = v3(p)
    ax = normalize(v3(b) - v3(a))
    blend = ("blend", first, second, a, b)
    return [Ellipsoid(p, (r * 1.02,) * 3, zone=FLESH, bone=blend, k=r * 0.35),
            Torus(p, ax, r * 0.88, r * 0.3, zone=ARMOR, bone=blend, k=r * 0.2)]


def foot(p, direction, r, bone, toes=3):
    """Planted foot: a flattened pad and short splayed claws on the floor plane."""
    p = v3(p)
    d = v3(direction)
    d[2] = 0
    d = normalize(d if float(np.linalg.norm(d)) > 1e-4 else v3((1, 0, 0)))
    side = normalize(np.cross(np.array([0, 0, 1], np.float32), d))
    c = p + np.array([0, 0, r * 0.55], np.float32)
    out = [Ellipsoid(c, (r * 1.5, r * 1.3, r * 0.7), frame(d), zone=SHELL, bone=bone, k=r * 0.5, tint=0.85)]
    for i in range(toes):
        ang = (i - (toes - 1) / 2) * 0.55
        t = normalize(d * math.cos(ang) + side * math.sin(ang))
        out.append(RoundCone(c + t * r * 0.9, p + t * r * 1.8 + np.array([0, 0, r * 0.1], np.float32), r * 0.42, r * 0.12,
                             zone=CLAW, bone=bone, k=r * 0.25))
    return out


def limb(hip, knee, foot_at, r_hip, r_knee, r_foot, upper, lower, *, tip=0.22, spurs=0, tendon=True, cuff=True,
         claw_zone=CLAW, seed=0, bend=0.0, plate_upper=True, tint=1.0, planted=True):
    """Armoured chitin limb: thick plated thigh, knuckle joint, plated shin, planted foot, tendon."""
    hip, knee, foot_at = v3(hip), v3(knee), v3(foot_at)
    side = 1.0 if float((knee - hip)[1]) >= 0 else -1.0
    out = []
    mid = lerp(hip, knee, 0.5) + np.array([0, 0, bend], np.float32)
    out += armour_segment(hip, mid, r_hip, r_knee * 1.3, upper, side, tint=tint, plate=90 + seed)
    out += armour_segment(mid, knee, r_knee * 1.3, r_knee, upper, side, tint=tint, plate=91 + seed)
    if cuff:
        out += knuckle(knee, r_knee * 0.95, upper, lower, hip, foot_at)
    shin = normalize(foot_at - knee)
    if planted:
        end = lerp(foot_at, knee, 0.12)
        out += armour_segment(knee, end, r_knee * 0.95, r_foot * 1.8, lower, side, tint=tint * 0.95, plate=92 + seed)
        out += foot(foot_at, shin, r_foot * 1.6, lower)
    else:
        tip_at = lerp(foot_at, knee, tip)
        out += armour_segment(knee, tip_at, r_knee * 0.95, r_foot * 1.6, lower, side, tint=tint * 0.95, plate=92 + seed)
        out.append(RoundCone(tip_at, foot_at, r_foot * 1.6, r_foot * 0.35, zone=claw_zone, bone=lower, k=r_foot * 0.8))
    if tendon:
        sidev = normalize(np.cross(shin, np.array([0, 0, 1], np.float32)))
        back = normalize(np.cross(sidev, shin))
        under = -back
        a = lerp(hip, knee, 0.55) - normalize(np.cross(normalize(knee - hip), sidev)) * r_knee * 0.6
        b = lerp(knee, foot_at, 0.28) + under * r_knee * 0.7
        m = knee + under * r_knee * 1.25
        out.append(Tube([a, m, b], [r_knee * 0.26, r_knee * 0.3, r_knee * 0.24], zone=SINEW,
                        bone=("blend", upper, lower, a, b), k=r_knee * 0.2))
    return out


def hook(points, r0, r1, bone, zone=CLAW, tip_zone=TOOTH, k=0.0, n=8, tip=0.3):
    """Curved hook/blade from a bezier; pale tip."""
    pts = bezier(*points, n)
    radii = [r0 + (r1 - r0) * (i / n) ** 0.8 for i in range(n + 1)]
    cut = int(round(n * (1 - tip)))
    out = [Tube(pts[:cut + 1], radii[:cut + 1], zone=zone, bone=bone, k=k)]
    out.append(Tube(pts[cut:], radii[cut:], zone=tip_zone, bone=bone, k=r0 * 0.15))
    return out


def eyes(centre, forward, side_span, count, radius, bone, spread=0.6):
    """Rows of small glowing eye pits on both sides of a prow."""
    c, fwd = v3(centre), normalize(forward)
    side = normalize(np.cross(np.array([0, 0, 1], np.float32), fwd))
    out = []
    for s in (-1, 1):
        for i in range(count):
            p = c + side * s * (side_span * (0.55 + 0.45 * i / max(count - 1, 1))) - fwd * radius * 2.4 * i * spread
            out.append(Ellipsoid(p + np.array([0, 0, radius * 0.4 * i], np.float32), (radius,) * 3, zone=EYE, bone=bone))
    return out


def crest_spines(base_points, normals, length, radius, bone_fn, sweep, zone=CREST, plate=200):
    """Backswept bone-pale spines along the dorsal ridge (elite rank)."""
    out = []
    for i, (p, n) in enumerate(zip(base_points, normals)):
        p, n = v3(p), normalize(n)
        L = length * (1 - 0.18 * abs(i - len(base_points) / 2) / max(len(base_points) / 2, 1))
        pts = bezier(p - n * radius, p + n * L * 0.45, p + n * L * 0.85 + v3(sweep) * L * 0.35, p + n * L + v3(sweep) * L * 0.75, 6)
        out.append(Tube(pts, [radius * (1 - j / 6.3) for j in range(7)], zone=zone, bone=bone_fn(p), plate=plate + i))
    return out


def blade(root, tip, edge_dir, width, thick, bone, *, hook=0.35, n=9, serrations=4, zone=CLAW, edge_zone=TOOTH):
    """Curved crescent blade: flattened segments along a hooked bezier, pale cutting edge."""
    root, tip, e = v3(root), v3(tip), normalize(edge_dir)
    L = float(np.linalg.norm(tip - root))
    shaft = normalize(tip - root)
    e = normalize(e - shaft * float(e @ shaft))
    pts = bezier(root, root + shaft * L * 0.4 - e * L * 0.05, tip - shaft * L * 0.25 - e * L * hook * 0.2,
                 tip + e * L * hook * 0.45, n)
    out = []
    for i in range(n):
        a, b = pts[i], pts[i + 1]
        t = (i + 0.5) / n
        tang = normalize(b - a)
        ed = normalize(e - tang * float(e @ tang))
        w = width * (0.45 + 0.75 * math.sin(math.pi * min(1.0, t * 0.9 + 0.12))) * (1 - 0.55 * t * t)
        seg = float(np.linalg.norm(b - a))
        Fr = frame(tang, ed)
        c = (a + b) / 2 + ed * w * 0.15
        out.append(Ellipsoid(c, (seg * 0.75, thick * (1 - 0.5 * t), w), Fr, zone=zone, bone=bone, k=thick * 0.8))
        out.append(Ellipsoid(c + ed * w * 0.78, (seg * 0.72, thick * 0.45 * (1 - 0.5 * t), w * 0.32), Fr,
                             zone=edge_zone, bone=bone, k=thick * 0.4))
    for s in range(serrations):
        t = 0.25 + 0.5 * s / max(serrations - 1, 1)
        i = int(t * n)
        a, b = pts[i], pts[i + 1]
        tang = normalize(b - a)
        ed = normalize(e - tang * float(e @ tang))
        base = (a + b) / 2 + ed * width * 0.75
        out.append(RoundCone(base, base + ed * width * 0.55 - tang * width * 0.45, thick * 0.6, thick * 0.08,
                             zone=edge_zone, bone=bone, k=thick * 0.3))
    return out
