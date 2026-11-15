# L8 dispatch and Overdrive observer — prepared, not launched

Root authorized preparation after the three-ingress diagnostic failed, while
the vanilla c7 primary40 control runs. No pressure, elite flag, count, stagger,
layout, actor, ability or policy change is selected. This tool has not executed
a native campaign and provides no outcome or balance evidence yet.

`scripts/nextgen/l8-dispatch-observer.mjs` only prepares an immutable generated
diagnostic runner and metadata; its CLI cannot launch a campaign. It inserts
read-only observations around each existing native `game.update` and immediate
key action, leaving each original call/input exactly once. The actual original
`sim-core.ts`, `sim.mjs`, metrics, worker, native emulation and policy files stay
unchanged. The transformed core receives a different hash and diagnostic flag;
it must never be described as vanilla backend or accepted as a release cohort.
The generated runner pins its exact game revision and label and imports a
frozen observer copy from that run's source snapshot, not future workspace code.

Per room the observer copies the director's original full schedule, including
every request ID, nominal eligibility, family, elite bit and requested breach.
It records normal/elite Spitter schedule counts and live counts separately.
Room-start and final snapshots include native elapsed/director time, live and
reserved actors, pending requests with Carrier reservation cost4, concurrent
cap, OD charge/ready/active/remaining/room-limit state and accepted OD count.
Each real dispatched-count increment maps back to its original request and
retains before/after time/live/meter snapshots. Live changes plus samples at
most250ms apart support cap-pressure interpretation. Accepted OD key events,
active-state transitions, ready transitions and native OD phase/target/damage
events stay distinct; Whiteout impact/end times can be examined alongside
arrivals without inferring them from nominal schedule alone.

Timing is honestly bounded: request dispatch is bracketed by native
`game.update` calls, including any internal expiry split, usually at most one
60Hz submission. Pre/post live counts are observed counts, not a claim to the
exact internal occupancy argument after that step's kills and pending spawns.
Ability phase events use their actual callback native elapsed timestamps.
This distinction is retained in each room's data. No wall clock drives an
observation or game decision. Final cleanup can end active intervals.

Preparation checks: five Node tests pass for immutable native reads, complete
multi-request deltas and delay brackets, separate elite/normal counts,
accepted-versus-active OD events, copied target arrays, deterministic source
instrumentation and exactly-once native calls. The transformed SSR core builds
without execution, and the generated runner passes `node --check`. This does
not establish full-campaign observer parity: before relying on observations,
an authorized observed run must preserve the same seed/policy/game outcome and
native room/stats fields against its vanilla control after removing only the
new observation fields and wall-time/diagnostic receipts.

Prepared label is `l8-dispatch-prepared-c7` on
`c7c75b985a30eb297596680cff9735e2ca86d6de`. Its generated runner/meta are in
`artifacts/nextgen/l8-sim/dispatch-runners/`; no playtest folder exists for that
label. Original core hashac5934d86c463818be49af6a6b9b0b76bca2cbc6fb3d1b2b5d3715ab8f2d63df,
original runner7b4c29920c1668b7f18a72343c02221e9675aed74e74f70e1dff3d04b6181c33,
observer moduleea14420d58d149a73d46d790c5e3f707168d2c378c76edae3a5217814b5d0749.
Future source/ref/label selection requires a fresh immutable preparation and a
separate prospective run declaration. No observer run or finite-wave change is
authorized by this report.

Subsequent separately authorized execution: `L8-navigation-control.md` declares
exactly eight c7 replays under fresh label `l8-dispatch-c7-eight`. All original
native gameplay-field parity passes8/8 before timeline interpretation; the
six-contract Vitest integration also passes. Complete results and timing
limitations are in `L8-c7-dispatch-observations.md`. The original preparation
label above remains unexecuted; no pressure/source change is selected.
