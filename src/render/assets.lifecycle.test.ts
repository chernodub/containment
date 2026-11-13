import {afterEach, describe, expect, it, vi} from 'vitest';
import * as T from 'three';
import {GLTFLoader, type GLTF} from 'three/addons/loaders/GLTFLoader.js';

const source = () => ({scene:new T.Group(), animations:[]} as unknown as GLTF);
afterEach(() => { vi.restoreAllMocks(); });

describe('model template loading ownership', () => {
  it('shares in-flight decodes across overlapping callers and completes each progress stream', async () => {
    vi.resetModules();
    const {preloadAssets, ASSET_NAMES, instantiateAsset} = await import('./assets');
    const releases: (() => void)[] = [];
    const loader = vi.spyOn(GLTFLoader.prototype, 'loadAsync').mockImplementation(() => new Promise(resolve => {
      releases.push(() => resolve(source()));
    }));
    const firstProgress = vi.fn(), secondProgress = vi.fn();
    const first = preloadAssets(firstProgress, async () => {});
    const second = preloadAssets(secondProgress, async () => {});
    await vi.waitFor(() => expect(loader).toHaveBeenCalledTimes(4));
    // Both callers traverse their own bounded queue while sharing each decode.
    for (let completed = 0; completed < ASSET_NAMES.length;) {
      const batch = releases.splice(0);
      expect(batch.length).toBeGreaterThan(0);
      batch.forEach(release => release()); completed += batch.length;
      if (completed < ASSET_NAMES.length) await vi.waitFor(() => expect(releases.length).toBeGreaterThan(0));
    }
    await Promise.all([first, second]);
    expect(loader).toHaveBeenCalledTimes(ASSET_NAMES.length);
    for (const progress of [firstProgress, secondProgress]) {
      expect(progress.mock.calls.map(([fraction]) => fraction)).toEqual(ASSET_NAMES.map((_, index) => (index + 1) / ASSET_NAMES.length));
    }
    for (const name of ASSET_NAMES) expect(instantiateAsset(name).root).toBeInstanceOf(T.Group);
    await preloadAssets(undefined, async () => {});
    expect(loader).toHaveBeenCalledTimes(ASSET_NAMES.length);
  });

  it('keeps shared template images and geometry alive when an instance retires', async () => {
    vi.resetModules();
    const {registerAsset, instantiateAsset} = await import('./assets');
    const {disposeModel} = await import('./meshParts');
    const scene = new T.Group(), geometry = new T.BoxGeometry(), texture = new T.Texture();
    const material = new T.MeshStandardMaterial({map:texture});
    scene.add(new T.Mesh(geometry, material));
    registerAsset('marine', {scene, animations:[]} as unknown as GLTF);
    const preparedGeometry=(scene.children[0] as T.Mesh).geometry;
    const first = instantiateAsset('marine'), second = instantiateAsset('marine');
    const mesh = (root:T.Object3D) => root.children[0] as T.Mesh<T.BufferGeometry, T.MeshStandardMaterial>;
    const firstMesh = mesh(first.root), secondMesh = mesh(second.root);
    expect(firstMesh.material).not.toBe(material);
    expect(firstMesh.material).not.toBe(secondMesh.material);
    expect(firstMesh.material.map).toBe(texture);
    expect(secondMesh.material.map).toBe(texture);
    expect(firstMesh.geometry).toBe(preparedGeometry);expect(secondMesh.geometry).toBe(preparedGeometry);
    const retireMaterial = vi.spyOn(firstMesh.material, 'dispose');
    const retireGeometry = vi.spyOn(preparedGeometry, 'dispose'), retireTexture = vi.spyOn(texture, 'dispose');
    disposeModel(first.root);
    expect(retireMaterial).toHaveBeenCalledTimes(1);
    expect(retireGeometry).not.toHaveBeenCalled();
    expect(retireTexture).not.toHaveBeenCalled();
    expect(secondMesh.material.map).toBe(texture);
    disposeModel(second.root);
    expect(retireGeometry).not.toHaveBeenCalled();
    expect(retireTexture).not.toHaveBeenCalled();
    preparedGeometry.dispose();if(preparedGeometry!==geometry)geometry.dispose(); texture.dispose(); material.dispose();
  });

  it('evicts failed in-flight work so a subsequent boot retries only the failed model', async () => {
    vi.resetModules();
    const {preloadAssets, ASSET_NAMES} = await import('./assets');
    const failure = Error('model transfer interrupted');
    let rejectFirst!: (reason:unknown) => void;
    const loader = vi.spyOn(GLTFLoader.prototype, 'loadAsync').mockImplementation(url => url.endsWith('/marine.glb')
      ? new Promise((_, reject) => { rejectFirst = reject; })
      : Promise.resolve(source()));
    const first = preloadAssets(undefined, async () => {});
    const second = preloadAssets(undefined, async () => {});
    const results = Promise.allSettled([first, second]);
    await vi.waitFor(() => expect(loader).toHaveBeenCalledTimes(ASSET_NAMES.length));
    rejectFirst(failure);
    expect(await results).toEqual([{status:'rejected', reason:failure}, {status:'rejected', reason:failure}]);
    loader.mockResolvedValue(source());
    await preloadAssets(undefined, async () => {});
    expect(loader).toHaveBeenCalledTimes(ASSET_NAMES.length + 1);
    expect(loader.mock.calls.at(-1)?.[0]).toMatch(/\/marine\.glb$/);
  });
});
