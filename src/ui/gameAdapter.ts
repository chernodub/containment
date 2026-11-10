import type {DepthGame} from '../DepthGame';
import type {DepthRenderer} from '../render/DepthRenderer';
import type {AbilitiesSnapshot, AbilitySlot, RigId} from '../game/abilities/contract';
import {GRAPHICS_PRESETS, type GraphicsOptions} from '../render/graphicsOptions';
import type {GraphicsTier} from '../render/FrameBudget';

/** Optional next-generation surfaces. No presentation fallback changes simulation. */
type NextGame = DepthGame & {
  abilities?: {snapshot: AbilitiesSnapshot};
  chooseRig?: (id: RigId) => void;
  useAbility?: (slot: AbilitySlot) => void;
  stats?: Readonly<Record<string, unknown>>;
};
type NextRenderer = DepthRenderer & {
  graphicsOptions?: GraphicsOptions;
  setGraphicsOptions?: (options: Partial<GraphicsOptions>) => void;
  worldToScreen?: (x: number, y: number, height?: number) => {x: number; y: number};
};

export type UiFixture = Readonly<{
  phase?: string;
  abilities?: AbilitiesSnapshot | null;
  stats?: Readonly<Record<string, unknown>>;
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

/** No rig means no ability slots; legacy runs retain their normal actions. */
export function getAbilities(game: DepthGame): AbilitiesSnapshot | null {
  const fixture = fixtures.get(game);
  if (fixture && 'abilities' in fixture) return fixture.abilities ?? null;
  return (game as NextGame).abilities?.snapshot ?? null;
}

/** Dispatch through the same public action surface as desktop input. */
export function chooseRig(game: DepthGame, id: RigId): boolean {
  const next = game as NextGame;
  if (typeof next.chooseRig !== 'function') return false;
  next.chooseRig(id);
  return true;
}

/** Missing live abilities are safely inert, never simulated by UI. */
export function useAbility(game: DepthGame, slot: AbilitySlot): boolean {
  const next = game as NextGame;
  if (typeof next.useAbility !== 'function') return false;
  next.useAbility(slot);
  return true;
}

/** Only real statistics are shown; unsupported counters are omitted. */
export function getRunStats(game: DepthGame): Readonly<Record<string, unknown>> {
  return fixtures.get(game)?.stats ?? (game as NextGame).stats ?? {};
}

/** Presentation fixture overrides stay separate from persisted player preferences. */
export function getUiPreferences<T extends Readonly<{combatText?: boolean; radar?: boolean}>>(game: DepthGame, defaults: T): Readonly<{combatText?: boolean; radar?: boolean}> {
  return fixtures.get(game)?.preferences ?? defaults;
}

/** Read renderer options when available, preserving preferences before G1 merges. */
export function getGraphicsOptions(renderer: DepthRenderer): GraphicsOptions {
  return (renderer as NextRenderer).graphicsOptions ?? graphics.get(renderer) ?? GRAPHICS_PRESETS[renderer.qualityTier];
}

/** Persisted options reach G1 by feature detection and have a stable legacy seam. */
export function setGraphicsOptions(renderer: DepthRenderer, patch: Partial<GraphicsOptions>): void {
  const options = {...getGraphicsOptions(renderer), ...patch};
  graphics.set(renderer, options);
  (renderer as NextRenderer).setGraphicsOptions?.(options);
}

/** A tier always starts with its preset, then individual overrides may be applied. */
export function setGraphicsTier(renderer: DepthRenderer, tier: GraphicsTier): void {
  renderer.setQuality(tier);
  graphics.set(renderer, GRAPHICS_PRESETS[tier]);
  (renderer as NextRenderer).setGraphicsOptions?.(GRAPHICS_PRESETS[tier]);
}

export type ScreenPoint = {x: number; y: number; visible: boolean};
/** Project using the public camera matrices; accepts an output object for pooled UI. */
export function projectWorld(renderer: DepthRenderer, x: number, y: number, out: ScreenPoint, height = .8): ScreenPoint {
  const next = renderer as NextRenderer;
  if (typeof next.worldToScreen === 'function') {
    const point = next.worldToScreen(x, y, height);
    out.x = point.x; out.y = point.y;
  } else {
    // Existing renderer uses 32 simulation units per world unit, Y-up.
    const v = renderer.camera.matrixWorldInverse.elements;
    const p = renderer.camera.projectionMatrix.elements;
    const wx = x / 32, wz = y / 32;
    const vx = v[0] * wx + v[4] * height + v[8] * wz + v[12];
    const vy = v[1] * wx + v[5] * height + v[9] * wz + v[13];
    const vz = v[2] * wx + v[6] * height + v[10] * wz + v[14];
    const vw = v[3] * wx + v[7] * height + v[11] * wz + v[15];
    const cw = p[3] * vx + p[7] * vy + p[11] * vz + p[15] * vw;
    const nx = (p[0] * vx + p[4] * vy + p[8] * vz + p[12] * vw) / cw;
    const ny = (p[1] * vx + p[5] * vy + p[9] * vz + p[13] * vw) / cw;
    out.x = (nx + 1) * renderer.canvas.clientWidth / 2;
    out.y = (1 - ny) * renderer.canvas.clientHeight / 2;
  }
  out.visible = out.x > 32 && out.y > 32 && out.x < renderer.canvas.clientWidth - 32 && out.y < renderer.canvas.clientHeight - 32;
  return out;
}
