/** Offline actor packing. Positions, skeleton transforms and animation data remain full precision. */
import {NodeIO, PropertyType} from '@gltf-transform/core';
import {ALL_EXTENSIONS, EXTMeshoptCompression} from '@gltf-transform/extensions';
import {dedup, quantize, prune} from '@gltf-transform/functions';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {MeshoptEncoder, MeshoptDecoder} from 'meshoptimizer';
import {createHash} from 'node:crypto';
await MeshoptEncoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const report=[];
for(const name of ['dretch','basilisk','marauder','tyrant','dragoon','marine']) {
 const path=`public/assets/models/${name}.glb`;
 const original=await readFile(path);
 const doc=await io.readBinary(original);
 // Preserve named rank skins and animation contracts; prune orphan accessors only.
 await doc.transform(dedup(),quantize({pattern:/^(NORMAL|TANGENT|TEXCOORD_\d+|WEIGHTS_\d+)$/,quantizeNormal:16,quantizeTexcoord:16,quantizeWeight:16,normalizeWeights:false,cleanup:false}),dedup(),prune({propertyTypes:[PropertyType.ACCESSOR]}));
 doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
 let bytes=await io.writeBinary(doc);
 // NodeIO omits near-zero transforms. Restore authored rest transforms verbatim.
 const jsonOf=b=>JSON.parse(new TextDecoder().decode(b.subarray(20,20+new DataView(b.buffer,b.byteOffset).getUint32(12,true))));
 const source=jsonOf(original), packed=jsonOf(bytes);
 const nodes=new Map(source.nodes.map(n=>[n.name,n]));
 for(const node of packed.nodes){const old=nodes.get(node.name);if(!old)continue;for(const key of ['translation','rotation','scale','matrix']){if(key in old)node[key]=old[key];else delete node[key];}}
 const json=new TextEncoder().encode(JSON.stringify(packed));
 const padded=(json.length+3)&~3;
 const oldJSON=new DataView(bytes.buffer,bytes.byteOffset).getUint32(12,true);
 const tail=bytes.subarray(20+oldJSON);
 const result=new Uint8Array(20+padded+tail.length);result.set(bytes.subarray(0,12));
 const view=new DataView(result.buffer);view.setUint32(8,result.length,true);view.setUint32(12,padded,true);view.setUint32(16,0x4e4f534a,true);
 result.fill(32,20,20+padded);result.set(json,20);result.set(tail,20+padded);bytes=result;
 await writeFile(path,bytes);
 report.push({name,before:original.length,after:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
await mkdir('artifacts/nextgen/i11-final',{recursive:true});
await writeFile('artifacts/nextgen/i11-final/asset-sizes.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
