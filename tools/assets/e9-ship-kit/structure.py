"""Original Containment architectural kit. Blender Z-up metres -> glTF Y-up.

Rebuild: blender -b --factory-startup -P tools/assets/e9-ship-kit/structure.py
Optional -- --preview renders a review layout after exporting the origin-centred
assets. All geometry, markings and AO are authored here; no external sources.
MIT, repository LICENSE. Runtime may stretch wall length along local X only.
"""
from __future__ import annotations

import hashlib
import json
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from craft import bake_craft, craft_forms

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree


ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'public/assets/e9-ship-kit/structure'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

PALETTE = {
    'e9-body': '#24343c', 'e9-ceramic': '#d5ded3', 'e9-trim': '#8faaa8',
    'e9-dark': '#0e1820', 'e9-cyan': '#65d8e6', 'e9-amber': '#e0b95a',
    'e9-green': '#71c793', 'e9-red': '#b96755',
    'e9-floor-ceramic': '#a4b5ac', 'e9-floor-rubber': '#26353c',
    'e9-floor-oxidised': '#6e7765', 'e9-yellow': '#c3ab59',
    'e9-glass': '#9dcad1',
}
MATERIALS = {}
GROUPS = []
CURRENT = None


def linear(hex_color):
    rgb = [int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in rgb)


for name, value in PALETTE.items():
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    rgba = (*linear(value), 1)
    material.diffuse_color = rgba
    shader = material.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = rgba
    shader.inputs['Metallic'].default_value = .42 if name in ('e9-body', 'e9-trim') else .03
    shader.inputs['Roughness'].default_value = .84 if name.startswith('e9-floor') else .43 if name == 'e9-trim' else .60
    if name in ('e9-cyan', 'e9-amber', 'e9-green', 'e9-red'):
        shader.inputs['Emission Color'].default_value = rgba
        shader.inputs['Emission Strength'].default_value = 2.4
    if name == 'e9-glass':
        shader.inputs['Roughness'].default_value = .14
        shader.inputs['Alpha'].default_value = .24
        material.diffuse_color = (*rgba[:3], .24)
        material.surface_render_method = 'DITHERED'
    MATERIALS[name] = material


def asset(name):
    global CURRENT
    CURRENT = bpy.data.objects.new(name, None)
    CURRENT.empty_display_type = 'PLAIN_AXES'
    CURRENT['originalAsset'] = True
    CURRENT['license'] = 'MIT'
    bpy.context.collection.objects.link(CURRENT)
    GROUPS.append(CURRENT)


def finish(obj, role, bevel=.02):
    obj.parent = CURRENT
    obj.data.materials.append(MATERIALS[role])
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel >= .01:
        modifier = obj.modifiers.new('Manufactured 20mm edge', 'BEVEL')
        modifier.width = bevel
        modifier.segments = 1
        modifier.harden_normals = True
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    modifier = obj.modifiers.new('Weighted broad faces', 'WEIGHTED_NORMAL')
    modifier.keep_sharp = True
    modifier.weight = 35
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    return obj


def box(name, xyz, size, role='e9-body', bevel=.02):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz)
    obj = bpy.context.object
    obj.name, obj.scale = name, size
    return finish(obj, role, min(bevel, min(size) * .24))


def cylinder(name, xyz, radius, depth, role='e9-trim', axis='Z', vertices=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=xyz)
    obj = bpy.context.object
    obj.name = name
    if axis == 'X':
        obj.rotation_euler[1] = math.pi / 2
    elif axis == 'Y':
        obj.rotation_euler[0] = math.pi / 2
    return finish(obj, role, min(.010, radius * .20))


def surface_polygon(name, points, role):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(points, [], [tuple(range(len(points)))])
    mesh.materials.append(MATERIALS[role])
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = CURRENT
    return obj


