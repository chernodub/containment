#!/usr/bin/env node
/** Native captures remain authoritative; review PNGs use exact area reduction to 480x270. */
import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {canvas,decode,encode,drawImage,drawText} from './g2-png.mjs';

const root=resolve(process.argv[2]),out=resolve(root,'review480');
await mkdir(out,{recursive:true});
const files=(await readdir(root)).filter(f=>f.endsWith('.png')&&!f.includes('sprite')).sort();
const groups=new Map();
const lastFrames=new Map();
for(const file of files){const match=file.match(/^(.*)-(\d\d)\.png$/);if(match)lastFrames.set(match[1],match[2]);}
for(const file of files){
  const source=decode(await readFile(resolve(root,file))),thumb=canvas(480,270);
  for(let y=0;y<270;y++)for(let x=0;x<480;x++){
    const x0=Math.floor(x*source.width/480),x1=Math.floor((x+1)*source.width/480),y0=Math.floor(y*source.height/270),y1=Math.floor((y+1)*source.height/270);
    const count=(x1-x0)*(y1-y0),offset=(y*480+x)*3;
    for(let c=0;c<3;c++){
      let sum=0;for(let sy=y0;sy<y1;sy++)for(let sx=x0;sx<x1;sx++)sum+=source.pixels[(sy*source.width+sx)*source.channels+c];
      thumb.pixels[offset+c]=Math.round(sum/count);
    }
  }
  await writeFile(resolve(out,file),encode(thumb));
  const frame=file.match(/-(\d\d)\.png$/)?.[1];
  if(frame&&frame!==lastFrames.get(file.replace(/-\d\d\.png$/,'')))continue;
  const key=file.includes('calm-high')?'calm-high':file.includes('calm-low')?'calm-low':file.includes('kiting-high')?'kiting-high':file.includes('kiting-low')?'kiting-low':'focused';
  const list=groups.get(key)??[];list.push({file,thumb});groups.set(key,list);
}
const sheets=[];
for(const [key,list]of groups)for(let start=0;start<list.length;start+=6){
  const page=list.slice(start,start+6),sheet=canvas(1440,Math.ceil(page.length/3)*294);
  for(const [i,{file,thumb}]of page.entries()){
    const x=i%3*480,y=Math.floor(i/3)*294;drawImage(sheet,thumb,x,y,480,270);drawText(sheet,file,x+4,y+276,undefined,1);
  }
  const name=`${key}-${start/6+1}.png`;await writeFile(resolve(out,name),encode(sheet));sheets.push(name);
}
await writeFile(resolve(out,'index.html'),`<!doctype html><meta charset="utf-8"><title>X2 review</title><body style="background:#101820;color:#d8eef2;font:16px sans-serif">${sheets.map(f=>`<h2>${f}</h2><img style="max-width:100%" src="${f}">`).join('')}</body>`);
await writeFile(resolve(root,'x2-gallery.html'),`<!doctype html><meta charset="utf-8"><title>X2 native gallery</title><body style="background:#101820;color:#d8eef2;font:16px sans-serif"><a style="color:#b5edff" href="review480/index.html">Exact 480×270 review</a><main style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${files.map(f=>`<figure style="margin:0"><a href="${encodeURIComponent(f)}"><img loading="lazy" style="width:100%" src="${encodeURIComponent(f)}"></a><figcaption>${f}</figcaption></figure>`).join('')}</main></body>`);
console.log(`${files.length} exact480x270 frames; ${sheets.length} review sheets: ${out}`);
