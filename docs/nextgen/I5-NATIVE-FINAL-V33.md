# I5 V33 native confirmation — completed

Eight fresh organic campaigns ended naturally on source `7ec850683be78692c758e2888e177ccdc11d3cc0`: **six completions and two deaths**. All eight actual campaigns had zero console/page errors. The separate original Breacher 2718 attempt failed before playing any room; its one authorized same-seed retry completed. Therefore completion is **6/8 = 75% of actual campaigns**, and **6/9 = 66.67% of all retained process attempts**. No attempt, death or censor was discarded.

The native point sample misses the 40–60% completion band and ±15-point rig-spread target: Breacher/Cryo are 100%, Pyro/Arc 50%, mean 75%, each ±25 points. N=2 per rig is descriptive. The illustrative N=8 Wilson 95% interval is 40.93–92.85%; fixed seeds do not establish a population win-rate certificate. The separately selected fixed N=40-per-rig model passes its targets; these samples are never merged.

## Frozen source and cleanup

Branch: `t3/integrate-playtest-balance-tuning`. All nine native attempts retained HEAD `7ec850683be78692c758e2888e177ccdc11d3cc0`.

- Full preserved build: `artifacts/nextgen/i5-continuation/approved-dist-7ec8506`.
- Application SHA256: `bae6151eda06baa4bebda53cbdd05e910672800ad3aa377d4e6575b3d2761054`.
- Shared policy: `i5-catalog-ability-aim-v3`, hash `976eb173f26b67e0d02806b91b316a13fc11eecee94ba0310ac2287a7e402502`.
- Model mode/backend: `sim-policy-v8` / `63b80de0fedf804ff871b6ba1f2c75ea9afcb6b1be9ffcf338a2efe19affcde0`.
- Model game hash: `5c22135ab8d0cfc2dc436822ed9a3a81328d8cdacae80be7735947e03de2b696`.
- Model bundle hash: `fd8a195bcf60066174c6c22ea757d8c93b859890e0b91e07bc0f65b80817d17d`.

The parent built with exit 0. This helper copied every dist file without rebuilding or mutating main dist. The application fingerprint covers sorted paths and raw bytes of index.html plus top-level JS/CSS, rather than every static asset. All 21 application files and all four policy-file hashes were independently rechecked after the campaigns. The native harness is byte-unchanged from f496. No V30 native campaign was reused or relabeled.

V33 changes only Cryo Nova conditional freeze 1800→1500 ms and catalog/stat 1.8→1.5 s versus f496. Damage 30, Q 9000 ms, Glacier F 18000 ms remain unchanged. The source check and compiled branch both pin 1500 ms/30 damage. This helper made no game, renderer, policy, backend or assertion changes.

Sessions 25741, 29180 and 45731 were reaped. The two recorded owned Chromium profiles and owned runner/server process ancestry were absent at final cleanup; no signal was sent and unrelated benchmark browsers were untouched. No browser jobs remain.

[Tracked native evidence archive](evidence/I5/I5-NATIVE-FINAL-V33.json) (SHA256 `60238c5f0320d5fba28ac8aa6ffe942a4ff98c8b82982bcd62f288330077b05c`) preserves all nine raw-report hashes, comparisons, metrics and cleanup in the repository.

[Build/copy receipt](../../artifacts/nextgen/i5-continuation/native-final-v33/build-receipt.json), [final source and file-hash receipt](../../artifacts/nextgen/i5-continuation/native-final-v33/final-source-receipt.json), [cleanup receipt](../../artifacts/nextgen/i5-continuation/native-final-v33/cleanup-receipt.json), [analysis hashes](../../artifacts/nextgen/i5-continuation/native-final-v33/final-analysis-hashes.json).

## Fresh Cryo visual and public-input evidence

The registered catalog/Nova capture and public-action duration diagnostic both passed on this V33 build, then closed their browser and server before the two organic shards launched. These are explicitly staged diagnostic fixtures, excluded from campaign statistics. The registered capture has zero console errors, failures and fallback fonts. The native boundary fixture has zero errors and verifies actual keyboard Shift then Q, one dash and one Q use: an actually chilled target remains frozen at 1499 ms and thaws at 1500 ms. Q stays 9000 ms and F stays 18000 ms. A fresh target only chills, as required.

First visual inspection:

