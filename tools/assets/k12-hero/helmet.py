"""K12 Crown-keel helmet, second generation. Original MIT design and code.

The helmet is built like a real one: a dark inner pressure skull, then separate
hard plates (brow, crown halves, cheeks, mandible, rear) conformed onto it along
spherical rays with their own crown, real wall thickness and rolled chamfers.
Plates overlap; the dark skull shows in the seams. The visor is a smoked lens
sunk ~2cm behind the plate faces inside a gunmetal bezel. The luminous keel
light sits inside a raised dorsal keel (readable from the top-down camera).

Options (design sheet): 1 Keel visor, 2 Filter jaw, 3 Hooded optic.
Standalone design sheet:
  blender -b -t 4 -P tools/assets/k12-hero/helmet.py -- --sheet
"""
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector as V, Matrix

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import kit
import materials as M

CENTER = V((0, .012, 1.872))
DEG_PER_M = 1 / (.152 * math.pi / 180)   # projection units per metre on the skull
NAMES = {1: 'Keel visor', 2: 'Filter jaw', 3: 'Hooded optic'}
SELECTED = 1

SKULL = [  # z, rx, ry, cy (relative to CENTER)
    (-.168, .066, .074, -.016), (-.152, .090, .104, -.008), (-.122, .117, .134, -.002),
    (-.075, .137, .154, .003), (-.022, .146, .161, .004), (.032, .149, .160, .0),
    (.082, .142, .150, -.006), (.122, .124, .131, -.013), (.152, .094, .099, -.019),
    (.170, .050, .054, -.023), (.177, .004, .004, -.025)]


def mirror(points):
    """Mirror an outline across lon = 0 and keep CCW order."""
    return [(-u, v) for u, v in reversed(points)]


