import {beforeAll,expect,it,vi} from 'vitest';
import * as T from 'three';
import {loadModels} from '../../../tests/loadModels';
import {marine,disposeModel} from '../models';
import {PlayerBeacon} from './PlayerBeacon';
import {ElementKit} from '../abilities/ElementKit';
import {createSystemPresentation} from '../abilities/system';
import {NO_AFFLICTION} from '../afflictions';
import type {DepthGame} from '../../DepthGame';
import type {AbilitiesSnapshot,AbilitySlotSnapshot} from '../../game/abilities/contract';

beforeAll(loadModels);

function skins(root:T.Object3D){const result:T.SkinnedMesh[]=[];root.traverse(o=>{if(o instanceof T.SkinnedMesh)result.push(o);});return result;}
function visibleSkins(beacon:PlayerBeacon){return skins(beacon.root).filter(s=>s.visible);}

// Match skinnormal_vertex: normals use the weighted skin matrix's linear part,
// followed by the object's inverse-transpose world normal matrix.
function normalSampler(){
  const boneMatrix=new T.Matrix4(),linear=new T.Matrix3(),base=new T.Vector3(),point=new T.Vector3();
  return(mesh:T.SkinnedMesh,index:number,target:T.Vector3)=>{
    const geometry=mesh.geometry,weights=geometry.getAttribute('skinWeight'),indices=geometry.getAttribute('skinIndex');
    base.fromBufferAttribute(geometry.getAttribute('normal'),index).applyMatrix3(linear.setFromMatrix4(mesh.bindMatrix));target.set(0,0,0);
    for(let slot=0;slot<4;slot++){
      const weight=weights.getComponent(index,slot);if(!weight)continue;const bone=indices.getComponent(index,slot);
      boneMatrix.multiplyMatrices(mesh.skeleton.bones[bone].matrixWorld,mesh.skeleton.boneInverses[bone]);
      target.addScaledVector(point.copy(base).applyMatrix3(linear.setFromMatrix4(boneMatrix)),weight);
    }
    return target.applyMatrix3(linear.setFromMatrix4(mesh.bindMatrixInverse)).applyMatrix3(linear.getNormalMatrix(mesh.matrixWorld)).normalize();
  };
}

it('merges the real marine into one exact skin through gait, aiming, brace, dash and restored poses',()=>{
  const model=marine(),scene=new T.Scene(),beacon=new PlayerBeacon(model.root,scene),sources=skins(model.root);
  const kit=new ElementKit(new T.Group()),presentation=createSystemPresentation(kit);
  const baseline:AbilitiesSnapshot={rig:'breacher',slots:null,overdrive:{active:false,ready:false,charge:0,activeRemainingMs:0},invulnerable:false,dashing:false,hostileTimeScale:1,zones:[],deployables:[]};
  const cast:AbilitySlotSnapshot={id:'seismic-slam',slot:'tactical',ready:false,charges:0,maxCharges:1,cooldownMs:6000,cooldownRemainingMs:6000,castRemainingMs:100,activeRemainingMs:0,activeMs:0};
  const bracing={...baseline,slots:{tactical:cast,power:{...cast,castRemainingMs:0},overdrive:{...cast,castRemainingMs:0},dash:{...cast,castRemainingMs:0}}};
  const game={player:{x:128,y:128,angle:.4},combat:{snapshot:{dead:false}},enemies:{snapshot:{enemies:[]}},boonStatuses:()=>NO_AFFLICTION} as unknown as DepthGame;
  try{
    model.root.position.set(4,.2,7);model.animate(0,1,.4);beacon.update(model.root,.4);beacon.root.updateMatrixWorld(true);
    expect(sources).toHaveLength(4);expect(visibleSkins(beacon)).toHaveLength(1);
    const merged=visibleSkins(beacon)[0];expect(merged.skeleton).toBe(sources[0].skeleton);
    let vertexOffset=0,indexOffset=0,attributeError=0;
    for(const source of sources){
      for(const name of Object.keys(source.geometry.attributes)){
        const a=source.geometry.getAttribute(name),b=merged.geometry.getAttribute(name);
        for(let i=0;i<a.count;i++)for(let c=0;c<a.itemSize;c++)attributeError=Math.max(attributeError,Math.abs(a.getComponent(i,c)-b.getComponent(vertexOffset+i,c)));
      }
      for(let i=0;i<source.geometry.index!.count;i++)expect(merged.geometry.index!.getX(indexOffset+i)).toBe(source.geometry.index!.getX(i)+vertexOffset);
      vertexOffset+=source.geometry.getAttribute('position').count;indexOffset+=source.geometry.index!.count;
    }
    expect(attributeError).toBe(0);expect(merged.geometry.getAttribute('position').count).toBe(vertexOffset);expect(merged.geometry.index!.count).toBe(indexOffset);
    const a=new T.Vector3(),b=new T.Vector3(),sampleNormal=normalSampler();
    let positionError=0,normalError=0;
    for(const [frame,snapshot] of [baseline,bracing,{...baseline,dashing:true},baseline].entries()){
      const aim=.4+frame*.7;model.equip!(frame%2?'rocket':'shotgun');
      for(let step=0;step<6;step++)model.animate((frame*6+step+1)/30,1,aim,.3,.2,{x:80-frame*70,y:170});
      kit.begin(0);presentation.update({snapshot,dt:0,visible:true,game,marine:model.root,marineBody:model.body});kit.end();model.syncWeaponPose!();
      model.root.updateMatrixWorld(true);beacon.update(model.root,aim,false,.8);beacon.root.updateMatrixWorld(true);
      expect(visibleSkins(beacon)).toEqual([merged]);let offset=0;
      for(const source of sources){
        const normals=source.geometry.getAttribute('normal');
        for(let i=0;i<normals.count;i++){
          source.getVertexPosition(i,a).applyMatrix4(source.matrixWorld);merged.getVertexPosition(offset+i,b).applyMatrix4(merged.matrixWorld);positionError=Math.max(positionError,a.distanceTo(b));
          sampleNormal(source,i,a);sampleNormal(merged,offset+i,b);normalError=Math.max(normalError,a.distanceTo(b));
        }
        offset+=normals.count;
      }
    }
    expect(positionError).toBeLessThan(1e-10);expect(normalError).toBeLessThan(1e-10);
  }finally{beacon.dispose();presentation.dispose();kit.dispose();disposeModel(model.root);}
});

