# ONB14 onboarding and interface

## First five minutes

1. From the title, choose difficulty and begin. Rig selection offers **Recommended loadout**, which equips Cryo, prefers Cryogenic among the seed’s offered starting boons, and enters Awakening Bay in one action. It falls back to a Recovery or common offer. The other action equips the selected rig and opens the full draft. The last manually equipped rig is restored through a device preference.
2. Awakening Bay starts with the existing Crawler lesson and follow-up swarm. The authored Brute and revealed Stalker introductions in this checkout are in rooms two and three. The optional practice Brute appears as soon as Awakening Bay would normally open its reward. **Skip bonus drill** opens that reward immediately.
3. The practice Brute telegraphs a sweep. Enter its warning, leave the footprint before the strike, and land damage during recovery. The objective changes to **Punished · 20 CR**, credits are granted once, and the boon draft opens after 1.1 simulation seconds. A missed lesson can reappear at the first isolated wind-up from room three onward.
4. Drafts put the behavior and tactical diagram on the card. The room record folds into a disclosure. The shotgun boon is **Wall Slam** and retains its original mutation ID. At a route junction, the cards show the room or the offered detour’s artwork alongside its terms.
5. The debrief keeps the fatal hit and the room damage ledger separate. The retry lesson follows the highest source in that ledger. **Retry — same rig** starts a new seed with the same rig, current difficulty and first installed boon in the V3 run. Keyboard users can Tab to retry or use the existing custom flow.

## Combat cues

| Cue | Trigger and retirement |
| --- | --- |
| Step across the red edge, then shoot the recovering body | Awakening Bay bonus drill, followed by a single fallback at an isolated warning from room three if the player still has no completion. Drill completion displays Punished before advancing. |
| F — shatter for 100 | First visible enemy near a live Glacier wall. The F caption says Shatter during wall lifetime and the dial still shows the remaining time. |
| Q — ignite marked targets | First visible burning target in the ready Flashfire fan. Diamonds and Q · Ignite N update as the aim and burns change. |
| Shift — Ram into Bulwark | First visible target in the prospective Ram lane whose lateral shove crosses Bulwark. A small cross persists while that opportunity is present. |
| Next hop | First visible Static Step or Overload candidate. The faint link updates as the moment changes. |
| RESISTED | A shielded body begins a resisted control state. The outline separates over 420 ms, with a 1.1-second rearm per body. |
| Pod countdown | Full ring when sealed, fading arc and pulsing scale when swelling, open mesh and raised core emission for the final 500 ms. |

Mastery text retires on lost opportunity or after 2.5 presentation seconds and is persisted per rig. Turning **Show mastery hints** back on rearms the prompts. The aim indicators are independent of the instructional text.

## Read model

- `DepthGame.awakeningDrill` exposes a copy of the current practice target and evade/confirmation state. The host adjudicates the committed footprint at strike and recovery damage with the normal simulation clock.
- `DepthGame.currentAimPoint` exposes a copy of the current aim for Arc. `getMasteryPreview` derives wall, burn, Ram and Arc opportunities from current entities.
- `EnemySnapshot.podStage` and `podProgress` carry authoritative hatch presentation. Rendered pod volumes use retained meshes and material instances.
- The additional UI preference and the rig selection preference are separate from checkpoints. V3 retry uses the ordered build history, where the first boon is the starting boon.

## Evidence and limitations

The capture folder is `artifacts/nextgen/onb14/`, with 480×270 copies under `reduced/`. The three debrief captures use staged native damage receipts for Crawler, Stalker and Spitter. Pod and mastery scenarios stage legal contacts and use native clocks and status rules. The drill scenario skips the opening kills by directly applying damage before demonstrating the drill itself. These are staging fixtures, not measured player learning.

| Evidence | Native PNGs in `artifacts/nextgen/onb14/` |
| --- | --- |
| Start, records and routes | `rig-select.png`, `starting-boon.png`, `augment-draft.png`, `route.png` |
| Awaken, evade and punish | `onb14-drill-{before,during,after}-awakening-bay.png` |
| Mastery and shield | `onb14-mastery-{cryo,pyro,breacher,arc,resisted}-awakening-bay.png` |
| Pods | `onb14-pod-{sealed,swelling,opening}-awakening-bay.png` |
| Retry lessons | `onb14-death-{crawler,stalker,spitter}.png` |

The trial body looks like an ordinary Brute. Its bonus badge and recovery text carry the armor lesson. Room-three follow-up depends on an isolated wind-up and can be missed if the player clears from range. Ram predicts Bulwark contact because standing Bulwark is the trigger for native Ram crush damage. Static Step projects from an unobstructed endpoint, so its candidate can change when the player moves or a dash is cut short. Unknown detour art keys use the destination’s illustration. At quarter scale, fine diagram strokes and secondary type lose contrast, particularly the one-shot mastery text. This is a desktop viewport reduced for review.

## Verification

The baseline dependency install and build passed. The production build passes with Vite’s existing large-chunk advisory. The initial capture pass wrote all 18 native frames with no capture errors. Each was opened at native size and as a 480×270 reduction. The review prompted stronger launch-button hierarchy, equal-height route illustrations, a wider open pod, a dedicated drill prompt near the action bar, and visible live mastery captions in the compact HUD.

The foreground browser campaigns ran serially at seed 1729. Both reached the four-room limit with zero errors and defects. Each earned 24 credits in Awakening Bay, including the 20-credit drill bonus.

| Campaign | Native result | Local receipt |
| --- | --- | --- |
| Cryo, Story | Four clears. Recommended loadout selected Cryo and Cryogenic. A deliberate F recast in Communal Atrium was followed by a 100-damage burst in the trace. | `artifacts/nextgen/playtest/cryo-1729/report.json`, `trace.ndjson` |
| Breacher, Standard | Four clears. Entered via the custom rig and boon selection. | `artifacts/nextgen/playtest/breacher-1729/report.json` |

The final tree factors the drill decision into the shared native and render-free bot policy. The audited campaign executes the same decision at its original runner call site. Both campaigns render every simulation tick. Their duration reflects host load and capture overhead.

The final build’s 13 refreshed frames and their reviewed reductions are under `artifacts/nextgen/onb14/polish/` and `artifacts/nextgen/onb14/polish/reduced/`. The full first pass retains sealed and swelling pods and the three staged debriefs. Both capture manifests report zero failures. The final frames show the two live ability captions, the faint Arc and Ram lines, the widened opening pod, and the three states of the drill prompt. The enlarged opening is easiest to tell apart by its bright exposed core. At 480×270 the preview lines remain deliberately subdued beside hostile warnings.
