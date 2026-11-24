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
