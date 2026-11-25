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

## MOTION22

The shotgun keeps both ankle targets in place while the hips move down and back and the shooting shoulder drops below the helmet. The stock travels down and outboard as the helmet tips back. The catch lasts from tick 5 through tick 16 (183 ms), then the pump draws the body forward. The rifle rolls the shoulder down on its third tick, the pistol pulls its elbow outward, and the rocket takes a 46 cm rear step. Plasma retains its sustained diagonal brace.

The registered ready/fired silhouettes are in `artifacts/nextgen/motion22-overlays/sheet.png`. Each pair uses the same weapon, camera and floor mark, sampled before the trigger and during recoil. Magenta and cyan show the two silhouettes at their actual 480×270 viewing scale. Head / shooting shoulder excursions in screen pixels were 6.1 / 9.6 for pistol, 12.0 / 17.5 for rifle, 19.7 / 25.7 for shotgun, 8.8 / 9.3 for plasma and 19.6 / 23.9 for rocket. The shotgun grip moved 3.8 pixels relative to the head, alongside the much larger displacement of the whole torso.

A steady pale grazing highlight follows upper rig paint and cyan brow emission within the existing marine surface. The actor shader cache key is `actor-surface-v15-motion22:marine`. The four portraits sample the equipped weapon's production recoil at ticks 7, 3, 12 and 6 for Breacher, Cryo, Pyro and Arc. A warmer side light and reduced hemisphere fill distinguish the helmet from the braced shoulder. Pyro faces across the frame to clear the orange dome from behind the tube. The rig selector, pause and death card use the same four portrait PNGs.

Rebuild the clips and portraits with the following commands.

```sh
blender -b -t 4 --python-exit-code 1 -P tools/assets/m10-motion/marine_actions.py -- --clips=m10-fire-pistol,m10-fire-rifle,m10-fire-shotgun,m10-fire-rocket --install
npm run studio -- --only=portrait-
npm run build
```

The fifteen final strips completed with zero capture errors. Under `artifacts/nextgen/motion22-after/`, `quarter.png`, `quarter/`, and `room-comparison.png` compare against MOTION21. On the 480×270 shotgun row the shoulder stays below and behind the ready pose through the fifth sampled cell. The pistol hand still covers only a few pixels, so its elbow is easier to follow than its barrel. The maximum sampled horizontal aim deviation in the five firing strips was 1.8×10⁻⁷ radians.

The four native-size frames in `overdrives/rig-effects.png` show the Breacher beam, Cryo field, Pyro blast and Arc discharge. The visor and coloured dome remain identifiable in each frame; Cryo's pale field gives the brow the least contrast. `scenes/pack-crawler.webp` and `scenes/pack-stalker.webp` show live fights. Their native event lists match MOTION21 exactly, including shot angles, times, hits and deaths. `artifacts/nextgen/motion22-portraits.png` shows the four selector poses side by side.

The production build passed. In the fixed-resolution Crew Checkpoint benchmark, all 37 draw samples matched exactly (124 median, 133 p95, 134 peak). Both builds had 147 resident programs and zero combat compilations. Receipts are `artifacts/nextgen/motion22-fixed-before/benchmark.json` and `motion22-fixed-final/benchmark.json`.

The Breacher campaign cleared six rooms through Armory with zero errors in `artifacts/nextgen/playtest/motion22-final/report.json`. The runner returned status 1 for two room-load observations over its five-second threshold, in Passenger Vault and Residential Gallery, while capture work was running.

The repeat without concurrent capture or benchmarking also cleared six rooms with zero errors. Its runner returned status 1 for slow loads in Awakening Bay, Passenger Vault and Residential Gallery. The receipt is `artifacts/nextgen/playtest/motion22-quiet/report.json`.

## MOTION23

The four portraits now use authored low-ready stances. Both soles are on the deck, the hips move forward toward the leading knee, and the grip drops below the visor. Breacher presents the shotgun across the front boot, Cryo carries the rifle a little higher, Pyro opens its stance to the right around the launcher, and Arc brings the plasma weapon across the opposite shoulder. Each uses the game's ink pass, an upper-front key, a rig-colour rim and a plate-white adjustment that keeps dark ink intact.

