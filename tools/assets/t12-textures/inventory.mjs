/** Offline payload inventory; GPU estimates assume decoded RGBA8 and a full mip chain. */
import {readdir,readFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
function size(b){
 if(b[0]===171&&b.toString('ascii',1,7)==='KTX 20')return[b.readUInt32LE(20),b.readUInt32LE(24),'KTX2'];
 if(b.toString('ascii',1,4)==='PNG')return [b.readUInt32BE(16),b.readUInt32BE(20),'PNG'];
 if(b[0]===255&&b[1]===216){let p=2;while(p<b.length){if(b[p++]!==255)continue;const m=b[p++];if(m===216||m===217)continue;const n=b.readUInt16BE(p);if([192,193,194].includes(m))return[b.readUInt16BE(p+5),b.readUInt16BE(p+3),'JPEG'];p+=n;}}
 return [null,null,'unknown'];
}
const rows=[],models=[];
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const path=join(dir,e.name);if(e.isDirectory()){await walk(path);continue;}if(!/\.(glb|png|jpe?g)$/i.test(path))continue;const b=await readFile(path);if(path.endsWith('.glb')){const j=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));models.push({path,bytes:b.length});const start=28+b.readUInt32LE(12);for(const [index,img] of (j.images??[]).entries()){if(img.bufferView===undefined)continue;const v=j.bufferViews[img.bufferView];add(path+'#'+index,b.subarray(start+(v.byteOffset??0),start+(v.byteOffset??0)+v.byteLength),img.name);}}else add(path,b);}}
function add(path,b,name=''){const [width,height,format]=size(b);let gpuBytes=0,mips=0;if(width&&height)for(let w=width,h=height;;w=Math.max(1,w>>1),h=Math.max(1,h>>1)){gpuBytes+=w*h*4;mips++;if(w===1&&h===1)break;}rows.push({path,name,width,height,format,mips,gpuBytes:width&&format!=='KTX2'?gpuBytes:null,fileBytes:b.length});}
await walk('public/assets');
const out=process.argv[2]??'artifacts/nextgen/t12-final';await mkdir(out,{recursive:true});await writeFile(join(out,'inventory.json'),JSON.stringify({note:'Folder inventory, not runtime residency. Includes unused assets; excludes UI outside public/assets. GPU is decoded RGBA8 estimate, not driver allocation.',models,textures:rows},null,2));
await writeFile(join(out,'inventory.md'),'| Image | Size | Format | Mips | GPU bytes (RGBA8) | File bytes |\n|---|---:|---|---:|---:|---:|\n'+rows.map(r=>`| ${r.path} | ${r.width}×${r.height} | ${r.format} | ${r.mips} | ${r.gpuBytes} | ${r.fileBytes} |`).join('\n')+'\n');console.log(`${rows.length} images, ${models.length} GLBs`);
