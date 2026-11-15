"""Bake original high-detail marine geometry onto a shared, flat-zone atlas.

Run inside Blender. Meshes are in metre design space; each source is named after
its low mesh plus ``-high``. The helper changes low UVs deliberately, but restores
materials, render visibility, selection and render settings after baking.
"""

from pathlib import Path


def bake_character(low_meshes, high_meshes, out_dir, size=2048,
                   cage_extrusion=.03, samples=32):
    """Return five atlas paths and a separate HDR ``emissive_strength`` scalar.

    Normal detail comes from selected-to-active high geometry, never a shader
    bevel. AO uses a .24m geometry AO shader. Curvature uses the high mesh's
    Cycles pointiness. All rig UVs are packed together, but only one source rig
    is visible during a bake; the body also contributes occlusion to rig parts.
    """
    import bpy
    import numpy as np

    lows = [obj for obj in low_meshes if obj.type == 'MESH']
    high_by_name = {obj.name: obj for obj in high_meshes if obj.type == 'MESH'}
    pairs = [(obj, high_by_name[obj.name + '-high']) for obj in lows]
    if not pairs:
        raise ValueError('No low/high mesh pairs were supplied')
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    view_layer = bpy.context.view_layer
    old_engine = scene.render.engine
    old_samples = scene.cycles.samples
    old_device = scene.cycles.device
    old_selection = list(bpy.context.selected_objects)
    old_active = view_layer.objects.active
    old_mode = bpy.context.object.mode if bpy.context.object else 'OBJECT'
    old_visibility = [(obj, obj.hide_render, obj.hide_get()) for obj in scene.objects]
    material_state = {
        obj: (list(obj.data.materials), [p.material_index for p in obj.data.polygons])
        for pair in pairs for obj in pair
    }
    old_bake = {key: getattr(scene.render.bake, key) for key in (
        'use_selected_to_active', 'use_clear', 'margin', 'margin_type',
        'cage_extrusion', 'max_ray_distance', 'use_cage', 'normal_space',
        'normal_r', 'normal_g', 'normal_b')}
    old_image_settings = (scene.render.image_settings.file_format,
                          scene.render.image_settings.color_mode,
                          scene.render.image_settings.color_depth)
    temporary_materials = []
    images = {}
    surrogate_cache = {}

    def material_values(material):
        base, emission, strength = (0.3, 0.35, 0.38, 1), (0, 0, 0, 1), 0.0
        if material:
            base = tuple(material.diffuse_color)
            if material.use_nodes:
                shader = next((node for node in material.node_tree.nodes
                               if node.type == 'BSDF_PRINCIPLED'), None)
                if shader:
                    base = tuple(shader.inputs['Base Color'].default_value)
                    socket = shader.inputs.get('Emission Color') or shader.inputs.get('Emission')
                    if socket:
                        emission = tuple(socket.default_value)
                    strength_socket = shader.inputs.get('Emission Strength')
                    strength = float(strength_socket.default_value) if strength_socket else 1.0
                else:
                    shader = next((node for node in material.node_tree.nodes
                                   if node.type == 'EMISSION'), None)
                    if shader:
                        emission = tuple(shader.inputs['Color'].default_value)
                        strength = float(shader.inputs['Strength'].default_value)
        return base, emission, strength

    emission_max = 1.0
    for _low, high in pairs:
        for material in material_state[high][0]:
            _base, color, strength = material_values(material)
            emission_max = max(emission_max, max(color[:3]) * strength)

    def simple_material(name):
        material = bpy.data.materials.new(name)
        material.use_nodes = True
        material.node_tree.nodes.clear()
        output = material.node_tree.nodes.new('ShaderNodeOutputMaterial')
        temporary_materials.append(material)
        return material, output

    target, target_output = simple_material('K10 temporary bake destination')
    transparent = target.node_tree.nodes.new('ShaderNodeBsdfTransparent')
    target.node_tree.links.new(transparent.outputs[0], target_output.inputs['Surface'])
    target_image = target.node_tree.nodes.new('ShaderNodeTexImage')
    target.node_tree.nodes.active = target_image

    def surrogate(source, kind):
        key = (source, kind)
        if key in surrogate_cache:
            return surrogate_cache[key]
        if kind == 'basecolor' and source and source.use_nodes:
            original = next((n for n in source.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
            if original and original.inputs['Base Color'].is_linked:
                material = source.copy();temporary_materials.append(material)
                nodes, links = material.node_tree.nodes, material.node_tree.links
                original = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')
                colour = original.inputs['Base Color'].links[0].from_socket
                output = next(n for n in nodes if n.type == 'OUTPUT_MATERIAL')
                shader = nodes.new('ShaderNodeEmission');links.new(colour,shader.inputs['Color'])
                links.new(shader.outputs[0],output.inputs['Surface'])
                surrogate_cache[key] = material
                return material
        material, output = simple_material('K10 bake ' + kind)
        nodes, links = material.node_tree.nodes, material.node_tree.links
        base, emission, strength = material_values(source)
        if kind == 'normal':
            shader = nodes.new('ShaderNodeBsdfPrincipled')
            shader.inputs['Base Color'].default_value = (0.5, 0.5, 0.5, 1)
            shader.inputs['Roughness'].default_value = 0.7
        else:
            shader = nodes.new('ShaderNodeEmission')
            if kind == 'basecolor':
                shader.inputs['Color'].default_value = base
            elif kind == 'emissive':
                shader.inputs['Color'].default_value = tuple(
                    value * strength / emission_max for value in emission[:3]) + (1,)
            elif kind == 'ao':
                ao = nodes.new('ShaderNodeAmbientOcclusion')
                ao.samples = max(16, samples)
                ao.inputs['Distance'].default_value = 0.24
                ao.only_local = False
                links.new(ao.outputs['AO'], shader.inputs['Color'])
            elif kind == 'curvature':
                geometry = nodes.new('ShaderNodeNewGeometry')
                links.new(geometry.outputs['Pointiness'], shader.inputs['Color'])
            shader.inputs['Strength'].default_value = 1.0
        links.new(shader.outputs[0], output.inputs['Surface'])
        surrogate_cache[key] = material
        return material

    def replace_materials(obj, materials):
        obj.data.materials.clear()
        for material in materials:
            obj.data.materials.append(material)
        indexes = material_state[obj][1]
        for polygon, index in zip(obj.data.polygons, indexes):
            polygon.material_index = min(index, max(0, len(materials) - 1))

    def isolate(low, high, kind):
        for obj in scene.objects:
            if obj.type in {'MESH', 'CURVE', 'SURFACE', 'META', 'FONT', 'VOLUME'}:
                obj.hide_render = True
        high.hide_render = False
        low.hide_render = False
        # A rig can receive a contact shadow from the body, never another rig.
        if kind == 'ao' and low.name != 'k10-body':
            body = high_by_name.get('k10-body-high')
            if body:
                body.hide_render = False
        bpy.ops.object.select_all(action='DESELECT')
        high.hide_set(False)
        low.hide_set(False)
        high.select_set(True)
        low.select_set(True)
        view_layer.objects.active = low

    try:
        if bpy.context.object and bpy.context.object.mode != 'OBJECT':
            bpy.ops.object.mode_set(mode='OBJECT')
        for obj in lows:
            obj.hide_set(False)
            obj.hide_render = False
        bpy.ops.object.select_all(action='DESELECT')
        for obj in lows:
            obj.select_set(True)
            if not obj.data.uv_layers:
                obj.data.uv_layers.new(name='K10 atlas')
        view_layer.objects.active = lows[0]
        print('K10 bake: unwrap and pack shared low atlas', flush=True)
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=1.151917, island_margin=.004,
                                 area_weight=.6, correct_aspect=True,
                                 scale_to_bounds=False)
        bpy.ops.uv.select_all(action='SELECT')
        bpy.ops.uv.pack_islands(rotate=True, scale=True, margin=.004,
                               margin_method='FRACTION', shape_method='CONCAVE')
        bpy.ops.object.mode_set(mode='OBJECT')
        print('K10 bake: atlas packed', flush=True)
        scene.render.engine = 'CYCLES'
        from render_device import choose_render_device
        choose_render_device(scene)
        scene.cycles.samples = samples
        bake = scene.render.bake
        bake.use_selected_to_active = True
        bake.use_clear = False
        bake.margin = max(4, int(size / 256))
        bake.margin_type = 'EXTEND'
        bake.use_cage = False
        bake.cage_extrusion = cage_extrusion
        bake.max_ray_distance = cage_extrusion * 4
        bake.normal_space = 'TANGENT'
        bake.normal_r, bake.normal_g, bake.normal_b = 'POS_X', 'POS_Y', 'POS_Z'
        for low, _high in pairs:
            replace_materials(low, [target])
        # Explode matching components only during normal projection. Adjacent
        # pressure suit, hinges and plate rims must never hit one another's cage.
        from mathutils import Vector
        all_meshes=[obj for pair in pairs for obj in pair]
        identities=sorted({entry.value for obj in all_meshes for entry in obj.data.attributes['k10_part'].data})
        offsets={key:Vector(((i%12)*2.5,(i//12)*2.5,0)) for i,key in enumerate(identities)}
        rest_positions={obj:[v.co.copy() for v in obj.data.vertices] for obj in all_meshes}
        def explode(enabled):
            for obj in all_meshes:
                vertices={}
                if enabled:
                    attribute=obj.data.attributes['k10_part']
                    for polygon in obj.data.polygons:
                        for index in polygon.vertices:vertices[index]=offsets[attribute.data[polygon.index].value]
                for v,original in zip(obj.data.vertices,rest_positions[obj]):
                    v.co=original+(vertices.get(v.index,Vector()) if enabled else Vector())
                obj.data.update()
            view_layer.update()
        for kind in ('normal', 'ao', 'curvature', 'basecolor', 'emissive'):
            explode(kind=='normal')
            image = bpy.data.images.new('K10 baked ' + kind, width=size, height=size,
                                        alpha=False, float_buffer=True)
            image.colorspace_settings.name = 'sRGB' if kind in {'basecolor', 'emissive'} else 'Non-Color'
            default = (0.5, 0.5, 1, 1) if kind == 'normal' else (
                (1, 1, 1, 1) if kind == 'ao' else (0.5, 0.5, 0.5, 1) if kind == 'curvature' else (0, 0, 0, 1))
            pixels = np.tile(np.array(default, dtype=np.float32), size * size)
            image.pixels.foreach_set(pixels)
            image.update()
            images[kind] = image
            target_image.image = image
            target.node_tree.nodes.active = target_image
            for _low, high in pairs:
                original = material_state[high][0]
                replace_materials(high, [surrogate(material, kind) for material in original]
                                  or [surrogate(None, kind)])
            for low, high in pairs:
                isolate(low, high, kind)
                direct = kind in {'basecolor', 'emissive'}
                if direct:
                    # Semantic paint is evaluated on the actual game surface.
                    # High geometry supplies relief/occlusion, never colour bleed
                    # across closely spaced shell rims and flexible joints.
                    replace_materials(low, [surrogate(m,kind) for m in material_state[low][0]])
                    for material in low.data.materials:
                        destination=material.node_tree.nodes.new('ShaderNodeTexImage')
                        destination.image=image;material.node_tree.nodes.active=destination
                    high.hide_render=True;high.select_set(False)
                print('K10 bake:', kind, low.name, flush=True)
                bpy.ops.object.bake(type='NORMAL' if kind == 'normal' else 'EMIT',
                                    use_selected_to_active=not direct, use_clear=False,
                                    cage_extrusion=cage_extrusion,
                                    max_ray_distance=cage_extrusion * 4,
                                    margin=max(4, int(size / 256)),
                                    normal_space='TANGENT')
            image.update()

        def pixels_of(image):
            pixels = np.empty(size * size * 4, dtype=np.float32)
            image.pixels.foreach_get(pixels)
            return pixels.reshape((-1, 4))

        # Very thin smooth hardware has its cylindrical relief in geometry.
        # A character-scale cage can cross the opposite wall of these tubes.
        # Preserve its true smooth low normals instead of projecting that wall.
        mask=np.zeros((size,size),dtype=bool)
        for low in lows:
            low.data.calc_loop_triangles();uv=low.data.uv_layers.active.data
            relief=low.data.attributes.get('k10_relief')
            if not relief:continue
            for triangle in low.data.loop_triangles:
                if relief.data[triangle.polygon_index].value:continue
                a,b,c=[np.array(uv[i].uv[:])*size for i in triangle.loops]
                xmin=max(0,int(min(a[0],b[0],c[0]))-1);xmax=min(size,int(max(a[0],b[0],c[0]))+2)
                ymin=max(0,int(min(a[1],b[1],c[1]))-1);ymax=min(size,int(max(a[1],b[1],c[1]))+2)
                y,x=np.mgrid[ymin:ymax,xmin:xmax];x=x+.5;y=y+.5
                denominator=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
                if abs(denominator)<1e-8:continue
                u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/denominator
                v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/denominator
                mask[ymin:ymax,xmin:xmax]|=(u>=-.02)&(v>=-.02)&(u+v<=1.02)
        for _ in range(2):
            old=mask.copy();mask[1:]|=old[:-1];mask[:-1]|=old[1:];mask[:,1:]|=old[:,:-1];mask[:,:-1]|=old[:,1:]
        print('K10 smooth hardware normal texels:',int(np.count_nonzero(mask)),flush=True)
        normals=pixels_of(images['normal']);normals[mask.reshape(-1),:3]=(.5,.5,1)
        images['normal'].pixels.foreach_set(normals.reshape(-1));images['normal'].update()

        # Restrained modelled-contact and edge wear remain subordinate to zones.
        base = pixels_of(images['basecolor'])
        ao = pixels_of(images['ao'])[:, :1]
        curvature = pixels_of(images['curvature'])[:, :1]
        wear = np.clip((curvature - .5) * 5, 0, 1) * .035
        base[:, :3] = np.clip(base[:, :3] * (.88 + .12 * ao) + wear, 0, 1)
        images['basecolor'].pixels.foreach_set(base.reshape(-1))
        images['basecolor'].update()
        scene.render.image_settings.file_format = 'PNG'
        scene.render.image_settings.color_mode = 'RGB'
        scene.render.image_settings.color_depth = '8'
        result = {'emissive_strength': emission_max}
        for kind, image in images.items():
            output = out_dir / ('marine-' + kind + '.png')
            # Store RGB8 deliverables. Float bake buffers are authoring data;
            # retaining 16-bit RGBA PNGs quadruples download cost without useful
            # precision for flat-zone game albedo and tangent-space normals.
            delivery=bpy.data.images.new('K10 RGB8 '+kind,width=size,height=size,alpha=False,float_buffer=False)
            delivery.colorspace_settings.name=image.colorspace_settings.name
            delivery.pixels.foreach_set(pixels_of(image).reshape(-1));delivery.update()
            delivery.filepath_raw=str(output);delivery.file_format='PNG';delivery.save()
            bpy.data.images.remove(delivery)
            result[kind] = str(output)
        return result
    finally:
        if 'rest_positions' in locals():
            explode(False)
        if bpy.context.object and bpy.context.object.mode != 'OBJECT':
            bpy.ops.object.mode_set(mode='OBJECT')
        for obj, (materials, indexes) in material_state.items():
            obj.data.materials.clear()
            for material in materials:
                obj.data.materials.append(material)
            for polygon, index in zip(obj.data.polygons, indexes):
                polygon.material_index = index
        for obj, hide_render, hide_view in old_visibility:
            obj.hide_render = hide_render
            obj.hide_set(hide_view)
        scene.render.engine = old_engine
        scene.cycles.samples = old_samples
        scene.cycles.device = old_device
        for key, value in old_bake.items():
            setattr(scene.render.bake, key, value)
        (scene.render.image_settings.file_format,
         scene.render.image_settings.color_mode,
         scene.render.image_settings.color_depth) = old_image_settings
        bpy.ops.object.select_all(action='DESELECT')
        for obj in old_selection:
            obj.select_set(True)
        view_layer.objects.active = old_active
        if old_active and old_mode != 'OBJECT':
            bpy.ops.object.mode_set(mode=old_mode)
        for material in temporary_materials:
            bpy.data.materials.remove(material)