The four stills ship as `public/assets/ui/studio/portrait-{breacher,cryo,pyro,arc}.png`. Under `artifacts/nextgen/motion23-ui/`, the eight native captures cover all four rigs, the collapsed selector, Inspect open, the Cryo death card and both pause views. `native-detail.png` keeps the original pixels and `screen-sheet.png` shows each screen at 480×270. The visor and rig colour survive the death thumbnail; its 07 numeral needs the larger selector view.

Rebuild the authored poses, portraits and recoil with the existing tools.

```sh
blender -b -t 4 --python-exit-code 1 -P tools/assets/m10-motion/marine_actions.py -- --clips=m10-portrait-shotgun,m10-portrait-rifle,m10-portrait-rocket,m10-portrait-plasma,m10-fire-shotgun,m10-fire-rocket --install
npm run studio -- --only=portrait-
npm run build
```

Both heavy clips keep the rear ankle at its ready target from before the shot through the catch. The shotgun elbow folds and the stock closes on the shooting shoulder while the pelvis moves back and down. The pump then opens that space. The rocket braces on the grounded rear boot and brings the launcher down sooner. The shotgun muzzle levels at tick 22 and the hips return at tick 27. For the rocket those ticks are 12 and 17. Each delay is 83 ms.

`artifacts/nextgen/motion23-overlays/heavy-cycle.png` shows ready, fired and recovering masks registered to the same camera at the actual 480×270 scale. The final column combines them in red, green and blue. The projected gap between the rear face of the weapon mesh and the firing shoulder joint was 5.8, 2.8 and 10.1 pixels for the shotgun and 5.8, 4.1 and 3.5 pixels for the rocket. The rear ankle moved less than 0.001 pixel through contact and the horizontal weapon heading stayed within 0.000001 radians of the input aim. The subtle contact is harder to distinguish on the rocket because the tube covers the shoulder.

All fifteen `artifacts/nextgen/motion23-after/` motion strips completed with zero capture errors. `quarter.png` and `room-comparison.png` pair the new poses with MOTION22. The two live Crawler and Stalker fights in `scenes/` replayed the earlier native event lists exactly, including shot timing, aim angle, hits and deaths.

The production build passed. The fixed-resolution, 300-tick Crew Checkpoint Breacher High benchmark retained 124 median, 133 p95 and 134 peak draws, 149 resident programs and zero combat compilations. Of the 37 draw samples, 36 matched exactly and one rose from 126 to 127. See `artifacts/nextgen/motion23-before/benchmark.json` and `motion23-final/benchmark.json`.

The seed-1729 Breacher campaign cleared all six rooms through Armory with zero errors, zero defects and exit status 0. The receipt is `artifacts/nextgen/playtest/motion23-breacher/report.json`.

## MOTION25

The Breacher leads with his plate arm. Its painted face and three dark slots sit above and beside the weapon in the game view. The left wrist now reaches forward and out, then the forearm rolls about the elbow-to-wrist axis to bring the plate face toward the overhead camera. The same carry runs over idle, locomotion, brake, aim and recoil. The firing hand still follows the weapon. The HERO24 mount, skin, textures and portrait are the shipped assets.

| Family | Waiting at the edge of a fight | Exposed after its strike | Native recovery |
| --- | --- | --- | --- |
| Crawler | Skitters sideways, drops low and opens its jaws | Stays pitched over its forward claw | 280 ms |
| Stalker | Paces sideways while the two scythes weave in opposition | Carries a scythe beyond the front feet and tips onto one side | 650 ms |
| Brute | Half-steps forward, lowers its body and rolls the weapon shoulder | Folds its weight over the buried cleaver | 550 ms |
| Spitter | Shuffles sideways as the throat swells | Presents its flank with the mouth open | 420 ms |
| Carrier | Sways and draws in its rear sac | Sags sideways over the extended claw | 500 ms |