def wall(height, name):
    asset(name)
    cap_base = height - .12
    box('Wall contact shadow plinth', (0, 0, .05), (4.0, .75, .10), 'e9-dark')
    box('Wall structural body', (0, 0, (cap_base + .08) / 2), (3.98, .68, cap_base - .06))
    box('Broad ceramic wall cap', (0, 0, height - .06), (4.0, .75, .12), 'e9-ceramic')
    box('Cap underside shadow reveal', (0, 0, cap_base - .015), (3.98, .704, .035), 'e9-dark', .008)
    panel_bottom, panel_top = .23, cap_base - .11
    panel_height = max(.15, panel_top - panel_bottom)
    panel_center = (panel_bottom + panel_top) / 2
    for front in (-1, 1):
        # Both sides are fully authored; orientation never exposes an empty back.
        box('Darker continuous near face', (0, front * .345, (cap_base + .12) / 2),
            (3.96, .018, cap_base - .12), 'e9-body', .004)
        box('Wall baseboard', (0, front * .362, .145), (3.97, .025, .09), 'e9-trim', .006)
        box('Recessed base light channel', (0, front * .365, .077), (3.86, .014, .037), 'e9-dark', .003)
        box('Visible cyan base diffuser', (0, front * .372, .077), (3.72, .006, .016), 'e9-cyan', .001)
        for index in range(4):
            x = (index - 1.5) * .98
            box('Broad modular panel recess', (x, front * .359, panel_center), (.91, .012, panel_height), 'e9-dark', .003)
            box('Flat brushed service panel', (x, front * .368, panel_center),
                (.85, .010, panel_height - .045), 'e9-trim', .002)
        for x in (-.98, 0, .98):
            box('Narrow panel seam rib', (x, front * .365, (.18 + cap_base - .055) / 2),
                (.048, .020, cap_base - .235), 'e9-body', .005)
        for x in (-1.83, 1.83):
            cylinder('Captive wall service bolt', (x, front * .370, panel_center), .018, .008, axis='Y', vertices=8)


def jamb():
    asset('wall-end-jamb')
    box('Jamb grounded base', (0, 0, .05), (.45, .75, .10), 'e9-dark')
    box('Jamb pillar body', (0, 0, .59), (.42, .68, 1.06))
    box('Jamb light cap', (0, 0, 1.14), (.45, .75, .12), 'e9-ceramic')
    for sign in (-1, 1):
        box('Jamb ceramic face inset', (0, sign * .350, .65), (.31, .018, .72), 'e9-ceramic', .004)
        box('Jamb baseboard', (0, sign * .362, .15), (.43, .025, .08), 'e9-trim', .006)
        box('Jamb cyan slot recess', (0, sign * .369, .24), (.22, .008, .045), 'e9-dark', .002)
        box('Jamb visible cyan source', (0, sign * .374, .24), (.15, .002, .015), 'e9-cyan', .0004)
    for x in (-.210, .210):
        box('Closed jamb end reveal', (x, 0, .61), (.015, .51, .80), 'e9-dark', .003)
        box('Jamb end pull channel', (x, 0, .64), (.018, .055, .44), 'e9-trim', .004)


def threshold():
    asset('door-threshold')
    box('Threshold grounded plate', (0, 0, .013), (4.50, .80, .026), 'e9-dark', .006)
    box('Threshold non-slip inset', (0, 0, .031), (4.44, .74, .014), 'e9-floor-rubber', .003)
    for sign in (-1, 1):
        y0, y1 = sorted((sign * .24, sign * .355))
        # Unsaturated painted hatch marks have literal clipped polygon bounds.
        for index in range(11):
            x = -2.10 + index * .405
            surface_polygon('Quiet threshold hazard paint',
                [(x, y0, .04), (x + .14, y0, .04), (x + .24, y1, .04), (x + .10, y1, .04)], 'e9-yellow')
    for sign in (-1, 1):
        box('Threshold broad inset seam', (sign * 1.84, 0, .0385), (.015, .40, .003), 'e9-body', .0005)
        cylinder('Threshold countersunk fixing', (sign * 2.13, 0, .037), .026, .006, vertices=8)


def deck_panel(name, role, kind):
    asset(name)
    box('Deck panel dark grounded chassis', (0, 0, .021), (2.0, 2.0, .042), 'e9-dark', .010)
    # Big panels and low-contrast joints remain quiet beneath actors.
    for sx in (-1, 1):
        for sy in (-1, 1):
            box('Broad flush quarter deck plate', (sx * .493, sy * .493, .050), (.956, .956, .016), role, .003)
    if kind == 'ceramic':
        for x in (-.83, .83):
            for y in (-.83, .83):
                cylinder('Ceramic panel captive fixing', (x, y, .0585), .022, .003, 'e9-trim', vertices=8)
    elif kind == 'rubber':
        for x in (-.49, .49):
            for y in (-.65, -.22, .22, .65):
                box('Sparse rubber grip insert', (x, y, .059), (.64, .032, .002), 'e9-body', .0004)
    else:
        box('Oxidised service hatch recess', (.31, -.12, .0584), (.72, 1.48, .0008), 'e9-body', .0001)
        box('Oxidised service hatch lid', (.31, -.12, .0591), (.65, 1.40, .0006), role, .0001)
        for y in (-.70, .46):
            box('Hatch captive handle', (.31, y, .05975), (.23, .028, .0005), 'e9-trim', .0001)
    # Tiny corner pads establish a consistent physical 60mm module height.
    for x in (-.975, .975):
        box('Module upper corner pad', (x, 0, .059), (.010, .10, .002), role, .0004)


