"""RW12 final uplink: original wreck staging, read-only shipping marine.
blender -b -P tools/assets/rw12-rewards/ending.py -- --round=1 --preview
Final omits --preview; encode with u10-keyart/optimize.py --ending-only.
"""
from pathlib import Path
import sys, math
import bpy
from mathutils import Vector, Matrix
ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'tools/assets/u10-keyart'))
from actors import material, area_light
sys.path.insert(0,str(ROOT/'tools/assets/k12-hero'))
from hero import stage_hero
sys.path.insert(0,str(ROOT/'tools/assets/k10-marine'))
from render_device import choose_render_device
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
round_id=next((a.split('=')[1] for a in args if a.startswith('--round=')),'1')
OUT=ROOT/'artifacts/nextgen/rw12/ending'/('round-'+round_id);OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='CYCLES';choose_render_device(scene)
scene.cycles.samples=32 if '--preview' in args else 128;scene.cycles.use_denoising=True
scene.render.resolution_x=1920;scene.render.resolution_y=1080;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=-.1
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.012,.025,.045,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.12
steel=material('Dead colony hull',(.055,.09,.11),.75,.38)
edge=material('Exposed cut alloy',(.19,.24,.26),.8,.29)
dark=material('Unpowered passenger pods',(.013,.025,.032),.5,.4)
glass=material('Unlit smoky cryopod glass',(.14,.22,.25),.05,.18)
glass.node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value=1
glass.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.55,.65,.7,1)
cyan=material('Last uplink',(.15,.7,1),.15,.25,5)
ember=material('Cooling rupture embers',(1,.13,.018),.1,.6,3)

def box(name,p,s,mat=steel,bevel=.04):
    bpy.ops.mesh.primitive_cube_add(size=1,location=p);o=bpy.context.object;o.name=name;o.dimensions=s
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
    if bevel:
        m=o.modifiers.new('Forged softened arris','BEVEL');m.width=bevel;m.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o

def line(name,a,b,r,mat):
    a,b=Vector(a),Vector(b);bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=r,depth=(b-a).length,location=(a+b)/2)
    o=bpy.context.object;o.name=name;o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();o.data.materials.append(mat);return o

# The deck ends in vacuum: a few broken structures imply the enormous lost vessel.
box('Last exposed cryodeck',(0,0,-.3),(17,12,.5))
for x in [-8,8]:
    for y in [-5,-1,3]:
        rib=box('Snapped pressure frame',(x,y,2.2),(.3,.35,4.5),edge);rib.rotation_euler.y=(.18 if x<0 else -.24)
for y in [-5,-2,1,4]:
    box('Cryodeck channel',(0,y,-.02),(15,.055,.025),edge,.008)
# Huge hull spine, interrupted cabin ribs and jagged torn sheets behind the uplink.
box('Dying vessel spine',(-4,-17,-1),(8,21,2),steel)
for i in range(8):
    y=-8-i*2.6
    box('Receding ship frame',(-4,y,.7),(10,.24,3.1),steel)
    for x in [-8.8,.8]:box('Broken cabin side',(x,y,1.4),(.25,1.8,4-(i%3)*.65),edge)
    for j in range(3):
        shard=box('Ruptured hull sheet',(-7+j*3.2,y,2.3), (2.8,1.5,.09),steel)
        shard.rotation_euler=(.2+i*.11,(-1)**j*.3,.08*i)
    if i<5:
        box('Open orange cooling seam',(-4,y+.2,.2),(4,.08,.12),ember,.01)
        area_light('Fading interior fire '+str(i),(-4,y,1),60,2,(1,.16,.025),target=(-4,y,3))
# No blue status lamps: occupied passenger cradles have gone entirely dark.
for x,y in [(-6,2),(-3.4,2),(-.8,2),(-6,-1),(-3.4,-1)]:
    box('Passenger cradle',(x,y,.32),(1.8,2.65,.7),edge,.18)
    box('Sealed unpowered cryopod',(x,y,.8),(1.55,2.5,.85),dark,.28)
    box('Black passenger viewing window',(x,y,.99),(1.21,1.65,.58),glass,.25)
    for side in [-1,1]:box('Cryopod locking clasp',(x+side*.77,y,.9),(.16,.45,.28),edge,.03)
