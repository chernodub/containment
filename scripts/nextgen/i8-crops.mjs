#!/usr/bin/env node
/** Exact native600x400 review crops; no resizing or pixel alterations. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {decode,encode,canvas,drawText,drawImage} from './g2-png.mjs';
const base='artifacts/nextgen/',out=base+'i8/native-crops';await mkdir(out,{recursive:true});
const rows=[['armory-before','pre-lead-final2-rooms/combat-kiting-armory-02.png',1170,150],['armory-after','i8-lead-final/combat-kiting-armory-02.png',1170,150],['workshop-before','pre-lead-final2-rooms/combat-kiting-infested-workshop-03.png',930,230],['workshop-after','i8-lead-final/combat-kiting-infested-workshop-03.png',930,230],['title-before','pre-lead-final2-ui/title.png',1220,280],['title-after','i8-lead-final/title.png',1220,280],['gameplay-marine','i8-lead-final/combat-calm-armory.png',620,300]];
const records=[],sheet=canvas(1200,440*Math.ceil(rows.length/2));
for(const [i,[name,path,x,y]]of rows.entries()){
 const image=decode(await readFile(base+path)),crop=canvas(600,400);
 for(let py=0;py<400;py++)for(let px=0;px<600;px++)for(let channel=0;channel<3;channel++)crop.pixels[(py*600+px)*3+channel]=image.pixels[((py+y)*image.width+px+x)*image.channels+channel];
 const file=name+'.png';await writeFile(out+'/'+file,encode(crop));records.push({file,source:base+path,x,y,width:600,height:400});
 const sx=i%2*600,sy=Math.floor(i/2)*440;drawText(sheet,name,sx+6,sy+8,[220,235,242],2);drawImage(sheet,crop,sx,sy+40,600,400);
}
await writeFile(out+'/native-before-after.png',encode(sheet));await writeFile(out+'/manifest.json',JSON.stringify({note:'Exact source pixels at native resolution; no resampling.',records},null,2));console.log(out);