Each family has a 1.6-second waiting loop. The renderer offsets it by enemy ID. It selects the loop during approach using range, engagement, attack-slot ownership and pending attack. The exposed clip keeps the loaded limb in place while the trunk settles and releases in the final fifth of the native recovery. Native recovery progress also carries the existing elite duration adjustment. Comparing all 157 previously shipped enemy takes against the baseline found identical key times, values, channels and interpolation, including the Warden's charge and stun.

Each 250 ms feint samples the first third of the family's wind-up and returns to ready. The camera strips drive this input explicitly. The production renderer expects an optional normalized `feintProgress` on the enemy snapshot during a flagged feint. The MOTION25 base does not publish that field, so the two live crowd captures demonstrate waiting and ordinary attacks only.

The two matched galleries under `artifacts/nextgen/motion25-before/` and `motion25-after/` each contain 29 strips. The nine Breacher rows cover idle, four travel directions, stop-start, aim, shotgun and rifle. The four rows per creature cover waiting, feint, strike and recovery. The `camera/` strips retain the full room at 480×270 per cell. In `motion25-after/compare/`, the six pairs of `*-quarter.png` and `*-480.png` place the baseline on the left. The sampled brake and recoil frames show clear space between the plate face and barrel. The rear edge can merge with the yellow dome when the figure turns away.

In `artifacts/nextgen/motion25-live/`, the Swarm Junction snapshot contains 16 enemies eligible for waiting across all five families. The heavy Crew Checkpoint frames contain nine waiting Brutes and four waiting Spitters. At 480×270 the Breacher's plate is easy to pick out in the calm and Swarm Junction frames. Enemy overlap and the red warning sector conceal part of it in the heavy Crew Checkpoint frame. The Brute's roll and the Stalker's pace read more clearly in the pack than the Spitter's throat pulse.

Rebuild the motion-only GLBs and reproduce the strips from the repository root:

```sh
blender -b -t 4 --python-exit-code 1 -P tools/assets/m10-motion/enemy_actions.py -- --families=crawler,stalker,brute,spitter,carrier --clips=m10-waiting,m10-feint,m10-exposed
npm run build
node scripts/nextgen/m9-motion.mjs --collection=motion25 --subjects=marine,crawler,stalker,brute,spitter,carrier --steps=8 --out=artifacts/nextgen/motion25-after
npm run capture -- --label=motion25-crowds --scenarios=play25-ordered-crowd,play23-crowd,k10-calm-breacher:crew-checkpoint,k10-heavy-breacher:crew-checkpoint --burst=2
```

For the before strips, use the same collection with `--dist` pointing to a production build of `4ea56510`. The matched five-second High Crew Checkpoint CPU-submission benchmarks in `motion25-bench-before/` and `motion25-bench-final/` both recorded 141 draws, 153 programs and zero mid-fight compilations.

The clean install and production build passed. Both strip manifests report zero errors. The six-room Breacher playtest with seed 1729, fast stepping and a 180000 ms startup timeout cleared all six rooms with zero errors and zero recorded defects. Its report is `artifacts/nextgen/playtest/motion25-breacher/report.json`.

## MOTION28

The Brute shifts onto its supporting side and cocks the cleaver outside and above the shoulder shell. Its first punished recovery uses the native recovery-stagger receipt to start a 350 ms backward step and head toss. The Crawler loads low and spreads both front hooks along the deck. The Stalker draws one blade back and high. The Spitter retracts the neck and opens its mouth. The Carrier raises its forelimbs while its remaining legs brace the sac.

Brute, Stalker and Crawler IDs select between the existing waiting loop and a second, lower stance weighted to the opposite side. Each family's feint pulls the trunk back before resetting. The lane assignment lives in the enemy system. Several Stalkers can report pace simultaneously, so the snapshot also identifies which one owns the cut. That animal turns its chest toward its route, counterturns the neck, and holds a planted gait sample near the destination until travel or the native wind-up takes over. Plant duration depends on the route and when the attack slot opens.

