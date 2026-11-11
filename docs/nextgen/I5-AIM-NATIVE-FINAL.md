# I5 f496 desktop evidence and native calibration

Immutable game/client source: **`f49647668a116b9659dbdc151ac772a2bed33c75`**, shared policy **`i5-catalog-ability-aim-v3`**. All eight organic browser campaigns completed as immutable-source calibration: five completions, three natural deaths and no censors; both single-worker shards are closed and reaped. **Historical V30 calibration: corrected mode-v8 N40 later failed strict rig spread.** The measured follow-up changes only Cryo Nova freeze1800→1500ms at7ec8506; fresh final-build eight-run evidence belongs to [V33](I5-NATIVE-FINAL-V33.md). These f496 native reports remain unchanged and are not reused as the new final confirmation. The previous mode-v7 Node references are provisional historical comparisons: the lead identified simulation-only grenade-angle timing, route warning-history and legacy Queen/nest pressure mismatches. No native policy or game change was made. Original v7 Node files/identities remain fixed; the corrected initial-v8 comparison is appended below in separate receipts. Actual native outcomes and source-verified provisional comparisons are recorded below. Staged visuals and assisted legacy evidence remain separate from organic campaigns.

## Lead first look

1. [Frozen-build Railbreaker anticipation at 0/125/249/250 ms](../../artifacts/nextgen/i5-selected-railbreaker/anticipation-sprite.png)
2. [f496 full held Overdrive, NEXT ROOM](../../artifacts/nextgen/i5-final-f496476/held-overdrive.png)
3. [Title, byte-identical selected application](../../artifacts/nextgen/i5-v3-final/title.png)
4. [Pyro selection, selected 6 s / 12 s cooldowns](../../artifacts/nextgen/i5-v3-final/rig-select-pyro.png)
5. [Napalm third pose](../../artifacts/nextgen/i5-v3-final/ability-napalm-charge-awakening-bay-03.png)
6. [Graphics recovery hold](../../artifacts/nextgen/i5-v3-final/f2-recovery.png)
7. [Railbreaker post-impact motion sheet](../../artifacts/nextgen/i5-selected-railbreaker/ability-railbreaker-awakening-bay-sprite.png)
8. [Organic Breacher 1729 hardest combat, Safety-interlock Station](../../artifacts/nextgen/playtest/i5-selected-final-a-breacher-1729/hardest-sprite.png)

Items 1–7 are staged diagnostic fixtures; item 8 is an organically earned fight from the unassisted Breacher 1729 campaign. The reused title/Pyro/Napalm/recovery/feel images retain their original V30 source identity; they are valid selected-application views because all 21 application files are byte-identical. V31's 7 s / 13 s Pyro copy is deliberately excluded from selected evidence.

## Sources, build and visual reuse

`npm run build` passed on the selected source, producing standard main `dist` for the gates. A complete copy, including static assets, was preserved in `artifacts/nextgen/i5-continuation/approved-dist-f496476`.

- Selected source: `f49647668a116b9659dbdc151ac772a2bed33c75`.
- Identical gameplay/UI/renderer source: V30 `1cac390797678b9dfe8c716e39d61c730e979dfd`.
- Frozen policy source: `e97cf06107c6e23f9f7b96ac94f8b95ba3e7163d`.
- Application SHA256: `f59043d8eda6b628d4e74740c5c9a59cdd01adfd50b5dc142184932c7a86aa87` (paths/raw bytes of index.html and top-level JS/CSS; not a full static-asset hash).
- Game SHA256: `8fd2acce2caae11feea28311ade31ab0eb13c8934c1d4f56f749c22ede862957`.
- Node simulation-bundle SHA256: `5fc6fd01d6cc37512124b2735b47af42d2a716b347f78aded89d8ae3a24bfea5`.
- Policy SHA256: `976eb173f26b67e0d02806b91b316a13fc11eecee94ba0310ac2287a7e402502`.

