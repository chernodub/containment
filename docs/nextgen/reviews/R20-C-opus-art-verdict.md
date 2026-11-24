# R20-C — art-director second opinion (Claude Opus, 2026-11-24, gallery final15)

Evidence: 44 images from `final15/`. I looked at 6 screens and 4 contact sheets (arena-calm, kiting, native, and `twenty-incident` in place of four single incident frames, to stay within budget). I looked at 2 play23 frames and 28 review480 frames: 6 native-heavy, 8 abilities, 6 windups, 2 bosses, 1 crowd, 1 elite pair, 2 overlap and 2 conditions. I looked at 2 native-size frames rather than 3 (`elite-pairs/…spitter`, `native-heavy/pyro-pressure-3`) and 2 motion sheets (`marine-contact-1`, `brute-contact-1`). I did not run the game.

## 1. Scores

- **First impression: 6.5.** The title type and layout are premium. The key art is a dim, soft PBR tableau: the creatures read as dark clutter, and only the marine's yellow dome carries (`title.png`).
- **Interface: 7.5.** It is a coherent commercial system. Boon cards are diagrammed, shop items are modelled, route cards show a creature on a dark ground, and the death card states the cause, "Dash was ready", and a fix (`onb14-death-spitter.png`). The rig-screen marine is still a flat, overexposed render in a stumbling pose (`rig-breacher-equip.png`).
- **Combat readability: 6.** The red telegraph grammar is still the best thing in the game (`windups--…stalker-02`, `bosses--warden-…charge-windup`), and the utility rings are now quiet. But the camera often parks the marine at the frame edge or under the HUD (`play23-edge-…`, `conditions--dark-heavy-…`, `native-heavy/pyro-pressure-3`). Stacked damage numbers ("18" ×12, "90" ×10) cover crowds (`abilities--…flashfire-03`, `…seismic-slam-03`).
- **Environments: 5.5.** All twenty rooms have their own colour temperature, but the arena centres are still large empty plates (`twenty-arena-calm.png`). The landmarks are small and low-contrast, and they are often cropped at the top edge (`twenty-incident.png`).
- **Ability effects: 6.5.** Railbreaker, Flashfire, Slam and the now white-cored Overload read well. Meltdown has flame tongues now. Whiteout is still a pale disc with thin dashed rings (`…whiteout-03`), and Napalm is a scatter of thin orange streaks (`…napalm-charge-03`).
- **Characters and creatures: 6.** At native size the elite spitter is a real design: stilt legs and a glowing sac (`elite-pairs/…spitter`). But in crowds the families melt into pale beige ghosts with white smears (`native-heavy/pyro-pressure-3`, `abilities--*-03`). The Brute is barely taller than the marine (`windups--…brute-02`, `brute-contact-1`), and the Matron is still a translucent violet cone (`bosses--matron-…brood`).
- **Cohesion: 6.** UI, route cards and gameplay are now one family. The title art and the rig portrait still use other rendering languages.

## 2. Tier

This is polished early-access indie. The menus are AA, and the in-room art is upper-prototype going on commercial. I would pay $15.

## 3. Seven changes, ranked

1. **Camera composition** (`play23-edge-safety-interlock-station.png`, `conditions--dark-heavy-…`, `conditions--coolant-active-…`, `native-heavy/pyro-pressure-3`). Bias the frame so the marine stays inside the central 60% box and above the HUD tray, and let the clamp show void before it pushes the hero to an edge. Lead the camera 15–20% toward the aim and toward the threat centroid.
2. **Creature value ceiling in crowds** (`native-heavy/pyro-pressure-3`, `abilities--…flashfire-03`). Cap creature body value at about 65%. Remove the white hit-flash smear, or make it a 2-frame rim only. Use three flat values per material, plus each family's one emissive cue (spitter sac, stalker blade, carrier pods).
3. **Brute and boss mass** (`windups--…brute-02`, `elite-pairs--…brute`, `bosses--matron-…brood`). Scale the Brute to 1.8–2× the marine's footprint, with a pale crest and a hunched, wide stance. Make the Matron opaque, with a dark carapace and lit violet pods; no translucency.
4. **Damage-number budget** (`abilities--…seismic-slam-03`). Merge each hit burst into one number per cast, shown at the centroid. Show elite and crit numbers only, at 70% size, and fade them within 0.4 s.
5. **Arena floor breakup** (`twenty-arena-calm.png`). Fill the 3 m around the centre with low clutter: grates, cable runs, puddles, scorch and debris. Add contact AO at wall bases. Keep stencils at about 25% opacity.
6. **Landmark light tier** (`twenty-incident.png`: armory, transmission, shielding gate). Give each landmark one coloured practical at 60–70% of the marine pool's brightness, framed fully inside the playable view, with a spill decal on the floor.
7. **One marine render** (`rig-breacher-equip.png`, `onb14-death-spitter.png`). Re-render the portraits with the in-game ink and key light, in a planted three-quarter hero stance with a rig-colour rim. Re-light the title creatures so they get rim separation.

## 4. Keep

1. The hostile red language: wedges, lanes and capsules with crisp rims (`bosses--warden-…charge-windup`, `windups--…stalker-02`).
2. The UI system: Barlow type, diagrammed boons, modelled shop props, and the death card's cause-and-fix (`augment-draft.png`, `shop.png`, `onb14-death-spitter.png`).
3. Per-room colour identity, plus the Railbreaker, Overload and Slam shapes. Each ability owns a distinct geometric primitive (beam, cone, ring).

## 5. Value hierarchy and identity

The hierarchy is now about two-thirds complete. The ship is dark and the marine has its own light pool. In sparse fights creatures sit clearly second (`elite-pairs/…spitter`). In dense fights pale creature bodies and white hit flashes reach marine value, and the landmark tier is still mostly missing: landmarks are small, dim and often cropped. The marine keeps one identity everywhere: white plates, the ochre "07" dome and a cyan visor, from the title through the HUD to the motion strips. Only the rig portrait's finish drifts. The decision holding the picture back most is **camera framing subordinated to the room bounds**. A hierarchy built on a spotlit hero fails whenever the clamp shoves that hero into a corner or under the HUD, and it does in a significant share of frames.

## 6. Against R19-C

- **Done:** #6, quiet utility rings (they are thin and dashed, and no longer compete with red).
- **Partly done:** #1, creature silhouettes (the spitter is distinct, but crowds are still pale and the Brute and Matron are unchanged). #2, the marine owns white (only in sparse fights). #5, weak abilities (Overload and Meltdown fixed, Whiteout still a pale disc).
- **Not done:** #3, floor breakup. #4, the landmark light tier and re-centring the camera in Dark Heavy (it is worse in play23 and the conditions frames). #7, the rig and debrief portraits.
- **Its scores:** I agree with them. On this build I raise characters by 0.5 (5.5 → 6) for the spitter, Overload and Meltdown work, and leave the rest unchanged.