# Large concave dish, open to the camera and tilted toward the escaping transmission.
center=Vector((4,-.7,3.4));axis=Vector((-.6,-.12,.8)).normalized();rot=Vector((0,0,1)).rotation_difference(axis)
verts=[(0,0,0)];faces=[];rings=12;segments=96;radius=2.7
for ring in range(1,rings+1):
    r=radius*ring/rings
    for j in range(segments):
        angle=j*math.tau/segments;verts.append((r*math.cos(angle),r*math.sin(angle),.17*r*r))
for j in range(segments):faces.append((0,1+j,1+(j+1)%segments))
for ring in range(1,rings):
    for j in range(segments):
        a=1+(ring-1)*segments+j;b=1+(ring-1)*segments+(j+1)%segments;c=b+segments;d=a+segments;faces.append((a,b,c,d))
mesh=bpy.data.meshes.new('Parabolic uplink reflector');mesh.from_pydata(verts,[],faces);mesh.materials.append(edge)
dish=bpy.data.objects.new('Last transmission dish',mesh);bpy.context.collection.objects.link(dish);dish.location=center;dish.rotation_mode='QUATERNION';dish.rotation_quaternion=rot
for f in mesh.polygons:f.use_smooth=True
line('Dish pedestal',(4,-.7,0),center,.25,steel)
feed=center+axis*1.7
for angle in [0,math.tau/3,math.tau*2/3]:
    rim=center+rot@Vector((2.55*math.cos(angle),2.55*math.sin(angle),1.1));line('Receiver support',rim,feed,.045,steel)
line('Uplink receiver',feed-axis*.15,feed+axis*.3,.13,cyan)
# Deliberate thin transmission line reaches beyond the abandoned ship.
line('Warning escaping into space',feed+axis*.3,feed+axis*37,.024,cyan)
box('Final transmission console',(1.4,-.4,.7),(1,.65,1.4),dark)
console=box('Last console light',(1.4,-.4,1.43),(.85,.5,.035),cyan,.01);console.rotation_euler.x=.15
# Render-only pose; the native shipping asset and its generator are untouched.
objects,meshes,armature=stage_hero('breacher',brace=False,curl=8)
for o in objects:
    if o.name.startswith('portrait held'):
        o.hide_render=True
        for child in o.children_recursive:child.hide_render=True
# Retain the source's validated pose: the console conceals the lowered final gloves.
# A seated rest reset cannot safely reuse the source clip's skin correction matrices.
bone=armature.pose.bones.get('head')
if bone:bone.matrix=bone.matrix@Matrix.Rotation(math.radians(-15),4,'Y')
bpy.context.view_layer.update()
transform=Matrix.Translation((1.3,-.9,0))@Matrix.Rotation(math.radians(165),4,'Z')@Matrix.Scale(.8,4)
for o in objects:
    if o.parent not in objects:o.matrix_world=transform@o.matrix_world
box('Console conceals final hands',(1.4,-.1,.65),(1.2,.85,1.1),dark)
box('Console final control face',(1.4,-.1,1.22),(1.1,.75,.035),cyan,.01)
# Replace the clean slab and rails with fractured plates and torn deck lips.
for o in list(bpy.data.objects):
    if o.name.startswith(('Last exposed cryodeck','Snapped pressure frame','Cryodeck channel','Receding ship frame','Broken cabin side','Ruptured hull sheet','Dying vessel spine')):
        bpy.data.objects.remove(o,do_unlink=True)
def sheet(name,points,mat=steel):
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(points,[],[tuple(range(len(points)))]);mesh.materials.append(mat)
    ob=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(ob)
    solid=ob.modifiers.new('Torn plate thickness','SOLIDIFY');solid.thickness=.12;return ob
sheet('Irregular broken cryodeck',[(-8,5,-.06),(8,5,-.06),(8,-1,-.06),(6,-1.7,-.06),(6.7,-3,-.06),(3.7,-4,-.06),(1.4,-3,-.06),(-1,-4.5,-.06),(-3,-3.6,-.06),(-5,-4.2,-.06),(-7.7,-2.5,-.06)])
for i in range(11):
    x=-7+i*1.35;y=-3.3+.6*math.sin(i*2.1)
    sheet('Torn jagged deck lip',[(x,y,0),(x+.7,y-.3,.18),(x+.9,y-.5,-.8),(x+.35,y-.55,-.45)],edge)
    line('Exposed deck wiring',(x,y,-.2),(x+.3,y-.9,-1.3),.025,dark)
