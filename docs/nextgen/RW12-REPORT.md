# RW12 — rewards and ending

Completed on branch `t3/title-key-art-weapons`. No push or PR.

Scope: reward/draft/loadout card UI, ending presentation, new reward illustrations and rig portraits. Merged `nextgen` beab6525 before work; `npm ci` and initial build passed. No game rules, catalogs, simulation, cameras or runtime rendering changed. No tests added.

Reward UI makes behavior the headline, uses a large lazy equipment illustration and compact family/rarity treatment, and retains exact rules/tradeoffs in inspection. Applicable augments show a before→after diagram in the existing tactical line style. Acquisition presentation does not delay native selection and respects reduced motion. A catalog-derived manifest selects id art then family fallback; adding an id-named file extends the inventory without a UI code edit. PNG fallback is carried by a picture element, with WebP source.

Keyboard-only native checks: Tab to card, I inspection, Escape, Enter acquisition; independent digit1 acquisition. Both acquired expected Incendiary, entered playing and produced no page errors. Evidence under `artifacts/nextgen/rw12-final/keyboard/`. Existing capture diagnostics found and drove fixes to720p overflow; no new assertion gates or test infrastructure.

Ending review rejected an attempted seated pose because native skin correction stretched limbs. Final approach retains validated K12 body pose, hides the weapon, lowers the head and uses the console to obscure the braced hands. This is a documented limitation, not a seated-pose claim. Ending copy retains the canonical story statement and removes duplicate portrait/receipt/outcome labels.

Detailed render and card review history: `plans/RW12-review.md`.

## Delivered art and coverage

- Twelve unique rig augment studies and seven family plates (kinetic, cryo, fire, arc/cycling, acid, recovery and universal); existing sixty-boon inventory resolves through the catalog-derived manifest. These cover the four authored paths through their effect family. New ENC12 ids immediately receive family art; an id-named WebP replaces it on the next build, with optional id PNG and existing family PNG fallback. New `whatChanges` text is supported without adding a hard requirement to the shared catalog type.
- All twelve current augments have a before/after preview. Spatial changes use the rig-select tactical geometry; resource/stat changes retain the ability drawing with a short changed-value readout. Inspection retains the full authored limitations and tradeoffs.
- Four 1024px portrait masters plus existing 256/640/1024 WebP variants: Breacher forearm guard, Cryo lowered weapon/coolant gesture, Pyro tank-facing torso and pilot flame, Arc stride and coil discharge. No source actor or skin-weight changes.
- Ending replaces the standing armed portrait with the final uplink, a small operator at a console, silent occupied capsules and separated ship sections. One canonical outcome statement preserves the warning sent / ship and passengers lost meaning.

## Rebuilding and evidence

Source: `tools/assets/rw12-rewards/README.md`. Blender 5.3, Cycles denoise, four render threads. All imported K12 rig hardware and actor geometry are read-only; original scene meshes use the repository MIT license. No new runtime dependency.

Gallery: `/Users/chernodub/.t3/worktrees/containment-game/t3-6be7fff5/artifacts/nextgen/rw12-final/index.html`. It retains before images, card review rounds, five ending rounds, equipment studies, final portraits and final browser captures. Image byte inventory is `image-weights.json` alongside it.

## Honest visual limits

The equipment studies share a visibly procedural ribbed-vessel vocabulary; fire and frost are simple stylised geometry. The distant wreck remains simplified and tubular. The operator uses the validated standing pose behind a console rather than a fully seated performance; a seated edit failed skin deformation and was rejected. Portrait fingers still have small native grip/contact imperfections, and the pilot/coil effects are graphic accents. These are art limitations, not hidden verification passes.

## Shipping image weights

| Asset group | Preferred WebP total | Fallback total |
| --- | ---: | ---: |
| 19 reward studies, 960×600 | 300,064 B (293 KiB) | 8,335,720 B PNG |
| Four portraits, three responsive sizes each | 449,232 B (439 KiB) | 4,128,846 B PNG masters |
| Ending, 1280 and 1920 | 130,152 B (127 KiB) | 84,283 B JPEG |

These are inventory totals, not a single-screen transfer. A draft requests its visible images lazily; WebP-capable browsers do not also request the PNG fallback. Rendering/decoding is never awaited by draft selection. Existing build chunk-size warnings remain; no hardware performance claim is made from screenshots or the fixed-step campaign.

## Campaign

`npm run playtest -- --rig=cryo --seed=1729 --label=rw12-cryo-final --dist-dir=artifacts/nextgen/rw12-campaign-dist` exited 0: native death at service-shaft-landing (room 14), 13 rooms cleared, zero errors, zero defects. The campaign took 2709.6 wall seconds on the shared host. It used an immutable RW12 build snapshot preceding the final art/diagram-only refinements; final presentation is covered by the last build and capture round.

The first attempt stopped at room 9 with an asset-server `ERR_HTTP_HEADERS_SENT` exception after its live distribution had been rebuilt. The clean rerun started from the beginning against a frozen distribution. Its log and report are retained in `rw12-final/campaign/`; the failed attempt log is also retained. The temporary frozen distribution was removed only after the clean run exited.

## Final verification

- `npm ci` and `npm run build` passed. Existing bundle-size warnings only; no tests were added or run.
- Three browser card review rounds at 1920×1080 and 1280×720, including rig augment, weapon boon and elemental offers. The full final set covers starting boon, augment draft for each rig, pause loadout, results, death, ending and all four rig-select portraits: 13 screens at each size. Every final image was opened at native size and 480×270.
- Final focused recaptures corrected the two-banner Pyro overflow, aligned install rows at720 and centered the ending frame at both sizes. The720 ending uses more of the available image height. All existing capture diagnostics pass.
- Keyboard-only draft inspection and acquisition passed through both Enter and the number shortcut, with no page errors. Existing hooks are unchanged. The acquire echo is bypassed under `prefers-reduced-motion` and never delays selection.
- Cryo1729 campaign exited0 with a normal death,13 rooms cleared, zero errors and zero defects; see the campaign section for the failed first attempt and isolated rerun.
- One owned browser at a time; no computer-use tools. The shared preview's repeated snapshot timeout was documented before using the repository's native capture fallback. All owned capture browsers closed when their runners exited.
- Render `.blend` files, scratch art and duplicate intermediate capture directories were removed after consolidating the final gallery. Final captures are in `after-1080/` and `after-720/`; manifests, keyboard evidence and review fixes remain alongside them.

The two-banner Pyro draft intentionally gives art less height to preserve both existing contextual messages and the footer. It remains the least spacious card layout. The ending is stronger as a distinct scene but is still the weakest art asset: simplified hull construction and a small, partly hidden operator limit its emotional weight.