Main dist, the preserved copy and all 21 V30 application files matched exactly. [Build receipt](../../artifacts/nextgen/i5-continuation/selected-gates/build-receipt.json) retains per-file hashes; [visual-reuse receipt](../../artifacts/nextgen/i5-final-f496476/visual-reuse.json) identifies the original 21 PNGs/four sheets and hashes all 25 original capture files. The historical files/manifests were not relabeled or overwritten. [Selected source provenance](I5-SELECTED-PROVENANCE.md) and the [frozen provisional v7 Node-reference snapshot](../../artifacts/nextgen/i5-continuation/selected-gates/node-v7-provenance-frozen.json) retain exact paths and identities. The existing comparator reads that frozen snapshot, so a later v8 receipt cannot silently replace its expected reports.

The parent corrected the two old half-meter grants in the registered capture helper to use existing `d.fillOverdrive()`. That change affects staged capture setup only; no production client, shared decision policy or native campaign harness changed. The previous no-charge denial was not suppressed and no assertion was weakened.

## Browser gates

All three delegated browser gates passed unchanged on their first attempts, sequentially, with one owned browser. Full prior output directories were archived before any overwrite; final authored/playtest outputs have separate preserved directories. No retry was needed.

| Command | Actual summary | Exit |
|---|---|---:|
| `npm run build` | TypeScript and Vite production build passed | 0 |
| `npm run test:smoke` | Desktop production Pages subpath, assets, fire, weapon switch, pause/resume, Credits; Combat Rig Shift/Q/F/V, typing/menu/pause/Continue, checkpoint feedback and audio passed | 0 |
| `npm run test:authored-smoke:all` | Passenger Vault, Breached Loading Bay, Overload Floor; real desktop move/fire, explicit fatal authorization where required, errors=[] | 0 |
| `npm run playtest:smoke` | room-limit, 3/3 clears, 66.9625 s wall, errors=[], defects=[] | 0 |

[Machine-readable gate receipt](../../artifacts/nextgen/i5-continuation/selected-gates/browser-gates-receipt.json), [build log](../../artifacts/nextgen/i5-continuation/selected-gates/build.log), [desktop smoke log](../../artifacts/nextgen/i5-continuation/selected-gates/smoke-attempt1.log), [authored log](../../artifacts/nextgen/i5-continuation/selected-gates/authored-smoke-attempt1.log), [playtest smoke log](../../artifacts/nextgen/i5-continuation/selected-gates/playtest-smoke-attempt1.log). This section reports these delegated checks; the parent records the other required unit/Node/room gates.

## Actual f496 held-Overdrive fixture

One Arc Awakening Bay debug fixture filled meter, activated Overclock through ordinary public `game.useAbility('overdrive')`, advanced 6000 simulated ms until inactive, filled again, and refreshed the actual HUD. No ability/HUD snapshot was injected. It passed **exit 0**, `errors=[]`:

```text
charge=1, active=false, roomLimited=true
overdrive.ready=false, slots.overdrive.ready=false
actual HUD .ability-value=NEXT ROOM
stats.overdrivesUsed=1, stats.abilityUses.overdrive=1
status=playing, awakening-bay depth 0
```

[Metadata](../../artifacts/nextgen/i5-final-f496476/held-overdrive.metadata.json), [artifact-only recipe](../../artifacts/nextgen/i5-continuation/selected-gates/held-overdrive.mjs), [log](../../artifacts/nextgen/i5-continuation/selected-gates/held-overdrive.log). It ran on actual selected immutable dist, with the selected fingerprint. The browser/server closed and session was reaped before the next browser job.

## Railbreaker and native input review

Registered `ability:railbreaker,ability:desktop-input` capture: **8 PNGs/two sheets, 34.05 s, exit 0**, hardware Metal, `errors=[]`, `failures=[]`, `fontFallbacks=[]`. The four Railbreaker frames are 90 ms apart. Setup already advances the 250 ms cast plus 30 ms aftermath, so this registered sheet honestly begins after impact; it does not show anticipation. Runtime link/impact receipts retain **length 900, width 44, damage 420**. Native desktop input records exactly one use each of Shift/Q/F/V and one Overdrive. [Registered manifest](../../artifacts/nextgen/i5-selected-railbreaker/manifest.json), [log](../../artifacts/nextgen/i5-continuation/selected-gates/railbreaker-capture.log).

