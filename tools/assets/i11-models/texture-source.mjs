/** Recover PNG packing sources with exact committed geometry, never stale-cache geometry. */
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';

const destination = resolve(process.argv[2] ?? 'artifacts/nextgen/perf13-texture-source');
const pngArgument = process.argv[3] ?? '-';
const pngRoot = pngArgument === '-' ? null : resolve(pngArgument);
const revision = process.argv[4] ?? 'HEAD';
const names = ['marine','dretch','basilisk','marauder','dragoon','tyrant','pistol','rifle','shotgun','plasma','rocket'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const parse = bytes => {
  const length = bytes.readUInt32LE(12);
  return {json: JSON.parse(bytes.toString('utf8',20,20+length)),
    bin: bytes.subarray(28+length,28+length+bytes.readUInt32LE(20+length))};
};
function emit(json, bin) {
  const text=Buffer.from(JSON.stringify(json)),jp=(4-text.length%4)%4,bp=(4-bin.length%4)%4;
  const header=Buffer.alloc(20),binaryHeader=Buffer.alloc(8);
  header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+text.length+jp+bin.length+bp,8);
  header.writeUInt32LE(text.length+jp,12);header.writeUInt32LE(0x4e4f534a,16);
  binaryHeader.writeUInt32LE(bin.length+bp);binaryHeader.writeUInt32LE(0x004e4942,4);
  return Buffer.concat([header,text,Buffer.alloc(jp,32),binaryHeader,bin,Buffer.alloc(bp)]);
}
await mkdir(destination,{recursive:true});
const receipt=[];
for(const name of names){
  const committed=execFileSync('git',['show',`${revision}:public/assets/models/${name}.glb`],{maxBuffer:64*1024*1024});
  const {json,bin}=parse(committed),source=parse(pngRoot
    ? await readFile(resolve(pngRoot,name+'.glb'))
    : execFileSync('git',['show',`${revision}:public/assets/models/plain/${name}.glb`],{maxBuffer:64*1024*1024}));
  const images=source.json.images.map(image=>{
    const view=source.json.bufferViews[image.bufferView];
    return {name:image.name,mimeType:image.mimeType,bytes:source.bin.subarray(view.byteOffset??0,(view.byteOffset??0)+view.byteLength)};
  });
  const ranges=json.images.map(image=>{const view=json.bufferViews[image.bufferView];return[view.byteOffset??0,(view.byteOffset??0)+((view.byteLength+3)&~3)];}).sort((a,b)=>a[0]-b[0]);
  const unique=ranges.filter((range,index)=>!index||range[0]!==ranges[index-1][0]);
  const shift=offset=>offset-unique.reduce((sum,[start,end])=>sum+(end<=offset?end-start:0),0);
  const parts=[];let cursor=0;
  for(const[start,end]of unique){parts.push(bin.subarray(cursor,start));cursor=end;}
  parts.push(bin.subarray(cursor));const geometryCore=Buffer.concat(parts);
  for(const view of json.bufferViews){if((view.buffer??0)===0)view.byteOffset=shift(view.byteOffset??0);const ext=view.extensions?.EXT_meshopt_compression;if(ext&&(ext.buffer??0)===0)ext.byteOffset=shift(ext.byteOffset??0);}
  const chunks=[geometryCore];let offset=geometryCore.length;
  for(const[index,image]of json.images.entries()){
    const input=images.find(candidate=>candidate.name===image.name)??images[index];
    if(!input||input.mimeType!=='image/png'||(image.name&&input.name!==image.name))throw Error('Unmatched original PNG image: '+name+'/'+image.name);
    const padding=(4-offset%4)%4;chunks.push(Buffer.alloc(padding),input.bytes);offset+=padding;
    const view=json.bufferViews[image.bufferView];view.byteOffset=offset;view.byteLength=input.bytes.length;offset+=input.bytes.length;
    image.mimeType='image/png';delete image.uri;
  }
  for(const texture of json.textures??[]){if(texture.extensions?.KHR_texture_basisu){texture.source=texture.extensions.KHR_texture_basisu.source;delete texture.extensions.KHR_texture_basisu;if(!Object.keys(texture.extensions).length)delete texture.extensions;}}
  json.extensionsUsed=json.extensionsUsed?.filter(name=>name!=='KHR_texture_basisu');
  json.extensionsRequired=json.extensionsRequired?.filter(name=>name!=='KHR_texture_basisu');
  json.buffers[0].byteLength=offset;
  const bytes=emit(json,Buffer.concat(chunks));await writeFile(resolve(destination,name+'.glb'),bytes);
  receipt.push({name,revision,committedSHA256:hash(committed),geometryCoreSHA256:hash(geometryCore),pngSourceSHA256:hash(bytes),pngSource:pngRoot??`${revision}:public/assets/models/plain/`,geometryPolicy:'Committed meshopt/animation/skin streams copied byte-for-byte; image ranges replaced only'});
}
await writeFile(resolve(destination,'source-receipt.json'),JSON.stringify(receipt,null,2)+'\n');
console.log('Recovered '+names.length+' PNG sources at '+destination);
