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
