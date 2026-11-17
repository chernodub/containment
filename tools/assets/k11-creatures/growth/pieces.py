"""Brood growth kit: organic set pieces in the Lantern Brood anatomy (metres, Blender Z-up).

Convention: origin at the bottom centre; the camera-facing front is Blender -Y
(glTF +Z). Wall-backed pieces put their wall plane at +Y = depth/2. Each
function returns (sculpture, budget_triangles, meta).
"""

import math
import numpy as np

import sdf as S
from sdf import SHELL, MEMBRANE, SINEW, ORGAN, EYE, CREST, TOOTH, CAVITY, UNDER, ARMOR, FLESH, \
    Ellipsoid, RoundCone, Plate, Tube, Torus, Box, Displace, Stretch, bezier, frame, normalize, v3
import species as A

POD = EYE   # pods glow dimly: reuse the eye zone as the pod-glow finish


def mound(c, r, R=None, zone=FLESH, lump=0.06, freq=1.6, seed=0, k=0.0):
    return Displace(Ellipsoid(c, r, R), lump, freq, seed, zone=zone, k=k)


def shell_ribs(s, centre, radii, count, span=(-0.75, 0.75), phis=(0.35, 0.9), size=1.0, seed=0, R=None):
    """Shingled shell plates over a mound (the Brood's mantle grown as architecture)."""
    s.extend(A.shingles(centre, radii, R, None, rows=count, phis=phis, u0=span[1], u1=span[0],
                        size=tuple(v * size for v in (0.55, 0.5, 0.22)), thickness=0.12 * size, lift=0.35,
                        rings=0.012 * size, seed=seed, bone_fn=lambda u: None, plate0=1 + seed))


def lantern_cluster(s, centre, radius, n=3, seed=0):
    rng = np.random.default_rng(seed)
    for i in range(n):
        off = v3(rng.normal(size=3)) * radius * 0.6
        off[2] = abs(off[2]) * 0.4
        c = v3(centre) + off
        r = radius * (0.55 + 0.35 * rng.random())
        core = Ellipsoid(c, (r * 1.2, r, r), frame(normalize(v3(rng.normal(size=3)))), zone=ORGAN)
        s.add(Stretch(core, normalize(v3(rng.normal(size=3))), r * 0.45, r * 0.12, sharp=3, zone=ORGAN))
        s.add(Torus(c - v3((0, 0, r * 0.35)), (0, 0, 1), r * 0.95, r * 0.28, zone=SINEW, k=r * 0.3))


def brood_opening(s, p, n, r):
    """Lipped hole into the mass with a dim glow deep inside."""
    p, n = v3(p), normalize(n)
    s.add(Ellipsoid(p, (r, r, r), op="sub", zone=CAVITY, k=r * 0.35))
    s.add(Torus(p - n * r * 0.15, n, r * 0.95, r * 0.32, zone=SINEW, k=r * 0.3))
    s.add(Ellipsoid(p - n * r * 0.95, (r * 0.55,) * 3, zone=POD))


def strands(s, a, b, count, radius, sag=0.15, spread=0.15, seed=0, zone=SINEW):
    rng = np.random.default_rng(seed)
    a, b = v3(a), v3(b)
    for i in range(count):
        ja = v3(rng.normal(size=3)) * spread
        jb = v3(rng.normal(size=3)) * spread
        p0, p3 = a + ja, b + jb
        mid = (p0 + p3) / 2 - v3((0, 0, sag * float(np.linalg.norm(p3 - p0)) * (0.6 + 0.8 * rng.random())))
        pts = bezier(p0, p0 + (mid - p0) * 0.9, p3 + (mid - p3) * 0.9, p3, 7)
        r = radius * (0.6 + 0.8 * rng.random())
        s.add(Tube(pts, [r * (1.3 - 0.5 * math.sin(math.pi * j / 7)) for j in range(8)], zone=zone, k=r * 0.5))