it('fails back to authoritative individual skins for visibility, transform, bind and geometry changes',()=>{
  const model=marine(),beacon=new PlayerBeacon(model.root),sources=skins(model.root),first=sources[0];
  try{
    beacon.update(model.root,0);const merged=visibleSkins(beacon)[0];
    first.visible=false;beacon.update(model.root,0);expect(merged.visible).toBe(false);expect(visibleSkins(beacon)).toHaveLength(sources.length-1);
    first.visible=true;beacon.update(model.root,0);expect(visibleSkins(beacon)).toEqual([merged]);
    first.position.x=.07;beacon.update(model.root,0);expect(merged.visible).toBe(false);expect(visibleSkins(beacon)).toHaveLength(sources.length);
    const fallback=visibleSkins(beacon).find(s=>s.geometry===first.geometry)!;expect(fallback.matrix.equals(first.matrixWorld)).toBe(true);
    first.position.x=0;beacon.update(model.root,0);expect(visibleSkins(beacon)).toEqual([merged]);
    const bind=first.bindMatrix.clone();first.bindMatrix.elements[12]+=.1;beacon.update(model.root,0);expect(merged.visible).toBe(false);expect(fallback.bindMatrix.equals(first.bindMatrix)).toBe(true);first.bindMatrix.copy(bind);
    const geometry=first.geometry,replacement=geometry.clone();first.geometry=replacement;beacon.update(model.root,0);expect(merged.visible).toBe(false);expect(fallback.geometry).toBe(replacement);first.geometry=geometry;replacement.dispose();
    geometry.getAttribute('position').needsUpdate=true;beacon.update(model.root,0);expect(merged.visible).toBe(false);
    beacon.update(model.root,0,true);expect(beacon.root.visible).toBe(false);
  }finally{beacon.dispose();disposeModel(model.root);}
});

it('retains incompatible skin groups and disposes only its own merged buffers exactly once',()=>{
  const model=marine(),sources=skins(model.root),different=sources[0];different.skeleton=new T.Skeleton([...different.skeleton.bones],different.skeleton.boneInverses.map(m=>m.clone()));
  const other=sources[1];other.position.x=.1;const scene=new T.Scene(),beacon=new PlayerBeacon(model.root,scene);
  const sourceGeometry=new Map(sources.map(s=>[s.geometry,vi.spyOn(s.geometry,'dispose')])),skeletons=new Map(sources.map(s=>[s.skeleton,vi.spyOn(s.skeleton,'dispose')]));
  const own=skins(beacon.root).filter(s=>!sourceGeometry.has(s.geometry)).map(s=>vi.spyOn(s.geometry,'dispose'));
  try{
    beacon.update(model.root,0);expect(visibleSkins(beacon)).toHaveLength(3);expect(own).toHaveLength(1);
    const objects=[...beacon.root.children],geometry=skins(beacon.root).map(s=>s.geometry);
    for(let i=0;i<10;i++)beacon.update(model.root,i*.1,false,1);
    expect(beacon.root.children).toEqual(objects);expect(skins(beacon.root).map(s=>s.geometry)).toEqual(geometry);
    beacon.dispose();beacon.dispose();expect(beacon.root.parent).toBeNull();expect(beacon.root.children).toHaveLength(0);
    for(const spy of own)expect(spy).toHaveBeenCalledOnce();for(const spy of sourceGeometry.values())expect(spy).not.toHaveBeenCalled();for(const spy of skeletons.values())expect(spy).not.toHaveBeenCalled();
  }finally{beacon.dispose();vi.restoreAllMocks();disposeModel(model.root);}
});
