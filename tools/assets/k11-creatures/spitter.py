"""Spitter — ranged artillery strider on the `marauder` skeleton.

A swollen acid lantern (the caste's pressure vessel) cradled by shingled flank
plates, a long plated neck ending in a downturned mortar mouth with a green
throat, and high-arched legs like a harvestman's.
"""

import numpy as np

import sdf as S
from sdf import SHELL, MEMBRANE, CLAW, ORGAN, CREST, TOOTH, CAVITY, SINEW, EYE, Ellipsoid, RoundCone, Plate, frame, v3, normalize
import species as A

ASSET = "marauder"
FAMILY = "spitter"
ASPECT = 3.0
VOXEL = 0.03
TRIS = {"body": 9500, "elite": 1400}
ATLAS = 1024
GLOW_STRENGTH = 1.3
PALETTE = {
    "shell": (0.12, 0.06, 0.028), "edge": (0.55, 0.45, 0.24), "membrane": (0.09, 0.03, 0.02),
    "sinew": (0.22, 0.08, 0.04), "claw": (0.02, 0.015, 0.01), "tooth": (0.68, 0.62, 0.42),
    "organ": (0.35, 0.9, 0.08), "eye": (0.55, 1.0, 0.25), "crest": (0.5, 0.44, 0.28),
    "cavity": (0.02, 0.01, 0.005), "under": (0.08, 0.05, 0.025),
}
GLOW = {"organ": (0.2, 1.0, 0.02), "eye": (0.5, 1.0, 0.2)}


def chain(body, sk, names, radii, side, plates=(), tint=0.5, claw_hook=False):
    pts = [sk.h(n) for n in names] + [sk.end(names[-1])]
    for i, name in enumerate(names):
        p, q = pts[i], pts[i + 1]
        if float(np.linalg.norm(q - p)) < 1e-4:
            continue
        last = i == len(names) - 1
        zone = CLAW if last else SHELL
        body.add(RoundCone(p, q, radii[i], radii[i + 1], zone=zone, bone=name, k=radii[i] * 0.35, tint=tint))
        if 0 < i and not last:
            prev = names[i - 1]
            body.add(Ellipsoid(p, (radii[i] * 0.95,) * 3, zone=MEMBRANE, bone=("blend", prev, name, pts[i - 1], q), k=radii[i] * 0.3))
        if i in plates:
            ax = normalize(q - p)
            out = normalize(v3((0.0, side, 0.6)))
            out = normalize(out - ax * float(out @ ax))
            body.add(Plate((p + q) / 2 + out * radii[i] * 0.6, (float(np.linalg.norm(q - p)) * 0.45, radii[i] * 1.4, radii[i] * 0.8),
                           frame(ax, out), radii[i] * 0.55, rings=0.006, lip=radii[i] * 0.15, chip=0.01, zone=SHELL,
                           bone=name, plate=100 + i + 10 * (side > 0), tint=1.05))
    return pts


