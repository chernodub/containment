"""Band colours for quick previews (same zone/plate -> band mapping as build.colorize_bands, no curvature or bake)."""
import numpy as np
import bpy
import kit as K
import sdf as S

BAND_OF = {S.SHELL: "chitin", S.UNDER: "chitin", S.CLAW: "chitin", S.ARMOR: "chitin", S.CREST: "chitin",
           S.CAVITY: "chitin", S.MEMBRANE: "flesh", S.FLESH: "flesh", S.SINEW: "flesh", S.BONE: "bone",
           S.TOOTH: "bone", S.ORGAN: "accent", S.EYE: "accent"}
KEY = {S.SHELL: "shell", S.MEMBRANE: "membrane", S.SINEW: "sinew", S.CREST: "crest"}


def paint(obj, sculpture, M):
    co = K.verts_np(obj)
    _, win = sculpture.evaluate_points(co, track=True)
    zone = np.array([sculpture.prims[i].zone if i >= 0 else S.SHELL for i in win])
    plate = np.array([sculpture.prims[i].plate if i >= 0 else 0 for i in win])
    remap = getattr(M, "BAND_MAP", {})
    bands = np.array([remap.get(KEY.get(z, ""), BAND_OF.get(z, "chitin")) for z in zone], object)
    for pid, band in getattr(M, "PLATE_BAND", {}).items():
        bands[plate == pid] = band
    rgb = np.array([M.BANDS[b] for b in bands], np.float32)
    K.write_color(obj, "base", np.hstack([rgb, np.ones((len(co), 1), np.float32)]))
    mat = bpy.data.materials.new("band")
    mat.use_nodes = True
    attr = mat.node_tree.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "base"
    mat.node_tree.links.new(attr.outputs["Color"], mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"])
    K.set_material(obj, mat)


def vertex_bands(co, sculpture, M):
    """Band name per vertex: zone -> band (caste BAND_MAP), then PLATE_BAND overrides (same rule as build.py)."""
    _, win = sculpture.evaluate_points(co, track=True)
    zone = np.array([sculpture.prims[i].zone if i >= 0 else S.SHELL for i in win])
    plate = np.array([sculpture.prims[i].plate if i >= 0 else 0 for i in win])
    remap = getattr(M, "BAND_MAP", {})
    bands = np.array([remap.get(KEY.get(z, ""), BAND_OF.get(z, "chitin")) for z in zone], object)
    for pid, band in getattr(M, "PLATE_BAND", {}).items():
        bands[plate == pid] = band
    return bands, zone, plate


def merge_islands(co, bands, cell, keep=("accent", "eye")):
    """CREATURE26: value shapes no smaller than a few cells. Vertices whose band holds under 30 % of the votes in
    their 3x3x3 cell neighbourhood take the neighbourhood's majority band (lanterns and eyes are kept)."""
    names = sorted(set(bands.tolist()))
    idx = np.array([names.index(b) for b in bands])
    g = np.floor((co - co.min(0)) / cell).astype(np.int64) + 1
    dims = g.max(0) + 2
    votes = np.zeros((len(names), *dims), np.float32)
    np.add.at(votes, (idx, g[:, 0], g[:, 1], g[:, 2]), 1.0)
    blur = votes.copy()
    for ax in (1, 2, 3):
        blur = blur + np.roll(blur, 1, ax) + np.roll(blur, -1, ax)
    local = blur[:, g[:, 0], g[:, 1], g[:, 2]]          # (bands, verts)
    share = local[idx, np.arange(len(idx))] / np.maximum(local.sum(0), 1e-6)
    major = np.argmax(local, axis=0)
    swap = (share < 0.30) & ~np.isin(bands, list(keep)) & ~np.isin(np.array(names, object)[major], list(keep))
    out = bands.copy()
    out[swap] = np.array(names, object)[major[swap]]
    return out


def anatomy_planes(obj, sculpture, M):
    co = K.verts_np(obj)
    bands, zone, plate = vertex_bands(co, sculpture, M)
    if getattr(M, "BAND_CELL", 0):
        bands = merge_islands(co, bands, M.BAND_CELL, getattr(M, "BAND_KEEP", ("accent", "eye")))
    if hasattr(M, "paint_marks"):
        M.paint_marks(sculpture.name, co, K.normals_np(obj), plate, bands)
    return bands, zone


def anatomy_rgb(obj, sculpture, M):
    bands, zone = anatomy_planes(obj, sculpture, M)
    rgb = np.array([M.BANDS[b] for b in bands], np.float32)
    rgb[zone == S.EYE] = M.BANDS.get("eye", M.BANDS["accent"])
    if sculpture.name.endswith("-elite"):
        hard = np.isin(zone, [S.SHELL, S.UNDER, S.ARMOR, S.CREST, S.CLAW, S.BONE, S.TOOTH])
        rgb[hard] = (0.90, 0.76, 0.42)
    return bands, rgb


def hard_weights(co, sculpture):
    """CREATURE29: per-vertex weight of the winning primitive's ``hard`` flag (faceted planes keep their own normals)."""
    if not any(getattr(p, "hard", 0) > 0 for p in sculpture.prims):
        return None
    _, win = sculpture.evaluate_points(co, track=True)
    return np.array([sculpture.prims[i].hard if i >= 0 else 0.0 for i in win], np.float32)


def form_normals_np(obj, iterations, mix=1.0, normal_iterations=12, hard=None):
    """Taubin-smoothed copy's vertex normals (the CREATURE26 shading proxy), mixed with the true normals."""
    co, e, true_n = K.verts_np(obj), K.edges_np(obj), K.normals_np(obj)
    sm = co.copy()
    for _ in range(iterations):
        sm = K.laplacian(sm, e, len(co), 1, 0.5)
        sm = K.laplacian(sm, e, len(co), 1, -0.53)
    proxy = K.duplicate(obj, obj.name + "-form-proxy")
    K.set_verts(proxy, sm)
    proxy_n = K.normals_np(proxy)
    bpy.data.objects.remove(proxy, do_unlink=True)
    # decimated meshes carry slivers whose normals stay noisy after Taubin: diffuse the normal field itself too,
    # so the key terminator draws one clean curve instead of a saw-tooth "fur" edge
    proxy_n = K.laplacian(proxy_n, e, len(co), normal_iterations, 0.5)
    proxy_n /= np.maximum(np.linalg.norm(proxy_n, axis=1, keepdims=True), 1e-6)
    n = mix * proxy_n + (1 - mix) * true_n
    if hard is not None:   # CREATURE29: hard planes keep their facet normals so a plane reads as one lit or dark shape
        h = np.clip(hard, 0, 1)[:, None]
        n = n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-6)
        n = (1 - h) * n + h * true_n
    return n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-6)
