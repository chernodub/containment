# SHADER25 — one actor finish for creatures

## 1. What made the creatures read as unfinished (diagnosis, `shader25-before`)

Captured at `15d6f634`: `value14-crowd-relay-racks`, `value14-crowd-swarm-junction`, one attack scenario per family in
Relay Racks (`value14-{crawler,stalker,spitter,brute,carrier}-attack-relay-racks`), `value14-overlap-cryo`,
`value14-overlap-pyro` and the Dark Cryo fixture `look25-dark-cryo` (45 PNGs, 0 errors). The LOOK25 sample patches
reproduce exactly (Relay Racks lit body 109.9, dark plate 21.6, marine plate 184.6).

There is **no real transparency** on a living creature. Every creature skin is opaque (`ActorFlatSkin` only accepts
opaque, depth-writing, normal-blended materials), Stalker camouflage is a value multiply, and the death/spawn wipe is a
hard `discard`. The "milky, semi-translucent" read is made by value and colour:

1. **A pale additive veil that is strongest at the silhouette.** The alien emissive adds a Fresnel rim
   `pow(1−N·V, 3) × (0.29…0.42)` tinted 85 % toward pale blue `(.55,.78,1.0)` on *every* side of the body, plus a
   grey-blue "shell lift" emission on dorsal planes, plus a cool shadow fill `(.12,.16,.20)×albedo`, plus a constant
   `+(.006,.009,.012)` and 12 % desaturation on the albedo. In the top-down orthographic view legs and flanks sit at
   low N·V, so at N·V = 0.3 the rim alone adds ≈0.10 linear to a body of ≈0.15: the outer third of each creature turns
   a milky blue-grey that reads as a translucent cut-out.
2. **Bands are gradients, not steps.** GraphicSurface's actor ramp puts the shadow at 62 % of lit with a terminator
   0.30→0.62 wide; then the alien `opaque_fragment` replaces lighting with a *positional* ceiling
   (`.50 + .43·rake + .44·side + .22·lengthwise`, squared) that grades every panel across its width independent of
   the light — LOOK25 itself measured one plate going 65→89. The composite shoulder then compresses everything over
   0.145 so the lit plane and the upper wash end up at the same value. Result: a soft painted wash with no lit
   plane/shadow plane.
3. **Painted, ragged albedo from atlas minification.** The k11 bakes are 2048² atlases of hundreds of small islands
   on a dark maroon gutter (`tools/assets/k11-creatures/bakes/*/…-base.png`). Actors sample the native mip, so at
   gameplay size (60–120 px per creature) the GPU reads mip 4–5, where islands blur into the gutter and each other:
   mottled tan/brown/blue smears and dark ragged fringes along every UV seam. GraphicSurface's 7-step *soft* posterize
   keeps those smears. The marine's atlas is instead collapsed to two flat values (`marineFlat`).
4. **A different ink line.** Marine contour = 1.25× actor width, near-black. Ordinary creatures get 1.0× (elites
   1.06×), and the contour colour is lifted 72 % toward blue-grey `(.035,.055,.076)` on dark backdrops (55 % toward
   `(.018,.035,.055)` on elites). Interior ink follows bone-weight region boundaries, which are triangle-constant
   zig-zags, at 0.80 strength (marine 0.10): scratchy interior lines on every limb joint — the "pile of rubble" Brute.
5. Not a cause of the general finish but seen in Relay Racks: a committed Crawler standing on a rack keeps its pale
   2 px attack contour while its dark body sits on pale rack bars, which reads as a cut-out. That contour is a kept
   rule (committed attacker) and stays.

## 2. The finish as shipped

All of it lives in the existing actor programs and the existing grade/ink composite; no pass, target, texture or
draw was added. Files: `src/render/vfx/ActorSurface.ts` (alien path), `src/render/lighting/GraphicSurface.ts` (actor
branch), `src/render/post/Ink.ts`, `src/render/ActorIdentity.ts` (`CREATURE_BODY_HUES`), `src/render/models.ts`
(one `surface.body(...)` call).

- **Opaque, flat albedo.** Straight after the atlas sample (before status and death tints) the creature albedo is
  rebuilt: hue = the family body hue (`CREATURE_BODY_HUES`: russet Crawler, umber Brute, olive Spitter, slate-violet
  Stalker, plum Carrier) mixed with 26 % of the painted zone's own hue (75 % for the bright bone/gold tier); value
  = one of three flat tiers (recess 0.56, shell 1.0, bone/gold 1.12) chosen by narrow steps on the atlas value.
  Elites and champions take a 0.66 body tier so gold/bone plates separate by value (uniform from `identity()`).
  The atlas is sampled 1.5 mips sharper on creatures so islands stop blurring into the maroon gutter. Nothing on a
  living creature uses alpha; camouflage stays a value multiply; spawn/death keep the hard top-down `discard` wipe.
- **Two hard planes.** Creatures keep the marine's band structure but harder: a lit plane and a shadow plane at
  30 % of it in linear light (≈24 % display value), split by a fixed upper-left screen key at facing 0.64 with an
  `fwidth` terminator (one pixel). Fixed key = every room splits a dorsal dome the same way; room light still tints
  through the existing hue term. The positional gradient ceiling, cool shadow fill, grey-blue shell lift,
  desaturation and albedo offset are gone; a flat `min(value, .25)` ceiling remains and the composite shoulder is
  unchanged.
- **One emissive cue.** The authored organ/lantern emission (family colour) is untouched and is now the only
  saturated light on the body.
