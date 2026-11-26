"""Contact surfaces shared by the heavy family, in design coordinates."""
from sdf import Box, Prism, FLESH, v3


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