class Helmet:
    def __init__(self, option=SELECTED, high=False, collection=None):
        self.option, self.high, self.col = option, high, collection
        self.parts = []   # (object, role)

    def add(self, obj, role):
        obj['k12Role'] = role
        obj.data.materials.clear()
        obj.data.materials.append(M.get(role))
        kit.rigid(obj, 'head')
        self.parts.append(obj)
        return obj

    # ------------------------------------------------------------------ skull
    def skull(self):
        seg = 32 if self.high else 16
        verts, faces = [], []
        for z, rx, ry, cy in SKULL:
            for j in range(seg):
                a = math.tau * j / seg
                verts.append(CENTER + V((math.sin(a) * rx, math.cos(a) * ry + cy, z)))
        rows = len(SKULL)
        for r in range(rows - 1):
            for j in range(seg):
                a = r * seg + j; b = r * seg + (j + 1) % seg
                faces.append((a, b, b + seg, a + seg))
        faces.append(tuple(reversed(range(seg))))
        faces.append(tuple((rows - 1) * seg + j for j in range(seg)))
        obj = kit.new_mesh('helmet pressure skull', verts, faces, self.col)
        import bmesh
        bm = bmesh.new(); bm.from_mesh(obj.data); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(obj.data); bm.free()
        sub = obj.modifiers.new('skull subdivision', 'SUBSURF'); sub.levels = 2 if self.high else 0
        self.bvh = kit.bvh_of(obj, subdivide=(3 - sub.levels) if self.high else 0)   # HERO19: game plates/lens on the shipped cage
        if not sub.levels:
            obj.modifiers.remove(sub)
        kit.apply_all(obj)
        self.front = kit.Spherical(CENTER, (0, 1, 0), (0, 0, 1))
        self.top = kit.Spherical(CENTER, (0, 0, 1), (0, 1, 0))   # (a, b): a>0 → −X, b>0 → forward
        # HERO19: in the game LOD the shell under the plates is ceramic, so the helmet reads as one light
        # form (title) instead of a dark oval between side plates; the close-up keeps its dark seams.
        return self.add(obj, 'fabric' if self.high else 'ceramic')

    def plate(self, name, outline, role='ceramic', proj=None, standoff=.010, thickness=.009, crown=.004,
              profile='panel', fil=4.0):
        proj = proj or self.front
        pts = kit.fillet(outline, fil, 3 if self.high else 2)
        prof = {
            'panel': [(0, 0), (.0022, .0011), (.0050, .0014), (.0072, .0002), (.0090, .0002), (.0098, .0013)],
            'lip': [(0, 0), (.0025, .0016), (.0060, .0018), (.0085, .0004)],
            'plain': [(0, 0), (.003, .0010)],
        }[profile]
        obj = kit.plate(name, pts, proj, self.bvh, standoff, thickness, prof, crown, self.high,
                        count=72 if self.high else 14, unit=DEG_PER_M, inner_rings=2)
        return self.add(obj, role)

    def hub(self, name, lon, lat, radius, layers, role_cycle=('gunmetal', 'ceramic', 'steel')):
        """Stacked turned discs (ear/temple hubs) seated on the skull."""
        p, n = kit.cast(self.bvh, self.front, lon, lat)
        objs = []
        h = .019
        for i, (r, t, role) in enumerate(layers):
            prof = [(0, h), (radius * r, h), (radius * r, h + t * .7), (radius * r * .94, h + t), (0, h + t)]
            o = kit.lathe(f'{name} {i}', prof, p, n, 32 if self.high else 12, collection=self.col)
            if self.high:
                kit.bevel(o, .0008, 2, 30)
            objs.append(self.add(o, role))
            h += t
        return objs, p, n, h

    # ---------------------------------------------------------------- options
    def build(self):
        self.skull()
        o = self.option
        if o == 1:
            # HERO19: wider wrap (±78°) and a taller top edge so the cyan face shows in profile and from above.
            # (top edge at 30°: the aim pose pitches the head into the sights, so the upper lens is what the camera sees)
            visor = [(-78, -1), (-62, -13), (-30, -21), (0, -23), (30, -21), (62, -13), (78, -1), (76, 14), (50, 26), (0, 30), (-50, 26), (-76, 14)]
        elif o == 2:
            visor = [(-57, -6), (-36, -13), (0, -15), (36, -13), (57, -6), (55, 5), (30, 9), (0, 10), (-30, 9), (-55, 5)]
        else:
            visor = [(-60, 8), (-50, -5), (-26, -13), (0, -15), (26, -13), (50, -5), (60, 8), (44, 5), (0, 3), (-44, 5)]
        self.visor(visor)
        self.brow(o)
        self.crown(o)
        self.cheeks(o)
        self.jaw(o)
        self.rear(o)
        self.ears(o)
        return self.parts

    def visor(self, outline):
        grown = kit.offset_polygon(kit.fillet(outline, 5, 3), -3.0)
        # HERO19: lens brought forward (10 mm) so the cyan face shows from the high game camera.
        lens = kit.lens('helmet visor lens', kit.fillet(grown, 5, 3), self.front, self.bvh, .010,
                        count=64 if self.high else 20, rings=5 if self.high else 2, collection=self.col)
        self.add(lens, 'visor')
        # Gunmetal bezel: an inner frame wall around the opening, inside the plates.
        path = kit.surface_path(self.bvh, self.front, kit.fillet(kit.offset_polygon(outline, -1.0), 4, 3), .002,
                                samples=96 if self.high else 20)
        prof = [(-.003, 0), (.003, 0), (.003, .014), (.0015, .0175), (-.003, .0175)]
        bezel = kit.ribbon('helmet visor bezel', path, .006, .0175, profile=prof, collection=self.col)
        self.add(bezel, 'gunmetal')
        if self.high:
            # Inner HUD projector strip along the lens top (thin glowing line).
            top = [(u, v) for u, v in outline if v > 0]
            top.sort()
            line = kit.surface_path(self.bvh, self.front, [(u, v - 1.6) for u, v in top], .0035, closed=False)
            strip = kit.ribbon('helmet hud strip', line, .0016, .0008, closed=False, collection=self.col)
            self.add(strip, 'glow')
        self.visor_outline = outline

    def brow(self, o):
        if o == 3:
            # Heavy hood: projects forward over a narrow slit, angled outer corners.
            brow = [(-80, 0), (-62, 10), (-44, 7.5), (0, 5.5), (44, 7.5), (62, 10), (80, 0), (86, 18), (60, 38), (22, 47), (-22, 47), (-60, 38), (-86, 18)]
            self.plate('helmet hooded brow', brow, standoff=.016, thickness=.011, crown=.012, profile='lip', fil=5)
            return
        top = 32 if o == 1 else 12
        brow = [(-80, 1), (-64, 8.5), (-40, top - 1), (0, top), (40, top - 1), (64, 8.5), (80, 1), (86, 18), (60, 37), (24, 46), (-24, 46), (-60, 37), (-86, 18)]
        if o == 1:   # HERO19: brow lower edge follows the taller, wider visor
            brow = [(-90, 8), (-78, 18), (-46, top - 1), (0, top), (46, top - 1), (78, 18), (90, 8), (94, 26), (64, 43), (24, 51), (-24, 51), (-64, 43), (-94, 26)]
        if o == 1:
            # Shallow V peak over the lens: a designed brow line, not an egg rim.
            brow[3] = (0, top - 1.8)
        self.plate('helmet brow plate', brow, standoff=.017, thickness=.012, crown=.008, profile='lip', fil=5)   # HERO19: deep brow rim over the lens

    def crown(self, o):
        t = self.top
        unit_note = None
        if o == 2:
            # Twin sensor rails instead of one keel.
            for side in (-1, 1):
                rail = [(side * 7, 40), (side * 15, 40), (side * 15, -78), (side * 7, -78)]
                if side < 0:
                    rail = list(reversed(rail))
                self.plate(f'helmet crown rail {side}', rail, 'gunmetal', t, .019, .012, .002, 'plain', 2.5)
                light = [(side * 9.5, 34), (side * 12.5, 34), (side * 12.5, -70), (side * 9.5, -70)]
                if side < 0:
                    light = list(reversed(light))
                self.plate(f'helmet crown light {side}', light, 'glow', t, .0305, .002, .0, 'plain', 1.2)
            for side in (-1, 1):
                half = [(side * 18, 36), (side * 68, 20), (side * 76, -20), (side * 64, -64), (side * 18, -76)]
                if side > 0:
                    half = list(reversed(half))
                self.plate(f'helmet crown half {side}', half, 'ceramic', t, .016, .009, .005, 'panel', 6)
            return
        # Crown halves either side of the keel (top frame: a>0 is the left side).
        for side in (-1, 1):
            half = [(side * 9.5, 40), (side * 66, 22), (side * 76, -18), (side * 66, -60), (side * 9.5, -78)]
            if side > 0:
                half = list(reversed(half))
            self.plate(f'helmet crown half {side}', half, 'ceramic', t, .016, .009, .005, 'panel', 6)
        # Keel: two raised gunmetal walls with the light sunk in the channel between them.
        for side in (-1, 1):
            wall = [(side * 3.2, 46), (side * 9.0, 46), (side * 8.0, -84), (side * 2.8, -84)]
            self.plate(f'helmet keel wall {side}', wall, 'gunmetal', t, .026, .012, .001, 'plain', 1.5)
        floor = [(-3.4, 44), (3.4, 44), (3.0, -82), (-3.0, -82)]
        self.plate('helmet keel channel', floor, 'graphite', t, .016, .004, .0, 'plain', 1.0)
        light = [(-2.4, 40), (2.4, 40), (2.1, -76), (-2.1, -76)]
        self.plate('helmet keel light', light, 'glow', t, .0205, .0025, .0, 'plain', 1.0)
        if self.high:
            # Keel retaining fasteners along both walls.
            for b in (30, 6, -22, -50):
                for a in (-6.0, 6.0):
                    p, n = kit.cast(self.bvh, t, a, b)
                    self.add(kit.fastener('helmet keel fastener', p + n * .0265, n, .0024, 'hex', True, self.col), 'steel')

    def cheeks(self, o):
        for side in (1, -1):
            if o == 2:
                cheek = [(60, -6), (64, -34), (88, -52), (114, -40), (120, -6), (104, 10), (78, 10), (62, 6)]
            elif o == 3:
                cheek = [(62, 7), (60, -10), (70, -38), (96, -52), (116, -36), (120, -4), (100, 12), (78, 12)]
            else:
                cheek = [(80, -4), (80, -30), (94, -48), (116, -38), (122, -6), (108, 10), (90, 11), (81, 5)]   # HERO19: behind the wider visor
            if side < 0:
                cheek = mirror(cheek)
            self.plate(f'helmet cheek plate {side}', cheek, 'ceramic', standoff=.012, thickness=.010, crown=.005, fil=5)

    def jaw(self, o):
        if o == 2:
            for side in (1, -1):
                jaw = [(8, -58), (50, -54), (62, -36), (56, -16), (22, -17), (8, -24)]
                if side < 0:
                    jaw = mirror(jaw)
                self.plate(f'helmet split jaw {side}', jaw, 'ceramic', standoff=.014, thickness=.011, crown=.007, fil=4)
            p, n = kit.cast(self.bvh, self.front, 0, -38)
            axis = (n + V((0, 0, -.55))).normalized()
            prof = [(0, -.004), (.025, -.004), (.027, .006), (.027, .034), (.024, .040), (.018, .046), (0, .046)]
            can = kit.lathe('helmet filter canister', prof, p + n * .010, axis, 32 if self.high else 14, collection=self.col)
            self.add(can, 'gunmetal')
            for k in range(3 if self.high else 1):
                ring = kit.lathe('helmet filter ring', [(.0272, .012 + k * .009), (.0292, .014 + k * .009), (.0292, .017 + k * .009), (.0272, .019 + k * .009)],
                                 p + n * .010, axis, 32 if self.high else 14, collection=self.col, caps=False)
                self.add(ring, 'steel')
            return
        if o == 3:
            jaw = [(-52, -60), (0, -66), (52, -60), (60, -36), (54, -14), (26, -16), (0, -17), (-26, -16), (-54, -14), (-60, -36)]
        else:
            jaw = [(-50, -58), (0, -64), (50, -58), (58, -38), (52, -16), (24, -24.5), (0, -26.5), (-24, -24.5), (-52, -16), (-58, -38)]
        jaw_obj = self.plate('helmet mandible guard', jaw, 'ceramic', standoff=.016, thickness=.011, crown=.010, fil=5)
        # Breather grille: three steel slats seated across the mandible face.
        top = -33 if o == 1 else -27
        for k in range(3):
            v = top - 4.0 - k * 5.0
            slat = [(-22 + k * 2.5, v - 1.2), (22 - k * 2.5, v - 1.2), (22 - k * 2.5, v + 1.2), (-22 + k * 2.5, v + 1.2)]
            self.plate('helmet breather slat', slat, 'gunmetal', standoff=.0285, thickness=.006, crown=.0, profile='plain', fil=1)

    def rear(self, o):
        rear = [(116, -46), (180, -54), (244, -46), (248, -8), (228, 24), (180, 33), (132, 24), (112, -8)]
        rp = self.plate('helmet rear shell', rear, 'ceramic', standoff=.012, thickness=.010, crown=.006, fil=6)
        guard = [(132, -64), (180, -70), (228, -64), (236, -46), (180, -50), (124, -46)]
        self.plate('helmet neck guard', guard, 'gunmetal', standoff=.020, thickness=.008, crown=.002, profile='plain', fil=3)
        if self.high:
            # Rear serial and a short stencilled bar code, baked into the atlas.
            p, n = kit.cast(self.bvh, self.front, 180, -16)
            txt = kit.text_mesh('helmet rear serial', 'CK-07', .022, p + n * .0245, n, V((0, 0, 1)), collection=self.col)
            self.add(txt, 'marking')
            for k, lon in enumerate((158, 202)):
                p, n = kit.cast(self.bvh, self.front, lon, -32)
                self.add(kit.fastener('helmet rear fastener', p + n * .0225, n, .0032, 'hex', True, self.col), 'steel')

    def ears(self, o):
        for side in (1, -1):
            lon = 97 * side
            objs, p, n, h = self.hub(f'helmet ear hub {side}', lon, -14, .034,
                                     [(1.0, .006, 'gunmetal'), (.82, .008, 'ceramic' if o != 2 else 'gunmetal'), (.42, .006, 'steel')])
            base = p + n * (h + .012)
            if side > 0:
                # Sensor cluster: a housing riding forward/up from the right hub with three lenses.
                fwd = V((0, 1, 0)); up = V((0, 0, 1))
                origin = p + n * (h + .004) + fwd * .012 + up * .022
                outline = kit.fillet([(-.030, -.010), (.024, -.010), (.034, .004), (.022, .013), (-.030, .012)], .004, 3 if self.high else 1)
                house = kit.prism('helmet sensor housing', outline, .016, origin, n, up, self.col)
                if self.high:
                    kit.bevel(house, .0015, 3)
                self.add(house, 'gunmetal')
                for k, (dz, dn, r) in enumerate([(.003, .0, .0060), (-.004, .0, .0040), (.009, .0, .0032)]):
                    c = origin + fwd * (.030 - k * .004) + up * dz + n * dn
                    barrel = kit.lathe('helmet sensor barrel', [(0, 0), (r, 0), (r, .010), (r * .8, .012), (0, .012)],
                                       c, fwd, 20 if self.high else 8, collection=self.col)
                    self.add(barrel, 'steel')
                    glass = kit.lathe('helmet sensor lens', [(0, .0112), (r * .72, .0112), (0, .0128)],
                                      c, fwd, 20 if self.high else 8, collection=self.col)
                    self.add(glass, 'glow' if k == 0 else 'visor')


