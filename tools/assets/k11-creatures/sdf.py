"""Signed-distance sculpting kit for the K11 Lantern Brood (numpy only).

Creatures are described as an ordered list of primitives. Each primitive is
combined into the running field with a (smooth) union, subtraction or
intersection. The same description is evaluated twice:

* on a dense voxel grid, which OpenVDB turns into the high-detail surface;
* on mesh vertices, which tracks the winning primitive per point so colour
  zones, plate ids and skin weights come straight from the sculpture.

Coordinates are design space (Blender Z-up, +X towards the head). The build
script converts design space back to the retained skeleton's space.
"""

from __future__ import annotations

import math
import numpy as np

F = np.float32

# Material zones: flat readable value groups baked into the atlas.
SHELL, MEMBRANE, SINEW, CLAW, ORGAN, EYE, CREST, TOOTH, CAVITY, UNDER, ARMOR, FLESH, BONE = range(13)
ZONE_NAMES = ["shell", "membrane", "sinew", "claw", "organ", "eye", "crest", "tooth", "cavity", "under", "armor", "flesh", "bone"]


# ---------------------------------------------------------------- utilities
def v3(x):
    return np.asarray(x, dtype=F).reshape(3)


def normalize(v):
    v = np.asarray(v, dtype=F)
    return v / max(float(np.linalg.norm(v)), 1e-9)


def frame(forward, up=(0, 0, 1)):
    """Rotation matrix whose columns are local x (forward), y (side), z (up)."""
    x = normalize(forward)
    up = np.asarray(up, dtype=F)
    if abs(float(np.dot(x, normalize(up)))) > 0.98:
        up = np.array([0, 1, 0], dtype=F) if abs(x[1]) < 0.9 else np.array([1, 0, 0], dtype=F)
    y = normalize(np.cross(up, x))
    z = np.cross(x, y)
    return np.stack([x, y, z], axis=1).astype(F)


def rot(axis, angle):
    axis = normalize(axis)
    c, s = math.cos(angle), math.sin(angle)
    x, y, z = axis
    return np.array([
        [c + x * x * (1 - c), x * y * (1 - c) - z * s, x * z * (1 - c) + y * s],
        [y * x * (1 - c) + z * s, c + y * y * (1 - c), y * z * (1 - c) - x * s],
        [z * x * (1 - c) - y * s, z * y * (1 - c) + x * s, c + z * z * (1 - c)],
    ], dtype=F)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def smin(a, b, k):
    if k <= 0:
        return np.minimum(a, b)
    h = np.maximum(k - np.abs(a - b), 0.0) / k
    return np.minimum(a, b) - h * h * k * 0.25


def smax(a, b, k):
    return -smin(-a, -b, k)


# -------------------------------------------------------------------- noise
def _hash3(ix, iy, iz, seed):
    h = (ix * 374761393 + iy * 668265263 + iz * 2147483647 + seed * 144269) & 0xFFFFFFFF
    h = ((h ^ (h >> 13)) * 1274126177) & 0xFFFFFFFF
    h = h ^ (h >> 16)
    return (h & 0xFFFF).astype(F) / F(65535.0)


def vnoise(P, seed=0):
    """Trilinear value noise in [-1, 1]."""
    P = np.asarray(P, dtype=np.float64)
    i = np.floor(P).astype(np.int64)
    f = (P - i).astype(F)
    u = f * f * (3 - 2 * f)
    result = np.zeros(P.shape[0], dtype=F)
    for dx in (0, 1):
        wx = u[:, 0] if dx else 1 - u[:, 0]
        for dy in (0, 1):
            wy = u[:, 1] if dy else 1 - u[:, 1]
            for dz in (0, 1):
                wz = u[:, 2] if dz else 1 - u[:, 2]
                result += wx * wy * wz * _hash3(i[:, 0] + dx, i[:, 1] + dy, i[:, 2] + dz, seed)
    return result * 2 - 1


