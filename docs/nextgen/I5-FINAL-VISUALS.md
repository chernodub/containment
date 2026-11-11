> Historical policy-v1 evidence. Targeted aiming was subsequently corrected and frozen as policy v3 at `e97cf06107c6e23f9f7b96ac94f8b95ba3e7163d`. These receipts retain their original source identities and do not replace final v3 campaign/gate evidence.

# I5 approved-build visual evidence

Capture label **`i5-final`** produced **20 verified PNGs**, four motion sheets and no recorded errors, failures or font fallbacks. The separate held-Overdrive debug fixture passed all requested state/HUD assertions and recorded no errors. Both capture browsers and their local servers closed before the final organic campaign queue began.

All evidence uses immutable `artifacts/nextgen/i5-continuation/approved-dist-78c7a10`, source **`78c7a10c6f3c07471fbd5ae630d5a6a79d6dfed6`**, 1920×1080, DPR 1, hardware `ANGLE (Apple, ANGLE Metal Renderer: Apple M1 Pro, Unspecified Version)`. No build or game/render/tooling source change was made for these captures.

## Receipts

```sh
npm run capture -- --label=i5-final --width=1920 --height=1080 --scenarios=title,rig-select-pyro,shop,ability:afterburn,ability:flashfire,ability:napalm-charge,f2-recovery,feel-impact-fixture --dist=/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/i5-continuation/approved-dist-78c7a10 --dist-source-sha=78c7a10c6f3c07471fbd5ae630d5a6a79d6dfed6
```

Log: `artifacts/nextgen/i5-continuation/final-gates/capture-i5-final.log`: **20 PNGs in 90.76 s; capture exit code 0**. The gallery's `manifest.json` records the explicit distribution path/source SHA, `errors:[]`, `failures:[]`, `fontFallbacks:[]` and hardware Metal capture without software fallback.

Application fingerprint:

`aa785259f835665a9bfa188a3305ffec695c7aedf73ec8a3c63f645429ecdefe`

It hashes sorted relative paths plus raw bytes for `index.html` and top-level JavaScript/CSS bundles; it is not a complete static-asset hash. The held fixture's metadata retains this fingerprint and its exact source directory.

The registered scenarios and the standalone held fixture are explicitly staged diagnostic evidence, not organic campaigns or encounter-balance measurements. Their charge grants, validated room staging and presentation-event injection must remain labeled as fixtures.

## Held Overdrive state

A fresh Arc Awakening Bay fixture used the validated debug room helper, filled the meter, activated Overclock through the ordinary public game action, advanced 6,000 simulated milliseconds until inactive, then filled the meter again. No UI snapshot was injected. Exactly one authoritative Overdrive use was recorded; the game remained in real combat in the same ordinary room.

The actual runtime and HUD then reported:

```text
charge: 1
active: false
roomLimited: true
overdrive.ready: false
slots.overdrive.ready: false
actual .ability-value: NEXT ROOM
errors: []
```

`held-overdrive.metadata.json` retains the action sequence, snapshots, use count, host load, source SHA and all error receipts. The full cyan meter and wrapped NEXT / ROOM label are visible in the PNG; the unavailable state does not advertise READY.

## Opened review and critique

I opened the actual title, Pyro selection, shop, Afterburn and Napalm frames, held meter, graphics recovery, Afterburn/Flashfire sheets and the feel-impact sheet.

- **Title and rig selection:** strong title hierarchy, a clear focused Wake up action, distinct rig colors/icons and an obvious Equip Pyro button. Continue and utility actions fit the desktop frame. The marine reads well against the dark scene; the brute's lighter finish and weak-looking ground contact still deserve the art owner's live review.
- **Pyro kit:** the rig screen presents the actual 25-damage Flashfire and its six-second cooldown; Napalm's six-second duration, 120 radius and twelve-second cooldown fit cleanly. Napalm's circle and orange perimeter are distinct from the cool floor, and its ranged frame leaves the marine easy to identify. Flashfire's directional wave progresses across the sheet.
- **Dense Afterburn fixture:** the trail remains visible behind the dash, and BURNING text supplements color. The staged cluster piles large enemy bodies over the marine, and pale hit flashes dominate that overlap. This is the clearest remaining readability concern in this gallery; a human should check whether the marine stays easy to find during real close-range swarms. No renderer fix was attempted here.
- **Held meter and recovery:** NEXT ROOM fits within the action bar and distinguishes the full-but-spent ordinary-room state. The recovery panel clearly says Graphics restored, keeps the expedition held and offers Return to pause separately from Reload game. Background gameplay remains visually blocked in the capture.
- **Shop:** free Collect supplies is prominent; paid services are visibly disabled with their prices/reasons at zero credits. This particular screenshot illustrates affordability, while the paid-no-benefit rule is covered by the gameplay/UI tests.
- **Motion:** the 25 ms feel-impact sheet records simulation timestamps **0, 0, 0, 33 ms**. The repeated opening pose and resumed fourth pose support the preserved hold/resume timing. The four-frame artifact is stronger as timing evidence than as proof of impact weight; human play is still needed to judge camera feel, sound and dense-combat readability. It is not a frame-budget measurement.

## First eight files for the lead

1. [Cinematic title](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/i5-final/title.png)
2. [Pyro rig selection](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/i5-final/rig-select-pyro.png)
3. [Afterburn in the dense staged pack](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/i5-final/ability-afterburn-awakening-bay-03.png)
4. [Napalm Charge](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/i5-final/ability-napalm-charge-awakening-bay-03.png)
5. [Full held Overdrive meter](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/i5-final/held-overdrive.png)
6. [Actual graphics recovery hold](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/i5-final/f2-recovery.png)
7. [Feel-impact motion sheet](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/i5-final/feel-impact-fixture-awakening-bay-sprite.png)
8. [Shop](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/i5-final/shop.png)

The gallery at `artifacts/nextgen/i5-final/index.html` also includes Flashfire and all registered burst frames. No console errors or texture-blob failures were filtered. Final organic campaign results are reported separately.
