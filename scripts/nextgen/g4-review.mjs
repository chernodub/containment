import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { decode, canvas, drawImage, drawText, encode } from './g2-png.mjs';

// Run x3-review first: these contacts use its exact area-reduced480×270 pixels.
const dir=resolve(process.argv[2]??'artifacts/nextgen/g4-final');
const manifest=JSON.parse(await readFile(resolve(dir,'manifest.json'),'utf8'));
await mkdir(resolve(dir,'critique'),{recursive:true});
for(let start=0;start<manifest.shots.length;start+=12){
  const page=manifest.shots.slice(start,start+12),sheet=canvas(1440,Math.ceil(page.length/3)*296);
  for(let n=0;n<page.length;n++){
    const x=n%3*480,y=Math.floor(n/3)*296;
    drawText(sheet,page[n].file,x+5,y+4,undefined,1);
    const source=decode(await readFile(resolve(dir,'review480',page[n].file)));
    if(source.width!==480||source.height!==270)throw Error('Review frame has wrong dimensions');
    drawImage(sheet,source,x,y+25,480,270);
  }
  await writeFile(resolve(dir,'critique',String(start/12+1).padStart(2,'0')+'.png'),encode(sheet));
}
console.log(`${manifest.shots.length} native frames represented in ${Math.ceil(manifest.shots.length/12)} exact480 PNG contacts; ${manifest.failures.length} capture failures retained in manifest`);
