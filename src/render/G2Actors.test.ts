import {beforeAll,expect,it,vi} from 'vitest';
import * as T from 'three';
import {loadModels} from '../../tests/loadModels';
import {alien,marine,disposeModel,freezeCorpse,MAT} from './models';
import {FAMILY_IDENTITY,RIG_ACCENTS} from './ActorIdentity';
import {MarineLamp} from './lighting/MarineLamp';
import {EnemyHealthBars} from './EnemyHealthBars';

beforeAll(loadModels);

it('gives all six families one bounded anatomical identity draw without additional lights',()=>{
  for(const kind of Object.keys(FAMILY_IDENTITY)){
    const model=alien(kind),identity=model.root.getObjectByName(`${kind}-identity`) as T.Mesh<T.BufferGeometry,T.ShaderMaterial>;
    expect(identity).toBeInstanceOf(T.Mesh);
    expect(identity.material.uniforms.identityColor.value.getHex()).toBe(FAMILY_IDENTITY[kind as keyof typeof FAMILY_IDENTITY]);
    expect(identity.geometry.getAttribute('position').count/3).toBeLessThan(3000);
    expect(identity.material.userData.actorMaterial).toBe(true);
    expect(identity.geometry.attributes.position.array.every(Number.isFinite)).toBe(true);
    let lights=0;model.root.traverse(o=>{if(o instanceof T.Light)lights++;});expect(lights).toBe(0);
    disposeModel(model.root);
  }
});

it('drives spit anticipation, champion crown and camouflage from snapshot values without adding geometry',()=>{
  const model=alien('spitter'),identity=model.root.getObjectByName('spitter-identity') as T.Mesh<T.BufferGeometry,T.ShaderMaterial>;
  const geometry=identity.geometry,children=model.root.children.length;
  model.setThreat!(500,'spit','matron');model.animate(1,1,0);
  const startPulse=identity.material.uniforms.identityPulse.value;
  model.setThreat!(100,'spit','matron');model.animate(1.02,1,0);
  expect(identity.material.uniforms.identityPulse.value).toBeGreaterThan(startPulse+.7);
  expect(identity.material.uniforms.identityChampion.value).toBe(2);
  expect(identity.material.uniforms.identityElite.value).toBe(1);
  model.setThreat!(0,null,undefined);model.animate(1.05,1,0);
  expect(identity.material.uniforms.identityPulse.value).toBeLessThan(1.1);
  expect(identity.material.uniforms.identityElite.value).toBe(0);
  expect(identity.geometry).toBe(geometry);expect(model.root.children.length).toBe(children);
  model.reset!();expect(identity.material.uniforms.identityAlpha.value).toBe(1);
  freezeCorpse(model);expect(identity.material.uniforms.identityDeath.value).toBe(1);
  disposeModel(model.root);
});

it('shows Queen exposure on her crown and clears it when the pooled rig resets',()=>{
  const model=alien('queen'),identity=model.root.getObjectByName('queen-identity') as T.Mesh<T.BufferGeometry,T.ShaderMaterial>;
  model.setExposed!(true);model.animate(2,0,.5);expect(identity.material.uniforms.identityExposed.value).toBe(1);
  model.reset!();expect(identity.material.uniforms.identityExposed.value).toBe(0);
  disposeModel(model.root);
});

it('changes rig colors through uniforms while keeping torso attachment and shader topology',()=>{
  const model=marine(),identity=model.root.getObjectByName('marine-rig-accents') as T.Mesh<T.BufferGeometry,T.ShaderMaterial>;
  const key=identity.material.customProgramCacheKey(),parent=identity.parent;
  for(const [rig,color] of Object.entries(RIG_ACCENTS)){
    model.setRig!(rig);model.animate(2,1,.4);expect(identity.material.uniforms.rigColor.value.getHex()).toBe(color);
    expect(identity.parent).toBe(parent);expect(identity.material.customProgramCacheKey()).toBe(key);
  }
  disposeModel(model.root);
});

