# Containment

Containment is a standalone desktop browser top-down 3D action roguelike with its own setting and storyline. Awaken aboard a hostile colony vessel and descend through twenty rooms across ten environments. Build your weapons and Combat Rig as the ship’s records reveal what happened. The overhaul preserves the story and ending.

The current presentation uses a graphic, inked sci-fi look: broad surface value bands, authored actor-region lines, family-specific creature forms and fixture-shaped lighting. The marine carries cyan-white armor accents. Friendly sustained effects yield around actors and hostile warnings; fire, ice constructs and electrical effects follow the same combat priority. Rig selection has original suit portraits, recovery stations preview current and resulting resources against their caps, and the story ending has an illustrated final transmission.

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

The bottom action bar, vitals and right HUD column publish their measured screen space to the combat camera. Framing favors the marine and nearby engaged threats within the usable viewport. When threats intersect HUD panels, those panels fade and a separate danger marker remains visible. Damage from the same target, source and element is consolidated into running totals. Comfort controls include camera movement, combat flashes, combat text with reduced feedback, and threat radar. The system’s reduced-motion preference disables camera motion and flashes while preserving preferred values. Audio has master, music and effects volumes and mute.

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
- `?debug=1`: opt into `window.__containmentDebug` for deterministic staged scenarios and explicit simulation stepping.

See [tooling instructions](scripts/nextgen/README.md) and the [overhaul documentation index](docs/nextgen/README.md). Staged captures are not full-playthrough or performance certification.

For repeated hardware measurements, use one benchmark browser with other capture/playtest browsers closed, for example `npm run bench -- --label=review-bench --rooms=relay-racks,swarm-junction --repeat=5 --seconds=20`. Reports retain host load, renderer, frame and CPU quantiles, adaptive scale, draws and combat shader creation. The default bot campaign sends native keyboard/mouse input and renders every fixed simulation tick; `--realtime` observes the normal production RAF loop. Fixed-step campaign timings and simulation-only policy results do not certify hardware frame rate or native-camera parity.

## Source, credits and licensing

Game and reusable domain systems: cdb-lumen / Containment. Original code and overhaul artwork/audio (icons, UI artwork, procedural textures, synthesized audio and authored VFX) use the repository [MIT license](LICENSE). This scope excludes retained third-party media.

Runtime dependencies are [Three.js](THIRD_PARTY/Three-LICENSE.txt) (MIT) and [@dimforge/rapier3d-compat](THIRD_PARTY/Rapier-LICENSE.txt) (Apache-2.0). Barlow and Barlow Condensed are self-hosted under `public/fonts/`, licensed under [SIL OFL 1.1](THIRD_PARTY/Barlow-OFL.txt).

Adapted Unvanquished models, animations and embedded textures retain their Creative Commons terms: see [model credits](public/asset-credits.html). Existing audio/music attribution is in [audio credits](public/audio-credits.html) and `public/assets/audio/manifest.json`. Preserve [environment](public/assets/environment/CREDITS.md), [VFX flipbook](public/assets/vfx/CREDITS.md), [cryochamber](public/assets/benchmark/CREDITS.md) and other asset-local `CREDITS.md` notices. Asset licenses are not replaced by the code’s MIT license.

Ability VFX use one mipmapped 2048² atlas (2.76 MB): CC0 Unity Labs fire/smoke/explosion flipbooks, CC0 Kenney Particle Pack, and original offline-generated frost/energy/decal masks. [Manifest, source hashes and licenses](public/assets/vfx/containment-v6/CREDITS.md); regenerate with `python tools/assets/vfx/build_atlas.py` in a Pillow/NumPy environment, using the isolated data-only sources described there.
