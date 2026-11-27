# CREATURE18 handoff — a finished surface for the five creature families

## What was wrong (before, `artifacts/nextgen/c18-before/`)
Actor shading outputs roughly `albedo × 0.47 × two soft bands`, so a creature's on-screen value is its baked albedo.
The old bake mixed every zone with curvature wear, fbm grain, per-plate ±10 % variation and a heavy AO fold
(`(0.42+0.58·ao)^1.15`), which is the "smeared clay": no large value shapes survive two-band shading. From the
gameplay camera the dorsal shingles (dark shell) cover the mid flesh, so bodies sat in the floor's value band while the
pale bone blades (Brute wings, Stalker scythes, Crawler legs) were the brightest plane. Stalker shingles were a pale
grey-mauve "armor" that read as grey clay. Hits mixed the albedo 35 % toward white before lighting and the
corpse/acid dissolve discarded a 1.5 cm hash grid, which produced a translucent grey wash on hit and a speckled grey
smear on death. The fix needed both the bake (values) and the runtime shader (blade plane, hit, death).

## What changed
**Bake (`tools/assets/k11-creatures/build.py`)** — when a caste defines `BANDS`, `colorize_bands` paints flat
zones: `chitin` (shell/under/armor/crest/claw), `flesh` (membrane/flesh/sinew), `bone` (matte blade plane),
`accent` (organ, plus `eye`). Only a ±6 % plate step, a 22 % convex edge lift on chitin, a 22 % crease darkening,
no grain/blotch noise and a light AO fold (`0.74+0.26·ao`). Per caste `BAND_MAP` remaps zones to bands and
`PLATE_BAND` pins chosen plates. Elite parts (`*-elite` sculptures) paint every hard zone gold `(0.70,0.50,0.14)`;
those parts are geometry (horn, crest spines, blade, dorsal plates), so the rank changes the silhouette.

| Family | Dark | Mid mass (what the camera sees) | Accent | Notes |
|---|---|---|---|---|
| Crawler | legs, hooks, leg blades, shell | rust body + tan head shield and dorsal abdomen plates (40, 70–75) | red lantern | bone legs → chitin |
| Stalker | membrane gaps, shell | mauve shingles (armor → flesh) | violet lantern/eyes | scythes cool grey 0.20 |
| Spitter | chitin | olive shell + body | acid lantern, `GLOW_STRENGTH` 1.3 → 0.9 | pale mortar mouth kept (aiming face) |
| Brute | membrane/sinew gaps | ochre shingles and crest plates | ochre lantern | blades 0.17–0.20 cool grey (old bone 0.72 at rest ×0.5) |
| Carrier | chitin | plum thorax shingles + sac | magenta lantern | shield/claws 0.24 |

**Runtime (`src/render/vfx/ActorSurface.ts`, alien key `actor-surface-v13-creature18:alien`)**
- Blade plane is now detected by low chroma and mid value (not warm hue); at rest it is the authored value, a loaded
  strike lifts it ×1.55 (still below the marine plates) and its rim is cut 60 % so thin blades stop rim-glowing.
- Hit: a flat card while `actorFlash > .08` (≈ 50–100 ms): lit diffuse ×0.15 and emission → flat `(.54,.50,.45)`.
  Silhouette, ink and pose stay; no translucent wash. Marine hit flash unchanged.
- Death/dissolve: a rest-pose top-down wipe with a 3 % emissive edge instead of hash holes. `models.ts` now gives
  every creature its rest bounds (previously only the Queen).
**Crowd variety (`src/render/models.ts`)** — `setMotionSeed(id)` sets a hashed visual scale 0.94–1.06 applied to the
asset root in `fitFootprint` (non-rank only; `span`, colliders, reach and the simulation are untouched) and a loop rate
0.94–1.06 on idle/locomotion on top of the existing golden-ratio phase. Deterministic, no `Math.random()`.

## Rebuild
```sh
for c in crawler spitter stalker brute carrier; do blender -b --factory-startup -P tools/assets/k11-creatures/build.py -- --caste=$c; done   # ~1–2 min each
TOKTX=<KTX-Software 4.4.2 toktx> sh tools/assets/k11-creatures/boss14/ship.sh   # restores marine/weapons itself
git checkout -- <creature GLBs you did not rebuild>   # optimize.mjs repacks every creature file
npm run build
```
(toktx was found at `…/t3-b65322f4/artifacts/nextgen/marine17/tools/ktx/…/toktx`; `/tmp/t12-ktx` no longer exists.)

## Evidence (all under `artifacts/nextgen/`, gitignored)
- Before: `c18-before/` (three crowds), `c18-before2/` (`value14-overlap-pyro`, `value14-{brute,stalker,crawler}-attack-*`,
  rendered from a frozen HEAD build), `c18-motion-before/` (m9 strips: brute/crawler `weapon-kill-shotgun`,
  `weapon-hit-rifle`, `death-acid`).
- After: `c18-final/` (same seven scenarios), `c18-final2/` (swarm crowd + crawler attack after the last Crawler
  change), `c18-motion-after/`. Intermediate: `c18-after`, `c18-after2`, `c18-after3`.
- Playtest: `playtest/c18-playtest/` — breacher, seed 1729, 4 rooms cleared, 0 errors.

## Measured
- Draw calls identical in every scenario (crowds 122/124, 96, 81; overlap-pyro 133–142; attacks 103/77/63).
- Shipped triangle counts unchanged per caste (base 7.6k/8.8k/9.5k/11.5k/11.0k; geometry is deterministic).
  Single-creature attack scenes have identical triangle totals; the crowds draw +6.6k triangles (+2.1 %), which
  comes from more instances picking the high LOD once the ±6 % scale jitter is applied.
- No combat compiles: program count is constant within each playtest room from start through mid-fight to clear
  (159/152/147/154); materials are unchanged, so `MaterialWarmup` prepares the bumped key on the same path.

## Still weak
1. **Crawler at 480×270**: curled/braced Crawlers still read as dark pills with a red slit, and the spider pose
   shows only a small tan patch. Its top view is mostly legs; a bigger tan dorsal shape (geometry) or a
   Crawler-only lighter chitin is the next step.
2. **Stalker** still reads as a dark steel-blue mass in play (camouflage and the cool rim dominate); its mauve
   shingles show only up close.
3. Brute ochre plates carry some AO mottling up close; the Carrier's magenta accent is smaller than the old crest.
4. The flat hit card and death wipe were checked in m9 strips, which render without the room ink pass. Check them
   in a live room.

## Title illustration
`tools/assets/u10-keyart/title14.py` imports `public/assets/models/plain/{tyrant,dretch}.glb` and feeds their
base-colour and emission images into its own toon material at fixed positions. Re-running it
(`blender -b -P tools/assets/u10-keyart/title14.py`, then `npm run studio` for the plates) would pick up the new
band albedo with the same composition, poses and lights. Two things to check first: its crawlers override the
lantern to pink `(1,.22,.62)`, and its `bands=(.08,.30,.9)` toon ramp was tuned for the old darker albedo, so the
Brute may come out lighter than intended. I did not re-render the title.

## Follow-up (CREATURE18b)
- **Crawler:** the earlier `PLATE_BAND` targeted plates 70–75, which are the elite fins, so regular Crawlers never
  got their tan back. Now the abdomen shingles sit closer to the dorsal line (`phis` 0.98/1.62 → 0.80/1.45, plates
  0.215×0.22 → 0.25×0.26). They are painted tan `(0.58,0.46,0.32)` together with the tail cap (20), thorax
  shingles (30–31) and head shield (40), so they form one tan cap around the red lantern slit. The budget is unchanged
  (7,600 base; LOD 6,884) and so is the fit scale. On Swarm Junction at 480×270, curled Crawlers read as mid-grey pills
  with a red slit and walking ones show a tan back in greyscale.
- **Stalker:** from the game camera most of the "steel-blue mass" is its two serrated scythes held over the body, not
  the body itself. The scythes rise one value step and stay cool grey (0.20 → `(0.28,0.28,0.33)`). The membrane body
  returns to the mauve band and the chitin lifts slightly. It remains darker than the Brute's ochre in greyscale. The
  lantern stays the family's violet `0x9570ff`, not red, to keep the learned accent.
- **Hit card in a live room** (`c18b-burst*`, `value14-overlap-pyro`, `--burst=8 --step-ms=33`): the 0.08 threshold
  also fired on the 0.22 elemental-hold flash cap, which turned whole burning or shocked groups into pale
  silhouettes. The card now fires above 0.25 only, and it is an additive mid lift (diffuse ×0.45 + 0.2 flat), so
  lanterns and family colour stay. The cluster's 90th-percentile luminance dropped from 170 to 145, against 173 on
  the marine. The ink outline holds through the card. The death-wipe edge glow is cut to 35 % on creatures. Alien key:
  `actor-surface-v14-creature18b`.
- **Measured:** draw calls are unchanged (81/124/96/137). Triangles are −420 to −504 per crowd frame. Program counts
  are constant within each playtest room. Breacher seed 1729, 4 rooms: 0 errors (`playtest/c18b-playtest`).
  Captures: `c18b-final`, `c18b-burst`, `c18b-burst3`, `c18b-motion`.
- **Pipeline caution:** `ship.sh` repacks every creature file. Restore the ones you did not rebuild from git, and do
  not restore a file you just rebuilt (its source export is overwritten by the packed file).
- **Still weak:** the Stalker is still a mostly blade-coloured cool shape from above, so the mauve body shows mainly
  between the scythes. The death wipe was checked only in m9 strips (corpse fades start 18 s after death, outside the
  capture windows).

## CREATURE19 — anatomy
Base `4d3e6ab3`. All changes are sculpture geometry and bands in `tools/assets/k11-creatures/`, plus one presentation
line in `models.ts`. Per-caste triangle targets are unchanged (base 7.6k/8.8k/9.5k/11.5k/11.0k, Warden 19.9k,
Matron 21.0k), and colliders, reach and simulation are untouched.

- **Brute** (`brute.py`): the head hangs forward and low (`HO` offset) out of a narrow dark neck, with a dark collar
  ring and an underslung dark jaw plate. Its head plate is a light `lead` band, the lightest body plane. The hump
  shingles and the dorsal row of hind shingles are now dark armour, and three angular dark `dorsal_blades` with
  raised trailing spikes sit on top. The striking (right) arm is ×1.36 against 0.9, with a dark elbow spur.
- **Stalker:** the thorax shingles and an enlarged head plate are in a light `lead` band. The right scythe is ×1.3 as
  the striking one, and the slim off scythe angles away; tips are pulled in so the fit scale rises (0.237 → 0.243).
- **Crawler:** the head shield is in the light `lead` band, the tail cap is dark, and the raptor blade tips are splayed
  forward and outward. Forefoot separation is in the sculpture only; no motion clip or timing was changed.
- **Elites** (`species.rank_fins`, heights in design z × aspect): elite/regular height is now +75 % (Crawler),
  +28 % (Stalker), +33 % (Spitter), +28 % (Brute, gold crest fan beside the horn) and +27 % (Carrier, raked crest
  over the shield). An earlier pass sized fins without the aspect and they were invisible; keep the `× a`.
- **Warden:** a large forward helm, low dark pauldrons, and the horn crown in the `lead` band. `fitFootprint` draws
  the Warden ×0.86 in height (low stance, presentation only).
- **Matron pods:** not done. Budget went to the four families and the Warden; the swelling and opening outlines
  are unchanged.

Evidence: `artifacts/nextgen/c19-before{,-pairs,-bosses}` (frozen pre-change dist) vs `c19-final{,-pairs,-bosses}`.
The elite-pair wrapper is `artifacts/nextgen/c19tools/cap.mjs` (final11 fixture, gitignored). Draw calls are identical
in all 13 compared scenes; triangles are identical, or −30 in crowds. Breacher seed 1729, 4 rooms: 0 errors, program
counts flat per room (`playtest/c19-playtest`).

Pipeline: rebuilding a subset overwrites the other creature GLBs through `ship.sh`. Copy the other packed files
aside and back rather than `git checkout`, which reverts uncommitted fresh builds. Never run `lod.mjs` alone.

Still weak:
1. The Brute's chest front is still a stack of rounded tan shingles when it faces the camera. The armour reads from
   behind and the side. A harder chest needs the shingles replaced by fewer, larger angular plates (sdf `Plate` is a
   dome lens; an angular plate primitive would help every family).
2. The Stalker's light leading plane and the Crawler's forefoot separation are small at 480×270. The real fix is
   the wind-up key poses in `tools/assets/m10-motion/`, which this pass did not touch.
3. The Warden's helm and pauldrons help from behind, but at 2.3× it still reads as a big Brute from above.

## CREATURE20 — angular plates
Base `8e08fc3f` (after FEEL19). Motion clips, pods, rigs, bone names, colliders and timings are untouched.

- **Kit:** `sdf.AnglePlate(c, R, length, width, thick, keel, rake, taper, lift)` is a convex faceted plate (max of
  planes): a flat underside, two keel facets, a front taper, side edges meeting in a sharp trailing point, a wedge
  facet thinning to that edge, and an optional lifted back edge. The test render is
  `blender -b --factory-startup -P tools/assets/k11-creatures/plate_test.py` → `artifacts/nextgen/c20-kit/plates.png`
  (dome `Plate` beside three angular variants).
- **Brute:**
  - The chest dome shingles are gone. Two pairs of large angular pectoral plates in a dark umber `plate` band
    (0.30,0.16,0.09) sit around a keeled ochre sternum, over an ochre chest mass.
  - The brow is angular, the jaw plate's trailing point juts forward, and the upper arms and forearms are umber with
    angular plates and pauldrons.
  - The dark hump and dorsal blades from CREATURE19 are kept.
  - Facing the marine (elite-pair frame), the front reads as umber armour over ochre, where before it was tan lumps.
    From behind and in the wind-up it keeps the dark armoured back.
- **Warden** (boss part, 19,900 triangles, unchanged): a broad forward-swept dark helm, a split crown of two raked
  plates in the light `lead` band, a heavy umber jaw projecting forward, and angular pauldrons. In the Relay Racks charge
  wind-up the pale V crown marks the head end at 480×270; in the wall stun the helm and crown are present but
  overlapped by the marine.
- **Matron** (21,000 triangles, unchanged): a dark angular thorax cuirass, a narrow dark neck, a larger head with a dark
  crested carapace, a pale `lead` face plate and magenta eyes, and five rows of dark dorsal segment plates (`plate`
  0.11,0.05,0.09) banding the plum abdomen. Her sac now reads segmented in greyscale. The magenta accent stays on the
  vents and pods.

Evidence: `artifacts/nextgen/c20-before{,-pairs,-bosses}` (frozen `8e08fc3f` dist) vs `c20-final{,-pairs,-bosses}`.
Bosses were captured with `i13-native.mjs --rooms=crew-checkpoint,relay-racks --cases=warden,matron`: 4 cases, 0 errors,
program counters flat through every case and identical to before (0/20/36/52). Draws and triangles are identical in the
crowds, the Brute attack and both elite pairs; the Carrier pair's one-draw difference reproduced at 81 on both builds.
Breacher seed 1729, 4 rooms: 0 errors, programs flat per room (`playtest/c20-playtest`).

Pipeline note: when only some castes change and the rest are committed, `git checkout` of the untouched GLBs after
`ship.sh` is safe. Pass `--dist` and `--dist-source-sha` as separate arguments; a shell variable holding both breaks
in zsh.

Still weak:
1. From the game camera the Matron's thorax and new head sit under the flat orange brood clutch (FEEL19's pod). Her face
   end only shows past the clutch, so "a distinct head" is true in the model but small in play. Moving the clutch or
   lifting the head is a FEEL19/pod decision.
2. Only the chest, arms and bosses use `AnglePlate`. The Brute's hind flanks and the other families still use
   rounded `Plate` shingles, so the Brute's back half and the Stalker/Spitter shells keep the softer domed look.

## CREATURE21 — faces, angular shells, rim, readable elites
Base `064f0acd`. Rigs, bone names, clips, FEEL19 poses and pods, colliders and timings are unchanged. Per-caste
triangle targets are unchanged.

- **Faces:**
  - Brute: the jaw plate (55) is larger and in the light `lead` band, and the brow (50) is now umber, so the jaw is
    the light face plane, with a stronger contour than the slate blade.
  - Warden: its jaw (329) is in the `lead` band, and two ochre eyes glow on the helm front. The head reads in the
    charge wind-up by its eyes; in the wall slump the head drops and the eyes hide.
  - Stalker: a dark neck (`plate=500` → chitin) and a pale forward snout plate (31).
  - Carrier: a dark neck and a pale forward face plate (400).
  - Matron: her head is raised and pushed forward to `z(7.2, 0, 10.6)` with a long dark neck, a larger pale face and
    bigger magenta eyes. From above, a pale face with a glowing eye now shows at the front of the thorax. The orange
    disc seen in brood frames is the brood telegraph, not the clutch; the pods were not touched, and the pod stages
    still split and open (`c21-final-bosses/*pod-opening*`).
- **Angular shells:** `species.shingles(..., angular=True)` emits `AnglePlate` shingles. They are used on the Stalker
  (torso and abdomen), Crawler (abdomen and thorax), Spitter (trunk) and the Brute's hind flanks. The leading plates
  keep their `lead` bands.
- **Rim** (`ActorSurface`, alien key `actor-surface-v15-creature21`): the creature rim is broader (exponent 3.0),
  0.10 stronger and cooler (85 % toward `(.55,.78,1.0)`). The marine is unchanged. Programs are identical in number,
  and warm-up prepares the new key.
- **Elites:**
  - Paler rank gold (0.90,0.76,0.42), and emissive seams on rank-part creases (lit in the family lantern hue at
    runtime).
  - Crests are about 20–25 % taller. Vertical fins read edge-on from this camera, so the decisive change is
    `species.rank_mantle`: one broad pale faceted plate over each elite's back. The Spitter gets two flank mantles
    beside its lime gland instead, and the Stalker one on the abdomen and one on the thorax.
  - At 480×270 the Carrier, Brute, Crawler and Stalker elites now show a pale back in colour and greyscale. The
    Spitter's flank mantles are faint.

Evidence: `artifacts/nextgen/c21-before{,-pairs}` (frozen `064f0acd` dist) vs `c21-final{,-pairs}`, `c21-final-pairs2`
(Stalker/Spitter after the mantle pass) and `c21-final-bosses`. The `c21-before-bosses` run rendered black (captured
while Blender saturated the machine), so the boss before is `c20-final-bosses`, captured from the same assets.

Measured:
- Draw calls are identical in the crowds, all five attacks and the elite pairs. The Stalker pair's 80 → 81 is the
  same one-draw capture variance seen in CREATURE20.
- Crowd triangles fell by 7,958 because every creature file now ships a low LOD sibling.
- Boss program counters are flat and identical (0/20/36/52).
- Breacher seed 1729, 4 rooms: 0 errors, programs flat per room (`playtest/c21-playtest`).

Still weak:
1. The Warden's head disappears in the wall slump: the FEEL19 pose drops it under the helm and pauldrons, so
   the eyes hide. A brighter crown edge or eyes on the helm top would carry it.
2. The Spitter elite's pale flank mantles are faint at 480×270. It still reads mostly by its taller gland and size.
   Amber-floor rooms (Freight Hold, Residential Gallery) were not captured in this pass, so the rim on warm floors
   was judged only on Crew Checkpoint and Relay Racks.

## CREATURE22 — attack poses, Matron carapace
Base `0b97db74`. Clip durations and key frames, bone names, colliders, reach and simulation are unchanged.

- **Poses** (`tools/assets/m10-motion/enemy_actions.py`, wind-ups re-authored with
  `blender -b -P tools/assets/m10-motion/enemy_actions.py -- --families=crawler,stalker,brute --clips=m10-windup`):
  - Stalker: the neck and head thrust forward 0.30 W; the loaded scythe's shoulder rolls out (0.80) and its wrist is
    drawn back and wide (1.38 W out, lower), opening a dark gap to the torso. The off wrist stays braced forward and low.
  - Crawler: the striking foreleg is drawn wide (1.2 W) and back instead of high over the head; the head moves forward.
  - Brute (also the Warden's charge wind-up, which samples the same clip by anticipation): the cleaver loads wide and
    high (1.25 W out, 0.82 H up) with a gap under the arm; the head pitches down and forward. In the isolated strips
    (`c22-final-motion2/*-attack.png`) the cleaver ends the load out to the side, clear of the crown.
  - Wall stun (`--clips=m10-wall-stun`): the helm rests forward with less head drop, so the pale crown plates show from
    above.
  - Matron pod release: a new Carrier clip `m10-brood` (0.6 s: arched abdomen, lowered head, braced legs), sampled in
    `models.ts` while her brood timer runs (presentation only).
- **Matron mesh** (21,000 triangles): the sac skin is dark carapace, seven rows of segment plates sit clear of the
  lumpy mass across the top and flanks, and the egg bulges are glowing sacs between them. From above it reads as a
  dark ribbed abdomen with pink lights, not a pink cone. The FEEL19 pod stages still play
  (`c22-final-matron/*pod-opening*`).
- **Spitter elite:** flank mantles 1.15×. Still faint at 480×270.
- **Brute death:** in the live boss room with ink on (`c22-final-bosses/*warden*-death.png`), the body falls as an
  opaque shape with its limbs spread. The "pale smear" came from the isolated m9 strip, which renders without room
  ink. No death change was needed.

Evidence: `c22-before{,-pairs,-bosses,-matron,-motion}` (frozen `0b97db74` dist) vs
`c22-final{,-pairs,-warden,-matron,-motion,-motion2}`. Run `i13-native.mjs` with one boss per invocation: with both
cases in one run, the Matron frames came out as identical black 44 KB images on both builds.

Measured:
- Draws and triangles are identical in all three crowds and all five attacks. Three elite pairs show the recurring
  80 → 81 draw, +2 triangle capture variance (reproduced at 81 on both builds in CREATURE20).
- Per-caste triangle targets are unchanged.
- Boss program counters are flat per case.
- Breacher seed 1729, 4 rooms: 0 errors, programs flat per room (161/154/149/156).

Still weak:
1. The pose changes are real in the clip strips but modest in the shipped fixtures. The mixed Relay crowd fixture
   holds its creatures in approach, not wind-up, so its frame cannot show whether the attacking end reads. The
   Warden's captured charge frame is early in the anticipation, so it looks like before. The next pass needs a crowd
   fixture with several creatures mid-wind-up, and larger key changes on the Stalker blade's own roll axis (the IK
   moves the wrist, while the blade still points up).
2. The Spitter elite remains faint at 480×270. Its lime gland dominates the silhouette, and the pale flank mantles sit
   below it.

## CREATURE23 — direction in the loaded pose, value cap, flat bakes
Base `1d943a1f`. Clip durations and event timing, bone names, colliders, reach and simulation are unchanged.
Triangle targets are unchanged.

