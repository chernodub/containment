# FX20 ability impacts

## Baseline

Frames 2–5 of the final11 Crew Checkpoint reference strips show the following.

- Flashfire outlines several bodies inside a bright sheet, then leaves isolated orange marks beside them.
- Napalm briefly outlines the victims in white, then the pool and damage numerals carry most of the hit.
- Meltdown leaves the nearest creatures upright with repeated flames beside their flanks.
- Overload illuminates several bodies along a broad violet streak before their individual contacts disappear.
- Overclock surrounds the marine with a fractured field while advancing creatures retain clear silhouettes.
- Railbreaker clears a lane, with damage numbers hanging between the displaced creatures and the fading strand.
- Cryo Nova frames the front rank with shards, then leaves the bodies largely visible above the receding wave.

The matched FX20 baseline uses Awakening Bay for the seven abilities and Communal Atrium for the four overlaps. The scenario fixes its own room. Frames 2–5 show the Flashfire victims through a solid cone. Napalm leaves most bodies on the far side of the bright landing splash. Meltdown's initial flare stays on the marine while the front rank advances. Overload lights several targets at once along one thick strand. Overclock leaves the approaching bodies outside the marine's fractured field. Railbreaker's numerals remain in the emptied lane as the surviving bodies move away. Cryo Nova catches the feet of the front rank before its ring passes.

## Changes

| Ability | Visible consequence | Source under src/render |
| --- | --- | --- |
| Flashfire | Several lobes take fire from the muzzle into different parts of the native fan. The hottest section starts at the weapon. Burn climbs from the near flank and brightens on a fresh Pyro target receipt. | abilities/pyro/index.ts, abilities/ElementKit.ts, abilities/EffectAtlas.ts, abilities/system/index.ts |
| Napalm Charge | Upright fires of different heights stand inside the fuel pool. Embers rise from individual pockets. The pool requests priority 3 firelight in the existing four-slot pool. | abilities/pyro/index.ts |
| Meltdown | Scattered rising flames travel with the aura, while the suit retains its shoulder vents and nearby burning creatures carry their own ignition. | abilities/pyro/index.ts, abilities/system/index.ts |
| Overload | The first joint contact flashes white. Later discharges follow the game's link order, spaced 95 ms apart. The brief airborne arcs retire before a long floor trail can accumulate. | abilities/arc/index.ts |
| Overclock | The marine keeps its fractured field. A shocked target gets a narrow violet and white filament along one limb, with a small flicker at the joint. | abilities/system/index.ts |
| Railbreaker | A target receipt follows the live actor or retained corpse into the landing. The existing recoil hook compresses the body, and a low dust ring expands across a short directional skid. | abilities/system/index.ts, motion/EnemyMotion.ts, DepthRenderer.ts |
| Cryo Nova and frozen deaths | Chill leaves a foot fringe. A frozen approaching creature holds a lifted stride, with faceted ice at its joints and grains falling to its feet. Delayed death fragments radiate from the frozen body's current world position. | abilities/system/index.ts, motion/AuthoredMotion.ts, AttackEffects.ts, DepthRenderer.ts |

The passes reuse the existing instance batches, atlas and light pool. Low uses fewer tongues, dust puffs and frost grains. Its body cues also work with dynamic lights disabled. The prepared flame material samples the existing atlas in its directed-flow branch. Preparation ownership is unchanged.

## Matched capture measurements

Both captures contain 67 verified 1920×1080 PNGs at seed 1729 on Apple M1 Pro / ANGLE Metal. The seven ability strips have five frames each. The four overlap strips have eight frames each. The following counts are renderer draw calls in the captured frames.

| Communal Atrium overlap | Before peak | After peak | Largest change at the same frame | After program inventory |
| --- | ---: | ---: | ---: | ---: |
| Breacher | 143 | 143 | 0 | 151 |
| Cryo | 135 | 135 | 0 | 151 |
| Pyro | 142 | 139 | −3 | 151 |
| Arc | 141 | 136 | 0 | 151 |

| Awakening Bay ability | Before peak | After peak | After program inventory |
| --- | ---: | ---: | ---: |
| Flashfire | 124 | 121 | 157 |
| Napalm Charge | 123 | 123 | 157 |
| Meltdown | 125 | 125 | 158 |
| Overload | 127 | 123 | 158 |
| Overclock | 124 | 124 | 158 |
| Railbreaker | 128 | 128 | 158 |
| Cryo Nova | 123 | 123 | 158 |

The seven V2 timeline probes counted zero combat shader creations. All four overlap inventories stayed flat across their eight frames. The pink-red warning edge and the shooter's white outline and red aim line remain readable through friendly effects at native size and 480×270. Pyro has the closest competition for attention when Flashfire and the Napalm landing flash coincide.

Local galleries are under `artifacts/nextgen/fx20-before/` and `artifacts/nextgen/fx20-after/`. The latter points to `fx20-after-final`, captured from renderer commit `427a51c8`. Each has a `manifest.json`, a full-size `index.html` and a `review/` directory with exact 480×270 reductions. The peak overlap frames are in `value14-overlap-<rig>-communal-atrium-01.png` through `-08.png`. Ability frames use `v2-<ability>-awakening-bay-01.png` through `-05.png`.

