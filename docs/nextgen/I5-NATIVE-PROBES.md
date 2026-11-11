# I5 native probes — provisional story evidence and legacy compatibility

These are **completed diagnostic probes, not the final story balance cohort**. The final confirmation of at least two campaigns per rig remains pending; none of the provisional story labels below replaces it. Read `report.outcome` and terminal state: a runner or batch exit code of zero accepts a recorded natural death and does **not** mean campaign completion. V4 and V7 are earlier candidate labels, regardless of `final` appearing in a directory name.

All paths below are relative to this worktree. Raw JSON, input/effect traces, screenshots and copied harness sources remain under `artifacts/nextgen/playtest/<label>/`. No renderer implementation was changed for these probes.

## Completed outcomes

| Exact report label | Mode / seed | Actual outcome | Cleared | Raw errors / defects | Largest observed loading hold |
| --- | --- | --- | ---: | ---: | --- |
| `i5-before-arc-1729` | Arc 1729, default drawing, unassisted | **complete**, room 20, zero remaining threats | 20/20 | 0 / 0 | Manual-control chamber: **3.412 s** |
| `i5-candidate-default` | Arc 1729, default drawing, unassisted | **room-limit**, reward after room 3 | 3/20 | 0 / 0 | Passenger Vault: **0.991 s** |
| `i5-fast-parity` | Arc 1729, fast drawing, unassisted | **room-limit**, reward after room 3 | 3/20 | 0 / 0 | Passenger Vault: **0.818 s** |
| `i5-v4-native-breacher-breacher-1729` | Breacher 1729, fast, unassisted | **dead**, room 17 Shielding Gate; 24 threats remaining | 16/20 | 0 / 0 | Passenger Vault: **2.035 s** |
| `i5-v4-native-breacher-breacher-2718` | Breacher 2718, fast, unassisted | **dead**, room 14 Service Shaft Landing; 16 threats remaining | 13/20 | 0 / 0 | Passenger Vault: **2.116 s** |
| `i5-v7-native-breacher-breacher-1729` | Breacher 1729, fast, unassisted | **dead**, room 16 Swarm Junction; 15 threats remaining | 15/20 | 0 / 0 | Passenger Vault: **1.066 s** |
| `i5-final-legacy-arc-1729` | Legacy v2 Arc 1729, fast, **15% incoming damage** | **complete**, room 12 Reactor Vault; Queen defeated, zero remaining threats | 12/12 | 0 / 0 | Reactor Vault: **3.554 s** |

Every selected report contains literal `errors: []` and `defects: []`; no triage suppression is needed for these labels. V4 batch `jobs.json` records code 0 for both deaths; its per-job logs explicitly print `dead`. The V7 1729 job likewise records code 0 and prints `dead`. The baseline terminal statistics record 31 Overdrives; the assisted legacy records 18. These observations come from different candidates/policies and are not a controlled before/after cadence estimate.

The legacy Queen fight took **289.383 simulated seconds**, with one Queen kill among **754 total kills**. Three earned service rooms auto-cleared at zero combat seconds. The command explicitly used `--legacy --assisted --fast --max-room-seconds=360`; legacy initialization used the guarded initial factory after native rig selection, then ordinary encounter combat. This proves assisted legacy completion for that build, not an unassisted clear or final story balance.

## Part C findings retained for the graphics owner

**Preparation holds remain open.** These selected probes did not reproduce R4's 5–14 s Manual-control hold. Only the baseline story campaign reached room 19; it measured 3.412 s there. The tuned V4/V7 probes above died before the reactor, so their lack of a reactor hold supplies no late-room recovery evidence. Legacy Reactor Vault's 3.554 s is a different room. Values are the runner's observed `loadingHolds` wall intervals, not complete time-to-first-playable measurements. The unchanged collector records a hold above five seconds and continues toward its separate 120-second timeout; this note neither filters holds nor treats absence as a fix.

**Texture/blob restart investigation remains open.** None of these seven reports or their selected native campaign/parity/legacy logs contains a console/page/HTTP error or `THREE.GLTFLoader: Couldn't load texture blob:` receipt. They are campaign probes, not a systematic restart stress test. R4's historical first-smoke restart failure remains historical evidence and is not resolved by these clean runs.

