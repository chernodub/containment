# I10 floor-value parameter trial

Status: initial prototype; native output and value acceptance are pending the parent engineer's combined build. Only `KIT_FLOOR_VALUE_GAIN` entries were changed by this task. The concurrent deck-architecture prototype is a separate change.

| Room | Previous gain | Trial gain | Saved calm median | Saved combat median range |
|---|---:|---:|---:|---:|
| Freight hold | 1 (default) | 1.40 | 58.3 | 43.9–48.9 |
| Shielding gate | .55 | .46 | 62.8 | 83.6–85.9 |
| Relay racks | 1 (default) | .90 | 60.1 | 59.8–83.6 |
| Swarm junction | .85 | .80 | 66.2 | 66.9–81.5 |
| Overload floor | .85 | .78 | 69.3 | 68.1–82.8 |
| Containment annulus | 1 (default) | .962 | 51.0 | 68.4–81.6 |

These are the saved `floor-preview-delivery/luminance.json` visible-deck samples: Rec.709-weighted sRGB PNG code values on the existing 0–255 scale, with legal world samples and saved occluder filtering. No exposure, image normalization, sample selection, band limit, actor, effect, status, lighting, geometry, material count or shader was changed by the parameter trial. The gain affects the kit's merged floor material, not every legacy floor surface.

The initial choices use the baseline excursions, actual floor coverage and fresh native PNG inspection. Freight frame 2 has dark brown-gray floor interstices between cargo islands. Raising that floor has substantial calm-value headroom. Shield frame 2, Relay frame 4, Swarm frame 1 and Annulus frame 3 include bright frost and lighting over the floor; those contributions do not necessarily respond to albedo. Overload frame 4 retains a warm reactor-side floor and a cooler frozen crowd side. Darkening floor albedo should preserve the authored warm/cool distinction, but that remains a native-image check.

Relay, Swarm and Overload use slightly stronger initial trims than the suggested .93/.82/.80 because a simple square-root response estimate still placed their brightest saved median just above 80. That estimate is a plausibility check only: tone mapping, ink, lighting, effect coverage and median rank changes prevent predicting final values from a single scalar. Global kit-floor coverage is approximately Freight 65%, Relay 89%, Swarm 42%, Shield 53%, Annulus 25% and Overload 60%; the actual visible sample subset varies by frame.

Annulus is deliberately limited to a 3.8% gain reduction. Its calm median of 51 leaves only one code value of lower-band headroom, while the combat median is 81.6. It may be impossible for this one uniform floor scalar to bring both inside 50–80. Do not claim the trial passes before rerendering; reject or revise this entry if calm falls below 50. No effect or exposure adjustment is authorized by this trial.

Actual-open paths, SHA-256 hashes and precise baseline medians are recorded in `artifacts/nextgen/i10/floor-value-trial-inputs.json`. Seven native originals were viewed: Freight 02, Shield 02, Relay 04, Swarm 01, Annulus calm 02 and combat 03, Overload 04. Relay and Swarm were individually reopened after an earlier multi-image response was truncated. No 720p or 480-pixel witness is claimed here; the parent owns subsequent matched native/720/480 checks and all performance gates.

Validation: `git diff --check` passed. The initial `npx tsc --noEmit` found only a concurrent `KitDeckArchitecture.test.ts:97` string-index typing error, reported to that file's owner; final combined typecheck is pending that fix. No tests were added to duplicate literal gain values. No build, browser, benchmark or commit was run by this task.
