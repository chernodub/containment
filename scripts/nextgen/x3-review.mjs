#!/usr/bin/env node
/** Area-reduce every accepted X3 capture to the requested 480×270 review size. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {decode,encode,canvas} from './g2-png.mjs';
const root=resolve(process.argv[2]);
const manifest=JSON.parse(await readFile(resolve(root,'manifest.json'),'utf8'));
const out=resolve(root,'review480');
await mkdir(out,{recursive:true});
for(const shot of manifest.shots) {
  const source=decode(await readFile(resolve(root,shot.file))),thumb=canvas(480,270);
  for(let y=0;y<270;y++) for(let x=0;x<480;x++) {
    const x0=Math.floor(x*source.width/480),x1=Math.floor((x+1)*source.width/480);
    const y0=Math.floor(y*source.height/270),y1=Math.floor((y+1)*source.height/270);
    for(let c=0;c<3;c++) {
      let sum=0;
      for(let sy=y0;sy<y1;sy++) for(let sx=x0;sx<x1;sx++) sum+=source.pixels[(sy*source.width+sx)*source.channels+c];
      thumb.pixels[(y*480+x)*3+c]=Math.round(sum/((x1-x0)*(y1-y0)));
    }
  }
  await writeFile(resolve(out,shot.file),encode(thumb));
}
console.log(`${manifest.shots.length} exact 480×270 review frames: ${out}`);
