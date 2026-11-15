"""Original Containment arsenal, MIT. Rebuild: blender -b -P this_file.py.

Coordinates and muzzle frames below are retained from the outgoing attachment
contract; no outgoing weapon geometry or textures are used by this generator.
"""
import bpy
import json
import math
import struct
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'public/assets/models'
ART = ROOT / 'artifacts/nextgen/k10-final/weapons'
ART.mkdir(parents=True, exist_ok=True)
MUZZLES = {
    'pistol': (-.005494060646449406, .005808352723576965, .5036645815229867),
    'rifle': (.0014545085086955553, .05942706372364458, .7237608740884591),
    'shotgun': (.0013561080597542428, .0974400030600058, .870512414880701),
    'plasma': (.0010457294056839272, .0970380869088818, .9437194257579368),
    'rocket': (-.004246423192267871, .1375766392171818, .7139129861427921),
}
PALETTE = {
    'plate': (.38, .44, .45, 1),
    'ivory': (.68, .71, .67, 1),
    'graphite': (.033, .047, .054, 1),
    'steel': (.17, .23, .25, 1),
    'amber': (.68, .34, .09, 1),
    'cyan': (.11, .64, .76, 1),
    'port': (.008, .014, .018, 1),
}
parts = []
mats = {}


def xyz(v):
    """Attachment-local x / height / forward to Blender Z-up."""
    return (v[0], -v[2], v[1])


def material(name, color):
    m = bpy.data.materials.new(name)
    m.diffuse_color = color
    m.use_nodes = True
    node = m.node_tree.nodes.get('Principled BSDF')
    node.inputs['Base Color'].default_value = color
    node.inputs['Roughness'].default_value = .7
    node.inputs['Metallic'].default_value = .2 if name != 'graphite' else 0
    return m


def finish(obj, name, zone, bevel=.012):
    obj.name = name
    obj.data.materials.append(mats[zone])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = obj.modifiers.new('Machined edge radii', 'BEVEL')
        mod.width = bevel
        mod.segments = 1
        mod.affect = 'EDGES'
        mod.harden_normals = True
    parts.append(obj)
    return obj


def box(name, p, s, zone='plate', bevel=.012, tilt=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz(p))
    obj = bpy.context.object
    obj.dimensions = (s[0], s[2], s[1])
    obj.rotation_euler.x = math.radians(tilt)
    return finish(obj, name, zone, bevel)


def cylinder(name, p, radius, length, zone='steel', vertices=12, axis='forward'):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=length, location=xyz(p))
    obj = bpy.context.object
    if axis == 'forward':
        obj.rotation_euler.x = math.pi / 2
    elif axis == 'side':
        obj.rotation_euler.y = math.pi / 2
    return finish(obj, name, zone, min(.009, radius * .15))