# Disconnected ship crosssections, visibly split apart in vacuum.
for i in range(4):
    x=-4-i*1.7;y=-9-i*5.5;z=.2+i*.8
    box('Separated hull section spine',(x,y,z),(8,3,1.3),steel)
    for j in range(7):
        angle=j*math.pi/6
        p=(x+4.6*math.cos(angle),y,z+4.6*math.sin(angle))
        q=(x+4.6*math.cos(angle+.35),y,z+4.6*math.sin(angle+.35))
        line('Broken exposed pressure rib',p,q,.14,edge)
        if j%2==0:
            sheet('Jagged floating hull fragment',[(p[0],y,z+p[2]*.45),(p[0]+1.4,y-2,z+p[2]*.45+.5),(p[0]+.8,y-.8,z+p[2]*.45+1.6),(p[0]-.3,y+1,z+p[2]*.45+.8)])
    for j in range(5):
        xx=x-3+j*1.4
        line('Severed amber conduit',(xx,y+1.6,z+.7),(xx+.3,y+2.2,z+1.6),.035,ember)
        line('Dangling severed cable',(xx,y+1.4,z+.5),(xx-.3,y+2.8,z-1.5),.025,dark)
for ob in list(bpy.data.objects):
    if ob.name.startswith(('Separated hull section spine','Broken exposed pressure rib','Jagged floating hull fragment','Severed amber conduit','Open orange cooling seam')):bpy.data.objects.remove(ob,do_unlink=True)
# Two broken cylindrical pressure hulls retain the unmistakable colony-ship silhouette.
def fuselage(name,x,y,z,length,radius):
    segments=48;verts=[];faces=[]
    for end in [0,1]:
        for j in range(segments):
            angle=j*math.tau/segments
            tear=.4*math.sin(angle*3)+.16*math.cos(angle*5)
            rr=radius*(1+.045*math.sin(angle*3)+.025*math.cos(angle*2))
            verts.append((x+rr*math.cos(angle),y-end*length+tear,z+rr*math.sin(angle)))
    for j in range(segments):faces.append((j,(j+1)%segments,(j+1)%segments+segments,j+segments))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.materials.append(steel)
    ob=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(ob);ob.modifiers.new('Hull thickness','SOLIDIFY').thickness=.17
    for k in range(1,int(length/3)):
        yy=y-k*3
        # Flat attached pressure panels and tiny unlit cabin windows interrupt the tube.
        for sign in [-1,1]:
            panel=box('Angular vessel outer armor',(x+sign*radius*.78,yy,z+radius*.35),(1.0,2.7,.55),steel,.04);panel.rotation_euler.y=sign*.6
            box('Unpowered colony cabin windows',(x+sign*radius*.91,yy,z+.4),(.09,1.3,.23),glass,.02)
    for sign in [-1,1]:
        xx=x+sign*radius*.85
        line('Attached engine nacelle',(xx,y-length*.65,z-.7),(xx,y-length*1.05,z-.7),.53,steel)
        line('Dead engine aperture',(xx,y-length*1.02,z-.7),(xx,y-length*1.09,z-.7),.39,dark)
        for k in range(5):
            yy=y-length*.65-k*length*.08
            line('Engine nacelle segmented band',(xx,yy-.04,z-.7),(xx,yy+.04,z-.7),.56,edge)
        for k in range(6):
            yy=y-1-k*1.4
            for j in range(14):
                angle=j*math.tau/14;aa=angle+.17
                line('Curved exterior panel seams',(x+(radius+.015)*math.cos(angle),yy,z+(radius+.015)*math.sin(angle)),(x+(radius+.015)*math.cos(aa),yy,z+(radius+.015)*math.sin(aa)),.012,dark)
    # Warm interior cross decks, with an open broken mouth toward the viewer.
    for zz in [-.8,.8]:box('Visible lost passenger deck',(x,y-.5,z+zz),(radius*1.7,.15,.12),edge)
    area_light('Amber dying hull interior',(x,y-1,z),700,4,(1,.3,.08),target=(x,y+2,z))
    for j in range(13):
        xx=x+math.sin(j*2.3)*radius*.8;zz=z+math.cos(j*1.7)*radius*.8
        line('Small dying embers',(xx,y+.2,zz),(xx+.035,y+.2,zz+.04),.018,ember)