- **Thin cool rim from the key.** `smoothstep(.80,.88, 1−N·V)` × key-side facing, strength 0.31–0.37 for ordinary
  creatures (identity strength + 0.12 + 0.06 on limbs), cool-tinted as before. The grazing hit rim, death contact
  and ash edge are unchanged.
- **Same ink.** Every actor class now uses the marine's 1.25× contour weight and the same near-black contour colour
  (the blue-grey "dark backdrop" lift and the elite contour tint are removed, which also removes one scene read per
  contour sample). Interior ink at region boundaries is 0.10 on every actor (was 0.80 on creatures). The committed
  attacker keeps its 2 px pale contour.
- Cache keys: `actor-surface-v24-shader25:alien`, `graphic-surface-v3`.

## 3. Measured values (Rec.709 luma of sRGB codes, native 1920×1080 unless noted)

| Check | Before | After |
|---|---|---|
| Relay Racks Brute box (830,590 170×130): value histogram | one smeared hump 40–80 (p50 61.5, p98 90.3) | two peaks: lit 110–119, shadow 50–69 (p98 115.1) |
| …pixels that are not floor-coloured blue-grey | 2 592 | 7 592 (the old veil made two-thirds of the body read as floor-grey) |
| Swarm Junction crowd box (830,560 200×160) p98 / marine 183.6 | 124.8 (68 %) | 127.2 (69 %), lit peak 110–119 (60–65 %) |
| Crew Checkpoint crowd box p98 / marine 184.6 | 127.4 (69 %) | 129.1 (70 %, rim/bone pixels), lit peak 110–119 |
| Relay Racks marine plate (610,525) | 184.6 | 184.6 |
| Dark Cryo lit body max / marine | 121.9 / 197.6 | 121.7 / 197.6 (62 %) |
| 480×270 Relay Racks Spitter (60,116) vs floor (46,120) | 85.4 vs 26.2 (+59) | 68.1 vs 26.2 (+42) |
| 480×270 Swarm Junction Spitter (77,116) vs floor (63,120) | 87.5 vs 31.2 (+56) | 63.6 vs 31.2 (+32) |

The brief's targets — base ≈45 % (115) and shadow ≈25 % (64) — land at 110–119 and 50–69. Creature lit planes stay
60–65 % of the marine plate; the highest p98 (Crew Checkpoint, 129) is rim/bone, at 70 %. **The small-creature margin
on a dark deck at 480×270 is smaller than LOOK25's** (+42/+32 against +59/+56): the old milky veil was lifting those
bodies. They remain findable by lantern, family colour and the black contour, but this is the weakest number.

Status, hit and plate states: frost now tints the flat body (the flatten runs before the frost cast), burn and arc
read on the bodies in `value14-overlap-pyro`/`-arc`, the hit rim and plate break (`play22-plate-break`) are
unchanged, the committed contour is unchanged, champions keep crown, ring, gold head and contour.

## 4. Costs

- Draws and resident programs are identical in all 65 matched frames across 17 scenes (before vs after).
- Playtest `--rig=cryo --seed=1729 --rooms=9 --fast`: 8 rooms cleared, died in Relay Racks (Stalker scythe lunge),
  **0 errors, 0 defects**. Program counts are flat start→mid→clear in every room (165, 158, 155, 161, 161, 160, 160,
  164, 160), and rooms 1–6 equal LOOK25's counts: zero mid-combat compiles, no new variants. Breached Loading Bay ran
  under Emergency lighting.
- Low tier: `g2-kiting-low` in Relay Racks, 0 errors, same grammar (same programs; Low skips only interior ink).
- Per-fragment work: added a short albedo rebuild (~15 ALU), one dot + `fwidth` for the terminator and one
  smoothstep pair for the key rim; removed the screen-derivative plane normal, its cross/normalise, the `exp`
  shoulder, the dorsal shell lift, the cool fill, and up to eight `tScene` reads per actor contour fragment in the
  composite. The one real new cost is the −1.5 mip bias on creature atlases (more texture bandwidth); a quiet-machine
  `npm run bench` on High is for the lead.

## 5. Evidence (local, `artifacts/nextgen/`, not committed)

- Captures: `shader25-before` (45), `shader25-before-extra` (20, the pre-change shaders on the extra scenes),
  `shader25-after` (65), `shader25-after-low` (4), playtest `playtest/cryo-1729`.
- Comparisons in `shader25-comparison/`: `families-native-frame02.png`, `families-native-frame04.png`,
  `families-480x270-frame02.png` (rows Crawler, Stalker, Spitter, Brute, Carrier beside the marine; columns before,
  after, before grey, after grey), `dark-rooms.png` (Dark Cryo, Dark Pyro, Dark heavy cargo, Dark atrium),
  `bright-and-status.png` (Crew Checkpoint, Cryo, Pyro and Arc overlap), `crowds-elites-plate.png` (Relay Racks,
  Swarm Junction, champions, plate break), `playtest-pressure.png`.

## 6. Still unlike the marine

1. **Small bodies on the darkest decks** carry less value margin than before (above). If the lead wants it back
   without the veil, raise the shadow plane only for the small families (one uniform) or add a value step to the
   contour on dark backdrops.
2. **Brutes and champions are still patchy.** The island bake gives each Brute several tiers (grey plates, tan skin,
   dark joints), so a crowd of Brutes still reads as stacked plates more than one mass, and a champion's body sits
   mostly in the bright tier, so its gold plates now separate by hue more than by value. A cleaner fix is in the
   bake (fewer, larger zones), which is the model stream's call.
3. Frozen creatures still go pale ice-blue by design (status), which is the closest thing left to the old washed
   look; the committed attacker's pale contour still reads as a cut-out on bright props. The sharper atlas mip was
   checked in stills only, not for shimmer in motion.
