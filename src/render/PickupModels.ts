import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import type {PickupKind} from '../game/pickups/PickupSystem';
import {groundIndicatorMaterial} from './vfx/GroundIndicatorMaterial';

const colors:Record<PickupKind,number>={health:0x85ffd1,armor:0x9fe8ff,ammo:0xf2cc87,grenade:0xffb994,credits:0xffd27a};
export async function loadPickupModels(renderer:T.WebGLRenderer){
  const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const base=import.meta.env.BASE_URL+'assets/';
  const compressed=['WEBGL_compressed_texture_astc','WEBGL_compressed_texture_etc','WEBGL_compressed_texture_s3tc','EXT_texture_compression_bptc'].some(format=>renderer.extensions.has(format));
  const transcoder=compressed?new KTX2Loader().setTranscoderPath(base+'basis/').setWorkerLimit(1).detectSupport(renderer):undefined;
  try{
    if(transcoder)loader.setKTX2Loader(transcoder);
    return (await loader.loadAsync(base+'props14/'+(compressed?'':'plain/')+'props.glb')).scene;
  }finally{transcoder?.dispose();}
}

/** The atlas assigns one constant swatch per face. Group its indices by swatch so
 * native drops can use the ship's existing untextured instanced shader. */
const floorSwatches:Record<PickupKind,Record<number,number>>={
  health:{1:4},
  armor:{0:13,1:13},
  ammo:{0:12},
  grenade:{0:12,1:12,2:3},
  credits:{3:9},
};
function enamelParts(kind:PickupKind,source:T.Mesh,low:T.Mesh):T.Mesh[]{
  const palette=source.userData.swatches as string[];
  function partitions(geometry:T.BufferGeometry){
    const uv=geometry.getAttribute('uv'),index=geometry.getIndex()!;
    const buckets=new Map<number,number[]>();
    for(let i=0;i<index.count;i+=3){
      const v=index.getX(i);
      const tile=Math.floor(uv.getX(v)*4)+4*Math.floor((1-uv.getY(v))*4);
      const swatch=floorSwatches[kind][tile]??tile;
      let bucket=buckets.get(swatch);
      if(!bucket){bucket=[];buckets.set(swatch,bucket);}
      bucket.push(v,index.getX(i+1),index.getX(i+2));
    }
    return buckets;
  }
  const lowIndices=partitions(low.geometry);
  return Array.from(partitions(source.geometry),([swatch,indices])=>{
    const color=new T.Color('#'+palette[swatch]);
    const lit=swatch>=5&&swatch<=11;
    const finish=new T.MeshStandardMaterial({color,roughness:.65,emissive:lit?color:0,emissiveIntensity:.65});
    const geometry=new T.BufferGeometry();
    geometry.setAttribute('position',source.geometry.getAttribute('position'));
    geometry.setAttribute('normal',source.geometry.getAttribute('normal'));
    geometry.setIndex(indices);
    const part=new T.Mesh(geometry,finish);
    const reduced=new T.BufferGeometry();
    reduced.setAttribute('position',low.geometry.getAttribute('position'));
    reduced.setAttribute('normal',low.geometry.getAttribute('normal'));
    reduced.setIndex(lowIndices.get(swatch)??[]);
    part.userData.lowGeometry=reduced;
    part.scale.setScalar(.78);
    return part;
  });
}

export function pickupModel(templates:T.Group,kind:PickupKind):T.Group {
  const source=templates.getObjectByName(kind),low=templates.getObjectByName(kind+'__lod_low');
  if(!(source instanceof T.Mesh&&low instanceof T.Mesh))throw Error('Missing requisition model '+kind);
  const root=new T.Group();
  root.name='pickup-'+kind;
  root.add(...enamelParts(kind,source,low));
  const contact=new T.Mesh(new T.PlaneGeometry(1.26,1.26),groundIndicatorMaterial('supply',colors[kind]));
  contact.name='deck-contact';
  contact.rotation.x=-Math.PI/2;
  contact.position.y=.025;
  root.add(contact);
  return root;
}
