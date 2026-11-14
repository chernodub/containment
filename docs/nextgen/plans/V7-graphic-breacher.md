# V7 shared graphic effects and Breacher

Owner: VFX implementation child, shared worktree, no simulation/actor/world edits.

- Use one shared four-value GLSL combustion ramp for legacy explosions, status fire and ability fire. Threshold source alpha into a clean feathered silhouette; smoke uses three density/value bands. Keep CC0 images/manifests byte-identical, atlas fetch/readiness unchanged, one sample per legacy sprite and existing temporal samples for ability sprites.
- Convert Slam/Ram dust to cold industrial steel gray, projectile debris to bounded thin manufactured deck chips with hot torn edges and smaller sparks. Preserve Cryo shard behavior and all exact native pressure/dash footprints.
- Increase Railbreaker's brief white core within its native hit width, give the first beat more distinct compression rings and wall-contact sparks, keep the subsequent trail thin and preserve its exact scorch trench.
- All work remains inside existing fixed instance pools and preparation paths. No new per-combat resources, material variants or passes; keep Low and half-size detached-depth ownership unchanged.
- Focused shader/resource/Breacher tests cover common ramp, lifecycle, Low, pause, footprint and wall-event deduplication. Parent serializes build/capture/benchmark and owns visual critique.

Risks: source alpha thresholding can eat delicate late smoke; use a lower smoke threshold and retain transparent edge antialiasing. Shader banding cannot replace source silhouette authorship; if native review still shows grain, switch to reproducible offline smoothing rather than adding sampling cost.

R1 explosion-fixture correction: the original room-space common target was clipped
at the lower-left edge and is unsuitable for judging atlas quality. Retain those
raw captures as parents. Updated setup settles the native marine/camera first,
then picks actual visible legal floor with 52-unit core clearance and full native
Queen-pulse/fire-card/smoke-envelope projection checks against canvas/HUD bounds.
The recorded support is revalidated at every phase; no camera override or reduced
native blast radius is used. Tiny ejected ballistic spark/debris tails remain
separate from the explicitly measured main pulse/billboard envelope.
