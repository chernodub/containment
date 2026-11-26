"""HERO24: game-scale versions of the PORTRAIT24 selector kit (selection_kit.py), on the play model. Original MIT.

The portrait kit is close-up only; these are the same four ideas simplified and enlarged so they change the
top-down silhouette at ~110 px: Breacher's clipped-corner strike plate on the left forearm, Cryo's two tall
dewars with a return loop over them, Pyro's twin flared exhaust stacks over fuel bottles, Arc's forked mast on
a stack of insulators rising above the helmet. Parts named 'kit24 paint …' carry the rig paint mask
(marine.py), everything else is the shared gunmetal/steel/rubber/glow roles. Built in both LODs (the high
copy feeds the normal bake); skipped for the portrait close-up, which has its own kit.
"""
import math
from mathutils import Vector as V
import kit
import materials as M

# Old back-pack parts each new assembly replaces (they sat where the new kit stands).
REPLACED = {
    'breacher': ('breacher ram barrel', 'breacher ram rod', 'ram gland', 'ram eye', 'ram gauntlet housing', 'ram gauntlet rod'),
    'cryo': ('cryo coolant hose', 'cryo dewar', 'dewar insulation band', 'dewar valve', 'dewar valve wheel', 'dewar gauge', 'gauge face'),
    'pyro': ('pyro fuel cell', 'fuel cell band', 'pyro exhaust stack', 'exhaust fin', 'pyro exhaust glow'),
    'arc': ('arc antenna', 'arc antenna tip'),
}


