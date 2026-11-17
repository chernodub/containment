import {authorActorRegions} from './ActorRegions';
import {prepareOriginalCreature} from './OriginalCreatureAnatomy';
import * as T from 'three';
const lows=new WeakMap<T.BufferGeometry,T.BufferGeometry>();
const fulls=new WeakMap<T.BufferGeometry,T.BufferGeometry>();
const lowFinishes=new WeakMap<T.BufferGeometry,T.MeshStandardMaterial>();
const textureSlots=['map','normalMap','emissiveMap','aoMap'] as const;
type Samplers={textures:(T.Texture|null)[];normalScale:T.Vector2};
const samplerStates=new WeakMap<T.Mesh,{material:T.MeshStandardMaterial;full:Samplers;low:boolean}>();
const actorMeshes=new WeakMap<T.Object3D,T.Mesh[]>();
/** Detach shipped index-only LOD siblings before rank/rig preparation sees them. */
export function extractActorLODs(root:T.Object3D):()=>void {
 const sources=new Map<string,T.Mesh>(),pairs:{source:T.Mesh;low:T.Mesh}[]=[];
 root.traverse(o=>{if(o instanceof T.Mesh&&o.userData.perf13LOD!=='low')sources.set(String(o.userData.name??o.name),o);});
 root.traverse(o=>{if(o instanceof T.Mesh&&o.userData.perf13LOD==='low'){const source=sources.get(o.userData.perf13SourceNode);if(source)pairs.push({source,low:o});}});
 for(const {low}of pairs)low.removeFromParent();
 return()=>{for(const {source,low}of pairs){const name=low.name;low.name=source.name;const staging=new T.Group();staging.add(low);authorActorRegions(staging,source.name.startsWith('k10-'));prepareOriginalCreature(staging);low.removeFromParent();low.name=name;const geometry=low.geometry;geometry.userData.sharedAsset=true;geometry.userData.perf13LOD='low';lows.set(source.geometry,geometry);fulls.set(geometry,source.geometry);if(low.userData.perf13Atlas&&low.material instanceof T.MeshStandardMaterial){for(const texture of [low.material.map,low.material.normalMap])if(texture)texture.anisotropy=4;lowFinishes.set(source.geometry,low.material);}}};
}
/** Swaps indices only. Rank/skin owners retain materials, skeletons and authored attributes. */
export function setActorLOD(root:T.Object3D,low:boolean):void {
 let meshes=actorMeshes.get(root);if(!meshes){meshes=[];root.traverse(o=>{if(o instanceof T.Mesh)meshes!.push(o);});actorMeshes.set(root,meshes);}
 for(const o of meshes){const full=fulls.get(o.geometry)??o.geometry;const next=low?lows.get(full)??full:full;if(o.geometry!==next)o.geometry=next;
  if(!(o.material instanceof T.MeshStandardMaterial))continue;const material=o.material,finish=lowFinishes.get(full);let state=samplerStates.get(o);
  if(!state&&finish){state={material,full:{textures:textureSlots.map(slot=>material[slot]),normalScale:material.normalScale.clone()},low:false};samplerStates.set(o,state);}
  if(!state||state.material!==material)continue;const useLow=low&&!!finish;
  if(state.low!==useLow){for(let i=0;i<textureSlots.length;i++)material[textureSlots[i]]=useLow?finish![textureSlots[i]]:state.full.textures[i];material.normalScale.copy(useLow?finish!.normalScale:state.full.normalScale);material.needsUpdate=true;state.low=useLow;}
}
}
/** Context resource owner includes the alternate index buffer before it is selected. */
export function actorLODGeometry(geometry:T.BufferGeometry):T.BufferGeometry|undefined{return lows.get(geometry)??fulls.get(geometry);}
