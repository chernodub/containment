# VFX12 working visual review

## Baseline and occlusion investigation

Merged nextgen at c05b54e9. npm ci and production build passed.
The first localhost capture failed with EPERM; escalated captures work.
Opened native Flashfire and Railbreaker impact frame 04 in
`artifacts/nextgen/vfx12-before-native/`. Flashfire has connected salmon lobes,
no convincing compact hot source, and little separation between hot gas and
opaque illustration. Railbreaker is a broad rectangular strip. The marine has
a pale overlapping torso in both frames.

The High beacon shader compared depth without opaque object classification.
Self-overlapping skin surfaces therefore passed its behind-surface test.
Borrowed the existing geometry attachment and reject anything except opaque
architecture before applying the depth comparison. Opened the matching native
Railbreaker frame in `vfx12-occlusion`: torso detail is solid; the washed-out
interior is gone. Low still uses hardware depth and needs a separate solution.
No additional framebuffer or scene pass was added.

Evidence caveats: `--rooms` does not expand individual V2 scenarios. The first
baseline only covers Awakening Bay. Its serving dist was rebuilt during the
capture, so this parent must not be treated as a single-source full baseline.
The first two scenarios had already loaded before that rebuild. Cryo baseline
provenance is not accepted. Subsequent captures must finish before rebuilding.

## Flashfire candidate 1 — awaiting complete visual review

Narrowed the continuous central sections and side lobes, lowered side tips toward
the deck, increased the procedural orange and compact white-yellow core values,
and changed growth from nearly immediate full range to a rolling 180ms expansion.
All geometry remains presentation-only and uses existing warmed pools/shaders.
Explicit pale/dark room captures are running under `vfx12-fire-round1`.
This entry is not a completed look/fix round or an acceptance verdict.

Candidate 1 completed 21 frames with capture verification. Opened Awakening Bay
impact 04 at native size: the broad fill is reduced but the result is still
orange ribbons, with detached tips. This does not meet the requested commercial
impact bar. Rejected the candidate and restored ability sources; its exact patch
is retained at `artifacts/nextgen/vfx12-final/candidate/flashfire-round1.patch`.
Pale/dark frames were captured but not opened. Four completed critique rounds
have NOT been performed. The 480px occlusion after image was opened (sips
reduction; Pillow is unavailable).
