# E10 — floors, light and depth

Branch `t3/e10-floors-light-depth`. Original floor library and runtime presentation are implemented. Integration timing certification remains separate from this shared-host run.

## Assets and runtime

Ten original Blender/Cycles selected-to-active deck bakes ship in `public/assets/e10-floors/`: four 2.8m variants per environment, tangent normal, base colour and packed AO/roughness; shared kickplate trim and modelled wear/marking atlas. The generating scripts and MIT provenance are under `tools/assets/e10-floors/`. High uses 1024² maps and Low 512², with shared trim 512/256. Lossless WebP payload is recorded with SHA256 in the asset manifest. These are actual high-to-low geometry bakes, not procedural noise substituted for modelling.

Existing clipped named-space deck meshes own the materials. Static triangle splits give the atlas ordinary continuous UVs; they preserve the authored hull, solids, voids and skin heights below .022m. Main plates and service-lane tread are separate material families where appropriate. Placed boot/trolley exit routes, breach scorch/acid, chipped thresholds and dragged-case scuffs are composed once during readiness; the fight circle attenuates their contrast. The existing ink/banded pipeline remains active.

Each room has flush glass/grate covers over actual half-metre service cavities, pipes, collars and captive light below. Original overhead assemblies use environment-specific pressure canisters, domestic shades, cargo winches, cable trays, valve racks, heat fins, rooted pipework or shield lenses. Original cutaway ownership removes intersecting metal ranges around full actor silhouettes. Low retains floors, wear, static light and recessed hardware, while dropping additional ceiling assemblies.

The 256² room light field bakes motivated ceiling pools, hull/void enclosure, exit emphasis, violet containment spill and localized amber status spill during preparation. It adds no realtime lights and replaces per-pixel pool loops. Existing pooled practicals remain bounded. Actors leave the architecture shadow pass and use small low-opacity soft contacts; native pool resets and prepared weapon meshes reapply that policy. Architecture shadows are near-vertical, lighter and soft, with floor colour/fill retained underneath. Static room shadow maps update on invalidation rather than every 30Hz.

Warning rooms show at most one face. Selection prioritizes a complete quad inside the measured HUD reservation; native RGBA vertex alpha removes duplicate text and casing. Diagnostic's existing instrument gantry supplies its overhead feature; Safety and Manual use their connected warning cable trays. The correction keeps fatal text, actual quad metadata and full-body clearance together.

No gameplay cover or colliders were added in any room (zero of the allowed three). Existing solid machinery and wall furniture remain authoritative. Walking covers are presentation-only; no new piece narrows the existing lanes. Actors/motion, UI, abilities, attack tuning and bot policy were not edited. Sparse checkout remains enabled. No tests or test infrastructure were added.

## Per-room change inventory

All rows include placed wear, static pool/fill falloff, exit emphasis and the shadow policy above. “Glass” means a flush translucent cover over a real pipe cavity; “grate” means a flush bar cover with visible light below. Cover addition is 0 throughout.

| Room | Floor family / service finish | Depth and room-specific work | Key, fill and accents |
|---|---|---|---|
| Awakening Bay | Cryogenics split plates, captive hatches | Glass channels; suspended canister rack | Cold ceiling pools, blue fill, cyan instruments |
| Passenger Vault | Cryogenics split plates and worn trolley aisle | Glass channels; canister racks over occupied pods | Cold key, blue fill, cyan pod chain |
| Residential Gallery | Habitation narrow panels and warm thresholds | Glass channels; paired domestic pendant shades; centre receives panel relief/pools | Warm key, cool corner fill, amber bedside/exit |
| Communal Atrium | Habitation panels and garden approaches | Glass channels; hanging shades around the living garden | Warm key, neutral/cool fill, teal planter and amber domestic sources |
| Crew Checkpoint | Security plates/tread, retained hazard bands | Under-lit glass scanner services; suspended inspection fixtures | Neutral key, cool fill, green scanner and red exit |
| Armory | Security tread/hatches | Glass services; ceiling task beams around retained issue carousel | Neutral key, blue fill, amber task/red exit |
| Freight Hold | Cargo heavy plates, nonslip tread | Glass and grated service wells; suspended winch/pipe carriers | Warm key, cool fill, amber manifest and cyan machinery |
| Breached Loading Bay | Cargo plates and breach wear | Under-lit grate trenches; winch carriers above sealed breach approaches | Warm task pools, cool fill, breach amber/violet |
| Relay Racks | Communications split plates; cargo-tread service lane in olive | Glass channels; cable trays with amber status; lifted cross aisle | Teal key, blue fill, amber status |
| Transmission Chamber | Communications plates; cargo-tread service approaches | Glass channels; cable trays; supported airlock pressure ring shifted clear of the marine | Teal key, blue/violet fill, amber status/uplink cyan |
| Diagnostic Gallery | Engineering plates and retained waveform inlay, lifted paint | Glass channels; retained instrument/warning gantry; one actual warning visible | Cyan task key, blue fill, warm fatal record |
| Safety Interlock | Engineering plates and instrument thresholds | Glass services; connected overhead record/cable tray; HUD-aware single warning | Amber task key, cool fill, locked-record amber |
| Coolant Plant | Maintenance plates; security-tread pump-return lane | Under-lit grates and pipes; suspended valve racks | Teal key, green/blue fill, amber status |
| Service Shaft Landing | Maintenance plates; retained separate shaft floor | Under-lit grates; overhead valve racks; retained deep shaft/rails | Teal task pools, dark shaft fill, warm access/instrument accents |
| Infested Workshop | Infested plates with warmer reclaimed paint | Under-lit grates; rooted overhead pipes; rear tool bridge | Cool key, muted fill, green/violet infestation |
| Swarm Junction | Infested plate modules | Grated trenches and pipe beds; rooted overhead rack | Neutral key, muted fill, violet growth/green exit |
| Shielding Gate | Containment graphite plates; olive security-tread service lane | Glass channels; suspended violet shield lens and amber lamps | Neutral key, blue fill, violet spill plus amber status |
| Containment Annulus | Containment plates; security-tread service approaches | Glass channels; violet lens assemblies around retained annulus | Neutral key, blue fill, violet/amber |
| Manual Control | Reactor plates/tread and guarded approaches | Glass services; existing overhead authorization cable tray; one readable warning | Low console key, cool fill, warm authorization |
| Overload Floor | Reactor heavy plates/tread | Glass services; suspended heat-fin carriers | Warm console/task key, dark cool fill, terminal alarm amber |

