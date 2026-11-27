"""HEAVY39: the Warden as its own animal on the shared tyrant skeleton: longer and lower than the Brute, three
jade shell bands under a tall bone sail along the spine ridge, heavier forequarters, and a head built around an
open jaw (bone prow on the upper jaw, a dark lower jaw on visible cheek hinges, dark teeth across a lit throat)."""

from heavy_support import warden_foot
import math

from sdf import AnglePlate, Ellipsoid, Prism, RoundCone, ShellBand, frame, normalize, v3, ARMOR, FLESH, CREST, ORGAN

CROWN_PLATES = (450, 451)   # bone: prow and sail (atlas "lead" = bruteFace)
DORSAL_PLATES = (420, 421, 422, 423)
UNDER, JADE = 66, 70


def build(sk, a):
    from sdf import Sculpture
    w = Sculpture("brute-warden")

    def lobe(center, radii, bone, tilt=0.0, k=.25, plate=UNDER, zone=FLESH, **kw):
        w.add(Ellipsoid(center, radii, frame((1, 0, tilt)), zone=zone, bone=bone, k=k, plate=plate, **kw))

    def band(c, angle, half, radii, drop, bone, plate=JADE, thick=.36, lip=.10, up=(0, 0, 1)):
        t = math.radians(angle)
        fwd = v3((math.cos(t), 0, math.sin(t)))
        u = v3((-math.sin(t), up[1], math.cos(t)))
        w.add(ShellBand(c, frame(fwd, u), radii, half, drop, thick=thick, bevel=.10, lip=lip,
                        zone=ARMOR, bone=bone, plate=plate, hard=1.0))

    # --- underbody: long, low, near-black ------------------------------------------------------------------------
    lobe((.45, 0, 5.15), (1.95, 1.55, 1.40), "chest")
    lobe((-1.35, 0, 5.05), (1.55, 1.30, 1.20), "chest", .05)
    lobe((-2.95, 0, 4.55), (1.35, 1.15, 1.05), "tail", .2)
    # Broad dorsal crowns with a dark overhanging step beneath the leading bevel.
    spine = ((.82, 6.64, -8, 1.97), (-.94, 6.65, 7, 1.94), (-2.76, 6.08, 26, 1.75))
    for i, (x, z, ang, ry) in enumerate(spine):
        bone = "chest" if x > -2 else "tail"
        band((x + .12, 0, z - .23), ang + 24, 1.03, (3.8, ry + .06, 1.28), 1.12, bone, UNDER)
        band((x, 0, z), ang + 24, .75, (3.8, ry, 1.28), 1.12, bone, JADE + i, thick=.32, lip=.16)
    # sail: four tall bone blades raked back along the ridge, tallest over the withers
    for (x, z, height), number in zip(((.75, 6.70, 1.84), (-.40, 6.80, 1.96), (-1.55, 6.66, 1.60), (-2.60, 6.25, 1.15)),
                                      (451, 451, 451, 451)):
        base = v3((x, 0, z))
        tip = base + v3((-.15 * height, 0, 1.16 * height))
        w.add(Prism(base, tip, .62, .07, sides=4, up=(0, 1, 0), roll=math.pi / 4, squash=.42,
                    zone=CREST, bone="chest" if x > -2 else "tail", k=.04, plate=number, hard=1.0))
    # --- heavier forequarters: cap, upper arm, dark elbow, forearm + guard, dark wrist, fist, two knuckles -----------
    for s, side in ((-1, "r"), (1, "l")):
        sh, el, wr = v3((.55, 2.15 * s, 5.95)), v3((.70, 3.00 * s, 4.35)), v3((2.30, 3.10 * s, 2.25))
        lobe(sh + v3((0, .2 * s, .05)), (1.10, .95, .95), "chest", k=.12, plate=JADE + 6)
        w.add(ShellBand(sh + v3((.05, .35 * s, 1.08)), frame((1, .10 * s, -.10), (0, .55 * s, 1)), (1.55, 1.25, 1.05),
                        1.0, .75, thick=.34, bevel=.10, lip=.06, zone=ARMOR, bone="chest", plate=JADE + 7, hard=1.0))
        w.add(RoundCone(sh + v3((0, .3 * s, -.4)), el, .98, .80, zone=FLESH, bone="chest", k=.08, plate=JADE + 6))
        lobe(el, (.74, .72, .72), "chest", k=.05)
        w.add(RoundCone(el, wr, .86, 1.04, zone=FLESH, bone="chest", k=.06, plate=JADE + 8))
        d = normalize(wr - el)
        upv = normalize(v3((0, .55 * s, 1)) - d * float(d @ v3((0, .55 * s, 1))))
        w.add(ShellBand((el + wr) * .5 + upv * .98, frame(d, upv), (2.0, .95, .85), .85, .65, thick=.24, bevel=.09,
                        zone=ARMOR, bone="chest", plate=JADE + 9, hard=1.0))
        lobe(wr, (.72, .76, .49), "chest", k=.05)
        fist = wr + v3((.45, .02 * s, -.10))
        warden_foot(w, fist, "chest", 1.72, 1.12, .68)
        # hind legs: thigh, dark knee, shin, dark foot
        hip, knee, foot = v3((-2.95, 1.05 * s, 4.25)), v3((-2.55, 1.75 * s, 2.65)), v3((-3.05, 1.95 * s, .50))
        w.add(RoundCone(hip, knee, .95, .74, zone=FLESH, bone=f"leg.back.{side}", k=.15, plate=JADE + 6))
        w.add(Ellipsoid(knee, (.76,) * 3, zone=FLESH, bone=("blend", f"leg.back.{side}", f"foot.back.{side}", hip, foot), k=.04, plate=UNDER))
        w.add(RoundCone(knee, foot + v3((0, 0, .2)), .66, .52, zone=FLESH, bone=f"foot.back.{side}", k=.06, plate=JADE + 6))
        warden_foot(w, foot + v3((-.40, 0, -.06)), f"foot.back.{side}", 1.70, .76, .49)
    # --- neck: narrow and dark from the chest to the jaw hinge, a crease back to the leading shoulders ---------------
    w.add(RoundCone((1.70, 0, 5.55), (3.05, 0, 5.80), .82, .66, zone=FLESH,
                    bone=("blend", "chest", "head", (1.7, 0, 5.5), (3.1, 0, 5.8)), k=.10, plate=UNDER))
    # --- head built around the jaw ---------------------------------------------------------------------------------
    # Overbite and underslung chin overlap the throat at rest. Both ends of the
    # jaw remain visible from above because the chin projects past the prow.
    lobe((3.80, 0, 6.38), (1.14, 1.00, .44), "head", -.10, plate=UNDER)
    w.add(AnglePlate((3.67, 0, 6.74), frame((-1, 0, .12)), 1.06, .88, .26,
                     keel=.18, rake=.64, taper=.60, zone=CREST, bone="head", plate=450, hard=1.0))
    lobe((4.55, 0, 5.37), (1.50, 1.09, .36), "jaw", -.10, plate=UNDER)
    lobe((5.70, 0, 5.44), (.40, 1.01, .20), "jaw", .05, plate=450)
    lobe((4.96,0,5.65),(.89,.82,.16),"jaw",-.08,zone=ORGAN,plate=453,name="inner-lip")
    for side in (-1, 1):
        lobe((3.15, 1.04 * side, 5.99), (.52, .31, .49), "head", plate=450)
    lobe((4.90, 0, 6.14), (.58, 1.00, .36), "head", -.13, k=.0,
         zone=ORGAN, plate=0, name="warden-ram")
    return w
