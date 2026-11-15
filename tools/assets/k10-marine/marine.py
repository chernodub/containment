"""Original split-crown marine. Blender 5.3; source geometry/texture art is MIT.
Run: blender -b -P tools/assets/k10-marine/marine.py -- --round=4
"""
import bpy, math, sys, json
from mathutils import Vector, Matrix
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from contract import export_marine
ROOT=Path(__file__).resolve().parents[3]
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
ROUND=int(next((a.split('=')[1] for a in args if a.startswith('--round=')),'4'))
BLOCK='--blockout' in args
OUT=ROOT/'artifacts/nextgen/k10-final/turnarounds'
OUT.mkdir(parents=True,exist_ok=True)
BAKES=ROOT/'tools/assets/k10-marine/bakes';BAKES.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(Path(__file__).with_name('marine-contract.glb')))
arm=next(o for o in bpy.data.objects if o.type=='ARMATURE');arm.animation_data_clear()
for p in arm.pose.bones:p.matrix_basis.identity()
S=6.8
# Design space: right +X, forward +Y, up +Z. Source skeleton faces -X.
D=Matrix(((0,-S,0,0),(S,0,0,0),(0,0,S,0),(0,0,0,1)))
Di=D.inverted()
def joint(name):return Di@(arm.matrix_world@arm.data.bones[name].head_local)
def tail(name):return Di@(arm.matrix_world@arm.data.bones[name].tail_local)
PALETTE={'plate':(.57,.65,.65,1),'ivory':(.78,.79,.69,1),'steel':(.23,.31,.34,1),'dark':(.035,.06,.073,1),'rubber':(.055,.078,.085,1),'visor':(.035,.12,.15,1),'light':(.5,.88,1,1),'amber':(.96,.51,.17,1),'ice':(.3,.7,.95,1),'fire':(.98,.27,.065,1),'arc':(.66,.48,.95,1)}
materials={}
for key,color in PALETTE.items():
 m=bpy.data.materials.new('k10-'+key);m.diffuse_color=(.45,.45,.45,1) if BLOCK else color;m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=m.diffuse_color;p.inputs['Metallic'].default_value=.25 if key not in ['rubber','light','amber','ice','fire','arc'] else .05;p.inputs['Roughness'].default_value=.67
 if key in ['light','amber','ice','fire','arc'] and not BLOCK:p.inputs['Emission Color'].default_value=color;p.inputs['Emission Strength'].default_value=.35
 materials[key]=m
parts={k:[] for k in ['body','breacher','cryo','pyro','arc']};current='body'
def finish(o,name,mat,bone,bevel=0):
 o.name=name;o.data.materials.append(materials[mat])
 if bevel:
  b=o.modifiers.new('machined edge radius','BEVEL');b.width=bevel;b.segments=1 if BLOCK or bevel<.013 else 2
  b.affect='EDGES';bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=b.name)
 # Weighted planar normals without rounding broad panels.
 for f in o.data.polygons:f.use_smooth=False
 if bone:
  vg=o.vertex_groups.new(name=bone);vg.add(list(range(len(o.data.vertices))),1,'REPLACE')
 parts[current].append(o);return o
def box(name,p,size,mat='plate',bone='ribs',bevel=.025,rot=None):
 bpy.ops.mesh.primitive_cube_add(size=1,location=p);o=bpy.context.object;o.dimensions=size
 if rot:o.rotation_euler=rot
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 return finish(o,name,mat,bone,min(bevel,min(size)*.3))
def panel(name,p,size,mat='plate',bone='ribs',bevel=.02,taper=.12):
 # Eight-sided plate, tapering toward the bottom rather than a rounded pauldron.
 x,y,z=[v*.5 for v in size];c=min(x,z)*.45
 ring=[(-x+c,-z),(x-c,-z),(x,-z+c),(x,z-c),(x-c,z),(-x+c,z),(-x,z-c),(-x,-z+c)]
 verts=[]
 for yy in [-y,y]:
  for xx,zz in ring:verts.append((xx*(1-taper*(z-zz)/max(z*2,.001)),yy,zz))
 faces=[tuple(range(7,-1,-1)),tuple(range(8,16))]+[(i,(i+1)%8,(i+1)%8+8,i+8) for i in range(8)]
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.location=p
 return finish(o,name,mat,bone,min(bevel,min(size)*.25))
