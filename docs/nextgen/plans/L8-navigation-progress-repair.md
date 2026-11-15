# L8 native navigation commitment progress

The new opening-midpoint crowd coverage exposed six real 60-second jams on
reviewed 659 geometry: Awakening 290/840, Atrium 328/310, Diagnostic 532/230 and
480/672, Workshop 260/250, Annulus 160/400. Named-space/dense geometric checks did
not sample these exact native crowd states. Their failed raw runs are retained.

Original 659 and the three-ingress candidate fail identically at 532/230. Brute 12
starts 512/880; Carrier 15 shares that entrance. At 0ms the Brute receives a clear
464/688 leg. Separation pushes it to 497.0561/890.6746; at 50ms it replans to the
nearby 496/880 cell. That commitment persists through 59950ms while the bodies
oscillate ~52.5 units apart. Final Brute 481.46035/880.25903 targets 496/880;
Carrier 533.90215/879.91351 targets 528/880. Fresh independent routes are clear
northward. Read-only live route/goal/commitment traces confirm the stale leg;
the Carrier's short target is not itself a retained commitment. Releasing the
Brute's stale leg lets both bodies progress.

`FacilityNavigation` now tracks best remaining leg distance and consecutive
observations without one unit of net improvement. After eight observations it
drops that commitment and recomputes the route using the existing shared field.
Native `decisionVersion` already increments once per actor decision: the world
helper accepts it optionally, without any actor edit. Thus a completely
stationary body can expire, while repeated/optional firing probes within one
decision count once. Plain geometry callers without versions use distinct body
positions. Oscillation cannot keep resetting progress; healthy slow movement
does. No wall clock, actor stats, ability, policy, collision predicates or BFS/neighbor
algorithm changes are made. Existing direct-clear, goal-jitter, short-leg,
arrival, wave and swept-clear rules remain.

Validation: five focused files 173 tests pass, including every 157 opening point
with 20 native actors, unchanged 60-second horizon, accepted full-body sweeps and
production 240-unit safe-entrance fallback. All 3140 actors resolve; all six old
failures pass. Existing Brute rounded-corner/32-unit-leg and goal-jitter controls
pass. New regressions replay the exact stale-leg states, stationary actors with
advancing decisions, repeated same-decision probes, and healthy slow progress.
TypeScript passes. No native timeout was raised or target deleted.

Evidence: `artifacts/nextgen/l8-sim/opening-midpoint-native-dispatch659/` retains
the original six failures; `l8-service-approach/commitment-trace/` retains the
exact route/commitment observations; `opening-progress-versioned/` contains the
passing 157-point packet. `navigation-progress/` contains red/green unit logs.
The three-ingress trial remains dormant and must use a committed source that
includes this real navigation repair. Full all-room/ability/replay proof and the
single declared primary 40 diagnostic remain pending.
