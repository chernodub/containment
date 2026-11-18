import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {canvas,decode,encode,drawImage,drawText} from './g2-png.mjs';
import {review480} from './l8-review-images.mjs';
const root='artifacts/nextgen/light14-final/raw/impacts-final',out='artifacts/nextgen/light14-final';
const ids=['ram','seismic-slam','bulwark','railbreaker','frost-trail','cryo-nova','glacier','whiteout','afterburn','flashfire','napalm-charge','meltdown','static-step','overload','tesla-pylon','overclock'];
await mkdir(out,{recursive:true});
for(const room of (process.argv.length>2?process.argv.slice(2):['containment-annulus','infested-workshop']))for(const frame of ['03','05']){
 const sheet=canvas(1920,1176);
 for(const [i,id]of ids.entries()){
  const im=review480(decode(await readFile(`${root}/v2-${id}-${room}-${room}-${frame}.png`))),x=i%4*480,y=Math.floor(i/4)*294;
  drawText(sheet,`${id} phase${frame}`,x+4,y+4,undefined,1);drawImage(sheet,im,x,y+24,480,270);
 }
 await writeFile(`${out}/impacts-${room}-${frame}.png`,encode(sheet));
}
const sheet=canvas(960,588);
for(const [i,file]of ['title.png','g2-calm-low-awakening-bay.png','g2-calm-low-freight-hold.png','g2-calm-low-swarm-junction.png'].entries()){
 const im=review480(decode(await readFile(`${root}/${file}`))),x=i%2*480,y=Math.floor(i/2)*294;
 drawText(sheet,file,x+4,y+4,undefined,1);drawImage(sheet,im,x,y+24,480,270);
}
await writeFile(`${out}/low-and-title.png`,encode(sheet));
