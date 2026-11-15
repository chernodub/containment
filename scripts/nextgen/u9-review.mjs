#!/usr/bin/env node
/** Exact area reductions and hashed review contacts; no browser or image synthesis. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {canvas,decode,encode,drawImage,drawText} from './g2-png.mjs';
const roots=process.argv.slice(2).map(path=>resolve(path));
for(const root of roots) {
  const manifest=JSON.parse(await readFile(resolve(root,'manifest.json'),'utf8'));
  const out=resolve(root,'review480');await mkdir(out,{recursive:true});
  const contact=canvas(480*3,294*Math.ceil(manifest.shots.length/3)),receipts=[];
  for(const [index,shot] of manifest.shots.entries()) {
    const source=resolve(root,shot.file),bytes=await readFile(source),src=decode(bytes),thumb=canvas(480,270);
    // Integrate fractional pixel areas, including non-integer 1280→480 reductions.
    for(let y=0;y<270;y++)for(let x=0;x<480;x++) {
      const x0=x*src.width/480,x1=(x+1)*src.width/480,y0=y*src.height/270,y1=(y+1)*src.height/270;
      const sums=[0,0,0];let weight=0;
      for(let sy=Math.floor(y0);sy<Math.ceil(y1);sy++)for(let sx=Math.floor(x0);sx<Math.ceil(x1);sx++) {
        const w=(Math.min(x1,sx+1)-Math.max(x0,sx))*(Math.min(y1,sy+1)-Math.max(y0,sy));weight+=w;
        for(let c=0;c<3;c++)sums[c]+=src.pixels[(sy*src.width+sx)*src.channels+c]*w;
      }
      for(let c=0;c<3;c++)thumb.pixels[(y*480+x)*3+c]=Math.round(sums[c]/weight);
    }
    const reduced=encode(thumb),target=resolve(out,shot.file);await writeFile(target,reduced);
    drawImage(contact,thumb,index%3*480,Math.floor(index/3)*294,480,270);drawText(contact,shot.file.slice(0,65),index%3*480+5,Math.floor(index/3)*294+277,undefined,1);
    receipts.push({source,sha256:createHash('sha256').update(bytes).digest('hex'),reduction:target,reductionSHA:createHash('sha256').update(reduced).digest('hex')});
  }
  await writeFile(resolve(out,'contact.png'),encode(contact));await writeFile(resolve(out,'receipts.json'),JSON.stringify({label:manifest.label,failures:manifest.failures,sources:receipts},null,2));
  console.log(`${basename(root)}: ${receipts.length} native / exact 480x270 sources; failures ${manifest.failures.length}`);
}
