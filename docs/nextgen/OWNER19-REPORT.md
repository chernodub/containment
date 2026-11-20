# OWNER19 hostile shooter visibility

The Spitter now shows a red pulse at its posed jaw and a short, depth-tested connector along its locked firing direction. The launch event fades the retained cue over roughly 150 ms. The renderer uses the existing instanced hostile-warning mesh. The priority mask reduces friendly ink around the shooter and connector to roughly 30% and gives the firing point stronger protection. The siege sweep narrows to its outline where it crosses a winding-up body.

In Dark, the suit light rakes the marine and the existing locator keeps a minimum opacity under warnings. Enemies within about 6 m or committed to an attack get a dim, cool contact pool with a fixed minimum ink level. Spitters in a ranged wind-up also get a roughly three-pixel red stroke around their footprint and can draw a small red light from the existing light pool. Distant idle enemies retain the room's dark grade.

## Visual review

The requested overlap and Dark frames use the labels `owner19-before`, `owner19-after` for the first pass, and `owner19-after2` for the revised contact floor in `artifacts/nextgen`. The supplied historical Safety Interlock storyboard was retained as `owner19-before/storyboard-safety-interlock-station.png`. The native runner's `--fast` and `--storyboard-room` modes are mutually exclusive.

I reviewed the paired frames at 1920×1080 and 480×270. I counted a match when I could trace a red direction stroke back to a specific body at 480×270.

| Frame | Before | First pass | Revised |
| --- | ---: | ---: | ---: |
| `value14-overlap-arc-communal-atrium-04.png` | 0 / 1 | 1 / 1 | 1 / 1 |
| `value14-overlap-cryo-communal-atrium-04.png` | 0 / 1 | 1 / 1 | 1 / 1 |
| `cond15-dark-heavy-atrium-communal-atrium.png` | 0 / 2 | 2 / 2 | 2 / 2 |

The overlap fixture's wind-up summary counts melee phases. The captured Spitter warning events and the paired frames show an active ranged wind-up in each overlap frame above. In the Dark Atrium frame two red connectors and red contact rings make both firing bodies traceable even with Brutes in front of them. The baseline leaves the same attackers visible mostly through their pale organ and outline.

The close-range Whiteout sequence `g4-danger-whiteout-containment-annulus-01.png` through `-03.png` separately showed 0 / 1 before and 1 / 1 after in each of three frames, spaced 50 ms apart. Its baseline PNGs are in `owner19-before-g4` and its first-pass PNGs are in `owner19-after`. At native resolution the stroke meets the front of the Spitter. At 480×270 the pulse and individual jaw details blend together.

Tall bodies still clip portions of the depth-tested connector. In Arc the white chain still dominates outside the local shooter mask. At 480×270 the faint contact pools register as local light under the feet. They carry little facing information on their own.

In `cond15-dark-heavy-cargo-breached-loading-bay.png`, the revised pass shows four distinct jaw strokes in the cluster at right. The thin red footprint rings leave space between the bodies. The center pair still takes a closer look where one stroke crosses another body. In `cond15-dark-low-atrium-communal-atrium.png`, the marine ring remains clear and the distant contacts stay largely in shadow.

## Render counts

All 16 paired overlap frames matched draw for draw. Arc drew 127 to 140 calls and Cryo drew 130 to 134. The prepared program count was 149 before and after in every paired overlap frame. All seven first-pass Dark scenarios recorded zero new program creations after readiness. These figures are from the capture manifests.

## Desktop verification

`npm ci` and the production type-check and build passed. The first-pass capture produced 26 PNGs and reported zero capture failures or browser errors. The seeded baseline Arc campaign cleared 12 rooms with zero errors, including Safety Interlock Station. Its native entry, mid-fight, and clear frames are assembled in `playtest/arc-1729/storyboard-safety-interlock-station.png`. The updated Cryo campaign cleared four rooms with zero errors in `playtest/owner19-cryo/report.json`.

The updated Arc campaign also cleared all 12 rooms with zero errors. Its report is `playtest/owner19-arc/report.json` and its native Interlock storyboard is `playtest/owner19-arc/storyboard-safety-interlock-station.png`. The three-frame native storyboards use entry, mid-fight, and clear snapshots taken by the fast runner. The supplied historical sheet is the reference for the specific peak-pressure composition.

In the updated Interlock mid-fight frame two Spitter strokes remain visible at 480×270. The lower body partly enters the HUD area, making its anatomy harder to read than its shot direction.

The initial OWNER19 20-second High Arc benchmarks in Communal Atrium recorded a peak of 179 draws, 152 resident programs, and zero combat compiles in both runs. See `owner19-bench-before-20s/benchmark.json` and `owner19-bench-after-20s/benchmark.json`. The single-run timings used different host loads and live combat paths, so they are not comparable.


## Contact-floor revision verification

The `owner19-after2` production capture produced 26 PNGs with zero failures or browser errors. At native size and 480×270, the soft pools sit below the marine locator and the hostile red. The three ownership frames still read 4 / 4 in total. The four-room Cryo rerun in `playtest/owner19-after2-cryo/report.json` cleared every room with zero errors.

Program counts matched the first pass in all 26 paired frames. The 16 overlap frames matched all draw counts and stayed at 149 programs. All seven Dark frames recorded zero new programs after readiness. Against the first pass, the Dark active Atrium frame went from 106 to 107 draws and the other six Dark frames matched. Against the original baseline, the Dark active Cargo frame went from 92 to 91 draws and the heavy Cargo frame went from 125 to 126. The contact cues share the existing instanced draw.
