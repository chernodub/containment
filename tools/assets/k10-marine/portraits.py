"""Render original marine portrait/hero PNGs from the shipping GLB, without export.

blender -b -P tools/assets/k10-marine/portraits.py
blender -b -P tools/assets/k10-marine/portraits.py -- --preview --rig=breacher
The preview switch writes review images only. Default outputs are transparent
1024-square busts and 1024x1280 full figures in public/assets/portraits/k10/.
"""

import bisect
import json
import math
from pathlib import Path
import shutil
import struct
import sys

import bpy
from mathutils import Matrix, Quaternion, Vector


sys.path.insert(0,str(Path(__file__).resolve().parent))
ROOT = Path(__file__).resolve().parents[3]
ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
PREVIEW = '--preview' in ARGS
RIG = next((arg.split('=', 1)[1] for arg in ARGS if arg.startswith('--rig=')), None)
SAMPLES = int(next((arg.split('=', 1)[1] for arg in ARGS if arg.startswith('--samples=')),
                   '24' if PREVIEW else '64'))
OUT = ROOT / ('artifacts/nextgen/k10-final/portrait-review' if PREVIEW
              else 'public/assets/portraits/k10')
OUT.mkdir(parents=True, exist_ok=True)
REVIEW = ROOT / 'artifacts/nextgen/k10-final/portrait-review'
REVIEW.mkdir(parents=True, exist_ok=True)
WEAPONS = {'breacher': ('shotgun', 'shotgun_delta', .65039),
           'cryo': ('rifle', 'rifle_delta', .60640),
           'pyro': ('rifle', 'rifle_delta', .60640),
           'arc': ('pistol', 'blaster_delta', .65146)}
ACCENTS = {'breacher': (1, .49, .12), 'cryo': (.26, .69, 1),
           'pyro': (1, .25, .065), 'arc': (.66, .48, 1)}


def read_glb(path):
    raw = Path(path).read_bytes()
    length = struct.unpack_from('<I', raw, 12)[0]
    document = json.loads(raw[20:20 + length])
    start = 20 + length
    binary_length = struct.unpack_from('<I', raw, start)[0]
    return document, raw[start + 8:start + 8 + binary_length]


def accessor(document, binary, index):
    item = document['accessors'][index]
    view = document['bufferViews'][item['bufferView']]
    width = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[item['type']]
    offset = view.get('byteOffset', 0) + item.get('byteOffset', 0)
    stride = view.get('byteStride', width * 4)
    return [struct.unpack_from('<' + 'f' * width, binary, offset + row * stride)
            for row in range(item['count'])]


def pose_matrices(document, binary, upper_clip=None):
    nodes = document['nodes'][:123]
    local = [{'translation': node.get('translation', [0, 0, 0]),
              'rotation': node.get('rotation', [0, 0, 0, 1]),
              'scale': node.get('scale', [1, 1, 1])} for node in nodes]
    by_name = {node.get('name'): index for index, node in enumerate(nodes)}
    upper = set()

    def descendants(index):
        upper.add(index)
        for child in nodes[index].get('children', []):
            descendants(child)

    descendants(by_name['ribs'])

    def apply(name, time, mask=None):
        clip = next(animation for animation in document['animations'] if animation['name'] == name)
        for channel in clip['channels']:
            node = channel['target']['node']
            if mask is not None and node not in mask:
                continue
            sampler = clip['samplers'][channel['sampler']]
            clock = [value[0] for value in accessor(document, binary, sampler['input'])]
            values = accessor(document, binary, sampler['output'])
            index = max(0, min(len(clock) - 1, bisect.bisect_right(clock, time) - 1))
            next_index = min(index + 1, len(clock) - 1)
            alpha = ((time - clock[index]) / (clock[next_index] - clock[index])
                     if clock[next_index] > clock[index] else 0)
            alpha = max(0, min(1, alpha))
            path = channel['target']['path']
            first, second = values[index], values[next_index]
            if path == 'rotation':
                a = Quaternion((first[3], *first[:3]))
                b = Quaternion((second[3], *second[:3]))
                q = a.slerp(b, alpha)
                local[node][path] = [q.x, q.y, q.z, q.w]
            else:
                local[node][path] = [a + (b - a) * alpha for a, b in zip(first, second)]

    if upper_clip:
        apply('stand', .22)
        apply(upper_clip, 0, upper)
    globals_ = {0: Matrix.Identity(4)}

    def visit(index):
        for child in nodes[index].get('children', []):
            transform = local[child]
            x, y, z, w = transform['rotation']
            matrix = Matrix.LocRotScale(Vector(transform['translation']), Quaternion((w, x, y, z)),
                                        Vector(transform['scale']))
            globals_[child] = globals_[index] @ matrix
            visit(child)

    visit(0)
    return {nodes[index]['name']: matrix for index, matrix in globals_.items() if index}