Crawler, Stalker, Spitter and Carrier use eight-tick directional rifle clips (133 ms). The head and near limb kick along the shot direction, with the reaction added to the current movement or attack pose. A subsequent round can restart the flinch. The heavier shotgun clips keep their original timing. The Breacher presents the dark shoe and its forearm attachment in calm, aim, dash and ram. The plate shoulder rotates forward during the ram. The receiver obscures the lower edge of the shoe at full extension. The Crawler's claw spread and the Spitter's open mouth are easiest to see in the native frames. At 480 × 270 the Brute cleaver and Stalker blade remain the clearest loaded silhouettes.

The local review index is `artifacts/nextgen/motion28-proof/index.html`. Each pair shows final18 at left and MOTION28 at right. The final18 manifest identifies revision `8f708dec`. The baseline was rebuilt from that revision to capture the additional views. Room dressing and creature colours also differ between final18 and the MOTION28 integration base. The loaded room frames sample each family at 80–84% of its native wind-up. The isolated studies drive the production rig with explicit inputs. They show poses, while the room manifests record encounter phases and damage receipts.

The sheets `loaded`, `packs`, `impacts`, `calm` and `rigs` each have `-native.png` and `-480.png` views under the review index. The six family and marine `*-clips.png` sheets cover all 39 strip pairs. The individual pairs under `strips/` preserve the source pixels. The specimen inputs and capture setup for the in-room comparisons live alongside the index in `fixtures.mjs`. Neither meshes nor attack windows were rebuilt for these studies.

Rebuild the selected motion tracks and capture the strips from the repository root.

```sh
blender -b -t 4 --python-exit-code 1 -P tools/assets/m10-motion/enemy_actions.py -- --families=crawler,stalker,brute,spitter,carrier --clips=m10-windup,m10-feint,m10-waiting-low
blender -b -t 4 --python-exit-code 1 -P tools/assets/m10-motion/enemy_actions.py -- --families=stalker '--clips=m10-pace-*'
blender -b -t 4 --python-exit-code 1 -P tools/assets/m10-motion/enemy_actions.py -- --families=crawler,stalker,spitter,carrier '--clips=m10-hit-rifle-*'
blender -b -t 4 --python-exit-code 1 -P tools/assets/m10-motion/enemy_actions.py -- --families=brute --clips=m10-stagger
npm run build
node scripts/nextgen/m9-motion.mjs --collection=motion28 --subjects=marine,crawler,stalker,brute,spitter,carrier --steps=3 --out=artifacts/nextgen/motion28-strips
```

Both strip manifests contain 39 captures with zero errors. In each room comparison, the first rifle round dealt 16 damage to each of the four surviving targets. The Brute frame follows the native recovery-stagger receipt from shooting during exposed recovery. The Breacher combat still samples its tactical cast, which retains the painted side of the plate. The calm pair and the dash and ram strips show the dark shoe.

The production build passed. The fixed-resolution 300-tick Crew Checkpoint benchmark recorded 133 median, 141 p95 and 142 peak draws on final18, with 157 resident programs. MOTION28 recorded 134 median, 142 p95 and 143 peak draws, with 158 resident programs. Both recorded zero combat compiles. These are CPU-submission figures across two integration revisions. The local receipts are in `motion28-bench-before/benchmark.json` and `motion28-bench-now/benchmark.json` under the evidence root.

On seed 1729, Standard Arc cleared 12 rooms with zero errors and zero defects. The first Breacher campaign also cleared 12 rooms with zero errors. Its runner returned status 1 for a 6.53-second Diagnostic Gallery load during concurrent capture work. The reports are in `artifacts/nextgen/playtest/arc-1729/` and `artifacts/nextgen/playtest/breacher-1729/`.

The final-build Breacher repeat cleared all 12 rooms with zero errors, zero defects and exit status 0. Diagnostic Gallery loaded in 817 ms. Its receipt is `artifacts/nextgen/playtest/motion28-final-breacher/report.json`.