def cyl(name,p,r,depth,mat='steel',bone='ribs',axis=None,vertices=12):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=p);o=bpy.context.object
 if axis:o.rotation_euler=Vector(axis).to_track_quat('Z','Y').to_euler()
 return finish(o,name,mat,bone,.012 if not BLOCK else .005)
def rod(name,a,b,r,mat='steel',bone='ribs',vertices=10):
 a,b=Vector(a),Vector(b);return cyl(name,(a+b)*.5,r,(b-a).length,mat,bone,b-a,vertices)
def ball(name,p,size,mat='rubber',bone='ribs'):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=10,ring_count=6,radius=1,location=p);o=bpy.context.object;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,name,mat,bone)
def hose(name,points,r=.025,mat='dark',bone='ribs'):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=1;c.resolution_u=10
 s=c.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
 for q,p in zip(s.bezier_points,points):q.co=p;q.handle_left_type=q.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False);return finish(o,name,mat,bone)
def cut(o,p,size):
 # Real boolean pockets retain their inner wall and shadow; cutters never export.
 bpy.ops.mesh.primitive_cube_add(size=1,location=p);c=bpy.context.object;c.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 b=o.modifiers.new('recessed service port','BOOLEAN');b.operation='DIFFERENCE';b.object=c;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=b.name);bpy.data.objects.remove(c,do_unlink=True)
def bolts(p,dx,dy,bone='ribs'):
 if BLOCK:return
 for x in [-1,1]:
  for y in [-1,1]:cyl('captive hex fastener',(p[0]+x*dx,p[1]+y*dy,p[2]),.018,.012,'steel',bone,vertices=6)
def limb(name,bone,width,depth,mat='plate'):
 a,b=joint(bone),tail(bone);v=b-a;mid=a+v*.49
 # Flexible pressure limb leaves a distinct articulating gap around rigid shells.
 rod(name+' pressure sleeve',a+v*.03,a+v*.98,width*.73,'rubber',bone,12)
 o=panel(name+' shell',mid,(width*2,depth*2,v.length*.64),mat,bone,.025)
 o.rotation_euler=v.to_track_quat('Z','Y').to_euler()
 for side in [-1,1]:
  seam=box(name+' longitudinal seam',mid+Vector((side*width*.68,depth*.94,0)),(.025,.025,v.length*.45),'dark',bone,.005)
  seam.rotation_euler=o.rotation_euler
 return o
# Understructure: distinct waist articulation, rigid chest shell and webbing.
box('pelvic pressure girdle',(0,.015,1.035),(.36,.30,.26),'rubber','hips',.06)
for x in [-.13,.13]:panel('pelvis wing',(x,.14,1.06),(.16,.11,.23),'steel','hips',.018)
ball('flexible abdomen',(0,.015,1.235),(.215,.15,.21),'rubber','spine')
for z in [1.17,1.22,1.27]:box('segmented waist seal',(0,.16,z),(.26,.028,.018),'steel','spine',.004)
box('chest carrier',(0,0,1.46),(.47,.32,.44),'steel','ribs',.065)
for side in [-1,1]:
 panel('split ceramic chest',(side*.12,.183,1.50),(.22,.09,.35),'ivory','ribs',.025,.18)
 box('chest inset shadow',(side*.12,.236,1.51),(.10,.016,.025),'dark','ribs',.004)
 box('harness rail',(side*.195,.18,1.46),(.035,.07,.39),'dark','ribs',.008,rot=(0,side*.12,0))
box('sternum keel',(0,.255,1.49),(.035,.025,.29),'steel','ribs',.008)
box('friendly chest beacon',(0,.275,1.58),(.026,.014,.048),'light','ribs',.004)
# Common cassette carrier is visibly separated from the pressure shell.
box('cassette carrier',(0,-.202,1.48),(.40,.15,.42),'dark','ribs',.035)
for side in [-1,1]:box('cassette locking rail',(side*.205,-.20,1.48),(.045,.13,.46),'ivory','ribs',.012)
box('cassette top latch',(0,-.27,1.72),(.20,.06,.045),'steel','ribs',.009)
if ROUND>=2 and not BLOCK:
 for side in [-1,1]:
  box('dorsal carrier lock',(side*.19,-.292,1.65),(.055,.035,.095),'steel','ribs',.01)
  box('dorsal locking witness',(side*.19,-.313,1.65),(.021,.011,.05),'light','ribs',.003)
