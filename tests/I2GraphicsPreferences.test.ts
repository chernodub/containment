import {afterEach, describe, expect, it, vi} from 'vitest';
import * as T from 'three';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {GRAPHICS_PRESETS, type GraphicsOptions} from '../src/render/graphicsOptions';
import {getGraphicsOptions, setGraphicsOptions, setGraphicsTier} from '../src/ui/gameAdapter';
import {createSettings, loadUiPreferences, saveUiPreferences, UI_STORAGE_KEY} from '../src/ui/settings';

afterEach(() => vi.unstubAllGlobals());

function preferencesStorage(value: unknown) {
  const values = new Map([[UI_STORAGE_KEY, JSON.stringify(value)]]);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, next: string) => {values.set(key, next);},
  } as Storage;
}

function rendererProbe() {
  return Object.assign(Object.create(DepthRenderer.prototype), {
    renderer: {shadowMap: {enabled: true}}, resize: vi.fn(), corpses: [],
    post: {setOptions: vi.fn()},
  }) as DepthRenderer;
}

const audio = () => ({
  setMasterVolume: vi.fn(), setMusicVolume: vi.fn(), setEffectsVolume: vi.fn(),
}) as unknown as Parameters<typeof createSettings>[0]['audio'];

describe('I2 preferences against live renderer methods', () => {
  it('applies a tier once, resets overrides, and follows direct renderer changes', () => {
    const renderer = rendererProbe();
    setGraphicsTier(renderer, 'high');
    expect(renderer.resize).toHaveBeenCalledTimes(1);
    setGraphicsOptions(renderer, {screenShake: .2, bloom: false});
    expect(getGraphicsOptions(renderer)).toBe(renderer.graphicsOptions);
    expect(renderer.graphicsOptions).toMatchObject({screenShake: .2, bloom: false});
    setGraphicsTier(renderer, 'low');
    expect(renderer.resize).toHaveBeenCalledTimes(3);
    expect(renderer.graphicsOptions).toEqual(GRAPHICS_PRESETS.low);
    renderer.setQuality('high');
    expect(getGraphicsOptions(renderer)).toEqual(GRAPHICS_PRESETS.high);
  });

  it('uses the same validation and immutable values for legacy graphics facades', () => {
    const renderer = {qualityTier: 'high', setQuality: vi.fn()} as unknown as DepthRenderer;
    setGraphicsOptions(renderer, {resolutionScale: -1, flashIntensity: NaN, bloom: 'yes', shadows: 'invalid'} as never);
    expect(getGraphicsOptions(renderer)).toEqual({...GRAPHICS_PRESETS.high, resolutionScale: .5});
    expect(Object.isFrozen(getGraphicsOptions(renderer))).toBe(true);
    expect(GRAPHICS_PRESETS.high.resolutionScale).toBe(1);
  });

  it.each(['high', 'low'] as const)('restores %s overrides across settings recreation without changing tier', tier => {
    const graphics = {...GRAPHICS_PRESETS[tier], bloom: tier === 'low', shadows: 'low', resolutionScale: .7, screenShake: .25, flashIntensity: .35} satisfies GraphicsOptions;
    const storage = preferencesStorage({version: 1, tier, graphics, radar: true, combatText: false});
    const before = storage.getItem(UI_STORAGE_KEY);
    for (let reload = 0; reload < 2; reload++) {
      const renderer = rendererProbe();
      const settings = createSettings({renderer, audio: audio(), storage});
      settings.apply();
      expect(renderer.qualityTier).toBe(tier);
      expect(renderer.graphicsOptions).toEqual(graphics);
      expect(settings.preferences).toEqual({radar: true, combatText: false});
      expect(storage.getItem(UI_STORAGE_KEY)).toBe(before);
      expect(renderer.renderer.shadowMap.enabled).toBe(tier === 'high');
      settings.dispose();
    }
  });

  it('restores saved choices after reduced motion clears and preserves them in storage', () => {
    const media = Object.assign(new EventTarget(), {matches: true});
    vi.stubGlobal('window', {matchMedia: () => media});
    const storage = preferencesStorage({tier: 'low', graphics: {screenShake: .4, flashIntensity: .3}});
    const saved = loadUiPreferences(storage);
    saveUiPreferences(storage, saved);
    const before = storage.getItem(UI_STORAGE_KEY);
    const renderer = rendererProbe();
    const settings = createSettings({renderer, audio: audio(), storage});
    try {
      settings.apply();
      expect(renderer.graphicsOptions).toMatchObject({screenShake: 0, flashIntensity: 0});
      media.matches = false;
      media.dispatchEvent(new Event('change'));
      expect(renderer.graphicsOptions).toEqual(saved.graphics);
      expect(storage.getItem(UI_STORAGE_KEY)).toBe(before);
      expect(renderer.qualityTier).toBe('low');
    } finally {settings.dispose();}
  });
});

