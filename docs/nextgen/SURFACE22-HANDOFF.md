# SURFACE22 — painted environment surfaces

## 1. Before (`artifacts/nextgen/surf22-before/`, commit 0b97db74, seed 1729, 1920 × 1080)

Captured `incident-facing` and `combat-calm` for freight-hold, armory, crew-checkpoint, relay-racks, coolant-plant and swarm-junction, plus `value14-crowd-*` for relay-racks, swarm-junction and crew-checkpoint (24 PNGs, 0 failures).

What the surface shader gives props and landmarks today. Props (the freight-hold booth counter, the armory issue counter, the crew-checkpoint scanner pillars) get the three-step diffuse ramp from `GraphicSurface.ts`, which on a box only separates the lit face from the shadowed face, so each face is one flat fill bounded by ink. Speculars are cut to 25 % and the only highlight is a Fresnel rim bevel on upward-facing silhouettes; there is no ambient occlusion on props beyond the deck contact shadow, and no texture beyond whatever flat albedo the kit material carries. Landmarks (the freight-hold leaning load, the armory carousel) get the same treatment plus the LIGHT13 landmark body emission, which lifts every raised surface within the radius uniformly: the carousel reads as a pale-grey block, the crate stack as mid-grey slabs whose top plane is no lighter than its sides. A painter would add a clearly lighter top plane in the room's light, a dark foot where the object meets the deck, a few large panel breaks per face in two tones, a broken light line on the top edges, and on the landmark a lit accent trim or core so it stands one value step above the floor.

## 2. The painted value model

Everything is computed in the room-surface block that `optimizeLocalLights` already injects (`src/render/lighting/LocalLightShading.ts`, after the LIGHT13 grade). It applies only where `roomValue.z > 0`, which `applyRoomMood` sets on room architecture and props and never on actors; floors and deck materials are excluded at compile time (`ROOM_FLOOR_SURFACE`). Inputs are the world normal and world position recovered from `geometryNormal`/`geometryPosition`, the diffuse albedo and the already-lit radiance. No textures, attributes or passes were added.

| Term | How | Values (High) |
|---|---|---|
| (a) Lit top plane | `paintTop = smoothstep(.62,.9,n.y) · smoothstep(.04,.22,y)`; multiplies diffuse and specular by `1 + lift·top`, plus a small top-plane fill of `albedo · room tint · roomValue.x · .025·lift` | lift `.55`, falling to `.11` for pale albedo (luma .25→.60) |
| Sides one step down | `paintSide = 1 − smoothstep(.45,.75,|n.y|)` | sides × `0.78` |
| (b) Dark base | sides × `1 − .58·(1 − smoothstep(0,.75 m,y))` | 42 % at the deck, full value at 0.75 m |
| Highlight guard | lit luma `L`: `hot = smoothstep(.08,.45,L)`; a hot surface takes no lift, and hot top planes / pale finishes come down a further 20–42 % | keeps marine > creatures > landmark |
| (d) Two-tone panels | world-space running-bond cells per dominant face axis (1.35 m on tops; 1.2 × 0.58 m on sides), hashed to one of two tones | dark tone × `0.81` (× `0.75` on the landmark); High only |
| (c) Worn edges | the existing High ink crease kernel (`src/render/post/Ink.ts`) already compares each architecture pixel with four neighbours. Where the crease is convex and this pixel is the more upward face, it now draws a lighter value of the surface (`color·2.1 + .01`, 80 %) instead of ink; the lower face keeps the ink. A world-anchored value noise (≈0.5 m cells, from `cameraWorld`) breaks the lip into chips so it does not crawl as the camera follows. No extra texture fetches. | High only (`inkWear` uniform) |

Parameters are shared by every kit; the panel scale is per face axis, not per kit material. The tier uniform `surfacePaint.x` (set from `PostPipeline.configure` with the tier) switches panels and trim off on Low; Low keeps top planes, sides and the dark base, and the Low composite gets `inkWear = 0`.

## 3. Landmark tier

`paintLandmark` is the room's existing ROOM19/ROOM21 landmark field (`ROOM_LANDMARK`, falloff from 0.22 to 0.55 of its radius, raised surfaces only). Inside it the value model's contrast is ×1.9, the dark panel tone is darker, the top-plane fill takes 55 % of the landmark colour, and a thin emissive accent trim in the landmark colour runs round the side faces at `0.42 × landmark height` (clamped 0.24–1.1 m; `ROOM_LANDMARK_TRIM`). The landmark's own self-light emission (the LIGHT13 body term) now goes through the painted value, so its top plane and dark base show instead of a flat emissive fill. A hot landmark comes down 32 % so the armory carousel ring is light grey, no longer white.

