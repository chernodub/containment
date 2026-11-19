# COND15 ship conditions

The renderer follows the room's deterministic condition state. The slicks are circles and the conductors are capsules. Their fragment contours use the native radii and endpoints. The supporting triangles are clipped to the deck hull, voids and blocker rectangles using the ship-deck builder. The condition renderer owns its meshes and materials. Shared hull queries, pod geometry, light slots and the hostile priority texture retain their original owners.

| Condition | Presentation and assets | Rendering cost and remaining weakness |
| --- | --- | --- |
| Coolant leak | A fractured cyan ice skin keeps the panel markings visible. Its wet highlight follows the suit. A flanged valve with a spoked wheel sits at the closest solid face to each slick origin. Wisps rise from the valve. Moving actors leave short skid marks. | Up to three floor draws and two instance batches. The large circular footprint is visible wherever gameplay defines a large uninterrupted slick. The skid effect follows movement on ice and cannot distinguish a deliberate straight run from loss of traction. |
| Overcharged conduits | Recessed channels have paired busbars, cross clamps, rounded end caps and an idle pearl-violet current. The countdown sends a charge front along each channel. Live lanes show an irregular discharge, sparks and a short pooled flash. | Up to three capsule draws and two fitting batches. The paired parallel bars carry the power identity at small size. Between charges the metal edges can merge with painted deck lines. |
| Hull venting | A twelve-part frost rim surrounds seven grille slats. An amber-white beacon switches with the warning. Live suction sweeps paper and narrow dust trails from the marine's side toward the inlet. The existing camera rig supplies bounded rumble and respects motion preferences. | Two batches, with 28 pieces of debris on High and nine on Low. The flow is easiest to identify in motion. The grille alone gives a weaker entry cue when the breach falls at the camera edge. |
| Emergency lighting | The existing room fixtures switch off. Segmented cool diffusers sit parallel to nearby wall or cover faces. The suit pool has a broader interior and a tighter falloff. Grazing surfaces receive a faint cool return. Actor organs, blades and warning materials keep their established presentation. | Two fitting batches, three strips on High and two on Low. Only strips inside the camera frame can explain the blackout before an enemy arrives. |
| Brood-warm deck | The Matron's closed and splitting Blender sculpts now include veined satellite eggs. Clutches are pooled actors. Linked mesh instances reuse the baked shell and core, with a translucent shell, expanding silhouette and pulsing core during swelling. The open crown swaps on the native opening stage. Warm stains and rising steam seat the clutches on the deck. | The two baked forms each have 1,500 source triangles. The KTX2 pod GLB is 495,756 bytes including its shipped LOD. A primitive draws both instances together. Stains use up to three additional deck draws. At 480 px the silhouette and core identify the stage more readily than the individual veins. |
| Sealed bulkheads | Paired ribbed shutter leaves, steel jambs and neutral chevrons cover each sealed opening. The jamb carries a seven-segment seconds display. The exit retracts and admits a brief amber-white light when its native release condition is met. The redirected reinforcement breaches stay shuttered. | Two instance batches for all three assemblies. The readout is designed for a close view. At 480 px its lit panel remains more apparent than both digits. |

## Production and review

The pod rebuild uses the existing Blender sculpt, decimation, bake and GLB exporter. The original MIT asset and generator are in the repository. The pod-only shipping switches limit packing and LOD generation to this asset.

```sh
sh tools/assets/k11-creatures/growth/rebuild.sh --set=pod --no-render
TOKTX=/path/to/toktx node tools/assets/t12-textures/pack-brood.mjs --pod-only
node tools/assets/i11-models/brood-lod.mjs --pod-only
```

The first review at 480×270 showed parallel frost lines, a waveform-like arc and short debris streaks clustered around the vent. The second pass replaced the frost lines with cellular fractures, broke up the arc, and spread the vent streams across the approach. The second review exposed excess bloom in the splitting core and a release camera aimed at a reinforcement breach. The final pass reduced core emission, staged the camera at the exit, seated the fittings on solid faces, and separated lit metal from masked glass, mist and fragments.

The [comparison gallery](../../artifacts/nextgen/cond15/comparison.html) groups native images with their 480×270 views. Its before images are the original RUN15 Atrium captures. The heavy frames stage native enemies around an invulnerable marine. The active seal fixture advances the condition clock to just before release, then steps through the release on the normal render path. Stage and encounter differences matter when comparing an opening crown or retracting shutter with the older post-hatch or still-closed frames.

## Desktop capture measurements