def membrane_sheet(s, a, b, c, thick, zone=MEMBRANE, holes=3, seed=0):
    """A torn wet membrane spanning triangle a-b-c (thin flattened ellipsoids, ripped holes)."""
    a, b, c = v3(a), v3(b), v3(c)
    centre = (a + b + c) / 3
    n = normalize(np.cross(b - a, c - a))
    u = normalize(b - a)
    w = np.cross(n, u)
    ru = float(np.linalg.norm(b - a)) * 0.48
    rw = float(np.linalg.norm(c - (a + b) / 2)) * 0.55
    s.add(Displace(Ellipsoid(centre, (ru, rw, thick), np.stack([u, w, n], axis=1)), thick * 0.6, 3.0 / max(ru, 0.1), seed, zone=zone))
    rng = np.random.default_rng(seed)
    for i in range(holes):
        p = centre + u * ru * rng.uniform(-0.6, 0.6) + w * rw * rng.uniform(-0.6, 0.6)
        r = min(ru, rw) * rng.uniform(0.12, 0.25)
        s.add(Ellipsoid(p, (r * 1.4, r, thick * 6), np.stack([u, w, n], axis=1), op="sub", zone=CAVITY, k=thick))


def pod(s, c, r, axis=(0, 0, 1), burst=False, seed=0):
    """Egg in a flesh cup with veins; burst variant is torn open with curled lips."""
    c, ax = v3(c), normalize(axis)
    c = c + ax * r * 0.25
    body = Ellipsoid(c, (r * 1.35, r * 0.85, r * 0.85), frame(ax), zone=POD)
    s.add(Ellipsoid(c - ax * r * 0.75, (r * 0.6, r * 0.95, r * 0.95), frame(ax), zone=FLESH, k=r * 0.35))
    rng = np.random.default_rng(seed)
    if not burst:
        s.add(body)
        for i in range(3):
            ang = rng.uniform(0, 2 * math.pi)
            d = normalize(v3((math.cos(ang), math.sin(ang), 0)) - ax * 0.0)
            p0 = c - ax * r * 0.7 + d * r * 0.8
            s.add(Tube(bezier(p0, p0 + ax * r * 0.5 + d * r * 0.1, c + ax * r * 0.5 + d * r * 0.72, c + ax * r * 1.0 + d * r * 0.35, 5),
                       [r * 0.08, r * 0.075, r * 0.065, r * 0.05, r * 0.035, r * 0.02], zone=SINEW, k=r * 0.05))
        return
    s.add(body)
    s.add(Ellipsoid(c + ax * r * 0.75, (r * 0.9, r * 0.75, r * 0.75), frame(ax), op="sub", zone=CAVITY, k=r * 0.1))
    s.add(Ellipsoid(c, (r * 1.15, r * 0.68, r * 0.68), frame(ax), op="sub", zone=CAVITY, k=r * 0.05))
    for i in range(5):   # torn lips curling outward
        ang = i * 2 * math.pi / 5 + rng.uniform(-0.3, 0.3)
        d = v3((math.cos(ang), math.sin(ang), 0))
        p0 = c + ax * r * 0.45 + d * r * 0.75
        s.add(Tube(bezier(p0, p0 + ax * r * 0.4, p0 + ax * r * 0.6 + d * r * 0.35, p0 + ax * r * 0.45 + d * r * 0.7, 5),
                   [r * 0.13, r * 0.11, r * 0.09, r * 0.06, r * 0.035, r * 0.015], zone=FLESH, k=r * 0.08))


def slabs(s, centre, radii, count, seed=0, size=1.0, R=None, phi_max=1.25):
    """Few heavy shell slabs lying overlapped on a mass (not scalloped shingles)."""
    rng = np.random.default_rng(seed)
    for i in range(count):
        u = rng.uniform(-0.65, 0.7)
        phi = rng.uniform(-phi_max, phi_max)
        p, n = A.ellipsoid_surface(centre, radii, R, u, phi)
        fwd = normalize(v3((rng.normal(), rng.normal(), 0)) - n * 0.0)
        fwd = normalize(fwd - n * float(fwd @ n))
        sz = v3((rng.uniform(0.75, 1.15), rng.uniform(0.6, 0.95), 0.32)) * size
        s.add(Plate(p + n * 0.06 * size, sz, frame(fwd, n), 0.18 * size, rings=0.012 * size, ring_count=4, lip=0.05 * size,
                    chip=0.05 * size, seed=seed + i, zone=SHELL, plate=1 + i + seed))


