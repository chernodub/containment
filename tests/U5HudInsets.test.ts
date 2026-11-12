import {describe, expect, it, vi} from 'vitest';
import type {DepthRenderer} from '../src/render/DepthRenderer';
import {setHudInsets} from '../src/ui/gameAdapter';

describe('HUD camera boundary', () => {
  it('feature detects legacy renderers and publishes immutable CSS-pixel occupancy only on changes', () => {
    expect(() => setHudInsets({} as DepthRenderer, {top:20,right:260,bottom:100,left:0})).not.toThrow();
    const hook = vi.fn();
    const renderer = {setHudInsets:hook} as unknown as DepthRenderer;
    const value = {top:20,right:260,bottom:100,left:0};
    setHudInsets(renderer, value);
    expect(hook).toHaveBeenCalledWith(value);
    expect(hook.mock.contexts[0]).toBe(renderer);
    value.bottom = 80;
    expect(hook.mock.calls[0][0].bottom).toBe(100);
    setHudInsets(renderer, value);
    setHudInsets(renderer, value);
    expect(hook).toHaveBeenCalledTimes(2);
    setHudInsets(renderer, {top:0,right:0,bottom:0,left:0});
    expect(hook).toHaveBeenLastCalledWith({top:0,right:0,bottom:0,left:0});
  });

  it('rejects invalid edge values and supports a renderer hook arriving after the UI', () => {
    const renderer = {} as DepthRenderer & {setHudInsets?: ReturnType<typeof vi.fn>};
    setHudInsets(renderer, {top:10,right:20,bottom:30,left:0});
    renderer.setHudInsets = vi.fn();
    setHudInsets(renderer, {top:NaN,right:Infinity,bottom:-4,left:12.5});
    expect(renderer.setHudInsets).toHaveBeenLastCalledWith({top:0,right:0,bottom:0,left:12.5});
  });
});
