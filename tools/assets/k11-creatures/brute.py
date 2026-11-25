"""Brute — heavy siege caste on the `tyrant` skeleton; Brute Warden is its boss rank.

BRUTE32: a knuckle-walking bull ape read from above: two shoulder masses, a hump, a waist, small hips on two
short hind legs, two equal forelimbs ending in club fists, and one pale arrowhead skull plate low and forward on
the head. The Warden is its own sculpture (warden.py).
"""

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
              51: "lead", 60: "plate", 61: "plate", 62: "plate", 63: "plate", 64: "plate", 65: "plate"}   # BRUTE32: elite horns face-pale; dorsal plates, eye slits dark
BAND_KEEP = ("accent", "eye", "plate")   # BRUTE32: the eye slits are small; keep them from the island merge   # leg armour plates stay in the limb's flesh shape
PALETTE = {
    "shell": (0.13, 0.035, 0.022), "edge": (0.55, 0.36, 0.20), "membrane": (0.11, 0.022, 0.026),
    "sinew": (0.26, 0.06, 0.05), "claw": (0.022, 0.014, 0.012), "tooth": (0.72, 0.60, 0.42),
    "organ": (1.0, 0.45, 0.05), "eye": (1.0, 0.6, 0.15), "crest": (0.44, 0.35, 0.26), "armor": (0.24, 0.12, 0.075), "flesh": (0.32, 0.05, 0.05),
    "cavity": (0.03, 0.005, 0.006), "under": (0.08, 0.03, 0.022),
}
GLOW = {"gilt": (0.009, 0.006, 0.002), "organ": (1.0, 0.36, 0.0), "eye": (1.0, 0.55, 0.08)}


def paint_marks(name, co, normals, plate, bands):
    if name == "brute-body":
        bands[np.isin(plate, (50, 51))] = "lead"
    if name == "brute-regalia":
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


