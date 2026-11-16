# P11 metrics handoff facts

Sources: `artifacts/nextgen/p11-final/before/e10-benchmark.json` and
`e10-preparation.json`, copied from the final E10 gallery's `benchmark/` folder
at `/Users/chernodub/.t3/worktrees/containment-game/t3-819e67f1/artifacts/nextgen/e10-final/`.
Both record source SHA `086a4d8b122a74649e3a52924f5499f678de4ae7`.
These are E10 final numbers, not the separate E10 `benchmark-before/` evidence.

Exact JSON fields: benchmark `runs[].room`, `.rig`, `.tier`, `.repeat`,
`.summary.draws.max`, `.summary.triangles.max`, `.programs` (combat creations),
`.programInventory`, `.before.load`, `.after.load`. Each row is Cryo / High /
repeat 0, 12 seconds at 1920×1080, seed 1729. The normal benchmark fixture starts
with 25 enemies; it is separate from the requested 20-enemy kiting screenshot.
Preparation fields: `rows[].room`, `.mode == "fresh"`, `.total` (public readiness
hold in milliseconds), `.resources.textures` (count), `.combatCompiles`, and
`.postReadyCompiles`. Nested `.preparation[].total` measures a different interval;
do not silently substitute it for the public hold.

Neither JSON contains full GPU texture-memory bytes. Texture count is not MiB,
and JS heap/CDP memory is not GPU texture memory. E10-REPORT.md provides only
bounded floor estimates: 24.25 High / 6.25 Low MiB normally; 40.25 / 10.25 for
Relay, Transmission, Coolant, Shielding and Containment. Those estimates exclude
actors, attachments, other kits, retained tier images and driver overhead.

E10 used the older marine and creatures, while P11 merges the new actor models.
Live draw/triangle maxima include actors, VFX, lighting/post and dynamic camera
visibility; they are useful whole-build before/after measurements, not a causal
measurement of prop cost alone. Timing also depends on shared-host contention and
adaptive scale. E10 before-trial one-minute loads ranged 13.4–31.6 on ten logical
cores; it failed the 20ms frame-p95 target in all twenty rooms despite zero
resource-budget failures. Report P11's actual host load and do not certify timing.

## E10 per-room baseline

| Room ID | Draws max | Triangles max | Texture count | Ready ms |
|---|---:|---:|---:|---:|
| awakening-bay | 192 | 995652 | 125 | 1613.1 |
| passenger-vault | 160 | 787270 | 130 | 1056.1 |
| residential-gallery | 156 | 789017 | 117 | 1118.6 |
| communal-atrium | 163 | 709470 | 126 | 1149.4 |
| crew-checkpoint | 157 | 851127 | 117 | 1281.3 |
| armory | 217 | 763003 | 117 | 1219.8 |
| freight-hold | 157 | 727345 | 117 | 1233.4 |
| breached-loading-bay | 168 | 747740 | 122 | 1146.3 |
| relay-racks | 169 | 777537 | 120 | 953.3 |
| transmission-chamber | 149 | 803415 | 120 | 1341.0 |
| diagnostic-gallery | 154 | 860205 | 118 | 1012.9 |
| safety-interlock-station | 277 | 885717 | 119 | 1209.2 |
| coolant-plant | 157 | 769374 | 120 | 1110.4 |
| service-shaft-landing | 166 | 761140 | 119 | 947.7 |
| infested-workshop | 208 | 846976 | 120 | 1371.4 |
| swarm-junction | 151 | 758485 | 117 | 1212.5 |
| shielding-gate | 232 | 792239 | 120 | 1373.7 |
| containment-annulus | 155 | 782428 | 122 | 1299.7 |
| manual-control-chamber | 197 | 713976 | 120 | 986.5 |
| overload-floor | 158 | 733544 | 124 | 1387.6 |

## Matching existing CLI

Use explicit rooms: omitting them, or supplying `--scan`, makes the benchmark
rank rooms and select only two. No new harness or tests are needed.

```sh
npm run bench -- --label=p11-final-bench --rooms=awakening-bay,passenger-vault,residential-gallery,communal-atrium,crew-checkpoint,armory,freight-hold,breached-loading-bay,relay-racks,transmission-chamber,diagnostic-gallery,safety-interlock-station,coolant-plant,service-shaft-landing,infested-workshop,swarm-junction,shielding-gate,containment-annulus,manual-control-chamber,overload-floor --rigs=cryo --tiers=high --seconds=12 --repeat=1
npm run bench:rooms -- --label=p11-final-preparation --rooms=awakening-bay,passenger-vault,residential-gallery,communal-atrium,crew-checkpoint,armory,freight-hold,breached-loading-bay,relay-racks,transmission-chamber,diagnostic-gallery,safety-interlock-station,coolant-plant,service-shaft-landing,infested-workshop,swarm-junction,shielding-gate,containment-annulus,manual-control-chamber,overload-floor --modes=fresh
```

