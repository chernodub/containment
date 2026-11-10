# A1 public API and integration notes

All paths are relative to the repository. Frozen shared ability types/catalog IDs are preserved. No dependencies added.

## Game-facing API (`src/DepthGame.ts`)

```ts
game.abilities: AbilitySystem;
game.abilities.snapshot: AbilitiesSnapshot;
game.stats: RunStatsSnapshot;
game.newRun(seed?: number, options?: {rigSelect?: boolean}): void;
game.chooseRig(id: RigId): boolean;
game.setAimPoint(point: {x:number;y:number} | null): void;
game.useAbility(slot: AbilitySlot): boolean;
game.damage(id:number, amount:number, impulse?:{x:number;y:number},
  source?:DamageSource, feedback?:boolean):
  {applied:boolean;died:boolean;absorbedByArmor:number;damage:number};
```

`newRun(seed)` retains starting-boon + default Breacher. Opt-in rig selection keeps game status reward until choosing a rig and the starting boon. Seed omission uses a deterministic per-instance LCG sequence. `GameInput` adds optional `aimPoint?: {x:number;y:number}|null`; input feeds world cursor position and movement intent on the same keyboard edge. Shift/Q/F/V are edge-triggered, ignored outside gameplay/loading/typing, and reset on blur. Space retains weapon aim assist while the cursor point remains available for placed powers. Existing controls remain.

`GameEffect.type` adds `ability`. Optional `ability?:AbilityEvent`, `damage?:number`, `lethal?:boolean`, `source?:'weapon'|'ability'|'status'|'boon'` carry confirmed receipts. Damage includes actual armor + health removed, clamped against overkill. Status/delayed-boon receipts coalesce by target/source per simulation update (at most128 entries). Projectile pellet/piercing hits share a shot receipt for accuracy statistics.

## Runtime (`src/game/abilities/AbilitySystem.ts`)

```ts
new AbilitySystem(host: AbilityHost);
setRig(rig:RigId, charge?:number):void;
resetRoom():void;
setIntent(x:number,y:number,point:AbilityPoint|null):void;
use(slot:AbilitySlot, enabled?:boolean):boolean;
addCharge(damage:number,kills?:number):void;
hostileDelta(ms:number):number; // query BEFORE update; integrates partial Overclock expiry
update(ms:number):void;
blocksMovement(from:AbilityPoint,to:AbilityPoint,radius:number):boolean;
interceptProjectile(from:AbilityPoint,to:AbilityPoint,radius:number,damage:number):boolean;
onKill(target:MutationTarget,wasFrozen?:boolean):void;
get snapshot():AbilitiesSnapshot;
get invulnerable():boolean;
get dashing():boolean;
get hostileTimeScale():number;
get moveSpeedMultiplier():number;
get overclocked():boolean;
get ignitingShots():boolean;
segmentDistance(p:AbilityPoint,a:AbilityPoint,b:AbilityPoint):number;
```

`AbilityPoint = Readonly<{x:number;y:number}>`. Exported `AbilityHost` has these callbacks:

```ts
enabled?():boolean; // the game supplies status===playing; cached readiness follows phase changes
player():AbilityPoint & {angle:number;radius:number;vx:number;vy:number};
targets():readonly MutationTarget[];
visible(from:AbilityPoint,to:AbilityPoint):boolean;
traverse(from:AbilityPoint,to:AbilityPoint,radius:number):boolean;
movePlayer(dx:number,dy:number):void;
damage(target:MutationTarget,amount:number):boolean; // true when killed
statuses(id:number):{chilled:boolean;frozen:boolean;shocked?:boolean};
status(target:MutationTarget,kind:'chill'|'freeze'|'burn'|'shock',amount:number):void;
launch(target:MutationTarget,x:number,y:number):void;
arc(origin:MutationTarget,targets:readonly MutationTarget[]):void;
has(id:MutationId):boolean;
reload():void;
emit(event:AbilityEvent,x:number,y:number):void;
```

`ABILITY_LIMITS = {zones:24,deployables:8,targets:64}`. Normal steps are bounded at100ms (DepthGame50ms). Timers snap sub-microsecond floating-point residue to zero; 60Hz periodic effects retain their final pulse. Dash trails start at arrival with their full catalog lifetime, and slot activity derives from surviving entities. Synchronous event subscribers may inspect snapshots without retaining stale activation/timer data. Independent dash charge timers are2600ms each. Walls use exact swept circle vs oriented box/corners; projectile contacts choose the first intersected wall. Marine/friendly shots pass through friendly constructs; hostile contact attacks destroy them (20 damage per hostile per250 hostile ms). Freeze/shock suspends these attacks. Destruction/expiry releases occupancy; Glacier shatters once. Normal durations/geometry/damage match catalog. Tesla Pylon zaps26 per500ms and marine link12 per500ms, width28, link range280. Native zone ticks250ms; Napalm4.5 damage per tick, Whiteout/Meltdown4. Glacier burst radius150. Hard control uses existing shared elemental runtime; champions/elites/Queen resist with brief slow/stagger. Overclock is1.5x fire rate and30% hostile time. Accepted native wall contacts emit feedback even without a wall-damage boon; damage remains boon-gated. Railbreaker probes both perpendicular collision rays with a bounded binary search and launches toward the nearer wall with enough force to cross an authored room. Cast origins/aim are captured on press for stable anticipation shapes.

## Shared status and weapon adapters

```ts
MutationRuntime.applyAbilityStatus(target:MutationTarget,
  kind:'chill'|'freeze'|'burn'|'shock',amount:number):void;
MutationRuntime.launchAbility(target:MutationTarget,x:number,y:number):void;
MutationRuntime.abilityArc(origin:MutationTarget,targets:readonly MutationTarget[]):void;
CombatSystem.setOverclock(active:boolean):void;
CombatSystem.instantReload():boolean;
```

