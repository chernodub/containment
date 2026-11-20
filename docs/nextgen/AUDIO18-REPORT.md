# AUDIO18 combat audio

## Coverage before and after

Audited the GameEffect union and its emitters, the application subscription, and the snapshot routing in gameAdapter and AudioSystem. “Silent” means the transition has no dedicated audio. Incidental sound is described separately.

| GameEffect | Before | After |
|---|---|---|
| ability | Ability-specific cast, impact, tick, burst, end and sustained loop (abilities), denial and readiness (UI) | Existing routing retained. |
| wall-slam | Wall impact (impacts) | Existing routing retained. |
| shot | Pistol, rifle, shotgun, rocket or plasma (weapons), shell where applicable (impacts) | Existing routing retained. |
| hit | Flesh, armor, blocked, lethal, wall or plasma (impacts); packets without weapon or contact silent | Same contact cues. Enemy armor loss adds a danger alert when the target survives. |
| corpse | Body impact and family death (impacts, enemies) | Existing routing retained. |
| explosion | Size-dependent explosion and retained sample (impacts) | Existing routing retained. |
| acid | Spitter attack (enemies) | Existing routing retained. |
| hurt | Marine injury (impacts) | Existing routing retained. |
| pickup | Purchase chime (UI) | Dedicated two-note pickup chime (UI). |
| sync-corpse | Silent, bookkeeping | Silent. |
| enemy-attack | Family strike or projectile release (enemies), same whether it connects or misses | Existing five family strikes, plus charge onset from the enemy snapshot (danger). |
| enemy-warning | Family tell (enemies), generic crawler for untyped encounter cues | Family tells and flank/crossfire alerts (danger). |
| boon | Shatter, overload and pincer resolution (impacts); other boons and escort resolution silent | Shatter and overload (impacts), pincer and escort resolution (UI). Other boons still have no dedicated cue. |

| Player-facing transition | Before | After |
|---|---|---|
| Enemy wind-up and strike | Existing synthesized family-specific tells and swings (enemies) | Five distinctive tells (danger) and five strikes (enemies). The strike Foley plays on misses, and damage separately adds injury. |
| Enemy recovery | Silent | Silent. |
| Elite arrival | Silent; elite death has family variant | Elite triplet (danger). |
| Warden and Matron arrival and phases | Silent as separate milestones; generic family combat effects | Separate arrival motifs, Warden charge and wall-stun exposure, Matron brood warning and pod progression (danger). |
| Queen arrival and phase | Boss intro (UI), nest-spawn and vulnerability warning (enemies) | Existing intro (UI) and phase warnings (danger). |
| Boss pod hatch | Silent; pod destruction can produce generic combat effects | Opening and actual hatch each have a cue (danger). |
| Low health | Heartbeat loop at 30% (ambience) | Threshold alarm (danger) and existing heartbeat (ambience). |
| Marine armor exhausted | Silent beyond injury (impacts) | Metallic crack (danger). |
| Enemy armor broken | Silent as a distinct cue | Spatial metallic crack (danger) on a surviving target. |
| Dark onset and opening attack | Silent onset; normal attack warning | Power-down chime (UI). Opening attack uses its family tell (danger). |
| Coolant onset and recurring mechanic | Silent as distinct cues | Falling onset chime and a slide-entry chirp (UI). |
| Vent onset and recurring mechanic | Silent as distinct cues | Onset chime (UI), pressure warning and steam activation (danger). |
| Conduit onset and recurring mechanic | Silent as distinct cues | Onset chime (UI), repeating live-arc pulse (danger). |
| Brood onset and recurring mechanic | Silent as distinct cues | Onset chime (UI), pod opening and hatch (danger), cancellation (UI). |
| Sealed onset and recurring mechanic | Silent as distinct cues | Onset and timed hold release chimes (UI). Untimed shutters are static. |
| Encounter start or beat change | Silent as a distinct cue; flank and crossfire can use crawler fallback | Encounter tone (UI), directional flank and crossfire motifs (danger). |
| Encounter objective resolution | Pincer wall impact (impacts); escort silent; priority generic death | Rising confirmation (UI) for pincer, escort, priority and canceled reinforcements. |
| Ability cooldown restored and Overdrive full | Ready and Overdrive-ready (UI) | Existing routing retained. |
| Active Overdrive and hostile slow | Ability cues (abilities), music and hostile pitch treatment | Existing routing retained. |
| Weapon switch, reload, vent, empty reserve | Switch, staged reload, vent, dry click (weapons or impacts) | Existing routing retained. |
| Freeze onset | Freeze (impacts) | Existing routing retained. |
| Room entry and clear | Room-enter and room-clear (UI), environment loop (ambience) | Existing routing retained. |
| Checkpoint saved or failed | Checkpoint or denial (UI) | Existing routing retained. |
| Pause and resume | Transport fades, resumes loops and eligible reload | Existing routing retained. |
| Death and ending | Death or victory (UI), story ending explosion (impacts) | Existing routing retained. |

