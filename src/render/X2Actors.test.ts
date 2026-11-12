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
  const torso=shader.uniforms.actorPlateTorso.value as T.Vector2;
  const bounds=shader.uniforms.actorPlateBounds.value as T.Vector4;
  expect(torso.y).toBeGreaterThan(0);expect(torso.y).toBeLessThan(bounds.w*.4);
  expect(shader.fragmentShader).toContain('abs(actorPosition.x-actorPlateTorso.x)<actorPlateTorso.y');
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

it('gives brute shoulder armor a closed curved volume rather than flat white cards',()=>{
 const model=alien('brute'),identity=model.root.getObjectByName('brute-identity') as T.Mesh<T.BufferGeometry,T.ShaderMaterial>;
 const role=identity.geometry.getAttribute('identityRole'),normal=identity.geometry.getAttribute('normal'),position=identity.geometry.getAttribute('position');
 const directions=new Set<string>(),bounds=new T.Box3(),point=new T.Vector3();
 try{
  for(let i=0;i<role.count;i++)if(role.getX(i)===4){
   directions.add([normal.getX(i),normal.getY(i),normal.getZ(i)].map(n=>n.toFixed(2)).join(','));
   bounds.expandByPoint(point.fromBufferAttribute(position,i));
  }
  expect(directions.size).toBeGreaterThan(50);
  expect(bounds.getSize(point).y).toBeGreaterThan(.15);
  expect(identity.geometry.getAttribute('position').count/3).toBeLessThan(3000);
 }finally{disposeModel(model.root);}
});

it('retracts each Queen plate as a rigid side without stretching triangles across the open core',()=>{
 const model=alien('queen'),identity=model.root.getObjectByName('queen-identity') as T.Mesh<T.BufferGeometry,T.ShaderMaterial>;
 const role=identity.geometry.getAttribute('identityRole'),side=identity.geometry.getAttribute('identitySide');
 let plates=0;
 try{
  for(let i=0;i<role.count;i+=3)if(role.getX(i)===5){
   plates++;expect(Math.abs(side.getX(i))).toBe(1);expect(side.getX(i+1)).toBe(side.getX(i));expect(side.getX(i+2)).toBe(side.getX(i));
  }
  expect(plates).toBeGreaterThan(100);
  expect(identity.material.vertexShader).toContain('vec3 hinge=identityAnchor');
  const anchor=identity.geometry.getAttribute('identityAnchor');
  for(let i=0;i<role.count;i+=3)if(role.getX(i)===5)for(let axis=0;axis<3;axis++){expect(anchor.getComponent(i+1,axis)).toBe(anchor.getComponent(i,axis));expect(anchor.getComponent(i+2,axis)).toBe(anchor.getComponent(i,axis));}
 }finally{disposeModel(model.root);}
});


it('embeds the Queen vulnerable organ and hinge roots within the original dorsal height',()=>{
 const model=alien('queen'),identity=model.root.getObjectByName('queen-identity') as T.Mesh<T.BufferGeometry,T.ShaderMaterial>;
 const role=identity.geometry.getAttribute('identityRole'),position=identity.geometry.getAttribute('position');
 const core=new T.Box3(),plates=new T.Box3(),point=new T.Vector3();
 try{
  for(let i=0;i<role.count;i++){
   if(role.getX(i)===3)core.expandByPoint(point.fromBufferAttribute(position,i));
   if(role.getX(i)===5)plates.expandByPoint(point.fromBufferAttribute(position,i));
  }
  expect(core.max.y).toBeLessThan(model.height*.92);expect(core.min.y).toBeLessThan(model.height*.75);
  expect(core.getSize(point).x).toBeLessThan(6.5*.20);
  expect(plates.max.y).toBeLessThan(model.height*.91);
  expect(plates.min.y).toBeLessThan(model.height*.80);
 }finally{disposeModel(model.root);}
});


it('isolates title anatomy shading and restores ordinary actor identification on pool reset',()=>{
 const staged=alien('brute'),live=alien('brute');
 const a=staged.root.getObjectByName('brute-identity') as T.Mesh<T.BufferGeometry,T.ShaderMaterial>;
 const b=live.root.getObjectByName('brute-identity') as T.Mesh<T.BufferGeometry,T.ShaderMaterial>;
 let surface:T.MeshStandardMaterial|undefined;
 staged.root.traverse(o=>{if(o instanceof T.SkinnedMesh&&!surface)surface=o.material as T.MeshStandardMaterial;});
 const shader={uniforms:{} as Record<string,{value:unknown}>,vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};
 surface!.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms,{} as T.WebGLRenderer);
 try{
  staged.setStageLight!(.24);staged.animate(0,0,0);live.animate(0,0,0);
  expect(a.material.uniforms.identityStageLight.value).toBe(.24);expect(b.material.uniforms.identityStageLight.value).toBe(1);expect(shader.uniforms.actorStageLight.value).toBe(.24);
  expect(a.geometry).toBe(b.geometry);expect(a.material.fragmentShader).toBe(b.material.fragmentShader);
  staged.reset!();expect(a.material.uniforms.identityStageLight.value).toBe(1);expect(shader.uniforms.actorStageLight.value).toBe(1);
 }finally{disposeModel(staged.root);disposeModel(live.root);}
});


it('pitches cinematic arms and the bound weapon toward a lower target without altering ordinary aim',()=>{
 const staged=marine(),live=marine();
 const angle=(model:ReturnType<typeof marine>)=>{model.root.updateMatrixWorld(true);const origin=model.weapon!.getWorldPosition(new T.Vector3()),muzzle=model.muzzleWorld!(new T.Vector3()).sub(origin);return Math.atan2(muzzle.y,Math.hypot(muzzle.x,muzzle.z));};
 try{
  staged.animate(0,0,-.62);live.animate(0,0,-.62);const ordinary=angle(live);
  staged.setAimPitch!(-.26);staged.animate(.02,0,-.62);live.animate(.02,0,-.62);
  expect(angle(staged)).toBeLessThan(ordinary-.16);expect(angle(live)).toBeCloseTo(ordinary,2);
  for(let i=2;i<20;i++){staged.animate(i*.02,0,-.62);live.animate(i*.02,0,-.62);}expect(angle(staged)).toBeLessThan(ordinary-.16);
  staged.setAimPitch!(0);staged.animate(.4,0,-.62);live.animate(.4,0,-.62);expect(angle(staged)).toBeCloseTo(angle(live),2);
 }finally{disposeModel(staged.root);disposeModel(live.root);}
});