fuselage('Forward severed colony fuselage',-5,-11,2,10,2.4)
before_wreck=set(bpy.data.objects)
fuselage('Detached aft colony fuselage',-8,-26,3.2,9,2.1)
for ob in set(bpy.data.objects)-before_wreck:
    pivot=Vector((-8,-26,3.2));m=Matrix.Translation(pivot)@Matrix.Rotation(math.radians(-28),4,'Z')@Matrix.Translation(-pivot);ob.matrix_world=m@ob.matrix_world
area_light('Wreck amber bounce',(-2,-9,7),650,8,(1,.42,.17),target=(-5,-10,2))
# Long capsule windows and head pillows make the passenger scale explicit.
for i,(x,y) in enumerate([(-6,2),(-3.4,2),(-.8,2),(-6,-1),(-3.4,-1)]):
    for o in list(bpy.data.objects):
        if o.name.startswith(('Passenger cradle','Sealed unpowered cryopod','Black passenger viewing window','Cryopod locking clasp')) and abs(o.location.x-x)<1 and abs(o.location.y-y)<.2:bpy.data.objects.remove(o,do_unlink=True)
    box('Human length cryogenic capsule',(x,y,.45),(1.25,3.15,.85),edge,.38)
    box('Passenger liner',(x,y,.75),(.87,2.5,.13),dark,.2)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=(x,y+.75,.87));occupant=bpy.context.object;occupant.name='Unmoving passenger head';occupant.scale=(.20,.25,.15);occupant.data.materials.append(edge)
    shroud=material('Passenger shroud '+str(i),(.09,.12,.13),0,.8,.16)
    box('Unmoving passenger shroud',(x,y-.25,.85),(.63,1.5,.18),shroud,.18)
    canopy=box('Long dark passenger canopy',(x,y,1.01),(.88,2.45,.10),glass,.28)
    canopy.hide_render=False
    # The raised dark perimeter frames the unlit passenger well.
    for side in [-1,1]:box('Cryopod canopy frame',(x+side*.5,y,.98),(.08,2.55,.12),steel,.03)
    box('Inactive vital readout',(x+.4,y-.95,1.06),(.18,.38,.025),dark,.01)
    for yy in [-1.35,1.35]:box('Capsule seal',(x,y+yy,.75),(1.24,.12,.16),steel,.04)
    bpy.ops.object.text_add(location=(x-.3,y-1.4,.99));label=bpy.context.object;label.name='Passenger pod serial';label.data.body='CRYO / '+str(814+i);label.data.size=.10;label.data.materials.append(edge)
# Near broken conduit creates a dark foreground depth plane across the cropped deck.
line('Foreground severed conduit',(-7,4.7,.18),(-1,4.2,.22),.12,dark)
line('Foreground conduit torn end',(-1,4.2,.22),(.15,3.6,.42),.12,dark)
for i in range(5):line('Exposed conduit strands',(.1,3.6,.42),(.4+i*.08,3.45,.34+i*.035),.015,edge)
# Serviceable ship surfaces: thin deck plates, inset channels, interrupted cable runs.
for ix in range(10):
    for iy in range(5):
        x=-6.9+ix*1.38;y=-1.7+iy*1.35
        panel=box('Cryodeck service plate',(x,y,.015),(1.34,1.31,.025),steel,.008)
        for dx in [-.56,.56]:
            for dy in [-.53,.53]:
                box('Flush captive deck fastener',(x+dx,y+dy,.034),(.035,.035,.008),edge,.002)
for x in [-7.65,2.85]:
    for i in range(18):
        box('Recessed cable raceway crossbar',(x,-1.8+i*.37,.045),(.30,.06,.055),dark,.008)
    for dx in [-.11,.11]:line('Cryodeck service conduit',(x+dx,-2,.025),(x+dx,4.8,.025),.028,edge)
for i in range(7):
    x=2.5+i*.46;y=-2.5-.12*math.sin(i)
    plate=box('Broken floor service panel',(x,y,.14),(.38,.66,.035),edge,.008);plate.rotation_euler=(.04*i,.07*i,.12*i)
