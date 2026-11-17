"""Original RW12 equipment studies; Blender 5.3, scene-only read-only kit imports."""
import bpy,sys,math,random
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'tools/assets/u10-keyart'))
from actors import material,area_light,components
sys.path.insert(0,str(ROOT/'tools/assets/k10-marine'))
from render_device import choose_render_device
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
family=next((a.split('=')[1] for a in args if a.startswith('--family=')),'cryo')
name=next((a.split('=')[1] for a in args if a.startswith('--id=')),family)
OUT=ROOT/'artifacts/nextgen/rw12-work/rewards';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
s=bpy.context.scene;s.render.engine='CYCLES';choose_render_device(s);s.cycles.samples=48;s.cycles.use_denoising=True
s.render.resolution_x=960;s.render.resolution_y=600;s.render.resolution_percentage=100
s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(.015,.025,.04,1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.18
s.view_settings.view_transform='AgX';s.view_settings.exposure=-.7
colors={'cryo':(.08,.65,1),'pyro':(1,.16,.015),'arc':(.45,.2,1),'kinetic':(1,.5,.07),'acid':(.3,1,.08),'recovery':(.1,1,.65),'universal':(.45,.7,.85)}
c=colors[family];metal=material('machined titanium',(.06,.085,.11),.8,.28);paint=material('ceramic enamel',c,.35,.32);light=material('active core',c,.1,.25,2);rubber=material('insulated grip',(.018,.025,.03),.1,.65)
def cyl(n,loc,r,depth,m):
 bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=r,depth=depth,location=loc);o=bpy.context.object;o.name=n;o.data.materials.append(m);b=o.modifiers.new('Rolled edges','BEVEL');b.width=.025;b.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');return o
def box(n,loc,scale,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=n;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m);b=o.modifiers.new('Machined edges','BEVEL');b.width=.035;b.segments=3;o.modifiers.new('Normals','WEIGHTED_NORMAL');return o
def line(points,r,m):
 d=bpy.data.curves.new('Discharge','CURVE');d.dimensions='3D';d.bevel_depth=r;d.bevel_resolution=3;p=d.splines.new('POLY');p.points.add(len(points)-1)
 for v,co in zip(p.points,points):v.co=(*co,1)
 o=bpy.data.objects.new('Discharge',d);bpy.context.collection.objects.link(o);o.data.materials.append(m)
# A ribbed, serviceable rig power assembly with latches, coolant couplers and core.
cyl('Mounting foot',(0,0,.13),.58,.26,metal)
cyl('Pressure vessel',(0,0,.68),.37,1.0,paint)
for z in [.25,.4,1.0,1.15]:cyl('Lock collar',(0,0,z),.41,.09,metal)
cyl('Core',(0,0,1.3),.29,.3,light)
for i in range(8):
 a=i*math.tau/8;x,y=.44*math.cos(a),.44*math.sin(a)
 box('Cooling spine',(x,y,.7),(.07,.07,.65),metal)
 cyl('Cap bolt',(x,y,1.14),.035,.06,metal)
for side in [-1,1]:
 box('Mounting lug',(side*.6,0,.3),(.25,.35,.18),metal)
 line([(side*.25,.2,1.15),(side*.65,.3,.95),(side*.7,.15,.4)],.045,rubber)
rng=random.Random(sum(map(ord,name)))
if family in ['kinetic','universal']:
 for o in list(bpy.context.scene.objects):
  if o.type in ['MESH','CURVE']:
   o.location.z*=.65;o.scale.z*=.65
if family=='cryo':
 frost=material('Opaque frost deposits',(.48,.78,.9),.02,.68)
 for z in [.27,1.05]:cyl('Frozen collar crust',(0,0,z),.425,.045,frost)
 for i in range(24):
  a=rng.random()*math.tau;r=rng.uniform(.25,.65)
  bpy.ops.mesh.primitive_cone_add(vertices=5,radius1=.07,radius2=0,depth=rng.uniform(.12,.38),location=(math.cos(a)*r,math.sin(a)*r,rng.uniform(.2,1.4)));o=bpy.context.object;o.rotation_euler=(rng.uniform(-.7,.7),rng.uniform(-.7,.7),a);o.data.materials.append(frost)
elif family=='arc':
 for z in [.5,.65,.8,.95]:cyl('Tesla winding',(0,0,z),.53,.045,metal)
 for side in [-1,1]:line([(0,0,1.5),(side*.3,.05,1.8),(side*.15,.1,1.95),(side*.7,.15,2.15),(side*.55,0,2.35)],.018,light)
elif family=='kinetic':
 cyl('Ram piston',(0,0,1.25),.17,.8,metal);cyl('Impact head',(0,0,1.7),.6,.2,paint)
elif family=='pyro':
 for i in range(9):
  a=i*math.tau/9
  bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1,location=(.26*math.cos(a),.26*math.sin(a),1.6+i*.04));o=bpy.context.object;o.scale=(.08,.08,.25+i*.018);o.rotation_euler=(.3*math.cos(a),.3*math.sin(a),a);o.data.materials.append(light)
