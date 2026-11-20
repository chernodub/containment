/** Image-only GLB rewrite: resize embedded PNGs with sharp. Geometry, animation and meshopt streams stay byte-identical.
 *  Fallback for machines without the Khronos `toktx` encoder (see README): `node tools/assets/t12-textures/resize-embedded.mjs <in.glb> <out.glb> [maxSize=1024]` */
import {readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const [,,input,output,max='1024']=process.argv;
const original=await readFile(input);
const jsonLength=original.readUInt32LE(12),json=JSON.parse(original.toString('utf8',20,20+jsonLength)),bin=original.subarray(28+jsonLength);
const imageViews=new Map(json.images.map(image=>[image.bufferView,image]));
// A meshopt-compressed view keeps its bytes in the extension's range; its own range points at a fallback buffer.
const place=view=>view.extensions?.EXT_meshopt_compression??view;
const order=json.bufferViews.map((view,index)=>({view,index})).filter(({view})=>(place(view).buffer??0)===0).sort((a,b)=>(place(a.view).byteOffset??0)-(place(b.view).byteOffset??0));
const chunks=[];let offset=0;
for(const {view,index} of order){
 const where=place(view);
 let bytes=bin.subarray(where.byteOffset??0,(where.byteOffset??0)+where.byteLength);
 const image=imageViews.get(index);
 if(image?.mimeType==='image/png'){
  const meta=await sharp(bytes).metadata();
  if(Math.max(meta.width,meta.height)>+max)bytes=await sharp(bytes).resize(+max,+max,{fit:'inside',kernel:'lanczos3'}).png({compressionLevel:9,palette:false}).toBuffer();
  console.log(`${image.name}: ${meta.width}x${meta.height} ${where.byteLength} -> ${bytes.length}`);
 }
 where.byteOffset=offset;where.byteLength=bytes.length;
 const padded=Buffer.alloc((bytes.length+3)&~3);bytes.copy(padded);chunks.push(padded);offset+=padded.length;
}
json.buffers[0].byteLength=offset;
let text=Buffer.from(JSON.stringify(json));text=Buffer.concat([text,Buffer.alloc((4-text.length%4)%4,0x20)]);
const header=Buffer.alloc(12);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(12+8+text.length+8+offset,8);
const jsonHeader=Buffer.alloc(8);jsonHeader.writeUInt32LE(text.length,0);jsonHeader.writeUInt32LE(0x4e4f534a,4);
const binHeader=Buffer.alloc(8);binHeader.writeUInt32LE(offset,0);binHeader.writeUInt32LE(0x004e4942,4);
await writeFile(output,Buffer.concat([header,jsonHeader,text,binHeader,...chunks]));
console.log(`${input} ${original.length} -> ${output} ${12+8+text.length+8+offset}`);
