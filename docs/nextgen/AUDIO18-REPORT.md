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
| ambush | No event. | Two rising notes on an applied dark-room ambush bonus (UI). |
| sync-corpse | Silent, bookkeeping | Silent. |
| enemy-attack | Family strike or projectile release (enemies), same whether it connects or misses | Existing five family strikes, plus charge onset from the enemy snapshot (danger). |
| enemy-warning | Family tell (enemies), generic crawler for untyped encounter cues | Attack wind-ups (danger), flank/crossfire alerts (enemies) and regular spawn notices (UI). |
| boon | Shatter, overload and pincer resolution (impacts); other boons and escort resolution silent | Shatter and overload (impacts), pincer and escort resolution (UI). Other boons still have no dedicated cue. |

| Player-facing transition | Before | After |
|---|---|---|
| Enemy wind-up and strike | Existing synthesized family-specific tells and swings (enemies) | Five distinctive tells (danger) and five strikes (enemies). The strike Foley plays on misses, and damage separately adds injury. |
| Enemy recovery | Silent | Silent. |
| Elite arrival | Silent; elite death has family variant | Elite triplet (enemies). |
| Warden and Matron arrival and phases | Silent as separate milestones; generic family combat effects | Separate arrival motifs (enemies), Warden charge and Matron brood warning (danger), wall-stun exposure (UI). |
| Queen arrival and phase | Boss intro (UI), nest-spawn and vulnerability warning (enemies) | Existing intro (UI) and phase warnings (danger). |
| Boss pod hatch | Silent; pod destruction can produce generic combat effects | Pod opening warning (danger), actual hatch (enemies). |
| Low health | Heartbeat loop at 30% (ambience) | Threshold alarm (danger) and existing heartbeat (ambience). |
| Marine armor exhausted | Silent beyond injury (impacts) | Glassy crack (danger). |
| Enemy armor broken | Silent as a distinct cue | Spatial glassy crack (danger) on a surviving target. |
| Dark onset and opening attack | Silent onset; normal attack warning | Power-down and first-hit ambush chimes (UI). Opening attack uses its family tell (danger). |
| Coolant onset and recurring mechanic | Silent as distinct cues | Falling onset chime and a slide-entry chirp (UI). |
| Vent onset and recurring mechanic | Silent as distinct cues | Onset chime (UI), pressure warning and steam activation (danger). |
| Conduit onset and recurring mechanic | Silent as distinct cues | Onset chime (UI), repeating live-arc pulse (danger). |
| Brood onset and recurring mechanic | Silent as distinct cues | Onset chime (UI), pod opening (danger), hatch (enemies), cancellation (UI). |
| Sealed onset and recurring mechanic | Silent as distinct cues | Onset and timed hold release chimes (UI). Untimed shutters are static. |
| Encounter start or beat change | Silent as a distinct cue; flank and crossfire can use crawler fallback | Encounter tone (UI), directional flank and crossfire motifs (enemies). |
| Encounter objective resolution | Pincer wall impact (impacts); escort silent; priority generic death | Rising confirmation (UI) for pincer, escort, priority and canceled reinforcements. |
| Ability cooldown restored and Overdrive full | Ready and Overdrive-ready (UI) | Both remain on UI, and Overdrive readiness plays without ducking. |
| Active Overdrive and hostile slow | Ability cues (abilities), music and hostile pitch treatment | Existing routing retained. |
| Weapon switch, reload, vent, empty reserve | Switch, staged reload, vent, dry click (weapons or impacts) | Existing routing retained. |
| Freeze onset | Freeze (impacts) | Existing routing retained. |
| Room entry and clear | Room-enter and room-clear (UI), environment loop (ambience) | Existing routing retained. |
| Checkpoint saved or failed | Checkpoint or denial (UI) | Existing routing retained. |
| Pause and resume | Transport fades, resumes loops and eligible reload | Existing routing retained. |
| Death and ending | Death or victory (UI), story ending explosion (impacts) | Existing routing retained. |

Counting rows with fully silent baseline coverage across both tables yields 12 before and 2 after among baseline events. The ambush effect is new. The remaining fully silent rows are corpse synchronization and generic enemy recovery. The count excludes partially covered rows and counts each transition category once per table.

