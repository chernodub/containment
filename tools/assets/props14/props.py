"""Original MIT requisition hardware. Dimensions in local fabrication units."""
import bpy, math, sys
from mathutils import Vector, Euler
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'public/assets/props14'
ART = ROOT / 'public/assets/ui/props14'
REVIEW = ROOT / 'artifacts/nextgen/props14-design'
blockout = '--blockout' in sys.argv
bpy.ops.wm.read_factory_settings(use_empty=True)
for path in (OUT, ART, REVIEW):
    path.mkdir(parents=True, exist_ok=True)

palette = ['17232c','394e56','778e92','dae4d9','237365','85ffd1','9fe8ff','f2cc87',
           'ffb994','ffd27a','d9c0fc','9eeaf1','565e41','25415c','926b42','788366']
def atlas(name, emissive):
    im = bpy.data.images.new(name, width=64, height=64, alpha=False)
    pixels = []
    for y in range(64):
        for x in range(64):
            i = (y//16)*4+x//16
            c = palette[i] if not emissive or 5<=i<=11 else '000000'
            pixels.extend([int(c[j:j+2],16)/255 for j in (0,2,4)]+[1])
    im.pixels[:] = pixels
    im.pack()
    return im

mat = bpy.data.materials.new('Requisition enamel and status glass')
mat.use_nodes = True
mat.use_backface_culling=True
shader = mat.node_tree.nodes.get('Principled BSDF')
shader.inputs['Roughness'].default_value=.65
for key, emission in [('Base Color',False),('Emission Color',True)]:
    tex = mat.node_tree.nodes.new('ShaderNodeTexImage')
    tex.image = atlas(key, emission)
    mat.node_tree.links.new(tex.outputs['Color'],shader.inputs[key])
shader.inputs['Emission Strength'].default_value=.65
gray=bpy.data.materials.new('Inspection clay')
gray.diffuse_color=(.45,.45,.45,1)
verts, faces, zones = [], [], []
models = {}
def prism(poly, h, p, c, bevel=.025, rot=(0,0,0)):
    """Machined profile with a top chamfer and vertical sides."""
    n=len(poly)
    offset=len(verts)
    orient=Euler(rot).to_matrix()
    mx=max(abs(x) for x,y in poly)
    my=max(abs(y) for x,y in poly)
    b=min(bevel,h*.3,mx*.3,my*.3)
    rings=[(-h/2,0),(h/2-b,0),(h/2,b)] if b else [(-h/2,0),(h/2,0)]
    for z,inset in rings:
        for x,y in poly:
            verts.append(Vector(p)+orient@Vector((x*(1-inset/mx),y*(1-inset/my),z)))
    local=[list(reversed(range(n)))]
    for k in range(len(rings)-1):
        for i in range(n):
            j=(i+1)%n
            local.append([k*n+i,k*n+j,(k+1)*n+j,(k+1)*n+i])
    local.append(list(range((len(rings)-1)*n,len(rings)*n)))
    for f in local:
        faces.append([offset+i for i in f]); zones.append(c)
def box(x,y,z,w,d,h,c,cut=.05,rot=(0,0,0),bevel=.025):
    a,b=w/2,d/2
    k=min(cut,a*.5,b*.5)
    poly=[(-a+k,-b),(a-k,-b),(a,-b+k),(a,b-k),(a-k,b),(-a+k,b),(-a,b-k),(-a,-b+k)] if k else [(-a,-b),(a,-b),(a,b),(-a,b)]
    prism(poly,h,(x,y,z),c,bevel,rot)
def disc(x,y,z,r,h,c,n=8,rot=(0,0,0)):
    prism([(r*math.cos(i*math.tau/n),r*math.sin(i*math.tau/n)) for i in range(n)],h,(x,y,z),c,.024,rot)
def bar(a,b,w,c):
    a,b=Vector(a),Vector(b)
    delta=b-a
    box(*((a+b)/2),w,w,delta.length,c,0,delta.to_track_quat('Z','Y').to_euler(),0)
def loop(cx,cy,z,rx,ry,c):
    # Continuous planar washer with an open centre.
    start=len(verts); n=12
    for zz,r in [(z-.025,1),(z+.025,1),(z+.025,.66),(z-.025,.66)]:
        for i in range(n):
            t=math.tau*i/n
            verts.append((cx+r*rx*math.cos(t),cy+r*ry*math.sin(t),zz))
    for j in range(4):
        for i in range(n):
            faces.append([start+j*n+i,start+j*n+(i+1)%n,start+(j+1)%4*n+(i+1)%n,start+(j+1)%4*n+i]);zones.append(c)
def finish(name):
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(verts,[],faces);mesh.update()
    uv=mesh.uv_layers.new()
    for f,c in zip(mesh.polygons,zones):
        for i in f.loop_indices: uv.data[i].uv=((c%4+.5)/4,(c//4+.5)/4)
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    mesh.materials.append(gray if blockout else mat)
    models[name]=obj
    verts.clear(); faces.clear(); zones.clear()
def cross(z,size):
    box(0,0,z,size,size*.32,.025,3,0)
    box(0,0,z+.003,size*.32,size,.025,3,0)

# Medicine ampoule with an external cage and cross-stamped twist cap.
for z,r,h,c in [(.10,.45,.20,1),(.40,.34,.48,5),(.73,.44,.22,4),(.89,.40,.12,4)]:
    disc(0,0,z,r,h,c)
for x in [-.34,.34]: box(x,0,.41,.11,.20,.51,3)
cross(.97,.65)
finish('health')
# Clamshell split, two draw latches and an open carry handle.
for z,w,d,h,c in [(.17,1.48,.94,.34,4),(.35,1.51,.96,.08,0),(.48,1.48,.94,.22,4)]:
    box(0,0,z,w,d,h,c,.14)
for x in [-.46,.46]: box(x,-.465,.37,.18,.09,.28,2)
for x in [-.34,.34]: box(x,.56,.38,.12,.25,.12,1)
box(0,.70,.38,.79,.12,.12,1)
box(0,0,.60,.70,.59,.035,1)
cross(.64,.48)
box(.54,0,.60,.075,.39,.04,5)
finish('medkit')
# Nested ballistic plates with clipped shoulders and a pointed lower edge.
box(0,0,.07,.96,1.22,.14,0,.18)
plate=[(-.48,-.26),(0,-.62),(.48,-.26),(.48,.33),(.27,.55),(-.27,.55),(-.48,.33)]
for i,c in enumerate([1,6,13,2]): prism(plate,.10,(0,i*.075,.16+i*.085),c,.045)
for x in [-.29,.29]:box(x,.32,.475,.09,.18,.025,1,0)
prism([(-.34,.10),(0,-.15),(.34,.10),(.34,.23),(0,-.02),(-.34,.23)],.034,(0,.11,.477),6,.006)
finish('armor')
def tray(w,d,c):
    box(0,0,.09,w,d,.18,0)
    for x in [-1,1]:box(x*(w-.10)/2,0,.24,.10,d,.31,c,0)
    for y in [-1,1]:box(0,y*(d-.10)/2,.22,w-.2,.10,.27,c,0)
tray(1.40,.96,12)
for x in [-.44,-.15,.14,.43]:
    box(x,0,.36,.20,.58,.43,1,.04,(-.18,0,0))
    box(x,.042,.59,.18,.51,.07,7,.045,(-.18,0,0))
finish('ammo')
box(0,0,.085,1.43,.79,.17,1,.13)
for x in [-.35,.35]:
    disc(x,0,.29,.31,.37,12)
    disc(x,0,.49,.29,.095,8)
    disc(x,.025,.62,.16,.20,0)
    box(x,-.13,.69,.12,.45,.07,2,0)
    loop(x,.25,.74,.16,.19,3)
finish('grenade')
def wafer(x,y,z,a):
    box(x,y,z,.79,.48,.09,14,.14,(0,0,a))
    box(x,y,z+.052,.53,.32,.025,9,.075,(0,0,a))
    for idx in [-1,0,1]:
        dx,dy=idx*.11,-.18
        box(x+dx*math.cos(a)-dy*math.sin(a),y+dx*math.sin(a)+dy*math.cos(a),z+.05,.047,.085,.018,3,0,(0,0,a),0)
for x,y,count,ang in [(-.25,-.23,2,-.26),(.23,.18,3,.27)]:
    for i in range(count):wafer(x,y,z=.06+i*.13,a=ang+i*.055)
finish('credits')
for opened in [False,True]:
    tray(1.65,1.08,13)
    box(0,.50 if opened else 0,.72 if opened else .46,1.68,1.11,.19,1,.11,(1.40 if opened else 0,0,0))
    if opened:
        for x in [-.34,.36]:
            for i in range(2):wafer(x,0,.23+i*.10,.10)
    else:
        for x in [-.52,.52]:box(x,0,.565,.13,1.01,.06,2)
        box(0,-.22,.57,.34,.12,.04,9)
    finish('cache-open' if opened else 'cache-closed')
disc(0,0,.16,.59,.32,0,6)
disc(0,0,.35,.53,.13,2,6)
disc(0,0,.46,.40,.12,13,3)
for x,y in [(-.14,-.10),(.20,0),(-.14,.10)]:disc(x,y,.53,.056,.03,10)
box(-.51,0,.28,.23,.22,.16,10)
finish('reroll')
for x in [-.60,.60]:
    box(x,0,.37,.19,.74,.74,1)
    box(x,0,.08,.32,1.03,.15,0)
box(0,0,.79,1.68,1.04,.18,2,.13)
box(-.12,0,.90,.93,.73,.05,11)
for p,q in [((.57,.31,.91),(.72,.28,1.53)),((.72,.28,1.53),(.15,.18,1.72)),((.15,.18,1.72),(-.06,.08,1.41))]:bar(p,q,.15,13)
for x,y,z in [(.72,.28,1.53),(.15,.18,1.72)]:disc(x,y,z,.12,.19,2,10,(1.57,0,0))
for x in [-.35,-.07]:box(x,-.32,1.01,.09,.27,.20,1)
finish('upgrade')
box(0,0,.19,1.14,1.10,.38,3,.19)
box(0,.18,.40,.77,.55,.08,0)
box(0,.18,.445,.51,.28,.03,5)
for s in [-1,1]:
    pts=[(s*.34,-.30,.32),(s*.39,-.65,.20),(s*.71,-.63,.16),(s*.83,-.20,.20)]
    for a,b in zip(pts,pts[1:]):bar(a,b,.065,0)
    box(s*.79,.11,.19,.36,.75,.17,2,.12)
    box(s*.79,.11,.31,.17,.47,.15,4)
finish('resuscitator')
for z,r,h,c in [(.1,.36,.20,0),(.44,.28,.56,11),(.84,.35,.20,13),(.99,.16,.14,2)]:
    disc(0,0,z,r,h,c,6)
for x in [-.26,.26]:box(x,0,.47,.11,.26,.59,13)
# Side-loading cartridge with exposed twin blade terminals.
for x in [-.12,.12]:box(x,0,1.10,.10,.16,.26,2,0)
for i,(x,y,z) in enumerate(verts): verts[i]=(z-.56,y,.37-x)
finish('overdrive')

if not blockout:
    # Uniform enamel swatches let small in-game batches use the ship shader.
    for obj in models.values(): obj['swatches']=palette
    bpy.ops.export_scene.gltf(filepath=str(OUT/'props.glb'),export_materials='EXPORT',export_yup=True,export_extras=True)
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=5
scene.render.film_transparent=True
scene.render.resolution_x=scene.render.resolution_y=300
scene.render.resolution_percentage=100
scene.view_settings.view_transform='Standard'
scene.world=bpy.data.worlds.new('Softbox fill')
scene.world.color=(.24,.24,.24)
scene.render.use_freestyle=not blockout
if not blockout:
    lineset=scene.view_layers[0].freestyle_settings.linesets[0]
    line=bpy.data.linestyles.new('Contour');lineset.linestyle=line
    line.color=(.022,.038,.046);line.thickness=1.35
    # Banded diffuse enamel plus the exported self-lit atlas.
    nodes=mat.node_tree.nodes; links=mat.node_tree.links
    toon=nodes.new('ShaderNodeBsdfToon');toon.inputs['Size'].default_value=.73
    toon.inputs['Smooth'].default_value=.055
    links.new(shader.inputs['Base Color'].links[0].from_socket,toon.inputs['Color'])
    light=nodes.new('ShaderNodeEmission')
    links.new(shader.inputs['Emission Color'].links[0].from_socket,light.inputs[0])
    add=nodes.new('ShaderNodeAddShader')
    links.new(toon.outputs[0],add.inputs[0]);links.new(light.outputs[0],add.inputs[1])
    links.new(add.outputs[0],nodes.get('Material Output').inputs[0])
bpy.ops.object.light_add(type='SUN',location=(2,-3,6))
bpy.context.object.rotation_euler=(.48,-.60,-.1)
bpy.context.object.data.energy=3
bpy.ops.object.camera_add()
cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO'
for obj in models.values():obj.hide_render=True
for name,obj in models.items():
    obj.hide_render=False
    center=sum((Vector(v) for v in obj.bound_box),Vector())/8
    for i,angle in enumerate([-.96,1.13,3.23] if blockout else [-1.18]):
        cam.location=center+Vector((math.cos(angle)*3,math.sin(angle)*3,2.8))
        cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler()
        cam.data.ortho_scale=max(obj.dimensions)*1.58
        scene.render.filepath=str(REVIEW/f'{name}-{i}.png' if blockout else ART/f'{name}.png')
        bpy.ops.render.render(write_still=True)
    obj.hide_render=True
