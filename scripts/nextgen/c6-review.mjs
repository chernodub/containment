#!/usr/bin/env node
/** Raster-only review: saved camera matrices yield exact hull/HUD overlays. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {Matrix4,Vector3} from 'three';
import {decode,encode,canvas,drawImage,drawText} from './g2-png.mjs';
const root=resolve(process.argv[2]),out=resolve(root,'review');
await mkdir(out,{recursive:true});
const manifest=JSON.parse(await readFile(resolve(root,'manifest.json'),'utf8'));
function line(image,a,b,color){
 const distance=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y));
 for(let n=0;n<=distance;n++)for(let ox=-1;ox<=1;ox++)for(let oy=-1;oy<=1;oy++){
  const x=Math.round(a.x+(b.x-a.x)*n/distance)+ox,y=Math.round(a.y+(b.y-a.y)*n/distance)+oy;
  if(x<0||y<0||x>=image.width||y>=image.height)continue;
  const i=(y*image.width+x)*image.channels;for(let c=0;c<3;c++)image.pixels[i+c]=color[c];
 }
}
const rows=[];
for(const shot of manifest.shots.filter(s=>s.file.startsWith('c6-kiting-'))){
 const e=shot.evidence,proof=e.g6FramingProof,p=e.playfieldProjection;
 if(!p||!proof)throw Error('C6 projection receipt missing '+shot.file);
 const source=decode(await readFile(resolve(root,shot.file))),overlay=canvas(source.width,source.height);
 drawImage(overlay,source,0,0,source.width,source.height);
 const matrix=new Matrix4().fromArray(p.inverseProjection).invert().multiply(new Matrix4().fromArray(p.world).invert());
 const hull=p.boundary.map(v=>{const point=new Vector3(v.x/32,0,v.y/32).applyMatrix4(matrix);return{x:(point.x+1)*source.width*.5,y:(1-point.y)*source.height*.5};});
 for(let n=0;n<hull.length;n++)line(overlay,hull[n],hull[(n+1)%hull.length],[255,182,70]);
 const i=proof.insets,v=proof.viewport,rect=[{x:i.left,y:i.top},{x:v.width-i.right,y:i.top},{x:v.width-i.right,y:v.height-i.bottom},{x:i.left,y:v.height-i.bottom}];
 for(let n=0;n<4;n++)line(overlay,rect[n],rect[(n+1)%4],[65,245,218]);
 drawText(overlay,'AMBER PLAYABLE HULL / CYAN USABLE VIEW',i.left+12,i.top+16,[65,245,218],2);
 await writeFile(resolve(out,'bounds-'+shot.file),encode(overlay));
 rows.push({file:shot.file,marinePixels:e.marineBounds.bottom-e.marineBounds.top,insets:i,hull,framing:proof.framing});
}
await writeFile(resolve(out,'c6-framing.json'),JSON.stringify(rows,null,2));
console.log(`C6 offline hull/usable overlays: ${rows.length}`);
// Four native-action phases per room, saved at exact480x270 for critique.
const rooms=[...new Set(rows.map(r=>r.file.replace(/^c6-kiting-/,'').replace(/-\d\d.png$/,'')))];
for(const room of rooms){
 const frames=rows.filter(r=>r.file.startsWith('c6-kiting-'+room+'-')).sort((a,b)=>a.file.localeCompare(b.file));
 const sheet=canvas(480*frames.length,300);
 for(let n=0;n<frames.length;n++){const image=decode(await readFile(resolve(out,'480-'+frames[n].file)));drawImage(sheet,image,n*480,0,480,270);drawText(sheet,room+' F'+(n+1),n*480+8,278,undefined,1);}
 await writeFile(resolve(out,room+'-kiting480-sprite.png'),encode(sheet));
}
const roomSheet=canvas(1920,600*Math.ceil(rooms.length/8));
for(let n=0;n<rooms.length;n++){
 const row=rows.find(r=>r.file===`c6-kiting-${rooms[n]}-04.png`);if(!row)continue;
 drawImage(roomSheet,decode(await readFile(resolve(out,'480-'+row.file))),n%4*480,Math.floor(n/4)*300,480,270);drawText(roomSheet,rooms[n],n%4*480+8,Math.floor(n/4)*300+278,undefined,1);
}
await writeFile(resolve(out,'eight-rooms480.png'),encode(roomSheet));
