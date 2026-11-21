import {createEncounterPlan} from '../game/waves/EncounterDirector';
import type {RunNode} from '../game/roguelike/types';
import type {AlertCue} from '../game/audio/alertCues';
import type {EnemySnapshot} from '../game/enemies/EnemySystem';
import {ROCKET_ARM_DISTANCE} from '../game/combat/catalog';
import {deployableContact} from '../game/abilities/AbilitySystem';
import type {DepthGame} from '../DepthGame';
import type {DepthRenderer} from '../render/DepthRenderer';
import type {AbilitiesSnapshot, AbilitySlot, RigId} from '../game/abilities/contract';
import {GRAPHICS_PRESETS, resolveGraphicsOptions, type GraphicsOptions} from '../render/graphicsOptions';
import type {RunStatsSnapshot} from '../game/abilities/RunStats';
import type {GraphicsTier} from '../render/FrameBudget';
import {ENEMY_ATTACK_SHAPES} from '../game/enemies/attackShapes';
import {canTraverseExpedition} from '../game/world/expeditionGeometry';
import {hasClearExpeditionShot} from '../game/world/expeditionGeometry';
import {enemyShotRadius} from '../game/combat/enemyContact';
import {segmentIntersectsRect} from '../game/input/aimAssist';
import {ABILITY_CATALOG} from '../game/abilities/catalog';
import type {PlacementPreviewState, PlacementPreviewPoint, PlacementAbility} from '../render/abilities/PlacementPreview';
import type {ScreenBox} from './hud/weaponInput';
export {getShopProjection} from './shopProjection';

type NextRenderer = DepthRenderer & {
  graphicsOptions?: GraphicsOptions;
  setGraphicsOptions?: (options: Partial<GraphicsOptions>) => void;
  worldToScreen?: (x: number, y: number, height?: number) => {x: number; y: number};
  setHudInsets?: (insets: HudInsets) => void;
  actorScreenBounds?: (id: number, x: number, y: number, radius: number, out: ScreenBox) => boolean;
};

export function setHudCoachedTarget(renderer: DepthRenderer, id: number | null): void {
  renderer.hudCoachedTargetId = id;
}

export type HudInsets = Readonly<{top: number; right: number; bottom: number; left: number}>;
const hudInsets = new WeakMap<DepthRenderer, HudInsets>();

/** CSS-pixel edge occupancy, independent of DPR/render scale. Legacy renderers safely ignore it. */
export function setHudInsets(renderer: DepthRenderer, value: HudInsets): void {
  const hook = (renderer as NextRenderer).setHudInsets;
  if (typeof hook !== 'function') return;
  const top = Number.isFinite(value.top) ? Math.max(0, value.top) : 0;
  const right = Number.isFinite(value.right) ? Math.max(0, value.right) : 0;
  const bottom = Number.isFinite(value.bottom) ? Math.max(0, value.bottom) : 0;
  const left = Number.isFinite(value.left) ? Math.max(0, value.left) : 0;
  const previous = hudInsets.get(renderer);
  if (previous?.top === top && previous.right === right && previous.bottom === bottom && previous.left === left) return;
  const next = {top, right, bottom, left};
  hudInsets.set(renderer, next);
  hook.call(renderer, next);
}

/** Optional live body projection; legacy/missing models retain the caller's radius fallback. */
export function projectActorBounds(renderer: DepthRenderer, id: number, x: number, y: number, radius: number, out: ScreenBox): boolean {
  const hook = (renderer as NextRenderer).actorScreenBounds;
  return typeof hook === 'function' && hook.call(renderer, id, x, y, radius, out);
}

type HostileWarningVisitor = (x: number, y: number, radius: number, endX: number, endY: number) => void;
const warningFrom = {x:0,y:0}, warningTo = {x:0,y:0};
/** Read native pending attacks every frame: slow time, cancellation and death stay authoritative. */
export function visitHostileWarnings(game: DepthGame, visit: HostileWarningVisitor): void {
  for (const enemy of game.enemies.snapshot.enemies) {
    if (enemy.health <= 0 || enemy.windupMs <= 0 || !enemy.pendingAttack) continue;
    if (enemy.pendingAttack === 'spit') {
      visit(enemy.lockX, enemy.lockY, ENEMY_ATTACK_SHAPES.spitterProjectileRadius, enemy.lockX, enemy.lockY);
      continue;
    }
    const angle = Math.atan2(enemy.lockY, enemy.lockX), dx = Math.cos(angle), dy = Math.sin(angle);
    const maximum = ENEMY_ATTACK_SHAPES.chargeSpeed * ENEMY_ATTACK_SHAPES.chargeDurationMs / 1000;
    warningFrom.x = enemy.x; warningFrom.y = enemy.y;
    let legal = 0, blocked = maximum;
    // Match the native warning's wall-clipped extent; this only reads legal geometry.
    for (let distance = 16; distance <= maximum + 16; distance += 16) {
      const probe = Math.min(distance, maximum);
      warningTo.x = enemy.x + dx * probe; warningTo.y = enemy.y + dy * probe;
      if (!canTraverseExpedition(game.geometry, warningFrom, warningTo, enemy.radius)) {blocked = probe; break;}
      legal = probe; if (probe === maximum) break;
    }
    if (legal < maximum) for (let step = 0; step < 6; step++) {
      const probe = (legal + blocked) / 2;
      warningTo.x = enemy.x + dx * probe; warningTo.y = enemy.y + dy * probe;
      if (canTraverseExpedition(game.geometry, warningFrom, warningTo, enemy.radius)) legal = probe;
      else blocked = probe;
    }
    visit(enemy.x, enemy.y, enemy.radius, enemy.x + dx * legal, enemy.y + dy * legal);
  }
  const boss = game.boss.snapshot, warning = boss.pendingTelegraph;
  if (boss.active && warning && warning.delayRemainingMs > 0) visit(warning.targetX, warning.targetY, warning.radius, warning.targetX, warning.targetY);
}

