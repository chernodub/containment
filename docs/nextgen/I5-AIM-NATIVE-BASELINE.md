> Historical policy-v1 evidence. Targeted aiming was subsequently corrected and frozen as policy v3 at `e97cf06107c6e23f9f7b96ac94f8b95ba3e7163d`. These receipts retain their original source identities and do not replace final v3 campaign/gate evidence.

# I5 fixed-aim production baseline — native confirmation

Both requested organic native campaigns completed **20/20 rooms**, with `errors: []`, `defects: []` and runner exit code **0**. Pyro 1729 ran first, then Arc 1729; only one campaign browser was open at a time. A separate read-only title capture ran after Arc closed, then its browser and local server closed too. No assistance, resource grants, room skipping, code changes, commits or full gates were used for this task.

This is the **production baseline**, with `tuningEnabled:false`, not acceptance of I5's experimental encounter numbers or the final two-campaigns-per-rig cohort. The frozen source commit is `c3bd53b4f0f2c12735a1abb562f11eadb07c5a83`, policy epoch `i5-catalog-ability-aim-v1`, navigation epoch `i5-navigation-observer-v3`.

## Build and execution receipts

The build log `artifacts/nextgen/i5-continuation/aim-build.log` records `tsc --noEmit && vite build --outDir artifacts/nextgen/i5-continuation/aim-baseline-dist`, followed by **built in 533 ms**. Both campaigns and the title capture served that immutable directory. Its application fingerprint stayed unchanged before and after the runs:

`29623c5998a024b92568b4d89c8de9cf2a7a044822b45a21ed4734c7200ec3df`

The fingerprint covers sorted relative paths plus raw bytes for `index.html` and the top-level JavaScript/CSS application bundles: 21 files total. It is not a complete static-asset hash. Per-file hashes are in `artifacts/nextgen/i5-continuation/native-baseline/build-fingerprint.json`.

```sh
npm run playtest -- --rig=pyro --seed=1729 --fast --dist-dir=artifacts/nextgen/i5-continuation/aim-baseline-dist --label=i5-aim-baseline-native-pyro-1729
npm run playtest -- --rig=arc --seed=1729 --fast --dist-dir=artifacts/nextgen/i5-continuation/aim-baseline-dist --label=i5-aim-baseline-native-arc-1729
```

Each native label has `report.json`, `trace.ndjson`, copied harness sources, room screenshots and a hardest-moment sheet under `artifacts/nextgen/playtest/<label>/`. Captured command logs, explicit exit codes and comparisons live in `artifacts/nextgen/i5-continuation/native-baseline/`.

## Browser versus matching Node campaigns

The matching render-free reports are `artifacts/nextgen/playtest/i5-aim-v1-baseline-40/pyro-1729.json` and `arc-1729.json`. Both also complete 20/20 rooms. These are matching seed/policy outcomes, **not exact native replays**.

| Rig / metric | Native browser | Node |
| --- | ---: | ---: |
| Pyro outcome | complete, 20/20 | complete, 20/20 |
| Pyro combat seconds | 660.733 | 662.400 |
| Pyro kills | 563 | 565 |
| Pyro damage taken | 333.478 | 445.154 |
| Pyro Overdrives / rooms per use | 14 / 1.429 | 14 / 1.429 |
| Pyro ordinary-room p50 | 31.250 s | 27.783 s |
| Pyro Transmission / finale | 66.067 / 57.550 s | 65.383 / 61.333 s |
| Pyro accepted dash / Q / F / V | 247 / 87 / 49 / 14 | 242 / 88 / 48 / 14 |
| Arc outcome | complete, 20/20 | complete, 20/20 |
| Arc combat seconds | 763.483 | 771.700 |
| Arc kills | 563 | 565 |
| Arc damage taken | 248.295 | 347.064 |
| Arc Overdrives / rooms per use | 16 / 1.250 | 16 / 1.250 |
| Arc ordinary-room p50 | 31.750 s | 33.567 s |
| Arc Transmission / finale | 62.600 / 69.817 s | 74.217 / 75.517 s |
| Arc accepted dash / Q / F / V | 248 / 118 / 50 / 16 | 248 / 121 / 52 / 16 |
| Pyro wall seconds | 530.828 | 8.801 |
| Arc wall seconds | 518.037 | 16.151 |

Combat seconds come from authoritative `stats.roomTimeMs`. Ordinary-room p50 excludes the two holdouts and uses the existing bot's nearest-rank quantile. Ability counts and source totals are authoritative; direct ability damage alone does not measure ability control, protection, status/proc attribution or Overclock's weapon amplification.

| Outgoing source share | Native Pyro | Node Pyro | Native Arc | Node Arc |
| --- | ---: | ---: | ---: | ---: |
| Weapon | 47.74% | 47.61% | 52.99% | 51.93% |
| Direct ability | 16.50% | 17.05% | 28.51% | 29.11% |
| Status | 16.13% | 16.22% | 13.42% | 13.18% |
| Boon | 19.63% | 19.12% | 5.08% | 5.78% |

