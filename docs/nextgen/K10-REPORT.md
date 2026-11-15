# K10 — Crown-keel marine and original arsenal

Branch: `t3/original-marine-arsenal`. This report supersedes the rejected block-based delivery. The final commit SHA is supplied with the handoff; exact shipping asset hashes are in the retained gallery’s `model-inventory.json`.

The marine and all five weapons are original Blender-authored geometry/material artwork. The proven skeleton, animation payloads, runtime selection and material ownership remain intact. No motion, world/room, UI or simulation code was changed. Original artwork and generating scripts use the repository MIT license; the retained Unvanquished skeleton and seventeen animation clips keep their separate Creative Commons attribution.

## Design and implementation

The body is built from changing elliptical loft sections along the retained bones: chest, waist, pelvis, tapered forearms, thighs and calves. Subdivision supplies an anatomical pressure suit. Curved armour patches are copied from that surface, fitted at a 1.5–3cm stand-off, solidified, bevelled and finished with weighted normals. Dark flexible fabric remains visible at joints. Hands have individual grouped phalanges/knuckles; boots have toe/instep shells, sole, heel bumper and ankle bearings. Light front and rear leg shells keep the complete person visible from the gameplay camera.

The closed Crown-keel helmet was selected from three curved studies after actual 140px gameplay review. Its broad luminous dorsal return stays readable from above/behind. The visor is recessed; temple/jaw hardware and high-source service cuts complete the pressure shell. The other two options fragmented at the small size.

Each rig changes shoulders, collar, forearms and back. Breacher has an asymmetric ram shoulder, painted black/amber hazard bands and exposed pistons. Cryo has insulated cups/collar, collared coolant vessels, radiator, hoses and cuff ferrules. Pyro has a broad dark vent shield, ribbed gauntlets/apron and splayed hot stacks. Arc has reduced cups, open induction frames/coils, capacitor bows and forked antenna tips. Large amber, ice-blue, orange-red and violet zones carry the identity alongside silhouette and strong emission.

The five weapons use designed side-outline receivers, grips, stocks, magazines and shrouds, extruded and chamfered with actual cylindrical bores, rails and thermal openings. They read as a compact hooked-slide pistol, hollow-stock rifle, short-fat twin-bore shotgun, open luminous plasma fork and circular shoulder-tube launcher with a curved cradle. Existing `WEAPON_FIT` values and exact muzzle translations remain unchanged; named ejection sockets stay in the established casing frame.

Actual higher-subdivision/bevelled geometry supplies tangent normal, AO and geometric curvature bakes. Matching components separate during normal projection. Very thin round hardware keeps its actual smooth low normals to avoid a character-scale cage crossing its opposite wall. Flat paint/emission bake from the game surface, avoiding cross-part colour contamination. Curvature wear is restrained at edges. The final bakes were inspected on the game mesh, in native captures and in the transparent portraits.

The source contract preserves all first 123 nodes, hierarchy/rest transforms, 122-joint order/inverse-bind bytes and all 17 clips/3,690 channels and sampler payloads. Unused face/control bones remain present. `contract.py` appends geometry without round-tripping those data, permitting M10 animation-only merging by bone name. No outgoing marine or weapon mesh/texture remains in the new files.

Rebuild all six GLBs, source maps, turnarounds, portraits and pose studies with `sh tools/assets/k10-marine/rebuild.sh` (Blender 5.3; no new dependency). The complete command finished successfully. The final shipping marine SHA256 is `bc82d54f3599936ff9c8e3ba2834f21773c39859d9c61e3af53addaf0384bd7d`. Multi-object UV packing may choose different island placement on a future rebuild; the retained native verification uses this exact frozen export. `K10-design.md`, `K10-revision.md` and `K10-review.md` record the redesign and seven further actual render/look/fix rounds, numbered 5–11.

## Geometry and textures