export type UiFixture = Readonly<{
  phase?: string;
  abilities?: AbilitiesSnapshot | null;
  stats?: RunStatsSnapshot;
  preferences?: Readonly<{combatText?: boolean; combatTextDensity?: 'full' | 'reduced'; radar?: boolean; hints?: boolean; masteryHints?: boolean}>;
}>;
const fixtures = new WeakMap<DepthGame, UiFixture>();
const graphics = new WeakMap<DepthRenderer, GraphicsOptions>();

/** The opt-in debug module is the only production caller that injects fixtures. */
export function setUiFixture(game: DepthGame, fixture: UiFixture | null): void {
  if (fixture) fixtures.set(game, fixture);
  else fixtures.delete(game);
}

/** Title always remains reachable, even when an abandoned run awaits a rig. */
export function getUiPhase(game: DepthGame): string {
  return fixtures.get(game)?.phase ?? (game.status === 'menu' ? 'menu' : String(game.expedition.run.phase));
}

/** Read the authoritative runtime, with explicit debug-only snapshot injection. */
export function getAbilities(game: DepthGame): AbilitiesSnapshot | null {
  const fixture = fixtures.get(game);
  if (fixture && 'abilities' in fixture) return fixture.abilities ?? null;
  return game.abilities.snapshot;
}

/** Dispatch through the same public action surface as desktop input. */
export function chooseRig(game: DepthGame, id: RigId): boolean {
  return game.chooseRig(id);
}

/** Dispatch only public simulation actions. */
export function useAbility(game: DepthGame, slot: AbilitySlot): boolean {
  return game.useAbility(slot);
}

/** Optional renderer preview: presentation only, never a placement or hit decision. */
export function showInvalidAbilityPlacement(renderer: DepthRenderer, abilityId: string | null, x?: number, y?: number): void {
  const hook = (renderer as DepthRenderer & {setInvalidAbilityPlacement?: (id: string | null, x?: number, y?: number) => void}).setInvalidAbilityPlacement;
  if (typeof hook !== 'function') return;
  if (abilityId !== null && (!Number.isFinite(x) || !Number.isFinite(y))) return;
  hook.call(renderer, abilityId, x, y);
}

/** Optional ability presentation surface; scene fallback keeps older renderer orchestration compatible. */
export function setPlacementPreview(renderer: DepthRenderer, value: PlacementPreviewState | null): void {
  if (value && (!Number.isFinite(value.x)||!Number.isFinite(value.y)||!Number.isFinite(value.angle)||!placementAbilities.has(value.ability))) return;
  const direct = renderer as unknown as {setPlacementPreview?: (value: PlacementPreviewState | null) => void};
  if (typeof direct.setPlacementPreview === 'function') {direct.setPlacementPreview(value); return;}
  const scene = renderer.scene?.userData;
  if (typeof scene?.setPlacementPreview === 'function') {scene.setPlacementPreview(value); return;}
  // Legacy optional preview hooks still receive denied placements and clearing.
  if (!value || !value.valid) showInvalidAbilityPlacement(renderer,value?.ability ?? null,value?.x,value?.y);
}

export type UiPlacementPreview = PlacementPreviewState & {points: PlacementPreviewPoint[]; pointCount: number};
const placementAbilities=new Set<string>(['glacier','napalm-charge','tesla-pylon','bulwark']);
/** Allocate the bounded UI scratch once; snapshots and gameplay are never mutated. */
export function createPlacementPreview(): UiPlacementPreview {
  return {ability:'glacier',x:0,y:0,angle:0,valid:false,points:Array.from({length:3},()=>({x:0,y:0,valid:false,radius:0})),pointCount:1};
}