A separate, explicitly authorized staged diagnostic captured exact **0/125/249/250 ms** states. It used the legal registered lane, an empty Breacher build, debug invulnerability, native brute spawns and full debug meter, followed by ordinary public activation. It passed **exit 0**, `errors=[]`, with no GL error or context loss:

| Since activation | Cast remaining | Authoritative ability damage |
|---:|---:|---:|
|0ms|250ms| 0 |
|125ms|125ms| 0 |
|249ms|1ms| 0 |
|250ms|0ms|420|

[Anticipation metadata/all events](../../artifacts/nextgen/i5-selected-railbreaker/anticipation.metadata.json), [artifact-only recipe](../../artifacts/nextgen/i5-continuation/selected-gates/railbreaker-anticipation.mjs), [log](../../artifacts/nextgen/i5-continuation/selected-gates/railbreaker-anticipation.log). The unequal intervals deliberately pin the exact boundary; they are not an even-time motion sample.

I opened the actual anticipation sheet, registered Railbreaker and native-input sheets, and final held-meter PNG. The thin orange lane/brace builds ahead of the marine, then the bright beam and420 damage appear at 250 ms; the marine remains identifiable in that open lane. A human should judge whether the shorter cue is readable in a real swarm. I also opened the actual completed Breacher 1729 hardest-combat sheet: Safety-interlock Station shows 19 health, ranged green shots crossing the lane, and a heavy crowd along the left side with clearer space to the right. The low-health border is obvious; the marine is partly masked when enemy bodies stack. This strengthens the existing close-pack identification concern with organic evidence. That four-frame pressure snapshot is not a long-duration motion or performance measurement. The earlier [V30 review](I5-V3-V30-VISUALS.md) still applies to unchanged title/rig/shop/recovery/Pyro visuals; dense Afterburn body overlap and pale hit flashes remain an open readability concern. No renderer correction is claimed.

## Current-source legacy v2 Queen confirmation

This separate run used selected immutable f496 dist and policy v3, Arc 1729, guarded initial legacy factory after native rig selection, **15% assisted incoming damage**, `--fast`, and the documented **360 s per-room Queen bound**. No later staging, resource grant or room skipping occurred. It is excluded from organic story completion totals.

Actual native ending: **complete 12/12, exit 0**, errors=[], defects=[], 536 kills, 13 Overdrives, 40.2528 damage taken, 350.3134 s wall. Queen/Reactor Vault: **139.70 simulated s**. Longest recorded loading hold: Reactor Vault 3222.31 ms. The provisional mode-v7 selected-source Node legacy also completed12/12 but took 280.60 s for Queen, 739 kills, 17 Overdrives and 134.1759 damage. These materially different timings/stats are retained; no exact native/Node parity is claimed.

[Raw report](../../artifacts/nextgen/playtest/i5-selected-legacy-native-v3/report.json), [log](../../artifacts/nextgen/i5-continuation/selected-gates/legacy-native-v3.log), [start load](../../artifacts/nextgen/i5-continuation/selected-gates/legacy-host-start.json), [end load](../../artifacts/nextgen/i5-continuation/selected-gates/legacy-host-end.json). Native load began 101.0132/135.2749/184.9287 and ended 162.0288/141.7188/171.8931 on 10 logical cores. Both render/tick instrumentation and the overloaded shared host exclude performance certification.

## Eight organic native calibrations: complete, v8 acceptance pending

All eight authorized runs finished and both queue sessions were reaped with aggregator **exit 0**. Native outcomes: **5/8 complete (62.5%), three natural deaths, zero censors**. Death histogram: **room 14: 1; room 20: 2**. Every run has `errors=[]`; no texture-blob error was recorded. These two seeds per rig are calibration confirmations, not the 80-seed balance distribution. Final acceptance still depends on corrected mode-v8 validation; the mode-v7 Node column below is explicitly provisional historical evidence.