## Visual review and evidence

Five written standard critique/fix rounds are in `plans/E10-review.md`. The lead's round 4 direction was incorporated before propagation: stronger violet/amber shield hardware, a separate service deck, placed wear, brighter captive under-light and visible suspension. Native dense Cryo frame 02 in Shielding/Coolant/Relay has 26/20/26 live enemies; inspected at 1920×1080 and 480×270 with individual contacts and no opaque crowd shadow mass. G6 uses 10–12 spread native threats and is separately labelled staged visual evidence.

Final gallery: `/Users/chernodub/.t3/worktrees/containment-game/t3-819e67f1/artifacts/nextgen/e10-final/`. It retains native PNGs, exact 480 reductions, twenty five-position tours, calm/kiting sheets and matching E9 comparisons. Native bytes and per-room bundle/source identities are preserved by the existing gallery assembler. The first all-room parent has four warning diagnostic failures and zero page/console errors; its failed receipts remain explicit, with complete corrected room sets replacing those rooms. Intermediate review directories are removed after assembly.

## Verification and measured limits

Runtime source is `086a4d8b122a74649e3a52924f5499f678de4ae7`. `npm run build` passes (TypeScript and Vite). The final runtime change only removes actor-pool invalidation of static architecture shadows; materials, geometry, lighting, camera and collision match the reviewed gallery parents. Their individual source identities remain explicit instead of relabelling older PNGs as new captures.

The requested native `npm run playtest -- --rig=cryo --seed=1729` campaign completed all twenty rooms in 958.0 wall seconds, with zero errors and zero defects, unassisted, full incoming damage, rendering every native fixed tick. Host load was 12.7/15.9/20.9 at start and 17.6/20.7/20.6 at finish on ten logical cores; backend ANGLE Metal / Apple M1 Pro. This campaign used `aecb507`, before the subsequent two-flag shadow cost correction. Its complete report, input trace and frames are retained in `e10-final/campaign/`. Fixed-step campaign timings are CPU submission/lifecycle evidence, not hardware FPS certification.

`npm run bench` was run twice across all twenty rooms with the native full Cryo kit, replenished legal enemies (initial 25, median 24–27), High, 1920×1080 browser viewport, one 12-second measured trial per room. Before correction, Safety/Workshop/Shielding peaked at 456/353/555 draws; an explicit draw audit reproduced 440/349/552 and identified retained equipment/architecture shadow submission. Contact-only pool churn was still refreshing that atlas. Removing those two invalidations reduced their repeated measured peaks to 277/208/232. `benchmark-before/` preserves the original data and audit; timing differences between runs are not an isolated speedup claim because host load changed.

The final benchmark exits 0 with zero page/console errors, zero resource-budget failures and zero mid-combat program creations in all twenty rooms. Maximum draws are 149–277, under 330. **The 20ms frame-p95 target is not met in any of these final trials** (23.3–58.4ms). Median adaptive scale is 0.80–0.975, so these are also not full internal 1920×1080 timing certificates. Shared-host load is 13.4–31.6 before trials on ten logical cores, with asynchronous GPU scheduling shared with the other streams. This does not prove that contention is the sole remaining cost. Integration must repeat quiet-host timing; the remaining timing miss is an explicit handoff limitation.