The 42-frame review covers each condition at entry, active and heavy combat in Communal Atrium and Breached Loading Bay, plus one Low capture per condition in the Atrium. All 42 probes recorded zero WebGL program creations after room readiness, with zero browser or capture errors. The heavy frames submitted the following draws. These are single staged frames on ANGLE Metal, Apple M1 Pro. The full-room ranking and realtime trial are separate measurements. [Capture manifest](../../artifacts/nextgen/cond15/manifest.json)

| Heavy frame | Atrium draws | Loading Bay draws | Visible enemies, Atrium / Bay |
| --- | ---: | ---: | ---: |
| Coolant leak | 140 | 127 | 17 / 12 |
| Overcharged conduits | 135 | 132 | 15 / 12 |
| Hull venting | 133 | 116 | 12 / 8 |
| Emergency lighting | 133 | 119 | 17 / 14 |
| Brood-warm deck | 159 | 147 | 16 / 12 |
| Sealed bulkheads | 132 | 119 | 10 / 13 |

In the final gallery, 37 of 42 destination-room preparation receipts were within 3 seconds. Median preparation was 1.38 s. The maximum was 6.29 s at the first shuttered Atrium. In the initial 42-frame batch, 40 met the target. The first High blackout measured 5.32 s, including 3.55 s in the room reflection capture, which excludes condition geometry. The first Low blackout measured 5.02 s. Repeating those two blackout loads gave 1.49 s and 1.32 s. The worst-case 3 s target remains unmet. Each measurement uses the destination’s last inclusive renderer preparation receipt. Initial Awakening Bay startup has a separate receipt. [Initial shipping receipts](../../artifacts/nextgen/cond15/initial-shipping-manifest.json) · [Readout and repeat-load receipts](../../artifacts/nextgen/cond15/readout-manifest.json)

At 480×270, warning edges cut across the slicks and busbars, and creature organs remain visible past the emergency pool. Both cargo and Atrium heavy frames keep the marine legible. Overlapping slicks still reveal the individual circular outlines. The grille and shutter are easiest to recognize when the camera includes the opening. I inspected the stills for readability; the review did not measure a player's two-second recognition time.

My two-second still-frame judgments were strongest for coolant during the dash, conduits during discharge, and brood during the split. Blackout reads immediately from the suit pool, though an individual emergency strip can be outside the view. The vent at idle could pass for an ordinary drain. A sealed breach reads as a shutter at entry, with the reason for the closure clearest from the lock panel. The supplemental [phase captures](../../artifacts/nextgen/cond15/phases/manifest.json) include the vent strobe, travelling charge, swelling clutch and an accepted Arc tactical during a live power pulse.

The Standard native Arc bot cleared ten rooms on seed 1729 with the requested fast desktop input mode. The runner reached its room limit with zero errors. The production type-check and Vite build passed. [Playtest report](../../artifacts/nextgen/playtest/cond15/report.json)

The last shutter review exposed inverted digits on jambs facing away from the camera. The panel remains mounted on the jamb and its top-facing digits now share the deck camera’s orientation. All seven shutter views were recaptured. The Low shutter uses three slats per leaf and High uses five.

## Full-room inventory and trial

The seed-1729 scan exercised the native Arc kit in all twenty story rooms. Safety Interlock Station ranked first with 285 draws. The initial scan’s staging reset cleared brood actors. For the timed trial the fixture retained the three eggs within its 25-actor population, so native hatching and retirement occurred during measurement. Its first run reached 301 draws and created zero programs. A legacy counter interpreted the expected removal of the hatch meshes as an allocation error. The corrected inventory accounts for the specific initial pod meshes whose roots have since detached. [Room ranking](../../artifacts/nextgen/cond15/bench/room-ranking.json) · [First trial](../../artifacts/nextgen/cond15/heavy/benchmark.json)

The corrected High trial began with 25 actors and ended with 24. It accounted for 24 retired pod batch meshes across three hatches. Median submission was 240 draws, p95 was 281, and the maximum was **301 of 330**. It created **zero** mid-combat programs, reported zero GL errors, and retained its context. Safety Interlock’s inclusive preparation receipts were 6.22 s and 1.34 s. The host reported a one-minute load of 629 at trial start, so the frame-time samples have limited value for hardware comparison. [Heavy trial](../../artifacts/nextgen/cond15/heavy-final/benchmark.json)

The capture PNGs, manifests, benchmarks and native campaign receipts are local artifacts under the repository’s ignored evidence directory. Rebuild the comparison sheets with `node scripts/nextgen/cond15-gallery.mjs <RUN15-conditions-directory>` after running the COND15 capture scenarios.
