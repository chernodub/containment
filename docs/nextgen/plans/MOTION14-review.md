# MOTION14 pose notebook

Frame numbers start at one and read left to right. The historical final8 reference uses 66.7 ms cells. The matched MOTION14 reel uses 50 ms cells. The paired weapon replay prescribes contacts and killing impulse. The Crew Checkpoint pack uses the public fire input, ordinary projectile contacts and the existing combat-text preference.

## Reference read

- Marine 45° travel, final8 frames 7–9. Two boots pass through a very large open split while the gap between helmet, receiver and front pauldron barely changes. The long foot reach alone illustrates speed. The rear hand carries nearly the same rectangle through all three drawings.
- Brute attack, final8 frames 1–10. The blade is already upright in the first drawing. The shoulder has nowhere to take it during the warning. Frame 11 drops both blades onto nearly the idle contour. Frames 13–19 give no convincing visual reason for the Brute to stay vulnerable.
- Crawler rifle hit, final8 frames 4–7. The fifth drawing has a white nick in front of the shell. The sixth tips the lantern. By the seventh the front feet and dorsal stripe are already back in the familiar footprint. The marine's brass persists longer than the victim's decision to take a step.
- Stalker contact sheet, attack row. The scythes compress into a narrow triangle and the body crosses a long distance on release. At the end the scythes have already withdrawn to their walking position.
- Carrier contact sheet, heavy and stagger rows. Each goes from a high pink diagonal to a flat pink crescent and back. Both pairs of front and middle feet collapse together. The second row adds no new allocation of weight.

The shipped forward run has 5.7° of hip rotation from its first key, 6.8° at the spine and zero local rotation change at ribs, firing shoulder and head. In the Brute clip the cleaver is fully raised at 42% of authored wind-up. The runtime starts sampling at precisely that point. The unplayed early drawings explain why increasing the animator's wind-up amplitude alone would leave the warning frozen. The Carrier brood bulb weights follow tail, tail.001 and tip. The existing heavy-hit tail has zero local rotation change throughout the clip.

## Baseline reel

- Forward travel F9–12 shows a tucked silhouette becoming two long, straight diagonals. The shoulder stripe barely rocks when the rear leg takes load. In the strafe F14 and F21 the same boot reaches far downscreen while both backpack tubes point the same way. In backpedal F14–17 the feet run backwards underneath a bust that could be pasted onto either frame. Stop/start F10–13 loses the moving feet before the pack has any visible follow-through.
- Rifle F4, F7 and F9 have muzzle flecks, but the top line of the gun remains horizontal. The small backward translation reads as a uniform whole-arm jerk. F12–15 gives me no sign the shoulder is unloading. Shotgun F2–4 has a useful body kick. F5–9 straightens the receiver to its ready line before I can see the fore-end pulled and pushed home.
- Crawler F6–8 takes the first shot with a tilted dorsal stripe. F9–10 repeats it. Only the shrinking/turning outline at F12–15 clearly indicates the third contact was different. In the Brute shotgun pair F7 obscures the working arm with hit flash. F9 puts the shoulder back over the same front feet. In the kill row F9–11 rolls into a compact ball with both blades disappearing together before the final side-down silhouette.
- Stalker F1–9 spends almost the whole 460 ms wind-up in the same short upright claw arrangement. F10–11 traverses the warning lane. F12–18 starts drawing the claws back beside the body while recovery still has more than half its time to run.
- Brute F1, F4, F7 and F11 show the blade tip at essentially the same high mark. F14–15 folds into a crouch. From F17 to F25 the blade returns next to its partner with too little drag to read as a miss.
- Carrier F1–13 holds the leftmost pink crescent low and still throughout the warning. One heavy contact folds six feet towards the same centre on F7–9. The second contact in the stagger study repeats the bright flat pile on F9–11. By F14 both could be the same animal at idle. There is no sequence of feet catching the brood load.

## Carriage revisions

