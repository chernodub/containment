import * as T from 'three';
import { describe, expect, it, vi } from 'vitest';
import { InstanceBatch } from '../src/render/abilities/InstanceBatch';
import { ElementKit } from '../src/render/abilities/ElementKit';
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
  it('keeps friendly boundaries separate from dark ground traces and emits fire as upright volume', () => {
    const aura=createAbilityZoneMaterial('aura'),fire=createAbilityZoneMaterial('fire'),frost=createAbilityZoneMaterial('frost');
    expect(aura.uniforms.kind.value).toBe(3);expect(fire.uniforms.kind.value).toBe(0);expect(frost.uniforms.kind.value).toBe(1);
    for(const m of [aura,fire,frost]){expect(m.depthWrite).toBe(false);expect(m.blending).toBe(T.NormalBlending);m.dispose();}
    const kit=new ElementKit(new T.Group()),camera=new T.PerspectiveCamera();camera.position.set(0,8,8);kit.setView(camera);
    kit.begin(.2);kit.fireFan(2,3,4,.4,1.3);kit.liquidFire(8,3,2);kit.outline(2,3,4,0xff7a2e);kit.end();
    expect(kit.batches.decal.mesh.count).toBe(0);expect(kit.batches.flame.mesh.count).toBeGreaterThan(40);
    const matrix=new T.Matrix4(),position=new T.Vector3(),scale=new T.Vector3();
    for(let i=0;i<kit.batches.flame.mesh.count;i++){
      kit.batches.flame.mesh.getMatrixAt(i,matrix);position.setFromMatrixPosition(matrix);scale.setFromMatrixScale(matrix);
      expect(position.y).toBeGreaterThan(.15);expect(scale.y*2).toBeGreaterThan(.25);
      expect(matrix.elements[5]).toBeGreaterThan(0);expect(matrix.elements[6]).toBeCloseTo(0);
    }
    const boundary=kit.rings.mesh.material as T.ShaderMaterial;
    expect(boundary.name).toBe('friendly-ability-boundary');expect(boundary.userData.friendlyBoundary).toBe(true);
    kit.rings.mesh.getMatrixAt(0,matrix);scale.setFromMatrixScale(matrix);expect(scale.x).toBeCloseTo(4);expect(scale.y).toBeCloseTo(4);
    kit.dispose();
  });
});