def fbm(P, octaves=3, seed=0):
    total = np.zeros(P.shape[0], dtype=F)
    amp, freq, norm = 1.0, 1.0, 0.0
    for octave in range(octaves):
        total += F(amp) * vnoise(P * freq, seed + octave * 17)
        norm += amp
        amp *= 0.5
        freq *= 2.03
    return total / F(norm)


def worley(P, seed=0):
    """Distance to the nearest jittered feature point (cell units) and its id."""
    P = np.asarray(P, dtype=np.float64)
    i = np.floor(P).astype(np.int64)
    best = np.full(P.shape[0], 9.0, dtype=F)
    ident = np.zeros(P.shape[0], dtype=F)
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            for dz in (-1, 0, 1):
                cx, cy, cz = i[:, 0] + dx, i[:, 1] + dy, i[:, 2] + dz
                jx = _hash3(cx, cy, cz, seed)
                jy = _hash3(cx, cy, cz, seed + 1)
                jz = _hash3(cx, cy, cz, seed + 2)
                d = np.sqrt((cx + jx - P[:, 0]) ** 2 + (cy + jy - P[:, 1]) ** 2 + (cz + jz - P[:, 2]) ** 2).astype(F)
                closer = d < best
                best = np.where(closer, d, best)
                ident = np.where(closer, _hash3(cx, cy, cz, seed + 3), ident)
    return best, ident


# --------------------------------------------------------------- primitives
class Prim:
    """One sculpting operation. Subclasses implement ``field(P)``."""

    op = "add"

    def __init__(self, *, op="add", k=0.0, zone=SHELL, bone=None, tint=1.0, plate=0, name="", bounds=None,
                 detail=1.0, hard=0.0):
        self.op, self.k, self.zone, self.bone = op, float(k), zone, bone
        self.hard = float(hard)   # CREATURE29: 1 = shade this primitive with its own facet normals, not the smoothed proxy
        self.tint, self.plate, self.name, self.detail = float(tint), int(plate), name, float(detail)
        self._bounds = bounds

    # Axis-aligned bounds of the shape itself, before blending margins.
    def bounds(self):
        return self._bounds

    def field(self, P):  # pragma: no cover - abstract
        raise NotImplementedError

    def bone_weights(self, P):
        """Return list of (bone, weight array) for points P."""
        spec = self.bone
        if spec is None:
            return []
        if isinstance(spec, str):
            return [(spec, np.ones(P.shape[0], dtype=F))]
        if spec[0] == "blend":
            _, first, second, a, b = spec
            a, b = v3(a), v3(b)
            ab = b - a
            t = np.clip(((P - a) @ ab) / max(float(ab @ ab), 1e-9), 0, 1)
            t = smoothstep(0.0, 1.0, t)
            return [(first, 1 - t), (second, t)]
        if spec[0] == "mix":
            return [(name, np.full(P.shape[0], weight, dtype=F)) for name, weight in spec[1]]
        raise ValueError(spec)


class RoundCone(Prim):
    def __init__(self, a, b, ra, rb, **kw):
        self.a, self.b, self.ra, self.rb = v3(a), v3(b), float(ra), float(rb)
        r = max(self.ra, self.rb)
        lo = np.minimum(self.a, self.b) - r
        hi = np.maximum(self.a, self.b) + r
        super().__init__(bounds=(lo, hi), **kw)

    def field(self, P):
        a, b, r1, r2 = self.a, self.b, self.ra, self.rb
        ba = b - a
        l2 = float(ba @ ba)
        if l2 < 1e-12:
            return np.linalg.norm(P - a, axis=1) - r1
        rr = r1 - r2
        a2 = l2 - rr * rr
        il2 = 1.0 / l2
        pa = P - a
        y = pa @ ba
        z = y - l2
        x = pa * l2 - y[:, None] * ba
        x2 = np.einsum("ij,ij->i", x, x)
        y2 = y * y * l2
        z2 = z * z * l2
        k = np.sign(rr) * rr * rr * x2
        out = np.empty(P.shape[0], dtype=F)
        c1 = np.sign(z) * a2 * z2 > k
        c2 = np.sign(y) * a2 * y2 < k
        c3 = ~(c1 | c2)
        out[c1] = np.sqrt(x2[c1] + z2[c1]) * il2 - r2
        out[c2] = np.sqrt(x2[c2] + y2[c2]) * il2 - r1
        out[c3] = (np.sqrt(x2[c3] * a2 * il2) + y[c3] * rr) * il2 - r1
        return out