1. At 480 pixels the first pass tilts the pack on the passing step. At native size F11 and F17 still open both shoes into a long split, with the pack pivoting closer to the helmet than to the supporting hip. F10–12 of the stop also lets the last shoe travel as it brakes. Shortened the cycle to 18 ticks while retaining velocity-matched stance, increased the rib bank and lateral shift over the supporting leg, and carried the existing foot lock through the braking window.
2. The shorter cycle now gives a bent knee at F11. At F14 the near shoulder tips in as the foot passes, but at F16 the leading toe is already pointed well outward. The strafe knee briefly points away from the next plant. The braking pose also rises to idle too evenly. Reduce toe opening on swing, bring the knee pole in, and let the hips sink and rebound once after the braking foot lands.
3. The corrected rifle-equipped start reveals another issue in the first two passes. F2–5 spend too much of the start moving between ready and cycle zero. Bring the push-off to the first three drawings and shorten the start. Keep the fully loaded pose on the travel cycle. The native camera remains fixed in the isolated footwork reel, so shoe-to-floor slip requires a translated run.

## Weapon revisions

1. In the first rifle pass F2/11 now move the receiver back and the stock rotates into the shoulder. In the native pair it crowds the helmet at peak. F5 shows a better gap between the barrel and shoulder. Keep the later upper-body check, reduce the first wrist displacement. The new brass reads as a brass case at quarter size, but F11 shows an oversized floating bar at native scale. Shorten its long axis. Shotgun F5–8 gains a hand pull yet the near elbow hides most of its return behind the receiver. Open that elbow on the pump and make the re-seat a quicker beat.

2. In the second weapon pass the F2 rifle receiver pulls back without touching the visor. The ejection still sits above the helmet by F11. Keep a short case with a dark flank and let it fall clear on its existing ballistic path. The shotgun F5–8 now shows the lead elbow open and close. Its last two cells have a little more vertical barrel rotation than a real fore-end cycle would produce.

## Rifle victim revisions

1. The first pass makes the shell pitch on F7, but F9 is still a replay of a tilted beetle. In the pack the light chip arrives earlier than I can pick out its bracing feet. Give the second impact a raking front pair, a larger twist across the firing line, and more of the original bounded offset. Keep the far feet under the load. The first capture attempt for this pass used the earlier dist after a TypeScript error; that receipt is retained separately and excluded from the comparison.

## Attack revisions

1. Stalker F1–9 now closes progressively and F14/18 keeps both scythes forward. At quarter size the forearms still merge late in the crouch. Separate the heights of the two blades and open the lead elbow before the last compression. Brute F4/7/11 describes an arc, but in F17–21 the cleaver comes up alongside the face as the torso backs away. Pin its recovery target to a point measured from the standing rig. Carrier F7/9 takes the first hit horizontally and F13–18 stands on one side in the repeated-hit pose. Strengthen the sac catch and widen the front replant.


### Second contacts and attack recovery

- Rifle victim pass 2. Compare the shell and near feet at F7, F10 and F12. The second contact now rakes the shell almost horizontal. The first collapse drawing at F12 puts the dorsal stripe back over an open foot, undoing the skid just as the third bullet lands. Preserve the last articulated pose at death entry and continue its local translation along the killing line before transferring to physics. In the full-room pack the rust chips at F9 occupy only a few pixels and the Brute and Carrier remain distinguishable behind the shot.
- Stalker pass 2. The last two wind-up frames separate the scythes at their tips. At F12 and F18 the buried arms read, but the trailing shoe has almost the same height and projection on both drawings. Add a trailing-foot drag, lift and crossing catch with pelvic roll during the first half of recovery. Brute F14–21 now keeps the leading blade low while the second arm supports the body. The bright pectoral opening is easier to read than the blade tip. Carrier F11 and F14 now put the visible sac on a different side of the footprint in the two impact rows. The first two contact frames are similar because they depict the same first hit.

### Elemental deaths, pass 1

