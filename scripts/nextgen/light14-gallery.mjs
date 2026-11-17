import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {canvas,decode,encode,drawImage,drawText} from './g2-png.mjs';
import {review480,grayscale} from './l8-review-images.mjs';
import {L8_CAPTURE_ROOMS} from './l8-capture-data.mjs';
const root=process.argv[2]??'artifacts/nextgen/light14-twenty',out='artifacts/nextgen/light14-final';
await mkdir(out,{recursive:true});
const manifest=JSON.parse(await readFile(`${root}/manifest.json`));
const references='/Users/chernodub/.t3/worktrees/containment-game/t3-41e9f511/artifacts/nextgen/final7';
for(const [name,scenario,suffix]of [['twenty-calm','combat-calm',''],['twenty-kiting','g6-kiting','-02']]){
 const sheet=canvas(2400,1176),grey=canvas(2400,1176);
 for(const [i,room]of L8_CAPTURE_ROOMS.entries()){
  const manual=scenario==='g6-kiting'&&room.id==='manual-control-chamber',tail=manual||room.id==='overload-floor',file=`${manual?'dress13-kiting':scenario}-${room.id}${manual?'-01':suffix}.png`,parent=manual?'artifacts/nextgen/light14-twenty-tail':room.id==='overload-floor'?'artifacts/nextgen/light14-twenty-overload':root,im=review480(decode(await readFile(`${parent}/${file}`))),x=i%5*480,y=Math.floor(i/5)*294;
  for(const [target,pixels]of [[sheet,im],[grey,grayscale(im)]]){drawText(target,room.id+(manual?" DRESS13-01":""),x+4,y+4,undefined,1);drawImage(target,pixels,x,y+24,480,270);}
 }
 await writeFile(`${out}/${name}.png`,encode(sheet));await writeFile(`${out}/${name}-grey.png`,encode(grey));
 await copyFile(`${references}/${name}.png`,`${out}/final7-${name}.png`);
}
await writeFile(`${out}/twenty-source.json`,JSON.stringify({root,source:manifest.gitSHA,errors:manifest.errors,failures:manifest.failures,reference:references,manualFixture:"First verified DRESS13 20-contact 300ms frame; later frames failed warning HUD guard in both G6 and DRESS13. Other kiting rows are ordinary G6 frame02."},null,2));
await writeFile(`${out}/index.html`,'<!doctype html><meta charset="utf-8"><title>LIGHT14 review</title><style>body{background:#101820;color:#ddd;font:16px system-ui}img{max-width:100%}</style><h1>LIGHT14</h1>'+['twenty-calm','twenty-kiting'].map(n=>`<h2>${n}</h2><img src="${n}.png"><h3>final7 historical reference</h3><img src="final7-${n}.png">`).join(''));