`MutationTarget` adds optional `resistant?:boolean`. `statuses()` adds `shocked:boolean`. `MutationHost.damage(id,amount,source?:'status'|'boon')` attributes shared damage without parallel statuses. Freeze/shock also halt ordinary enemy AI/attack timers until expiration. Standard ammo transfers still dispatch normal reload events; game adapters call completedReload for Cold Snap/Combat Medic.

## Stats (`src/game/abilities/RunStats.ts`)

```ts
type DamageSource='weapon'|'ability'|'status'|'boon';
new RunStats(snapshot?:RunStatsSnapshot);
reset(snapshot?:RunStatsSnapshot):void;
get snapshot():RunStatsSnapshot;
enterRoom(id:string):void;
update(ms:number,id?:string):void;
recordKill(family:EnemyId):void;
recordDamage(source:DamageSource,amount:number):void;
recordDamageTaken(amount:number):void;
recordShot(hit?:boolean):void;
recordShotHit():void;
recordAbilityUse(slot:AbilitySlot):void;
recordCredits(amount:number):void;
isValidRunStatsSnapshot(value:unknown):value is RunStatsSnapshot;
```

Snapshot: `kills:{total,byFamily:Record<EnemyId,number>}`, `damageDealt:Record<DamageSource,number>`, `damageTaken`, `shotsFired`, `shotsHit`, `abilityUses:Record<AbilitySlot,number>`, `overdrivesUsed`, `highestMultiKill`, `roomTimeMs:Record<string,number>`, `creditsEarned`. Snapshots are deeply frozen/lazily cached. Exported `RUN_STATS_LIMITS`: counters1e9, time1e12ms,20 rooms,4096 entries in the1s kill window. Window is transient and clears across rooms/restores.

## Run/build/persistence additions

```ts
createBuild(rig?:RigId):BuildState;
draftMutationOffers(seed:number,build:BuildState,rare?:boolean,
  exclude?:readonly MutationId[],depth?:number,rig?:RigId):readonly MutationDefinition[];
createExpedition(seed:number,resources:RunResources,options?:{rigSelect?:boolean}):Expedition;
chooseExpeditionRig(expedition:Expedition,id:RigId):Expedition;
type ExpeditionRuntimeState=Pick<RunCheckpoint,'abilities'|'stats'>;
expeditionCheckpoint(expedition:Expedition,savedAt:number,runtime?:ExpeditionRuntimeState):RunCheckpoint;
isValidCheckpointExtensions(value:unknown):boolean;
```

`BuildState.rig?:RigId`; `RunPhase` adds `rig-select`; `RunCheckpoint`/`Expedition` add optional `abilities?:{overdriveCharge:number}` and `stats?:RunStatsSnapshot`. Strict old schema is still accepted unchanged; unknown keys/corrupt optional fields rejected. Restore defaults missing rig to Breacher, meter/stats to zero. Meter/stats survive reward and route boundaries; transient casts/buffs/constructs reset. Mutation definitions add `abilityOnly?:boolean` and `rig?:RigId`. Rig drafts include matching/universal augments; calls without a rig preserve legacy draft sampling. Exports `AugmentId` and `AUGMENT_BOONS`.

## First twelve augments

- Breacher: **Afterquake** (`afterquake`) repeats Slam at the original point after450ms for35 damage; **Reinforced Bulwark** (`reinforced-bulwark`) doubles health and adds2s.
- Cryo: **Spreading Nova** (`spreading-nova`) adds20 radius per already-chilled visible target in the original radius, max100; **Twin Glacier** (`twin-glacier`) places parallel walls40 units forward/back.
- Pyro: **Scorched Fan** (`scorched-fan`) leaves a radius120 pool180 forward for2.5s; **Napalm Triplet** (`napalm-triplet`) replaces the120 pool with three80-radius pools at0/±100 lateral.
- Arc: **Forked Overload** (`forked-overload`) adds two targets (eight max); **Twin Pylon** (`twin-pylon`) deploys two pylons±50 lateral.
- Universal: **Reserve Thruster** (`reserve-thruster`) +1 dash charge; **Tactical Salvage** (`tactical-salvage`) refunds350ms Q cooldown per kill; **Drive Dynamo** (`drive-dynamo`) +30% meter charge; **Slide Loader** (`slide-loader`) instant standard-reserve reload on dash.

## Capture API additions

Debug-only `startRun(seed?:number,options?:{rigSelect?:boolean}):Promise<void>` and `prepare():Promise<void>` synchronize room revision before preparing assets. All16 `ability:<id>` scenarios use public game actions; each captured frame includes abilities/stats. Declarative scenario `setupArgument` supplies serializable setup data. Capture waits two compositor frames after refresh without advancing frozen simulation. `node scripts/nextgen/ability-driver.mjs --label=A1-abilities` checks all16 production fixtures plus actual Shift/Q/F/V keyboard input through the production InputController.

## Integration request: immediate production HUD refresh

The unchanged production smoke reads old weapon ammo after Start/Restart because `start()` calls syncScreen but waits up to80ms for `hud()`. Both statements are present in baseline69cd88a; game default shotgun/starting-boon behavior is unchanged. Native inputs were held during the draft correctly; only the displayed baseline was stale. `A1-integration.patch` is a concrete one-line request for the main/UI owner: call `hud()` immediately after `syncScreen(true)` in `start`. A1 ownership explicitly excludes main.ts, so this patch is provided rather than applied. No smoke assertion was weakened.
