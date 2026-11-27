"""Print the shipped caste geometry with its anatomy-cell atlas and a title-sized ink pass."""
import sys
from pathlib import Path
import bpy
import bmesh
from mathutils import Vector, Matrix
import math
import importlib

root = Path(__file__).resolve().parents[3]
sys.path.insert(0,str(root/'tools/assets/k12-hero'))
import ink
sys.path.insert(0,str(root/"tools/assets/k10-marine"))
from render_device import choose_render_device

sys.path.insert(0,str(root/'tools/assets/k11-creatures'))
out = Path(sys.argv[-1])
out.mkdir(parents=True,exist_ok=True)
for name,model,mesh,view,res in [
    ('warden','tyrant','k11-brute-boss',(.52,-1,.32),2400),
    ('crawler','dretch','k11-crawler-base',(.6,-1,.78),1024),
    ('stalker','basilisk','k11-stalker-base',(.55,-1,.65),1024),
]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene=bpy.context.scene
    bpy.ops.import_scene.gltf(filepath=str(root/'public/assets/models'/f'{model}.glb'))
    obj=next(o for o in scene.objects if o.type=='MESH' and o.data.name==mesh)
    for other in scene.objects:
        if other.type=='MESH': other.hide_render=other!=obj
        if other.type=='ARMATURE': other.data.pose_position='REST'
    # The game exports one UV cell per authored anatomical region.
    species=importlib.import_module('brute' if name=='warden' else name)
    cells=dict.fromkeys([*species.BANDS,'eye','gold'])
    anatomy={'chitin':'shell','plate':'shell','flesh':'armour','lead':'bone',
             'bone':'bone','gilt':'bone','edge':'bone','eye':'mark','accent':'mark',
             'organ':'mark','mouth':'mark','sail':'bone','underbody':'shell'}
    roles=[anatomy.get(cell,'armour') for cell in cells]
    ink.PAINT.update(shell=('192029','35404a','535962'),armour=('34292d','683e38','965841'),
                     bone=('635b58','b5aa9c','d2c8b5'))
    ink.LIGHT['mark']='ffad55' if name!='stalker' else '91e7ff'
    if name!='warden': ink.PAINT['armour']=('232833','37404a','586572')
    obj.data.materials.clear()
    for role in roles:
        mat=bpy.data.materials.new(role);mat.use_nodes=True;mat['k12Role']=role
        obj.data.materials.append(mat)
    uv=obj.data.uv_layers.active.data
    for face in obj.data.polygons:
        u,v=uv[face.loop_start].uv
        face.material_index=min(len(roles)-1,int(4*u)+4*int(4*v))
        face.use_smooth=True
    # Weld UV-cell splits before subdivision so bands share the curved skin.
    bm=bmesh.new();bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
    bm.to_mesh(obj.data);bm.free()
    if name=='warden':
        jaw=obj.vertex_groups.get('jaw')
        if jaw:
            verts=[v for v in obj.data.vertices if any(g.group==jaw.index and g.weight>.5 for g in v.groups)]
            if verts:
                world=obj.matrix_world
                pivot=min((world@v.co for v in verts),key=lambda p:p.x)
                for v in verts:
                    v.co=world.inverted()@(pivot+Matrix.Rotation(math.radians(20),3,'Y')@(world@v.co-pivot))
    sub=obj.modifiers.new('Continuous key-art surface','SUBSURF');sub.levels=2;sub.render_levels=2
    points=[obj.matrix_world@v.co for v in obj.data.vertices]
    forward=Vector(view).normalized()
    rotation=(-forward).to_track_quat('-Z','Y')
    right,up=(rotation@Vector(axis) for axis in ((1,0,0),(0,1,0)))
    extents=[(min(p.dot(a) for p in points),max(p.dot(a) for p in points)) for a in (right,up)]
    target=sum((a*((lo+hi)/2) for a,(lo,hi) in zip((right,up),extents)),Vector())
    bpy.ops.object.camera_add(location=target+forward*30)
    cam=bpy.context.object;scene.camera=cam;cam.rotation_euler=rotation.to_euler()
    cam.data.type='ORTHO';cam.data.ortho_scale=max(hi-lo for lo,hi in extents)*1.1
    scene.render.engine='CYCLES';choose_render_device(scene);scene.cycles.samples=4
    scene.render.film_transparent=True;scene.render.resolution_percentage=100
    scene.render.resolution_x=scene.render.resolution_y=res
    ink.draw(scene,[obj],up+forward*.55+right*.25,res,breach=[
        (right+forward*.42-up*.52,.9,'c39857',.39),
        (right+up*.85-forward*.40,.73,'b6dbe6',.65)])
    scene.render.filepath=str(out/f'{name}.png')
    bpy.ops.render.render(write_still=True)
