# FX14 combat readability

The hostile fan in Communal Atrium can be picked out at 480×270 while Pyro is firing into a live crowd. The main visual change is a bright contour on the first strike whose footprint overlaps the marine. An opaque body or piece of scenery can still cover part of that contour. Secondary warnings retain the VALUE14 fill budget and sweep weighting.

## Rendering and HUD

- The depth-tested warning union still clips to native sectors, circles and capsules. It adds a dark band around the perimeter in the same draw. The warning nearest in time that can reach the marine gets the bright contour. Selection reuses the simulation's circle-versus-melee-footprint overlap helper and reads the current marine radius. A single pulse peaks during the final 200 ms, scaled by the flash preference.
- The existing 128×72 CPU priority texture now carries actor coverage in red and hostile coverage in green. It projects native warning contours, scan-converts them at mask resolution and includes persistent hostile pools. The rendered warning retains its analytic shape. The mask's footprint is quantized to its texel grid. It updates after final camera framing and uploads only when the contents change.
- Ability shaders and the legacy decal, frost field, tracer and friendly ring pools sample that texture. At full warning coverage, the shared shader keeps 20% of the friendly opacity. Flagship ground sheets switch to a dim, flat surface contribution under the warning. High and Low share the same small texture and existing render order. Its CPU and texture data are 18 KiB each, up from 9 KiB, with no additional render pass. Binding takes place during material construction or ability owner preparation.
- Napalm and fire keep their amber rim with sparser luminous islands. Frost and Whiteout carry less light through their interior cracks. Arc's persistent link keeps a narrow core and a weaker glow.
- Combat text uses off-white numerals with a small element-colored square. Ordinary hits use smaller type. Placement checks the whole label against a margin around the warning mask and the marine bounds, trying an open position before hiding the label. Status and zone ticks share one running total per target. The text matches zone hits to native ability tick receipts, holds the number while burn or poison is active or zone pulses continue, and gives it one rise and fade. A direct lethal hit folds in any running tick total at the terminal mark. Damage-number preferences still control the pooled labels.
- HUD chrome uses the same warning coverage, plus existing projected actor bounds, to decide when to fade. The critical local backplates stay opaque.

## Capture review

The before and after galleries contain 38 matched frames at 1920×1080. The Atrium sequences exercise actual attacks with staged positions and native tactical input. The four Armory frames are heavy build fixtures, using native actions against staged contacts.

- [Baseline](../../artifacts/nextgen/fx14/before/index.html)
- [Pyro first pass](../../artifacts/nextgen/fx14/pyro-round1/index.html)
- [Contour adjustment](../../artifacts/nextgen/fx14/pyro-round2/index.html)
- [After](../../artifacts/nextgen/fx14/after/index.html)
- [Matched side-by-side gallery](../../artifacts/nextgen/fx14/pairs/compare.html)

The initial baseline browser lost a deferred asset when `dist` was rebuilt. The affected frames were recaptured from a frozen copy of the original build. The first Pyro pass brightened the moving sweep and outline together. In the second pass only the outline receives the strongest weight, leaving the sweep legible as timing. The fire jet remains bright outside the fan.

Read times below are approximate visual review estimates at 480×270. They reflect a reviewer already familiar with the scene.

