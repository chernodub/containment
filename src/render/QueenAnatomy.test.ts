import {beforeAll,expect,it} from 'vitest';
import * as T from 'three';
import {loadModels} from '../../tests/loadModels';
import {alien,disposeModel} from './models';

beforeAll(loadModels);

function queenIdentity(model:ReturnType<typeof alien>){
  return model.root.getObjectByName('queen-identity') as T.Mesh<T.BufferGeometry,T.ShaderMaterial>;
}

/** Project the shader's physical mantle/organ motion into the unchanged boss footprint. */
function pose(mesh:T.Mesh<T.BufferGeometry,T.ShaderMaterial>,opening:number){
  const geometry=mesh.geometry,p=geometry.getAttribute('position'),role=geometry.getAttribute('identityRole');
  const side=geometry.getAttribute('identitySide'),anchor=geometry.getAttribute('identityAnchor');
  const span=mesh.material.uniforms.identitySpan.value as number,height=mesh.material.uniforms.identityHeight.value as number;
  const point=new T.Vector3(),hinge=new T.Vector3(),delta=new T.Vector3();
  const result={plates:new T.Box3(),core:new T.Box3(),maxRadius:0,plateAnchors:new Set<string>(),coreAnchors:new Set<string>()};
  mesh.updateWorldMatrix(true,false);
  let actor:T.Object3D=mesh;while(actor.parent&&actor.name!=='alien-queen')actor=actor.parent;
  const transform=actor.matrixWorld.clone().invert().multiply(mesh.matrixWorld);
  for(let i=0;i<p.count;i++){
    const id=role.getX(i);if(id!==3&&id!==5&&id!==7)continue;
    point.fromBufferAttribute(p,i);hinge.fromBufferAttribute(anchor,i);
    if(id===5){
      result.plateAnchors.add(`${hinge.x}/${hinge.y}/${hinge.z}`);
      const direction=side.getX(i),angle=-direction*opening*1.22;
      hinge.x+=direction*span*.075;delta.copy(point).sub(hinge);
      point.x=hinge.x+Math.cos(angle)*delta.x-Math.sin(angle)*delta.y+direction*opening*span*.035;
      point.y=hinge.y+Math.sin(angle)*delta.x+Math.cos(angle)*delta.y+opening*height*.035;
    }else if(id===3){
      result.coreAnchors.add(`${hinge.x}/${hinge.y}/${hinge.z}`);
      point.sub(hinge).multiply(new T.Vector3(1+opening*.20,1+opening*.50,1+opening*.20)).add(hinge);
      point.y+=opening*height*.30;
    }
    point.applyMatrix4(transform);
    if(id===3)result.core.expandByPoint(point);else if(id===5)result.plates.expandByPoint(point);
    result.maxRadius=Math.max(result.maxRadius,Math.hypot(point.x,point.z));
  }
  return result;
}

it('opens two broad shell halves around one rising weak point without expanding collision',()=>{
  const model=alien('queen'),mesh=queenIdentity(model);
  try{
    model.animate(0,0,0);model.root.updateMatrixWorld(true);
    const closed=pose(mesh,0),opened=pose(mesh,1);
    expect(closed.plateAnchors.size).toBe(2);
    expect(closed.coreAnchors.size).toBe(1);
    expect(opened.core.getCenter(new T.Vector3()).y-closed.core.getCenter(new T.Vector3()).y).toBeGreaterThan((mesh.material.uniforms.identityHeight.value as number)*.25);
    expect(opened.core.getSize(new T.Vector3()).y/closed.core.getSize(new T.Vector3()).y).toBeGreaterThan(1.45);
    expect(opened.core.max.y).toBeGreaterThan((mesh.material.uniforms.identityHeight.value as number)*1.35);
    // The mantle's visible silhouette changes substantially, with no new mesh.
    expect(Math.abs(opened.plates.getSize(new T.Vector3()).x-closed.plates.getSize(new T.Vector3()).x)).toBeGreaterThan(mesh.material.uniforms.identitySpan.value*.12);
    for(const opening of [0,.25,.5,.75,1])expect(pose(mesh,opening).maxRadius).toBeLessThanOrEqual(92/32*.99);
    expect(mesh.material.fragmentShader).not.toContain('lamella');
    expect(mesh.material.fragmentShader).not.toContain('identityLocal.z*32.0');
    expect(mesh.material.vertexShader).toContain('plateNormal=normalize(plateNormal/organScale)');
  }finally{disposeModel(model.root);}
});

it('keeps the same resident geometry and material through opening, closing, statuses and reuse',()=>{
  const model=alien('queen'),mesh=queenIdentity(model),geometry=mesh.geometry,material=mesh.material;
  try{
    const key=material.customProgramCacheKey();
    model.animate(0,0,0);model.setExposed!(true);
    for(let f=1;f<=20;f++)model.animate(f/60,0,0);
    expect(material.uniforms.identityOpening.value).toBeGreaterThan(.95);
    model.setAffliction!({chilled:true,frozen:true,burning:false});
    model.animate(.35,0,0);
    expect(material.uniforms.identityOpening.value).toBeGreaterThan(.95);
    expect(mesh.geometry).toBe(geometry);expect(mesh.material).toBe(material);expect(material.customProgramCacheKey()).toBe(key);
    model.setExposed!(false);for(let f=1;f<=30;f++)model.animate(.35+f/60,0,0);
    expect(material.uniforms.identityOpening.value).toBeLessThan(.01);
    model.reset!();expect(material.uniforms.identityOpening.value).toBe(0);
    expect(mesh.geometry).toBe(geometry);expect(mesh.material).toBe(material);
  }finally{disposeModel(model.root);}
});
