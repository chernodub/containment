import {beforeAll,expect,it,vi} from 'vitest';
import * as T from 'three';
import {loadModels} from '../../tests/loadModels';
import {alien,marine,nest,updateNest,disposeModel} from './models';
import {PlayerBeacon} from './vfx/PlayerBeacon';
import {EnemyHealthBars} from './EnemyHealthBars';

beforeAll(loadModels);

it('opens actual Queen armor and the split crown gradually with a stable prewarmed shader topology',()=>{
 const model=alien('queen');
 const identity=model.root.getObjectByName('queen-identity') as T.Mesh<T.BufferGeometry,T.ShaderMaterial>;
 let material:T.MeshStandardMaterial|undefined;
 model.root.traverse(o=>{if(o instanceof T.SkinnedMesh&&!material)material=o.material as T.MeshStandardMaterial;});
 const shader={uniforms:{} as Record<string,{value:unknown}>,vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};
 material!.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms,{} as T.WebGLRenderer);
 const key=material!.customProgramCacheKey(),geometry=identity.geometry,materials=identity.material;
 try{
  model.animate(0,0,0);model.setExposed!(true);model.animate(.02,0,0);
  const opening=identity.material.uniforms.identityOpening.value as number;
  expect(opening).toBeGreaterThan(0);expect(opening).toBeLessThan(1);
  for(let i=2;i<=30;i++)model.animate(i*.02,0,0);
  expect(identity.material.uniforms.identityOpening.value).toBeGreaterThan(.99);
  expect(shader.uniforms.actorPlateOpening.value as number).toBeGreaterThan(.99);
  expect(shader.vertexShader).toContain('transformed.z+=');
  expect(shader.fragmentShader).toContain('actorPlateOpening>.05');
  model.setExposed!(false);for(let i=31;i<=60;i++)model.animate(i*.02,0,0);
  expect(identity.material.uniforms.identityOpening.value).toBeLessThan(.01);
  expect(identity.geometry).toBe(geometry);expect(identity.material).toBe(materials);expect(material!.customProgramCacheKey()).toBe(key);
  model.reset!();expect(shader.uniforms.actorPlateOpening.value).toBe(0);
 }finally{disposeModel(model.root);}
});

it('retains friendly cyan-white identifiers independently of every rig and above particle overlays',()=>{
 const model=marine(),scene=new T.Scene(),beacon=new PlayerBeacon(model.root,scene);
 const identity=model.root.getObjectByName('marine-rig-accents') as T.Mesh<T.BufferGeometry,T.ShaderMaterial>;
 try{
  expect(new Set(identity.geometry.getAttribute('identityRole').array)).toEqual(new Set([0,1]));
  expect(identity.material.fragmentShader).toContain('vec3(.65,.93,1.0)');
  model.animate(0,0,0);beacon.update(model.root,0,false,1);
  const skin=beacon.root.children.find(o=>o instanceof T.SkinnedMesh&&o.visible) as T.SkinnedMesh;
  expect((skin.material as T.Material).depthTest).toBe(false);expect(skin.renderOrder).toBeGreaterThan(1001);
  expect((skin.material as T.ShaderMaterial).uniforms.strength.value).toBeGreaterThan(.8);
 }finally{beacon.dispose();disposeModel(model.root);}
});

it('uses different family body values and keeps identity geometry immune to status flashes',()=>{
 const values:number[]=[];
 for(const kind of ['crawler','spitter','carrier','brute','stalker']){
  const model=alien(kind),identity=model.root.getObjectByName(`${kind}-identity`) as T.Mesh;
  let value=0;model.root.traverse(o=>{if(o instanceof T.SkinnedMesh)value+=(o.material as T.MeshStandardMaterial).color.getHSL({h:0,s:0,l:0}).l;});values.push(value);
  const material=identity.material,geometry=identity.geometry;
  model.setAffliction!({chilled:true,burning:true,frozen:true});model.hit!();model.animate(0,0,0);
  expect(identity.material).toBe(material);expect(identity.geometry).toBe(geometry);disposeModel(model.root);
 }
 expect(new Set(values.map(v=>v.toFixed(2))).size).toBe(5);
});

it('shows only damaged or elite backed health bars at a constant pixel size',()=>{
 const bars=new EnemyHealthBars(),camera=new T.OrthographicCamera(-10,10,10,-10);
 try{
  bars.update([{x:0,z:0,height:1,health:100,maxHealth:100},{x:1,z:1,height:1,health:50,maxHealth:100},{x:2,z:2,height:1,health:100,maxHealth:100,elite:true}],camera,1000);
  for(const child of bars.root.children)expect((child as T.InstancedMesh).count).toBe(2);
 }finally{bars.dispose();}
});

it('switches a rooted brood sac into its retained ruptured husk without allocating resources',()=>{
 const model=nest(),children=[...model.children],bounds=new T.Box3().setFromObject(model,true);
 const live=model.getObjectByName('nest-living-sac')!,husk=model.getObjectByName('nest-ruptured-husk')!;
 const core=model.userData.nestCore as T.Material,dispose=vi.spyOn(core,'dispose');
 try{
  expect(bounds.min.x).toBeGreaterThan(-1.02);expect(bounds.max.x).toBeLessThan(1.02);
  updateNest(model,0);expect(live.visible).toBe(true);expect(husk.visible).toBe(false);
  updateNest(model,1,true);expect(live.visible).toBe(false);expect(husk.visible).toBe(true);expect(model.children).toEqual(children);
  expect(dispose).not.toHaveBeenCalled();disposeModel(model);expect(dispose).toHaveBeenCalledOnce();
 }finally{vi.restoreAllMocks();}
});
