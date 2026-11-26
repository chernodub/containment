"""Contact surfaces shared by the heavy family, in design coordinates."""
from sdf import Box, Prism, Ellipsoid, BONE, FLESH, v3


def planted_hand(body, palm, bone, scale=1.0):
    def at(x, y, z):
        return palm + scale * v3((x, y, z))

    body.add(Box(at(.10, 0, -.09), scale * v3((.61, .82, .35)), round=.13 * scale,
                 zone=FLESH, bone=bone, k=.06, plate=76))
    for i, offset in enumerate((-.60, 0, .60)):
        root = at(.54, offset, -.11)
        end = at(1.63 - .14 * abs(offset), offset * 1.38, -.38)
        body.add(Prism(root, end, .38 * scale, .09 * scale, sides=4, squash=.8,
                       zone=FLESH, bone=bone, k=.05, plate=80+i))


def sole(body, foot, bone, half):
    body.add(Box(foot, half, round=.10, zone=FLESH, bone=bone, k=.08, plate=83))

def warden_foot(body, heel, bone, length, width, depth):
    """Round heel, inclined instep and three separately planted claw tips."""
    def point(x, y, z):
        return heel + v3((x*length, y*width, z*depth))

    body.add(Ellipsoid(point(.15, 0, .18), (length*.41, width*.55, depth*.80),
                       zone=FLESH, bone=bone, plate=83, k=.10))
    body.add(Prism(point(.15, 0, .36), point(.62, 0, -.10), width*.43, width*.67,
                   sides=6, squash=.50, zone=FLESH, bone=bone, plate=76, k=.09))
    for i in (-1, 0, 1):
        knuckle = point(.56, i*.47, -.12)
        end = point(.94-.12*abs(i), i*.83, -.35)
        body.add(Prism(knuckle, end, width*.24, width*.16, sides=5, squash=.75,
                       zone=BONE, bone=bone, plate=452, k=.05))
        body.add(Prism(end, point(1.17-.16*abs(i), i*1.04, -.55), width*.19,
                       width*.025, sides=4, squash=.64, zone=BONE, bone=bone, plate=451))
