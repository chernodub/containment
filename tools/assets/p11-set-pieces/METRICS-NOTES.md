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

All twelve authored packs (four E9, eight P11) currently have one 512×512 normal
atlas each. Manifest `normalAtlas.estimatedRGBA8MipBytes` is 1,398,101 bytes per
pack (~1.333 MiB, conservative rounded RGBA8 mip estimate). Across all twelve,
16,777,212 bytes (~16 MiB). These are estimates of distinct atlas storage, not a
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
| relay-racks | clinical, industrial, security, structure | comms-engineering, service-kit | 8.000 |
| transmission-chamber | clinical, industrial, security, structure | control, service-kit | 8.000 |
| diagnostic-gallery | clinical, structure | control, service-kit | 5.333 |
| safety-interlock-station | clinical, security, structure | control, service-kit | 6.667 |
| coolant-plant | industrial, security, structure | maintenance-containment, service-kit | 6.667 |
| service-shaft-landing | clinical, industrial, security, structure | maintenance-containment, service-kit | 8.000 |
| infested-workshop | clinical, industrial, structure | infested, service-kit | 6.667 |
| swarm-junction | industrial, structure | infested, service-kit | 5.333 |
| shielding-gate | clinical, industrial, security, structure | maintenance-containment, service-kit | 8.000 |
| containment-annulus | clinical, industrial, security, structure | maintenance-containment, service-kit | 8.000 |
| manual-control-chamber | clinical, industrial, security, structure | control, service-kit | 8.000 |
| overload-floor | clinical, industrial, structure | control, service-kit | 6.667 |

## Asset budget facts

Service family triangles: cable tray 252, access hatch 332, transit case 604,
stowage crate 604, pressure drum 694, safety rail 244, three-step 264,
console bars 630, console schematic 632, valve manifold 1,472. All ≤1,500.
Cargo heroes: freight suspension gantry 6,474; wedged loading pod 4,484 (≤12,000).
E9 pack totals after craft pass: structure 2,792; security 6,984; clinical 19,980;
industrial 23,692. Ordinary modules ≤1,500. Six retained landmark-class assets
exceed the ordinary-module target: scanner 2,256, analyser 2,868, uplink dish
8,980, hoist 2,604, tool bridge 4,696, airway exchanger 6,056. They remain ≤12k;
do not claim every named mesh asset is ≤1.5k.

Six rebuilt GLB sizes: structure 481,416; security 805,260; clinical 1,375,800;
industrial 1,627,996; cargo 987,660; service 703,444 bytes. All below 2,000,000.
For the other P11 pack totals, use their current `manifest.json` records rather
than copying values from an earlier review round. Normal maps split shared finish
batches by source pack because each pack owns different UVs; final measured draws
must reflect this rather than the earlier texture-free merge estimate.