For an already frozen production snapshot, append `--no-build --dist=<absolute-dist>
--dist-source-sha=<exact-source-SHA>`. Run sequentially with the sole browser;
High/Low coverage can be a separate invocation with `--tiers=high,low`, retaining
High for the directly matching table. Preparation defaults include the legacy
reactor-vault, hence the explicit twenty IDs above are required.

## Normal-atlas storage and source packs

All fourteen authored packs (four E9, ten P11) currently have one 512×512 normal
atlas each. Manifest `normalAtlas.estimatedRGBA8MipBytes` is 1,398,101 bytes per
pack (~1.333 MiB, conservative rounded RGBA8 mip estimate). Across all fourteen,
19,573,414 bytes (~18.667 MiB). These are estimates of distinct atlas storage, not a
GPU-process measurement. AO and curvature are vertex colors; geometric normals
plus the selected-to-active tangent-normal atlas supply surface relief. GLBs embed
the PNG; the external PNG is a rebuild/review resource, not a second runtime image.
Caches can retain previously visited source packs, so per-room source requirements
below are not the whole session's residency. Low currently omits service geometry
through drawRange, but retains warmed buffers/materials/textures and therefore
has the same normal-atlas storage requirement as High.

The table evaluates the current furnishing recipes and P11 placement mappings.
Structure is always needed; stock packs are those actually requested by furnishing
recipes (plus existing suspended landmarks). P11 service is absent from Passenger
Vault because no eligible far-side roof/wall support exists. Other rooms have one
or two service candidates; candidates replaced by a hero can be skipped at runtime.
Treat this as source requirements, not an assertion of every object's visibility.

| Room | E9 packs | P11 packs | Normal atlas MiB bound |
|---|---|---|---:|
| awakening-bay | clinical, structure | clinical-security, service-kit | 5.333 |
| passenger-vault | clinical, structure | clinical-security | 4.000 |
| residential-gallery | clinical, structure | habitation, service-kit | 5.333 |
| communal-atrium | clinical, security, structure | habitation, service-kit | 6.667 |
| crew-checkpoint | security, structure | clinical-security, service-kit | 5.333 |
| armory | security, structure | clinical-security, service-kit | 5.333 |
| freight-hold | industrial, security, structure | cargo, service-kit | 6.667 |
| breached-loading-bay | industrial, security, structure | cargo, service-kit | 6.667 |
| relay-racks | clinical, industrial, security, structure | comms-engineering, service-kit, incidents | 9.333 |
| transmission-chamber | clinical, industrial, security, structure | control, service-kit | 8.000 |
| diagnostic-gallery | clinical, structure | control, service-kit | 5.333 |
| safety-interlock-station | clinical, security, structure | control, service-kit | 6.667 |
| coolant-plant | industrial, security, structure | maintenance-containment, service-kit | 6.667 |
| service-shaft-landing | clinical, industrial, security, structure | maintenance-containment, service-kit, incidents | 9.333 |
| infested-workshop | clinical, industrial, structure | infested, service-kit, incidents | 8.000 |
| swarm-junction | industrial, structure | infested, service-kit, incidents | 6.667 |
| shielding-gate | clinical, industrial, security, structure | maintenance-containment, service-kit, incidents | 9.333 |
| containment-annulus | clinical, industrial, security, structure | maintenance-containment, service-kit, incidents | 9.333 |
| manual-control-chamber | clinical, industrial, security, structure | reactor, service-kit | 8.000 |
| overload-floor | clinical, industrial, structure | reactor, service-kit | 6.667 |

## Asset budget facts (second craft pass)

Current source-specific review is `KIT-CRAFT-REVIEW.md`. All ten service pieces
were revised and remain ≤1,500 triangles (336–1,176); freight hero 9,926 and
loading hero 5,982 remain ≤12,000. Original E9 ordinary modules remain ≤1,500;
six retained landmark-class exceptions are explicitly listed in that review.
Current per-pack totals and output bytes follow from final manifests/GLBs.

| Pack | Triangles | GLB bytes |
|---|---:|---:|
| structure | 3344 | 509692 |
| security | 8480 | 948612 |
| clinical | 21944 | 1522436 |
| industrial | 24992 | 1694780 |
| cargo | 15908 | 1437260 |
| service-kit | 7572 | 884660 |

All six GLBs are below 2,000,000 bytes. Normal maps split shared finish batches by
source pack because each pack owns different UVs; measured draws must reflect
this rather than the earlier texture-free merge estimate. Control now owns three
heroes and reactor owns Manual Control/Overload; each room still needs one of
those two packs, so its per-room atlas bound is unchanged by the split.

R11 adds `incidents` (six models) to the six rooms shown above. Its final
geometry/file totals await the ongoing rebuild; atlas ownership is already
recorded as one additional 512-square atlas. See `docs/nextgen/plans/P11-R11-review.md`.