| Rig / seed and raw report | Actual native ending | Provisional v7 Node ending | Native simulated seconds | Native damage taken | Native OD | Child exit |
|---|---|---|---:|---:|---:|---:|
| [breacher / 1729](../../artifacts/nextgen/playtest/i5-selected-final-a-breacher-1729/report.json) | complete, 20/20 | dead room 10, 9/10 | 863.08 | 767.87 | 16 | 0 |
| [breacher / 2718](../../artifacts/nextgen/playtest/i5-selected-final-b-breacher-2718/report.json) | complete, 20/20 | complete, 20/20 | 720.32 | 547.41 | 16 | 1 |
| [cryo / 1729](../../artifacts/nextgen/playtest/i5-selected-final-a-cryo-1729/report.json) | complete, 20/20 | complete, 20/20 | 762.90 | 817.87 | 14 | 0 |
| [cryo / 2718](../../artifacts/nextgen/playtest/i5-selected-final-b-cryo-2718/report.json) | dead room 20, 19/20 | dead room 16, 15/16 | 943.92 | 1476.17 | 13 | 1 |
| [pyro / 1729](../../artifacts/nextgen/playtest/i5-selected-final-a-pyro-1729/report.json) | complete, 20/20 | complete, 20/20 | 622.00 | 441.31 | 14 | 1 |
| [pyro / 2718](../../artifacts/nextgen/playtest/i5-selected-final-b-pyro-2718/report.json) | dead room 20, 19/20 | complete, 20/20 | 614.75 | 581.04 | 16 | 0 |
| [arc / 1729](../../artifacts/nextgen/playtest/i5-selected-final-a-arc-1729/report.json) | complete, 20/20 | complete, 20/20 | 747.67 | 527.45 | 17 | 0 |
| [arc / 2718](../../artifacts/nextgen/playtest/i5-selected-final-b-arc-2718/report.json) | dead room 14, 13/14 | dead room 14, 13/14 | 405.55 | 245.74 | 8 | 0 |

Child exit 0 does not imply completion: Pyro 2718 and Arc 2718 died naturally with exit 0. Child exit 1 does not erase completion: Breacher 2718 and Pyro 1729 completed with retained loading defects. Cryo 2718's exit 1 also reflects its loading defect. All outcomes/errors/defects remain in the denominator; none were dropped or rerun.

The frozen [complete v7 comparison](../../artifacts/nextgen/i5-continuation/selected-gates/native-final-comparison-v7-complete.json) retains every raw/native and original Node SHA256, identity check, room delta, boon list, loading event and host-load receipt. [Complete native/v7 balance summary](../../artifacts/nextgen/i5-continuation/selected-gates/native-final-balance-summary-v7-complete.json) reuses the existing `balance-summary.mjs` definitions, labeling backends separately. Native reports do not claim a directly measured Node game/bundle hash: their exact application/source/profile and four shared policy-file hashes are checked independently against the provenance receipt.

## Native distributions and limits

| Rig | Completion in this pair | Median cleared rooms / OD | Strict ordinary median seconds | Transmission median seconds | Median room damage by act 1/2/3/4 | Direct ability share of all campaign damage | Ordinary cap violations / attempts |
|---|---:|---:|---:|---:|---|---:|---:|
| breacher | 100% (2 runs) | 1.2500 | 30.39 | 60.53 | 0.00 / 16.94 / 29.46 / 72.83 | 25.49% | 0/26 |
| cryo | 50% (2 runs) | 1.4451 | 35.92 | 91.10 | 0.00 / 19.47 / 126.31 / 44.58 | 21.35% | 0/26 |
| pyro | 50% (2 runs) | 1.3080 | 27.56 | 57.60 | 0.00 / 6.32 / 23.16 / 39.52 | 22.35% | 0/26 |
| arc | 50% (2 runs) | 1.4007 | 28.50 | 63.12 | 0.00 / 0.00 / 52.72 / 53.99 | 30.10% | 0/23 |

