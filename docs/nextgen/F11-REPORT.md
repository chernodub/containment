# F11 partial implementation

Added `npm run bench -- --breakdown`: combines existing GPU-pass audit, cost counters and CDP profiling; writes Markdown per run and exclusive CPU leaf-sample attribution in benchmark.json. Unknown symbols remain explicitly unattributed. No runtime changes, dependencies or tests added.

Validation: node --check scripts/nextgen/bench.mjs passed. npm ci failed with EUSAGE: Missing @emnapi/runtime from lock file, including a retry with legacy peer resolution. npm run build failed because tsc is unavailable. No six-room runs, captures, campaign, recovery or tier-switch verification could execute. GPU and CPU before/after totals are unavailable for all six rooms. No budget certification or performance improvement is claimed.

Still required: source-mapped CPU attribution, per-pass geometry and memory accounting, deterministic profile segment, complete six-room matrix, ranked costs, measured optimisations and visual comparisons. Existing GPU sceneColor includes shadows/resolve and is not an exclusive opaque scope. The requested fully separated pass inventory is not implemented.

Integration request: repair the dependency lock/install baseline, then complete measurements before selecting optimisations. Retained final artifact directory has no fabricated measurements.