| Asset / active variant | Triangles | Shipping maps |
| --- | ---: | --- |
| Shared marine body | 17,411 | One shared 2048² atlas set: base, normal, AO, emission |
| Breacher body + rig | 21,915 | Same shared set |
| Cryo body + rig | 23,869 | Same shared set |
| Pyro body + rig | 24,755 | Same shared set |
| Arc body + rig | 23,549 | Same shared set |
| Pistol | 2,004 | 512² base + normal |
| Rifle | 3,552 | 512² base + normal |
| Shotgun | 3,344 | 512² base + normal |
| Plasma | 4,616 | 512² base + normal + emission |
| Rocket | 4,104 | 512² base + normal + emission |

The marine stores 41,855 resident triangles across body/all four rigs, drawing only the selected 21.9–24.8k variant. Only the equipped weapon is visible; all five total 17,620 triangles. Marine GLB: 13,620,696 bytes. Five weapon GLBs: 2,477,428 bytes combined. Plasma’s open chamber/rings account for its modest excess over the approximate 4k weapon target.

Marine delivery maps are RGB8 PNGs; curvature remains an authoring source, not a fifth runtime sampler. GPU upper estimate including RGBA8 mip chains: 85.3MiB marine plus 16MiB for all preloaded weapon atlases. This is a real texture-memory increase over the rejected 1k version, chosen within the approved 2k atlas limit. Material clones share the same atlas resources. There are two active marine skins and one equipped-weapon material; inactive rig meshes do not draw.

## Verification

`npm ci` completed at stream setup. `npm run build` passed after the final asset rebuild (TypeScript + production Vite build; the existing large-chunk advisory remains). No tests, test runners or assertion/proof infrastructure were added.

The final gallery contains 28 native 1920×1080 game captures with HUD and 12 native HUD-free captures, all reduced exactly to 480×270. All four rigs cover Awakening Bay, Armory and Infested Workshop; matched calm/heavy original/new comparisons cover every rig. All 40 captures finished with zero errors. The canvas-only capture option preserves existing native camera/HUD diagnostics and changes only the saved pixels.

M9 produced 21 final native-scale strips with zero errors: eight run directions, five weapons, idle/reload/hit/death and four explicit cast-input studies. Complete strips and three four-phase contact pages were opened. They are isolated presentation replays, not native ability acceptance, foot-contact or hardware FPS evidence. Artist-only 70° twist/crouch images cover all four rigs and were opened; no broken weights or plate entering the helmet/back assembly was visible. Incoming M10 animation-only clips were unavailable and have not been reviewed on this mesh.

The ordinary native desktop bot ran one seed-1729 campaign per rig, with every fixed tick rendered, no assistance and no shortened room limit. All four runs finished without errors or recorded defects:

| Rig | Rooms cleared | Native outcome | Errors | Defects |
| --- | ---: | --- | ---: | ---: |
| Breacher | 15 | dead in Swarm Junction | 0 | 0 |
| Cryo | 20 | complete | 0 | 0 |
| Pyro | 10 | dead in Diagnostic Gallery | 0 | 0 |
| Arc | 20 | complete | 0 | 0 |

Deaths are retained as observed; no assisted rerun or forced win was used. Full native reports, input traces and screenshots are under `play/{rig}/`. These fixed-step campaigns supply input/lifecycle observations, not hardware FPS measurements.

The hardware comparison used ANGLE Metal / Apple M1 Pro, High, 1920×1080, Awakening Bay heavy combat and the same production JavaScript in both distributions. Only the six marine/weapon files were swapped for the baseline. The first 24 trials (three/model/rig) had trial-start host load 74–286 on 10 logical cores and large adaptive-resolution/tail variation. They are retained under `bench-before/` and `bench-final/`; their timings do not establish a strict model-cost result.

A supplemental original/new/new/original sequence reduced order bias: two 12-second trials/model/rig, 16 trials total. All raw paired reports remain under `bench-paired/`. Below are medians of trial summaries, in milliseconds; scale is the median internal resolution factor:

| Rig | Frame p95, original → K10 | Render JS p50, original → K10 | Adaptive scale p50 |
| --- | ---: | ---: | ---: |
| Breacher | 18.10 → 18.10 | 7.85 → 7.70 | 0.9500 → 0.9500 |
| Cryo | 18.10 → 18.10 | 8.35 → 8.35 | 0.9375 → 0.9125 |
| Pyro | 18.25 → 18.10 | 8.90 → 7.30 | 0.9500 → 0.9250 |
| Arc | 25.35 → 25.65 | 8.05 → 7.80 | 0.8750 → 0.8625 |

