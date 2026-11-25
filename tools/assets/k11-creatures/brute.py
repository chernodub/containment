"""Brute — heavy siege caste on the `tyrant` skeleton; Brute Warden is its boss rank.

A shingled bulwark chest split along the crown by an amber lantern, a low
bone-pale prow head between two crusher arms ending in hooked cleavers (the
right one heavier), a long armoured hind body on four pillar legs.
"""

import math

import numpy as np

import sdf as S
from sdf import AnglePlate, bezier, EYE, BONE, ARMOR, FLESH, SHELL, MEMBRANE, CLAW, ORGAN, CREST, TOOTH, CAVITY, SINEW, Ellipsoid, RoundCone, Plate, frame, v3, normalize
import species as A
import warden as WARDEN

ASSET = "tyrant"
FAMILY = "brute"
ASPECT = 1.8
VOXEL = 0.024
TRIS = {"body": 11500, "elite": 1600, "regalia": 1350, "boss": 19900}   # WARDEN25: the Warden is one whole sculpture (warden.py)
RANK_SCALE = {"boss": 2.79, "elite": 1.12}   # CREATURE26: drawn reach ~2.3 m from centre (was 3.8 -> 2.99 m); height kept by WARDEN_STATURE in models.ts
RANK_PARTS = {"elite": ["body", "elite", "regalia"], "boss": ["boss"]}   # WARDEN25: its own animal, not the Brute body plus a crown   # the Warden keeps its crown without the elite horn   # Brute Warden: uniform boss-tier scale applied by the loader
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
PLATE_BAND = {**{i: "chitin" for i in (*WARDEN.RAM_PLATES, *WARDEN.RAM_DARK)}, **{i: "lead" for i in WARDEN.CROWN_PLATES},
              300: "chitin", 20: "chitin", 21: "chitin", 310: "bone", 311: "chitin", 50: "lead", 55: "chitin",
              **{i: "flesh" for i in range(90, 100)}}   # leg armour plates stay in the limb's flesh shape
PALETTE = {
    "shell": (0.13, 0.035, 0.022), "edge": (0.55, 0.36, 0.20), "membrane": (0.11, 0.022, 0.026),
    "sinew": (0.26, 0.06, 0.05), "claw": (0.022, 0.014, 0.012), "tooth": (0.72, 0.60, 0.42),
    "organ": (1.0, 0.45, 0.05), "eye": (1.0, 0.6, 0.15), "crest": (0.44, 0.35, 0.26), "armor": (0.24, 0.12, 0.075), "flesh": (0.32, 0.05, 0.05),
    "cavity": (0.03, 0.005, 0.006), "under": (0.08, 0.03, 0.022),
}
GLOW = {"gilt": (0.009, 0.006, 0.002), "organ": (1.0, 0.36, 0.0), "eye": (1.0, 0.55, 0.08)}


def paint_marks(name, co, normals, plate, bands):
    if name == "brute-regalia":
        bands[bands == "bone"] = "gilt"


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


