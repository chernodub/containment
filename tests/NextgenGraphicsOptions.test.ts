import {expect,it,vi} from 'vitest';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {GRAPHICS_PRESETS,resolveGraphicsOptions} from '../src/render/graphicsOptions';

it('clamps numeric options and rejects invalid persisted values without poisoning rendering',()=>{
 const result=resolveGraphicsOptions(GRAPHICS_PRESETS.high,{resolutionScale:-1,screenShake:2,flashIntensity:NaN,shadows:'invalid',bloom:'yes'} as never);
 expect(result.resolutionScale).toBe(.5);expect(result.screenShake).toBe(1);expect(result.flashIntensity).toBe(1);
 expect(result.shadows).toBe('high');expect(result.bloom).toBe(true);expect(Object.isFrozen(result)).toBe(true);
 expect(GRAPHICS_PRESETS.high.resolutionScale).toBe(1);
});
it('resets per-option overrides when a tier is selected and keeps Low cheap',()=>{
 const instance=Object.assign(Object.create(DepthRenderer.prototype),{renderer:{shadowMap:{enabled:true}},resize:vi.fn(),corpses:[]}) as DepthRenderer;
 instance.setQuality('high');instance.setGraphicsOptions({bloom:false,flashIntensity:0});
 expect(instance.graphicsOptions.bloom).toBe(false);expect(instance.graphicsOptions.flashIntensity).toBe(0);
 instance.setQuality('low');expect(instance.graphicsOptions).toEqual(GRAPHICS_PRESETS.low);
 instance.setGraphicsOptions({shadows:'high',ambientOcclusion:true});
 expect(instance.qualityTier).toBe('low');expect(instance.renderer.shadowMap.enabled).toBe(false);
 instance.setQuality('high');expect(instance.graphicsOptions).toEqual(GRAPHICS_PRESETS.high);
});

it('holds preparation again when a graphics change selects a different shader configuration',()=>{
 const queueRoomWarmup=vi.fn(),instance=Object.assign(Object.create(DepthRenderer.prototype),{options:GRAPHICS_PRESETS.high,tier:'high',materialWarmup:{},applyQuality:vi.fn(),queueRoomWarmup,corpses:[]}) as DepthRenderer;
 instance.setGraphicsOptions({bloom:false});expect(queueRoomWarmup).not.toHaveBeenCalled();
 instance.setGraphicsOptions({dynamicLights:false});expect(queueRoomWarmup).toHaveBeenCalledTimes(1);
 instance.setQuality('high');expect(queueRoomWarmup).toHaveBeenCalledTimes(2);
 instance.setQuality('low');expect(queueRoomWarmup).toHaveBeenCalledTimes(3);
 instance.setQuality('high');expect(queueRoomWarmup).toHaveBeenCalledTimes(4);
});