def glass_channel():
    asset('floor-glass-channel')
    box('Dark recessed cable trough', (0, 0, .015), (3.0, .50, .030), 'e9-dark', .006)
    for y in (-.2225, .2225):
        box('Channel side support frame', (0, y, .05), (3.0, .055, .10), 'e9-trim', .012)
    for x in (-1.47, 1.47):
        box('Channel end support frame', (x, 0, .05), (.06, .40, .10), 'e9-trim', .014)
    cylinder('Visible cyan service pipe', (0, 0, .047), .024, 2.86, 'e9-cyan', 'X', 12)
    for x in (-1.20, -.40, .40, 1.20):
        cylinder('Pipe restrained coupling', (x, 0, .047), .030, .045, 'e9-body', 'X', 12)
    box('Recessed transparent glass cover', (0, 0, .0895), (2.86, .372, .009), 'e9-glass', .002)
    for x in (-1.25, 1.25):
        for y in (-.218, .218):
            cylinder('Channel flush captive bolt', (x, y, .097), .017, .006, 'e9-dark', vertices=8)


def merge_material_primitives(group):
    by_material = {}
    for obj in list(group.children):
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        obj.select_set(False)
        by_material.setdefault(obj.data.materials[0].name, []).append(obj)
    for role, objects in by_material.items():
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        if len(objects) > 1:
            bpy.ops.object.join()
        obj = bpy.context.object
        obj.name = f'{group.name}--{role}'
        obj.parent = group
        obj['finish'] = role


def bake_vertex_ao(group):
    vertices, faces = [], []
    for obj in group.children:
        offset = len(vertices)
        vertices.extend(tuple(obj.matrix_world @ vertex.co) for vertex in obj.data.vertices)
        faces.extend(tuple(offset + i for i in polygon.vertices) for polygon in obj.data.polygons)
    tree = BVHTree.FromPolygons(vertices, faces, all_triangles=False, epsilon=.0001)
    for obj in group.children:
        mesh = obj.data
        colors = mesh.color_attributes.new(name='AO', type='BYTE_COLOR', domain='CORNER')
        mesh.color_attributes.active_color = colors
        mesh.color_attributes.render_color_index = 0
        white = mesh.materials[0].name in ('e9-cyan', 'e9-amber', 'e9-green', 'e9-red', 'e9-glass')
        values = []
        for vertex in mesh.vertices:
            if white:
                values.append(1)
                continue
            normal = vertex.normal.normalized()
            tangent = normal.cross(Vector((0, 0, 1)))
            if tangent.length < .01:
                tangent = normal.cross(Vector((0, 1, 0)))
            tangent.normalize()
            bitangent = normal.cross(tangent).normalized()
            origin = obj.matrix_world @ vertex.co + normal * .004
            occlusion = 0
            for ray in range(12):
                radius, angle = math.sqrt((ray + .5) / 12), ray * 2.399963229728653
                direction = (tangent * (radius * math.cos(angle)) + bitangent * (radius * math.sin(angle)) +
                             normal * math.sqrt(1 - radius * radius)).normalized()
                hit, _, _, distance = tree.ray_cast(origin, direction, .28)
                if hit is not None:
                    occlusion += (1 - distance / .28) * .55
            values.append(max(.52, 1 - occlusion / 12))
        for loop in mesh.loops:
            ao = values[loop.vertex_index]
            colors.data[loop.index].color = (ao, ao, ao, 1)
        mesh.update()


