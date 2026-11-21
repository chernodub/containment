"""TITLE18 cast in the KA12 breach. See docs/nextgen/TITLE18-REPORT.md.
Use --preview --study for a composition study or --actor-plates for delivery.
"""
import sys,math,random
from pathlib import Path
import bpy
from mathutils import Vector as V, Matrix
from bpy_extras.object_utils import world_to_camera_view
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[2]
sys.path.insert(0,str(HERE));from actors import material,area_light
sys.path.insert(0,str(ROOT/'tools/assets/k10-marine'));from render_device import choose_render_device
sys.path.insert(0,str(ROOT/'tools/assets/k12-hero'));from hero import stage_hero
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
ROUND=int(next((a.split('=')[1] for a in args if a.startswith('--round=')),'21'))
OUT=ROOT/f'artifacts/nextgen/ka12-title-review/round-{ROUND}';OUT.mkdir(parents=True,exist_ok=True)
rng=random.Random(1729)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
s=bpy.context.scene;s.render.engine='CYCLES';choose_render_device(s);s.cycles.samples=24 if '--preview' in args else 128;s.cycles.use_denoising=True
s.cycles.volume_bounces=2;s.cycles.adaptive_threshold=.025
s.render.resolution_x=1920 if '--preview' in args else 2560;s.render.resolution_y=s.render.resolution_x*9//16;s.render.resolution_percentage=35 if '--study' in args else 100
s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA'
s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast';s.view_settings.exposure=-1.6
s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.025,.04,.06,1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.006
plates={n:[] for n in ['background','midground','hero','foreground','fog']};hidden=set()
def register(o,p='background'):plates[p].append(o);o['ka12Plate']=p;return o
steel=material('Brushed pressure skin',(.045,.065,.08),.8,.28)
edge=material('Fresh fracture metal',(.24,.27,.29),.85,.24)
dark=material('Unlit structural steel',(.009,.014,.02),.65,.4)
insulation=material('Exposed ochre insulation',(.12,.085,.04),.05,.95)
wire=material('Cable rubber',(.012,.016,.019),.1,.65)
cold=material('Cold practical',(.3,.65,.85),.1,.3,3)
ember=material('Hot wire tips',(1,.22,.025),0,.3,12)

def mesh(name,vs,fs,mat,p='background'):
 d=bpy.data.meshes.new(name);d.from_pydata(vs,[],fs);d.materials.append(mat);o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);return register(o,p)
def box(name,loc,size,mat=steel,p='background',bevel=.015):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
 if bevel:m=o.modifiers.new('Rolled edges','BEVEL');m.width=bevel;m.segments=2;o.modifiers.new('Normals','WEIGHTED_NORMAL')
 return register(o,p)
def tube(name,pts,r=.025,mat=wire,p='background'):
 d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.bevel_depth=r;d.bevel_resolution=2
 spl=d.splines.new('BEZIER');spl.bezier_points.add(len(pts)-1)
 for b,co in zip(spl.bezier_points,pts):b.co=co;b.handle_left_type=b.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.data.materials.append(mat);return register(o,p)
# Compensate for the retained amber key in the close-up paint, preserving wear.
import materials as suit
suit.PALETTE.update(amber=(.88,.72,.012), ceramic=(.30,.56,.85))
objects,meshes,arm=stage_hero('breacher',curl=65)
for o in objects:register(o,'hero')
hidden.update(o for o in objects if o.hide_render)
for o in objects:
 if o.parent not in objects:o.matrix_world=Matrix.Rotation(math.radians(23),4,'Z')@o.matrix_world
