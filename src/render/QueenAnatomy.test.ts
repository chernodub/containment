import {beforeAll,expect,it} from 'vitest';
import * as T from 'three';
import {loadModels} from '../../tests/loadModels';
import {alien,disposeModel,freezeCorpse} from './models';

beforeAll(loadModels);

function queenIdentity(model:ReturnType<typeof alien>){
  return model.root.getObjectByName('queen-identity') as T.SkinnedMesh<T.BufferGeometry,T.ShaderMaterial>;
}

/** Replay authored opening before the same native joint transform used by the GPU. */
function pose(mesh:T.SkinnedMesh<T.BufferGeometry,T.ShaderMaterial>,opening:number){
  const geometry=mesh.geometry,p=geometry.getAttribute('position'),roles=geometry.getAttribute('identityRole');
  const sides=geometry.getAttribute('identitySide'),anchors=geometry.getAttribute('identityAnchor');
  const span=mesh.material.uniforms.identitySpan.value as number,height=mesh.material.uniforms.identityHeight.value as number;
  const point=new T.Vector3(),hinge=new T.Vector3(),delta=new T.Vector3();
  const result={
    plates:new T.Box3(),organ:new T.Box3(),ventricles:new T.Box3(),valve:new T.Box3(),artery:new T.Box3(),
    sternum:new T.Box3(),supports:new T.Box3(),thorax:new T.Box3(),maxRadius:0,
    plateAnchors:new Set<string>(),organAnchors:new Set<string>(),plateEdges:[] as number[],
  };
  mesh.updateWorldMatrix(true,false);mesh.skeleton.update();
  let actor:T.Object3D=mesh;while(actor.parent&&actor.name!=='alien-queen')actor=actor.parent;
  const transform=actor.matrixWorld.clone().invert().multiply(mesh.matrixWorld),edgeStart=new T.Vector3();
  for(let i=0;i<p.count;i++){
    const role=roles.getX(i);
    point.fromBufferAttribute(p,i);hinge.fromBufferAttribute(anchors,i);
    if(role===5){
      result.plateAnchors.add(`${hinge.x}/${hinge.y}/${hinge.z}`);
      const side=sides.getX(i),angle=-side*opening*1.22;
      hinge.x+=side*span*.075;delta.copy(point).sub(hinge);
      point.x=hinge.x+Math.cos(angle)*delta.x-Math.sin(angle)*delta.y+side*opening*span*.035;
      point.y=hinge.y+Math.sin(angle)*delta.x+Math.cos(angle)*delta.y+opening*height*.035;
      // Edges are measured before skinning: shell opening is rigid; the native
      // chest joint subsequently applies the same transform to the whole wing.
      if(i%3===0)edgeStart.copy(point);else if(i%3===1)result.plateEdges.push(point.distanceTo(edgeStart));
    }else if(role===3||role===17||role===18){
      result.organAnchors.add(`${hinge.x}/${hinge.y}/${hinge.z}`);
      point.sub(hinge).multiplyScalar(1+opening*.08).add(hinge);
      point.y+=opening*height*.162;
    }
    if(role===8||role===9)point.y+=opening*height*(role===8?.19:.18);
    mesh.applyBoneTransform(i,point);point.applyMatrix4(transform);
    if(role===3||role===17||role===18)result.organ.expandByPoint(point);
    if(role===3)result.ventricles.expandByPoint(point);
    else if(role===17)result.valve.expandByPoint(point);
    else if(role===18)result.artery.expandByPoint(point);
    else if(role===5)result.plates.expandByPoint(point);
    else if(role===8)result.sternum.expandByPoint(point);
    else if(role===9)result.supports.expandByPoint(point);
    else if(role===2)result.thorax.expandByPoint(point);
    result.maxRadius=Math.max(result.maxRadius,Math.hypot(point.x,point.z));
  }
  return result;
}

