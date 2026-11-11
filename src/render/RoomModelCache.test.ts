import {afterEach, describe, expect, it, vi} from 'vitest';
import * as T from 'three';
import type {GLTF} from 'three/addons/loaders/GLTFLoader.js';
import {RoomModelCache, retireRoomModels, type RoomModelSpec} from './RoomModelCache';
import {attachReleasedBerth} from './ReleasedBerth';
import {attachRecoveryKit} from './RecoveryKit';
import {attachSealedBank} from './SealedChamberBank';
import {createAwakeningRelease, createAwakeningKit, createAwakeningRacks} from './AuthoredRooms';

class Bitmap {
  width = 16;
  height = 8;
  close = vi.fn(() => { this.width = this.height = 0; });
}
const specs:RoomModelSpec[] = ['sealed', 'released', 'recovery'].map(label => ({url:label, label, maxBytes:100}));
function fixture(kind = 'released') {
  const scene = new T.Group(), image = new Bitmap(), map = new T.Texture(image);
  const geometry = kind === 'sealed' ? new T.BoxGeometry(1.53, .694, 2.58) : kind === 'recovery' ? new T.BoxGeometry(1, .8, .5) : new T.BoxGeometry(2, .8, 3);
  const material = new T.MeshStandardMaterial({map, roughnessMap:map, metalnessMap:map});
  const mesh = new T.Mesh(geometry, material);
  mesh.position.set(0, kind === 'sealed' ? .352 : .4, kind === 'recovery' ? -.5 : 0);
  scene.add(mesh);
  const asset = {scene, animations:[], parser:{json:{textures:[{}], materials:[{pbrMetallicRoughness:{baseColorTexture:{index:0}, metallicRoughnessTexture:{index:0}}}]}, associations:new Map([[material, {materials:0}]]), getDependencies:async () => [map]}} as unknown as GLTF;
  return {asset, image, map, geometry, material};
}
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('bounded session room model cache', () => {
  it('decodes each of three models once across twenty native owner acquire/retire cycles', async () => {
    vi.stubGlobal('ImageBitmap', Bitmap);
    const sources = new Map(specs.map(spec => [spec.url, fixture(spec.label)]));
    const loader = vi.fn(async (spec:RoomModelSpec) => sources.get(spec.url)!.asset);
    const cache = new RoomModelCache(specs, loader);
    const geometryDisposals = [...sources.values()].map(source => vi.spyOn(source.geometry, 'dispose'));
    const textureDisposals = [...sources.values()].map(source => vi.spyOn(source.map, 'dispose'));
    for (let cycle = 0; cycle < 20; cycle++) {
      const room = new T.Group();
      for (const name of ['awakening-racks', 'awakening-release', 'awakening-kit']) { const fallback = new T.Group(); fallback.name = name; room.add(fallback); }
      const owners = [
        attachSealedBank(room, vi.fn(), signal => cache.acquire('sealed', signal)),
        attachReleasedBerth(room, vi.fn(), signal => cache.acquire('released', signal)),
        attachRecoveryKit(room, vi.fn(), signal => cache.acquire('recovery', signal)),
      ];
      await Promise.all(owners.map(owner => owner.ready));
      expect(owners.map(owner => owner.state)).toEqual(['ready', 'ready', 'ready']);
      owners.forEach(owner => { owner.dispose(); owner.dispose(); });
      for (const source of sources.values()) {
        expect(source.image.width).toBe(16);
        expect(source.image.close).not.toHaveBeenCalled();
      }
    }
    expect(loader).toHaveBeenCalledTimes(3);
    for (const spy of [...geometryDisposals, ...textureDisposals]) expect(spy).not.toHaveBeenCalled();
    cache.dispose(); cache.dispose();
    for (const spy of [...geometryDisposals, ...textureDisposals]) expect(spy).toHaveBeenCalledTimes(1);
    for (const source of sources.values()) expect(source.image.close).toHaveBeenCalledTimes(1);
  });

  it('shares immutable geometry/textures and clones each owner graph/material once per identity', async () => {
    const source = fixture(), cache = new RoomModelCache(specs, async () => source.asset);
    const originalMesh = source.asset.scene.children[0] as T.Mesh;
    source.asset.scene.add(new T.Mesh(source.geometry, source.material));
    const first = await cache.acquire('released'), second = await cache.acquire('released');
    const a = first.children[0] as T.Mesh<T.BufferGeometry, T.MeshStandardMaterial>, b = second.children[0] as typeof a;
    expect(a.geometry).toBe(source.geometry); expect(a.material.map).toBe(source.map);
    expect(a.material).not.toBe(source.material); expect(a.material).not.toBe(b.material);
    expect((first.children[1] as T.Mesh).material).toBe(a.material);
    first.position.x = 99; a.position.y = 99; a.material.roughness = .1;
    expect(second.position.x).toBe(0); expect(b.position.y).toBe(originalMesh.position.y);
    expect(source.material.roughness).not.toBe(.1);
    const disposeMaterial = vi.spyOn(a.material, 'dispose');
    retireRoomModels(first); retireRoomModels(first);
    expect(disposeMaterial).toHaveBeenCalledTimes(1);
    retireRoomModels(second); cache.dispose();
  });

  it('coalesces decode while a departed owner cancels without harming a surviving owner', async () => {
    vi.stubGlobal('ImageBitmap', Bitmap);
    const source = fixture();
    let finish!: (asset:GLTF) => void;
    const loader = vi.fn(() => new Promise<GLTF>(resolve => { finish = resolve; }));
    const cache = new RoomModelCache(specs, loader);
    const departed = new T.Group(), surviving = new T.Group();
    departed.add(createAwakeningRelease()); surviving.add(createAwakeningRelease());
    const stale = attachReleasedBerth(departed, vi.fn(), signal => cache.acquire('released', signal));
    const live = attachReleasedBerth(surviving, vi.fn(), signal => cache.acquire('released', signal));
    await vi.waitFor(() => expect(loader).toHaveBeenCalledTimes(1));
    stale.dispose(); await stale.ready;
    finish(source.asset); await live.ready;
    expect(stale.state).toBe('disposed'); expect(live.state).toBe('ready');
    expect(departed.getObjectByName('released-berth')).toBeUndefined();
    expect(source.image.close).not.toHaveBeenCalled();
    live.dispose(); cache.dispose(); expect(source.image.close).toHaveBeenCalledTimes(1);
  });

  it('defers explicit cache shutdown until the final active borrow retires', async () => {
    vi.stubGlobal('ImageBitmap', Bitmap);
    const source = fixture(), cache = new RoomModelCache(specs, async () => source.asset);
    const a = await cache.acquire('released'), b = await cache.acquire('released');
    cache.dispose(); expect(source.image.close).not.toHaveBeenCalled();
    retireRoomModels(a); expect(source.image.close).not.toHaveBeenCalled();
    retireRoomModels(b); expect(source.image.close).toHaveBeenCalledTimes(1);
    await expect(cache.acquire('released')).rejects.toThrow('disposed');
  });

  it('retires a pending decode after shutdown and never hands out a dead template', async () => {
    vi.stubGlobal('ImageBitmap', Bitmap);
    const source = fixture();
    let finish!: (asset:GLTF) => void;
    const cache = new RoomModelCache(specs, () => new Promise(resolve => { finish = resolve; }));
    const pending = cache.acquire('released');
    const result = expect(pending).rejects.toThrow('disposed');
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
    cache.dispose(); finish(source.asset); await result;
    expect(source.image.close).toHaveBeenCalledTimes(1);
  });

  it('evicts rejected decodes and refuses null textures swallowed by Three before caching', async () => {
    vi.stubGlobal('ImageBitmap', Bitmap);
    const incomplete = fixture(), complete = fixture();
    incomplete.asset.parser.getDependencies = async () => [null] as never;
    const loader = vi.fn().mockRejectedValueOnce(Error('network unavailable')).mockResolvedValueOnce(incomplete.asset).mockResolvedValue(complete.asset);
    const cache = new RoomModelCache(specs, loader);
    await expect(cache.acquire('released')).rejects.toThrow('network unavailable');
    await expect(cache.acquire('released')).rejects.toThrow('image decode failed');
    expect(incomplete.image.close).toHaveBeenCalledTimes(1);
    const source = await cache.acquire('released');
    expect(loader).toHaveBeenCalledTimes(3);
    retireRoomModels(source); cache.dispose(); expect(complete.image.close).toHaveBeenCalledTimes(1);
  });

  it('preserves required material bindings even when all decoded images are valid', async () => {
    const source = fixture(), complete = fixture();
    source.material.roughnessMap = null;
    const loader = vi.fn().mockResolvedValueOnce(source.asset).mockResolvedValue(complete.asset);
    const cache = new RoomModelCache(specs, loader);
    await expect(cache.acquire('released')).rejects.toThrow('image binding failed');
    const retry = await cache.acquire('released');
    expect(loader).toHaveBeenCalledTimes(2);
    retireRoomModels(retry); cache.dispose();
  });

  it('retains the native timeout fallback while a shared decode finishes for a later room', async () => {
    vi.useFakeTimers();
    const source = fixture();
    let finish!: (asset:GLTF) => void;
    const loader = vi.fn(() => new Promise<GLTF>(resolve => { finish = resolve; }));
    const cache = new RoomModelCache(specs, loader), first = new T.Group(), second = new T.Group();
    first.add(createAwakeningRelease()); second.add(createAwakeningRelease());
    try {
      const timeout = attachReleasedBerth(first, vi.fn(), signal => cache.acquire('released', signal), 20);
      await vi.advanceTimersByTimeAsync(21); await timeout.ready;
      expect(timeout.state).toBe('fallback');
      const next = attachReleasedBerth(second, vi.fn(), signal => cache.acquire('released', signal));
      finish(source.asset); await next.ready;
      expect(loader).toHaveBeenCalledTimes(1); expect(next.state).toBe('ready');
      timeout.dispose(); next.dispose(); cache.dispose();
    } finally { vi.useRealTimers(); }
  });

  it('rejects unknown URLs and capacities beyond the three authored templates', async () => {
    const cache = new RoomModelCache(specs);
    await expect(cache.acquire('unbounded')).rejects.toThrow('Unknown');
    expect(() => new RoomModelCache([...specs, {url:'fourth', maxBytes:1, label:'fourth'}])).toThrow('at most three');
    expect(() => new RoomModelCache([specs[0], specs[0]])).toThrow('unique');
    cache.dispose();
  });
});