def extend(suit, rig, portrait=False):
    suit.group = rig
    colour = M.RIG_COLOUR[rig]
    hi = suit.high
    seg = 28 if hi else 12
    keep = []
    for obj in suit.groups[rig]:
        if obj.name.split('.')[0] in REPLACED[rig]:
            obj.users_collection[0].objects.unlink(obj)
        else:
            keep.append(obj)
    suit.groups[rig][:] = keep

    def lathe(name, profile, base, axis, role, bone='ribs', segments=None, caps=True):
        obj = kit.lathe(name, profile, base, V(axis).normalized(), segments or seg, collection=suit.col, caps=caps)
        return suit.add(obj, role, bone)

    def tube(name, points, radius, role, bone='ribs', sides=None):
        path = kit.catmull(points, 6 if hi else 3)
        return suit.add(kit.sweep(name, path, radius, sides or (10 if hi else 6), collection=suit.col), role, bone)

    if rig == 'breacher':
        # Strike plate: a broad clipped-corner slab standing off the outside of the left forearm, tilted up so the
        # high camera sees its painted face in the aim and run poses.
        elbow, wrist = suit.j['forearm.L'], suit.j['hand.L']
        along = (wrist - elbow).normalized()
        n = V((-.80, .20, .56))
        n = (n - along * n.dot(along)).normalized()
        n = (along * .34 + n).normalized()
        origin = wrist - along * .055 + n * .095
        outline = [(x * 2.40, y * 1.64) for x, y in [(-.15, -.20), (-.08, -.27), (.10, -.25), (.15, -.15), (.15, .17), (.08, .24), (-.11, .23), (-.15, .15)]]
        for name, scale, offset, depth, role in [('ram shoe', 1.0, 0, .050, 'gunmetal'),
                                                 ('kit24 paint strike face', .90, .034, .026, colour)]:
            obj = kit.prism(name, [(x * scale, y * scale) for x, y in outline], depth, origin + n * offset, n, -along, suit.col)
            if hi:
                kit.bevel(obj, .008, 2)
            suit.add(obj, role, 'forearm.L')
        cleat_origin = origin + n * .054
        cleat_up = -along
        if portrait:
            plate = kit.Planar(origin + n * .059, n, -along)
            cleat_origin = plate.o + n * .007
            cleat_up = plate.u
            for x in (-.165, .165):
                for y in (-.105, .105):
                    base = plate.frame(x, y)[0]
                    bolt = kit.cylinder('recessed strike face stud', base, base + n * .004,
                                        .011, 8, suit.col)
                    kit.bevel(bolt, .0015, 2)
                    suit.add(bolt, 'steel', 'forearm.L')
            face = kit.prism('strike plate inset', [(x * .82, y * .82) for x, y in outline],
                             .014, origin + n * .052, n, -along, suit.col)
            kit.bevel(face, .006, 3)
            suit.add(face, 'gunmetal', 'forearm.L')
        # Raised chevron follows the broad face in the same forearm skin.
        chevron = [(-.16, .085), (0, -.022), (.16, .085), (.16, .030), (0, -.080), (-.16, .030)]
        obj = kit.prism('ram crest', chevron, .012, origin + n * (.069 if portrait else .061), n, -along, suit.col)
        suit.add(obj, 'steel', 'forearm.L')
        for y in ((-.19, .19) if portrait else (-.25, .25)):
            obj = kit.prism('ram impact cleat', [(-.085, -.016), (.085, -.016), (.085, .016), (-.085, .016)], .014,
                            cleat_origin + cleat_up * y, n, -along, suit.col)
            if portrait:
                kit.bevel(obj, .004, 3)
            suit.add(obj, 'gunmetal', 'forearm.L')
        # Open knuckle bow: its brass return crosses the exposed wrist-side edge.
        frame = kit.Planar(origin, n, -along)
        bow = [frame.frame(x,y)[0] - n * depth for x,y,depth in
               [(-.23,-.12,.025),(-.39,-.12,.08),(-.39,.13,.12),(-.23,.13,.025)]]
        tube('ram grip bow', bow, .031, 'brass', 'forearm.L')
        # Two short rams behind the plate into the elbow (the gauntlet's mechanism).
        for k in (-1, 1):
            side = n.cross(along).normalized() * (k * .06)
            p0 = elbow.lerp(wrist, .15) + n * .06 + side
            suit.add(kit.cylinder('ram piston', p0, p0 + along * .20, .019, 12 if hi else 6, suit.col), 'steel', 'forearm.L')
    elif rig == 'cryo':
        tops = []
        for x, h in ((-.13, .64), (.13, .64)):
            base = V((x, -.36, 1.32))
            axis = V((x * .22, -.08, 1)).normalized()
            prof = [(0, 0), (.070, 0), (.096, .035), (.098, .07), (.098, h - .07), (.090, h - .03), (.055, h), (0, h)]
            lathe('kit24 paint dewar', prof, base, axis, colour)
            for t in (.13, h - .16):
                suit.ring('dewar jacket strap', base + axis * t, axis, .100, .030, 'gunmetal', 'ribs')
            top = base + axis * h
            lathe('dewar valve nut', [(0, 0), (.034, 0), (.034, .04), (0, .04)], top, axis, 'steel')
            tops.append((top, axis))
        # Insulated return loop: up from one valve, arching high over the pack and down into the other.
        (a, aa), (b, ba) = tops
        mid = (a + b) / 2
        tube('dewar return loop', [a + aa * .03, a + aa * .14 + V((.03, -.03, 0)), mid + V((0, -.08, .20)),
                                   b + ba * .14 + V((-.03, -.03, 0)), b + ba * .03], .026, 'rubber')
        tube('dewar upper yoke', [a,mid+V((0,-.02,.025)),b], .058, 'gunmetal')
        # Supply line on the firing side. Each section follows its mount,
        # from the valve over the upper arm to the animated weapon receiver.
        outlet = tops[1][0]
        anchors = [outlet, outlet + V((.13, -.015, -.04)),
                   suit.j['upper_arm.R'] + V((.12, 0, .04)),
                   suit.j['forearm.R'] + V((.09, -.055, 0)),
                   suit.j['hand.R'] + V((.06, -.04, -.04)), suit.j['tag_weapon']]
        joints = ['ribs', 'ribs', 'upper_arm.R', 'forearm.R', 'hand.R', 'tag_weapon']
        steps, sides = (7, 10) if hi else (4, 7)
        path = kit.catmull(anchors, steps)
        hose = kit.sweep('receiver coolant feed', path, .021, sides, collection=suit.col)
        suit.add(hose, 'rubber')
        groups = {name: hose.vertex_groups.new(name=name) for name in dict.fromkeys(joints)}
        for row in range(len(path)):
            segment = min(row // steps, len(anchors) - 2)
            blend = row / steps - segment
            vertices = list(range(row * sides, (row + 1) * sides))
            groups[joints[segment]].add(vertices, 1 - blend, 'ADD')
            groups[joints[segment + 1]].add(vertices, blend, 'ADD')
        # Back saddle the dewars stand in.
        obj = kit.prism('dewar saddle', [(-.22, -.05), (.22, -.05), (.20, .05), (-.20, .05)], .07, V((0, -.30, 1.33)), (0, -1, 0), (0, 0, 1), suit.col)
        suit.add(obj, 'gunmetal', 'ribs')
    elif rig == 'pyro':
        for s in (-1, 1):
            base = V((s * (.40 if s < 0 else .32), -.19, 1.02 if s < 0 else .98))
            tube('exhaust load yoke', [V((0,-.23,1.39)),V((s*.24,-.26,1.32)),base+V((0,-.02,.15))], .073, 'gunmetal')
            bottle_axis = V((s * (.65 if s < 0 else .12), -.65, .78)).normalized()
            lathe('kit24 paint fuel bottle', [(0, 0), (.075, 0), (.102, .04), (.104, .06), (.104, .30), (.088, .36), (.05, .385), (0, .385)],
                  base, bottle_axis, colour)
            suit.ring('fuel strap', base + bottle_axis * .21, bottle_axis, .106, .036, 'gunmetal', 'ribs')
            # Flared exhaust stack rising from the bottle head, leaning out and back.
            a = base + bottle_axis * .37
            axis = V((s * 1.18, -.38, .56)).normalized()
            stack = lathe('pyro flared exhaust', [(.036, 0), (.044, .03), (.044, .25), (.058, .30), (.080, .36), (.082, .38), (.064, .38), (.050, .33)],
                          a, axis, 'heat', caps=False)
            heat = stack.data.attributes.new('k12_heat', 'FLOAT', 'POINT')
            for v, hv in zip(stack.data.vertices, heat.data):
                hv.value = max(0, min(1, (v.co - a).dot(axis) / .38))
            suit.ring('exhaust collar', a + axis * .06, axis, .050, .03, 'gunmetal', 'ribs')
            lathe('pyro exhaust glow', [(0, .336), (.060, .336), (.060, .346), (0, .346)], a, axis, 'fire_glow', segments=12 if hi else 8)   # closed puck: a zero-area disc shaded NaN (black squares in play)
    else:
        base = V((-.19, -.255, 1.36))
        axis = V((-.88, -.36, .80)).normalized()
        lathe('telescopic pylon', [(0, 0), (.060, 0), (.050, .26), (.030, .30), (.026, .78), (0, .78)], base, axis, 'steel')
        for k, z in enumerate((.30, .37, .44, .51, .58)):
            r = .092 - k * .006
            lathe('kit24 paint insulator', [(.028, 0), (r, .014), (r, .032), (.030, .046)], base + axis * z, axis, colour)
        tip = base + axis * .74
        right = axis.cross(V((0, 1, 0))).normalized()
        for s in (-1, 1):
            end = tip + right * (s * .135) + axis * .17
            tube('pylon fork', [tip, tip + right * (s * .11) + axis * .06, end], .016, 'brass', sides=8 if hi else 5)
            lathe('fork terminal', [(0, 0), (.026, .01), (.022, .04), (0, .05)], end, axis, 'arc_glow', segments=12 if hi else 6)
    suit.group = 'body'