Pooled strict ordinary median: **29.53 s**; Transmission median: **66.32 s**. Pooled room-damage medians by act: **0.00 / 10.91 / 39.31 / 53.99**. All **101** classified ordinary attempts, including death attempts, obeyed the one-use cap. The per-rig cadence medians lie between 1.25 and 1.4451 for this pair. Campaign direct ability shares include other damage sources in their denominator and do not replace the isolated full-kit 30–45% attribution/control invariant.

Variation is visible rather than treated as a passed target: native Cryo's Transmission median is 91.10 s; Arc/Pyro ordinary medians are 28.50 s / 27.56 s; Cryo act 3 damage exceeds act 4 in this small sample. These observations belong in the human playtest and mode-v8 calibration review. This section makes no claim that the old proxy has established final balance targets.

## Common-room comparison to frozen provisional v7

Whole-campaign totals for different endpoints compare different exposure. The following sums include **only rooms cleared by both runs**; the full JSON also retains every common attempt, death-room result and per-room delta. All **136** common-cleared-room boon lists match exactly; that does not imply identical movement, grenade timing, damage or later outcomes.

| Rig / seed | Common clears | Seconds native / v7 | Damage native / v7 | Common boon lists |
|---|---:|---:|---:|---|
| breacher / 1729 | 9 | 302.25 / 305.12 | 116.20 / 254.65 | all match |
| breacher / 2718 | 20 | 720.32 / 728.85 | 547.41 / 683.30 | all match |
| cryo / 1729 | 20 | 762.90 / 845.88 | 817.87 / 503.12 | all match |
| cryo / 2718 | 15 | 712.38 / 676.48 | 960.70 / 961.23 | all match |
| pyro / 1729 | 20 | 622.00 / 637.25 | 441.31 / 474.90 | all match |
| pyro / 2718 | 19 | 577.02 / 575.20 | 433.71 / 431.61 | all match |
| arc / 1729 | 20 | 747.67 / 722.03 | 527.45 / 474.31 | all match |
| arc / 2718 | 13 | 390.63 / 383.95 | 183.42 / 312.11 | all match |

Breacher 1729's native completion versus v7 death 10, Cryo 2718's native death 20 versus v7 death 16, and Pyro 2718's native death 20 versus v7 completion are preserved as calibration differences. The lead identified simulation-only mode-v7 emulation mismatches; this report does not promote that reference to final trusted evidence or replace it with v8 expected results midstream.

## Preparation holds and cleanup

| Rig / seed | Longest recorded hold room | Full hold seconds | Emitted >5 s threshold defects |
|---|---|---:|---:|
| breacher / 1729 | manual-control-chamber | 5.622 | 0 |
| cryo / 1729 | manual-control-chamber | 4.831 | 0 |
| pyro / 1729 | manual-control-chamber | 6.546 | 1 |
| arc / 1729 | manual-control-chamber | 4.462 | 0 |
| breacher / 2718 | manual-control-chamber | 15.589 | 1 |
| cryo / 2718 | manual-control-chamber | 5.892 | 1 |
| pyro / 2718 | manual-control-chamber | 5.059 | 0 |
| arc / 2718 | communal-atrium | 2.213 | 0 |

There are **5 full recorded holds above 5 s** and **3 emitted medium threshold defects**. A full elapsed receipt can exceed 5 s even when readiness returned before the next threshold poll; no event was synthesized, suppressed or filtered. Maximum full hold: **15.5885 s**, Breacher 2718 Manual-control chamber. The three threshold screenshots remain beside their raw reports. No renderer fix was attempted.

