import {afterEach, expect, it, vi} from 'vitest';
import {installDebug} from '../scripts/nextgen/debug';
import type {DepthGame, GameInput} from '../src/DepthGame';
import type {DepthRenderer} from '../src/render/DepthRenderer';

afterEach(() => vi.unstubAllGlobals());

/** No GPU: model the scene updates and raw draw submissions independently. */
function harness(options: {live?: boolean; raw?: boolean} = {}) {
  const target: Record<string, any> = {};
  vi.stubGlobal('window', target);
  vi.stubGlobal('location', {search: '?debug=1'});
  const inputs: GameInput[] = [], frames: number[] = [], deltas: number[] = [];
  let cameraFrame = 0, onScene = () => {}, onUpdate = () => {}, ready = true;
  const game = {status: 'playing', elapsed: 0, hurt: vi.fn(), update(this: {elapsed: number}, ms: number, input: GameInput) {
    this.elapsed += ms;
    inputs.push({...input});
    onUpdate();
  }} as unknown as DepthGame;
  const raw = {render: vi.fn(function(this: unknown) {
    expect(this).toBe(raw);
    frames.push(cameraFrame);
  })};
  const draw = raw.render;
  const renderer = {
    roomLoading: false,
    renderer: options.raw === false ? undefined : raw,
    effect: vi.fn(),
    render(_game: DepthGame, delta: number) {
      deltas.push(delta);
      cameraFrame++;
      onScene();
      raw.render();
    },
  };
  const sync = vi.fn(), ui = vi.fn();
  installDebug(game, renderer as unknown as DepthRenderer, sync, vi.fn(), vi.fn(), ui, undefined,
    () => ({x: cameraFrame % 2, y: .4, fire: true, angle: .2, autoAim: false}), () => ready, !!options.live);
  return {
    debug: target.__containmentDebug, game, renderer, raw, draw, inputs, frames, deltas, sync, ui,
    scene(callback: () => void) {onScene = callback;},
    update(callback: () => void) {onUpdate = callback;},
    ready(value: boolean) {ready = value;},
  };
}

it('omits only intermediate GPU draws while retaining every native tick, scene update and final refresh', () => {
  const normal = harness();
  normal.debug.nativeInput(true);
  normal.debug.step(50);
  const fast = harness();
  fast.debug.nativeInput(true);
  fast.debug.fastNativeRendering(true);
  fast.debug.step(50);
  expect(fast.inputs).toEqual(normal.inputs);
  expect(fast.deltas).toEqual(normal.deltas);
  expect(fast.inputs).toHaveLength(3);
  expect(normal.frames).toEqual([1, 2, 3, 4]);
  expect(fast.frames).toEqual([3, 4]);
  expect(fast.raw.render).toBe(fast.draw);
  expect(fast.sync).toHaveBeenCalledOnce();
  expect(fast.ui.mock.calls).toEqual(normal.ui.mock.calls);
});

it.each(['loading', 'recovery'])('never suppresses a preparation draw when %s begins inside a scene update', mode => {
  const h = harness();
  h.debug.nativeInput(true);
  h.debug.fastNativeRendering(true);
  h.scene(() => {
    if (mode === 'loading') h.renderer.roomLoading = true;
    else h.ready(false);
  });
  h.debug.step(50);
  expect(h.inputs).toHaveLength(1);
  expect(h.frames).toEqual([1, 2]);
  expect(h.raw.render).toBe(h.draw);
  expect(h.debug.canStepNative).toBe(false);
});

it('restores the original draw method even if a preparation draw throws inside a suppressed tick', () => {
  const h = harness();
  h.debug.nativeInput(true);
  h.debug.fastNativeRendering(true);
  h.scene(() => {h.renderer.roomLoading = true;});
  h.raw.render.mockImplementationOnce(() => {throw Error('preparation failed');});
  expect(() => h.debug.step(50)).toThrow('preparation failed');
  expect(h.raw.render).toBe(h.draw);
  expect(h.inputs).toHaveLength(1);
  h.renderer.roomLoading = false;
  h.scene(() => {});
  h.debug.fastNativeRendering(false);
  expect(() => h.debug.step(1000 / 60)).not.toThrow();
  expect(h.frames).toHaveLength(2);
});

it('fully draws a run boundary reached during a native update', () => {
  const h = harness();
  h.debug.nativeInput(true);
  h.debug.fastNativeRendering(true);
  h.update(() => {h.game.status = 'reward';});
  h.debug.step(50);
  expect(h.frames).toEqual([1, 2, 3, 4]);
  expect(h.raw.render).toBe(h.draw);
});

it('preserves synthetic fixtures and rejects unavailable or passive-live render decimation', () => {
  const h = harness();
  expect(() => h.debug.fastNativeRendering(true)).toThrow('native input');
  h.debug.nativeInput(true);
  h.debug.fastNativeRendering(true);
  h.debug.nativeInput(false);
  h.debug.step(50);
  expect(h.frames).toEqual([1, 2, 3, 4]);
  const absent = harness({raw: false});
  absent.debug.nativeInput(true);
  expect(() => absent.debug.fastNativeRendering(true)).toThrow('WebGL renderer');
  const live = harness({live: true});
  expect(() => live.debug.fastNativeRendering(true)).toThrow('live observation');
});
