# X2 world + actor final fix wave

Visual-only work in renderer modules; simulation, room collision/navigation/templates, abilities and UI remain untouched. Baseline application is 3a7996e, preserved at artifacts/nextgen/x2/before-dist. Desktop captures and benchmarks run sequentially against preserved production builds.

Actor work strengthens persistent friendly identification, family values/silhouettes, champion marks, Queen plate opening and rooted nests. World work adds deterministic material-merged equipment detail, occupied pod windows, asymmetric organic reclamation and a white-hot reactor. Presentation work reduces floor aliasing, corrects hazard color meaning, lifts pickup pictograms and stages a title confrontation.

Shared seams: DepthRenderer remains parent-owned; child modules expose uniform-only updates and lifecycle ownership. Models pickup function remains parent-owned while actor changes use the remainder. Existing static batching, fixed light topology, bounded prepare-ahead and shader warmup stay authoritative. New per-room fittings must remain inside solid footprints or flush to deck. All graphics resources must retire with their owner.

Risks: shared-host timing noise; strict draw/program budgets; authored asset tests require unavailable Blender. Retain raw failures and rerun load-sensitive gates alone. Three capture review rounds at native and 480x270, including motion, precede handoff.
