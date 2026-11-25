"""Brute — heavy siege caste on the `tyrant` skeleton; Brute Warden is its boss rank.

A shingled bulwark chest split along the crown by an amber lantern, a low
bone-pale prow head between two crusher arms ending in hooked cleavers (the
right one heavier), a long armoured hind body on four pillar legs.
"""

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
    body.add(A.mass(chest_c, chest_r, chest_R, bone="chest", zone=FLESH, lump=0.004, freq=1.5, seed=2))
    front = normalize(chest_R[:, 0])
    st = chest_c + front * chest_r[0] * 0.92 + v3((0, 0, -0.25 * a))
    body.add(AnglePlate(st, frame(normalize(up_ - front * float(up_ @ front)), front), 1.3, 0.45, 0.28, keel=0.36, rake=0.6,
                        taper=0.45, zone=SHELL, bone="chest", plate=10))
    body.add(A.mass(z(0.1, 0, 2.55), (1.05, 0.8, 0.6 * a), frame((1, 0, 0.1)), bone=("blend", "chest", "tail", z(0.6, 0, 3), z(-0.8, 0, 2.3)),
                    zone=FLESH, k=0.45, lump=0.02, freq=1.2, seed=9))
    # --- the dark carapace saddle: hump, one broad shoulder yoke, back ----------------------------------------
    hump_c = chest_c + z(-0.35, 0, 0.85)
    body.add(A.mass(hump_c, (0.95, 0.8, 0.62 * a), frame((1, 0, 0.35)), bone="chest", zone=MEMBRANE, k=0.45, lump=0.01, freq=1.4, seed=17))
    yoke_up = normalize(v3((0.25, 0, 1)))
    body.add(AnglePlate(hump_c + z(0.1, 0, 0.22), frame(normalize(v3((1, 0, -0.25))), yoke_up), 0.95, 1.95, 0.3, keel=0.2,
                        rake=0.5, taper=0.8, lift=0.12, zone=ARMOR, bone="chest", plate=300))
    la, _ = A.ellipsoid_surface(chest_c, chest_r, chest_R, 0.55, 0.0)
    lb, _ = A.ellipsoid_surface(chest_c, chest_r, chest_R, -0.62, 0.0)
    body.extend(A.lantern(la + v3((0, 0, 0.42)), lb + v3((0, 0, 0.3)), 0.34, "chest", height=1.5, ribs=0.17))
    hind_c, hind_r, hind_R = z(-1.15, 0, 2.05), v3((1.85, 0.95, 0.62 * a)), frame((1, 0, 0.18))
    body.add(A.mass(hind_c, hind_r, hind_R, bone="tail", zone=MEMBRANE, k=0.35, lump=0.006, freq=1.5, seed=3))
    body.add(Ellipsoid(z(-0.35, 0, 2.85), (0.8, 0.8, 0.45 * a), zone=MEMBRANE,
                       bone=("blend", "tail", "chest", z(-0.9, 0, 2.5), z(0.3, 0, 3.4)), k=0.3))
    body.extend(A.shingles(hind_c, hind_r, hind_R, "tail", rows=2, phis=(0.0,), u0=0.45, u1=-0.6,
                           size=(1.0, 0.95, 0.34), thickness=0.24, lift=0.4, rings=0.006, grow=-0.2, seed=60, plate0=20, angular=True))
    body.extend(A.dorsal_blades(hind_c, hind_r, hind_R, "tail", (0.3,), 1.2, 0.75, 0.17, lift=0.5, plate=171))
    # --- head: a broad wedge carried ahead of the shoulders, one pale lit top plane -------------------------------
    head_c = z(2.6, 0, 3.42)
    neck = ("blend", "chest", "head", z(0.6, 0, 3.8), z(2.0, 0, 3.55))
    body.add(Ellipsoid(z(1.45, 0, 3.62), (0.85, 0.5, 0.3 * a), frame((1, 0, -0.2)), zone=MEMBRANE, bone=neck, k=0.14))
    body.add(A.mass(head_c, (0.95, 0.72, 0.36 * a), frame((1, 0, -0.18)), bone="head", zone=FLESH, k=0.16))
    # the head plane: a broad faceted bone plate over the skull, point forward (which end is the head)
    body.add(AnglePlate(head_c + z(0.05, 0, 0.36), frame(normalize(v3((-1, 0, 0.12))), normalize(v3((0.12, 0, 1)))), 0.92, 0.78,
                        0.2, keel=0.2, rake=0.3, taper=0.45, lift=0.06, zone=CREST, bone="head", plate=50))
    body.add(AnglePlate(head_c + z(0.55, 0, -0.32), frame((-1, 0, 0.5), (0, 0, -1)), 0.85, 0.7, 0.24, keel=0.2, rake=0.5,
                        taper=0.6, zone=ARMOR, bone="jaw", plate=55))
    body.extend(A.eyes(head_c + z(0.62, 0, 0.05), (1, 0, -0.2), 0.36, 2, 0.07, "head", spread=0.8))
    body.add(Ellipsoid(head_c + z(0.95, 0, -0.18), (0.2, 0.28, 0.1 * a), op="sub", zone=CAVITY, k=0.08))
    for s in (-1, 1):   # two short pale tusks
        body.extend(A.hook([head_c + z(0.7, 0.32 * s, -0.2), head_c + z(1.0, 0.42 * s, -0.35), head_c + z(1.2, 0.36 * s, -0.6),
                            head_c + z(1.25, 0.26 * s, -0.8)], 0.13, 0.03, "jaw", zone=TOOTH, k=0.05, tip=0.4))
    # --- forelimbs: carried out from the torso; the right one is the weapon arm with one pale striking edge ------
    for s, side in ((-1, "r"), (1, "l")):
        heavy = 1.25 if s < 0 else 0.9
        out = v3((0.1, 0.72 * s, 0.0))
        sh, el, wr = sk.h(f"shoulder.{side}"), sk.h(f"forearm.{side}") + out, sk.h(f"claw.{side}") + out * 0.85
        end = sk.end(f"claw.{side}") + out * 0.85
        # shoulder ball under the yoke edge: the darkest attachment
        body.add(Ellipsoid(sh + v3((0, 0.25 * s, 0)), (0.5 * heavy,) * 3, zone=MEMBRANE, bone=f"shoulder.{side}", k=0.12))
        body.add(RoundCone(sh + v3((0, 0.25 * s, 0)), el, 0.42 * heavy, 0.34 * heavy, zone=SHELL, bone=f"shoulder.{side}", k=0.12, plate=330))
        body.add(Ellipsoid(el, (0.32 * heavy,) * 3, zone=MEMBRANE, bone=("blend", f"shoulder.{side}", f"forearm.{side}", sh, wr), k=0.08))
        body.add(RoundCone(el, wr, 0.34 * heavy, 0.42 * heavy, zone=SHELL, bone=f"forearm.{side}", k=0.1, plate=331))
        fa = normalize(wr - el)
        outward = normalize(v3((0.2, s * 1.0, 0.7)))
        outward = normalize(outward - fa * float(outward @ fa))
        # one long plate down the outer forearm: pale striking edge on the weapon arm, dark guard on the other
        body.add(AnglePlate((el + wr) / 2 + outward * 0.3 * heavy, frame(normalize(wr - el), outward),
                            float(np.linalg.norm(wr - el)) * 0.5, 0.36 * heavy, 0.16 * heavy, keel=0.14 * heavy, rake=0.25,
                            taper=0.8, lift=0.05, zone=BONE if s < 0 else ARMOR, bone=f"forearm.{side}", plate=310 + (s > 0)))
        body.add(Ellipsoid(wr, (0.36 * heavy,) * 3, zone=FLESH, bone=("blend", f"forearm.{side}", f"claw.{side}", el, end), k=0.1))
        # cleaver: dark blade, one pale cutting edge on the weapon arm (continuing the forearm's striking edge);
        # shorter and narrower than CREATURE19 so it no longer hangs as a curtain over the arm and head
        tip = wr + (end + v3((0.75, 0.45 * s, 0.25)) - wr) * (0.78 if s < 0 else 0.55)
        body.extend(A.blade(wr + (end - wr) * 0.05, tip, v3((0.45, 1.0 * s, 0.6)), (0.72 if s < 0 else 0.5) * heavy, 0.16 * heavy,
                            f"claw.{side}", hook=0.5, serrations=0, zone=ARMOR, edge_zone=BONE if s < 0 else ARMOR))
        # little feeding arms under the chest (hidden from above; kept for the bones)
        ss, lf, pm = sk.h(f"shoulders.{side}"), sk.h(f"lilforearm.{side}"), sk.h(f"palm.{side}")
        body.add(RoundCone(ss, lf, 0.13, 0.09, zone=SHELL, bone=f"shoulders.{side}", k=0.06, tint=0.7))
        body.add(RoundCone(lf, pm, 0.09, 0.08, zone=SHELL, bone=f"lilforearm.{side}", k=0.05, tint=0.7))
    # --- legs -------------------------------------------------------------------------
    for leg in ("front", "back"):
        for s, side in ((-1, "r"), (1, "l")):
            hip, knee, foot = sk.h(f"leg.{leg}.{side}"), sk.h(f"foot.{leg}.{side}"), sk.end(f"foot.{leg}.{side}")
            body.extend(A.limb(hip, knee, foot, 0.9, 0.68, 0.32, f"leg.{leg}.{side}", f"foot.{leg}.{side}",
                               seed=len(leg) + s, tint=1.0, bend=0.2, tendon=False))
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
