"""Brute — heavy siege caste on the `tyrant` skeleton; Brute Warden is its boss rank.

BRUTE32: a knuckle-walking bull ape read from above: two shoulder masses, a hump, a waist, small hips on two
short hind legs, two equal forelimbs ending in club fists, and one pale arrowhead skull plate low and forward on
the head. The Warden is its own sculpture (warden.py).
"""

from heavy_support import planted_hand, sole
import math

import numpy as np

import sdf as S
from sdf import AnglePlate, bezier, EYE, BONE, ARMOR, FLESH, SHELL, MEMBRANE, CLAW, ORGAN, CREST, TOOTH, CAVITY, SINEW, Ellipsoid, RoundCone, Plate, frame, v3, normalize
import warden as WARDEN

ASSET = "tyrant"
FAMILY = "brute"
ASPECT = 1.8
VOXEL = 0.024
TRIS = {"body": 11500, "regalia": 1350, "boss": 19900}   # WARDEN25: the Warden is one whole sculpture (warden.py)
RANK_SCALE = {"boss": 2.79, "elite": 1.12}   # CREATURE26: drawn reach ~2.3 m from centre (was 3.8 -> 2.99 m); height kept by WARDEN_STATURE in models.ts
RANK_PARTS = {"elite": ["body", "regalia"], "boss": ["boss"]}   # WARDEN25: its own animal, not the Brute body plus a crown   # the Warden keeps its crown without the elite horn   # Brute Warden: uniform boss-tier scale applied by the loader
ATLAS = 2048
GLOW_STRENGTH = 2.0
# CREATURE26: three value shapes in hues away from the blue-grey deck and from Pyro's orange: dark olive-slate
# carapace, mid olive flesh, pale bone (the head plane and the striking edge); the amber lantern stays the family mark.
BANDS = {
    "chitin": (0.040, 0.050, 0.042), "flesh": (0.34, 0.32, 0.21), "bone": (0.74, 0.73, 0.68),
    "accent": (1.0, 0.45, 0.05), "eye": (1.0, 0.6, 0.15),
}
BANDS["lead"] = BANDS["bone"]
BANDS["plate"] = BANDS["chitin"]
BANDS["gilt"] = (0.88, 0.58, 0.17)
BAND_CELL = 0.3   # CREATURE26: merge value islands under ~3 cells (a sixth of the body width) into their surroundings
FORM_NORMALS = "proxy"   # CREATURE26: shading normals from a Taubin-smoothed proxy (build.form_normals)
FORM_MIX = 1.0   # CREATURE20: dark umber angular chest/arm armour over the ochre body   # CREATURE19: the head plate is the lightest body plane (which end is the head)
BAND_MAP = {"shell": "flesh", "crest": "flesh", "membrane": "chitin", "sinew": "chitin"}
# dorsal shingle row (hump 90/93, hind 20/23/26/29) joins the dark armour: a hard spine over ochre flanks
# CREATURE26: yoke and back shingles join the dark saddle; head plane and weapon-arm edge are bone; jaw and the off-arm guard dark
PLATE_BAND = {**{i: "plate" for i in (*WARDEN.DORSAL_PLATES, 424)}, **{i: "lead" for i in WARDEN.CROWN_PLATES},
              300: "chitin", 20: "chitin", 21: "chitin", 310: "bone", 311: "chitin", 50: "lead", 55: "chitin",
              **{i: "flesh" for i in range(90, 100)},
              51: "lead", 60: "plate", 61: "plate", 62: "plate", 63: "plate", 64: "plate", 65: "plate",
              66: "plate", **{i: "flesh" for i in range(70, 80)}}   # BRUTE32: elite horns face-pale; dorsal plates, eye slits dark
