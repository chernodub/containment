/** File-only exact480 contact for the three-room standard. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {decode,encode,canvas,drawText,drawImage} from './g2-png.mjs';
const round=process.argv[2],dir=resolve(`artifacts/nextgen/l8-standard-round${round}`),out=resolve('artifacts/nextgen/l8-standard');
await mkdir(out,{recursive:true});
const sheet=canvas(1920,6*296);
const rooms=['residential-gallery','crew-checkpoint','relay-racks'];
for(const [i,room]of rooms.entries())for(const [j,mode]of ['combat-calm','g6-kiting'].entries()){
 const row=j*3+i,file=`${mode}-${room}${j?'-02':''}.png`;
 drawText(sheet,`ROUND ${round}: ${room} ${mode} / NATIVE480 - GRAY480`,6,row*296+5,undefined,1);
 for(const [k,p]of [`review480/${file}`,`grayscale/480-${file}`].entries())drawImage(sheet,decode(await readFile(resolve(dir,p))),k*480,row*296+24,480,270);
 const plan=decode(await readFile(resolve(out,`round${process.argv[3]??round}-plans`,room+'.png')));drawImage(sheet,plan,960,row*296+24,600,270);
}
await writeFile(resolve(out,`round${round}-contact.png`),encode(sheet));