for mat in bpy.data.materials:
 if mat.name.startswith('K10-rifle-baked-zones'):
  # A cool mid-grey receiver under the amber key, retaining the KA12 atlas markings.
  tree=mat.node_tree
  bs=tree.nodes.get('Principled BSDF')
  base_color=bs.inputs['Base Color']
  atlas=base_color.links[0].from_socket
  grade=tree.nodes.new('ShaderNodeMixRGB');grade.blend_type='MULTIPLY'
  grade.inputs[0].default_value=1;grade.inputs[2].default_value=(.64,1,1.8,1)
  tree.links.new(atlas,grade.inputs[1]);tree.links.new(grade.outputs[0],base_color)
 if mat.name=='k12-hazard':
  # Clean amber paint; a separate surface-aligned unit stencil is added below.
  n=mat.node_tree.nodes;n.clear();out=n.new('ShaderNodeOutputMaterial');bs=n.new('ShaderNodeBsdfPrincipled');bs.inputs['Base Color'].default_value=(*suit.PALETTE["amber"],1);bs.inputs['Roughness'].default_value=.44
  mat.node_tree.links.new(bs.outputs[0],out.inputs['Surface'])
 if 'visor' in mat.name and mat.use_nodes:
  bs=mat.node_tree.nodes.get('Principled BSDF')
  if bs:bs.inputs['Emission Strength'].default_value=8
