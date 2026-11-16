"""Bake the K12 close-up source onto the shared 2048² game atlas and export.

Original MIT code (pattern after K10's baker). Normal: selected-to-active from the
high source with matching parts exploded apart so neighbouring plates never
catch each other's rays. Base colour and emission: evaluated directly on the
game surface through the same role shaders in their reduced-wear 'albedo' mode
(flat readable zones, light grime/edge wear). AO: geometry AO on the game mesh,
with the body occluding the active rig. Output: RGB8 PNGs embedded in the GLB.
"""
import math
from pathlib import Path
import bpy
import numpy as np
from mathutils import Vector as V
import materials as M

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'artifacts/nextgen/k12-work/bakes'
SIZE = 2048


def _image(name, colour, data):
    img = bpy.data.images.new(name, SIZE, SIZE, alpha=False, float_buffer=True)
    img.colorspace_settings.name = 'Non-Color' if data else 'sRGB'
    img.pixels.foreach_set(np.tile(np.array(colour, np.float32), SIZE * SIZE))
    return img


def _set_materials(obj, mode, image):
    """Swap every slot for its role's bake shader with an active target image."""
    for i, slot in enumerate(obj.material_slots):
        role = slot.material.get('k12Role', 'graphite') if slot.material else 'graphite'
        mat = M.get(role, mode).copy() if mode != 'normal' else M.get(role, 'render').copy()
        node = mat.node_tree.nodes.new('ShaderNodeTexImage'); node.image = image
        mat.node_tree.nodes.active = node
        slot.material = mat


def bake_and_export(arm, low, high, D):
    from contract import export_marine
    from render_device import choose_render_device
    OUT.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'; choose_render_device(scene)
    scene.cycles.samples = 24
    original = {o: [s.material for s in o.material_slots] for o in low + high}
    vl = bpy.context.view_layer
    # One packed atlas for body and all four rigs.
    bpy.ops.object.select_all(action='DESELECT')
    for o in low:
        o.hide_set(False); o.hide_render = False; o.select_set(True)
        if not o.data.uv_layers:
            o.data.uv_layers.new(name='atlas')
    vl.objects.active = low[0]
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(62), island_margin=.003, area_weight=.6, scale_to_bounds=False)
    bpy.ops.uv.select_all(action='SELECT')
    bpy.ops.uv.pack_islands(rotate=True, scale=True, margin=.003, margin_method='FRACTION', shape_method='CONCAVE')
    bpy.ops.object.mode_set(mode='OBJECT')
    pairs = [(o, next(h for h in high if h.name == o.name + '-high')) for o in low]
    images = {}
    margin = 8

    # --- tangent normals, exploded by part id
    ids = sorted({e.value for o in low + high for e in o.data.attributes['k10_part'].data})
    offsets = {k: V(((i % 16) * 3.0, (i // 16) * 3.0, 0)) for i, k in enumerate(ids)}
    rest = {o: [v.co.copy() for v in o.data.vertices] for o in low + high}

    def explode(on):
        for o in low + high:
            moved = {}
            if on:
                att = o.data.attributes['k10_part'].data
                for p in o.data.polygons:
                    for vi in p.vertices:
                        moved[vi] = offsets[att[p.index].value]
            for v, co in zip(o.data.vertices, rest[o]):
                v.co = co + moved.get(v.index, V())
            o.data.update()
    images['normal'] = img = _image('k12 normal', (.5, .5, 1, 1), True)
    explode(True)
    for lo, hi in pairs:
        for o in scene.objects:
            if o.type == 'MESH':
                o.hide_render = True
        lo.hide_render = hi.hide_render = False
        _set_materials(lo, 'normal', img)
        bpy.ops.object.select_all(action='DESELECT'); hi.select_set(True); lo.select_set(True); vl.objects.active = lo
        print('K12 bake normal', lo.name, flush=True)
        bpy.ops.object.bake(type='NORMAL', use_selected_to_active=True, cage_extrusion=.02, max_ray_distance=.06,
                            margin=margin, use_clear=False, normal_space='TANGENT')
    explode(False)

    # --- AO, base colour and emission directly on the game surface
    body = next(o for o in low if o.name == 'k10-body')
    for kind, mode, fill in [('ao', None, (1, 1, 1, 1)), ('basecolor', 'albedo', (0, 0, 0, 1)), ('emissive', 'emission', (0, 0, 0, 1))]:
        images[kind] = img = _image('k12 ' + kind, fill, kind == 'ao')
        for lo in low:
            for o in scene.objects:
                if o.type == 'MESH':
                    o.hide_render = True
            lo.hide_render = False
            if kind == 'ao':
                body.hide_render = False
            _set_materials(lo, mode or 'albedo', img)
            bpy.ops.object.select_all(action='DESELECT'); lo.select_set(True); vl.objects.active = lo
            print('K12 bake', kind, lo.name, flush=True)
            bpy.ops.object.bake(type='AO' if kind == 'ao' else 'EMIT', use_selected_to_active=False, margin=margin, use_clear=False)
            if kind == 'ao':
                for o in low:
                    o.hide_render = True

    # Gentle AO in albedo keeps contact under plates on the flat game shader.
    def px(image):
        a = np.empty(SIZE * SIZE * 4, np.float32); image.pixels.foreach_get(a); return a.reshape(-1, 4)
    base, ao = px(images['basecolor']), px(images['ao'])[:, :1]
    base[:, :3] = np.clip(base[:, :3] * (.80 + .20 * ao), 0, 1)
    images['basecolor'].pixels.foreach_set(base.ravel())
    paths = {}
    for kind, image in images.items():
        dest = bpy.data.images.new('k12 rgb8 ' + kind, SIZE, SIZE, alpha=False)
        dest.colorspace_settings.name = image.colorspace_settings.name
        dest.pixels.foreach_set(px(image).ravel())
        dest.filepath_raw = str(OUT / f'marine-{kind}.png'); dest.file_format = 'PNG'; dest.save()
        paths[kind] = OUT / f'marine-{kind}.png'
    for o, mats in original.items():
        for slot, m in zip(o.material_slots, mats):
            slot.material = m
    material = {'name': 'k12-hero-marine', 'extras': {'k10Original': True, 'k12': True},
                'pbrMetallicRoughness': {'baseColorTexture': {'index': 0}, 'metallicFactor': .15, 'roughnessFactor': .55},
                'normalTexture': {'index': 1, 'scale': .8}, 'occlusionTexture': {'index': 2, 'strength': .6},
                'emissiveTexture': {'index': 3}, 'emissiveFactor': [1, 1, 1],
                'extensions': {'KHR_materials_emissive_strength': {'emissiveStrength': 4.0}}}
    for o in low:
        o.data.transform(D); o.data.update()
    export_marine(low, ROOT / 'public/assets/models/marine.glb', material=material,
                  images=[paths['basecolor'], paths['normal'], paths['ao'], paths['emissive']])
    for o in low:
        o.data.transform(D.inverted()); o.data.update()