1. [Cryo selection: Freeze 1.5 s, Q 9 s, F 18 s](../../artifacts/nextgen/i5-v33-cryo-7ec8506/rig-select-cryo.png).
2. [Actual catalog hover tooltip](../../artifacts/nextgen/i5-v33-cryo-7ec8506/cryo-nova-catalog-tooltip.png).
3. [Native Shift→Q freeze boundary sheet](../../artifacts/nextgen/i5-v33-cryo-7ec8506/native-q-freeze-sprite.png).
4. [1499 ms, still frozen](../../artifacts/nextgen/i5-v33-cryo-7ec8506/native-q-freeze-1499ms.png).
5. [1500 ms, thawed](../../artifacts/nextgen/i5-v33-cryo-7ec8506/native-q-freeze-1500ms.png).
6. [Registered fresh-target Nova sheet](../../artifacts/nextgen/i5-v33-cryo-7ec8506/ability-cryo-nova-awakening-bay-sprite.png).
7. [Organic Cryo 2718 hardest fight, Containment Annulus](../../artifacts/nextgen/playtest/i5-v33-native-b-7ec8506-cryo-2718/hardest-sprite.png).
8. [Organic Breacher 1729 hardest fight, Safety-interlock](../../artifacts/nextgen/playtest/i5-v33-native-a-7ec8506-breacher-1729/hardest-sprite.png).

Items 1–6 are staged diagnostics. Items 7–8 are earned organic campaign moments, viewed after their runs closed. Cryo’s dense frozen pack and damage labels show motion/status changes but obscure some silhouettes. Breacher’s low-health red border is clear, while dark actors overlap in the lower corridor. These are graphics readability observations, with no renderer edits.

The selected card has a visible focus outline and legible numeric copy. Ice disappears at the measured boundary; the remaining CHILLED label is correct because chill outlasts freeze. The staged brute and pale Nova obscure some of the marine silhouette; this belongs to the graphics owner and was left unchanged. These source-scoped Cryo captures replace the changed Cryo evidence; older V30 title/Pyro captures remain historical evidence with their own application fingerprint.

[Native Q metadata](../../artifacts/nextgen/i5-v33-cryo-7ec8506/native-q-freeze.metadata.json), [artifact-only script](../../artifacts/nextgen/i5-continuation/native-final-v33/cryo-freeze.mjs).

## Delegated browser gate receipts

All commands used unchanged assertions and limits, sequentially, with prior mutable output directories archived first. Parent ran the other required gates separately.

| Command | Exit | Duration | Summary / observed checks |
|---|---:|---:|---|
| `npm run test:smoke` |0|154.642 s|Browser smoke passed: desktop, production Pages subpath, assets, fire, weapon switch, pause/resume, credits.|
| `npm run test:authored-smoke:all` |0|30.352 s|Passenger Vault, Breached Loading Bay and Overload Floor desktop authored checks passed.|
| `npm run playtest:smoke` |0|118.318 s|smoke: room-limit; 3 rooms cleared; 0 errors.|

The authored terminal log includes the unfiltered warning `WebSocket server error: Port 24678 is already in use`; browser errors were empty and all authored assertions passed. No retry was needed for these three gates. Full logs, start/end load, timestamps and copied final output are in [v33-gates](../../artifacts/nextgen/i5-continuation/v33-gates).


## All campaign outcomes

Both original single-worker shards used seeds 1729/2718 for all four rigs, actual keyboard/mouse input and `--fast` on the immutable build. No assistance, room skipping, checkpoint probes, damage/resource grants or outcome selection was used. At most two owned browsers ran. Fast mode decimates raw GPU submissions while retaining normal simulation ticks, renderer transforms and input decisions; it is not a native framerate or CPU-headroom certificate.

| Rig / seed | Native outcome | Exit | Matching model outcome | Errors | Threshold defects | Maximum full hold |
|---|---|---:|---|---:|---:|---:|
|breacher 1729|complete (20/20)|1|death room 12 (11 clears)|0|1|6.272 s|
|breacher 2718 retry1|complete (20/20)|0|complete (20/20)|0|0|4.078 s|
|cryo 1729|complete (20/20)|0|complete (20/20)|0|0|4.029 s|
|cryo 2718|complete (20/20)|1|death room 14 (13 clears)|0|7|44.025 s|
|pyro 1729|complete (20/20)|0|death room 20 (19 clears)|0|0|4.007 s|
|pyro 2718|death room 20 (19 clears)|0|death room 20 (19 clears)|0|0|4.489 s|
|arc 1729|complete (20/20)|0|death room 17 (16 clears)|0|0|4.255 s|
|arc 2718|death room 14 (13 clears)|0|death room 14 (13 clears)|0|0|2.028 s|