Whiteout provided the frozen-body check. Frames 6 and 7 in `artifacts/nextgen/fx20-frozen/v2-whiteout-awakening-bay-06.png` and `-07.png` each record five frozen enemies. The ice stays close to their limbs. The separate Armory pre-chill fixture produced no frozen target in its sampled frames.

## Live encounter costs

The full-kit Communal Atrium benchmark ran one 20-second trial per rig and tier, with a minimum of four simulated seconds. Each accepted all four native ability slots. The GPU was shared with other verification work. These measurements describe draw and program inventory.

| Rig | Low peak draws | High peak draws | Low / High resident programs | Combat program creations |
| --- | ---: | ---: | ---: | ---: |
| Breacher | 151 | 162 | 336 / 153 | 0 / 0 |
| Cryo | 156 | 165 | 336 / 154 | 0 / 0 |
| Pyro | 163 | 174 | 336 / 154 | 0 / 0 |
| Arc | 164 | 175 | 336 / 154 | 0 / 0 |

Full benchmark results are in `artifacts/nextgen/fx20-bench-full/benchmark.json`. An initial three-second probe advanced only 0.067 simulated seconds and missed three native slot receipts. Its incomplete run is excluded from the table.

## Remaining visual weaknesses

- Railbreaker's dust and skid are subtle at 480×270. The beam and damage numerals still draw the eye before the landing, especially when the victim travels toward the edge of the view.
- Napalm's initial splash still covers most of the pool. Its upright tongues read best after that flash fades, and the Awakening Bay spitters stand outside the brightest part of its firelight.

## Desktop campaigns

Pyro and Arc each cleared six rooms on seed 1729 in fast native-input mode with zero errors and zero reported defects. Each room's opening and closing program counts matched for both rigs. From Awakening Bay through Armory the counts were 161, 154, 149, 156, 155 and 155. The per-room records and screenshots are in `artifacts/nextgen/playtest/fx20-pyro/` and `artifacts/nextgen/playtest/fx20-arc/`. The final TypeScript and production build passed.

## Flashfire onset and coverage revision

The orange fan now appears at the full catalog range of 300 game units and angle of 1.22 radians on the native impact receipt. The white muzzle core and orange tips share the prepared flame batch. A single surface samples animated atlas tongues across the sector, so its center and both edges are submitted together. Short flames on the reported victims follow their displacement during the shove.

In `fx20-after2/v2-flashfire-awakening-bay-02.png`, all five 18-damage victims touch fire 16 simulation milliseconds after the instantaneous cast. The earlier FX20 capture still had the flame at the muzzle at that time. At +30 ms and +150 ms both victims on the left edge remain in flame. At +600 ms the jet has expired and the residual fire separates from the muzzle. The same sequence reads in the native 1920×1080 images and at 480×270.

The other onset checks used occupied targets. Napalm's splash appears when the canister lands, followed by the first three-target damage tick at simulation time 4.200 s in `fx20-after2-napalm-tick/ability-napalm-charge-awakening-bay-02.png`. Meltdown shows ignition at the feet of three brutes on the first damaging tick at 0.251 s in `fx20-after2-contact/gallery-overdrive-pyro-armory-01.png`. Overload's white first strike reaches the 60-damage victim while the other four targets show smaller contact sparks in `fx20-after2/v2-overload-awakening-bay-02.png`.

The revised gallery lives in `artifacts/nextgen/fx20-after2/` and contains 48 native PNGs covering all eight Pyro and Arc abilities plus the Pyro overlap. Its `review/flashfire-onset-comparison.png` shows frames 02–05 as 480×270 images, with the original baseline, first FX20 pass and revision in descending row order. Renderer commit `7d2dbede` also passed the production build.

Peak draws matched the preceding FX20 build in every scene. Flashfire peaked at 121 draws, Napalm at 123, Meltdown at 125, Afterburn at 124, Overload at 123, Overclock at 124, Static Step at 126 and Tesla Pylon at 126. Every Pyro overlap frame matched, peaking at 139 draws with 151 resident programs. The red warning sector and the shooter's aim line remain visible. The prior-build reference for Afterburn, Static Step and Tesla Pylon is in `fx20-after2-reference/`.

All eight ability timeline probes recorded zero combat shader creations. Flashfire held 157 programs, and the other seven abilities held 158. Napalm had 157 in the preceding FX20 capture and 158 in this one. The single-program difference was already present after the first room preparation (116 versus 117) and the original pre-FX20 Napalm capture also held 158. Overload's first frame used one fewer draw, and frames 02–05 matched the previous pass in every ability and the overlap.

The Pyro desktop campaign at seed 1729 cleared six rooms with zero errors and zero defects. Opening and closing program inventories matched within each fight. The report and screenshots are in `artifacts/nextgen/playtest/fx20-after2-final-pyro/`.
