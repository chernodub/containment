"""M10 Blender authoring helpers and animation-only source-rest packaging.

The exported clips are rebased onto the original GLB's exact node hierarchy and
rest transforms. K10 can therefore reskin the unchanged marine skeleton.
"""
from pathlib import Path
import json
import math
import struct
import bpy
from mathutils import Matrix, Quaternion, Vector

ROOT = Path(__file__).resolve().parents[3]
ASSETS = ROOT / 'public/assets/models'
FAMILIES = {'crawler':'dretch','stalker':'basilisk','spitter':'marauder','carrier':'dragoon','brute':'tyrant'}
_SOURCE = {}


def import_rig(actor):
    return import_existing(ASSETS / (FAMILIES.get(actor,actor) + '.glb'))


def import_existing(path):
    path = Path(path)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action)
    bpy.ops.import_scene.gltf(filepath=str(path))
    arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
    _SOURCE[arm.name] = {'path':path,'actions':{a.name:a for a in bpy.data.actions},'motion':[]}
    arm.animation_data_clear()
    reset_pose(arm)
    bpy.context.view_layer.objects.active = arm
    arm.select_set(True)
    bpy.context.scene.render.fps = 60
    return arm


def reset_pose(arm):
    for bone in arm.pose.bones:
        bone.rotation_mode = 'QUATERNION'
        bone.matrix_basis.identity()
    bpy.context.view_layer.update()


def snapshot_pose(arm):
    return {bone.name:bone.matrix_basis.copy() for bone in arm.pose.bones}


def apply_pose(arm, pose):
    for name, matrix in pose.items():
        arm.pose.bones[name].matrix_basis = matrix
    bpy.context.view_layer.update()


def source_pose(arm, name='stand', upper=None, upper_root='ribs'):
    """Capture source-ready pose without modifying edit bones/rest transforms."""
    saved = _SOURCE[arm.name]['actions']
    reset_pose(arm)
    arm.animation_data_create()
    action = next((a for n,a in saved.items() if n == name or n.endswith('|'+name)),None)
    if action:
        arm.animation_data.action = action
        bpy.context.scene.frame_set(int(action.frame_range[0]))
    pose = snapshot_pose(arm)
    if upper:
        action = next((a for n,a in saved.items() if n == upper or n.endswith('|'+upper)),None)
        if action:
            arm.animation_data.action = action
            bpy.context.scene.frame_set(int(action.frame_range[0]))
            names = {upper_root}
            root = arm.data.bones.get(upper_root)
            if root: names.update(b.name for b in root.children_recursive)
            pose.update({b.name:b.matrix_basis.copy() for b in arm.pose.bones if b.name in names})
    arm.animation_data.action = None
    apply_pose(arm,pose)
    return pose


def new_action(arm,name,seconds,fps=60):
    arm.animation_data_create()
    arm.animation_data.action = None
    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    arm.animation_data.action = action
    scene = bpy.context.scene
    scene.render.fps = fps
    scene.frame_start = 1
    scene.frame_end = 1+round(seconds*fps)
    _SOURCE[arm.name]['motion'].append(name)
    return action


def key_pose(arm,frame,names=None):
    for bone in arm.pose.bones:
        if names is not None and bone.name not in names: continue
        bone.keyframe_insert('location',frame=frame)
        bone.keyframe_insert('rotation_quaternion',frame=frame)
        bone.keyframe_insert('scale',frame=frame)


def bake_action(arm, end_frame=None):
    bpy.ops.object.select_all(action='DESELECT')
    arm.select_set(True)
    bpy.context.view_layer.objects.active=arm
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.select_all(action='SELECT')
    bpy.ops.nla.bake(frame_start=1,frame_end=end_frame or bpy.context.scene.frame_end,
        step=1,only_selected=False,visual_keying=True,clear_constraints=False,
        use_current_action=True,clean_curves=True,bake_types={'POSE'})
    bpy.ops.object.mode_set(mode='OBJECT')


def _read_glb(path):
    data=Path(path).read_bytes(); offset=12; doc=None; binary=b''
    while offset<len(data):
        length,kind=struct.unpack_from('<II',data,offset);offset+=8
        chunk=data[offset:offset+length];offset+=length
        if kind==0x4E4F534A:doc=json.loads(chunk)
        elif kind==0x004E4942:binary=chunk
    return doc,binary