The existing `bench:rooms` tool also visited all twenty rooms on fresh pages on `086a4d8`: zero errors/failures, zero post-readiness and staged combat compiles, all complete public readiness holds below 3s (maximum 1.613s). It records per-row host load and preparation phases in `benchmark/preparation.json`; this is preparation coverage, separate from the organic campaign.

The tables below use the final runtime. Draws/triangles are measured maxima across each live benchmark trial; frame and CPU numbers are milliseconds. Load is the one-minute system load before→after that trial. The browser viewport is 1920×1080; scale is the measured median internal render scale. No screenshot timings are used as hardware FPS.

| Room | Draws max | Triangles max | Frame p50 / p95 | CPU p95 | Scale p50 | Load before → after |
|---|---:|---:|---:|---:|---:|---:|
| Awakening bay | 192 | 995,652 | 16.7 / 25.4 | 20.5 | 0.875 | 18.6 → 21.6 |
| Passenger vault | 160 | 787,270 | 16.7 / 25.3 | 20.3 | 0.900 | 21.6 → 25.6 |
| Residential gallery | 156 | 789,017 | 17.1 / 58.4 | 33.2 | 0.850 | 25.6 → 26.3 |
| Communal atrium | 163 | 709,470 | 17.1 / 42.6 | 33.3 | 0.900 | 26.3 → 31.6 |
| Crew checkpoint | 157 | 851,127 | 16.7 / 31.7 | 28.3 | 0.925 | 31.6 → 29.4 |
| Armory | 217 | 763,003 | 16.7 / 25.5 | 23.6 | 0.925 | 29.4 → 24.3 |
| Freight hold | 157 | 727,345 | 16.7 / 24.8 | 22.8 | 0.925 | 24.3 → 21.0 |
| Breached loading bay | 168 | 747,740 | 16.7 / 24.9 | 23.6 | 0.950 | 21.0 → 17.0 |
| Relay racks | 169 | 777,537 | 16.7 / 32.0 | 32.1 | 0.925 | 17.0 → 18.1 |
| Transmission chamber | 149 | 803,415 | 17.3 / 40.8 | 25.1 | 0.800 | 18.1 → 23.7 |
| Diagnostic gallery | 154 | 860,205 | 16.9 / 41.9 | 36.8 | 0.800 | 23.7 → 26.5 |
| Safety-interlock station | 277 | 885,717 | 16.7 / 33.2 | 26.1 | 0.900 | 26.5 → 24.3 |
| Coolant plant | 157 | 769,374 | 16.7 / 24.8 | 20.9 | 0.925 | 24.3 → 21.0 |
| Service shaft landing | 166 | 761,140 | 16.7 / 25.0 | 21.9 | 0.975 | 21.0 → 18.9 |
| Infested workshop | 208 | 846,976 | 16.7 / 25.2 | 24.7 | 0.900 | 18.9 → 18.7 |
| Swarm junction | 151 | 758,485 | 16.7 / 25.2 | 23.1 | 0.950 | 18.7 → 17.6 |
| Shielding gate | 232 | 792,239 | 16.7 / 32.4 | 25.0 | 0.950 | 17.6 → 16.3 |
| Containment annulus | 155 | 782,428 | 16.7 / 23.3 | 20.3 | 0.900 | 16.3 → 14.9 |
| Manual-control chamber | 197 | 713,976 | 16.7 / 33.3 | 34.9 | 0.950 | 14.9 → 13.4 |
| Overload floor | 158 | 733,544 | 16.7 / 24.7 | 19.7 | 0.925 | 13.4 → 12.1 |

Texture counts and preparation holds below come from the separate fresh-page preparation run, with its own before→after host load. “Floor MiB” estimates bound E10 floor images as RGBA8 plus mipmaps, sharing ORM/story/trim/light images exactly once. It excludes attachments, actors, other kits, driver storage and retained images after a tier switch; there is no claim of full process GPU-memory measurement. Both resolutions decode during readiness. One family is 24.25MiB on High / 6.25MiB on Low; the distinct service family adds 16/4MiB. Service Shaft has no named secondary service-deck mesh and retains its separate existing shaft material.

