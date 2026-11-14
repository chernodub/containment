# Containment

Containment is a standalone desktop browser top-down 3D action roguelike with its own setting and storyline. Awaken aboard a hostile colony vessel and descend through twenty rooms across ten environments. Build your weapons and Combat Rig as the ship’s records reveal what happened. The overhaul preserves the story and ending.

The current presentation uses a graphic, inked sci-fi look: broad surface value bands, authored actor-region lines, family-specific creature forms and fixture-shaped lighting. The marine carries cyan-white armor accents. Friendly sustained effects yield around actors and hostile warnings; fire, ice constructs and electrical effects follow the same combat priority. Rig selection has original suit portraits, recovery stations preview current and resulting resources against their caps, and the title and ending have original illustrated key art. HUD health, ammo and cooldown numerals retain an opaque local backing when surrounding panels fade.

This repository is a fork of [cdb-lumen/containment](https://github.com/cdb-lumen/containment); `nextgen` is the overhaul integration branch. The upstream [GitHub Pages game](https://cdb-lumen.github.io/containment/) follows upstream `main`, not this branch.

## Combat Rig

Choose Breacher, Cryo, Pyro or Arc at the start of a run. Each supplies a dash, tactical, power and Overdrive ability. Dash charges recharge; tactical and power abilities have cooldowns. Damage and kills charge Overdrive. Augments modify abilities as your build develops.

Names and summaries below are verbatim from [the catalog](src/game/abilities/catalog.ts).

| Rig | Slot | Ability | Summary |
| --- | --- | --- | --- |
| Breacher | Dash | Ram | Dash through enemies, shoving them aside. |
| Breacher | Tactical | Seismic Slam | Shockwave that launches everything around you. |
| Breacher | Power | Bulwark | Deploy an energy barricade that stops enemies and spit. |
| Breacher | Overdrive | Railbreaker | Charge and fire a lance that pierces the whole room. |
| Cryo | Dash | Frost Trail | Dash and leave a strip of chilling frost. |
| Cryo | Tactical | Cryo Nova | Ring of cold. Chills hard; freezes the already chilled. |
| Cryo | Power | Glacier | Raise an ice wall at the cursor. It shatters when it ends. |
| Cryo | Overdrive | Whiteout | A blizzard follows you. Frozen enemies shatter. |
| Pyro | Dash | Afterburn | Dash and leave a line of fire. |
| Pyro | Tactical | Flashfire | A wide cone of flame. |
| Pyro | Power | Napalm Charge | Lob a canister. The pool keeps burning. |
| Pyro | Overdrive | Meltdown | Become the fire. |
| Arc | Dash | Static Step | Dash and shock the nearest enemies on arrival. |
| Arc | Tactical | Overload | Chain lightning that stuns. |
| Arc | Power | Tesla Pylon | Deploy a pylon that zaps and links to you. |
| Arc | Overdrive | Overclock | Time slows for everything except you. |

## Controls and settings

Keyboard and mouse are required. Gameplay keys use physical positions (`KeyboardEvent.code`), corresponding to these labels on a US keyboard:

| Input | Action |
| --- | --- |
| WASD / arrows | Move |
| Mouse / left button | Aim / fire |
| Hold Space | Aim-assisted fire |
| R / G / E | Reload / grenade / medkit |
| 1–5 | Pistol / rifle / shotgun / plasma / rocket |
| Shift / Q / F / V | Dash / tactical / power / Overdrive |
| Esc | Pause/resume or close the current menu |

Settings offer High (default) and Low graphics presets, with individual bloom, ambient occlusion, lens effects, distortion, atmosphere, dynamic lights and shadow controls. Choosing a preset resets picture options to that preset; individual preferences persist when storage is available.

| Setting | Behavior |
| --- | --- |
| Ink outlines (`inkOutlines`) | Off, Silhouettes or Full. Full adds authored actor-region lines and architecture creases. High defaults to Full; Low defaults to Silhouettes. |
| Stylized shading (`stylizedShading`) | Broad value bands and restrained surface detail; enabled in both presets. |
| Image sharpness (`resolutionScale`) | Manual internal render scale from 50% to 100%. |
| Adaptive resolution (`adaptiveResolution`) | High can gradually adjust internal resolution within 80–100% of the selected scale, with a 50% effective floor. Disable it for a fixed manual scale. Low disables adaptation. |

The bottom action bar, vitals and right HUD column publish their measured screen space to the combat camera. Framing favors the marine and nearby engaged threats within the usable viewport. Feasible remote fights progress from the previous rendered pose with bounded movement; the final solve can spend composition padding while retaining full-body HUD clearance. The final camera constraint preserves a minimum marine foot-to-head scale of about 100 CSS pixels at 1080p and limits outside-room coverage to 18% of the projected playable AABB on non-small axes. Concave room hulls can exceed that outside-area figure; exact hull coverage is reported separately. When threats intersect HUD panels, those panels fade and a separate danger marker remains visible. Damage from the same target, source and element is consolidated into running totals. Comfort controls include camera movement, combat flashes, combat text with reduced feedback, and threat radar. The system’s reduced-motion preference reduces additional camera motion and disables flashes while preserving preferred values. Audio has master, music and effects volumes and mute.

Progress saves between rooms, including unresolved rewards, when browser storage is available. Continue restores the checkpoint, rather than an in-progress combat frame. Death clears it. Storage failures are shown in reward, pause, result and title screens; a failed deletion can leave an old checkpoint available after reloading.

## Supported platform

As requested on 2026-10-31, development, CI and release acceptance target desktop browsers with keyboard and mouse. Phone controls, mobile compatibility and phone/touch test requirements are removed. Existing historical mobile evidence is retained as history; it is not a future release gate. Desktop resizing, keyboard accessibility, graphics recovery, checkpoint feedback and authored-room checks remain required.


## Development

Use Node.js 22.12+ and npm (CI uses Node 24). Production output is `dist/`; relative URLs support root hosting and the `/containment/` subpath.

```sh
npm ci
npm run dev
npx playwright install chromium
npm run verify
```

`npm test` and `npm run verify` chain Python asset tests requiring Blender. See [engineering rules](docs/nextgen/01-ENGINEERING.md) for the existing host limitation. The JavaScript gates are:

```sh
VITEST_MAX_WORKERS=2 npx vitest run --exclude scripts/cryo-model-preview.test.mjs
node --test scripts/cryo-model-preview.test.mjs
npm run build
npm run test:room-evidence
npm run test:smoke
npm run test:authored-smoke:all
```

Browser gates are desktop-only. Smoke tests production assets and credits under the Pages subpath, native actions, resizing and checkpoint flows. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use an existing Chromium.

- `npm run capture -- --label=review --scenarios=all`: generate a production screenshot gallery, manifests and burst sheets under `artifacts/nextgen/`.
- `npm run bench`: run the sequential realtime production benchmark; results describe the recorded machine and scenarios.
- `npm run bench:rooms`: audit fresh-page and sequential room preparation, resource inventories and shader creation after readiness.
- `npm run playtest -- --rig=<id> --seed=<n>`: automated bot campaign through the real production build with a JSON/HTML report; `npm run playtest:smoke` plays the first three rooms as a quick gate; `npm run playtest:sim` runs fast deterministic simulation-only campaigns for balance work.
- `node scripts/nextgen/i10-license-audit.mjs`: rehash shipped wave-6 kits/atlas and check CC0 provenance records, source exclusions and dependency notices without a browser.
- `node scripts/nextgen/i10-capture.mjs --label=final4 --dist=<frozen-dist> --dist-source-sha=<sha>`: serially replay the final3 evidence coverage with added wave-6 proofs; the capture and gallery manifests retain source hashes and failures.
- `?debug=1`: opt into `window.__containmentDebug` for deterministic staged scenarios and explicit simulation stepping.

See [tooling instructions](scripts/nextgen/README.md) and the [overhaul documentation index](docs/nextgen/README.md). Staged captures are not full-playthrough or performance certification.

For repeated hardware measurements, use one benchmark browser with other capture/playtest browsers closed, for example `npm run bench -- --label=review-bench --rooms=relay-racks,swarm-junction --repeat=5 --seconds=20`. Reports retain host load, renderer, frame and CPU quantiles, adaptive scale, draws and combat shader creation. The default bot campaign sends native keyboard/mouse input and renders every fixed simulation tick; `--realtime` observes the normal production RAF loop. Fixed-step campaign timings and simulation-only policy results do not certify hardware frame rate or native-camera parity.

The frozen wave-6 application `a4d05a9` was measured on Apple M1 Pro / ANGLE Metal, 1920×1080 DPR1, with 25 replenished native enemies and all four ability slots. The 20-room full-Arc ranking selected Relay Racks and Crew Checkpoint; five 20-second repeats per rig/tier produced 80 trials. All frame medians were 16.7 ms at 0.1 ms reporting precision; High p95 was at most 18.2 ms, High median adaptive scale at least .90, peak draws 289 and combat shader creations zero. Trial-start one-minute system load ranged 10.5–35.9. Five fresh/sequential room audits (210 public holds) measured median 764 ms and worst 2,019 ms, with all 42 room/mode medians below 1,500 ms. An earlier same-build Infested Pyro High trial at load 83.3 retained only .875 median scale; that miss remains explicit. High's half-size demanded soft-depth snapshot and 16.5 ms adaptive GPU operating target do not promise every-frame 60 fps. See [I10 evidence and limitations](docs/nextgen/I10-REPORT.md) for all repeats, source hashes, raw stalls and art qualifications. Final local evidence includes 739 validated native frames per desktop size, 78 organic campaign frames, a [three-way comparison](artifacts/nextgen/final4/compare.html) and [12-image showcase](artifacts/nextgen/final4/showcase.html). The galleries retain selected-enemy/Queen framing flags and visual shortcomings; they are not an unqualified art pass.

## Source, credits and licensing

Game and reusable domain systems: cdb-lumen / Containment. Original code and overhaul artwork/audio (icons, UI artwork, procedural textures, synthesized audio and authored VFX) use the repository [MIT license](LICENSE). This scope excludes retained third-party media.

Runtime dependencies are [Three.js](THIRD_PARTY/Three-LICENSE.txt) (MIT) and [@dimforge/rapier3d-compat](THIRD_PARTY/Rapier-LICENSE.txt) (Apache-2.0). Barlow and Barlow Condensed are self-hosted under `public/fonts/`, licensed under [SIL OFL 1.1](THIRD_PARTY/Barlow-OFL.txt).

Adapted Unvanquished models, animations and embedded textures retain their Creative Commons terms: see [model credits](public/asset-credits.html). Existing audio/music attribution is in [audio credits](public/audio-credits.html) and `public/assets/audio/manifest.json`. Preserve [environment](public/assets/environment/CREDITS.md), [VFX flipbook](public/assets/vfx/CREDITS.md), [cryochamber](public/assets/benchmark/CREDITS.md) and other asset-local `CREDITS.md` notices. Asset licenses are not replaced by the code’s MIT license.

Wave 7 creature anatomy, Queen/nest designs and marine rig modules are original code-authored artwork under the repository MIT license. They retain the credited Unvanquished meshes and animation rigs underneath. A Quaternius CC0 model was evaluated only in an ignored review distribution; no new third-party actor asset is shipped. Source and comparison provenance is recorded in [K7 provenance](docs/nextgen/plans/K7-provenance.md).

Ability VFX use one mipmapped 2048² atlas (2.76 MB): CC0 Unity Labs fire/smoke/explosion flipbooks, CC0 Kenney Particle Pack, and original offline-generated frost/energy/decal masks. [Manifest, source hashes and licenses](public/assets/vfx/containment-v6/CREDITS.md); regenerate with `python tools/assets/vfx/build_atlas.py` in a Pillow/NumPy environment, using the isolated data-only sources described there. The atlas and environment kits are deferred on title/settings; the first gameplay room hold waits for ability atlas decode/upload and room owners before shader preparation releases input.

Three sparse-room decks (Residential Gallery, Crew Checkpoint and Transmission Chamber) add connected flush access covers and inspection feeds in the existing floor pass. These are presentation surfaces without gameplay colliders; their height stays below .022 m. Room mood calibration restores original floor material colors before applying named gains, and shaft floor panels have separate material ownership from structural steel.

Environment kit geometry by **Kenney**, under **CC0 1.0 Universal**: [Space Station Kit](https://kenney.nl/assets/space-station-kit), [Furniture Kit](https://kenney.nl/assets/furniture-kit), [Nature Kit](https://kenney.nl/assets/nature-kit). Curated, palette-mapped GLBs are lazy room assets; original author licenses, source inventories and SHA-256 receipts live in [public/assets/kits/](public/assets/kits/). Conversion uses development-only [glTF Transform](THIRD_PARTY/glTF-Transform-LICENSE.txt) (MIT). These asset dedications remain separate from the repository code license.

Additional industrial props are from **Quaternius — Sci-Fi Essentials Kit (Standard)**, [author page](https://quaternius.com/packs/scifiessentialskit.html) / [author-uploaded CC0 release](https://opengameart.org/content/sci-fi-essentials-kit). [Pack receipts and license](public/assets/kits/quaternius-scifi-essentials/CREDITS.md). Detailed props are palette-mapped and simplified offline with [meshoptimizer](THIRD_PARTY/meshoptimizer-LICENSE.txt) (MIT, development only); the runtime uses ordinary GLB without a new decoder.

Wave 7 integrates rebuilt family anatomy and marine rig modules, persistent ultimate presentation, shared graphic combustion, cursor-local power placement previews, equipment-tied floor details, raised infestation and encounter-aware camera focus. Hostile acid pools use a dark perimeter with inward orange teeth; their shader is prepared before combat and sustained friendly effects yield to live pools. The Queen in `reactor-vault` is supported for **legacy saves only**; new twenty-room runs end with the Overload Floor holdout. Wave-7 acceptance evidence and remaining qualifications are recorded in [I11](docs/nextgen/I11-REPORT.md).
