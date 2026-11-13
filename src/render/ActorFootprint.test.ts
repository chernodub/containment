import { beforeAll, expect, it, vi } from 'vitest';
import * as T from 'three';
import { loadModels } from '../../tests/loadModels';
import { ENEMIES } from '../game/enemies/catalog';
import { alien, marine, disposeModel, freezeCorpse, type ActorModel } from './models';

beforeAll(loadModels);

function radialEnvelope(model: ActorModel, torsoOnly = false) {
  model.root.updateMatrixWorld(true);
  const point = new T.Vector3(), inverse = model.root.matrixWorld.clone().invert();
  let radius = 0;
  model.root.traverse(object => {
    if (!(object instanceof T.SkinnedMesh)) return;
    object.skeleton.update();
    for (let i = 0; i < object.geometry.getAttribute('position').count; i++) {
      if(torsoOnly){
        // Height bands accidentally include the crawler's swinging legs. Use
        // actual dominant skin influence to audit the thorax/abdomen instead.
        const indices=object.geometry.getAttribute('skinIndex'),weights=object.geometry.getAttribute('skinWeight');
        let strongest=0;for(let lane=1;lane<4;lane++)if(weights.getComponent(i,lane)>weights.getComponent(i,strongest))strongest=lane;
        const bone=object.skeleton.bones[indices.getComponent(i,strongest)].name;
        if(!/^(chest|torso|body(?:\.\d+)?|spine\d*|bum|hips|ribs)$/.test(bone))continue;
      }
      object.getVertexPosition(i, point).applyMatrix4(object.matrixWorld).applyMatrix4(inverse);
      radius = Math.max(radius, Math.hypot(point.x, point.z));
    }
  });
  return radius;
}

function identityTorsoEnvelope(model:ActorModel){
  model.root.updateMatrixWorld(true);
  const point=new T.Vector3(),inverse=model.root.matrixWorld.clone().invert();let radius=0;
  model.root.traverse(object=>{
    if(!(object instanceof T.Mesh)||!object.name.endsWith('-identity'))return;
    const p=object.geometry.getAttribute('position'),roles=object.geometry.getAttribute('identityRole');
    if(!roles)return;
    for(let i=0;i<p.count;i++){
      const role=roles.getX(i);if(role>.5&&role!==4&&role!==5&&role!==7)continue;
      point.fromBufferAttribute(p,i).applyMatrix4(object.matrixWorld).applyMatrix4(inverse);
      radius=Math.max(radius,Math.hypot(point.x,point.z));
    }
  });
  return radius;
}

it('fits every family and elite rest envelope to its actual collision disc without elite inflation', () => {
  for (const kind of Object.keys(ENEMIES)) for (const elite of [false, true]) {
    const model = alien(kind, elite), radius = (kind === 'queen' ? 92 : ENEMIES[kind as keyof typeof ENEMIES].radius) / 32;
    try {
      expect(radialEnvelope(model), `${kind}/${elite}`).toBeLessThanOrEqual(radius * 1.061);
      expect(radialEnvelope(model,true),`${kind}/${elite} has actual trunk vertices`).toBeGreaterThan(0);
      for (let frame = 0; frame < 20; frame++) {
        model.animate(frame / 60, 1, .7);
        expect(radialEnvelope(model, true), `${kind}/${elite} walking torso frame ${frame}`).toBeLessThanOrEqual(radius*.99);
        expect(identityTorsoEnvelope(model),`${kind}/${elite} identity torso frame ${frame}`).toBeLessThanOrEqual(radius*.99);
      }
      for(const champion of ['warden','matron']){
        model.setThreat!(0, null, champion);
        for(let frame=0;frame<20;frame++){
          model.animate(.35+frame/60+(champion==='matron'?.35:0),1,.7);
          expect(radialEnvelope(model,true),`${kind}/${elite}/${champion} torso frame ${frame}`).toBeLessThanOrEqual(radius*.99);
          expect(identityTorsoEnvelope(model),`${kind}/${elite}/${champion} identity frame ${frame}`).toBeLessThanOrEqual(radius*.99);
        }
      }
    } finally { disposeModel(model.root); }
  }
});