/** Read the same native range clamp, wall orientation and augment offsets as the power slot. */
export function readPlacementPreview(game: DepthGame, aim: {x:number;y:number} | null, out: UiPlacementPreview): boolean {
  const snapshot=getAbilities(game),slot=snapshot?.slots?.power;
  if (game.status!=='playing'||!slot||!placementAbilities.has(slot.id)) return false;
  // Ice Road is traversable and aligned with aim; the retained Glacier preview can only promise a perpendicular barrier.
  // Native placement still validates the road strip; suppress that misleading presentation until a strip preview exists.
  if(slot.id==='glacier'&&game.combat.hasMutation('ice-road'))return false;
  if (aim&&(!Number.isFinite(aim.x)||!Number.isFinite(aim.y))) return false;
  const d=ABILITY_CATALOG[slot.id],p=game.player,angle=p.angle;
  if (!Number.isFinite(p.x)||!Number.isFinite(p.y)||!Number.isFinite(angle)) return false;
  out.ability=slot.id as PlacementAbility;out.angle=angle;
  const dx=(aim?.x??p.x+Math.cos(angle)*d.range)-p.x,dy=(aim?.y??p.y+Math.sin(angle)*d.range)-p.y;
  const scale=Math.min(1,d.range/(Math.hypot(dx,dy)||1));
  out.x=d.targeting==='point'?p.x+dx*scale:p.x+Math.cos(angle)*d.range;
  out.y=d.targeting==='point'?p.y+dy*scale:p.y+Math.sin(angle)*d.range;
  const twin=slot.id==='glacier'&&game.combat.hasMutation('twin-glacier')||slot.id==='tesla-pylon'&&game.combat.hasMutation('twin-pylon');
  const triplet=slot.id==='napalm-charge'&&game.combat.hasMutation('napalm-triplet');
  out.pointCount=triplet?3:twin?2:1;
  let any=false;
  for(let i=0;i<out.pointCount;i++) {
    const offset=triplet?(i-1)*100:twin?(i?1:-1)*(slot.id==='glacier'?40:50):0;
    const point=out.points[i],along=slot.id==='glacier'?offset:0,lateral=slot.id==='glacier'?0:offset;
    point.x=out.x+Math.cos(angle)*along-Math.sin(angle)*lateral;
    point.y=out.y+Math.sin(angle)*along+Math.cos(angle)*lateral;
    point.radius=triplet?80:d.shape.kind==='circle'?d.shape.radius:0;
    point.valid=canTraverseExpedition(game.geometry,p,point,slot.id==='tesla-pylon'?18:4);
    if(point.valid&&d.shape.kind==='wall') {
      const dx=-Math.sin(angle)*d.shape.length/2,dy=Math.cos(angle)*d.shape.length/2;
      warningFrom.x=point.x-dx;warningFrom.y=point.y-dy;warningTo.x=point.x+dx;warningTo.y=point.y+dy;
      point.valid=canTraverseExpedition(game.geometry,warningFrom,warningTo,d.shape.thickness/2);
    }
    any ||= point.valid;
  }
  out.valid=any;
  // A range-clamped press is accepted natively; do not invent an out-of-range rejection.
  out.reason=any?undefined:'Need clear ground';
  if(!any) for(const rect of game.geometry.blockers) {
    if(game.geometry.boundaryWalls.includes(rect)) continue;
    for(let i=0;i<out.pointCount;i++) {
      const point=out.points[i];
      if(segmentIntersectsRect(p,point,rect)||point.x>=rect.x-24&&point.x<=rect.x+rect.width+24&&point.y>=rect.y-24&&point.y<=rect.y+rect.height+24) out.reason='Blocked by machinery';
    }
  }
  return true;
}

type AimTarget={id:number;x:number;y:number;radius:number};
const aimScratch=new WeakMap<DepthRenderer,{pool:AimTarget[];live:AimTarget[]}>();
/** Reuse native torso picking so preview and the next physical F press share an aim. */
export function placementPointer(renderer: DepthRenderer, game: DepthGame, x:number, y:number): {x:number;y:number}|null {
  if(typeof renderer.pointer!=='function') return null;
  let scratch=aimScratch.get(renderer);
  if(!scratch){scratch={pool:Array.from({length:128},()=>({id:0,x:0,y:0,radius:0})),live:[]};aimScratch.set(renderer,scratch);}
  let count=0;
  for(const target of game.targets()) {
    if(count===scratch.pool.length) break;
    if(!hasClearExpeditionShot(game.geometry,game.player,target)) continue;
    const entry=scratch.pool[count],enemy=target.id>0?game.enemies.getSnapshot(target.id):undefined;
    entry.id=target.id;entry.x=target.x;entry.y=target.y;entry.radius=enemy?enemyShotRadius(enemy.type,enemy.elite):target.radius;
    scratch.live[count++]=entry;
  }
  scratch.live.length=count;
  const point=renderer.pointer(x,y,scratch.live);
  return point&&Number.isFinite(point.x)&&Number.isFinite(point.y)?point:null;
}

/** Nested, immutable simulation statistics drive the debrief. */
export function getRunStats(game: DepthGame): RunStatsSnapshot {
  return fixtures.get(game)?.stats ?? game.stats;
}

/** Presentation fixture overrides stay separate from persisted player preferences. */
export function getUiPreferences<T extends Readonly<{combatText?: boolean; combatTextDensity?: 'full' | 'reduced'; radar?: boolean; hints?: boolean; masteryHints?: boolean}>>(game: DepthGame, defaults: T): Readonly<{combatText?: boolean; combatTextDensity?: 'full' | 'reduced'; radar?: boolean; hints?: boolean; masteryHints?: boolean}> {
  return fixtures.get(game)?.preferences ?? defaults;
}

