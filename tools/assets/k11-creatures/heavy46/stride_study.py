"""HEAVY46 stride study: four key poses of one Brute stride (contact, load, pass,
release of the near club) posed by the m10-run authoring code and rendered from the
game camera's elevation with the in-play fit (armature up axis 1.9x the horizontal).
The rig advances at ground speed, so the deck seam under the planted near hand stays put.

blender -b -P tools/assets/k11-creatures/heavy46/stride_study.py -- <out-prefix> [new|old] [base|boss]
"""
import sys, math
from pathlib import Path
ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / 'tools/assets/m10-motion'))
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
sys.argv = ['x']
import bpy
from mathutils import Vector, Matrix
import enemy_actions as E

OUT = argv[0] if argv else str(ROOT / 'artifacts/nextgen/heavy46/study/stride')
MODE = argv[1] if len(argv) > 1 else 'new'
RANK = argv[2] if len(argv) > 2 else 'base'
Path(OUT).parent.mkdir(parents=True, exist_ok=True)

if MODE == 'old':
    def old_body(self, t):
        H, W = self.height, self.width
        phase = t * math.tau
        self.move(self.center, E.UP * H * (.025 + .025 * math.cos(phase * 2)))
        self.rotate(self.center, E.FWD, .075 * math.sin(phase))
        self.rotate(self.center, E.SIDE, .07)
        plant = math.sin(phase + .22 * math.pi)
        self.move(self.center, E.SIDE * W * .15 * plant - E.UP * H * .065 * abs(plant))
        self.rotate(self.center, E.FWD, .16 * plant)
        self.rotate('chest', E.UP, .22 * plant)
        self.rotate('tail', E.UP, -.18 * plant)
    E.Creature.stride_body = old_body
    E.Creature.stride_clubs = E.Creature.club_stride

arm = E.import_rig('brute')
c = E.Creature(arm, 'brute')
for o in bpy.data.objects:
    if o.type == 'MESH' and o.name != f'k11-brute-{RANK}':
        o.hide_render = True
mesh = bpy.data.objects[f'k11-brute-{RANK}']
sc = bpy.context.scene
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'STUDIO'
sc.display.shading.color_type = 'SINGLE'
sc.display.shading.single_color = (.42, .42, .50)
sc.display.shading.show_object_outline = True
sc.render.resolution_x, sc.render.resolution_y = 560, 460
# In-play fit: horizontal .333, vertical .632 per armature unit (Brute and elite).
arm.scale = (arm.scale[0], arm.scale[1] * 1.9, arm.scale[2])
bpy.context.view_layer.update()
M = arm.matrix_world.copy()
to_world = lambda v: M @ v
# Deck and seam (armature space: x fwd, -y up, z side).
bpy.ops.mesh.primitive_plane_add(size=40)
deck = bpy.context.object
deck.matrix_world = Matrix.Translation(to_world(Vector((0, 0, 0)))) @ (M.to_3x3().normalized().to_4x4() @ Matrix.Rotation(math.pi / 2, 4, 'X'))
dm = bpy.data.materials.new('deck'); dm.diffuse_color = (.16, .19, .22, 1); deck.data.materials.append(dm)
speed = (1.25 + .95) / E.Creature.STRIDE_SUPPORT  # armature units per cycle
cam = bpy.data.cameras.new('c'); cam.type = 'ORTHO'; cam.ortho_scale = 13
co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); sc.camera = co
side_axis = (M.to_3x3() @ Vector((0, 0, 1))).normalized()
up_axis = (M.to_3x3() @ Vector((0, -1, 0))).normalized()
elev = math.atan2(26, 19)
view = side_axis * math.cos(elev) + up_axis * math.sin(elev)
keys = E.Creature.STRIDE_KEYS
# near (left, +SIDE) club: s_l = (t + .5) % 1
anchor_t = (keys['contact'] - .5) % 1
seam = None
for label, s in keys.items():
    t = (s - .5) % 1
    advance = speed * (((t - anchor_t) % 1))
    c.reset(); c.pose('m10-run', t, .64)
    bpy.context.view_layer.update()
    arm.location = Vector((0, 0, 0))
    offset = M.to_3x3() @ (E.FWD * advance)
    arm.matrix_world = Matrix.Translation(offset) @ M
    bpy.context.view_layer.update()
    if seam is None:
        base = c.base_matrices['shoulder.l'] @ c.rest['shoulder.l'].inverted_safe() @ (E.FWD * .30 + E.UP * 3.83 + E.SIDE * 1.70)
        bpy.ops.mesh.primitive_cube_add(size=1)
        seam = bpy.context.object
        sm = bpy.data.materials.new('seam'); sm.diffuse_color = (.9, .75, .2, 1); seam.data.materials.append(sm)
        p = to_world(Vector((base.x + 1.25 + advance, -.01, 0)))
        seam.matrix_world = Matrix.Translation(p) @ (M.to_3x3().normalized().to_4x4()) @ Matrix.Diagonal(Vector((.06, .02, 12, 1)))
    center = to_world(Vector((1.0 + speed * .25, -2.3, 0)))
    co.location = center + view * 40
    co.rotation_euler = (center - co.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = f'{OUT}-{MODE}-{RANK}-{list(keys).index(label)}-{label}.png'
    bpy.ops.render.render(write_still=True)
    # Numbers: socket heights and near pad relative to socket.
    out = {}
    for sd, sign in (('r', -1), ('l', 1)):
        skin = c.m['shoulder.' + sd] @ c.rest['shoulder.' + sd].inverted_safe()
        so = skin @ (E.FWD * .30 + E.UP * 3.83 + E.SIDE * 1.70 * sign)
        pa = skin @ (E.FWD * 2.40 + E.UP * 2.40 + E.SIDE * 3.00 * sign)
        out[sd] = (round(so.dot(E.UP), 2), round(pa.dot(E.FWD) - so.dot(E.FWD), 2), round(pa.dot(E.UP), 2), round(pa.dot(E.FWD) + advance, 2))
    ch = c.m['chest'].translation
    print('STUDY', MODE, label, 't=%.2f' % t, 'chest up %.2f side %.2f' % (ch.dot(E.UP), ch.dot(E.SIDE)),
          'socket_up/pad_ahead/pad_up/pad_world r', out['r'], 'l', out['l'], flush=True)