All 20 room-start boon lists match between browser and Node for each rig. The first Pyro discrepancy is room 2 Passenger Vault: 31.333 s native versus 27.217 s Node, with equal 12.097 incoming damage but different dash/Q counts. Arc first differs in room 4 Communal Atrium: 31.283 versus 26.567 s, with 46.094 native incoming damage versus zero in Node. Their eventual damage-taken totals differ materially even though completion and Overdrive counts match. Do not treat this pair as proof that Node predicts native survival percentages exactly. Full room-by-room values are retained in `pyro-comparison.json`, `arc-comparison.json` and combined `comparisons.json` in the native-baseline artifact directory.

## Loading, errors and host load

Neither campaign nor the title capture records a console/page/HTTP error or a texture-blob error. Both native campaign reports retain literal empty error and defect arrays. The longest observed loading intervals were Manual-control chamber: **3.873 s Pyro** and **4.102 s Arc**. No >5 s hold was recorded in this pair; the earlier R4 preparation/texture lifetime investigations remain open. These fresh-context campaigns do not replace a restart stress test.

Both reports identify `ANGLE (Apple, ANGLE Metal Renderer: Apple M1 Pro, Unspecified Version)`, 1920×1080, DPR 1. Read-only host checks and the runner record very high shared-machine load. The triples below are 1/5/15-minute load averages on 10 logical cores, not percentages:

| Sample | Load averages |
| --- | --- |
| Before either campaign, explicit host check | 277.98 / 413.82 / 440.85 |
| Pyro report start → final save | 345.604 / 417.001 / 441.050 → 267.983 / 360.597 / 413.640 |
| Between campaigns, explicit host check | 284.868 / 357.997 / 411.449 |
| Arc report start → final save | 300.494 / 360.022 / 411.850 → 322.824 / 371.479 / 404.830 |
| After Arc, before title | 266.301 / 347.736 / 393.924 |
| After title capture | 270.361 / 347.226 / 393.473 |
| Final check after both campaigns and the closed title browser | 190.000 / 276.459 / 354.107 |

`--fast` updates native input, simulation, scene, camera and actors at each 60 Hz tick while omitting intermediate raw GPU submissions. Fixed-tick CPU p95 windows retain the latest 2,048 room ticks; mean/max extend from that room's explicit reset. They exclude GPU completion and outer policy/Playwright/snapshot work. The largest per-room p95 windows reach **9.1 ms Pyro / 8.7 ms Arc**; individual recorded maxima reach **67.6 / 76.1 ms**. These shared-load, reduced-submission runs cannot certify normal RAF CPU/GPU headroom or isolate a performance cause.

## Opened visual evidence and critique

The new title was captured through the ordinary production URL, without debug controls or gameplay input. Metadata confirms `data-menu-presentation="cinematic"`, a 1920×1080 document without overflow, the hardware GPU above and `errors: []`. I opened that PNG, both hardest sheets and the full-resolution first Pyro hardest frame.

- **Title:** large lettering, a bright focused Wake up action and separated marine/brute silhouettes make the front door immediately legible. Native focus and the utility controls are clear. The brute's pale finish and weak-looking ground contact read less grounded than the marine; the art owner should judge that in the live animated scene.
- **Pyro hardest burst, Overload floor:** the spotlight and red armor keep the marine identifiable inside a dense close-range pack, and opaque HUD panels stay clear of the marine in this sample. Status words add readable meaning beyond color. Broad fire coverage, bright reactor surfaces and overlapping damage numbers compete for attention; a human should check hostile windup and safe-floor recognition at full combat speed.
- **Arc hardest burst, Diagnostic Gallery:** movement and enemy poses progress across the four consecutive frames, and the shifted action bar leaves the marine visible. Pale hit/status effects merge with the bright floor locally. Review lightning/control readability during live movement; four reduced sheet cells are not an animation-quality certificate.

First files for review:

- [Fresh cinematic title](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/i5-continuation/native-baseline/title.png)
- [Pyro hardest sheet](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/playtest/i5-aim-baseline-native-pyro-1729/hardest-sprite.png)
- [Pyro hardest full frame](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/playtest/i5-aim-baseline-native-pyro-1729/hardest-2672-0.png)
- [Arc hardest sheet](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/playtest/i5-aim-baseline-native-arc-1729/hardest-sprite.png)

No graphics changes were made in response to this review.

## Source provenance and remaining work

Both native reports record HEAD `c3bd53b4f0f2c12735a1abb562f11eadb07c5a83` and identical harness hashes. Key values are:

- Runner: `33f2b47e9b963d605808b0cbd7b4cb14a955dca1846e5e15844fb0a11f3a3110`.
- Shared policy: `157abd1190305651af6a2047d778d1db662a8f9bd258521cc3f26f1e2661e553`.
- Ability aiming helper: `6c3b6b2fea9c39a4deb024c61233edb8b373faeed3e749a424f9e19f2506589c`.
- Node combined policy hash: `7f82bedcd4f771a96d5d0eec8cca06857a04561362d592967d1c925d3ddbd166`.
- Node game-source hash: `f7cb49329e57843eec613886391b9572e995572b6a5a63d0f74de8cc811c4a6c`.
- Node bundle hash: `ea1d9af17634bbf78ff852d41fd9e1bd76a63ba4a3a80634863848dfe589976d`.

Keep this corrected-aim baseline separate from the earlier bot-policy cohorts and disabled I5 experiments. The lead still needs an accepted encounter candidate, the required seed distributions and final native confirmation across every rig. This task stops after the two requested baseline campaigns and the one authorized title capture.