/** The live renderer owns effective options; facades retain the same validated contract. */
export function getGraphicsOptions(renderer: DepthRenderer): GraphicsOptions {
  return (renderer as NextRenderer).graphicsOptions ?? graphics.get(renderer) ?? GRAPHICS_PRESETS[renderer.qualityTier];
}

/** Persisted options reach the renderer through its public presentation surface. */
export function setGraphicsOptions(renderer: DepthRenderer, patch: Partial<GraphicsOptions>): void {
  const options = resolveGraphicsOptions(getGraphicsOptions(renderer), patch);
  graphics.set(renderer, options);
  (renderer as NextRenderer).setGraphicsOptions?.(options);
}

/** A tier always starts with its preset, then individual overrides may be applied. */
export function setGraphicsTier(renderer: DepthRenderer, tier: GraphicsTier): void {
  renderer.setQuality(tier);
  graphics.set(renderer, GRAPHICS_PRESETS[tier]);
  // The live setQuality already applies its preset, including GPU target resizing.
  if ((renderer as NextRenderer).graphicsOptions !== GRAPHICS_PRESETS[tier]) (renderer as NextRenderer).setGraphicsOptions?.(GRAPHICS_PRESETS[tier]);
}

export type ScreenPoint = {x: number; y: number; visible: boolean};
const footprintCorners = [[-1, 1], [1, 1], [1, -1], [-1, -1]] as const;

/** Fill four pooled floor intersections from the public camera, with no DOM measurement. */
export function getCameraFootprint(renderer: DepthRenderer, out: {x: number; y: number}[]): boolean {
  if (out.length < 4) return false;
  const camera = renderer.camera;
  const inverse = camera?.projectionMatrixInverse?.elements;
  const world = camera?.matrixWorld?.elements;
  if (!inverse || !world) {
    // Test/legacy render facades may expose only the existing public floor ray helper.
    if (typeof renderer.pointer !== 'function') return false;
    const width = renderer.canvas.clientWidth, height = renderer.canvas.clientHeight;
    for (let i = 0; i < 4; i++) {
      const corner = footprintCorners[i];
      const point = renderer.pointer((corner[0] + 1) * width / 2, (1 - corner[1]) * height / 2);
      if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
      out[i].x = point.x; out[i].y = point.y;
    }
    return true;
  }
  for (let i = 0; i < 4; i++) {
    const [x, y] = footprintCorners[i];
    let nearX = 0, nearY = 0, nearZ = 0, farX = 0, farY = 0, farZ = 0;
    for (let plane = 0; plane < 2; plane++) {
      const z = plane ? 1 : -1;
      const w = inverse[3] * x + inverse[7] * y + inverse[11] * z + inverse[15];
      const vx = (inverse[0] * x + inverse[4] * y + inverse[8] * z + inverse[12]) / w;
      const vy = (inverse[1] * x + inverse[5] * y + inverse[9] * z + inverse[13]) / w;
      const vz = (inverse[2] * x + inverse[6] * y + inverse[10] * z + inverse[14]) / w;
      const wx = world[0] * vx + world[4] * vy + world[8] * vz + world[12];
      const wy = world[1] * vx + world[5] * vy + world[9] * vz + world[13];
      const wz = world[2] * vx + world[6] * vy + world[10] * vz + world[14];
      if (plane) {farX = wx; farY = wy; farZ = wz;}
      else {nearX = wx; nearY = wy; nearZ = wz;}
    }
    const t = -nearY / (farY - nearY);
    if (!Number.isFinite(t) || t < 0 || t > 1) return false;
    const floorX = (nearX + (farX - nearX) * t) * 32;
    const floorY = (nearZ + (farZ - nearZ) * t) * 32;
    if (!Number.isFinite(floorX) || !Number.isFinite(floorY)) return false;
    out[i].x = floorX; out[i].y = floorY;
  }
  return true;
}

/** Read prepared CSS dimensions; legacy facades retain their live canvas contract. */
export function getViewportWidth(renderer: DepthRenderer): number {return renderer.viewportWidth ?? renderer.canvas.clientWidth;}
export function getViewportHeight(renderer: DepthRenderer): number {return renderer.viewportHeight ?? renderer.canvas.clientHeight;}

