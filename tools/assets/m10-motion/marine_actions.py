"""Author marine actions on the retained source skeleton with real Blender IK.

The mesh and edit bones are inputs only. Temporary hand, elbow, ankle and knee
controls are keyed in world space, then visually baked onto the original bones.
This module deliberately does not write the base marine or any weapon asset.
"""

from dataclasses import dataclass
import argparse
from pathlib import Path
import math
import sys

import bpy
from mathutils import Matrix, Quaternion, Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
import common

FPS = 60
ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "public/assets/models/marine.glb"
OUTPUT = ROOT / "tools/assets/m10-motion/.build/marine-actions-motion.glb"


@dataclass
class Pose:
    time: float
    pelvis: tuple = (0, 0, 0)
    spine: tuple = (0, 0, 0)
    ribs: tuple = (0, 0, 0)
    head: tuple = (0, 0, 0)
    left: tuple | None = None
    right: tuple | None = None
    left_wrist: tuple = (0, 0, 0)
    right_wrist: tuple = (0, 0, 0)
    left_foot: tuple = (0, 0, 0)
    right_foot: tuple = (0, 0, 0)
    left_pole: tuple | None = None
    right_pole: tuple | None = None
    left_knee: tuple | None = None
    right_knee: tuple | None = None
    left_delta: tuple = (0, 0, 0)
    right_delta: tuple = (0, 0, 0)


@dataclass
class Clip:
    name: str
    poses: list[Pose]
    impact: float | None = None
    loop: bool = False
    upper: str = "shotgun_delta"

    @property
    def duration(self):
        return self.poses[-1].time


# The hands describe deliberate arcs rather than a common amplitude equation.
# X is forward, Y is the marine's left, Z is height above the sole plane, in m.
STANDARD = [
    Clip("m10-idle", [
        Pose(0),
        Pose(.10),
        Pose(.38, spine=(-.018, .018, -.018), ribs=(-.025, 0, .025), head=(-.025, .075, 0)),
        Pose(.86, spine=(-.035, .025, -.025), ribs=(-.035, -.015, .035), head=(-.065, .12, -.02)),
        Pose(1.32, spine=(.025, -.015, .025), ribs=(.02, .02, -.018), head=(.03, -.075, .025)),
        Pose(1.88, spine=(.012, -.025, .012), ribs=(.035, .012, -.028), head=(.04, -.10, .015)),
        Pose(2.30),
        Pose(2.4),
    ], loop=True),
    Clip("m10-cast-seismic-slam", [
        Pose(0),
        Pose(.05),
        Pose(.10, pelvis=(0, 0, -.12), spine=(-.12, -.06, 0),
             left=(.14, .24, 1.68), right=(.20, -.19, 1.74), right_wrist=(-.45, 0, 0)),
        Pose(.24, pelvis=(0, 0, -.16), spine=(-.24, -.04, 0), ribs=(-.13, 0, 0),
             left=(-.04, .15, 2.04), right=(.06, -.14, 2.08), right_wrist=(-1.26, 0, 0),
             left_wrist=(-.80, 0, 0), left_foot=(.10, .08, 0), right_foot=(-.12, -.08, 0)),
        Pose(.32, pelvis=(0, 0, -.16), spine=(-.24, -.04, 0), ribs=(-.13, 0, 0),
             left=(-.04, .15, 2.04), right=(.06, -.14, 2.08), right_wrist=(-1.26, 0, 0),
             left_wrist=(-.80, 0, 0), left_foot=(.10, .08, 0), right_foot=(-.12, -.08, 0)),
        Pose(.37, pelvis=(.10, 0, -.45), spine=(.72, .08, -.05), ribs=(.25, 0, 0),
             left=(.64, .16, .64), right=(.70, -.12, .66), right_wrist=(.95, 0, 0),
             left_wrist=(.45, 0, 0), left_foot=(.16, .08, 0), right_foot=(-.27, -.08, .015), right_knee=(.06, -.30, .015)),
        Pose(.43, pelvis=(.14, -.035, -.56), spine=(.96, .10, -.09), ribs=(.24, .06, 0),
             left=(.69, .15, .30), right=(.73, -.12, .34), right_wrist=(1.18, -.12, 0),
             left_wrist=(.72, 0, 0), left_foot=(.16, .08, 0), right_foot=(-.29, -.08, .015), right_knee=(.08, -.30, .015)),
        Pose(.55, pelvis=(0, 0, -.38), spine=(.52, -.07, -.04), ribs=(.10, 0, 0),
             left=(.55, .19, .85), right=(.62, -.14, .92), right_wrist=(.45, 0, 0),
             left_foot=(.13, .06, 0), right_foot=(-.20, -.06, 0), right_knee=(.20, -.28, .16)),
        Pose(.72, pelvis=(0, 0, -.08), spine=(-.07, .025, 0), head=(-.05, 0, 0)),
        Pose(.82),
        Pose(.88),
    ], impact=.32),
    Clip("m10-hit-front", [
        Pose(0),
        Pose(.045, pelvis=(-.13, -.025, -.075), spine=(-.52, -.14, -.13), ribs=(-.25, -.08, -.12),
             head=(.20, .12, .09), left=(-.10, .58, 1.32), right=(.26, -.39, 1.22),
             right_wrist=(.28, -.12, 0), right_foot=(-.12, -.08, .04)),
        Pose(.095, pelvis=(-.16, -.03, -.09), spine=(-.58, -.17, -.15), ribs=(-.27, -.08, -.13),
             head=(.24, .15, .10), left=(-.14, .60, 1.29), right=(.22, -.42, 1.18),
             right_wrist=(.32, -.14, 0), right_foot=(-.19, -.08, .085)),
        Pose(.19, pelvis=(-.09, .02, -.13), spine=(-.19, .08, .04), ribs=(.12, .06, .04),
             head=(.10, -.08, -.05), left=(.10, .56, 1.36), right=(.44, -.30, 1.32),
             right_foot=(-.29, -.10, .025)),
        Pose(.24, pelvis=(0, 0, -.075), spine=(.08, .06, .035), ribs=(.07, .02, .025),
             head=(-.035, -.045, 0), left=(.23, .48, 1.35), right=(.47, -.27, 1.34), right_foot=(-.25, -.08, .01)),
        Pose(.30, pelvis=(0, 0, -.055), spine=(.16, .04, .035), ribs=(.06, -.025, -.02),
             head=(-.075, -.06, 0), left=(.28, .43, 1.33), right=(.48, -.24, 1.35),
             right_foot=(-.20, -.06, 0)),
        Pose(.43, pelvis=(0, 0, -.01), spine=(-.035, 0, -.012), head=(.025, 0, 0)),
        Pose(.48),
        Pose(.54),
    ], impact=.045),
    Clip("m10-reload", [
        Pose(0),
        Pose(.06),
        Pose(.12, pelvis=(0, 0, -.035), spine=(.12, -.14, .025), ribs=(-.12, -.08, .03),
             head=(.10, -.12, 0), left=(.32, -.15, 1.06), right=(.53, -.16, 1.34), right_wrist=(-.13, 0, 0),
             left_pole=(.05, -.65, 1.10)),
        Pose(.22, pelvis=(0, 0, -.065), spine=(.24, -.26, .04), ribs=(-.06, -.12, .045),
             head=(.22, -.24, .04), left=(.14, -.62, .80), right=(.56, -.17, 1.31), right_wrist=(-.20, -.05, 0),
             left_pole=(-.05, -.90, 1.08)),
        Pose(.32, pelvis=(0, 0, -.065), spine=(.25, -.28, .045), ribs=(-.07, -.14, .05),
             head=(.23, -.25, .04), left=(.05, -.82, .66), right=(.56, -.17, 1.31), right_wrist=(-.20, -.05, 0),
             left_pole=(-.10, -.98, 1.02)),
        Pose(.37, pelvis=(0, 0, -.065), spine=(.25, -.28, .045), ribs=(-.07, -.14, .05),
             head=(.23, -.25, .04), left=(.05, -.82, .66), right=(.56, -.17, 1.31), right_wrist=(-.20, -.05, 0),
             left_pole=(-.10, -.98, 1.02)),
        Pose(.45, pelvis=(0, 0, -.06), spine=(.20, -.18, .025), ribs=(-.12, -.08, .02),
             head=(.17, -.12, 0), left=(.42, -.65, .92), right=(.57, -.15, 1.32), right_wrist=(-.18, 0, 0),
             left_pole=(.05, -.92, 1.12)),
        Pose(.55, pelvis=(0, 0, -.055), spine=(.15, -.04, .01), ribs=(-.14, -.02, 0),
             head=(.15, -.04, 0), left=(.54, -.23, 1.20), right=(.57, -.15, 1.32), right_wrist=(-.18, 0, 0),
             left_pole=(.12, -.76, 1.20)),
        Pose(.63, pelvis=(0, 0, -.045), spine=(.11, .035, 0), ribs=(-.18, .04, 0),
             head=(.12, 0, 0), left=(.58, -.17, 1.39), right=(.58, -.15, 1.37), right_wrist=(-.23, 0, 0), left_pole=(.12, -.55, 1.22)),
        Pose(.68, pelvis=(0, 0, -.045), spine=(.11, .035, 0), ribs=(-.18, .04, 0),
             head=(.12, 0, 0), left=(.58, -.17, 1.39), right=(.58, -.15, 1.37), right_wrist=(-.23, 0, 0),
             left_pole=(.12, -.55, 1.22)),
        Pose(.80, spine=(.08, .08, -.015), ribs=(-.08, .10, 0),
             left=(.75, .06, 1.41), right=(.57, -.16, 1.36), right_wrist=(-.12, .08, 0), left_pole=(.03, .10, 1.20)),
        Pose(.98, pelvis=(0, 0, -.02), spine=(-.05, .035, 0),
             left=(.44, .20, 1.34), right=(.56, -.15, 1.39), head=(-.035, .025, 0), left_pole=(-.04, .55, 1.18)),
        Pose(1.16),
        Pose(1.24),
    ]),
    Clip("m10-death", [
        Pose(0),
        Pose(.10, pelvis=(-.10, -.04, -.12), spine=(-.38, -.10, -.18), ribs=(-.12, -.06, -.15),
             head=(.23, .10, .05), left=(-.10, .55, 1.23), right=(.28, -.42, 1.16), right_wrist=(.35, -.12, 0)),
        Pose(.24, pelvis=(-.15, -.12, -.40), spine=(.40, -.16, -.44), ribs=(.24, .12, -.30),
             head=(.20, .17, -.10), left=(.12, .48, .67), right=(.40, -.50, .61),
             right_wrist=(.8, -.24, -.25), left_foot=(.18, .06, 0), right_foot=(-.25, -.15, .03)),
        Pose(.40, pelvis=(-.18, -.22, -.72), spine=(.73, -.22, -.82), ribs=(.20, .10, -.28),
             head=(-.12, .18, -.14), left=(.28, .36, .30), right=(.44, -.56, .25),
             right_wrist=(1.0, -.35, -.35), left_foot=(.22, .08, .04), right_foot=(-.42, -.20, .08)),
        Pose(.60, pelvis=(-.18, -.28, -.89), spine=(.78, -.25, -1.14), ribs=(.15, .10, -.26),
             head=(-.12, .20, -.12), left=(.28, .30, .14), right=(.43, -.55, .13),
             right_wrist=(1.1, -.35, -.45), left_foot=(.26, .10, .04), right_foot=(-.48, -.24, .05)),
        Pose(.82, pelvis=(-.18, -.28, -.87), spine=(.74, -.23, -1.10), ribs=(.14, .09, -.25),
             head=(-.10, .18, -.12), left=(.27, .30, .14), right=(.42, -.54, .13),
             right_wrist=(1.08, -.34, -.43), left_foot=(.26, .10, .04), right_foot=(-.48, -.24, .05)),
        Pose(1.05, pelvis=(-.18, -.28, -.87), spine=(.74, -.23, -1.10), ribs=(.14, .09, -.25),
             head=(-.10, .18, -.12), left=(.27, .30, .14), right=(.42, -.54, .13),
             right_wrist=(1.08, -.34, -.43), left_foot=(.26, .10, .04), right_foot=(-.48, -.24, .05)),
    ], impact=.10),
]


