# MOTION20 marine motion

The registered silhouette overlay shows the running helmet just below the idle crown and a larger shift at the boots, with most of the receiver and chest still overlapping. The shotgun drawing breaks farther behind the idle shoulder, although its smoke also enters the mask and exaggerates the change in outline.

Local baseline evidence lives in `artifacts/nextgen/motion20-before/`. In `overlay.png` red is idle frame 1, green is forward run frame 15 and blue is shotgun frame 2. White marks three-way overlap.

## Poses

The head turns four degrees around the vertical axis and lifts sixteen degrees around the aim-relative transverse axis after the authored pose is sampled. The receiver and the support hand retain their existing alignment. The idle chest rests about six degrees higher across the breathing loop. A 20 mm cyan brow light follows the lip to both temples. It is bound to the head and baked into the existing body atlas. The widest rig draws 24,050 body-plus-rig triangles, including the light's 140 triangles.

All eight `m10-run-*` cycles take 19 ticks instead of 16. At the same speed this increases distance per stride by 18.75%. The linear stance segment still moves the ankle back at the speed of the root. Forward pitch and lateral bank follow the two components of travel, giving about 12° of lean. The hips turn toward the supporting leg while the ribs counterturn. The shoulders and receiver lag the hips. The backpedal has a higher swing to keep the returning toe clear of the deck. Start and reversal blend through the revised gait. The roughly quarter-second stop moves the pelvis down and toward the leading foot, then releases the weight.

| Fire clip | Pose and recovery |
| --- | --- |
| Pistol | Less travel at the waist, more pitch at the wrist. |
| Rifle | The wrist leads, the stock seats on the second tick, and the hips take the third. The muzzle settles between rounds. |
| Shotgun | The first key catches the stock high. The hips drop farther on the second key, then the support hand pumps forward. |
| Plasma | The elbow opens and the shoulder holds the diagonal brace through 145 ms before the torso releases. |
| Rocket | The rear shoe lifts, steps back 29 cm in the authoring pose, and stays there across the deepest hip compression. |

Moving fire keeps its upper-body additive layer over the travel cycle. The rear-foot rocket step is clearest when stationary. Receiver pitch is applied at the existing wrist alignment step. All clocks and offsets in this change belong to presentation.

## Rebuild

From the repository root, rebuild the animation pack with the shipping skeleton and Blender 5.3.

```sh
blender -b -t 4 --python-exit-code 1 -P tools/assets/m10-motion/marine_locomotion.py -- --install
blender -b -t 4 --python-exit-code 1 -P tools/assets/m10-motion/marine_actions.py -- --clips=m10-idle,m10-fire-pistol,m10-fire-rifle,m10-fire-shotgun,m10-fire-plasma,m10-fire-rocket --install
```

The helmet is authored in `tools/assets/k12-hero/helmet.py`. Apply the 1024 px PNG resize after optimization and before appending the shadow LOD, then copy the finished marine to the plain fallback. Both model paths shipped this PNG format on entry to MOTION20.

```sh
blender -b -t 4 --python-exit-code 1 -P tools/assets/k12-hero/marine.py -- --bake --hero
mkdir -p artifacts/nextgen
sed "s/for(const name of \['dretch','basilisk','marauder','tyrant','dragoon','marine'\])/for(const name of ['marine'])/" tools/assets/i11-models/optimize.mjs > artifacts/nextgen/motion20-optimize.mjs
node artifacts/nextgen/motion20-optimize.mjs
node tools/assets/t12-textures/resize-embedded.mjs public/assets/models/marine.glb public/assets/models/marine.glb 1024
sed "s/const names = \['dretch', 'basilisk', 'marauder', 'dragoon', 'tyrant', 'marine'\];/const names = ['marine'];/" tools/assets/i11-models/lod.mjs > artifacts/nextgen/motion20-lod.mjs
node artifacts/nextgen/motion20-lod.mjs
cp public/assets/models/marine.glb public/assets/models/plain/marine.glb
npm run build
node scripts/nextgen/studio.mjs --only=portrait-
npm run build
```

## Local review files

`artifacts/nextgen/motion20-before/` and `motion20-after/` contain the native strips. The filenames are `marine-idle.png`, `marine-run-{0,45,90,135,180,225,270,315}.png`, `marine-stop-start.png` and `marine-fire-{pistol,rifle,shotgun,plasma,rocket}.png`. Each has a matching 480×270 room sequence under `camera/`. The two native rifle fights in `motion20-after/scenes/` are `pack-crawler.webp` and `pack-stalker.webp`, each with a JSON event record.