# ----------------------------------------------------------------------- sheet

def _reset():
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.curves):
        for item in list(block):
            if item.users == 0:
                block.remove(item)


def _studio(scene):
    scene.render.engine = 'CYCLES'
    sys.path.insert(0, str(HERE.parent / 'k10-marine'))
    from render_device import choose_render_device
    choose_render_device(scene)
    scene.cycles.samples = 64; scene.cycles.use_denoising = True
    scene.view_settings.view_transform = 'AgX'; scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes['Background']; bg.inputs[0].default_value = (.035, .045, .055, 1); bg.inputs[1].default_value = .6
    def light(name, loc, power, size, color, target):
        bpy.ops.object.light_add(type='AREA', location=loc); l = bpy.context.object; l.name = name
        l.data.energy = power; l.data.size = size; l.data.color = color
        l.rotation_euler = (V(target) - l.location).to_track_quat('-Z', 'Y').to_euler()
    light('key', CENTER + V((.9, 1.0, .7)), 60, .8, (1, .9, .8), CENTER)
    light('rim', CENTER + V((-.8, -.7, .6)), 90, .5, (.6, .8, 1), CENTER)
    light('fill', CENTER + V((-.9, .9, -.2)), 14, 1.2, (.6, .75, .9), CENTER)


def sheet():
    out = HERE.parents[2] / 'artifacts/nextgen/k12-work/helmet'
    out.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    options = [int(a.split('=')[1]) for a in args if a.startswith('--option=')] or [1, 2, 3]
    res = int(next((a.split('=')[1] for a in args if a.startswith('--res=')), '700'))
    for option in options:
        for high in (True, False):
            _reset(); _studio(scene)
            h = Helmet(option, high)
            parts = h.build()
            tris = sum(kit.triangles(p) for p in parts)
            print(f'HELMET option {option} high={high} parts={len(parts)} triangles={tris}', flush=True)
            bpy.ops.object.camera_add(); cam = bpy.context.object; scene.camera = cam
            views = [('three-quarter', V((.62, .78, .18)), 38), ('back', V((-.5, -.75, .7)), 38)] if high else [('gameplay', V((.25, -.55, 1.15)), 60)]
            for view, d, lens in views:
                d = d.normalized()
                cam.location = CENTER + d * 1.1; cam.data.lens = lens * 2.2
                cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
                cam.data.dof.use_dof = False
                scene.render.resolution_x = scene.render.resolution_y = res if high else 120
                scene.cycles.samples = 64 if high else 24
                scene.render.filepath = str(out / f'option{option}-{view}.png')
                bpy.ops.render.render(write_still=True)


if __name__ == '__main__' and '--sheet' in sys.argv:
    sheet()