CASTS = [
    Clip("m10-cast-ram", [
        Pose(0),
        Pose(.045, pelvis=(.08, -.02, -.18), spine=(.65, -.10, -.09), ribs=(.18, .03, 0),
             left=(.10, .46, 1.28), right=(.68, -.16, 1.30), right_wrist=(.12, 0, 0),
             left_foot=(.18, .05, 0), right_foot=(-.16, -.06, .025)),
        Pose(.12, pelvis=(.15, -.025, -.23), spine=(.79, -.18, -.13), ribs=(.20, .06, 0),
             left=(.06, .42, 1.31), right=(.73, -.12, 1.24), right_wrist=(.18, -.04, 0),
             left_foot=(.24, .06, 0), right_foot=(-.24, -.08, .04)),
        Pose(.20, pelvis=(.12, -.02, -.18), spine=(.61, .10, -.17), ribs=(.12, -.04, 0),
             left=(.17, .48, 1.26), right=(.71, -.17, 1.29), right_wrist=(.10, 0, 0),
             left_foot=(.20, .06, 0), right_foot=(-.14, -.08, .015)),
        Pose(.24, pelvis=(0, 0, -.12), spine=(.40, .04, -.06), ribs=(.08, -.02, 0),
             left=(.22, .43, 1.31), right=(.65, -.17, 1.33), left_foot=(.14, .04, 0), right_foot=(-.10, -.06, .01)),
        Pose(.34, pelvis=(0, 0, -.045), spine=(-.14, .045, .025), head=(-.04, 0, 0)),
        Pose(.48), Pose(.56),
    ]),
    Clip("m10-cast-bulwark", [
        Pose(0),
        Pose(.07, pelvis=(0, 0, -.15), spine=(.28, -.25, -.04), ribs=(.06, -.12, 0),
             left=(.73, .20, 1.45), right=(.33, -.43, 1.13), right_wrist=(.58, -.20, 0),
             left_foot=(.08, .12, 0), right_foot=(-.06, -.12, 0)),
        Pose(.15, pelvis=(0, 0, -.20), spine=(.37, -.32, -.07), ribs=(.10, -.15, 0),
             left=(.89, .12, 1.49), right=(.29, -.48, 1.09), right_wrist=(.73, -.25, 0),
             left_foot=(.10, .15, 0), right_foot=(-.08, -.15, 0)),
        Pose(.25, pelvis=(0, 0, -.20), spine=(.37, -.32, -.07), ribs=(.10, -.15, 0),
             left=(.89, .12, 1.49), right=(.29, -.48, 1.09), right_wrist=(.73, -.25, 0),
             left_foot=(.10, .15, 0), right_foot=(-.08, -.15, 0)),
        Pose(.33, pelvis=(0, 0, -.14), spine=(.46, -.20, -.025), ribs=(.13, -.06, 0),
             left=(.97, .10, 1.46), right=(.31, -.42, 1.13), right_wrist=(.62, -.18, 0)),
        Pose(.49, spine=(-.06, .055, 0), left=(.51, .32, 1.36), right=(.49, -.24, 1.31)),
        Pose(.64), Pose(.72),
    ]),
    Clip("m10-cast-railbreaker", [
        Pose(0),
        Pose(.10, pelvis=(0, 0, -.20), spine=(.28, -.06, 0), ribs=(-.10, .04, 0),
             left=(.56, .12, 1.28), right=(.66, -.10, 1.31),
             left_foot=(.14, .18, 0), right_foot=(-.13, -.18, 0)),
        Pose(.26, pelvis=(0, 0, -.25), spine=(.35, -.08, 0), ribs=(-.12, .05, 0),
             left=(.60, .09, 1.25), right=(.70, -.10, 1.28), right_wrist=(-.045, 0, 0),
             left_foot=(.16, .21, 0), right_foot=(-.16, -.21, 0)),
        Pose(.30, pelvis=(0, 0, -.25), spine=(.35, -.08, 0), ribs=(-.12, .05, 0),
             left=(.60, .09, 1.25), right=(.70, -.10, 1.28), right_wrist=(-.045, 0, 0),
             left_foot=(.16, .21, 0), right_foot=(-.16, -.21, 0)),
        Pose(.34, pelvis=(-.17, -.025, -.28), spine=(-.28, .07, -.08), ribs=(-.25, .06, -.04),
             head=(.17, -.04, .02), left=(.43, .13, 1.42), right=(.53, -.14, 1.45), right_wrist=(-.22, 0, 0),
             left_foot=(.16, .21, 0), right_foot=(-.21, -.22, .025)),
        Pose(.42, pelvis=(-.12, -.015, -.24), spine=(-.35, .10, -.045), ribs=(-.12, -.04, 0),
             left=(.46, .16, 1.43), right=(.56, -.15, 1.47), right_wrist=(-.15, 0, 0),
             left_foot=(.16, .21, 0), right_foot=(-.18, -.20, .01)),
        Pose(.54, pelvis=(0, 0, -.14), spine=(.04, -.02, .015), ribs=(.02, -.015, 0),
             left=(.53, .15, 1.35), right=(.62, -.13, 1.39), left_foot=(.10, .12, 0), right_foot=(-.10, -.12, 0)),
        Pose(.60, pelvis=(0, 0, -.10), spine=(.12, -.045, .02), ribs=(.045, 0, 0),
             left=(.55, .15, 1.32), right=(.64, -.12, 1.35)),
        Pose(.82), Pose(.92),
    ], impact=.30),
    Clip("m10-cast-frost-trail", [
        Pose(0),
        Pose(.045, pelvis=(.035, .06, -.20), spine=(.35, .35, -.15), ribs=(-.08, -.20, .02),
             left=(-.12, .56, 1.65), right=(.60, -.20, 1.32), right_wrist=(.08, -.10, 0),
             left_foot=(.18, -.16, .035), right_foot=(-.10, .08, 0)),
        Pose(.13, pelvis=(.08, .12, -.24), spine=(.40, .50, -.23), ribs=(-.10, -.30, .05),
             left=(-.18, .66, 1.74), right=(.67, -.24, 1.28), right_wrist=(.10, -.14, 0),
             left_foot=(.25, -.20, .065), right_foot=(-.20, .12, 0)),
        Pose(.24, pelvis=(0, 0, -.18), spine=(-.10, .28, .15), ribs=(-.04, -.16, 0),
             left=(.03, .61, 1.61), right=(.57, -.22, 1.35), right_wrist=(-.05, -.05, 0),
             left_foot=(.11, -.08, 0), right_foot=(-.10, .04, .07)),
        Pose(.40, spine=(.055, -.08, -.035), left=(.29, .38, 1.41), right=(.56, -.17, 1.35)),
        Pose(.53), Pose(.61),
    ]),
    Clip("m10-cast-cryo-nova", [
        Pose(0),
        Pose(.06, pelvis=(0, 0, -.14), spine=(-.12, -.40, 0), ribs=(-.06, -.20, 0), head=(.02, .24, 0),
             left=(.57, .25, 1.42), right=(-.45, -.25, 1.42), right_wrist=(0, 1.80, 0),
             left_wrist=(-.10, -.20, 0), left_foot=(.03, .10, 0), right_foot=(-.03, -.10, 0),
             left_pole=(.35, .62, 1.25), right_pole=(-.35, -.62, 1.25)),
        Pose(.14, pelvis=(0, 0, -.15), spine=(-.16, -.58, 0), ribs=(-.08, -.42, 0), head=(-.05, .50, 0),
             left=(.90, .16, 1.46), right=(-.90, -.16, 1.46), right_wrist=(0, math.pi, 0),
             left_wrist=(-.12, -.30, 0), left_foot=(.05, .14, 0), right_foot=(-.05, -.14, 0),
             left_pole=(.47, .55, 1.27), right_pole=(-.47, -.55, 1.27)),
        Pose(.24, pelvis=(0, 0, -.12), spine=(-.20, -.60, 0), ribs=(-.08, -.44, 0), head=(-.07, .52, 0),
             left=(.94, .14, 1.48), right=(-.94, -.14, 1.48), right_wrist=(0, math.pi, 0),
             left_wrist=(-.14, -.32, 0), left_foot=(.05, .14, 0), right_foot=(-.05, -.14, 0),
             left_pole=(.48, .54, 1.30), right_pole=(-.48, -.54, 1.30)),
        Pose(.34, pelvis=(0, 0, -.08), spine=(.08, -.42, 0), ribs=(.035, -.26, 0), head=(.035, .34, 0),
             left=(.72, .20, 1.44), right=(-.60, -.20, 1.44), right_wrist=(0, 2.30, 0),
             left_foot=(.03, .09, 0), right_foot=(-.03, -.09, 0),
             left_pole=(.33, .64, 1.24), right_pole=(-.27, -.64, 1.24)),
        Pose(.48, pelvis=(0, 0, -.035), spine=(.035, -.12, 0), ribs=(.015, -.08, 0), head=(.015, .10, 0),
             left=(.47, .30, 1.40), right=(.34, -.28, 1.40), right_wrist=(0, .60, 0),
             left_pole=(.05, .77, 1.18), right_pole=(-.05, -.77, 1.18)),
        Pose(.62), Pose(.70),
    ]),
    Clip("m10-cast-glacier", [
        Pose(0),
        Pose(.10, pelvis=(0, 0, -.36), spine=(.55, -.12, -.045), ribs=(.14, -.04, 0),
             left=(.45, .20, .65), right=(.48, -.15, .80), right_wrist=(.75, 0, 0),
             left_foot=(.12, .06, 0), right_foot=(-.18, -.06, .015), right_knee=(.10, -.28, .02)),
        Pose(.24, pelvis=(0, 0, -.45), spine=(.78, -.18, -.055), ribs=(.20, -.05, 0),
             left=(.65, .10, .30), right=(.60, -.10, .40), right_wrist=(1.0, -.08, 0),
             left_foot=(.14, .08, 0), right_foot=(-.22, -.08, .015), right_knee=(.10, -.28, .02)),
        Pose(.31, pelvis=(0, 0, -.25), spine=(-.25, -.10, .025), ribs=(-.08, .035, 0),
             left=(.60, .25, 1.35), right=(.55, -.20, 1.50), right_wrist=(-.35, 0, 0),
             left_foot=(.14, .08, 0), right_foot=(-.18, -.08, 0)),
        Pose(.42, pelvis=(0, 0, -.16), spine=(-.28, .08, .04), ribs=(-.12, -.025, 0),
             left=(.30, .35, 1.95), right=(.50, -.30, 1.65), right_wrist=(-.55, -.12, 0),
             left_foot=(.10, .06, 0), right_foot=(-.10, -.06, 0)),
        Pose(.59, pelvis=(0, 0, -.04), spine=(.075, -.035, -.015),
             left=(.42, .30, 1.63), right=(.56, -.22, 1.48), right_wrist=(-.12, 0, 0)),
        Pose(.81), Pose(.91),
    ], impact=.24),
    Clip("m10-cast-whiteout", [
        Pose(0),
        Pose(.08, pelvis=(0, 0, -.14), spine=(-.18, 0, 0), ribs=(-.10, 0, 0),
             left=(.04, .22, 1.83), right=(.10, -.22, 1.87), right_wrist=(-.75, 0, 0)),
        Pose(.18, pelvis=(0, 0, -.12), spine=(-.30, 0, 0), ribs=(-.10, 0, 0), head=(-.14, 0, 0),
             left=(-.06, .24, 2.12), right=(.04, -.24, 2.15), right_wrist=(-1.30, 0, 0), left_wrist=(-.85, 0, 0),
             left_foot=(.04, .10, 0), right_foot=(-.04, -.10, 0)),
        Pose(.30, pelvis=(0, 0, -.12), spine=(-.30, 0, 0), ribs=(-.10, 0, 0), head=(-.14, 0, 0),
             left=(-.06, .24, 2.12), right=(.04, -.24, 2.15), right_wrist=(-1.30, 0, 0), left_wrist=(-.85, 0, 0),
             left_foot=(.04, .10, 0), right_foot=(-.04, -.10, 0)),
        Pose(.42, pelvis=(0, 0, -.08), spine=(-.36, 0, 0), ribs=(-.06, 0, 0),
             left=(-.10, .46, 2.05), right=(-.02, -.46, 2.08), right_wrist=(-1.20, -.15, 0)),
        Pose(.64, spine=(.06, 0, 0), left=(.28, .34, 1.62), right=(.45, -.30, 1.61), right_wrist=(-.35, 0, 0)),
        Pose(.80), Pose(.90),
    ]),
    Clip("m10-cast-afterburn", [
        Pose(0),
        Pose(.045, pelvis=(.075, 0, -.18), spine=(.66, .08, -.08), ribs=(.17, -.04, 0),
             left=(-.14, .50, 1.07), right=(.68, -.12, 1.49), right_wrist=(-.10, .04, 0),
             left_foot=(.20, .05, 0), right_foot=(-.23, -.06, .06)),
        Pose(.12, pelvis=(.14, 0, -.22), spine=(.77, .12, -.10), ribs=(.20, -.08, 0),
             left=(-.24, .57, 1.00), right=(.75, -.10, 1.52), right_wrist=(-.15, .05, 0),
             left_foot=(.26, .06, 0), right_foot=(-.31, -.08, .08)),
        Pose(.19, pelvis=(.085, -.025, -.15), spine=(.54, -.14, .10), ribs=(.12, .07, 0),
             left=(-.05, .53, 1.15), right=(.67, -.16, 1.43), left_foot=(.18, .05, 0), right_foot=(-.13, -.06, .035)),
        Pose(.24, pelvis=(0, 0, -.11), spine=(.30, -.05, .035), ribs=(.07, .03, 0),
             left=(.10, .43, 1.22), right=(.62, -.19, 1.39), left_foot=(.12, .04, 0), right_foot=(-.09, -.05, .01)),
        Pose(.38, pelvis=(0, 0, -.035), spine=(-.10, .05, -.025), left=(.27, .38, 1.33)),
        Pose(.51), Pose(.59),
    ]),
    Clip("m10-cast-flashfire", [
        Pose(0),
        Pose(.06, pelvis=(.05, -.01, -.15), spine=(.35, -.35, -.035), ribs=(.15, -.10, 0),
             left=(.80, .14, 1.40), right=(.30, -.50, 1.10), right_wrist=(.55, -.35, 0), left_foot=(.10, .10, 0)),
        Pose(.14, pelvis=(.12, -.02, -.20), spine=(.55, -.40, -.07), ribs=(.18, -.10, 0),
             left=(.95, .10, 1.35), right=(.25, -.55, 1.00), right_wrist=(.70, -.40, 0),
             left_foot=(.16, .12, 0), right_foot=(-.08, -.10, 0)),
        Pose(.24, pelvis=(0, 0, -.18), spine=(.61, -.33, -.05), ribs=(.13, -.07, 0),
             left=(.98, .07, 1.22), right=(.27, -.52, 1.05), right_wrist=(.62, -.35, 0),
             left_foot=(.16, .12, 0), right_foot=(-.08, -.10, 0)),
        Pose(.40, pelvis=(0, 0, -.04), spine=(-.07, .08, 0), left=(.60, .22, 1.42), right=(.48, -.28, 1.31)),
        Pose(.60), Pose(.68),
    ]),
    Clip("m10-cast-napalm-charge", [
        Pose(0),
        Pose(.10, pelvis=(0, 0, -.10), spine=(-.15, .30, -.035), ribs=(-.08, .12, 0),
             left=(-.20, .32, 1.80), right=(.45, -.30, 1.12), right_wrist=(.55, -.20, 0)),
        Pose(.22, pelvis=(0, 0, -.13), spine=(-.25, .40, -.06), ribs=(-.10, .20, 0),
             left=(-.30, .25, 1.95), right=(.30, -.40, 1.10), right_wrist=(.65, -.25, 0),
             left_foot=(.08, .08, 0), right_foot=(-.12, -.08, 0)),
        Pose(.26, pelvis=(0, 0, -.13), spine=(-.25, .40, -.06), ribs=(-.10, .20, 0),
             left=(-.30, .25, 1.95), right=(.30, -.40, 1.10), right_wrist=(.65, -.25, 0),
             left_foot=(.08, .08, 0), right_foot=(-.12, -.08, 0)),
        Pose(.31, pelvis=(.10, -.02, -.15), spine=(.40, -.20, .04), ribs=(.16, -.10, 0),
             left=(.60, .10, 1.90), right=(.30, -.45, 1.08), right_wrist=(.70, -.30, 0), left_foot=(.15, .08, 0)),
        Pose(.38, pelvis=(.14, -.035, -.18), spine=(.65, -.34, .07), ribs=(.20, -.12, 0),
             left=(.95, .05, 1.40), right=(.28, -.49, 1.04), right_wrist=(.80, -.35, 0),
             left_foot=(.19, .09, 0), right_foot=(-.10, -.08, .025)),
        Pose(.50, pelvis=(0, 0, -.10), spine=(.30, -.40, .035), ribs=(.10, -.05, 0),
             left=(.60, -.30, 1.05), right=(.31, -.50, 1.10), right_wrist=(.65, -.30, 0)),
        Pose(.73), Pose(.85),
    ], impact=.26),
    Clip("m10-cast-meltdown", [
        Pose(0),
        Pose(.055, pelvis=(0, 0, -.27), spine=(.28, 0, 0), ribs=(.10, 0, 0), head=(.20, 0, 0),
             left=(.25, .20, 1.00), right=(.40, -.20, 1.00), right_wrist=(.45, 0, 0),
             left_foot=(.04, .16, 0), right_foot=(-.04, -.16, 0)),
        Pose(.14, pelvis=(0, 0, -.15), spine=(-.48, 0, 0), ribs=(-.20, 0, 0), head=(-.20, 0, 0),
             left=(-.20, .85, 1.05), right=(-.20, -.85, 1.05), right_wrist=(.10, -1.10, 0),
             left_foot=(.07, .18, 0), right_foot=(-.07, -.18, 0)),
        Pose(.26, pelvis=(0, 0, -.15), spine=(-.48, 0, 0), ribs=(-.20, 0, 0), head=(-.20, 0, 0),
             left=(-.20, .85, 1.05), right=(-.20, -.85, 1.05), right_wrist=(.10, -1.10, 0),
             left_foot=(.07, .18, 0), right_foot=(-.07, -.18, 0)),
        Pose(.40, pelvis=(0, 0, -.10), spine=(-.53, 0, 0), ribs=(-.15, 0, 0), head=(-.25, 0, 0),
             left=(-.30, .80, 1.20), right=(-.30, -.80, 1.20), right_wrist=(-.05, -1.0, 0)),
        Pose(.64, spine=(.08, 0, 0), left=(.18, .45, 1.27), right=(.35, -.40, 1.28), right_wrist=(.15, -.30, 0)),
        Pose(.83), Pose(.92),
    ]),
    Clip("m10-cast-static-step", [
        Pose(0),
        Pose(.045, pelvis=(.025, -.12, -.17), spine=(.22, -.60, .12), ribs=(-.06, .30, -.04),
             left=(.70, -.20, 1.40), right=(.35, .20, 1.55), right_wrist=(-.12, .60, 0),
             left_foot=(.14, -.13, .035), right_foot=(-.14, .10, 0)),
        Pose(.12, pelvis=(.05, -.14, -.19), spine=(.28, -.72, .15), ribs=(-.10, .36, -.05),
             left=(.74, -.24, 1.46), right=(.31, .26, 1.61), right_wrist=(-.18, .70, 0),
             left_foot=(.22, -.18, .065), right_foot=(-.20, .13, 0)),
        Pose(.23, pelvis=(0, 0, -.12), spine=(-.12, .43, -.10), ribs=(-.05, -.24, .03),
             left=(.10, .74, 1.55), right=(.66, -.26, 1.40), right_wrist=(-.08, -.18, 0),
             left_foot=(.10, -.04, 0), right_foot=(-.10, .03, .045)),
        Pose(.38, spine=(.055, -.10, .025), left=(.27, .46, 1.37), right=(.57, -.20, 1.39)),
        Pose(.53), Pose(.61),
    ]),
    Clip("m10-cast-overload", [
        Pose(0),
        Pose(.055, pelvis=(0, 0, -.12), spine=(.10, -.28, -.025), ribs=(-.10, -.08, 0),
             left=(.72, .28, 1.75), right=(.35, -.44, 1.15), right_wrist=(.60, -.25, 0)),
        Pose(.13, pelvis=(.075, -.015, -.15), spine=(.25, -.32, -.045), ribs=(-.16, -.10, 0),
             left=(.94, .10, 1.80), right=(.30, -.48, 1.10), right_wrist=(.72, -.30, 0),
             left_foot=(.13, .08, 0), right_foot=(-.08, -.07, 0)),
        Pose(.24, pelvis=(0, 0, -.16), spine=(.45, -.30, -.045), ribs=(-.10, -.08, 0),
             left=(.98, .02, 1.72), right=(.30, -.46, 1.12), right_wrist=(.67, -.27, 0),
             left_foot=(.15, .09, 0), right_foot=(-.10, -.07, 0)),
        Pose(.37, pelvis=(0, 0, -.08), spine=(-.12, .15, .03), ribs=(.04, .04, 0),
             left=(.55, .40, 1.60), right=(.46, -.28, 1.31), right_wrist=(.15, -.08, 0)),
        Pose(.58), Pose(.68),
    ]),
    Clip("m10-cast-tesla-pylon", [
        Pose(0),
        Pose(.10, pelvis=(0, 0, -.32), spine=(.65, -.20, .05), ribs=(.16, -.08, 0),
             left=(.45, -.25, .60), right=(.20, -.55, .90), right_wrist=(.95, -.25, 0),
             left_foot=(.12, .06, 0), right_foot=(-.17, -.08, .015), right_knee=(.10, -.28, .02),
             left_pole=(.10, -.82, 1.10)),
        Pose(.24, pelvis=(0, 0, -.48), spine=(.90, -.26, .08), ribs=(.20, -.08, 0), head=(.26, 0, 0),
             left=(.55, -.35, .17), right=(0, -.70, 1.15), right_wrist=(.50, -1.20, 0),
             left_foot=(.16, .07, 0), right_foot=(-.21, -.09, .015), right_knee=(.08, -.30, .02),
             left_pole=(.05, -.85, .78)),
        Pose(.31, pelvis=(0, 0, -.50), spine=(1.0, -.24, .07), ribs=(.18, -.05, 0),
             left=(.60, -.40, .08), right=(-.04, -.72, 1.15), right_wrist=(.48, -1.25, 0),
             left_foot=(.16, .07, 0), right_foot=(-.21, -.09, .015), right_knee=(.08, -.30, .02),
             left_pole=(.08, -.88, .75)),
        Pose(.45, pelvis=(0, 0, -.24), spine=(.36, .12, -.035), ribs=(.08, .04, 0),
             left=(.60, -.30, .80), right=(.20, -.58, 1.25), right_wrist=(.30, -.70, 0),
             left_foot=(.10, .05, 0), right_foot=(-.10, -.06, 0), left_pole=(.10, -.60, 1.0)),
        Pose(.65, spine=(-.05, .04, 0), left=(.40, .08, 1.30), right=(.52, -.24, 1.36)),
        Pose(.81), Pose(.90),
    ], impact=.24),
    Clip("m10-cast-overclock", [
        Pose(0),
        Pose(.065, pelvis=(0, 0, -.12), spine=(-.20, .35, -.04), ribs=(-.08, -.15, 0),
             left=(.40, .65, 1.75), right=(.40, -.60, 1.20), right_wrist=(.18, -.70, 0)),
        Pose(.17, pelvis=(0, 0, -.14), spine=(-.25, .55, -.07), ribs=(-.10, -.25, 0), head=(.02, -.20, 0),
             left=(-.05, .50, 1.95), right=(.65, -.40, 1.20), right_wrist=(.12, -.55, 0),
             left_foot=(.12, -.035, .025), right_foot=(-.12, .035, 0)),
        Pose(.29, pelvis=(0, 0, -.10), spine=(-.12, -.35, .06), ribs=(-.06, .20, 0), head=(-.04, .12, 0),
             left=(.60, .35, 1.80), right=(.40, -.65, 1.45), right_wrist=(-.15, -.40, 0),
             left_foot=(.05, .03, 0), right_foot=(-.05, -.03, .025)),
        Pose(.42, pelvis=(0, 0, -.08), spine=(.18, -.50, .035), ribs=(.05, .30, 0),
             left=(.75, -.10, 1.55), right=(.55, -.25, 1.50), right_wrist=(-.10, -.10, 0)),
        Pose(.65, spine=(-.045, .08, -.01), left=(.38, .32, 1.39), right=(.55, -.18, 1.40)),
        Pose(.81), Pose(.91),
    ]),
]