| Frame | Before | After |
| --- | --- | --- |
| Napalm High | Large disk down-right catches the eye first. Small underfoot warning takes a second look, about 2 s. | Underfoot edge is brightest, about 1 s. Dark rim separates the larger disk from fire. |
| Napalm Low | Small underfoot warning competes with the larger disk inside the fire ring, about 2 s. | Underfoot edge reads in about 1 s. The larger disk has a dark rim. |
| Armory Arc 01 | Small hostile disk below the marine, about 2 s under the bright cable. | Disk below the marine, about 1 s, with the cable still close. |
| Armory Breacher 01 | Threat markers below and above the marine's firing line, no ground hit identified on a first pass. | Same, the gold shock plane and off-axis markers still compete. |
| Armory Cryo 01 | Small red disk below the marine on the ice lane, about 2 s. | Same disk, about 1 s. |
| Armory Pyro 01 | Small disk below the marine at the fire trail tip, about 2 s. | Same disk, about 2 s because the red-orange trail still points into it. |
| Arc 01 | Faint fan under the marine from the left, about 2 s. | Bright fan edge, under 1 s. |
| Arc 02 | Left fan underneath the first bolt, about 2 s. | Fan outside edge clear, under 1 s. |
| Arc 03 | Left fan near the lower-left kill numeral, about 1–2 s. | Fan and bolt separate, under 1 s. |
| Arc 04 | Left fan with a kill label beside the forward edge, about 1–2 s. | Fan edge clear, under 1 s. |
| Arc 05 | Left fan where the chain clusters near its outer arc, about 1–2 s. | Outer arc clear, under 1 s. |
| Arc 06 | Left fan under the marine, about 1 s. | Arc traced before following the chain, under 1 s. |
| Arc 07 | Left fan with bright late sweep, about 1 s. | Outer arc clear, under 1 s. |
| Arc 08 | Left fan reaches the marine's feet, about 1 s. | Outline clear outside the silhouettes, under 1 s. |
| Breacher 01 | Faint fan left of the firing rest, about 2 s. | Marine already inside the highlighted fan, under 1 s. |
| Breacher 02 | Left fan under the yellow targeting perimeter, about 2 s. | Left fan edge clear, under 1 s. |
| Breacher 03 | Left fan, about 1–2 s. | Clear perimeter, under 1 s. |
| Breacher 04 | Left fan under the marine, about 1 s. | Bright edge reads quickly, under 1 s. |
| Breacher 05 | Left fan nearing strike, about 1 s. | Fan edge clear through early sparks, under 1 s. |
| Breacher 06 | Fan gone as shock hits the adjacent contacts. No further ground strike identified. | Same phase. The small remaining marker is under the marine amid debris and the shock ring. |
| Breacher 07 | No clear next ground strike through the shock and fallen actors. | Same. The marker under the marine takes about 2 s to locate. |
| Breacher 08 | No clear next ground strike as the shock reaches the edge. | Same. The marker is still partially hidden by the marine. |
| Cryo 01 | Faint left fan under marine, about 2 s. | Fan stands out from first frost, under 1 s. |
| Cryo 02 | Left fan within the bright expanding ring, about 2 s. | Near edge distinct, under 1 s. |
| Cryo 03 | Left fan amid white frost and blue numerals, about 1–2 s. | Font clears the red area, outline under 1 s. |
| Cryo 04 | Left fan behind the marine and adjacent frost, about 1–2 s. | Fan contour distinct from ice ring, under 1 s. |
| Cryo 05 | Left fan visible under crystallized contacts, about 1 s. | Selected fan clear, under 1 s. |
| Cryo 06 | Left fan is evident but secondary edge blends into frost, about 1–2 s. | Bright primary arc leads, under 1 s. |
| Cryo 07 | Left fan under ring and freeze shards, about 1 s. | Primary edge leads, under 1 s. |
| Cryo 08 | Left fan under the marine, about 1 s. | Primary edge under 1 s. Secondary extent still needs a second look. |
| Pyro 01 | Faint fan left of the marine, about 2 s among the orange numerals. | Front and lower side read under 1 s. |
| Pyro 02 | Left fan partially competes with the ignition jet, about 2 s. | Outside arc and dark border under 1 s. |
| Pyro 03 | Left fan reaches the firing rest, about 1–2 s. | Edge reads under 1 s despite the bright jet. |
| Pyro 04 | Left fan under the marine at the pool rim, about 1–2 s. | Both visible sides read under 1 s. The origin remains under scenery. |
| Pyro 05 | Left fan partly blends with a wide sheet of flame, about 2 s. | Bright perimeter reads under 1 s, including at the flame side. |
| Pyro 06 | Left fan crosses the burning floor, about 1–2 s. | Primary arc clear under 1 s. The other commitment is darker. |
| Pyro 07 | Left fan's advancing arc shows, about 1 s. | Outer edge reads under 1 s, with the adjacent orange field separate. |
| Pyro 08 | Left fan beside a secondary red-orange triangle, about 1–2 s to choose. | Primary clear under 1 s. Following the second edge takes longer. |