def _matrix(node):
    if 'matrix' in node:
        return Matrix(tuple(tuple(node['matrix'][c*4+r] for c in range(4)) for r in range(4)))
    t=node.get('translation',[0,0,0]);q=node.get('rotation',[0,0,0,1]);s=node.get('scale',[1,1,1])
    return Matrix.LocRotScale(Vector(t),Quaternion((q[3],q[0],q[1],q[2])),Vector(s))


def _hierarchy(nodes):
    parents={child:i for i,node in enumerate(nodes) for child in node.get('children',[])}
    order=[]
    def visit(i):
        if i in order:return
        if i in parents:visit(parents[i])
        order.append(i)
    for i in range(len(nodes)):visit(i)
    worlds={}
    for i in order:worlds[i]=(worlds[parents[i]] if i in parents else Matrix.Identity(4))@_matrix(nodes[i])
    return parents,order,worlds


def _accessor(doc,binary,index):
    a=doc['accessors'][index];view=doc['bufferViews'][a['bufferView']]
    n={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']]
    fmt={5126:'f',5123:'H',5125:'I',5121:'B'}[a['componentType']]
    size=struct.calcsize(fmt)*n; stride=view.get('byteStride',size)
    offset=view.get('byteOffset',0)+a.get('byteOffset',0)
    return [struct.unpack_from('<'+fmt*n,binary,offset+i*stride) for i in range(a['count'])]


def _sample(times,values,time,path):
    if time<=times[0]:return values[0]
    if time>=times[-1]:return values[-1]
    left=0;right=len(times)-1
    while right-left>1:
        mid=(left+right)//2
        if times[mid]<=time:left=mid
        else:right=mid
    mix=(time-times[left])/(times[right]-times[left])
    a,b=values[left],values[right]
    if path=='rotation':
        q=Quaternion((a[3],a[0],a[1],a[2])).slerp(Quaternion((b[3],b[0],b[1],b[2])),mix)
        return (q.x,q.y,q.z,q.w)
    return tuple(x+(y-x)*mix for x,y in zip(a,b))


def rebase_animation_only(source,exported,output,names):
    original,_=_read_glb(source);raw,binary=_read_glb(exported)
    op,order,ow=_hierarchy(original['nodes']);rp,rorder,rw=_hierarchy(raw['nodes'])
    by_name={node.get('name'):i for i,node in enumerate(raw['nodes'])}
    links={i:by_name[node['name']] for i,node in enumerate(original['nodes']) if node.get('name') in by_name}
    # A joint's authored rigid displacement acts on the exact source rest basis.
    basis={i:rw[j].inverted_safe()@ow[i] for i,j in links.items()}
    joints={i for skin in original.get('skins',[]) for i in skin['joints']}
    doc={'asset':{'version':'2.0','generator':'M10 authored Blender motion; original skeleton rest preserved'},
         'scene':original.get('scene',0),'scenes':original['scenes'],
         'nodes':[{k:v for k,v in node.items() if k not in ['mesh','skin','camera','weights','extensions']} for node in original['nodes']],
         'animations':[],'accessors':[],'bufferViews':[],'buffers':[{'byteLength':0}]}
    blob=bytearray()
    def accessor(values,kind):
        while len(blob)%4:blob.append(0)
        offset=len(blob);flat=[v for row in values for v in row]
        blob.extend(struct.pack('<'+'f'*len(flat),*flat))
        view=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(flat)*4})
        result={'bufferView':view,'componentType':5126,'count':len(values),'type':kind}
        if kind=='SCALAR':result.update(min=[min(flat)],max=[max(flat)])
        doc['accessors'].append(result);return len(doc['accessors'])-1
    for animation in raw.get('animations',[]):
        name=animation.get('name','');canonical=next((n for n in names if name==n or name.endswith('|'+n)),None)
        if canonical is None:continue
        channels={};clock=set()
        for channel in animation['channels']:
            sampler=animation['samplers'][channel['sampler']];target=channel['target'];path=target['path']
            times=[r[0] for r in _accessor(raw,binary,sampler['input'])]
            values=_accessor(raw,binary,sampler['output'])
            channels[(target['node'],path)]=(times,values);clock.update(times)
        times=sorted(clock);tracks={i:{'translation':[],'rotation':[],'scale':[]} for i in sorted(joints&links.keys())}
        previous={}
        for time in times:
            posed={}
            for i in rorder:
                node=raw['nodes'][i];m=_matrix(node);t,q,s=m.decompose()
                components={'translation':tuple(t),'rotation':(q.x,q.y,q.z,q.w),'scale':tuple(s)}
                for path in components:
                    if (i,path) in channels:components[path]=_sample(*channels[(i,path)],time,path)
                t=components['translation'];q=components['rotation'];s=components['scale']
                local=Matrix.LocRotScale(Vector(t),Quaternion((q[3],q[0],q[1],q[2])),Vector(s))
                posed[i]=(posed[rp[i]] if i in rp else Matrix.Identity(4))@local
            target_world={}
            for i in order:
                parent=target_world[op[i]] if i in op else Matrix.Identity(4)
                world=posed[links[i]]@basis[i] if i in links else parent@_matrix(original['nodes'][i])
                target_world[i]=world
                if i not in tracks:continue
                t,q,s=(parent.inverted_safe()@world).decompose()
                if i in previous and previous[i].dot(q)<0:q.negate()
                previous[i]=q.copy()
                tracks[i]['translation'].append(tuple(t));tracks[i]['rotation'].append((q.x,q.y,q.z,q.w));tracks[i]['scale'].append(tuple(s))
        time_accessor=accessor([(t-times[0],) for t in times],'SCALAR');anim={'name':canonical,'channels':[],'samplers':[]}
        authored_action=bpy.data.actions.get(canonical)
        marker=authored_action.get('m10_impact_seconds') if authored_action else None
        if marker is not None:anim['extras']={'m10ImpactSeconds':float(marker)}
        for i,paths in tracks.items():
            for path,values in paths.items():
                # Omit genuinely static source channels; shared bones retain exact bind locals.
                if all(max(abs(a-b) for a,b in zip(values[0],row))<1e-6 for row in values[1:]):
                    rest=_matrix(original['nodes'][i]).decompose();expected=tuple(rest[0]) if path=='translation' else (rest[1].x,rest[1].y,rest[1].z,rest[1].w) if path=='rotation' else tuple(rest[2])
                    if max(abs(a-b) for a,b in zip(values[0],expected))<1e-5:continue
                output_accessor=accessor(values,'VEC4' if path=='rotation' else 'VEC3')
                sampler=len(anim['samplers']);anim['samplers'].append({'input':time_accessor,'output':output_accessor,'interpolation':'LINEAR'})
                anim['channels'].append({'sampler':sampler,'target':{'node':i,'path':path}})
        doc['animations'].append(anim)
    doc['buffers'][0]['byteLength']=len(blob)
    metadata=json.dumps(doc,separators=(',',':')).encode();metadata+=b' '*((-len(metadata))%4);blob+=b'\0'*((-len(blob))%4)
    glb=struct.pack('<III',0x46546C67,2,12+8+len(metadata)+8+len(blob))+struct.pack('<II',len(metadata),0x4E4F534A)+metadata+struct.pack('<II',len(blob),0x004E4942)+blob
    Path(output).parent.mkdir(parents=True,exist_ok=True);Path(output).write_bytes(glb)
    print('M10 exported',output,'clips',len(doc['animations']),'bytes',len(glb),flush=True)


def export_motion(arm,output,clip_names=None):
    names=clip_names or _SOURCE[arm.name]['motion'];source=_SOURCE[arm.name]['path']
    arm.animation_data.action=None
    for action in list(bpy.data.actions):
        if action.name not in names:bpy.data.actions.remove(action)
    bpy.ops.object.select_all(action='DESELECT');arm.select_set(True);bpy.context.view_layer.objects.active=arm
    reset_pose(arm)
    raw=Path(output).with_suffix('.blender.glb')
    bpy.ops.export_scene.gltf(filepath=str(raw),export_format='GLB',use_selection=True,
        export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,
        export_frame_range=False,export_anim_slide_to_zero=True,export_skins=True,export_yup=True,
        export_apply=False,export_def_bones=False)
    rebase_animation_only(source,raw,output,names)
    raw.unlink(missing_ok=True)


export_animation_only=export_motion
