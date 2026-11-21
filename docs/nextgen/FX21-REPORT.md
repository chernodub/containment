# FX21 combat readability

## Diagnostic Gallery baseline

The baseline distribution was built from `064f0acd`. The fresh eleven-room Pyro campaign uses seed 1729, the competent policy and fast rendering. Its room-pressure frames are in `artifacts/nextgen/playtest/fx21-before/`. The full-rate storyboard uses the earned final12 Transmission Chamber clear checkpoint and is in `artifacts/nextgen/playtest/fx21-before-board/`. The capture runner places all four staged overlap sequences in `artifacts/nextgen/fx21-before/`.

At 480×270 my first-glance counts of identifiable winding-up enemies in Diagnostic Gallery storyboard frames 035, 037 and 039 were **0, 1 and 1**. Frame 035 contains several damage numbers over fire but no committed attacker. In 037 I could follow the vertical red lane to its owner. In 039 the diagonal lane identifies the attacker despite the orange patches around both ends. The native snapshots record 0, 1 and 1 active wind-ups. This is a single observer's reading, without an independently timed player trial.

The original final12 pressure snapshot records one stalker already striking and zero enemies still winding up. Its marker is visible, but the overlapping spotted pools make individual bodies difficult to follow. Counting it as a missed wind-up would conflate two attack phases.

## What changed

The priority mask follows a committed melee attack from wind-up through strike and recovery. It projects a capsule over the body and another along the locked attack angle. Ranged wind-ups and charges use their native aim vectors. The green distance channel suppresses about 65% of friendly opacity across the limb, with stronger suppression on the existing body and exact warning contour. Ground shaders flatten patterned detail there. The shooter keeps its gap during its short fading stroke. A one-metre band around the native warning contours and hazard projectiles cuts local friendly brightness by about half before the stronger central mask takes over.

Napalm leaves a dark bed with a broad amber lip. Three standing flames on High and two on Low rise from its outer half. Meltdown has a rolling rim around the moving burn area and hot vents attached to the suit. One flame travels up a burning creature from the side of impact and brightens on each native tick. Hostile lane fronts, shooter strokes and projectile rims share saturated red. A projectile carries a thin white inner ring. Warnings and shooter strokes retain draw order 30, and the projectile stays in the priority scene at 40.

Railbreaker's white spine is three times wider and persists briefly into its coloured wake. Each victim flashes on contact and leaves a skid from its point on the beam to its landing. Overload's last native link carries two bright branches that reunite at the same moving limb. The pre-cast endpoint diamond remains. Overclock slows hostile time and can accompany an Overload cast. Its activation has no enemy hit list or terminal victim of its own.

The changes reuse the prepared procedural surface, atlas, ribbon, projectile and priority-mask materials. Light allocation and shader preparation are unchanged. The renderer sources are `PriorityMask.ts`, `FlagshipFx.ts`, `GraphicLanguage.ts`, `EffectAtlas.ts`, `AttackEffects.ts`, the Pyro, Arc and system presentation modules, and `MasteryHints.ts`.

## Comparison and budgets

The after counts on the same three storyboard frames were **0, 1 and 1**. Each pair has the same simulation time and active wind-up IDs. The count was already at the ceiling for these frames. In frame 039 I could follow the diagonal red lane across three overlapping fuel patches to the white-outlined stalker at its upper-right end and distinguish the nearby brute. In 037 the lane is clear on both builds. The 1920×1080 originals and 480×270 comparisons are in the before/after board directories and `fx21-after/review/windups-035-037-039.png`.

| Communal Atrium overlap | Peak draws before | Peak draws after | Resident programs before / after |
| --- | ---: | ---: | ---: |
| Pyro | 139 | 138 | 151 / 151 |
| Arc | 136 | 136 | 151 / 151 |
| Cryo | 135 | 135 | 151 / 151 |
| Breacher | 143 | 143 | 151 / 151 |

No individual overlap frame increased in draw calls. Each manifest has eight 1920×1080 observations per rig. The red shooter stroke remains visible across the Arc links, and the red sector remains visible under Cryo and Breacher. In Pyro the muzzle and splash still give a strong opening flash. The warning lane and its owner remain distinct during the lingering burn. These are staged renderer counts on Apple M1 Pro / ANGLE Metal.

The extended Overload capture follows five real hits. The last victim carries the 31-damage number. In `fx21-after/v2-overload-awakening-bay-08.png`, the incoming link has faded and the two short tines meet on its forelimb. The final fork is fitted to the victim's collision radius and faces inward. The late-frame check exposed an earlier version whose fork spread toward the preceding victim.

The original final12 pressure PNG and its snapshot are preserved in `fx21-before/final12-reference/`. The fresh native run reproduced Diagnostic Gallery and cleared all eleven rooms, but its peak pressure occurred at 308.400 s rather than the archived 306.650 s. Peak-pressure screenshots describe the fight the bot played on each run. The frame-by-frame visual comparison above uses the checkpoint storyboards and matched timestamps.

