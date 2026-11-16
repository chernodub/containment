"""Original Containment arsenal, MIT. Rebuild: blender -b -P this_file.py.

Coordinates and muzzle frames below are retained from the outgoing attachment
contract; no outgoing weapon geometry or textures are used by this generator.
"""
import bpy
import json
import math
import struct
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'tools/assets/k10-marine'))
from render_device import choose_render_device
OUT = ROOT / ('public/assets/models' if '--ship' in sys.argv else 'artifacts/nextgen/ka12-final/weapons/models')
OUT.mkdir(parents=True,exist_ok=True)
ROUND = int(next((x.split('=')[1] for x in sys.argv if x.startswith('--round=')), '3'))
ART = ROOT / f'artifacts/nextgen/ka12-final/weapons/round-{ROUND}'
ART.mkdir(parents=True, exist_ok=True)
MUZZLES = {
    'pistol': (-.005494060646449406, .005808352723576965, .5036645815229867),
    'rifle': (.0014545085086955553, .05942706372364458, .7237608740884591),
    'shotgun': (.0013561080597542428, .0974400030600058, .870512414880701),
    'plasma': (.0010457294056839272, .0970380869088818, .9437194257579368),
    'rocket': (-.004246423192267871, .1375766392171818, .7139129861427921),
}
PALETTE = {
    'plate': (.18, .23, .24, 1),
    'ivory': (.57, .61, .56, 1),
    'graphite': (.033, .047, .054, 1),
    'steel': (.17, .23, .25, 1),
    'amber': (.68, .34, .09, 1),
    'cyan': (.11, .64, .76, 1),
    'port': (.008, .014, .018, 1),
    'core': (.035, .65, .88, 1),
    'heat': (.90, .23, .035, 1),
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
    if name in ('core', 'heat'):
        node.inputs['Emission Color'].default_value = color
        node.inputs['Emission Strength'].default_value = 2.5
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
    for polygon in obj.data.polygons:
        polygon.use_smooth = len(polygon.vertices) == 4
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


def profile(name, outline, width, zone='plate', x=0, bevel=.012):
    """Extrude a deliberately drawn side silhouette, never a stretched cube."""
    n = len(outline)
    vertices = [xyz((x+side*width*.5, h, f)) for side in (-1, 1) for f,h in outline]
    faces = [tuple(reversed(range(n))),tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(vertices,[],faces); mesh.update()
    obj=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active=obj; obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.normals_make_consistent(inside=False); bpy.ops.object.mode_set(mode='OBJECT')
    obj.select_set(False)
    return finish(obj,name,zone,bevel)


def top_profile(name, outline, height, thickness, zone='plate', bevel=.012):
    n=len(outline)
    vertices=[xyz((x,height+side*thickness*.5,f)) for side in (-1,1) for f,x in outline]
    faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(vertices,[],faces); mesh.update()
    obj=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active=obj; obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.normals_make_consistent(inside=False); bpy.ops.object.mode_set(mode='OBJECT')
    obj.select_set(False)
    return finish(obj,name,zone,bevel)


def pocket(obj, outline, width, x=0):
    cutter=profile('Temporary milled-profile cutter',outline,width,'port',x,0)
    parts.remove(cutter)
    bpy.context.view_layer.objects.active=obj
    mod=obj.modifiers.new('Milled through aperture','BOOLEAN'); mod.operation='DIFFERENCE'; mod.object=cutter
    while obj.modifiers.find(mod.name)>0: bpy.ops.object.modifier_move_up(modifier=mod.name)
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter,do_unlink=True)


def screw(f,h,x):
    cylinder('Captive hex fastener',(x,h,f),.017,.012,'steel',6,'side')
    # Slotted support detail remains physically inset into the screw.
    box('Fastener slot',(x+(.006 if x>0 else -.006),h,f),(.003,.004,.019),'port',.001)


def grip(f=-.12,h=-.035,width=.115):
    outline=[(f-.085,h+.018),(f+.07,h+.012),(f+.035,h-.12),(f-.015,h-.28),(f-.085,h-.31),(f-.17,h-.28),(f-.15,h-.24),(f-.105,h-.10)]
    profile('Ergonomic swept palm grip',outline,width,'graphite',bevel=.022)
    panel=[(f-.075,h-.045),(f+.025,h-.04),(f-.015,h-.13),(f-.055,h-.23),(f-.115,h-.245),(f-.10,h-.15)]
    for side in (-1,1):
        profile('Grip overmould insert',panel,.012,'plate',side*width*.5,.006)
        for i in range(3):
            profile('Curved grip traction',[(f-.10,h-.13-i*.028),(f-.005,h-.10-i*.028),(f-.012,h-.113-i*.028),(f-.105,h-.143-i*.028)],.008,'steel',side*(width*.5+.009),.003)
    guard=profile('Arched trigger bow',[(f+.048,h-.01),(f+.245,h-.01),(f+.26,h-.08),(f+.21,h-.15),(f+.025,h-.15)],.041,'steel',bevel=.01)
    pocket(guard,[(f+.075,h-.035),(f+.215,h-.035),(f+.225,h-.075),(f+.19,h-.118),(f+.06,h-.118)],.07)
    profile('Curved trigger',[(f+.105,h-.02),(f+.118,h-.02),(f+.10,h-.09),(f+.075,h-.095),(f+.085,h-.08)],.017,'graphite',bevel=.004)


def rail(f0,f1,h,width=.065):
    outline=[(f0,h),(f1,h),(f1,h+.018)]
    for i in range(7):
        f=f1-(f1-f0)*(i+.1)/7
        outline.extend([(f,h+.018),(f,h+.036),(f-.026,h+.036),(f-.026,h+.018)])
    outline.append((f0,h+.018))
    profile('Machined seven-tooth sight rail',outline,width,'graphite',bevel=.003)


def pistol():
    # Low hooked slide, narrowing under the muzzle instead of a square nose.
    profile('Hooked compact slide',[(-.255,.055),(-.20,.148),(.225,.148),(.29,.10),(.39,.075),(.43,.02),(.415,-.06),(.31,-.075),(.245,-.025),(-.16,-.025),(-.25,.005)],.168,'graphite',bevel=.018)
    for side in (-1,1):
        shell=profile('Compact grip-index ceramic cheek',[(-.21,.060),(-.165,.112),(.065,.112),(.155,.055),(.09,.014),(-.16,.012)],.026,'ivory',side*.083,.005)
        pocket(shell,[(-.065,.045),(.02,.045),(.05,.076),(-.045,.076)],.08,side*.083)
        screw(-.17,.052,side*.106)
        for i in range(3):
            profile('Rear slide diagonal serration',[(-.16+i*.035,.08),(-.145+i*.035,.08),(-.12+i*.035,.135),(-.135+i*.035,.135)],.008,'steel',side*.099,.002)
    profile('Swept lower recoil chassis',[(-.20,.005),(.29,.005),(.34,-.042),(.265,-.095),(.07,-.085),(.015,-.125),(-.13,-.10)],.125,'plate',bevel=.012)
    ring('Crowned pistol muzzle',(0,.005808,.465),.069,.023,.077,'steel',12)
    grip(-.11,-.055)
    profile('Recessed rear sight',[(-.20,.15),(-.14,.15),(-.14,.185),(-.18,.185)],.075,'steel',bevel=.005)
    profile('Ramped front sight',[(.25,.11),(.31,.09),(.31,.14),(.285,.15)],.037,'steel',bevel=.004)
    box('Cyan sight bead',(0,.148,.286),(.021,.006,.021),'cyan',.002)


def rifle():
    chassis=profile('Sloping break-action chassis',[(-.43,.045),(-.33,.145),(-.04,.19),(.18,.15),(.27,.09),(.22,-.055),(.03,-.12),(-.095,-.10),(-.18,-.055),(-.38,-.055)],.16,'graphite',bevel=.018)
    for side in (-1,1):
        cheek=profile('Sloped receiver service shell',[(-.37,.06),(-.29,.12),(-.035,.16),(.145,.128),(.18,.078),(.12,-.005),(-.04,-.06),(-.13,-.035),(-.27,-.025)],.025,'ivory',side*.084,.006)
        pocket(cheek,[(-.16,.035),(-.035,.06),(.065,.055),(.075,.085),(-.14,.09)],.06,side*.084)
        screw(-.28,.055,side*.106); screw(.09,.04,side*.106)
    # Ergonomic hollow butt, formed as one angular continuous side web.
    stock=profile('Shouldered cheek-stock',[(-.85,.085),(-.73,.14),(-.49,.105),(-.34,.053),(-.39,-.045),(-.57,-.09),(-.73,-.18),(-.855,-.14)],.12,'plate',bevel=.02)
    pocket(stock,[(-.72,.045),(-.48,.03),(-.465,-.01),(-.60,-.035),(-.73,-.10)],.20)
    profile('Fitted recoil butt pad',[(-.86,.09),(-.81,.105),(-.81,-.145),(-.85,-.16),(-.90,-.12),(-.89,.05)],.165,'graphite',bevel=.018)
    profile('Cheek-stock ivory comb',[(-.78,.13),(-.54,.115),(-.45,.085),(-.52,.055),(-.78,.075)],.13,'ivory',bevel=.009)
    grip(-.18,-.085)
    mag=profile('Swept replaceable magazine',[(.012,-.09),(.13,-.07),(.175,-.21),(.13,-.40),(.065,-.425),(-.045,-.37),(.005,-.23)],.125,'steel',bevel=.014)
    for side in (-1,1):
        for i in range(3):
            profile('Magazine curved stiffener',[(.028,-.18-i*.055),(.135,-.16-i*.055),(.135,-.175-i*.055),(.024,-.195-i*.055)],.008,'graphite',side*.064,.003)
    cylinder('Free floating rifle barrel',(0,.059427,.47),.043,.42,'steel',16)
    for side in (-1,1):
        fore=profile('Tapered forward floating handguard',[(.20,.10),(.34,.145),(.51,.12),(.59,.072),(.55,-.005),(.26,-.04)],.045,'ivory',side*.078,.0045)
        for f in (.29,.38,.47):
            pocket(fore,[(f,.03),(f+.035,.035),(f+.045,.075),(f+.01,.075)],.08,side*.078)
    ring('Ported rifle crown',(0,.059427,.678),.067,.022,.091,'steel',14)
    rail(-.17,.12,.17)
    sight=profile('Compact hooded reflex sight',[(-.15,.205),(-.055,.205),(-.035,.26),(-.06,.295),(-.15,.28),(-.17,.24)],.074,'steel',bevel=.007)
    pocket(sight,[(-.135,.225),(-.07,.225),(-.06,.257),(-.135,.26)],.12)
    box('Reflex lens edge',(0,.24,-.065),(.05,.019,.007),'cyan',.002)


def shotgun():
    # Short bullpup rear mass + fat bores; muzzle contract is fixed at +.8705.
    core=profile('Short bullpup breech',[(-.43,.095),(-.33,.21),(.12,.23),(.30,.18),(.38,.065),(.31,-.09),(.08,-.16),(-.25,-.13),(-.44,-.035)],.245,'graphite',bevel=.024)
    for side in (-1,1):
        cover=profile('Short bullpup thermal service cover',[(-.35,.10),(-.27,.18),(.10,.19),(.25,.15),(.29,.065),(.22,-.035),(.02,-.075),(-.27,-.07)],.035,'plate',side*.124,.0045)
        for vent in (-.21,-.10,.01):
            pocket(cover,[(vent,.015),(vent+.035,.015),(vent+.085,.10),(vent+.045,.10)],.08,side*.124)
        screw(-.24,.06,side*.15); screw(.19,.08,side*.15)
    profile('Close shoulder recoil saddle',[(-.43,.10),(-.38,.13),(-.35,-.08),(-.39,-.145),(-.46,-.10),(-.47,.035)],.28,'plate',bevel=.02)
    grip(-.04,-.10,.13)
    for side in (-1,1):
        cylinder('Heavy parallel shotgun bore',(side*.092,.09744,.58),.083,.48,'steel',14)
        ring('Wide cut-crown shotgun muzzle',(side*.092,.09744,.815),.097,.026,.111,'graphite',14)
    top_profile('Sculpted broad barrel heat shield',[(.27,-.13),(.39,-.17),(.63,-.15),(.73,-.11),(.73,.11),(.63,.15),(.39,.17),(.27,.13)],.192,.065,'ivory',.012)
    for side in (-1,1):
        shield=profile('Arched forward pump shell',[(.32,.06),(.39,.11),(.64,.09),(.69,.01),(.60,-.065),(.38,-.075)],.034,'steel',side*.16,.0045)
        for f in (.40,.47,.54):
            pocket(shield,[(f,.01),(f+.025,.012),(f+.027,.063),(f+.005,.065)],.07,side*.16)
    profile('Sloped sight rib',[(.15,.235),(.57,.20),(.69,.21),(.69,.235),(.19,.27)],.07,'graphite',bevel=.004)
    box('Cyan bead',(0,.253,.64),(.03,.01,.035),'cyan',.002)
    profile('Oversized breech lever',[(-.17,.14),(-.10,.13),(-.03,.21),(-.05,.24),(-.10,.21)],.035,'amber',-.16,.006)


def plasma():
    profile('Plasma rear containment keel',[(-.54,.10),(-.41,.20),(-.14,.22),(.05,.16),(.20,.11),(.18,-.09),(-.02,-.16),(-.33,-.11),(-.55,-.02)],.20,'graphite',bevel=.02)
    for side in (-1,1):
        profile('Swept ceramic containment cheek',[(-.49,.09),(-.38,.17),(-.15,.18),(.06,.12),(.10,.03),(-.02,-.06),(-.36,-.065)],.035,'ivory',side*.106,.014)
        screw(-.32,.07,side*.13)
    grip(-.22,-.08)
    # Large actual gap: curved forks hold a luminous cylindrical cell with open
    # top/side space around it, rather than painting a rectangle cyan.
    for side in (-1,1):
        fork=profile('Swept open induction fork',[(.02,.13),(.23,.25),(.66,.25),(.88,.16),(.945,.12),(.93,.005),(.81,-.05),(.67,.04),(.27,.06),(.13,-.07),(.02,-.06)],.055,'plate',side*.14,.014)
        profile('Ivory fork terminal',[(.78,.17),(.89,.14),(.95,.10),(.935,.015),(.85,-.01),(.79,.04)],.08,'ivory',side*.14,.012)
        for f in (.28,.41,.54,.67):
            cylinder('Induction toroid collar',(side*.14,.14,f),.052,.038,'steel',12)
        profile('Luminous inner conductor',[(.24,.093),(.67,.093),(.80,.05),(.81,.075),(.67,.122),(.24,.122)],.018,'core',side*.102,.004)
    cylinder('Open luminous chamber',(0,.097038,.40),.068,.41,'core',20)
    ring('Ceramic rear field stop',(0,.097038,.17),.103,.023,.07,'ivory',16)
    ring('Luminous muzzle field stop',(0,.097038,.631),.105,.025,.065,'steel',16)
    for f in (.27,.38,.49):
        ring('Floating inductor ring',(0,.097038,f),.115,.018,.022,'steel',16)
    top_profile('Swept charge yoke',[(-.08,-.13),(.03,-.19),(.18,-.16),(.25,-.10),(.25,.10),(.18,.16),(.03,.19),(-.08,.13)],.22,.055,'ivory',.009)
    profile('Charge warning window',[(-.10,.225),(.04,.225),(.09,.25),(-.09,.26)],.08,'core',bevel=.003)


def rocket():
    # Tapered circular shoulder tube: the barrel, not a rectangular chassis,
    # dominates every view. Recessed rear and front apertures stay genuinely open.
    ring('Continuous shoulder launch tube',(0,.1375766,-.02),.163,.022,1.30,'steel',20)
    ring('Flared front launch lip',(0,.1375766,.647),.196,.031,.134,'ivory',20)
    ring('Rear pressure collar',(0,.1375766,-.739),.187,.030,.14,'graphite',20)
    ring('Rear annular warning light',(0,.1375766,-.646),.174,.016,.024,'heat',20)
    for side in (-1,1):
        profile('Tapered launcher shell cheek',[(-.57,.25),(-.41,.29),(.26,.29),(.47,.24),(.52,.15),(.44,.055),(.23,.018),(-.44,.02),(-.58,.075)],.035,'ivory',side*.155,.014)
        profile('Dark longitudinal service inset',[(-.41,.11),(.29,.11),(.36,.15),(.28,.19),(-.39,.19)],.012,'graphite',side*.177,.006)
        screw(-.39,.24,side*.178); screw(.26,.23,side*.178)
    cradle=[(-.83,-.02),(-.72,.005),(-.28,.005),(-.17,-.035),(-.16,-.12)]
    cradle += [(-.21-.57*i/18, -.205+.125*math.sin(math.pi*i/18)) for i in range(19)]
    cradle += [(-.84,-.14)]
    profile('Continuous curved shoulder cradle',cradle,.31,'plate',bevel=.018)
    # The soft contact layer follows the actual shoulder arc, with a visible
    # rounded contact lip at both sides, not a token angular foregrip.
    contact=[(-.21-.57*i/18, -.205+.125*math.sin(math.pi*i/18)) for i in range(19)]
    contact += [(-.21-.57*i/18, -.235+.125*math.sin(math.pi*i/18)) for i in reversed(range(19))]
    profile('Curved rubber shoulder contact',contact,.325,'graphite',bevel=.009)
    grip(-.12,-.08,.12)
    profile('Folded forward carrying grip',[(.24,-.025),(.36,-.025),(.32,-.26),(.27,-.31),(.20,-.28),(.22,-.20)],.10,'graphite',bevel=.018)
    profile('Offset sight riser',[(-.14,.23),(-.06,.23),(-.06,.38),(-.13,.39),(-.18,.31)],.065,'steel',-.215,.009)
    hood=profile('Offset open launcher sight',[(-.20,.36),(-.02,.36),(.015,.43),(-.015,.49),(-.18,.49),(-.23,.43)],.10,'graphite',-.215,.01)
    pocket(hood,[(-.17,.39),(-.035,.39),(-.02,.435),(-.045,.46),(-.17,.46),(-.195,.43)],.15,-.215)
    box('Launcher aiming line',(-.215,.41,-.03),(.055,.008,.008),'heat',.002)


def bake_and_join(name):
    high_parts = []
    for part_index, obj in enumerate(parts):
        offsets = obj.data.attributes.new('k10ExplodedBake', 'FLOAT', 'POINT')
        for value in offsets.data:
            value.value = part_index * 3.0
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
    obj.name = name+'-ka12-arsenal'
    obj.data.calc_loop_triangles()
    count = len(obj.data.loop_triangles)
    if count > 4900:
        dec = obj.modifiers.new('Gameplay triangle budget', 'DECIMATE')
        dec.ratio = 4850 / count
        bpy.ops.object.modifier_apply(modifier=dec.name)
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
    bake_passes = [('base', 'DIFFUSE'), ('ao', 'AO'), ('normal', 'NORMAL'), ('curvature', 'EMIT')]
    if name in ('plasma', 'rocket'):
        bake_passes.append(('emission', 'EMIT'))
    for label, bake_type in bake_passes:
        image = bpy.data.images.new(name+'-'+label, width=512, height=512, alpha=False)
        if label not in ('base', 'emission'):
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
            elif label == 'emission':
                emit = nodes.new('ShaderNodeEmission')
                emit.inputs['Color'].default_value = PALETTE['core'] if mat.name.startswith('core') else PALETTE['heat'] if mat.name.startswith('heat') else (0, 0, 0, 1)
                mat.node_tree.links.new(emit.outputs[0], nodes.get('Material Output').inputs['Surface'])
        if label == 'normal':
            # Separate paired parts for projection: a cheek plate must never
            # project onto the adjacent tube. UVs were packed while assembled.
            for target in (obj, high):
                offsets = target.data.attributes['k10ExplodedBake'].data
                for vertex, offset in zip(target.data.vertices, offsets):
                    vertex.co.x += offset.value
                target.data.update()
            high.hide_render = False
            high.select_set(True)
            bpy.context.view_layer.objects.active = obj
            scene.render.bake.use_selected_to_active = True
            scene.render.bake.cage_extrusion = .008
            scene.render.bake.max_ray_distance = .02
        bpy.ops.object.bake(type=bake_type)
        if label == 'normal':
            for target in (obj, high):
                offsets = target.data.attributes['k10ExplodedBake'].data
                for vertex, offset in zip(target.data.vertices, offsets):
                    vertex.co.x -= offset.value
                target.data.update()
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
        gain = (.92 + .08*ao[i]) * (.985 + .03*curve[i])
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
    if 'emission' in images:
        emissive = nodes.new('ShaderNodeTexImage'); emissive.image = images['emission']
        final.node_tree.links.new(emissive.outputs['Color'], shader.inputs['Emission Color'])
        shader.inputs['Emission Strength'].default_value = 2.5
    obj.data.materials.clear(); obj.data.materials.append(final)
    for poly in obj.data.polygons:
        poly.material_index = 0
    obj['authorship'] = 'Original Containment KA12 artwork, MIT'
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
    scene.render.engine = 'CYCLES'; choose_render_device(scene); scene.cycles.samples = 48
    scene.cycles.use_denoising = True
    scene.render.threads_mode = 'FIXED'; scene.render.threads = 4
    scene.world.color = (.07, .085, .10)
    scene.view_settings.view_transform = 'AgX'
    scene.render.resolution_x = 1050; scene.render.resolution_y = 700
    scene.render.resolution_percentage = 100
    for p, power, size in [((2, -2, 4), 450, 3), ((-3, 1, 2), 320, 2)]:
        light = bpy.data.objects.new('Studio softbox', bpy.data.lights.new('Studio softbox', 'AREA'))
        bpy.context.collection.objects.link(light); light.location = p
        light.rotation_euler = (Vector((0, 0, 0))-light.location).to_track_quat('-Z', 'Y').to_euler()
        light.data.energy = power; light.data.shape = 'DISK'; light.data.size = size
    for label, pos in [('three-quarter', (2.4, -3.3, 3.7)), ('side', (3, 0, .3)), ('top', (0, -.001, 4))]:
        if '--beauty-only' in sys.argv and label != 'three-quarter': continue
        scale = (3.05 if name != 'pistol' else 1.65) if label == 'top' else (2.02 if name != 'pistol' else 1.20)
        if name == 'rocket' and label == 'three-quarter': scale = 2.50
        if name == 'pistol' and label == 'side': scale = 1.48
        cam = camera_at(pos, (0, -.03, .03), scale)
        scene.render.filepath = str(ART / (name+'-'+label+'.png'))
        bpy.ops.render.render(write_still=True)
        bpy.data.objects.remove(cam, do_unlink=True)


manifest = {'license': 'MIT', 'originalGeometry': True, 'textureSize': [512,512], 'weapons': {}}
for name in MUZZLES:
    only = next((x.split('=',1)[1] for x in sys.argv if x.startswith('--only=')), None)
    if only and name != only: continue
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    parts = []; mats = {k:material(k,v) for k,v in PALETTE.items()}
    globals()[name]()
    # KA12 service hardware: mechanical controls are distinct volumes, with
    # recessed bolt channels and ambidextrous selector/catch details.
    if name in ('pistol', 'rifle', 'shotgun'):
        side = .115 if name != 'shotgun' else .164
        f = -.05 if name != 'pistol' else .10
        profile('Recessed bolt race',[(f-.09,.035),(f+.09,.035),(f+.11,.083),(f-.07,.083)],.012,'port',side,.002)
        cylinder('Charging handle stem',(side+.035,.06,f),.014,.07,'steel',8,'side')
        profile('Hooked charging paddle',[(f-.025,.04),(f+.035,.04),(f+.045,.09),(f+.02,.11),(f-.02,.095)],.025,'graphite',side+.075,.004)
        cylinder('Selector pivot',(-side-.005,-.015,-.15),.022,.018,'steel',8,'side')
        profile('Safety selector lever',[(-.17,-.005),(-.115,-.025),(-.11,-.045),(-.16,-.025)],.012,'amber',-side-.02,.003)
    if name == 'pistol':
        profile('Removable magazine heel',[(-.31,-.36),(-.15,-.36),(-.14,-.39),(-.32,-.395)],.13,'steel',bevel=.006)
    if name == 'rifle':
        # Low forward palm saddle closes the former support-glove gap without
        # altering the skeleton, clip or muzzle frame.
        profile('Forward palm saddle',[(.24,-.025),(.53,-.012),(.55,-.065),(.43,-.11),(.27,-.09)],.14,'graphite',bevel=.012)
    if name == 'shotgun':
        profile('Detachable drum feed neck',[(-.27,-.10),(-.12,-.10),(-.10,-.23),(-.26,-.23)],.15,'steel',bevel=.009)
        cylinder('Compact rotary shell magazine',(0,-.23,-.22),.14,.23,'graphite',12,'side')
    if name == 'plasma':
        profile('Removable capacitor magazine',[(-.40,-.08),(-.29,-.08),(-.25,-.29),(-.36,-.32),(-.43,-.23)],.15,'steel',bevel=.012)
    if ROUND >= 2:
        # Restrained sight/control accents instead of uniform pale shells.
        if name == 'rocket':
            box('Launch interlock housing',(0,.303,-.43),(.10,.035,.13),'graphite',.008)
            profile('Safety interlock paddle',[(-.46,.32),(-.35,.32),(-.33,.35),(-.45,.36)],.055,'amber',bevel=.005)
            box('Launcher optic smoked lens',(-.215,.425,-.017),(.07,.045,.008),'cyan',.003)
        if name == 'shotgun':
            for f in (-.17,-.10,-.03):
                box('Breech heat relief',(0,.224,f),(.13,.006,.022),'port',.003)
        if name == 'rifle':
            ring('Dark muzzle face',(0,.059427,.718),.067,.023,.012,'graphite',12)
            box('Reflex smoked lens',(0,.249,-.047),(.051,.035,.006),'cyan',.002)
            box('Rear optic dark notch',(0,.276,-.151),(.035,.016,.008),'port',.002)
        if name == 'pistol':
            for f in (.12,.18,.24):
                box('Slide cooling aperture',(0,.149,f),(.075,.005,.022),'port',.003)
        mats['ivory'].node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.40,.46,.43,1)
    if ROUND >= 3:
        if name in ('pistol','shotgun'):
            target = next(o for o in parts if o.name.startswith('Hooked compact slide' if name == 'pistol' else 'Short bullpup breech'))
            for f in ((.12,.18,.24) if name == 'pistol' else (-.17,-.10,-.03)):
                h = .148 if name == 'pistol' else .224
                groove(target,(0,h,f),(.078 if name == 'pistol' else .133,.035,.025))
            for o in parts:
                if o.name.startswith(('Slide cooling aperture','Breech heat relief')): o.location.z -= .025
        mats['steel'].node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.42

    if '--forms' in sys.argv:
        render(name)
        continue
    obj = bake_and_join(name)
    muzzle = socket('muzzle', MUZZLES[name])
    # Current casing presentation derives its origin from muzzle - .65m;
    # retain a named matching socket for later VFX adoption, without runtime edits.
    m = MUZZLES[name]
    eject = socket('ejection', (m[0]+.08, m[1], m[2]-.65))
    bpy.ops.object.select_all(action='DESELECT')
    for x in (obj, muzzle, eject): x.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')), export_format='GLB', use_selection=True, export_animations=False, export_extras=True, export_copyright='Containment contributors, original KA12 arsenal geometry and textures, MIT')
    retain_socket_precision(OUT/(name+'.glb'), {'muzzle':m, 'ejection':(m[0]+.08,m[1],m[2]-.65)})
    obj.data.calc_loop_triangles()
    manifest['weapons'][name] = {'triangles':len(obj.data.loop_triangles), 'vertices':len(obj.data.vertices), 'muzzle':list(m), 'bytes':(OUT/(name+'.glb')).stat().st_size, 'materials':1, 'embeddedTextures':['base','normal']+(['emission'] if name in ('plasma','rocket') else []), 'bakes':['AO','geometric curvature','tangent normal'], 'normalDetail':'Three-segment rounded machined edges projected onto one-segment gameplay bevels, selected-to-active tangent-space bake.'}
    render(name)
(ART/('forms-manifest.json' if '--forms' in sys.argv else 'manifest.json')).write_text(json.dumps(manifest, indent=2)+'\n')
print(json.dumps(manifest, indent=2))