def export_pack():
    craft_forms(globals(), GROUPS)
    models = []
    for group in GROUPS:
        merge_material_primitives(group)
        bake_vertex_ao(group)
        bake_craft(group)
        points = [obj.matrix_world @ Vector(corner) for obj in group.children for corner in obj.bound_box]
        low = [min(p[i] for p in points) for i in range(3)]
        high = [max(p[i] for p in points) for i in range(3)]
        triangles = 0
        for obj in group.children:
            obj.data.calc_loop_triangles()
            triangles += len(obj.data.loop_triangles)
        models.append({
            'name': group.name,
            'size': [round(high[0]-low[0], 5), round(high[2]-low[2], 5), round(high[1]-low[1], 5)],
            'bounds': {'min': [round(low[0], 5), round(low[2], 5), round(-high[1], 5)],
                       'max': [round(high[0], 5), round(high[2], 5), round(-low[1], 5)]},
            'triangles': triangles, 'primitives': len(group.children),
            'materials': sorted({obj.data.materials[0].name for obj in group.children}),
        })
    import sys
    sys.path.insert(0, str(ROOT / 'tools/assets/p11-set-pieces'))
    from normal_atlas import bake_normal_atlas
    normal_bake = bake_normal_atlas(GROUPS, OUT / 'structure-normal.png', size=512)
    bpy.ops.object.select_all(action='DESELECT')
    for group in GROUPS:
        group.select_set(True)
        for obj in group.children:
            obj.select_set(True)
    path = OUT / 'structure.glb'
    bpy.ops.export_scene.gltf(
        filepath=str(path), export_format='GLB', use_selection=True,
        export_yup=True, export_apply=True, export_extras=True,
        export_materials='EXPORT', export_vertex_color='ACTIVE',
        export_all_vertex_colors=False, export_animations=False,
        export_texcoords=True, export_cameras=False, export_lights=False,
    )
    manifest = {
        'name': 'Containment original architectural foundation kit', 'license': 'MIT',
        'author': 'Containment contributors', 'source': str(Path(__file__).relative_to(ROOT)),
        'rebuild': 'blender -b --factory-startup -P tools/assets/e9-ship-kit/structure.py',
        'coordinateSystem': 'glTF Y-up, metres; bottom-centred origins, walls length along local X',
        'description': 'Original broad-cap cutaway bulkheads, closed jambs, threshold and quiet flush deck families.',
        'ao': '12 deterministic BVH hemisphere rays per vertex, 0.28m distance; normalized AO COLOR_0 multiplier',
        'materials': PALETTE, 'models': models,
        'output': {'file': path.name, 'bytes': path.stat().st_size,
                   'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                   'triangles': sum(model['triangles'] for model in models)},
    }
    manifest['normalAtlas'] = normal_bake
    manifest['craft'] = 'P11 single-facet industrial chamfers; sub-centimetre hardware stays crisp; deterministic convex wear and concave grime multiply original vertex AO, excluding emissive/glass/deck finishes.'
    (OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    (OUT / 'LICENSE.txt').write_text((ROOT / 'LICENSE').read_text())
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'structure.blend'))
    print('E9_STRUCTURE_EXPORT ' + json.dumps(manifest['output']))


def render_preview():
    layout = {
        'wall-bulkhead': (0, 2.4, 0), 'wall-bulkhead-low': (0, .7, 0),
        'wall-end-jamb': (2.65, 1.6, 0), 'door-threshold': (0, -.6, 0),
        'deck-ceramic-panel': (-2.5, -3, 0), 'deck-rubber-panel': (0, -3, 0),
        'deck-oxidised-panel': (2.5, -3, 0), 'floor-glass-channel': (0, -4.6, 0),
    }
    for name, position in layout.items():
        bpy.data.objects[name].location = position
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = 1500, 1200
    scene.render.resolution_percentage = 100
    scene.world.color = (.06, .06, .06)
    material = bpy.data.materials.new('PREVIEW ONLY neutral stage')
    material.diffuse_color = (.045, .058, .067, 1)
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.018))
    bpy.context.object.data.materials.append(material)
    for position, power, size in (((3, -5, 8), 1600, 6), ((-6, -1, 4), 1000, 5), ((0, 6, 7), 1600, 5)):
        data = bpy.data.lights.new('PREVIEW ONLY softbox', 'AREA')
        data.energy, data.shape, data.size = power, 'DISK', size
        obj = bpy.data.objects.new(data.name, data)
        bpy.context.collection.objects.link(obj)
        obj.location = position
        obj.rotation_euler = (Vector((0, -.6, .5)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
    data = bpy.data.cameras.new('PREVIEW ONLY camera')
    camera = bpy.data.objects.new(data.name, data)
    bpy.context.collection.objects.link(camera)
    camera.location = (8, -12, 11)
    camera.rotation_euler = (Vector((0, -.7, .4)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
    data.type, data.ortho_scale = 'ORTHO', 11.8
    scene.camera = camera
    scene.render.filepath = str(OUT / 'kit-preview.png')
    bpy.ops.render.render(write_still=True)


wall(1.20, 'wall-bulkhead')
wall(.65, 'wall-bulkhead-low')
jamb()
threshold()
deck_panel('deck-ceramic-panel', 'e9-floor-ceramic', 'ceramic')
deck_panel('deck-rubber-panel', 'e9-floor-rubber', 'rubber')
deck_panel('deck-oxidised-panel', 'e9-floor-oxidised', 'oxidised')
glass_channel()
export_pack()
if '--preview' in sys.argv:
    render_preview()
