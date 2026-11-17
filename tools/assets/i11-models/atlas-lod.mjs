/** Prototype low-atlas baker. High actor buffers and textures remain byte-exact. */
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder, MeshoptSimplifier} from 'meshoptimizer';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {loadavg, cpus} from 'node:os';
import {createHash} from 'node:crypto';
const name=process.argv.find(arg=>arg.startsWith('--asset='))?.slice(8)??'dretch';
if(!['dretch','basilisk','marauder','dragoon','tyrant'].includes(name))throw Error('Creature asset required');
const sourceRevision=process.argv.find(arg=>arg.startsWith('--source-revision='))?.slice(18)??'HEAD';
const work=resolve('artifacts/nextgen/perf13-final/atlas-lod',name);await mkdir(work,{recursive:true});
const host=()=>({at:new Date().toISOString(),load:loadavg(),cores:cpus().length});
const before=host(),hash=b=>createHash('sha256').update(b).digest('hex');
await Promise.all([MeshoptDecoder.ready,MeshoptSimplifier.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
const sourceInput=execFileSync('git',['show',`${sourceRevision}:public/assets/models/plain/${name}.glb`],{maxBuffer:64*1024*1024});
const parse=bytes=>{const n=bytes.readUInt32LE(12);return{json:JSON.parse(bytes.toString('utf8',20,20+n)),bin:bytes.subarray(28+n,28+n+bytes.readUInt32LE(20+n))}};
function clean(bytes){const{json,bin}=parse(bytes),prior=json.asset.extras?.perf13AtlasLOD??json.asset.extras?.perf13ActorLOD;if(!prior)return bytes;if(prior.nodes===undefined)throw Error('Prior prototype lacks rebuild array lengths; select original source revision');for(const key of['meshes','nodes','accessors','bufferViews','materials','images','textures'])if(prior[key]!==undefined)json[key].length=prior[key];for(const node of json.nodes)if(node.children)node.children=node.children.filter(index=>index<prior.nodes);for(const scene of json.scenes??[])scene.nodes=scene.nodes.filter(index=>index<prior.nodes);json.buffers[0].byteLength=prior.bufferByteLength;delete json.asset.extras.perf13AtlasLOD;delete json.asset.extras.perf13ActorLOD;return emit(json,bin.subarray(0,prior.binByteLength));}
const sourceBytes=clean(sourceInput);
const source=parse(sourceBytes),document=await io.readBinary(sourceBytes);
const meshIndex=source.json.meshes.findIndex(mesh=>mesh.name.endsWith('-base'));
const primitive=document.getRoot().listMeshes()[meshIndex].listPrimitives()[0];
const elements=semantic=>{const accessor=primitive.getAttribute(semantic),rows=[];for(let i=0;i<accessor.getCount();i++)rows.push(accessor.getElement(i,[]));return rows;};
const positions=elements('POSITION'),normals=elements('NORMAL'),uv=elements('TEXCOORD_0'),joints=elements('JOINTS_0'),weights=elements('WEIGHTS_0');
const indices=Uint32Array.from(primitive.getIndices().getArray()),attributes=new Float32Array(positions.length*11);
for(let i=0;i<positions.length;i++)attributes.set([...normals[i],...joints[i].map(j=>j/64),...weights[i]],i*11);
const[low,error]=MeshoptSimplifier.simplifyWithAttributes(indices,Float32Array.from(positions.flat()),3,attributes,11,[.1,.1,.1,.25,.25,.25,.25,.25,.25,.25,.25],null,Math.floor(indices.length*.3/3)*3,.03,['Permissive']);
const material=source.json.materials[source.json.meshes[meshIndex].primitives[0].material];
for(const[kind,slot]of[['base',material.pbrMetallicRoughness.baseColorTexture],['glow',material.emissiveTexture],['normal',material.normalTexture]]){
 const texture=source.json.textures[slot.index],image=source.json.images[texture.source],view=source.json.bufferViews[image.bufferView];
 await writeFile(resolve(work,'source-'+kind+'.png'),source.bin.subarray(view.byteOffset??0,(view.byteOffset??0)+view.byteLength));
}
await writeFile(resolve(work,'source.json'),JSON.stringify({positions,normals,uv,indices:[...indices],lowIndices:[...low],normalScale:material.normalTexture.scale??1}));
console.log(name,'triangles',indices.length/3,'->',low.length/3,'error',error,'host',before);
if(process.argv.includes('--publish-prepared')){const prepared=JSON.parse(await readFile(resolve(work,'receipt.json'),'utf8'));if(prepared.sourceSHA256!==hash(sourceBytes))throw Error('Prepared bake source changed: '+name);}else {await writeFile(resolve(work,'bake-host.json'),JSON.stringify(host(),null,2)+'\n');execFileSync(process.env.BLENDER??'/opt/homebrew/bin/blender',['-b','--factory-startup','-P','tools/assets/i11-models/atlas-lod-bake.py','--',work],{stdio:'inherit'});}
const bake=JSON.parse(await readFile(resolve(work,'bake.json'),'utf8'));
const bakeHost=JSON.parse(await readFile(resolve(work,'bake-host.json'),'utf8'));
await writeFile(resolve(work,'receipt.json'),JSON.stringify({name,sourceTriangles:indices.length/3,triangles:low.length/3,ratio:low.length/indices.length,simplifierError:error,sourceSHA256:hash(sourceBytes),before:bakeHost,publicationBefore:before,after:host(),bake},null,2));
console.log('Baked',work);

// Only UV seam duplicates are added; every other component is copied exactly
// from the referenced original vertex row (including normalized integer weights).
const rows=[],newIndices=[],unique=new Map();
for(const loop of bake.loops){const uv=loop.uv.map(Math.fround),key=loop.sourceVertex+'/'+uv.join('/');let index=unique.get(key);if(index===undefined){index=rows.length;unique.set(key,index);rows.push({sourceVertex:loop.sourceVertex,uv});}newIndices.push(index);}
const textures={};
for(const kind of['base','glow','normal']){
 const png=resolve(work,'low-'+kind+'.png'),ktx=resolve(work,'low-'+kind+'.ktx2');
 if(!process.argv.includes('--publish-prepared'))execFileSync(process.env.TOKTX??'/private/tmp/t12-ktx/KTX-Software-4.4.2-Darwin-arm64-tools.pkg/Payload/usr/local/bin/toktx',
  ['--t2','--genmipmap','--encode',kind==='normal'?'uastc':'etc1s','--assign_oetf',kind==='normal'?'linear':'srgb',
   ...(kind==='normal'?['--uastc_quality','4','--zcmp','18']:['--qlevel','255','--clevel','5']),'--threads','4',ktx,png],{stdio:'inherit'});
 textures[kind]={png:await readFile(png),ktx:await readFile(ktx)};
}
if(process.argv.includes('--bake-only')){await writeFile(resolve(work,'prepared-only-receipt.json'),JSON.stringify({name,sourceTriangles:indices.length/3,triangles:low.length/3,vertices:rows.length,ratio:low.length/indices.length,simplifierError:error,before:bakeHost,publicationBefore:before,after:host(),bake:{...bake,loops:undefined},published:false},null,2)+'\n');console.log('Prepared without publishing',name);process.exit(0);}
function emit(json,bin){const text=Buffer.from(JSON.stringify(json)),jp=(4-text.length%4)%4,bp=(4-bin.length%4)%4,head=Buffer.alloc(20),bh=Buffer.alloc(8);head.writeUInt32LE(0x46546c67);head.writeUInt32LE(2,4);head.writeUInt32LE(28+text.length+jp+bin.length+bp,8);head.writeUInt32LE(text.length+jp,12);head.writeUInt32LE(0x4e4f534a,16);bh.writeUInt32LE(bin.length+bp);bh.writeUInt32LE(0x004e4942,4);return Buffer.concat([head,text,Buffer.alloc(jp,32),bh,bin,Buffer.alloc(bp)]);}
const files=[];
for(const plain of[false,true]){
 const path=`public/assets/models/${plain?'plain/':''}${name}.glb`,original=clean(execFileSync('git',['show',`${sourceRevision}:${path}`],{maxBuffer:64*1024*1024})),{json,bin}=parse(original);
 const originalCounts={meshes:json.meshes.length,nodes:json.nodes.length,accessors:json.accessors.length,bufferViews:json.bufferViews.length,materials:json.materials.length,images:json.images.length,textures:json.textures.length,bufferByteLength:json.buffers[0].byteLength,binByteLength:bin.length};
 const chunks=[bin];let offset=bin.length;
 function append(bytes,target){const pad=(4-offset%4)%4;chunks.push(Buffer.alloc(pad),bytes);offset+=pad;const index=json.bufferViews.length;json.bufferViews.push({buffer:0,byteOffset:offset,byteLength:bytes.length,...(target?{target}:{})});offset+=bytes.length;return index;}
 const attributes={};
 for(const semantic of primitive.listSemantics()){
  const accessor=primitive.getAttribute(semantic),size=accessor.getElementSize(),sourceArray=accessor.getArray();
  const array=semantic==='TEXCOORD_0'?new Float32Array(rows.length*2):new sourceArray.constructor(rows.length*size);
  rows.forEach((row,index)=>{if(semantic==='TEXCOORD_0')array.set(row.uv,index*2);else array.set(sourceArray.subarray(row.sourceVertex*size,(row.sourceVertex+1)*size),index*size);});
  const view=append(Buffer.from(array.buffer,array.byteOffset,array.byteLength),34962),definition={...json.accessors[json.meshes[meshIndex].primitives[0].attributes[semantic]],bufferView:view,count:rows.length};
  delete definition.byteOffset;delete definition.sparse;delete definition.min;delete definition.max;
  if(semantic==='TEXCOORD_0'){definition.componentType=5126;definition.normalized=false;}
  if(semantic==='POSITION'){definition.min=[Infinity,Infinity,Infinity];definition.max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<array.length;i++){const axis=i%3;definition.min[axis]=Math.min(definition.min[axis],array[i]);definition.max[axis]=Math.max(definition.max[axis],array[i]);}}
  attributes[semantic]=json.accessors.length;json.accessors.push(definition);
 }
 const indexArray=rows.length<65536?Uint16Array.from(newIndices):Uint32Array.from(newIndices),indexView=append(Buffer.from(indexArray.buffer),34963),indexAccessor=json.accessors.length;
 json.accessors.push({bufferView:indexView,componentType:rows.length<65536?5123:5125,count:newIndices.length,type:'SCALAR'});
 const slots={};
 for(const kind of['base','glow','normal']){
  const data=textures[kind][plain?'png':'ktx'],view=append(data),image=json.images.length;
  json.images.push({name:material.name+'__lod_low_'+kind,bufferView:view,mimeType:plain?'image/png':'image/ktx2'});
  const template=source.json.textures[(kind==='base'?material.pbrMetallicRoughness.baseColorTexture:kind==='glow'?material.emissiveTexture:material.normalTexture).index];
  const texture={name:material.name+'__lod_low_'+kind,...(template.sampler!==undefined?{sampler:template.sampler}:{})};
  if(plain)texture.source=image;else texture.extensions={KHR_texture_basisu:{source:image}};
  slots[kind]=json.textures.length;json.textures.push(texture);
 }
 const lowMaterial=structuredClone(json.materials[json.meshes[meshIndex].primitives[0].material]);
 lowMaterial.name=material.name+'__lod_low';lowMaterial.extras={...lowMaterial.extras,perf13LOD:'low',perf13SourceMaterial:material.name,perf13AtlasSize:512,perf13NormalScale:1};
 lowMaterial.pbrMetallicRoughness.baseColorTexture={index:slots.base};lowMaterial.emissiveTexture={index:slots.glow};lowMaterial.normalTexture={index:slots.normal,scale:1};
 const materialIndex=json.materials.length;json.materials.push(lowMaterial);
 const lowMeshIndex=json.meshes.length,fullMesh=json.meshes[meshIndex];json.meshes.push({name:fullMesh.name+'__lod_low',extras:{...fullMesh.extras,perf13LOD:'low',perf13SourceMesh:meshIndex},primitives:[{attributes,indices:indexAccessor,material:materialIndex,mode:4}]});
 const sourceNodeIndex=json.nodes.findIndex(node=>node.mesh===meshIndex),node=json.nodes[sourceNodeIndex],lowNodeIndex=json.nodes.length;
 const lowNode={name:node.name+'__lod_low',mesh:lowMeshIndex,skin:node.skin,extras:{...node.extras,perf13LOD:'low',perf13SourceNode:node.name,perf13SourceMesh:meshIndex,perf13Purpose:'distance',perf13Atlas:true,perf13SourceMaterial:material.name}};
 for(const key of['translation','rotation','scale','matrix'])if(key in node)lowNode[key]=structuredClone(node[key]);
 json.nodes.push(lowNode);const parent=json.nodes.find(parent=>parent.children?.includes(sourceNodeIndex));if(parent)parent.children.push(lowNodeIndex);else for(const scene of json.scenes??[])if(scene.nodes.includes(sourceNodeIndex))scene.nodes.push(lowNodeIndex);
 json.buffers[0].byteLength=offset;json.asset.extras={...json.asset.extras,perf13AtlasLOD:{version:1,...originalCounts,source:node.name,triangles:low.length/3,vertices:rows.length}};
 const payload=Buffer.concat(chunks),bytes=emit(json,payload);await writeFile(path,bytes);
 files.push({path,sourceBytes:original.length,outputBytes:bytes.length,sha256:hash(bytes),originalBinSHA256:hash(bin),originalBinPrefixSHA256:hash(payload.subarray(0,bin.length))});
}
await writeFile(resolve(work,'receipt.json'),JSON.stringify({name,sourceTriangles:indices.length/3,triangles:low.length/3,vertices:rows.length,ratio:low.length/indices.length,simplifierError:error,sourceSHA256:hash(sourceBytes),before:bakeHost,publicationBefore:before,after:host(),bake:{...bake,loops:undefined},files,materialContract:{name:material.name+'__lod_low',sourceMaterial:material.name,map:'base',emissiveMap:'glow',normalMap:'normal',normalScale:1,otherMaterialValues:'unchanged source values; no original AO/ORM map present'}},null,2)+'\n');
console.log('Prototype assets written',files);
