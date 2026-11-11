> Historical policy-v1 evidence. Targeted aiming was subsequently corrected and frozen as policy v3 at `e97cf06107c6e23f9f7b96ac94f8b95ba3e7163d`. These receipts retain their original source identities and do not replace final v3 campaign/gate evidence.

# I5 candidate — assisted native legacy completion

The frozen candidate's **legacy v2 Arc seed 1729 completed 12/12 rooms**, including a real Queen defeat in **163.950 simulated seconds**. Runner exit code was **0**, with literal `errors: []` and `defects: []`. The campaign browser closed after completion. This assisted result remains separate from organic story balance cohorts.

## Command and initialization

```sh
npm run build -- --outDir artifacts/nextgen/i5-continuation/legacy-candidate-dist
npm run playtest -- --rig=arc --seed=1729 --legacy --assisted --fast --max-room-seconds=360 --dist-dir=artifacts/nextgen/i5-continuation/legacy-candidate-dist --label=i5-aim-legacy-arc-1729-assisted
```

The separate build passed TypeScript and Vite (**495 ms**, exit 0); main `dist` was untouched. The approved 360-second measurement bound accommodates historical legacy Queen samples over 240 seconds. This fight finished below either bound. Ordinary/story runner defaults were unchanged.

The only assistance was the explicit **0.15 incoming-damage scale**. The report retains the guarded legacy initialization receipt: native rig selection, canonical `1729:v2-r0-combat`, zero completed rooms, no boons and zero combat statistics. Resources were the ordinary first-room allocation: 100 health, 50 armor, zero credits, three grenades and two medkits. All subsequent combat and earned choices used the native player. No extra resources, enemies, charge, damage grants or skipped encounters were injected.

The first combat snapshot confirms the candidate's actual Arc cooldowns: **Q Overload 8,000 ms**, **F Tesla Pylon 18,000 ms**. Runtime reports `legacy:true`, graph version 2 and incoming scale 0.15. The build's global `tuningEnabled:true` marker remains recorded; it does not make this an organic v3 campaign.

## Outcome and pacing

| Receipt | Actual value |
| --- | ---: |
| Cleared rooms | 12/12 |
| Fought encounters / ordinary service auto-clears | 9 / 3 |
| Total combat time | 776.350 s |
| Queen fight | **163.950 s** |
| Queen result | `defeated:true`, phase `defeated`, health 0/5,000, stage 3 |
| Queen damage taken / Overdrives | 6.6096 / 5 |
| Campaign kills | 570, including one Queen |
| Campaign damage taken | 35.8464 |
| Campaign dash / Q / F / V uses | 230 / 96 / 44 / 14 |
| Final marine health | 100 |
| Wall time | 404.812 s |
| Raw errors / defects | 0 / 0 |

Per-room simulated seconds in route order: **24.800, 53.033, 0, 74.933, 62.200, 68.333, 0, 116.067, 95.183, 117.850, 0, 163.950**. Zero-second rooms are earned service boundaries, explicitly recorded as `autoClear:true`. The Queen takes about 1.39× the longest preceding fight. This supplies concrete assisted completion and relative-pacing evidence for this frozen build; it does not measure unassisted legacy difficulty.

## Loading and timing limits

The observed Reactor Vault preparation hold was **3.480 s**. No >5-second hold, texture-blob error, console/page/HTTP error or other defect was recorded. Earlier graphics preparation/texture-lifetime investigations remain open; this fresh-context campaign was not a restart stress test.

Hardware: `ANGLE (Apple, ANGLE Metal Renderer: Apple M1 Pro, Unspecified Version)`, 1920×1080, DPR 1. Read-only load checks on 10 logical cores were:

- Before build/campaign: **170.598 / 171.229 / 256.027**.
- Runner start → final save: **148.458 / 164.208 / 246.201 → 197.626 / 167.364 / 214.304**.
- After the closed campaign browser: **169.637 / 164.765 / 210.964**.

These are 1/5/15-minute load averages, not percentages. `--fast` preserves per-tick native input, simulation, scene, actor and camera updates while omitting intermediate raw GPU submissions. Queen fixed-tick p50/p95 were **2.7/6.4 ms**, with a 32.1 ms maximum; the campaign's largest individual fixed tick was 55.0 ms. Percentiles retain the latest 2,048 room ticks, while mean/max extend from the room reset. GPU completion and outer policy/snapshot/Playwright work are excluded. This shared-host sample does not certify normal RAF or GPU headroom.

## Reproducible evidence

Exact native label: `i5-aim-legacy-arc-1729-assisted`. Its report, native input/effect trace, room screenshots and copied harness sources are under `artifacts/nextgen/playtest/<label>/`. The command/build logs, explicit exit codes, host samples, relevant post-build source copies and compact `summary.json` are under `artifacts/nextgen/i5-continuation/legacy-native/`.

- [Queen combat screenshot](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/playtest/i5-aim-legacy-arc-1729-assisted/r12-reactor-vault-mid.png)
- [Actual completion screenshot](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/playtest/i5-aim-legacy-arc-1729-assisted/terminal-complete.png)
- [Raw campaign report](/Users/chernodub/.t3/worktrees/containment-game/t3-656f3f1b/artifacts/nextgen/playtest/i5-aim-legacy-arc-1729-assisted/report.json)

The Queen combat and actual completion PNGs were opened for review. The completion screen shows 12/12 sectors and 570 kills, matching the authoritative report; the Queen is visibly present in the combat capture. No graphics changes were made.

Recorded checkout HEAD is `c3bd53b4f0f2c12735a1abb562f11eadb07c5a83`; uncommitted candidate values are identified by the separate build and retained source receipts. Policy epoch is `i5-catalog-ability-aim-v1`, navigation epoch `i5-navigation-observer-v3`. Runner, policy and aiming-helper hashes match the corrected-aim baseline report.

The application fingerprint stayed unchanged before and after the campaign:

`9aba5e615b022bb5aea83e2d33d8b1a94a18bec0e6292a1a2eea0476e09a8ed3`

It covers sorted relative paths plus raw bytes for `index.html` and top-level JS/CSS bundles, 21 files total; complete static assets are outside this fingerprint. Per-file and relevant source hashes are retained in `legacy-native/build-fingerprint.json`. No game/tooling source, tests, main build output, other worktrees or renderer files were changed; no commit or additional campaign was created for this task.
