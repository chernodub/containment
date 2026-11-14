# V7 Overclock implementation

The sustained state is two separated held suit poses, with authoritative shot
counter deltas creating delayed muzzle/trace impressions. Stationary aim still
retains both poses. The start ripple is stronger; the end collapses in 200–240ms.
Moving hostile scan impressions are slightly stronger, with the existing
separated projectile trails and untouched hostile heads retained.

`arc/MarineTimeEcho.ts` caches the native marine skeleton's named deformation
bones. Each held pose has fixed CPU storage; broad prepared armor sections follow
the captured joint endpoints and shoe axes. These are articulated armor proxies,
not copies of the complete skinned surface. No actor material/skin buffer is
changed. Both poses use existing solid/ribbon pools: 26 solid instances on High,
20 on Low, with no new GPU inventory, atlas, material or shader variant.

`stats.shotsFired` supplies one receipt per actual shot, including shots whose
projectiles retired before rendering. A fixed 24-shot pool makes two displaced
impressions at 45/130ms; Low keeps the first. No ammo, fire-held input or live
projectile is mistaken for another shot. Native frame-batched receipts share the
current presentation muzzle/aim; the simulation remains authoritative.

Existing world priority masking resumes after the impact grace. The attached
suit retains its prior exemption. Pause redraws reuse stored poses/clocks;
room clear, state end and disposal retire all shot and pose state.

The only replaced presentation pin is the old ≤1.4m echo displacement: V7 bounds
it at ≤2.3m and adds ≥1.25m separation between poses. Existing color, opacity,
priority, pause, reset, target endpoint and hostile-head assertions remain.
An expiry test additionally requires the reverse ring to finish within 250ms.

Focused validation: `VITEST_MAX_WORKERS=2 npx vitest run src/render/abilities/arc`
passes 3 files / 28 tests, including the shipped animated marine (not just mock
bones), every-shot delay, High/Low, paused redraw, retirement and source-pose
nonmutation. Parent owns production capture review and full gates/benchmarks.
