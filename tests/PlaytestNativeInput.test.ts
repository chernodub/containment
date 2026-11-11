import {afterEach, expect, it, vi} from 'vitest';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {installDebug} from '../scripts/nextgen/debug';
import {DepthGame, type GameInput} from '../src/DepthGame';
import {InputController} from '../src/InputController';
import type {DepthRenderer} from '../src/render/DepthRenderer';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';

class Canvas extends EventTarget {
  setPointerCapture() {}
}
afterEach(() => vi.unstubAllGlobals());

function harness() {
  const windowTarget = new EventTarget() as EventTarget & {__containmentDebug?: any};
  const documentTarget = Object.assign(new EventTarget(), {hidden: false});
  vi.stubGlobal('window', windowTarget);
  vi.stubGlobal('document', documentTarget);
  vi.stubGlobal('location', {search: '?debug=1&seed=1729'});
  const game = new DepthGame();
  game.newRun(1729);
  game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
  game.skipStory();
  const renderSpy = vi.fn();
  const rendererStub = {canvas: new Canvas(), pointer: () => null, render: renderSpy, effect: vi.fn(), roomLoading: false};
  const renderer = rendererStub as unknown as DepthRenderer;
  const input = new InputController(game, renderer, () => {});
  const readiness = {ready: true};
  installDebug(game, renderer, vi.fn(), vi.fn(), vi.fn(), vi.fn(), undefined, () => input.read(), () => readiness.ready);
  const key = (type: 'keydown' | 'keyup', code: string) => {
    const event = Object.assign(new Event(type), {code, key: code, repeat: false});
    documentTarget.dispatchEvent(event);
  };
  return {game, rendererStub, debug: windowTarget.__containmentDebug, input, key, readiness, renderSpy};
}

it('moves and fires from held native WASD/Space rather than a debug override', () => {
  const h = harness(), initial = {...h.game.player};
  h.debug.setInput({x: -1, y: 0, fire: false});
  h.debug.nativeInput(true);
  h.key('keydown', 'KeyD');
  h.key('keydown', 'Space');
  h.debug.step(100);
  expect(h.game.player.x).toBeGreaterThan(initial.x);
  expect(h.game.stats.shotsFired).toBeGreaterThan(0);
  const moved = h.game.player.x;
  h.key('keyup', 'KeyD');
  h.key('keyup', 'Space');
  h.debug.step(100);
  expect(h.game.player.x).toBe(moved);
  h.debug.nativeInput(false);
  h.debug.step(100);
  expect(h.game.player.x).toBeLessThan(moved);
});

it('retains native input in realtime and freezes explicit stepping during loading', () => {
  const h = harness(), update = vi.fn();
  const target: Record<string, any> = {};
  vi.stubGlobal('window', target);
  const game = {update, hurt: vi.fn(), status: 'playing'} as unknown as DepthGame;
  installDebug(game, h.rendererStub as unknown as DepthRenderer, vi.fn(), vi.fn(), vi.fn(), vi.fn(), undefined, () => h.input.read());
  const d = target.__containmentDebug;
  d.nativeInput(true); d.realtime(true);
  const intent: GameInput = {x: 1, y: 0, fire: true, angle: .4, autoAim: false};
  game.update(16, intent);
  expect(update).toHaveBeenCalledExactlyOnceWith(16, intent);
  h.rendererStub.roomLoading = true;
  expect(() => d.step(100)).toThrow('Room is still loading');
  expect(update).toHaveBeenCalledTimes(1);
});

it('rejects native stepping before any simulation while loading or recovering and retains fixture defaults', () => {
  const h = harness();
  h.debug.nativeInput(true);
  h.key('keydown', 'KeyD'); h.key('keydown', 'Space');
  const elapsed = h.game.elapsed, player = {...h.game.player}, stats = h.game.stats;
  h.readiness.ready = false;
  expect(h.debug.canStepNative).toBe(false);
  expect(() => h.debug.step(100)).toThrow('Native gameplay is not ready');
  h.debug.realtime(true); h.game.update(100, h.input.read());
  expect(h.game.elapsed).toBe(elapsed);
  expect(h.game.player).toEqual(player);
  expect(h.game.stats).toEqual(stats);
  expect(h.renderSpy).not.toHaveBeenCalled();
  h.debug.realtime(false); h.debug.nativeInput(false);
  expect(h.debug.canStepNative).toBe(true);
  h.debug.step(100);
  expect(h.game.elapsed - elapsed).toBeCloseTo(.1);
  h.rendererStub.roomLoading = true;
  expect(h.debug.canStepNative).toBe(false);
  expect(() => h.debug.step(100)).toThrow('Room is still loading');
});