Shard A host load started 105.2266/130.2373/168.8652 and ended 575.4521/449.7720/462.7012; shard B started 194.6831/165.3188/176.1938 and ended 532.2158/453.7813/463.6958, on 10 logical cores. Exact [A start](../../artifacts/nextgen/i5-continuation/selected-gates/native-a-host-start.json), [A end](../../artifacts/nextgen/i5-continuation/selected-gates/native-a-host-end.json), [B start](../../artifacts/nextgen/i5-continuation/selected-gates/native-b-host-start.json), [B end](../../artifacts/nextgen/i5-continuation/selected-gates/native-b-host-end.json) preserve times/load. Fast mode updates simulation/scene/camera at each fixed 60 Hz tick and decimates GPU submission only; its retained CPU windows and overloaded-host wall times are not a performance certificate.

[Cleanup receipt](../../artifacts/nextgen/i5-continuation/selected-gates/native-cleanup.json) confirms all 8 child processes terminal, both queue sessions reaped, and no owned queue/runner/capture process remaining. Each runner awaited browser.close and local server.close in finally. The one remaining Chromium main was identified as a separate graphics capture in another worktree; it was left untouched. No process was signaled. [Shard A jobs](../../artifacts/nextgen/playtest/i5-selected-final-a/jobs.json), [shard B jobs](../../artifacts/nextgen/playtest/i5-selected-final-b/jobs.json), [shard A log](../../artifacts/nextgen/i5-continuation/selected-gates/native-a-batch.log), [shard B log](../../artifacts/nextgen/i5-continuation/selected-gates/native-b-batch.log).

No tracked gameplay, renderer, native harness or shared-policy source was edited by this helper task. No commits, pushes, extra native cohorts or further GPU jobs were made. The original selected source and all raw evidence remain fixed while the lead evaluates mode-v8 cohorts.

## Separate corrected mode-v8 comparison, initial N20 cohort

The corrected v8 references are now compared in **new files**. All frozen v7 comparisons, original expected-reference snapshots, raw native reports and independent native summary values remain unchanged. The generic aggregator's complete native groups were asserted deeply equal before writing the v8 summary. The [preservation receipt](../../artifacts/nextgen/i5-continuation/selected-gates/native-v8-preservation-receipt.json) verifies unchanged v7 files/reference snapshot and all eight original native report hashes.

The matched eight v8 runs completed **2/8 (25%)**, versus **5/8 native (62.5%)**. Exact ending/depth agreement holds for 4/8; four material differences remain: Breacher 1729 native complete versus v8 death 12, Pyro 1729 native complete versus v8 death 20, Arc 1729 native complete versus v8 death 17, and Cryo 2718 native death 20 versus v8 death 15. This is **not exact endpoint validation**. Source/policy identity and common boon agreement do not imply matching trajectories or deaths.

| Rig / seed | Actual native ending | Corrected v8 Node ending and raw reference | Whole-campaign seconds native / v8 | Whole-campaign damage native / v8 | New Node SHA256 prefix |
|---|---|---|---:|---:|---|
| breacher / 1729 | complete, 20/20 | [dead room 12, 11/12](../../artifacts/nextgen/playtest/i5-emulation-v8-v30-80/breacher-1729.json) | 863.08 / 441.57 † | 767.87 / 412.00 † | `34e33230e9a6…` |
| breacher / 2718 | complete, 20/20 | [complete, 20/20](../../artifacts/nextgen/playtest/i5-emulation-v8-v30-80/breacher-2718.json) | 720.32 / 716.22 | 547.41 / 569.53 | `a5304bd053e6…` |
| cryo / 1729 | complete, 20/20 | [complete, 20/20](../../artifacts/nextgen/playtest/i5-emulation-v8-v30-80/cryo-1729.json) | 762.90 / 790.32 | 817.87 / 729.23 | `216919f5d58f…` |
| cryo / 2718 | dead room 20, 19/20 | [dead room 15, 14/15](../../artifacts/nextgen/playtest/i5-emulation-v8-v30-80/cryo-2718.json) | 943.92 / 673.90 † | 1476.17 / 973.61 † | `a10a2135fcb4…` |
| pyro / 1729 | complete, 20/20 | [dead room 20, 19/20](../../artifacts/nextgen/playtest/i5-emulation-v8-v30-80/pyro-1729.json) | 622.00 / 630.88 † | 441.31 / 435.82 † | `3184cc187377…` |
| pyro / 2718 | dead room 20, 19/20 | [dead room 20, 19/20](../../artifacts/nextgen/playtest/i5-emulation-v8-v30-80/pyro-2718.json) | 614.75 / 626.52 | 581.04 / 691.60 | `44f7cec084c5…` |
| arc / 1729 | complete, 20/20 | [dead room 17, 16/17](../../artifacts/nextgen/playtest/i5-emulation-v8-v30-80/arc-1729.json) | 747.67 / 591.40 † | 527.45 / 459.89 † | `03fb85ba9b8f…` |
| arc / 2718 | dead room 14, 13/14 | [dead room 14, 13/14](../../artifacts/nextgen/playtest/i5-emulation-v8-v30-80/arc-2718.json) | 405.55 / 402.10 | 245.74 / 384.54 | `c823baae4aac…` |

