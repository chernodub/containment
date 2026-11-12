#!/usr/bin/env node
/** Pair requested original/final native captures; absent original views stay visibly labelled. */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {canvas,decode,drawImage,drawText,encode} from './g2-png.mjs';
const base=resolve('artifacts/nextgen/baseline'),final=resolve('artifacts/nextgen/final');
const rooms=['awakening-bay','communal-atrium','armory','relay-racks','infested-workshop','containment-annulus','overload-floor'];
const pairs=['title','starting-boon','route','pause','dead'].map(id=>[id,`${id}.png`,`${id}.png`]);
for(const room of rooms){pairs.push([`${room} CALM`,`combat-calm-${room}.png`,`combat-calm-${room}.png`]);pairs.push([`${room} HEAVY`,`combat-heavy-${room}-03.png`,`combat-heavy-${room}-03.png`]);}
pairs.push(['QUEEN ARMORED','boss-reactor-vault-01.png','boss-reactor-vault-01.png']);
pairs.push(['QUEEN EXPOSED (original phase unavailable)','boss-reactor-vault-04.png','g2-queen-exposed-reactor-vault-04.png']);
const sheet=canvas(1920,Math.ceil(pairs.length/2)*306),provenance=[];
for(const [i,[name,before,after]]of pairs.entries()){
 const x=i%2*960,y=Math.floor(i/2)*306;drawText(sheet,name,x+5,y+4,[222,235,240],1);
 for(const [side,[dir,file]]of [[base,before],[final,after]].entries()){
  const path=resolve(dir,file);drawText(sheet,side?'FINAL':'ORIGINAL',x+side*480+5,y+17,[152,197,215],1);
  try{drawImage(sheet,decode(await readFile(path)),x+side*480,y+32,480,270);provenance.push({name,side,path});}
  catch(error){drawText(sheet,'NOT CAPTURED IN ORIGINAL GALLERY',x+side*480+8,y+100,[255,155,130],1);provenance.push({name,side,path,missing:String(error)});}
 }
}
await writeFile(resolve(final,'before-after.png'),encode(sheet));
await writeFile(resolve(final,'before-after.json'),JSON.stringify({note:'Matched native fixtures except exposed Queen: the original gallery has no exposed-phase capture; its last armored combat frame is explicitly labelled. Gallery pixels are original, resized only for this sheet.',pairs:provenance},null,2)+'\n');
console.log(resolve(final,'before-after.png'));