it('keeps the already fitting marine torso and uniform authored weapon socket', () => {
  const model = marine();
  try {
    expect(model.height).toBeCloseTo(2.05);
    for(let frame=0;frame<30;frame++){
      model.animate(frame/60,1,.4,.8,.5,{x:0,y:220});model.syncWeaponPose!();
      expect(radialEnvelope(model,true)).toBeLessThanOrEqual(.5*.99);
      const socket=model.root.getObjectByName('tag_weapon')!;
      expect(socket.getWorldQuaternion(new T.Quaternion()).angleTo(model.weapon!.getWorldQuaternion(new T.Quaternion()))).toBeLessThan(.001);
    }
    expect(model.muzzleWorld!(new T.Vector3()).toArray().every(Number.isFinite)).toBe(true);
  } finally { disposeModel(model.root); }
});

it('keeps the Queen mantle and egg abdomen within the boss collider through both hinged phases',()=>{
  const model=alien('queen'),mesh=model.root.getObjectByName('queen-identity') as T.Mesh<T.BufferGeometry,T.ShaderMaterial>;
  const p=mesh.geometry.getAttribute('position'),role=mesh.geometry.getAttribute('identityRole'),side=mesh.geometry.getAttribute('identitySide'),anchor=mesh.geometry.getAttribute('identityAnchor');
  const point=new T.Vector3(),hinge=new T.Vector3(),delta=new T.Vector3(),span=mesh.material.uniforms.identitySpan.value as number,height=model.height;
  try{
    model.animate(0,0,0);model.root.updateMatrixWorld(true);const transform=model.root.matrixWorld.clone().invert().multiply(mesh.matrixWorld);
    for(const opening of [0,1])for(let i=0;i<p.count;i++)if(role.getX(i)===5||role.getX(i)===7){
      point.fromBufferAttribute(p,i);
      if(role.getX(i)===5){
        const direction=side.getX(i),angle=-direction*opening*1.22;
        hinge.fromBufferAttribute(anchor,i);hinge.x+=direction*span*.075;delta.copy(point).sub(hinge);
        point.x=hinge.x+Math.cos(angle)*delta.x-Math.sin(angle)*delta.y+direction*opening*span*.035;
        point.y=hinge.y+Math.sin(angle)*delta.x+Math.cos(angle)*delta.y+opening*height*.035;
      }
      point.applyMatrix4(transform);expect(Math.hypot(point.x,point.z)).toBeLessThanOrEqual(92/32*.99);
    }
  }finally{disposeModel(model.root);}
});

it('creates collider evidence only on explicit opt-in and reuses it through toggles', () => {
  const model = alien('spitter');
  try {
    expect(model.root.getObjectByName('debug-collider-disc')).toBeUndefined();
    model.setColliderDebug!(true, 18 / 32);
    const disc = model.root.getObjectByName('debug-collider-disc') as T.Mesh;
    expect(disc.scale.x).toBe(18 / 32);
    const dispose = vi.spyOn(disc.material as T.Material, 'dispose');
    model.setColliderDebug!(false); model.setColliderDebug!(true);
    expect(model.root.getObjectByName('debug-collider-disc')).toBe(disc);
    model.reset!(); expect(disc.visible).toBe(false);
    disposeModel(model.root); expect(dispose).toHaveBeenCalledOnce();
  } finally { model.stop?.(); }
});

it('retains visible corpse anatomy without hidden-rank support or pooled resource churn',()=>{
  const model=alien('brute',true),identity=model.root.getObjectByName('brute-identity') as T.Mesh;
  const liveGeometry=identity.geometry,material=identity.material as T.Material,parent=identity.parent,dispose=vi.spyOn(material,'dispose');
  try{
    freezeCorpse(model);
    expect(identity.visible).toBe(true);expect(identity.geometry).toBe(liveGeometry);
    expect((identity.material as T.ShaderMaterial).uniforms.identityDeath.value).toBe(1);
    expect(identity.parent).toBe(parent);expect(identity.material).toBe(material);
    const bounds=new T.Box3().setFromObject(model.root,true);
    const visibleBounds=new T.Box3();model.root.updateMatrixWorld(true);
    model.root.traverse(o=>{if(o instanceof T.SkinnedMesh)visibleBounds.union(new T.Box3().setFromObject(o,true));});
    expect(bounds.min.y).toBeCloseTo(visibleBounds.min.y,6);
    model.reset!();expect(identity.geometry).toBe(liveGeometry);expect(identity.visible).toBe(true);
    freezeCorpse(model);disposeModel(model.root);expect(dispose).toHaveBeenCalledOnce();
  }finally{model.stop?.();}
});
