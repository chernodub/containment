import {scheduleActorSkeletons} from './ActorSkeletonScheduling';
import {extractActorLODs} from './ActorLOD';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import * as T from 'three';
import {loadAuthoredMotion} from './motion/MotionAssets';
const initDeathPhysics=()=>import('./DeathRagdolls').then(module=>module.initDeathPhysics());
import {GLTFLoader,type GLTF} from 'three/addons/loaders/GLTFLoader.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {prepareFlatActorSkin} from './ActorFlatSkin';
import {authorActorRegions} from './ActorRegions';
export const ASSET_NAMES=['marine','dretch','basilisk','marauder','dragoon','tyrant','pistol','rifle','shotgun','plasma','rocket'] as const;
export type AssetName=typeof ASSET_NAMES[number];
const templates=new Map<AssetName,GLTF>();
const pending=new Map<AssetName,Promise<GLTF>>();
let assetDirectory='assets/models/';
function loadAsset(name:AssetName,loader:GLTFLoader){
 const existing=templates.get(name);if(existing)return Promise.resolve(existing);
 const inFlight=pending.get(name);if(inFlight)return inFlight;
 // Share the entire decode, not just its HTTP transfer: each parser owns its
 // embedded images. A failed request must remain retryable on the next boot.
 const work=loader.loadAsync(`${import.meta.env.BASE_URL}${assetDirectory}${name}.glb`).then(async asset=>{asset.animations.push(...await loadAuthoredMotion(name,loader));registerAsset(name,asset);return asset;}).finally(()=>pending.delete(name));
 pending.set(name,work);return work;
}
export function registerAsset(name:AssetName,asset:GLTF){
 const finishLOD=extractActorLODs(asset.scene);
 if(['marine','tyrant','marauder','basilisk','dretch','dragoon'].includes(name)){authorActorRegions(asset.scene,name==='marine');prepareFlatActorSkin(asset.scene,name,asset.animations);}
 asset.scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.userData.sharedAsset=true;o.castShadow=o.receiveShadow=true;o.frustumCulled=false;const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials)if(m instanceof T.MeshStandardMaterial){for(const map of [m.map,m.normalMap])if(map)map.anisotropy=4;}}});
 finishLOD();
 templates.set(name,asset);
}
export async function preloadAssets(progress:(fraction:number)=>void=()=>{},initializePhysics:()=>Promise<void>=initDeathPhysics,renderer?:T.WebGLRenderer){
 // Physics is optional presentation. Asset loading must survive WASM failure.
 try{await initializePhysics();}catch{/* Frozen-pose toss remains available. */}
 const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);let completed=0;
 const compressed=renderer&&['WEBGL_compressed_texture_astc','WEBGL_compressed_texture_etc','WEBGL_compressed_texture_s3tc','EXT_texture_compression_bptc'].some(name=>renderer.extensions.has(name));
 const ktx=compressed?new KTX2Loader().setTranscoderPath(`${import.meta.env.BASE_URL}assets/basis/`).setWorkerLimit(2).detectSupport(renderer):undefined;
 assetDirectory=ktx?'assets/models/':'assets/models/plain/';
 if(ktx)loader.setKTX2Loader(ktx);
 // Four concurrent transfers keep startup responsive on slower connections.
 const queue=[...ASSET_NAMES];try{await Promise.all(Array.from({length:4},async()=>{while(queue.length){const name=queue.shift()!;await loadAsset(name,loader);progress(++completed/ASSET_NAMES.length);}}));}finally{ktx?.dispose();}
}
export function instantiateAsset(name:AssetName){
 const asset=templates.get(name);if(!asset)throw new Error(`Asset ${name} was not loaded`);
 const root=clone(asset.scene);const materials:T.MeshStandardMaterial[]=[],materialCopies=new Map<T.Material,T.Material>(),skeletons:T.Skeleton[]=[];
 root.traverse(o=>{if(o instanceof T.Mesh){
  const copy=(m:T.Material)=>{let c=materialCopies.get(m);if(!c){c=m.clone();c.userData.actorMaterial=true;materialCopies.set(m,c);if(c instanceof T.MeshStandardMaterial)materials.push(c);}return c;};
  o.material=Array.isArray(o.material)?o.material.map(copy):copy(o.material);
  if(o instanceof T.SkinnedMesh){const own=o.skeleton,shared=skeletons.find(s=>s.bones.length===own.bones.length&&s.bones.every((b,i)=>b===own.bones[i]&&s.boneInverses[i].equals(own.boneInverses[i])));if(shared)o.skeleton=shared;else skeletons.push(own);}
 }});
 scheduleActorSkeletons(root);
 return{root,clips:asset.animations,materials};
}