it('opens two rigid segmented wings around a deep structured target and an open sternum inside collision',()=>{
  const model=alien('queen'),mesh=queenIdentity(model),h=mesh.material.uniforms.identityHeight.value as number;
  try{
    model.animate(0,0,0);model.root.updateMatrixWorld(true);
    const closed=pose(mesh,0),opened=pose(mesh,1);
    expect(closed.plateAnchors.size).toBe(2);
    expect(closed.organAnchors.size).toBe(1);
    // The paired ventricular target remains nested below closed armor. An
    // exposed organ has real depth, a dark valve and a smaller artery focus;
    // broken struts frame it while its forward and upper surfaces remain open.
    expect(closed.organ.max.y).toBeLessThan(closed.plates.max.y);
    expect(closed.organ.min.y).toBeLessThan(closed.plates.min.y);
    expect(closed.organ.getSize(new T.Vector3()).x).toBeLessThan(closed.plates.getSize(new T.Vector3()).x);
    expect(opened.ventricles.getSize(new T.Vector3()).y).toBeGreaterThan(h*.20);
    expect(opened.ventricles.getSize(new T.Vector3()).z).toBeGreaterThan(mesh.material.uniforms.identitySpan.value*.20);
    expect(opened.valve.isEmpty()).toBe(false);expect(opened.artery.isEmpty()).toBe(false);
    expect(opened.valve.getSize(new T.Vector3()).x).toBeLessThan(opened.ventricles.getSize(new T.Vector3()).x*.35);
    expect(opened.artery.getSize(new T.Vector3()).x).toBeLessThan(opened.ventricles.getSize(new T.Vector3()).x*.25);
    expect(opened.sternum.max.z).toBeLessThan(opened.ventricles.max.z);
    expect(opened.supports.getSize(new T.Vector3()).y).toBeGreaterThan(h*.15);
    expect(opened.organ.min.y).toBeLessThan(opened.thorax.max.y+h*.08);
    expect(opened.organ.min.y).toBeGreaterThan(opened.thorax.min.y);
    expect(mesh.material.fragmentShader).toContain('if(role>7.5&&role<9.5&&identityOpening<.08)discard;');
    expect(mesh.material.fragmentShader).toContain('identityInner*identityOpening');
    // Opening changes the mantle silhouette without stretching its triangles.
    expect(Math.abs(opened.plates.getSize(new T.Vector3()).x-closed.plates.getSize(new T.Vector3()).x)).toBeGreaterThan(mesh.material.uniforms.identitySpan.value*.12);
    opened.plateEdges.forEach((edge,i)=>expect(edge).toBeCloseTo(closed.plateEdges[i],10));
    for(const opening of [0,.25,.5,.75,1])expect(pose(mesh,opening).maxRadius).toBeLessThanOrEqual(92/32*.99);
    expect(mesh.material.vertexShader).toContain('if((role>2.5&&role<3.5)||(role>16.5&&role<18.5))');
    expect(mesh.material.vertexShader).toContain('plateNormal=normalize(plateNormal/organScale)');
    expect(mesh.material.vertexShader).toContain('#include <skinnormal_vertex>');
    expect(mesh.material.fragmentShader).toContain('if((role>2.5&&role<3.5)||(role>16.5&&role<18.5))');
  }finally{disposeModel(model.root);}
});

it('retains the full structured anatomy footprint across native poses and every opening sample',()=>{
  const model=alien('queen'),mesh=queenIdentity(model);
  try{
    for(let frame=0;frame<20;frame++){
      model.animate(frame/60,1,.7);model.root.updateMatrixWorld(true);
      for(const opening of [0,.25,.5,.75,1]){
        expect(pose(mesh,opening).maxRadius,`frame ${frame} opening ${opening}`).toBeLessThanOrEqual(92/32*.99);
      }
    }
  }finally{disposeModel(model.root);}
});

it('keeps resident geometry, materials and native joint ownership through phases, statuses, death and reuse',()=>{
  const model=alien('queen'),mesh=queenIdentity(model),geometry=mesh.geometry,material=mesh.material,skeleton=mesh.skeleton;
  try{
    const key=material.customProgramCacheKey();
    model.animate(0,0,0);model.setExposed!(true);
    for(let f=1;f<=20;f++)model.animate(f/60,0,0);
    expect(material.uniforms.identityOpening.value).toBeGreaterThan(.95);
    for(const status of [{chilled:true,frozen:true,burning:false},{chilled:false,burning:true},{chilled:false,burning:false,poisoned:true}]){
      model.setAffliction!(status);model.animate(.35,0,0);
      expect(material.uniforms.identityOpening.value).toBeGreaterThan(.95);
      expect(mesh.geometry).toBe(geometry);expect(mesh.material).toBe(material);expect(mesh.skeleton).toBe(skeleton);expect(material.customProgramCacheKey()).toBe(key);
    }
    model.setExposed!(false);for(let f=1;f<=30;f++)model.animate(.35+f/60,0,0);
    expect(material.uniforms.identityOpening.value).toBeLessThan(.01);
    const roles=geometry.getAttribute('identityRole'),point=new T.Vector3(),h=material.uniforms.identityHeight.value as number;
    freezeCorpse(model);expect(material.uniforms.identityDeath.value).toBe(1);
    for(const role of [3,8,9,17,18]){
      const index=Array.from(roles.array).findIndex(v=>v===role);expect(index).toBeGreaterThanOrEqual(0);
      mesh.getVertexPosition(index,point);expect(point.toArray()).toEqual([0,h*.5,0]);
    }
    expect(material.fragmentShader).toContain('if(identityDeath>=1.0&&((role>2.5&&role<3.5)||(role>7.5&&role<9.5)||(role>16.5&&role<18.5)))discard;');
    model.reset!();expect(material.uniforms.identityOpening.value).toBe(0);expect(material.uniforms.identityDeath.value).toBe(0);
    expect(mesh.geometry).toBe(geometry);expect(mesh.material).toBe(material);expect(mesh.skeleton).toBe(skeleton);expect(material.customProgramCacheKey()).toBe(key);
  }finally{disposeModel(model.root);}
});
