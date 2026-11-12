import { afterEach, describe, expect, it, vi } from 'vitest';
import { Color, Group, OrthographicCamera, Scene, WebGLRenderer, WebGLRenderTarget } from 'three';
import { FrameDiagnostics, setRenderDiagnostics } from '../src/render/FrameBudget';
import { GRAPHICS_PRESETS } from '../src/render/graphicsOptions';
import { GEOMETRY_CLASSES, registerGeometry } from '../src/render/post/GeometryBuffer';
import { PostPipeline } from '../src/render/post/PostPipeline';

afterEach(() => setRenderDiagnostics(undefined));

describe('G3 lifecycle review', () => {
  it('keeps attached owner identities unique across byte-slot recycling and native pool reborrows', () => {
    const scene = new Scene(), attached = Array.from({ length: 96 }, () => new Group());
    const pooled = new Group();
    for (const root of [...attached, pooled]) {
      registerGeometry(root, GEOMETRY_CLASSES.enemy);
      scene.add(root);
    }
    const oldPooledId = pooled.userData.containmentGeometryId;
    pooled.removeFromParent();
    let newOwner: Group | undefined;
    for (let iteration = 0; iteration < 1000; iteration++) {
      const root = new Group();
      registerGeometry(root, GEOMETRY_CLASSES.enemy);
      scene.add(root);
      if (root.userData.containmentGeometryId === oldPooledId && !newOwner) newOwner = root;
      else root.removeFromParent();
    }
    expect(newOwner).toBeDefined();
    registerGeometry(pooled, GEOMETRY_CLASSES.elite);
    scene.add(pooled);
    const ids = [...attached, pooled, newOwner!].map(root => root.userData.containmentGeometryId as number);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) { expect(Number.isInteger(id)).toBe(true); expect(id).toBeGreaterThanOrEqual(16); expect(id).toBeLessThanOrEqual(254); }
    for (const root of [...scene.children]) root.removeFromParent();
  });

  it('reads render diagnostics on demand and clears the public hook when its owner retires', () => {
    const diagnostics = new FrameDiagnostics();
    const provider = vi.fn(() => ({ adaptiveScale: .85 }));
    setRenderDiagnostics(provider);
    diagnostics.record(16.7, 2, 4);
    expect(provider).not.toHaveBeenCalled();
    expect(diagnostics.snapshot.renderPipeline).toEqual({ adaptiveScale: .85 });
    expect(provider).toHaveBeenCalledTimes(1);
    setRenderDiagnostics(undefined);
    expect(diagnostics.snapshot.renderPipeline).toBeUndefined();
  });

  it('reacquires the GPU timer extension only after the context has recovered', () => {
    let lost = false;
    const extension = { TIME_ELAPSED_EXT: 4, GPU_DISJOINT_EXT: 5 };
    const gl = {
      CURRENT_QUERY: 3,
      getExtension: vi.fn(() => { if (lost) throw new Error('extension requested while lost'); return extension; }),
      isContextLost: () => lost, getParameter: () => false, getQuery: () => null, createQuery: () => null,
    };
    const gpu = { getContext: () => gl, getRenderTarget: () => null };
    const pipeline = new PostPipeline(gpu as unknown as WebGLRenderer, new Scene(), new OrthographicCamera());
    vi.spyOn(pipeline as unknown as { renderTo(): void }, 'renderTo').mockImplementation(() => {});
    pipeline.setOptions(GRAPHICS_PRESETS.high, 'high');
    const originalTimer = pipeline.gpuTimer;
    lost = true;
    pipeline.invalidate();
    pipeline.render(0);
    expect(pipeline.gpuTimer).toBeUndefined();
    expect(gl.getExtension).toHaveBeenCalledTimes(1);
    lost = false;
    pipeline.render(0);
    expect(pipeline.gpuTimer).toBeDefined();
    expect(pipeline.gpuTimer).not.toBe(originalTimer);
    expect(pipeline.gpuTimer?.enabled).toBe(true);
    expect(gl.getExtension).toHaveBeenCalledTimes(2);
    pipeline.dispose();
  });

  it('restores actual target resolution immediately when the adaptive option is disabled', () => {
    let target: WebGLRenderTarget | null = null;
    const gpu = {
      capabilities: { maxSamples: 4 }, toneMapping: 0, toneMappingExposure: 1, autoClear: true,
      getClearColor: (color: Color) => color.setHex(0), getClearAlpha: () => 1, setClearColor() {},
      getRenderTarget: () => target, setRenderTarget(next: WebGLRenderTarget | null) { target = next; }, render() {},
    };
    const pipeline = new PostPipeline(gpu as unknown as WebGLRenderer, new Scene(), new OrthographicCamera(-1, 1, 1, -1));
    pipeline.setOptions(GRAPHICS_PRESETS.high, 'high');
    for (let index = 0; index < 400; index++) pipeline.adaptive.update(33.3, 24);
    pipeline.setSize(1920, 1080);
    pipeline.render(0);
    const resources = (pipeline as unknown as { resources: { scene: WebGLRenderTarget } }).resources;
    expect(resources.scene.width).toBe(1536);
    pipeline.setOptions({ ...GRAPHICS_PRESETS.high, adaptiveResolution: false }, 'high');
    expect(pipeline.adaptive.scale).toBe(1);
    expect([resources.scene.width, resources.scene.height]).toEqual([1920, 1080]);
    pipeline.dispose();
  });
});
