import * as T from 'three';
import { describe, expect, it, vi } from 'vitest';
import { AttackEffects, EFFECT_LIMITS } from '../AttackEffects';
import { AfflictionBatches } from '../afflictions';
import { ElementKit } from './ElementKit';
import { GRAPHIC_COMBUSTION_GLSL, GRAPHIC_SOLID_FRAGMENT } from './GraphicLanguage';

const material = (node: T.Object3D) => (node as T.Mesh).material as T.ShaderMaterial;

describe('V7 common combustion vocabulary', () => {
  it('uses the same four-value ramp and mip cleanup for legacy blasts, status fire and ability fire', () => {
    const scene = new T.Scene(), attacks = new AttackEffects(scene), afflictions = new AfflictionBatches();
    const kit = new ElementKit(new T.Group());
    try {
      const explosion = material(scene.getObjectByName('explosion-fire')!);
      const status = material(afflictions.root.children[0]);
      const ability = material(kit.batches.flame.mesh);
      for (const shader of [explosion, status, ability]) {
        expect(shader.fragmentShader).toContain(GRAPHIC_COMBUSTION_GLSL);
        expect(shader.fragmentShader).toMatch(/(?:color=style>2\.5\?|c=|vec4\()graphicCombustion\(/);
        expect(shader.fragmentShader).toContain('graphicCoverage(');
        expect(shader.fragmentShader).toContain('return coverage*smoothstep(.035,.14,coverage)');
        expect(shader.fragmentShader).toContain('graphicBand(source.r,.86)');
        expect(shader.fragmentShader).toContain(',1.5)');
        expect(shader.depthWrite).toBe(false);
        const texture = shader.uniforms.map.value as T.Texture;
        expect(texture.generateMipmaps).toBe(true);
        expect(texture.minFilter).toBe(T.LinearMipmapLinearFilter);
      }
      // The atlas's existing source/detail samples are retained for electrical and ice shapes.
      expect(ability.fragmentShader).toContain('vec4 effectTile(float frame,vec2 uv)');
      expect(ability.fragmentShader).toContain('vec4 effectGraphicTile(float frame,vec2 uv)');
      expect(ability.fragmentShader).not.toContain('inkEdge');
      expect(status.fragmentShader).not.toContain('inkEdge');
      expect(ability.fragmentShader).not.toContain('source.rgb*');
      expect(explosion.fragmentShader).not.toContain('style>2.5?tex.rgb');
    } finally { attacks.dispose(); afflictions.dispose(); kit.dispose(); }
  });

  it('uses the common three-level vapor shading while keeping pools and texture owners fixed', () => {
    const scene = new T.Scene(), attacks = new AttackEffects(scene), kit = new ElementKit(new T.Group());
    const smoke = scene.children.find(node => node instanceof T.InstancedMesh && material(node).uniforms.style.value === 1)!;
    const inventory = [...scene.children], texture = material(smoke).uniforms.map.value as T.Texture;
    const dispose = vi.spyOn(texture, 'dispose');
    try {
      expect(material(smoke).fragmentShader).toContain('graphicSmoke(tex,vColor)');
      expect(material(kit.batches.smoke.mesh).fragmentShader).toContain('graphicSmoke(s,c)');
      for (let i = 0; i < 50; i++) attacks.event({ type: 'explosion', x: 64, y: 96, radius: 96 });
      attacks.update(.05, new T.Camera(), []);
      expect(attacks.counts.fire).toBeLessThanOrEqual(EFFECT_LIMITS.fire);
      expect(scene.children).toEqual(inventory);
      attacks.clear(); attacks.dispose(); attacks.dispose(); expect(dispose).toHaveBeenCalledOnce();
    } finally { attacks.dispose(); kit.dispose(); }
  });

  it('keeps Cryo crystal debris and makes kinetic fragments short hot splinters without brown rock masses', () => {
    const kit = new ElementKit(new T.Group());
    const mote = vi.spyOn(kit, 'mote');
    try {
      kit.debris(2, 3, 4, 'cryo', 12);
      expect(mote).toHaveBeenCalledTimes(12);
      for (const call of mote.mock.calls) {
        expect(call[0]).toBe('shard'); expect(call[7]).toBeGreaterThanOrEqual(.12);
        expect([0x7fd6ff, 0xe8fbff]).toContain(call[9]);
      }
      mote.mockClear(); kit.debris(2, 3, 4, 'kinetic', 32);
      expect(mote).toHaveBeenCalledTimes(32);
      for (const call of mote.mock.calls) {
        expect(call[0]).toBe('spark'); expect(call[7]).toBeLessThan(.06);
        expect(call[8]).toBeLessThan(.6); expect([0xffb454, 0xe8fbff]).toContain(call[9]);
      }
      expect(GRAPHIC_SOLID_FRAGMENT).toContain('if(phase<30.||phase>=40.)');
    } finally { kit.dispose(); }
  });
});
