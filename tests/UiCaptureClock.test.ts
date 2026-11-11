import {afterEach, expect, it, vi} from 'vitest';
import {installDebug} from '../scripts/nextgen/debug';
import type {DepthGame} from '../src/DepthGame';
import type {DepthRenderer} from '../src/render/DepthRenderer';

afterEach(() => vi.unstubAllGlobals());

it('advances simulation, renderer and pooled UI on the same explicit capture clock', () => {
  const target: Record<string, any> = {};
  vi.stubGlobal('window', target);
  vi.stubGlobal('location', {search: '?debug=1&seed=1729'});
  const update = vi.fn(), render = vi.fn(), advanceUi = vi.fn(), sync = vi.fn();
  const game = {update, hurt: vi.fn(), status: 'playing', elapsed: 0} as unknown as DepthGame;
  const rendererStub = {render, effect: vi.fn(), roomLoading: false};
  const renderer = rendererStub as unknown as DepthRenderer;
  installDebug(game, renderer, sync, vi.fn(), vi.fn(), advanceUi);
  const debug = target.__containmentDebug;

  // Ordinary animation frames and refreshes cannot consume a floating number's life.
  game.update(16, {x: 0, y: 0, fire: false, angle: null, autoAim: true});
  renderer.render(game, .5, false);
  debug.refresh();
  expect(update).not.toHaveBeenCalled();
  expect(render.mock.calls.every(call => call[1] === 0)).toBe(true);
  expect(advanceUi.mock.calls).toEqual([[0]]);

  debug.step(200);
  const seconds = advanceUi.mock.calls.reduce((sum, [dt]) => sum + dt, 0);
  const milliseconds = update.mock.calls.reduce((sum, [dt]) => sum + dt, 0);
  expect(seconds).toBeCloseTo(.2);
  expect(milliseconds).toBeCloseTo(200);
  expect(advanceUi.mock.calls.every(([dt]) => dt <= 1 / 60)).toBe(true);
  expect(sync).toHaveBeenCalledTimes(2);
  expect(() => debug.step(-1)).toThrow('step expects');
  rendererStub.roomLoading = true;
  expect(() => debug.step(16)).toThrow('Room is still loading');
});