The original `i5-v33-native-b-7ec8506-breacher-2718` exited 1 after 31.043 s, zero rooms: `TimeoutError: page.waitForFunction: Timeout 20000ms exceeded.` at runner.mjs:193. Its gameplay profile flag was unobserved. The raw error/report/log remain unchanged. Shard B was finished and reaped before retry1 launched, with the identical seed, policy, build and timeout; the retry exited 0 after 20 clears. There was no second retry.

All-attempt outcomes: six complete, two dead, one startup error; process exits: six 0, three 1. Actual campaigns: eight natural terminals, zero played censors; death histogram: room 14×1, room 20×1. All 40 opening rooms cleared. Process exit 1 for Breacher 1729 and Cryo 2718 preserves preparation defects despite their successful campaign endings; batch exit 0 is not a completion assertion.

[All nine raw-report hashes, errors, holds, native/model identities and eight per-room comparisons](../../artifacts/nextgen/i5-continuation/native-final-v33/native-final-comparison.json), [frozen final summary](../../artifacts/nextgen/i5-continuation/native-final-v33/native-final-summary.json), [queue recipe](../../artifacts/nextgen/i5-continuation/native-final-v33/queue-recipe.md), [bounded retry receipt](../../artifacts/nextgen/i5-continuation/native-final-v33/startup-retry1.receipt.json).

## Native balance observations

| Rig (N=2) | Completion | Distance from native mean | Median rooms / OD | Ordinary median s | Transmission median s | Damage medians acts 1 / 2 / 3 / 4 |
|---|---:|---:|---:|---:|---:|---|
|breacher|100.00%|+25.00 pp|1.250|30.39|60.53|0.00 / 16.94 / 29.46 / 72.83|
|cryo|100.00%|+25.00 pp|1.429|37.70|77.52|0.00 / 13.10 / 34.31 / 71.88|
|pyro|50.00%|-25.00 pp|1.308|27.56|57.60|0.00 / 6.32 / 23.16 / 39.52|
|arc|50.00%|-25.00 pp|1.401|28.50|63.12|0.00 / 0.00 / 52.72 / 53.99|

Native pooled cadence is 1.339 rooms/OD (p10–p90 1.176–1.625); all four rig medians are 1.2–1.7. Ordinary-room cap violations are 0/101 attempts, including the death-room attempt. Strict ordinary pooled median **29.6417 s is below the requested 30 s lower bound**. Transmission pooled median 66.325 s is within 60–75 s, while the two-run Cryo median 77.525 s and Pyro 57.600 s are outside that band. These exceptions remain visible.

| Separate cohort | Completion | Median rooms / OD | Ordinary median (p10–p90), s | Transmission median (p10–p90), s | Damage medians acts 1 / 2 / 3 / 4 | Direct ability damage share |
|---|---:|---:|---:|---:|---|---:|
|Native actual eight|75.00%|1.339|29.64 (20.63–47.15)|66.32 (47.02–81.62)|0.00 / 10.63 / 34.93 / 60.24|24.13%|
|Matching model eight|25.00%|1.393|29.23 (20.62–44.13)|66.98 (56.60–77.03)|0.00 / 12.26 / 47.18 / 46.39|23.82%|
|Selected fixed model 160|48.75%|1.429|31.97 (21.30–44.55)|64.88 (50.53–91.52)|0.00 / 13.57 / 41.69 / 61.13|23.22%|

Damage includes death-room attempts; time distributions include cleared rooms. Ordinary means metadata-classified combat and excludes elite rooms, guardians, bosses and holdouts. Native direct ability share is 24.13%; ability+status+boon is 44.83%, which does not isolate all control/Overclock value and is not the full-kit harness metric. The deterministic full-kit invariant is assessed by the parent's separate harness tests. Full by-depth distributions and per-rig damage-source tables are in the [balance artifact](../../artifacts/nextgen/i5-continuation/native-final-v33/native-final-balance.json).

