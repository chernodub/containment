import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {InstanceBatch} from './InstanceBatch';
import {bindPriorityMask} from './PriorityMask';
import {ElementKit} from './ElementKit';
import {GRAPHICS_PRESETS} from '../graphicsOptions';

/** The discard is a work-order change, never a lower coverage/opacity budget. */
describe('transparent soft-particle shader rejection',()=>{
  it.each(['flame','smoke'] as const)('%s rejects invisible atlas texels before depth while preserving local priority and HUD attenuation',kind=>{
    const batch=new InstanceBatch(new T.Group(),kind,8),material=batch.mesh.material as T.ShaderMaterial;
    const priority=new T.DataTexture(new Uint8Array(4),2,2,T.RedFormat),depth=new T.DepthTexture(4,4);
    bindPriorityMask(material,priority,'abilityPriority');
    const source=material.fragmentShader;
    const coverage=source.indexOf(kind==='flame'?'a*=coverage;':'a*=s.a*mix(.9,.72,vapor)');
    const early=source.indexOf('if(a<.004)discard;'),depthSample=source.indexOf('texture2D(softDepth,screen)');
    const softFade=source.indexOf('a*=smoothstep(0.,.28,sceneDistance-viewDepth);');
    const hudFade=source.indexOf('a*=1.-actionBar*.94;'),final=source.lastIndexOf('if(a<.004)discard;');
    const prioritySample=source.indexOf('texture2D(abilityPriorityMap,priorityUv)');
    expect(coverage).toBeGreaterThan(0);expect(early).toBeGreaterThan(coverage);expect(depthSample).toBeGreaterThan(early);
    expect(softFade).toBeGreaterThan(depthSample);expect(hudFade).toBeGreaterThan(softFade);expect(final).toBeGreaterThan(hudFade);
    expect(prioritySample).toBeGreaterThan(final);expect(source).toContain('gl_FragColor.a*=1.-priority*priorityWeight*.97');
    expect(source).toContain('if(gl_FragColor.a<.004)discard;');
    expect(material.depthWrite).toBe(false);expect(material.forceSinglePass).toBe(true);
    batch.setSoftDepth(depth,.1,160,true);batch.setSoftDepth(null);expect(material.fragmentShader).toBe(source);
    batch.dispose();depth.dispose();priority.dispose();
  });

  it('retains the existing final coverage decision at and around the cutoff for every later attenuation',()=>{
    const threshold=Math.fround(.004);
    const alphas=[0,.0001,.003,threshold-1e-9,threshold,threshold+1e-9,.01,.2,1];
    for(const value of alphas)for(const soft of [0,.03,.4,.99,1])for(const hud of [.06,.2,.8,1])for(const priority of [.03,.5,.97,1]){
      const alpha=Math.fround(value),faded=Math.fround(Math.fround(alpha*Math.fround(soft))*Math.fround(hud));
      const oldDiscard=faded<threshold||Math.fround(faded*Math.fround(priority))<threshold;
      const optimizedDiscard=alpha<threshold||oldDiscard;
      expect(optimizedDiscard,JSON.stringify({alpha,soft,hud,priority})).toBe(oldDiscard);
    }
  });

  it('keeps the authored High/Low particle coverage caps',()=>{
    const kit=new ElementKit(new T.Group());kit.setOptions(GRAPHICS_PRESETS.high,'high',false);
    expect([kit.batches.flame.maxCoverage,kit.batches.smoke.maxCoverage,kit.batches.decal.maxCoverage]).toEqual([.30,.18,.28]);
    kit.setOptions(GRAPHICS_PRESETS.low,'low',false);
    expect([kit.batches.flame.maxCoverage,kit.batches.smoke.maxCoverage,kit.batches.decal.maxCoverage]).toEqual([.16,.10,.14]);kit.dispose();
  });
});
