# COMM13 combat mechanics on screen

- Siege beats draw a depth-tested teal boundary at the native hold radius. An inner sweep consumes the authoritative charge time, and the relay label reports charging, outside, or charged. The existing objective panel keeps the same countdown. The label moves clear of the marine silhouette.
- Crown and shield markers identify priority and control resistance independently. Fine gold tethers connect up to three same-beat screen or anchor escorts. A violet contour and brief RESISTED receipt show rejected immobilizing control.
- Ranged cues share the existing bounded, HUD-aware edge pool. A committed off-screen Spitter gets a directional danger chevron with wind-up progress. Hostile projectiles keep an independent leading cue while outside the usable view and on an approaching line.
- Stalker commitment raises lantern emission and rim strength on existing actor materials. Its capsule uses the native melee warning geometry and phase clock. Recovery keeps a smaller rim and lantern lift.
- Flank and crossfire arrivals mark up to two native breach locations for a second. Reinforcement cancellation lights the defeated leader’s location when the director reports the cancellation. The objective line and the roster’s last-three edge markers consume the native beat state.

## Additive presentation data

- `DepthGame.siege.durationMs` supplies the charge sweep denominator.
- `boonStatuses(id).controlResisted` reports the native stagger or shortened shock window for the shield flash on resistant targets.
- `EncounterSnapshot.beatRemaining` reports undispatched bodies in the current authored beat. The HUD combines it with live and queued bodies for cleanup.
- `GameEffect.encounterCue`, `cueX` and `cueY` carry the grammar and breach anchors on existing arrival receipts, plus the priority-death flag on the existing corpse receipt.

Simulation rules, damage, encounter schedules, and save formats are unchanged. The boundary meshes are prepared with the scene and disposed with the renderer. The Stalker uses actor uniforms already on the preparation path. Edge, breach and target markers reuse fixed presentation owners.

## Verification

The baseline `npm ci && npm run build` and the final production build passed. The capture bursts ran at 1920×1080 with the Apple M1 Pro ANGLE Metal renderer. The gallery keeps full frames, 480×270 reductions and the original runner manifests. Representative phases at each size were opened for [visual review](plans/COMM13-review.md). Shader program counts held steady within the Stalker, siege and crowded bursts. These captures provide visual and shader-count evidence.

The capture fixtures use authored rooms and native threat clocks with an invulnerable marine. They stage position, pre-chill the Armory priority target before Cryo Nova, and assign one Carrier and three escorts in the staged twenty-enemy frame. The reinforcement scenario stages a killing blow and leaves cancellation to the director. The first tactical attempt was superseded after rebuilding the served directory interrupted it. The Diagnostic Gallery cancellation attempt produced the cue but placed the authored warning panel outside the HUD-safe bounds, so the warning guard rejected the burst. The Armory cancellation and cleanup burst passed the same runner. The follow-up also showed the siege countdown pausing outside the boundary and the ranged cue retiring once the projectile entered view.

The unassisted native Standard Cryo campaign used seed 1729 and rendered every 60 Hz fixed tick. It cleared six rooms, ended in a natural death in Freight Hold, and exited 0 with zero runner errors or defects. The [campaign receipt](../../artifacts/nextgen/comm13-final/campaign/report.json) and [capture gallery](../../artifacts/nextgen/comm13-final/index.html) are retained locally.

At 480×270 the resistance shield, escort tethers and breach flare lose some contrast. Stalker recovery remains subtler than the wind-up and strike.
