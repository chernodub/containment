"""Original MIT modular ship decks. Blender 5.x / Cycles selected-to-active bakes.
Run: blender -b -P tools/assets/e10-floors/bake.py -- [environment ...]
"""
import bpy, math, random, sys, os, json, hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'public/assets/e10-floors'
NAMES=['cryogenics','habitation','security','cargo','communications','engineering','maintenance','infested','containment','reactor']
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.render.engine='CYCLES'; scene.cycles.samples=8
scene.cycles.bake_type='DIFFUSE'; scene.render.bake.use_pass_direct=False; scene.render.bake.use_pass_indirect=False; scene.render.bake.use_pass_color=True
scene.render.bake.margin=8; scene.render.bake.use_selected_to_active=True; scene.render.bake.cage_extrusion=.45;scene.render.bake.max_ray_distance=.8
scene.world=bpy.data.worlds.new('Deck bake world');scene.world.use_nodes=True
scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(1,1,1,1)
scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=1
sources=[]
def mat(name, color, rough=.8):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough
 return m
paint=mat('Baked neutral painted deck',(.78,.79,.8));edge=mat('Recessed seams',(.29,.32,.34));bolt=mat('Captive brushed bolts',(.57,.6,.61));rubber=mat('Gaskets',(.25,.28,.29));mark=mat('Chipped off-white paint',(.86,.86,.81))
def box(name,x,y,z,w,d,h,m, bevel=.008):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(x,y,z));o=bpy.context.object;o.name=name;o.dimensions=(w,d,h);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 if bevel:
  mod=o.modifiers.new('Manufactured bevel','BEVEL');mod.width=bevel;mod.segments=2
 sources.append(o);return o
def cylinder(x,y,z,r,h):
 bpy.ops.mesh.primitive_cylinder_add(vertices=8,radius=r,depth=h,location=(x,y,z));o=bpy.context.object;o.name='Captive hex fastener';o.data.materials.append(bolt);sources.append(o)
 box('Bolt slot',x,y,z+h/2+.001,r*1.0,.009,.003,edge,.001)
def receiver(name,size=1024):
 bpy.ops.mesh.primitive_plane_add(size=5.6,location=(0,0,-.1));o=bpy.context.object;o.name=name
 m=mat(name+' receiver',(1,1,1));o.data.materials.append(m);return o,m
def bake(o,m,kind,path,size=1024):
 image=bpy.data.images.new(path.stem,width=size,height=size,alpha=False)
 image.colorspace_settings.name='sRGB' if kind=='DIFFUSE' else 'Non-Color'
 node=m.node_tree.nodes.new('ShaderNodeTexImage');node.image=image;m.node_tree.nodes.active=node
 bpy.ops.object.select_all(action='DESELECT')
 for s in sources:s.select_set(True)
 o.select_set(True);bpy.context.view_layer.objects.active=o
 bpy.ops.object.bake(type=kind,normal_space='TANGENT')
 image.filepath_raw=str(path);image.file_format='PNG';image.save();bpy.data.images.remove(image);m.node_tree.nodes.remove(node)
def clear():
 for o in list(bpy.data.objects):bpy.data.objects.remove(o,do_unlink=True)
 sources.clear()