## Native desktop verification

The final production build passed TypeScript and Vite. The final gallery is `artifacts/nextgen/fx21-after/`, built from `f5bd4285`. It contains 72 verified frames, zero capture failures and zero captured errors. Both eleven-room Pyro runs cleared Diagnostic Gallery with zero errors. The fresh after pressure peak landed at 299.550 s. Neither fresh peak caught an active wind-up, which is why the matched storyboard frames carry the count. The full-rate checkpoint runs also cleared the room. Their individual PNGs, native snapshots, and 12-panel storyboards are in `playtest/fx21-before-board/` and `playtest/fx21-after-board/`.

The Communal Atrium combat bench recorded zero new shader programs and zero GL errors in each rig on High and Low. Peak bench draws (Low / High) were Pyro 154 / 165, Arc 163 / 175, Cryo 151 / 159 and Breacher 146 / 155. The source reports are `fx21-bench/benchmark.json` and `fx21-endpoint-bench/benchmark.json` for the final Arc geometry. These runs each observed at least four simulated seconds. Concurrent desktop work affected wall timings.

Both six-room campaigns on the final build cleared with zero runtime errors. The opening and closing inventory in each fight matched at 161, 154, 149, 156, 155 and 155 programs in room order. During concurrent verification, the harness flagged two room loads over five seconds for Pyro and three for Arc and returned a nonzero exit status. These records are in `playtest/fx21-verified-pyro/` and `playtest/fx21-verified-arc/`. The eleven-room after run also flagged three room loads and the checkpoint after run flagged one.

The sequential reruns on the same final build both exited successfully. Pyro and Arc each cleared six rooms with zero errors, zero reported defects and flat program counts within all six fights. Their reports are in `playtest/fx21-serial-pyro/` and `playtest/fx21-serial-arc/`.

## Remaining weaknesses

Overlapping Napalm pools can look like interlocking gold circles. Their dark interiors expose the targets, but the continuous rims are smoother than a spreading fuel burn. Railbreaker's long perpendicular skids connect the two thrown brutes to the shot, but in a side-by-side landing they read as broad parallel stripes. Both are visible at 480×270 in the overlap and beam comparison sheets.

## Overlapping burns and Railbreaker landings

The circular Napalm and Meltdown surfaces share the minimum signed distance to all live burn discs. Each deck pixel is shaded by the deepest disc, with stable ownership for coincident boundaries. A hot edge can appear only at the outside of the merged patch. The renderer also omits the individual friendly circle outlines for these pools. World-space noise varies the width, position and brightness of the coal edge across disc boundaries. The centre has a few isolated glowing fissures. Short upright flames and embers sit along exposed edges and inside the burn. An enemy preparing or finishing its attack suppresses nearby embers and shortens the flames around it.

Railbreaker leaves a tapered scrape at touchdown. Its length is limited to the shorter of the throw distance and roughly one body length. The scrape is strongest beside the body and fades back along the throw. The pooled decal stays at the landing while the dust clears. In frame 08 the two landing marks are visible at the brutes' feet against the wall.

The revised gallery is `artifacts/nextgen/fx21-after2/`. In `review/windups-035-037-039.png` the columns show the baseline, first FX21 pass and revision. Each panel is 480×270. Frames 035, 037 and 039 match across all three builds at 306.650, 307.600 and 308.600 simulation seconds. The visible wind-up counts remain 0, 1 and 1. In 039 the red lane crosses the dark centre between the brute and the outlined stalker. The three interior gold arcs have disappeared. The sheets named `review/windup-035-native.png`, `review/windup-037-native.png` and `review/windup-039-native.png` preserve native pixels. The source storyboard is in `artifacts/nextgen/playtest/fx21-after2-board/`. The overlap and landing comparisons are `review/pyro-overlap.png` and `review/rail-landing.png`.

| Eight-frame capture | Peak draws, first pass | Peak draws, revision | Programs on both builds |
| --- | ---: | ---: | ---: |
| Pyro overlap | 138 | 137 | 151 |
| Napalm Charge | 123 | 122 | 158 |
| Meltdown | 125 | 124 | 158 |
| Railbreaker | 129 | 129 | 158 |

Removing the individual pool outlines saved one draw in the last four Pyro overlap frames. The other four matched the first pass. The new skid uses the existing decal material and pool. Shader preparation and the light inventory are unchanged.

The production build passed. Both seed 1729 Pyro runs cleared their requested rooms (six and eleven) with zero errors and zero reported defects. The six-room run opened and closed each room with the same program count (161, 154, 149, 156, 155 and 155 respectively). Diagnostic Gallery held at 151. The Low and High Pyro benchmarks each recorded zero new combat programs and zero GL errors. The six-room report is in `artifacts/nextgen/playtest/fx21-after2-final-pyro/report.json`; the benchmark is in `artifacts/nextgen/fx21-after2-final-bench/benchmark.json`.
