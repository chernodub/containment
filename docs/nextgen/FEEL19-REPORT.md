# FEEL19 creature motion

## Baseline

- The Crawler lifts its leading foot close to its head, the Stalker sweeps a blade behind its shoulder, and the Brute finishes its load with the cleaver almost directly above its crown.
- A rifle contact restarts a reaction clock on every hit, and a second shot can replace the first catch with a heavy recoil.
- The Warden freezes partway through stagger with its body tipped forward. Opening pods widen around a glowing seam, and interrupted pods shrink in place.
- Both heavy families gather their limbs inward as their torsos pitch forward into the ordinary death pose.

The baseline production build and native rig captures are under `artifacts/nextgen/feel19-before` in this worktree. The strips replay poses. The boss captures advance native AI.

## What changed

1. Captured attack, surviving rifle contact and shotgun kill strips for all five ordinary families from baseline `2d53fb77`. Each strip has 24 frames sampled every four simulation ticks. The two guardians were also staged in Crew Checkpoint and allowed to reach their own attack and recovery states.
2. The Crawler banks its shield away from the heavy hook, lifts that hook sideways and plants its opposite foot. Its shield turns through the follow-through. The Stalker loads one scythe outside its shoulder while its other wrist braces forward and low. The Brute's leading cleaver finishes its lift wide of the crown and stays extended while the chest turns out of the swing. The three clips still sample the native wind-up, strike and recovery clocks.
3. Five families have four directional rifle reactions. The struck-side foot misses its plant and the chest twists and travels toward it over 11 animation ticks (about 183 ms). The mixer adds the local torso translation and joint rotations over locomotion or the current attack. Each target uses a 200 ms gap between rifle contacts to recognize a new burst. A round arriving during the first catch preserves that catch and gives the normal contact flash. Later rounds use a light layer at 23% weight.
4. At wall contact the Warden drops its head and plants both cleavers. A held Brute clip supplies the pose until stun expires. The Matron's sealed clutch opens along a deep longitudinal cut between two raised shell lips during the final 500 ms. The low cups sit under the opening. A withering pod tips into a low oval and pulls toward the Matron during the first 650 ms of interruption. When the killing shot has already removed the last pod, its retained shell follows the same inward fall, loses height and stays folded on the deck. The renderer uses the last visible position and reuses the brood marker draw.
5. Brute and Carrier pitch onto one shoulder, turn the head clear and spread their feet and claws before the existing physical handoff. The side fall blends in late on elemental deaths to keep their initial contact poses.

## Sources and rebuilding

- The creature keys are in `tools/assets/m10-motion/enemy_actions.py`. The packed outputs are `public/assets/models/motion/{crawler,stalker,brute,spitter,carrier}-motion.glb`.
- `src/render/motion/AuthoredMotion.ts` selects and layers the rifle reactions. `src/render/models.ts` holds the Warden pose.
- `tools/assets/k11-creatures/growth/pieces.py` sculpts the pod. `src/render/BroodPodModel.ts` places its shell and cup instances. `src/render/world/PincerPresentation.ts` positions the opening and collapsing remains. The corpse update in `src/render/DepthRenderer.ts` carries the retained pod geometry through its fall.
- The pod-only pipeline writes `brood-pod.glb`, `brood-pod-ktx.glb`, `brood-pod-normal.png`, `manifest-pod.json` and `shipping-pod.json` in `public/assets/brood-growth/`.

```sh
blender -b -P tools/assets/m10-motion/enemy_actions.py -- --families=crawler,stalker,brute --clips=m10-windup,m10-strike,m10-recovery
blender -b -P tools/assets/m10-motion/enemy_actions.py -- --families=crawler,stalker,brute,carrier,spitter '--clips=m10-hit-rifle-*'
blender -b -P tools/assets/m10-motion/enemy_actions.py -- --families=brute --clips=m10-wall-stun
blender -b -P tools/assets/m10-motion/enemy_actions.py -- --families=brute,carrier '--clips=m10-death-*'
sh tools/assets/k11-creatures/growth/rebuild.sh --set=pod --no-render
TOKTX=/path/to/toktx node tools/assets/t12-textures/pack-brood.mjs --pod-only
node tools/assets/i11-models/brood-lod.mjs --pod-only
npm run build
```

## Verification

The local before and after galleries are under `artifacts/nextgen/feel19-{before,after}/`. The `motion/` directories contain the native-size strips. The `packs/` directories contain 60 Hz rifle frames with native enemy movement and damage. The `feel19-after/comparisons/` directory contains paired quarter-size strips and 480×270 room frames. Left is before and right is after. Crowd captures in Relay Racks and Swarm Junction also include the HUD. The Armory and Swarm Junction openings with the gameplay HUD are in `artifacts/nextgen/feel19-live-openings/`. The separate `interrupt-final/` captures kill both pods through native damage and follow the retained shells. `falls/` contains ordinary Brute and Carrier deaths. Open `feel19-after/comparisons/index.html` for the paired gallery.

```sh
node scripts/nextgen/m9-motion.mjs --out=artifacts/nextgen/feel19-after/motion --subjects=crawler,stalker,brute,spitter,carrier --actions=attack,weapon-hit-rifle,weapon-kill-shotgun
node scripts/nextgen/i13-native.mjs --out=artifacts/nextgen/feel19-after/bosses --rooms=crew-checkpoint --cases=warden,matron
npm run capture -- --label=feel19-after-crowds --scenarios=value14-crowd-relay-racks,value14-crowd-swarm-junction
npm run bench -- --label=feel19-final --rooms=crew-checkpoint --rigs=breacher --tiers=high --repeat=1 --seconds=10
npm run playtest -- --rig=breacher --seed=1729 --rooms=10 --fast --startup-timeout-ms=180000
```

| Matched observation | Before and after |
| --- | --- |
| Relay Racks, four crowd frames | 122, 122, 124, 124 draws |
| Swarm Junction, four crowd frames | 81 draws each |
| Moving rifle packs in Crew Checkpoint | 142 programs throughout both 20-frame sequences |
| Warden wall impact | 108 draws |
| Matron pod opening | 111 draws |
| Interrupted clutch, four frames | 112, 112, 110, 112 draws and 146 resident programs |

Across all 40 matched rifle-pack frames, target health, both velocity components, draw calls and the resident program count matched the baseline.

The direct WebGL counters recorded zero shader compiles and zero new programs through wall stun, hatch and interruption. In the retained two-boss session, both builds reported 146 resident programs for the Warden and 149 for the Matron. In the independent hatch-only launch, the Matron started and finished at 146 before and 145 after. The matched interruption launches both held at 146.

The production build and `npm run verify` passed. The requested Breacher campaign on seed 1729 cleared ten rooms with zero errors and zero reported defects. The repeat on final runtime `3aa54dab` also cleared all ten. Its report and screenshots are under `artifacts/nextgen/playtest/feel19-verified/`.

The two realtime benchmark trials retained 145 programs and created zero during combat. Their peak draw counts were 127 and 130. Realtime trials sampled different combat frames on a shared host. The fixed-step comparisons above use the same simulation frame on both builds.

## Weakest remaining reads

- At 480×270 the Crawler's twist shows which side lost its footing, but the hooked foot itself can disappear against the dark deck or a second body.
- The Carrier's mantle stays easy to follow as it tips. From behind it still covers part of the head once the ragdoll settles.
