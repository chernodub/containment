"""Close-up selector variants of the four backpack and gauntlet assemblies."""
from mathutils import Vector as V
import kit
import materials as M


def extend(suit, rig):
    suit.group = rig
    colour = M.RIG_COLOUR[rig]

    def vessel(name, profile, base, axis, role):
        obj = kit.lathe(name, profile, base, axis, 40, collection=suit.col)
        suit.add(obj, role, 'ribs')

    def conduit(name, points, radius, role):
        path = kit.catmull(points, 8)
        suit.add(kit.sweep(name, path, radius, 12, collection=suit.col), role, 'ribs')

    if rig == 'breacher':
        elbow, wrist = suit.j['forearm.L'], suit.j['hand.L']
        origin = elbow.lerp(wrist, .5) + V((-.115, 0, 0))
        normal = V((-.92, .38, 0)).normalized()
        up = kit.Planar(origin, normal, elbow - wrist).u
        outline = [(-.17,-.25),(-.09,-.34),(.12,-.30),(.19,-.17),(.19,.20),(.10,.28),(-.13,.26),(-.17,.17)]
        for name, scale, offset, depth, role in [
                ('ram shoe', 1, 0, .065, 'gunmetal'), ('ram strike face', .94, .044, .036, colour),
                ('ram strike insert', .73, .067, .015, 'graphite')]:
            obj = kit.prism(name, [(x*1.35*scale,y*1.50*scale) for x,y in outline], depth, origin+normal*offset, normal, up, suit.col)
            kit.bevel(obj, .01, 3)
            suit.add(obj, role, 'forearm.L')
        for y in (-.22, 0, .22):
            obj = kit.prism('ram impact cleat', [(-.095,-.014),(.095,-.014),(.095,.014),(-.095,.014)],
                            .013, origin+normal*.079+up*y, normal, up, suit.col)
            kit.bevel(obj, .004, 2)
            suit.add(obj, 'gunmetal', 'forearm.L')
    elif rig == 'cryo':
        for i, (x, z) in enumerate([(-.24,1.72),(.14,1.67)]):
            base = V((x,-.32,z))
            vessel('high capacity dewar', [(0,-.34),(.077,-.32),(.103,-.26),(.103,.19),(.093,.25),(.045,.28),(.03,.28),(0,.28)], base,(0,0,1),colour)
            for h in (-.20,.15):
                suit.ring('dewar jacket strap',base+V((0,0,h)),(0,0,1),.106,.031,'gunmetal','ribs')
            vessel('dewar valve nut',[(0,0),(.036,0),(.036,.045),(0,.045)],base+V((0,0,.28)),(0,0,1),'steel')
            sign = -1 if i == 0 else 1
            conduit('insulated return', [base+V((0,0,.32)),(x+sign*.10,-.30,z+.35),
                    (x+sign*.16,-.25,z+.26),(x+sign*.17,-.21,z-.03),(x,-.24,z-.23)],kit.corrugated(.024,.14,30),'rubber')
    elif rig == 'pyro':
        for x in (-.19,.19):
            base=V((x,-.42,1.51))
            suit.add(kit.cylinder('fuel pack hanger',(x,-.18,1.48),base,.057,20,suit.col),'gunmetal','ribs')
            vessel('reserve fuel bottle',[(0,-.23),(.075,-.23),(.115,-.16),(.115,.13),(.09,.19),(.055,.21),(0,.21)],base,(0,0,1),colour)
            suit.ring('fuel strap',base,(0,0,1),.118,.044,'gunmetal','ribs')
            vessel('flared exhaust',[(.039,0),(.050,.04),(.050,.23),(.067,.28),(.067,.30),(.050,.30),(.040,.25)],base+V((0,0,.18)),(x,-.43,.60),'heat')
    else:
        base=V((-.14,-.27,1.52))
        axis=V((-.39,-.17,1)).normalized()
        vessel('telescopic pylon',[(0,0),(.067,0),(.05,.31),(.031,.36),(.028,.64),(.021,.74),(0,.74)],base,axis,'steel')
        for z in (.38,.44,.50,.56):
            vessel('porcelain insulator',[(.028,0),(.072,.012),(.074,.024),(.032,.035)],base+axis*z,axis,colour)
        tip=base+axis*.67
        for sign in (-1,1):
            end=tip+V((sign*.058,0,.15))
            conduit('pylon fork',[tip, tip+V((sign*.055,0,.052)),end],.016,'brass')
            vessel('fork terminal',[(0,0),(.023,.01),(.020,.036),(0,.045)],end,(0,0,1),'arc_glow')
    suit.group = 'body'