WEAPONS = [
    Clip("m10-fire-pistol", [
        Pose(0),
        Pose(.02, pelvis=(-.045, 0, -.025), spine=(-.12, -.035, -.025), ribs=(-.10, .025, 0),
             right_delta=(-.035, 0, .06), right_wrist=(-.12, 0, 0), left=(.12, .40, 1.12)),
        Pose(.055, pelvis=(-.07, -.01, -.035), spine=(-.18, -.055, -.035), ribs=(-.14, .03, 0),
             right_delta=(-.05, -.015, .085), right_wrist=(-.16, -.025, 0), left=(.08, .44, 1.10)),
        Pose(.12, pelvis=(.012, 0, -.015), spine=(.055, .02, .012), ribs=(.035, -.01, 0),
             right_delta=(.012, 0, -.025), right_wrist=(.045, 0, 0), left=(.16, .36, 1.14)),
        Pose(.23), Pose(.29),
    ], upper="blaster_delta"),
    Clip("m10-fire-rifle", [
        Pose(0),
        Pose(.02, pelvis=(-.035, -.005, -.025), spine=(-.09, .025, -.018), ribs=(-.08, -.02, 0),
             left_delta=(-.035, .025, .025), right_delta=(-.035, -.01, .025), right_wrist=(-.065, 0, 0)),
        Pose(.055, pelvis=(-.025, 0, -.02), spine=(-.065, -.02, .015), ribs=(-.05, .015, 0),
             left_delta=(-.025, .035, .015), right_delta=(-.025, -.015, .015), right_wrist=(-.04, 0, 0)),
        Pose(.11, pelvis=(.008, 0, -.005), spine=(.035, .015, -.008), ribs=(.025, -.01, 0),
             left_delta=(.012, .015, -.012), right_delta=(.012, 0, -.012), right_wrist=(.025, 0, 0)),
        Pose(.17), Pose(.21),
    ], upper="rifle_delta"),
    Clip("m10-fire-shotgun", [
        Pose(0),
        Pose(.02, pelvis=(-.10, -.015, -.075), spine=(-.22, .06, -.05), ribs=(-.20, .035, -.035),
             head=(.12, -.025, .02), left_delta=(-.10, .045, .10), right_delta=(-.10, -.02, .12),
             right_wrist=(-.25, 0, 0), left_foot=(.015, .035, 0), right_foot=(-.06, -.025, .015)),
        Pose(.065, pelvis=(-.12, -.02, -.09), spine=(-.27, .08, -.065), ribs=(-.17, -.025, -.025),
             head=(.13, .03, .025), left_delta=(-.12, .07, .10), right_delta=(-.12, -.025, .13),
             right_wrist=(-.28, -.025, 0), left_foot=(.02, .045, 0), right_foot=(-.09, -.03, .025)),
        Pose(.15, pelvis=(-.045, .015, -.06), spine=(.025, -.07, .035), ribs=(.08, -.035, .015),
             left_delta=(-.025, .10, .015), right_delta=(-.035, -.015, .02), right_wrist=(-.025, .015, 0),
             left_foot=(.015, .025, 0), right_foot=(-.045, -.015, 0)),
        Pose(.23, pelvis=(0, 0, -.02), spine=(.08, .035, -.015), ribs=(.04, .015, 0),
             left_delta=(.025, .035, -.02), right_delta=(.02, 0, -.025), right_wrist=(.055, 0, 0)),
        Pose(.36), Pose(.43),
    ]),
    Clip("m10-fire-plasma", [
        Pose(0),
        Pose(.035, pelvis=(-.035, .015, -.035), spine=(-.10, -.08, .025), ribs=(-.065, .045, -.015),
             left_delta=(-.03, .08, .025), right_delta=(-.045, -.01, .045), right_wrist=(-.08, -.025, 0)),
        Pose(.09, pelvis=(-.025, .025, -.025), spine=(-.075, -.10, .035), ribs=(-.045, .07, -.02),
             left_delta=(-.02, .11, .035), right_delta=(-.03, -.015, .025), right_wrist=(-.06, -.035, 0)),
        Pose(.18, pelvis=(0, 0, -.01), spine=(.045, .045, -.015), ribs=(.025, -.035, .01),
             left_delta=(.015, .05, -.01), right_delta=(.012, 0, -.015), right_wrist=(.025, .015, 0)),
        Pose(.29), Pose(.35),
    ], upper="prifle_delta"),
    Clip("m10-fire-rocket", [
        Pose(0),
        Pose(.02, pelvis=(-.10, -.015, -.13), spine=(-.20, -.08, -.06), ribs=(-.20, .04, -.04),
             head=(.14, .025, .035), left_delta=(-.09, .045, .09), right_delta=(-.10, -.02, .10),
             right_wrist=(-.20, 0, 0), left_foot=(.08, .08, 0), right_foot=(-.10, -.07, .015)),
        Pose(.08, pelvis=(-.14, -.025, -.16), spine=(-.28, -.10, -.07), ribs=(-.17, .07, -.025),
             head=(.16, -.03, .04), left_delta=(-.12, .07, .11), right_delta=(-.14, -.025, .12),
             right_wrist=(-.24, -.025, 0), left_foot=(.12, .10, 0), right_foot=(-.15, -.09, .025)),
        Pose(.15, pelvis=(-.11, -.02, -.14), spine=(-.22, -.06, -.04), ribs=(-.12, .035, -.015),
             left_delta=(-.09, .08, .08), right_delta=(-.10, -.015, .08), right_wrist=(-.17, 0, 0),
             left_foot=(.10, .08, 0), right_foot=(-.13, -.07, .01)),
        Pose(.23, pelvis=(0, 0, -.085), spine=(.035, .025, .015), ribs=(.025, -.01, .005),
             left_delta=(.01, .045, .01), right_delta=(.005, -.005, .01), right_wrist=(.015, .01, 0),
             left_foot=(.065, .05, 0), right_foot=(-.075, -.045, 0)),
        Pose(.30, pelvis=(0, 0, -.06), spine=(.12, .05, .025), ribs=(.06, -.025, .015),
             left_delta=(.03, .035, -.02), right_delta=(.025, 0, -.025), right_wrist=(.06, .015, 0),
             left_foot=(.035, .025, 0), right_foot=(-.04, -.025, 0)),
        Pose(.48), Pose(.56),
    ], upper="lcannon_delta"),
    Clip("m10-switch", [
        Pose(0),
        Pose(.075, pelvis=(0, 0, -.07), spine=(.25, -.15, .035), ribs=(.10, -.08, .025),
             head=(.08, -.08, 0), left=(.12, .32, 1.05), right=(.20, -.29, .94), right_wrist=(.65, -.12, .05)),
        Pose(.15, pelvis=(0, 0, -.10), spine=(.35, -.22, .045), ribs=(.13, -.10, .03),
             head=(.12, -.12, 0), left=(.04, .35, .95), right=(.12, -.30, .83), right_wrist=(.85, -.16, .07)),
        Pose(.20, pelvis=(0, 0, -.08), spine=(.22, -.12, .025), ribs=(.08, -.04, .02),
             left=(.24, .28, 1.08), right=(.34, -.23, 1.10), right_wrist=(.40, -.07, .025)),
        Pose(.29, pelvis=(0, 0, -.035), spine=(-.09, .08, -.025), ribs=(-.045, .035, -.015),
             left=(.47, .18, 1.42), right=(.59, -.15, 1.48), right_wrist=(-.12, .025, 0)),
        Pose(.39, spine=(.025, -.02, .01), left_delta=(.015, 0, -.02), right_delta=(.015, 0, -.025), right_wrist=(.035, 0, 0)),
        Pose(.49), Pose(.57),
    ]),
]