/** Project using the public camera matrices; accepts an output object for pooled UI. */
export function projectWorld(renderer: DepthRenderer, x: number, y: number, out: ScreenPoint, height = .8): ScreenPoint {
  const next = renderer as NextRenderer;
  const width = getViewportWidth(renderer), viewportHeight = getViewportHeight(renderer);
  const v = renderer.camera?.matrixWorldInverse?.elements;
  const p = renderer.camera?.projectionMatrix?.elements;
  let inFrustum = true;
  if ((!v || !p) && typeof next.worldToScreen === 'function') {
    const point = next.worldToScreen(x, y, height);
    out.x = point.x; out.y = point.y;
  } else {
    // Existing renderer uses 32 simulation units per world unit, Y-up.
    if (!v || !p) {out.x = out.y = NaN; out.visible = false; return out;}
    const wx = x / 32, wz = y / 32;
    const vx = v[0] * wx + v[4] * height + v[8] * wz + v[12];
    const vy = v[1] * wx + v[5] * height + v[9] * wz + v[13];
    const vz = v[2] * wx + v[6] * height + v[10] * wz + v[14];
    const vw = v[3] * wx + v[7] * height + v[11] * wz + v[15];
    const cw = p[3] * vx + p[7] * vy + p[11] * vz + p[15] * vw;
    const cz = p[2] * vx + p[6] * vy + p[10] * vz + p[14] * vw;
    inFrustum = cw > 0 && cz >= -cw && cz <= cw;
    // Behind the eye, signed division mirrors the bearing. Keep the direction
    // for edge indicators while depth prevents combat labels appearing there.
    const divisor = Math.max(Math.abs(cw), 1e-6);
    const nx = (p[0] * vx + p[4] * vy + p[8] * vz + p[12] * vw) / divisor;
    const ny = (p[1] * vx + p[5] * vy + p[9] * vz + p[13] * vw) / divisor;
    out.x = (nx + 1) * width / 2;
    out.y = (1 - ny) * viewportHeight / 2;
  }
  out.visible = inFrustum && Number.isFinite(out.x) && Number.isFinite(out.y) && out.x > 32 && out.y > 32 && out.x < width - 32 && out.y < viewportHeight - 32;
  return out;
}

// Optional G1/S2 implementations remain structurally detected at the boundary.
import type {GameEffect} from '../DepthGame';
import type {GameAudioDirector, UiCue} from '../game/audio/contract';

type LegacyAudio = {
  playUI(): void;
  playConfirmedHit(armor: boolean): void;
  playPistol(): void; playRifle(): void; playShotgun(): void; playPlasma(): void; playRocket(): void;
  playBodyImpact(): void; playExplosion(): void; playPickup(): void;
  playElemental(kind: 'shatter' | 'reactor'): void;
  setMusicIntensity(value: number): void;
};

const DIRECTOR_METHODS = ['handleEffect', 'playUi', 'setEnvironment', 'setCombatState'] as const;
const WEAPON_AUDIO_METHODS = {pistol: 'playPistol', rifle: 'playRifle', shotgun: 'playShotgun', plasma: 'playPlasma', rocket: 'playRocket'} as const;

/** A complete director owns all simulation sound; a partial landing keeps today's fallback. */
export function hasAudioDirector(audio: object): audio is GameAudioDirector {
  const candidate = audio as Partial<GameAudioDirector>;
  return DIRECTOR_METHODS.every(key => typeof candidate[key] === 'function');
}

/** Never double-play the director and the legacy synthesis path. */
export function forwardAudioEffect(audio: LegacyAudio, effect: GameEffect, listener: {x: number; y: number}): void {
  if (hasAudioDirector(audio)) { audio.handleEffect(effect, listener); return; }
  if (effect.contact) audio.playConfirmedHit(effect.contact !== 'damage');
  if (effect.type === 'shot') {
    audio[WEAPON_AUDIO_METHODS[effect.weapon ?? 'pistol']]();
  } else if (effect.type === 'corpse' || effect.type === 'wall-slam') audio.playBodyImpact();
  else if (effect.type === 'explosion') audio.playExplosion();
  else if (effect.type === 'pickup') audio.playPickup();
  else if (effect.type === 'boon' && effect.boon === 'shatter') audio.playElemental('shatter');
  else if (effect.type === 'boon' && effect.boon === 'overload') audio.playElemental('reactor');
}

const audioGestures = new WeakSet<object>();
type UiAudio = Pick<LegacyAudio, 'playUI'> & {unlock?: () => Promise<boolean>};

/** Unlock on the first real interface gesture, then keep subsequent cues synchronous. */
export function playUiCue(audio: UiAudio, cue: UiCue): void {
  if (hasAudioDirector(audio)) {
    if (audio.unlock && !audioGestures.has(audio)) {
      audioGestures.add(audio);
      void audio.unlock().then(ok => {if (ok) audio.playUi(cue);});
    } else audio.playUi(cue);
  } else if (!['hover', 'room-enter', 'low-health', 'ability-ready'].includes(cue)) audio.playUI?.();
}

/** The director owns runtime/lifecycle accents even when visual beats are disabled. */
export function playPresentationCue(audio: UiAudio, cue: UiCue): void {
  if (hasAudioDirector(audio) && ['room-enter', 'room-clear', 'death', 'victory', 'boss-intro', 'overdrive-ready'].includes(cue)) return;
  playUiCue(audio, cue);
}

type AudioRoomEdges = {
  condition?: string; beat?: number; ventWarning?: boolean; ventLive?: boolean;
  conduit?: boolean; slick?: boolean; sealed?: boolean; canceled?: number;
  enemies: ReadonlyMap<number, EnemySnapshot>;
};