# Neck and split crown: no human face geometry remains.
cyl('neck flex seal',(0,.002,1.73),.105,.13,'rubber','neck',vertices=12)
for side in [-1,1]:panel('collar guard',(side*.145,.01,1.69),(.075,.23,.11),'plate','ribs',.012)
H=joint('head');hz=H.z+.09
panel('helmet lower shell',(0,.018,hz),(.27,.28,.26),'steel','head',.035,.22)
# Split top rails, deliberately different lengths, surrounding a dark crown channel.
for side in [-1,1]:
 panel('split crown rail',(side*.073,-.005 if side<0 else .026,hz+.09),(.125,.29 if side<0 else .24,.14),'ivory','head',.025,.05)
box('crown channel',(0,.015,hz+.169),(.026,.235,.025),'dark','head',.004)
box('offset brow bridge',(-.032,.174,hz+.065),(.28,.075,.065),'plate','head',.014)
panel('visor recess',(0,.183,hz+.004),(.245,.04,.083),'visor','head',.012,0)
box('split optical slit',(-.046,.209,hz+.02),(.13,.014,.024),'light','head',.006)
box('right optical return',(.076,.21,hz-.002),(.027,.016,.052),'light','head',.006)
panel('chin impact wedge',(0,.15,hz-.10),(.19,.10,.08),'plate','head',.015,.2)
for side in [-1,1]:
 cyl('helmet hinge',(side*.154,.008,hz),.043,.025,'dark','head',(1,0,0),12)
 box('helmet hinge keeper',(side*.171,.008,hz),(.024,.063,.035),'steel','head',.007)
# Articulated limbs use the retained skeleton. Plates never bridge elbows or knees.
for suffix in ['R','L']:
 side=1 if suffix=='R' else -1
 limb('upper arm '+suffix,'upper_arm.'+suffix,.105,.11,'steel')
 shoulder=joint('upper_arm.'+suffix)
 shell=panel('layered shoulder '+suffix,shoulder+Vector((side*.02,0,.01)),(.25,.30,.16),'ivory','upper_arm.'+suffix,.025,.12)
 box('shoulder inset '+suffix,shoulder+Vector((side*.02,0,.101)),(.12,.18,.014),'steel','upper_arm.'+suffix,.004)
 if ROUND>=2 and not BLOCK:
  box('shoulder service latch '+suffix,shoulder+Vector((side*.02,-.055,.115)),(.045,.048,.012),'dark','upper_arm.'+suffix,.003)
  # Broad inset nose panel gives the forearm an intentional value boundary.
  a,b=joint('forearm.'+suffix),tail('forearm.'+suffix)
  p=panel('cuff service inset '+suffix,(a+b)*.5+Vector((0,.105,0)),(.115,.025,.14),'dark','forearm.'+suffix,.012,.15)
  p.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
 limb('forearm '+suffix,'forearm.'+suffix,.115,.10,'plate')
 elbow=joint('forearm.'+suffix);ball('elbow fabric '+suffix,elbow,(.093,.09,.105),'rubber','forearm.'+suffix)
 hand=joint('hand.'+suffix);end=tail('hand.'+suffix)
 glove=ball('glove '+suffix,hand+(end-hand)*1.15,(.088,.095,.12),'dark','hand.'+suffix)
 # Finger plates follow actual phalanges, avoiding a floating block grip.
 for finger in ['index','middle','ring','pinky']:
  bn='finger_'+finger+'.01.'+suffix
  a,b=joint(bn),tail(bn);rod('armoured finger '+finger+suffix,a,b,.022,'steel',bn,6)
 limb('thigh '+suffix,'thigh.'+suffix,.105,.12,'steel')
 limb('shin '+suffix,'shin.'+suffix,.105,.11,'plate')
 knee=joint('shin.'+suffix);panel('knee shield '+suffix,knee+Vector((0,.10,0)),(.19,.105,.22),'ivory','shin.'+suffix,.025,.12)
 foot=joint('foot.'+suffix)
 box('boot '+suffix,(foot.x,foot.y+.065,.075),(.20,.32,.15),'dark','foot.'+suffix,.035)
 panel('toe cap '+suffix,(foot.x,foot.y+.16,.13),(.21,.18,.12),'plate','foot.'+suffix,.023,.03)
 box('boot sole '+suffix,(foot.x,foot.y+.06,.022),(.215,.335,.045),'steel','foot.'+suffix,.01)
 # Flexible knee/hip joint blends, rigid plates remain one-bone weighted.
 for bn,other,p in [('thigh.'+suffix,'hips',joint('thigh.'+suffix)),('shin.'+suffix,'thigh.'+suffix,knee)]:
  o=ball('blended pressure joint '+bn,p,(.10,.105,.10),'rubber',bn);o.vertex_groups[bn].add(list(range(len(o.data.vertices))),.55,'REPLACE');o.vertex_groups.new(name=other).add(list(range(len(o.data.vertices))),.45,'REPLACE')
