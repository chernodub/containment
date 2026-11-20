"""K12 marine body and Combat Rig variants. Original MIT design and code.

Layering, inside out: a woven pressure undersuit lofted along the retained bones
(ribbed bellows at neck, waist, elbows, knees and wrists), hard ceramic plates
designed in 2D and conformed onto it with real walls and rolled chamfers,
gunmetal hardware (collar, belt, hinges, fasteners), articulated gloves and
layered boots. Each rig adds its own shoulders, forearm pieces and a back
module with mechanical logic. Design space: metres, X right, Y forward, Z up.
"""
import math
from mathutils import Vector as V, Quaternion
import kit
import materials as M

RIGS = ('breacher', 'cryo', 'pyro', 'arc')


class Suit:
    def __init__(self, joints, tails, high=False, collection=None):
        self.j, self.t, self.high, self.col = joints, tails, high, collection
        self.groups = {k: [] for k in ('body',) + RIGS}
        self.group = 'body'
        self.lofts = {}
        self.bvh = {}

    # ------------------------------------------------------------- utilities
    def add(self, obj, role, bone=None, weights_from=None):
        obj['k12Role'] = role
        obj.data.materials.clear(); obj.data.materials.append(M.get(role))
        if weights_from is not None:
            kit.transfer_weights(obj, self.lofts[weights_from])
        elif bone:
            kit.rigid(obj, bone)
        self.groups[self.group].append(obj)
        return obj

    def loft(self, name, sections, role='fabric', segments=None, forward=(0, 1, 0), register=True, level=None):
        """Sections: (centre, rx, ry, {bone: weight}); elliptical rings with weights."""
        seg = segments or (24 if self.high else 14)
        verts, faces, weights = [], [], []
        for i, (c, rx, ry, w) in enumerate(sections):
            c = V(c)
            before = V(sections[max(0, i - 1)][0]); after = V(sections[min(len(sections) - 1, i + 1)][0])
            axis = (after - before).normalized()
            front = V(forward) - axis * axis.dot(V(forward))
            if front.length < .1:
                front = V((0, 0, 1)) - axis * axis.z
            front.normalize(); right = front.cross(axis).normalized()
            for k in range(seg):
                a = k / seg * math.tau
                verts.append(c + right * math.cos(a) * rx + front * math.sin(a) * ry)
                weights.append(w)
        for r in range(len(sections) - 1):
            for k in range(seg):
                a = r * seg + k; b = r * seg + (k + 1) % seg
                faces.append((a, b, b + seg, a + seg))
        faces.append(tuple(range(seg - 1, -1, -1)))
        faces.append(tuple((len(sections) - 1) * seg + k for k in range(seg)))
        obj = kit.new_mesh(name, verts, faces, self.col)
        import bmesh
        bm = bmesh.new(); bm.from_mesh(obj.data); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(obj.data); bm.free()
        groups = {}
        for i, w in enumerate(weights):
            for bone, value in w.items():
                if bone not in groups:
                    groups[bone] = obj.vertex_groups.new(name=bone)
                groups[bone].add([i], value, 'REPLACE')
        lv = level if level is not None else (2 if self.high else 0)
        if lv:
            sub = obj.modifiers.new('k12 loft subdivision', 'SUBSURF'); sub.levels = lv
        # HERO19: the game LOD ships the unsubdivided cage, which sits 3-8 mm outside the subdivision limit
        # surface; plates conformed to the limit let the dark undersuit poke through them in blotches
        # (the "camouflage"). Conform game-LOD plates to the cage they actually cover.
        self.bvh[name] = kit.bvh_of(obj, subdivide=max(0, 3 - lv) if (self.high or lv) else 0)
        kit.apply_all(obj)
        self.lofts[name] = obj
        if register:
            obj['k12Role'] = role
            obj.data.materials.append(M.get(role))
            self.groups[self.group].append(obj)
        else:
            obj.hide_render = True
        return obj

    def limb(self, a, b, side):
        """Cylindrical projection around a bone; angles: 0 outward, +90 front."""
        sign = 1 if side == 'R' else -1
        axis = (V(b) - V(a)).normalized()
        return kit.Cylindrical(a, axis, V((sign, 0, 0))), sign

    def limb_plate(self, name, loft, a, b, side, outline, role='ceramic', bone=None, standoff=.012, thickness=.010,
                   crown=.006, profile=None, fil=8, radius=.09):
        proj, sign = self.limb(a, b, side)
        # Outline written with +90 = front; the projection's front is -90*sign.
        unit = 1 / (radius * math.pi / 180)
        pts = [(-sign * d, v * unit) for d, v in outline]
        pts = kit.fillet(pts, fil, 3 if self.high else 2)
        proj = kit.Isotropic(proj, unit)
        prof = profile or [(0, 0), (.0025, .0014), (.006, .0016), (.0085, .0002), (.0105, .0002), (.011, .0014)]
        lift = 0 if self.high else .005   # HERO19: game plates clear the faceted cage (no undersuit poke-through)
        obj = kit.plate(name, pts, proj, self.bvh[loft], standoff + lift, thickness, prof, crown, self.high,
                        count=60 if self.high else 14, unit=unit, aniso=None if self.high else (.42, 2.2))
        return self.add(obj, role, bone)

    def torso_plate(self, name, outline, role='ceramic', bone='ribs', standoff=.014, thickness=.011, crown=.010,
                    profile=None, fil=6, loft='torso', mirror=False):
        unit = 1 / (.2 * math.pi / 180)
        proj = kit.Isotropic(kit.Cylindrical((0, .01, 0), (0, 0, 1), (0, 1, 0)), unit)
        pts = [(-d if mirror else d, v * unit) for d, v in outline]
        pts = kit.fillet(pts, fil, 3 if self.high else 2)
        prof = profile or [(0, 0), (.0028, .0015), (.0065, .0018), (.0095, .0003), (.0118, .0003), (.0124, .0016)]
        lift = 0 if self.high else .005   # HERO19: see limb_plate
        obj = kit.plate(name, pts, proj, self.bvh[loft], standoff + lift, thickness, prof, crown, self.high,
                        count=72 if self.high else 16, unit=unit, aniso=None if self.high else (.5, 2.0))
        return self.add(obj, role, bone)

    def ring(self, name, centre, axis, radius, width, role='gunmetal', bone=None, profile=None, weights_from=None):
        w = width / 2
        prof = profile or [(radius - .004, -w), (radius, -w), (radius + .002, -w + .002), (radius + .002, w - .002), (radius, w), (radius - .004, w)]
        obj = kit.lathe(name, prof, centre, axis, 32 if self.high else 12, collection=self.col, caps=False)
        return self.add(obj, role, bone, weights_from)

    def stamp(self, plate_obj, text, toward, size, bone, role='marking'):
        """Stencil text onto a finished plate: ray from ``toward`` to the plate centre."""
        bvh = kit.bvh_of(plate_obj)
        centre = sum((v.co for v in plate_obj.data.vertices), V()) / max(1, len(plate_obj.data.vertices))
        d = (centre - V(toward)).normalized()
        hit = bvh.ray_cast(V(toward), d, 2.0)
        if hit[0] is None:
            return None
        n = hit[1]
        up = V((0, 0, 1)) - n * n.z
        o = kit.text_mesh('stencil ' + text, text, size, hit[0] + n * .0006, n, up if up.length > .1 else V((0, 1, 0)), collection=self.col)
        return self.add(o, role, bone)

    def bolt(self, point, normal, bone, r=.0045):
        if self.high:
            self.add(kit.fastener('fastener', point, normal, r, 'hex', True, self.col), 'steel', bone)

    def cast_bolt(self, loft, proj, u, v, lift, bone, r=.0045):
        if self.high:
            p, n = kit.cast(self.bvh[loft], proj, u, v)
            self.bolt(p + n * lift, n, bone, r)

    # ------------------------------------------------------------------ body
    def build_body(self):
        j, t = self.j, self.t
        self.group = 'body'
        # Torso: heroic chest, tapered waist, ribbed abdominal bellows.
        torso = []
        rows = [(.80, .120, .085), (.88, .150, .104), (.98, .165, .112), (1.03, .185, .122), (1.09, .172, .114), (1.13, .158, .108)]
        z = 1.15
        k = 0
        while z < 1.30:   # bellows
            r = .156 + (.004 if k % 2 else -.003)
            torso.append(z); rows.append((z, r * (1 + (z - 1.15) * .35), r * .72 * (1 + (z - 1.15) * .2)))
            z += .022 if self.high else .044; k += 1
        rows += [(1.32, .182, .128), (1.42, .225, .150), (1.52, .244, .156), (1.60, .232, .142), (1.665, .175, .108), (1.70, .095, .078)]
        rows.sort()
        sec = []
        for z, rx, ry in rows:
            w = {'hips': 1} if z < 1.12 else {'hips': .25, 'spine': .75} if z < 1.24 else {'spine': .5, 'ribs': .5} if z < 1.36 else {'ribs': 1}
            sec.append(((0, .004, z), rx, ry, w))
        self.loft('torso', sec, segments=32 if self.high else 16)
        # Neck pressure bellows (corrugated) between collar and helmet.
        neck = []
        n_rings = 7 if self.high else 3
        for i in range(n_rings + 1):
            z = 1.655 + i * (.115 / n_rings)
            r = .074 + (.006 if i % 2 else 0) - i * .002
            neck.append(((0, .0, z), r, r * .95, {'neck': .6 if z < 1.72 else .2, 'head': .4 if z >= 1.72 else 0, 'ribs': .4 if z < 1.72 else 0}))
        neck = [(c, rx, ry, {b: w for b, w in ws.items() if w > 0}) for c, rx, ry, ws in neck]
        self.loft('neck bellows', neck, segments=20 if self.high else 10, level=1 if self.high else 0)
        for side in ('R', 'L'):
            self.arm(side)
            self.leg(side)
            self.glove(side)
            self.boot(side)
        self.torso_armour()

    def arm(self, side):
        j = self.j
        sign = 1 if side == 'R' else -1
        up, fo, ha = 'upper_arm.' + side, 'forearm.' + side, 'hand.' + side
        a, b, c = j[up], j[fo], j[ha]
        sec = [(a + V((0, 0, .01)), .098, .102, {up: 1}), (a.lerp(b, .2), .102, .104, {up: 1}), (a.lerp(b, .55), .090, .094, {up: 1}),
               (a.lerp(b, .82), .074, .076, {up: .9, fo: .1})]
        # Elbow bellows.
        for i, f in enumerate((.90, .97, 1.04, 1.11) if self.high else (.95, 1.06)):
            p = a.lerp(b, f) if f <= 1 else b.lerp(c, (f - 1) * .9)
            r = .072 if i % 2 else .066
            sec.append((p, r, r, {up: max(0, 1.1 - f) * 2 if f < 1.05 else 0, fo: 1} if f > .98 else {up: .6, fo: .4}))
        sec += [(b.lerp(c, .22), .086, .080, {fo: 1}), (b.lerp(c, .55), .074, .070, {fo: 1}), (b.lerp(c, .86), .057, .055, {fo: 1}), (c, .052, .050, {fo: .5, ha: .5})]
        sec = [(p, rx, ry, {k: v for k, v in w.items() if v > 0}) for p, rx, ry, w in sec]
        name = 'arm ' + side
        self.loft(name, sec)
        # Outer upper-arm plate and a two-piece vambrace.
        self.limb_plate('upper arm plate ' + side, name, a, b, side,
                        [(-62, .07), (100, .06), (112, .14), (100, .26), (-40, .27), (-72, .16)], bone=up, radius=.1)   # HERO19: covers the front
        self.limb_plate('rear upper arm plate ' + side, name, a, b, side,
                        [(-150, .08), (-62, .08), (-60, .25), (-150, .25)], bone=up, radius=.1, standoff=.010, crown=.004)
        ab = (b - a).length
        self.limb_plate('vambrace ' + side, name, b, c, side,
                        [(-80, .035), (60, .03), (95, .09), (80, .175), (-70, .18), (-100, .1)], bone=fo, radius=.08, crown=.004)
        self.limb_plate('vambrace inner ' + side, name, b, c, side,
                        [(115, .05), (240, .05), (235, .16), (120, .16)], bone=fo, radius=.08, standoff=.008, thickness=.006, crown=.002, fil=6)
        # Wrist cuff ring and elbow hinge discs.
        axis = (c - b).normalized()
        self.ring('wrist cuff ' + side, b.lerp(c, .93), axis, .062, .020, bone=fo)
        proj, _ = self.limb(a, b, side)
        p, n = kit.cast(self.bvh[name], proj, 0, ab)
        hinge = kit.lathe('elbow hinge ' + side, [(0, 0), (.026, 0), (.026, .008), (.020, .012), (.010, .012), (.010, .016), (0, .016)], p, n, 24 if self.high else 10, collection=self.col)
        self.add(hinge, 'gunmetal', fo)
        for v in (.09, .22):
            self.cast_bolt(name, proj, -sign * 60 * 0 + 0, v, .022, up)

    def leg(self, side):
        j, t = self.j, self.t
        sign = 1 if side == 'R' else -1
        th, sh = 'thigh.' + side, 'shin.' + side
        a, b, c = j[th], j[sh], t[sh]
        sec = [(a + V((0, 0, .02)), .125, .124, {th: .7, 'hips': .3}), (a.lerp(b, .15), .132, .130, {th: 1}), (a.lerp(b, .48), .116, .118, {th: 1}),
               (a.lerp(b, .80), .090, .092, {th: 1})]
        for i, f in enumerate((.88, .95, 1.02, 1.09) if self.high else (.93, 1.05)):
            p = a.lerp(b, f) if f <= 1 else b.lerp(c, (f - 1) * .9)
            r = .086 if i % 2 else .080
            sec.append((p, r, r, {th: .5, sh: .5} if abs(f - 1) < .04 else ({th: 1} if f < 1 else {sh: 1})))
        sec += [(b.lerp(c, .2), .100, .098, {sh: 1}), (b.lerp(c, .42) + V((0, -.012, 0)), .104, .100, {sh: 1}),
                (b.lerp(c, .75), .076, .075, {sh: 1}), (b.lerp(c, .95), .066, .066, {sh: 1})]
        name = 'leg ' + side
        self.loft(name, sec)
        L = (b - a).length; S = (c - b).length
        # Thigh: front plate with a split side plate (overlapping layers).
        self.limb_plate('thigh front plate ' + side, name, a, b, side,
                        [(30, .10), (190, .10), (196, .25), (188, .40), (40, .40), (20, .25)], bone=th, radius=.12, crown=.008)   # HERO19: wraps the inner side
        self.limb_plate('thigh side plate ' + side, name, a, b, side,
                        [(-45, .06), (40, .07), (30, .30), (-35, .32), (-55, .18)], bone=th, radius=.12, standoff=.018, crown=.006)
        # Knee cap with hinge, shin greave and calf plate.
        self.limb_plate('knee cop ' + side, name, b, c, side,
                        [(45, -.075), (135, -.075), (150, .0), (125, .055), (55, .055), (30, .0)], bone=sh, radius=.09, standoff=.020, crown=.012)
        self.limb_plate('shin greave ' + side, name, b, c, side,
                        [(-12, .07), (192, .07), (198, .22), (190, .40), (-10, .40), (-18, .22)], bone=sh, radius=.10, crown=.007)   # HERO19: wraps both sides
        self.limb_plate('hamstring plate ' + side, name, a, b, side,
                        [(-172, .08), (-12, .08), (-8, .38), (-172, .38)], bone=th, radius=.12, standoff=.012, crown=.006)
        self.limb_plate('calf plate ' + side, name, b, c, side,
                        [(-176, .06), (4, .06), (6, .36), (-176, .36)], bone=sh, radius=.10, standoff=.010, crown=.005)
        proj, _ = self.limb(b, c, side)
        p, n = kit.cast(self.bvh[name], proj, 0, .0)
        hinge = kit.lathe('knee hinge ' + side, [(0, 0), (.030, 0), (.030, .009), (.022, .014), (.011, .014), (.011, .019), (0, .019)], p, n, 24 if self.high else 10, collection=self.col)
        self.add(hinge, 'gunmetal', sh)
        for v in (.12, .30):
            self.cast_bolt(name, proj, -sign * 90, v, .030, sh)

    def glove(self, side):
        j, t = self.j, self.t
        hand = 'hand.' + side
        sign = 1 if side == 'R' else -1
        w = j[hand]
        knuck = (j['finger_index.01.' + side] + j['finger_pinky.01.' + side]) * .5
        d = (knuck - w).normalized()
        across = (j['finger_index.01.' + side] - j['finger_pinky.01.' + side]).normalized()
        back = d.cross(across).normalized()
        if back.x * sign < 0:
            back = -back
        L = (knuck - w).length
        sec = [(w - d * .01, .050, .040, {hand: 1}), (w + d * L * .35, .058, .034, {hand: 1}), (w + d * L * .75, .062, .030, {hand: 1}), (w + d * L * 1.02, .058, .024, {hand: 1})]
        palm = self.loft('glove palm ' + side, sec, 'fabric', 16 if self.high else 8, forward=tuple(back))
        # Back-of-hand armour and individual knuckle guards.
        origin = w + d * L * .55 + back * .036
        outline = kit.fillet([(-.040, -.034), (.040, -.034), (.046, .016), (.030, .040), (-.030, .040), (-.046, .016)], .008, 3 if self.high else 1)
        ph = kit.prism('glove back plate ' + side, outline, .010, origin, back, d, self.col)
        kit.bevel(ph, .003 if self.high else .002, 3 if self.high else 1, 30)
        self.add(ph, 'ceramic', hand)
        for f in ('index', 'middle', 'ring', 'pinky', 'thumb'):
            r0 = {'index': .0118, 'middle': .0122, 'ring': .0115, 'pinky': .0100, 'thumb': .0128}[f]
            for k in (1, 2, 3):
                bone = ('thumb' if f == 'thumb' else 'finger_' + f) + f'.0{k}.' + side
                p, q = j[bone], t[bone]
                r = r0 * (1 - .08 * (k - 1))
                fd = (q - p).normalized()
                sec = [(p - fd * .003, r * .92, r * .88, {bone: 1}), (p.lerp(q, .45), r, r * .92, {bone: 1}), (q - fd * .002, r * .86, r * .82, {bone: 1})]
                if k == 3:
                    sec.append((q + fd * .006, r * .55, r * .5, {bone: 1}))
                self.loft(f'glove {f} {k} {side}', sec, 'fabric', 12 if self.high else 6, forward=tuple(back), level=1 if self.high else 0)
                # Hard dorsal segment on each phalanx: articulated plates, not a mitten.
                hp = p.lerp(q, .5) + back * r * .85
                seg = kit.fillet([(-r * .85, -(q - p).length * .42), (r * .85, -(q - p).length * .42), (r * .85, (q - p).length * .38), (-r * .85, (q - p).length * .38)], r * .4, 2 if self.high else 1)
                pl = kit.prism(f'glove knuckle plate {f} {k} {side}', seg, .0045, hp, back, fd, self.col)
                if self.high:
                    kit.bevel(pl, .0012, 2, 30)
                self.add(pl, 'gunmetal' if k > 1 else 'ceramic', bone)

    def boot(self, side):
        j = self.j
        sign = 1 if side == 'R' else -1
        foot = 'foot.' + side
        toe = j['foot.' + side]   # ball of foot
        x = toe.x
        # Rubber sole with heel and toe spring, upper loft, ceramic toe cap and heel counter.
        sole = []
        for y, z, rx, rz in [(-.175, .028, .060, .028), (-.13, .026, .072, .027), (-.04, .022, .070, .024), (.06, .022, .080, .023), (.15, .028, .070, .022), (.205, .040, .046, .016)]:
            sole.append(((x, toe.y + y - .05, z), rx, rz, {foot: 1}))
        self.loft('boot sole ' + side, sole, 'rubber', 20 if self.high else 10, forward=(0, 0, 1), level=1)
        upper = []
        for y, z, rx, rz in [(-.17, .095, .066, .072), (-.12, .105, .078, .085), (-.04, .095, .080, .080), (.05, .075, .084, .056), (.13, .060, .074, .038), (.185, .055, .050, .026)]:
            upper.append(((x, toe.y + y - .05, z), rx, rz, {foot: 1}))
        self.loft('boot upper ' + side, upper, 'graphite', 20 if self.high else 10, forward=(0, 0, 1))
        cuff = [((x, toe.y - .17, .15), .072, .074, {foot: 1}), ((x, toe.y - .165, .21), .072, .074, {foot: .5, 'shin.' + side: .5}), ((x, toe.y - .16, .25), .070, .072, {'shin.' + side: 1})]
        self.loft('boot cuff ' + side, cuff, 'graphite', 20 if self.high else 10)
        proj = kit.Planar((x, toe.y - .05, .4), (0, 0, 1), (0, 1, 0))
        cap = kit.fillet([(-.085, -.03), (.085, -.03), (.075, .10), (.03, .155), (-.03, .155), (-.075, .10)], .02, 3 if self.high else 1)
        o = kit.plate('boot toe cap ' + side, cap, proj, self.bvh['boot upper ' + side], .008, .009,
                      [(0, 0), (.003, .0015), (.007, .0017)], .004, self.high, 56 if self.high else 14)
        self.add(o, 'ceramic', foot)
        projb = kit.Planar((x, toe.y - .4, .11), (0, -1, 0), (0, 0, 1))
        heel = kit.fillet([(-.08, -.04), (.08, -.04), (.07, .06), (-.07, .06)], .02, 3 if self.high else 1)
        o = kit.plate('boot heel counter ' + side, heel, projb, self.bvh['boot upper ' + side], .008, .008, None, .003, self.high, 40 if self.high else 12)
        self.add(o, 'gunmetal', foot)
        # Ankle hinge disc and an instep strap with buckle.
        ank = V((x + sign * .074, toe.y - .17, .13))
        o = kit.lathe('boot ankle hinge ' + side, [(0, 0), (.028, 0), (.028, .008), (.02, .012), (.01, .012), (.01, .016), (0, .016)], ank, (sign, 0, 0), 24 if self.high else 10, collection=self.col)
        self.add(o, 'gunmetal', foot)
        path = [(V((x + math.cos(a) * .088, toe.y - .065, .045 + math.sin(a) * .075)), V((math.cos(a), 0, math.sin(a)))) for a in [math.radians(d) for d in range(-10, 191, 10 if self.high else 25)]]
        o = kit.ribbon('boot instep strap ' + side, path, .026, .004, closed=False, collection=self.col)
        self.add(o, 'graphite', foot)
        b = kit.prism('boot buckle ' + side, kit.fillet([(-.014, -.018), (.014, -.018), (.014, .018), (-.014, .018)], .004, 2), .006,
                      V((x + sign * .09, toe.y - .065, .06)), (sign, 0, 0), (0, 0, 1), self.col)
        if self.high:
            kit.bevel(b, .0012, 2, 30)
        self.add(b, 'steel', foot)
        if self.high:
            # Tread lugs on the sole.
            for i in range(7):
                yy = toe.y - .21 + i * .05
                lug = kit.prism('boot tread lug', [(-.05, -.008), (.05, -.008), (.05, .008), (-.05, .008)], .008, V((x, yy, .0)), (0, 0, -1), (0, 1, 0), self.col)
                self.add(lug, 'rubber', foot)

    def torso_armour(self):
        # Chest: two pectoral plates with the keel channel between (echo of the helmet).
        pec = [(5, 1.36), (40, 1.34), (78, 1.40), (84, 1.52), (66, 1.615), (30, 1.635), (5, 1.60)]
        pecs = {}
        for mirror, bone in ((False, 'ribs'), (True, 'ribs')):
            side = 'L' if not mirror else 'R'
            pecs[side] = self.torso_plate('pectoral plate ' + side, pec, mirror=mirror, crown=.012)   # HERO19: ceramic chest (title)
        # Pectoral intake vents: three gunmetal slats on a dark bed, lower outer corner.
        for mirror in ((False, True) if self.high else ()):
            sgn = -1 if mirror else 1
            self.torso_plate('pectoral vent bed', [(sgn * 46, 1.395), (sgn * 70, 1.415), (sgn * 70, 1.465), (sgn * 46, 1.445)], 'graphite',
                             standoff=.030, thickness=.004, crown=0, profile=[(0, 0)], fil=2)
            for k in range(3):
                z = 1.405 + k * .018 + .0
                self.torso_plate('pectoral vent slat', [(sgn * 48, z), (sgn * 68, z + .02 * 0 + .006), (sgn * 68, z + .014), (sgn * 48, z + .008)], 'gunmetal',
                                 standoff=.033, thickness=.005, crown=0, profile=[(0, 0)], fil=1)
        if self.high:
            self.stamp(pecs['L'], '07', V((-.5, 1.0, 1.52)), .05, 'ribs')
            self.stamp(pecs['R'], 'CK / KEEL', V((.45, 1.0, 1.58)), .016, 'ribs')
            proj = kit.Cylindrical((0, .01, 0), (0, 0, 1), (0, 1, 0))
            for d, z in ((12, 1.60), (70, 1.585), (12, 1.40), (-12, 1.60), (-70, 1.585), (-12, 1.40)):
                self.cast_bolt('torso', proj, d, z, .023, 'ribs', .005)
        self.torso_plate('sternum keel', [(-3.6, 1.38), (3.6, 1.38), (3.6, 1.63), (-3.6, 1.63)], 'gunmetal', standoff=.020, thickness=.012, crown=.002,
                         profile=[(0, 0), (.003, .001)], fil=1.5)
        self.torso_plate('sternum light', [(-1.4, 1.42), (1.4, 1.42), (1.4, 1.58), (-1.4, 1.58)], 'glow', standoff=.0215, thickness=.002, crown=0,
                         profile=[(0, 0)], fil=.6)
        # Segmented abdominal plates (overlapping bands, spine weighted).
        for i, (z0, z1) in enumerate([(1.255, 1.335), (1.175, 1.255)]):
            self.torso_plate(f'abdominal band {i}', [(-34 + i * 3, z0), (34 - i * 3, z0), (36 - i * 3, z1), (-36 + i * 3, z1)], bone='spine', standoff=.012 + i * .002, crown=.006, fil=4)
        # Back plate: rigs mount their modules on it.
        # Dorsal carapace: what the gameplay camera sees most. Upper back, shoulder
        # blades and lumbar are light ceramic so the read from above-behind matches the front.
        self.torso_plate('back plate', [(118, 1.30), (242, 1.30), (258, 1.47), (246, 1.645), (114, 1.645), (102, 1.47)], 'ceramic', standoff=.014, crown=.008)
        for mirror in (False, True):
            side = 'L' if not mirror else 'R'
            self.torso_plate('shoulder blade plate ' + side, [(112, 1.47), (158, 1.50), (160, 1.655), (108, 1.655)], mirror=mirror,
                             standoff=.026, crown=.008, fil=5)
        self.torso_plate('lumbar plate', [(132, 1.10), (228, 1.10), (238, 1.29), (122, 1.29)], 'ceramic', bone='spine', standoff=.016, crown=.006, fil=5)
        # Collar ring and belt with buckle and side pouches.
        self.ring('gorget collar', V((0, -.004, 1.648)), (0, 0, 1), .168, .040, role='ceramic', profile=[(.10, -.02), (.172, -.02), (.178, -.01), (.172, .016), (.15, .022), (.10, .022)], bone='ribs')
        self.ring('utility belt', V((0, .004, 1.07)), (0, 0, 1), .186, .050, role='graphite',
                  profile=[(.16, -.025), (.186, -.025), (.190, -.02), (.190, .02), (.186, .025), (.16, .025)], bone='hips')
        buckle = kit.prism('belt buckle', kit.fillet([(-.045, -.03), (.045, -.03), (.05, .03), (-.05, .03)], .008, 3 if self.high else 1), .016,
                           V((0, .19, 1.07)), (0, 1, 0), (0, 0, 1), self.col)
        kit.bevel(buckle, .002, 3 if self.high else 1, 30)
        self.add(buckle, 'gunmetal', 'hips')
        for s in (1, -1):
            pouch = kit.prism('belt pouch', kit.fillet([(-.045, -.045), (.045, -.045), (.045, .04), (-.045, .04)], .012, 3 if self.high else 1), .04,
                              V((s * .17, -.05, 1.045)), V((s, -.35, 0)).normalized(), (0, 0, 1), self.col)
            kit.bevel(pouch, .004, 3 if self.high else 1, 30)
            self.add(pouch, 'graphite', 'hips')
        # Pelvis: codpiece and hip plates (tassets, thigh weighted so legs swing freely).
        self.torso_plate('codpiece', [(-16, .93), (16, .93), (24, 1.03), (-24, 1.03)], standoff=.012, crown=.008, bone='hips', fil=4)
        for mirror in (False, True):
            side = 'L' if not mirror else 'R'
            self.torso_plate('hip tasset ' + side, [(62, .90), (110, .90), (112, 1.04), (60, 1.04)], mirror=mirror,
                             bone='thigh.' + side, standoff=.026, crown=.006, fil=5)
        if self.high:
            for s in (1, -1):
                # Unit marking on the left pectoral, small serial on the right.
                pass

    # ------------------------------------------------------------------ rigs
    def build_rig(self, rig):
        self.group = rig
        col = M.RIG_COLOUR[rig]
        for side in ('R', 'L'):
            self.pauldron(rig, side, col)
        getattr(self, rig)(col)
        # SHADE15: the title's big "07" on the large left pauldron, in the game mesh too (bakes into the atlas).
        big = 'L' if rig != 'pyro' else 'R'
        # HERO19: large stencil on the dome's outer-upper face, as on the title.
        self.stamp(self.pauldron_caps[big], '07', self.pauldron_centre[big] + V((-.45 if big == 'L' else .45, .10, .30)), .105, 'shoulder.' + big)
        if self.high:
            # Rig code stencilled on the right pauldron cap.
            self.stamp(self.pauldron_caps['R'], {'breacher': 'BR-1', 'cryo': 'CR-2', 'pyro': 'PY-3', 'arc': 'AR-4'}[rig],
                       self.pauldron_centre['R'] + V((.20, .06, .07)), .024, 'upper_arm.R')
        self.group = 'body'

    def shoulder_loft(self, side):
        name = 'shoulder ' + side
        if name not in self.lofts:
            sign = 1 if side == 'R' else -1
            c = self.j['upper_arm.' + side] + V((sign * .02, -.005, .02))
            sec = [(c + V((0, 0, z * .15)), .165 * math.sqrt(max(.04, 1 - z * z)), .175 * math.sqrt(max(.04, 1 - z * z)), {'upper_arm.' + side: 1})
                   for z in (-.98, -.8, -.5, -.15, .2, .5, .8, .98)]
            self.loft(name, sec, register=False)
        return name

    def pauldron(self, rig, side, col):
        """Layered shoulder: a main cap plus overlapping lames, shaped per rig."""
        sign = 1 if side == 'R' else -1
        name = self.shoulder_loft(side)
        c = self.j['upper_arm.' + side] + V((sign * .02, -.005, .02))
        proj = kit.Spherical(c, (sign, 0, 0), (0, 0, 1))   # lon: + toward back for R? computed below
        bone = 'upper_arm.' + side
        unit = 1 / (.17 * math.pi / 180)
        big = (side == 'L') != (rig == 'pyro')   # SHADE15: every rig carries the title's big pauldron
        self.__dict__.setdefault('pauldron_caps', {}); self.__dict__.setdefault('pauldron_centre', {})
        self.pauldron_centre[side] = c
        if big:
            # HERO19: the title's dome. A real rig-coloured hemisphere standing proud of the shoulder (about the
            # helmet's size), tilted outward so it reads from the high game camera whichever way he faces.
            R = .205
            axis = V((sign * .42, -.03, .91)).normalized()
            centre = c + V((sign * .045, -.008, .0))
            rings = 10 if self.high else 6
            prof = [(R * math.sin(math.radians(108 * i / rings)), R * math.cos(math.radians(108 * i / rings))) for i in range(rings + 1)]
            lip = prof[-1]
            prof += [(lip[0] - .014, lip[1] + .004)]   # rolled inner return (thickness at the rim)
            o = kit.lathe(f'{rig} pauldron cap {side}', prof, centre, axis, 40 if self.high else 18, ref=V((0, 1, 0)), collection=self.col)
            if self.high:
                kit.bevel(o, .002, 2, 35)
            # Bound to the clavicle, not the upper arm: the dome stays on top of the shoulder in the aim
            # and run poses (the title silhouette) while the arm swings beneath its open rim.
            self.add(o, col, 'shoulder.' + side)
            self.pauldron_caps[side] = o
            # One dark seat ring under the dome rim: the only break in the shape.
            seat = kit.lathe(f'{rig} pauldron seat {side}', [(lip[0] - .010, lip[1] - .006), (lip[0] + .004, lip[1] - .004), (lip[0] + .004, lip[1] + .010), (lip[0] - .010, lip[1] + .012)],
                             centre, axis, 40 if self.high else 18, ref=V((0, 1, 0)), collection=self.col, caps=False)
            self.add(seat, 'gunmetal', 'shoulder.' + side)
        else:
            # HERO19: the off shoulder stays small and ceramic (one cap, one lame), clearly below the dome.
            scale = .85
            def P(pts):
                return [(u * scale, v * scale) for u, v in pts]
            cap = P([(-70, -8), (70, -8), (76, 34), (48, 74), (-48, 74), (-76, 34)])
            o = kit.plate(f'{rig} pauldron cap {side}', kit.fillet(cap, 9, 3 if self.high else 2), proj, self.bvh[name], .020, .012,
                          [(0, 0), (.003, .002), (.008, .0024), (.011, .0006), (.0135, .0006), (.014, .0022)], .006, self.high, 72 if self.high else 14, unit=unit)
            self.add(o, 'ceramic', bone)
            self.pauldron_caps[side] = o
            lame = P([(-62, -30), (62, -30), (66, -6), (-66, -6)])
            o = kit.plate(f'{rig} pauldron lame 0 {side}', kit.fillet(lame, 5, 3 if self.high else 1), proj, self.bvh[name], .017, .010,
                          None, .004, self.high, 48 if self.high else 10, unit=unit)
            self.add(o, 'ceramic', bone)
        # Coloured forearm guard over the vambrace (rig identity on the arms).
        a, b = self.j['forearm.' + side], self.j['hand.' + side]
        self.limb_plate(f'{rig} forearm guard {side}', 'arm ' + side, a, b, side,
                        [(-30, .06), (70, .055), (85, .12), (60, .15), (-25, .155), (-45, .10)], role=col, bone='forearm.' + side,
                        radius=.08, standoff=.024, thickness=.009, crown=.005)

    def back_frame(self):
        """Rig identity from above: rig-coloured dorsal spine with a glowing core strip and a rear collar arc."""
        col = M.RIG_COLOUR[self.group]
        self.torso_plate('dorsal spine', [(165, 1.10), (195, 1.10), (196, 1.64), (164, 1.64)], col, standoff=.030, thickness=.012, crown=.004,
                         profile=[(0, 0), (.003, .0014)], fil=3)
        self.torso_plate('dorsal core light', [(176, 1.13), (184, 1.13), (184, 1.36), (176, 1.36)], M.RIG_GLOW[self.group], standoff=.0435,
                         thickness=.003, crown=0, profile=[(0, 0)], fil=1.5)
        self.torso_plate('rear collar arc', [(120, 1.635), (240, 1.635), (236, 1.69), (124, 1.69)], col, standoff=.020, thickness=.010, crown=.003,
                         profile=[(0, 0), (.003, .0012)], fil=3)

    def breacher(self, col):
        self.back_frame()
        # Impact accumulator: a pressure vessel flanked by two hydraulic rams.
        base = V((0, -.235, 1.47))
        tank = kit.lathe('breacher accumulator', [(0, -.16), (.05, -.16), (.075, -.13), (.08, -.10), (.08, .10), (.075, .13), (.05, .16), (0, .16)],
                         base, (0, 0, 1), 32 if self.high else 12, collection=self.col)
        self.add(tank, col, 'ribs')
        for z in (-.07, .07):
            self.ring('accumulator band', base + V((0, 0, z)), (0, 0, 1), .081, .016, bone='ribs')
        for s in (1, -1):
            x = s * .125
            barrel = kit.cylinder('breacher ram barrel', (x, -.21, 1.30), (x, -.21, 1.52), .030, 24 if self.high else 10, self.col)
            self.add(barrel, col, 'ribs')
            rod = kit.cylinder('breacher ram rod', (x, -.21, 1.52), (x, -.21, 1.68), .015, 20 if self.high else 8, self.col)
            self.add(rod, 'steel', 'ribs')
            self.ring('ram gland', V((x, -.21, 1.52)), (0, 0, 1), .032, .014, bone='ribs')
            eye = kit.lathe('ram eye', [(0, -.012), (.022, -.012), (.022, .012), (0, .012)], (x, -.21, 1.69), (1, 0, 0), 20 if self.high else 8, collection=self.col)
            self.add(eye, 'gunmetal', 'ribs')
        hose = kit.sweep('breacher pressure line', kit.catmull([(.04, -.30, 1.40), (.10, -.32, 1.35), (.125, -.25, 1.31)], 8), .009, 10 if self.high else 6, collection=self.col)
        self.add(hose, 'rubber', 'ribs')
        # Ram gauntlet on the left forearm.
        a, b = self.j['forearm.L'], self.j['hand.L']
        d = (b - a).normalized()
        for k in (-1, 1):
            p0 = a.lerp(b, .25) + V((-.09, k * .03, 0)); p1 = a.lerp(b, .8) + V((-.09, k * .03, 0))
            self.add(kit.cylinder('ram gauntlet housing', p0, p1, .018, 20 if self.high else 8, self.col), col, 'forearm.L')
            self.add(kit.cylinder('ram gauntlet rod', p1, p1 + d * .03, .009, 16 if self.high else 6, self.col), 'steel', 'forearm.L')

    def cryo(self, col):
        self.back_frame()
        for s in (1, -1):
            base = V((s * .10, -.235, 1.46))
            prof = [(0, -.17), (.035, -.17), (.055, -.15), (.058, -.12), (.058, .12), (.055, .15), (.035, .17), (0, .17)]
            self.add(kit.lathe('cryo dewar', prof, base, (0, 0, 1), 32 if self.high else 12, collection=self.col), col, 'ribs')
            for z in (-.10, .10):
                self.ring('dewar insulation band', base + V((0, 0, z)), (0, 0, 1), .059, .022, role='ceramic', bone='ribs')
            # Valve head and gauge.
            top = base + V((0, 0, .17))
            self.add(kit.lathe('dewar valve', [(0, 0), (.018, 0), (.018, .02), (.012, .028), (0, .028)], top, (0, 0, 1), 20 if self.high else 8, collection=self.col), 'steel', 'ribs')
            wheel = kit.lathe('dewar valve wheel', [(.010, .026), (.024, .026), (.024, .032), (.010, .032)], top, (0, 0, 1), 24 if self.high else 8, collection=self.col, caps=False)
            self.add(wheel, 'gunmetal', 'ribs')
            g = base + V((s * .04, -.045, .06))
            gauge = kit.lathe('dewar gauge', [(0, 0), (.016, 0), (.016, .008), (.012, .009), (0, .009)], g, V((s * .6, -1, 0)).normalized(), 20 if self.high else 8, collection=self.col)
            self.add(gauge, 'steel', 'ribs')
            if self.high:
                face = kit.lathe('gauge face', [(0, .0085), (.011, .0085), (0, .0086)], g, V((s * .6, -1, 0)).normalized(), 20, collection=self.col)
                self.add(face, 'ice_glow', 'ribs')
            # Corrugated coolant hose from the dewar top over the shoulder to the forearm.
            side = 'R' if s > 0 else 'L'
            pts = [top + V((0, 0, .03)), V((s * .17, -.20, 1.70)), V((s * .30, -.12, 1.64)), self.j['forearm.' + side] + V((s * .06, -.04, -.02))]
            hose = kit.sweep('cryo coolant hose', kit.catmull(pts, 10 if self.high else 4), kit.corrugated(.013, .18, 22) if self.high else .014,
                             10 if self.high else 6, collection=self.col)
            self.add(hose, 'rubber', weights_from='arm ' + side)
        self.ring('cryo frost collar', V((0, -.004, 1.672)), (0, 0, 1), .176, .024, role=col, bone='ribs',
                  profile=[(.15, -.012), (.180, -.012), (.186, -.004), (.184, .010), (.17, .014), (.15, .014)])

    def pyro(self, col):
        self.back_frame()
        for s in (1, -1):
            base = V((s * .095, -.23, 1.42))
            prof = [(0, -.12), (.04, -.12), (.06, -.10), (.062, .06), (.05, .09), (.02, .10), (0, .10)]
            self.add(kit.lathe('pyro fuel cell', prof, base, (0, 0, 1), 32 if self.high else 12, collection=self.col), col, 'ribs')
            self.ring('fuel cell band', base + V((0, 0, -.02)), (0, 0, 1), .063, .02, bone='ribs')
            # Exhaust stack: ribbed throat with temper discolouration at the tip.
            a = base + V((s * .03, -.03, .10)); b = a + V((s * .07, -.03, .26))
            stack = kit.lathe('pyro exhaust stack', [(0, 0), (.026, 0), (.030, .04), (.030, .20), (.036, .23), (.036, .27), (.030, .275), (.024, .275)],
                              a, (b - a).normalized(), 28 if self.high else 10, collection=self.col, caps=False)
            heat = stack.data.attributes.new('k12_heat', 'FLOAT', 'POINT')
            for v, h in zip(stack.data.vertices, heat.data):
                h.value = max(0, min(1, (v.co - a).dot((b - a).normalized()) / .275))
            self.add(stack, 'heat', 'ribs')
            for k in range(4 if self.high else 1):
                self.ring('exhaust fin', a + (b - a).normalized() * (.06 + k * .04), (b - a).normalized(), .040, .008, bone='ribs')
            throat = kit.lathe('pyro exhaust glow', [(0, .262), (.024, .262), (0, .262)], a, (b - a).normalized(), 20 if self.high else 8, collection=self.col)
            self.add(throat, 'fire_glow', 'ribs')
            side = 'R' if s > 0 else 'L'
            pts = [base + V((s * .05, .0, -.11)), V((s * .21, -.10, 1.24)), V((s * .30, -.03, 1.30)), self.j['forearm.' + side] + V((s * .05, -.03, -.06))]
            hose = kit.sweep('pyro fuel line', kit.catmull(pts, 10 if self.high else 4), kit.corrugated(.011, .15, 20) if self.high else .012,
                             10 if self.high else 6, collection=self.col)
            self.add(hose, 'rubber', weights_from='arm ' + side)
        # Heat apron at the front of the belt.
        self.torso_plate('pyro heat apron', [(-22, .86), (22, .86), (26, 1.04), (-26, 1.04)], 'gunmetal', bone='hips', standoff=.030, crown=.004, fil=4)

    def arc(self, col):
        self.back_frame()
        # Capacitor bank with two wound induction coils and antenna forks.
        base = V((0, -.232, 1.46))
        bank = kit.lathe('arc capacitor bank', [(0, -.15), (.045, -.15), (.06, -.13), (.06, .13), (.045, .15), (0, .15)], base, (0, 0, 1), 32 if self.high else 12, collection=self.col)
        self.add(bank, col, 'ribs')
        for k, z in enumerate((-.09, -.03, .03, .09)):
            self.ring('capacitor insulator', base + V((0, 0, z)), (0, 0, 1), .064, .012, role='ceramic' if k % 2 else 'gunmetal', bone='ribs')
        for s in (1, -1):
            c = V((s * .15, -.225, 1.50))
            core = kit.cylinder('arc coil core', c + V((0, 0, -.12)), c + V((0, 0, .14)), .020, 20 if self.high else 8, self.col)
            self.add(core, col, 'ribs')
            turns = 14 if self.high else 6
            pts = [c + V((math.cos(a) * .032, math.sin(a) * .032, -.10 + .20 * a / (turns * math.tau))) for a in [i * math.tau / (12 if self.high else 6) for i in range(turns * (12 if self.high else 6) + 1)]]
            coil = kit.sweep('arc coil winding', pts, .0055, 8 if self.high else 4, collection=self.col)
            self.add(coil, 'brass', 'ribs')
            self.add(kit.lathe('coil cap', [(0, 0), (.04, 0), (.04, .012), (0, .012)], c + V((0, 0, .11)), (0, 0, 1), 20 if self.high else 8, collection=self.col), 'ceramic', 'ribs')
            ant = kit.sweep('arc antenna', [c + V((0, 0, .12)), c + V((s * .02, -.01, .28)), c + V((s * .05, -.02, .36))], lambda t: .006 * (1 - .5 * t), 8 if self.high else 5, collection=self.col)
            self.add(ant, 'gunmetal', 'ribs')
            tip = kit.lathe('arc antenna tip', [(0, 0), (.011, .004), (.009, .022), (0, .028)], c + V((s * .05, -.02, .35)), (0, 0, 1), 16 if self.high else 6, collection=self.col)
            self.add(tip, 'arc_glow', 'ribs')
            side = 'R' if s > 0 else 'L'
            a, b = self.j['forearm.' + side], self.j['hand.' + side]
            ring = kit.lathe('arc gauntlet coil', [(.084, -.01), (.094, -.01), (.094, .01), (.084, .01)], a.lerp(b, .45), (b - a).normalized(), 28 if self.high else 10, collection=self.col, caps=False, arc=290)
            self.add(ring, 'arc_glow', 'forearm.' + side)
        self.add(kit.lathe('arc bank light', [(.061, -.10), (.0625, -.10), (.0625, .10), (.061, .10)], base, (0, 0, 1), 32 if self.high else 12, collection=self.col, caps=False, arc=60), 'arc_glow', 'ribs')
