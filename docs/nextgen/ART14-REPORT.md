# ART14 interface art

ART14 brings the live marine, creature models, pickups and room kits into the interface through the production renderer. The studio samples the game’s actor materials, geometry buffer, ink and grade. It uses a shared three-quarter camera for cards and the deck tilt for route and lesson scenes. The native before/after diagrams still explain the exact rules.

## Illustration inventory

| Interface slot | Before and source | ART14 |
| --- | --- | --- |
| Title key art | `public/assets/ui/u10/{title,background,midground,hero,foreground,fog}-*`. Layered Blender painting by `tools/assets/u10-keyart/`. Soft 3D. | `title-hero.webp` is the live Breacher. `title-composite.webp` blends it into the remaining U10 plates. Animated and reduced-motion title use the same hero. |
| Rig selection, pause and debrief portraits | `public/assets/portraits/u10/*-bust*`. Blender with `tools/assets/k12-hero/portraits.py`. Glossy studio 3D. | Four transparent `portrait-*.png` frames from the current marine and equipped weapons. |
| Starting boons, weapon boons, augments and owned boon thumbnails | `public/assets/ui/rewards/`, selected by `src/ui/rewardArt.ts`. Blender studies from `tools/assets/rw12-rewards/` and `tools/assets/ui13-rewards/`. Glossy 3D. | `reward-*.webp`. Each augment gets a shot entry. Ordinary boons share family or path shots. The five standalone `weapon-*.webp` shots are available in the studio library. |
| Rules in rig, draft and loadout inspection | `src/ui/screens/abilityVignettes.ts` and `templates.ts`. Hand-authored diagram SVG. Line art. | Kept as diagrams. The adjacent character and boon illustrations use the studio. |
| Shop supplies and services | `src/ui/screens/serviceArt.ts`. Hand-authored SVG objects. Line art. | `service-*.webp` for repair health, armor, ammo, medkit, grenades, upgrade and revive. Upgrade and revive use existing kit props. Reroll uses the live credit-token pickup as its visual analogue. |
| Route landmarks and detours | `src/ui/screens/routeVignettes.ts`. Hand-authored landmark section drawings and room footprint diagrams, plus service SVG or reward art for stakes. Line art and glossy 3D. | Twenty current-story room shots and fourteen detour and workshop shots under `route-*.webp`. Workshop choices stage the augment illustration with the equipment bench. Old branching rooms keep the footprint view. |
| Death lessons | `src/ui/screens/damageReport.ts`. Hand-authored small SVG marks. Line art. | Seven `lesson-*.webp` attack studies with projected red footprints and escape arrows. |
| Ending transmission | `public/assets/ui/u10/ending-*`. Blender scene from `tools/assets/rw12-rewards/ending.py`. Soft 3D. | Kept the authored transmission illustration after the production room study lost the original focal point and ship silhouette. |
| Gameplay reference | Live models in `src/render/`. Three.js with the production GeometryBuffer and postprocessing. Outlined toon. | Source for the studio. |

Small interface keys, weapon picker glyphs, status icons and the ship map retain their functional artwork.

## Regeneration and weight

Run `npm run studio`. It builds the current renderer, starts one headless Chromium session, prepares game rooms through `?debug=1`, and writes `public/assets/ui/studio/`. The manifest records the input, output and encoded bytes. The same command incorporates future creature and weapon model changes. See the ART14 section of [the capture README](../../scripts/nextgen/README.md) for custom shots.

| Output group | Images | Encoded bytes |
| --- | ---: | ---: |
| Title | 2 | 81,842 |
| Rig portraits | 4 | 597,733 |
| Reward and augment scenes | 31 | 440,242 |
| Services | 8 | 30,316 |
| Weapon studies | 5 | 35,378 |
| Route rooms and detours | 34 | 599,024 |
| Death lessons | 7 | 67,858 |
| Total image payload | 91 | 1,852,393 |

The title receives a priority composite and retains the layered reveal. Other wired images request lazy decoding and loading. The prior title and reward source assets remain in the repository. The studio did not introduce third-party packs. The credits now identify the reused Kenney and Quaternius kits in the interface stills.

## Visual review and open differences

- The initial augment studies let large effects crowd the left edge. The first revision widened the common frame and grounded subjects on the same teal deck finish. The second revision supplied deployed barriers, ice walls, pylons, pools and links to the production effect renderer instead of depicting only their cast flash.
- The initial shop studies made shallow supplies look flat. The revision moved the fill onto a shared teal floor and pulled the card framing back to preserve the object silhouettes. The resuscitator and upgrade bench represent their services with existing ship props. Reroll uses an existing token because the game has no dedicated world model for that service.
- The detour review widened the Warden/cache composition and adjusted the deck camera to the native tilt. Route rooms center on named authored spaces. In wider rooms some fixtures still read as deck context at card size. The stake studies use recognizable kit props, and some stand in for the named encounter object. The workshop bench and relay console are room-kit props. Early Salvage depicts the cache without a guard. The late cache depicts a Warden.
- Several upgrades still depict the parent effect more clearly than the behavior change. Shard Harvest uses the native shatter burst and three frost links to show the fan-out. The shared weapon-boon studies emphasize a theme and can repeat across offers.
- Lesson art is an authored replay of a pose and warning, with a translucent marine and an instructional arrow. The Warden footprint is a charge illustration, and the Matron study depicts the carrier-family strike. These images carry no combat result.
- The title still mixes the in-game marine with the original soft-3D ship and hostile layers. The ending keeps its original Blender illustration. Legacy route sketches retain the line-art treatment.

## Verification

- `npm ci` and the pre-edit production build passed. The final production build passed with Vite’s bundle-size advisory.
- `artifacts/nextgen/art14/before/` contains 12 verified baseline PNGs. The separate Crawler lesson fixture timed out at 120 seconds. The existing Results scenario succeeded.
- `artifacts/nextgen/art14/after/` contains 14 verified PNGs, including the Brute lesson from the existing failure-analysis fixture and a live Atrium gameplay reference. The `critique-final/` subfolder captures the second-round revisions to starting boons, augment draft, shop and route. The `closeup-final/` subfolder covers the last shop, route and Brute lesson changes.
- `pairs-1920/` and `pairs-480/` put baseline, final interface and the gameplay reference next to one another. The reduced frame review confirmed the white marine armor and ink treatment carry through to the interface. The revised fire and Arc receipts read better at draft size. The shop render surfaces still read as props photographed under studio light, while the route room uses the same fixtures as the gameplay reference.
- The five-room native Cryo playtest on Story, seed 1729, exited 0 at its room limit with five clears, zero errors and zero defects in 191.0 seconds. It ran before the last art-only update to reroll and late route stakes. The final art received follow-up captures. Campaign receipts are in `artifacts/nextgen/playtest/art14-cryo/`.