## MOTION29

The Brute keeps its pale brow and snout ahead of the folded chest through recovery. The exposed pose rolls the body over the buried cleaver while the head faces the marine. On the first rifle hit of that recovery, the backward step lifts and tips the head back. The forearm and blade use the same native wind-up clock as before. The shoulder moves forward and outward and the elbow lifts, leaving the wrist on the weapon side as the cleaver cocks for release.

The turn study holds the wind-up at 88% and projects both skinned ranks through the production camera. Before the change, the wrist-bound cleaver crossed the torso at 13 of 72 sampled facings for each rank. After the change, it cleared the torso at all 72 facings, sampled every five degrees. The smallest approximate separation at 1920×1080 was 4.4 pixels at 70° for the regular Brute and 30 pixels at 55° for the elite. A leg can still sit behind part of the blade. At quarter size the regular Brute's narrowest opening is about one pixel. The turn sheets show eight compass views for each rank. Copper marks the cleaver, dark grey the trunk and lighter grey the remaining silhouette.

The Carrier's legs and the adjoining lower body use a dark plum atlas cell. Its three magenta sac lobes retain their original cells and emission. The packed and plain Carrier models have identical decoded geometry to their respective baselines, including their low LOD. The 73-joint Carrier fingerprint is `a9960f8e864ca52c`. The 63-joint Brute/Warden fingerprint is `144d320c6cae75d7`. All recorded mesh heights matched the baseline.

Local comparisons are in `artifacts/nextgen/motion29/`, with integration revision `8f0211df` on the left. The `brute-detail.png` sheet shows the wind-up, base recovery clip, native exposed recovery and rifle stagger in Relay Racks. Ordinary Brutes select the exposed clip during native recovery, so the base recovery row explicitly selects its authored counterpart at the same simulation phase. The rifle row follows the native recovery-stagger receipt. The `carrier-detail.png` sheet shows the calm and crowd crops in Swarm Junction. The `brute-native.png`, `brute-480.png`, `carrier-native.png` and `carrier-480.png` sheets retain the whole room. The `turn-native.png` and `turn-480.png` sheets preserve native and quarter-size actor pixels.

The production build passed. Standard Breacher cleared ten rooms through Transmission Chamber on seed 1729, with zero runner errors, zero recorded defects and exit status 0. The campaign receipt is `artifacts/nextgen/playtest/motion29-breacher/report.json`.

The before and after Crew Checkpoint benchmarks each recorded 158 resident programs and zero combat shader compiles.

## MOTION36

The Brute now swings from the shoulder that carries its fist on the rebuilt mesh. The opposite knuckles support the load. The head drops as the fist goes through, and the fist stays ahead during exposed recovery. The Warden braces wide, compresses behind its prow, drives off the forelimbs and bunches at the wall. Its impact settles into the exposed slump over 100 ms of native stun. A legacy camera cutaway used to shrink the whole head when it covered the marine. Removing that cutaway kept the maw visible through impact and slump. The marine retains its occlusion outline.

The Carrier and Matron lift their front legs as the sac rears over their planted legs. A completed brood delivery drops the Matron forward. The Crawler raises its hindquarters and cocks the hooks. The Spitter pumps the abdomen and lowers its head along the firing line. Ordinary feints sample about half the loaded reach and return with a lateral offset. The Stalker retains its shipped motion bank.

The [local proof index](../../artifacts/nextgen/motion36/index.html) links each attack's colour strip, black silhouette and native room frames. The isolated strips sample waiting, ordinary feint and return where applicable, then 0%, 50% and 98% of warning, release and follow-through. Each pair has native and 480×270-equivalent actor pixels. The room frames use the production camera and native AI in Crew Checkpoint. Each family has a full-resolution warning-onset and release PNG. The Warden also has separate impact and slump frames. final19 uses the archived runtime and assets at `f4f54aa7`, so intervening creature remodels also appear in the comparisons.

