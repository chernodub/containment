"""Retain the shipped creature skeleton and append original K11 Lantern Brood skins.

The contract GLB contains only the existing skeleton, inverse binds and clips.
Its Unvanquished animation/skeleton attribution is separate from the original
MIT geometry produced by K11. This writer never round-trips bones through Blender.
"""

from copy import deepcopy
import json
from pathlib import Path
import struct


HERE = Path(__file__).resolve().parent
CONTRACT = HERE / "contracts/dretch.glb"
SOURCE_NOTICE = (
    "Retained Unvanquished creature skeleton and legacy animation; original contributors "
    "and CC BY-SA source terms in public/asset-credits.html. Original K11 geometry "
    "and textures: MIT."
)


def read_glb(path):
    """Return a JSON document and its embedded binary buffer."""
    raw = Path(path).read_bytes()
    document, binary = None, b""
    offset = 12
    while offset + 8 <= len(raw):
        length, kind = struct.unpack_from("<I4s", raw, offset)
        chunk = raw[offset + 8:offset + 8 + length]
        if kind == b"JSON":
            document = json.loads(chunk)
        elif kind == b"BIN\0":
            binary = chunk
        offset += 8 + length
    if document is None:
        raise ValueError(f"Missing glTF JSON chunk: {path}")
    return document, binary


def write_glb(document, binary, path):
    """Write a self-contained GLB, with four-byte-aligned chunks."""
    document = deepcopy(document)
    document["buffers"] = [{"byteLength": len(binary)}]
    encoded = json.dumps(document, separators=(",", ":"), ensure_ascii=False).encode()
    encoded += b" " * (-len(encoded) % 4)
    binary = bytes(binary) + b"\0" * (-len(binary) % 4)
    raw = struct.pack("<4sII", b"glTF", 2, 28 + len(encoded) + len(binary))
    raw += struct.pack("<I4s", len(encoded), b"JSON") + encoded
    raw += struct.pack("<I4s", len(binary), b"BIN\0") + binary
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(raw)


def make_contract(source, output=CONTRACT):
    """Strip source meshes/images while retaining exact skeleton/clip payloads."""
    original, source_binary = read_glb(source)
    document = {
        "asset": deepcopy(original["asset"]),
        "scene": 0,
        "scenes": deepcopy(original["scenes"]),
        "nodes": deepcopy(original["nodes"]),
        "skins": deepcopy(original["skins"]),
        "animations": deepcopy(original["animations"]),
        "accessors": [],
        "bufferViews": [],
        "buffers": [{}],
    }
    for node in document["nodes"]:
        node.pop("mesh", None)
        node.pop("weights", None)
    document["asset"]["copyright"] = SOURCE_NOTICE
    document["asset"]["extras"] = {"k11SkeletonContract": True}
    binary = bytearray()
    views, accessors = {}, {}

    def copy_view(index):
        if index not in views:
            source_view = original["bufferViews"][index]
            start = source_view.get("byteOffset", 0)
            while len(binary) % 4:
                binary.append(0)
            view = deepcopy(source_view)
            view["buffer"] = 0
            view["byteOffset"] = len(binary)
            binary.extend(source_binary[start:start + source_view["byteLength"]])
            views[index] = len(document["bufferViews"])
            document["bufferViews"].append(view)
        return views[index]

    def copy_accessor(index):
        if index not in accessors:
            accessor = deepcopy(original["accessors"][index])
            if "bufferView" in accessor:
                accessor["bufferView"] = copy_view(accessor["bufferView"])
            if "sparse" in accessor:
                for key in ("indices", "values"):
                    part = accessor["sparse"][key]
                    part["bufferView"] = copy_view(part["bufferView"])
            accessors[index] = len(document["accessors"])
            document["accessors"].append(accessor)
        return accessors[index]

    for skin in document["skins"]:
        skin["inverseBindMatrices"] = copy_accessor(skin["inverseBindMatrices"])
    for clip in document["animations"]:
        for sampler in clip["samplers"]:
            sampler["input"] = copy_accessor(sampler["input"])
            sampler["output"] = copy_accessor(sampler["output"])
    write_glb(document, binary, output)
    print(f"Skeleton contract: {len(document['nodes'])} nodes, "
          f"{len(document['animations'])} clips, {len(binary)} retained payload bytes")


