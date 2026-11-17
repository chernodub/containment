/** PERF13: index-only 50% Brood kit LODs; source geometry and images remain immutable. */
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder, MeshoptSimplifier} from 'meshoptimizer';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await Promise.all([MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
const directory='public/assets/brood-growth',out='artifacts/nextgen/perf13-final';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function parse(bytes){
  const length=bytes.readUInt32LE(12),json=JSON.parse(bytes.toString('utf8',20,20+length));
  let bin=bytes.subarray(28+length,28+length+bytes.readUInt32LE(20+length));
  const prior=json.asset.extras?.perf13BroodLOD;
  if(prior){
    json.meshes.length=prior.meshes;json.nodes.length=prior.nodes;
    json.accessors.length=prior.accessors;json.bufferViews.length=prior.bufferViews;
    for(const node of json.nodes)if(node.children)node.children=node.children.filter(index=>index<prior.nodes);
    for(const scene of json.scenes??[])scene.nodes=scene.nodes.filter(index=>index<prior.nodes);
    bin=bin.subarray(0,prior.binByteLength);json.buffers[0].byteLength=prior.bufferByteLength;
    delete json.asset.extras.perf13BroodLOD;
  }
  return{json,bin};
}
function emit(json,bin){
  const text=Buffer.from(JSON.stringify(json)),jp=(4-text.length%4)%4,bp=(4-bin.length%4)%4;
  const head=Buffer.alloc(20),bh=Buffer.alloc(8);head.writeUInt32LE(0x46546c67);head.writeUInt32LE(2,4);
  head.writeUInt32LE(28+text.length+jp+bin.length+bp,8);head.writeUInt32LE(text.length+jp,12);head.writeUInt32LE(0x4e4f534a,16);
  bh.writeUInt32LE(bin.length+bp);bh.writeUInt32LE(0x004e4942,4);
  return Buffer.concat([head,text,Buffer.alloc(jp,32),bh,bin,Buffer.alloc(bp)]);
}
const source=parse(await readFile(directory+'/brood-growth.glb'));
const document=await io.readBinary(emit(source.json,source.bin));
const meshes=[];
for(const[index,mesh]of document.getRoot().listMeshes().entries()){
  const results=[];
  for(const[primitiveIndex,primitive]of mesh.listPrimitives().entries()){
    if(primitive.getMode()!==4||!primitive.getIndices())throw Error('Brood LOD requires indexed triangles');
    const position=primitive.getAttribute('POSITION'),normal=primitive.getAttribute('NORMAL');
    const uv=primitive.getAttribute('TEXCOORD_0'),color=primitive.getAttribute('COLOR_0');
    const count=position.getCount(),positions=new Float32Array(count*3),attributes=new Float32Array(count*9);
    const p=[],n=[],t=[],c=[];
    for(let vertex=0;vertex<count;vertex++){
      position.getElement(vertex,p);positions.set(p,vertex*3);normal?.getElement(vertex,n);uv?.getElement(vertex,t);color?.getElement(vertex,c);
      attributes.set([n[0]??0,n[1]??0,n[2]??0,t[0]??0,t[1]??0,c[0]??1,c[1]??1,c[2]??1,c[3]??1],vertex*9);
    }
    const indices=Uint32Array.from(primitive.getIndices().getArray());
    const target=Math.max(3,Math.floor(indices.length*.5/3)*3);
    // Keep emissive geometry exact: the room loader derives connected lamp
    // positions/areas from these triangles, so LOD must not move illumination.
    const material=primitive.getMaterial()?.getName(),retainedEmitter=material!=='brood-growth';
    const[low,error]=retainedEmitter?[indices,0]:MeshoptSimplifier.simplifyWithAttributes(indices,positions,3,attributes,9,
      [1,1,1,10,10,10,10,10,10],null,target,.01,[]);
    results.push({primitiveIndex,material,retainedEmitter,low,sourceTriangles:indices.length/3,triangles:low.length/3,ratio:low.length/indices.length,relativeError:error});
  }
  meshes.push({sourceMesh:index,name:mesh.getName()+'__lod_low',primitives:results});
}
const files=[];
for(const file of['brood-growth.glb','brood-growth-ktx.glb']){
  const original=await readFile(directory+'/'+file),{json,bin}=parse(original);
  const contract={version:1,ratio:.5,meshes:json.meshes.length,nodes:json.nodes.length,
    accessors:json.accessors.length,bufferViews:json.bufferViews.length,
    bufferByteLength:json.buffers[0].byteLength,binByteLength:bin.length};
  const chunks=[bin];let offset=bin.length;
  for(const low of meshes){
    const mesh=structuredClone(json.meshes[low.sourceMesh]);mesh.name=low.name;
    mesh.extras={...mesh.extras,perf13LOD:'low',perf13SourceMesh:low.sourceMesh};
    for(const result of low.primitives){
      const maximum=result.low.reduce((value,index)=>Math.max(value,index),0);
      const array=maximum<=65535?Uint16Array.from(result.low):result.low;
      const bytes=Buffer.from(array.buffer,array.byteOffset,array.byteLength),padding=(4-offset%4)%4;
      chunks.push(Buffer.alloc(padding),bytes);offset+=padding;
      const view=json.bufferViews.length;json.bufferViews.push({buffer:0,byteOffset:offset,byteLength:bytes.length,target:34963});
      const accessor=json.accessors.length;json.accessors.push({bufferView:view,componentType:maximum<=65535?5123:5125,count:result.low.length,type:'SCALAR'});
      mesh.primitives[result.primitiveIndex].indices=accessor;offset+=bytes.length;
    }
    const meshIndex=json.meshes.length;json.meshes.push(mesh);
    for(let index=0;index<contract.nodes;index++){
      const source=json.nodes[index];if(source.mesh!==low.sourceMesh)continue;
      const node={name:source.name+'__lod_low',mesh:meshIndex,extras:{...source.extras,perf13LOD:'low',perf13SourceNode:source.name,perf13SourceMesh:low.sourceMesh}};
      for(const key of['translation','rotation','scale','matrix','weights'])if(key in source)node[key]=structuredClone(source[key]);
      const nodeIndex=json.nodes.length;json.nodes.push(node);
      const parent=json.nodes.slice(0,contract.nodes).find(parent=>parent.children?.includes(index));
      if(parent)parent.children.push(nodeIndex);else for(const scene of json.scenes??[])if(scene.nodes.includes(index))scene.nodes.push(nodeIndex);
    }
  }
  json.buffers[0].byteLength=offset;json.asset.extras={...json.asset.extras,perf13BroodLOD:contract};
  const payload=Buffer.concat(chunks),bytes=emit(json,payload);await writeFile(directory+'/'+file,bytes);
  files.push({file,beforeBytes:original.length,afterBytes:bytes.length,sha256:hash(bytes),
    originalBinSHA256:hash(bin),originalBinPrefixSHA256:hash(payload.subarray(0,bin.length))});
}
const receipt={policy:'Index-only meshopt simplifyWithAttributes; seam-preserving default, UV/color weight10 normal1, relative error cap1%; growth target50%; emissive primitives retained exactly to preserve source-derived lamp positions/areas; original normals/UV/vertex colors/material partitions and image bytes retained; no placement changes',
  meshes:meshes.map(mesh=>({...mesh,primitives:mesh.primitives.map(({low,...metrics})=>metrics)})),files};
await mkdir(out,{recursive:true});await writeFile(out+'/brood-lod-assets.json',JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt,null,2));