| Room | Renderer textures | Floor MiB High / Low | Ready ms | Load before → after |
|---|---:|---:|---:|---:|
| Awakening bay | 125 | 24.25 / 6.25 | 1613 | 10.4 → 10.4 |
| Passenger vault | 130 | 24.25 / 6.25 | 1056 | 10.8 → 10.8 |
| Residential gallery | 117 | 24.25 / 6.25 | 1119 | 10.8 → 13.2 |
| Communal atrium | 126 | 24.25 / 6.25 | 1149 | 13.2 → 13.8 |
| Crew checkpoint | 117 | 24.25 / 6.25 | 1281 | 13.8 → 13.8 |
| Armory | 117 | 24.25 / 6.25 | 1220 | 13.1 → 13.1 |
| Freight hold | 117 | 24.25 / 6.25 | 1233 | 14.7 → 14.7 |
| Breached loading bay | 122 | 24.25 / 6.25 | 1146 | 16.3 → 16.3 |
| Relay racks | 120 | 40.25 / 10.25 | 953 | 16.1 → 16.1 |
| Transmission chamber | 120 | 40.25 / 10.25 | 1341 | 16.1 → 15.8 |
| Diagnostic gallery | 118 | 24.25 / 6.25 | 1013 | 15.8 → 15.2 |
| Safety-interlock station | 119 | 24.25 / 6.25 | 1209 | 15.2 → 15.2 |
| Coolant plant | 120 | 40.25 / 10.25 | 1110 | 14.7 → 14.7 |
| Service shaft landing | 119 | 24.25 / 6.25 | 948 | 14.2 → 14.2 |
| Infested workshop | 120 | 24.25 / 6.25 | 1371 | 13.8 → 13.8 |
| Swarm junction | 117 | 24.25 / 6.25 | 1212 | 14.6 → 14.6 |
| Shielding gate | 120 | 40.25 / 10.25 | 1374 | 14.6 → 13.8 |
| Containment annulus | 122 | 40.25 / 10.25 | 1300 | 13.8 → 13.3 |
| Manual-control chamber | 120 | 24.25 / 6.25 | 986 | 13.3 → 13.3 |
| Overload floor | 124 | 24.25 / 6.25 | 1388 | 12.9 → 12.9 |

The 66 lossless WebP files total 921,956 bytes (0.879MiB on disk). During a tier switch the driver can retain both prepared sizes until room retirement; the corresponding bound floor storage is 30.25/50.25MiB, excluding decoded source/atlas images. Low drops additional ceiling assemblies and keeps the smaller floor/story maps, static light and flush recesses. The final thirteen HUD-hidden captures pass with zero errors/failures. Dense Cryo frame 02 in the three standards (26/20/26 enemies), G6 frame 02 in Safety/Workshop, Shielding calm/Low and Armory recovery were opened at native size and exact 480×270 after the cost correction. Their contacts stay short, the floor materials survive recovery, and Low retains static spill and wear. A warning face may fade completely where protecting actors takes precedence during combat; the five-position warning-room tours retain one readable record per inspection view. These final captures are retained separately from the twenty-room High gallery.

`npm ci` was the first operation. The existing lockfile fails a clean install with `Missing: @emnapi/runtime@ from lock file`, including a fresh cache/legacy-peer retry. Verification used a copied installed dependency tree from the integration checkout. No package/lock/dependency changes were made in this environment-owned stream; integration must repair that existing lockfile. No automated tests or assertion infrastructure were added.

## Honest weakest views

1. **Residential centre** (`room-tour-residential-gallery-02.png`): panel relief, warm/cool pools and travel wear help, but the large empty centre still relies on floor pattern more than a distinctive landmark. It remains below Crew Checkpoint's composition.
2. **Workshop rear** (`room-tour-infested-workshop-04.png`): the rear bridge gives the bay an upper plane but frequently fades at the inspection position to protect the marine. The surviving rear furniture is modest and the dark material range remains narrow.
3. **Relay cross aisle** (`room-tour-relay-racks-03.png`): brighter teal/olive separation and worn tread are readable; cable trays often cut away and the room remains quieter than Crew Checkpoint.
4. **Transmission airlock** (`room-tour-transmission-chamber-04.png`): the supported pressure ring now enters the view without crossing the actor, but the broad approach still has less visual storytelling than the central uplink.

Shielding Gate and Diagnostic are the strongest improvements among the original six. Recess covers still share a recognizable rectangular silhouette across the ship; fabrication, grate/glass treatment, pipes and overhead forms vary, but this repetition is not eliminated. No low cover was added merely to fill the screenshot.

## Review entry points

Open `e10-final/index.html` for all twenty matched tours and native links. Useful direct images under that absolute gallery directory are `native/room-tour-shielding-gate-02.png`, `native/room-tour-coolant-plant-02.png`, `native/room-tour-relay-racks-03.png`, `native/room-tour-diagnostic-gallery-02.png`, `native/room-tour-transmission-chamber-04.png`, and `native/room-tour-infested-workshop-04.png`. `shadows/` retains the pre-propagation dense standard frames and their source receipt. `shadow-final/` records the final runtime with the DOM HUD hidden; it supplements, rather than rewrites, the twenty-room gallery provenance.