def outflow(s, centre, count, reach, height, seed=0, bias=None):
    """Irregular low flesh lobes spilling from a mass across the floor (never radial-even)."""
    rng = np.random.default_rng(seed)
    c = v3(centre)
    for i in range(count):
        ang = rng.uniform(0, 2 * math.pi) if bias is None else bias + rng.normal() * 0.9
        L = reach * rng.uniform(0.45, 1.0)
        d = v3((math.cos(ang), math.sin(ang), 0))
        p = c + d * L * 0.55
        side = v3((-d[1], d[0], 0))
        s.add(Displace(Ellipsoid(p + side * rng.normal() * L * 0.12, (L * 0.55, L * rng.uniform(0.18, 0.32), height * rng.uniform(0.5, 1.0)),
                                 frame(d)), height * 0.4, 2.5 / max(L, 0.3), seed + i, zone=FLESH, k=height * 2.2))


def wall_climb(s, x0, x1, wall_y, top, seed=0):
    """Flesh sheet and veins crawling up a wall plane (consumes the architecture behind)."""
    rng = np.random.default_rng(seed)
    for i in range(6):
        x = rng.uniform(x0, x1)
        h = rng.uniform(0.5, 1.0) * top
        s.add(Displace(Ellipsoid((x, wall_y - 0.05, h * 0.5), (rng.uniform(0.35, 0.7), 0.1, h * 0.55)), 0.04, 3.0, seed + i,
                       zone=FLESH, k=0.25))
        a = v3((x, wall_y - 0.1, h * 0.3))
        b = v3((x + rng.normal() * 0.4, wall_y - 0.08, h * 1.05))
        s.add(Tube(bezier(a, a + v3((0.15, -0.05, 0.3)), b - v3((0.1, 0, 0.3)), b, 6), [0.07, 0.07, 0.06, 0.05, 0.04, 0.03, 0.02],
                   zone=SINEW, k=0.05))


# ------------------------------------------------------------------ pieces
def nest_large():
    s = S.Sculpture("brood-nest-large")
    W, D, H = 4.6, 2.6, 2.3
    back = D / 2
    s.add(mound((0, back * 0.25, 0.0), (W / 2, D * 0.62, H), zone=FLESH, lump=0.12, freq=1.1, seed=3))
    s.add(mound((-1.2, back * 0.4, 0.4), (1.3, 1.1, 1.5), zone=FLESH, lump=0.1, seed=4, k=0.4))
    s.add(mound((1.35, back * 0.5, 0.2), (1.1, 1.0, 1.2), zone=FLESH, lump=0.1, seed=5, k=0.4))
    slabs(s, (0, back * 0.25, 0.0), v3((W / 2, D * 0.62, H)), 7, seed=0, size=1.25, R=frame((0, 1, 0), (0, 0, 1)))
    # ribs rise from the deck, arch over the mass and bury their tips in it (no free spikes)
    for i, x in enumerate((-1.75, -0.7, 0.55, 1.6)):
        foot = v3((x * 1.08, -D * 0.42, 0.0))
        bury = v3((x * 0.55, back * 0.55, H * (0.7 + 0.08 * (i % 2))))
        apex = v3((x * 0.9, -D * 0.1, H * 1.05))
        s.add(Tube(bezier(foot, foot + v3((0, -0.1, H * 0.55)), apex, bury, 9),
                   [0.24, 0.26, 0.26, 0.24, 0.22, 0.2, 0.19, 0.18, 0.17, 0.17], zone=ARMOR, k=0.14))
    wall_climb(s, -W * 0.45, W * 0.45, back, 3.3, seed=13)
    outflow(s, (0, -D * 0.2, 0), 5, 2.2, 0.12, seed=14, bias=-math.pi / 2)
    # lantern cluster in a split near the crown, brood openings low on the front
    s.add(Ellipsoid((0.15, 0.1, H * 0.78), (0.9, 0.55, 0.45), op="sub", zone=CAVITY, k=0.25))
    lantern_cluster(s, (0.15, 0.15, H * 0.72), 0.4, n=3, seed=2)
    brood_opening(s, (-0.95, -D * 0.38, 0.55), (0, -1, 0.25), 0.42)
    brood_opening(s, (1.05, -D * 0.3, 0.42), (0.2, -1, 0.2), 0.32)
    strands(s, (-1.6, -D * 0.2, 1.2), (-0.4, 0.3, 2.0), 3, 0.035, seed=7)
    strands(s, (1.4, -D * 0.1, 1.1), (0.5, 0.4, 1.9), 2, 0.035, seed=8)
    s.add(Box((0, back + 2.0, H), (W * 2, 2.0, H * 2), op="sub", zone=CAVITY))   # flat wall-side back
    return s, 6000, {"size": [W, D, H], "anchor": "wall-backed: back plane at +Z=-depth/2 in glTF (Blender +Y)",
                     "placement": "against a wall or into a corner, front toward the room; 1 per room max, off the fight floor"}


