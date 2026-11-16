# VFX12 incomplete implementation record

This is not the requested completed VFX12 delivery. Steps 0–5 are not complete.

Branch: `t3/ability-vfx-aftermath`. Integration baseline: c05b54e9.

Implemented a High-tier marine beacon correction: classify the existing opaque
geometry pixel before the x-ray depth comparison. Only architecture may trigger
the overlay. This prevents self-overlapping armor from washing out the torso.
The geometry texture is borrowed; no new render target or render pass is added.
The shader remains in the existing preparation path. Native Railbreaker before
and after impact frames were opened and show the change. The after image was
also opened at 480×270. Low retains its old depth-only behavior and is unresolved.
Actual wall-occlusion coverage still needs review.

Build passed after merging nextgen and after the correction. Baseline capture
produced 21 frames; correction capture produced seven; the rejected Flashfire
candidate produced 21 across Awakening Bay, Containment Annulus and Infested
Workshop. All completed capture commands exited successfully. No campaigns or
benchmarks were run. No hardware performance or complete warmup acceptance is
claimed. The original baseline dist changed during capture; do not accept that
parent as a single-source full baseline. See the review log for specifics.

Evidence: `artifacts/nextgen/vfx12-final/occlusion/` contains native and 480px
before/after. Raw capture parents are `vfx12-before-native`, `vfx12-occlusion`,
and `vfx12-fire-round1`. A rejected Flashfire patch is retained under
`vfx12-final/candidate/`. This is not a final per-ability gallery.

Flashfire candidate 1 reduced width and raised core values but still looked like
ribbons. It was reverted rather than accepted. Flashfire, Railbreaker, Cryo Nova
and all four Overdrives remain below the requested bar. No effect reauthoring,
four-round acceptance, 20-enemy review, per-rig campaigns or before/after bench
has been completed. No tests, simulation changes, pushes or PRs were introduced.
