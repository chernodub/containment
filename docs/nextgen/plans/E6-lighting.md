# E6 lighting composition subtask

Owned files: EnvironmentMoods.ts, RoomCompositions.ts, applyRoomMood.ts and a new focused test. No browser, simulation, actor, camera, VFX, post or UI edits. Main owns the only browser and the capture/benchmark validation.

Saved PNG review: E6 round3 exact480 calm/kiting sheet, E6 reference-calm sheet covering all twenty rooms plus the legacy Queen arena. Baseline I9 reports nominal floor median50–80/p5 approximately12–28, with documented exceptions; measurements are Rec.709-weighted sRGB PNG code values, not linear luminance or normalized exposure. No new pixel/performance acceptance is claimed here.

Decision: preserve deck readability while removing the same reflected shadow lift from communications/security/containment hardware. Keep exposure, actor lamp, fixed light topology, tier selection and shader topology unchanged. Source footprints/bounce intervals are main's EnvironmentComposition work; this subtask adjusts their surrounding key/fill and surface hierarchy. Engineering uses a lower warmer key and less broad recorder fill; Cryo puts its broad fill into a quieter readable center; containment's existing mechanism sources retain focal light with much less unrelated source energy; reactor retains the core spotlight and gains only bounded floor shadow readability.

Risks to calibrate in main's all20 capture: Relay/Transmission and Cryo floors are already near the lower median band; lowering direct light can pull them below50. Shadow fill is floor-only in the specified hardware moods, which can make hardware recesses dark in Low; semantic instrument emission and actor lamp must remain locatable. No world material hue or semantic emission change should affect actors/warnings.

## Implemented candidate

- Communications mood: ambient .12→.075, key2→1.7, fill.70→.60, cooler desaturated key, dry roughness.96. Relay key/fill gains1.06/.95; Transmission1.9/1.7 retain a brighter uplink focal composition. Floor shadow fill .013→.016 while hardware uses .001, so readable deck shadows no longer lift rack faces.
- Engineering: key colorFFE2A9→FFD492, mood key height5→4.2m, practical500→450/range6.2→5m. Diagnostic key offset[-14,4.2,8], gain1.85, fill4.5→3.8. Safety recorder offset[-15,4.6,8], fill2.3→2.1. The source remains warm and directional; no exposure compensation.
- Security: dry floor roughness.94 and practical range6.2→5.2m; floor shadow fill.001 vs hardware.0002. Key/fill energies and semantic warning hue remain.
- Cryo: Awakening key gain1→1.12 and practical1.5→.95; Passenger key1.1→1.12/practical.72→.62. This shifts broad visibility toward the quiet center while retained pod hardware emission and main's narrow source apertures identify seals.
- Maintenance: keyC0E0D6→B7CDB8 and practical range5.2→4.6m; wet-floor roughness, authored leak masks and drain patterns remain.
- Containment: dry floor roughness.95 and source range5→4.2m; Shielding practical gain4.5→2 while key/fill1.08/1.1; Annulus key/fill/practical.94/.95/.92. Floor shadow fill.002 vs hardware.0005. This reduces unrelated spread without changing source/field hardware counts.
- Reactor: the existing spotlight/core behavior, manual-console and Queen fills remain. Only Overload's deck toe increases.007→.012; ordinary hardware remains.007. This protects the dark floor without making all surrounding forms glow.
- All moods retain exposure1.06; no new light, texture, material family, shader define, pass or per-frame code. Shader changes are uniform values through the existing local-light hook. Actor source files, the suit lamp, warning colors, tier controls and graphics lifecycle are untouched. Habitation/cargo/infested key/fill calibrations remain main's accepted standard; their source-pattern/bounce work is separate.

## Focused validation

```
VITEST_MAX_WORKERS=2 npx vitest run src/render/lighting/E6ValueComposition.test.ts tests/NextgenLighting.test.ts src/render/G2Presentation.test.ts src/render/G2LegacyMoods.test.ts tests/PracticalPools.test.ts tests/G6FixtureShapes.test.ts
Test Files 6 passed (6)
Tests 55 passed (55)
Duration 914ms
```

E6ValueComposition adds six cases: three floor/hardware shadow separations, bounded Overload-only deck lift, exposure/semantic emitter stability across all ten moods, and actual lower/hot engineering/fixed-light topology plus dry clinical floor checks. Existing tests were not edited or relaxed by this lighting subtask. No browser/capture/bench was run; no new image, floor-band, FPS or visual approval claim is made. No commit was created. The three modules are stable for main's next frozen build.

Remaining calibration risks: stronger deck/hardware separation can hide dark cabinet recesses in Low; communications/Cryo medians near50 can still undershoot; lower engineering fill may deepen the recorder's neighboring aisle; changed containment range may leave some floor samples dark while keeping the mechanism legible. Main must inspect native/480/grayscale calm and kiting frames, record the I9-method p5/median/p95 and hero samples for all20, and adjust only the affected room's bounded values if required. Global exposure, actor priority and original gameplay/native-input gates must remain.