PLATE_BAND.update({70: "flesh", 71: "flesh", 72: "flesh", **{i: "chitin" for i in range(73, 80)}})
BAND_KEEP = ("accent", "eye", "plate")   # BRUTE32: the eye slits are small; keep them from the island merge   # leg armour plates stay in the limb's flesh shape
PALETTE = {
    "shell": (0.13, 0.035, 0.022), "edge": (0.55, 0.36, 0.20), "membrane": (0.11, 0.022, 0.026),
    "sinew": (0.26, 0.06, 0.05), "claw": (0.022, 0.014, 0.012), "tooth": (0.72, 0.60, 0.42),
    "organ": (1.0, 0.45, 0.05), "eye": (1.0, 0.6, 0.15), "crest": (0.44, 0.35, 0.26), "armor": (0.24, 0.12, 0.075), "flesh": (0.32, 0.05, 0.05),
    "cavity": (0.03, 0.005, 0.006), "under": (0.08, 0.03, 0.022),
}
GLOW = {"gilt": (0.009, 0.006, 0.002), "organ": (1.0, 0.36, 0.0), "eye": (1.0, 0.55, 0.08)}


def surface_zones(sculpture, centers):
    """Low nibble is paint, remaining bits identify the anatomical primitive for ink."""
    _, owner = sculpture.evaluate_points(centers, track=True)
    result = np.zeros(len(centers), dtype=np.int32)
    for i, prim in enumerate(sculpture.prims):
        mask = owner == i
        if not np.any(mask):
            continue
        points = centers[mask]
        paint = 0  # underbody
        if prim.name == "warden-ram":
            paint = 9
        elif prim.plate in (50, 51, 450, 451):
            paint = 7
        elif prim.plate in (52, 452):
            paint = 8
        elif isinstance(prim, S.ShellBand) and prim.plate != UNDER:
            local = (points - prim.c) @ prim.R
            paint = np.where(local[:, 2] < -.42 * prim.drop, 3,
                             np.where(abs(local[:, 0]) > prim.half - prim.bev * 1.6, 2, 1))
        elif prim.zone == FLESH and prim.plate != UNDER:
            # Cross-section in a fixed dorsal/lateral direction. Along a
            # sloping shin the dividing plane follows the shaft to the ankle.
            side = np.sign(points[:, 1].mean())
            dorsal = v3((.22, -.50 * side, 1))
            if isinstance(prim, (RoundCone, S.Prism)):
                length = prim.b - prim.a
                t = np.clip((points - prim.a) @ length / (length @ length), 0, 1)
                offset = points - prim.a - t[:, None] * length
                radius = prim.ra if isinstance(prim, RoundCone) else prim.r0
            else:
                lo, hi = prim.bounds()
                offset = points - (lo + hi) * .5
                radius = (hi[2] - lo[2]) * .5
            height = offset @ dorsal / max(radius, .01)
            paint = np.where(height > .40, 4, np.where(height > -.45, 5, 0))
        region = i + 1 if prim.plate != UNDER else 0
        result[mask] = region * 16 + paint
    return result


def paint_marks(name, co, normals, plate, bands):
    if name == "brute-body":
        bands[np.isin(plate, (50, 51))] = "lead"
    if name == "brute-regalia":
        bands[plate == 64] = "plate"
        bands[(bands == "bone") & (plate != 51)] = "gilt"


def hard_leg(hip, knee, foot, r_hip, r_knee, r_foot, upper, lower, forward=1.0, claw_len=0.85, zone=SHELL, hard=1.0):
    """CREATURE29: a leg built from hard planes instead of round tubes: a faceted thigh, a dark knee notch, a faceted
    shin and a flat splayed foot with three large claws. Joint positions are the skeleton's; only the volumes change."""
    hip, knee, foot = v3(hip), v3(knee), v3(foot)
    side = 1.0 if float((knee - hip)[1]) >= 0 else -1.0
    ankle = foot + (knee - foot) * 0.16
    out = [S.Prism(hip, knee, r_hip, r_knee, sides=4, zone=zone, bone=upper, k=0.08, plate=90, hard=hard),
           Ellipsoid(knee, (r_knee * 0.92,) * 3, zone=FLESH, bone=("blend", upper, lower, hip, foot), k=0.05),
           S.Prism(knee, ankle, r_knee * 0.95, r_foot, sides=4, zone=zone, bone=lower, k=0.06, plate=91, hard=hard)]
    d = normalize(v3((forward, side * 0.9, 0)))
    sidev = normalize(np.cross(v3((0, 0, 1)), d))
    pad = foot + v3((0, 0, r_foot * 0.45))
    out.append(S.Prism(ankle, pad + d * r_foot * 0.6, r_foot * 1.05, r_foot * 0.95, sides=4, zone=zone, bone=lower, k=0.06,
                       plate=92, hard=hard))
    for i in (-1, 0, 1):
        t = normalize(d + sidev * 0.55 * i)
        base = pad + t * r_foot * 0.7
        out.append(S.Prism(base, base + t * claw_len * (1.0 - 0.18 * abs(i)) - v3((0, 0, r_foot * 0.4)), r_foot * 0.55,
                           0.03, sides=3, up=(0, 0, 1), roll=math.pi / 2, squash=0.7, zone=CLAW, bone=lower, k=0.04, hard=hard))
    return out