class Ellipsoid(Prim):
    def __init__(self, c, radii, R=None, **kw):
        self.c, self.r = v3(c), v3(radii)
        self.R = np.eye(3, dtype=F) if R is None else np.asarray(R, dtype=F)
        ext = np.abs(self.R) @ self.r
        super().__init__(bounds=(self.c - ext, self.c + ext), **kw)

    def local(self, P):
        return (P - self.c) @ self.R

    def field(self, P):
        q = self.local(P)
        k0 = np.linalg.norm(q / self.r, axis=1)
        k1 = np.linalg.norm(q / (self.r * self.r), axis=1)
        return np.where(k0 < 1e-6, -min(self.r), k0 * (k0 - 1) / np.maximum(k1, 1e-9))


class Box(Prim):
    def __init__(self, c, half, R=None, round=0.0, **kw):
        self.c, self.h = v3(c), v3(half)
        self.R = np.eye(3, dtype=F) if R is None else np.asarray(R, dtype=F)
        self.round = float(round)
        ext = np.abs(self.R) @ (self.h + self.round)
        super().__init__(bounds=(self.c - ext, self.c + ext), **kw)

    def field(self, P):
        q = np.abs((P - self.c) @ self.R) - self.h
        outside = np.linalg.norm(np.maximum(q, 0), axis=1)
        inside = np.minimum(np.max(q, axis=1), 0)
        return outside + inside - self.round


class Carapace(Box):
    """Flat crown with clipped corners and a single sloping peripheral bevel."""
    def field(self, P):
        x, y, z = np.abs((P - self.c) @ self.R).T
        hx, hy, hz = self.h
        edge = np.maximum.reduce((x-hx, y-hy, (x-hx+y-hy+.34*min(hx,hy))*.7071))
        return np.maximum.reduce((edge, z-hz, (edge+z-hz+.72*hz)*.7071))


class ShellBand(Carapace):
    """HEAVY39: one grown armour band, a bent section of an ellipsoid shell (not a box).

    In the local frame R (x along the spine toward the head, y across, z out of the back) the outer face is the
    ellipsoid with radii ``radii`` whose crown is at ``c``; the band is ``thick`` deep, spans ``half`` along x
    either side of the crown and wraps down the flanks to ``drop`` below it. Every edge is rounded by ``bevel``.
    A Carapace subclass, so the exporter writes its analytic gradient into each face: the band shades across its
    curve and its bevels catch the rim. ``lip`` thickens the front edge so it overhangs the band in front of it.
    """
    def __init__(self, c, R, radii, half, drop, thick=.26, bevel=.08, lip=0.0, **kw):
        self.c, self.R = v3(c), np.asarray(R, dtype=F)
        self.rad, self.half, self.drop, self.t, self.bev, self.lip = v3(radii), float(half), float(drop), float(thick), float(bevel), float(lip)
        ext = np.abs(self.R) @ v3((half + thick, radii[1] + thick, max(drop, radii[2]) + thick))
        Prim.__init__(self, bounds=(self.c - ext, self.c + ext), **kw)
        self.h = v3((half, radii[1], drop))

    def field(self, P):
        q = (P - self.c) @ self.R
        e = q - v3((0, 0, -self.rad[2]))
        k0 = np.linalg.norm(e / self.rad, axis=1)
        k1 = np.linalg.norm(e / (self.rad * self.rad), axis=1)
        ell = np.where(k0 < 1e-6, -min(self.rad), k0 * (k0 - 1) / np.maximum(k1, 1e-9))
        t = self.t + self.lip * np.clip((q[:, 0] / self.half + .2) / 1.2, 0, 1) ** 2
        shell = np.abs(ell + t / 2) - (t / 2 - self.bev)
        cut_x = np.abs(q[:, 0]) - self.half + self.bev
        cut_z = -q[:, 2] - self.drop + self.bev
        stack = np.stack((shell, cut_x, cut_z), axis=1)
        outside = np.linalg.norm(np.maximum(stack, 0), axis=1)
        return outside + np.minimum(stack.max(axis=1), 0) - self.bev