if not BLOCK:
 # Actual shoulder lamp housings and sparse latches, never confetti-like trim.
 for side in [-1,1]:
  p=joint('upper_arm.'+('R' if side>0 else 'L'))
  box('shoulder status bar',p+Vector((0,.125,.05)),(.10,.018,.025),'light','upper_arm.'+('R' if side>0 else 'L'),.004)
 for x in [-.12,.12]:bolts((x,.18,1.685),.065,.028)
# ----- Authored, skinned removable rig modules -----
for rig in ['breacher','cryo','pyro','arc']:
 current=rig
 if rig=='breacher':
  o=box('block cassette',(0,-.30,1.49),(.41,.20,.33),'steel','ribs',.035)
  if not BLOCK:
   for x in [-.115,0,.115]:cut(o,(x,-.405,1.50),(.055,.035,.20))
  for x in [-.12,0,.12]:box('impact cassette energy slot',(x,-.409,1.50),(.027,.015,.13),'amber','ribs',.004)
  p=joint('upper_arm.L');panel('left ram wedge',p+Vector((-.055,-.015,.055)),(.35,.38,.24),'ivory','upper_arm.L',.035,.25)
  for y in [-.11,.07]:rod('impact piston',p+Vector((-.17,y,-.035)),p+Vector((-.17,y,.17)),.035,'steel','upper_arm.L',10)
  panel('ram strike face',p+Vector((-.19,.025,.06)),(.045,.30,.18),'amber','upper_arm.L',.01,0)
  a,b=joint('forearm.L'),tail('forearm.L');panel('reinforced left cuff',(a+b)*.5+Vector((-.05,0,0)),(.24,.23,.24),'ivory','forearm.L',.025,.12)
 elif rig=='cryo':
  for side in [-1,1]:
   p=(side*.175,-.33,1.57);cyl('coolant pressure vessel',p,.105,.58,'plate','ribs',vertices=16)
   for z in [1.31,1.72,1.85]:cyl('tank guard collar',(side*.175,-.33,z),.117,.045,'steel','ribs',vertices=12)
   box('coolant level window',(side*.175,-.438,1.59),(.045,.016,.31),'ice','ribs',.008)
   hose('insulated coolant feed',[(side*.175,-.32,1.88),(side*.28,-.20,1.87),(side*.31,-.08,1.72),(side*.22,.08,1.66)],.026,'dark')
  box('radiator bridge',(0,-.29,1.60),(.15,.20,.38),'dark','ribs',.015)
  for z in [1.44,1.50,1.56,1.62,1.68,1.74]:box('radiator fin',(0,-.32,z),(.20,.27,.018),'steel','ribs',.004)
  for side in [-1,1]:panel('insulated collar',(side*.18,-.02,1.74),(.13,.30,.13),'ivory','ribs',.025,.05)
 elif rig=='pyro':
  for side in [-1,1]:
   box('squat fuel cell',(side*.16,-.34,1.43),(.24,.23,.33),'steel','ribs',.05)
   box('fuel cell clamp',(side*.16,-.469,1.43),(.15,.028,.04),'ivory','ribs',.006)
   axis=(side*.48,-.07,1);stack=cyl('splayed exhaust',(side*.20,-.34,1.77),.079,.36,'dark','ribs',axis,12)
   for z in [1.65,1.72,1.79,1.86]:cyl('exhaust heat fin',(side*.20+(z-1.77)*side*.48,-.34,z),.095,.025,'steel','ribs',axis,12)
   cyl('hot exhaust interior',(side*.282,-.353,1.942),.060,.015,'fire','ribs',axis,12)
  p=joint('upper_arm.R');panel('heat shield shoulder',p+Vector((.07,.015,.03)),(.35,.39,.16),'ivory','upper_arm.R',.03,.18)
  for y in [-.09,0,.09]:box('heat shield vent',p+Vector((.07,y,.119)),(.20,.028,.012),'dark','upper_arm.R',.003)
  for x in [-.10,0,.10]:panel('articulated heat apron',(x,.20,1.03),(.095,.04,.23),'steel','hips',.012,.12)
  hose('fuel supply loop',[(-.17,-.36,1.33),(-.28,-.37,1.19),(-.33,-.08,1.28),(-.25,.03,1.48)],.027)
 else:
  box('capacitor spine',(0,-.31,1.53),(.19,.19,.38),'steel','ribs',.025)
  # Open arcs are authored thick tubes with obvious sky between the yoke and pack.
  for side in [-1,1]:
   points=[(side*.14,-.32,1.36),(side*.31,-.34,1.54),(side*.43,-.31,1.78),(side*.31,-.27,1.95)]
   hose('open induction yoke',points,.046,'steel')
   for n,z in enumerate([1.56,1.67,1.78]):
    x=side*(.32 if n<2 else .33)
    cyl('ceramic coil insulator',(x,-.31,z),.070,.04,'ivory','ribs',vertices=12)
    cyl('coil live ring',(x,-.31,z+.025),.058,.016,'arc','ribs',vertices=12)
   box('capacitor terminal',(side*.31,-.27,1.95),(.09,.095,.08),'arc','ribs',.018)
  for x,z in [(-.055,1.90),(.055,2.0)]:
   rod('antenna finger',(x,-.32,1.66),(x,-.32,z),.018,'dark')
   box('antenna insulator',(x,-.32,z),(.045,.055,.07),'ivory','ribs',.009)
  box('dorsal element core',(0,-.42,1.56),(.064,.016,.24),'arc','ribs',.008)