def skull_plate(c, heading, length, width, tilt, bone, plate, zone=CREST):
    """BRUTE32: the pale arrowhead skull plate, point along the heading, near horizontal (tilted `tilt` degrees
    nose-down) so the camera above sees it at every heading. Returns the plate, its tip and its rear corners."""
    t = math.radians(tilt)
    fwd = normalize(v3((heading[0] * math.cos(t), heading[1] * math.cos(t), -math.sin(t))))
    up = normalize(v3((heading[0] * math.sin(t), heading[1] * math.sin(t), math.cos(t))))
    rake = 0.6
    L = length / (2 + rake)
    c = v3(c)
    p = AnglePlate(c, frame(-fwd, up), L, width / 2, 0.24, keel=0.12, rake=rake, taper=0.72, lift=0.0,
                   zone=zone, bone=bone, plate=plate, hard=1.0)
    side = normalize(np.cross(up, fwd))
    rear = [c - fwd * L + side * s * width / 2 * 0.72 for s in (-1, 1)]
    return p, c + fwd * L * (1 + rake), rear, fwd, up, side


UNDER = 66            # HEAVY39: near-black underbody, joints, knuckles (atlas "plate" cell)
JADE = range(70, 80)  # HEAVY39: dorsal bands, shoulder caps, limb segments (atlas "flesh" cell, bruteBody jade)


def band(c, angle, half, radii, drop, bone, plate, side=None, thick=.26, bevel=.09, lip=0.0, roll=0.0, zone=ARMOR):
    """HEAVY39: a grown shell band. ``angle`` (degrees) raises the band's head end; ``roll`` tips it outward."""
    t = math.radians(angle)
    fwd = v3((math.cos(t), 0, math.sin(t)))
    up = v3((-math.sin(t), roll, math.cos(t)))
    return S.ShellBand(c, frame(fwd, up), radii, half, drop, thick=thick, bevel=bevel, lip=lip,
                       zone=zone, bone=bone, plate=plate, hard=1.0)


# Three dorsal crowns, each with its own dark bearing surface beneath the jade lip.
BACK = ((.64, 8.48, -14, 1.68, 1.18, .92, "chest"),
        (-.53, 8.76, 9, 1.87, 1.23, 1.08, "chest"),
        (-1.89, 7.93, 39, 1.88, 1.10, 1.06, "tail"))
TIP = 24


def back(body, bands=BACK, ridge=0.16, ridge_lift=0.10, plate0=70):
    crowns = []
    for i, (x, z, ang, ry, rz, drop, bone) in enumerate(bands):
        body.add(band((x + .09, 0, z - .19), ang + TIP, .69, (3.4, ry + .04, rz),
                      drop, bone, UNDER, thick=.39, bevel=.08))
        body.add(band((x, 0, z), ang + TIP, .53, (3.4, ry, rz), drop,
                      bone, plate0 + i, thick=.28, bevel=.13, lip=.15))
        crowns.append(v3((x, 0, z + ridge_lift)))
    # one raised spine ridge running through every band
    body.add(S.Tube(crowns, [ridge * 0.8] + [ridge] * (len(crowns) - 2) + [ridge * 0.7], zone=ARMOR, bone="chest",
                    plate=plate0 + 9, hard=0.0))
    return crowns


