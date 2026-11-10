import { afterEach, describe, expect, it, vi } from 'vitest';
import { InputController } from '../src/InputController';
import { DepthGame } from '../src/DepthGame';
import type { DepthRenderer } from '../src/render/DepthRenderer';
import { expeditionRewardOffers } from '../src/game/roguelike/expedition';

class Surface extends EventTarget {
  setPointerCapture() {}
  matches() { return false; }
}
afterEach(() => vi.unstubAllGlobals());
function fixture() {
  const doc = Object.assign(new Surface(), { hidden: false });
  const win = new Surface(), canvas = new Surface();
  vi.stubGlobal('document', doc); vi.stubGlobal('window', win);
  const game = new DepthGame(); game.newRun(101); game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
  let ready = true;
  const input = new InputController(game, { canvas, pointer: () => ({ x: game.player.x + 40, y: game.player.y + 100 }) } as unknown as DepthRenderer, () => {}, () => ready);
  const key = (name: string, type = 'keydown', repeat = false, typing = false) => {
    const e = Object.assign(new Event(type, { cancelable: true }), { key: name, repeat });
    Object.defineProperty(e, 'target', { value: { matches: () => typing } }); doc.dispatchEvent(e);
  };
  return { game, doc, win, canvas, input, key, unready: () => { ready = false; } };
}
describe('desktop Combat Rig input', () => {
  it.each([['Shift', 'dash'], ['q', 'tactical'], ['f', 'power'], ['v', 'overdrive']] as const)('%s edge-triggers %s once and permits a fresh press after release', (keyName, slot) => {
    const f = fixture(), use = vi.spyOn(f.game, 'useAbility').mockReturnValue(true);
    f.key(keyName); f.key(keyName); f.key(keyName, 'keydown', true);
    expect(use).toHaveBeenCalledExactlyOnceWith(slot);
    f.key(keyName, 'keyup'); f.key(keyName); expect(use).toHaveBeenCalledTimes(2);
  });
  it('feeds movement intent before the first frame and cursor world position on the same press', () => {
    const f = fixture();
    f.canvas.dispatchEvent(Object.assign(new Event('pointermove'), { pointerType: 'mouse', clientX: 300, clientY: 200 }));
    f.key('w'); f.key('Shift');
    expect(f.game.abilities.snapshot.dashing).toBe(true);
    f.game.update(50, f.input.read());
    expect(f.game.player.y).toBeLessThan(f.game.geometry.playerSpawn.y);
    expect(f.input.read().aimPoint).toEqual({ x: f.game.player.x + 40, y: f.game.player.y + 100 });
    expect(f.game.player.angle).toBeCloseTo(Math.atan2(100, 40));
  });
  it('ignores actions while typing, loading or outside play, and blur clears held directions and cursor aim', () => {
    const f = fixture(), use = vi.spyOn(f.game, 'useAbility');
    for (const k of ['Shift', 'q', 'f', 'v']) f.key(k, 'keydown', false, true);
    expect(use).not.toHaveBeenCalled();
    f.game.pause(); for (const k of ['Shift', 'q', 'f', 'v']) f.key(k);
    expect(use).not.toHaveBeenCalled(); f.game.resume();
    f.key('d'); f.win.dispatchEvent(new Event('blur')); expect(f.input.read().x).toBe(0);
    f.key('q'); expect(use).toHaveBeenCalledTimes(1); f.key('q', 'keyup');
    f.unready(); for (const k of ['Shift', 'q', 'f', 'v']) f.key(k);
    expect(use).toHaveBeenCalledTimes(1);
  });
});
