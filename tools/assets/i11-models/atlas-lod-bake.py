"""Bake one meshopt LOD atlas from the unchanged textured source surface."""
import bpy, json, sys, math, time, os
from pathlib import Path
start = time.time()
root = Path(sys.argv[sys.argv.index('--') + 1])
data = json.loads((root / 'source.json').read_text())
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 1
scene.render.threads_mode = 'FIXED'
scene.render.threads = int(os.environ.get('PERF13_BAKE_THREADS', '4'))
scene.render.bake.use_selected_to_active = True
scene.render.bake.use_clear = True
scene.render.bake.margin = 12
scene.render.bake.margin_type = 'EXTEND'
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.color_depth = '8'

def mesh(name, indices):
    geometry = bpy.data.meshes.new(name)
    geometry.from_pydata(data['positions'], [], [indices[i:i+3] for i in range(0, len(indices), 3)])
    geometry.update()
    for polygon in geometry.polygons:
        polygon.use_smooth = True
    geometry.normals_split_custom_set_from_vertices(data['normals'])
    result = bpy.data.objects.new(name, geometry)
    scene.collection.objects.link(result)
    return result

high = mesh('authored-source', data['indices'])
uv = high.data.uv_layers.new(name='original')
for loop in high.data.loops:
    source_uv = data['uv'][loop.vertex_index]
    uv.data[loop.index].uv = (source_uv[0], 1.0-source_uv[1])
# Original atlas seams split source vertices. Weld positions only in this
# temporary UV-layout mesh; exported loops keep their ORIGINAL source row.
lookup = {}; welded = []; remap = []
for point in data['positions']:
    key = tuple(point)
    if key not in lookup: lookup[key] = len(welded); welded.append(point)
    remap.append(lookup[key])
low_geometry = bpy.data.meshes.new('atlas-low')
low_geometry.from_pydata(welded, [], [[remap[index] for index in data['lowIndices'][i:i+3]] for i in range(0, len(data['lowIndices']), 3)])
low_geometry.update()
for polygon in low_geometry.polygons: polygon.use_smooth = True
low_geometry.normals_split_custom_set([data['normals'][index] for index in data['lowIndices']])
low = bpy.data.objects.new('atlas-low', low_geometry)
scene.collection.objects.link(low)
low.data.uv_layers.new(name='low-atlas')
bpy.context.view_layer.objects.active = low
low.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=.025, area_weight=0, correct_aspect=True, scale_to_bounds=False)
bpy.ops.object.mode_set(mode='OBJECT')

source_mat = bpy.data.materials.new('authored-surface')
source_mat.use_nodes = True
nodes = source_mat.node_tree.nodes
links = source_mat.node_tree.links
nodes.clear()
output = nodes.new('ShaderNodeOutputMaterial')
principled = nodes.new('ShaderNodeBsdfPrincipled')
links.new(principled.outputs['BSDF'], output.inputs['Surface'])
normal_image = bpy.data.images.load(str(root / 'source-normal.png'))
normal_image.colorspace_settings.name = 'Non-Color'
normal_tex = nodes.new('ShaderNodeTexImage'); normal_tex.image = normal_image
normal = nodes.new('ShaderNodeNormalMap')
normal.inputs['Strength'].default_value = data['normalScale']
links.new(normal_tex.outputs['Color'], normal.inputs['Color'])
links.new(normal.outputs['Normal'], principled.inputs['Normal'])
high.data.materials.append(source_mat)
target_mat = bpy.data.materials.new('bake-target'); target_mat.use_nodes = True
low.data.materials.append(target_mat)
target_node = target_mat.node_tree.nodes.new('ShaderNodeTexImage')
target_mat.node_tree.nodes.active = target_node
bpy.ops.object.select_all(action='DESELECT')
high.select_set(True); low.select_set(True); bpy.context.view_layer.objects.active = low
# Existing geometry is in bind mesh space; use a bounded relative cage.
span = max(max(p[i] for p in data['positions']) - min(p[i] for p in data['positions']) for i in range(3))
scene.render.bake.cage_extrusion = span * .012
scene.render.bake.max_ray_distance = span * .06
metrics = []
for kind in ['base', 'glow', 'normal']:
    image = bpy.data.images.new('low-' + kind, width=512, height=512, alpha=True, float_buffer=False)
    image.generated_color = (.5, .5, 1, 1) if kind == 'normal' else (.05, .02, .01, 1)
    image.colorspace_settings.name = 'Non-Color' if kind == 'normal' else 'sRGB'
    target_node.image = image
    for link in list(output.inputs['Surface'].links): links.remove(link)
    if kind == 'normal':
        links.new(principled.outputs['BSDF'], output.inputs['Surface'])
        scene.render.bake.normal_space = 'TANGENT'
        bake_type = 'NORMAL'
    else:
        tex = nodes.new('ShaderNodeTexImage'); tex.image = bpy.data.images.load(str(root / ('source-' + kind + '.png')))
        emission = nodes.new('ShaderNodeEmission')
        links.new(tex.outputs['Color'], emission.inputs['Color'])
        links.new(emission.outputs['Emission'], output.inputs['Surface'])
        bake_type = 'EMIT'
    at = time.time(); bpy.ops.object.bake(type=bake_type)
    image.filepath_raw = str(root / ('low-' + kind + '.png')); image.file_format = 'PNG'; image.save()
    metrics.append({'kind':kind,'seconds':time.time()-at})
loops = [{'sourceVertex':data['lowIndices'][loop.index], 'uv':[low.data.uv_layers.active.data[loop.index].uv.x, 1.0-low.data.uv_layers.active.data[loop.index].uv.y]} for loop in low.data.loops]
(root / 'bake.json').write_text(json.dumps({'loops':loops, 'triangles':len(low.data.polygons), 'bakes':metrics,'seconds':time.time()-start,'cageExtrusion':scene.render.bake.cage_extrusion,'maxRayDistance':scene.render.bake.max_ray_distance}))