# Join per variant with material/weights intact, source-coordinate mesh positions.
meshes=[]
for key,objects in parts.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object;o.name='k10-body' if key=='body' else 'k10-rig-'+key
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
 for slot in o.material_slots:
  if slot.material is None:slot.material=materials['dark']
 # Store authored flat zones as loop vertex colors before all materials are unified for export.
 color=o.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
 for f in o.data.polygons:
  rgba=o.data.materials[f.material_index].diffuse_color
  for li in f.loop_indices:color.data[li].color=rgba
 o.data.color_attributes.active_color=color
 meshes.append(o)
# Review renders stay in convenient metric design space. Rigid source armature is hidden.
arm.hide_render=True;arm.hide_viewport=True
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24
scene.world.color=(.12,.12,.12)
scene.render.resolution_x=640;scene.render.resolution_y=640;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
world=scene.world;world.use_nodes=True;world.node_tree.nodes.get('Background').inputs[0].default_value=(.16,.19,.22,1);world.node_tree.nodes.get('Background').inputs[1].default_value=.6
for p,power,size in [((3,4,6),650,5),((-4,-2,3),450,4),((1,-4,5),700,3)]:
 bpy.ops.object.light_add(type='AREA',location=p);l=bpy.context.object;l.data.energy=power;l.data.shape='DISK';l.data.size=size;l.rotation_euler=(Vector((0,0,1))-l.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=2.6
# Contact views are individual native files for easy opening. Same camera and scale for all rigs.
views={'front':(0,5,1.4),'side':(5,0,1.4),'back':(0,-5,1.4),'top':(0,0,7),'gameplay':(3,-4,7)}
for rig in ['breacher','cryo','pyro','arc']:
 for o in meshes:o.hide_render=o.name.startswith('k10-rig-') and o.name!='k10-rig-'+rig
 for view,p in views.items():
  cam.location=Vector(p)+Vector((0,0,.95));cam.rotation_euler=(Vector((0,0,1.03))-cam.location).to_track_quat('-Z','Y').to_euler()
  scene.render.filepath=str(OUT/f'{"blockout" if BLOCK else "round"+str(ROUND)}-{rig}-{view}.png');bpy.ops.render.render(write_still=True)
if BLOCK:
 print('Grey blockout complete');sys.exit(0)
# UVs packed together, not four overlapping atlases. All rig variants share one material.
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.hide_render=False;o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.008);bpy.ops.object.mode_set(mode='OBJECT')
RES=1024
# Bake authored AO, curvature (Cycles pointiness) and bevel-normal into common UV layouts.
images={}
allmats=[m for m in materials.values()]
def target_image(key,color=(0,0,0,1)):
 im=bpy.data.images.new('k10-'+key,width=RES,height=RES,alpha=False);im.generated_color=color
 if key in ['normal','ao','curvature']:im.colorspace_settings.name='Non-Color'
 for m in allmats:
  n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=im;m.node_tree.nodes.active=n
 return im
