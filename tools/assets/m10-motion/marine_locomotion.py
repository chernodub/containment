"""Author and bake original eight-direction marine footwork on the retained rig.

Run with Blender: blender -b -P tools/assets/m10-motion/marine_locomotion.py
The temporary foot/pole controls are authoring objects; only original bones ship.
Directions are game-local: 0=+X forward, 90=+Z right, 180=backwards.
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
import sys
import struct

import bpy
from mathutils import Matrix, Quaternion, Vector

ROOT = Path(__file__).resolve().parents[3]
FPS = 60
CYCLE_SECONDS = 1 / 3
NOMINAL_SIM_SPEED = 220.0
UP = Vector((0, -1, 0))
FORWARD = Vector((1, 0, 0))
# The imported armature is Rx(-90deg): local-Z is source glTF+Z.
RIGHT = Vector((0, 0, -1))


def smooth(value):
    value = max(0.0, min(1.0, value))
    return value * value * (3 - 2 * value)


def arc(keys, time):
    """Catmull-Rom authoring curve through explicit foot-contact/swing keys."""
    for index in range(len(keys) - 1):
        if keys[index][0] <= time <= keys[index + 1][0]:
            first, second = keys[index], keys[index + 1]
            previous = keys[max(0, index - 1)]
            following = keys[min(len(keys) - 1, index + 2)]
            u = (time - first[0]) / max(1e-7, second[0] - first[0])
            return tuple(.5 * ((2 * first[k]) + (-previous[k] + second[k]) * u +
                (2 * previous[k] - 5 * first[k] + 4 * second[k] - following[k]) * u * u +
                (-previous[k] + 3 * first[k] - 3 * second[k] + following[k]) * u ** 3)
                for k in range(1, len(first)))
    return tuple(keys[0][1:] if time < keys[0][0] else keys[-1][1:])


# These are individual stance/airborne paths, not an eight-way rotation of one run.
# Each tuple holds stance fraction, lift, forward swing bow, lateral swing bow,
# lead offset, foot yaw, pelvic crouch and hip counter-rotation amplitude.
GAITS = {
    0: (.43, 1.85, -.32, .12, .50, .015, 1.50, .10),
    45: (.45, 1.72, .75, .55, .53, .13, 1.72, .16),
    90: (.45, 1.54, 1.70, .32, .56, .22, 1.90, .24),
    135: (.45, 1.28, 1.15, -.42, .54, .16, 1.82, .19),
    180: (.40, 1.10, -.90, .18, .50, -.04, 1.60, .12),
    225: (.45, 1.28, 1.15, .42, .46, -.16, 1.82, .19),
    270: (.45, 1.54, 1.70, -.32, .44, -.22, 1.90, .24),
    315: (.45, 1.72, .75, -.55, .47, -.13, 1.72, .16),
}


def foot_path(direction, side, phase, source_speed):
    stance, lift, forward_bow, side_bow, offset, yaw, _, _ = GAITS[direction]
    phase = (phase + (offset if side == 'L' else 0.0)) % 1.0
    angle = math.radians(direction)
    travel = FORWARD * math.cos(angle) + RIGHT * math.sin(angle)
    half_stride = source_speed * CYCLE_SECONDS * stance * .5
    # The contact segment is strictly linear: its velocity cancels native travel.
    if phase < stance:
        along = half_stride - source_speed * CYCLE_SECONDS * phase
        displacement = travel * along
        pitch = arc(((0, -.14), (.18, 0), (.70, .025), (1, .22)), phase / stance)[0]
        if direction in (135, 180, 225):
            pitch = arc(((0, .22), (.26, .03), (.76, -.04), (1, -.13)), phase / stance)[0]
        return displacement, pitch, yaw, True
    swing = (phase - stance) / (1 - stance)
    along, height = arc(((0, -half_stride, 0), (.19, -half_stride * 1.12, lift * .58),
        (.49, -half_stride * .04, lift), (.79, half_stride * .91, lift * .54),
        (1, half_stride, 0)), swing)
    displacement = travel * along + UP * max(0, height)
    envelope = math.sin(math.pi * swing)
    # Trailing foot crosses in front; leading foot circles behind it. This
    # separates the two shoes in the crossing interval instead of intersecting.
    leading = side == ('L' if math.sin(angle) >= 0 else 'R')
    if direction in (90, 270):
        displacement += FORWARD * envelope * (forward_bow if not leading else -.72)
        displacement += RIGHT * envelope * side_bow * (1 if leading else -.6)
    elif direction in (45, 135, 225, 315):
        displacement += FORWARD * envelope * forward_bow * (1 if not leading else -.35)
        displacement += RIGHT * envelope * side_bow * (1 if leading else -.55)
    else:
        displacement += FORWARD * envelope * forward_bow
        displacement += RIGHT * envelope * side_bow * (-1 if side == 'R' else 1)
    pitch = arc(((0, .22), (.30, -.30), (.66, -.22), (1, -.14)), swing)[0]
    if direction in (135, 180, 225):
        pitch = arc(((0, -.13), (.34, .30), (.72, .24), (1, .22)), swing)[0]
    return displacement, pitch, yaw + envelope * (.10 if leading else -.08), False


class MarineFootRig:
    """Actual Blender two-bone IK, with separate original ankle/shoe chains."""
    def __init__(self, armature, base_basis, source_height):
        self.armature = armature
        self.base_basis = base_basis
        self.source_speed = NOMINAL_SIM_SPEED / 32 * source_height / 2.05
        self.legs = {}
        self.constraints = []
        bpy.context.view_layer.update()
        self.base = {bone.name: bone.matrix.copy() for bone in armature.pose.bones}
        for side in ('L', 'R'):
            shin = armature.pose.bones['shin.' + side]
            ankle = armature.pose.bones['ankle.' + side]
            target = bpy.data.objects.new('M10_foot_IK.' + side, None)
            pole = bpy.data.objects.new('M10_knee_pole.' + side, None)
            bpy.context.collection.objects.link(target)
            bpy.context.collection.objects.link(pole)
            target.empty_display_type = 'CUBE'
            target.empty_display_size = .3
            pole.empty_display_type = 'SPHERE'
            pole.empty_display_size = .25
            target.location = armature.matrix_world @ shin.tail
            pole.location = armature.matrix_world @ (shin.head + FORWARD * 5)
            constraint = shin.constraints.new('IK')
            constraint.name = 'M10 planted foot solve'
            constraint.target = target
            constraint.pole_target = pole
            constraint.chain_count = 2
            constraint.use_stretch = False
            constraint.iterations = 128
            # Import bone rolls differ between the two sides. Choose the pole
            # angle against the retained knee before authoring any motion.
            knee = shin.head.copy()
            best = (float('inf'), 0)
            for angle in (0, math.pi / 2, -math.pi / 2, math.pi):
                constraint.pole_angle = angle
                bpy.context.view_layer.update()
                evaluated = armature.evaluated_get(bpy.context.evaluated_depsgraph_get())
                error = (evaluated.pose.bones[shin.name].head - knee).length
                if error < best[0]:
                    best = (error, angle)
            constraint.pole_angle = best[1]
            self.constraints.append(constraint)
            self.legs[side] = dict(target=target, pole=pole, ankle=ankle,
                foot=self.base[ankle.name].translation.copy(),
                tip_offset=shin.tail.copy() - ankle.matrix.translation,
                knee=knee)

    def reset(self):
        for name, basis in self.base_basis.items():
            self.armature.pose.bones[name].matrix_basis = basis.copy()

    def control(self, side, displacement, pitch, yaw, knee_open=0):
        leg = self.legs[side]
        target_position = leg['foot'] + displacement
        rotation = Quaternion(UP, -yaw) @ Quaternion(RIGHT, -pitch)
        matrix = rotation.to_matrix().to_4x4() @ self.base[leg['ankle'].name]
        matrix.translation = target_position
        leg['ankle'].matrix = matrix
        leg['target'].location = self.armature.matrix_world @ (target_position + rotation @ leg['tip_offset'])
        pole = leg['knee'] + FORWARD * 5 + RIGHT * knee_open
        leg['pole'].location = self.armature.matrix_world @ pole

    def torso(self, crouch, yaw, lean, lateral, phase):
        hips = self.armature.pose.bones['hips']
        matrix = Quaternion(UP, yaw).to_matrix().to_4x4() @ self.base['hips']
        matrix.translation = self.base['hips'].translation + UP * -crouch + RIGHT * lateral
        hips.matrix = matrix
        bpy.context.view_layer.update()
        spine = self.armature.pose.bones['spine']
        # World/armature-space counter-rotation keeps the ribcage and weapon
        # forward while the hips make the visible cross-over weight transfer.
        matrix = spine.matrix.copy()
        matrix = Quaternion(UP, -yaw * 1.18).to_matrix().to_4x4() @ matrix
        rotation = Quaternion(RIGHT, lean)
        matrix = rotation.to_matrix().to_4x4() @ matrix
        matrix.translation = spine.matrix.translation
        spine.matrix = matrix

    def pose_cycle(self, direction, phase, weight=1.0):
        self.reset()
        _, _, _, _, _, _, crouch, rotation = GAITS[direction]
        beat = math.sin(phase * math.tau)
        # Two grounded load/compression beats, with lateral transfer strongest
        # in side travel and a compact, rear-loaded backpedal posture.
        dip = crouch + .65 * (1 - math.cos(phase * math.tau * 2))
        angle = math.radians(direction)
        lean = -.13 * math.cos(angle) + .035 * math.sin(phase * math.tau * 2)
        self.torso(dip * weight, beat * rotation * weight, lean * weight,
            math.sin(angle) * beat * .22 * weight, phase)
        for side in ('L', 'R'):
            displacement, pitch, yaw, planted = foot_path(direction, side, phase, self.source_speed)
            self.control(side, displacement * weight, pitch * weight, yaw * weight,
                math.sin(angle) * (-1 if side == 'R' else .4))

    def pose_transition(self, direction, kind, progress):
        if kind == 'start':
            amount = smooth(progress)
            self.pose_cycle(direction, .62 + progress * .38, amount)
            # A visible compression precedes the first airborne step.
            if progress < .30:
                hips = self.armature.pose.bones['hips']
                matrix = hips.matrix.copy()
                matrix.translation += UP * (-.65 * math.sin(math.pi * progress / .30))
                hips.matrix = matrix
            return
        if kind == 'stop':
            amount = 1 - smooth(progress)
            self.pose_cycle(direction, progress * .46, amount)
            # The final braking plant widens by a small amount before settling.
            for side in ('L', 'R'):
                displacement, pitch, yaw, _ = foot_path(direction, side, progress * .46, self.source_speed)
                displacement = displacement * amount + RIGHT * ((-1 if side == 'R' else 1) * .32 * math.sin(math.pi * progress))
                self.control(side, displacement, pitch * amount, yaw * amount)
            return
        # The old lead shoe stays planted for the first third of the reversal;
        # the second shoe makes a high pivot/crossover before the new push-off.
        old = (direction + 180) % 360
        self.reset()
        amount = smooth(progress)
        new_profile = GAITS[direction]
        old_profile = GAITS[old]
        beat = math.sin(math.pi * progress)
        angle = math.radians(direction)
        self.torso(old_profile[6] * (1 - amount) + new_profile[6] * amount + .7 * beat,
            old_profile[7] * (1 - amount) + math.sin(angle) * .40 * beat,
            -.13 * math.cos(angle) * (2 * amount - 1) - .15 * math.cos(angle) * beat,
            -math.sin(angle) * .22 * (1 - amount), progress)
        for side in ('L', 'R'):
            previous, old_pitch, old_yaw, _ = foot_path(old, side, .25, self.source_speed)
            following, new_pitch, new_yaw, _ = foot_path(direction, side, 0, self.source_speed)
            transfer = smooth((progress - (.22 if side == 'L' else 0)) / (.78 if side == 'L' else .72))
            displacement = previous.lerp(following, transfer)
            displacement += UP * (math.sin(math.pi * transfer) * (1.8 if side == 'L' else .9))
            displacement += FORWARD * math.sin(math.pi * transfer) * (1.1 if side == 'L' else -.5)
            self.control(side, displacement, old_pitch * (1 - transfer) + new_pitch * transfer,
                old_yaw * (1 - transfer) + new_yaw * transfer)


def main():
    # The shared authoring/export helper owns source-coordinate rebasing and
    # animation-only packaging. No base model geometry is exported by this file.
    sys.path.insert(0, str(Path(__file__).parent))
    import common
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, default=ROOT / 'public/assets/models/marine.glb')
    parser.add_argument('--out', type=Path, default=ROOT / 'tools/assets/m10-motion/.build/marine-locomotion-motion.glb')
    parser.add_argument('--cycles-only', action='store_true')
    args = parser.parse_args(argv)
    build(common, args)


def build(common, args):
    armature = common.import_existing(args.source)
    base = common.source_pose(armature, 'stand', upper='shotgun_delta', upper_root='ribs')
    depsgraph = bpy.context.evaluated_depsgraph_get()
    # Calibrate to the same posed standing height that the runtime fits to2.05m.
    heights = []
    for obj in bpy.context.scene.objects:
        if obj.type != 'MESH':
            continue
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        heights.extend((evaluated.matrix_world @ vertex.co).z for vertex in mesh.vertices)
        evaluated.to_mesh_clear()
    source_height = max(heights) - min(heights)
    rig = MarineFootRig(armature, base, source_height)
    names = []
    ordered = sorted(armature.pose.bones, key=lambda bone: len(bone.parent_recursive))
    locomotion_bones = {'hips', 'spine', 'thigh.L', 'thigh.R', 'shin.L', 'shin.R', 'ankle.L', 'ankle.R'}

    def record(name, seconds, pose):
        # Author controls first, sample their evaluated two-bone solve, then key
        # only the retained deform/control bones. The temporary IK objects never
        # enter the GLB, and the source edit-bone rest matrices remain untouched.
        armature.animation_data.action = None
        frames = max(2, round(seconds * FPS))
        sampled = []
        for constraint in rig.constraints:
            constraint.mute = False
        for tick in range(frames + 1):
            pose(tick / frames)
            bpy.context.view_layer.update()
            evaluated = armature.evaluated_get(bpy.context.evaluated_depsgraph_get())
            sampled.append({bone.name: bone.matrix.copy() for bone in evaluated.pose.bones})
        for constraint in rig.constraints:
            constraint.mute = True
        common.new_action(armature, name, seconds, FPS)
        for tick, matrices in enumerate(sampled):
            bpy.context.scene.frame_set(tick + 1)
            for bone in ordered:
                if bone.name not in locomotion_bones:
                    # Hands, receiver socket, face and all their descendants
                    # retain the same ready locals throughout every gait.
                    bone.matrix_basis = base[bone.name].copy()
                elif bone.parent:
                    # Assigning pose.matrix down a hierarchy uses Blender's
                    # stale evaluated parent until a depsgraph refresh. Convert
                    # explicitly against the SAME sampled parent instead.
                    bone.matrix_basis = bone.bone.convert_local_to_pose(
                        matrices[bone.name], bone.bone.matrix_local,
                        parent_matrix=matrices[bone.parent.name],
                        parent_matrix_local=bone.parent.bone.matrix_local, invert=True)
                else:
                    bone.matrix_basis = bone.bone.convert_local_to_pose(
                        matrices[bone.name], bone.bone.matrix_local, invert=True)
            common.key_pose(armature, tick + 1)
        names.append(name)
        print('M10 authored', name, 'seconds', frames / FPS, 'keys', frames + 1, flush=True)

    for direction in GAITS:
        record(f'm10-run-{direction}', CYCLE_SECONDS,
            lambda progress, direction=direction: rig.pose_cycle(direction, progress % 1))
    if not args.cycles_only:
        for kind, seconds in (('start', .35), ('stop', .30), ('reversal', .45)):
            for direction in GAITS:
                record(f'm10-{kind}-{direction}', seconds,
                    lambda progress, direction=direction, kind=kind:
                        rig.pose_transition(direction, kind, progress))
    # Constraints served their authoring purpose; the export contains the baked
    # original-bone keys and does not need a second solve during glTF sampling.
    for bone in armature.pose.bones:
        for constraint in list(bone.constraints):
            if constraint.name == 'M10 planted foot solve':
                bone.constraints.remove(constraint)
    pending = args.out.with_suffix('.pending.glb')
    common.export_motion(armature, pending, names)
    # Ship calibration with the animation asset so its playback rate does not
    # depend on the former run clip's guessed130-unit contact speed.
    data = pending.read_bytes()
    length = struct.unpack_from('<I', data, 12)[0]
    document = json.loads(data[20:20 + length])
    for clip in document['animations']:
        direction = int(clip['name'].rsplit('-', 1)[1])
        clip['extras'] = dict(nominalSimulationSpeed=NOMINAL_SIM_SPEED,
            nominalSourceUnitsPerSecond=rig.source_speed, sourceStandingHeight=source_height,
            runtimeStandingHeight=2.05, fps=FPS, gameDirectionDegrees=direction,
            loop=clip['name'].startswith('m10-run-'), authoredFootControls='two-bone IK with pole targets')
    metadata = json.dumps(document, separators=(',', ':')).encode()
    metadata += b' ' * ((-len(metadata)) % 4)
    remainder = data[20 + length:]
    pending.write_bytes(struct.pack('<III', 0x46546C67, 2, 20 + len(metadata) + len(remainder)) +
        struct.pack('<II', len(metadata), 0x4E4F534A) + metadata + remainder)
    pending.replace(args.out)
    print('M10 locomotion nominalSimSpeed', NOMINAL_SIM_SPEED,
        'sourceHeight', round(source_height, 6), 'sourceUnitsPerSecond', round(rig.source_speed, 6),
        'cycleSeconds', CYCLE_SECONDS, 'sourceUnitsPerCycle', round(rig.source_speed * CYCLE_SECONDS, 6),
        'directions', list(GAITS), flush=True)


if __name__ == '__main__':
    main()