type AudioLifecycle = {
  room?: AudioRoomEdges;
  game: DepthGame; revision: number; inRoom: boolean; status: string; checkpoint: string; boss: boolean;
};
const audioLifecycles = new WeakMap<object, AudioLifecycle>();
type AudioLifecycleOptions = Readonly<{paused?: boolean; loading?: boolean}>;

/** Publish actual transport state; passive menus keep UI live while their music is stopped. */
export function syncAudioDirector(audio: LegacyAudio, game: DepthGame, options: AudioLifecycleOptions = {}): void {
  const playing = game.status === 'playing';
  const boss = game.boss.snapshot;
  const intensity = playing ? Math.min(1, game.enemies.activeCount / 12 + (boss.active ? .3 : 0)) : 0;
  if (!hasAudioDirector(audio)) { audio.setMusicIntensity(intensity); return; }
  let lifecycle = audioLifecycles.get(audio);
  if (!lifecycle || lifecycle.game !== game) {
    lifecycle = {game, revision: -1, inRoom: false, status: '', checkpoint: '', boss: false};
    audioLifecycles.set(audio, lifecycle);
  }
  const transport = audio as GameAudioDirector & {
    pauseMusic?: () => void; resumeMusic?: () => void;
    playAlert?: (cue: AlertCue, pan?: number, distance?: number) => void;
    setBossPhase?: (phase: typeof boss.phase) => void;
  };
  const paused = options.paused ?? !playing;
  // Preserve an already announced boss through user pause; defer its first edge until audible.
  const bossPresent = paused
    ? lifecycle.revision === game.roomRevision && lifecycle.boss && (playing || game.status === 'paused') && boss.active
    : playing && boss.active;
  const abilities = game.abilities.snapshot;
  const maximum = game.combat.mutationResources().maxHealth;
  audio.setCombatState({intensity, boss: bossPresent, overdrive: playing && abilities.overdrive.active,
    danger: playing ? Math.max(0, Math.min(1, 1 - game.combat.snapshot.health / Math.max(1, maximum))) : 0,
    hostileTimeScale: playing ? abilities.hostileTimeScale : 1, paused});
  // Terminal stingers clear their own loops and must precede any whole-engine stop.
  if (lifecycle.status !== game.status && !paused) {
    if (game.status === 'dead') audio.playUi('death');
    else if (game.status === 'complete') audio.playUi('victory');
    else if (game.status === 'reward' && lifecycle.status === 'playing') audio.playUi('room-clear');
  }
  const inRoom = (playing || game.status === 'paused') && !options.loading;
  if (lifecycle.revision !== game.roomRevision || lifecycle.inRoom && !inRoom) {
    // An explicit exit invalidates entity loops even for adjacent rooms of the same environment.
    audio.setEnvironment(null);
    lifecycle.inRoom = false;
    lifecycle.room = undefined;
    lifecycle.revision = game.roomRevision;
  }
  if (inRoom && !lifecycle.inRoom) {
    audio.setEnvironment(game.storyRoom?.environment ?? null);
    lifecycle.inRoom = true;
    if (playing && !paused) audio.playUi('room-enter');
  }
  if (playing && !paused) transport.resumeMusic?.();
  else transport.pauseMusic?.();
  if (playing && !paused && boss.active) transport.setBossPhase?.(boss.phase);
  if (playing && !paused && transport.playAlert) {
    const previous = lifecycle.room;
    const condition = game.conditionState;
    const encounter = game.encounter;
    const next: AudioRoomEdges = {
      condition: condition?.condition.id, beat: encounter.beat,
      ventWarning: condition?.ventWarning, ventLive: condition?.ventLive,
      conduit: condition?.conduitLive, slick: condition?.slick(game.player),
      sealed: condition?.sealedHold && condition.countdown > 0,
      canceled: encounter.canceledReinforcements,
      enemies: new Map(game.enemies.snapshot.enemies.map(enemy => [enemy.id, enemy])),
    };
    if (condition && next.condition !== previous?.condition) transport.playAlert(condition.condition.id);
    if (!previous || next.beat !== previous.beat) transport.playAlert('encounter');
    if (next.ventWarning && !previous?.ventWarning) transport.playAlert('pressure');
    if (next.ventLive && !previous?.ventLive) transport.playAlert('steam');
    if (next.conduit && !previous?.conduit) transport.playAlert('arc');
    if (next.slick && !previous?.slick) transport.playAlert('slip');
    if (previous?.sealed && !next.sealed) transport.playAlert('release');
    if ((next.canceled ?? 0) > (previous?.canceled ?? 0)) transport.playAlert('resolved');
    for (const enemy of next.enemies.values()) {
      const before = previous?.enemies.get(enemy.id);
      const dx = enemy.x - game.player.x, dy = enemy.y - game.player.y;
      const pan = dx / 500, distance = Math.hypot(dx, dy);
      if (!before && (enemy.champion || enemy.elite)) transport.playAlert(enemy.champion ?? 'elite', pan, distance);
      if (enemy.health > 0 && before && before.armor > 0 && enemy.armor <= 0) transport.playAlert('armor', pan, distance);
      if (enemy.health > 0 && enemy.chargeMs > 0 && !before?.chargeMs) transport.playAlert('charge', pan, distance);
      if (enemy.health > 0 && enemy.wallStunAngle !== undefined && before?.wallStunAngle === undefined) transport.playAlert('exposed', pan, distance);
      if (enemy.health > 0 && enemy.podStage === 'opening' && before?.podStage !== 'opening') transport.playAlert('pod', pan, distance);
      if (enemy.health > 0 && before?.pod && !enemy.pod) transport.playAlert('hatch', pan, distance);
    }
    lifecycle.room = next;
  }
  lifecycle.boss = bossPresent;
  const checkpoint = `${game.roomRevision}:${game.expedition.run.phase}:${game.checkpointStatus}`;
  if (checkpoint !== lifecycle.checkpoint && !paused && game.status !== 'menu') {
    if (game.checkpointStatus === 'saved') audio.playUi('checkpoint');
    else if (game.checkpointWarning) audio.playUi('denied');
  }
  // A checkpoint/terminal transition that happens during loading remains pending until audible.
  if (!paused || game.status === 'menu') lifecycle.checkpoint = checkpoint;
  if (!paused || game.status === 'paused') lifecycle.status = game.status;
}

