import {afterEach, expect, test} from 'vitest';
import {configureCaptureGraphics} from './capture-graphics.mjs';

afterEach(() => { delete globalThis.window; });
function fixture() {
  const calls = [];
  const renderer = {
    tier:'high', options:{},
    setQuality(tier) { this.tier = tier; this.options = {}; calls.push('tier'); },
    setGraphicsOptions(options) { this.options = {...this.options, ...options}; calls.push('options'); },
  };
  const debug = {renderer, async prepare() { calls.push('prepare'); await Promise.resolve(); calls.push('ready'); }, refresh() { calls.push('refresh'); }};
  globalThis.window = {__containmentDebug:debug};
  return {renderer, calls};
}
test('capture override is ready before a scenario can arm its combat guard', async () => {
  const {calls} = fixture();
  await configureCaptureGraphics({adaptiveResolution:false});
  calls.push('combat-guard');
  expect(calls).toEqual(['options','prepare','ready','refresh','combat-guard']);
});
test('native tier switches retain requested overrides without changing the selected tier', async () => {
  const {renderer} = fixture();
  await configureCaptureGraphics({adaptiveResolution:false});
  renderer.setQuality('low');
  expect(renderer.tier).toBe('low');
  expect(renderer.options.adaptiveResolution).toBe(false);
  renderer.setQuality('high');
  expect(renderer.options.adaptiveResolution).toBe(false);
});
test('default capture leaves the native tier method and options untouched', async () => {
  const {renderer,calls} = fixture();
  const select = renderer.setQuality;
  await configureCaptureGraphics({});
  expect(renderer.setQuality).toBe(select);
  expect(calls).toEqual([]);
});
