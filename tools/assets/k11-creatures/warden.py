"""The Warden is a low, broad ram on the shared tyrant skeleton."""

from sdf import AnglePlate, Carapace, Box, Prism, Ellipsoid, RoundCone, frame, v3, ARMOR, FLESH, CREST, ORGAN, MEMBRANE, SHELL

CROWN_PLATES = (450, 451)
DORSAL_PLATES = (420, 421, 422, 423)


def build(sk, a):
    from sdf import Sculpture
    w = Sculpture("brute-warden")

    def lobe(center, radii, bone, tilt=0, blend=.06, **extras):
        w.add(Ellipsoid(center, radii, frame((1, 0, tilt)), bone=bone, k=blend, **extras))

    def shingle(center, length, width, pitch, bone, number, zone):
        if zone == ARMOR:
            w.add(Carapace(center, (1.45*length, 1.18*width, .24), frame((-1, 0, -pitch)), bone=bone, zone=zone, plate=number, hard=1))
            return
        w.add(AnglePlate(center, frame((-1, 0, -pitch)), length, width, .31,
                         keel=.26, rake=.66, taper=.58, bone=bone, zone=zone,
                         plate=number, hard=1.0))

    # Broad sternum and sloping ridge narrow twice, at the neck and the loin.
    lobe((.10, 0, 5.55), (1.86, 1.38, 1.52), "chest", zone=FLESH)
    w.add(Prism((-1.78, 0, 6.87), (.87, 0, 7.58), .83, 1.05,
                sides=5, roll=0, squash=.77, zone=SHELL, bone="chest", k=.18))
    lobe((-1.70, 0, 5.48), (1.45, .94, 1.28), "chest", .25, zone=FLESH)
    lobe((-2.67, 0, 4.72), (1.32, 1.13, 1.0), "tail", .22, zone=FLESH)
    for i, (x, z, length, width, pitch, bone) in enumerate((
        (.20, 8.32, .68, 1.02, .08, "chest"), (-.92, 8.10, .65, 1.03, .35, "chest"),
        (-1.93, 7.12, .69, .97, .56, "chest"), (-2.91, 5.68, .7, .9, .40, "tail"),
    )):
        shingle((x, 0, z), length, width, pitch, bone, DORSAL_PLATES[i], ARMOR)

    for sign, side in ((-1, "r"), (1, "l")):
        # The chest carries the planted braces through the charge. The shoulder
        # lobes overlap their roots, leaving the forearms outside the sternum.
        shoulder = v3((.43, 2.23*sign, 6.60))
        elbow = v3((.68, 2.96*sign, 4.75))
        wrist = v3((2.25, 3.04*sign, 2.65))
        w.add(Box(shoulder, (1.12, .75, .71), frame((1, .13*sign, -.24)),
                  round=.40, zone=SHELL, bone="chest", k=.12))
        cap = frame((-.96, -.12*sign, .24), (0, .30*sign, 1))
        w.add(Carapace(shoulder + v3((.02, .18*sign, 1.02)), (1.49, 1.27, .38), cap,
                         zone=ARMOR, plate=424, hard=1, bone="chest"))
        w.add(RoundCone(shoulder, elbow, .91, .78, bone="chest", zone=FLESH, k=.12))
        w.add(Prism(elbow, wrist, 1.01, .76, sides=6, up=(0, sign, 0),
                    roll=0, squash=.80, zone=FLESH, bone="chest", k=.16))
        w.add(AnglePlate(elbow + v3((0, .70*sign, .03)), frame((-.62, 0, .78), (0, sign, 0)),
                         .85, .83, .32, keel=.23, rake=.26, taper=.69,
                         zone=ARMOR, plate=424, bone="chest", hard=1))
        knuckle = wrist + v3((.28, 0, -.12))
        w.add(Box(knuckle, (.88, .68, .48), frame((1, 0, -.20)),
                  round=.27, bone="chest", zone=FLESH, k=.12))
        shingle(knuckle + v3((.12, .03*sign, .62)), .84, .93, -.19, "chest", 424, ARMOR)
        hip, knee, foot = (-2.4, sign, 4.42), (-2.73, 1.66*sign, 2.89), (-2.93, 1.92*sign, .52)
        w.add(RoundCone(hip, knee, .84, .69, bone=f"leg.back.{side}", zone=FLESH))
        w.add(RoundCone(knee, foot, .71, .52, bone=f"foot.back.{side}", zone=FLESH))
        lobe(foot, (.84, .58, .45), f"foot.back.{side}", zone=ARMOR, plate=424)

    w.add(Carapace((1.69, 0, 6.85), (.35, .87, .53), frame((1,0,-.12)), zone=ARMOR, plate=424, bone="chest", hard=1))
    lobe((1.79, 0, 6.45), (1.27, .61, .71), "chest", -.10, zone=MEMBRANE)
    lobe((3.08, 0, 6.33), (1.11, 1.03, .57), "head", -.12, zone=SHELL)
    shingle((3.12, 0, 7.02), 1.18, 1.24, -.12, "head", 450, CREST)
    shingle((2.00, 0, 7.10), .67, .50, -.08, "head", 451, CREST)
    # Open jaws project beyond the neck. The mouth runs around the leading lip
    # and remains exposed at both corners when the prow is seen edge-on.
    w.add(Carapace((4.49, 0, 5.73), (1.39, 1.19, .39), frame((1, 0, -.22)),
                   zone=ARMOR, plate=424, bone="head", hard=1))
    for sign in (-1, 1):
        w.add(Carapace((4.58, 1.23*sign, 6.20), (1.26, .40, .54),
                       frame((1,-.21*sign,-.23)), zone=ARMOR, plate=424, bone="head", hard=1))
    lobe((4.46, 0, 6.36), (1.19, 1.21, .68), "head", -.32,
         zone=ORGAN, name="warden-ram")
    return w
