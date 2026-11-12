#!/usr/bin/env node
/** Build lossless, matched full-size and exact area-reduced OFF/ON review pairs. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { decode, encode, canvas, drawImage, drawText } from './g2-png.mjs';
const [offLabel,onLabel,outLabel='g3-ab']=process.argv.slice(2);
assert(offLabel&&onLabel,'Usage: g3-ab.mjs off-label on-label [output-label]');
const base=resolve('artifacts/nextgen'),out=resolve(base,outLabel);await mkdir(out,{recursive:true});
const off=JSON.parse(await readFile(resolve(base,offLabel,'manifest.json'))),on=JSON.parse(await readFile(resolve(base,onLabel,'manifest.json')));
const diagnostics=[off,on].flatMap(m=>m.failures.map(f=>({label:m.label,scenario:f.scenario,error:f.error.slice(0,250)})));assert(!off.errors.length&&!on.errors.length,'Console errors cannot enter an accepted A/B gallery');
const key=s=>[s.scenario,s.room??'',s.frame??0].join('|');
const before=new Map(off.shots.map(s=>[key(s),s]));const pairs=[];
function reduce(src){const dst=canvas(480,270);for(let y=0;y<270;y++)for(let x=0;x<480;x++){const x0=Math.floor(x*src.width/480),x1=Math.floor((x+1)*src.width/480),y0=Math.floor(y*src.height/270),y1=Math.floor((y+1)*src.height/270),count=(x1-x0)*(y1-y0);for(let c=0;c<3;c++){let sum=0;for(let sy=y0;sy<y1;sy++)for(let sx=x0;sx<x1;sx++)sum+=src.pixels[(sy*src.width+sx)*src.channels+c];dst.pixels[(y*480+x)*3+c]=Math.round(sum/count);}}return dst;}
for(const shot of on.shots){const prior=before.get(key(shot));assert(prior,`Missing OFF ${key(shot)}`);const a=decode(await readFile(resolve(base,offLabel,prior.file))),b=decode(await readFile(resolve(base,onLabel,shot.file)));assert(a.width===b.width&&a.height===b.height);const full=canvas(a.width*2,a.height+24);drawImage(full,a,0,24,a.width,a.height);drawImage(full,b,a.width,24,b.width,b.height);drawText(full,'OFF',8,6);drawText(full,'ON',a.width+8,6);const name=shot.file.replace('.png','-pair.png');await writeFile(resolve(out,name),encode(full));const thumb=canvas(960,294);drawImage(thumb,reduce(a),0,24,480,270);drawImage(thumb,reduce(b),480,24,480,270);drawText(thumb,'OFF',8,6);drawText(thumb,'ON',488,6);const small=name.replace('.png','-480.png');await writeFile(resolve(out,small),encode(thumb));pairs.push({key:key(shot),full:resolve(out,name),thumb:resolve(out,small),off:resolve(base,offLabel,prior.file),on:resolve(base,onLabel,shot.file)});}
if(!process.argv.includes('--subset'))assert(pairs.length===off.shots.length,'Unpaired OFF frames');
await writeFile(resolve(out,'pairs.json'),JSON.stringify({offLabel,onLabel,offSha:off.distSnapshot?.sourceSHA??off.gitSHA,onSha:on.distSnapshot?.sourceSHA??on.gitSHA,pairs},null,2));
await writeFile(resolve(out,'index.html'),`<!doctype html><meta charset="utf-8"><title>G3 OFF / ON</title><style>body{background:#10151b;color:#dbe9ee;font:14px system-ui;margin:24px}figure{margin:20px 0}img{max-width:100%;display:block}h2{font-size:15px}</style><h1>G3 ink and surface A/B</h1>${diagnostics.length?`<p>REJECTED / INCOMPLETE ROUND. ${JSON.stringify(diagnostics)}</p>`:''}<p>${offLabel} → ${onLabel}. Left OFF / right ON. Every 480×270 image is area reduced from the original 1920×1080 capture. Open full-size pairs to judge line stability and texture response.</p>${pairs.map(p=>`<figure><h2>${p.key}</h2><a href="${relative(out,p.full)}"><img src="${relative(out,p.thumb)}"></a></figure>`).join('')}`);
console.log(`${pairs.length} matched pairs, full size + 480x270: ${out}`);
