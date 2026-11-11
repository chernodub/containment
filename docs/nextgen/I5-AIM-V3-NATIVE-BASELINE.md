# I5 v3 native baseline calibration

> The native runs and their frozen game/policy identities remain valid calibration evidence. The mode-v7 Node comparisons below are now provisional historical references: later simulation-only grenade-angle timing, route warning-history and legacy pressure mismatches triggered a new mode-v8 validation. Original Node files and identities have not been replaced.

These two organic, unassisted story campaigns calibrate the frozen v3 policy against the historical baseline game. They are baseline evidence, not final candidate validation. No game source, renderer, main distribution, or other worktree was edited. No resource grants, room skipping, checkpoint probes, or assistance were used.

## Sources and reproducibility

- Game: `c3bd53b4f0f2c12735a1abb562f11eadb07c5a83` (I5 encounter tuning **false**).
- Policy/UI/render: `e97cf06107c6e23f9f7b96ac94f8b95ba3e7163d`; epoch `i5-catalog-ability-aim-v3`, navigation `i5-navigation-observer-v3`.
- Policy SHA256: `976eb173f26b67e0d02806b91b316a13fc11eecee94ba0310ac2287a7e402502`.
- Historical Node game SHA256: `f7cb49329e57843eec613886391b9572e995572b6a5a63d0f74de8cc811c4a6c`.
- Client application SHA256: `929de577e52e8c215aef42da804779fd1156e45f3d1b12133edad5846cce6ef9` (sorted paths and bytes of index.html plus top-level JS/CSS assets; excludes static assets).
- Immutable client directory: `artifacts/nextgen/i5-continuation/baseline-c3bd53b-policy-e97cf06-dist`.

An artifact-only Vite pre-load plugin supplied historical c3 text for DepthGame and src/game TypeScript modules and frozen e97 text for imported policy/UI/render modules. The build exited 0. An additional SSR build, without executing a campaign, reproduced the paired Node cohort's game hash. All 42 Node game modules were checked against client sources; the JSON geometry module bypassed the text hook and was separately verified byte-identical at c3, e97 and the working tree. The client imports additional presentation/audio modules, so its module-set hash is separately identified rather than equated with the Node hash.

[Build recipe, receipt and imported sources](../../artifacts/nextgen/i5-continuation/baseline-c3bd53b-policy-e97cf06-build/build-receipt.json), [Node/client source identity](../../artifacts/nextgen/i5-continuation/baseline-c3bd53b-policy-e97cf06-build/node-source-identity.json), [build log](../../artifacts/nextgen/i5-continuation/baseline-c3bd53b-policy-e97cf06-build/build.log), [raw comparison](../../artifacts/nextgen/i5-continuation/baseline-c3bd53b-policy-e97cf06-build/native-node-comparison.json).

Command (already completed; labels must stay unique on rerun):

```sh
node scripts/nextgen/playtest/native-batch.mjs --label=i5-aim-v3-baseline-native-c3-e97 --workers=2 --rigs=breacher,pyro --seeds=1729 --fast --dist-dir=artifacts/nextgen/i5-continuation/baseline-c3bd53b-policy-e97cf06-dist
```

## Actual endings and Node comparison

| Rig / seed | Native ending | Matching Node ending | Native / Node simulated seconds | Native / Node damage taken | Native / Node Overdrives |
|---|---|---|---|---|---|
| breacher / 1729 | dead, 19/20 clears, natural death in room 20 | complete, 20/20 clears | 769.63 / 813.62 | 976.07 / 571.36 | 15 / 16 |
| pyro / 1729 | complete, 20/20 clears | complete, 20/20 clears | 665.85 / 656.95 | 299.31 / 334.22 | 14 / 14 |

Breacher's native outcome differs from Node, with 404.71 more damage taken and one fewer Overdrive. Pyro completes in both, with 34.91 less native damage, the same Overdrive count, and 8.90 more simulated seconds. Equal source identities and policy versions do not establish bitwise native/Node parity. Native cursor projection, camera visibility and real key/mouse sequencing remain part of the browser adapter. This pair is too small to establish a campaign completion distribution.

Both child processes exited **1** because the existing defect collector retained a preparation-hold defect. The batch aggregator exited **0** after collecting those codes; that is not a clean campaign gate. Breacher's natural death is a valid observed ending, not a censor. There were no stalled, loading-timeout or wall-timeout endings.

## Raw graphics/loading diagnostics

Both reports have `errors=[]` (including no recorded GLTF texture-blob errors). Each retained exactly one medium `room-loading>5s` defect in Manual-control chamber:

| Rig | Threshold receipt | Full recorded hold | Evidence |
|---|---:|---:|---|
| Breacher | 5533.54ms | 8288.40ms | [loading-2812.png](../../artifacts/nextgen/playtest/i5-aim-v3-baseline-native-c3-e97-breacher-1729/loading-2812.png) |
| Pyro | 5074.30ms | 10704.75ms | [loading-2330.png](../../artifacts/nextgen/playtest/i5-aim-v3-baseline-native-c3-e97-pyro-1729/loading-2330.png) |

The thresholds and full holds are different receipts: the former marks the first observed crossing; the latter records elapsed preparation until readiness. No defect, error, wait or assertion was filtered or changed. Preparation, GLTF restart problems and CPU headroom remain owned by graphics integration.

Transmission chamber: native Breacher 74.95 s / Pyro 66.60 s versus Node 66.17 s / 65.38 s. Breacher took 38.78 damage there natively versus 0 in Node; Pyro took 0 in both.

## Timing and cleanup limits

Host load started at **284.91015625 / 383.04736328125 / 490.12353515625**, ended at **305.20849609375 / 353.75732421875 / 426.130859375**, on 10 logical cores. Native wall durations were 539.71 s (Breacher) and 525.38 s (Pyro). These overloaded-host runs make no performance claim. Fast mode preserves each fixed 60 Hz simulation/scene/camera update, submitting GPU draws at the 250 ms policy-batch boundary. Preparation/evidence frames still draw. Debug tick timing is a bounded retained window, not an entire campaign distribution; native RAF submission timing excludes GPU completion and later HUD synchronization.

Both runners completed their finally cleanup (browser.close and local server.close); the batch session was reaped with exit 0. A post-run process inspection found no matching runners, native batch processes, or Playwright Chromium profile processes. No unrelated browser was signaled.

Raw reports: [Breacher](../../artifacts/nextgen/playtest/i5-aim-v3-baseline-native-c3-e97-breacher-1729/report.json), [Pyro](../../artifacts/nextgen/playtest/i5-aim-v3-baseline-native-c3-e97-pyro-1729/report.json), [child exit receipts](../../artifacts/nextgen/playtest/i5-aim-v3-baseline-native-c3-e97/jobs.json), [batch log](../../artifacts/nextgen/i5-continuation/baseline-c3bd53b-policy-e97cf06-build/native-batch.log), [start load](../../artifacts/nextgen/i5-continuation/baseline-c3bd53b-policy-e97cf06-build/native-host-start.json), [end load](../../artifacts/nextgen/i5-continuation/baseline-c3bd53b-policy-e97cf06-build/native-host-end.json).
