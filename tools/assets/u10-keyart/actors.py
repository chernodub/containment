"""Read-only K10 import, native grip correction and cinematic posing for U10 renders."""
import ast
import math
from pathlib import Path
import sys
import bpy
from mathutils import Matrix, Quaternion, Vector

ROOT = Path(__file__).resolve().parents[3]
source = ROOT / 'tools/assets/k10-marine/portraits.py'
sys.path.insert(0, str(source.parent))
namespace = {'__file__': str(source), 'ROOT': ROOT}
module = ast.parse(source.read_text())
nodes = [node for node in module.body if isinstance(node, (ast.Import, ast.ImportFrom, ast.FunctionDef)) or (isinstance(node, ast.Assign) and any(isinstance(target, ast.Name) and target.id in ['WEAPONS','ACCENTS'] for target in node.targets))]
exec(compile(ast.Module(body=nodes,type_ignores=[]),str(source),'exec'),namespace)
read_glb, pose_matrices, apply_pose, deformed_points, attach_weapon, area_light = [namespace[name] for name in ['read_glb','pose_matrices','apply_pose','deformed_points','attach_weapon','area_light']]
ACCENTS = namespace['ACCENTS']


def material(name, color, metallic=.35, roughness=.35, emission=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color,1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color,1)
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Emission Color'].default_value = (*color,1)
    shader.inputs['Emission Strength'].default_value = emission
    return mat


def components(obj):
    parents=list(range(len(obj.data.vertices)))
    def find(i):
        while parents[i]!=i:
            parents[i]=parents[parents[i]];i=parents[i]
        return i
    coincident={}
    for vertex in obj.data.vertices:
        key=tuple(round(value,5) for value in vertex.co)
        if key in coincident: parents[find(vertex.index)]=find(coincident[key])
        else: coincident[key]=vertex.index
    for edge in obj.data.edges:
        a,b=map(find,edge.vertices)
        parents[a]=b
    result={}
    for vertex in obj.data.vertices:result.setdefault(find(vertex.index),[]).append(vertex.index)
    return list(result.values())


def import_marine(rig='breacher', cinematic=True):
    previous=set(bpy.data.objects)
    path=ROOT/'public/assets/models/marine.glb'
    document,binary=read_glb(path)
    bpy.ops.import_scene.gltf(filepath=str(path))
    objects=[o for o in bpy.data.objects if o not in previous]
    armature=next(o for o in objects if o.type=='ARMATURE')
    meshes=[o for o in objects if o.type=='MESH']
    for obj in meshes:
        obj.hide_render=obj.name.startswith('k10-rig-') and obj.name!='k10-rig-'+rig
    weapon,clip,fit=namespace['WEAPONS'][rig]
    # A long rifle and its actual support-hand pose give the key art an oblique brace.
    if cinematic:
        namespace['WEAPONS'][rig]=('rifle','rifle_delta',.60640)
        clip='rifle_delta'
    rest=pose_matrices(document,binary)
    posed=pose_matrices(document,binary,clip)
    apply_pose(armature,rest,posed)
    points=deformed_points(meshes)
    low=min(p.z for p in points);factor=2.1/(max(p.z for p in points)-low)
    center=[(min(p[i] for p in points)+max(p[i] for p in points))/2 for i in [0,1]]
    normalization=Matrix.Translation((-center[0]*factor,-center[1]*factor,-low*factor)) @ Matrix.Scale(factor,4)
    roots=[o for o in objects if o.parent not in objects]
    for obj in roots:obj.matrix_world=normalization @ obj.matrix_world
    bpy.context.view_layer.update()
    weapons=attach_weapon(rig,posed['tag_weapon'],normalization)
    carrier=next(o for o in weapons if o.type=='EMPTY' and o.name.startswith('portrait held'))
    if cinematic:
        # The native grip and weapon share one parent; torso intent keeps both hands in place.
        held=carrier.matrix_world.copy()
        tag_before=armature.matrix_world @ armature.pose.bones['tag_weapon'].matrix
        for name,angle,axis in [('ribs',-12,'Y'),('head',-8,'Z')]:
            bone=armature.pose.bones.get(name)
            if bone:
                bone.matrix=bone.matrix @ Matrix.Rotation(math.radians(angle),4,axis)
                bpy.context.view_layer.update()
        tag_after=armature.matrix_world @ armature.pose.bones['tag_weapon'].matrix
        carrier.matrix_world=tag_after @ tag_before.inverted() @ held
        bpy.context.view_layer.update()
    return objects+weapons, meshes, armature