Grey rooms: Armory floor profile `{lit .38→.29, unlit .20→.15, edge .10→.08}`; Crew Checkpoint `{lit .25→.20, unlit .11→.09, edge .055→.045}`. Props keep their top-plane light.

## 4. Costs

- Passes: none added. Textures: none added.
- Draws: identical in every before/after frame (for example combat-calm armory 112/112, relay-racks 103/103, crowd crew-checkpoint 97/97).
- Programs: `LOCAL_LIGHT_CACHE_SUFFIX` is now `…-room-blackout-surface22`, so warm-up prepares the new source. `bench:rooms --modes=fresh` programs after preparation: freight-hold 142→143, armory 144→144, swarm-junction 145→145; combat compiles 0 and post-ready compiles 0 in all six rows.
- Room preparation (`npm run bench:rooms -- --rooms=freight-hold,armory,swarm-junction --modes=fresh --no-build`, second of two runs each; the before build is commit 0b31bad3 built to a scratch `dist`): freight-hold 3239 → 3405 ms, armory 3359 → 3733 ms, swarm-junction 3282 → 3139 ms. The machine was not quiet: load averages were 17–22 on 10 cores throughout, and the before runs alone varied by ±480 ms between the first and second pass. All six rows sit over the 3 s guardrail before and after; these numbers do not show a preparation regression that can be told apart from load, and should be re-measured on a quiet machine.
- Fragment cost: about 40 ALU instructions and one `fwidth` on room architecture fragments; the ink change adds a few ALU per crease neighbour. No frame-time measurement was taken (staged screenshots are not hardware evidence).

## 5. Verification

Before: `artifacts/nextgen/surf22-before/`. After: `artifacts/nextgen/surf22-after/` (same scenarios plus `i2-low-calm-armory.png`). Side-by-side (before left) in `artifacts/nextgen/surf22-compare/`: `1920-<shot>.png`, `480-<shot>.png`, `grey-1920-<shot>.png`, `grey-480-<shot>.png` for the twelve room frames and the first frame of each `value14-crowd-*` fight.

Frame-wide greyscale median / 99th percentile (sRGB 0–255, HUD included), before → after: freight-hold incident 40/147 → 40/168; armory incident 41/173 → 41/169; crew-checkpoint calm 39/135 → 37/148; relay-racks crowd 40/153 → 40/170; swarm-junction crowd 17/111 → 17/111; crew-checkpoint crowd 41/132 → 39/133. Medians do not rise: the ship stays dark. The higher 99th percentile comes from lit top planes on props. In all three fights the marine's ivory plates remain the lightest object, creatures second; the red cone and danger eyes keep the strongest hue. The first pass lifted the relay-racks cabinet tops toward creature values; the highlight guard was added for that, and the final crowd frame matches the before frame on those pale cabinets.

What the surfaces look like now: the freight-hold crate stack has a lighter tilted top, sides that darken to the pallet, two large panel tones per face and a lit lip along its upper edges; the booth counter in front of it shows three large panel tones on its top and a light worn line on its front edge. The armory issue counter has two-tone top panels and a broken light lip along its curved edge; the carousel ring is light grey with a darker pedestal side.

Playtest: `npm run playtest -- --rig=breacher --seed=1729 --rooms=8 --fast --startup-timeout-ms=180000` cleared 8 rooms (awakening-bay through breached-loading-bay, including crew-checkpoint, armory and freight-hold) with 0 errors and 0 defects. Peak draws per room were 99–174, under the 330 budget. Its report does not count mid-combat compiles; the `bench:rooms` rows above record 0 combat compiles and 0 post-ready compiles.

## Still flat / next

- Pale-albedo kit finishes (the relay-racks side cabinets, the freight-hold booth counter top) are still the brightest environment surfaces in their frames. They were already that bright before; the highlight guard stops the paint making them brighter but does not paint them down. They need darker authored albedo.
- The landmark trim is only legible where a side face crosses the trim height in view. On top-down views of the carousel and the crate it barely shows, so the landmark's third-tier lift still comes mostly from the existing key light. An authored emissive core per landmark would read better than an analytic band.
- Panel tones are world-anchored and shared by every kit, so they do not follow the geometry's own panel seams. Thin props also get cut by cell boundaries they don't own.
- Worn lips exist only on High with ink outlines at `full`, and they are one to two pixels wide: visible at native size, gone at 480 × 270.