HITS = [
    Clip("m10-hit-back", [
        Pose(0),
        Pose(.045, pelvis=(.13, .015, -.085), spine=(.53, .10, .055), ribs=(.22, .06, .04),
             head=(-.20, -.08, -.035), left=(.73, .32, 1.10), right=(.79, -.18, 1.14),
             right_wrist=(.35, .08, 0), left_foot=(.16, .06, .06)),
        Pose(.095, pelvis=(.16, .02, -.11), spine=(.61, .13, .07), ribs=(.24, .06, .045),
             head=(-.23, -.10, -.04), left=(.80, .34, 1.04), right=(.85, -.20, 1.10),
             right_wrist=(.42, .10, 0), left_foot=(.23, .08, .09)),
        Pose(.20, pelvis=(0, 0, -.13), spine=(.20, -.08, -.035), ribs=(-.09, -.04, -.025),
             head=(-.10, .06, .02), left=(.66, .38, 1.21), right=(.70, -.22, 1.28), left_foot=(.29, .07, .025)),
        Pose(.31, pelvis=(0, 0, -.05), spine=(-.15, -.03, -.025), ribs=(-.06, .02, .015),
             head=(.07, .04, 0), left=(.48, .32, 1.34), right=(.56, -.20, 1.38), left_foot=(.16, .04, 0)),
        Pose(.45, spine=(.025, 0, 0)), Pose(.50), Pose(.56),
    ]),
    Clip("m10-hit-left", [
        Pose(0),
        Pose(.045, pelvis=(.015, -.14, -.075), spine=(-.08, -.13, .45), ribs=(-.04, -.08, .20),
             head=(.08, .10, -.17), left=(.16, .32, 1.62), right=(.57, -.52, 1.28),
             right_wrist=(.18, -.22, -.10), right_foot=(-.05, -.19, .06)),
        Pose(.095, pelvis=(.02, -.16, -.10), spine=(-.10, -.16, .53), ribs=(-.055, -.08, .24),
             head=(.10, .13, -.20), left=(.10, .36, 1.69), right=(.60, -.58, 1.23),
             right_wrist=(.22, -.25, -.13), right_foot=(-.07, -.25, .08)),
        Pose(.20, pelvis=(0, 0, -.12), spine=(.035, .08, .16), ribs=(.025, .035, -.08),
             head=(.04, -.06, -.09), left=(.29, .43, 1.46), right=(.59, -.38, 1.33), right_foot=(-.04, -.30, .025)),
        Pose(.31, pelvis=(0, 0, -.045), spine=(.025, .035, -.14), ribs=(-.015, -.015, -.06),
             head=(-.035, -.04, .07), left=(.35, .32, 1.35), right=(.55, -.25, 1.39), right_foot=(-.025, -.16, 0)),
        Pose(.45, spine=(0, 0, .025)), Pose(.50), Pose(.56),
    ]),
    Clip("m10-hit-right", [
        Pose(0),
        Pose(.045, pelvis=(.015, .14, -.075), spine=(-.08, .13, -.45), ribs=(-.04, .08, -.20),
             head=(.08, -.10, .17), left=(.15, .65, 1.38), right=(.43, -.02, 1.26),
             right_wrist=(.18, .22, .10), left_foot=(-.05, .19, .06)),
        Pose(.095, pelvis=(.02, .16, -.10), spine=(-.10, .16, -.53), ribs=(-.055, .08, -.24),
             head=(.10, -.13, .20), left=(.08, .72, 1.41), right=(.39, .05, 1.21),
             right_wrist=(.22, .25, .13), left_foot=(-.07, .25, .08)),
        Pose(.20, pelvis=(0, 0, -.12), spine=(.035, -.08, -.16), ribs=(.025, -.035, .08),
             head=(.04, .06, .09), left=(.28, .52, 1.39), right=(.50, -.08, 1.32), left_foot=(-.04, .30, .025)),
        Pose(.31, pelvis=(0, 0, -.045), spine=(.025, -.035, .14), ribs=(-.015, .015, .06),
             head=(-.035, .04, -.07), left=(.34, .34, 1.34), right=(.55, -.16, 1.39), left_foot=(-.025, .16, 0)),
        Pose(.45, spine=(0, 0, -.025)), Pose(.50), Pose(.56),
    ]),
]


