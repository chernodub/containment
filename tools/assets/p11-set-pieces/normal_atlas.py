"""Optional P11 selected-to-active tangent-normal atlas baker (original MIT).

Call bake_normal_atlas(groups, output_png) AFTER p11lib.export has merged and
vertex-baked the pack. This mutates only the current authoring scene, retaining
COLOR_0, geometric normals and named finishes. Re-export with export_texcoords=True.
High-resolution bake sources are disposable scene objects, never shipped.
"""
from __future__ import annotations
import json, math, time
from pathlib import Path
import bpy


def bake_normal_atlas(groups, output_png, size=1024, threads=4):
    if size not in (256,512,1024,2048):
        raise ValueError('P11 normal atlas must be a power of two at most2048')
    output_png=Path(output_png);output_png.parent.mkdir(parents=True,exist_ok=True)
    started=time.perf_counter()
    targets=[]
    for group in groups:
        for obj in group.children:
            if obj.type!='MESH': continue
            m=obj.data.materials[0]
            shader=m.node_tree.nodes.get('Principled BSDF')
            # Emission/glass finish zones remain untouched and texture-free.
            emission=shader.inputs.get('Emission Strength')
            if (emission and emission.default_value>0) or m.diffuse_color[3]<1: continue
            targets.append(obj)
    if not targets: raise ValueError('No opaque non-emissive P11 bake targets')
    bpy.ops.object.select_all(action='DESELECT')
    for obj in targets:
        obj.select_set(True)
        if not obj.data.uv_layers: obj.data.uv_layers.new(name='UVMap')
    bpy.context.view_layer.objects.active=targets[0]
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.012,area_weight=.2,correct_aspect=True,scale_to_bounds=False)
    # Multi-object UV packing gives the whole pack ONE non-overlapping atlas.
    bpy.ops.uv.pack_islands(rotate=True,margin=.008)
    bpy.ops.object.mode_set(mode='OBJECT')
    atlas=bpy.data.images.new('P11 baked tangent normals',width=size,height=size,alpha=False)
    atlas.colorspace_settings.name='Non-Color';atlas.generated_color=(.5,.5,1,1)
    atlas.filepath_raw=str(output_png);atlas.file_format='PNG'
    materials={m for o in targets for m in o.data.materials if m is not None}
    for m in materials:
        node=m.node_tree.nodes.new('ShaderNodeTexImage');node.name='P11_NORMAL_ATLAS';node.image=atlas
        m.node_tree.nodes.active=node
    scene=bpy.context.scene
    scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=1
    scene.render.threads_mode='FIXED';scene.render.threads=threads
    scene.render.bake.use_selected_to_active=True;scene.render.bake.use_clear=False
    scene.render.bake.normal_space='TANGENT';scene.render.bake.margin=4
    scene.render.bake.cage_extrusion=.0025;scene.render.bake.max_ray_distance=.025
    records=[]
    for low in targets:
        high=low.copy();high.data=low.data.copy();high.name='P11_BAKE_HIGH_'+low.name
        bpy.context.collection.objects.link(high)
        # Exact source transforms, including group origin and any authored scale.
        high.matrix_world=low.matrix_world.copy()
        role=low.get('role','')
        organic_relief=bool(low.parent and low.parent.get('p11OrganicRelief')) and role=='p11-tint'
        extra_textures=[]
        if organic_relief:
            sub=high.modifiers.new('Disposable dense organic relief source','SUBSURF');sub.subdivision_type='SIMPLE';sub.levels=3
            texture=bpy.data.textures.new('Organic shell growth ridges','WOOD');texture.wood_type='RINGNOISE';texture.noise_scale=.085;texture.turbulence=5
            displace=high.modifiers.new('Narrow raised growth ridges','DISPLACE');displace.texture=texture;displace.strength=.006;displace.mid_level=.5
            pits=bpy.data.textures.new('Organic shallow pits','VORONOI');pits.noise_scale=.04
            pit_mod=high.modifiers.new('Shallow pitted shell surface','DISPLACE');pit_mod.texture=pits;pit_mod.strength=-.0025;pit_mod.mid_level=.5
            extra_textures.append(pits)
        elif role in ('p11-growth','p11-flesh'):
            sub=high.modifiers.new('High sculpt tessellation','SUBSURF');sub.subdivision_type='SIMPLE';sub.levels=1
            texture=bpy.data.textures.new('P11 high sculpt folds','CLOUDS');texture.noise_scale=.12;texture.noise_depth=1
            displace=high.modifiers.new('Sculpted membrane relief','DISPLACE');displace.texture=texture;displace.strength=.002;displace.mid_level=.5
        else:
            texture=None
            bevel=high.modifiers.new('High manufactured edge rounding','BEVEL')
            bevel.width=.012;bevel.segments=3;bevel.limit_method='ANGLE';bevel.angle_limit=math.radians(20)
            bevel.use_clamp_overlap=True;bevel.harden_normals=True
        bpy.ops.object.select_all(action='DESELECT');high.select_set(True);low.select_set(True)
        bpy.context.view_layer.objects.active=low
        print('P11_NORMAL_BAKE '+low.name,flush=True)
        scene.render.bake.cage_extrusion=.0045 if organic_relief else .0025
        bake_started=time.perf_counter()
        bpy.ops.object.bake(type='NORMAL')
        elapsed=time.perf_counter()-bake_started
        records.append({'mesh':low.name,'role':role,'seconds':round(elapsed,3),'method':'dense high organic ridges and pits' if organic_relief else ('sculpted high membrane' if texture else 'three-segment high bevel')})
        mesh=high.data;bpy.data.objects.remove(high,do_unlink=True)
        if mesh.users==0:bpy.data.meshes.remove(mesh)
        if texture:bpy.data.textures.remove(texture)
        for extra in extra_textures:bpy.data.textures.remove(extra)
    atlas.save()
    # Connect only after every target is baked, avoiding a feedback dependency.
    for m in materials:
        nodes=m.node_tree.nodes;normal=nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=1
        m.node_tree.links.new(nodes['P11_NORMAL_ATLAS'].outputs['Color'],normal.inputs['Color'])
        m.node_tree.links.new(normal.outputs['Normal'],nodes['Principled BSDF'].inputs['Normal'])
    pixels=list(atlas.pixels)
    changed=sum(1 for i in range(0,len(pixels),4) if abs(pixels[i]-.5)>.025 or abs(pixels[i+1]-.5)>.025)
    decode_started=time.perf_counter()
    decoded=bpy.data.images.load(str(output_png),check_existing=False)
    decoded.pixels[0]  # Force lazy PNG decode. Local CPU evidence, not browser readiness.
    decode_ms=(time.perf_counter()-decode_started)*1000
    bpy.data.images.remove(decoded)
    result={'bakeSeconds':round(time.perf_counter()-started,3),'blenderPNGDecodeMs':round(decode_ms,3),'file':output_png.name,'size':size,'bytes':output_png.stat().st_size,
            'estimatedRGBA8MipBytes':round(size*size*4*4/3),'nonFlatPixels':changed,
            'method':'selected-to-active tangent normal; disposable geometric high bevel/sculpt sources',
            'targets':records}
    output_png.with_suffix('.json').write_text(json.dumps(result,indent=2)+'\n')
    print('P11_NORMAL_RESULT '+json.dumps(result),flush=True)
    return result
