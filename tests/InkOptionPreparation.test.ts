import { describe, expect, it, vi } from 'vitest';
import { DepthRenderer } from '../src/render/DepthRenderer';
import { GRAPHICS_PRESETS } from '../src/render/graphicsOptions';

function renderer(tier:'high'|'low',inkOutlines:'off'|'silhouette'|'full') {
  const queueRoomWarmup=vi.fn();
  const value=Object.assign(Object.create(DepthRenderer.prototype),{
    tier,options:{...GRAPHICS_PRESETS[tier],inkOutlines},materialWarmup:{},corpses:[],
    applyQuality:vi.fn(),queueRoomWarmup,
  }) as DepthRenderer;
  return {value,queueRoomWarmup};
}

describe('ink graphics topology readiness',()=>{
  it('holds Low input when entering or leaving its forward-only path',()=>{
    const {value,queueRoomWarmup}=renderer('low','off');
    value.setGraphicsOptions({inkOutlines:'silhouette'});expect(queueRoomWarmup).toHaveBeenCalledTimes(1);
    value.setGraphicsOptions({inkOutlines:'full'});expect(queueRoomWarmup).toHaveBeenCalledTimes(1);
    value.setGraphicsOptions({inkOutlines:'off'});expect(queueRoomWarmup).toHaveBeenCalledTimes(2);
  });
  it('also prepares the path when reselecting the current Low preset',()=>{
    const {value,queueRoomWarmup}=renderer('low','off');value.setQuality('low');
    expect(queueRoomWarmup).toHaveBeenCalledOnce();expect(value.graphicsOptions.inkOutlines).toBe('silhouette');
  });
  it('keeps High outline strength changes uniform-only',()=>{
    const {value,queueRoomWarmup}=renderer('high','off');value.setGraphicsOptions({inkOutlines:'full'});
    expect(queueRoomWarmup).not.toHaveBeenCalled();
  });
});