def save(im,key):
 im.filepath_raw=str(BAKES/f'{key}.png');im.file_format='PNG';im.save();images[key]=im
scene.cycles.samples=12;scene.render.bake.margin=4;scene.render.bake.use_clear=False
im=target_image('ao',(1,1,1,1))
for target in meshes:
 for o in meshes:
  o.select_set(o==target);o.hide_render=o!=target and o.name!='k10-body'
 bpy.context.view_layer.objects.active=target;bpy.ops.object.bake(type='AO')
for o in meshes:o.hide_render=False;o.select_set(True)
save(im,'ao')
# Emission bake preserves only the small authored optic/core zones.
for m in allmats:
 nodes=m.node_tree.nodes;links=m.node_tree.links;p=nodes.get('Principled BSDF');out=nodes.get('Material Output');e=nodes.new('ShaderNodeEmission');strength=p.inputs['Emission Strength'].default_value;e.inputs['Color'].default_value=tuple(v*strength if i<3 else 1 for i,v in enumerate(p.inputs['Emission Color'].default_value));links.new(e.outputs[0],out.inputs['Surface'])
im=target_image('emissive');bpy.ops.object.bake(type='EMIT');save(im,'emissive')
for m in allmats:
 n=m.node_tree.nodes;l=m.node_tree.links;g=n.new('ShaderNodeNewGeometry');e=next(v for v in n if v.type=='EMISSION');l.new(g.outputs['Pointiness'],e.inputs['Color'])
im=target_image('curvature',(.5,.5,.5,1));bpy.ops.object.bake(type='EMIT');save(im,'curvature')
for m in allmats:
 n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF');l.new(p.outputs[0],n.get('Material Output').inputs['Surface']);b=n.new('ShaderNodeBevel');b.inputs['Radius'].default_value=.005;b.samples=4;l.new(b.outputs['Normal'],p.inputs['Normal'])
im=target_image('normal',(.5,.5,1,1));bpy.ops.object.bake(type='NORMAL');save(im,'normal')
# Bake base colours from flat authored zones, AO and a restrained curvature lift.
for m in allmats:
 n=m.node_tree.nodes;l=m.node_tree.links;e=next(v for v in n if v.type=='EMISSION')
 for link in list(e.inputs['Color'].links):l.remove(link)
 col=n.new('ShaderNodeRGB');col.outputs[0].default_value=m.diffuse_color
 ao=n.new('ShaderNodeTexImage');ao.image=images['ao'];ao.image.colorspace_settings.name='Non-Color'
 mix=n.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=.32;l.new(col.outputs[0],mix.inputs[1]);l.new(ao.outputs[0],mix.inputs[2]);l.new(mix.outputs[0],e.inputs['Color']);l.new(e.outputs[0],n.get('Material Output').inputs['Surface'])
im=target_image('basecolor');bpy.ops.object.bake(type='EMIT');save(im,'basecolor')
# Export the geometry in original source coordinates, with no armature alteration.
for o in meshes:
 o.data.transform(D);o.data.update()
 # Basecolor map already contains flat colours; do not multiply them twice.
 for c in o.data.color_attributes.active_color.data:c.color=(1,1,1,1)
mat={'name':'k10-original-cassette-marine','extras':{'k10Original':True},'pbrMetallicRoughness':{'baseColorTexture':{'index':0},'metallicFactor':.18,'roughnessFactor':.72},'normalTexture':{'index':1,'scale':.45},'occlusionTexture':{'index':2,'strength':.55},'emissiveTexture':{'index':3},'emissiveFactor':[.4,.4,.4]}
paths=[BAKES/(k+'.png') for k in ['basecolor','normal','ao','emissive']]
export_marine(meshes,ROOT/'public/assets/models/marine.glb',material=mat,images=paths)
stats={o.name:sum(len(f.vertices)-2 for f in o.data.polygons) for o in meshes}
(BAKES/'stats.json').write_text(json.dumps({'triangles':stats,'atlasSize':RES,'maps':['basecolor','normal','ao','emissive'],'sourceBake':'Cycles AO + pointiness curvature + shader bevel tangent normal; flat-zone albedo'},indent=2))
print('K10 EXPORT',stats)