DEATHS = [
    Clip("m10-death-back", [
        Pose(0),
        Pose(.08, pelvis=(.12, 0, -.10), spine=(.55, .08, .04), ribs=(.20, .04, .02), head=(-.20, -.06, 0),
             left=(.70, .25, 1.15), right=(.75, -.20, 1.18), right_wrist=(.35, 0, 0), left_foot=(.15, .04, .04)),
        Pose(.23, pelvis=(.16, 0, -.38), spine=(.80, -.06, -.025), ribs=(.20, .04, 0), head=(-.13, .05, 0),
             left=(.80, .28, .70), right=(.84, -.22, .74), right_wrist=(.65, -.10, 0),
             left_foot=(.09, .05, 0), right_foot=(-.13, -.06, .02), right_knee=(.12, -.26, .03)),
        Pose(.42, pelvis=(.20, -.02, -.72), spine=(1.12, -.09, -.06), ribs=(.20, .03, 0), head=(-.12, .06, 0),
             left=(1.0, .30, .22), right=(1.02, -.25, .24), right_wrist=(.90, -.12, -.05),
             left_foot=(-.15, .08, .04), right_foot=(-.20, -.08, .05), left_knee=(.12, .26, .03), right_knee=(.12, -.26, .03)),
        Pose(.64, pelvis=(.20, -.025, -.90), spine=(1.20, -.10, -.08), ribs=(.20, .035, 0), head=(-.12, .06, 0),
             left=(1.02, .32, .10), right=(1.05, -.28, .13), right_wrist=(1.0, -.15, -.07),
             left_foot=(-.18, .10, .04), right_foot=(-.24, -.10, .05), left_knee=(.10, .27, .025), right_knee=(.10, -.27, .025)),
        Pose(.86, pelvis=(.20, -.025, -.88), spine=(1.16, -.09, -.075), ribs=(.18, .03, 0), head=(-.10, .055, 0),
             left=(1.0, .32, .11), right=(1.03, -.28, .14), right_wrist=(.98, -.14, -.06),
             left_foot=(-.18, .10, .04), right_foot=(-.24, -.10, .05), left_knee=(.10, .27, .025), right_knee=(.10, -.27, .025)),
        Pose(1.08, pelvis=(.20, -.025, -.88), spine=(1.16, -.09, -.075), ribs=(.18, .03, 0), head=(-.10, .055, 0),
             left=(1.0, .32, .11), right=(1.03, -.28, .14), right_wrist=(.98, -.14, -.06),
             left_foot=(-.18, .10, .04), right_foot=(-.24, -.10, .05), left_knee=(.10, .27, .025), right_knee=(.10, -.27, .025)),
    ]),
    Clip("m10-death-left", [
        Pose(0),
        Pose(.08, pelvis=(.01, -.14, -.12), spine=(-.08, -.15, .45), ribs=(-.04, -.08, .20), head=(.08, .12, -.18),
             left=(.14, .50, 1.44), right=(.32, -.45, 1.12), right_wrist=(.30, -.20, -.08), right_foot=(-.04, -.17, .04)),
        Pose(.24, pelvis=(-.03, -.20, -.40), spine=(.30, -.20, .80), ribs=(.12, .04, .20), head=(.10, .13, -.10),
             left=(.20, .30, 1.12), right=(.40, -.60, .65), right_wrist=(.70, -.30, -.15),
             left_foot=(.15, .08, 0), right_foot=(-.17, -.17, .03), right_knee=(.08, -.36, .04)),
        Pose(.43, pelvis=(-.05, -.30, -.72), spine=(.45, -.24, 1.10), ribs=(.15, .06, .20), head=(-.08, .15, -.12),
             left=(.40, .10, .45), right=(.45, -.72, .20), right_wrist=(.85, -.38, -.25),
             left_foot=(.22, .12, .04), right_foot=(-.25, -.22, .05), right_knee=(.05, -.40, .03)),
        Pose(.65, pelvis=(-.06, -.32, -.89), spine=(.45, -.25, 1.28), ribs=(.13, .07, .18), head=(-.10, .15, -.10),
             left=(.40, .05, .30), right=(.44, -.75, .12), right_wrist=(.90, -.40, -.30),
             left_foot=(.26, .14, .04), right_foot=(-.29, -.25, .05), right_knee=(.05, -.42, .025)),
        Pose(.88, pelvis=(-.06, -.32, -.87), spine=(.42, -.23, 1.24), ribs=(.12, .065, .17), head=(-.08, .14, -.10),
             left=(.39, .05, .30), right=(.43, -.74, .13), right_wrist=(.88, -.38, -.28),
             left_foot=(.26, .14, .04), right_foot=(-.29, -.25, .05), right_knee=(.05, -.42, .025)),
        Pose(1.10, pelvis=(-.06, -.32, -.87), spine=(.42, -.23, 1.24), ribs=(.12, .065, .17), head=(-.08, .14, -.10),
             left=(.39, .05, .30), right=(.43, -.74, .13), right_wrist=(.88, -.38, -.28),
             left_foot=(.26, .14, .04), right_foot=(-.29, -.25, .05), right_knee=(.05, -.42, .025)),
    ]),
    Clip("m10-death-right", [
        Pose(0),
        Pose(.08, pelvis=(.01, .14, -.12), spine=(-.08, .15, -.45), ribs=(-.04, .08, -.20), head=(.08, -.12, .18),
             left=(.12, .65, 1.35), right=(.39, -.02, 1.20), right_wrist=(.30, .20, .08), left_foot=(-.04, .17, .04)),
        Pose(.24, pelvis=(-.03, .20, -.40), spine=(.30, .20, -.80), ribs=(.12, -.04, -.20), head=(.10, -.13, .10),
             left=(.32, .68, .65), right=(.42, .13, 1.00), right_wrist=(.65, .30, .15),
             left_foot=(-.17, .17, .03), right_foot=(.15, -.08, 0), left_knee=(.08, .36, .04)),
        Pose(.43, pelvis=(-.05, .30, -.72), spine=(.45, .24, -1.10), ribs=(.15, -.06, -.20), head=(-.08, -.15, .12),
             left=(.40, .75, .20), right=(.44, .19, .45), right_wrist=(.78, .38, .25),
             left_foot=(-.25, .22, .05), right_foot=(.22, -.12, .04), left_knee=(.05, .40, .03)),
        Pose(.65, pelvis=(-.06, .32, -.89), spine=(.45, .25, -1.28), ribs=(.13, -.07, -.18), head=(-.10, -.15, .10),
             left=(.40, .78, .12), right=(.44, .22, .30), right_wrist=(.85, .40, .30),
             left_foot=(-.29, .25, .05), right_foot=(.26, -.14, .04), left_knee=(.05, .42, .025)),
        Pose(.88, pelvis=(-.06, .32, -.87), spine=(.42, .23, -1.24), ribs=(.12, -.065, -.17), head=(-.08, -.14, .10),
             left=(.39, .77, .13), right=(.43, .22, .30), right_wrist=(.83, .38, .28),
             left_foot=(-.29, .25, .05), right_foot=(.26, -.14, .04), left_knee=(.05, .42, .025)),
        Pose(1.10, pelvis=(-.06, .32, -.87), spine=(.42, .23, -1.24), ribs=(.12, -.065, -.17), head=(-.08, -.14, .10),
             left=(.39, .77, .13), right=(.43, .22, .30), right_wrist=(.83, .38, .28),
             left_foot=(-.29, .25, .05), right_foot=(.26, -.14, .04), left_knee=(.05, .42, .025)),
    ]),
]