def nest_medium():
    s = S.Sculpture("brood-nest-medium")
    W, D, H = 2.1, 1.3, 1.25
    s.add(mound((0, 0.2, 0), (W / 2, D * 0.65, H), zone=FLESH, lump=0.06, freq=2.0, seed=11))
    slabs(s, (0, 0.2, 0), v3((W / 2, D * 0.65, H)), 4, seed=10, size=0.65, R=frame((0, 1, 0), (0, 0, 1)))
    wall_climb(s, -W * 0.4, W * 0.4, D / 2, 1.8, seed=15)
    outflow(s, (0, -D * 0.1, 0), 3, 1.0, 0.07, seed=16, bias=-math.pi / 2)
    lantern_cluster(s, (0.0, 0.05, H * 0.82), 0.22, n=2, seed=12)
    brood_opening(s, (0.45, -D * 0.38, 0.35), (0.3, -1, 0.2), 0.22)
    s.add(Box((0, D / 2 + 2.0, H), (W * 2, 2.0, H * 2), op="sub", zone=CAVITY))
    return s, 2000, {"size": [W, D, H], "anchor": "wall-backed, bottom-centred", "placement": "wall foot, beside equipment"}


def creep(name, seed, size, wall=False):
    """Flat resin crust with ragged organic edges; low relief, low contrast."""
    s = S.Sculpture(name)
    rng = np.random.default_rng(seed)
    L, Wd = size
    for i in range(9):
        cx, cy = rng.uniform(-L * 0.35, L * 0.35), rng.uniform(-Wd * 0.35, Wd * 0.35)
        rx, ry = rng.uniform(0.25, 0.5) * L, rng.uniform(0.25, 0.5) * Wd
        e = Ellipsoid((cx, cy, -0.02), (rx, ry, 0.075), frame((math.cos(i), math.sin(i), 0)), zone=UNDER)
        s.add(Displace(e, 0.025, 3.5, seed + i, zone=UNDER, k=0.12))
    for i in range(5):   # raised veins and a few shell scales
        a = v3((rng.uniform(-L * 0.4, L * 0.4), rng.uniform(-Wd * 0.4, Wd * 0.4), 0.03))
        b = a + v3((rng.normal() * L * 0.25, rng.normal() * Wd * 0.25, 0))
        s.add(Tube(bezier(a, a + (b - a) * 0.3 + v3((0.05, 0.05, 0.03)), b - (b - a) * 0.3, b, 5), [0.03, 0.035, 0.03, 0.025, 0.02, 0.012], zone=SINEW, k=0.03))
    for i in range(4):
        p = v3((rng.uniform(-L * 0.3, L * 0.3), rng.uniform(-Wd * 0.3, Wd * 0.3), 0.02))
        s.add(Plate(p, (0.2, 0.16, 0.05), frame((math.cos(i * 2), math.sin(i * 2), 0.15)), 0.035, rings=0.004, chip=0.008,
                    zone=SHELL, plate=40 + i, k=0.02))
    s.add(Box((0, 0, -0.5), (L, Wd, 0.5), op="sub", zone=UNDER))   # flat underside at z=0
    meta = {"size": [L, Wd, 0.08], "anchor": "floor decal: underside at y=0, 2–8 cm relief, walkable",
            "placement": "overlap panel seams and the feet of equipment/walls; rotate/mirror freely"}
    if wall:
        meta = {"size": [L, Wd, 0.08], "anchor": "wall crust: local underside is the wall plane; rotate -90° about X so it stands on a wall facing the room",
                "placement": "climb walls/equipment sides from floor creep up to ~2 m"}
    return s, 1200, meta


