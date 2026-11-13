import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {InstanceBatch} from './InstanceBatch';
import {bindPriorityMask} from './PriorityMask';

describe('accepted particle depth demand',()=>{
  it.each(['flame','smoke'] as const)('%s demands depth only after an authored volume survives admission',kind=>{
    const batch=new InstanceBatch(new T.Group(),kind,3);
    batch.begin();expect(batch.needsSoftDepth).toBe(false);
    batch.draw(0,.2,0,.2,.3,1,0x9fe8ff,.5);expect(batch.mesh.count).toBe(1);expect(batch.needsSoftDepth).toBe(false);
    batch.draw(1,.2,0,.2,.3,1,0x9fe8ff,0,0,0,64);expect(batch.mesh.count).toBe(1);expect(batch.needsSoftDepth).toBe(false);
    batch.draw(1,.2,0,.2,.3,1,0x9fe8ff,.5,0,0,64);expect(batch.mesh.count).toBe(2);expect(batch.needsSoftDepth).toBe(true);
    batch.end();expect(batch.needsSoftDepth).toBe(true);batch.begin();expect(batch.needsSoftDepth).toBe(false);batch.end();
    expect(batch.mesh.visible).toBe(false);batch.dispose();expect(batch.needsSoftDepth).toBe(false);
  });

  it.each(['flame','smoke'] as const)('%s ignores authored volumes rejected by capacity or projected coverage',kind=>{
    const full=new InstanceBatch(new T.Group(),kind,1);full.begin();full.draw(0,1,0,.1,.1,1,0x9fe8ff,.5);
    full.draw(0,1,0,.1,.1,1,0x9fe8ff,.5,0,0,128);expect(full.mesh.count).toBe(1);expect(full.needsSoftDepth).toBe(false);full.dispose();
    const culled=new InstanceBatch(new T.Group(),kind,8),camera=new T.OrthographicCamera(-1,1,1,-1,.1,100);
    camera.position.set(0,8,8);camera.lookAt(0,0,0);camera.updateMatrixWorld();culled.setView(camera);culled.maxCoverage=.001;culled.begin();
    culled.draw(0,1,0,4,4,1,0x9fe8ff,.5,0,0,64);expect(culled.mesh.count).toBe(0);expect(culled.needsSoftDepth).toBe(false);culled.dispose();
  });

  it('keeps mixed legacy/authored phase identity and applies depth only to the authored subset',()=>{
    const batch=new InstanceBatch(new T.Group(),'smoke',8),material=batch.mesh.material as T.ShaderMaterial;
    batch.begin();batch.draw(2,.2,1,.2,.3,1,0x9fe8ff,.5,0,0,0);batch.draw(3,.2,1,.2,.3,1,0x9fe8ff,.5,0,0,81);batch.end();
    const phase=batch.mesh.geometry.getAttribute('abilityPhase');expect(phase.getX(0)).toBeLessThan(64);expect(phase.getX(1)).toBe(81);
    expect(batch.mesh.count).toBe(2);expect(batch.needsSoftDepth).toBe(true);
    const mask=new T.DataTexture(new Uint8Array(4),2,2,T.RedFormat);bindPriorityMask(material,mask,'abilityPriority');
    const source=material.fragmentShader,guard=source.indexOf('if(softCamera.w>.5&&phase>=64.){'),sample=source.indexOf('texture2D(softDepth,screen)');
    expect(guard).toBeGreaterThan(source.indexOf('if(a<.004)discard;'));expect(sample).toBeGreaterThan(guard);
    expect(source).toContain('gl_FragColor.a*=1.-priority*priorityWeight*.97');
    batch.begin();batch.draw(2,.2,1,.2,.3,1,0x9fe8ff,.5);expect(batch.needsSoftDepth).toBe(false);batch.dispose();mask.dispose();
  });

  it('never requests soft depth for other primitive types',()=>{
    for(const kind of ['decal','front','ghost','shard','solid','spark'] as const){const batch=new InstanceBatch(new T.Group(),kind,1);batch.begin();batch.draw(0,0,0,.1,.1,1,0x9fe8ff,1,0,0,200);expect(batch.needsSoftDepth).toBe(false);batch.dispose();}
  });
});
