/** File-only paired texture review. Native crops preserve pixels; 480s use the existing exact-area tool. */
import{readFile,writeFile,mkdir}from'node:fs/promises';import{resolve}from'node:path';
import{canvas,decode,encode,drawImage,drawText}from'./g2-png.mjs';
const [before,after,out]=process.argv.slice(2).map(p=>resolve(p));await mkdir(out,{recursive:true});
const a=JSON.parse(await readFile(resolve(before,'manifest.json'))),b=JSON.parse(await readFile(resolve(after,'manifest.json'))),receipts=[];
for(const s of a.shots){const t=b.shots.find(t=>t.file===s.file);if(!t)continue;
 const bounds=s.evidence.state!=='playing'?[{left:0,right:1920,top:0,bottom:1080}]:[s,t].flatMap(s=>s.evidence.g5Proof?.k11?s.evidence.g5Proof.projected.filter(p=>p.name!=='marine').map(p=>({left:p.x-170,right:p.x+170,top:p.y-180,bottom:p.y+180})):[s.evidence.marineBounds??{left:0,right:1920,top:0,bottom:1080}]);
 const padding=s.file.startsWith('t12-')?180:16;
 const left=Math.max(0,Math.floor(Math.min(...bounds.map(b=>b.left))-padding)),right=Math.min(1920,Math.ceil(Math.max(...bounds.map(b=>b.right))+padding)),top=Math.max(0,Math.floor(Math.min(...bounds.map(b=>b.top))-padding)),bottom=Math.min(1080,Math.ceil(Math.max(...bounds.map(b=>b.bottom))+padding)),w=right-left,h=bottom-top;
 const native=canvas(w*2,h+20),small=canvas(960,290);
 for(const[index,root]of[before,after].entries()){const image=decode(await readFile(resolve(root,s.file))),crop=canvas(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++)for(let c=0;c<3;c++)crop.pixels[(y*w+x)*3+c]=image.pixels[((top+y)*image.width+left+x)*image.channels+c];drawImage(native,crop,index*w,20,w,h);drawText(native,index?'AFTER':'BEFORE',index*w+4,4,undefined,1);const thumb=decode(await readFile(resolve(root,'review480',s.file)));drawImage(small,thumb,index*480,20,480,270);drawText(small,index?'AFTER':'BEFORE',index*480+4,4,undefined,1);}
 await writeFile(resolve(out,'native-'+s.file),encode(native));await writeFile(resolve(out,'480-'+s.file),encode(small));receipts.push({file:s.file,before:resolve(before,s.file),after:resolve(after,s.file),nativeCrop:{left,top,right,bottom},note:'No scaling, alignment or color changes to native crops; exact480s copied from u9-review.'});
}await writeFile(resolve(out,'pairs.json'),JSON.stringify(receipts,null,2));console.log(receipts.length+' pairs');