# Original hero framing and lighting are retained.
bpy.ops.object.camera_add(location=(2.7,3.1,1.05));cam=bpy.context.object;s.camera=cam
cam.rotation_euler=(V((0,0,1.25))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=44
focus=V((.1,-.08,1.92));bpy.context.view_layer.update()
for axis,target,prop in [(0,.735,'shift_x'),(1,.62,'shift_y')]:
 before=world_to_camera_view(s,cam,focus)[axis];setattr(cam.data,prop,.01);bpy.context.view_layer.update();after=world_to_camera_view(s,cam,focus)[axis];setattr(cam.data,prop,(target-before)*.01/(after-before));bpy.context.view_layer.update()
cam.data.dof.use_dof=True;cam.data.dof.focus_distance=(cam.location-focus).length;cam.data.dof.aperture_fstop=6
right=cam.rotation_euler.to_matrix()@V((1,0,0));right.z=0;right.normalize()
forward=cam.rotation_euler.to_matrix()@V((0,0,-1));forward.z=0;forward.normalize()
# Wall coordinates: x across the wall, y metres into the wreck, z height.
base=cam.location+forward*16;base.z=0
p0=world_to_camera_view(s,cam,base);p1=world_to_camera_view(s,cam,base+right)
base+=right*((.51-p0.x)/(p1.x-p0.x))
def P(x,y,z):return base+(right*x+forward*y+V((0,0,z)))*1.5
def B(name,x,y,z,w,d,h,mat=steel,p='background',bevel=.015):
 o=box(name,P(x,y,z),(w*1.5,d*1.5,h*1.5),mat,p,bevel);o.rotation_euler.z=math.atan2(right.y,right.x);return o
area_light('Hero cool rim',(-1.6,-1.3,3),650,.7,(.64,.87,1),target=(0,0,1.65));area_light('Hero amber key',(2.5,1.2,2.6),240,1.2,(1,.6,.27),target=(0,0,1.6));area_light('Hero face fill',(3,3.3,2),25,2.2,(.38,.66,.8),target=(0,0,1.6))
# Actual aperture: an irregular, thick ring, with no surface across its opening.
N=24;inner=[];outer=[]
for i in range(N):
 a=2*math.pi*i/N;rad=1+.1*math.sin(i*2.4)+.06*math.cos(i*4.3)
 inner.append((1.65*math.cos(a)*rad,1.75+1.65*math.sin(a)*rad))
 dx,dz=math.cos(a),math.sin(a);t=min(16/max(abs(dx),.001),10/max(abs(dz),.001));outer.append((dx*t,1.75+dz*t))
for i in range(N):
 j=(i+1)%N;a,b=inner[i],inner[j];c,d=outer[i],outer[j]
 o=mesh('Ruptured bulkhead sector',[P(c[0],0,c[1]),P(d[0],0,d[1]),P(b[0],0,b[1]),P(a[0],0,a[1])],[(0,1,2,3)],steel)
 so=o.modifiers.new('Pressure skin thickness','SOLIDIFY');so.thickness=.07
 # Folded strip follows its torn edge and curls back into the actual opening.
 if i%3!=0:
  vs=[]
  for k in range(5):
   t=k/4;curl=.45*math.sin(t*math.pi*.8);shrink=1-.23*t
   for x,z in [a,b]:vs.append(P(x*shrink,curl,(z-1.75)*shrink+1.75+.06*math.sin(i)))
  o=mesh('Curled torn plating',vs,[(2*k,2*k+1,2*k+3,2*k+2) for k in range(4)],edge)
  so=o.modifiers.new('Sheet gauge','SOLIDIFY');so.thickness=.035
 for k in range(3):
  f=(k+.5)/3;x=a[0]*(1-f)+b[0]*f;z=a[1]*(1-f)+b[1]*f
  tube('Insulation exposed at fracture',[P(x,.1,z),P(x*.98,.25,z+.035),P(x*.95,.4,z-.04)],.018,insulation)
# Exposed ribs, bent away from the mouth, and a corridor with depth and a wrecked end.
for side in [-1,1]:
 tube('Bent structural rib',[P(side*1.9,-.12,.05),P(side*1.9,-.1,1.0),P(side*2.05,.25,2.25),P(side*1.6,.5,3.65)],.075,edge)
for dep in [2,5,8,12,16]:
 for side in [-1,1]:
  B('Corridor frame upright',side*2,dep,1.8,.13,.16,3.6,dark)
 B('Corridor ceiling crossmember',0,dep,3.55,4.2,.15,.15,edge)
 for side in [-1,1]:B('Receding corridor wall',side*2.2,dep+1.5,1.8,.15,3,3.6,dark)
B('Wet passage floor',0,5,-.10,16,36,.18,dark)
wet=material('Wet floor sheen',(.018,.03,.038),.75,.12)
B('Wet floor reflective skin',0,4,-.006,14,33,.01,wet,bevel=0)
B('Buckled threshold deck',0,-.5,.05,3.2,4,.1,wet)
area_light('Floor breach spill',P(.5,2,.8),320,1,(.45,.35,1),target=P(0,-2,0))
for i in range(9):
 dep=1+i*1.7;B('Floor seam',0,dep,.003,4,.018,.008,edge,bevel=0)
for i in range(15):
 x=rng.uniform(-1.8,1.8);y=rng.uniform(-1,9);o=B('Fallen bent deck plate',x,y,.06,rng.uniform(.15,.55),rng.uniform(.2,.6),.04,steel);o.rotation_euler.rotate_axis('Z',rng.uniform(-1,1));o.rotation_euler.rotate_axis('X',rng.uniform(-.2,.2))
for y in [9,12]:
 o=B('Collapsed rib',.3,y,1.7,3.8,.2,.2,edge);o.rotation_euler.rotate_axis('Y',.5)
# Ragged ends hang from the tear. Small hot tips and sparks are attached to them.
for i,x in enumerate([-.95,.3,1.3]):
 z=2.5+i*.13;end=P(x+.15,-.25,z-.35)
 tube('Severed live cable',[P(x,.2,3.6),P(x-.12,-.05,3.1),end],.025,wire,'midground')
 tube('Live cable tip',[end,end+V((.015,0,-.035))],.016,ember,'midground')
 for k in range(5):
  p=end+right*rng.uniform(-.12,.12)+V((0,0,-rng.uniform(.05,.6)));tube('Cable end spark',[p,p+right*.012+V((0,0,-.025))],.003,ember,'midground')
# Small worn deck stencil on the quiet outer wall.
bpy.ops.object.text_add();sign=bpy.context.object;sign.name='Small bulkhead stencil';sign.data.body='D-07 / PRESSURE';sign.data.size=.075;sign.data.extrude=.001;sign.location=P(-2.5,-.05,1.5)
sign.rotation_euler=Matrix((right,V((0,0,1)),-forward)).transposed().to_euler();sign.data.materials.append(insulation);register(sign)
# Creature staging: their source meshes stay untouched. Presentation materials suppress
# broad shell fill while retaining the authored emission map for caste lanterns.
def brood(file,rank,lantern_gain,x,y,z,height,yaw=0,tilt=0,lean=0):
 before=set(bpy.data.objects)
 bpy.ops.import_scene.gltf(filepath=str(ROOT/f'public/assets/models/plain/{file}.glb'))
 obs=[o for o in bpy.data.objects if o not in before]
 ms=[o for o in obs if o.type=='MESH']
 for o in ms:
  o.hide_render=not o.name.split('.')[0].endswith('-'+rank)
  if o.hide_render:continue
  for mat in o.data.materials:
   nodes=mat.node_tree.nodes
   links=mat.node_tree.links
   bs=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
   # Let only the breach-facing planes carry the family paint. A soft
   # terminator follows the world-space shading normal over each plate.
   albedo=bs.inputs['Base Color'].links[0].from_socket
   normal=nodes.new('ShaderNodeNewGeometry').outputs['Normal']
   incidence=nodes.new('ShaderNodeVectorMath');incidence.operation='DOT_PRODUCT'
   links.new(normal,incidence.inputs[0])
   incidence.inputs[1].default_value=(-right*.77+forward*.16+V((0,0,.65))).normalized()
   terminator=nodes.new('ShaderNodeValToRGB')
   terminator.color_ramp.interpolation='EASE'
   terminator.color_ramp.elements[1].position=.62
   # Wrap the breach light across the banked backs; keep their undersides dark.
   wrap=nodes.new('ShaderNodeMath');wrap.operation='ADD'
   links.new(incidence.outputs['Value'],wrap.inputs[0])
   wrap.inputs[1].default_value={'tyrant':.10,'dretch':.09,'basilisk':.48}[file]
   links.new(wrap.outputs[0],terminator.inputs[0])
   paint=nodes.new('ShaderNodeMixRGB')
   paint.inputs[1].default_value=(.026,.036,.050,1)
   links.new(terminator.outputs[0],paint.inputs[0])
   links.new(albedo,paint.inputs[2]);links.new(paint.outputs[0],bs.inputs['Base Color'])
   bs.inputs['Roughness'].default_value=.52
   bs.inputs['Specular IOR Level'].default_value=.22
   glow=bs.inputs['Emission Color']
   lantern=glow.links[0].from_socket
   # Grade the mapped lantern separately so red and violet survive AgX.
   accent=nodes.new('ShaderNodeVectorMath');accent.operation='MULTIPLY'
   links.new(lantern,accent.inputs[0]);accent.inputs[1].default_value=lantern_gain
   combined=nodes.new('ShaderNodeVectorMath');combined.operation='ADD'
   bounce=nodes.new('ShaderNodeVectorMath');bounce.operation='SCALE'
   links.new(paint.outputs[0],bounce.inputs[0]);bounce.inputs['Scale'].default_value={'tyrant':.85,'dretch':.98,'basilisk':1.18}[file]
   links.new(bounce.outputs[0],combined.inputs[0]);links.new(accent.outputs[0],combined.inputs[1])
   links.new(combined.outputs[0],glow)
   bs.inputs['Emission Strength'].default_value=1
 pts=[o.matrix_world@V(c) for o in ms if not o.hide_render for c in o.bound_box];lo=min(p.z for p in pts);hi=max(p.z for p in pts);cx=(min(p.x for p in pts)+max(p.x for p in pts))/2;cy=(min(p.y for p in pts)+max(p.y for p in pts))/2
 # glTF imports native animal forward along +X. Aim toward camera, slightly across frame.
 angle=math.atan2(-forward.y,-forward.x)+math.radians(yaw)
 mat=Matrix.Translation(P(x,y,z))@Matrix.Rotation(angle,4,'Z')@Matrix.Rotation(math.radians(lean),4,'Y')@Matrix.Rotation(math.radians(tilt),4,'X')@Matrix.Scale(height*1.5/(hi-lo),4)@Matrix.Translation((-cx,-cy,-lo))
 if file=='dretch':
  # Roll away from the lens about the body centre, opening the hooked silhouette.
  pivot=V((cx,cy,(hi+lo)/2))
  center=mat@pivot
  bank=Matrix.Rotation(math.radians(13),4,(center-cam.location).normalized())
  mat=Matrix.Translation(center)@bank@Matrix.Translation(-center)@mat@Matrix.Translation(pivot)@Matrix.Rotation(math.radians(-22),4,'X')@Matrix.Rotation(math.radians(16),4,'Z')@Matrix.Translation(-pivot)
 for o in obs:
  if o.parent not in obs:o.matrix_world=mat@o.matrix_world
  register(o,'midground')
 hidden.update(o for o in obs if o.hide_render)
 return obs
warden=brood('tyrant','boss',(2.2,2.2,2.2),.17,-.40,.18,1.90,-18,lean=20)
# Grazing bounce on the ram mask. Link it to the cast to preserve the wreck lighting.
receivers=bpy.data.collections.new('Brood bounce receivers')
for o in warden:
 if o.type=='MESH' and not o.hide_render:receivers.objects.link(o)
bounce=area_light('Grazing breach rim',P(-1.9,.85,3.1),390,.60,(.94,.91,1),target=P(.2,-.4,1.1))
bounce.light_linking.receiver_collection=receivers
tube('Crawler buckled ceiling support',[P(-.85,.05,3.25),P(-.45,-.85,2.7),P(-.25,-.92,2.18)],.045,edge)
crawler=brood('dretch','base',(5.8,.16,.12),-.46,-.82,2.20,.36,72,66,lean=12)
stalker=brood('basilisk','base',(2.8,.70,8.2),-.98,-.84,1.50,.48,-54,-62,lean=16)
for o in crawler+stalker:
 if o.type=='MESH' and not o.hide_render:receivers.objects.link(o)
# Backlighting makes hard shell rims, while the lit volume separates silhouettes.
area_light('Crawler edge cut',P(-1,1,2.7),450,.45,(.65,.75,1),target=P(-.7,-1,2))
area_light('Breach cold rim',P(.2,3.8,2.2),1300,1.3,(.48,.52,1),target=P(0,-1,1.4))
area_light('Breach white cut',P(-1.6,2.0,2.8),950,.6,(.65,.72,1),target=P(.4,-1,1))
for x,z in [(-.9,2.9),(.9,2.5)]:
 bpy.ops.object.light_add(type='SPOT',location=P(x,7,z));o=bpy.context.object;o.name='Violet shaft through wreck';o.data.energy=1800;o.data.color=(.48,.36,1);o.data.spot_size=.65;o.data.spot_blend=.18;o.rotation_euler=(P(-x*.6,-5,.2)-o.location).to_track_quat('-Z','Y').to_euler()
def volume(name,x,y,z,size,density,p='background',noise=False):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;n.clear();out=n.new('ShaderNodeOutputMaterial');v=n.new('ShaderNodeVolumePrincipled');v.inputs['Density'].default_value=density;v.inputs['Color'].default_value=(.5,.55,.65,1);v.inputs['Anisotropy'].default_value=.45;m.node_tree.links.new(v.outputs['Volume'],out.inputs['Volume'])
 if noise:
  tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=3;mul=n.new('ShaderNodeMath');mul.operation='MULTIPLY';mul.inputs[1].default_value=density;m.node_tree.links.new(tex.outputs['Fac'],mul.inputs[0]);m.node_tree.links.new(mul.outputs[0],v.inputs['Density'])
 o=B(name,x,y,z,*size,m,p,0);o['volume']=True
volume('Violet corridor atmosphere',0,5,1.9,(4.3,20,4),.012)
volume('Ruptured line steam',1.2,-.5,2.9,(.7,2,.8),.09,'fog',True)
# The foreground layer contains grounded debris, never the rejected right-edge tendrils.
B('Near deck fragment',2,-3,.03,.65,.4,.04,dark,'foreground')
# Surface-aligned unit number on the existing posed shoulder, authoring scene only.
bpy.context.view_layer.update()
frame=cam.data.view_frame(scene=s)
# The boss crown covers the tiny emissive region in its atlas. Expose a
# segmented amber organ in the seam down the forehead, seated on the mesh.
warden_skin=next(o for o in warden if o.type=='MESH' and not o.hide_render)
skin=warden_skin.evaluated_get(bpy.context.evaluated_depsgraph_get())
inv=skin.matrix_world.inverted()
organ=material('Warden amber photophores',(1,.22,.009),.0,.43,10.0)
for i in range(9):
 u=(448+i*1.325)/960;v=1-(381-i*1.875)/540
 q=V((min(p.x for p in frame)+u*(max(p.x for p in frame)-min(p.x for p in frame)),min(p.y for p in frame)+v*(max(p.y for p in frame)-min(p.y for p in frame)),frame[0].z))
 direction=cam.matrix_world@q-cam.location
 hit,point,normal,_=skin.ray_cast(inv@cam.location,inv.to_3x3()@direction)
 if hit:
  loc=skin.matrix_world@point
  n=(inv.to_3x3().transposed()@normal).normalized()
  bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,location=loc)
  lobe=bpy.context.object;lobe.name='Forehead lantern rib';lobe.rotation_euler=n.to_track_quat('Z','Y').to_euler()
  lobe.scale=(.061*(1-.15*abs(i-4)),.034,.010);lobe.data.materials.append(organ);register(lobe,'midground')
  if i==4:
   bpy.ops.object.light_add(type='POINT',location=loc+n*.10);spill=bpy.context.object
   spill.name='Amber reflection in crown seam';spill.data.color=(1,.25,.035);spill.data.energy=1.0;spill.data.shadow_soft_size=.07
   spill.light_linking.receiver_collection=receivers