† Different endpoints compare different exposure. No relative-error percentage is inferred from those whole-campaign totals. The separate common-clear table uses only rooms cleared by both runs; per-room/common-attempt results remain in the full JSON.

| Rig / seed | Common clears | Seconds native / v8 | Damage native / v8 | Common boon lists |
|---|---:|---:|---:|---|
| breacher / 1729 | 11 | 427.62 / 422.23 | 202.24 / 385.50 | all match |
| breacher / 2718 | 20 | 720.32 / 716.22 | 547.41 / 569.53 | all match |
| cryo / 1729 | 20 | 762.90 / 790.32 | 817.87 / 729.23 | all match |
| cryo / 2718 | 14 | 659.03 / 637.97 | 822.13 / 776.02 | all match |
| pyro / 1729 | 19 | 569.25 / 587.17 | 426.86 / 330.48 | all match |
| pyro / 2718 | 19 | 577.02 / 588.78 | 433.71 / 544.27 | all match |
| arc / 1729 | 16 | 576.57 / 567.82 | 285.72 / 347.87 | all match |
| arc / 2718 | 13 | 390.63 / 383.95 | 183.42 / 312.11 | all match |

All **132 common-cleared-room boon lists match**. The agreement is specifically about boon lists; resource history, inputs, camera/picking, damage and terminal outcomes are not asserted identical. [Full v8 comparison and eight complete new reference SHAs](../../artifacts/nextgen/i5-continuation/selected-gates/native-final-comparison-v8.json), [separate backend-labeled balance summary](../../artifacts/nextgen/i5-continuation/selected-gates/native-final-balance-summary-v8.json), [analysis log](../../artifacts/nextgen/i5-continuation/selected-gates/native-v8-comparison.log).

## Pooled v8 cohort versus native calibration

The matched-eight Node subset above is distinct from the complete initial mode-v8 **80-run candidate cohort (20 seeds/rig)**. The latter remains the initial statistical tuning sample. Native has only two fixed seeds per rig. The [pooled calibration receipt](../../artifacts/nextgen/i5-continuation/selected-gates/native-v8-pooled-calibration.json) retains both sample definitions and raw-source provenance.

| Measure | Native 8, f496 client | Initial v8 candidate 80 |
|---|---:|---:|
| Completion | **5/8 = 62.5%** | 41/80 = 51.25% |
| Natural deaths / censors | 3 / 0 | 39 / 0 |
| Median cleared rooms / accepted OD |1.3393|1.4286|
| Pooled cleared rooms / accepted OD |1.3246|1.4143|
| Strict ordinary cleared-room median |**29.5333 s** (100 observations)|31.9833 s (983 observations)|
| Transmission median |66.3250 s|61.9750 s|
| Median room damage, acts 1/2/3/4 |0.0000 / 10.9087 / 39.3136 / 53.9890|0.0000 / 13.5299 / 36.8501 / 62.3327|
| Direct ability share of all campaign damage |24.52%|22.77%|
| Strict ordinary cap violations / attempts |0/101|0/998|
| First-act clears / attempts |40/40|400/400|