class Torus(Prim):
    def __init__(self, c, axis, major, minor, **kw):
        self.c, self.major, self.minor = v3(c), float(major), float(minor)
        self.R = frame(axis)  # local x is the torus axis
        r = self.major + self.minor
        super().__init__(bounds=(self.c - r, self.c + r), **kw)

    def field(self, P):
        q = (P - self.c) @ self.R
        ring = np.sqrt(q[:, 1] ** 2 + q[:, 2] ** 2) - self.major
        return np.sqrt(ring ** 2 + q[:, 0] ** 2) - self.minor


class Plate(Prim):
    """A thick chitin shingle: a domed lens with rolled lip and growth rings.

    ``R`` columns are the plate's local forward (growth direction), side and
    outward normal. ``radii`` are the dome's half length/width/height. The
    plate is the shell between the outer dome and an inner dome sunk by
    ``thickness``; rings run parallel to the trailing (``-x``) edge.
    """

    def __init__(self, c, radii, R, thickness, rings=0.0, ring_count=4, lip=0.0, chip=0.0, seed=0, **kw):
        self.c, self.r = v3(c), v3(radii)
        self.R = np.asarray(R, dtype=F)
        self.t, self.rings, self.ring_count = float(thickness), float(rings), int(ring_count)
        self.lip, self.chip, self.seed = float(lip), float(chip), int(seed)
        ext = np.abs(self.R) @ (self.r + self.t)
        super().__init__(bounds=(self.c - ext, self.c + ext), **kw)

    def field(self, P):
        q = (P - self.c) @ self.R
        r = self.r

        def ell(q, r):
            k0 = np.linalg.norm(q / r, axis=1)
            k1 = np.linalg.norm(q / (r * r), axis=1)
            return k0 * (k0 - 1) / np.maximum(k1, 1e-9)

        outer = ell(q, r)
        inner_q = q.copy()
        inner_q[:, 2] += self.t
        inner = ell(inner_q, r * np.array([1.04, 1.06, 1.0], dtype=F))
        d = np.maximum(outer, -inner)
        # Keep the cap: discard the far side of the dome.
        d = np.maximum(d, -(q[:, 2] + r[2] * 0.35))
        # Normalised in-plane radius from a growth centre near the front lip.
        u = (q[:, 0] - r[0] * 0.55) / (r[0] * 1.55)
        w = q[:, 1] / r[1]
        rho = np.sqrt(u * u + w * w)
        top = smoothstep(-0.2 * r[2], 0.3 * r[2], q[:, 2])
        if self.rings > 0:
            phase = rho * self.ring_count
            ridge = np.abs(np.sin(phase * math.pi)) ** 6
            d -= self.rings * ridge * top * smoothstep(0.15, 0.45, rho)
        if self.lip > 0:
            # A rolled, slightly raised anterior rim.
            edge = smoothstep(0.75, 0.98, np.sqrt((q[:, 0] / r[0]) ** 2 + (q[:, 1] / r[1]) ** 2))
            front = smoothstep(-0.2, 0.6, q[:, 0] / r[0])
            d -= self.lip * edge * front * top
        if self.chip > 0:
            n = fbm(P * (6.0 / max(r[0], 1e-3)), 2, self.seed)
            rim = smoothstep(0.7, 1.0, np.sqrt((q[:, 0] / r[0]) ** 2 + (q[:, 1] / r[1]) ** 2))
            back = smoothstep(0.2, -0.5, q[:, 0] / r[0])
            d += self.chip * np.maximum(n, 0) * rim * back
        return d


