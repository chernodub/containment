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
  const rendererStub = {canvas: new Canvas(), pointer: () => null, render: vi.fn(), effect: vi.fn(), roomLoading: false};
  const renderer = rendererStub as unknown as DepthRenderer;
  const input = new InputController(game, renderer, () => {});
  installDebug(game, renderer, vi.fn(), vi.fn(), vi.fn(), vi.fn(), undefined, () => input.read());
  const key = (type: 'keydown' | 'keyup', code: string) => {
    const event = Object.assign(new Event(type), {code, key: code, repeat: false});
    documentTarget.dispatchEvent(event);
  };
  return {game, rendererStub, debug: windowTarget.__containmentDebug, input, key};
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

it('rejects missing native providers and invalid assistance; ordinary hurt remains exact', () => {
  const target: Record<string, any> = {};
  vi.stubGlobal('window', target);
  vi.stubGlobal('location', {search: '?debug=1'});
  const hurt = vi.fn(), game = {update: vi.fn(), hurt, status: 'playing'} as unknown as DepthGame;
  installDebug(game, {render: vi.fn(), effect: vi.fn()} as unknown as DepthRenderer, vi.fn(), vi.fn());
  const d = target.__containmentDebug;
  expect(() => d.nativeInput(true)).toThrow('Native input provider unavailable');
  game.hurt(27); expect(hurt).toHaveBeenLastCalledWith(27);
  for (const value of [0, -1, 1.1, NaN, Infinity]) expect(() => d.incomingDamageScale(value)).toThrow('incomingDamageScale');
  d.incomingDamageScale(.25); game.hurt(20); expect(hurt).toHaveBeenLastCalledWith(5);
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