it.each(['loading', 'recovery'] as const)('stops a native batch as soon as rendering begins %s without consuming the remainder', transition => {
  const h = harness();
  h.debug.nativeInput(true);
  h.key('keydown', 'KeyD'); h.key('keydown', 'Space');
  h.renderSpy.mockImplementation(() => {
    if (transition === 'loading') h.rendererStub.roomLoading = true;
    else h.readiness.ready = false;
  });
  const elapsed = h.game.elapsed;
  h.debug.step(100);
  expect(h.game.elapsed - elapsed).toBeCloseTo(1 / 60);
  expect(h.debug.stepPerformance.samples).toBe(1);
  expect(h.debug.canStepNative).toBe(false);
  h.rendererStub.roomLoading = false; h.readiness.ready = true;
  h.renderSpy.mockReset();
  h.debug.step(1000 / 60);
  expect(h.game.elapsed - elapsed).toBeCloseTo(2 / 60);
  expect(h.debug.stepPerformance.samples).toBe(2);
});

it('rejects missing native providers and invalid assistance; ordinary hurt remains exact', () => {
  const target: Record<string, any> = {};
  vi.stubGlobal('window', target);
  vi.stubGlobal('location', {search: '?debug=1'});
  const hurt = vi.fn(), game = {update: vi.fn(), hurt, status: 'playing'} as unknown as DepthGame;
  installDebug(game, {render: vi.fn(), effect: vi.fn()} as unknown as DepthRenderer, vi.fn(), vi.fn());
  const d = target.__containmentDebug;
  expect(() => d.nativeInput(true)).toThrow('Native input provider unavailable');
  game.hurt(27); expect(hurt).toHaveBeenLastCalledWith(27);
  (game.hurt as unknown as (value:unknown)=>void)('20'); expect(hurt).toHaveBeenLastCalledWith('20');
  for (const value of [0, -1, 1.1, NaN, Infinity]) expect(() => d.incomingDamageScale(value)).toThrow('incomingDamageScale');
  d.incomingDamageScale(.25); game.hurt(20); expect(hurt).toHaveBeenLastCalledWith(5);
  game.hurt(20,{x:120,y:250}); expect(hurt).toHaveBeenLastCalledWith(5,{x:120,y:250});
  d.incomingDamageScale(1); game.hurt(20); expect(hurt).toHaveBeenLastCalledWith(20);
});

it('native UI seed selection is diagnostic-only and accepts only unsigned integers', () => {
  // Execute the actual exported pure helper without bootstrapping the GPU/DOM application.
  const source = readFileSync(new URL('../src/ui/application.ts', import.meta.url), 'utf8');
  const body = source.slice(source.indexOf('export function debugRunSeed'), source.indexOf('/** Initialize assets'));
  const parse = new Function(`${ts.transpile(body.replace('export ', ''))}; return debugRunSeed;`)();
  expect(parse('?debug=1&seed=1729')).toBe(1729);
  expect(parse('?debug=1&seed=0')).toBe(0);
  expect(parse('?debug=1&seed=4294967295')).toBe(4294967295);
  for (const search of ['', '?seed=7', '?debug=0&seed=7', '?debug=1', '?debug=1&seed=', '?debug=1&seed=-1', '?debug=1&seed=1.5', '?debug=1&seed=4294967296', '?debug=1&seed=NaN']) expect(parse(search)).toBeUndefined();
  expect(source).toContain('game.newRun(debugRunSeed(location.search), {rigSelect: true})');
  expect(source).toContain('}, () => input.read(), () => !graphicsLost && !screens.graphicsBlocked && !roomRecovering && lastRoom === game.roomRevision && !renderer.roomLoading, liveObservation, listener=>{benchmarkListener=listener;});');
});

it('opts into the normal application RAF pipeline only for explicit passive debug observation', () => {
  const source = readFileSync(new URL('../src/ui/application.ts', import.meta.url), 'utf8');
  const body = source.slice(source.indexOf('export function debugLiveObservation'), source.indexOf('/** Seeded native UI starts'));
  const parse = new Function(`${ts.transpile(body.replace('export ', ''))}; return debugLiveObservation;`)();
  expect(parse('?debug=1&playtest-live=1')).toBe(true);
  for (const query of ['', '?debug=1', '?playtest-live=1', '?debug=0&playtest-live=1', '?debug=1&playtest-live=0', '?debug=1&playtest-live=true']) expect(parse(query)).toBe(false);
  expect(source).toContain("let presentationEnabled = new URLSearchParams(location.search).get('debug') !== '1' || debugLiveObservation(location.search);");
  expect(source).toContain('const liveObservation = debugLiveObservation(location.search);\n        presentationFrozen = !liveObservation;');
});

