import {afterEach, expect, it, vi} from 'vitest';
import {installDebug} from '../scripts/nextgen/debug';
import type {DepthGame, GameInput} from '../src/DepthGame';
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

it('opts into measured RAF simulation with the same controls and can return to fixed-step capture', () => {
  const target: Record<string, any> = {};
  vi.stubGlobal('window', target);
  vi.stubGlobal('location', {search: '?debug=1'});
  const update = vi.fn(), render = vi.fn(), advanceUi = vi.fn();
  const game = {update, hurt: vi.fn(), status: 'playing', elapsed: 0} as unknown as DepthGame;
  const renderer = {render, effect: vi.fn(), roomLoading: false} as unknown as DepthRenderer;
  installDebug(game, renderer, vi.fn(), vi.fn(), vi.fn(), advanceUi);
  const debug = target.__containmentDebug;
  debug.setInput({x: -.55, y: 0, fire: true, angle: 0, autoAim: false});
  debug.realtime(true);
  game.update(16, {x: 1, y: 0, fire: false, angle: null, autoAim: true});
  renderer.render(game, .016, false);
  expect(update).toHaveBeenLastCalledWith(16, {x: -.55, y: 0, fire: true, angle: 0, autoAim: false});
  expect(render).toHaveBeenLastCalledWith(game, .016, false);
  expect(advanceUi).toHaveBeenLastCalledWith(.016);
  debug.realtime(false);
  game.update(16, {x: 1, y: 0, fire: false, angle: null, autoAim: true});
  renderer.render(game, .016, false);
  expect(update).toHaveBeenCalledTimes(1);
  expect(render).toHaveBeenLastCalledWith(game, 0, false);
  expect(advanceUi).toHaveBeenCalledTimes(1);
});

it('bypasses presentation timing by default and opts in only for requested feel captures', () => {
  const target: Record<string, any> = {};
  vi.stubGlobal('window', target);
  vi.stubGlobal('location', {search: '?debug=1&seed=1729'});
  const update = vi.fn(), render = vi.fn(), advanceUi = vi.fn();
  const game = {update, hurt: vi.fn(), status: 'playing', elapsed: 0} as unknown as DepthGame;
  const renderer = {render, effect: vi.fn(), roomLoading: false} as unknown as DepthRenderer;
  const presentation = {
    setEnabled: vi.fn(), reset: vi.fn(), effect: vi.fn(),
    step: vi.fn((ms: number, input: GameInput, original: (ms: number, input: GameInput) => void) => original(ms * .3, input)),
  };
  installDebug(game, renderer, vi.fn(), vi.fn(), vi.fn(), advanceUi, presentation);
  const debug = target.__containmentDebug;
  debug.setInput({x: .6, y: -.4, fire: true});
  debug.step(100);
  expect(presentation.step).not.toHaveBeenCalled();
  expect(update.mock.calls.reduce((sum, [ms]) => sum + ms, 0)).toBeCloseTo(100);
  expect(() => debug.presentationEvent({type: 'beat', kind: 'room-clear'})).toThrow('Enable presentation first');

  update.mockClear();
  debug.presentation(true);
  debug.presentationEvent({type: 'beat', kind: 'room-clear'});
  debug.step(100);
  expect(presentation.setEnabled).toHaveBeenLastCalledWith(true);
  expect(presentation.effect).toHaveBeenCalledWith({type: 'beat', kind: 'room-clear'});
  expect(presentation.step).toHaveBeenCalled();
  expect(update.mock.calls.reduce((sum, [ms]) => sum + ms, 0)).toBeCloseTo(30);
  for (const [, input] of update.mock.calls) expect(input).toMatchObject({x: .6, y: -.4, fire: true});

  update.mockClear(); presentation.step.mockClear();
  debug.presentation(false);
  debug.step(100);
  expect(presentation.setEnabled).toHaveBeenLastCalledWith(false);
  expect(presentation.step).not.toHaveBeenCalled();
  expect(update.mock.calls.reduce((sum, [ms]) => sum + ms, 0)).toBeCloseTo(100);
  // UI and renderer always advance by explicit capture time, including during hit-stop/slow motion.
  expect(advanceUi.mock.calls.reduce((sum, [dt]) => sum + dt, 0)).toBeCloseTo(.3);
});
