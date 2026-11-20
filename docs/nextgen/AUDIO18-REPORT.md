# AUDIO18 combat audio

## Baseline coverage

Audited the GameEffect union and its emitters, the application subscription, and the snapshot routing in gameAdapter and AudioSystem. “Silent” means the transition has no dedicated audio. Incidental sound is described separately.

| GameEffect | Before |
|---|---|
| ability | Ability-specific cast, impact, tick, burst, end and sustained loop (abilities), denial and readiness (UI) |
| wall-slam | Wall impact (impacts) |
| shot | Pistol, rifle, shotgun, rocket or plasma (weapons), shell where applicable (impacts) |
| hit | Flesh, armor, blocked, lethal, wall or plasma (impacts); packets without weapon or contact silent |
| corpse | Body impact and family death (impacts, enemies) |
| explosion | Size-dependent explosion and retained sample (impacts) |
| acid | Spitter attack (enemies) |
| hurt | Marine injury (impacts) |
| pickup | Purchase chime (UI) |
| sync-corpse | Silent, bookkeeping |
| enemy-attack | Family strike or projectile release (enemies), same whether it connects or misses |
| enemy-warning | Family tell (enemies), generic crawler for untyped encounter cues |
| boon | Shatter, overload and pincer resolution (impacts); other boons and escort resolution silent |

| Player-facing transition | Before |
|---|---|
| Enemy wind-up and strike | Existing synthesized family-specific tells and swings (enemies) |
| Enemy recovery | Silent |
| Elite arrival | Silent; elite death has family variant |
| Warden and Matron arrival and phases | Silent as separate milestones; generic family combat effects |
| Queen arrival and phase | Boss intro (UI), nest-spawn and vulnerability warning (enemies) |
| Boss pod hatch | Silent; pod destruction can produce generic combat effects |
| Low health | Heartbeat loop at 30% (ambience) |
| Marine armor exhausted | Silent beyond injury (impacts) |
| Enemy armor broken | Silent as a distinct cue |
| Dark onset and opening attack | Silent onset; normal attack warning |
| Coolant onset and recurring mechanic | Silent as distinct cues |
| Vent onset and recurring mechanic | Silent as distinct cues |
| Conduit onset and recurring mechanic | Silent as distinct cues |
| Brood onset and recurring mechanic | Silent as distinct cues |
| Sealed onset and recurring mechanic | Silent as distinct cues |
| Encounter start or beat change | Silent as a distinct cue; flank and crossfire can use crawler fallback |
| Encounter objective resolution | Pincer wall impact (impacts); escort silent; priority generic death |
| Ability cooldown restored and Overdrive full | Ready and Overdrive-ready (UI) |
| Active Overdrive and hostile slow | Ability cues (abilities), music and hostile pitch treatment |
| Weapon switch, reload, vent, empty reserve | Switch, staged reload, vent, dry click (weapons or impacts) |
| Freeze onset | Freeze (impacts) |
| Room entry and clear | Room-enter and room-clear (UI), environment loop (ambience) |
| Checkpoint saved or failed | Checkpoint or denial (UI) |
| Pause and resume | Transport fades, resumes loops and eligible reload |
| Death and ending | Death or victory (UI), story ending explosion (impacts) |