it('keeps production function identities and timing intact in passive live observation mode', () => {
  const target: Record<string, any> = {};
  vi.stubGlobal('window', target); vi.stubGlobal('location', {search: '?debug=1&playtest-live=1'});
  const update = vi.fn(), hurt = vi.fn(), render = vi.fn(), effect = vi.fn(), advanceUi = vi.fn();
  const game = {update, hurt, status: 'playing', elapsed: 0} as unknown as DepthGame;
  const renderer = {render, effect, roomLoading: false} as unknown as DepthRenderer;
  const intent: GameInput = {x: 1, y: 0, fire: true, angle: .5, autoAim: false};
  const presentation = {setEnabled: vi.fn(), reset: vi.fn(), effect: vi.fn(), step: vi.fn()};
  installDebug(game, renderer, vi.fn(), vi.fn(), vi.fn(), advanceUi, presentation, () => intent, () => true, true);
  const d = target.__containmentDebug;
  expect(d.liveObservation).toBe(true);
  d.nativeInput(true); d.realtime(true); d.presentation(true); d.incomingDamageScale(1); d.invulnerable(false);
  expect(game.update).toBe(update); expect(game.hurt).toBe(hurt);
  expect(renderer.render).toBe(render); expect(renderer.effect).toBe(effect);
  game.update(20, intent); renderer.render(game, .02, false); game.hurt(20);
  renderer.effect({type: 'hurt', x: 1, y: 2});
  expect(update).toHaveBeenCalledExactlyOnceWith(20, intent);
  expect(render).toHaveBeenCalledExactlyOnceWith(game, .02, false);
  expect(hurt).toHaveBeenCalledExactlyOnceWith(20);
  expect(d.events).toEqual([]);
  expect(advanceUi).not.toHaveBeenCalled();
  expect(presentation.step).not.toHaveBeenCalled();
  expect(presentation.setEnabled).not.toHaveBeenCalled();
  d.realtime(false); d.nativeInput(false);
  expect(game.update).toBe(update); expect(renderer.render).toBe(render);
  expect(d.canStepNative).toBe(true);
  (renderer as unknown as {roomLoading: boolean}).roomLoading = true;
  expect(d.canStepNative).toBe(false);
  expect(() => d.step(0)).toThrow('Fixed stepping unavailable in live observation mode');
  expect(() => d.incomingDamageScale(.5)).toThrow('Assistance unavailable');
  expect(() => d.invulnerable(true)).toThrow('Invulnerability unavailable');
  expect(() => d.presentation(false)).toThrow('Production presentation stays enabled');
  expect(game.update).toBe(update); expect(game.hurt).toBe(hurt);
  expect(renderer.render).toBe(render); expect(renderer.effect).toBe(effect);
});

it('reports fixed-step update plus render percentiles separately from realtime frame timing', () => {
  const target: Record<string, any> = {};
  vi.stubGlobal('window', target);
  vi.stubGlobal('location', {search: '?debug=1'});
  const clock = [0, 1, 10, 13, 20, 22];
  vi.stubGlobal('performance', {now: () => clock.shift()!});
  const game = {update: vi.fn(), hurt: vi.fn(), status: 'playing'} as unknown as DepthGame;
  installDebug(game, {render: vi.fn(), effect: vi.fn(), roomLoading: false} as unknown as DepthRenderer, vi.fn(), vi.fn());
  const d = target.__containmentDebug;
  expect(d.stepPerformance.samples).toBe(0);
  d.step(50);
  expect(d.stepPerformance).toEqual({samples: 3, retained: 3, updateRenderMs: {average: 2, p50: 2, p95: 3, max: 3}});
  d.resetStepPerformance();
  expect(d.stepPerformance).toEqual({samples: 0, retained: 0, updateRenderMs: {average: 0, p50: 0, p95: 0, max: 0}});
});

it('keeps bounded real effect receipts with damage attribution and denial details', () => {
  const target: Record<string, any> = {};
  vi.stubGlobal('window', target);
  vi.stubGlobal('location', {search: '?debug=1'});
  const effect = vi.fn(), game = {update: vi.fn(), hurt: vi.fn(), status: 'playing', elapsed: 7} as unknown as DepthGame;
  const renderer = {render: vi.fn(), effect} as unknown as DepthRenderer;
  installDebug(game, renderer, vi.fn(), vi.fn());
  const receipt = {type: 'hit' as const, source: 'ability' as const, damage: 35, targetId: 29, x: 100, y: 200};
  renderer.effect(receipt);
  expect(target.__containmentDebug.events[0]).toEqual({...receipt, at: 7});
  expect(effect).toHaveBeenLastCalledWith(receipt);
  for (let id = 0; id < 300; id++) renderer.effect({type: 'enemy-warning', x: id, y: 0, id});
  expect(target.__containmentDebug.events).toHaveLength(300);
  expect(target.__containmentDebug.events[0].id).toBe(0);
});

