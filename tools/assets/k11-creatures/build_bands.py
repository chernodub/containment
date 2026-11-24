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