All 40 benchmark trials completed with zero errors and zero mid-combat program compilation. The paired cohort shows no consistent observed frame-time regression: median p95 deltas are 0.00, 0.00, −0.15 and +0.30ms; Arc’s individual p95 values span roughly 18–33ms. Paired trial-start host load was 20.6–45.4; adaptive scales still varied. This supports no resolved marine frame-cost regression in this cohort, with limited attribution precision. Absolute 8ms CPU / 16.6ms frame targets were not met on this shared host, including with the original models. No clean hardware-budget certification is claimed. `frame-p95.png` / `.svg`, `benchmark-summary.json` and every raw trial remain available.

Tools record the pre-commit base `b020c00`; the frozen distribution’s `SOURCE_SHA` also records the exact new marine hash above. The delivery commit is made after verification. Native evidence uses the frozen export, not a later unreviewed rebuild.


## Look first

Gallery: [open the complete final review](/Users/chernodub/.t3/worktrees/containment-game/t3-c52a0ed7/artifacts/nextgen/k10-final/index.html).

- `turnarounds/all-views.png`: all 24 final views; individual 1000px sources alongside.
- `turnarounds/four-rigs-140.png`: gameplay-angle figures at 140px height.
- `hud-free/four-rigs-three-rooms-480.png`: rig identity without HUD text.
- `comparisons/{rig}-before-after-native.png` and `-480.png`: matched calm/heavy comparisons.
- `weapons/arsenal-contact.png`: all five designed profiles, three views each.
- `portrait-review/`: all eight transparent UI renders and a contact sheet.
- `strips-final/` and `poses/`: complete native motion and artist deformation studies.

Intermediate rounds and the rejected final gallery were removed after inspection. The original pre-K10 marine comparison frames remain explicitly labelled as before.

## Integration requests

1. **UI owner:** adopt the eight committed transparent renders below. Busts are 1024×1024; heroes are 1024×1280. They retain alpha, complete rig silhouettes and both boots in hero views. No UI code was edited.

| Rig | Bust | Full figure |
| --- | --- | --- |
| Breacher | `public/assets/portraits/k10/breacher-bust.png` | `public/assets/portraits/k10/breacher-hero.png` |
| Cryo | `public/assets/portraits/k10/cryo-bust.png` | `public/assets/portraits/k10/cryo-hero.png` |
| Pyro | `public/assets/portraits/k10/pyro-bust.png` | `public/assets/portraits/k10/pyro-hero.png` |
| Arc | `public/assets/portraits/k10/arc-bust.png` | `public/assets/portraits/k10/arc-hero.png` |

2. **Title/world owner:** `src/render/world/TitlePresentation.ts` still adds the legacy `titleMarineArmor` overlay. Skip it for `k10-body` / `k10Original` so it cannot cover authored shells. The world module is outside K10 ownership. Existing illustrated title/portrait UI remains unchanged until its owner adopts these renders.
3. **M10:** merge incoming clips by unchanged bone names. The stripped `tools/assets/k10-marine/marine-contract.glb` and shipping marine share the original skeleton/rest/bind contract. Review new clip hand holds and extreme leg/torso articulation against these shells; K10 has not changed motion code or authored substitute gameplay clips.

## Honest weak list

The rear helmet and broad white ceramic fields remain deliberately quiet; the suit is stronger as a complete stylized gameplay character than as an extreme head-only close-up. Some jaw service cuts and thin panel seams soften at the shared atlas resolution. Small bolts and seams disappear at 480; colour, helmet and rig silhouette carry that view. Brief plasma/element bursts can obscure the torso, leaving shoulders/back as the ID cue. Existing animation and standing poses remain stiff, and the weapons have static internals rather than animated bolts/pumps or a dynamic plasma field. The legacy title overlay and UI image adoption remain integration work. No push, PR or integration-branch merge is part of this handoff.