def web(name, span, seed):
    """Taut strands and a torn membrane between anchors at (0,0,0) and (span,0,0)."""
    s = S.Sculpture(name)
    a, b = v3((0, 0, 0)), v3((span, 0, 0))
    for p in (a, b):   # anchor pads glued to the surfaces
        s.add(mound(p, (0.22 * min(1.6, span / 2), 0.22, 0.14), zone=FLESH, lump=0.03, freq=6, seed=seed))
    strands(s, a + v3((0.05, 0, 0.02)), b - v3((0.05, 0, -0.02)), 3 + int(span), 0.045, sag=0.06, spread=0.08, seed=seed)
    if span > 1.0:
        membrane_sheet(s, a + v3((span * 0.15, 0, 0.05)), b - v3((span * 0.15, 0, -0.05)),
                       (a + b) / 2 - v3((0, 0, span * 0.3)), 0.03, holes=int(span), seed=seed)
    return s, 1500, {"floorCut": False, "size": [span, 0.4, 0.5], "anchor": "anchor A at origin, anchor B at +X=span (glTF +X); scale X to match the real gap",
                     "placement": "floor-to-wall, wall-to-wall or across a doorway top; rotate about the A→B axis to tilt the membrane"}


def pods(name, count, spread, burst=False, seed=0):
    s = S.Sculpture(name)
    rng = np.random.default_rng(seed)
    outflow(s, (0, 0, 0), 5, spread * 1.1, 0.09, seed=seed)
    placed = []
    for i in range(count * 4):
        if len(placed) >= count:
            break
        r = rng.uniform(0.16, 0.26) * (1.25 if i == 0 else 1)
        p = v3((rng.uniform(-spread, spread) * 0.55, rng.uniform(-spread, spread) * 0.5, 0))
        if any(float(np.linalg.norm(p[:2] - q[:2])) < (r + rq) * 0.95 for q, rq in placed):
            continue
        p[2] = r * 1.0
        tilt = normalize(v3((rng.normal() * 0.25, rng.normal() * 0.25, 1)))
        pod(s, p, r, tilt, burst=burst and i == 0, seed=seed + i)
        placed.append((p, r))
    strands(s, (-spread * 0.5, 0, 0.1), (spread * 0.5, 0, 0.15), 2, 0.02, sag=-0.1, spread=0.1, seed=seed)
    return s, 2000, {"size": [spread * 1.4, spread * 1.2, 0.6], "anchor": "floor, bottom-centred",
                     "placement": "in clutches at nest feet, corners and duct mouths; never in the open fight lane"}