Counting rows with fully silent baseline coverage across both tables yields 12 before and 2 after. The remaining fully silent rows are corpse synchronization and generic enemy recovery. The count excludes partially covered rows and counts each transition category once per table.

## New and retained tells

| Cue | Sound |
|---|---|
| Crawler | Existing three rising scrapes and a sharp claw snap. |
| Stalker | Existing fast high sweep and a thin cutting strike. |
| Brute | Existing low rising growl and a descending slam. |
| Spitter | Existing pulsing wet rattle and a short spit burst. |
| Carrier | Existing slow bubbling pulse and a low, rattling strike. |
| Elite | Two matching metallic notes followed by a higher accent. |
| Warden | Three descending low metallic notes. |
| Matron | Low, high, low metallic call. |
| Charge | Two rising bass notes. |
| Exposed | Three descending metallic notes. |
| Pod opening | High falling metallic pair. |
| Hatch | Three rising rattles. |
| Critical | High, low, high alarm. |
| Armor | Close-set metallic crack with a lower tail. |
| Dark | Two low descending tones. |
| Coolant | Falling high pair. |
| Vent | Midrange up-and-back signal. |
| Conduit | Higher up-and-back signal. |
| Brood | Low up-and-back signal. |
| Sealed | Three descending lock tones. |
| Slip | Short high chirp that drops sharply. |
| Pressure | Repeated high note with a rising third hit. |
| Steam | Falling metallic pair. |
| Arc | Fast high, low, high metallic pulse. |
| Release | Low ascending unlock tones. |
| Encounter | Two rising midrange notes. |
| Flank | Panned metallic rise. |
| Crossfire | Panned high, low, high metallic call. |
| Resolution | Three rising confirmation tones. |
| Pickup | Quick pair of high rising notes. |

## Offline measurement

The warning bus ducked the other buses to 9.5% of their regular gain during admitted warnings. Family voice limits apply alongside an eight-voice danger cap and the existing global mixer cap. Enemy pitch variation uses the event identity and coordinates.

At full settings, the calm-room master peaked at **−23.42 dBFS** with RMS **−36.73 dBFS** over a 4-second render. The 12-second heavy-fight master peaked at **−3.69 dBFS** with RMS **−18.96 dBFS**. Both masters stayed below 0 dBFS. The heavy fight reached 37 voices with no rejected sources in this fixture.

During the overlapping Brute, Stalker and Spitter wind-ups (2.78–3.12 seconds), with rifle fire every 125 ms and a Whiteout loop, the warnings were **19.77 dB above the bed** in the strongest aggregate octave, 94–188 Hz. This exceeds 6 dB. The measurement sums stereo Hann-windowed FFT power over that interval, using the danger and summed ducked bed taps before shared reverb and master dynamics. It measures the combined warning signal and does not establish a separate margin for every enemy.

The existing audio evidence command measured peak, RMS and duration for all 268 recipes and saved the two mixes, stems and inventory to `artifacts/nextgen/audio18`. The artifacts are local and ignored by Git.

## Weakest remaining signals

1. Generic recovery has no dedicated cue. The last sound is the strike, except for explicit exposure milestones such as the Warden wall stun.
2. Dark rooms sound their entry and attack warnings, but the first-hit ambush bonus has no distinct sound.
3. The Warden, Matron and armor-related motifs share metallic timbres. Their identities have not been validated in a blind listening session.

## In-game verification

- `npm run build` passed TypeScript and the production build.
- The Arc seed-1729 desktop playtest cleared four rooms with zero errors using the requested fast mode and startup timeout.
- A separate desktop browser run used keyboard input on `#master-volume` and clicked `#sound` to mute and unmute. The slider moved to 1% and restored to 100%, the mute control reported its pressed state, and the restored settings persisted. The existing audio source instrumentation observed four loop stops on pause and two new loop starts on resume, with the audio context running.
