"""CREATURE26: evaluate a motion clip of a `*-motion.glb` in numpy (no Blender import) and skin preview points.

Gives each joint's skinning matrix W_pose @ inv(W_rest) in glTF space, so a preview mesh weighted to the contract
bones can be posed in the clip and judged from the game camera without a full bake/ship/build.
"""
import json
import struct
from pathlib import Path

import numpy as np

COMP = {5126: np.float32, 5123: np.uint16, 5125: np.uint32, 5121: np.uint8}
NCOMP = {"SCALAR": 1, "VEC3": 3, "VEC4": 4, "MAT4": 16}


def _load(path):
    data = Path(path).read_bytes()
    jlen = struct.unpack_from("<I", data, 12)[0]
    doc = json.loads(data[20:20 + jlen])
    off = 20 + jlen
    blen = struct.unpack_from("<I", data, off)[0]
    return doc, data[off + 8: off + 8 + blen]


def _acc(doc, binary, i):
    a = doc["accessors"][i]
    v = doc["bufferViews"][a["bufferView"]]
    dt = COMP[a["componentType"]]
    n = NCOMP[a["type"]]
    start = v.get("byteOffset", 0) + a.get("byteOffset", 0)
    arr = np.frombuffer(binary, dt, a["count"] * n, start).reshape(a["count"], n).astype(np.float64)
    if a.get("normalized") and dt != np.float32:
        arr /= np.iinfo(dt).max
    return arr


def _trs(t, r, s):
    x, y, z, w = r
    R = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                  [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                  [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
    M = np.eye(4)
    M[:3, :3] = R * np.asarray(s)[None, :]
    M[:3, 3] = t
    return M


class Motion:
    def __init__(self, path):
        self.doc, self.bin = _load(path)
        self.nodes = self.doc["nodes"]
        self.parent = {}
        for i, n in enumerate(self.nodes):
            for c in n.get("children", []):
                self.parent[c] = i
        self.index = {n.get("name"): i for i, n in enumerate(self.nodes)}
        self.rest = [(np.array(n.get("translation", [0, 0, 0])), np.array(n.get("rotation", [0, 0, 0, 1])),
                      np.array(n.get("scale", [1, 1, 1]))) for n in self.nodes]
        self.clips = {a["name"]: a for a in self.doc.get("animations", [])}

    def _world(self, local):
        out = {}

        def w(i):
            if i not in out:
                M = _trs(*local[i])
                out[i] = w(self.parent[i]) @ M if i in self.parent else M
            return out[i]
        for i in range(len(self.nodes)):
            w(i)
        return out

    def duration(self, clip):
        a = self.clips[clip]
        return max(float(_acc(self.doc, self.bin, s["input"])[-1, 0]) for s in a["samplers"])

    def skin(self, clip, t):
        """Joint name -> 4x4 skinning matrix (glTF space) at time t (seconds, clamped)."""
        local = [list(x) for x in self.rest]
        a = self.clips[clip]
        for ch in a["channels"]:
            node, path = ch["target"].get("node"), ch["target"]["path"]
            smp = a["samplers"][ch["sampler"]]
            ts = _acc(self.doc, self.bin, smp["input"])[:, 0]
            vs = _acc(self.doc, self.bin, smp["output"])
            tt = min(max(t, ts[0]), ts[-1])
            k = int(np.searchsorted(ts, tt, side="right") - 1)
            k = min(max(k, 0), len(ts) - 1)
            if k + 1 < len(ts) and smp.get("interpolation", "LINEAR") != "STEP":
                f = (tt - ts[k]) / max(ts[k + 1] - ts[k], 1e-9)
                v = vs[k] * (1 - f) + vs[k + 1] * f
            else:
                v = vs[k]
            if path == "rotation":
                v = v / np.linalg.norm(v)
            slot = {"translation": 0, "rotation": 1, "scale": 2}.get(path)
            if slot is not None:
                local[node][slot] = v
        W0, W1 = self._world(self.rest), self._world(local)
        return {n.get("name"): W1[i] @ np.linalg.inv(W0[i]) for i, n in enumerate(self.nodes)}

    def rest_head(self, name):
        return self._world(self.rest)[self.index[name]][:3, 3]


def blender_to_gltf(p):
    p = np.asarray(p, np.float64)
    return np.stack([p[:, 0], p[:, 2], -p[:, 1]], 1)


def gltf_to_blender(p):
    return np.stack([p[:, 0], -p[:, 2], p[:, 1]], 1)


def pose_points(design_pts, aspect, bones, weights, skin):
    """design-space points with (n, k) bone names / weights -> posed design-space points."""
    sk = np.asarray(design_pts, np.float64).copy()
    sk[:, 2] /= aspect
    g = np.hstack([blender_to_gltf(sk), np.ones((len(sk), 1))])
    out = np.zeros((len(sk), 3))
    for j in range(bones.shape[1]):
        for name in set(bones[:, j].tolist()):
            if name is None or name not in skin:
                continue
            sel = bones[:, j] == name
            out[sel] += (g[sel] @ skin[name].T)[:, :3] * weights[sel, j:j + 1]
    p = gltf_to_blender(out)
    p[:, 2] *= aspect
    return p
