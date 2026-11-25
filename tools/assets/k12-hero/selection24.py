"""Render the selector close-ups and the Breacher plate for the title."""
import argparse
import math
import sys
from pathlib import Path
import bpy
from mathutils import Matrix, Vector

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import hero
import materials
from render_device import choose_render_device

SHOTS = {
    'breacher': ('shotgun', (1, .48, .19)),
    'cryo': ('rifle', (1, .48, .18)),
    'pyro': ('rocket', (.80, -1.15, .20)),
    'arc': ('plasma', (1, .20, .18)),
}
parser = argparse.ArgumentParser()
parser.add_argument('--rig', nargs='+', choices=SHOTS, default=list(SHOTS))
parser.add_argument('--out', type=Path, default=hero.ROOT / 'public/assets/ui/studio')
parser.add_argument('--preview', action='store_true')
parser.add_argument('--title', action='store_true', help='Light and frame the close-up Breacher for the breached hatch')
args = parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
args.out.mkdir(parents=True, exist_ok=True)
hero.HERO_GLB = hero.HERO_GLB.with_name('marine-selection.glb')


def lamp(name, position, target, power, size, colour):
    bpy.ops.object.light_add(type='AREA', location=position)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler = (target - obj.location).to_track_quat('-Z', 'Y').to_euler()
    obj.data.energy, obj.data.size, obj.data.color = power, size, colour


def brace_shield(arm):
    """Pose the off hand independently of the shotgun, elbow down and plate forward."""
    upper, lower, hand = [arm.pose.bones[name+'.L'] for name in ('upper_arm', 'forearm', 'hand')]
    world = arm.matrix_world
    def joint(bone):
        return world @ bone.head

    def aim(bone, end, target):
        origin = joint(bone)
        turn = (joint(end)-origin).rotation_difference(target-origin)
        pivot = Matrix.Translation(origin)
        bone.matrix = world.inverted() @ pivot @ turn.to_matrix().to_4x4() @ pivot.inverted() @ world @ bone.matrix
        bpy.context.view_layer.update()

    shoulder = joint(upper)
    wrist = shoulder + Vector((.40,.18,-.14))
    reach = wrist-shoulder
    axis = reach.normalized()
    a, b = (joint(lower)-shoulder).length, (joint(hand)-joint(lower)).length
    projection = (a*a-b*b+reach.length_squared)/(2*reach.length)
    down = Vector((0,0,-1))
    pole = (down-axis*down.dot(axis)).normalized()
    elbow = shoulder + axis*projection + pole*math.sqrt(max(0,a*a-projection*projection))
    aim(upper, lower, elbow)
    aim(lower, hand, wrist)


def shade_shotgun(gun):
    """Retain the shotgun atlas markings and normals under the graphite finish."""
    for obj in gun.children_recursive:
        if obj.type != 'MESH':
            continue
        for material in obj.data.materials:
            if not material or not material.node_tree:
                continue
            tree = material.node_tree
            surface = tree.nodes.get('Principled BSDF')
            base = surface.inputs['Base Color']
            if base.is_linked:
                atlas = base.links[0].from_socket
                pigment = tree.nodes.new('ShaderNodeMixRGB')
                pigment.blend_type = 'MULTIPLY'
                pigment.inputs[0].default_value = 1
                pigment.inputs[2].default_value = (.22,.25,.29,1)
                tree.links.new(atlas,pigment.inputs[1])
                tree.links.new(pigment.outputs[0],base)


