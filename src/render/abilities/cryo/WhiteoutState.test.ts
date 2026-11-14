import { describe, expect, it, vi } from 'vitest';
import * as T from 'three';
import type { AbilityZoneSnapshot } from '../../../game/abilities/contract';
import { bindPriorityMask } from '../PriorityMask';
import { WhiteoutState } from './WhiteoutState';

const zone=(remainingMs=7000):AbilityZoneSnapshot=>({id:1,ability:'whiteout',element:'cryo',shape:'circle',x:320,y:480,x2:320,y2:480,radius:300,width:0,attached:true,durationMs:8000,remainingMs});
describe('connected Whiteout state',()=>{
  it('keeps a complete closed wind wall inside the native disc and an open calm eye',()=>{
    const root=new T.Group(),state=new WhiteoutState(root);
    expect(root.children).toHaveLength(2);
    const vertices=state.wall.geometry.getAttribute('position');
    for(let i=0;i<vertices.count;i++)expect(Math.hypot(vertices.getX(i),vertices.getZ(i))).toBeLessThan(1);
    const shader=state.ground.material.fragmentShader;
    expect(shader).toContain('r>1.||r<.245');expect(shader).toContain('stormAge/1.9');
    state.update(zone(),false,false,1);
    const data=state.wall.material.uniforms.storm.value;
    expect(data.toArray()).toEqual([10,15,300/32,1]);
    expect(state.ground.material.uniforms.storm.value).toBe(data);state.dispose();
  });
  it('reuses every resource and uniform across movement, Low, pause and expiry',()=>{
    const root=new T.Group(),state=new WhiteoutState(root),wall=state.wall.geometry,material=state.wall.material,data=material.uniforms.storm.value;
    const dispose=vi.spyOn(wall,'dispose');
    state.update(zone(),false,false,1);const clock=material.uniforms.stormTime.value;
    state.update(zone(),false,false,1);expect(material.uniforms.stormTime.value).toBe(clock);
    state.update({...zone(6000),x:640},true,true,.5);
    expect(state.wall.geometry).toBe(wall);expect(state.wall.material).toBe(material);expect(material.uniforms.storm.value).toBe(data);
    expect(data.x).toBe(20);expect(material.uniforms.stormTime.value).toBe(0);expect(material.uniforms.detail.value).toBe(.35);
    state.update(undefined,true,true,1);expect(state.wall.visible).toBe(false);expect(state.ground.visible).toBe(false);
    state.dispose();state.dispose();expect(dispose).toHaveBeenCalledOnce();expect(root.children).toHaveLength(0);
  });
  it('exposes both sustained layers to the common danger/actor priority hook before warmup',()=>{
    const state=new WhiteoutState(new T.Group()),texture=new T.Texture();
    for(const mesh of [state.wall,state.ground]){
      bindPriorityMask(mesh.material,texture);
      expect(mesh.material.fragmentShader).toContain('gl_FragColor.a*=1.-priority*1.*.97');
      expect(mesh.material.premultipliedAlpha).toBe(true);expect(mesh.material.depthWrite).toBe(false);expect(mesh.material.forceSinglePass).toBe(true);
      expect(mesh.material.vertexShader).toContain('priorityClip=gl_Position');
    }
    state.dispose();texture.dispose();
  });
});