for i in range(11):box('Dark longitudinal deck joint',(-7.59+i*1.38,.99,.034),(.018,6.71,.008),dark,0)
for i in range(6):box('Dark transverse deck joint',(-.69,-2.375+i*1.35,.034),(13.78,.018,.008),dark,0)
# The console has a readable working surface instead of one featureless glowing block.
for x in [1.08,1.34,1.60]:
    box('Console inset control screen',(x,-.09,1.249),(.21,.32,.014),dark,.008)
    for j in range(3):box('Final telemetry strokes',(x,-.18+j*.075,1.258),(.12-.025*j,.012,.006),cyan,.001)
for i in range(5):box('Console physical switch',(1.03+i*.18,.18,1.252),(.07,.06,.025),edge,.007)
for z in [.2,.36,.52]:box('Console ventilation bank',(1.4,.335,z),(.72,.015,.045),steel,.005)
# Detached fasteners and small torn skins give scale to the rupture beyond the mast.
for i in range(18):
    x=-8+(i*1.71)%9;y=-7-(i*.93)%12;z=.3+(i*.61)%5
    ob=box('Drifting torn skin fragment',(x,y,z),(.11+(i%3)*.16,.24+(i%4)*.13,.025),edge,.005)
    ob.rotation_euler=(i*.73,i*.41,i*.29)

# The clockwise torn deck face solidifies upward: dress its top surface, not its midplane.
for ob in bpy.data.objects:
    if ob.name.startswith(('Cryodeck service plate','Flush captive deck fastener','Dark longitudinal deck joint','Dark transverse deck joint','Recessed cable raceway','Cryodeck service conduit')):ob.location.z+=.08

# Thin real volume catches the dying ship lights without a flat painted backdrop.
vol=bpy.data.materials.new('Thin wreck dust');vol.use_nodes=True;nodes=vol.node_tree.nodes;nodes.clear()
out=nodes.new('ShaderNodeOutputMaterial');fog=nodes.new('ShaderNodeVolumePrincipled');fog.inputs['Density'].default_value=.008;fog.inputs['Color'].default_value=(.24,.3,.36,1);fog.inputs['Anisotropy'].default_value=.2
vol.node_tree.links.new(fog.outputs['Volume'],out.inputs['Volume']);box('Localized wreck atmosphere',(-6,-15,3),(18,35,12),vol,0)
area_light('Wreck cold backlight',(-10,-30,6),1800,8,(.2,.35,.55),target=(-3,-12,2))
star=material('Distant subdued stars',(.3,.4,.5),0,1,.6)
for i in range(35):
    x=-36+(i*13%70);z=3+(i*17%29)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=8,ring_count=4,radius=.025+(i%3)*.009,location=(x,-65,z));bpy.context.object.name='Sparse distant star';bpy.context.object.data.materials.append(star)
# Delivery refinement: separate the uplink silhouette from the torn hull mouth.
for ob in bpy.data.objects:
    if ob.name.startswith(('Last transmission dish','Dish pedestal','Receiver support','Uplink receiver','Warning escaping')):ob.location.x+=1.8
console_glow=cyan.copy();console_glow.name='Dimming final console';console_glow.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value=2.5
for ob in bpy.data.objects:
    if ob.name.startswith(('Last console light','Console final control face')):
        ob.data.materials.clear();ob.data.materials.append(console_glow)
# One unlocked capsule breaks the ordered repetition of the lost passenger deck.
canopies=sorted([ob for ob in bpy.data.objects if ob.name.startswith('Long dark passenger canopy')],key=lambda ob:ob.name)
if canopies:
    lid=canopies[0];lid.location.z+=.2;lid.rotation_euler.y=math.radians(14)
    box('Unlatched capsule seal',(-6.58,2,1.03),(.11,.26,.08),edge,.02)
area_light('Cold last signal',(1,1,5),700,5,(.23,.65,1),target=(2,0,1))
area_light('Distant starlight',(-7,-4,10),1100,8,(.31,.48,.65),target=(0,-5,0))
area_light('Dish rim',(8,-5,6),900,5,(.5,.76,1),target=(4,0,3))
bpy.ops.object.camera_add(location=(12,16,6.8));camera=bpy.context.object;scene.camera=camera
camera.rotation_euler=(Vector((-1,-4,1.8))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='PERSP';camera.data.lens=44
scene.render.filepath=str(OUT/'composition.png');bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'ending.blend'));bpy.ops.render.render(write_still=True)
print('RW12 ENDING',OUT,flush=True)