it('raises the broad suit fill to avoid a clipped foot hotspot while retaining a soft forward lamp',()=>{
  const lamp=new MarineLamp();lamp.setRoom(24);lamp.update(3,4,0);
  expect(lamp.suitFill.position.y).toBeGreaterThan(2.5);
  expect(lamp.suitFill.intensity/lamp.suitFill.position.y**2).toBeLessThan(6);
  expect(lamp.light.penumbra).toBeGreaterThan(.9);expect(lamp.light.target.position.x).toBeGreaterThan(7);
  lamp.setQuality(false);expect(lamp.cone.visible).toBe(false);lamp.setQuality(true);expect(lamp.cone.visible).toBe(true);
  const dispose=vi.spyOn(lamp.cone.geometry,'dispose');lamp.dispose();expect(dispose).toHaveBeenCalledOnce();
});

it('keeps a five-pixel health fill and nine-pixel backing at hero scale',()=>{
  const bars=new EnemyHealthBars(),camera=new T.OrthographicCamera(-10,10,10,-10);bars.update([{x:0,z:0,height:1,health:50,maxHealth:100}],camera,1000);
  const [background,fill]=bars.root.children as T.InstancedMesh[],matrix=new T.Matrix4();
  background.getMatrixAt(0,matrix);expect(matrix.elements[5]).toBeCloseTo(9*20/1000);
  fill.getMatrixAt(0,matrix);expect(matrix.elements[5]).toBeCloseTo(5*20/1000);bars.dispose();
});

it('fits identity details to the rest skin once per family and never scans skin during animation or pool construction',()=>{
  const vertices=vi.spyOn(T.SkinnedMesh.prototype,'getVertexPosition');
  let first:ReturnType<typeof alien>|undefined,second:ReturnType<typeof alien>|undefined;
  try{
    first=alien('stalker',true);expect(vertices.mock.calls.length).toBeGreaterThan(0);
    const identity=first.root.getObjectByName('stalker-identity') as T.Mesh;
    vertices.mockClear();
    for(let i=0;i<20;i++)first.animate(i/60,1,.4);
    second=alien('stalker',true);
    expect((second.root.getObjectByName('stalker-identity') as T.Mesh).geometry).toBe(identity.geometry);
    expect(vertices).not.toHaveBeenCalled();
  }finally{vertices.mockRestore();if(first)disposeModel(first.root);if(second)disposeModel(second.root);}
});

it('emerges vertically over220ms at the real spawn position and settles before ragdoll handoff',()=>{
  const model=alien('crawler'),restY=model.body.position.y;
  model.root.position.set(4,0,8);model.animate(0,0,.4);
  expect(model.body.position.y).toBeLessThan(restY-.03);
  for(let i=1;i<=15;i++)model.animate(i/60,0,.4);
  expect(model.body.position.y).toBeCloseTo(restY);expect(model.root.position.toArray()).toEqual([4,0,8]);
  model.reset!();model.animate(1,0,0);expect(model.body.position.y).toBeLessThan(restY-.03);
  freezeCorpse(model);expect(model.body.position.y).toBe(restY);expect(model.body.rotation.x).toBe(0);
  model.reset!();model.setAffliction!({chilled:true,burning:false,frozen:true});model.animate(2,0,0);
  expect(model.body.position.y).toBe(restY);disposeModel(model.root);
});

it('retains the last frost, burn or acid finish through freeze and resets it for live reuse',()=>{
  for(const [status,expected] of [[{chilled:true,burning:false,frozen:true},1],[{chilled:false,burning:true},2],[{chilled:false,burning:false,poisoned:true},3]] as const){
    const model=alien('brute');model.setAffliction!(status);freezeCorpse(model);
    let material:T.MeshStandardMaterial|undefined;model.root.traverse(o=>{if(o instanceof T.SkinnedMesh&&!material)material=(Array.isArray(o.material)?o.material[0]:o.material) as T.MeshStandardMaterial;});
    const shader={uniforms:{} as Record<string,{value:unknown}>,vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};
    material!.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms,{} as T.WebGLRenderer);
    expect(shader.uniforms.actorDeathStyle.value).toBe(expected);
    expect(shader.fragmentShader).toContain('deathFracture');
    model.reset!();expect(shader.uniforms.actorDeathStyle.value).toBe(0);disposeModel(model.root);
  }
});