def build(sk):
    a = sk.aspect
    z = lambda x, y, zz: v3((x, y, zz * a))
    body = S.Sculpture("spitter-body")
    # --- trunk ---------------------------------------------------------------------
    body.add(A.mass(z(-0.75, 0, 3.05), (0.95, 0.95, 0.72 * a), frame((1, 0, 0.25)), bone="bum", zone=MEMBRANE, lump=0.02, freq=1.5))
    body.add(A.mass(z(0.6, 0, 3.45), (1.15, 1.0, 0.7 * a), frame((1, 0, 0.05)), bone=("blend", "spine", "spine1", z(0, 0, 3.4), z(1.3, 0, 3.5)),
                    zone=MEMBRANE, k=0.4, lump=0.02, freq=1.5))
    body.add(A.mass(z(1.75, 0, 3.4), (0.7, 0.8, 0.6 * a), frame((1, 0, -0.2)), bone="spine2", zone=MEMBRANE, k=0.35))
    trunk_c, trunk_r, trunk_R = z(0.2, 0, 3.35), v3((2.1, 1.05, 0.72 * a)), frame((1, 0, 0.1))
    bf = lambda u: "bum" if u < -0.35 else ("spine" if u < 0.1 else ("spine1" if u < 0.55 else "spine2"))
    body.extend(A.shingles(trunk_c, trunk_r, trunk_R, None, rows=4, phis=(1.25, 1.95), u0=0.7, u1=-0.7,
                           size=(0.78, 0.6, 0.3), thickness=0.2, lift=0.35, rings=0.01, bone_fn=bf, seed=20, plate0=1))
    # --- the acid vessel ------------------------------------------------------------
    sac_c = z(-0.15, 0, 4.3)
    sac = Ellipsoid(sac_c, (1.55, 0.95, 0.66 * a), frame((1, 0, 0.12)), zone=ORGAN, bone=("blend", "bum", "spine1", z(-1.2, 0, 4), z(1.0, 0, 4)))
    body.add(S.Stretch(sac, (1, 0, 0.1), 0.32, 0.06, sharp=3, zone=ORGAN, bone=sac.bone))
    for s in (-1, 1):
        body.add(Ellipsoid(sac_c + v3((0, 0.72 * s, -0.25)), (1.5, 0.22, 0.32 * a), frame((1, 0, 0.12)), zone=SINEW, bone=sac.bone, k=0.15))
    for i, x in enumerate((-1.0, -0.35, 0.3, 0.95)):
        body.add(RoundCone(z(x, -0.78, 3.85), z(x - 0.05, 0.78, 3.85), 0.06, 0.06, zone=SINEW, bone=bf(x / 2.1), k=0.05))
    # --- neck and mortar head -------------------------------------------------------
    nk, hd = sk.h("neck"), sk.h("head")
    body.add(RoundCone(sk.h("spine2"), nk, 0.6, 0.5, zone=MEMBRANE, bone="spine2", k=0.25))
    body.add(RoundCone(nk, hd, 0.5, 0.45, zone=MEMBRANE, bone="neck", k=0.2))
    for t, bone, p0, p1 in ((0.5, "spine2", sk.h("spine2"), nk), (0.5, "neck", nk, hd)):
        ax = normalize(p1 - p0)
        body.add(Plate(p0 + (p1 - p0) * t + v3((0, 0, 0.32 * a)), (float(np.linalg.norm(p1 - p0)) * 0.6, 0.55, 0.22),
                       frame(ax, (0, 0, 1)), 0.18, rings=0.008, lip=0.04, chip=0.03, zone=SHELL, bone=bone, plate=40 + int(t * 3)))
    head_c = z(3.2, 0, 3.05)
    body.add(A.mass(head_c, (0.7, 0.62, 0.42 * a), frame((1, 0, -0.5)), bone="head", k=0.2))
    body.add(Plate(head_c + z(-0.1, 0, 0.32), (0.8, 0.66, 0.26), frame((1, 0, -0.45)), 0.18, rings=0.008, ring_count=3,
                   lip=0.05, chip=0.03, zone=CREST, bone="head", plate=50))
    mz0, mz1 = z(3.5, 0, 2.7), z(4.0, 0, 2.25)
    body.add(RoundCone(mz0, mz1, 0.42, 0.36, zone=SHELL, bone="jaw", k=0.15, tint=1.1))
    body.add(Ellipsoid(mz1, (0.24, 0.28, 0.28 * a), frame(normalize(mz1 - mz0)), op="sub", zone=CAVITY, k=0.06))
    body.add(Ellipsoid(mz1 - normalize(mz1 - mz0) * 0.22, (0.14, 0.2, 0.2 * a), frame(normalize(mz1 - mz0)), zone=ORGAN, bone="jaw"))
    for s in (-1, 1):
        body.extend(A.hook([mz1 + v3((-0.1, 0.32 * s, 0.1)), mz1 + v3((0.25, 0.4 * s, -0.1)), mz1 + v3((0.35, 0.22 * s, -0.4)),
                            mz1 + v3((0.25, 0.08 * s, -0.6))], 0.1, 0.02, "jaw", k=0.04, tip=0.4))
    for eye in ("eye_h", "eye_m", "eye_l"):
        for side in ("R", "L"):
            body.add(Ellipsoid(sk.h(f"{eye}.{side}") + v3((0.05, 0, 0)), (0.09, 0.09, 0.09 * a), zone=EYE, bone="head"))
    # --- arched legs and fore-limbs -------------------------------------------------
    for s, side in ((-1, "R"), (1, "L")):
        for leg in ("m", "b"):
            names = [f"leg_{leg}{i if i else ''}.{side}" for i in range(8)]
            chain(body, sk, names, [0.34, 0.24, 0.22, 0.2, 0.18, 0.12, 0.1, 0.08, 0.02], s, plates=(2, 4))
        names = [f"hand.{side}", f"hand1.{side}", f"hand2.{side}", f"claw.{side}"]
        chain(body, sk, names, [0.3, 0.22, 0.2, 0.17, 0.03], s, plates=(0, 2))
    # --- elite: crown of spines around the vessel -----------------------------------
    elite = S.Sculpture("spitter-elite")
    pts, nrm = [], []
    for x in np.linspace(-1.1, 1.0, 5):
        for s in (-1, 1):
            p = sac_c + v3((x, 0.95 * s, -0.15 * a))
            pts.append(p)
            nrm.append(normalize(v3((0, s, 1.2))))
    elite.extend(A.crest_spines(pts, nrm, 0.9, 0.09, lambda p: bf(float(p[0]) / 2.1), sweep=(-1, 0, 0.2)))
    return {"body": body, "elite": elite}
