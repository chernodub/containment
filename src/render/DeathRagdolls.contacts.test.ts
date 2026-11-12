import {beforeAll,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {registerAsset,type AssetName} from './assets';
import {alien,freezeCorpse} from './models';
import {DeathRagdolls,initDeathPhysics,RAGDOLL_MAX_SPEED,RAGDOLL_MAX_SPIN} from './DeathRagdolls';
beforeAll(async()=>{
 await initDeathPhysics();
 for(const name of ['dretch','basilisk','marauder','dragoon','tyrant'] as AssetName[]){
  const bytes=readFileSync(`public/assets/models/${name}.glb`),loader=new GLTFLoader();
  loader.register(()=>({name:'cpu-texture-stub',loadTexture:async()=>new T.Texture()}));
  registerAsset(name,await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''));
 }
});
it('two real brute rigs retain separate fitted skin and pooled poses',()=>{
 const p=new DeathRagdolls(),world=new T.Group(),floor=new T.Mesh(new T.BoxGeometry(20,.32,20));
 floor.position.set(10,-.18,10);world.add(floor);p.setRoom({width:640,height:640,obstacles:[]},world);
 const a=alien('brute'),b=alien('brute',true);
 a.root.position.set(5,0,5);b.root.position.set(10,0,10);
 a.animate(1,1,.4);b.animate(1,1,1.2);freezeCorpse(a);freezeCorpse(b);
 const bones=(m:typeof a)=>{const result:T.Bone[]=[];m.root.traverse(o=>{if(o instanceof T.Bone)result.push(o);});return result;};
 const ab=bones(a),bb=bones(b),initial=ab.map(o=>o.matrix.toArray());
 expect(ab.every(o=>!bb.includes(o))).toBe(true);
 try{
  expect(p.add(1,a,'brute',{x:8,z:2})).toBe(true);expect(p.add(2,b,'brute',{x:-4,z:3})).toBe(true);
  for(let i=0;i<180;i++){p.update(1/60);expect(p.maxJointError(1)).toBeLessThan(.2);expect(p.maxJointError(2)).toBeLessThan(.2);}
  for(const model of [a,b]){model.root.updateMatrixWorld(true);expect(new T.Box3().setFromObject(model.root,true).min.y).toBeGreaterThanOrEqual(-.025);}
  const other=bb.map(o=>o.matrix.toArray());p.remove(1);
  expect(ab.map(o=>o.matrix.toArray())).toEqual(initial);expect(bb.map(o=>o.matrix.toArray())).toEqual(other);expect(p.has(2)).toBe(true);
 }finally{p.dispose();floor.geometry.dispose();}
});
for(const family of ['crawler','stalker','spitter','carrier','brute'])for(const elite of [false,true])it(`${family} elite=${elite}: actual blended skin stays above the deck during active contact`,()=>{
 const p=new DeathRagdolls(),world=new T.Group(),floor=new T.Mesh(new T.BoxGeometry(20,.32,20));
 floor.position.set(10,-.18,10);world.add(floor);p.setRoom({width:640,height:640,obstacles:[]},world);
 const m=alien(family,elite);m.root.position.set(5,0,5);m.animate(1,1,.4);freezeCorpse(m);
 expect(p.add(1,m,family,{x:8,z:2})).toBe(true);
 const root=m.root.position.clone();
 try{
  for(let frame=0;frame<180;frame++){
   p.update(1/60);expect(p.maxJointError(1)).toBeLessThan(.2);
   if(frame%5!==4)continue;
   m.root.updateMatrixWorld(true);let minY=Infinity;
   m.root.traverse(o=>{if(o instanceof T.SkinnedMesh)for(let k=0;k<o.geometry.getAttribute('position').count;k++)minY=Math.min(minY,o.getVertexPosition(k,new T.Vector3()).applyMatrix4(o.matrixWorld).y);});
   expect(minY,`frame ${frame+1}`).toBeGreaterThanOrEqual(-.025);
   if(p.snapshot().active>0)expect(m.root.position.distanceTo(root)).toBeLessThan(1e-8);
  }
  expect(m.root.position.x).toBe(root.x);expect(m.root.position.z).toBe(root.z);
 }finally{p.dispose();floor.geometry.dispose();}
});

it('preserves every captured skin vertex under nonuniform fitted/root transforms before physics advances',()=>{
 const p=new DeathRagdolls();p.setRoom({width:640,height:640,obstacles:[]});
 const m=alien('carrier');m.root.position.set(5,1,5);m.root.rotation.y=.73;m.root.scale.set(1.3,.85,.7);
 m.animate(1,1,.4);freezeCorpse(m);m.root.updateMatrixWorld(true);
 const point=new T.Vector3(),skins:Array<{mesh:T.SkinnedMesh;vertices:Float64Array}>=[];
 m.root.traverse(o=>{
  if(!(o instanceof T.SkinnedMesh))return;
  const vertices=new Float64Array(o.geometry.getAttribute('position').count*3);
  for(let i=0;i<vertices.length/3;i++){o.getVertexPosition(i,point).applyMatrix4(o.matrixWorld);point.toArray(vertices,i*3);}
  skins.push({mesh:o,vertices});
 });
 try{
  expect(p.add(1,m,'carrier',{x:0,z:0})).toBe(true);p.update(1e-9);m.root.updateMatrixWorld(true);
  expect(p.snapshot().steps).toBe(0);
  let error=0;
  for(const {mesh,vertices}of skins)for(let i=0;i<vertices.length/3;i++){
   mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld);
   error=Math.max(error,Math.hypot(point.x-vertices[i*3],point.y-vertices[i*3+1],point.z-vertices[i*3+2]));
  }
  expect(error).toBeLessThan(1e-5);
 }finally{p.dispose();}
});

it('bounds solver-generated fitted-limb energy without changing contacts or joint anchors',()=>{
 const p=new DeathRagdolls(),world=new T.Group(),floor=new T.Mesh(new T.BoxGeometry(20,.32,20));
 floor.position.set(10,-.18,10);world.add(floor);p.setRoom({width:640,height:640,obstacles:[]},world);
 const m=alien('carrier');m.root.position.set(5,0,5);m.animate(1,1,.4);freezeCorpse(m);
 expect(p.add(1,m,'carrier',{x:8,z:2})).toBe(true);
 const root=m.root.position.clone();
 try{
  for(let frame=0;frame<180;frame++){
   p.update(1/60);expect(p.maxJointError(1)).toBeLessThan(.2);
   const record=(p as unknown as {records:Map<number,{parts:Array<{body:{linvel():{x:number;y:number;z:number};angvel():{x:number;y:number;z:number}}}>}>}).records.get(1)!;
   for(const {body}of record.parts){
    const linear=body.linvel(),angular=body.angvel();
    expect(Math.hypot(linear.x,linear.y,linear.z)).toBeLessThanOrEqual(RAGDOLL_MAX_SPEED+1e-5);
    expect(Math.hypot(angular.x,angular.y,angular.z)).toBeLessThanOrEqual(RAGDOLL_MAX_SPIN+1e-5);
   }
   if(p.snapshot().active>0)expect(m.root.position.distanceTo(root)).toBeLessThan(1e-8);
  }
 }finally{p.dispose();floor.geometry.dispose();}
});