def groove(obj, p, s):
    """Real pocket subtraction, with the edge bevel applied after the boolean."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz(p))
    cutter = bpy.context.object
    cutter.dimensions = (s[0], s[2], s[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.context.view_layer.objects.active = obj
    mod = obj.modifiers.new('Milled service pocket', 'BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.object = cutter
    # Evaluate the subtraction before the edge finishing pass.
    bpy.ops.object.modifier_move_up(modifier=mod.name)
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)


def ring(name, p, radius, wall, length, zone='steel', vertices=12):
    """Open bored muzzle, with a black inner wall rather than a painted disk."""
    outer = cylinder(name, p, radius, length, zone, vertices)
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius-wall, depth=length+.05, location=xyz(p), rotation=(math.pi/2, 0, 0))
    cutter = bpy.context.object
    bpy.context.view_layer.objects.active = outer
    mod = outer.modifiers.new('Bored aperture', 'BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.object = cutter
    bpy.ops.object.modifier_move_up(modifier=mod.name)
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)
    cylinder(name+' recessed bore', (p[0], p[1], p[2]-length*.48), radius-wall-.001, .012, 'port', vertices)
    return outer


def bolts(forward, height, width=.18):
    for side in (-1, 1):
        cylinder('Captive hex latch', (side*width/2, height, forward), .018, .012, 'steel', 6, 'side')


def base_grip(length=.26, forward=-.08, height=-.13):
    box('Palm index grip', (0, height, forward), (.11, length, .14), 'graphite', .018, -14)
    box('Grip heel', (0, height-length*.44, forward-.026), (.14, .045, .16), 'steel', .008)
    for i in range(3):
        box('Grip compression rib', (0, height-.055+i*.055, forward+.072), (.116, .015, .018), 'steel', .004)
    # Open trigger bridge and curved guard made from three bevelled bars.
    box('Trigger guard lower', (0, height+.012, forward+.18), (.043, .026, .22), 'graphite', .007)
    box('Trigger guard front', (0, height+.075, forward+.28), (.043, .14, .026), 'graphite', .007, -12)
    box('Trigger blade', (0, height+.09, forward+.135), (.018, .09, .025), 'steel', .004, 14)


def receiver(p, s, zone='plate'):
    obj = box('Split receiver shell', p, s, zone, .018)
    groove(obj, (s[0]*.49, p[1]+.012, p[2]+.05), (.05, s[1]*.4, .16))
    groove(obj, (0, p[1]+s[1]*.49, p[2]+s[2]*.45), (s[0]+.04, .07, .08))
    groove(obj, (-s[0]*.22, p[1]+s[1]*.49, p[2]-.045), (.012, .017, s[2]*.56))
    box('Inset upper service seam', (-s[0]*.22, p[1]+s[1]*.445, p[2]-.045), (.009, .005, s[2]*.54), 'graphite', .001)
    box('Ejection pocket floor', (s[0]*.39, p[1]+.012, p[2]+.05), (.015, s[1]*.32, .145), 'port', .002)
    return obj


def pistol():
    receiver((0, .025, .045), (.18, .20, .55), 'ivory')
    box('Offset rear lock', (-.035, .12, -.18), (.11, .055, .14), 'steel')
    box('Slide seam', (0, .137, .04), (.105, .018, .35), 'graphite', .005)
    ring('Squared six-lobe muzzle', (0, .006, .463), .091, .026, .081, 'steel', 6)
    box('Lower barrel yoke', (0, -.072, .30), (.12, .065, .23), 'graphite')
    base_grip(.28, -.105, -.145)
    for z in (-.125, -.075, -.025):
        box('Slide serration', (.094, .065, z), (.012, .055, .013), 'graphite', .002)
    box('Front index sight', (0, .151, .29), (.052, .045, .055), 'steel', .005)
    box('Friendly sight bead', (0, .176, .29), (.029, .008, .026), 'cyan', .002)
    bolts(.14, .027, .19)


def rifle():
    receiver((0, .045, -.06), (.16, .22, .63))
    box('Shoulder pad', (0, .015, -.795), (.18, .27, .13), 'graphite', .018)
    box('Stock web upper', (0, .065, -.54), (.09, .075, .40), 'ivory', .012)
    box('Stock web lower', (0, -.035, -.58), (.065, .045, .37), 'steel', .008)
    base_grip(.30, -.18, -.19)
    box('Magazine well', (0, -.105, .075), (.13, .12, .18), 'graphite')
    box('Detachable ribbed magazine', (0, -.29, .095), (.12, .28, .18), 'steel', .013, 8)
    for i in range(3):
        box('Magazine emboss', (.063, -.24-i*.05, .09), (.012, .012, .12), 'graphite', .003)
    for side in (-1, 1):
        box('Split forward rail', (side*.079, .07, .40), (.048, .14, .38), 'ivory', .012)
    cylinder('Free floating barrel', (0, .0594, .46), .047, .44)
    ring('Long brake muzzle', (0, .059427, .666), .073, .025, .115, 'steel')
    for z in (.30, .39, .48):
        box('Rail ventilation slot', (.105, .07, z), (.008, .065, .044), 'graphite', .003)
    box('Rear service rail', (0, .172, -.08), (.08, .027, .39), 'graphite', .004)
    box('Low reflex housing', (0, .21, -.09), (.10, .065, .12), 'ivory', .008)
    box('Sight lens', (0, .212, -.025), (.055, .032, .009), 'cyan', .002)
    bolts(-.25, .046, .167)


def shotgun():
    receiver((0, .115, -.12), (.22, .245, .55), 'ivory')
    box('Recoil stock', (0, .09, -.64), (.13, .14, .44), 'steel', .014)
    box('Stock recoil pad', (0, .07, -.84), (.19, .25, .09), 'graphite', .014)
    base_grip(.28, -.26, -.12)
    box('Broad barrel saddle', (0, .08, .35), (.255, .16, .58), 'graphite', .018)
    for side in (-1, 1):
        cylinder('Parallel barrel', (side*.067, .09744, .48), .061, .64, 'steel')
        ring('Twin muzzle bore', (side*.067, .09744, .818), .073, .020, .105, 'steel', 10)
    box('Pump hand shield', (0, -.035, .32), (.25, .105, .30), 'plate', .013)
    for i in range(4):
        box('Pump traction band', (0, -.09, .225+i*.058), (.22, .017, .018), 'graphite', .004)
    box('Break latch', (-.13, .20, -.12), (.08, .045, .11), 'amber', .006)
    box('Upper barrel bridge', (0, .183, .44), (.08, .035, .55), 'ivory', .006)
    box('Front broad sight', (0, .217, .67), (.055, .045, .06), 'steel', .005)
    box('Friendly sight bead', (0, .24, .67), (.028, .008, .025), 'cyan', .002)
    bolts(-.23, .11, .226)


def plasma():
    receiver((0, .10, -.20), (.22, .25, .49), 'ivory')
    box('Rear induction keel', (0, .12, -.56), (.12, .15, .27), 'steel', .014)
    base_grip(.24, -.29, -.10)
    box('Power pack', (0, -.083, -.035), (.21, .16, .25), 'graphite', .015)
    box('Pack service face', (0, -.17, -.035), (.16, .035, .21), 'steel', .006)
    for side in (-1, 1):
        box('Open induction fork', (side*.115, .097, .46), (.09, .18, .76), 'plate', .018)
        box('Fork nose armor', (side*.115, .097, .865), (.125, .22, .145), 'ivory', .012)
        box('Charged inner rail', (side*.063, .115, .46), (.015, .055, .61), 'cyan', .005)
        for i in range(4):
            box('Inductor rib', (side*.115, .205, .21+i*.14), (.11, .03, .043), 'steel', .006)
    cylinder('Central ceramic throat', (0, .097, .12), .065, .28, 'graphite')
    ring('Recessed plasma aperture', (0, .097, .268), .069, .018, .045, 'cyan')
    box('Floating fork bridge', (0, .24, .025), (.32, .065, .11), 'ivory', .01)
    box('Charge indicator', (0, .278, .026), (.12, .012, .065), 'cyan', .004)
    bolts(-.20, .097, .226)


def rocket():
    # The retained muzzle lies inside the old ornamental forward shroud. Our
    # actual open barrel ends at that socket, avoiding a flash inside geometry.
    ring('Hexagonal launch shroud', (0, .1375766, .52), .185, .035, .385, 'ivory', 6)
    ring('Rear pressure chamber', (0, .1375766, -.45), .172, .035, .68, 'plate', 8)
    ring('Launch tube bridge', (0, .1375766, .04), .138, .024, .69, 'steel', 12)
    base_grip(.22, -.21, -.13)
    box('Launch interlock', (0, -.035, -.15), (.21, .12, .40), 'graphite', .013)
    box('Forward support grip', (0, -.19, .34), (.10, .25, .12), 'graphite', .013, 10)
    box('Shoulder rest saddle', (0, -.024, -.63), (.24, .09, .34), 'graphite', .015)
    for side in (-1, 1):
        box('Launch latch spine', (side*.155, .137, .17), (.04, .12, .43), 'steel', .008)
        box('Chamber pressure band', (side*.158, .14, -.54), (.045, .16, .065), 'amber', .006)
    box('Offset sight bracket', (-.205, .26, -.01), (.08, .11, .16), 'graphite', .009)
    box('Sight armored cap', (-.205, .32, -.01), (.11, .045, .18), 'ivory', .006)
    box('Friendly sight bead', (-.205, .347, -.01), (.06, .008, .07), 'cyan', .002)
    bolts(-.13, .05, .22)


def bake_and_join(name):
    high_parts = []
    for obj in parts:
        high = obj.copy(); high.data = obj.data.copy()
        bpy.context.collection.objects.link(high)
        for mod in high.modifiers:
            if mod.type == 'BEVEL':
                mod.segments = 3
        high_parts.append(high)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in high_parts:
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        for mod in list(obj.modifiers):
            bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.context.view_layer.objects.active = high_parts[0]
    bpy.ops.object.join()
    high = bpy.context.object
    high.name = name+'-rounded-edge-bake-source'
    high.hide_render = True
    bpy.ops.object.select_all(action='DESELECT')
    for obj in parts:
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        for mod in list(obj.modifiers):
            bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = name+'-original-arsenal'
    for index, mat in enumerate(obj.data.materials):
        if mat is None:
            obj.data.materials[index] = mats['graphite']
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(65), island_margin=.018)
    bpy.ops.object.mode_set(mode='OBJECT')
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 16
    scene.cycles.bake_type = 'DIFFUSE'
    scene.render.bake.margin = 3
    scene.render.bake.use_pass_direct = False
    scene.render.bake.use_pass_indirect = False
    scene.render.bake.use_pass_color = True
    images = {}
    for label, bake_type in [('base', 'DIFFUSE'), ('ao', 'AO'), ('normal', 'NORMAL'), ('curvature', 'EMIT')]:
        image = bpy.data.images.new(name+'-'+label, width=512, height=512, alpha=False)
        if label != 'base':
            image.colorspace_settings.name = 'Non-Color'
        for mat in obj.data.materials:
            nodes = mat.node_tree.nodes
            tex = nodes.new('ShaderNodeTexImage')
            tex.image = image
            nodes.active = tex
            if label == 'curvature':
                geo = nodes.new('ShaderNodeNewGeometry')
                emit = nodes.new('ShaderNodeEmission')
                mat.node_tree.links.new(geo.outputs['Pointiness'], emit.inputs['Color'])
                mat.node_tree.links.new(emit.outputs[0], nodes.get('Material Output').inputs['Surface'])
        if label == 'normal':
            high.hide_render = False
            high.select_set(True)
            bpy.context.view_layer.objects.active = obj
            scene.render.bake.use_selected_to_active = True
            scene.render.bake.cage_extrusion = .025
            scene.render.bake.max_ray_distance = .05
        bpy.ops.object.bake(type=bake_type)
        if label == 'normal':
            high.hide_render = True
            high.select_set(False)
            scene.render.bake.use_selected_to_active = False
        images[label] = image
    bpy.data.objects.remove(high, do_unlink=True)
    # Subtle cavity/edge modulation is baked, preserving deliberate flat zones.
    base = list(images['base'].pixels[:])
    ao = list(images['ao'].pixels[:])
    curve = list(images['curvature'].pixels[:])
    for i in range(0, len(base), 4):
        gain = (.76 + .24*ao[i]) * (.94 + .12*curve[i])
        for c in range(3):
            base[i+c] = min(1, base[i+c]*gain)
    images['base'].pixels[:] = base
    for label, image in images.items():
        image.filepath_raw = str(ART / (name+'-'+label+'.png'))
        image.file_format = 'PNG'
        image.save()
    final = bpy.data.materials.new('K10-'+name+'-baked-zones')
    final.use_nodes = True
    nodes = final.node_tree.nodes
    shader = nodes.get('Principled BSDF')
    shader.inputs['Roughness'].default_value = .72
    shader.inputs['Metallic'].default_value = .18
    tex = nodes.new('ShaderNodeTexImage'); tex.image = images['base']
    final.node_tree.links.new(tex.outputs['Color'], shader.inputs['Base Color'])
    normal = nodes.new('ShaderNodeTexImage'); normal.image = images['normal']
    normalmap = nodes.new('ShaderNodeNormalMap'); normalmap.inputs['Strength'].default_value = .5
    final.node_tree.links.new(normal.outputs['Color'], normalmap.inputs['Color'])
    final.node_tree.links.new(normalmap.outputs['Normal'], shader.inputs['Normal'])
    obj.data.materials.clear(); obj.data.materials.append(final)
    for poly in obj.data.polygons:
        poly.material_index = 0
    obj['authorship'] = 'Original Containment K10 artwork, MIT'
    return obj


def socket(name, position):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.location = xyz(position)
    return obj


def retain_socket_precision(path, positions):
    """Blender stores transforms as float32; keep the existing JSON frame exact."""
    data = path.read_bytes()
    length = struct.unpack_from('<I', data, 12)[0]
    document = json.loads(data[20:20+length])
    for node in document['nodes']:
        if node['name'] in positions:
            node['translation'] = list(positions[node['name']])
    encoded = json.dumps(document, separators=(',', ':')).encode()
    encoded += b' ' * (-len(encoded) % 4)
    tail = data[20+length:]
    path.write_bytes(struct.pack('<4sII', b'glTF', 2, 20+len(encoded)+len(tail)) + struct.pack('<I4s', len(encoded), b'JSON') + encoded + tail)


def camera_at(position, target, scale):
    cam = bpy.data.objects.new('Review camera', bpy.data.cameras.new('Review camera'))
    bpy.context.collection.objects.link(cam)
    cam.location = position
    cam.rotation_euler = (Vector(target)-cam.location).to_track_quat('-Z', 'Y').to_euler()
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = scale
    bpy.context.scene.camera = cam
    return cam


def render(name):
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'; scene.cycles.samples = 32
    scene.world.color = (.18, .18, .18)
    scene.view_settings.view_transform = 'AgX'
    scene.render.resolution_x = 960; scene.render.resolution_y = 640
    scene.render.resolution_percentage = 100
    for p, power, size in [((2, -2, 4), 450, 3), ((-3, 1, 2), 320, 2)]:
        light = bpy.data.objects.new('Studio softbox', bpy.data.lights.new('Studio softbox', 'AREA'))
        bpy.context.collection.objects.link(light); light.location = p
        light.rotation_euler = (Vector((0, 0, 0))-light.location).to_track_quat('-Z', 'Y').to_euler()
        light.data.energy = power; light.data.shape = 'DISK'; light.data.size = size
    for label, pos in [('three-quarter', (2.4, -3.3, 3.7)), ('side', (3, 0, .3)), ('top', (0, -.001, 4))]:
        scale = (3.05 if name != 'pistol' else 1.65) if label == 'top' else (2.02 if name != 'pistol' else 1.20)
        cam = camera_at(pos, (0, -.03, .03), scale)
        scene.render.filepath = str(ART / (name+'-'+label+'.png'))
        bpy.ops.render.render(write_still=True)
        bpy.data.objects.remove(cam, do_unlink=True)


manifest = {'license': 'MIT', 'originalGeometry': True, 'textureSize': [512,512], 'weapons': {}}
for name in MUZZLES:
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    parts = []; mats = {k:material(k,v) for k,v in PALETTE.items()}
    globals()[name]()
    obj = bake_and_join(name)
    muzzle = socket('muzzle', MUZZLES[name])
    # Current casing presentation derives its origin from muzzle - .65m;
    # retain a named matching socket for later VFX adoption, without runtime edits.
    m = MUZZLES[name]
    eject = socket('ejection', (m[0]+.08, m[1], m[2]-.65))
    bpy.ops.object.select_all(action='DESELECT')
    for x in (obj, muzzle, eject): x.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')), export_format='GLB', use_selection=True, export_animations=False, export_extras=True, export_copyright='Containment contributors, original K10 arsenal geometry and textures, MIT')
    retain_socket_precision(OUT/(name+'.glb'), {'muzzle':m, 'ejection':(m[0]+.08,m[1],m[2]-.65)})
    obj.data.calc_loop_triangles()
    manifest['weapons'][name] = {'triangles':len(obj.data.loop_triangles), 'vertices':len(obj.data.vertices), 'muzzle':list(m), 'bytes':(OUT/(name+'.glb')).stat().st_size, 'materials':1, 'embeddedTextures':['base','normal'], 'bakes':['AO','geometric curvature','tangent normal'], 'normalDetail':'Three-segment rounded machined edges projected onto one-segment gameplay bevels, selected-to-active tangent-space bake.'}
    render(name)
(ART/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
print(json.dumps(manifest, indent=2))
