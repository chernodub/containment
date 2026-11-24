#!/usr/bin/env node
/** CREATURE26 before|after pairs at native size and at 480x270 for every PNG present in both folders.
 * node pairs.mjs <beforeDir> <afterDir> <outDir> */
import sharp from 'sharp';
import {readdirSync,mkdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const [b,a,o]=process.argv.slice(2);mkdirSync(o,{recursive:true});
for(const f of readdirSync(b).filter(f=>f.endsWith('.png')&&!f.includes('sprite')&&existsSync(join(a,f)))){
 for(const [tag,w,h] of [['native',1920,1080],['480',480,270]]){
  const t=await Promise.all([b,a].map(d=>sharp(join(d,f)).resize(w,h,{fit:'fill'}).png().toBuffer()));
  await sharp({create:{width:w*2+4,height:h,channels:3,background:'#f0f'}}).composite(t.map((x,i)=>({input:x,left:i*(w+4),top:0}))).png().toFile(join(o,`${f.replace('.png','')}-${tag}.png`));
 }
}
console.log('ok',o);
