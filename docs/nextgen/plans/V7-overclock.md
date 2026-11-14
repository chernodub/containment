# V7 Overclock implementation

The sustained state is two separated held suit poses, with authoritative shot
counter deltas creating delayed muzzle/trace impressions. Stationary aim still
retains both poses. The start ripple is stronger; the end collapses in 200–240ms.
Moving hostile scan impressions are slightly stronger, with the existing
separated projectile trails and untouched hostile heads retained.

R1 critique rejected the broad armor proxies as chunky boxes. The primary path
is now `arc/NativeMarineEchoes.ts`: two pooled native SkinnedMeshes borrow the
prepared marine geometry, retain private detached skeletons and copy the actual
live bone-world/inverse-bind matrices. The two held poses are exact native skin
deformations, including gait, aim, recoil and presentation brace. High adds two
skin draws; Low keeps one exact native skin. A common un-inked three-band ghost
shader has a subtle violet rim and 3% scan modulation. The weapon remains a short
held rail plus the per-shot delayed traces.

Construction occurs inside the existing lazy ability owner, after actor assets
are loaded. Two bone textures are allocated before preparation and exposed as
direct material texture owners to the existing texture upload/context recovery
inventory. Shared geometry is never changed or disposed. The owner disposes its
one material and two bone textures exactly once. It creates no shader variants
or GPU resources at pose capture. Original articulated proxies remain only as a
fallback for standalone fixtures without native asset geometry.

`stats.shotsFired` supplies one receipt per actual shot, including shots whose
projectiles retired before rendering. A fixed 24-shot pool makes two displaced
impressions at 45/130ms; Low keeps the first. No ammo, fire-held input or live
projectile is mistaken for another shot. Native frame-batched receipts share the
current presentation muzzle/aim; the simulation remains authoritative.

Existing world priority masking resumes after the impact grace. The attached
suit retains its prior exemption. Pause redraws reuse stored poses/clocks;
room clear, state end and disposal retire all shot and pose state.

One replaced presentation pin is the old ≤1.4m echo displacement: V7 bounds
it at ≤2.3m and adds ≥1.25m separation between poses. Existing color, opacity,
priority, pause, reset, target endpoint and hostile-head assertions remain.
An expiry test additionally requires the reverse ring to finish within 250ms.
The R1 native 26-proxy-instance pin is replaced by two real skin draws, exact
deformed-vertex fidelity, stable prepared resources and one exact skin on Low.

Focused validation: `VITEST_MAX_WORKERS=2 npx vitest run src/render/abilities/arc`
passes 4 files / 32 tests. The native check compares about 80 actual skin vertices
over eight translated/rotated/recoiling/braced frames with less than 1e-6m error,
and retains every-shot delay, High/Low, paused redraw, retirement, exact-once
disposal and source-pose nonmutation. TypeScript passes. Parent owns production
capture review and full gates/benchmarks.