**CPU headroom is not certified.** The recorded hardware is `ANGLE (Apple, ANGLE Metal Renderer: Apple M1 Pro, Unspecified Version)`. Fixed-tick timing measures CPU update plus renderer submission; percentiles cover the latest 2,048 retained ticks within the room, while mean/max extend from that room's explicit timing reset. It excludes GPU completion and outer policy/snapshot/Playwright work. These were shared-machine runs, not an isolated human RAF benchmark.

For the full-draw baseline, the final per-room p95 windows range from **4.8 to 11.0 ms**; the largest recorded individual fixed tick is **282.7 ms** in Residential Gallery. The default parity probe records a **446.4 ms** maximum in Awakening Bay. Their cause is not established here. Fast mode retains simulation, scene, camera and actor updates on every tick but omits intermediate raw GPU submissions; its lower timings cannot establish normal-render performance. V4/V7's largest per-room p95 windows still reach **11.2 / 12.6 / 11.3 ms**, respectively. No CPU, quality or loading assertion was weakened.

## Fast/default parity and provenance

The two Arc candidate parity runs use the same immutable `artifacts/nextgen/i5/candidate-dist` directory. Both clear rooms 1–3 in exactly **13.433333 / 34.700000 / 37.316667 simulated seconds**, with identical terminal run state, resources and authoritative statistics. They record 347 input decisions with identical discrete decisions; tiny coordinate differences remain (maximum screen-coordinate delta **9.87e-10 px**, world-coordinate delta **2.11e-12 units**), so their raw input JSON is not byte-identical. Default wall time was 90.133 s; fast wall time was 47.493 s. This validates the fast path on this opening sample, not every campaign or performance target.

| Labels | Recorded checkout HEAD | Served distribution | Navigation policy |
| --- | --- | --- | --- |
| Baseline Arc | `76e744ddae0d3dfc045614efb4b6efd6509ba9e7` | Original default `dist`; directory field absent in this older report | Original R4 policy; no version field |
| Default/fast parity | `76e744ddae0d3dfc045614efb4b6efd6509ba9e7` | `artifacts/nextgen/i5/candidate-dist` | Original R4 policy; no version field |
| V4 Breacher pair | `1f26b264925bdc893a29e32256dc4b89b964201e` | `artifacts/nextgen/i5/nav3-v4-dist` | `i5-navigation-observer-v3` |
| V7 Breacher 1729 | `1f26b264925bdc893a29e32256dc4b89b964201e` | `artifacts/nextgen/i5/final-v7-dist` | `i5-navigation-observer-v3` |
| Assisted legacy | `01af5fe5a053f215a5069ae4df117f449180a79f` | `artifacts/nextgen/i5/nav3-v3-dist` | `i5-navigation-observer-v3` |

`report.head` is the checkout commit at launch; it does not identify uncommitted candidate numbers by itself. Preserve the report's build-directory label and copied source hashes together. All selected reports hash `policy.mjs` as `3a71094272e034b044e5e46cea11c76c768c93dbe134a4f78c2965850f7f4998`. Runner hashes are:

- Baseline: `3347139b3a895dedbaa809c650660cb5ceff115269d466cebadfdc015e725e66`.
- Default/fast parity: `5ce802e7a5fd5c3d638b14c409d148fd50d6ebe9056aeaf273f38faf7ca7842e`.
- V4, V7 and legacy: `41724af8c90de3ade803668e7e421d7aeb2d4651c250c65402abe86478affafe`.

The latter group additionally records navigation helper hash `334bc5a8b110a9f68841ed77abee8f5ae9290d7fec6ea2b03d99e9e9c9d164ad` and shared version-module hash `f583b313a06e675b074de36eb556b7efd9f4b4a0320c32e85b4f2a0f9de88eec`. Earlier policies are not pooled with v3 outcomes. Source hashes describe the copied harness sources; these older native reports do not record a distribution-content hash.

Relevant logs: `artifacts/nextgen/i5/gates/before-arc-1729.log`, `parity-default.log`, `parity-fast.log`, `v4-native-breacher.log`, `v7-native-breacher.log`, and `final-legacy-arc-1729.log`. Per-job logs and exit receipts live in `artifacts/nextgen/playtest/i5-v4-native-breacher/` and `i5-v7-native-breacher/`. Review the selected reports directly for every raw receipt; the final I5 report must supply the later accepted cohort and gate results separately.