## Same-seed model calibration

Only four of eight native/model endings agree in outcome, clear count and death room. The matching model eight completed 2/8, versus native 6/8; the full fixed model cohort completed 78/160. Source/policy identity therefore does **not** establish exact endpoint proxy validation. Four differing endpoints are Breacher 1729, Cryo 2718, Pyro 1729 and Arc 1729. The analytic camera/picking approximation and later divergent combat trajectories remain limitations.

All 131 common-cleared-room boon lists match. Median absolute common-room time/damage difference is zero, but their tails are material: p90 7.47 s / 47.78 damage, maxima 22.57 s / 95.33 damage. The largest common timing difference is Cryo 2718 Safety-interlock, native 85.00 s versus model 62.43 s. The largest injury difference is Cryo 1729 finale, native 154.25 versus model 58.93. No boon-policy mismatch was found.

| Pair | Native total game s | Model total game s | Native damage taken | Model damage taken | Exposure |
|---|---:|---:|---:|---:|---|
|breacher 1729|863.08|441.57|767.87|412.00|different survival exposure|
|breacher 2718|720.32|716.22|547.41|569.53|same clear/death-room exposure|
|cryo 1729|751.68|762.88|750.61|752.24|same clear/death-room exposure|
|cryo 2718|1003.07|623.62|1186.25|766.13|different survival exposure|
|pyro 1729|622.00|630.88|441.31|435.82|different survival exposure|
|pyro 2718|614.75|626.52|581.04|691.60|same clear/death-room exposure|
|arc 1729|747.67|591.40|527.45|459.89|different survival exposure|
|arc 2718|405.55|402.10|245.74|384.54|same clear/death-room exposure|

Whole-campaign totals across unequal survival exposure are not direct relative-error estimates. The [comparison](../../artifacts/nextgen/i5-continuation/native-final-v33/native-final-comparison.json) contains every common room's time, damage, result, boon list and first divergence; [tail analysis](../../artifacts/nextgen/i5-continuation/native-final-v33/native-final-room-deltas.json) retains the largest differences. The [frozen reference map](../../artifacts/nextgen/i5-continuation/native-final-v33/node-reference-map.json) independently checks all eight new V33 Node report SHA256s against the frozen authoritative 160-run archive, including the exact backend-source bridge. Older V30/v7/v8 evidence remains unchanged.

## Part C diagnostics and host observations

All eight actual campaigns have errors=[]; no GLTF texture-blob error was observed in them. The original readiness error remains an additional retained technical failure. Eight medium render preparation defects were emitted: one in Breacher 1729, seven in Cryo 2718. The maximum full hold is **44.025 s entering Manual-control** for Cryo 2718; its threshold screenshot triggered at 5.024 s and is not the full duration. Passenger Vault, Communal Atrium, Armory, Safety-interlock, Service-shaft Landing and Containment Annulus also crossed 5 s in that run. All threshold screenshots and complete wall holds remain in the raw reports. No render fix or CPU-headroom claim was made.

| Job | Start → end UTC | Load start → end (1 / 5 / 15 min), 10 logical cores |
|---|---|---|
| Shard A |21:44:05.895 →22:20:07.523|34.40 /89.95 /183.29 →52.27 /54.74 /73.63|
| Shard B |21:44:11.558 →22:10:44.983|33.01 /88.74 /182.32 →87.43 /74.58 /91.67|
| Retry1 |22:11:15.265 →22:19:30.026|80.50 /74.18 /90.83 →37.57 /53.00 /73.96|
| Final cleanup |22:21:04.280|33.36 /49.37 /70.47|

Date is 2026-11-11 UTC. The initial shards plus retry completed within the original A window (~36 minutes); this scheduling observation under changing host load is not a performance certificate. Diagnostic fixed-tick performance windows are not realtime framerate measurements. Full room time/damage distributions are retained without discarding slow holdouts or deaths.

A human playtester should check Cryo's 1.5 s conditional freeze readability and marine silhouette during the pale Nova, the holdout pressure/climax across all rigs, ordinary pacing for Arc/Pyro, and native difficulty across more players/seeds. The graphics owner should investigate the measured preparation holds and any restart texture errors independently. No further campaigns, tuning, source edits or commits were performed by this helper.
