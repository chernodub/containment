# Containment

Containment is a standalone desktop browser top-down 3D action roguelike with its own setting and storyline. Awaken aboard a hostile colony vessel and descend through twenty rooms across ten environments. Build your weapons and Combat Rig as the ship’s records reveal what happened. The overhaul preserves the story and ending.

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

Settings offer High (default) and Low graphics presets, with individual bloom, ambient occlusion, lens effects, distortion, atmosphere, dynamic lights, shadows and render-scale controls. Quality changes are manual; preferences persist when storage is available. Comfort controls include screen shake, flash intensity, combat text and threat radar. The system’s reduced-motion preference disables camera motion and flashes while preserving preferred values. Audio has master, music and effects volumes and mute.

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
- `npm run playtest` / `npm run playtest:smoke`: not available in this checkout’s `package.json`; no playtest runner ships here yet.
- `?debug=1`: opt into `window.__containmentDebug` for deterministic staged scenarios and explicit simulation stepping.

See [tooling instructions](scripts/nextgen/README.md) and the [overhaul documentation index](docs/nextgen/README.md). Staged captures are not full-playthrough or performance certification.

## Source, credits and licensing

Game and reusable domain systems: cdb-lumen / Containment. Original code and overhaul artwork/audio (icons, UI artwork, procedural textures, synthesized audio and authored VFX) use the repository [MIT license](LICENSE). This scope excludes retained third-party media.

Runtime dependencies are [Three.js](THIRD_PARTY/Three-LICENSE.txt) (MIT) and [@dimforge/rapier3d-compat](THIRD_PARTY/Rapier-LICENSE.txt) (Apache-2.0). Barlow and Barlow Condensed are self-hosted under `public/fonts/`, licensed under [SIL OFL 1.1](THIRD_PARTY/Barlow-OFL.txt).

Adapted Unvanquished models, animations and embedded textures retain their Creative Commons terms: see [model credits](public/asset-credits.html). Existing audio/music attribution is in [audio credits](public/audio-credits.html) and `public/assets/audio/manifest.json`. Preserve [environment](public/assets/environment/CREDITS.md), [VFX flipbook](public/assets/vfx/CREDITS.md), [cryochamber](public/assets/benchmark/CREDITS.md) and other asset-local `CREDITS.md` notices. Asset licenses are not replaced by the code’s MIT license.
