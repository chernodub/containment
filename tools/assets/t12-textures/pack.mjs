/** Deterministic image-only GLB rewrite. Geometry, animation and meshopt streams remain byte-identical. */
import {readFile,writeFile,mkdir,mkdtemp,rm,rename} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const source=resolve(process.argv[2]??'public/assets/models'),target='public/assets/models';
const encoder=process.env.TOKTX??'toktx',names=['marine','dretch','basilisk','marauder','dragoon','tyrant','pistol','rifle','shotgun','plasma','rocket'];
const receipt=[];await mkdir(target+'/plain',{recursive:true});
let rewritten=0;
async function replaceIfChanged(path,bytes){
 try{if(bytes.equals(await readFile(path)))return;}
 catch(error){if(error.code!=='ENOENT')throw error;}
 const staged=path+'.'+process.pid+'.tmp';
 try{await writeFile(staged,bytes);await rename(staged,path);}
 finally{await rm(staged,{force:true});}
 rewritten++;
 console.log('Rewrote '+path);
}
const temp=await mkdtemp(join(tmpdir(),'t12-pack-'));
try{for(const name of names){
 const original=await readFile(join(source,name+'.glb'));
 const len=original.readUInt32LE(12),json=JSON.parse(original.toString('utf8',20,20+len)),bin=original.subarray(28+len);
 // Treat a packed model as the current shipping output. Its older PNG
 // fallback or an unrelated cache cannot safely reconstruct its source.
 if(json.extensionsUsed?.includes('KHR_texture_basisu')){
  console.log('Already packed: '+join(source,name+'.glb'));
  continue;
 }
 const originalViews=structuredClone(json.bufferViews);
 const ranges=json.images.map(i=>{const v=json.bufferViews[i.bufferView];return [v.byteOffset??0,(v.byteOffset??0)+((v.byteLength+3)&~3)];}).sort((a,b)=>a[0]-b[0]);
 const unique=ranges.filter((r,i)=>!i||r[0]!==ranges[i-1][0]);
 const shift=p=>p-unique.reduce((s,[a,b])=>s+(b<=p?b-a:0),0);
 const chunks=[];let pos=0;for(const[a,b]of unique){chunks.push(bin.subarray(pos,a));pos=b;}chunks.push(bin.subarray(pos));const core=Buffer.concat(chunks);
 // Only buffer 0 is the physical GLB BIN chunk. Meshopt's virtual fallback
 // buffer offsets describe decoded data and must stay verbatim.
 for(const v of json.bufferViews){if((v.buffer??0)===0)v.byteOffset=shift(v.byteOffset??0);const e=v.extensions?.EXT_meshopt_compression;if(e&&(e.buffer??0)===0)e.byteOffset=shift(e.byteOffset??0);}
 const images=[],stats=[];
 const normalSources=new Set(),linearSources=new Set(),colourSources=new Set();
 const mark=(set,slot)=>{if(slot){const index=json.textures?.[slot.index]?.source;if(index!==undefined)set.add(index);}};
 for(const material of json.materials??[]){mark(normalSources,material.normalTexture);mark(linearSources,material.normalTexture);mark(linearSources,material.occlusionTexture);mark(linearSources,material.pbrMetallicRoughness?.metallicRoughnessTexture);mark(colourSources,material.pbrMetallicRoughness?.baseColorTexture);mark(colourSources,material.emissiveTexture);}
 const emissionSources=new Set();for(const material of json.materials??[])mark(emissionSources,material.emissiveTexture);
 for(const[index,image]of json.images.entries()){
  const [a,b]=ranges.find(r=>r[0]===(originalViews[image.bufferView].byteOffset??0))??[];
  if(a===undefined)throw Error('Missing image range');
  const input=join(temp,index+'.png');await writeFile(input,bin.subarray(a,b));
  const normal=normalSources.has(index),aux=linearSources.has(index)||emissionSources.has(index);
  if(linearSources.has(index)&&colourSources.has(index))throw Error('Image shared between colour and data slots needs separate sources: '+name+' / '+index);
  if(bin.toString('ascii',a+1,a+4)!=='PNG')throw Error('Expected generated PNG source image: '+name+' / '+index);
  // Never upsample an authored small map.
  const dimensions=bin.subarray(a,b);
  const sourceWidth=dimensions.readUInt32BE(16),sourceHeight=dimensions.readUInt32BE(20);
  const limit=name==='marine'?(aux?512:1024):['dretch','basilisk'].includes(name)?512:['marauder','dragoon','tyrant'].includes(name)?(aux?512:1024):(normal||name==='pistol'?256:512);
  execFileSync('sips',['-Z',String(Math.min(limit,Math.max(sourceWidth,sourceHeight))),input],{stdio:'ignore'});
  const plain=await readFile(input),output=join(temp,index+'.ktx2');
  const srgb=colourSources.has(index);const uastc=normal||(name==='marine'&&!aux);
  execFileSync(encoder,['--t2','--genmipmap','--encode',uastc?'uastc':'etc1s','--assign_oetf',srgb?'srgb':'linear',...(uastc?['--uastc_quality','4','--zcmp','18']:['--qlevel','255','--clevel','5']),'--threads','4',output,input],{stdio:'inherit'});
  const compressed=await readFile(output);images.push({plain,compressed});const w=plain.readUInt32BE(16),h=plain.readUInt32BE(20);let texels=0;for(let x=w,y=h;;x=Math.max(1,x>>1),y=Math.max(1,y>>1)){texels+=x*y;if(x===1&&y===1)break;}
  stats.push({name:image.name,width:w,height:h,encoding:uastc?'UASTC':'ETC1S',beforeImageBytes:b-a,plainBytes:plain.length,ktxBytes:compressed.length,rgbaMipBytes:texels*4,compressedMipBytes8bppUpper:Array.from({length:Math.floor(Math.log2(Math.max(w,h)))+1},(_,level)=>Math.ceil(Math.max(1,w>>level)/4)*Math.ceil(Math.max(1,h>>level)/4)*16).reduce((a,b)=>a+b,0)});
 }
 function emit(compressed){const j=structuredClone(json),parts=[core];let offset=core.length;for(const[i,img]of j.images.entries()){const pad=(4-offset%4)%4;parts.push(Buffer.alloc(pad));offset+=pad;const data=compressed?images[i].compressed:images[i].plain;const v=j.bufferViews[img.bufferView];v.byteOffset=offset;v.byteLength=data.length;img.mimeType=compressed?'image/ktx2':'image/png';delete img.uri;parts.push(data);offset+=data.length;}
 if(compressed){j.extensionsUsed=[...new Set([...(j.extensionsUsed??[]),'KHR_texture_basisu'])];j.extensionsRequired=[...new Set([...(j.extensionsRequired??[]),'KHR_texture_basisu'])];for(const t of j.textures){t.extensions={...t.extensions,KHR_texture_basisu:{source:t.source}};delete t.source;}}
 j.buffers[0].byteLength=offset;const payload=Buffer.concat(parts),jb=Buffer.from(JSON.stringify(j)),jp=(4-jb.length%4)%4,bp=(4-payload.length%4)%4,head=Buffer.alloc(20);head.writeUInt32LE(0x46546c67);head.writeUInt32LE(2,4);head.writeUInt32LE(28+jb.length+jp+payload.length+bp,8);head.writeUInt32LE(jb.length+jp,12);head.writeUInt32LE(0x4e4f534a,16);const bh=Buffer.alloc(8);bh.writeUInt32LE(payload.length+bp);bh.writeUInt32LE(0x004e4942,4);return Buffer.concat([head,jb,Buffer.alloc(jp,32),bh,payload,Buffer.alloc(bp)]);}
 const plain=emit(false),packed=emit(true);await replaceIfChanged(join(target,'plain',name+'.glb'),plain);await replaceIfChanged(join(target,name+'.glb'),packed);receipt.push({name,beforeBytes:original.length,afterBytes:packed.length,fallbackBytes:plain.length,textures:stats});
}
 await mkdir('public/assets/basis',{recursive:true});for(const f of ['basis_transcoder.js','basis_transcoder.wasm'])await replaceIfChanged('public/assets/basis/'+f,await readFile('node_modules/three/examples/jsm/libs/basis/'+f));
 if(receipt.length){
  const receiptDir='artifacts/nextgen/t12-final',receiptPath=join(receiptDir,'packing.json');
  let previous=[];
  try{previous=JSON.parse(await readFile(receiptPath,'utf8'));}
  catch(error){if(error.code!=='ENOENT')throw error;}
  const rows=new Map([...previous,...receipt].map(row=>[row.name,row]));
  await mkdir(receiptDir,{recursive:true});
  await writeFile(receiptPath,JSON.stringify(names.flatMap(name=>rows.has(name)?[rows.get(name)]:[]),null,2));
 }
}finally{await rm(temp,{recursive:true,force:true});console.log(`${rewritten} shipping files rewritten`);}