type RecoveryProbe = {
  graphicsGeneration: number;
  queueRoomWarmup(): void;
  roomWarmWork: Promise<void>;
  roomWarmPending: boolean;
};

/** Run the real recovery preparation path; only GPU/resource boundaries are faked. */
function recoveryProbe() {
  const context = {lost: false, isContextLost() {return this.lost;}};
  const restore = () => vi.fn();
  const resources = {
    scene: new T.Scene(), hudScene: new T.Scene(), world: new T.Group(),
    camera: new T.PerspectiveCamera(28), focus: new T.Vector3(),
    graphicsGeneration: 0, preparationTargets: new Set(), roomWarmPending: false,
    disposed: false, warmAgain: false, deferredRoom: null,
    surfaces: {ready: Promise.resolve()},
    reflection: {texture: {}},
    materialWarmup: {prepare: restore},
    atmosphere: {prepare: restore, setOptions: vi.fn()},
    backdrop: {prepare: restore, setQuality: vi.fn()},
    arena: {prepare: restore},
    actorPool: {take: () => ({root: new T.Group(), animate: vi.fn()}), release: vi.fn()},
    player: {equip: vi.fn(), animate: vi.fn()},
    lighting: {
      setQuality: vi.fn(),
      pool: {prewarmCounts: [0, 2], setPrewarmCount: vi.fn()},
    },
    muzzle: {visible: true},
    post: {setOptions: vi.fn(), prepare: async () => {}},
    renderer: {
      shadowMap: {enabled: true, needsUpdate: false}, toneMapping: T.AgXToneMapping,
      getContext: () => context, getRenderTarget: () => null,
      setRenderTarget: vi.fn(), setViewport: vi.fn(), setScissor: vi.fn(), setScissorTest: vi.fn(),
      info: {programs: []}, compile: vi.fn(), render: vi.fn(),
    },
  };
  const renderer = rendererProbe();
  Object.assign(renderer, resources);
  return {renderer, resources, recovery: renderer as unknown as RecoveryProbe, context};
}

it.each(['high', 'low'] as const)('keeps persisted %s overrides through a context-invalidated warmup and recovery retry', async tier => {
  const {renderer, resources, recovery, context} = recoveryProbe();
  const graphics = {...GRAPHICS_PRESETS[tier], resolutionScale: .75, screenShake: .2, flashIntensity: .3, dynamicLights: false};
  const storage = preferencesStorage({version: 1, tier, graphics});
  const settings = createSettings({renderer, audio: audio(), storage});
  try {
    settings.apply();
    const before = storage.getItem(UI_STORAGE_KEY);
    resources.renderer.compile.mockImplementationOnce(() => {
      context.lost = true;
      recovery.graphicsGeneration++;
    });
    recovery.queueRoomWarmup();
    await recovery.roomWarmWork;
    expect(context.lost).toBe(true);
    expect(recovery.roomWarmPending).toBe(false);
    expect(renderer.graphicsOptions).toEqual(graphics);
    context.lost = false;
    recovery.queueRoomWarmup();
    // application.ts reapplies saved settings in its restoration listener.
    settings.apply();
    await recovery.roomWarmWork;
    expect(recovery.roomWarmPending).toBe(false);
    expect(renderer.qualityTier).toBe(tier);
    expect(getGraphicsOptions(renderer)).toEqual(graphics);
    expect(renderer.renderer.shadowMap.enabled).toBe(tier === 'high');
    expect(resources.post.setOptions).toHaveBeenLastCalledWith(graphics, tier);
    expect(storage.getItem(UI_STORAGE_KEY)).toBe(before);
    expect(resources.actorPool.release).toHaveBeenCalledTimes(32);
    expect(resources.preparationTargets.size).toBe(0);
  } finally {settings.dispose();}
});


it('redraws replacement low-resolution shadows before the post warm frame samples them', async () => {
  const {renderer, resources, recovery} = recoveryProbe();
  renderer.setGraphicsOptions({shadows: 'low'});
  resources.renderer.render.mockImplementation(() => {resources.renderer.shadowMap.needsUpdate = false;});
  resources.post.prepare = vi.fn(async () => {
    expect(renderer.graphicsOptions.shadows).toBe('low');
    expect(resources.renderer.shadowMap.enabled).toBe(true);
    expect(resources.renderer.shadowMap.needsUpdate).toBe(true);
  });
  recovery.queueRoomWarmup();
  await recovery.roomWarmWork;
  expect(resources.post.prepare).toHaveBeenCalledOnce();
});