it('uses the production feel clock for native realtime while advancing UI by unscaled wall time once', () => {
  const target: Record<string, any> = {};
  vi.stubGlobal('window', target); vi.stubGlobal('location', {search: '?debug=1'});
  const update = vi.fn(), render = vi.fn(), advanceUi = vi.fn();
  const game = {update, hurt: vi.fn(), status: 'playing'} as unknown as DepthGame;
  const renderer = {render, effect: vi.fn(), roomLoading: false} as unknown as DepthRenderer;
  const intent: GameInput = {x: 1, y: 0, fire: true, angle: .5, autoAim: false};
  const presentation = {
    setEnabled: vi.fn(), reset: vi.fn(), effect: vi.fn(),
    step: vi.fn((ms: number, input: GameInput, original: (ms: number, input: GameInput) => void) => original(ms * .25, input)),
  };
  let ready = true;
  installDebug(game, renderer, vi.fn(), vi.fn(), vi.fn(), advanceUi, presentation, () => intent, () => ready);
  const d = target.__containmentDebug;
  d.nativeInput(true); d.presentation(true); d.realtime(true);
  advanceUi.mockClear(); render.mockClear();
  game.update(40, intent);
  expect(presentation.step).toHaveBeenCalledExactlyOnceWith(40, intent, expect.any(Function));
  expect(update).toHaveBeenCalledExactlyOnceWith(10, intent);
  renderer.render(game, .01, false);
  expect(render).toHaveBeenLastCalledWith(game, .01, false);
  expect(advanceUi).toHaveBeenLastCalledWith(.04);
  renderer.render(game, .01, false);
  expect(advanceUi.mock.calls).toEqual([[.04], [0]]);

  // A real hit-stop can scale renderer time to zero while the current UI wall clock still advances.
  game.update(40, intent); renderer.render(game, 0, false);
  expect(advanceUi).toHaveBeenLastCalledWith(.04);
  // Loading/recovery renders consume no wall time and cannot leave it pending for a later frame.
  game.update(40, intent); ready = false; renderer.render(game, 0, false);
  ready = true; renderer.render(game, .01, false);
  expect(advanceUi.mock.calls.slice(-2)).toEqual([[0], [0]]);
  game.update(20, intent); renderer.render(game, .005, false);
  expect(advanceUi).toHaveBeenLastCalledWith(.02);
});

it('does not enable the feel clock implicitly for ordinary native realtime benchmarks', () => {
  const target: Record<string, any> = {};
  vi.stubGlobal('window', target); vi.stubGlobal('location', {search: '?debug=1'});
  const update = vi.fn(), advanceUi = vi.fn();
  const game = {update, hurt: vi.fn(), status: 'playing'} as unknown as DepthGame;
  const renderer = {render: vi.fn(), effect: vi.fn(), roomLoading: false} as unknown as DepthRenderer;
  const intent: GameInput = {x: 0, y: 1, fire: true, angle: null, autoAim: true};
  const presentation = {setEnabled: vi.fn(), reset: vi.fn(), effect: vi.fn(), step: vi.fn()};
  installDebug(game, renderer, vi.fn(), vi.fn(), vi.fn(), advanceUi, presentation, () => intent);
  const d = target.__containmentDebug;
  d.nativeInput(true); d.realtime(true);
  game.update(20, intent); renderer.render(game, .02, false);
  expect(update).toHaveBeenCalledExactlyOnceWith(20, intent);
  expect(presentation.step).not.toHaveBeenCalled();
  expect(advanceUi).toHaveBeenCalledExactlyOnceWith(.02);
});


it('the application native readiness callback holds restored graphics until the recovery screen is dismissed', () => {
  const source=readFileSync(new URL('../src/ui/application.ts',import.meta.url),'utf8');
  const expression=source.match(/}, \(\) => input\.read\(\), \(\) => (.*), liveObservation, listener=>\{benchmarkListener=listener;\}\);/)![1];
  const ready=new Function('graphicsLost','screens','roomRecovering','lastRoom','game','renderer',`return ${expression};`);
  expect(ready(false,{graphicsBlocked:false},false,7,{roomRevision:7},{roomLoading:false})).toBe(true);
  expect(ready(false,{graphicsBlocked:true},false,7,{roomRevision:7},{roomLoading:false})).toBe(false);
  expect(ready(true,{graphicsBlocked:false},false,7,{roomRevision:7},{roomLoading:false})).toBe(false);
  expect(ready(false,{graphicsBlocked:false},true,7,{roomRevision:7},{roomLoading:false})).toBe(false);
  expect(ready(false,{graphicsBlocked:false},false,6,{roomRevision:7},{roomLoading:false})).toBe(false);
  expect(ready(false,{graphicsBlocked:false},false,7,{roomRevision:7},{roomLoading:true})).toBe(false);
});
