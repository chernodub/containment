# R18 — eighteenth review round (gallery `final13`, 2026-11-21)

Reviewers: GPT Astra 6.2 at high reasoning for the visual (`R18-A-visual-verdict.md`) and play-and-feel
(`R18-B-play-verdict.md`) verdicts; Claude Opus for a bounded art-director pass (`R18-C-opus-art-verdict.md`).
Scale: 7 = solid commercial indie, 10 = best in class. Gallery captured fresh at `9ce127cb` (wave 21); one screen
(the open rig inspector) recaptured from the layout fix `6aac9aa1`.

| Visual | R17 Astra | R18 Astra | R17 Opus | R18 Opus | | Play (Astra) | R17 | R18 |
|---|---:|---:|---:|---:|---|---|---:|---:|
| First impression | 7.3 | 7.5 | 6.5 | 6.5 | | Core combat loop | 7.0 | 7.5 |
| Interface and HUD | 7.6 | 7.5 | 7.5 | 7.5 | | Ability kits / rigs | 8.0 | 8.0 |
| Combat readability | 6.7 | 7.0 | 6.5 | 6.5 | | Enemy design and counterplay | 7.0 | 7.0 |
| Environments | 6.4 | 6.5 | 5.5 | 5.5 | | Game feel | 6.5 | 7.0 |
| Ability spectacle | 6.5 | 6.8 | 6 | 6.5 | | Build variety and depth | 6.5 | 7.0 |
| Characters and creatures | 5.9 | 6.0 | 5.5 | 6 | | Onboarding and clarity | 6.5 | 7.0 |
| Animation and motion | 6.0 | 6.2 | – | – | | Interface flow | 7.5 | 7.5 |
| Visual cohesion | 6.8 | 7.2 | 5.5 | 5.5 | | Pacing and difficulty | 6.5 | 7.0 |

Calibration: US$10, "a budget commercial indie with a particularly good expedition interface; the first choice
already meets my premium-indie benchmark" (Astra visual); "a solid commercial indie with an unusually good set of
four rigs; its largest gap to premium is keeping the enemy responsible for the next decision visible" (Astra play);
"a polished early-access indie: an AA-grade interface around actors that have moved up a notch and floors that have
not", US$15 (Opus).

**Honest reading.** Slow, real, small. For the first time every play score is at or above 7.0 and the visual
reviewer puts combat readability at 7.0. Characters have risen half a point per round for three rounds with both
visual reviewers (Opus 5 → 5.5 → 6). No single score moved more than half a point, so each step alone is inside
reviewer noise; the direction over three rounds is not. The game is a solid commercial indie in play and interface
and a budget indie in its picture. It is not premium, and no reviewer says it is close.

What the three verdicts agree on:
1. **The owner of the next hit is still lost in three situations**: when it is below the frame (a Spitter with 83 ms
   left in its wind-up and almost no body on screen; the Armory lower approach), when actors overlap each other
   (Arc against the Loading Bay wall, Crawlers stacked at the marine's hip), and in darkness. Fading the dock cannot
   show a body that is outside the viewport. Opus separately says the marine is too small at 480×270 in real fights.
2. **Small creatures still lose their facing; the heavies still lack a face in their attack poses.** The shells are
   credited; the loaded poses are not (Stalker "a violet knot with two feet"; the Warden's shoulders swallow its
   forehead in the charge; the Matron's gaze cannot be found). Opus: the Brute "melts on death".
3. **Environment surfaces.** Opus names this the single decision holding the picture back for the second round:
   "flat toon fill inside an ink line, with no painted value modelling" makes props, landmarks and floors read as
   outlined greybox. Astra: room centres rely on the stencil word; landmarks are in frame but unlit and untextured.
   The repeated floor stencils overshot (fixed after capture in `b73cc5cb`: one faint label per room).
4. **Out-of-game art is in another language** (Opus, third round): title creatures soft and brown with floating black
   strokes; the first route card's two illustrations read as smeared crops.
5. **Thin or cooling effects**: Meltdown's centre is cool for an ultimate, Overload is a thread, Napalm's first flash
   is a soft ball, Railbreaker and Arc endpoints lose their victims.
6. **Play, from the traces**: nobody fires plasma in the first plated-enemy room in any campaign (166 rifle rounds to
   one plasma bolt at the Plate-breaker fight); the Cryo death was attrition with an unused dash the debrief never
   mentions; the Warden's opening can happen off-screen; too many fights reward the same retreat; the finale costs
   more without a distinctive final move.

Measured at the wave-21 head on a quiet machine (16 trials): Safety-interlock on High is slightly worse, Pyro
8.5–9.2% of frames over 20 ms (was 7%) and Arc 5.6–6.5% (was about 4%); every other High and Low trial 1.6–3.7%.

Wave 22 (from this): camera and framing by time to impact; attack poses and faces (Opus, bounded) with motion;
a painted surface model for the environment (Opus, bounded) and four room centres; title and guardian cards in the
game's own render; ultimates with heat and victims; play staging (first plate, Warden wall, finale move, debrief);
High frame tail in Safety-interlock.
