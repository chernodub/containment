# Overhaul documentation

The `nextgen` branch integrates the overhaul. Reports describe work at their recorded revisions; verify current behavior in source. Tool usage is in [scripts/nextgen/README.md](../../scripts/nextgen/README.md).

## Current presentation and controls

The wave-4 [graphic ink direction](streams/W4-direction.md) extends the original vision. The current renderer combines geometry silhouettes, authored actor-region lines, broad material value bands and fixture-shaped room lighting. Actor interior lines follow major body/armor regions rather than skin-normal noise; world architecture retains crease lines. Friendly sustained effects yield to actors and hostile attack warnings. Simulation footprints and hit decisions remain in the deterministic game layer.

The [graphics contract](../../src/render/graphicsOptions.ts) exposes `inkOutlines` (`off`, `silhouette`, `full`), `stylizedShading` and `adaptiveResolution` alongside the existing effects and manual `resolutionScale`. High defaults to Full ink and adaptive resolution; Low defaults to Silhouettes and fixed scale. Both presets enable stylized shading. The native settings controls persist preferences separately from expedition checkpoints.

The HUD publishes measured CSS-pixel reservations through its adapter to `DepthRenderer.setHudInsets`. The combat camera uses that usable area to frame the marine and selected engaged threats, with bounded pullback and a priority-pair fallback for wider encounters. Some wide encounters still exceed the bounded fit; projected bounds do not prove visibility through foreground scenery. Threats beneath the action bar, vitals or right column fade those panels and retain a separate danger marker. Combat text consolidates repeated damage by target, source and element. Rig portraits, recovery previews (current → resulting / maximum, including free allocation), and an illustrated final transmission complete the screen updates. See the [root README](../../README.md#controls-and-settings) for unchanged desktop keyboard/mouse controls and the settings reference.

Use `npm run capture` for staged native PNGs and burst sheets, `npm run bench` for serial realtime fight measurements, `npm run bench:rooms` for preparation audits, and `npm run playtest` for native-input bot campaigns. Keep benchmark browsers isolated from captures and campaigns. Reports include their clocks and limitations; staged screenshots and accelerated campaign CPU submission timings are not hardware frame-rate measurements.

## Direction and reports

- [00-VISION.md](00-VISION.md) — Creative direction, story constraints and Combat Rig design.
- [01-ENGINEERING.md](01-ENGINEERING.md) — Architecture, ownership, test policy and required gates.
- [02-ROADMAP.md](02-ROADMAP.md) — Stream sequencing and integration milestones.
- [F2-REPORT.md](F2-REPORT.md) — Final interface behavior and native input validation.
- [G1-REPORT.md](G1-REPORT.md) — Renderer pipeline, camera, lighting and graphics lifecycle results.
- [G2-REPORT.md](G2-REPORT.md) — World dressing, environment finishes and actor readability results.
- [I2-REPORT.md](I2-REPORT.md) — Renderer/UI/audio integration and combat readability validation.
- [I3-REPORT.md](I3-REPORT.md) — Audio integration and realtime behavior validation.
- [I4-REPORT.md](I4-REPORT.md) — Performance integration, profiling and benchmark limitations.
- [INTEGRATION-6A-REPORT.md](INTEGRATION-6A-REPORT.md) — Integration checkpoint findings and remaining release work.
- [V2-REPORT.md](V2-REPORT.md) — Elemental ability presentation, budgets and capture results.
- [I8-REPORT.md](I8-REPORT.md) — Wave-4 integration, acceptance method and revision-specific evidence.
- [I9-REPORT.md](I9-REPORT.md) — Ordered wave-5 integration, five-repeat acceptance, gallery provenance and retained art/framing limitations.
- [R7-verdict.md](reviews/R7-verdict.md) — Independent wave-4 review and the B1–B15 wave-5 defect list.
- [U5-REPORT.md](U5-REPORT.md) — HUD reservations/fading, damage consolidation, rig portraits, recovery clarity and illustrated ending.
- [V5-language.md](plans/V5-language.md) — Shared effect language, ability constructions, Cryo boundary budget and retained validation.
- [G5-REPORT.md](G5-REPORT.md) — Authored actor regions, body signatures, family silhouettes and Queen transformation.
- [G6-REPORT.md](G6-REPORT.md) — Environment construction, shaped fixture spill, consuming infestation and usable-viewport camera contract.

## Stream briefs and plans

- [A1-abilities](streams/A1-abilities.md) — Stream brief and acceptance scope.
- [G1-render](streams/G1-render.md) — Stream brief and acceptance scope.
- [G2-world](streams/G2-world.md) — Stream brief and acceptance scope.
- [S2-audio](streams/S2-audio.md) — Stream brief and acceptance scope.
- [U1-interface](streams/U1-interface.md) — Stream brief and acceptance scope.
- [U2-experience](streams/U2-experience.md) — Stream brief and acceptance scope.
- [V2-ability-presentation](streams/V2-ability-presentation.md) — Stream brief and acceptance scope.
- [V3-ability-spectacle](streams/V3-ability-spectacle.md) — Stream brief and acceptance scope.
- [A1-API](plans/A1-API.md) — Stream implementation plan, API notes or validation report.
- [A1](plans/A1.md) — Stream implementation plan, API notes or validation report.
- [F2](plans/F2.md) — Stream implementation plan, API notes or validation report.
- [G1](plans/G1.md) — Stream implementation plan, API notes or validation report.
- [G2](plans/G2.md) — Stream implementation plan, API notes or validation report.
- [I1a](plans/I1a.md) — Stream implementation plan, API notes or validation report.
- [I1b](plans/I1b.md) — Stream implementation plan, API notes or validation report.
- [I2](plans/I2.md) — Stream implementation plan, API notes or validation report.
- [I3-audio-notes](plans/I3-audio-notes.md) — Stream implementation plan, API notes or validation report.
- [I3-survival-audit](plans/I3-survival-audit.md) — Stream implementation plan, API notes or validation report.
- [I3](plans/I3.md) — Stream implementation plan, API notes or validation report.
- [I4](plans/I4.md) — Stream implementation plan, API notes or validation report.
- [S2-API](plans/S2-API.md) — Stream implementation plan, API notes or validation report.
- [S2-REPORT](plans/S2-REPORT.md) — Stream implementation plan, API notes or validation report.
- [S2](plans/S2.md) — Stream implementation plan, API notes or validation report.
- [U1](plans/U1.md) — Stream implementation plan, API notes or validation report.
- [U2](plans/U2.md) — Stream implementation plan, API notes or validation report.
- [V2](plans/V2.md) — Stream implementation plan, API notes or validation report.
- [integration-6a](plans/integration-6a.md) — Stream implementation plan, API notes or validation report.