READY = [
    Clip("m10-ready-pistol", [Pose(0), Pose(.10)], upper="blaster_delta"),
    Clip("m10-ready-rifle", [Pose(0), Pose(.10)], upper="rifle_delta"),
    Clip("m10-ready-shotgun", [Pose(0), Pose(.10)]),
    Clip("m10-ready-plasma", [Pose(0), Pose(.10)], upper="prifle_delta"),
    Clip("m10-ready-rocket", [Pose(0), Pose(.10)], upper="lcannon_delta"),
]


ALL_CLIPS = STANDARD + CASTS + WEAPONS + HITS + DEATHS + READY


class MarineAuthor:
    """World-space animation controls attached only for authoring and baking."""

    BODY = ["hips", "spine", "ribs", "neck", "head", "shoulder.L", "shoulder.R"]
    CHAINS = ["upper_arm.L", "forearm.L", "hand.L", "upper_arm.R", "forearm.R", "hand.R",
              "thigh.L", "shin.L", "ankle.L", "foot.L", "thigh.R", "shin.R", "ankle.R", "foot.R"]

    def __init__(self, armature):
        self.arm = armature
        self.scene = bpy.context.scene
        self.scene.render.fps = FPS
        self.ready = self.capture_ready()
        self.current_upper = "shotgun_delta"
        self.restore()
        bpy.context.view_layer.update()
        world_points = []
        for obj in bpy.context.scene.objects:
            if obj.type == "MESH":
                world_points.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
        low = min(p.z for p in world_points)
        high = max(p.z for p in world_points)
        self.unit = (high - low) / 2.05
        pelvis = self.world("hips").translation
        self.anchor = Vector((pelvis.x, pelvis.y, low))
        self.hand_rest = {side: self.world(f"hand.{side}").copy() for side in ["L", "R"]}
        self.ankle_rest = {side: self.world(f"ankle.{side}").copy() for side in ["L", "R"]}
        self.controls = {}

    def capture_ready(self, upper="shotgun_delta"):
        actions = {action.name: action for action in bpy.data.actions}
        self.arm.animation_data_clear()
        for bone in self.arm.pose.bones:
            bone.matrix_basis.identity()
        self.arm.animation_data_create()
        self.arm.animation_data.action = actions["stand"]
        self.scene.frame_set(0)
        bpy.context.view_layer.update()
        ready = {bone.name: bone.matrix_basis.copy() for bone in self.arm.pose.bones}
        self.arm.animation_data.action = actions[upper]
        self.scene.frame_set(0)
        bpy.context.view_layer.update()
        ribs = self.arm.pose.bones["ribs"]
        upper = [ribs, *ribs.children_recursive]
        for bone in upper:
            ready[bone.name] = bone.matrix_basis.copy()
        self.arm.animation_data.action = None
        return ready

    def restore(self):
        for bone in self.arm.pose.bones:
            bone.rotation_mode = "QUATERNION"
            bone.matrix_basis = self.ready[bone.name].copy()
        bpy.context.view_layer.update()

    def world(self, name):
        return self.arm.matrix_world @ self.arm.pose.bones[name].matrix

    def position(self, metres):
        return self.anchor + Vector(metres) * self.unit

    def delta_rotation(self, angles):
        pitch, yaw, roll = angles
        return (Quaternion((0, 0, 1), yaw) @ Quaternion((0, 1, 0), pitch)
                @ Quaternion((1, 0, 0), roll))

    def rotate(self, name, angles):
        bone = self.arm.pose.bones[name]
        world = self.world(name)
        q = self.delta_rotation(angles) @ world.to_quaternion()
        bone.matrix = self.arm.matrix_world.inverted() @ Matrix.LocRotScale(world.translation, q, world.to_scale())
        bpy.context.view_layer.update()

    def translate(self, name, metres):
        bone = self.arm.pose.bones[name]
        world = self.world(name)
        world.translation += Vector(metres) * self.unit
        bone.matrix = self.arm.matrix_world.inverted() @ world
        bpy.context.view_layer.update()

    def empty(self, name):
        obj = bpy.data.objects.new(f"m10_{name}", None)
        obj.empty_display_type = "PLAIN_AXES"
        self.scene.collection.objects.link(obj)
        obj.rotation_mode = "QUATERNION"
        self.controls[name] = obj
        return obj

    def add_controls(self):
        for side, sign in [("L", 1), ("R", -1)]:
            hand = self.empty(f"hand_{side}")
            hand.matrix_world = self.hand_rest[side]
            elbow = self.empty(f"elbow_{side}")
            elbow.location = self.position((-.08, sign * .85, 1.16))
            ik = self.arm.pose.bones[f"forearm.{side}"].constraints.new("IK")
            ik.name = "m10_arm_IK"
            ik.target = hand
            ik.pole_target = elbow
            ik.chain_count = 2
            ik.use_tail = True
            ik.use_stretch = False
            wrist = self.arm.pose.bones[f"hand.{side}"].constraints.new("COPY_ROTATION")
            wrist.target = hand
            wrist.owner_space = wrist.target_space = "WORLD"

            ankle = self.empty(f"ankle_{side}")
            ankle.matrix_world = self.ankle_rest[side]
            knee = self.empty(f"knee_{side}")
            knee.location = self.position((.85, sign * .22, .52))
            ik = self.arm.pose.bones[f"shin.{side}"].constraints.new("IK")
            ik.name = "m10_leg_IK"
            # Retained imported knee axes are quarter-turned from the world pole.
            ik.pole_angle = -math.pi / 2
            ik.target = ankle
            ik.pole_target = knee
            ik.chain_count = 2
            ik.use_tail = True
            ik.use_stretch = False
            foot = self.arm.pose.bones[f"ankle.{side}"].constraints.new("COPY_TRANSFORMS")
            foot.target = ankle
            foot.owner_space = foot.target_space = "WORLD"

    def key(self, pose):
        frame = round(pose.time * FPS)
        self.scene.frame_set(frame)
        self.restore()
        self.translate("hips", pose.pelvis)
        self.rotate("spine", pose.spine)
        self.rotate("ribs", pose.ribs)
        self.rotate("head", pose.head)
        for name in self.BODY:
            bone = self.arm.pose.bones[name]
            bone.keyframe_insert("location", frame=frame, group=name)
            bone.keyframe_insert("rotation_quaternion", frame=frame, group=name)
            bone.keyframe_insert("scale", frame=frame, group=name)

        for side, hand_position, wrist_angles, foot_delta, elbow_position in [
            ("L", pose.left, pose.left_wrist, pose.left_foot, pose.left_pole),
            ("R", pose.right, pose.right_wrist, pose.right_foot, pose.right_pole),
        ]:
            hand = self.controls[f"hand_{side}"]
            hand.location = self.position(hand_position) if hand_position is not None else self.hand_rest[side].translation
            hand.location += Vector(pose.left_delta if side == "L" else pose.right_delta) * self.unit
            hand.rotation_quaternion = self.delta_rotation(wrist_angles) @ self.hand_rest[side].to_quaternion()
            knee = self.controls[f"knee_{side}"]
            knee_position = pose.left_knee if side == "L" else pose.right_knee
            knee.location = self.position(knee_position or (.85, .22 if side == "L" else -.22, .52))
            ankle = self.controls[f"ankle_{side}"]
            ankle.matrix_world = self.ankle_rest[side]
            ankle.location += Vector(foot_delta) * self.unit
            elbow = self.controls[f"elbow_{side}"]
            elbow.location = self.position(elbow_position or (-.08, .85 if side == "L" else -.85, 1.16 + pose.pelvis[2] * .6))
            for obj in [hand, ankle, elbow, self.controls[f"knee_{side}"]]:
                obj.keyframe_insert("location", frame=frame)
                obj.keyframe_insert("rotation_quaternion", frame=frame)
        bpy.context.view_layer.update()

    def action(self, clip):
        if self.current_upper != clip.upper:
            self.ready = self.capture_ready(clip.upper)
            self.current_upper = clip.upper
            self.restore()
            self.hand_rest = {side: self.world(f"hand.{side}").copy() for side in ["L", "R"]}
            self.ankle_rest = {side: self.world(f"ankle.{side}").copy() for side in ["L", "R"]}
        self.arm.animation_data.action = None
        self.restore()
        action = common.new_action(self.arm,clip.name,clip.duration,FPS)
        if clip.name.startswith("m10-cast-") and clip.impact is not None:
            action["m10_impact_seconds"] = round(clip.impact * FPS) / FPS
        self.scene.frame_start = 0
        self.scene.frame_end = round(clip.duration*FPS)
        self.add_controls()
        for pose in clip.poses:
            self.key(pose)
        # Actual Blender constraint evaluation generates the final bone keys.
        bpy.ops.object.select_all(action="DESELECT")
        self.arm.select_set(True)
        bpy.context.view_layer.objects.active = self.arm
        bpy.ops.object.mode_set(mode="POSE")
        for bone in self.arm.pose.bones:
            bone.select = bone.name in self.BODY or bone.name in self.CHAINS
        bpy.ops.nla.bake(frame_start=0, frame_end=round(clip.duration * FPS), step=1,
                         only_selected=True, visual_keying=True, clear_constraints=True,
                         clear_parents=False, use_current_action=True, clean_curves=True,
                         bake_types={"POSE"})
        bpy.ops.object.mode_set(mode="OBJECT")
        for obj in self.controls.values():
            bpy.data.objects.remove(obj, do_unlink=True)
        self.controls.clear()
        self.arm.animation_data.action = None
        self.restore()
        print(f"M10_AUTHORED {clip.name} duration={clip.duration:.3f} impact={clip.impact} fps={FPS}")
        return action


def author(armature, clips=STANDARD):
    marine = MarineAuthor(armature)
    return [(clip, marine.action(clip)) for clip in clips]


def main():
    # Shared import/export preserves source node names and bind-local matrices.
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import common
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=OUTPUT)
    parser.add_argument("--standard", action="store_true", help="Build only the five reviewed standard clips")
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    args = parser.parse_args(argv)
    bpy.context.preferences.edit.keyframe_new_handle_type = "AUTO_CLAMPED"
    armature = common.import_existing(SOURCE)
    clips = author(armature, STANDARD if args.standard else ALL_CLIPS)
    common.export_motion(armature, args.out, [action.name for _, action in clips])


if __name__ == "__main__":
    main()
