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
