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
