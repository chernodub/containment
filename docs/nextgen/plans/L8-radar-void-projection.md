# L8 exact void projection for the generic radar

The radar combines the hull and sealed void paths with SVG `evenodd` for its floor and wall clip. Overlapping solids therefore inverted their shared area back to floor. The affected current rooms are Armory (horseshoe plus magazine spine) and Breached Loading Bay (scar plus repair trunk).

`src/game/world/voidParity.ts` appends analytic nonempty polygon intersections while preserving all original voids first, by reference. For a point in k original solids, all nonempty subset intersections contribute 2^k−1 coverings: odd parity, exactly the solid union. Pair, triple and higher intersections are included. Convex half-plane clipping retains authored coordinates; concave/disconnected cases use pure ear-clipped partitions and convex intersections. A simple convex clipped cap takes the fast path. No AABB shape, grid approximation, convex-hull bridge, Three or DOM dependency is used; AABBs only reject disjoint pairs.

The factory changes only `voids: paritySafeVoids(template.voids)`. Added polygons are subsets of existing solids, so the native union, contacts and navigable floor stay unchanged. Original templates are never mutated. New arrays/points are frozen; a WeakMap caches deeply immutable source arrays. Disjoint and legacy arrays retain their original references. All renderer template roles and source silhouettes remain unchanged; the generic radar reads the corrected geometry without a UI edit.

Current exact projection sizes: Armory 3→4 paths, Loading 2→3; the remaining eighteen story rooms retain their original arrays. No collider, actor, ability, policy, encounter or checkpoint changes are made.

Verification on the activated reviewed partitions/Swarm source 03c3203:

- Five focused files, 60 tests pass; TypeScript passes.
- Twenty rooms: 42,551 dense positions; 170,204 R0/16/28/32 occupancy comparisons; 510,612 swept comparisons, all exactly equal to original void arrays.
- 10,776 exact edge/tangency probes check both occupancy and sweeps against the original geometry.
- 240 affected-room navigation controls, 19,186 actual waypoint steps, all equal; native sightlines and presentation wall contacts match.
- Independent evenodd-vs-native-union sampling includes concave hull exterior, known real overlaps, pair/triple/four-way coverage, repeated/oppositely wound polygons, and disconnected concave-concave intersections. Gap points verify no fabricated bridges.
- Input immutability, deterministic cloned inputs, cache identity, touching/disjoint references and mutable-input noncaching pass.

Numeric packet: `artifacts/nextgen/l8-sim/void-parity/verification.json`. Test log: `/tmp/l8-void-parity-final.log`. Parent owns the subsequent frozen all-room/ability/escape/replay suite and cohorts; no browser or cohort was run for this helper.