The cropped quarter-size sheet is `motion20-after/quarter.png`. Read the six baseline cells on the left against the six revised cells on the right. The rows are idle, eight travel directions in 45° increments, stop/start, pistol, rifle, shotgun, plasma and rocket. The stop row samples the braking interval and the following restart. The files under `motion20-after/comparison/` keep each full-room cell at 480×270, with the baseline above the revision.

The stock and collarbone are separate controls. When firing while moving, 35% of the additive hip translation enters the gait, while the ankle controls keep their travel tracks. The pistol, plasma and rocket also receive their own wrist pitch at the receiver alignment step. This keeps the alignment correction from flattening their recoil.

## Verification

The final production build passed. The seed-1729 Breacher campaign cleared all six rooms through Armory and stopped at the requested room limit with zero errors and zero defects. The campaign receipt is `artifacts/nextgen/playtest/breacher-1729/report.json`. The live Crawler fight recorded four shots, three hits and a kill. The Stalker fight recorded three shots, two hits and a kill. All fifteen final strips completed without errors.

The matched Breacher replay in Crew Checkpoint ran 300 rendered simulation ticks on High. All 37 sampled draw counts matched exactly. Both builds recorded 124 median, 133 p95 and 134 peak draws, 147 retained programs, zero program creations during combat, zero GL errors and zero context losses. The measurements are in `motion20-bench-before/benchmark.json` and `motion20-bench-after/benchmark.json`.

```sh
node scripts/nextgen/m9-motion.mjs --subjects=marine --collection=motion16 --out=artifacts/nextgen/motion20-after --lanes=true --scenes=pack-crawler,pack-stalker
npm run bench -- --no-build --rooms=crew-checkpoint --rigs=breacher --tiers=high --seconds=5 --repeat=1 --breakdown --cpu-only --label=motion20-bench-after
npm run playtest -- --rig=breacher --seed=1729 --rooms=6 --fast --startup-timeout-ms=180000
```

The `quarter/` folder in the final reel pairs all 30 baseline and revised frames for each action. `room-detail.png` crops the marine directly from the 480×270 room frames. Its rows show forward travel, braking, pistol, rifle, shotgun, plasma and rocket. The rifle alternates between a raised receiver and a settled stock. The shotgun puts the shoulder behind the back knee before coming forward. The rocket opens the widest gap between the shoes. Plasma carries its weight low across consecutive frames.

The world-space shoe traces cover ticks 20–53 of forward, strafe and backward travel in Crew Checkpoint. For both-foot samples pooled within each direction, median horizontal motion rounded to 0.00 cm per tick when both endpoints were within 4.5 cm of that shoe's lowest point. Peak motion in that window was 1.80, 2.13 and 4.24 cm respectively, including entry to and exit from contact. In the eight intervals within 1.2 cm of the lowest point, the shoes stayed fixed to numerical precision. This check covers three straight lanes.

## What still reads weakly

I count a readable cyan visor in **six of eight** facings across the idle, run and rifle rows in `motion20-visor-final/sheet.png` (0°, 45°, 90°, 135°, 180° and 315°). The full face is clearest from the front. At 225° and 270° the dome and rear shell leave only temple marks, and at 315° the visor reads mainly by its curved edge. In the Breacher selector portrait the lens remains just above the stock, looking along the barrel.

The other weak read is the pistol at 480×270. The wrist and short muzzle kick are visible over successive frames, but the pistol hand and receiver occupy only a few pixels. The shotgun rock and the rocket's rear step carry much farther across the silhouette.

## MOTION21

On a hard stop the right boot reaches its mark, the leading knee bends under the moving hips, and the barrel dips as the collar drops. The pistol loads the elbow and shoulder. The rifle turns the shooting shoulder around the hip and counterturns the head. The shotgun rocks farther back, catches the receiver below the visor and holds the catch from tick 5 to tick 12 (117 ms) before pumping. Plasma presses into a deeper diagonal brace. The rocket steps the rear boot 39 cm back while bringing the tube down and outboard.

### Silhouettes at fighting distance

Local evidence is under `artifacts/nextgen/motion21-review/`. The file `amplitude-silhouettes.png` contains all ten pairs of idle, mid-run, brake, rifle and shotgun. The frame numbers are 1, 15, 11, 2 and 3 respectively. Each pair uses the same viewport coordinates. The three dots follow the head joint, right upper arm origin and firing hand. The dedicated diagnostic omits muzzle effects and ejecta. `before-silhouettes.png` records the same drawings on the integration build. `amplitude-room.png` compares six consecutive room frames at their original 480×270 pixel scale.