type CameraFeel = {addTrauma?(amount: number): void; kick?(angle: number, amount: number): void; punch?(amount: number, ms?: number): void};

/** Optional camera hooks; absent methods remain safe on the current renderer. */
export function cameraEffect(renderer: DepthRenderer, event: GameEffect, strength: number): void {
  if (strength <= 0) return;
  const next = renderer as unknown as {cameraRig?: CameraFeel; rig?: CameraFeel; handlesCameraEffects?: boolean};
  if (next.handlesCameraEffects) return;
  const rig = next.cameraRig ?? next.rig;
  if (!rig) return;
  if (event.type === 'shot') {
    const angle = event.angle ?? 0;
    const recoil = event.weapon === 'rocket' ? .18 : event.weapon === 'shotgun' ? .1 : .035;
    rig.kick?.(angle + Math.PI, recoil * strength);
  } else if (event.type === 'explosion') {
    rig.addTrauma?.(.32 * strength); rig.punch?.(.08 * strength, 180);
  } else if (event.type === 'hurt') rig.addTrauma?.(.2 * strength);
  else if (event.type === 'wall-slam' || event.type === 'ability' && (event.ability?.phase === 'impact' || event.ability?.phase === 'burst')) {
    rig.addTrauma?.(.14 * strength); rig.punch?.(.035 * strength, 120);
  }
}


/** Resolve receipts only when their element is authoritative or uniquely possible.
 * Legacy status receipts aggregate by target/source. Current target status alone
 * cannot disambiguate a final poison tick whose status expired this frame, so
 * builds with multiple damage-over-time producers stay neutral without metadata.
 */
export function getCombatDamageElement(game: DepthGame, event: import('./hud/effects').HudEffect): string | undefined {
  if (event.source === 'weapon') return 'weapon';
  if (event.damageElement) return event.damageElement;
  if (event.element) return event.element;
  if (event.ability?.element) return event.ability.element;
  if (event.elements?.length === 1) return event.elements[0];
  const rig = getAbilities(game)?.rig;
  if (event.source === 'ability') return rig === 'breacher' ? 'kinetic' : rig ?? undefined;
  if (event.source !== 'status') return undefined;
  const mutations = game.expedition.build.mutations;
  const burning = rig === 'pyro' || mutations.includes('incendiary');
  const poisoned = mutations.includes('caustic-rounds');
  const frostbite = mutations.includes('frostbite');
  if (Number(burning) + Number(poisoned) + Number(frostbite) !== 1) return undefined;
  return burning ? 'burn' : poisoned ? 'poison' : 'frost';
}

export function getRoomDamage(game: DepthGame) {return game.roomDamage;}
export function getAwakeningDrill(game: DepthGame) {return game.awakeningDrill;}

