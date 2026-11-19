/** Brood normal-atlas shipping conversion. Source meshes and non-image bytes stay unchanged. */
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const directory='public/assets/brood-growth', encoder=process.env.TOKTX??'toktx';
for(const asset of (process.argv.includes('--pod-only')?['brood-pod']:['brood-growth','brood-pod'])){
const original=await readFile(directory+'/'+asset+'.glb');
const jsonLength=original.readUInt32LE(12),json=JSON.parse(original.toString('utf8',20,20+jsonLength)),bin=original.subarray(28+jsonLength);
if(json.images.length!==1||json.images[0].mimeType!=='image/png')throw Error('Expected one embedded Brood PNG normal atlas');
const image=json.images[0],view=json.bufferViews[image.bufferView],start=view.byteOffset??0,end=start+((view.byteLength+3)&~3),source=bin.subarray(start,start+view.byteLength);
const temp=await mkdtemp(join(tmpdir(),'dress13-brood-'));
try{
 const input=join(temp,'normal.png'),output=join(temp,'normal.ktx2');await writeFile(input,source);
 execFileSync(encoder,['--t2','--genmipmap','--encode','uastc','--uastc_quality','4','--zcmp','18','--assign_oetf','linear','--threads','4',output,input],{stdio:'inherit'});
 let rgbaMipBytes=0,compressedMipBytes=0;for(let w=source.readUInt32BE(16),h=source.readUInt32BE(20);;w=Math.max(1,w>>1),h=Math.max(1,h>>1)){rgbaMipBytes+=w*h*4;compressedMipBytes+=Math.ceil(w/4)*Math.ceil(h/4)*16;if(w===1&&h===1)break;}
 const packed=await readFile(output),core=Buffer.concat([bin.subarray(0,start),bin.subarray(end)]);
 const shift=p=>p>=end?p-(end-start):p;
 for(const v of json.bufferViews){if((v.buffer??0)===0)v.byteOffset=shift(v.byteOffset??0);const e=v.extensions?.EXT_meshopt_compression;if(e&&(e.buffer??0)===0)e.byteOffset=shift(e.byteOffset??0);}
 const pad=(4-core.length%4)%4;view.byteOffset=core.length+pad;view.byteLength=packed.length;
 image.mimeType='image/ktx2';
 json.extensionsUsed=[...new Set([...(json.extensionsUsed??[]),'KHR_texture_basisu'])];json.extensionsRequired=[...new Set([...(json.extensionsRequired??[]),'KHR_texture_basisu'])];
 for(const t of json.textures){t.extensions={...t.extensions,KHR_texture_basisu:{source:t.source}};delete t.source;}
 const payload=Buffer.concat([core,Buffer.alloc(pad),packed]);json.buffers[0].byteLength=payload.length;
 const jb=Buffer.from(JSON.stringify(json)),jp=(4-jb.length%4)%4,bp=(4-payload.length%4)%4,head=Buffer.alloc(20),bh=Buffer.alloc(8);
 head.writeUInt32LE(0x46546c67);head.writeUInt32LE(2,4);head.writeUInt32LE(28+jb.length+jp+payload.length+bp,8);head.writeUInt32LE(jb.length+jp,12);head.writeUInt32LE(0x4e4f534a,16);bh.writeUInt32LE(payload.length+bp);bh.writeUInt32LE(0x004e4942,4);
 const result=Buffer.concat([head,jb,Buffer.alloc(jp,32),bh,payload,Buffer.alloc(bp)]);await writeFile(directory+'/'+asset+'-ktx.glb',result);
 await writeFile(directory+'/'+(asset==='brood-growth'?'shipping.json':'shipping-pod.json'),JSON.stringify({source:asset+'.glb',compressed:asset+'-ktx.glb',normalAtlas:{width:source.readUInt32BE(16),height:source.readUInt32BE(20),encoding:'UASTC quality 4, linear, Zstd 18, full mip chain',pngBytes:source.length,ktxBytes:packed.length,rgba8MipBytes:rgbaMipBytes,compressed8bppMipBytes:compressedMipBytes},sourceBytes:original.length,compressedBytes:result.length,rebuild:'TOKTX=/path/to/toktx node tools/assets/t12-textures/pack-brood.mjs'},null,2)+'\n');
 console.log('Brood GLB',original.length,'->',result.length,'bytes; normal atlas',source.length,'->',packed.length,'bytes');
}finally{await rm(temp,{recursive:true,force:true});}

}