elif family=='acid':
 for i in range(12):
  bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=rng.uniform(.04,.11),location=(rng.uniform(-.7,.7),rng.uniform(-.4,.4),rng.uniform(1.4,2.2)));bpy.context.object.data.materials.append(light)
elif family=='recovery':
 box('Medical cross upright',(0,-.39,.7),(.12,.04,.45),light);box('Medical cross transverse',(0,-.4,.7),(.4,.04,.12),light)
if name in ['twin-glacier','twin-pylon','napalm-triplet']:
 original=[o for o in bpy.context.scene.objects if o.type in ['MESH','CURVE']]
 scale=.58 if name=='napalm-triplet' else .72
 for o in original:o.location*=scale;o.scale*=scale;o.location.x-=.7
 for index in range(1,3 if name=='napalm-triplet' else 2):
  for o in original:
   copy=o.copy();copy.data=o.data.copy();bpy.context.collection.objects.link(copy);copy.location.x+=index*.7 if name=='napalm-triplet' else 1.4
if name in ['reserve-thruster','slide-loader']:
 for side in [-1,1]:cyl('Vector nozzle',(side*.7,0,.8),.22,.65,metal)
if name in ['afterquake','spreading-nova','forked-overload']:
 for radius in [.8,1.1,1.4]:
  points=[(radius*math.cos(i*math.tau/64),radius*math.sin(i*math.tau/64),.02) for i in range(65)];line(points,.012,light)
if name=='reinforced-bulwark':
 for x in [-.55,0,.55]:
  panel=box('Overlapping shield scale',(x,-.5,1.1),(.57,.12,1.5),paint);panel.rotation_euler.y=-x*.3
if name=='tactical-salvage':
 for i in range(3):cyl('Recovered capacitor',(.65+i*.18,-.35,.3+i*.25),.09,.4,metal)
if name=='drive-dynamo':
 for z in [1.5,1.7,1.9]:cyl('Charge flywheel',(0,0,z),.48,.09,metal)
if name=='slide-loader':
 for i in range(5):cyl('Magazine round',(-.4+i*.2,-.6,.8),.055,.55,metal)
if name=='scorched-fan':
 for i in range(3):
  tube=cyl('Fan injector',((i-1)*.45,-.4,1.5),.13,.5,metal);tube.rotation_euler.y=(i-1)*.4
# Read-only K12 rig hardware gives the field assembly the marine's design language.
rig={'cryo':'cryo','pyro':'pyro','arc':'arc','kinetic':'breacher'}.get(family)
if rig and name!=family:
 before=set(bpy.data.objects)
 bpy.ops.import_scene.gltf(filepath=str(ROOT/'artifacts/nextgen/k12-work/hero/marine-hero.glb'))
 imported=[o for o in bpy.data.objects if o not in before]
 source=next(o for o in imported if o.name.startswith('k10-rig-'+rig+'-high') and o.type=='MESH')
 bpy.context.view_layer.update()
 data=bpy.data.meshes.new_from_object(source.evaluated_get(bpy.context.evaluated_depsgraph_get()))
 hardware=bpy.data.objects.new('Recovered K12 rig module',data);bpy.context.collection.objects.link(hardware)
 parts=components(hardware);keep=max(parts,key=len);allowed=set(keep);verts=[data.vertices[i].co.copy() for i in keep];mapping={old:new for new,old in enumerate(keep)};faces=[tuple(mapping[i] for i in p.vertices) for p in data.polygons if all(i in allowed for i in p.vertices)];clean=bpy.data.meshes.new('Recovered rig housing');clean.from_pydata(verts,[],faces);hardware.data=clean;data=clean;data.materials.append(metal)
 points=[v.co for v in data.vertices];lo=Vector(tuple(min(v[i] for v in points) for i in range(3)));hi=Vector(tuple(max(v[i] for v in points) for i in range(3)))
 center=(lo+hi)/2;scale=.65/max(hi-lo)
 for v in data.vertices:v.co=(v.co-center)*scale
 hardware.location=(.85,.35,.15);hardware.rotation_euler=(.1,.9,-.5)
 for o in imported:bpy.data.objects.remove(o,do_unlink=True)
box('Ground',(0,0,-.08),(200,200,.1),material('Dark ground',(.008,.014,.023),.2,.32))
area_light('Cool rim',(-2,1,3),550,2,(.35,.65,1),target=(0,0,.8));area_light('Warm key',(2,-3,4),700,3,(1,.7,.4),target=(0,0,.8));area_light('Core bounce',(0,-1,2),80,1,c,target=(0,0,.8))
bpy.ops.object.camera_add(location=(3,-5,3.1));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,1.05))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=4.8;s.camera=cam
s.render.image_settings.file_format='PNG';s.render.filepath=str(OUT/f'{name}.png');bpy.ops.render.render(write_still=True)