class AnglePlate(Prim):
    """CREATURE20: a faceted armour plate with hard creases and a sharp trailing edge (convex, max of planes).

    ``R`` columns: forward (growth), side, outward normal. ``length``/``width`` are half sizes at the widest
    section, ``thick`` the flat base thickness, ``keel`` the extra ridge height along the centre line,
    ``rake`` how far past ``length`` the trailing point extends backward, ``taper`` the front width fraction and
    ``lift`` how much the trailing edge rises above the base plane (a raised, cutting back edge).
    The top is two keel facets plus a wedge facet that thins the plate to an edge at the back.
    """

    def __init__(self, c, R, length, width, thick, keel=0.0, rake=0.6, taper=0.55, lift=0.0, **kw):
        self.c = v3(c)
        self.R = np.asarray(R, dtype=F)
        self.L, self.W, self.T = float(length), float(width), float(thick)
        self.keel, self.rake, self.taper, self.lift = float(keel), float(rake), float(taper), float(lift)
        ext = np.abs(self.R) @ np.array([self.L * (1 + self.rake), self.W, self.T + self.keel + abs(self.lift)], dtype=F)
        super().__init__(bounds=(self.c - ext, self.c + ext), **kw)

    def field(self, P):
        q = (P - self.c) @ self.R
        x, y, z = q[:, 0], np.abs(q[:, 1]), q[:, 2]
        L, W, T, H = self.L, self.W, self.T, self.T * 0.5 + self.keel
        back = L * (1 + self.rake)
        # the base plane rises toward the trailing tip so the back edge lifts off the body
        lift = self.lift * np.clip(-x / back, 0, 1)
        zz = z - lift

        def plane(a, b, cz, off):   # a*x + b*|y| + cz*zz - off, normalised
            return (a * x + b * y + cz * zz - off) / math.sqrt(a * a + b * b + cz * cz)

        d = -zz - T * 0.5                                   # flat underside
        d = np.maximum(d, x - L)                            # front edge
        d = np.maximum(d, plane(W * (1 - self.taper) / L, 1.0, 0.0, W))   # front sides taper
        d = np.maximum(d, plane(-W / back, 1.0, 0.0, W))    # trailing sides meet in a point
        if self.keel > 0:                                   # two keel facets
            d = np.maximum(d, plane(0.0, H / W, 1.0, H))
        # wedge facet: full height at the front third, thinning to a sharp edge at the trailing point
        x0 = L * 0.35
        slope = (H + T * 0.5) / (x0 + back)
        d = np.maximum(d, plane(-slope, 0.0, 1.0, H - slope * x0))
        return d


class Prism(Prim):
    """CREATURE29: a hard-faceted limb segment: a tapered polygonal prism from ``a`` to ``b``.

    ``r0``/``r1`` are the apothems at each end, ``sides`` the facet count, ``up`` the reference direction for the
    first facet (rolled by ``roll`` radians), ``squash`` scales the cross-section along ``up`` (flat segments)."""

    def __init__(self, a, b, r0, r1, sides=4, up=(0, 0, 1), roll=math.pi / 4, squash=1.0, **kw):
        self.a, self.b = v3(a), v3(b)
        self.r0, self.r1, self.sides, self.roll, self.squash = float(r0), float(r1), int(sides), float(roll), float(squash)
        ax = self.b - self.a
        self.L = max(float(np.linalg.norm(ax)), 1e-6)
        self.u = ax / self.L
        t = v3(up) - self.u * float(v3(up) @ self.u)
        if float(np.linalg.norm(t)) < 1e-4:
            t = np.cross(self.u, v3((0, 1, 0)))
        self.t = normalize(t)
        self.s = normalize(np.cross(self.t, self.u))
        r = max(self.r0, self.r1) * 1.5 * max(1.0, self.squash)
        super().__init__(bounds=(np.minimum(self.a, self.b) - r, np.maximum(self.a, self.b) + r), **kw)

    def field(self, P):
        q = P - self.a
        x, y, z = q @ self.u, q @ self.s, (q @ self.t) / self.squash
        slope = (self.r1 - self.r0) / self.L
        r = self.r0 + slope * x
        norm = math.sqrt(1 + slope * slope)
        d = np.maximum(-x, x - self.L)
        for i in range(self.sides):
            th = self.roll + 2 * math.pi * i / self.sides
            d = np.maximum(d, (y * math.cos(th) + z * math.sin(th) - r) / norm * min(1.0, self.squash))
        return d