def arm(body, s, side, guard=True):
    """Shoulder cap, upper arm, elbow, forearm (one guard), wrist, fist with two weight-bearing knuckles. The
    shoulder, elbow and fist centres are the ones POSE38's club_hook frames (enemy_actions.py); all rigid on the
    shoulder bone, as the clips expect."""
    bone = f"shoulder.{side}"
    sh = v3((0.3, 1.7 * s, 6.9))
    el = v3((-.21, 3.28 * s, 6.02))
    fist = v3((2.15, 3.00 * s, 4.57))
    wrist = el + (fist - el) * 0.62
    body.add(Ellipsoid(sh + v3((0, .15 * s, .05)), (.95, .88, .85), zone=FLESH, bone=bone, k=.10, plate=UNDER))   # deltoid
    body.add(S.ShellBand(sh + v3((.05, .30 * s, .98)), frame((1, .10 * s, -.10), (0, .55 * s, 1)), (1.35, 1.12, .95),
                         .88, .70, thick=.30, bevel=.09, lip=.05, zone=ARMOR, bone=bone, plate=73, hard=1.0))   # cap
    body.add(RoundCone(sh + v3((0, .35 * s, -.35)), el, .74, .60, zone=FLESH, bone=bone, k=.06, plate=UNDER))
    body.add(Ellipsoid(el, (.62, .60, .60), zone=FLESH, bone=bone, k=.04, plate=UNDER))   # elbow
    body.add(RoundCone(el, wrist, .70, .86, zone=FLESH, bone=bone, k=.05, plate=74))
    if guard:   # one forearm guard on the outer top of the forearm
        d = normalize(wrist - el)
        mid = (el + wrist) * 0.5
        up = normalize(v3((0, .55 * s, 1)) - d * float(d @ v3((0, .55 * s, 1))))
        body.add(S.ShellBand(mid + up * .80, frame(d, up), (1.7, .80, .70), .70, .55, thick=.20, bevel=.08,
                             zone=ARMOR, bone=bone, plate=75, hard=1.0))
    body.add(Ellipsoid(wrist, (.58, .62, .41), zone=FLESH, bone=bone, k=.04, plate=UNDER))   # wrist
    planted_hand(body, fist, bone)
    return sh, el, wrist, fist


def leg(body, s, side, hip=(-1.85, .95, 5.4), knee=(-1.30, 1.70, 3.05), foot=(-1.75, 1.95, .40), r=(.88, .68, .52)):
    hip, knee, foot = v3((hip[0], hip[1] * s, hip[2])), v3((knee[0], knee[1] * s, knee[2])), v3((foot[0], foot[1] * s, foot[2]))
    body.add(RoundCone(hip, knee, r[0], r[1], zone=FLESH, bone=f"leg.back.{side}", k=.15, plate=UNDER))
    body.add(Ellipsoid(knee, (r[1] * 1.05,) * 3, zone=FLESH, bone=("blend", f"leg.back.{side}", f"foot.back.{side}", hip, foot), k=.04, plate=UNDER))
    body.add(RoundCone(knee, foot + v3((0, 0, .2)), r[1] * .9, r[2], zone=FLESH, bone=f"foot.back.{side}", k=.06, plate=77))
    sole(body, foot + v3((.52, 0, -.08)), f"foot.back.{side}", (.94, .64, .24))