/** Read-only opportunities sampled from the current combat state. */
export function getMasteryPreview(game: DepthGame) {
  const abilities = getAbilities(game);
  const slots = abilities?.slots;
  const player = game.player;
  const targets = game.enemies.snapshot.enemies;
  const nearby = (point: {x:number;y:number}, range: number) => targets.filter(enemy =>
    Math.hypot(enemy.x-point.x,enemy.y-point.y)<=range && hasClearExpeditionShot(game.geometry,point,enemy));
  const walls = abilities?.deployables.filter(entity => entity.kind==='ice-wall') ?? [];
  const shatter = walls.find(wall => targets.some(enemy =>
    deployableContact(wall,enemy,enemy,enemy.radius+16)!==null));
  const ignite = slots?.tactical.id==='flashfire' && slots.tactical.ready ? nearby(player,300).filter(enemy =>
    Math.cos(Math.atan2(enemy.y-player.y,enemy.x-player.x)-player.angle)>=Math.cos(.61) && game.boonStatuses(enemy.id).burning) : [];
  const dash = slots && ABILITY_CATALOG[slots.dash.id].shape;
  const angle = player.moving ? Math.atan2(player.vy,player.vx) : player.angle;
  const dx=Math.cos(angle),dy=Math.sin(angle),distance=dash?.kind==='dash'?dash.distance:0;
  const endpoint = {x:player.x+dx*distance,y:player.y+dy*distance};
  const crush = slots?.dash.id==='ram' && slots.dash.ready ? nearby(player,distance+22).find(enemy => {
    const x=enemy.x-player.x,y=enemy.y-player.y,along=x*dx+y*dy,side=-x*dy+y*dx;
    if(along<0||along>distance||Math.abs(side)>22||!canTraverseExpedition(game.geometry,player,enemy,4))return false;
    const direction=Math.sign(side)||1;
    const shove={x:enemy.x-dy*90*direction,y:enemy.y+dx*90*direction};
    return abilities?.deployables.some(wall=>wall.kind==='barrier'&&wall.health>0&&
      deployableContact(wall,enemy,shove,enemy.radius)!==null);
  }) : undefined;
  const arcOrigin = slots?.dash.id==='static-step' && slots.dash.ready && canTraverseExpedition(game.geometry,player,endpoint,player.radius) ? endpoint : null;
  const first = (point:{x:number;y:number},range:number,aim:{x:number;y:number}) => nearby(point,range)
    .sort((a,b)=>Math.hypot(a.x-aim.x,a.y-aim.y)-Math.hypot(b.x-aim.x,b.y-aim.y)||a.id-b.id)[0];
  const overload=slots?.tactical.id==='overload' && slots.tactical.ready ? first(player,520,
    game.currentAimPoint??{x:player.x+Math.cos(player.angle)*520,y:player.y+Math.sin(player.angle)*520}) : undefined;
  const step = arcOrigin && first(arcOrigin,160,arcOrigin);
  const next = overload && !game.expedition.build.mutations.includes('live-wire')
    ? nearby(overload,200).filter(target=>target.id!==overload.id)
      .sort((a,b)=>Math.hypot(a.x-overload.x,a.y-overload.y)-Math.hypot(b.x-overload.x,b.y-overload.y)||a.id-b.id)[0]
    : undefined;
  const drill = getAwakeningDrill(game);
  return {augmentDrill:game.augmentDrillTarget,roomRevision:game.roomRevision,linkFrom:next&&overload?overload:step&&arcOrigin?arcOrigin:player,dashOrigin:!next&&step?arcOrigin:null,walls,shatter,ignite,crush,player:{x:player.x,y:player.y},drill:drill&&!drill.confirmation?targets.find(enemy=>enemy.id===drill.id):undefined,link:next??step??overload??null};
}


export function getRoomOpening(game: DepthGame, depth?: number, salvage?: boolean) {
  return game.openingName(depth, salvage);
}

/** Pick a subject from the actual first dispatch, including seeded and guardian-route openings. */
export function getRouteThreat(game: DepthGame, destination: RunNode, salvage: boolean) {
  if(destination.kind!=='combat'&&destination.kind!=='elite')return undefined;
  const {run}=game.expedition;
  const opening=createEncounterPlan({
    seed:run.seed,node:destination,difficulty:game.difficulty,runStructure:run.runStructure,
    guardianRoute:run.guardianRoute,junctions:salvage?{...run.junctions,[destination.depth]:'salvage'}:run.junctions,
    salvage,breachIds:['preview'],
  }).schedule[0];
  return opening?.guardian??opening?.enemyId;
}

export function getShipCondition(game: DepthGame, depth?: number, salvage?: boolean) {
  return depth === undefined ? game.condition : game.conditionFor(depth, salvage);
}

/** Situational offers use live targets and the native rocket arming distance. */
export function getWeaponSituation(game: DepthGame, platedId?: number) {
  const combat = game.combat.snapshot;
  if (!combat.magazine && combat.weaponId !== 'pistol')
    return {weapon: 'pistol' as const, text: '1 · Pistol while empty'};
  if(game.expedition.run.version===3)return;
  const enemies = game.enemies.snapshot.enemies.filter(enemy => enemy.health > 0);
  const plate = enemies.find(enemy => enemy.id === platedId && enemy.armor > 0);
  if (plate && combat.weaponId === 'rifle')
    return {weapon: 'plasma' as const, target: plate, text: '4 · Plasma breaks plate'};
  const armed = enemies.filter(enemy => Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y) >= ROCKET_ARM_DISTANCE
    && (enemy.pod || enemy.role === 'flanker') && hasClearExpeditionShot(game.geometry, game.player, enemy));
  const pair = armed.find(enemy => armed.some(other => other !== enemy
    && (enemy.pod ? other.pod : other.role === 'flanker') && Math.hypot(other.x - enemy.x, other.y - enemy.y) < 112));
  if (pair && combat.weaponId !== 'rocket')
    return {weapon: 'rocket' as const, target: pair, text: '5 · Rocket for the pair'};
}