def build(sk):
    """CREATURE26: built for the top-down camera. Three value shapes: one dark olive-slate carapace saddle (shoulder
    yoke, hump and back), mid olive flesh (chest, belly, limbs) and pale bone (the head's broad top plane and the
    weapon arm's striking edge into its cleaver). The head wedge sits ahead of the shoulders; both forelimbs are
    carried out from the torso so floor shows between limb and belly. Bones, joints and heights are unchanged."""
    a = sk.aspect
    z = lambda x, y, zz: v3((x, y, zz * a))
    body = S.Sculpture("brute-body")
    up_ = v3((0, 0, 1))
    # --- chest and belly (mid flesh), narrower than CREATURE20 so the arms leave the torso ---------------------
    chest_c, chest_r, chest_R = z(0.15, 0, 3.45), v3((1.08, 1.02, 1.0 * a)), frame((1, 0, 0.25))
    body.add(A.mass(chest_c, chest_r, chest_R, bone="chest", zone=FLESH, lump=0.0, freq=1.5, seed=2))
    front = normalize(chest_R[:, 0])
    st = chest_c + front * chest_r[0] * 0.92 + v3((0, 0, -0.25 * a))
    body.add(AnglePlate(st, frame(normalize(up_ - front * float(up_ @ front)), front), 1.3, 0.45, 0.28, keel=0.36, rake=0.6,
                        taper=0.45, zone=SHELL, bone="chest", plate=10))
    body.add(A.mass(z(0.1, 0, 2.55), (1.05, 0.8, 0.6 * a), frame((1, 0, 0.1)), bone=("blend", "chest", "tail", z(0.6, 0, 3), z(-0.8, 0, 2.3)),
                    zone=FLESH, k=0.45, lump=0.0, freq=1.2, seed=9))
    # --- the dark carapace saddle: hump, one broad shoulder yoke, back ----------------------------------------
    hump_c = chest_c + z(-0.35, 0, 0.85)   # its crown is the idle top the runtime normalises height by: keep it
    body.add(A.mass(hump_c, (0.95, 0.8, 0.62 * a), frame((1, 0, 0.35)), bone="chest", zone=MEMBRANE, k=0.45, lump=0.0, freq=1.4, seed=17))
    yoke_up = normalize(v3((0.25, 0, 1)))
    # the yoke keeps its CREATURE26 anchor: its keel is the idle top that the runtime normalises the height by
    body.add(AnglePlate(chest_c + z(-0.25, 0, 1.07), frame(normalize(v3((1, 0, -0.25))), yoke_up), 0.95, 1.65, 0.3, keel=0.2,
                        rake=0.5, taper=0.8, lift=0.12, zone=ARMOR, bone="chest", plate=300))
    la, _ = A.ellipsoid_surface(chest_c, chest_r, chest_R, 0.55, 0.0)
    lb, _ = A.ellipsoid_surface(chest_c, chest_r, chest_R, -0.62, 0.0)
    body.extend(A.lantern(la + v3((0, 0, 0.42)), lb + v3((0, 0, 0.3)), 0.34, "chest", height=1.5, ribs=0.17))
    hind_c, hind_r, hind_R = z(-1.15, 0, 2.05), v3((1.85, 0.95, 0.62 * a)), frame((1, 0, 0.18))
    body.add(A.mass(hind_c, hind_r, hind_R, bone="tail", zone=MEMBRANE, k=0.35, lump=0.0, freq=1.5, seed=3))
    body.add(Ellipsoid(z(-0.35, 0, 2.85), (0.8, 0.8, 0.45 * a), zone=MEMBRANE,
                       bone=("blend", "tail", "chest", z(-0.9, 0, 2.5), z(0.3, 0, 3.4)), k=0.3))
    body.extend(A.shingles(hind_c, hind_r, hind_R, "tail", rows=2, phis=(0.0,), u0=0.45, u1=-0.6,
                           size=(1.0, 0.95, 0.34), thickness=0.24, lift=0.4, rings=0.006, grow=-0.2, seed=60, plate0=20, angular=True))
    body.extend(A.dorsal_blades(hind_c, hind_r, hind_R, "tail", (0.3,), 1.2, 0.75, 0.17, lift=0.5, plate=171))
    # --- head (CREATURE29): one wedge whose single pale brow-to-jaw plane slopes down toward the target --------
    # The plane faces up-forward, so the game camera sees it from in front, from the side and in the crouch. It sits on
    # a narrower dark skull: the plate's overhang is the dark recess that gives it an edge. Behind the brow a mid-flesh
    # hood wraps the back of the skull, then a dark recessed neck separates it from the shoulder yoke.
    head_c = z(2.6, 0, 3.42)   # kept: the elite crown and regalia are placed from it
    brow, snout = v3((1.35, 0, 7.5)), v3((3.8, 0, 6.55))
    hd = normalize(snout - brow)
    hn = normalize(v3((-hd[2], 0, hd[0])))
    HL = float(np.linalg.norm(snout - brow)) / 2.75
    body.add(Ellipsoid(z(0.95, 0, 3.72), (0.6, 0.5, 0.26 * a), frame((1, 0, -0.3)), zone=MEMBRANE,
                       bone=("blend", "chest", "head", z(0.5, 0, 3.9), z(1.6, 0, 3.8)), k=0.12))   # recessed dark neck
    body.add(Ellipsoid(brow - hd * 0.05 - hn * 0.22, (0.62, 0.92, 0.42), frame(-hd, hn), zone=FLESH, bone="head", k=0.1,
                       hard=0.6))   # hood behind the brow
    body.add(Ellipsoid((brow + snout) / 2 - hd * 0.35 - hn * 0.58, (1.05, 0.72, 0.5), frame(hd, hn), zone=MEMBRANE, bone="head", k=0.12))
    body.add(AnglePlate(brow + hd * HL - hn * 0.04, frame(-hd, hn), HL, 1.02, 0.22, keel=0.0, rake=0.75, taper=0.95, lift=0.0,
                        zone=CREST, bone="head", plate=50, hard=1.0))
    body.add(Ellipsoid(brow - hd * 0.06 + hn * 0.06, (0.16, 1.0, 0.2), frame(hd, hn), zone=MEMBRANE, bone="head", k=0.04))   # dark brow crease
    body.add(AnglePlate(snout - hd * 1.0 - hn * 0.62, frame((-1, 0, 0.5), (0, 0, -1)), 0.7, 0.55, 0.22, keel=0.18, rake=0.5,
                        taper=0.6, zone=ARMOR, bone="jaw", plate=55))
    body.extend(A.eyes(brow + hd * 1.05 - hn * 0.3, hd, 0.5, 2, 0.08, "head", spread=0.8))
    # --- forelimbs: carried out from the torso; the right one is the weapon arm with one pale striking edge ------
    for s, side in ((-1, "r"), (1, "l")):
        heavy = 1.25 if s < 0 else 0.9
        out = v3((0.1, 0.72 * s, 0.0))
        elbow_out = v3((0.1, (1.35 if s < 0 else 0.72) * s, 0.0))   # CREATURE29: the weapon elbow stands further off the belly
        sh, el, wr = sk.h(f"shoulder.{side}"), sk.h(f"forearm.{side}") + elbow_out, sk.h(f"claw.{side}") + out * 0.85
        end = sk.end(f"claw.{side}") + out * 0.85
        # shoulder ball under the yoke edge: the darkest attachment
        body.add(Ellipsoid(sh + v3((0, 0.25 * s, 0)), (0.5 * heavy,) * 3, zone=MEMBRANE, bone=f"shoulder.{side}", k=0.12))
        # CREATURE29: hard-faceted segments (a ridge on top: one lit plane, one dark) and a dark notch at the elbow
        body.add(S.Prism(sh + v3((0, 0.25 * s, 0)), el, 0.52 * heavy, 0.4 * heavy, sides=4, zone=SHELL,
                         bone=f"shoulder.{side}", k=0.08, plate=330, hard=1.0))
        body.add(Ellipsoid(el, (0.42 * heavy,) * 3, zone=FLESH, bone=("blend", f"shoulder.{side}", f"forearm.{side}", sh, wr), k=0.05))
        body.add(S.Prism(el, wr, 0.4 * heavy, 0.5 * heavy, sides=4, zone=SHELL, bone=f"forearm.{side}", k=0.06, plate=331, hard=1.0))
        fa = normalize(wr - el)
        outward = normalize(v3((0.2, s * 1.0, 0.7)))
        outward = normalize(outward - fa * float(outward @ fa))
        # one long plate down the outer forearm: pale striking edge on the weapon arm, dark guard on the other
        body.add(AnglePlate((el + wr) / 2 + outward * 0.3 * heavy, frame(normalize(wr - el), outward),
                            float(np.linalg.norm(wr - el)) * 0.5, 0.36 * heavy, 0.16 * heavy, keel=0.14 * heavy, rake=0.25,
                            taper=0.8, lift=0.05, zone=BONE if s < 0 else ARMOR, bone=f"forearm.{side}", plate=310 + (s > 0),
                            hard=1.0))
        body.add(Ellipsoid(wr, (0.36 * heavy,) * 3, zone=FLESH, bone=("blend", f"forearm.{side}", f"claw.{side}", el, end), k=0.1))
        # cleaver: dark blade, one pale cutting edge on the weapon arm (continuing the forearm's striking edge);
        # shorter and narrower than CREATURE19 so it no longer hangs as a curtain over the arm and head
        tip = wr + (end + v3((0.75, 0.45 * s, 0.25)) - wr) * (0.741 if s < 0 else 0.55)
        body.extend(A.blade(wr + (end - wr) * 0.05, tip, v3((0.45, 1.0 * s, 0.6)), (0.72 if s < 0 else 0.5) * heavy, 0.16 * heavy,
                            f"claw.{side}", hook=0.5, serrations=0, n=4, zone=ARMOR, edge_zone=BONE if s < 0 else ARMOR))   # CREATURE29: four big notches, not nine scallops
        # little feeding arms under the chest (hidden from above; kept for the bones)
        ss, lf, pm = sk.h(f"shoulders.{side}"), sk.h(f"lilforearm.{side}"), sk.h(f"palm.{side}")
        body.add(RoundCone(ss, lf, 0.13, 0.09, zone=SHELL, bone=f"shoulders.{side}", k=0.06, tint=0.7))
        body.add(RoundCone(lf, pm, 0.09, 0.08, zone=SHELL, bone=f"lilforearm.{side}", k=0.05, tint=0.7))
    # --- legs (CREATURE29): thigh, dark knee notch, shin and a splayed foot with three big claws, all hard planes --
    for leg in ("front", "back"):
        for s, side in ((-1, "r"), (1, "l")):
            hip, knee, foot = sk.h(f"leg.{leg}.{side}"), sk.h(f"foot.{leg}.{side}"), sk.end(f"foot.{leg}.{side}")
            body.extend(hard_leg(hip, knee, foot, 0.86, 0.6, 0.38, f"leg.{leg}.{side}", f"foot.{leg}.{side}",
                                 forward=1.0 if leg == "front" else 0.4))
    # --- elite: a pale bone crown swept back off the head plane, a longer cleaver, the rank mantle ---------------
    elite = S.Sculpture("brute-elite")
    for i, (dy, L, rise) in enumerate(((0.0, 1.55, 1.0), (0.5, 1.15, 0.75), (-0.5, 1.15, 0.75))):
        b0 = head_c + z(-0.2, dy * 0.8, 0.42)
        elite.add(S.Tube(bezier(b0, b0 + z(-0.25, dy * 0.25, 0.45 * rise), b0 + z(-0.8 * L, dy * 0.55, 0.75 * rise),
                                b0 + z(-1.25 * L, dy * 0.75, 0.62 * rise), 8),
                         [0.24 - 0.026 * j for j in range(9)], zone=BONE, bone="head", k=0.08))
    wr_r, end_r = sk.h("claw.r") + v3((0.1, -0.72, 0)) * 0.85, sk.end("claw.r") + v3((0.1, -0.72, 0)) * 0.85
    elite.extend(A.blade(wr_r + (end_r - wr_r) * 0.2, end_r + v3((1.55, -0.75, 0.3)), v3((0.45, -1.0, 0.6)), 1.15, 0.2, "claw.r",
                         hook=0.55, serrations=0, zone=ARMOR, edge_zone=BONE))
    elite.extend(A.rank_mantle(hind_c, hind_r, hind_R, "tail", 0.15))
    # A low forward coronet and a second cleaver tine articulate with the original head and wrist.
    # Mesh these separately so adding the silhouette does not re-decimate the rank's existing crest.
    regalia = S.Sculpture("brute-regalia")
    for side in (-1, 1):
        root = head_c + z(0.08, side * 0.48, 0.35)
        points = [root, root + z(0.44, side * 0.85, 0.23),
                  root + z(1.15, side * 2.42, 0.36), root + z(2.02, side * 3.42, 0.36)]
        regalia.add(S.Tube(points, [0.34, 0.42, 0.31, 0.055], zone=BONE, bone="head"))
    prow = head_c + z(0.48, 0, 0.42)
    regalia.add(S.Tube([prow, prow + z(0.68, 0, 0.14), prow + z(1.6, 0, 0.04)],
                       [0.35, 0.33, 0.055], zone=BONE, bone="head"))
    blade_root = wr_r + (end_r - wr_r) * 0.23
    fork_tip = end_r + v3((0.40, -2.00, 0.10))
    regalia.extend(A.blade(blade_root, fork_tip, v3((0.3, -1.0, 0.45)), 0.67, 0.18, "claw.r",
                           hook=0.38, serrations=0, zone=ARMOR, edge_zone=BONE))
    # --- boss (Brute Warden): WARDEN25 its own asymmetric battering animal (warden.py)
    boss = WARDEN.build(sk, a)
    return {"body": body, "elite": elite, "regalia": regalia, "boss": boss}