## New and retained tells

| Cue | Sound |
|---|---|
| Crawler | A sharp midrange onset, three rising scrapes and a sharp claw snap. |
| Stalker | A bright rising onset and a high sweep and a thin cutting strike. |
| Brute | A pulsing onset above the bass, a low rising growl and a descending slam. |
| Spitter | A higher bubbling onset, a pulsing wet rattle and a short spit burst. |
| Carrier | A low warning onset, a slow bubbling pulse and a low, rattling strike. |
| Elite | Two matching metallic notes followed by a higher accent. |
| Warden | Two low descending thuds with a gap. |
| Matron | One rising wet chirp with fast modulation. |
| Charge | Two rising bass notes. |
| Exposed | Three descending tones. |
| Pod opening | High falling metallic pair. |
| Hatch | Three rising rattles. |
| Critical | High, low, high alarm. |
| Armor | Short high glassy crack with a falling resonance. |
| Ambush | Two quick notes rising an octave. |
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

Unducked buses sit at unity. A danger onset attenuates music and ambience by 6 dB, abilities and impacts by 4 dB, weapons by 2.5 dB, and enemy ambience by 3 dB. UI stays at unity. The ramp takes 15 ms, the duck lasts through the first 250 ms, and the return takes 180 ms. Overlap may extend the hold at the same depth. Family voice limits, the danger cap and event-seeded pitch variation remain in place.

| Measurement | Reference | Revised | Change |
|---|---:|---:|---:|
| Calm master peak | −16.73 dBFS, pre-AUDIO18 | −16.73 dBFS | 0.00 dB |
| Calm master RMS | −29.82 dBFS, pre-AUDIO18 | −29.82 dBFS | 0.00 dB |
| Heavy weapons RMS during duck window | −19.14 dBFS, no wind-ups | −21.13 dBFS, three wind-ups | −1.99 dB |
| Heavy master peak | −2.93 dBFS, no wind-ups | −2.93 dBFS, three wind-ups | <0.01 dB |

The 4-second calm mix used the same cargo ambience and retained music at full settings on pre-branch commit `32fc552c` and on the revised branch. Peak and RMS matched at the raw PCM measurement precision.

The paired 12-second fights use the same event schedule, including rifle shots every 125 ms and an active Whiteout loop. The weapons comparison uses post-duck weapon-bus RMS over 2.50–3.18 seconds, from first warning onset through the last duck's release. The drop was 1.99 dB, within the 3 dB limit. The revised heavy master measured −15.67 dBFS RMS and stayed below full scale.

Across the three overlapping Brute, Stalker and Spitter wind-up onsets (2.50–2.99 seconds), the warning signal was **11.58 dB above the bed** in its strongest aggregate octave, **1.5–3 kHz**. This exceeds the 6 dB target. The analysis sums stereo Hann-windowed FFT power from the danger and ducked bed taps before shared reverb and master dynamics. It measures the combined onsets rather than each family's margin individually.

The existing audio evidence command measured peak, RMS and duration for all 269 recipes and saved the calm mix, both heavy mixes, stems and inventory to `artifacts/nextgen/audio18`. The pre-branch calm render is in `artifacts/nextgen/audio18-baseline`. These local artifacts are ignored by Git.

## Remaining listening work

Generic enemy recovery still has no dedicated cue. The dark-room ambush bonus now has its own two-note cue, and the Warden, Matron and armor signatures differ in register, envelope and rhythm. Their distinguishability has yet to be checked in a blind listening session.

## In-game verification

- `npm run build` passed TypeScript and the production build.
- The Arc seed-1729 desktop playtest cleared four rooms with zero errors using the requested fast mode and startup timeout.
- During the original AUDIO18 pass, a separate desktop browser run used keyboard input on `#master-volume` and clicked `#sound` to mute and unmute. The slider moved to 1% and restored to 100%, the mute control reported its pressed state, and the restored settings persisted. The existing audio source instrumentation observed four loop stops on pause and two new loop starts on resume, with the audio context running.