| Attack | 480×270 silhouette and hold | In-room player cues |
|---|---|---|
| Brute swing | Round waiting stance, one fist outside the raised shoulder, then a long diagonal reach. The load holds and clears the rear leg at the sampled facing. | The skull, red sector and marine read through the swing. |
| Elite swing | The same three shapes read through the hold with the ground halo hidden. | The horns identify the elite when the planted fist covers the near shoulder. |
| Warden charge | Wide compressed brace holds, then the prow advances and the legs drive. Impact bunches the back before the head rolls into the slump. | The maw, charge lane and stun marker stay visible. The outlined marine overlaps the near shoulder in the slump. |
| Carrier melee | The half-lift feint returns short. The high sac and spread front legs hold through warning, then the body drops forward. | The sac remains readable. On contact the marine covers one front foot. |
| Matron melee | Low waiting body, tall held rear and broad forward drop are distinct. | The melee sector and the marine remain visible under the raised front legs. |
| Matron brood | The sac holds high from brood onset until delivery, then falls forward in one beat. | The pod sites remain visible. The load resembles the Matron's melee load in isolation. |
| Crawler bite | The low wait, raised rear with cocked hooks and short forward plunge separate. The rear holds through the warning. | In the frontal strike the marine covers much of the released Crawler. The sector still reads. |
| Spitter melee | The high abdomen and cocked forelimb hold, then the head and forelimb extend together. | The lime mark points down the sector. The frontal contact hides the far forelimb. |
| Spitter shot | Pumped warning holds along the firing line. Release is narrower and closer to the waiting outline than the melee lunge. | The lime mark, shot and target warning carry the direction at range. |
| Stalker thrust | The existing blade rise and horizontal thrust separate. The blade reaches full height late in the warning. | The thrust lane and the marine remain readable. |

The following are first observed ticks in milliseconds from the start of each staged encounter, rounded at 60 Hz. Columns give warning onset / strike or delivery / recovery or wall impact / first return to approach or end of stun. The ranged shot and brood have independent cooldowns. The fourth melee timestamp can include overlapping behaviour and does not measure authored clip duration.

| Attack | final19 (ms) | MOTION36 (ms) |
|---|---|---|
| Brute swing | 17 / 733 / 850 / 1167 | 17 / 733 / 850 / 1167 |
| Elite swing | 17 / 683 / 817 / 1083 | 17 / 683 / 817 / 1083 |
| Warden charge | 17 / 883 / 1300 / 2800 | 17 / 883 / 1300 / 2800 |
| Carrier melee | 17 / 683 / 800 / 1100 | 17 / 683 / 800 / 1100 |
| Matron melee | 17 / 650 / 767 / 2100 | 17 / 650 / 767 / 2100 |
| Matron brood | 1083 / 2100 | 1083 / 2100 |
| Crawler bite | 33 / 367 / 433 / 600 | 33 / 367 / 433 / 600 |
| Spitter melee | 17 / 417 / 517 / 750 | 17 / 417 / 517 / 750 |
| Spitter shot | 17 / 517 | 17 / 517 |
| Stalker thrust | 17 / 483 / 567 / 950 | 17 / 483 / 567 / 950 |

The first brood pod became visible at 2533 ms in both runs. The paired event records are in `artifacts/nextgen/motion36/native-{final19,now}/manifest.json`. The diff against FAMILY35 is empty for `src/game/`, `src/DepthGame.ts` and the Stalker bank. The pose changes use the existing simulation clocks and hit shapes.

The production build passed. Standard Cryo cleared ten rooms through Transmission Chamber on seed 1729 with fast stepping and a 180000 ms startup timeout. The runner exited 0 with zero errors and zero recorded defects. The [campaign receipt](../../artifacts/nextgen/playtest/motion36-final-cryo/report.json) includes the individual room loading holds.

The weakest poses are the Crawler's frontal contact, where it passes behind the marine, the Spitter's ranged release, whose outline quickly approaches waiting, and the Matron's brood load, whose high sac also signals melee. The native brood sites and the shot remain important for identifying those attacks.