def burst_duct():
    s = S.Sculpture("brood-burst-duct")
    # ruptured floor panel: torn frame plates bent upward around a hole full of growth
    for i, (x, y, ang) in enumerate(((0, -0.75, 0.0), (0.75, 0, 1.57), (0, 0.75, 3.14), (-0.75, 0, -1.57))):
        d = v3((math.cos(ang + 1.57), math.sin(ang + 1.57), 0))
        s.add(Box((x, y, 0.06 + 0.12 * (i % 2)), (0.78, 0.07, 0.04), frame(v3((math.cos(ang), math.sin(ang), 0)), v3((-d[0] * 0.5, -d[1] * 0.5, 1))),
                  round=0.01, zone=ARMOR))
    s.add(mound((0, 0, 0.0), (0.72, 0.72, 0.55), zone=FLESH, lump=0.07, freq=3, seed=21))
    outflow(s, (0, 0, 0), 6, 2.0, 0.12, seed=22, bias=-math.pi / 2)   # pours toward the room (front)
    slabs(s, (0, 0, 0), v3((0.72, 0.72, 0.55)), 3, seed=30, size=0.5)
    brood_opening(s, (0, 0, 0.55), (0, 0, 1), 0.35)
    lantern_cluster(s, (0.35, -0.3, 0.35), 0.14, n=2, seed=23)
    s.add(Box((0, 0, -0.5), (2.5, 2.5, 0.5), op="sub", zone=UNDER))
    return s, 2000, {"size": [2.4, 2.4, 0.7], "anchor": "floor, bottom-centred over a 1.6 m deck panel or vent",
                     "placement": "the swarm's entry: at a room edge or vent; combine with creep fanning away"}


def consumed_shell():
    """Drape for a console/crate-sized box (1.2 x 0.8 x 1.0 m, bottom-centred): hollow, open underneath."""
    s = S.Sculpture("brood-consumed-shell")
    bw, bd, bh = 0.6, 0.4, 1.0
    outer = Box((0, 0, bh / 2), (bw + 0.07, bd + 0.07, bh / 2 + 0.06), round=0.1, zone=FLESH)
    s.add(Displace(outer, 0.1, 2.2, 31, zone=FLESH))
    s.add(mound((0.2, 0.05, bh + 0.08), (0.6, 0.48, 0.28), zone=FLESH, lump=0.06, freq=3, seed=32, k=0.2))
    outflow(s, (0, 0, 0), 5, 1.3, 0.12, seed=35)          # the drape slumps onto the deck
    slabs(s, (0, 0, bh * 0.6), v3((bw + 0.12, bd + 0.12, bh * 0.55)), 3, seed=33, size=0.45)
    lantern_cluster(s, (-0.25, -0.15, bh + 0.15), 0.13, n=1, seed=34)
    strands(s, (bw + 0.05, -bd, bh * 0.9), (bw + 0.6, -bd - 0.3, 0.05), 2, 0.03, sag=-0.05, spread=0.05, seed=36)
    for p, n in (((bw + 0.07, -0.1, 0.55), (1, 0, 0)), ((-0.15, -bd - 0.07, 0.6), (0, -1, 0))):   # tears showing the machine
        s.add(Ellipsoid(p, (0.16, 0.16, 0.2) if n[0] else (0.2, 0.16, 0.16), op="sub", zone=CAVITY, k=0.05))
        s.add(Torus(v3(p) - v3(n) * 0.03, n, 0.17, 0.045, zone=SINEW, k=0.04))
    s.add(Box((0, 0, bh / 2 - 0.02), (bw, bd, bh / 2), op="sub", zone=CAVITY))   # the swallowed box
    s.add(Box((0, 0, -0.5), (2, 2, 0.5), op="sub", zone=UNDER))
    return s, 2000, {"size": [1.45, 1.05, 1.3], "anchor": "bottom-centred; inner cavity fits a 1.2 x 0.8 x 1.0 m box (scale to the prop's bounds)",
                     "placement": "over an existing console/crate: place at the prop origin, non-uniform scale to its bounds"}