**Native 62.5% is outside the 40–60% point target; native 29.5333 s strict ordinary pacing is below 30 s. Neither is rounded into a pass.** The descriptive 95% Wilson binomial interval around 5/8 is **30.57–86.32%**. It shows finite-sample uncertainty for this fixed eight-run confirmation, not a population guarantee or acceptance proof. Separately, analytic camera/actor picking remains approximate; uncertainty in a small sample does not establish model fidelity or explain away the four endpoint disagreements.

Human pacing checks remain explicit: native Cryo Transmission 91.10 s, Pyro Transmission 57.60 s, Arc/Pyro strict ordinary 28.50 s / 27.56 s, the native low-health crowd/readability evidence, and five full preparation holds above 5 s (maximum 15.5885 s). The three medium emitted hold defects and every natural death remain retained. The pooled act-damage trend rises, while per-rig deviations remain visible above. Campaign shares do not replace the isolated full-kit attribution/control tests.

## V8 source bridge and fixed N40 acceptance boundary

The new eight Node SHAs were computed directly from the frozen report bytes and checked against the [initial v8 archive](evidence/I5/I5-EMULATION-V8.json). Its exact bytes are preserved in a separate [frozen reference-archive snapshot](../../artifacts/nextgen/i5-continuation/selected-gates/node-v8-reference-archive-frozen.json) with SHA256 `5f7a132f8b367f9c3f16b0723c1838608dbe91c78da0012156f7f66991edd58d`.

The original v8 reports honestly retain **workspace HEAD f496, dirtyBackend=true**, patch SHA `ba2af0d134604aae987500727c8bc96a5258cf2126bba3692e542f61c9ff3abe`. Their backendHash is `63b80de0fedf804ff871b6ba1f2c75ea9afcb6b1be9ffcf338a2efe19affcde0`, gameHash `8fd2acce2caae11feea28311ade31ab0eb13c8934c1d4f56f749c22ede862957`, shared policyHash `976eb173f26b67e0d02806b91b316a13fc11eecee94ba0310ac2287a7e402502`, and executed simulation bundleHash `4e76f624b79afd6bd63c6f4273f45e98c5c32a0dbf89e113b68d396f5e12b5c7`. The native application's separate fingerprint remains unchanged: `f59043d8eda6b628d4e74740c5c9a59cdd01adfd50b5dc142184932c7a86aa87`.

Backend commit `b6cac5f788451b162c61240896d3a846749e0de5` and the clean proof at `e8034f1b11b03025cbbf0b5d8db8e54401990615` contain byte-identical backend code. The five backend source snapshots were independently checked against both commits; compiled bundle, dirty patch, proof-report SHA, game source tree and four shared policy files were also verified. The clean proof's empty patch/dirty=false is a different provenance state from the original dirty f496 run. Those raw heads/patch identities were **not rewritten or conflated**. Complete source-hash/commit proof is in the new v8 comparison JSON.

**Final balance acceptance is pending the single predeclared fixed N40 extension.** [Validation plan](plans/I5-V8-VALIDATION.md), commit `70a48d6fee489d8f53efde203e2ff19eea63cafd`, adds the same fixed 20 xorshift seeds for every rig in both baseline and current profiles: all initial 20 plus validation 20 remain, giving 40/rig, 160/profile, 320 total. It was committed before extension outcomes. Game numbers and shared native policy are unchanged; no favorable subset is selected and no additional batches are inferred here. The initial v8 cohort's Pyro 35% is 16.25 points below its 51.25% mean, so the 15-point rig-distance check has not yet passed. Report initial, validation and combined distributions; await the complete fixed extension before acceptance.

This subtask ran no browser, campaign, test gate or source mutation. It only read frozen evidence, computed new comparison artifacts and appended this report. Original native cleanup and v7 evidence remain intact.