- **Loaded poses** (`enemy_actions.py`; all five wind-ups re-authored, plus the Brute's `m10-wall-stun` and the
  Carrier's `m10-brood`): the leading element now projects forward and low toward the victim, with a deck gap behind
  it, instead of rising over the body. On screen, height reads as "up", not "at me".
  - Brute: the cleaver loads beside the jaw. Body yaw during the load is cut to 35 %, the edge roll toward the camera
    to 35 %, and the cleaver tip pitches forward.
  - Stalker: the scythe tip is ahead of the head, slightly wide and low.
  - Crawler: the hook is beside the jaw, low.
  - Carrier: the hooked limb comes forward.
  - Spitter: no turn-away yaw, and the neck thrusts forward.
  - Wall slump: the crown tips up above the shoulder line.
  - Matron: `m10-brood` lifts the carapace further. Since `12e00c7f` it is held at 0.6 for the whole brood window.
- **Value cap** (`ActorSurface`, alien key `v16`): the creature's lit, non-emissive output is capped at luma 0.24
  in `opaque_fragment`. Lanterns, rim and the hit card are exempt. The marine's cool back-rim rises 0.045 → 0.085
  (a uniform; no new program).
- **Bakes** (`build.py` band painter): no per-plate value step, convex edge lift 0.22 → 0.12, crease darkening
  0.22 → 0.10, AO fold 0.74 + 0.26·ao → 0.88 + 0.12·ao, and a darker Crawler tan.
- **"Mottled texture" claim:** confirmed at native size in a live room before acting. The Brute showed alternating
  small dark and ochre lumps with pale specks, from the bake's per-plate steps, edge lifts and crease darkening across
  many small plates, and it survived to the screen. It was not only a reduction artefact. The flattened bakes read
  more evenly at native size. At 480×270 the families still separate mostly by hue, because the shapes are small.

Evidence: `artifacts/nextgen/c23tools/cap.mjs` reproduces the final14 `windups/` fixtures (`loaded-<family>` and
`loaded-crowd-<room>`). Captures: `c23-before-windups` vs `c23-final-windups` (and `c23-final-brute`), `c23-before`
vs `c23-final` (standard crowds), and `c23-before-{warden,matron}` vs `c23-final2-{warden,matron}` (one boss per
run). Playtest: `playtest/c23-playtest-final`.

Measured:
- Draw calls are identical in every compared frame: crowds 122–125/97/83, loaded families 75–78, loaded crowds
  125/83.
- Crowd triangles −2,998, with family loaded frames identical.
- Boss program counters are flat and identical (0/17).
- Breacher seed 1729, 4 rooms: 0 errors, programs flat per room (163/156/151/158).

What reads now: in the single-family loaded frames, the Crawler's jaw and body point at the marine, the Carrier's
hooked limb angles at him instead of straight up, the Brute's cleaver points forward and down from the shoulder
instead of standing over its head as a sail, and the Stalker's scythe lies flatter toward the victim. In the
reproduced wind-up crowds at 480×270 the change is barely visible.

Still weak:
1. The crowd reductions: at 480×270 with several creatures loaded, direction is still carried mostly by the red
   warning. Individual loads point the right way, but limbs are 3–6 px. A stronger cue needs either a larger leading
   element or a runtime lean (body translation toward the victim) during the late wind-up.
2. The value cap did not measurably lower the Crawler pressed against the marine (luma 175–180 against the marine's
   178–185 in both builds). Its brightness comes from paths the cap leaves alone (rim, hit card, emissive) or the cap
   is applied before GraphicSurface's band pass. The marine remains the brightest shape overall, but this case needs
   a per-pixel probe. The Matron's brood arch also barely shows: the `tail` rotation axis may not be the pitch axis,
   so check `m10-brood` in the m9 strip.

## WARDEN25 — the Warden is a boss, not a big Brute
Base `4ea56510`. Sim collider, charge reach, damage, the wall-impact rule and `BOSS_BODIES` are unchanged.

**Before** (item 1, `artifacts/nextgen/warden25-before{,-trio,-relay}`): from the game camera the Brute, the elite Brute
and the Warden measured 1.98 / 2.84 / 3.07 m wide and 2.76 / 3.38 / 3.45 m tall. They read as one animal at three
sizes because they were one sculpture: the Warden was the Brute body plus a horn crown and a ram, so the four pillar
legs, symmetric shoulders, chest hump and hooked cleaver were identical. The Warden was only 8% wider than the elite.
In 480×270 silhouette the two were the same blob with a spiky tuft, and the boss showed only through its ring and the
stun icon.

**Model** (`tools/assets/k11-creatures/warden.py`; `brute.py` now sets `RANK_PARTS = {"boss": ["boss"]}` and
`TRIS["boss"] = 19900`): one whole sculpture on the shared `tyrant` rig.
- Right (leading) side: one enormous ram shoulder in the darkest band, with two stacked angular carapace plates, an
  outer flank plate and a slate ribbed ram face (still the `warden-ram` emission region) driven past the head.
- Left (trailing) side: a small low shoulder over a bare ochre flank, strapped with dark sinew, with the amber lantern
  down its back.
- Head: carried low, offset left and behind the ram, under a pale split crown (plates 450/451, `lead` band).
- Stance: a braced club forefoot under the ram, heavy splayed hind legs, and a short armoured counterweight tail club.
- Rigging: the ram, carapace and flank armour ride `chest`, so the shared Brute arm clips cannot swing them. The
  tyrant forearms rise toward the head, so both arms ignore that line and plant forward and down; only the binding
  is shared.
- Plates 400–403 map to `chitin`, 404–429 to `plate`, and 450–451 to `lead`.
- Atlas: the Warden part now covers a whole body in the shared 2048 atlas, so the Brute's texel share is smaller
  (bakes are flat bands since CREATURE23).

**Scale** (rank scale 2.3 → 3.8, drawn only):
- Trio frame, footprint: 3.07 × 2.49 m → 4.49 × 3.65 m (1.46×).
- Trio frame, height: 3.45 → 4.41 m.
- i13 idle radial: 1.88 → 2.99 m.
- i13 height: 3.45 → 4.48 m (calm), 3.59 → 3.99 m (wall stun).
- Collider: stays 64 units (2.0 m). `warden25/collider.mjs` measured standable area at radius 64/80/96 across all 20
  story rooms:
  - At 96 (1.5×), area drops about 45% on average and 72% in passenger-vault (352 → 97 cells).
  - At 80, it still drops 25%.
- So the drawn body overhangs the collider by about 1.0 m radius, mostly the counterweight tail. The ram front sits
  near the collider edge, so at the wall-impact stop it rests on, or slightly into, the wall.
- Balance simulator / model heights: the rest-pose build estimate (`stats.json` `boss_estimate.height_m`) goes from
  4.06 to 5.56 m. The in-game bounding height goes from 3.45 to 4.48 m (the runtime squash ×0.86 applies).

**Motion** (`tools/assets/m10-motion/enemy_actions.py`, Brute rig, presentation only):
- `m10-ram-load` (1.0 s): the charge wind-up, sampled by anticipation in `models.ts` for `champion==='warden'`. The
  body coils low with the nose down, yawed so the right ram shoulder leads and rolled onto it. The hind feet set back
  and the left one scrapes twice; the club forefoot braces.
- `m10-ram-charge` (0.5 s): the run cycle with the same ram lean, held while `chargeMs > 0`.
- `m10-wall-stun` (used only by the Warden): slumped onto the ram shoulder into the wall, with the bare left flank
  rolled up toward the room and the head turned away from the wall, crown up.
- Rebuild:
  `blender -b -P tools/assets/m10-motion/enemy_actions.py -- --families=brute --clips=m10-ram-load,m10-ram-charge,m10-wall-stun`

**Rebuild trap:** `boss14/ship.sh` failed in `lod.mjs` (`RangeError: Invalid typed array length`) because
`optimize.mjs` had repacked the other creature files, which already carry LODs. Restore the untouched creatures before
`lod.mjs`, not after:
```sh
R() { for n in dretch basilisk marauder dragoon marine pistol rifle shotgun plasma rocket; do git checkout -- public/assets/models/$n.glb public/assets/models/plain/$n.glb; done; }
node tools/assets/i11-models/optimize.mjs && R && TOKTX=<toktx> node tools/assets/t12-textures/pack.mjs && R && node tools/assets/i11-models/lod.mjs && R
```

**Tools:**
- `warden25/trio.mjs`: Brute, elite Brute and Warden from the game camera. It writes colour, greyscale and silhouette
  at 1920×1080 and 480×270, plus sizes, draws and triangles.
- `warden25/preview.py`: a quick band-coloured Blender shape preview, with no bake.
- `warden25/collider.mjs`: the room area and lane table.

**Evidence** (`artifacts/nextgen/`):
- `warden25-{before,after}`: crew-checkpoint.
- `warden25-{before,after}-relay`: relay-racks.
- `warden25-before-trio` vs `warden25-final-trio`: both rooms.
- `warden25-k11`: build renders and stats.
- `playtest/breacher-1729`.

**Measured:**
- Warden triangles: 19,900 before and after.
- Trio frames:
  - Crew-checkpoint: 80 → 79 draws, 175,482 → 175,326 triangles.
  - Relay-racks: 98 → 99 draws, 189,196 → 189,208 triangles (the known ±1 draw capture variance).
- i13 boss cases, one boss per invocation: all phases seen in both rooms (wind-up, charge, wall stun, recovery,
  death), 0 errors, program counters flat at 0.
- Breacher seed 1729, 7 rooms, `--fast`: 0 errors, 0 defects, programs flat per room (165/158/155/161/161/160/160).
  The Warden met in the armory (room 6) reached a wall and stunned there (`wallStunAngle` in the mid snapshot).

**What it looks like now:**
- From above, it is a heavy lopsided hulk about half again the elite's size: a dark angular hull and slate ram on one
  shoulder, a bare ochre flank on the other, and a club tail behind.
- Mid-charge, the raised ram shoulder leads the body.
- In the 480×270 silhouette, the elite is a spiky X of blades while the Warden is a broad mass with a blunt ram knob on
  one side and the tail club on the other.

**Still weak:**
1. Seen head-on (it faces the marine most of the time), the outline is broad rather than lopsided. The ram reads as a
   knob on one shoulder, and the dark carapace dominates the top. In the relay-racks stun the dark carapace still
   covers most of the top view, so the ochre flank and crown show only along its edge. The roll in `m10-wall-stun`
   (0.30) may need to be larger, or the dorsal plate 400 smaller.
2. The drawn body overhangs the 2.0 m collider by about 1 m. The marine can stand inside the Warden's visual edge
   (visible in the relay stun frame), and the tail clips into walls behind it. A collider of about 72 units is the
   largest worth trying before passenger-vault and communal-atrium lose too much floor.

## CREATURE26 — heavies read as lit, built animals from the game camera
Base `b74bfa28`. Simulation, colliders, reach, skeleton, bone names, joint rest positions, motion clips and the five
other families' models are unchanged. Evidence is local under `artifacts/nextgen/creature26/` (not committed).

**Diagnosis, tested.**
- (a) Lumpy SDF normals drawing camouflage: **true but small.** Proxy normals alone (item 2, `proxy`/`mix-vn`)
  gave larger, cleaner shadow shapes on the old Brute; pure proxy and 75/25 looked nearly the same. Kept: pure proxy.
- (b) Zones following paint noise: **the main cause, and worse than thought.** The atlas was thousands of tiny UV
  islands on a dark maroon gutter (`bakes/brute/brute-base.png` before this pass). At gameplay mips the zone
  sample bleeds into the gutter and drops tiers, so every seam became a dark blotch.
- A third cause nobody named: the creature light **hue** term carried room-light pools and shadow-map edges across
  the body. With flat albedo this showed as tan and green patches with jagged edges.
- (c) Plan view is a blob: **true.** The rest-pose blades hung as two curtains over the arms and head, and the
  arms lay on the chest in every clip.

**What changed (items 2–5).**
- `build.py --form=proxy` (castes set `FORM_NORMALS="proxy"`, `FORM_MIX`). Shading normals come from a
  Taubin-smoothed copy of each variant: 100 λ/μ iterations (.5/−.53), then 12 Laplacian passes on the normal
  field to remove sliver noise. They are written as custom corner normals, so they ride on the GLB `NORMAL`.
- `GraphicSurface` creature branch:
  - Key facing reads `vNormal`, not the normal-mapped normal.
  - Lit / half-tone / shadow steps sit at facing .55 and .64, each one `fwidth` wide (½-tone weight .45).
  - Room hue is kept at 30 %.
  - Cache key `graphic-surface-v5`.
- Flat-cell atlas (castes with `BAND_CELL`):
  - No bake. Each face's UVs go to the centre of one solid 512 px cell for its band, in a 4×4 grid on the same
    2048 atlas and in the same zone reader.
  - Bands are chosen by zone, `BAND_MAP` and `PLATE_BAND`, then `build_bands.merge_islands` (cell 0.3 design
    units, majority below 30 %).
  - The normal map is flat. Glow cells are the organ and eye colours.
  - The rebuild takes ~2 min instead of ~3.5.
- `ActorSurface`:
  - New per-actor uniforms `actorZoneLevel` (defaults .040/.056/.15/.165 = SHADER25b, so other families are
    unchanged) and `actorWet` (default 0).
  - `surface.zones(armour, plate, flesh, bone, wet)` sets them.
  - The wet pick is Blinn from the fixed key, exponent 48, smoothstep .35–.75, colour (.62,.66,.62)×wet, on flesh
    zones only.
  - Cache key `actor-surface-v26-creature26:alien`.
  - No fetch, pass, target or draw was added.
- Brute palette (linear vertex/cell colours):
  - carapace (.040,.050,.042)
  - flesh (.34,.32,.21)
  - bone (.74,.73,.68)
  - `CREATURE_BODY_HUES.brute` 0x6b6c5e
  - `BRUTE_ZONE_LEVELS` .050/.050/.105/.19, wet .16
- Brute model (`brute.py`):
  - Head wedge 0.35 units further forward than CREATURE19, with one broad pale top plate (plate 50 → `lead`).
  - Narrower chest (y 1.42→1.02).
  - One dark yoke plate (300) over hump and shoulders, joined to the back as one carapace saddle.
  - Forelimb geometry carried 0.72 units out from the shoulder line (bones unchanged).
  - The weapon forearm's outer plate (310, `bone`) runs into the cleaver's pale edge; the blade bodies are dark
    and shorter (×0.78 / ×0.55).
  - Removed: pectorals, collar ring, pauldrons, elbow spur, tendons, 12 forearm shingles and half the dorsal
    blades and shingles.
- Elite: a three-horn pale crown swept back off the head plane replaces the shoulder horn and fins.
- Warden (`warden.py`):
  - Its own bone crest: a broad pale head plane rising into a swept keel.
  - A large lit maw at the head's front, now the brightest thing on it.
  - A smaller back lantern, a dark slate ram face and smaller dorsal plates.
  - A short counterweight tucked under the hind body; half the straps and shingles.
  - `RANK_SCALE.boss` 3.8 → 2.79, with `WARDEN_STATURE` (models.ts, presentation only) .86 → 1.175.

**Measured** (heavies lineup, crew-checkpoint, luma inside each silhouette eroded 3 px; marine plate p90 = 180;
floor p50 = 42):

| | before p25 / p50 / p90 / p98 | after p25 / p50 / p90 / p98 |
|---|---|---|
| Brute | 31 / 37 / 68 / 108 | 37 / 56 / 96 / 118 |
| Elite Brute | 25 / 34 / 86 / 158 | 39 / 49 / 92 / 120 |
| Warden | 16 / 35 / 68 / 109 | 38 / 51 / 95 / 123 |

- Lit planes sit at about 50–53 % of the marine plate, shadow (p25) at about 21 %, and bone/head p98 at 66–68 %.
- Before, the body median sat at floor value.

| Sizes in game (width × depth, height, radial from centre) | before | after |
|---|---|---|
| Brute | 1.98 × 1.68 m, 2.76 m, 1.26 m | 1.90 × 1.72 m, 2.79 m, 1.27 m |
| Elite Brute | 2.84 × 2.26 m, 3.38 m, 1.90 m | 2.98 × 2.51 m, 3.33 m, 2.18 m |
| Warden | 4.49 × 3.65 m, 4.41 m, 2.99 m | 3.85 × 3.75 m, 4.41 m, 2.30 m |

- Bones and joint rest positions are unchanged.
- The Brute's and elite's in-game heights are normalised by the runtime (2.95 m rest target), so they moved by
  idle-pose rounding only: +0.03 m and −0.05 m.
- The Warden's height is held exactly by `WARDEN_STATURE`.
- **The Warden's presence fell.** Its drawn reach is now 2.30 m against the 2.0 m collider. The runtime fits the
  boss footprint to `rankScale × radius × .94` from the farthest vertex, so a reach of 2.3 m forces the scale down.
  Its footprint is now 1.29× the elite's width, not 1.46×. Keeping 1.46× at 2.3 m would need a rounder body, or
  a runtime fit that ignores the tail; neither was done.

**Rebuild:** `TOKTX=<toktx 4.4.2> sh tools/assets/k11-creatures/creature26/iterate.sh <tag>` runs four steps:
1. build (`blender … build.py -- --caste=brute`)
2. `creature26/ship.sh` (optimize → restore others → KTX2 → restore → LOD → restore)
3. `npm run build`
4. the lineup

`creature26/preview.py` is a 50 s no-bake plan view. It poses the mesh in any motion clip through `pose.py`, a
numpy glTF clip evaluator, and renders flat two-plane shading plus a silhouette from the game pitch. Use it before
any full build. Other tools in `creature26/`: `sheet.mjs`, `values.mjs`, `crop.mjs`, `pairs.mjs`, `shoot.sh`
(item-1 scenario set) and `heavies.mjs` (lineup with radial and height).

**Still weak.**
1. Shadow shapes still have ragged edges in places, especially on legs in attack poses. The causes are band
   boundaries at triangle resolution (11.5 k tris) and Taubin normals on slivers. More normal-field iterations,
   or a higher body triangle budget, would help.
2. The dark yoke is the topmost shape when a Brute faces away. In the m9 strip it reads as a backpack plate.
3. The elite's crown is small at 480×270; the gold blade and mantle carry rank more than the crown.
4. In the crowd frame the Brutes no longer show the brown-paper camo, but each body still has 4–6 light shapes,
   not 2–3.
5. Warden presence (above). The tail no longer overhangs the collider, but the body is smaller.

**Recipe for Crawler, Stalker, Spitter, Carrier, Matron** (one caste per pass; do not touch the shader):
1. Run `preview.py` with that caste's module and motion file. Change `import brute as M` and the motion path, or
   add a `--caste` option. Look at idle, waiting and wind-up from left and down.
2. Forms (item 2): in the caste module set `FORM_NORMALS = "proxy"` and `FORM_MIX = 1.0`. Nothing else is needed;
   `build.py` writes the normals.
3. Zones (item 3):
   - Set `BAND_CELL = 0.3`, scaled to the body: about a sixth of the body width divided by 2.
   - Reduce `BANDS` to three body values, each landing clearly inside one zone-reader tier (linear luma): carapace
     < .07, flesh .25–.38 with chroma ≥ .12 so it is not read as bone, bone > .55 with chroma ≤ .07.
   - `BANDS["lead"]` = bone and `BANDS["plate"]` = carapace.
   - Write `PLATE_BAND` so the head's top plate is `lead` and one striking edge is `bone`. Small armour plates
     (leg plates 90–99) go to `flesh`.
   - Check the `flat cells` log line: no band under a few hundred faces except eyes.
4. Palette rule: the body hue must stay away from the deck's blue-grey and from Pyro's orange (0xff7a2e).
   - Set `CREATURE_BODY_HUES.<family>` to the new carapace or flesh hue.
   - In `models.ts` call `surface.zones(carapace, plate, flesh, bone, wet)` for that family only.
   - Aim lit flesh at about 50 % of the marine plate in `values.mjs` (p90 ≈ 90), the head/bone at most 68 % (p98
     ≤ 122) and shadow at about 20 % (p25 ≈ 36).
   - Small families keep their `SMALL_FAMILY_SHADOW_PLANE` .68 unless their p25 falls under the floor.
5. Rebuild the caste with `build.py --caste=<c>`, then run `ship.sh`, `npm run build`, the crowd capture and the
   playtest. Compare at native size and at 480×270.

## CREATURE27 — the five remaining brood silhouettes

Base `b680d0d3`. All four skinned assets now use the CREATURE26 flat-cell atlas and pure proxy normals. Carrier and Matron share the dragoon asset. The renderer sets each family's zone levels through the existing material interface. Skeletons, motion clips and the creature shader retain their integration versions.

- **Crawler.** The back is russet around a pink dorsal slit. The pale paired claws extend visually into the lower forelimbs. Widening the claw mesh in the first pass changed the model height through footprint fitting. Extending the pale surface across the original joints preserved the original model height.
- **Stalker.** The leading scythe, wrist and head wedge have pale surfaces above the slate-violet body. The comparison includes an open lane on Swarm Junction because the standard calm fixture places the animal behind a pipe. Its legs still lose contrast first on the plum deck.
- **Spitter.** The pale muzzle wraps around the jaw and joins the head plane. Dark flank plates separate it from the olive trunk and acid-green dorsal ridge. The regular and elite use the same mortar profile.
- **Carrier.** Dark thoracic plates and magenta brood stand over the many legs. The elite carries an additional pair of eggs in side cradles attached to the thorax. Building the cradles as a separate 560-triangle part kept the existing crest and its exact height. They join the elite mesh in the export.
- **Matron.** The pink egg stack sits against plum armour. Each opening pod has dark socket tissue around its lit membrane. The shell and membrane share their authored transform during opening, which keeps the rim around the cavity in both pods.

### Heights and rig

The game measurements use the same seeded lineup, fixed idle sample and actor IDs in both builds. The first two columns are the public model height in metres. The last two are the tallest visible skinned vertex above the actor origin in the same frame. All comparisons matched at full numeric precision before rounding. The exported rest-mesh height also matched for every rank. Joint names, parent relationships, local rest matrices and inverse bind matrices matched for all 46 Crawler, 38 Stalker, 57 Spitter and 73 Carrier/Matron joints.

| Rank | Model before | Model after | Visible before | Visible after |
|---|---:|---:|---:|---:|
| Crawler | 0.773644 | 0.773644 | 0.686785 | 0.686785 |
| Elite Crawler | 1.793735 | 1.793735 | 1.718230 | 1.718230 |
| Stalker | 1.081849 | 1.081849 | 1.024072 | 1.024072 |
| Elite Stalker | 1.705099 | 1.705099 | 1.671488 | 1.671488 |
| Spitter | 1.651721 | 1.651721 | 1.595860 | 1.595860 |
| Elite Spitter | 2.885776 | 2.885776 | 2.899489 | 2.899489 |
| Carrier | 1.980371 | 1.980371 | 1.921693 | 1.921693 |
| Elite Carrier | 3.253404 | 3.253404 | 3.264440 | 3.264440 |
| Matron | 5.295817 | 5.295817 | 4.804680 | 4.804680 |

### Rebuild and review

Run the CREATURE26 preview with `--caste=crawler|stalker|spitter|carrier` and an output directory. The default poses are rest, idle, waiting and wind-up from two directions. For the Carrier lineup `--voxel=.45` keeps the preview inexpensive. The preview accepts `--parts=boss` for the Matron alone. Rebuild with `build.py -- --caste=<family>`, then run `TOKTX=<toktx> sh tools/assets/k11-creatures/creature26/ship.sh <asset>` with dretch, basilisk, marauder or dragoon. The packers process that model only. The pod rebuild uses `growth/build.py -- --set=pod`, followed by `pack-brood.mjs --pod-only` and `brood-lod.mjs --pod-only`.

Local comparison sheets are under `artifacts/nextgen/creature27/sheets/`. Open `{crawler,stalker,spitter,carrier,matron,rooms}-{native,480}.png`. Each frame has the integration build on the left and CREATURE27 on the right. The individual burst frames are under `pairs/`. Matron coverage uses the native encounter fixture in Relay Racks, including calm, brood release, countdown, opening, hatch, death and ragdoll. The opening frame shows the shell before the hatchling separates.

### Game-camera values and remaining limits

The CREATURE26 silhouette measurement erodes three pixels before sampling. In the crew-checkpoint lineups the marine plate p90 was 181–183. The brightest creature p98 across the sampled ranks was 121. The table shows the regular animals and the Matron.

| Family | Before p98 | After p25 / p50 / p90 / p98 | After p98 as fraction of marine plate p90 |
|---|---:|---:|---:|
| Crawler | 174 | 58 / 86 / 111 / 119 | 65% |
| Stalker | 158 | 30 / 61 / 107 / 114 | 62% |
| Spitter | 208 | 48 / 65 / 103 / 118 | 65% |
| Carrier | 117 | 36 / 57 / 81 / 112 | 62% |
| Matron | 167 | 27 / 43 / 71 / 119 | 66% |

The three body bands survive minification, but bent legs, the attack outline and overlapping actors can still break them into smaller shapes. The Crawler's slit and the Spitter's ridge are dimmer after the value correction. At 480×270 the Stalker's thin legs still recede into the purple floor. The marine's gun covers part of the mouth in the Spitter melee capture. The ranged wind-up row in Awakening Bay uses a shorter native firing lane to keep both actors visible. At 480×270 the red aiming line still draws the eye first. The Matron's p50 remains close to the deck. The pink stack and cavity rims carry the read there.

The production build passed. The unassisted Arc desktop campaign cleared 12 rooms on seed 1729 with zero errors and zero recorded defects. The High Arc Relay Racks benchmark completed one 20-second trial per build with zero runtime compiles in either trial. Median frame time was 16.7 ms in both, with p95 of 25.0 ms before and 24.9 ms after. Host load differed substantially between trials. The raw benchmark receipts are in `artifacts/nextgen/c27-bench-{before,after}/benchmark.json`.

## CREATURE28 — rank and facing at the game camera

The Crawler has a single tapered pink stripe across the back of its russet shell. It reaches the nose shield and leaves the broad pale foreclaws visible. The elite carries a pair of swept tail fans. The Spitter's acid-green ridge ends in a separate lime mouth and collar. Its elite retains the raised dorsal fin. The Stalker's lavender head wedge and luminous bevel share the same tint, so the striking arm carries the facing mark from waiting into the lunge. Its elite has a second hooked scythe tip. The elite Carrier keeps its forked side cradles, which carry the brood outside the regular animal's outline.

The elite Brute wears a low, three-tined pale-gold crown and a split right cleaver. The outer crown tines sweep forward and apart, exposing a tip even when the shoulders hide the centre. In the settled pose, projecting the shipped skin through the game camera in five-degree increments put crest pixels outside the rest of the silhouette at all 72 angles. The turn sheet fits the regular and elite to the same box and omits the halo. In the Crew Checkpoint lineup the new crest's p98 was 120 against a marine plate p90 of 180 (67%).

### Heights and rig

Live model heights in metres, rounded to six decimals. Each entry is regular / elite, followed by the champion where present. The comparison used the full-precision values from matching Crew Checkpoint lineups. The packed meshes also have identical vertical extents, joint names, parentage, local rest matrices and inverse bind matrices against integration commit `8f708dec`.

| Family | Before | After |
| --- | --- | --- |
| Crawler | 0.773644 / 1.793735 | 0.773644 / 1.793735 |
| Spitter | 1.651721 / 2.885776 | 1.651721 / 2.885776 |
| Stalker | 1.081849 / 1.705099 | 1.081849 / 1.705099 |
| Brute / Warden | 3.030000 / 3.285046 / 4.500000 | 3.030000 / 3.285046 / 4.500000 |
| Carrier / Matron | 1.980371 / 3.253404 / 5.295817 | 1.980371 / 3.253404 / 5.295817 |

The top of the settled skin also matched before and after at every sampled rank and idle phase. For example, the elite Brute's settled top was 3.3306445750276152 m in both builds.

### Dark-floor values and proof

These are sRGB luma percentiles from matching compact colour crops in the first Swarm Junction crowd frame. The creature columns give p98 of the family's coloured pixels. The marine column gives p90 of neutral plate pixels.

| Gallery | Pink dorsal stripe | Acid-green mark | Violet mark | Marine plate |
| --- | ---: | ---: | ---: | ---: |
| final17 | 179 | 205 | 156 | 180 |
| final18 | 106 | 109 | 107 | 180 |
| CREATURE28 before colour follow-up | 179 | 175 | 151 | 180 |

In the same Crawler crop the span of pink pixels above luma 127 grew from 34 native pixels in final17 to 69. Final17's Spitter mark exceeded the marine plate by 25. The first CREATURE28 pass preserved the marine ceiling and increased the area of the lit muzzle. The comparison still shows the Stalker as the least conspicuous of the three on plum, particularly where its folded blade points toward the camera. The lit bevel and head wedge move with the existing skin through wind-up.

Open `artifacts/nextgen/creature28/sheets/` in this worktree. The three-way strips are `heavies`, `swarm-junction` and `relay-racks`, each with `-native.png` and `-480.png` variants. Each column uses the original full game frame or a 480×270 reduction. The heavies columns stack colour, greyscale and silhouette. The `crawler`, `spitter`, `stalker` and `brute` sheets pair integration and current calm and attack frames in Swarm Junction. The Spitter also has a native ranged-warning frame. The `elite-pairs` sheets cover all five families in Crew Checkpoint. The equal-height, ring-free regular/elite outlines are in `sheets/rank-contours.png` under the same CREATURE28 folder. The Brute turn is at `artifacts/nextgen/creature28/now/brute/lineup/turn.png`.

The production type-check and build passed. Arc, seed 1729, cleared all 12 requested rooms in the desktop playtest with zero errors and zero reported defects. The recorded campaign is at `artifacts/nextgen/playtest/c28-arc/index.html`. The 51 exported animation clips across the five packed assets also matched the baseline in channel targets, interpolation, key times and sampled values.

### Final17 colour follow-up

The Crawler carries a glowing pink slit over a russet-orange back and pale forward claws. The Spitter pairs a lime flank with an acid-green ridge and lit mouth. The Stalker has a blue-violet body and a pale leading blade. Two curved dark folds divide the Carrier's violet-magenta sac into three lit lobes.

For each room, both galleries use the first native crowd frame and the same 5×5-pixel patches. Each triplet gives HSV of the median red, green and blue channels, with hue in degrees and saturation and value in percent. The body and mark patches sample the Crawler flank and slit, Spitter flank and ridge, Stalker leading body plane and violet highlight, and Carrier shoulder and sac lobe.

| Room | Family | Final17 body | Current body | Final17 mark | Current mark |
| --- | --- | ---: | ---: | ---: | ---: |
| swarm-junction | crawler | 17.3 / 43.4 / 59.6 | 17.3 / 43.4 / 59.6 | 349.9 / 36.0 / 96.9 | 349.5 / 36.8 / 96.9 |
| swarm-junction | spitter | 71.7 / 39.8 / 40.4 | 72.6 / 40.2 / 42.0 | 81.2 / 32.4 / 82.4 | 79.7 / 31.9 / 82.4 |
| swarm-junction | stalker | 230.8 / 47.7 / 42.7 | 230.9 / 47.7 / 43.5 | 253.3 / 24.3 / 87.1 | 253.3 / 24.2 / 87.5 |
| swarm-junction | carrier | 313.6 / 30.3 / 56.9 | 313.3 / 30.6 / 57.6 | 312.0 / 30.6 / 57.6 | 312.2 / 32.2 / 59.6 |
| relay-racks | crawler | 18.3 / 44.8 / 60.4 | 17.4 / 44.5 / 60.8 | 349.2 / 35.7 / 97.6 | 350.0 / 36.1 / 97.6 |
| relay-racks | spitter | 84.9 / 39.8 / 40.4 | 87.0 / 38.8 / 40.4 | 81.5 / 31.5 / 83.5 | 79.4 / 30.7 / 83.1 |
| relay-racks | stalker | 210.6 / 47.3 / 43.9 | 210.6 / 47.3 / 43.9 | 251.1 / 24.2 / 87.5 | 249.6 / 22.4 / 87.5 |
| relay-racks | carrier | 304.7 / 27.1 / 54.9 | 305.9 / 28.3 / 56.9 | 308.6 / 29.2 / 56.5 | 305.5 / 29.5 / 58.4 |

All 16 patches retain at least 92% of final17 saturation. The largest hue difference is 3.1° on the Relay Racks Carrier lobe. In Swarm Junction the four sampled body lumas are 114, 102, 68 and 114 in table order against a marine plate of 180. In Relay Racks they are 115, 96, 81 and 115 against 183. The lit body samples stay below 64% of the marine. The Spitter's emissive ridge matches final17 at 200 and 203 luma respectively under the approved exception. These fixed-patch measurements use a different statistic from the earlier p98 table.

All regular and elite heights match the before and after values in the preceding height table. Mesh triangle positions, skin weights, joint rest transforms and the 51 animation clips matched the baseline. The Matron region in the matched Crew Checkpoint lineup had zero changed RGB pixels.

Open `artifacts/nextgen/creature28/colour/sheets/` in this worktree. Both `swarm-junction` and `relay-racks` have `-native.png` and `-480.png` full-frame strips, `-crop.png` strips of native 640×620 windows, and `-now-640x620.png` single current windows. The three columns run final17, final18, current.

The production build passed. Arc cleared all 12 rooms on seed 1729 with zero errors and zero reported defects. The final desktop campaign report is at `artifacts/nextgen/playtest/c28-colour-final-arc/index.html`.

## CREATURE29 — Brute face and limbs, Warden body (geometry only)

Base `bbff3592`. Lighting, colours, zone values, the creature shader, skeletons, bone names, joint rest positions and motion clips are unchanged. Only `tools/assets/k11-creatures/{brute,warden,sdf,build,build_bands}.py` and the packed `tyrant.glb` changed. The elite crest and forked cleaver (regalia) were not touched.

**Brute head.** The head is one pale brow-to-snout plane with no keel. It slopes 18° down toward the target, is 2.0 design units wide and runs from just ahead of the yoke to past the old snout. It sits on a narrower dark skull, so its overhang shows as a dark recess. A dark crease sits along the brow, a mid-flesh hood wraps the back of the skull, and a recessed dark neck separates the hood from the yoke, which is narrower (side half-span 1.95 → 1.65). The tusks and mouth cut were removed: the cut showed through the plane as a dark spot.

- Slope: steep planes sit on the light's .64 threshold and read as half pale, half grey. The flatter plane faces the fixed key at every heading.
- Value: under the fixed palette, lit bone measures about 118 luma against lit flesh at 103 in Relay Racks. The plane has to be carried by the dark around it, not by value.
- Recovery: in the recovery clip the head pitches into the chest. That pose shows only a small pale strip.

**Brute limbs.** Every leg has the same parts, all with hard facet normals:
- a four-sided faceted thigh
- a knee knob
- a faceted shin
- a flat foot with three large claws

Forearms are faceted segments with an elbow knob. The weapon elbow's geometry stands 1.35 units off the torso (was 0.72), while the wrist and cleaver keep their place. The masses lose their noise lumps. Both cleavers are built from four segments instead of nine scallops, which leaves four big notches.

**Warden.** The round fist arm and the small hooked arm are replaced by two massive faceted forelimbs. Each has a shoulder, an elbow knob standing out and back, and a forearm. The forearm ends in a foot planted wide of the body with three big pale claws. The rest of the body changed as follows:
- A dark keeled plate runs down the front of the chest.
- The mid-body narrows into a waist.
- The hind legs are hard-plane legs with knees and claws. The middle pair is tucked under the waist.
- A dark faceted head wedge projects forward under the crest and lit maw. Both stay on their CREATURE26 anchor, so the maw keeps its baseline size and brightness. The first try moved them forward with the head, and the crest's forward point then covered the maw.
- The ram shoulder is unchanged. The drawn reach is 2.31 m (was 2.30).

**New tooling.**
- `sdf.Prism`: a tapered polygonal segment.
- `Prim(hard=…)`: a primitive shades with its own facet normals instead of the Taubin proxy. The weight is carried as `k11_hard` into `build.form_normals` and removed before export. The preview honours it.
- `creature26/look.sh`: a four-pose preview sheet.
- `creature26/iter29.sh`: build → ship → game build → lineup → crowd.
- `creature26/rig.mjs`: rig fingerprint and mesh extents.
- `creature26/proof29.mjs`: final18 | baseline | now sheets.
- `creature26/grid.mjs` and `crops29.mjs`: contact sheets and capture crops.
- `heavies.mjs` now also prints the public model heights at full precision.
- The preview prints each pose's footprint radial and top, plus the rest-space vertex that sets them.

### Heights, footprint and rig

| | baseline | now |
|---|---|---|
| Model height Brute / elite / Warden (m) | 3.030000 / 3.285046 / 4.500000 | 3.030000 / 3.281961 / 4.500000 |
| Lineup drawn height Brute / elite / Warden (m) | 2.79 / 3.33 / 4.41 | 2.79 / 3.33 / 4.39 |
| Lineup radial (m) | 1.27 / 2.18 / 2.30 | 1.27 / 2.16 / 2.31 |
| Idle footprint radial, design units (Brute / Warden) | 5.589 / 4.618 | ≈5.60 / 4.618 |

- **Rig:** 63 joints, identical before and after. Hash `144d320c6cae75d7` covers names, parents, rest TRS and inverse binds.
- **Runtime fit:** the runtime fits the Brute's horizontal scale to the idle footprint radial and its vertical scale to the idle top.
  - The idle top is the hump crown. The hump and yoke therefore stay on their CREATURE26 anchor.
  - The weapon cleaver tip is trimmed (×0.741) so the radial matches.
- **Elite:** its model height comes from the live settled top, not the normalised one. The body edits moved it by 3 mm (−0.09 %).
- **Warden:** its model height is held at 4.5 by the runtime. Its idle top (dorsal plate 400) moved by 0.1 % of a design unit through remeshing.

### Proof

The sheets are local, under `artifacts/nextgen/creature29/sheets/`. Each one has the columns final18 | baseline | now.

| Sheet | Content |
|---|---|
| `1-swarm-junction-brutes-native` / `-480` | Swarm Junction crowd |
| `2-relay-racks-brutes-native` / `-480` | Relay Racks crowd |
| `3-loaded-brute-0{1..4}-native` | Crew Checkpoint brute attack |
| `4-heavies-{colour,grey,silhouette}` / `-480` | Heavies lineup |
| `5-warden-<state>-native` / `-480` | The seven Warden states |

The production build passed. Breacher, seed 1729, `--fast`, cleared 12 rooms with 0 errors.

**Still weak.**
1. The pale head plane is only about 15 luma above lit flesh, so a Brute facing away from the camera still shows no head. The read depends on the dark border.
2. In the loaded pose the cleaver still crosses in front of the belly from the game camera. The elbow offset opens floor only between the legs and the arm.
3. The Warden's waist and head wedge are clear in side view. In the lineup the Warden faces away, so its silhouette row shows the forelimbs and legs but not the head.
4. The recovery pose hides the Brute head.

## BRUTE30

The initial slate-teal pass is recorded below. The follow-up at the end of this section specifies the shipped jade palette and Warden finish.

The regular and elite Brute now share a slate-teal body. The existing atlas identifies the brow, cleaver edge and elite trim. Across the other cells, one upper-left key splits the body into a lit plane and a shadow at 52% of its linear value. The brow holds its value as the head turns. In the Crew Checkpoint lineup, the regular Brute and elite both measured 120 at p98 against 181 at p90 on the marine. Rebuild the shipped shading with `npm run build`.

**Hue choice.** In the native Swarm Junction crop, umber draws my eye to the shoulder first. At 480×270 it groups with the orange Crawlers. With slate teal I find the pale wedge first on the two Brutes facing down-screen, and the raised arm first on the one turning away. The same teal holds together against the brown Safety-interlock floor and the plum Infested Workshop floor. I used Infested Workshop for the dark-floor comparison because it had the lowest median spawn-floor value in the twenty-room FRAME16 survey.

**Silhouette and boss.** The regular cleavers already have four segments. The extra points at the flank in the rear view come from the forelimbs and splayed feet overlapping. I kept the silhouette. A further pass would separate the wrist and foot in projection through the turn, which calls for a pose change. The rear view still relies on the paired shoulders to convey facing. I also tried flattening the Warden's body values. At quarter size the raised ram shoulder merged with the chest beside the lit maw. The first pass kept the original Warden shading.

**Combat cues.** The side and rear rows hold the same pose and change its presentation yaw. The windup uses the native red arc. The recovery rows follow a missed swing and the first rifle hit in the punish window, with both the recovery-stagger and hit receipts. The pale-gold brackets remain visible around the teal body. The head can narrow to a sliver from the side, and the thin cleaver tip still needs the windup silhouette at quarter size.

| Model | Public height in metres, previous → now | Drawn footprint radius in metres, previous → now |
|---|---:|---:|
| Brute | 3.030000 → 3.030000 | 1.27 → 1.27 |
| Elite Brute | 3.281961 → 3.281961 | 2.16 → 2.16 |
| Warden | 4.500000 → 4.500000 | 2.31 → 2.31 |

The local review sheets under `artifacts/nextgen/brute30/` are `candidates.png`, `do-no-harm.png`, `three-room.png` and `warden-trial.png`. Each pairs native crops with 480×270 room frames. The baseline is `783c5f4`.

The production build passed. Breacher cleared six rooms through Armory on seed 1729 in fast mode, with zero runner errors. The Crew Checkpoint High Breacher benchmark recorded zero combat shader compilations.

### Hue and status follow-up

Deep jade replaces slate teal. In the Swarm Junction crowd I find the pale brow first on the two forward-facing Brutes. The moss and fern studies approach the Spitter's yellow-green, especially at quarter size. Jade separates from the blue Awakening Bay deck and the brown Safety-interlock station. Communal Atrium is the closest match: the jade lit plane and black outline carry the shoulders against the duller olive floor there.

The matched Cryo row shows a frozen Brute on the left, a chilled one in the middle and a clear one on the right. The stock overlap chills both left actors. The comparison applies a native freeze to the left one, and the three snapshot receipts confirm the states. A full freeze lifts and desaturates the skin. Chill retains the blue glaze and clear skin stays green. The brown control uses the final18 Brute asset and its former zone shading in the current encounter. The Pyro and Arc rows use the same camera and simulation instant across hues.

**Warden.** The boss uses the family's jade at 79% of the regular body's linear value. The pale bone plate spans the authored ram face and the upper carapace of the leading shoulder. During the charge windup the plate stays visible above the chest, immediately beside the luminous maw. I kept this version. The small light on the back is gone, leaving the maw as the brightest point. In wall-stun the shoulder turns edge-on and reads as a shorter pale bar below the stun indicator. The material changes use the existing mesh, skin and clips.

Rebuild with `npm run build`. The follow-up sheets are in `artifacts/nextgen/brute31/`: `green-candidates.png`, `status.png`, `four-floors.png` and `warden.png`. Each includes native crops and complete 480×270 frames.

The production build passed. Cryo cleared five rooms through Crew Checkpoint on seed 1729 in fast mode with zero runner errors.

## BRUTE32 — Brute body rebuilt for the game camera

Base `ec79403e`. Only `tools/assets/k11-creatures/{brute,build_bands}.py`, `creature26/preview.py`, one shader line in `src/render/vfx/ActorSurface.ts` and the packed `tyrant.glb` (and `plain/tyrant.glb`) changed. The Warden sculpture, palette, lighting constants, skeleton and clips are untouched; the Warden mesh in the GLB has the same vertex count and extents.

**What the body is made of.** `brute.build` is now about forty lines of smooth primitives, symmetric about the heading:
- trunk: chest, a hump between the shoulders (its crown is still the idle top), a waist, smaller hips;
- two shoulder masses, the widest point (≈5.8 units across against ≈2.1 for the hips);
- two equal forelimbs: upper arm (r .90→.85) blended shoulder→claw, a forearm that is thicker (r 1.05→.92) and rigid on the claw bone, and a round club fist (1.38×1.25×1.1) planted forward and out. Floor shows between each forearm and the chest. No cleavers, claws, tusks, spikes or notches;
- two short hind legs (thigh, shin, foot pad) on the back-leg bones. The front-leg and feeding-arm bones carry no geometry;
- head: one low lobe ahead of the shoulders under a pale arrowhead skull plate (`skull_plate()`: an `AnglePlate` with the trailing point along the heading, 3.0 long × 2.4 wide, tilted 15° nose-down, hard facets, plate 50 → `lead` → `bruteFace`). It projects ≈2.8 of its 3.0 length ahead of the shoulder front. Two dark eye slits (plate 62);
- two dark dorsal plates down the spine, also arrowheads (plates 60/61, hard facets).
Everything except the skull plate, the slits and the dorsal plates shades with smooth proxy normals.

**Zones.** The skull plate (and the elite horns, plate 51, kept out of the regalia gilt by `paint_marks`) sits in the `lead` cell = `bruteFace`. Everything else is `bruteBody`. There was no dark cell left inside `bruteBody`, so dorsal plates and eye slits use the unused `plate` cell (6) and one line in `ActorSurface.ts` multiplies `bruteBody` by .4 there for the regular Brute only (`actorWarden<.5`). `BAND_KEEP` in `brute.py` (read by `build_bands.merge_islands`) keeps the small slits from being merged away. Frozen, chilled and clear Brutes still differ (sheets 10–12): a full freeze is pale grey, chill stays blue-teal, clear stays jade.

**Elite.** Same body. Rank is two pale horns swept back and out from the plate's rear corners (regalia, `bruteFace`) plus the existing rank mantle on the hips. The forked cleaver, the coronet and the three-tine crest are gone (the crest was symmetric but cluttered the plate). The horns are kept low so they stay under the hump crown and the elite height does not move.

**Tools.** `preview.py` accepts `--facings=h0..h7` (45° steps). The eight-heading silhouette check at 96 px tall (idle and windup) is in the scratch loop only; in idle the head plate, both forelimbs and the body are separate lobes in 7 of 8 headings (the rear view joins the head to the hump).

### Heights, footprint and rig

| | previous | now |
|---|---|---|
| Model height Brute / elite / Warden (m) | 3.030000 / 3.281961 / 4.500000 | 3.030000 / 3.283239 / 4.500000 |
| Lineup drawn height Brute / elite / Warden (m) | 2.79 / 3.33 / 4.39 | 2.80 / 3.33 / 4.37 |
| Lineup radial Brute / elite (m) | 1.27 / 2.16 | 1.26 / 1.69 (cleaver gone) |
| Idle footprint radial, design units (sets horizontal fit) | 5.597 (cleaver tip) | 5.594 (left fist) |
| Idle top, design units (sets vertical fit) | 9.192 (hump crown) | 9.199 (hump crown) |
| Rig | 63 joints, `144d320c6cae75d7` | 63 joints, `144d320c6cae75d7` |
| Body triangles (LOD0 / low) | 11500 / — | 11500 / 5300 |

The idle radial now comes from a fist instead of the cleaver tip, so hit shapes and drawn size stay put. The Warden lineup numbers wobble by 0.01–0.02 between lineup runs; its mesh did not change.

### Proof

Local sheets under `artifacts/nextgen/brute32/sheets/`, each `<n>-<name>-native.png` (crop) and `-480.png` (full frame at 480×270), previous (final19) | now:
`1-swarm-junction`, `2-relay-racks`, `3-brute-calm`, `4-brute-windup`, `5-brute-recovery`, `6-brute-behind`, `7-brute-side`, `8-elite-brute-calm`, `9-elite-brute-windup`, `10/11/12-status-{unfrozen,chilled,frozen}`. The creatures28 ids live in final19's `capture-fixtures.mjs` (not in `scripts/nextgen`); it was copied to the worktree's ignored `artifacts/nextgen/final19/` and run once per scenario (`artifacts/nextgen/brute32/cap.sh`). Sheets: `node artifacts/nextgen/brute32/sheets.mjs`.

Production build passed. Breacher, seed 1729, 8 rooms, `--fast`: 0 errors.

**Still weak.**
1. The skull plate is grey, not white: `bruteFace` is fixed at .181 albedo, so it reads by shape and size, not by value. It is the right size now, but at 480×270 it is a light-grey chip.
2. The forelimbs are long because the idle radial has to stay 5.597 and only the fists can reach it. In the loaded crowd poses the upper arm stretches between the shoulder and claw bones and reads rubbery.
3. Elite at calm: the low horns lie nearly in the plate's plane and read only as a wider plate; the elite is clear in windup but at calm the brackets carry the rank.
4. The windup frame shows a symmetric arch; the rising arm only reads later in the clip, so the red arc carries the telegraph.
5. Hind legs are mostly hidden under the hips from the game camera.

## BRUTE33

Base `563aa5ea`. The regular and elite share a smaller, raised warm-bone arrowhead, two inset eye slits, broad shoulder sockets, short upper arms, heavy forearms, dark knuckles and three overlapping dorsal shingles. The forelimbs follow their shoulder joints through the strike. The elite's swept horns replace the rank mantle. Its public height fell 0.30%.

The renderer uses the BRUTE32 stand-frame bounds as the shared tyrant anchor. Regular and elite use declared idle fit dimensions in the centered, grounded rig, so moving a fist no longer rescales the body. Warden uses its measured idle fit. The diff against BRUTE32 has no simulation or hit-shape edits. The native lineup returned the same contact radii of 42.90, 55.77 and 64.00 simulation units. The decoded Warden mesh attributes and indices match the baseline (`82d8b036dd1d7cf4`), as do the channels and samples of all 12 clips (`f844c4fcb87f1d8b`).

| Crew Checkpoint lineup | BRUTE32 | BRUTE33 |
|---|---|---|
| Model height, regular / elite / Warden (m) | 3.030000 / 3.283239 / 4.500000 | 3.030000 / 3.273329 / 4.500000 |
| Drawn height, same order (m) | 2.80 / 3.33 / 4.37 | 2.80 / 3.34 / 4.37 |
| Drawn radial, same order (m) | 1.26 / 1.69 / 2.22 | 1.24 / 1.66 / 2.22 |
| Rig, joints and fingerprint | 63, `144d320c6cae75d7` | 63, `144d320c6cae75d7` |

### Form light and bone value

The view-space key points upper left. Two hard thresholds at .225 and .94 select linear gains of .19, 1.00 and 1.45. The jade lit albedo is (.027, .073, .044). Region 29 carries only the skull and horn pixels to the final grade. Their separate value ceiling lets warm bone survive both the forward material and the creature highlight compression.

The counts below use paired 1920×1080 captures. A local diagnostic copy colored each visible body fragment by its selected shader step and gave bone a fourth color. The denominator includes shadow, lit and edge pixels. HUD, floor and skull are excluded. Display luma is the median Rec.709-weighted RGB byte value sampled at the corresponding pixels in the normal screenshot. Classification at antialiased edges is approximate.

| Frame | Shadow / body pixels | Shadow share | Display luma, shadow / lit / edge | Bone luma | Bone share including skull |
|---|---:|---:|---|---:|---:|
| Crew Checkpoint calm | 9,378 / 21,615 | 43.4% | 24 / 73 / 92 | 146 | 9.8% |
| Crew Checkpoint windup | 8,082 / 21,560 | 37.5% | 26 / 74 / 94 | 146 | 9.6% |
| Swarm Junction, first frame | 12,794 / 34,378 | 37.2% | 18 / 72 / 90 | 146 | 10.1% |

Lit marine armor samples ranged from 182–196 in Crew Checkpoint and 178–180 in Swarm Junction. That puts bone at about 75–80% and 81–82% respectively. In the full crowd frame I see the marine and red arc first. The jade separates from lime Spitters and the blue Cryo glaze. The shoulder and head remain legible on the blue Awakening Bay deck, brown Safety-interlock deck and purple Infested Workshop floor. Communal Atrium gives the least hue separation, where the bone and dark body edge do more work.

For another family, export skinned normals that turn smoothly across each large volume, retaining hard normals on plates. Give the diffuse body, dark armor, face mark and emissive organs stable, distinct atlas cells. In its material branch, split only the body by the dot product of the normalized view-space skin normal and the key. Pick the two thresholds against that family's captured poses. Keep organ emission, status finish and hit cues outside that selection. A bright mark also needs its own final-grade region if the shared highlight ceiling clips it.

### Sheet review

Local directory `artifacts/nextgen/brute33/sheets/`. Each stem below has a `-native.png` crop and a `-480.png` full-frame sheet, ordered final19 | brute32 | brute33. The heading judgments are a visual first glance at 480×270.

| Sheet stem | Heading, anatomy and player cues |
|---|---|
| 1-swarm-junction | All three headings read. The back row has the thinnest head. Marine, arc and foreground Crawlers stay clear. |
| 2-relay-racks | All three read. The upper animal's raised limb and rear leg overlap in projection, while the fists of the lower pair separate. The small enemies remain distinct. |
| 3-brute-calm | The plate points down-left. Shoulder, forearm and dark fist read separately. The marine holds the brighter values. |
| 4-brute-windup | Forward heading reads between the fists. The sockets frame the skull. The red sector still carries the attack timing. |
| 5-brute-recovery | The narrow plate points toward the marine. The near fist clears the recovery brackets and the rifle remains visible. |
| 6-brute-behind | The far plate gives the heading immediately. The back shows an armored ridge, although the lowest shingle merges with the hip shadow. Marine and rear silhouette separate. |
| 7-brute-side | The projecting nose gives the heading. The near forearm, fist and hind foot overlap more than in the calm pose. The marine stays clear. |
| 8-elite-brute-calm | The face gives the heading and the lateral horns give rank before the ring. The near horn crosses the shoulder. |
| 9-elite-brute-windup | Face and horns read head-on. The fists sit outside the face and both the red arc and rank ring remain visible. |
| 10-status-unfrozen | Three headings read in jade. The dark fists and head remain distinct beside the smaller warm creatures. |
| 11-status-chilled | Three headings read through the blue glaze. The shadow flanks, ice particles and small creatures remain visible. |
| 12-status-frozen | The pale held Brute separates from its chilled neighbors. The skull still gives direction, though opaque frost hides much of the shoulder detail. |

The weakest frames are Relay Racks for the upper limb overlap, the rear pose for separation of the three individual plates, and frozen for the loss of internal contrast.

The production build passed. The twelve final scenario manifests contain 18 captured frames and zero errors. Breacher cleared eight rooms through Breached Loading Bay on seed 1729 with the requested fast desktop runner and zero errors.

## WARDEN34

The Warden uses the BRUTE33 shoulder and forearm silhouette, with a longer neck, four dark dorsal plates and a two-piece bone prow. A curved amber lip sits above a separate dark chin. A small floor spill tracks the foremost skinned point of the lip. Body pixels use the Brute's three hard light steps with a darker jade albedo. The prow uses the Brute skull's full-lit bone region. The charge and wall-stun poses use the shipped clips.

### Desktop capture set

Each first-pass stem in `artifacts/nextgen/warden34/first-pass/sheets/` has a `-native.png` crop at original pixel scale and a `-480.png` pair of full frames. The left column is final19 and the right column is WARDEN34. The Crew Checkpoint charge-cycle gallery follows the same staged encounter and takes the first frame observed in each native state. Its canvas includes the actor health bar and stun mark. The behind and side fixtures and the native campaign include the DOM HUD as well.

| Source | Sheet stems |
|---|---|
| Crew Checkpoint charge cycle | 1-calm, 2-charge-windup, 3-charge, 4-wall-stun, 5-recovery |
| Crew Checkpoint camera fixtures | 6-behind, 7-side |
| Native Heavy lineup | 8-heavies |
| Relay Racks native Breacher campaign | 9-shutter-impact |

### Lineup and material measurements

The previous column is the merged BRUTE33 on `6db0c5a1`. Drawn dimensions are deformed mesh dimensions from the Crew Checkpoint lineup. The Warden's drawn height increased 0.69%. The public height and native radius are unchanged. The diff under `src/DepthGame.ts` and `src/game/` is empty.

| Measurement (regular / elite / Warden) | Previous | WARDEN34 |
|---|---|---|
| Public height (m) | 3.03 / 3.273329 / 4.50 | 3.03 / 3.273329 / 4.50 |
| Drawn height (m) | 2.80 / 3.34 / 4.37 | 2.80 / 3.34 / 4.40 |
| Drawn radial (m) | 1.24 / 1.66 / 2.22 | 1.24 / 1.66 / 2.26 |
| Native contact radius (simulation units) | 42.90 / 55.77 / 64.00 | 42.90 / 55.77 / 64.00 |
| Rig joints and hash | 63, `144d320c6cae75d7` | 63, `144d320c6cae75d7` |
| Twelve clip channels and samples | `f844c4fcb87f1d8b` | `f844c4fcb87f1d8b` |

The regular, elite and low-detail mesh fingerprints match before and after (`bfadae6232c491cb`, `cd2f0ffae8e0388c`, `a32607b094c236c1`). The packed and plain exports share the same rig fingerprint. A native chill application produced the dark blue-green glaze. A freeze application returned `controlResisted: true`, leaving the boss chilled under the existing control-resistance rule.

| Crew Checkpoint | Prow / visible Warden pixels | Prow share | Shadow / body pixels | Shadow share |
|---|---:|---:|---:|---:|
| Calm | 10,215 / 106,221 | 9.62% | 45,436 / 94,593 | 48.03% |
| Charge windup | 8,524 / 100,324 | 8.50% | 33,849 / 90,904 | 37.24% |

Counts come from a diagnostic copy of the production shader with distinct colors for the selected planes. Prow share includes body, prow and maw in its denominator. Shadow share excludes prow and maw and includes the thin lit edge. Both exclude the floor spill and UI. The calm Warden presents more shadow than the Brute at the same thresholds.

### Reading the sheets at 480×270

| Sheet | Heading, maw, family resemblance and player cues |
|---|---|
| Calm | The prow points right and the amber curve sits beneath it. Shoulder, forearm and dorsal plates give the family read. The marine stays clear. |
| Charge windup | The nose points up-left into the red capsule. A narrow amber lip survives at its tip. The planted near arm clears the central floor wedge and the capsule edge stays visible. |
| Charge | The prow still leads up-left, with a sliver of amber at its leading corner. The shoulder partly covers the jaw. The marine and the small foreground enemies stay legible. |
| Wall-stun | The mouth points left. The dropped head, broad planted brace and exposed back remain distinct. The stun ring and health tick sit above the body and the marine retains the occlusion outline. |
| Recovery | The first released frame keeps the head to the left of the near forearm. The amber jaw and the marine outline both read. The Warden follows the native change in aim over 0.24 s using the existing wall-stun pose. The stun mark clears immediately. |
| Behind | The pale nose gives an immediate leftward heading. The mouth is the small amber crescent at its left edge. The shoulder and plates still read behind the marine. |
| Side | The prow, open chin and floor spill all point right. The silhouette separates the neck from the forequarter, although the far forearm sits behind the near one. The marine remains clear of the glow. |
| Heavies | All three heads point right. The Warden shares the Brutes' dark fists, stepped flank light and pale face. Its low jaw and amber spill identify the boss without covering the elite's rank ring. |
| Relay Racks shutter impact | The prow points down-left and the amber jaw is exposed beneath it. The wide shoulders still identify the Brute family. The health bar and stun ring clear the ridge, the shutter callout sits to the left and the marine is visible below. |

At 480×270 I could identify the heading within a second in all nine sheets. The weakest are charge, where only the corner of the maw shows, behind, where the lip is a few pixels deep, and shutter impact, where foreground scenery cuts across the near planted limb. None obscures the charge capsule, stun mark, health bar or marine relative to final19.

The production build passed. The unassisted native Breacher campaign on seed 1729 cleared all nine rooms and recorded the Relay Racks shutter break at 195.35 s. The report has zero errors. The runner exited 1 because it separately flagged loading delays of 11.10 s in Passenger Vault and 6.08 s in Residential Gallery. The full report is `artifacts/nextgen/playtest/warden34-release/report.json`. All five native charge-cycle frames, both camera fixtures and the lineup completed without capture errors.

### WARDEN34 revision after lead review

First pass `2bccc6a5`. The emitting surface now fills the jaw above the dark lower mandible. A near-white core and amber rim carry across the prow tip in oblique views. The organ has an explicit emission-region assignment so the final grade preserves its value during wall-stun. A small hard-edged amber pool tracks the animated lip on the floor. Its forward offset clears the planted elbow in the rear camera.

The Warden's shoulder wedges carry dark pauldrons. Each elbow ends in a short guard above a tapered hexagonal forearm, a rounded block fist and a dark knuckle plate. A pitched ridge supports the four dorsal plates. The shared regular and elite Brute sculpture also uses a bevelled shoulder and a flattened forearm through the elbow. The updated lineup shows both beside the Warden.

At full native resolution, the lit maw was measured as one connected component in the visible head. The same RGB thresholds select bright warm pixels in each original PNG (red ≥170, green ≥107, red ≥ green ≥ blue, plus red minus blue ≥9 or blue ≥215). The floor pool, detached halo and other actors are excluded. Peak display value is the highest Rec.709-weighted sum of the displayed sRGB bytes, on a 0–255 scale.

| State | Lit maw pixels, final19 | Revised | Peak display value, final19 | Revised |
|---|---:|---:|---:|---:|
| Calm | 2,337 | 6,824 | 234 | 244 |
| Charge windup | 1,980 | 4,720 | 234 | 244 |
| Charge | 1,552 | 3,582 | 234 | 244 |
| Wall-stun | 1,539 | 5,411 | 166 | 243 |
| Behind | 1,820 | 4,075 | 234 | 244 |

The calm core peaks at RGB 246/244/240. The calm pool spans 73 × 49 native pixels with peak display value 118, against 244 for the maw. The pale prow occupies 9.10% of the visible Warden in calm and 8.11% in windup. The shadow plane occupies 46.02% and 38.68% of the jade body respectively. The final lineup measures 3.03 / 3.273329 / 4.50 m public height, 2.80 / 3.34 / 4.40 m drawn height and 42.90 / 55.77 / 64 native contact radii, in regular / elite / Warden order. The rig retains 63 joints and hash `144d320c6cae75d7`. All twelve clips retain hash `f844c4fcb87f1d8b`. There are no simulation edits.

The revised comparisons are in `artifacts/nextgen/warden34/sheets/` and `artifacts/nextgen/warden34/revision/sheets/`. Each numbered stem has a native crop and a full-frame 480×270 comparison, ordered final19 | WARDEN34 first pass | revised. The close crop of the two smaller heavies is `artifacts/nextgen/warden34/revision/brute-pair-native.png`.

| Sheet | First-glance read at 480×270 |
|---|---|
| 1-calm | Right. The white core sits at the nose and the amber pool is smaller and dimmer. The marine and health bar both clear the lit jaw. |
| 2-charge-windup | Up-left. The jaw leads into the capsule. Its red boundary and the floor gap between the planted limbs remain visible. |
| 3-charge | Up-left. The prow covers the inner edge of the maw, but the white leading corner identifies the aim point. The marine and smaller enemies stay distinct. |
| 4-wall-stun | Left. Both the white core and amber rim survive the stun dimming. The health tick and stun ring clear the ridge, and the marine's outline is still visible. |
| 5-recovery | Left. The jaw stays outside the near forearm while the head turns. The stun ring clears on release and the marine's outline remains readable. |
| 6-behind | Up-left. The maw is visible beyond the prow, with a small amber pool ahead of the near elbow. The marine and HUD stay clear. |
| 7-side | Right. The mouth and neck separate from the near shoulder. The far arm is foreshortened, and the marine remains visible beyond the pool. |
| 8-heavies | All three point right. The squared shoulders and forearms carry across the ranks. The Warden's amber-white jaw and the elite's swept horns remain distinct. |
| 9-shutter-impact | Left. The foreshortened white core is the first mark on the Warden. The off-body shutter callout, stun ring, health bar and marine are all clear in the native Breacher encounter. |

I found the heading and could point to the maw within a second on all nine sheets. The three weakest views are calm, where the open jaw looks roundest, charge, where the prow masks part of the core, and shutter impact, where the nearly edge-on jaw is narrowest and the dark shoulder plates lose contrast against the room.

The production build passed. The unassisted Breacher run on seed 1729 cleared all nine rooms with zero errors and captured the shutter break at 196.00 simulation seconds. The runner exited 1 for one loading-delay flag, 5.23 s in Residential Gallery. The report is `artifacts/nextgen/playtest/warden34-revision-final/report.json`.

## FAMILY35

The corrected values and three-column gallery are recorded under **Carrier value correction** below.

### Skin and rig

The four K11 source skins already export smoothed proxy normals. In the shipped base meshes the median maximum turn between corner normals of a triangle is 11.7° for Crawler, 17.3° for Spitter, 17.1° for Stalker and 17.6° for Carrier. The separate Matron skin measures 15.6°. None has a measurable population of triangles with all three corner normals within 0.2°. The input and output use identical GLBs, including their normal streams, hard plate boundaries, clips and bind transforms.

| Family | Joints | Rig fingerprint | Bind mesh height, asset units |
|---|---:|---|---:|
| Crawler | 46 | `a5106771e5de7166` | 1.931424 |
| Spitter | 57 | `d680757ef855e6d2` | 8.521052 |
| Stalker | 38 | `f5d312e1089e1ba0` | 3.998526 |
| Carrier | 73 | `a9960f8e864ca52c` | 18.013543 |
| Carrier Matron | 73 | `a9960f8e864ca52c` | 19.179160 |

### Native dimensions

Each entry is shared by `6db0c5a1` and FAMILY35. The five calm views use the same Crew Checkpoint pose, seed and native camera in both builds. Drawn height and radial reach come from the transformed vertices of each visible skinned mesh. The public attachment height and the simulation contact radius are independent measurements. The paired native crops are in `artifacts/nextgen/family35/sheets/lineup.png`.

| Family | Public height (m) | Drawn height (m) | Drawn radial (m) | Contact radius (simulation units) |
|---|---:|---:|---:|---:|
| Crawler | 0.77364 | 0.99724 | 0.60386 | 17.50 |
| Spitter | 1.65172 | 1.58616 | 0.66924 | 22.50 |
| Stalker | 1.08185 | 1.51648 | 0.70998 | 20.40 |
| Carrier | 1.98037 | 1.92600 | 0.76715 | 26.40 |
| Carrier Matron | 5.29582 | 5.40549 | 1.27829 | 46.00 |

### First-pass form light and marks

The key is normalized view-space (−.78, .40, .48). The diffuse gains are .24 in shadow and 1 on the lit plane. The edge gain in the table is the total gain. Crawler and Stalker have elongated bodies with very different projected areas when seen end-on and broadside. Their shadow thresholds follow the displayed heading. Carrier needs a smaller correction. In the table, c and s are cosine and sine of the rendered root yaw in radians. The cutoff is clamped to [−.45, .55]. The edge threshold stays fixed at every heading.

| Family | Shadow cutoff | Edge cutoff / gain | Calm | Windup | Swarm Junction | Relay Racks | Crew Checkpoint |
|---|---|---|---:|---:|---:|---:|---:|
| Crawler | −.06 + .46c + .12s | .94 / 1.34 | 41.8% | 38.8% | 35.4% | 40.0% | 37.4% |
| Spitter | −.24 | .94 / 1.38 | 39.2% | 36.8% | 38.9% | 39.8% | 38.8% |
| Stalker | .26 − .24c + .42s | .95 / 1.32 | 43.9% | 37.7% | 37.7% | 39.8% | 31.9% |
| Carrier | −.04 + .06s | .93 / 1.40 | 40.2% | 37.0% | 37.6% | 39.4% | 42.8% |
| Carrier Matron | −.20 | .94 / 1.45 | 32.5% | 36.1% | — | — | 43.3%¹ |

¹ The three stock crowds contain regular Carriers. The Matron sample is the Crew Checkpoint sealed-pod encounter with escorts, 21,156 shadow fragments out of 48,894 visible Matron body fragments. Shares aggregate the visible members of each family per frame. Individual headings can fall outside the band. The windup Crawler escort in that supplemental pod frame gives 6.4%, with its thin pale attack contour still intact.

An ignored diagnostic distribution wrote the actual shader step into the geometry buffer. Counts exclude bones, rank trim, organ marks, occluded surfaces, the marine and effects. The first crowd frame is the measured one. The readback uses the internal render resolution, including adaptive scale where active. Exact counts and the paired display samples are in `artifacts/nextgen/family35/pixels.txt`. Sampling a displayed screenshot at a sampled fragment is approximate where final AA or ink covers a thin edge.

The bright marks keep their authored coverage. In the calm views their median display luma (final19 → FAMILY35, Rec.709 on 8-bit RGB) was 182 → 182 for Crawler, 192 → 193 for Spitter, 136 → 140 for Stalker, 117 → 121 for Carrier, and 131 → 158 for Matron. Median lit-body values were 111, 74, 65, 93 and 99 respectively. The corresponding marine 90th-percentile samples were 182–183. The thin edge resolves best on the Matron sac. On tiny appendages the ink can cover it at 480×270, but the larger shell patches hold together without visible sparkle.

The regular body selects chitin, flesh and plate cells. Carrier adds the brood skin, folds and sac skin. Violet lobes, the acid muzzle, the blade bevel and the salmon stripe take their own full-value finish. Frozen, chilled, burning, shocked and hit-flash presentations bypass the new body treatment. The pod shell uses the Matron key while the core keeps its native hatch pulse. The Matron sequence recorded zero programs created after preparation.

### First-pass sheet review

Open `artifacts/nextgen/family35/first-pass-sheets/index.html`. Each named pair has a native crop and a 480×270 full-frame comparison, ordered final19 then FAMILY35. The crowds show four of these families plus Brutes. The pod stages show the fifth family alongside regular escorts. The regular and Matron silhouettes are distinguishable in the same frame by the Matron's long, raised sac.

| Sheet stem | What reads at room scale |
|---|---|
| crawler-calm | The salmon stripe divides a raised shell from its dark right flank. The mandibles stay clear underneath. |
| crawler-windup | The shell still turns behind the intact white attack contour. The red line crosses the low jaw. |
| crawler-behind | The stripe remains easy to pick up as it bends down the far shell. The legs separate at native size. |
| spitter-calm | The lime ridge and muzzle remain the quickest cues. Olive flanks turn around a narrow frontal profile. |
| spitter-windup | The loaded animal keeps its lime jaw and white outline. The darker flank is visible between the muzzle and the warning outline. |
| spitter-behind | The bright acid vessel stays centered above the darker folded legs. |
| stalker-calm | The blade edge remains bright against the dark thorax. The far arm is thin at 480. |
| stalker-windup | The blade and raised abdomen read separately inside the warning outline. |
| stalker-behind | The lavender mark survives. The rear legs are the weakest small-family detail on the slate floor. |
| carrier-calm | Both pink lobes rise above the darker legs. The marine draws the eye first. |
| carrier-windup | The forward legs turn under the lobes. The pink mark survives the white attack contour. |
| carrier-behind | The rear sac shows a lit top, violet mark and folded dark side. |
| matron-calm | The long sac has a broad lit top, dark flank and bright key-side sliver. The pink seams stay legible. |
| matron-windup | The flank turns even inside the attack contour. The pink mark remains clear between the danger discs. |
| matron-behind | The sac mass and shoulder vents read. The projected marine overlaps the upper tip in both versions. |
| value14-crowd-swarm-junction | Marine and red sector first. The stripe, violet sacs, lime muzzle and blue blade separate the four smaller families against the purple floor. |
| value14-crowd-relay-racks | Marine first. The teal machinery competes with the smallest blue Stalker. The warm stripe and pink sac remain easy to find. |
| value14-crowd-crew-checkpoint | Marine first. Spitter and Stalker stay distinct by hue and posture. The Carrier reads as two lobes over legs. |
| gallery-elite-pair-crawler | The elite shell and stripe read. The console hides most of the regular in both frames. |
| gallery-elite-pair-spitter | The lime plane identifies both animals. The larger crest separates the elite from its partner. |
| gallery-elite-pair-stalker | The blue blade edge survives on both. The ring and wider silhouette distinguish the elite. |
| gallery-elite-pair-carrier | The regular's pink lobes read against the dark flank. The elite adds the crown above them. |
| gallery-elite-pair-brute | The inherited BRUTE33 bone face and horns remain clear. The central marine stays brighter. |
| pod-calm | The long Matron sac and short escort sacs remain distinct across the room. |
| pod-brood | The loaded sac keeps a lit left face and a dark right edge. Warning rings remain visible. |
| pod-pod-sealed | The rounded clutch shells separate from the red core and the dark contact floor. |
| pod-pod-swelling | The shells expand around the bright cores. The Matron's flank remains readable behind them. |
| pod-pod-opening | Open mouths and the violet interiors make the opening distinct from swelling. |
| pod-hatched | Small salmon hatchlings replace the cups. The Matron and regular Carrier still read independently. |
| pod-death | The fallen sac lies across the left side. Its lit cap and pink spots stay separate from the upright escort. |
| pod-ragdoll | The tipped sac and folded limbs read separately. The corpse crosses the marine and the red sector at this camera angle. |

The three weakest views are Stalker behind (rear legs against dark steel), the elite Crawler pair (console occlusion), and Matron behind (marine and sac tip overlap). Native crops retain more limb anatomy than the downsampled room view. The final death and ragdoll comparisons use the browser compositor after GPU completion. The original helper returned the previous canvas on death and a cleared canvas on ragdoll.

### First-pass production verification

The production build passed. The fixture set contains 15 family pose captures, three four-frame crowd bursts, five elite pairs and three individual pod-stage captures. All 26 final capture manifests have empty error and failure lists. The eight-stage native Matron sequence also completed without errors. The side-by-side gallery uses final19 as its visual baseline. Differences in the marine and the Brute predate FAMILY35.

The Pyro Crew Checkpoint benchmark used the immediately preceding build, `6db0c5a1`, as the draw-call baseline. Each cell lists the maximum draw calls observed in each of three repeats.

| Tier | Previous draws | FAMILY35 draws | Combat compiles, previous / FAMILY35 |
|---|---|---|---|
| High | 150, 149, 145 | 151, 149, 144 | 0 / 0 in every repeat |
| Low | 138, 134, 132 | 133, 132, 133 | 0 / 0 in every repeat |

The plain ten-second runs on this shared host sometimes ended before a complete kit rotation or before a frame sample. Both builds completed the six-trial comparison with the same `--seconds=10 --min-simulation-seconds=4` settings. The resulting reports have zero errors. The raw reports are `artifacts/nextgen/family35-previous/benchmark.json` and `artifacts/nextgen/family35/benchmark.json`. These are draw and shader counts under an active simulation.

Pyro cleared all eight rooms through Breached Loading Bay on seed 1729 with the fast desktop runner. The isolated run exited 0 with zero errors and zero defect flags. Its receipt is `artifacts/nextgen/playtest/family35-pyro/report.json`. An earlier concurrent run also cleared all eight rooms and recorded two room-loading holds over five seconds.

### Carrier value correction

The first pass raised the Carrier’s calm body P90 from 73 to 101. The minimum diffuse albedo affected the dark legs as well as the sac. The corrected shader keeps the authored pigment and room cast, applies the hard planes as reductions, and leaves the original mark finish intact. The calibrated thresholds above still select the same planes. The lit multiplier is 0.92 on general body and sac, and 0.74 on Carrier and Matron legs and underside. The narrow edge retains the original local value. Crawler, Spitter and Stalker shadow multipliers are 0.34, 0.38 and 0.32. Carrier and Matron support shadows use 0.40 and 0.45, and both sacs use 0.61. The sacs also attenuate red and green by 2% and 16%. Their raised rear tips receive the same treatment. Pod shells use 0.45, 0.92 and 1.0 with their cores retained.

Registered material and plane masks isolate visible skin from marks, brackets, effects and scenery. Measurements use display RGB and Rec.709 luma coefficients on a 0–255 scale. Each cell below follows the gallery column order.

| Body P90 | Calm, final19 / first / corrected | Swarm Junction, final19 / first / corrected |
|---|---:|---:|
| Crawler | 116 / 116 / 114 | 112 / 114 / 110 |
| Spitter | 95 / 108 / 88 | 93 / 107 / 85 |
| Stalker | 80 / 97 / 76 | 60 / 93 / 56 |
| Carrier | 73 / 101 / 63 | 63 / 95 / 54 |
| Matron | 77 / 101 / 68 | 60 / 96 / 53 |

Stock Swarm Junction has no Matron. The last cell comes from the same crowd with its second Carrier promoted to Matron in all three builds. In the calm frame, Carrier lit-leg median luma is 38 / 89 / 32 and lit-sac median is 70 / 103 / 64. Matron lit-leg median is 51 / 99 / 42 and lit-sac median is 36 / 99 / 32. Median lit-sac HSV saturation went from 30% to 19% to 34% for Carrier and from 23% to 12% to 31% for Matron.

| Corrected P90 | Marine ivory plate | Crawler lit | Spitter lit | Stalker lit | Carrier lit | Matron lit |
|---|---:|---:|---:|---:|---:|---:|
| Swarm Junction | 181 | 112 | 89 | 60 | 56 | absent |
| Relay Racks | 183 | 112 | 86 | 73 | 57 | absent |
| Crew Checkpoint | 186 | 113 | 88 | 80 | 65 | absent |
| Supplemental Swarm | 181 | 112 | 90 | 60 | 59 | 58 |

All five families’ maximum sampled body lumas in calm and Swarm were equal to or below final19. Fixed screen coordinates in the composited images can differ more than the material values. Across nine measured views, 487 of 262,797 body coordinates rose by more than four levels after final antialiasing, with a largest rise of 48. The before-antialiasing display comparison is in `value-work/graded.txt`. The per-region distributions, sample counts and maxima are in `artifacts/nextgen/family35/value-work/luma.json`.

The corrected gallery is `artifacts/nextgen/family35/sheets/index.html`. All 32 subjects have a native crop and a 480×270 frame, in final19 / first pass / corrected order. The marine remains the first actor to draw the eye in all three stock crowds. The weakest views are the console-obscured regular Crawler in its elite pair, the Stalker among the blue Relay Racks machinery and the fallen Matron overlapping the marine in the ragdoll frame. The production build passed after the correction.

## HEAVY37

The heavy shoulder and spinal plates now have clipped corners, a flat crown and a single bevel. The exporter writes the signed-distance plane normal at each plate triangle's centre into its three corners. The underlying skin retains smooth normals. The elite adds a lateral shoulder shingle on each side. The Warden's outer mandibles flank the amber-white throat, and a dark collar sits behind the prow. The existing ground pool still follows the head.

The club elbow sits farther back and outboard. The Brute loads from 78% to 106% over its warning, twists after the wide strike and passes 10% beyond the planted reach before settling. The head drops and the supporting arm hangs during recovery. The Warden progressively compresses about the axis between its planted feet. Its existing charge cycle rocks forward on release and the chest bunches more deeply on impact.

| Lineup measurement | final20 | HEAVY37 |
|---|---|---|
| Public height, regular / elite / Warden (m) | 3.030 / 3.273 / 4.500 | 3.030 / 3.271 / 4.500 |
| Drawn height, same order (m) | 2.80 / 3.34 / 4.40 | 2.87 / 3.35 / 4.41 |
| Native contact radii, same order | 42.90 / 55.77 / 64 | 42.90 / 55.77 / 64 |
| Rig joints and fingerprint | 63 · `144d320c6cae75d7` | 63 · `144d320c6cae75d7` |

The public elite height moved by −0.07% and the settled drawn height by +0.30%. The regular Brute's drawn height increased by 7 cm. The simulation diff against integration revision `29b04dc1` is empty. The measured rig, drawn heights and contact radii are in `artifacts/nextgen/heavy37/{rig.txt,final-lineup/trio.json,simulation.diff}`.

The WARDEN34 connected-component measurement was repeated on the original 1920×1080 frames. Peak is display-space Rec.709 luma on a 0–255 scale. The largest area loss is 14.2% at wall stun. The calm area is 2.7% below final20 at the same peak.

| Warden state | Lit maw pixels, final20 → HEAVY37 | Peak, final20 → HEAVY37 |
|---|---|---|
| Calm | 6,824 → 6,640 | 244 → 244 |
| Charge windup | 3,538 → 3,462 | 244 → 244 |
| Charge | 4,838 → 4,613 | 245 → 244 |
| Wall stun | 3,386 → 2,905 | 243 → 243 |

The [local comparison gallery](../../artifacts/nextgen/heavy37/index.html) links the native crops and 480×270 sheets in `artifacts/nextgen/heavy37/sheets/`. The original final20 gallery provides the left-hand room and lineup images. Release frames and isolated strips use new replays of the archived final20 fixture revision `a5a2c59d`. The horn-hidden silhouette suppresses the added head-bound regalia triangles on the elite for this comparison.

| Sheet (native crop and 480×270) | Visual read |
|---|---|
| Lineup, colour | The Warden's shoulders, back and broad guards form large surfaces. The regular Brute's far guard merges sooner. All three face marks and the marine remain legible. |
| Lineup, greyscale | The white throat and pale skulls separate from the armour. The darkest crown and flank sometimes collapse to one grey. |
| Lineup, silhouette | Rank size and the Warden's low forward head are clear. The two club fighters share a stance. |
| Lineup, horns hidden | The elite has a wider shoulder cap and a squarer outside shoulder. The silhouette difference is modest once the horns go. |
| Brute calm | The near crown and the spine show separate faces. The pale skull reads first. |
| Brute windup | The elbow makes a turn outside the skull. The fist and guard still touch from the frontal angle. The red sector stays clear. |
| Brute recovery | The sloping back and far-wide planted club show the punish window. The low skull is difficult to pick out against the marine at contact in both versions. |
| Brute behind | The back and shoulder crowns can be followed around the rear silhouette. The skull tip peeks beyond them. |
| Brute side | The brow and near shoulder separate well. The far guard hides behind the nearer arm. |
| Elite calm | The wide shoulder shelf sits behind the antler. The pale mark remains distinct. |
| Elite windup | The elbow sits outside the horns and the supporting fist remains level. The horn can cut across the upper arm in projection. |
| Elite recovery | The high back and low near fist make a longer silhouette. Marine overlap conceals part of the near fist and skull. |
| Elite behind | The shoulder cap extends past the back ridge. The horn still gives the quickest rank read. |
| Elite side | The broad guard, shoulder top and dark spinal crown read as separate planes. |
| Warden calm | Prow, bright core and dark outer jaw can be traced into the shoulder. The collar is shortest on the far side. |
| Warden windup | Both square shoulder tops sit above the braced limbs. The dark corners frame the throat inside the red capsule. |
| Warden recovery | The body slumps around the contact point. The outlined marine and stun cue survive the overlap. |
| Warden behind | The back plates give the heading and the warm pool locates the far end. The jaw-to-neck connection is partly occluded. |
| Warden side | The near cheek has a dark edge below the prow. The collar separates the head from the near shoulder. |
| Relay Racks shutter impact | Both native captures show the Warden at the shutter with its mark and stun indicator visible. The HEAVY37 marine is farther from contact. Encounter positions and effects differ between runs. |

| Attack strip and release sheet | Review without warnings or gold recovery arcs |
|---|---|
| Brute | The loaded arm sits outboard and the torso leans through the three warning samples. Release reaches farthest down and forward. Recovery has a higher back, shorter reach and a hanging support arm. The skull can disappear behind the planted elbow. |
| Elite | The same three phases separate. Its broader upper body fills more of the space between the loaded arm and the torso. The new rank shelf is easier to see in colour than black. |
| Warden | The brace, forward thrust and slumped head separate. The compression develops more gradually than final20. Impact and charge are still close together in pure silhouette. |

Native event observations use a 60 Hz step in Crew Checkpoint. Each entry gives milliseconds from encounter start for warning / release / recovery or wall impact / return to approach or end of stun.

| Attack | final20 | HEAVY37 |
|---|---|---|
| Brute swing | 17 / 733 / 850 / 1167 | 17 / 733 / 850 / 1167 |
| Elite swing | 17 / 683 / 817 / 1083 | 17 / 683 / 817 / 1083 |
| Warden charge | 17 / 883 / 1300 / 2800 | 17 / 883 / 1300 / 2800 |

The geometry exports the hard crown and bevel normals through the existing material. A consistently one-pixel, cool key-side rim would need shader work. The current key threshold selects facets by normal and has no screen-space width control. At small scale it sometimes leaves a dark crown and flank at almost the same display value.

| Native Warden cycle sheet | Jaw, weight and player cues |
|---|---|
| Calm | The dark side of the jaw wraps the throat. The shoulder and back each have a broad single top. The rear of the prow meets the collar on the visible side. |
| Charge windup | The near shoulder crown sits above a distinct dark elbow and planted fist. The charge capsule remains visible beyond the foot. |
| Charge | The forward core and prow lead the braced limbs. The jaw-to-neck line is stronger on the outside of the turn. |
| Wall stun | The lit core sits inside the black leading lip. The marine and stun indicator remain visible. The shoulder occludes part of the far jaw. |
| Recovery | The maw remains forward as the torso rolls off the wall. The pool and the marine outline are legible. |

The weakest frames are the regular Brute recovery (low skull behind the marine), the elite windup (horn cuts across the loaded shoulder), and Warden wall stun (the far jaw disappears at this bearing).

The release sheets use compositor captures held on the first native strike tick. Direct canvas readback had returned an earlier frame on one rank and an empty frame on the other. Both ranks show the striking fist beyond the skull on the near side of the marine. In the elite release, the shelf above the planted arm reads more clearly than the elbow beneath it.

The shutter sheet uses Arc because the final20 Breacher gallery has a windup capture only. The HEAVY37 Arc continuation starts from the recorded final20 Arc junction boundary, and captures the native shutter-broken event in Relay Racks. It cleared the ninth room with zero errors.

The production build passed. Standard Breacher cleared all nine requested rooms on seed 1729 with fast stepping and a 180000 ms startup timeout. The [campaign report](../../artifacts/nextgen/playtest/heavy37-final-breacher/report.json) records zero errors. The runner returned exit status 1 for five room loads over five seconds. The additional Breacher impact sheet uses the final20 Arc shutter event at left and the Breacher's own shutter event at right. The marine and maw remain visible amid the Breacher effect, though the boss is nearer the top of the frame.

## SKIN37

The creature finish uses existing material draws. Three waves in skinned rest coordinates make shallow chitin pits, parallel limb grooves and a finer pattern on the sacs. Per-family spacing is a uniform because the K11 skeletons use different asset units. The pattern varies from .84 to 1 in linear diffuse light. Screen derivatives fade it to its mean as the pattern approaches a pixel. Atlas marks, bone and organ light keep their own finish. The key-side silhouette uses a hard grazing-angle step with a derivative-scaled width. Carrier leg ridges get an indigo pick and the forward face of the Matron sac enters its edge step sooner.

The Crawler’s full raptorial claw faces carry the salmon atlas cell so the leading mark is wider than the dorsal stripe. The Spitter’s lime firing lip flares out from the narrower throat. The Stalker opens the inner edge of its right scythe at the wrist and keeps the outer cutting edge in place. A native stand envelope keeps the Stalker’s fit independent of its scythe. The Crawler retains its original claw extent. The three models ship through the K11 Blender build, model optimiser, existing 4.4.2 texture encoder and LOD packer.

| Skin | Joints | Rig fingerprint | Clip fingerprint | Bind extent, final20 → integrated |
|---|---:|---|---|---:|
| Crawler | 46 | `a5106771e5de7166` | `5773d7205d045271` | 1.931424 |
| Spitter | 57 | `d680757ef855e6d2` | `7ed6c55ce6bb5797` | 8.521052 |
| Stalker | 38 | `f5d312e1089e1ba0` | `5b91424497863d14` | 3.998526 |
| Carrier | 73 | `a9960f8e864ca52c` | `b22a85c2a1cb413b` | 18.013543 |
| Matron | 73 | `a9960f8e864ca52c` | `b22a85c2a1cb413b` | 19.179160 |
| Brute | 63 | `144d320c6cae75d7` | `f844c4fcb87f1d8b` | 9.216127 → 8.660892 |
| Warden | 63 | `144d320c6cae75d7` | `f844c4fcb87f1d8b` | 8.088788 → 8.333847 |

The pairwise rig and clip inventory is in `artifacts/nextgen/skin37/contracts.txt`. Sheets are in `artifacts/nextgen/skin37/sheets/`. Left is final20 and right is SKIN37. Walking strips use five consecutive 17 ms frames with final20 above SKIN37. The supplemental boots and walking references use the final20 game build in the same fixtures.

The measurements below use displayed Rec.709 luma on a 0–255 scale. A matched G-buffer pass identifies the ivory marine plate and each family’s lit diffuse plane. The luma samples come from the production PNG. The integrated heavy columns use the crown step. The Warden’s hot maw, Matron’s sac marks and the wind-up outlines are outside the body sample.

| P90 | Marine plate | Crawler | Spitter | Stalker | Carrier | Brute | Matron | Warden |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Swarm Junction | 181 | 111 | 87 | 58 | 55 | 89 | — | — |
| Relay Racks | 183 | 111 | 83 | 71 | 57 | 89 | — | — |
| Crew Checkpoint | 187 | 112 | 85 | 77 | 64 | 92 | — | — |
| Matron calm | 195 | — | — | — | — | — | 76 | — |
| Warden calm | 194 | — | — | — | — | — | — | 83 |

The marine remains the brightest body in all three crowds. The Warden’s emissive maw can exceed his plate locally in its own encounter. This also occurs in final20. Per-room values and registered masks are in `artifacts/nextgen/skin37/planes/luma.txt` and `artifacts/nextgen/skin37/masks/`.

All five brood families retain their final20 public height, posed mesh height and simulation radius to six decimals. The last two rows give the integrated HEAVY37 mesh at the same fixture time. Its public heights, contact radii and GLB rig fingerprints match final20. HEAVY37 supplies the new heavy geometry and presentation poses. Holding the outer .30 asset units of the Stalker bevel fixed preserves its raised apex as the inner edge opens. The measured values are also in `artifacts/nextgen/skin37/heights.txt`.

| Family | Public height (m) | Posed height (m) | Simulation radius |
|---|---:|---:|---:|
| Crawler | .773644 | .997245 | 17.5 |
| Spitter | 1.651721 | 1.586163 | 22.5 |
| Stalker | 1.081849 | 1.516475 | 20.4 |
| Carrier | 1.980371 | 1.798667 | 26.4 |
| Matron | 5.295817 | 5.405493 | 46 |
| Brute | 3.030000 | 2.950337 | 42.9 |
| Warden | 4.500000 | 4.887294 | 64 |

**Pose and crowd review.** Both scales are shown for each pose. The marks stay at least as easy to find as in final20. The reduced images show the large value planes and attack marks without a field of grain. The grooves are easiest to see across a Brute forearm. The small Crawler shell and the Carrier’s shaded feet show much less material detail. The cool rim is retained on all seven families. Its short runs can disappear into the existing silhouette ink at 480×270.

| Sheet subject | Observation |
|---|---|
| Crawler calm | The dorsal stripe locates the animal and the salmon claw gives it a front. |
| Crawler wind-up | Two broad salmon hooks flank the bite indicator. |
| Spitter calm | The flared lime mouth sits between the thin forelimbs. The brighter back still competes with it. |
| Spitter wind-up | The mouth and sightline share an axis. Red covers the centre of the lip. |
| Stalker calm | The blue blade carries the outline. The narrow rear feet recede. |
| Stalker wind-up | The blade stays distinct inside the white warning contour. |
| Stalker waiting | Deck shows between the raised scythe and torso. The opening is small in the reduced frame. |
| Carrier calm | Violet lobes sit above dark support legs. The cool pick catches the upper joints. |
| Carrier wind-up | The extended sac, legs and two forward claws separate in profile. |
| Matron calm | A lit top, darker front flank and short edge describe the sac. Speckle is subtle on its deepest violet. |
| Matron wind-up | The long loaded sac retains its pink seam against the pod circles. |
| Brute calm | Parallel forearm grooves cross broad jade planes. The bone face stays smooth. |
| Brute wind-up | The raised arm carries its grooves into the white warning outline. |
| Elite Brute calm | The horns remain the first rank cue above the textured forearms. |
| Elite Brute wind-up | The loaded fists show grooves and the curved horn span remains continuous. |
| Warden calm | The dark shoulder plates carry pits around the smooth bone prow and hot maw. |
| Warden wind-up | The lit shoulders flank the charge core. The maw is the brightest small patch. |
| Swarm Junction | The marine reads first. Salmon claws pick out biting Crawlers among dark violet Carriers. |
| Relay Racks | The marine reads first. The small blue Stalker remains close in colour to the machinery. |
| Crew Checkpoint | Five family silhouettes stay separate on the lighter deck and the marine leads in value. |
| Ordered crowd | The loaded Crawlers have directional hooks. A Brute can still hide a nearby set of feet. |
| Three Crawlers at the boots | Three native Crawlers surround the marine. The loaded left pair of claws reads at both scales. The right Crawler overlaps the gun. |


| Additional proof | Observation |
|---|---|
| Crawler elite pair | The larger shell and rank brackets identify the elite. The forward salmon hooks separate the bite from the dorsal stripe on both animals. |
| Spitter elite pair | The longer dorsal profile distinguishes the elite. The lime firing lips face the marine at both sizes. |
| Stalker elite pair | The blue bevel separates the blade from the deck on both animals. The small regular retreats into the rack shadow. |
| Carrier elite pair | The pink marks identify both sacs. Brackets and the broad crown distinguish the elite while the dark feet stay subordinate. |
| Brute elite pair | The long bone horns distinguish the elite and the common crown and flank planes remain legible on both bodies. |

| Walking strip | Five consecutive native frames |
|---|---|
| Brute | The grooves travel with the near forearm and pits track the crown as both lift and settle. The dark strip between two plates changes with their overlap. I saw no sliding grain or flashing speckles. |
| Carrier | The fine sac finish stays with the violet lobe as it advances. The larger pink mark remains steadier and easier to follow than the feet. |

### Heavy plate lighting

The integrated Brute, elite and Warden use the HEAVY37 meshes and poses. A unit surface normal with world-up component ≥ .66 takes the crown step. The middle step requires up ≥ −.18 and upper-left key component ≥ .06. The remaining sides and undersides take the shadow step. Linear multipliers are 1.45, .64 and .17 respectively. The maximum equals the BRUTE33 edge gain. The projected width of a key-facing fold comes from the derivatives of its triangle edge coordinate. Coplanar triangles share a surface without a rim along the triangulation. The 1.5-pixel rim shares the crown ceiling.

The A/B crops in `artifacts/nextgen/skin37/planes/ab-{matron,crawler}.png` put the shipping key split on the left and the up-first experiment on the right. On the Matron the up-first split adds a horizontal boundary across the near limb and broadens the cap. The key split follows the long axis of the sac. The Crawler changes little at encounter scale. All five smooth brood skins retain the FAMILY35 key.

| Calm pose, display P90 | Crown HEAVY37 → SKIN37 | Key side | Shadow | Skull | Maw | Marine ivory |
|---|---:|---:|---:|---:|---:|---:|
| Brute | 50 → 92 | 78 → 61 | 29 → 31 | 147 → 147 | — | 195 → 195 |
| Warden | 34 → 83 | 70 → 58 | 25 → 24 | 147 → 147 | 244 → 244 | 194 → 194 |

The same registered plane masks select pixels in the HEAVY37 and SKIN37 production frames. The brighter crown in each lies below the BRUTE33 Crew Checkpoint bright edge (94) and well below the marine plate. Native size, poses and integration fingerprints are recorded in `artifacts/nextgen/skin37/planes/integrated-contracts.txt` and the per-family dimension files under `skin37/masks/`.

| Three-column sheet in `skin37/sheets/planes-*` | Native and 480×270 observations |
|---|---|
| lineup-colour | The jade tops and vertical walls separate on all three heavies. The Warden’s dark underside carries the jaw. The marine’s ivory exceeds every jade plane. |
| cycle-calm | Several stepped crowns can be counted behind the prow. The far wall is dark and the near wall catches the key. The hot mouth remains the brightest point. |
| cycle-charge-windup | The leading crown and two shoulder tops make a staggered row into the capsule. The near elbow is darker and the dark underside separates the arm from the chest. |
| brute-windup | The loaded arm shows a crown and a shaded inner wall beside the skull. The pale attack contour and marine plate remain brighter. |
| brute-release | The extended fist shows a light upper surface and dark end cap. The supporting arm remains separate. The marine reads through the overlap. |
| brute-recovery | The dorsal top remains legible above the long shadow flank. The marine and gun cover much of the low skull. |
| swarm-junction | Separate tops and dark walls survive on the two forward Brutes. The smallest distant arm reads as two values. The marine remains the brightest body in the pack. |

The three weakest frames are Brute recovery (the weapon obscures the low skull), the waiting Stalker at 480×270 (only a narrow deck gap survives) and the three-Crawler boots frame (the right-hand bite end overlaps the marine’s gun).

### Desktop run

Crew Checkpoint, Pyro, fixed resolution, 300 simulation ticks per tier. The three columns within each measurement are final20 / HEAVY37 / integrated SKIN37. CPU submit is the benchmark’s render-submission time, measured on the shared host.

| Tier | Draws, median | Draws, peak | Combat shader compiles | CPU submit median (ms) | CPU submit P95 (ms) |
|---|---|---|---|---|---|
| High | 134 / 134 / 134 | 144 / 144 / 144 | 0 / 0 / 0 | 10.2 / 7.5 / 7.7 | 59.5 / 66.5 / 159.7 |
| Low | 124 / 124 / 124 | 131 / 131 / 131 | 0 / 0 / 0 | 7.6 / 6.7 / 7.0 | 10.2 / 38.5 / 108.6 |

HEAVY37 and SKIN37 also match on minimum, P95 and mean draw calls for both tiers. Compared with final20, their means are higher by one draw across 37 samples. The integrated P95 submit time increased on both tiers. The captures and campaign shared the machine during the run, so these timings include host contention. Reports are in `artifacts/nextgen/{skin37-fixed-before,skin37-heavy-control,skin37-integrated}/benchmark.json`.

The final production build passed. Arc, seed 1729, cleared all eight rooms with zero errors and zero runner defects in the isolated replay (`artifacts/nextgen/playtest/skin37-solo-arc/report.json`). An earlier replay during the gallery captures also cleared eight rooms with zero runtime errors, but recorded slow room preparation in Passenger Vault and Residential Gallery. The review index links all 37 native sheets and all 35 reduced sheets. The two motion strips are native only.

## POSE38

The loaded Brute now points its upper arm outboard and folds its forearm back across the deck. The motion generator uses the sculpted shoulder, elbow and fist centres to orient the striking side. It keeps the opposite knuckles planted, counterturns the skull toward the marine and moves the elbow back through the warning. Both ranks share the take. The release blends out of the hook in the opening 43% of the strike, sweeping into HEAVY37's wide plant. The first strike tick therefore shows the fist travelling. The native red sector still switches at that tick.

| Attack | Read at 480×270 | Remaining overlap |
|---|---|---|
| Brute swing | The shoulder starts at the chest, the elbow makes the outside corner and the fist ends the returning forearm. Floor is visible inside the open bend. Frame 09 in the reviewed Crew Checkpoint sequence shows this at the same 1417 ms in both builds. | The fist and its guard read as one club. At contact the marine can cover the low skull. |
| Elite swing | The same three landmarks and floor opening survive the wider shoulder shelf. The horn crosses the inner edge but leaves the outside elbow visible. | The horn partly hides the arm root in frontal windup. |
| Warden charge | The shoulder tops lead to two planted forelimbs with a floor wedge between them. The square lower jaw now projects ahead of the light, and the cheeks frame the throat on release, in charge and at wall stun. | At wall stun the far cheek is thinner in projection than the near cheek. |

The Warden's lit area was measured using the WARDEN34 native-resolution connected-component method. Peak is Rec.709 display luma on a 0–255 scale.

| State | Lit area, final21 → POSE38 (pixels) | Peak, final21 → POSE38 |
|---|---|---|
| Calm | 6,630 → 6,805 | 244 → 244 |
| Charge windup | 3,462 → 3,458 | 244 → 243 |
| Frontal release | 7,043 → 7,061 | 245 → 245 |
| Charge | 4,654 → 4,641 | 244 → 244 |
| Wall stun | 3,030 → 3,047 | 243 → 242 |

The Carrier and Matron front hooks already spread across the floor projection as the sac rises. The Crawler's raised rear remains distinct from its two cocked front hooks. The Spitter's melee load and ranged aim keep the lime mark forward, and the Warden compresses between its planted braces. The Stalker's blade was retained. The audit found no additional upright club-like overlap requiring a new take.

| Attack | final21 (ms) | POSE38 (ms) |
|---|---|---|
| Brute | 17 / 733 / 850 / 1167 | 17 / 733 / 850 / 1167 |
| Elite Brute | 17 / 683 / 817 / 1083 | 17 / 683 / 817 / 1083 |
| Warden | 17 / 883 / 1300 / 2800 | 17 / 883 / 1300 / 2800 |

These are the first observed warning, strike or charge, recovery or impact, and return to approach or end of stun in the staged native 60 Hz encounter. Each build uses its own runtime. The simulation diff against final21 fixture head `bc56c43c` is empty.

| Lineup measurement | final21 | POSE38 |
|---|---|---|
| Public height, Brute / elite / Warden (m) | 3.030 / 3.271 / 4.500 | 3.030 / 3.271 / 4.500 |
| Drawn height (m) | 2.87 / 3.35 / 4.41 | 2.87 / 3.35 / 4.41 |
| Native contact radii | 42.90 / 55.77 / 64.00 | 42.90 / 55.77 / 64.00 |
| Skeleton | 63 joints · `144d320c6cae75d7` | 63 joints · `144d320c6cae75d7` |

The [local proof gallery](../../artifacts/nextgen/pose38/index.html) links native crops and 480×270 sheets. The floor-free strips sample warning onset, midpoint and 98%. The room images retain the marine, floor warnings, boss indicator and health bars. The waiting-pack images sample a native Brute with waiting engagement and no attack slot. Capture receipts and raw sources are under `artifacts/nextgen/pose38/` and the sibling pose capture folders.

The weakest poses are elite frontal windup, regular melee recovery against the marine, and Warden wall stun viewed across its far cheek.

The six-tick sweep sheets hold the camera on the first 83 ms of native strike. At onset the regular fist is still outboard. At +17 ms it is crossing forward, and by +33 ms it reads as a wide plant beside the marine. The red strike cue and underlying hit window begin on the same tick as final21.

The production build passed. Standard Breacher cleared nine rooms through Relay Racks on seed 1729 with fast stepping and a 180000 ms startup timeout. The runner exited 0 with zero errors and zero recorded defects. [Campaign receipt](../../artifacts/nextgen/playtest/pose38-final-breacher/report.json)

## PALETTE38

The five brood families share a desaturated violet-black carapace. The existing atlas supplies its value differences, and the SKIN37 normals, stepped key and filtered hide describe the surface. Carrier and Matron sac tissue keeps 72% of its original chroma at 76% of its former linear diffuse value. A key-side rim lifts the contour. The palette and organ paint use the existing skinned mesh draw and the native status-finish switch.

The Crawler carries a rose stripe and hooks. The Spitter’s yellow-green lip connects to a narrow dorsal line. The Stalker’s ice-blue blade, head, upper back and shoulder remain marked through the folded pose. The Carrier has pink-violet sac seams and upper joint lights. The Matron adds oblique seams across the enlarged sac. Gold elite trim retains its atlas cells. The existing heavy shader and heavy assets are outside the change.

The standard competent simulator cleared **9/12 Cryo and 9/12 Arc**, matching the lead’s baseline. The simulator uses the game state and does not sample the rendered colours. Seeds were 7, 11, 23, 99, 256, 512, 1024, 2025, 4096, 6561, 9001 and 65537.

The folded Stalker was the limiting silhouette. Its shoulder and dorsal stripe extend the blade colour onto the upper body. A soft blue spill uses its existing ground-contact instance. Native Blackout contact and warning treatment retain priority. On the dark Relay deck most folded-blade pixels still lie in the contour, so the floor light does much of the work. The matched native frozen Crawler is visibly paler across its shell and keeps its cold hit indicator; see `artifacts/nextgen/palette38/frozen.png`.

| 480×270 crowd | Crawler | Spitter | Stalker | Carrier | Visual read |
|---|---:|---:|---:|---:|---|
| Swarm Junction | 10/10 | 2/2 | 3/3 | 2/2 | The red sector leads from the marine. The lower blue spill separates the folded scythe from the purple deck. |
| Relay Racks | 10/10 | 2/2 | 3/3 | 2/2 | The marine leads among the actors. The upper-right Stalker still crosses the bright rack. Locating that blade takes a second look. |
| Crew Checkpoint | 10/10 | 2/2 | 3/3 | 2/2 | The marine stands out inside the red arc. Pink hooks and dorsal stripes stay inside the small animal silhouettes. |
| Ordered Swarm | 10/10 | 2/2 | 3/3 | 2/2 | The facing ranks show the bite ends and blades more clearly. The marine and red warning remain distinct in the central overlap. |
| Three Crawlers at the boots | 3/3 | — | — | — | The marine reads first. The left wind-up and lower bite are clear. The right hooks overlap the gun. |
| Infested Workshop | 10/10 | 2/2 | 3/3 | 2/2 | The marine leads against the violet floor. Lower Stalker spill separates from the deck, while distant rear-facing Crawler hooks are tiny. |
| Transmission Chamber | 10/10 | 2/2 | 3/3 | 2/2 | The two blue spills along the left floor separate the Stalkers from the adjacent Crawlers. The marine and red attack sector lead in the centre. |

Counts are visually identified / fixture actors. The staged Swarm Junction and Crew Checkpoint rows use the same native 20-enemy fixture as their stock crowd rows. Each full crowd also contains three jade Brutes. The brood reads as one dark species in all seven scenes; red keeps its area-warning shape. A glance locates the family groups, but exact enumeration of all twenty actors takes a deliberate scan. The proof includes native crops and 480×270 full frames in colour and greyscale under `artifacts/nextgen/palette38/sheets/`.

Display luma uses Rec.709 weights on the production screenshot. A separate registered G-buffer capture identifies mark pixels, the lit body plane and ivory marine plate. Mark coverage divides visible mark pixels by all visible pixels of that family. Floor spill, warning sectors and marine plate fall outside the mark denominator.

| Crew Checkpoint calm | Mark area | Mark median | Lit body P90 | Marine plate P90 |
|---|---:|---:|---:|---:|
| Crawler | 15.5% | 158 | 91 | 194 |
| Spitter | 16.8% | 162 | 68 | 195 |
| Stalker | 36.5% | 139 | 56 | 194 |
| Carrier | 19.5% | 122 | 55 | 195 |
| Matron | 12.2% | 119 | 55 | 195 |

The Stalker exceeds the 12–20% guide in the calm profile, where the whole blade is exposed. Folded Stalkers in the five unordered crowds expose only 7–8%. The broad calm blade and the floor spill in the folded pose preserve both reads. Body and mark measurements for every crowd are in `artifacts/nextgen/palette38/measure.tsv`. The weakest frames are Relay Racks (blade against machinery), Infested Workshop (rear-facing bite ends) and the boots close-up (gun over the right claw).

Crew Checkpoint combat, Cryo, fixed 300 ticks per tier, gave the following draw counts and combat program creations. Both builds used the same measured encounter.

| Tier | Draws median, final21 → PALETTE38 | Draws peak | Combat shader compiles |
|---|---:|---:|---:|
| High | 134 → 134 | 139 → 139 | 0 → 0 |
| Low | 124 → 124 | 130 → 130 | 0 → 0 |

The production build passed. Benchmark reports are under `artifacts/nextgen/palette38-{before,shipped}-profile/benchmark.json`.

Native Cryo, seed 1729, cleared eight rooms with zero errors and zero runner defects in `artifacts/nextgen/playtest/palette38-replay/report.json`. The preceding eight-room clear had zero runtime errors and one 5.38-second Passenger Vault loading observation. The replay passed that room without a loading defect.

### PALETTE38 mark revision

The Crawler carries a tapered hot coral-pink dorsal stripe, separate biting hooks and a soft fuchsia floor pool. The Spitter’s lime spine meets its mouth. The Stalker’s shoulder and blade use the ice-blue spill, and Carrier and Matron seams and joint marks spill violet. Each living brood actor reuses its existing contact instance. Blackout retains its original contact cues. HDR organ emission feeds bloom; the brood mark has its own geometry region to retain chroma through the filmic grade. The surrounding carapace and sac keep the first-pass pigment.

The table reads **final21 / PALETTE38 first pass / revised**. Mark luma is median displayed Rec.709 Y (0–255). Saturation is median displayed HSV saturation. Area is the percentage of that family’s visible pixels belonging to its mark. A separate matched geometry-ID capture identifies the original atlas mark cells or revised marked surfaces; all colours come from the unmodified production frames.

Local contrast is measured per actor: mean Y of its brightest 10% of visible pixels minus median Y of floor pixels within two projected body widths of its visible bounds. The family value averages those actor differences. Floor samples exclude props and actors and include the actual floor spill. This proxy measures visual separation; there was no timed observer trial. The two stock crowds contain regular Carriers. The Matron uses a supplemental matched calm encounter in each room.

| Room | Family | Mark luma | Mark saturation (%) | Mark area (%) | Local contrast |
|---|---|---:|---:|---:|---:|
| Crew | Crawler | 169.7 / 149.7 / 175.9 | 34.3 / 23.5 / 39.2 | 17.9 / 17.9 / 26.6 | 97.8 / 79.3 / 102.4 |
| Crew | Spitter | 180.6 / 136.8 / 211.1 | 30.3 / 32.1 / 48.6 | 13.2 / 14.5 / 14.6 | 138.4 / 107.0 / 163.2 |
| Crew | Stalker | 41.6 / 99.1 / 162.4 | 27.8 / 35.0 / 55.3 | 6.4 / 8.4 / 10.1 | 69.1 / 69.4 / 111.0 |
| Crew | Carrier | 114.7 / 120.6 / 175.1 | 29.3 / 23.8 / 41.6 | 14.7 / 17.3 / 23.3 | 85.9 / 91.5 / 148.1 |
| Crew | Matron | 134.6 / 119.2 / 181.3 | 28.9 / 25.7 / 39.2 | 2.6 / 12.2 / 27.3 | 59.1 / 83.3 / 140.5 |
| Swarm | Crawler | 160.9 / 141.1 / 172.6 | 35.8 / 24.1 / 40.7 | 18.2 / 18.2 / 27.0 | 123.3 / 104.5 / 127.6 |
| Swarm | Spitter | 177.5 / 131.3 / 206.7 | 31.4 / 33.9 / 50.3 | 13.3 / 14.6 / 14.7 | 142.7 / 109.7 / 166.0 |
| Swarm | Stalker | 23.5 / 38.6 / 80.9 | 39.4 / 39.4 / 60.7 | 5.9 / 7.1 / 8.3 | 73.9 / 75.1 / 105.5 |
| Swarm | Carrier | 112.7 / 119.4 / 170.6 | 32.2 / 26.0 / 43.1 | 14.4 / 17.0 / 23.0 | 87.3 / 94.1 / 146.6 |
| Swarm | Matron | 103.2 / 118.5 / 181.3 | 37.2 / 26.8 / 39.6 | 1.4 / 6.9 / 27.7 | 57.0 / 74.5 / 154.4 |

The seven-frame gallery is in `artifacts/nextgen/palette38b/sheets/index.html`. Each native crop has three columns. The colour and greyscale 480×270 files each show the revised full frame. Counts below are identified/fixture. Each full crowd also has three jade Brutes.

| Frame | Crawler | Spitter | Stalker | Carrier | Crawler read at a glance, colour at 480×270 |
|---|---:|---:|---:|---:|---|
| Crew Checkpoint | 10/10 | 2/2 | 3/3 | 2/2 | Yes. The facing and rear-facing animals both break into distinct pink marks or pools. |
| Swarm Junction | 10/10 | 2/2 | 3/3 | 2/2 | Nine immediate, including all three below and right of the marine. The tenth pink mark overlaps the mechanical arm and can look like a lamp until its hooks are resolved. |
| Relay Racks | 10/10 | 2/2 | 3/3 | 2/2 | The unoccluded pink marks read immediately. The Crawler crossing the rack needs its outline to confirm it. |
| Ordered Swarm | 10/10 | 2/2 | 3/3 | 2/2 | Yes. The coral mark and paired hook distinguish all ten, including the central overlap. |
| Three at the boots | 3/3 | — | — | — | Yes. The right mark clears the gun enough to locate the third animal; part of its hook remains behind the weapon. |
| Infested Workshop | 10/10 | 2/2 | 3/3 | 2/2 | Yes. The pink pools and hooks show the little rear-facing animals against the violet floor. |
| Transmission Chamber | 10/10 | 2/2 | 3/3 | 2/2 | Yes. The lower group separates into individual pink marks between the blue Stalker pools. |

The marine and red sector remain distinct in all seven. The bruise-dark bodies still read as one brood. The large violet Carrier on the left of the ordered frame is the strongest competing accent. Greyscale removes the pool-hue cue and leaves the elongated stripe, paired hooks and sac shapes to distinguish the families. The weakest frames are Swarm Junction at the mechanical arm, Relay Racks at the rack crossing, and the boots frame at the right-hand gun overlap.

The production build passed. Crew Checkpoint, Cryo, fixed 300 ticks on both tiers recorded zero combat shader compiles. Median/peak draws were 134/139 on High and 124/130 on Low in all three versions. The native Cryo campaign (seed 1729) cleared 8/8 rooms with zero errors and zero runner defects. The repeated standard competent cohorts cleared 9/12 Cryo and 9/12 Arc. Reports are in `artifacts/nextgen/palette38b-profile/benchmark.json`, `artifacts/nextgen/playtest/palette38b-cryo/report.json` and the two simulator logs in `artifacts/nextgen/palette38b/`.


### Lead tuning after PALETTE38

The revised marks made the Carrier and Matron sacs read as magenta lamps that pulled the eye before the marine. The lead reduced the Carrier mark emission from (3.1, .005, 1.55) to (1.75, .012, .95), narrowed the sac's lit seams from 65% to 30% of each stripe period, and lowered the floor-pool alpha from .29 to .19. Crawler, Spitter and Stalker marks are as delivered.

## HEAVY39 — heavies rebuilt from curved shell bands

Base `49be7426`. I changed `tools/assets/k11-creatures/{sdf,brute,warden,build}.py`, one rule in `src/render/vfx/ActorSurface.ts` and the packed `tyrant.glb` (and `plain/tyrant.glb`). I did not touch the skeleton, the clips, the simulation, the `GraphicSurface.ts` heavy block, the declared fit constants or the small families' `BROOD_PLANES`.

### The method

The armour is no longer made of boxes and blobs. It is made of **shell bands**: `sdf.ShellBand` is a section of an ellipsoid shell. It has a real thickness, real curvature across the body and along it, a rounded bevel on every edge, and an optional thicker front lip. Its parameters are the crown point, the frame (x toward the head, z out of the back), the ellipsoid radii, the half-length along the spine, how far down the flanks it wraps (`drop`), and the thickness, bevel and lip. It subclasses `Carapace`, so the exporter knows it is armour. `build.py` gives every corner of a band triangle the analytic gradient of that band, not one normal per face. The light therefore turns smoothly across the curve, and the bevels still turn sharply enough to catch the key rim. The surface stays inside the SDF → OpenVDB → flat-cell pipeline, so zones, bone weights and plate ids still come from the primitive that wins at each point. I did not write a separate Blender mesh path.

How each band sits on the back: `brute.band(c, angle, …)` places a band at a spine crown, with its pitch set **18° steeper than the spine** (`TIP`). Its front edge therefore stands proud of the band ahead, and its rear edge tucks under the next band. The step casts a dark overlap line that the plane shader picks up. A `Tube` runs through all the crowns as the spine ridge. To extend this to another family: lay out crowns along its spine as `(x, z, spine angle, lateral radius, vertical radius, drop)`, call `back()`, and give everything underneath the `UNDER` plate id.

Zones: plate `66` (`UNDER`) maps to the atlas `plate` cell. It covers the underbody, neck, upper arms, thighs, elbows, wrists, knee and foot pads, the knuckles and the Warden's teeth. Plates `70–79` map to the jade `flesh` cell: bands, caps, forearms, guards, fists, skull lobe and spine ridge. Bone (`lead` = `bruteFace`) covers the skull plate, the horns and the Warden's prow and sail (`450/451`). The single shader change: in `ActorSurface.ts` the plate cell now multiplies the heavy jade by **.18** for all three heavies. It replaces the bind-space forelimb knuckle test and the old .96/.30 split. The light-by-plane thresholds in `GraphicSurface.ts` are unchanged.

### What each heavy is made of

- **Brute**:
  - A dark underbody of four smooth lobes (chest, hump core, waist, hips).
  - Four jade dorsal bands from the withers to the hips, with a spine ridge.
  - A curved shoulder cap over each deltoid that overlaps the first band.
  - Each forelimb is one chain, rigid on `shoulder.{l,r}` at POSE38's `club_hook` centres (shoulder `(.30, 1.70, 6.90)`, elbow `(-.21, 3.28, 6.02)`, fist `(2.15, 3.00, 4.57)`). In order: dark upper arm, dark elbow, jade forearm (thickening toward the wrist) with one guard band, dark wrist, jade fist, and two dark weight-bearing knuckles.
  - Hind legs: dark thigh, dark knee, jade shin, dark foot.
  - A narrow dark neck (r .66→.52, against a .92 head half-width and 1.7 shoulder offset). The skull lobe and dark jaw sit forward of it, under the accepted bone arrowhead with its eye slits. The arrowhead moved .30 forward to open the neck.
- **Elite**: the same body plus the regalia part: the two swept horns (unchanged), a keel band along the first three crowns and a broader shoulder mantle band on each side.
- **Warden**:
  - A longer, lower dark underbody.
  - Five bands under a **sail of four bone blades**: tapered flat prisms raked back, tallest over the withers. The sail sets the top.
  - Heavier forequarters on the same chain plan, rigid on `chest` as before.
  - The head is built around the jaw: a short jade upper jaw with a small bone prow behind the light, a dropped dark lower jaw, two jade cheek hinges, the lit `warden-ram` throat pushed forward and up past the upper jaw (narrower, taller), and two dark teeth bars across the top of the light.

### Measurements

| | final21 | HEAVY39 |
|---|---|---|
| Public height, Brute / elite / Warden (m) | 3.030 / 3.271 / 4.500 | unchanged by construction (declared fit constants and `WARDEN_STATURE` untouched) |
| Drawn height, lineup (m) | 2.87 / 3.35 / 4.41 | 2.84 / 3.33 / 4.40 (−1.0% / −0.6% / −0.2%) |
| Drawn width × depth (m) | 1.81×2.19 / 2.41×2.93 / 4.24×3.65 | 1.92×2.03 / 2.56×2.71 / 4.31×3.65 |
| Contact radii | 42.90 / 55.77 / 64.00 | 42.90 / 55.77 / 64.00 |
| Rig | 63 · `144d320c6cae75d7` | 63 · `144d320c6cae75d7` |
| Clips | `brute-motion.glb` | byte-identical (no diff) |
| Rest top / radial, design units (Brute body, Warden) | 9.08 / 5.04, 8.58 / 5.94 | 9.10 / 4.92, 8.73 / 5.84 |
| Triangles base / elite / boss | 11500 / 12850 / 19900 | same budgets |

`git diff 49be7426 -- src/game src/DepthGame.ts` is empty.

The Warden's lit maw uses the largest connected component of display luma ≥ 200 that holds warm pixels, measured on the native `i13-native` cycle frames (`artifacts/nextgen/heavy39/maw.mjs`). This heuristic does not reproduce POSE38's absolute counts, so only compare the two columns with each other.

| State | Area final21 → HEAVY39 (px) | Peak |
|---|---|---|
| Charge windup | 846 → 1208 | 244 → 243 |
| Charge | 2633 → 2366 | 244 → 245 |
| Wall stun | 1297 → 300 | 243 → 201 |
| Recovery | 861 → 854 | 204 → 203 |

Calm is not resolved by this heuristic in either build. In the calm sheet the white core is visible and somewhat smaller.

### Proof

Sheets are in `artifacts/nextgen/heavy39/sheets/`. Each `<name>-native.png` is final21 | now, cropped to the heavy's jade bounds; each `<name>-480.png` is the current full frame at 480×270. They cover:

- `heavies-{colour,grey,silhouette}`;
- `{brute,elite-brute,warden}-{calm,windup,release,recovery,behind,side}`;
- `brute-{frozen,chilled,burning,shocked}`;
- `crowd-{swarm-junction,relay-racks,crew-checkpoint}`;
- `warden-cycle-{calm,charge-windup,charge,wall-stun,recovery,death,ragdoll}`.

Scripts: captures `artifacts/nextgen/heavy39/cap.sh` (final21's `capture-fixtures.mjs` copied into `artifacts/nextgen/final21/`, one scenario per invocation, plus `i13-native.mjs --cases=warden`), the loop `loop.sh`, sheets `sheets.mjs`. The game-pitch eight-heading clay and silhouette previews are `artifacts/nextgen/heavy39/look{1,2}/`.

### Still weak

1. The shell bands read as stripes across the back, not yet as crisp separate plates. The hide finish and the curved crown step mottle the lit jade, and at 480×270 the bands merge into one lit back. The overlap shadow is thin. A slightly larger `TIP` or lip, or a darker underbody showing between bands, would help.
2. The underbody is near-black in pigment (×.18), but under the 1.45 crown gain a top-facing underbody patch lands near shaded jade. The "dark underbody, light plates" split is clearest on the flanks and the neck, and weak on top-facing surfaces.
3. Warden wall stun: the throat faces the wall and its lit area dropped from 1297 to 300 px (peak 243 → 201). Charge and windup are back to final21.
4. The elite's keel band shows little with the horns hidden. The broader mantles carry most of the difference.
5. In the status fixtures, chilled and frozen Brutes are pale teal with frost, as in final21. The frost now outlines the arm chain and the bands, where final21 showed rectangular blocks. Burning and shocked keep their effects on top.

### Runs

The production build passed (`npm run build`). Standard Breacher, seed 1729, nine rooms through Relay Racks with `--fast` and a 180000 ms startup timeout: exit 0, zero errors (`artifacts/nextgen/playtest/breacher-1729/`). I re-rendered the title cast and creature cards with `title28.sh`; the title now shows the Warden's bone sail against the breach.

## HEAVY40 — Warden punish window and dorsal shell overlap

The Warden now retracts and turns its head as the ram stops, rolls the throat toward the camera and lets the lower jaw hang on its own joint. The existing 100 ms wall-stun clip carries the recoil. Its last pose follows the existing 240 ms visual return. The throat material has an amber border around a white core. The small ground pool follows the head.

Three crowns cover each Brute's spine and three sit beneath the Warden's sail. Each crown has a dark shell beneath the front bevel. In the native calm captures a horizontal transect through the Brute's overlap at y=304 crosses 5 dark pixels at x=768–772. On the native Warden side view at y=470 the two dark inter-plate spans at x=332–354 and x=409–439 measure 23 and 31 pixels. These are projected widths on those transects, using green channel <35. A four-crown Warden trial made the rear overlaps too close to the sail at 480 × 270. The final three-crown profile gives the middle flank a distinct outer edge. The comparison is in `artifacts/nextgen/heavy40/trial/compare.png`. The elite has a split fan at the rear of the rib cage. Its two lobes break the hind contour in the hornless silhouette.

### Maw measurements

The columns use HEAVY39's full-frame, four-connected component method on the same native Crew Checkpoint fixture. Each cell gives area in pixels / peak Rec.709 display luma on a 0–255 scale. The component must be at least 200 luma with more than 15% warm pixels. The final column identifies what the measure actually picked.

| Native state | final21 | HEAVY39 | HEAVY40 | Interpretation |
|---|---:|---:|---:|---|
| Calm | 5 / 229 | 3 / 210 | 8,699 / 248 | Both earlier white cores fail the warmth filter. |
| Charge windup | 846 / 244 | 1,208 / 243 | 5,720 / 246 | Throat in all three. |
| Charge | 2,633 / 244 | 2,366 / 245 | 6,831 / 248 | Throat in all three. |
| Wall stun | 1,297 / 243 | 300 / 201 | 8,651 / 247 | HEAVY39's accepted component was outside the mouth. |
| Recovery | 861 / 204 | 854 / 203 | 9,752 / 248 | Both earlier white cores fail the warmth filter. |
| Death receipt | 661 / 206 | 653 / 207 | 661 / 206 | The historical method selects off-body light. A small crescent of throat is visible beyond the foreleg. |
| Settled ragdoll | 498 / 205 | 498 / 205 | 498 / 205 | All three pick the same off-body light. The settled corpse hides the throat. |

A second check located the bright component at the head and counted connected pixels at the same 200-luma threshold without the warm-fraction exclusion. At calm the three throats measure 4,753 / 244, 4,228 / 244 and 8,699 / 248. At wall-stun the corresponding results are 1,297 / 243, 1,519 / 243 and 8,651 / 247. At recovery they are 3,869 / 244, 3,797 / 244 and 9,752 / 248. The historical 300 / 201 understated the HEAVY39 wall-stun throat.

Four additional fixed-step samples check the intervening poses. At 25% and 50% of the native stun, HEAVY40 reads 10,676 / 248 and 10,792 / 247. At 50 and 117 ms into the 240 ms turn back to the marine it reads 8,851 / 248 and 6,015 / 247. The corresponding final21 warm-component readings are 256 / 201, 258 / 201, 874 / 203 and 866 / 202. The head-local check and intermediate captures are in `artifacts/nextgen/heavy40/{brightest.mjs,early.txt,sampling/}`.

### Rig, fit and attack clocks

Order within each height and radius cell is Brute / elite Brute / Warden. Public heights were read from the live models. Drawn heights come from the posed meshes in the native lineup.

| Measurement | final21 | HEAVY39 | HEAVY40 |
|---|---|---|---|
| Public height (m) | 3.030 / 3.271 / 4.500 | 3.030 / 3.275 / 4.500 | 3.030 / 3.265 / 4.500 |
| Drawn height (m) | 2.87 / 3.35 / 4.41 | 2.84 / 3.33 / 4.40 | 2.81 / 3.33 / 4.41 |
| Native contact radius | 42.90 / 55.77 / 64.00 | same | same |
| Rig | 63 joints, `144d320c6cae75d7` | same | same |

The elite public height decreased 0.32% from HEAVY39. All 38 animation durations match. The simulation diff against HEAVY39 is empty, as is the simulation diff from final21 to HEAVY39. The event times below are milliseconds from staging, in warning / release / recovery / ready order. Evidence is in `rig.txt`, `clip-times.txt`, `timings/manifest.json`, `final/heavies/trio.json` and `simulation.diff` under the HEAVY40 proof directory.

| Attack | Previous | HEAVY40 |
|---|---|---|
| Brute swing | 17 / 733 / 850 / 1167 | 17 / 733 / 850 / 1167 |
| Elite swing | 17 / 683 / 817 / 1083 | 17 / 683 / 817 / 1083 |
| Warden ram | 17 / 883 / 1300 / 2800 | 17 / 883 / 1300 / 2800 |

### Sheet review at 480 × 270

Open `artifacts/nextgen/heavy40/sheets/index.html`. Each thumbnail is the complete current frame. Selecting it opens the native crop in final21 | HEAVY39 | HEAVY40 order. Counts below refer to dorsal crowns I could separate in the full frame. The shoulders, fan and pale sail are excluded. An approximate count means that a boundary disappears under another mass at that heading.

| Pose sheet | Brute | Elite Brute | Warden |
|---|---|---|---|
| Calm | Three crowns above the skull. | Two clear crowns and a partly horn-covered third. | Three broad flanks beneath the sail. Maw at the left end. |
| Windup | Two clear crowns behind the lowered skull. The hook and red arc read independently. | Two clear crowns. The fan and horns frame the raised arm. | Three transverse steps along the sail. Maw centered between the planted limbs. |
| Release | Three crowns across the back above the strike arc. | Three crowns behind the extended fist. | Three steps, with the rear one shallow. Maw points down the lane. |
| Recovery | Two clear crowns as the skull drops alongside the marine. | Three steps seen obliquely above the limp arm. | Two clear flanks. The marine crosses the near shoulder, with the throat visible below him. |
| Behind | Two clear crowns. The third merges with the far shoulder at this scale. | Two clear crowns between the horns and tail fan. | Three flank steps. Maw visible beyond the near shoulder. |
| Side | Three crowns step up from the pale skull. | Two clear crowns. Fan and horn overlap the third. | Three clear flanks below the sail. Maw at the right end. |

| Other sheet | Read in the full frame |
|---|---|
| Lineup, colour | Roughly three / two / three crowns across the ranks. Skull, horns and throat are distinct, and the marine's silhouette stays clear. |
| Lineup, greyscale | The dark steps survive desaturation. The elite's horn covers the near crown, and the Warden's throat remains the brightest mark. |
| Lineup, silhouette | Interior crowns disappear in the black fill. The Warden's sail and long jaw break the contour. |
| Lineup, horns hidden | The elite still has a two-lobed rear fan visible against the floor. The regular has a rounded rump. |
| Swarm Junction crowd | Two or three crowns on the nearer Brutes. The backmost is too small to count cleanly. Skull marks, small creatures and the red sector remain distinct. |
| Relay Racks crowd | Two or three crowns on the lower pair. The upper Brute's flank merges with the rack edge. The marine and sector remain visible. |
| Crew Checkpoint crowd | Two or three on the near pair. The backmost reads by its skull and hind silhouette. The marine and sector are clear. |
| Native Warden calm | Three flank plates below the sail. The white throat is easy to locate at the right. |
| Native Warden windup | Three plates on the diagonal. The throat points into the red capsule, clear of the marine. |
| Native Warden charge | Three flank plates on the near side. White core and amber rim remain visible during the drive. |
| Native Warden wall stun | Two flanks visible. The recoiled throat is exposed at the upper left. The pale stun indicator and marine outline remain visible. |
| Native Warden recovery | Two clear flanks in the overlap with the marine. The throat is open on the left side of the body. |
| Native Warden death receipt | Foreleg crosses the throat as the corpse rolls. A bright crescent remains at the left edge of the head; the flanks are obscured. |
| Native Relay Racks shutter impact | The throat points toward the bottom of the frame against the shattered warm floor. Two crown edges are clear beside the sail. The marine, stun marks and shutter callout stay readable. |
| Native Warden settled ragdoll | The underside faces the camera. The plates and throat are occluded. This is a settled corpse, with no remaining punish window. |

The red telegraphs, skull marks, health bars and marine retain their previous reads in these comparisons. The native Warden overlaps the marine at impact in all three revisions. The fractional crown counts describe actual occlusion and viewing distance. The new geometry improves the separations but does not deliver a complete plate count from every heading.

### Delivery and remaining weaknesses

The final production build passed. The native Breacher campaign cleared nine rooms with seed 1729, fast stepping and the 180000 ms startup timeout. It recorded zero errors and a shutter-break receipt in Relay Racks. The playtest's room-entry hold messages include machine load. The final logs are `artifacts/nextgen/heavy40/{build-final.log,playtest-final.log,title-final.log}`. The existing title28 pipeline regenerated the title cast and creature cards in `public/assets/ui/`. The proof index links 33 three-revision native sheets and 33 current full frames.

The three weakest frames are the settled ragdoll (the floor-facing jaw disappears), elite side (the horn crosses a crown even though the tail fan identifies the rank), and the Relay Racks crowd (the rear Brute sits against a rack of similar value). In early recovery the marine can overlap the throat briefly as the head turns. The marine's outline remains visible in the 117 ms sample.

## HEAVY41 — articulated jaw, supports and heavy palettes

The Warden's throat is a short transverse emissive surface behind a bone prow and a projecting chin. The lower plate follows the jaw joint, which opens progressively in the ram load and holds its opening at charge release. Each cheek carries a bone hinge. The existing wall recoil presents the side of the mouth during the punish window.

Each hand has a shorter palm, two forward-projecting, separated knuckles and a recessed wrist. The hind feet project ahead of the ankles. The elite horns grow through dark roots on the skull. The gait shifts the chest laterally, rolls it over the support and counter-rotates the tail. The striking shoulder rolls through impact and retracts the hand sideways during the first half of recovery.

The shader edit is confined to the existing `BRUTE_PLANES` body-albedo block in `src/render/vfx/ActorSurface.ts`. Atlas cell 1 supplies the desaturated jade or Warden rust crown. The remaining body cells use dark olive, retaining the existing deeper multiplier for the underbody and the existing cool rim. The generator assigns the limbs to chitin. The rust candidate separates the Warden from the two jade ranks and from the brighter orange Crawler marks. Deck lighting and the shared light evaluation have an empty diff.

The proof index is `artifacts/nextgen/heavy41/sheets/index.html`. Native comparisons put final22 on the left. The colour comparison puts jade on the left and rust on the right. The six-frame gait studies sample each live lineup model with moving input, a fixed heading and the game camera.

| Native measurement | final22 | HEAVY41 |
|---|---|---|
| Rig | 63 joints, `144d320c6cae75d7` | same |
| Contact radii, Brute / elite / Warden | 42.90 / 55.77 / 64.00 | same |
| Public height (m), same order | 3.030 / 3.265 / 4.500 | 3.030 / 3.272 / 4.500 |
| Drawn height (m), same order | 2.81 / 3.33 / 4.41 | 2.81 / 3.33 / 4.40 |

The simulation diff from the assigned base is empty. All 38 packed animation durations match final22. The standard competent Breacher sim completed 7 of the 12 campaigns. Successful seeds were 11, 99, 256, 1024, 6561, 9001 and 65537. The room-clear counts for the others were 19 (7), 11 (23), 15 (512), 17 (2025) and 18 (4096).

| Attack clock (ms) | final22 warning / release / recovery / ready | HEAVY41 |
|---|---|---|
| Brute | 17 / 733 / 850 / 1167 | 17 / 733 / 850 / 1167 |
| Elite Brute | 17 / 683 / 817 / 1083 | 17 / 683 / 817 / 1083 |
| Warden | 17 / 883 / 1300 / 2800 | 17 / 883 / 1300 / 2800 |

The first-tick recovery fixture still shows the hand at impact. The extra mid-recovery sheets advance both revisions by nine simulation ticks for the Brute and eight for the elite. These are the frames in which to judge the withdrawn hand. Ordinary Brutes sample `m10-exposed` during that window, and both that clip and `m10-recovery` carry the revised pose.

### Read at 480 × 270

| Pose sheet | Brute | Elite Brute | Warden |
|---|---|---|---|
| Calm | Two near knuckles and a short wrist. Skull stays distinct. | Two near knuckles. The horn base sits in the dark crown. | Prow and chin bracket a warm seam. The cheek hinge is visible beside it. Near knuckles separate. |
| Windup | Cocked arm and planted hand separate; both lobes visible on the plant. | Wide hook, planted twin knuckles and clear red sector. | Face-on, the bright slot runs between the jaws. Both planted hands split. The hinges sit along the cheek outlines. |
| Release | The planted hand projects past the skull. Two knuckles read on the near hand. | Extended striking hand and two separate support knuckles. | Widest jaw gap. Chin below, brow above, bright curved slot inside. Both hands read. |
| Recovery onset | Hand still forward on this first tick; the marine partially covers it. | Same early impact hold. | Near jaw is open but overlaps the marine. The opening and hinge are easier to see at native size. |
| Mid-recovery | Withdrawn hand below and behind the skull, with floor visible between. | Withdrawn hand clears both the skull and marine. | Native stun and recovery sheets cover the ram. |
| Behind | Near hand and foot separate; far knuckles overlap. | Horn crosses the back, but the planted hand still splits. | Prow, sail and pool give heading; the upper jaw covers much of the throat. One hand is easier to count. |
| Side | Both lobes on the near hand and the heel-to-toe projection are visible. | Near knuckles are clear. Horn still crosses the shoulder from this heading. | Slot sits between the near jaw tips, hinge behind it; two near knuckles. |
| Six-frame walk | Rib cage rocks across the supporting wrist as the opposite foot advances. | The fan, horns and back rock together above the planted hand. | Heavy counter-roll and broad hind foot; the far hand overlaps the near one during part of the cycle. |

| Other sheet | Read |
|---|---|
| Lineup colour | Marine and skulls stay readable. Two knuckles on each near hand. Umber makes the Warden distinct and the warm throat sits inside the bone jaws. |
| Lineup grey | Dark gap and wrist creases survive desaturation. |
| Lineup silhouette | Split hands and broadened feet remain countable on the near side. The long Warden head and sail distinguish the boss. |
| Warden colour candidates | Jade blends the Warden with the Brutes. Rust-umber separates their shells while leaving bright orange to the Crawler. |
| Swarm Junction crowd | Marine before the Brutes. Small creatures and red sector stay clear. Knuckles on the backmost Brute are too small to count. |
| Crew Checkpoint crowd | Marine before the Brutes. The front pair retain readable pale skulls against the deck. |
| Frozen / chilled | Both retain the existing blue-grey glaze. Hands remain split in outline. These two fixture frames look similar. |
| Burning / shocked | Orange rim and violet discharge remain legible alongside the skull marks. |
| Native Warden calm | Warm seam beside the chin, near hinge under the prow. The upper jaw is the largest face shape. |
| Native charge windup | Gap is visible in profile. The cheek and brow mask most of the slot at this oblique angle, and the prow catches the eye first. |
| Native charge | Head leads, with warm light on the forward rim. The far jaw and far hand overlap from this heading. |
| Native wall stun | Near hinge and chin are separate as the head recoils. The warm crescent is identifiable, smaller than the prow. |
| Native recovery | Throat and chin show left of the marine. The hand partly crosses the jaw. |
| Native death / settled ragdoll | Corpse rolls underneath its forelimbs. The sail and feet remain visible; the mouth is occluded. |

I saw no loss of the red warning sector or capsule, skull marks, health bars or marine outline in the comparisons. The Warden's slot reads fastest head-on. In the oblique native windup and behind view the bone can draw the eye first.

At the native Relay Racks shutter impact the lower jaw projects down-left, with a dark mouth and a lit bar below the prow. The near foot has two knuckles. The marine, shutter callout and stun indicator remain distinct against the broken floor. The three weakest reads are the oblique native windup (prow before glow), Warden behind (near cheek hides the slot), and the rear Brute in Swarm Junction (hand too small to count).

The delivered production build passed. The title cast and creature cards were re-rendered after the throat revision. The final native Breacher cleared all nine rooms with zero errors and recorded the Relay Racks shutter impact. Its process returned 1 for three room-loading observations over five seconds on the busy machine. The earlier nine-room pass also cleared all rooms with zero errors. The final receipt is `artifacts/nextgen/playtest/heavy41-final-breacher/report.json`; the build and twelve-seed receipts are `artifacts/nextgen/heavy41/{delivery-build.log,sim.log}`. The gallery contains 41 native comparisons and 41 current 480 × 270 images.

## BROOD40

The Crawler's dorsal line and hooks use linear RGB (3.60, 2.05, 0.035). Its existing deck pool stays amber (0.66, 0.33, 0.05). Carrier and Matron retain violet (0.80, 0.06, 2.10) and their (0.32, 0.14, 0.66) pool. Spitter lime (0.14, 4.20, 0.001) and Stalker ice (0.008, 1.90, 5.00) retain their family identities.

A narrow rest seam crosses the sac. Its sine threshold rises from 0.14 to 0.86 at the midpoint of the Matron's one-second native brood timer and closes again on release or interruption. Ordinary Carriers lack that timer and keep their resting seams. In the Crew Checkpoint cycle the high-violet pixels occupied 5.1% of the projected Matron bounding rectangle at rest and 12.4% during priming (blue >150, blue/red >1.08, blue/green >1.30 in displayed RGB).

The shared dark hide has a broader cool grazing edge on the key side. The head and limb regions pick up a cool plane through melee load, strike and recovery. Spitters also carry it through the ranged windup and the first tenth of a second after release. The Crawler's outer hook sweeps farther to the side, rolls on its existing joint and exposes a short bone-coloured edge inside the yellow hook. Native combat geometry and attack clocks still use the original simulation.

The Crawler's outer hook clears the white boot in the side-on contact capture. Its shell finishes off-centre beside the ankle. At 480×270 a shield crossing the attack can still hide the inside hook. The added offset affects the rendered body only.

**Crowd review at 480×270.** The numerator is a first-look visual count and the denominator is the fixture's live actor count. This is one reviewer’s estimate, without timed human trials.

| Frame | Crawler | Spitter | Stalker | Carrier | Brute | First read |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Swarm Junction | 9/10 | 2/2 | 3/3 | 2/2 | 3/3 | White suit and outer yellow hook lead. The crouched Crawler by the shield is easily missed. |
| Relay Racks | 8/10 | 2/2 | 2/3 | 2/2 | 3/3 | The marine separates. Rack bars interrupt two stripes and the rear blue blade. |
| Crew Checkpoint | 10/10 | 2/2 | 3/3 | 2/2 | 3/3 | All four mark shapes separate around the white suit. The waiting Carriers stay peripheral. |
| Ordered crowd | 9/10 | 2/2 | 3/3 | 2/2 | 3/3 | The bite reads inside the red fan. Two approaching yellow marks almost join near the back. |
| Three at the boots | 3/3 | — | — | — | — | Three approach directions read. The far body is mostly under the gun. |
| Pyro overlap | 8/10 | 2/2 | 2/3 | 2/2 | 3/3 | Orange flame breaks around the yellow lines. Hit and burning finishes conceal some limbs. |
| Napalm charge | 2/6 | 2/5 | 2/5 | 4/5 | 5/5 | The flame and large bodies lead. The two uncovered yellow marks separate from the orange. Central burning actors cannot all be classified on first look. |

**Pose sheets.** Each column below has separate Swarm Junction and Crew Checkpoint comparisons. In each cell the dark-floor observation comes first, followed by the pale-floor observation.

| Family | Calm | Windup | Strike | Behind |
| --- | --- | --- | --- | --- |
| Crawler | Yellow back and hooks stand out beside pipework. The hooks also separate on pale steel. | Outer hook turns toward the camera on both floors. | The hook clears the left edge of the white boot on both floors. The shield covers the inside hook. | The stripe anchors the rear view on both. The dark feet are easier to follow on pale steel. |
| Spitter | The lip and near forelimb show against the pipe. Both forelimbs separate on the pale deck. | The paired pale arm edges frame the red sightline on both floors. | The red projectile crosses the lime firing end on both. The forelimbs can be followed to either side. | The hind legs merge into the shadow below the pipe. Both feet are visible on pale steel. |
| Stalker | The blade identifies the animal beside the pipe, with the far feet hard to separate. The folded blade and long legs separate on the pale deck. | The outside leg and loaded blade show on both floors. | The blue cutting end clears the white boot in both views. | The blue shoulder and nearer leg survive the pipe. Both leg silhouettes are clearer on the pale deck. |
| Carrier | The joint lights locate the legs below a quieter sac on both floors. The far dark leg touches the pipe shadow. | The raised sac has narrow violet seams and the legs have a pale contact edge on both. | The gun hides the middle of the sac on both floors. Outer joints and feet stay visible. | The sac and joints separate on both. Black leg tips disappear first under the pipe. |
| Matron | Thin seams describe the sac on both floors. The bright joints still lead the resting silhouette. | The tall sac and near leg show against both decks. | Thin seams return on release. The outer feet separate most clearly at native size. | The violet chevrons cross the back on both floors. The dark tips are easier to distinguish on pale steel. |

| Matron cycle sheet | Observation |
| --- | --- |
| Calm | A dark sac sits above the violet joints. |
| Brood onset | The first widening is small and the red pod warning is distinct. |
| Brood pulse | Broad violet bands spread over the raised sac at mid-prime. |
| Pod sealed | The bands close as the new pod appears. |
| Pod swelling | The pod grows beside a quiet sac. |
| Pod opening | Separate shell halves reveal the hatch. |
| Hatched | The amber hatchling and the mother's thin violet seams separate. |

Native crops pair a rebuild of the final22 campaign revision `40650265` with BROOD40. The 480×270 images are full current frames. The fixtures stage native AI and animation phases, so neighbouring spawns and facing can differ between samples. `artifacts/nextgen/brood40/index.html` links the comparisons. The parent hue check at `13920765` is in `hue-parent/` beside the sheets.

| Colour or rank sheet | 480×270 observation |
| --- | --- |
| Safety Interlock | Both yellow backs separate from the brass floor. |
| Freight Hold | One yellow back is visible between the freight rack and walkway. |
| Residential Gallery | The central furnishing hides the Crawler. The additional open-deck sheet shows its stripe clearly on the same brown floor. |
| Overload Floor | The yellow core separates from the rust-coloured floor beside the chamber. |
| Infested Workshop | Violet joints locate the waiting Carrier against the purple pipework. Only the nearer leg tips separate. |
| Swarm Junction | Violet stays distinct from the purple deck. The two waiting Carriers draw less attention than the attacking yellow hook. |
| Crawler elite pair | Both Crawlers read. The stripe and the gold crest approach the same hue. Size, crest outline and ring carry rank. |
| Spitter elite pair | Both lime firing ends read. The larger body and crest identify the elite. |
| Stalker elite pair | Both blue edges read, with a distinct ring on the lower elite. |
| Carrier elite pair | Both violet joint sets read. The elite's ring separates from its thin seams. |
| Brute elite pair | Both jade silhouettes read. The pale crest and ring still identify the elite. |

The stable brood marks use yellow, lime, blue and violet. Bright red in the staged attack frames identifies warning shapes and hostile projectile cores. Wounds and hit accents can introduce small red pixels during combat. A waiting Carrier is quieter than the attacking Crawler in the ordinary crowd frames. The far-side dark feet still disappear behind pipes and foreground racks. The three weakest frames are Napalm charge (burning overlapping bodies), Relay Racks (rail occlusion) and the centred Residential Gallery sample (furnishing occlusion).

The production build passed. Crew Checkpoint, seed 1729 with Pyro, recorded median draws of 159 → 159 on High and 145 → 145 on Low, with zero combat shader compiles on both builds and tiers. Standard competent cohorts cleared 9/12 with Cryo and 9/12 with Arc. The native Pyro campaign cleared eight rooms with zero errors. Both runs returned status 1 for room-loading diagnostics. The first flagged Passenger Vault, Residential Gallery and Crew Checkpoint. The repeat flagged Passenger Vault and Residential Gallery, again with eight clears and zero errors. The full gallery and campaigns used the build before the final pooled Spitter timer reset. The reset received a fresh production build and a Crew Checkpoint release capture with zero browser errors. The proof index contains 83 annotated comparisons.


## BROOD41

Brood chitin uses the K11 primitive atlas cell carried by the skin UVs. Top paint is linear RGB (.096, .081, .121), flank (.047, .039, .065), and underside and limbs (.025, .022, .037). Sac planes use (.108, .052, .141) and (.064, .029, .090). Matching bind-position vertices on different atlas cells supply a seam mask. The ink target is (.012, .010, .020), with a nominal .85-pixel transition. A cool rim follows the key-facing silhouette. The hide modulation and normal-threshold body planes are removed from the brood finish.

Three separated straw spines, eyes and short hook edges use (2.9, 2.45, .76). The longitudinal emission halo is removed. The splayed feet and dark intervals separate the Crawler from a single cartridge. Its outside hook travels laterally by .32 of the permitted presentation lunge, held into early recovery. During strike and the first 35% of recovery the nearest waiting Crawler loses 52% of its mark intensity. The Stalker's right foreleg extends forward and out from the folded blade.

Elemental status tints a top plane by at most 40%, with a separate rim. The tint colours are ice (.31, .66, .89), fire (.74, .27, .048) and shock (.48, .22, .86). Chilled uses .32 strength, frozen 1.0, and sustained fire and shock .82. The HEAVY42 zone contract uses 1 for crown, 7–8 for bone and 9 for luminous maw. On that shader the status pass also excludes its authored interior ink. The integration branch's heavy model and shader supply the heavy screenshots in this gallery.

The paired gallery uses a local production rebuild of final23 at `63990654`. Native crops compare final23 on the left and BROOD41 on the right. The 480×270 files show the whole current frame. The reference and current runs use native attack phases. Independent room entry can change extra spawns, camera placement and the exact facing of an actor.

| Full frame at 480×270 | Crawler | Spitter | Stalker | Carrier | Brute | First-look read |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Swarm Junction | 8/10 | 2/2 | 3/3 | 2/2 | 3/3 | Three straw marks and the dark leg fan read where exposed. Side-on backs on the upper dark deck are easiest to miss. |
| Relay Racks | 7/10 | 2/2 | 2/3 | 2/2 | 3/3 | Railings interrupt small backs and the rear blue blade. |
| Crew Checkpoint | 9/10 | 2/2 | 3/3 | 2/2 | 3/3 | The hooked bite reads against the red fan. One dark back sits against the central furnishing. |
| Ordered crowd | 9/10 | 2/2 | 3/3 | 2/2 | 3/3 | The backs read as segmented animals. One waiting Crawler loses its mark near the fan. |
| Three at the boots | 3/3 | — | — | — | — | Three approach directions remain visible, though the far animal's trunk is under the gun. |
| Pyro overlap | 8/10 | 2/2 | 2/3 | 2/2 | 3/3 | Straw stays separate from orange. The flame fragments compete with the far small bodies. |
| Napalm charge | 4/6 | 4/5 | 5/5 | 5/5 | 5/5 | Splayed legs, lime firing ends and blue blades persist in the fire. The central overlapping Crawlers remain difficult to count. |

The numerator is an estimate from the first inspection of the full frame. The denominator is the native fixture actor list. This was a visual review, without timed human trials.

On the two pose floors the broad body planes now read closer to the marine's plates. The Crawler has three separate pale bars at rest and from behind. The side-on strike leaves a thin pale hook beyond the boot; the head-on angle still compresses that gap. The Spitter's forelegs bracket the sightline and its muzzle survives the projectile crossing. The Stalker's planted foreleg gives the calm silhouette an extra point of contact. Its blade remains the strongest shape through release. The Carrier and Matron sacs show quieter, flatter planes. Small irregular flecks remain along the sac seams and the bright joints, particularly in the rear Carrier view. At full-room scale some black leg tips merge with Swarm Junction's pipework.

The native socket comparison matched all 448 samples. The matched 180-tick Crew Checkpoint Pyro benchmarks measured median draws of 141 → 141 on High and 131 → 131 on Low, with zero combat compiles on both revisions and tiers. The Standard competent cohorts cleared 11/12 on Cryo and 10/12 on Arc.

The 120 annotated sheets are linked from `artifacts/nextgen/brood41/index.html`. Eleven additional sheets exercise the sibling HEAVY42 models, authored zones and ink with this status pass in a disposable compatibility build. Both builds rendered the status fixtures with zero browser errors. A native freeze attempt staggers the resistant Warden. The separately labelled renderer-only frozen Warden sample exercises the full frozen finish. Its jaw, hands and dark underside remain visible.

The three weakest reads are Relay Racks (rail occlusion), the Carrier from behind in Swarm Junction (busy seam detail above feet on a dark pipe), and the Napalm centre (overlapping Crawlers). The native production Pyro run on seed 1729 cleared all eight rooms with zero errors. The runner returned status 1 for four room-loading diagnostics. An earlier attempt exhausted temporary disk space and another timed out during screenshot capture under load. The completed campaign is `artifacts/nextgen/playtest/brood41-shipped-pyro/index.html`.

## HEAVY43 — shadows on the limbs and planted Warden claws

Each limb is painted in its own bind-space cross section. The exporter projects a face centre onto the tapered shaft and measures the offset toward a fixed dorsal direction. That places the light patch along the shaft through the pose. The underside meets a near-black joint. Shell crowns retain their own top, narrow leading edge and darker flank. The shader changes only the heavy paint palette and the heavy ink width calculation in ActorSurface. The Brutes retain a cool grazing edge and the Warden retains the warm throat. The small-family and status branches have an empty diff.

The Warden's fore and hind supports use a rounded heel, an inclined wedge through the instep and three splayed toes. The first native lineup showed only pinpoints of bone. Extending the bone back to the knuckle makes the toes countable in profile. In the packed mesh, the seam filter follows edges actually shared by faces with different zone IDs, including borders between primitives. It rounds their vertices with a five-tap filter, pins three-way junctions and caps displacement at the shorter edge. Ink width is measured perpendicular to each screen-space edge. Some large polygons still show corners in close-up. All four packed meshes have zero triangles spanning multiple zone IDs.

| Native measurement | HEAVY42 | HEAVY43 |
|---|---|---|
| Joints and rig fingerprint | 63, `144d320c6cae75d7` | 63, `144d320c6cae75d7` |
| Public height, Brute / elite / Warden, m | 3.030 / 3.272 / 4.500 | 3.030 / 3.272 / 4.500 |
| Drawn height in lineup, same order, m | 2.82 / 3.33 / 4.45 | 2.82 / 3.33 / 4.45 |
| Simulation contact radius, same order | 42.90 / 55.77 / 64.00 | 42.90 / 55.77 / 64.00 |
| Motion bank | 38 clip durations | 38 identical durations |
| Embedded model animations | 12 clip durations | 12 identical durations |

The native Warden's visible bounds in the lineup changed from 4.16 × 3.54 m to 4.12 × 3.43 m across and along the floor. Its slimmer contacts produce this difference. The simulation diff against `a88be35e` is empty.

| Warning / release / recovery / ready (ms) | HEAVY42 | HEAVY43 |
|---|---|---|
| Brute | 17 / 733 / 850 / 1167 | 17 / 733 / 850 / 1167 |
| Elite Brute | 17 / 683 / 817 / 1083 | 17 / 683 / 817 / 1083 |
| Warden | 17 / 883 / 1300 / 2800 | 17 / 883 / 1300 / 2800 |

The native pairs show HEAVY42 on the left and HEAVY43 on the right. The 480×270 images show HEAVY43. The comparison index is `artifacts/nextgen/heavy43/sheets/index.html`. Each row below names a pair under that directory, with suffixes `-native.png` and `-480.png`. Measurements are in `heavy43/rig.txt`, `clip-times.txt`, `embedded-clip-times.txt`, `heavies/trio.json`, `timings/manifest.json` and `simulation.diff` under `artifacts/nextgen`.

| Sheet | At game scale |
|---|---|
| `lineup-colour` | The two sage ranks recede behind the marine's light pool. The Warden's rust shell is distinct from its bone sail. |
| `lineup-grey` | Sail, masks and jaw separate from the mid-value crowns, and the near Warden forelimb has a dark underside. |
| `lineup-silhouette` | The Warden's three near toes break the outline. Its long jaw and low body distinguish it from the Brutes. |
| `marine-brute` | The marine has the brighter plates. The Brute repeats the light top and dark joint on the forearm. |
| `marine-brute-grey` | The skull is the lightest Brute shape. The small arm-side step is visible between the outlined wrist and elbow. |
| `marine-elite-brute` | The yoke and mask interrupt the dark green shoulder. The marine's gold crown still stands out. |
| `marine-elite-brute-grey` | The brighter yoke crosses a dark flank, with the guard and wrist a separate pair of values below. |
| `marine-warden` | The near forearm has a rust top and olive underside. Three bone claws project from the rounded instep. |
| `marine-warden-grey` | The sail and jaw stay lighter than the shell. The marine has more internal detail, particularly at the wrist. |
| `brute-calm` | The mask is the first light shape. Two sage shoulder crowns stand over a near-black belly. |
| `brute-windup` | Daylight inside the cocked arm survives. The lifted fist is mostly shadow against the deck. |
| `brute-release` | The back stripes cross the red sector cleanly. The pale marine overlaps the lowered head. |
| `brute-recovery` | The raised back and trailing hand give a different outline. The dark side hides much of the near wrist. |
| `brute-behind` | The light mask projects above the back. The two dark hind legs separate against the lit floor. |
| `brute-side` | A dark elbow interrupts the sage forearm, and the skull points across the floor toward the marine. |
| `brute-walk` | The sage bands roll over the dark support. The front wrist reads most clearly with the hand extended. |
| `elite-brute-calm` | The horn and skull lead the eye, with a dark shoulder socket under the wider crown. |
| `elite-brute-windup` | The cocked fist stays outside the torso. The paired horns frame the mask above the red arc. |
| `elite-brute-release` | The pale horn crosses the darker flank as the arm sweeps outward. The warning sector remains visible. |
| `elite-brute-recovery` | The forearm reaches toward the marine below the back. The gold ring is uninterrupted on the near side. |
| `elite-brute-behind` | Broad shoulder tops frame the spine. Only the upper edge of the skull and swept horn show past them. |
| `elite-brute-side` | The horn crosses the dark shoulder and leads to the skull. The forearm is darker than the crown. |
| `elite-brute-walk` | The horn crosses the lit shoulder during the weight shift. The dark forearm stays separate from it. |
| `warden-calm` | The sail crosses the dark neck. The rust top follows the forearm down to the pale claws. |
| `warden-windup` | The straight bone keel points between planted hands, each tipped with three claws against the red capsule. |
| `warden-release` | The leading jaw and bright throat clear the dark chin. The near claw tips read against the deck. |
| `warden-recovery` | The marine overlaps the head. The open jaw is harder to isolate here than during the actual wall stun. |
| `warden-behind` | The bone crest leads up toward the marine. The dark supports separate, though the rearward cheek covers the throat. |
| `warden-side` | The long jaw, throat, rust forearm and near splayed foot each have their own outline in profile. |
| `warden-walk` | The heel lifts away from the three toe ends. The light on the forearm stays attached to the moving form. |
| `cycle-calm` | The Warden stands on splayed claws. The bright throat sits at the right of the open jaw. |
| `cycle-charge-windup` | The red capsule is clear between the planted supports. Bone sail and shoulder cap overlap from this angle. |
| `cycle-charge` | The prow leads up-left. The dark elbow and lighter guard separate on the driving forelimb. |
| `cycle-wall-stun` | The exposed throat sits left of the brackets. The nearer bent support has a dark side against the red marker. |
| `cycle-recovery` | The lower jaw hangs out past the warm slot. The planted far foot overlaps the marine and its marker. |
| `cycle-death` | The roll exposes the belly, and the toes project off the deck. The face rotates away. |
| `cycle-ragdoll` | The dark belly dominates and one clawed limb breaks the silhouette. The throat is occluded on the settled corpse. |
| `relay-impact` | The warm opening sits under the reticle. Impact light flattens the rust value briefly, but the chin, brackets and marine remain visible. |
| `crowd-swarm-junction` | The marine wins the light pool. Skull and band tops still locate the three darker bodies on purple steel. |
| `crowd-crew-checkpoint` | The marine and red sector read first. The rear Brute's feet merge into one dark shape at this distance. |
| `crowd-relay-racks` | The marine and red sector remain distinct on teal. The rear Brute's dark limbs merge with the rack bars. |
| `brute-frozen` | Pale caps and straight front limbs distinguish the frozen body. The skull and health bars stay clear. |
| `brute-chilled` | Blue-grey accents and the bent posture leave the darker back and skull readable amid the chill effects. |
| `brute-burning` | Orange cuts across the lower two Brutes. The dark bands interrupt it and the skulls remain distinct. |
| `brute-shocked` | Violet contacts stand out against the lower Brute's dark limbs, and the brighter marine remains easy to locate. |

The weakest three live reads are the Warden pose-fixture recovery, where the marine occludes the mouth, the rear Brute in the teal Relay Racks crowd, where its support blends into the rack bars, and the Brute windup, where the outline carries more information than the shadowed fist. The red warnings, skull plates, health bars and status colours remain readable in the paired shots.

The production build passed. The seed-1729 native Breacher campaign cleared all nine rooms, including Relay Racks, with zero errors and zero recorded defects. Residential Gallery had the only loading hold above five seconds, at 5,770 ms. Its report and shutter impact are under `artifacts/nextgen/playtest/heavy43-breacher/`. The full title and card run refreshed the Warden title cast and twelve heavy route and lesson cards. The committed title composite uses the existing background, fog and foreground layers.

## HEAVY44 — a planted stride, three crowns and an exposed Warden jaw

The Brute and elite share the revised run. Each palm and rear pad takes a world-space anchor during its support phase. The shoulder rolls over the hand as the pelvis drops, the opposite heel follows late, and the digits spread under load. On the recovery side of the stride the support correction eases off the anchor and the incoming pad lowers toward the deck. A pivot in place alternates supports by accumulated yaw. The correction belongs to the render skeleton. Each frame restores the preceding additive transform before the mixer samples the next pose.

The regular Brute has three overlapping sage crowns, a turned forearm and shin, a darker ankle and a muted plum fold under the skull that parts in the wind-up. The regular crown's linear green channel fell from .096 to .070, approximately a 14% reduction in its sRGB display value. The mask and claws retain their paints. The elite has warm bone crowns, a near-black side and a swept crest above its yoke. In the mixed walking pack I can pick the elite out by its back with the ring hidden; the pale crown is also the largest competing light shape in that close view.

The Warden's held recoil turns the head an additional .67 radians and opens the jaw farther. An authored tongue surface follows the lower jaw, with a dark border around the warm tongue and throat. The sail and the overhead brackets lose value in stun. The hottest throat value is reserved for that punish window. On a camera-facing impact the neck also rolls about the modelled cheek and lifts clear of the shoulder. Eleven native variations at Relay Racks showed that translating the closed silhouette alone left only a pinpoint of light. A side roll exposed the throat as a warm crescent. Other approach headings retain the authored clip turn.

| Render measurement | Regular, previous → now | Elite, previous → now | Warden, previous → now |
|---|---:|---:|---:|
| Isolated scene draw-call contribution | 1 → 1 | 2 → 2 | 2 → 2 |
| Visible skinned position vertices | 12,140 → 12,452 (+2.57%) | 13,535 → 13,909 (+2.76%) | 19,965 → 20,070 (+0.53%) |

Counts include the renderer's seam splits. Draw calls are the difference between two direct scene submissions with and without the actor root at the same camera and pose. These counts do not describe hardware frame rate. The shipped skeleton still has 63 joints and fingerprint `144d320c6cae75d7`. All 38 motion-bank durations match `019f4e51`. The simulation diff against that commit is empty. The heavy footprint fit, public collider definitions and strike windows have no code changes.

Proof is local to this worktree under `artifacts/nextgen/heavy44/`. `sheets/index.html` opens the native and 480×270 pairs, with previous on the left. `walk-eight-game-frames.png` and `pack-eight-game-frames.png` in the same sheets directory retain an entire 480×270 viewport per frame. The cyan circle on the native stride crops marks the lower of the two palm landmarks in that sample. The gait strips use the game camera and a direct scene draw. The room and campaign frames carry game presentation. `before-walk/`, `after-walk/`, `before-pack/` and `after-pack/` contain the per-frame positions. `rig.txt`, `clip-times.json` and `simulation.diff` contain the contract evidence. Build output is in `build.log`.

| Maximum palm / rear pad travel during support, cm | Regular before | Regular now | Elite before | Elite now |
|---|---:|---:|---:|---:|
| Walk | 114.132 / 76.598 | <.001 / <.001 | 136.734 / 94.142 | <.001 / <.001 |
| Turn in place | 65.018 / 48.535 | <.001 / <.001 | 88.627 / 64.771 | <.001 / <.001 |
| Step out of recovery | 113.189 / 74.074 | <.001 / <.001 | 136.858 / 95.205 | <.001 / <.001 |

The sampler transforms an interior landmark of each palm and rear pad through its actual bind and posed skeleton into world space at 60 Hz. Each number is the largest three-dimensional distance between any two samples in one continuous planted interval, across both sides. The table uses the held deck height and compares identical frame numbers in both builds. Including approach and lift samples within **2 mm** of that plane gives regular walk **0.423 / 2.325 cm**, elite walk **0.157 / 3.097 cm**, and elite pivot **0.000 / 4.108 cm**. The last two rear-foot figures exceed 3 cm under that broader definition. In the elite pivot the ankle advances 4.1 cm from 0.76 mm above contact to touchdown, then stays fixed. This measures the pad landmark; individual digit tips continue to deform. Raw calculations are in `planted-drift.txt` and `near-deck-drift.txt`.

| Fight at 480×270 | Marine mean, previous → now | Marine lightest decile, previous → now | Creature lightest decile, previous → now | Brightest sampled creature patch, previous → now |
|---|---:|---:|---:|---:|
| Swarm Junction | 125.4 → 125.4 | 194.6 → 194.6 | 190.5 → 189.6 | 195.9 → 195.9 |
| Crew Checkpoint | 134.0 → 134.0 | 203.1 → 203.1 | 189.3 → 189.4 | 200.0 → 200.0 |
| Relay Racks | 131.6 → 131.6 | 204.8 → 204.8 | 189.7 → 189.4 | 196.5 → 196.5 |
| Transmission Chamber | 126.8 → 126.8 | 197.3 → 197.3 | 188.1 → 188.5 | 198.8 → 198.8 |
| Coolant Plant | 130.1 → 130.1 | 196.7 → 196.7 | 191.1 → 190.9 | 200.4 → 200.4 |

Values are Rec. 709 luma of displayed RGB on a 0–255 scale. At fixed pose and camera, drawing the scene with and without the visible actor roots identifies pixels that change by at least 16 in any channel. The first three columns use that mask. The last column measures a contiguous 3×3 patch on the brightest of the sampled crawler, spitter, carrier and Brute marks in the fully presented PNG. The Spitter's lime organ wins all five patch comparisons. At normal viewing size the marine's larger lit plates still stand out from the regular Brutes. The marine's whole-body mean includes dark ink and joints and is lower than that lime mark in every room. The Spitter also narrowly exceeds the marine's bright-decile mean on three floors. The broader claim that the marine beats every individual highlight would overstate the result.

The dedicated `brute-windup` and `brute-behind` room pairs use the corresponding raw final24 poses as their historical sides. In wind-up the purple fold opens below the pale mask and stays subordinate to it. The red sector remains easy to trace. From behind, the three crowns make readable steps, but the far shin nearly disappears against the torso at 480. In the sparse stride the contact point stays put as the chest advances, and the foot clears the floor on lift. In the pack the centre elite is identifiable by its broad bone back before the horns resolve. The far regular's pad is too small to count individual loaded digits at that distance.

| Warden wall approach | Upper-to-lower jaw landmarks / projected head height, native px | What I could see at 480×270 |
|---|---:|---|
| Crew Checkpoint, −134.5° | 186.0 / 343.7 (54%) | A warm tongue below the prow points down into the room. The Brute escort, red floor warnings and stun brackets remain distinct. |
| Relay Racks, +47.8° | 134.7 / 161.0 (84%) | The crescent shows beside the shoulder. A second heavy directly behind the target makes this the least obvious mouth. |
| Coolant Plant, −157.7° | 190.4 / 332.4 (57%) | The warm interior clears the marine. The escort overlaps the chin's end and the red hazard line crosses the face. |

These are 2D distances between authored points on the upper bite and inner lower lip, divided by the screen height of the head and jaw. Occlusion can make the visible luminous slot substantially smaller, especially at Relay Racks. The three wall captures use legal spawn lanes, two escorts and the native charge and collision clocks. I judged the PNGs myself; there was no first-time-player recognition trial. The initial multi-room capture returned the same blank canvas for two different approaches despite an empty error array. Separate room invocations produced the three distinct final PNGs and zero page, console or request errors.

The pressure frames are actual peak-pressure receipts from the Breacher campaign. A combat-kiting fixture rejected its spawn at native clearance, so it was unsuitable as a substitute for live pressure. Historical peaks come from `final24/play/breacher/`; current peaks and sidecar snapshots are in `artifacts/nextgen/playtest/heavy44/`. The native run and each historic frame use seed 1729. For a like-for-like marine comparison, the peak table uses a conservative polygon traced through the visible marine on the 480 raster. The bright creature value is the mean of a contiguous 3×3 patch on the visible mark. The historical search is confined to the highlighted anatomy in the screenshot. Current actor masks come from a same-pose visibility difference and are checked against the screenshot. This includes the historical Warden in Relay Racks even though the body is a corpse there. Those methods and the fixture-wide deciles answer different questions.

| Native peak | Marine traced mean, previous → now | Bright marine 3×3, previous → now | Bright creature 3×3, previous → now | Read at 480×270 |
|---|---:|---:|---:|---|
| Crew Checkpoint | 130.5 → 127.4 | 187.3 → 185.1 | 159.4 → 158.3 | The marine remains the lightest figure against the Stalkers. Almost all of the regular Brutes are below the viewport at this instant. |
| Armory | 121.9 → 118.8 | 195.6 → 191.9 | 242.3 → 181.2 | The Warden's ordinary jaw stays warm and distinct. The marine's plate now carries the brighter patch. |
| Relay Racks | 108.6 → 104.6 | 191.1 → 190.9 | 240.8 → 228.7 | The historical Warden corpse is largely offscreen in the current frame. The live Spitter's lime mark is brighter than the marine. |
| Transmission Chamber | 113.6 → 111.9 | 179.2 → 198.5 | 210.4 → 200.2 | The elite's bone crown identifies it in the upper-left pack. The marine is clear on the right, but the lime organ narrowly wins the patch comparison. |

The first three peaks match simulation times to the millisecond (81.283, 111.683 and 237.333 seconds). Transmission Chamber compares each run's own peak, at 320.917 and 280.183 seconds, so the actors and camera differ. The unrestricted current marine-mask means for those four frames are 105.0, 96.8, 101.9 and 97.8. Raw readings are in `native-brightness.txt`, `native-traced.txt` and the four campaign `*-pressure.png.luma.json` files. Regional polygons are in `native-values.mjs` and `native-traces.json`.

The shipping build (`9e42253c`) passed `npm run build` with the output isolated in `artifacts/nextgen/heavy44/ship-dist`. The seed-1729 Breacher run cleared ten rooms uninterrupted from a new run, with zero errors. It used `--room-pressure` to retain peaks and a 90-second screenshot deadline after two earlier capture timeouts. The wall-clock limit was extended to two hours. The runner flagged two loading delays and returned a nonzero exit status. Total transfers above five seconds were Passenger Vault 16.525 s, Residential Gallery 10.733 s, Crew Checkpoint 10.195 s, Armory 7.200 s, Freight Hold 9.043 s and Relay Racks 5.096 s. The report is `artifacts/nextgen/playtest/heavy44/report.json`. Earlier development runs were stopped when the visual build changed. Final campaign output is in `heavy44/ship-campaign.log` under `artifacts/nextgen/`.

Relay Racks ship-kit preparation timed out during the staged crowd capture. A fresh per-room invocation succeeded. `crowds-verified.json` and `peaks-verified.json` identify each accepted room frame and its source. Those frames, both gait samples, both sparse Brute poses and all three wall impacts have empty capture errors. Crowds and ordinary gait are from the final Brute geometry and contact implementation; the later Warden-only recoil correction is present in the wall captures and native campaign.

The weakest three frames are Relay Racks wall-stun (the second heavy competes with the crescent), the regular Brute from behind (the far shin merges into the belly), and the Transmission Chamber pressure peak (the edge-positioned marine competes with the elite's broad crown and Spitter organ). The marine is the brightest large figure in the regular-Brute crowds, but two native peaks retain brighter small-family marks.

At the start, `df -h /Users/chernodub` reported a 926 Gi volume, 874 Gi used, 25 Gi available and 98% capacity. The final reading was 926 Gi, 809 Gi used, 89 Gi available and 91% capacity. Old scratch cleanup reduced this worktree's evidence directory from 18 GB to 29 MB before capture. Its final size is 1.7 GB, below the 5 GB limit.

### HEAVY44 review revision

The Warden's mandible is 1.32 bind-space units long under a 2.66-unit mask. The jaw rotates about its rear hinge from 6° shut to 36° at impact. The skull presents its near cheek at a nominal 40° to the camera. Two dark gum edges carry three tapered teeth per side on each jaw. The near-black throat lining spans the hinge. The small tongue and warm inner lip belong to the mandible, so the strike clip cannot pull a strip of light away from the skull. The mesh template reuses the existing oral vertex slots. The recoil layer restores the sampled bone transforms before the next animation update.

The elite keeps the three dark crowns. Its muted bone pigment follows their rims, narrow crest and tusks. In frame zero of the mixed pack, a traced dorsal region contained 12,392 bone-coloured pixels among 21,540 sampled pixels in the first pass (57.5%). The revision has 2,477 in the same region (11.5%). This is projected coverage for that pose. The native samples below are the median displayed Rec. 709 luma in a 5×5 patch, on a 0–255 scale.

| Surface in the mixed pack | Native sample centre | First pass | Revision |
|---|---|---:|---:|
| Elite mask | 1316, 368 | 176.3 | 163.6 |
| Elite crown field | 1230, 356 | 158.2 | 65.6 |
| Rank bone pigment, sampled on the broad tusk | 1252, 456 | 176.3 | 107.1 |
| Marine leg plate | 498, 660 | 190.6 | 190.6 |

The trim is 65% of mask luma. On the 480×270 raster, 3×3 means on the elite mask and marine leg are 156.0 and 186.2. The mixed-pack strip hides rank rings. The crest and swept horns identify the middle figure in greyscale; the marine's legs retain the brighter area on the left. The pack capture uses the final elite pigment. Subsequent mouth edits affect only the Warden, which is absent from that strip.

| Heavy | Draws, first pass → revision | Visible skinned vertices, first pass → revision |
|---|---:|---:|
| Brute | 1 → 1 | 12,452 → 12,452 |
| Elite Brute | 2 → 2 | 13,909 → 13,909 |
| Warden | 2 → 2 | 20,070 → 20,070 |

The count capture uses the renderer draw delta with each live actor hidden in turn. Vertex counts come from the visible skinned meshes. The revision diff to the first-pass head `d32997bc` is empty under `src/game/` and `src/DepthGame.ts`. The shipped rig, animation files and simulation clocks are identical.

**Read at 480×270.** In Crew Checkpoint the open jaw sits below the crossing red arc. I can point into the dark opening; the far teeth merge at this size. In Relay Racks the cheek clears the near shoulder and the warm bite is visible on the right side of the stunned Warden. The second Warden behind it makes this the slowest target to identify. In Coolant Plant the opening clears the escort and the pale lower edge survives reduction, though the red warning crosses the upper edge of the face. In wind-up and charge the mask leads a nearly closed bite. The gold floor target and red charge sector stay separate from it. I judged the frames directly. Recognition time by a new player was not measured.

The three-column sheets run **final24 | HEAVY44 first pass | revision**. The historic wall and pack columns use the preserved baseline build on the same staged approaches. The solo poses use final24 gallery originals. The wall sheets include the whole 1920×1080 frame, the whole frame at 480×270, a centred 320×320 native jaw crop, and the same crop at game scale. The pack strip has eight frames in colour and greyscale.

- Comparison index: `artifacts/nextgen/heavy44/review/sheets/index.html`
- Wall receipts and native PNGs: `artifacts/nextgen/heavy44/review/recoil/{crew-checkpoint,relay-racks,coolant-plant}/`
- Closed jaw and solo elite: `artifacts/nextgen/heavy44-recoil-gallery/`
- Mixed pack: `artifacts/nextgen/heavy44/review/shipped-pack/`
- Render counts, capture summaries and luma samples: `artifacts/nextgen/heavy44/review/{receipts.json,native-luma.txt,game-luma.txt}`
- Production build output: `artifacts/nextgen/heavy44/review/verified-build.log`

The shoulder correction uses the sampled neck transform and updates its child matrices before solving the skull and mandible. Five offsets on the same Relay Racks impact were compared; the smallest kept the bite visible with the shortest exposed neck. The final remaining weaknesses are the overlapping Warden shoulders at Relay Racks, the hazard line over the Coolant Plant face, and the fine elite crest on the rearward stride frame. The Spitter's organ in the native peaks belongs to the brood pass.

The shipping production build passed. The three wall receipts have empty page, console and request errors. Both solo-pose galleries, the revised eight-frame pack and the renderer counts also have empty errors. The ten-room Breacher campaign above is first-pass evidence. Revision evidence is from the native impact, pack and gallery captures requested in review. At handback, this worktree's nextgen artifacts occupy 2.9 GB and the data volume reports 88 GiB available.