class Tube(Prim):
    """A polyline of round cones: horns, claws, tendons, curved spines."""

    def __init__(self, points, radii, **kw):
        self.points = [v3(p) for p in points]
        self.radii = [float(r) for r in radii]
        self.parts = [RoundCone(self.points[i], self.points[i + 1], self.radii[i], self.radii[i + 1])
                      for i in range(len(self.points) - 1)]
        lo = np.min([p.bounds()[0] for p in self.parts], axis=0)
        hi = np.max([p.bounds()[1] for p in self.parts], axis=0)
        super().__init__(bounds=(lo, hi), **kw)

    def field(self, P):
        d = None
        for part in self.parts:
            lo, hi = part.bounds()
            sel = np.all((P >= lo - 0.02) & (P <= hi + 0.02), axis=1)
            if d is None:
                d = np.full(P.shape[0], 10.0, dtype=F)
            if sel.any():
                d[sel] = np.minimum(d[sel], part.field(P[sel]))
        return d


def bezier(p0, p1, p2, p3, n):
    p0, p1, p2, p3 = map(v3, (p0, p1, p2, p3))
    out = []
    for i in range(n + 1):
        t = i / n
        out.append(((1 - t) ** 3) * p0 + 3 * ((1 - t) ** 2) * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * p3)
    return out


class Displace(Prim):
    """Wrap another primitive with low-frequency noise (lumpy organic masses)."""

    def __init__(self, inner, amp, freq, seed=0, **kw):
        self.inner, self.amp, self.freq, self.seed = inner, float(amp), float(freq), int(seed)
        lo, hi = inner.bounds()
        super().__init__(bounds=(lo - self.amp, hi + self.amp), **kw)

    def field(self, P):
        return self.inner.field(P) + self.amp * fbm(P * self.freq, 3, self.seed)


class Stretch(Prim):
    """Ridged surface: add sinusoidal grooves along an axis (segment rings, tendons)."""

    def __init__(self, inner, axis, period, depth, sharp=4, **kw):
        self.inner, self.axis = inner, normalize(axis)
        self.period, self.depth, self.sharp = float(period), float(depth), sharp
        lo, hi = inner.bounds()
        super().__init__(bounds=(lo, hi), **kw)

    def field(self, P):
        s = (P @ self.axis) / self.period
        groove = np.abs(np.cos(s * math.pi)) ** self.sharp
        return self.inner.field(P) + self.depth * (1 - groove)