def apply_pose(armature, rest, posed):
    """Apply the source clips with the importer's per-bone rest correction."""
    armature.animation_data_clear()
    for bone in armature.pose.bones:
        bone.matrix_basis.identity()
    bpy.context.view_layer.update()
    inverse_arm = armature.matrix_world.inverted()
    corrections = {bone.name: rest[bone.name].inverted() @ armature.matrix_world @ bone.matrix_local
                   for bone in armature.data.bones if bone.name in rest}
    for name, matrix in posed.items():
        if name in corrections:
            armature.pose.bones[name].matrix = inverse_arm @ matrix @ corrections[name]
            bpy.context.view_layer.update()


def deformed_points(meshes, minimum_z=None):
    graph = bpy.context.evaluated_depsgraph_get()
    points = []
    for obj in meshes:
        if obj.hide_render:
            continue
        evaluated = obj.evaluated_get(graph)
        mesh = evaluated.to_mesh()
        for vertex in mesh.vertices:
            point = evaluated.matrix_world @ vertex.co
            if minimum_z is None or point.z >= minimum_z:
                points.append(point)
        evaluated.to_mesh_clear()
    return points


def attach_weapon(rig, tag, normalization):
    weapon_id, _clip, fit = WEAPONS[rig]
    previous = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(ROOT / 'public/assets/models' / (weapon_id + '.glb')))
    imported = [obj for obj in bpy.data.objects if obj not in previous]
    roots = [obj for obj in imported if obj.parent not in imported]
    carrier = bpy.data.objects.new('portrait held ' + weapon_id, None)
    bpy.context.collection.objects.link(carrier)
    rotation = tag.to_quaternion().to_matrix().to_4x4()
    position = normalization @ tag.translation
    gltf_to_blender = Matrix.Rotation(math.pi / 2, 4, 'X')
    carrier.matrix_world = (Matrix.Translation(position) @ rotation @
                            Matrix.Scale(fit, 4) @ gltf_to_blender.inverted())
    for obj in roots:
        original = obj.matrix_world.copy()
        obj.parent = carrier
        obj.matrix_parent_inverse = Matrix.Identity(4)
        obj.matrix_basis = original
    return imported + [carrier]


def area_light(name, position, power, size, color, target=(0, 0, 1.3)):
    bpy.ops.object.light_add(type='AREA', location=position)
    light = bpy.context.object
    light.name, light.data.energy, light.data.size, light.data.color = name, power, size, color
    light.rotation_euler = (Vector(target) - light.location).to_track_quat('-Z', 'Y').to_euler()
    return light


def fit_camera(camera, points, bust):
    direction = Vector((5.4, 3.8, 2.6 if bust else 2.2)).normalized()
    target = Vector((0, 0, 1.58 if bust else 1.03))
    camera.location = target + direction * 6
    camera.rotation_euler = (-direction).to_track_quat('-Z', 'Y').to_euler()
    rotation = camera.rotation_euler.to_matrix()
    right, up = rotation @ Vector((1, 0, 0)), rotation @ Vector((0, 1, 0))
    xs, ys = [point.dot(right) for point in points], [point.dot(up) for point in points]
    center = right * ((min(xs) + max(xs)) / 2) + up * ((min(ys) + max(ys)) / 2)
    camera.location += right * (center.dot(right) - target.dot(right))
    camera.location += up * (center.dot(up) - target.dot(up))
    camera.data.ortho_scale = 1
    frame = camera.data.view_frame(scene=bpy.context.scene)
    width = max(point.x for point in frame) - min(point.x for point in frame)
    height = max(point.y for point in frame) - min(point.y for point in frame)
    camera.data.ortho_scale = max((max(xs) - min(xs)) / (width * .86),
                                  (max(ys) - min(ys)) / (height * .88))


bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
source = ROOT / 'public/assets/models/marine.glb'
document, binary = read_glb(source)
bpy.ops.import_scene.gltf(filepath=str(source))
character_objects = list(bpy.data.objects)
armature = next(obj for obj in character_objects if obj.type == 'ARMATURE')
character_meshes = [obj for obj in character_objects if obj.type == 'MESH' and obj.name.startswith('k10-')]
for obj in character_objects:
    if obj.type == 'MESH' and obj not in character_meshes:
        obj.hide_render = True
rest = pose_matrices(document, binary)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
from render_device import choose_render_device
choose_render_device(scene)
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.color_depth = '8'
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = -.5
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.20, .25, .31, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .35
area_light('Warm softbox key', (3.3, -3.4, 5.0), 500, 3.0, (1, .91, .82))
area_light('Cool armour fill', (1.5, 3.2, 2.8), 150, 3.5, (.64, .80, 1))
area_light('Crown and dorsal rim', (-2.8, -2.0, 4.2), 650, 2.1, (.63, .80, 1))
accent = area_light('Element edge bounce', (-1.7, 2.1, 2.2), 85, 1.3, (1, .5, .1))
bpy.ops.object.camera_add()
camera = bpy.context.object
camera.data.type = 'ORTHO'
scene.camera = camera

for rig in ([RIG] if RIG else list(WEAPONS)):
    for obj in character_meshes:
        obj.hide_render = obj.name.startswith('k10-rig-') and obj.name != 'k10-rig-' + rig
    apply_pose(armature, rest, pose_matrices(document, binary, WEAPONS[rig][1]))
    points = deformed_points(character_meshes)
    minimum = min(point.z for point in points)
    height = max(point.z for point in points) - minimum
    factor = 2.05 / height
    normalization = Matrix.Translation((0, 0, -minimum * factor)) @ Matrix.Scale(factor, 4)
    # Transform the complete import together so bind/rest relationships survive.
    character_roots = [obj for obj in character_objects if obj.parent not in character_objects]
    originals = {obj: obj.matrix_world.copy() for obj in character_roots}
    for obj, original in originals.items():
        obj.matrix_world = normalization @ original
    bpy.context.view_layer.update()
    posed = pose_matrices(document, binary, WEAPONS[rig][1])
    weapon_objects = attach_weapon(rig, posed['tag_weapon'], normalization)
    weapon_meshes = [obj for obj in weapon_objects if obj.type == 'MESH']
    bpy.context.view_layer.update()
    accent.data.color = ACCENTS[rig]
    for bust in (True, False):
        scene.render.resolution_x = 512 if PREVIEW else 1024
        scene.render.resolution_y = (512 if PREVIEW else 1024) if bust else (640 if PREVIEW else 1280)
        # A bust frames the person and pack; its lower weapon may leave the crop.
        # Hero framing retains the complete weapon, both boots and every rig tip.
        points = deformed_points(character_meshes if bust else character_meshes + weapon_meshes,
                                 minimum_z=1.40 if bust else None)
        fit_camera(camera, points, bust)
        scene.render.filepath = str(OUT / (rig + ('-bust.png' if bust else '-hero.png')))
        bpy.ops.render.render(write_still=True)
        if not PREVIEW:
            shutil.copyfile(scene.render.filepath, REVIEW / Path(scene.render.filepath).name)
    for obj in weapon_objects:
        bpy.data.objects.remove(obj, do_unlink=True)
    for obj, original in originals.items():
        obj.matrix_world = original
    bpy.context.view_layer.update()
print('Portrait PNGs rendered from shipping marine; source assets unchanged:', OUT)
