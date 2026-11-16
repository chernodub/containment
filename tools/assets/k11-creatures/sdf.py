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
SHELL, MEMBRANE, SINEW, CLAW, ORGAN, EYE, CREST, TOOTH, CAVITY, UNDER, ARMOR, FLESH = range(12)
ZONE_NAMES = ["shell", "membrane", "sinew", "claw", "organ", "eye", "crest", "tooth", "cavity", "under", "armor", "flesh"]


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
                 detail=1.0):
        self.op, self.k, self.zone, self.bone = op, float(k), zone, bone
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