# --------------------------------------------------------------- evaluation
class Sculpture:
    """Ordered primitive list with grid and point evaluation."""

    def __init__(self, name):
        self.name = name
        self.prims: list[Prim] = []

    def add(self, prim):
        self.prims.append(prim)
        return prim

    def extend(self, prims):
        for prim in prims:
            self.add(prim)

    def bounds(self, pad):
        adds = [p for p in self.prims if p.op == "add"]
        lo = np.min([p.bounds()[0] for p in adds], axis=0) - pad
        hi = np.max([p.bounds()[1] for p in adds], axis=0) + pad
        return lo, hi

    def evaluate_points(self, P, band=None, track=False):
        """Field at points; optionally the winning primitive index per point."""
        P = np.asarray(P, dtype=F)
        far = F(1e3 if band is None else band)
        d = np.full(P.shape[0], far, dtype=F)
        win = np.full(P.shape[0], -1, dtype=np.int32) if track else None
        for index, prim in enumerate(self.prims):
            lo, hi = prim.bounds()
            margin = prim.k + (0.0 if band is None else float(band))
            sel = np.all((P >= lo - margin) & (P <= hi + margin), axis=1)
            if not sel.any():
                continue
            idx = np.nonzero(sel)[0]
            pd = prim.field(P[idx]).astype(F)
            cur = d[idx]
            if prim.op == "add":
                new = smin(cur, pd, prim.k)
                if track:
                    w = win[idx]
                    w[pd < cur] = index
                    win[idx] = w
            elif prim.op == "sub":
                new = smax(cur, -pd, prim.k)
                if track:
                    w = win[idx]
                    # Carved surfaces take the carving primitive's zone.
                    w[(-pd > cur) & (pd > -0.5)] = index
                    win[idx] = w
            elif prim.op == "int":
                new = smax(cur, pd, prim.k)
            else:
                raise ValueError(prim.op)
            d[idx] = new
        return (d, win) if track else d

    def evaluate_grid(self, voxel, pad=0.03, band=None, log=print):
        lo, hi = self.bounds(pad)
        dims = np.ceil((hi - lo) / voxel).astype(int) + 1
        band = float(band if band is not None else voxel * 4)
        log(f"[sdf] {self.name}: grid {dims.tolist()} voxel {voxel:.4f} ({int(np.prod(dims)) / 1e6:.1f}M)")
        field = np.full(tuple(dims), band, dtype=F)
        for prim in self.prims:
            plo, phi = prim.bounds()
            margin = prim.k + band
            i0 = np.clip(np.floor((plo - margin - lo) / voxel).astype(int), 0, dims - 1)
            i1 = np.clip(np.ceil((phi + margin - lo) / voxel).astype(int) + 1, 0, dims)
            if np.any(i1 <= i0):
                continue
            xs = lo[0] + voxel * np.arange(i0[0], i1[0], dtype=F)
            ys = lo[1] + voxel * np.arange(i0[1], i1[1], dtype=F)
            zs = lo[2] + voxel * np.arange(i0[2], i1[2], dtype=F)
            # Slab over x keeps temporary memory bounded.
            step = max(1, int(2_000_000 // max(1, len(ys) * len(zs))))
            for sx in range(0, len(xs), step):
                X, Y, Z = np.meshgrid(xs[sx:sx + step], ys, zs, indexing="ij")
                P = np.stack([X.ravel(), Y.ravel(), Z.ravel()], axis=1)
                pd = prim.field(P).reshape(X.shape).astype(F)
                block = field[i0[0] + sx:i0[0] + sx + X.shape[0], i0[1]:i1[1], i0[2]:i1[2]]
                if prim.op == "add":
                    block[...] = smin(block, pd, prim.k)
                elif prim.op == "sub":
                    block[...] = smax(block, -pd, prim.k)
                else:
                    block[...] = smax(block, pd, prim.k)
        np.clip(field, -band, band, out=field)
        return field, lo


def mesh_from_grid(field, origin, voxel, adaptivity=0.0):
    """OpenVDB level-set polygonisation; returns (points, triangles)."""
    import openvdb as vdb

    band = float(np.max(np.abs(field)))
    grid = vdb.FloatGrid(band)
    grid.copyFromArray(field, ijk=(0, 0, 0), tolerance=0.0)
    grid.gridClass = vdb.GridClass.LEVEL_SET
    points, triangles, quads = grid.convertToPolygons(isovalue=0.0, adaptivity=adaptivity)
    points = np.asarray(points, dtype=np.float64) * voxel + origin
    # OpenVDB winds level-set polygons inward for this sign convention; flip.
    tris = [np.asarray(triangles, dtype=np.int64).reshape(-1, 3)[:, ::-1]] if len(triangles) else []
    if len(quads):
        q = np.asarray(quads, dtype=np.int64).reshape(-1, 4)[:, ::-1]
        tris.append(np.concatenate([q[:, [0, 1, 2]], q[:, [0, 2, 3]]]))
    faces = np.concatenate(tris) if tris else np.zeros((0, 3), np.int64)
    return points, faces