def export_creature(meshes, path, material=None, images=None, contract=None, extras=None):
    """Append Blender meshes in ORIGINAL SOURCE Z-up world coordinates.

    ``material`` is one glTF material dictionary shared by the skins. ``images``
    is an ordered list of PNG/JPEG paths; its indices are also texture indices.
    The writer exports the active UV/color layers, flips Blender UV V for glTF,
    and retains the strongest four normalized named-bone weights per vertex.
    Armature modifiers are excluded from evaluation: skin deformation is applied
    by the retained glTF skeleton, while bevel/boolean modifiers remain applied.
    """
    import bpy

    document, source_binary = read_glb(contract or CONTRACT)
    binary = bytearray(source_binary[:document["buffers"][0]["byteLength"]])
    document["asset"]["generator"] = "Containment K11 Lantern Brood (tools/assets/k11-creatures)"
    for node in document["nodes"]:
        node.pop("mesh", None)
        node.pop("weights", None)
    document["asset"]["copyright"] = SOURCE_NOTICE
    document["meshes"] = []
    document["materials"] = [deepcopy(material) if material else {
        "name": "k11-flat-zones",
        "pbrMetallicRoughness": {
            "baseColorFactor": [1, 1, 1, 1],
            "metallicFactor": 0.18,
            "roughnessFactor": 0.72,
        },
    }]
    document["materials"][0].setdefault("extras", {})["k11Original"] = True
    extensions = document["materials"][0].get("extensions", {})
    if extensions:
        document["extensionsUsed"] = list(dict.fromkeys([*document.get("extensionsUsed", []), *extensions]))
    document["images"], document["textures"] = [], []
    document["samplers"] = [{"magFilter": 9729, "minFilter": 9987,
                              "wrapS": 33071, "wrapT": 33071}]

    def add_view(raw, target=None):
        while len(binary) % 4:
            binary.append(0)
        view = {"buffer": 0, "byteOffset": len(binary), "byteLength": len(raw)}
        if target is not None:
            view["target"] = target
        index = len(document["bufferViews"])
        document["bufferViews"].append(view)
        binary.extend(raw)
        return index

    def add_accessor(values, kind, component=5126, bounds=False):
        width = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}[kind]
        flat = [number for value in values for number in value]
        code = {5126: "f", 5123: "H", 5125: "I"}[component]
        raw = struct.pack(f"<{len(flat)}{code}", *flat)
        accessor = {"bufferView": add_view(raw, 34963 if kind == "SCALAR" else 34962), "componentType": component,
                    "count": len(values), "type": kind}
        if bounds:
            accessor["min"] = [min(row[i] for row in values) for i in range(width)]
            accessor["max"] = [max(row[i] for row in values) for i in range(width)]
        index = len(document["accessors"])
        document["accessors"].append(accessor)
        return index

    for image_path in images or []:
        image_path = Path(image_path)
        mime = "image/jpeg" if image_path.suffix.lower() in (".jpg", ".jpeg") else "image/png"
        index = len(document["images"])
        document["images"].append({"name": image_path.name, "mimeType": mime,
                                    "bufferView": add_view(image_path.read_bytes())})
        document["textures"].append({"sampler": 0, "source": index})

    joints = {document["nodes"][node]["name"]: index
              for index, node in enumerate(document["skins"][0]["joints"])}
    fallback_joint = joints.get("chest", joints.get("body", 0))
    summaries = []
    for obj in meshes:
        if obj.type != "MESH":
            continue
        disabled = [(modifier, modifier.show_viewport) for modifier in obj.modifiers
                    if modifier.type == "ARMATURE"]
        for modifier, _visible in disabled:
            modifier.show_viewport = False
        bpy.context.view_layer.update()
        evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
        mesh = evaluated.to_mesh(preserve_all_data_layers=True,
                                 depsgraph=bpy.context.evaluated_depsgraph_get())
        try:
            mesh.calc_loop_triangles()
            world = obj.matrix_world
            normals = world.to_3x3().inverted().transposed()
            mirrored = world.to_3x3().determinant() < 0
            uv = mesh.uv_layers.active
            color = mesh.color_attributes.active_color
            groups = {group.index: joints[group.name] for group in obj.vertex_groups
                      if group.name in joints}
            vertex_weights = []
            for vertex in mesh.vertices:
                weights = sorted(((groups[g.group], g.weight) for g in vertex.groups
                                  if g.group in groups and g.weight > 0),
                                 key=lambda item: item[1], reverse=True)[:4]
                if not weights:
                    weights = [(fallback_joint, 1.0)]
                total = sum(weight for _joint, weight in weights)
                ids = [joint for joint, _weight in weights]
                values = [weight / total for _joint, weight in weights]
                vertex_weights.append((ids + [0] * (4 - len(ids)),
                                       values + [0.0] * (4 - len(values))))
            positions, directions, uvs, colors, bone_ids, bone_weights = [], [], [], [], [], []
            lookup, indices = {}, []
            for triangle in mesh.loop_triangles:
                loops = reversed(triangle.loops) if mirrored else triangle.loops
                for loop_index in loops:
                    loop = mesh.loops[loop_index]
                    vertex = mesh.vertices[loop.vertex_index]
                    point = tuple(world @ vertex.co)
                    normal = normals @ mesh.corner_normals[loop_index].vector
                    direction = tuple(normal.normalized())
                    texcoord = tuple(uv.data[loop_index].uv) if uv else ()
                    if uv: texcoord = (texcoord[0], 1.0 - texcoord[1])
                    color_index = loop_index if color and color.domain == "CORNER" else loop.vertex_index
                    rgba = tuple(color.data[color_index].color) if color else ()
                    ids, weights = vertex_weights[loop.vertex_index]
                    key = (point, direction, texcoord, rgba, tuple(ids), tuple(weights))
                    vertex_index = lookup.get(key)
                    if vertex_index is None:
                        vertex_index = len(positions)
                        lookup[key] = vertex_index
                        positions.append(point);directions.append(direction)
                        if uv: uvs.append(texcoord)
                        if color: colors.append(rgba)
                        bone_ids.append(ids);bone_weights.append(weights)
                    indices.append((vertex_index,))
            attributes = {"POSITION": add_accessor(positions, "VEC3", bounds=True),
                          "NORMAL": add_accessor(directions, "VEC3"),
                          "JOINTS_0": add_accessor(bone_ids, "VEC4", 5123),
                          "WEIGHTS_0": add_accessor(bone_weights, "VEC4")}
            if uvs:
                attributes["TEXCOORD_0"] = add_accessor(uvs, "VEC2")
                # AO shares the same baked layout as the base/normal atlases.
                attributes["TEXCOORD_1"] = attributes["TEXCOORD_0"]
            if colors:
                attributes["COLOR_0"] = add_accessor(colors, "VEC4")
            index = len(document["meshes"])
            document["meshes"].append({"name": obj.name, "primitives": [
                {"attributes": attributes, "material": 0, "mode": 4,
                 "indices": add_accessor(indices, "SCALAR", 5123 if len(positions)<65536 else 5125)}]})
            node_extras = {"k11Original": True}
            node_extras.update(extras or {})
            document["nodes"].append({"name": obj.name, "mesh": index, "skin": 0, "extras": node_extras})
            document["scenes"][0]["nodes"].append(len(document["nodes"]) - 1)
            summaries.append({"name": obj.name, "triangles": len(indices) // 3})
        finally:
            evaluated.to_mesh_clear()
            for modifier, visible in disabled:
                modifier.show_viewport = visible
            bpy.context.view_layer.update()
    write_glb(document, binary, path)
    print(f"K11 creature export: {summaries}, {Path(path).stat().st_size} bytes")
    return summaries


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        raise SystemExit("Usage: python3 contract.py source.glb [output.glb]")
    make_contract(Path(sys.argv[1]), Path(sys.argv[2]) if len(sys.argv) > 2 else CONTRACT)
