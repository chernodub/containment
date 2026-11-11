import * as T from 'three';
import {expect,it} from 'vitest';
import {ContactShadows} from '../SceneLighting';
import {PickupInstances} from '../PickupInstances';

it('shares an identical instanced shader family for contact gradients and every semantic pickup beam',()=>{
  const contacts=new ContactShadows(),pickups=new PickupInstances();
  const contact=contacts.mesh.material as T.ShaderMaterial;
  const beams=(pickups.root.children as T.InstancedMesh[]).filter(mesh=>mesh.material instanceof T.ShaderMaterial);
  try{
    expect(beams).toHaveLength(5);
    expect(contact.uniforms.indicatorMode.value).toBe(0);
    expect((contact.uniforms.indicatorColor.value as T.Color).toArray()).toEqual([.025,.035,.045]);
    for(const mesh of beams){
      expect(mesh).toBeInstanceOf(T.InstancedMesh);
      const beam=mesh.material as T.ShaderMaterial;
      expect(beam.vertexShader).toBe(contact.vertexShader);expect(beam.fragmentShader).toBe(contact.fragmentShader);
      expect(beam.defines).toEqual(contact.defines);expect(beam.customProgramCacheKey()).toBe(contact.customProgramCacheKey());
      expect(beam.uniforms.indicatorMode.value).toBe(1);
      for(const property of ['side','forceSinglePass','transparent','depthTest','depthWrite','toneMapped','vertexColors','blending','premultipliedAlpha','fog'] as const)expect(beam[property]).toBe(contact[property]);
      expect(beam.side).toBe(T.DoubleSide);expect(beam.forceSinglePass).toBe(true);expect(beam.toneMapped).toBe(false);expect(beam.vertexColors).toBe(false);
      expect(mesh.geometry.getAttribute('color')).toBeUndefined();
    }
    contacts.begin();contacts.add(2,3,.7);contacts.end();
    const matrix=new T.Matrix4();contacts.mesh.getMatrixAt(0,matrix);
    expect(contacts.mesh.count).toBe(1);expect(matrix.elements[13]).toBeCloseTo(.025);
    expect(matrix.elements[0]).toBeCloseTo(.7*1.3);expect(matrix.elements[10]).toBeCloseTo(.7);
  }finally{contacts.dispose();pickups.dispose();}
});
