import {readFileSync} from 'node:fs';
import {expect,it,vi} from 'vitest';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {authorActorRegions} from './ActorRegions';
import {batchActorSkins} from './ActorSkinBatching';
import {prepareFlatActorSkin} from './ActorFlatSkin';
import {instantiateAsset,registerAsset} from './assets';
import {disposeModel} from './meshParts';

async function source(name:string){
  const bytes=readFileSync(`public/assets/models/${name}.glb`),length=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+length).toString());
  for(const m of json.materials??[]){m.extras={...m.extras,sourceAsset:name,sourceTexture:m.pbrMetallicRoughness?.baseColorTexture?.index};delete m.pbrMetallicRoughness?.baseColorTexture;delete m.normalTexture;delete m.emissiveTexture;delete m.occlusionTexture;}
  delete json.images;delete json.textures;
  const binary=bytes.subarray(28+length);let text=JSON.stringify(json);text+=' '.repeat((4-text.length%4)%4);
  const encoded=Buffer.from(text),glb=Buffer.alloc(28+encoded.length+binary.length);glb.write('glTF');glb.writeUInt32LE(2,4);glb.writeUInt32LE(glb.length,8);glb.writeUInt32LE(encoded.length,12);glb.write('JSON',16);encoded.copy(glb,20);glb.writeUInt32LE(binary.length,20+encoded.length);glb.write('BIN\0',24+encoded.length);binary.copy(glb,28+encoded.length);
  return new GLTFLoader().parseAsync(glb.buffer.slice(glb.byteOffset,glb.byteOffset+glb.length),'');
}
function skins(root:T.Object3D){const out:T.SkinnedMesh[]=[];root.traverse(o=>{if(o instanceof T.SkinnedMesh)out.push(o);});return out;}
function receipt(root:T.Object3D){
  root.updateWorldMatrix(true,true);const out:string[]=[],p=new T.Vector3();
  for(const mesh of skins(root)){mesh.skeleton.update();const region=mesh.geometry.getAttribute('actorRegion');for(let i=0;i<mesh.geometry.getAttribute('position').count;i++){mesh.getVertexPosition(i,p).applyMatrix4(mesh.matrixWorld);out.push([...p.toArray().map(x=>Math.round(x*1e5)),region.getX(i)].join(','));}}
  return out.sort();
}

it('consolidates real marine4→1, Brute2→1 and Spitter2→1 skins while preserving regions, anchors and native poses',async()=>{
  const results=[];
  for(const [name,before]of [['marine',4],['tyrant',2],['marauder',2]] as const){
    const baseline=await source(name),flat=await source(name);
    for(const asset of [baseline,flat]){authorActorRegions(asset.scene,name==='marine');if(name==='marine')batchActorSkins(asset.scene,asset.animations);}
    const anchors=skins(flat.scene).map(m=>({name:m.name,matrix:m.matrix.clone()}));expect(skins(flat.scene)).toHaveLength(before);
    const saved=prepareFlatActorSkin(flat.scene,name,flat.animations);expect(saved).toBe(before-1);expect(skins(flat.scene)).toHaveLength(1);
    const finish=skins(flat.scene)[0].material as T.MeshStandardMaterial;
    expect(finish.userData.sourceAsset).toBe(name);expect(finish.userData.sourceMaterials.length).toBeGreaterThanOrEqual(before);
    expect(finish.map).toBeNull();expect(finish.normalMap).toBeNull();expect(finish.emissiveMap).toBeNull();expect(finish.roughnessMap).toBeNull();expect(finish.metalnessMap).toBeNull();
    expect(finish.roughness).toBe(.85);expect(finish.metalness).toBe(0);expect(finish.transparent).toBe(false);
    for(const anchor of anchors){const node=flat.scene.getObjectByName(anchor.name)!;expect(node).toBeDefined();expect(node.matrix.equals(anchor.matrix)).toBe(true);}
    const a=new T.AnimationMixer(baseline.scene),b=new T.AnimationMixer(flat.scene);
    for(const clipName of ['stand','run','attack','shotgun_delta']){
      const clip=baseline.animations.find(c=>c.name===clipName);if(!clip)continue;a.stopAllAction();b.stopAllAction();a.clipAction(clip).play();b.clipAction(flat.animations.find(c=>c.name===clipName)!).play();
      for(const t of [0,.19]){a.setTime(t);b.setTime(t);expect(receipt(flat.scene)).toEqual(receipt(baseline.scene));}
    }
    expect(prepareFlatActorSkin(flat.scene,name,flat.animations)).toBe(0);
    results.push(`${name}: ${before}→${skins(flat.scene).length}, saved ${saved}`);
    a.uncacheRoot(baseline.scene);b.uncacheRoot(flat.scene);disposeModel(baseline.scene);disposeModel(flat.scene);
  }
  console.log('Actor skin draws: '+results.join('; '));
});

it('shares one prepared geometry but isolates clone materials, skeletons and disposal',async()=>{
  const asset=await source('marine');registerAsset('marine',asset);
  const a=instantiateAsset('marine'),b=instantiateAsset('marine'),aa=skins(a.root),bb=skins(b.root);
  expect(aa).toHaveLength(1);expect(bb).toHaveLength(1);expect(aa[0].geometry).toBe(bb[0].geometry);expect(aa[0].geometry.userData.sharedAsset).toBe(true);
  expect(aa[0].material).not.toBe(bb[0].material);expect(aa[0].skeleton).not.toBe(bb[0].skeleton);
  const geometry=vi.spyOn(aa[0].geometry,'dispose'),material=vi.spyOn(aa[0].material as T.Material,'dispose'),skeleton=vi.spyOn(aa[0].skeleton,'dispose');
  disposeModel(a.root);expect(material).toHaveBeenCalledOnce();expect(skeleton).toHaveBeenCalledOnce();expect(geometry).not.toHaveBeenCalled();disposeModel(b.root);expect(geometry).not.toHaveBeenCalled();geometry.mockRestore();
});

it('keeps weapon source finishes and unusual transparent skin semantics untouched',async()=>{
  const weapon=await source('rifle'),materials:T.Material[]=[];weapon.scene.traverse(o=>{if(o instanceof T.Mesh)materials.push(o.material as T.Material);});registerAsset('rifle',weapon);
  const clone=instantiateAsset('rifle');expect(clone.materials).toHaveLength(new Set(materials).size);expect(clone.materials.every(m=>!m.userData.actorFlatSkin)).toBe(true);
  const root=new T.Group(),g=new T.BoxGeometry();g.setAttribute('actorRegion',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(1),1));const m=new T.MeshStandardMaterial({transparent:true,opacity:.5}),skin=new T.SkinnedMesh(g,m);root.add(skin);
  expect(prepareFlatActorSkin(root,'synthetic',[])).toBe(0);expect(skin.material).toBe(m);disposeModel(clone.root);g.dispose();m.dispose();
});