In the brake, the hips travel 4.4 screen pixels forward from the last running sample, up from 2.2. The leading knee travels 9.3 pixels, up from 2.5. At pistol impact the shoulder moves 6.5 pixels relative to the hip, up from 2.7. For the rifle this shoulder excursion grows from 9.7 to 14.8 pixels. The shotgun is distinguished by its low stock and sustained rearward weight across successive frames. Idle and mid-run remain the closest upper-body pair, with the carried receiver tipping up as the shoulder passes the head.

Rebake just the changed animation takes with the existing Blender scripts.

```sh
blender -b -t 4 --python-exit-code 1 -P tools/assets/m10-motion/marine_locomotion.py -- --stops-only --install
blender -b -t 4 --python-exit-code 1 -P tools/assets/m10-motion/marine_actions.py -- --clips=m10-fire-pistol,m10-fire-rifle,m10-fire-shotgun,m10-fire-plasma,m10-fire-rocket --install
```

### Visor in a bright pool

A 26 mm matte strip follows the lower lip of the cyan lens and curves up toward both temples. It shares the body atlas and adds 156 triangles, bringing the heaviest body-plus-rig combination to 24,206. Both shipped marine GLBs are byte-identical and contain four 1024×1024 PNG textures. The four selector portraits were rendered again with the updated helmet.

The bright-pool comparison is `artifacts/nextgen/motion21-facings/bright-pool.png`. Both builds use the same Containment Annulus mark (496, 496) under four point lights. The new lower line separates cyan glass from the lit chin most clearly at 45°, 90° and 135°. In the idle, run and rifle rows of `sheet.png`, six facings show the visor, counting the narrow curve at 315°. At 225° and 270° the rear shell and dome still hide the face. Synchronous WebGL shader compilation was used for the final facing study after local parallel preparation stalled.

For the model, run the HERO19 handoff’s Blender bake, marine-only meshopt and marine-only shadow LOD steps. Between meshopt and the shadow LOD run `node tools/assets/t12-textures/resize-embedded.mjs public/assets/models/marine.glb public/assets/models/marine.glb 1024`. Copy the finished GLB to `public/assets/models/plain/marine.glb`, then run `npm run build` and `node scripts/nextgen/studio.mjs --only=portrait-`.

### Game-camera verification

All fifteen strips completed with zero capture errors in `artifacts/nextgen/motion21-after/`. In `quarter.png` the six MOTION20 samples on the left match the six MOTION21 samples on the right. The `quarter/` folder pairs all thirty frames per action. The `comparison/` sheets preserve the 480×270 room frames, and `room-comparison.png` crops the brake and all five weapons directly from those frames. The pistol now draws the shoulder and elbow back together. Its barrel remains the smallest and hardest to see under muzzle flash. The shotgun holds its low catch long enough to see the stock pass below the head; the rifle shoulder snaps back and immediately begins returning.

The two live rifle fights are `scenes/pack-crawler.webp` and `scenes/pack-stalker.webp`. Their JSON records match MOTION20 byte for byte, including shot time, angle, hits, movement and deaths. The Crawler fight records four shots and three hits; the Stalker fight records three shots and two hits. Each ends with a kill.

The matched Crew Checkpoint Breacher High benchmark recorded 124 median, 133 p95 and 134 peak draws in both builds, with 147 resident programs and zero mid-fight compiles. Across 37 sampled submissions, three differed by one draw, with the adaptive scale at 0.900–0.925 before and 1.000 after. The results are in `motion21-bench-before/benchmark.json` and `motion21-bench-after/benchmark.json` under the local evidence root. These CPU-only captures measure submissions.

The final production build passed. The six-room seed-1729 Breacher run cleared Armory with zero errors and zero defects (`artifacts/nextgen/playtest/breacher-1729/report.json`). An earlier run alongside the captures also cleared all six rooms with zero errors and flagged one Passenger Vault room-load delay. The repeat recorded 2.48 seconds for that room.

Repeating both 300-tick segments at fixed 1.0 resolution reproduced the median, p95, peak, program inventory and zero compile counts. Of the 37 draw samples, 35 matched exactly and two increased by one. The visible marine inventory still contained three meshes (body, Breacher rig and shotgun). Only the body gained triangles. The fixed-resolution receipts are `motion21-fixed-before/benchmark.json` and `motion21-fixed-after/benchmark.json`.
