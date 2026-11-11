import type {DepthGame} from '../DepthGame';
import type {DepthRenderer} from '../render/DepthRenderer';
import type {AbilitiesSnapshot, AbilitySlot, RigId} from '../game/abilities/contract';
import {GRAPHICS_PRESETS, resolveGraphicsOptions, type GraphicsOptions} from '../render/graphicsOptions';
import type {RunStatsSnapshot} from '../game/abilities/RunStats';
import type {GraphicsTier} from '../render/FrameBudget';

type NextRenderer = DepthRenderer & {
  graphicsOptions?: GraphicsOptions;
  setGraphicsOptions?: (options: Partial<GraphicsOptions>) => void;
  worldToScreen?: (x: number, y: number, height?: number) => {x: number; y: number};
};

export type UiFixture = Readonly<{
  phase?: string;
  abilities?: AbilitiesSnapshot | null;
  stats?: RunStatsSnapshot;
  preferences?: Readonly<{combatText?: boolean; radar?: boolean}>;
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

/** Nested, immutable simulation statistics drive the debrief. */
export function getRunStats(game: DepthGame): RunStatsSnapshot {
  return fixtures.get(game)?.stats ?? game.stats;
}

/** Presentation fixture overrides stay separate from persisted player preferences. */
export function getUiPreferences<T extends Readonly<{combatText?: boolean; radar?: boolean}>>(game: DepthGame, defaults: T): Readonly<{combatText?: boolean; radar?: boolean}> {
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

/** Project using the public camera matrices; accepts an output object for pooled UI. */
export function projectWorld(renderer: DepthRenderer, x: number, y: number, out: ScreenPoint, height = .8): ScreenPoint {
  const next = renderer as NextRenderer;
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
    out.x = (nx + 1) * renderer.canvas.clientWidth / 2;
    out.y = (1 - ny) * renderer.canvas.clientHeight / 2;
  }
  out.visible = inFrustum && Number.isFinite(out.x) && Number.isFinite(out.y) && out.x > 32 && out.y > 32 && out.x < renderer.canvas.clientWidth - 32 && out.y < renderer.canvas.clientHeight - 32;
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

type AudioLifecycle = {
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