def finish_for_render(objects, meshes, rig):
    """Render-only paint, luminous visor and a subdivided frozen helmet; GLBs stay untouched."""
    import bmesh
    amber=material('U10 clean amber ceramic',(.8,.4,.045),.42,.34)
    visor=material('U10 luminous visor',(.16,.68,.84),.18,.2,4.0)
    crown=material('U10 white cyan crown',(.48,.8,.9),.2,.28,.8)
    body=next(o for o in meshes if o.name=='k10-body')
    groups=components(body)
    for part,mat in [(121,visor),(123,crown),(124,crown),(125,crown)]:
        ids=set(groups[part]);body.data.materials.append(mat);slot=len(body.data.materials)-1
        for face in body.data.polygons:
            if all(i in ids for i in face.vertices):face.material_index=slot
    if rig=='breacher':
        shell=next(o for o in meshes if o.name=='k10-rig-breacher')
        dome_ids=set(i for part in [0,3] for i in components(shell)[part])
        shell.data.materials.append(amber);slot=len(shell.data.materials)-1
        for face in shell.data.polygons:
            if all(i in dome_ids for i in face.vertices):face.material_index=slot
    head_ids=set(i for part in range(120,min(132,len(groups))) for i in groups[part])
    for obj in meshes:
        if obj.hide_render:continue
        evaluated=obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
        obj.data=bpy.data.meshes.new_from_object(evaluated)
        obj.modifiers.clear()
        for face in obj.data.polygons:face.use_smooth=True
    helmet=body.copy();helmet.data=body.data.copy();bpy.context.collection.objects.link(helmet)
    helmet.name='U10 high subdivision helmet'
    for obj,remove in [(body,head_ids),(helmet,set(range(len(helmet.data.vertices)))-head_ids)]:
        bm=bmesh.new();bm.from_mesh(obj.data);bm.verts.ensure_lookup_table()
        bmesh.ops.delete(bm,geom=[v for v in bm.verts if v.index in remove],context='VERTS')
        if obj==helmet:bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0001)
        bm.to_mesh(obj.data);bm.free()
    subdivision=helmet.modifiers.new('Render-only curved crown','SUBSURF');subdivision.levels=2;subdivision.render_levels=2
    objects.append(helmet);meshes.append(helmet)
    bpy.context.view_layer.update()
    if rig=='breacher':
        # A small surface-mounted chevron replaces the baked concentric hazard rings.
        points=[shell.matrix_world @ shell.data.vertices[i].co for i in components(shell)[3]]
        center=sum(points,Vector())/len(points);normal=Vector((1,1,.2)).normalized()
        inverse=shell.matrix_world.inverted()
        hit,point,local_normal,_=shell.ray_cast(inverse @ (center+normal),inverse.to_3x3() @ -normal)
        if hit:
            point=shell.matrix_world @ point;normal=(shell.matrix_world.to_3x3() @ local_normal).normalized()
            right=Vector((0,0,1)).cross(normal).normalized();up=normal.cross(right).normalized()
            coords=[(-.042,.02),(0,-.008),(.042,.02),(.042,.003),(0,-.026),(-.042,.003)]
            mesh=bpy.data.meshes.new('U10 shoulder hazard chevron')
            mesh.from_pydata([point+normal*.004+right*x+up*y for x,y in coords],[],[(0,1,4,5),(1,2,3,4)])
            decal=bpy.data.objects.new('U10 small hazard chevron',mesh);bpy.context.collection.objects.link(decal)
            mesh.materials.append(material('U10 hazard charcoal',(.006,.009,.012),.1,.65));objects.append(decal)
    return helmet
