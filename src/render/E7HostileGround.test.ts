import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {AcidPoolMaterial} from './acidPool';

describe('hostile acid boundary',()=>{
 it('shares one prepared shader family while retaining time-driven liquid and opaque danger teeth',()=>{
  const a=new AcidPoolMaterial(1),b=new AcidPoolMaterial(99);
  const shader={uniforms:{},vertexShader:T.ShaderLib.basic.vertexShader,fragmentShader:T.ShaderLib.basic.fragmentShader};
  a.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms,{} as T.WebGLRenderer);
  expect(a.customProgramCacheKey()).toBe(b.customProgramCacheKey());
  expect(shader.fragmentShader).toContain('float acidWarning=');
  expect(shader.fragmentShader).toContain('vec3(1.35,.12,.025)');
  expect(shader.fragmentShader).toContain('vec3(.009,.012,.008)');
  expect(shader.fragmentShader).toContain('acidRipple(acidP,float(i))');
  expect(shader.fragmentShader).toContain('acidRim*min(1.0,diffuseColor.a*3.2)');
  expect(a.depthWrite).toBe(false);expect(a.color.getHex()).toBe(0x99cf56);
  a.dispose();b.dispose();
 });
});