def build(sk):
    """HEAVY39: the Brute as an armoured animal. A dark, smooth underbody (chest, hump core, waist, hips, neck)
    carries three curved, overlapping dorsal bands and a spine ridge; curved shoulder caps overlap the first band;
    each forelimb is one traceable chain (cap, upper arm, dark elbow, forearm with one guard, dark wrist, fist with two
    dark knuckles); short hind legs with knee and foot. The head sits forward on a narrow dark neck under the
    accepted bone skull plate with its eye slits. Bones, joints and clips are unchanged."""
    body = S.Sculpture("brute-body")
    # --- underbody: near-black, smooth --------------------------------------------------------------------------
    body.add(Ellipsoid((0.15, 0, 6.35), (1.40, 1.42, 1.42), zone=FLESH, bone="chest", k=.35, plate=UNDER))   # chest
    body.add(Ellipsoid((-0.35, 0, 7.55), (1.25, 1.42, 1.05), frame((1, 0, .1)), zone=FLESH, bone="chest", k=.35, plate=UNDER))
    body.add(Ellipsoid((-1.25, 0, 6.85), (1.15, 1.22, 1.12), frame((1, 0, .4)), zone=FLESH,
                       bone=("blend", "chest", "tail", (-0.2, 0, 7.0), (-1.9, 0, 6.0)), k=.3, plate=UNDER))
    body.add(Ellipsoid((-2.05, 0, 5.85), (1.10, 1.08, 1.08), frame((1, 0, .3)), zone=FLESH, bone="tail", k=.3, plate=UNDER))
    back(body)
    # --- neck and head: neck narrower than head and shoulders, dark; head forward under the bone plate -------------
    body.add(RoundCone((1.05, 0, 7.15), (2.05, 0, 7.45), .66, .52, zone=FLESH,
                       bone=("blend", "chest", "head", (1.0, 0, 7.1), (2.1, 0, 7.45)), k=.10, plate=UNDER))
    body.add(Ellipsoid((2.72, 0, 7.58), (1.02, .92, .74), frame((1, 0, -.15)), zone=FLESH, bone="head", k=.12, plate=78))   # skull
    body.add(Ellipsoid((2.98, 0, 7.02), (.86, .72, .40), frame((1, 0, -.25)), zone=FLESH, bone="head", k=.08, plate=UNDER))  # jaw
    plate, tip, rear, pf, pu, ps = skull_plate((2.98, 0, 8.36), (1, 0, 0), 2.72, 2.06, 15, "head", 50)
    body.add(plate)
    # A transverse brow casts a drawn seam over the two swept cheek planes.
    body.add(S.Prism((2.63, -.76, 8.61), (2.63, .76, 8.61), .27, .27,
                     sides=4, zone=CREST, bone="head", plate=50))
    for sign in (-1, 1):
        body.add(S.Prism((2.65, .82*sign, 8.35), (3.70, .43*sign, 7.96),
                         .36, .13, sides=4, zone=CREST, bone="head", plate=52))
    for s in (-1, 1):   # two dark eye slits angled in toward the point (the eye sockets)
        d = normalize(pf + ps * s * 0.45)
        cen = v3((3.07, 0.38 * s, 0))
        cen[2] = 8.36 + 0.09 * float(pf[2] / pf[0]) + 0.2
        body.add(Ellipsoid(cen, (0.38, 0.095, 0.105), frame(d, pu), zone=MEMBRANE, bone="head", k=0.0, plate=62, hard=1.0))
    for s, side in ((-1, "r"), (1, "l")):
        arm(body, s, side)
        leg(body, s, side)
    # --- elite: the same body; horns on the skull plate, a taller spine ridge and broader shoulder mantles ---------
    regalia = S.Sculpture("brute-regalia")
    for s, r0 in zip((-1, 1), rear):   # two pale horns swept back and out from the plate's rear corners
        pts = [r0 + pu * 0.05, r0 + v3((-0.32, 1.06 * s, -0.37)), r0 + v3((-1.28, 2.31 * s, -0.76)), r0 + v3((-2.70, 2.91 * s, -1.36))]
        regalia.add(Ellipsoid(r0, (.66, .68, .48), zone=ARMOR, bone="head", plate=74))
        regalia.add(S.Tube(pts, [0.44, 0.38, 0.24, 0.055], zone=BONE, bone="head", plate=51))
    for i, (x, z, ang, ry, rz, drop, bone) in enumerate(BACK[:3]):   # a tall keel along the spine ridge
        regalia.add(band((x, 0, z + .14), ang + TIP, .52, (2.2, .34, .55), .55, bone, 79, thick=.30, bevel=.10))
    for s, side in ((-1, "r"), (1, "l")):
        # Split tail fan broadens the rump in plan, below the existing withers.
        regalia.add(S.ShellBand((-2.36, 1.18 * s, 7.30),
                                frame((.84, -.54 * s, .28), (0, .30 * s, 1)),
                                (2.35, 1.15, .91), 1.14, .71, thick=.34, bevel=.14,
                                lip=.12, zone=ARMOR, bone="tail", plate=78, hard=1.0))
        sh = v3((0.3, 1.7 * s, 6.9))
        regalia.add(S.ShellBand(sh + v3((-.15, .55 * s, 1.08)), frame((1, .12 * s, -.12), (0, .75 * s, 1)), (1.55, 1.25, 1.0),
                                .95, .80, thick=.24, bevel=.09, zone=ARMOR, bone=f"shoulder.{side}", plate=73, hard=1.0))
    boss = WARDEN.build(sk, sk.aspect)
    return {"body": body, "regalia": regalia, "boss": boss}
