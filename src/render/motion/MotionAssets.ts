import type {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import type {AnimationClip} from 'three';

const FILES:Record<string,readonly string[]>={
  marine:['marine-motion'],
  dretch:['crawler-motion'],tyrant:['brute-motion'],
  basilisk:['stalker-motion'],marauder:['spitter-motion'],dragoon:['carrier-motion'],
};
const pending=new Map<string,Promise<readonly AnimationClip[]>>();
/** Animation-only files share existing names/rest transforms; they own no skin or material. */
export async function loadAuthoredMotion(asset:string,loader:GLTFLoader):Promise<readonly AnimationClip[]>{
  const files=FILES[asset];if(!files)return [];
  const result:AnimationClip[]=[];
  for(const file of files){
    let request=pending.get(file);
    if(!request){request=loader.loadAsync(`${import.meta.env.BASE_URL}assets/models/motion/${file}.glb`).then(gltf=>{for(let i=0;i<gltf.animations.length;i++)Object.assign(gltf.animations[i],{userData:gltf.parser.json.animations?.[i]?.extras??{}});return gltf.animations;}).catch(error=>{pending.delete(file);throw error;});pending.set(file,request);}
    result.push(...await request);
  }
  return result;
}
