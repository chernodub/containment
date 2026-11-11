import * as T from 'three';
import { describe, expect, it, vi } from 'vitest';
import { InstanceBatch } from '../src/render/abilities/InstanceBatch';
import { createAbilityZoneMaterial } from '../src/render/abilities/ZoneMaterials';

describe('element-true open fire materials', () => {
  it('owns alpha-covered animated flame/smoke atlases and retires their resources', () => {
    const root=new T.Group(),fire=new InstanceBatch(root,'flame',4),smoke=new InstanceBatch(root,'smoke',4);
    const material=fire.mesh.material as T.ShaderMaterial;
    expect(material.blending).toBe(T.AdditiveBlending);
    expect(material.uniforms.map.value).toBeInstanceOf(T.Texture);
    expect(material.fragmentShader).toContain('a*=s.a*edge');
    expect(material.fragmentShader).toContain('actionBar');
    expect(fire.mesh.geometry.hasAttribute('abilityPhase')).toBe(true);
    fire.begin(.2);fire.draw(1,.3,2,.3,.4,1,0xff7a2e);fire.end();
    const phase=fire.mesh.geometry.getAttribute('abilityPhase').getX(0);
    fire.begin(.4);fire.draw(1,.3,2,.3,.4,1,0xff7a2e);fire.end();
    expect(material.uniforms.abilityTime.value).toBe(.4);
    expect(fire.mesh.geometry.getAttribute('abilityPhase').getX(0)).toBe(phase);
    const texture=material.uniforms.map.value as T.Texture,dispose=vi.spyOn(texture,'dispose');fire.dispose();expect(dispose).toHaveBeenCalledOnce();smoke.dispose();
  });
  it('keeps Meltdown ring-only and zone interior energy textured', () => {
    const aura=createAbilityZoneMaterial('aura'),fire=createAbilityZoneMaterial('fire'),frost=createAbilityZoneMaterial('frost');
    expect(aura.uniforms.kind.value).toBe(3);
    expect(aura.fragmentShader).toContain('alpha=rim*.34*shimmer');
    expect(fire.fragmentShader).toContain('vein');expect(frost.fragmentShader).toContain('fringe');
    for(const m of [aura,fire,frost]){expect(m.depthWrite).toBe(false);expect(m.blending).toBe(T.AdditiveBlending);m.dispose();}
  });
});