u,v=.825,.565
q=V((min(p.x for p in frame)+(max(p.x for p in frame)-min(p.x for p in frame))*u,min(p.y for p in frame)+(max(p.y for p in frame)-min(p.y for p in frame))*v,frame[0].z))
direction=(cam.matrix_world@q-cam.location).normalized()
hit,point,normal,_,ob,_=s.ray_cast(bpy.context.evaluated_depsgraph_get(),cam.location,direction)
if hit and ob.get('ka12Plate')=='hero':
    ink=material('Clean unit stencil',(.018,.025,.03),.1,.4)
    bpy.ops.object.text_add(location=point+normal*.006);mark=bpy.context.object;mark.name='Shoulder unit 07';mark.data.body='07';mark.data.size=.06;mark.data.align_x='CENTER';mark.data.align_y='CENTER';mark.data.extrude=.0003;mark.data.materials.append(ink)
    tx=(right-normal*right.dot(normal)).normalized();ty=normal.cross(tx).normalized()
    mark.rotation_euler=Matrix((tx,ty,normal)).transposed().to_euler();register(mark,'hero')
for p,items in plates.items():
 for o in items:o['ka12Plate']=p
s.render.film_transparent=False;s.render.filepath=str(OUT/'composition.png')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'stage.blend'))
if '--background-only' in args:
 render_plates=['background']
elif '--midground-only' in args:
 render_plates=['midground']
elif '--actor-plates' in args:
 render_plates=['midground','hero']
else:
 render_plates=list(plates) if '--layers' in args else []
 if '--layers-only' not in args:bpy.ops.render.render(write_still=True)
for plate in render_plates:
  # Pull focus for the breach insert; retain the foreground focus on other layers.
  cam.data.dof.focus_distance=(cam.location-(P(0,-.6,1.6) if plate=='midground' else focus)).length
  cam.data.dof.aperture_fstop=11 if plate=='midground' else 6
  for name,items in plates.items():
   for o in items:
    o.hide_render=o in hidden;o.is_holdout=False
    if plate in ('background','fog'):o.visible_camera=name==plate
    else:o.visible_camera=not o.get('volume',False);o.is_holdout=name!=plate and not o.get('volume',False)
  s.render.film_transparent=plate!='background';s.render.filepath=str(OUT/(plate+'.png'));bpy.ops.render.render(write_still=True)
print('TITLE',ROUND,OUT,flush=True)