original_amber = materials.PALETTE['amber']
for rig in (['breacher'] if args.title else args.rig):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    materials._cache.clear()
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    choose_render_device(scene)
    scene.cycles.samples = 8 if args.preview else 48
    scene.cycles.use_denoising = True
    scene.world = bpy.data.worlds.new('Low cool studio ambient')
    scene.world.color = (.09,.105,.13)
    resolution = 1728 if args.title else 640
    if args.preview:
        resolution = 640 if args.title else 320
    scene.render.resolution_x = scene.render.resolution_y = resolution
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.compression = 100
    scene.render.image_settings.color_mode = 'RGBA'
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.view_settings.exposure = -.75

    weapon, view = SHOTS[rig]
    if rig == 'breacher':
        materials.PALETTE['amber'] = (.57,.30,.034)
    objects, meshes, arm = hero.stage_hero(rig, weapon, curl=55)
    materials.PALETTE['amber'] = original_amber
    if args.title:
        view = (1.03, .80, .48)
    forward = Vector(view).normalized()
    orientation = (-forward).to_track_quat('-Z', 'Y')
    right, up = (orientation @ Vector(axis) for axis in ((1,0,0),(0,1,0)))
    guard_angle = {'breacher':24, 'arc':34}.get(rig)
    if args.title:
        guard_angle = 6
    if guard_angle:
        # Lower both hands together into a close guard. Turning around
        # the shoulder line preserves both grips and opens space under the face.
        shoulders = [arm.pose.bones['upper_arm.'+side] for side in ('L','R')]
        left, right_joint = [arm.matrix_world @ bone.head for bone in shoulders]
        pivot = Matrix.Translation((left+right_joint)/2)
        swing = pivot @ Matrix.Rotation(math.radians(guard_angle),4,(left-right_joint).normalized()) @ pivot.inverted()
        for bone in shoulders:
            bone.matrix = arm.matrix_world.inverted() @ swing @ arm.matrix_world @ bone.matrix
        gun = next(obj for obj in objects if obj.name.startswith('portrait held'))
        gun.matrix_world = swing @ gun.matrix_world
        bpy.context.view_layer.update()
    if rig == 'breacher':
        brace_shield(arm)
        shade_shotgun(gun)
    if rig == 'breacher':
        # Turn the visor slightly out of the shoulder while keeping the gun on the breach.
        head = arm.pose.bones['head']
        world = arm.matrix_world @ head.matrix
        pivot = Matrix.Translation(world.translation)
        # Lift the chin off the stock. The clavicle dome otherwise cuts across the glass.
        chin = Matrix.Translation((.032,0,.036)) @ pivot
        turn = Matrix.Rotation(.38,4,'Z') @ Matrix.Rotation(-.22,4,'Y')
        head.matrix = arm.matrix_world.inverted() @ chin @ turn @ pivot.inverted() @ world
        bpy.context.view_layer.update()
    # Open the legs in the camera plane, rotating about the hip and restoring
    # the boot's initial attitude so the soles keep their planted contact.
    inverse = arm.matrix_world.inverted()
    for side, angle in [('L',9),('R',-9)]:
        thigh = arm.pose.bones['thigh.'+side]
        foot = arm.pose.bones['foot.'+side]
        sole_rotation = foot.matrix.to_quaternion()
        world = arm.matrix_world @ thigh.matrix
        pivot = Matrix.Translation(world.translation)
        thigh.matrix = inverse @ pivot @ Matrix.Rotation(math.radians(angle),4,forward) @ pivot.inverted() @ world
        bpy.context.view_layer.update()
        location, _, scale = foot.matrix.decompose()
        foot.matrix = Matrix.LocRotScale(location,sole_rotation,scale)
        bpy.context.view_layer.update()
    points = hero.deformed_points([obj for obj in objects if obj.type == 'MESH'])
    bounds = [(min(p.dot(axis) for p in points),max(p.dot(axis) for p in points)) for axis in (right,up)]
    target = sum((axis * ((lo+hi)/2) for axis,(lo,hi) in zip((right,up),bounds)),Vector())
    bpy.ops.object.camera_add(location=target+forward*5)
    cam = bpy.context.object
    scene.camera = cam
    cam.rotation_euler = orientation.to_euler()
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = max(hi-lo for lo,hi in bounds)/.90

    centre = Vector((0,0,1.25))
    if args.title:
        lamp('hatch rim',centre-forward*1.4-right*.9+up*1.8,centre,540,.95,(.48,.67,1))
        lamp('reflected hatch softbox',centre+forward*1.5-right*2+up*2.5,centre,185,2.5,(.77,.86,1))
        lamp('maw return',centre+forward*.8-right*1.3-up*.45,centre,73,1.35,(1,.47,.19))
        lamp('equipment return',centre+forward+right*2+up*.8,centre,62,2,(.69,.80,.95))
    else:
        lamp('high warm softbox',centre+forward*2.4-right*2.3+up*2.9,centre,450,2.1,(1,.90,.76))
        lamp('equipment edge',centre-forward*1.3+right*1.9+up*1.6,centre,630,1.0,hero.ACCENTS[rig])
        lamp('cool return',centre+forward*1.7+right*2.1,centre,85,2.4,(.61,.76,1))
        lamp('boot edge',centre-forward*1.1-right*1.4,Vector((0,0,.5)),95,1.0,(.65,.79,1))
    visor = bpy.data.materials.get('k12-visor')
    if visor:
        shader = visor.node_tree.nodes.get('Principled BSDF')
        shader.inputs['Emission Color'].default_value = (.003,.21,.30,1)
        shader.inputs['Emission Strength'].default_value = 1.4
        if rig == 'breacher':
            shader.inputs['Emission Strength'].default_value = .75
            shader.inputs['Roughness'].default_value = .20
            shader.inputs['Coat Roughness'].default_value = .17
            steel = bpy.data.materials['k12-gunmetal'].node_tree.nodes.get('Principled BSDF')
            steel.inputs['Metallic'].default_value = .64
            edge = bpy.data.materials['k12-visor_edge'].node_tree.nodes.get('Principled BSDF')
            edge.inputs['Emission Strength'].default_value = 1.6
    scene.render.filepath = str(args.out / ('breacher.png' if args.title else f'portrait-{rig}.png'))
    bpy.ops.render.render(write_still=True)