- Kinetic F7–11 travels quickly but its first folded drawing is narrow enough to lose the back feet. Increase ventral folding and preserve the beam direction through the ordinary lethal contact receipt on the same tick.
- Cryo F7–11 holds its shape, but its first crack only slightly leans the plate before the detached frozen parts appear. Bring the bend earlier and increase the asymmetric leg splinter.
- Fire F7/9 pitches back and F14 curls. The two middle feet fold into a single silhouette too soon. Lift the flailing side higher and delay the second swing.
- Arc F7/9 holds together, then F11 collapses. Horizontal clearance under the rigid feet is slight. Widen the straight-legged brace before cutting its support.

### Final frame read

- Forward F8/11 transfers the pack from the extended rear foot to the bent receiving knee. The two soles are never as far apart as in the old F11. Side travel brings the trailing shoe across the other at F9–11. Backward F14 reaches behind the body while the barrel stays out in front. An independent translated lane supplies the missing ground reference. For the low parts of the steady stride the largest measured world travel per tick was 1.9 cm forward, 1.3 cm lateral and 0.5 cm backward.
- The rifle stock comes home between the bright burst frames. The bob remains slight against the broad visor at quarter scale. The shotgun pump reads in the elbow angle at F6/8, more clearly from the near side. A further shotgun-kill read found that a lone fatal shot skipped the living shoulder check. Give that one hit the first 84 ms of collapse. A rapid second or third hit inherits the preceding body pose and starts folding after 48 ms. Feed the late native weapon receipt to its existing corpse model.
- Crawler pass 3, F7/10/13. The first shot rolls the dorsal stripe and takes the nearer legs out of support. The second makes the front claw project farther across the stripe. At F13 the folded outline follows the skid before the corpse pivots. At 480×270 the red stripe and loss of footing carry the contact. Individual claws still disappear when a larger hostile crosses the line.
- Stalker pass 3, F7/11/17. The lead claw rises clear in F7, the hips travel through the strike and the trailing foot crosses under weight before F17. The thrust and warning remain the strongest part. The recovery foot is small against the rear body. The Brute's planted tip holds below the head at F18. The Carrier stagger keeps its narrow, canted outline at F16, long after the single hit has recovered its footprint.
- Element pass 2. The kinetic Crawler folds lengthwise on F10. The frost row holds the intact dorsal panel at F8, then opens a gap between near feet and shell at F15. Fire changes the sign of its roll between F7 and F11 and curls by F14. Arc retains the longer rigid shell diagonal through F8, then loses support by F15. The crack remains the least legible beat on the small Crawler. Native casts and their accepted targets are also recorded with combat text off in the Crew Checkpoint lane.

The native Overdrive lane exposed one additional overlap. At the moment of an accepted tick a target can already be in melee anticipation. Apply the elemental shoulder/limb delta over that sampled warning too. Whiteout keeps its actual frozen rig intact. In the beam frame the native lateral launch moves the near victim out of the lane almost immediately, limiting the time available to read the fold.

## Capture index

All directories below are relative to `artifacts/nextgen/motion14/`. Each action's native PNG and full-room WebP share a basename. The numbered passes record the same clock, facing and weapon for the corresponding comparison.

| Material | Capture directories in review order |
|---|---|
| Start, run, brake | `before/`, `after/carriage-1/`, `after/carriage-2-fire-1/`, `after/attacks-1/`, `after/final/` |
| Weapon carriage and fire | `before/`, `after/carriage-2-fire-1/`, `after/attacks-1/`, `after/final/` |
| Crawler rifle victim | `before/`, `after/hit-1/`, `after/hit-2/`, `after/ensemble-3/`, `after/contact-polish/`, `after/final/` |
| Stalker, Brute and Carrier | `before/`, `after/attacks-1/`, `after/attacks-2/`, `after/ensemble-3/`, `after/final/` |
| Elemental victims | `before/`, `after/elements-1/`, `after/ensemble-3/`, `after/contact-polish/overdrives/`, `after/final/` |
