import * as T from 'three';
import { describe, it, expect, vi } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { EffectAtlas, EFFECT_ATLAS_GLSL, TEXTURED_FIRE_GLSL } from './EffectAtlas';
import { ElementKit } from './ElementKit';
import { InstanceBatch } from './InstanceBatch';
import { GRAPHICS_PRESETS } from '../graphicsOptions';

describe('V6 authored atlas lifecycle and rendering contract', () => {
  it('ships a bounded power-of-two padded atlas with verified source and output hashes', () => {
    const root = 'public/assets/vfx/containment-v6/';
    const manifest = JSON.parse(readFileSync(root + 'atlas.json', 'utf8'));
    const bytes = readFileSync(root + 'elements.png');
    expect(statSync(root + 'elements.png').size).toBeLessThanOrEqual(3_000_000);
    expect(manifest.width).toBe(2048); expect(manifest.height).toBe(2048);
    expect(manifest.gutter).toBeGreaterThanOrEqual(2);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(manifest.output.sha256);
    expect(manifest.sources.length).toBe(7);
    for (const source of manifest.sources) { expect(source.license).toBe('CC0-1.0'); expect(source.sha256).toMatch(/^[a-f0-9]{64}$/); }
    for (const name of ['Flame02', 'WispySmoke02', 'Explosion01', 'frost', 'crystal', 'bolt', 'mist', 'hex', 'scan', 'scorch', 'crack']) {
      const { first, count } = manifest.frames[name];
      expect(first).toBeGreaterThanOrEqual(0); expect(first + count).toBeLessThanOrEqual(256);
    }
  });

  it('does not request title assets, coalesces preparation and ignores a late decode after disposal', async () => {
    vi.stubGlobal('document', { createElement: () => ({ width: 1, height: 1, getContext: () => null }) });
    let finish: ((image: HTMLImageElement) => void) | undefined;
    const load = vi.spyOn(T.ImageLoader.prototype, 'load').mockImplementation(((_url: string, done: (image: HTMLImageElement) => void) => {
      finish = done; return {} as HTMLImageElement;
    }) as typeof T.ImageLoader.prototype.load);
    try {
      const atlas = new EffectAtlas(); expect(load).not.toHaveBeenCalled();
      expect(atlas.texture.version).toBe(0); // No immutable 1x1 GPU upload before decode.
      const first = atlas.prepare(), second = atlas.prepare();
      expect(first).toBe(second); expect(load).toHaveBeenCalledOnce();
      expect(load.mock.calls[0][0]).toContain('assets/vfx/containment-v6/elements.png');
      atlas.dispose(); finish!({} as HTMLImageElement); await first;
      expect(atlas.loaded).toBe(false);
    } finally { load.mockRestore(); vi.unstubAllGlobals(); }
  });

  it('shares one mipmapped texture in the fixed kit inventory and disposes exactly once', async () => {
    const k = new ElementKit(new T.Group()), texture = k.atlas.texture, dispose = vi.spyOn(texture, 'dispose');
    expect(texture.minFilter).toBe(T.LinearMipmapLinearFilter); expect(texture.generateMipmaps).toBe(true);
    expect(texture.colorSpace).toBe(T.NoColorSpace);
    for (const b of Object.values(k.batches)) expect((b.mesh.material as T.ShaderMaterial).uniforms.map.value).toBe(texture);
    await k.prepare(); await k.prepare();
    const inventory = k.root.children.slice();
    k.begin(.1); k.sprite('mist', 1, 1, 1, .5, .5, 0x7fd6ff); k.end();
    expect(k.root.children).toEqual(inventory);
    k.dispose(); k.dispose(); expect(dispose).toHaveBeenCalledOnce();
  });

  it('uses texture alpha, interpolated frames, premultiplied smoke and additive sparks', () => {
    const root = new T.Group(), k = new ElementKit(root);
    const flame = k.batches.flame.mesh.material as T.ShaderMaterial, smoke = k.batches.smoke.mesh.material as T.ShaderMaterial;
    expect(flame.fragmentShader).toContain(TEXTURED_FIRE_GLSL);
    expect(flame.fragmentShader).toContain(EFFECT_ATLAS_GLSL);
    expect(smoke.fragmentShader).toContain('sceneDistance-viewDepth');
    expect(smoke.premultipliedAlpha).toBe(true); expect(smoke.depthWrite).toBe(false);
    expect((k.batches.spark.mesh.material as T.ShaderMaterial).blending).toBe(T.AdditiveBlending);
    const shader = smoke.fragmentShader;
    k.batches.smoke.setSoftDepth(new T.DepthTexture(4, 4), .1, 200);
    expect(smoke.uniforms.softCamera.value.w).toBe(1);
    k.batches.smoke.setSoftDepth(null); expect(smoke.uniforms.softCamera.value.w).toBe(0);
    expect(smoke.fragmentShader).toBe(shader); k.dispose();
  });

  it('feathers time-light stamps before the card edge and breaks up the bright echo fill', () => {
    const kit=new ElementKit(new T.Group());
    const decal=kit.batches.decal.mesh.material as T.ShaderMaterial;
    const ghost=kit.batches.ghost.mesh.material as T.ShaderMaterial;
    expect(decal.fragmentShader).toContain('if(tile==161.)a*=1.-smoothstep(.62,1.,length(p))');
    expect(ghost.fragmentShader).toContain('sin(worldHeight*32.-abilityTime*5.)');
    expect(ghost.depthWrite).toBe(false);expect(kit.root.children.filter(node=>node===kit.batches.ghost.mesh)).toHaveLength(1);
    kit.dispose();
  });

  it('bounds accumulated projected alpha-card coverage and tightens it on Low', () => {
    const b = new InstanceBatch(new T.Group(), 'smoke', 192), camera = new T.OrthographicCamera(-10, 10, 10, -10, .1, 100);
    camera.position.set(0, 8, 8); camera.lookAt(0,0,0); camera.updateMatrixWorld(); b.setView(camera);
    b.maxCoverage = .1; b.begin();
    for (let i = 0; i < 192; i++) b.draw(0, 1, 0, 2, 2, 1, 0x7fd6ff);
    expect(b.mesh.count).toBeGreaterThan(0); expect(b.mesh.count).toBeLessThanOrEqual(3);
    b.begin(); b.draw(0, 1, 0, 2, 2, 1, 0x7fd6ff); expect(b.mesh.count).toBe(1); b.dispose();
    const k = new ElementKit(new T.Group()); k.setOptions(GRAPHICS_PRESETS.low, 'low', false);
    expect(k.batches.smoke.maxCoverage).toBe(.10); expect(k.batches.flame.maxCoverage).toBe(.16); k.dispose();
  });
});