def hive_heart():
    s = S.Sculpture("brood-hive-heart")
    H = 4.4
    # flesh base mound with roots
    s.add(mound((0, 0, 0), (1.9, 1.7, 0.75), zone=FLESH, lump=0.1, freq=1.6, seed=41))
    outflow(s, (0, 0, 0), 8, 3.0, 0.16, seed=42)
    slabs(s, (0, 0, 0), v3((1.9, 1.7, 0.75)), 5, seed=44, size=0.8, phi_max=1.4)
    # rib cage: armoured shell ribs arching from the base over the organ
    for i in range(6):
        ang = i * math.pi / 3 + 0.25
        d = v3((math.cos(ang), math.sin(ang), 0))
        base = d * 1.6
        pts = bezier(base, base * 1.25 + v3((0, 0, H * 0.45)), d * 0.9 + v3((0, 0, H * 0.95)), d * 0.25 + v3((0, 0, H * 1.02)), 10)
        s.add(Tube(pts, [0.26 - 0.017 * j for j in range(11)], zone=ARMOR, k=0.1))
        for t in (0.35, 0.6):   # shell scales riding the ribs
            j = int(t * 10)
            p = pts[j]
            s.add(Plate(p + d * 0.12, (0.32, 0.26, 0.12), frame(normalize(pts[j + 1] - pts[j]), d), 0.08, rings=0.008, chip=0.012,
                        zone=SHELL, plate=50 + i * 2 + int(t * 3)))
    # suspended lantern organ: ribbed, bulging, with sinew lips
    oc = v3((0, 0, H * 0.55))
    core = Ellipsoid(oc, (0.95, 0.95, 1.2), zone=ORGAN)
    s.add(Stretch(core, (0, 0, 1), 0.36, 0.08, sharp=3, zone=ORGAN))
    for z in (-0.75, 0.0, 0.75):
        s.add(Torus(oc + v3((0, 0, z)), (0, 0, 1), 0.98 - abs(z) * 0.35, 0.09, zone=SINEW, k=0.06))
    s.add(mound(oc + v3((0, 0, 1.15)), (0.55, 0.55, 0.35), zone=FLESH, lump=0.04, seed=48, k=0.25))
    # tendons holding the organ to the ribs, and to the floor
    for i in range(6):
        ang = i * math.pi / 3 + 0.25 + 0.5
        d = v3((math.cos(ang), math.sin(ang), 0))
        strands(s, oc + d * 0.85 + v3((0, 0, 0.4)), d * 1.45 + v3((0, 0, H * 0.75)), 2, 0.05, sag=0.05, spread=0.05, seed=60 + i)
        strands(s, oc + d * 0.7 - v3((0, 0, 0.9)), d * 1.2 + v3((0, 0, 0.5)), 1, 0.06, sag=-0.05, spread=0.03, seed=70 + i)
    # torn membranes between some ribs
    for i in (0, 2, 4):
        a0 = i * math.pi / 3 + 0.25
        a1 = a0 + math.pi / 3
        pa = v3((math.cos(a0), math.sin(a0), 0)) * 1.9 + v3((0, 0, H * 0.45))
        pb = v3((math.cos(a1), math.sin(a1), 0)) * 1.9 + v3((0, 0, H * 0.45))
        membrane_sheet(s, pa, pb, (pa + pb) / 2 * 0.85 + v3((0, 0, H * 0.3)), 0.03, holes=2, seed=80 + i)
    lantern_cluster(s, (1.1, -0.9, 0.55), 0.22, n=2, seed=90)
    lantern_cluster(s, (-1.2, 0.6, 0.5), 0.2, n=2, seed=91)
    return s, 12000, {"size": [5.2, 4.8, H + 0.4], "anchor": "floor, bottom-centred, free-standing (readable from all sides)",
                      "placement": "Swarm Junction landmark: room centre-back, outside the main fight lane; pulse brood-lantern"}


PIECES = {
    "brood-hive-heart": hive_heart,
    "brood-nest-large": nest_large,
    "brood-nest-medium": nest_medium,
    "brood-creep-a": lambda: creep("brood-creep-a", 1, (2.6, 1.6)),
    "brood-creep-b": lambda: creep("brood-creep-b", 2, (1.8, 1.8)),
    "brood-creep-c": lambda: creep("brood-creep-c", 3, (3.2, 1.0)),
    "brood-creep-wall": lambda: creep("brood-creep-wall", 4, (1.8, 1.4), wall=True),
    "brood-web-short": lambda: web("brood-web-short", 1.5, 5),
    "brood-web-medium": lambda: web("brood-web-medium", 3.0, 6),
    "brood-web-long": lambda: web("brood-web-long", 5.0, 7),
    "brood-pods-small": lambda: pods("brood-pods-small", 4, 0.9, seed=8),
    "brood-pods-large": lambda: pods("brood-pods-large", 11, 1.8, seed=9),
    "brood-pods-hatched": lambda: pods("brood-pods-hatched", 5, 1.1, burst=True, seed=10),
    "brood-burst-duct": burst_duct,
    "brood-consumed-shell": consumed_shell,
}


