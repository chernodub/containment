# VALUE14 — Creature value and hostile warnings

Creatures use a cool Fresnel rim and a dorsal lift in their existing actor shader. The lift is weighted toward upper shell surfaces and reduced on limbs. Emission keeps the authored mask and takes its colour from the family. Crawler is hot pink, Stalker violet, Spitter acid green, Brute bone-yellow and Carrier orchid. Elites retain their sculpted rank detail, gain a pale crest and a brighter lantern, and use the ordinary creature contour. Priority targets keep a pale crown marker, and control resistance keeps its small overhead shield.

Warnings use the existing depth-tested ground batch. Shapes still clip to the circles, melee sectors and capsules supplied by gameplay. The fragment takes the strongest fill where shapes overlap. Within each existing connected group, the earliest strike contributes the leading edge. The fill becomes prominent over the final 300 ms and shares the existing screen coverage limit. Hostile shots and active off-screen indicators use the same red. The first-strike lesson uses the world decal and keeps its dodge hint. Red-orange remains in the low-health, damage and destructive-action UI and the opt-in collider overlay. Those uses are separate from the new hostile red. Neutral credits and title highlights use pale amber-white, Breacher uses yellow-amber, and Pyro fire effects have a gold-orange core. Friendly ground markers and the marine reticle keep their cool treatment.

High and Low use the same retained actor and warning materials through existing preparation. There are no new passes, draws or texture reads. The actor lift and crest add fragment arithmetic proportional to visible creature pixels. The warning shader removes per-shape outlines, hatch and derivative work, and evaluates the moving edge only for the first strike of each group. Cost can still increase when large warning bounds cover many screen pixels simultaneously.

## Desktop verification

The gallery is at `artifacts/nextgen/value14-final/index.html`. The paired captures use the original `dd621898` build and the `a557348b` presentation build on ANGLE Metal. The cases reuse native staging with identical seed and viewport. They cover calm and attack poses for the five families in Relay Racks, Swarm Junction and Crew Checkpoint, a mixed twenty-enemy crowd in each room, the four tactical overlap cases and the dedicated Napalm overlap. The gallery has 194 matched native frames per build, plus 480 × 270 colour and Rec.709 greyscale views. Each scenario also has a native greyscale frame.

The standard Pyro run at seed 1729 reached the runner’s one-hour wall limit in Infested Workshop after 14 room clears. It recorded zero errors and one room-load delay above five seconds during heavy host contention. The native fast-rendering retry cleared all 20 rooms with zero errors. It used the same seed, rig, native inputs and fixed simulation clock, with intermediate GPU submissions skipped. Both campaign traces and reports are in the gallery. The final type-check and production build passed.

The remaining weak reads are the smallest Crawler silhouettes and the thin Stalker limbs, especially over Crew Checkpoint’s lightest deck sections. Brute and Spitter are easier to read by shape and lantern. At 480 × 270, Crawler hot pink and Carrier orchid benefit from their different body shapes.

### Timing and shader preparation

The first eight-second timing attempt ended before the driver had accepted every ability in both builds. The longer Relay Racks Pyro comparison used fixed resolution, at least five simulated seconds, and one trace per build and tier. All four traces accepted the same ability counts and recorded zero mid-combat shader compilations and zero WebGL errors.

| Tier | Frame p50 / p95 before (ms) | Frame p50 / p95 after (ms) | GPU sample p50 before / after (ms) |
|---|---:|---:|---:|
| High | 34.4 / 92.5 | 42.7 / 108.6 | 71.5 / 67.7 |
| Low | 17.5 / 59.9 | 24.1 / 50.6 | 24.2 / 43.6 |

The observed median frame times rose with baseline host load around 54–64 and final load around 72–80 on ten cores. The samples establish warm-up coverage in the measured encounter. Frame-cost parity remains unverified on this contended host. See the full benchmark JSON in the gallery.
