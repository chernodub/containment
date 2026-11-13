import {beforeAll,expect,it} from 'vitest';
import * as T from 'three';
import {loadModels} from '../../tests/loadModels';
import {alien,disposeModel} from './models';
import {AfflictionBatches} from './afflictions';

beforeAll(loadModels);

it('keeps frozen and chilled actor ice below the family body with one grounded patch in both tiers',()=>{
  const camera=new T.PerspectiveCamera(),matrix=new T.Matrix4(),point=new T.Vector3();
  for(const family of ['crawler','stalker','brute','spitter','carrier','queen'])for(const tier of ['high','low'] as const){
    const model=alien(family),batches=new AfflictionBatches(undefined,1);
    const {height,span}=model.root.userData.affliction as {height:number;span:number};
    model.root.position.set(3,0,5);batches.setOptions({tier});
    try{
      for(const frozen of [false,true]){
        model.setAffliction!({chilled:true,chillStacks:3,frozen,burning:false});
        batches.update([model.root],camera,1);
        const ice=batches.root.children[2] as T.InstancedMesh,vertices=ice.geometry.getAttribute('position');
        expect(ice.count).toBe(frozen?(tier==='low'?6:10):(tier==='low'?3:6));
        let high=-Infinity;
        for(let instance=0;instance<ice.count;instance++){
          ice.getMatrixAt(instance,matrix);
          for(let i=0;i<vertices.count;i++)high=Math.max(high,point.fromBufferAttribute(vertices,i).applyMatrix4(matrix).y);
        }
        expect(high,`${family}/${tier}/${frozen}`).toBeLessThanOrEqual(Math.max(height*.221,.041));
        ice.getMatrixAt(0,matrix);const size=new T.Vector3().setFromMatrixScale(matrix),position=new T.Vector3().setFromMatrixPosition(matrix);
        expect(position.y-size.y).toBeGreaterThan(0);
        expect(size.y).toBeLessThan(.02);expect(size.x).toBeGreaterThan(span*.24);
      }
      model.setAffliction!({chilled:false,burning:false});batches.update([model.root],camera,1);
      expect(batches.counts.ice).toBe(0);
    }finally{batches.dispose();disposeModel(model.root);}
  }
});

it('changes actor frost exclusively through resident uniforms and preserves each family material palette',()=>{
  const palettes=new Set<string>();
  for(const family of ['crawler','stalker','brute','spitter','carrier']){
    const model=alien(family);let material:T.MeshStandardMaterial|undefined;
    model.root.traverse(object=>{if(!material&&object instanceof T.SkinnedMesh)material=object.material as T.MeshStandardMaterial;});
    try{
      const original=material!.color.clone(),key=material!.customProgramCacheKey();palettes.add(original.getHexString());
      const shader={vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader,uniforms:{} as Record<string,{value:number}>};
      material!.onBeforeCompile(shader as never,{} as never);
      expect(shader.fragmentShader).toContain('float frostAmount=.40*statusFrost');
      expect(shader.fragmentShader).toContain('float frostLower=step(4.5,vActorRegion)*step(vActorRegion,5.5)');
      expect(shader.fragmentShader).toContain('float frostEdge=pow(');
      expect(shader.fragmentShader.indexOf('float frostAmount=')).toBeGreaterThan(shader.fragmentShader.indexOf('diffuseColor.rgb=graphicActorBase*regionValue'));
      for(const frozen of [true,false,true]){
        model.setAffliction!({chilled:true,burning:false,frozen});
        expect(shader.uniforms.statusFrost.value).toBe(frozen?1:.29);
        expect(material!.color.equals(original)).toBe(true);expect(material!.customProgramCacheKey()).toBe(key);
      }
      model.reset!();expect(shader.uniforms.statusFrost.value).toBe(0);
    }finally{disposeModel(model.root);}
  }
  expect(palettes.size).toBe(5);
});