def brood_pod(hatching=False):
    """Matron brood pod: egg in a rooted flesh cup; the inner core (finish pod-core) glows through rib slits."""
    s = S.Sculpture("brood-pod-hatching" if hatching else "brood-pod")
    H = 0.95
    outflow(s, (0, 0, 0), 4, 0.75, 0.06, seed=101)
    s.add(mound((0, 0, 0.05), (0.42, 0.42, 0.28), zone=FLESH, lump=0.03, freq=6, seed=102))   # floor cup
    shell_c = v3((0, 0, H * 0.55))
    shell = Ellipsoid(shell_c, (0.34, 0.34, H * 0.48), zone=MEMBRANE)
    s.add(Stretch(shell, (0, 0, 1), 0.11, 0.012, sharp=2, zone=MEMBRANE))
    s.add(Ellipsoid(shell_c, (0.29, 0.29, H * 0.42), op="sub", zone=CAVITY))       # hollow egg
    for k in range(6):   # vertical slits between shell ribs reveal the core
        ang = k * math.pi / 3 + 0.3
        d = v3((math.cos(ang), math.sin(ang), 0))
        s.add(Ellipsoid(shell_c + d * 0.33 + v3((0, 0, 0.05)), (0.07, 0.085, H * 0.3), frame(d), op="sub", zone=CAVITY, k=0.015))
        s.add(Tube(bezier(shell_c + d * 0.33 - v3((0, 0, H * 0.4)), shell_c + d * 0.38 - v3((0, 0, 0.1)), shell_c + d * 0.37 + v3((0, 0, 0.15)),
                          shell_c + d * 0.2 + v3((0, 0, H * 0.45)), 5), [0.035, 0.04, 0.04, 0.035, 0.03, 0.02], zone=ARMOR, k=0.02))
    core = Ellipsoid(shell_c - v3((0, 0, 0.03)), (0.24, 0.24, H * 0.36), zone=ORGAN)
    s.add(Stretch(core, (0, 0, 1), 0.09, 0.02, sharp=3, zone=ORGAN))
    if hatching:
        # split crown: shell torn open at the top, core bulging out, petals curling back
        s.add(Ellipsoid(shell_c + v3((0, 0, H * 0.4)), (0.26, 0.24, 0.22), op="sub", zone=CAVITY, k=0.03))
        s.add(Ellipsoid(shell_c + v3((0, 0, H * 0.33)), (0.2, 0.2, 0.17), zone=ORGAN, k=0.04))
        for k in range(5):
            ang = k * 2 * math.pi / 5 + 0.4
            d = v3((math.cos(ang), math.sin(ang), 0))
            p0 = shell_c + d * 0.27 + v3((0, 0, H * 0.3))
            s.add(Tube(bezier(p0, p0 + v3((0, 0, 0.12)) + d * 0.04, p0 + d * 0.16 + v3((0, 0, 0.16)), p0 + d * 0.26 + v3((0, 0, 0.06)), 5),
                       [0.05, 0.045, 0.04, 0.03, 0.02, 0.01], zone=MEMBRANE, k=0.03))
    return s, 1500, {"size": [1.5, 1.5, H], "anchor": "floor, bottom-centred",
                     "placement": "spawned by the Carrier Matron; drive the pod-core finish emissive 0.3 -> 3.0 as the hatch countdown; swap to brood-pod-hatching for the final 0.5 s"}


POD_PIECES = {"brood-pod": lambda: brood_pod(False), "brood-pod-hatching": lambda: brood_pod(True)}