def build(sk):
    """The body is symmetric about its heading: two
    shoulder masses (the widest point) over a chest, a hump between them, a waist, smaller hips on two short hind
    legs, and two knuckle-walking forelimbs whose thick forearms end in club fists planted forward and out. One
    pale arrowhead skull plate rides low and forward on top of the head (the bruteFace zone); three dark plates run
    down the spine. Everything else is one jade zone with smooth normals, so the raking key draws one terminator
    per mass. The front leg and feeding-arm bones carry no geometry. Bones, joints and clips are unchanged."""
    a = sk.aspect
    body = S.Sculpture("brute-body")
    # --- trunk: chest, hump (idle top), waist, hips -------------------------------------------------------------
    body.add(Ellipsoid((0.35, 0, 6.1), (1.55, 1.46, 1.58), zone=FLESH, bone="chest", k=0.35))
    hump_top = 8.86   # Rest-space crown of the underlying hump.
    hump_r = (1.15, 1.05, 0.95)
    body.add(Ellipsoid((-0.25, 0, hump_top - hump_r[2]), hump_r, frame((1, 0, 0.25)), zone=FLESH, bone="chest", k=0.35))
    body.add(Ellipsoid((-1.06, 0, 6.12), (1.14, 0.96, 1.26), frame((1, 0, 0.2)), zone=FLESH,
                       bone=("blend", "chest", "tail", (0.0, 0, 6.2), (-1.6, 0, 4.9)), k=0.3))
    body.add(Ellipsoid((-1.80, 0, 5.35), (1.20, 1.10, 1.12), frame((1, 0, 0.15)), zone=FLESH, bone="tail", k=0.3))
    # Overlapping shingles follow the descending ridge from the crown to the pelvis.
    for pid, cx, cz, length, width, pitch, bone in (
        (60, -0.35, 8.79, 1.50, 1.66, -12, "chest"),
        (61, -1.42, 8.04, 1.61, 1.83, -34, "chest"),
        (63, -2.20, 6.73, 1.66, 1.60, -42, "tail"),
    ):
        body.add(skull_plate((cx, 0, cz), (1, 0, 0), length, width, pitch, bone, pid, zone=ARMOR)[0])
    # --- head: low and forward, under one pale arrowhead skull plate --------------------------------------------
    body.add(Ellipsoid((2.32, 0, 7.55), (1.15, 0.95, 0.8), frame((1, 0, -0.15)), zone=FLESH, bone="head", k=0.12))
    plate, tip, rear, pf, pu, ps = skull_plate((2.68, 0, 8.39), (1, 0, 0), 2.72, 2.06, 15, "head", 50)
    body.add(plate)
    for s in (-1, 1):   # two dark eye slits angled in toward the point
        d = normalize(pf + ps * s * 0.45)
        cen = v3((2.77, 0.38 * s, 0))
        cen[2] = 8.39 + (2.77 - 2.68) * float(pf[2] / pf[0]) + 0.2
        body.add(Ellipsoid(cen, (0.38, 0.095, 0.105), frame(d, pu), zone=MEMBRANE, bone="head", k=0.0, plate=62, hard=1.0))
    # --- forelimbs: equal, knuckle-walking; forearm thicker than upper arm, club fist planted forward and out ------
    for s, side in ((-1, "r"), (1, "l")):
        sh_c = v3((0.3, 1.7 * s, 6.9))
        body.add(S.Box(sh_c, (.87, .77, .63), frame((1, .15 * s, -.20)), round=.40,
                       zone=FLESH, bone=f"shoulder.{side}", k=.06))
        el = v3((0.38, 2.87 * s, 5.80))
        fist = v3((2.05, 3.28 * s, 4.57))
        body.add(RoundCone(sh_c + v3((0.1, 0.3 * s, -0.4)), el, 1.00, 0.90, zone=FLESH,
                           bone=f"shoulder.{side}", k=0.035))
        body.add(S.Prism(el, fist, 1.02, .88, sides=6, up=(0, s, 0), roll=0, squash=.90,
                         zone=FLESH, bone=f"shoulder.{side}", k=.14))
        body.add(Ellipsoid(fist + v3((0.2, 0.05 * s, 0)), (1.16, 1.28, 0.98), frame((1, 0.2 * s, 0.25)), zone=FLESH,
                           bone=f"shoulder.{side}", k=0.035))
        body.add(skull_plate(fist + v3((0.46, 0.12 * s, 1.01)), (1, 0, 0), 2.15, 2.0, 16,
                             f"shoulder.{side}", 64, zone=ARMOR)[0])
        # A dark socket peeks through at the inner edge of each shoulder.
        body.add(Ellipsoid(sh_c + v3((-0.04, -0.52 * s, -0.15)), (1.23, 0.92, 1.11),
                           zone=ARMOR, bone=f"shoulder.{side}", plate=65))
    # --- hind legs: short, thick, smooth --------------------------------------------------------------------------
    for s, side in ((-1, "r"), (1, "l")):
        hip, knee, foot = v3((-1.55, 0.85 * s, 4.45)), v3((-1.35, 1.6 * s, 2.85)), v3((-1.75, 1.95 * s, 0.38))
        body.add(RoundCone(hip, knee, 0.79, 0.63, zone=FLESH, bone=f"leg.back.{side}", k=0.2))
        body.add(RoundCone(knee, foot, 0.63, 0.47, zone=FLESH, bone=f"foot.back.{side}", k=0.1))
        body.add(Ellipsoid(foot + v3((0.25, 0, -0.08)), (0.62, 0.45, 0.32), zone=FLESH, bone=f"foot.back.{side}", k=0.1))
    # --- elite: the same body; its rank is read on the skull plate --------------------------------------------------
    regalia = S.Sculpture("brute-regalia")
    for s, r0 in zip((-1, 1), rear):   # two pale horns swept back and out from the plate's rear corners
        pts = [r0 + pu * 0.05, r0 + v3((-0.32, 1.06 * s, -0.37)), r0 + v3((-1.28, 2.31 * s, -0.76)), r0 + v3((-2.70, 2.91 * s, -1.36))]
        regalia.add(S.Tube(pts, [0.44, 0.38, 0.24, 0.055], zone=BONE, bone="head", plate=51))
    boss = WARDEN.build(sk, a)
    return {"body": body, "regalia": regalia, "boss": boss}