for env in (args or NAMES):
 if env not in NAMES:continue
 clear();rng=random.Random(100+NAMES.index(env));dest=OUT/env;dest.mkdir(parents=True,exist_ok=True)
 # Four 2.8m modular tiles. Continuous perimeter seam and bevel at the repeat.
 for tile in range(4):
  cx=-1.4+(tile%2)*2.8;cy=-1.4+(tile//2)*2.8
  box('Recess bed',cx,cy,-.025,2.8,2.8,.05,edge)
  cols=2 if env in ['cryogenics','communications','maintenance'] else 1
  rows=3 if env=='habitation' else 2 if env in ['cargo','reactor','infested'] else 1
  for row in range(rows):
   for col in range(cols):
    px=cx-1.4+(col+.5)*2.8/cols;py=cy-1.4+(row+.5)*2.8/rows
    w=2.8/cols-.035;d=2.8/rows-.035
    o=box('Bevelled plate variant '+str(tile),px,py,.035,w,d,.07,paint,.016)
    for sx in [-1,1]:
     for sy in [-1,1]:cylinder(px+sx*(w/2-.09),py+sy*(d/2-.09),.083,.025,.017)
  # Distinct fabrication, restrained in mid frequency. Variants retain quiet centers.
  if env in ['security','cargo','engineering','maintenance','reactor'] and tile in [1,3]:
   for ix in range(9):
    for iy in range(2):
     x=cx-1.10+ix*.27;y=cy+(-1 if iy==0 else 1)*1.05
     tread=box('Raised nonslip tread',x,y,.079,.14,.035,.016,bolt,.006);tread.rotation_euler.z=math.pi/4*(1 if ix%2 else -1)
  if tile==2:
   box('Hatch gasket',cx,cy,.073,1.38,1.38,.015,rubber,.04)
   box('Recessed service hatch',cx,cy,.086,1.28,1.28,.02,paint,.04)
   for sx in [-1,1]:
    box('Hatch handle well',cx+sx*.42,cy,.102,.1,.31,.01,edge,.015)
    box('Hatch captive handle',cx+sx*.42,cy,.113,.04,.22,.015,bolt,.007)
  if tile==3 and env not in ['habitation','containment']:
   box('Cable trench cover bed',cx,cy+1,.076,1.9,.35,.012,rubber)
   for n in range(19):box('Drain crossbar',cx-.88+n*.098,cy+1,.095,.035,.31,.025,bolt,.005)
  if env=='containment':
   for sx in [-1,1]:
    o=box('Shield datum kick plate',cx+sx*1.18,cy+1.18,.08,.23,.035,.016,bolt,.005);o.rotation_euler.z=sx*math.pi/4
  if env=='communications':
   for sx in [-1,1]:box('Rack grounding trim',cx+sx*1.28,cy,.078,.035,2.15,.014,bolt,.005)
  # Sparse scuffs; never a photographic noise layer.
  for n in range(9):
   x=cx+rng.uniform(-1.1,1.1);y=cy+rng.uniform(-1.1,1.1)
   o=box('Boot scrape',x,y,.072,.003,rng.uniform(.04,.21),.001,bolt,0);o.rotation_euler.z=rng.uniform(-.2,.2)
 o,m=receiver(env)
 for kind,file in [('DIFFUSE','basecolor'),('NORMAL','normal'),('AO','ao')]:bake(o,m,kind,dest/(file+'.png'))
 # Keep source scene reproducible without shipping .blend files.
 print('E10 baked',env, 'objects',len(sources),flush=True)
# Shared trim and decals are original modelled relief bakes too.
if not args or 'cryogenics' in args or 'shared' in args:
 clear();dest=OUT/'shared';dest.mkdir(parents=True,exist_ok=True)
 box('Trim backing',0,0,0,5.6,5.6,.08,paint)
 for j in range(8):
  y=-2.45+j*.7
  box('Trim recessed course',0,y,.052,5.6,.09,.02,edge)
  box('Kickplate rolled lip',0,y+.09,.082,5.6,.05,.06,bolt)
  for i in range(8):cylinder(-2.45+i*.7,y-.16,.062,.035,.018)
 o,m=receiver('Trim');bake(o,m,'DIFFUSE',dest/'trim-basecolor.png',512);bake(o,m,'NORMAL',dest/'trim-normal.png',512)
 clear()
 # White background encoded as no-op; dark atlas details multiply authored deck paint.
 white=mat('No-op decal background',(1,1,1));ink=mat('Deck marking',(.5,.52,.49));stain=mat('Spill and scorch',(.34,.36,.35));scrape=mat('Wear',(.45,.48,.47))
 box('Atlas background',0,0,0,5.6,5.6,.02,white,0)
 for cell in range(16):
  cx=-2.1+(cell%4)*1.4;cy=-2.1+(cell//4)*1.4;rng=random.Random(700+cell)
  if cell<4:
   for n in range(15):
    x=cx+rng.uniform(-.4,.4);y=cy+rng.uniform(-.4,.4);o=box('Boot tyre wear',x,y,.025,.022,rng.uniform(.05,.24),.01,scrape,0);o.rotation_euler.z=.3
  elif cell<8:
   for n in range(14):
    x=cx+rng.uniform(-.26,.26);y=cy+rng.uniform(-.22,.22)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=6,radius=1,location=(x,y,.028));o=bpy.context.object;o.scale=(rng.uniform(.10,.25),rng.uniform(.07,.18),.004);o.data.materials.append(stain);sources.append(o)
  elif cell<12:
   bpy.ops.object.text_add(location=(cx-.46,cy-.27,.035));o=bpy.context.object;o.data.body=['01','02','03','04'][cell-8];o.data.size=.65;o.data.extrude=.001;o.data.materials.append(ink);bpy.ops.object.convert(target='MESH');sources.append(o)
  else:
   for n in range(4):
    x=cx-.44+n*.27;o=box('Chipped service marking',x,cy,.03,.13,.8,.015,ink,0);o.rotation_euler.z=-.5
   for n in range(30):box('Paint chip',cx+rng.uniform(-.6,.6),cy+rng.uniform(-.5,.5),.045,.025,.04,.003,white,0)
 o,m=receiver('Decals');bake(o,m,'DIFFUSE',dest/'decals.png',1024)
print('E10 floor bakes complete',flush=True)