Remaining slow frames include Armory Pyro and Breacher, and the small underfoot marker in Breacher 06–08. Atrium Pyro 05–08 still has a bright fire jet or flame volume outside the footprint. In greyscale the distinction is driven by the contour and its backing, especially where the jet points out of the fan. Parts of the upper edge and origin pass under the marine and the broken fixture. Opaque occlusion interrupts parts of the contour.

## Benchmark

One 20-second trial per combination on Apple M1 Pro with ANGLE Metal. Both matrices used Communal Atrium and Armory, with Pyro and Cryo in High and Low. Columns show before → after. Frame and CPU are p50 / p95 in milliseconds. Load is the host's one-minute average at trial start and end, on 10 logical cores.

| Room · rig · tier | Frame ms | CPU ms | Maximum draws | Mid-combat programs | Host load before | Host load after |
| --- | --- | --- | ---: | ---: | --- | --- |
| communal-atrium · pyro · high | 32.7 / 50.6 → 32.8 / 59.1 | 20.0 / 33.0 → 19.7 / 34.5 | 194 → 180 | 0 → 0 | 96.1 → 88.1 | 67.7 → 77.5 |
| communal-atrium · pyro · low | 16.9 / 32.8 → 17.7 / 48.5 | 13.5 / 23.5 → 13.6 / 26.0 | 166 → 167 | 0 → 0 | 88.1 → 74.9 | 77.5 → 85.0 |
| communal-atrium · cryo · high | 32.7 / 58.3 → 33.4 / 75.2 | 15.3 / 27.9 → 16.3 / 30.4 | 168 → 169 | 0 → 0 | 74.9 → 77.0 | 85.0 → 71.7 |
| communal-atrium · cryo · low | 16.8 / 33.4 → 24.8 / 49.9 | 10.9 / 18.9 → 11.4 / 21.4 | 156 → 153 | 0 → 0 | 77.0 → 88.2 | 71.7 → 62.1 |
| armory · pyro · high | 32.2 / 50.2 → 41.6 / 75.0 | 15.4 / 26.9 → 17.8 / 33.8 | 251 → 254 | 0 → 0 | 88.2 → 90.9 | 62.1 → 48.8 |
| armory · pyro · low | 16.8 / 33.3 → 25.1 / 51.5 | 12.3 / 21.1 → 12.9 / 22.4 | 238 → 242 | 0 → 0 | 90.9 → 93.3 | 48.8 → 41.7 |
| armory · cryo · high | 32.8 / 50.9 → 41.6 / 82.9 | 16.0 / 26.9 → 20.2 / 36.8 | 247 → 245 | 0 → 0 | 93.3 → 111.6 | 41.7 → 40.2 |
| armory · cryo · low | 17.0 / 33.5 → 16.8 / 33.3 | 12.3 / 20.8 → 11.0 / 18.6 | 237 → 235 | 0 → 0 | 111.6 → 111.6 | 40.2 → 51.5 |

The warning uses its original draw and adds zero passes. Peak draw count reaches 254 in the final matrix. Every sampled trial recorded zero mid-combat program creation. Final Armory High p95 increased from 50.2 to 75.0 ms on Pyro and from 50.9 to 82.9 ms on Cryo. Several CPU medians and tails also increased. Host load was high and shifted between trials. A separate run of the same renderer before the final combat-text change returned 51.1 ms and 74.2 ms for these two frame p95s. The measurements leave the CPU acceptance criterion unresolved.

- [Baseline benchmark receipt](../../artifacts/nextgen/fx14/bench-before/benchmark.json)
- [Final benchmark receipt](../../artifacts/nextgen/fx14/bench-final/benchmark.json)
- [Earlier renderer benchmark receipt](../../artifacts/nextgen/fx14/bench-after/benchmark.json)

## Native playtest

The final production build passed `npm run build`. The unassisted desktop Pyro bot on seed 1729 reached its room limit after clearing Awakening Bay, Passenger Vault, Residential Gallery, Communal Atrium, Crew Checkpoint and Armory. The runner reported zero errors and zero defects. [Playtest gallery and report](../../artifacts/nextgen/playtest/fx14/index.html)
