#!/usr/bin/env node
// CREATURE29 proof sheets: three columns (final18 | baseline | now) of the same native window, plus 480x270 frames.
// node tools/assets/k11-creatures/creature26/proof29.mjs <final18 dir> <out dir>
import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
const [F,out]=process.argv.slice(2);await mkdir(out,{recursive:true});
const A='artifacts/nextgen',C=`${A}/creature29`;
const label=async(buf,text)=>{const m=await sharp(buf).metadata();const svg=`<svg width="${m.width}" height="28"><rect width="100%" height="28" fill="#000"/><text x="8" y="20" font-family="sans-serif" font-size="18" fill="#fff">${text}</text></svg>`;return sharp({create:{width:m.width,height:m.height+28,channels:3,background:'#000'}}).composite([{input:Buffer.from(svg),left:0,top:0},{input:buf,left:0,top:28}]).png().toBuffer();};
const strip=async(name,files,box,cols=['final18','baseline','now'])=>{
 const tiles=[];for(const [i,f] of files.entries()){let img=sharp(f);if(box)img=img.extract(box);tiles.push(await label(await img.png().toBuffer(),cols[i]));}
 const ms=await Promise.all(tiles.map(t=>sharp(t).metadata()));const W=ms.reduce((a,m)=>a+m.width+6,0),H=Math.max(...ms.map(m=>m.height));let x=0;
 await sharp({create:{width:W,height:H,channels:3,background:'#222'}}).composite(tiles.map((t,i)=>{const o={input:t,left:x,top:0};x+=ms[i].width+6;return o;})).png().toFile(`${out}/${name}.png`);};
const r480=async f=>sharp(f).resize(480,270).png().toBuffer();
const frames=async(name,files,cols)=>{const t=[];for(const f of files)t.push(await r480(f));const tmp=[];for(const [i,b] of t.entries())tmp.push(await label(b,cols[i]));let x=0;const W=tmp.length*486;await sharp({create:{width:W,height:298,channels:3,background:'#222'}}).composite(tmp.map(b=>{const o={input:b,left:x,top:0};x+=486;return o;})).png().toFile(`${out}/${name}.png`);};
const sj='value14-crowd-swarm-junction-swarm-junction-01.png',rr='value14-crowd-relay-racks-relay-racks-01.png';
await strip('1-swarm-junction-brutes-native',[`${F}/crowds/${sj}`,`${A}/c29-base/${sj}`,`${A}/c29-now/${sj}`],{left:900,top:220,width:520,height:500});
await frames('1-swarm-junction-480',[`${F}/crowds/${sj}`,`${A}/c29-base/${sj}`,`${A}/c29-now/${sj}`],['final18','baseline','now']);
await strip('2-relay-racks-brutes-native',[`${F}/crowds/${rr}`,`${A}/c29-base/${rr}`,`${A}/c29-now/${rr}`],{left:820,top:220,width:480,height:540});
await frames('2-relay-racks-480',[`${F}/crowds/${rr}`,`${A}/c29-base/${rr}`,`${A}/c29-now/${rr}`],['final18','baseline','now']);
for(const i of ['01','02','03','04']){const cc=`value14-brute-attack-crew-checkpoint-crew-checkpoint-${i}.png`;
 await strip(`3-loaded-brute-${i}-native`,[`${F}/enemies/${cc}`,`${A}/c29-base/${cc}`,`${A}/c29-now/${cc}`],{left:700,top:340,width:400,height:360});}
await frames('3-loaded-brute-480',['01','02','03','04'].map(i=>`${A}/c29-now/value14-brute-attack-crew-checkpoint-crew-checkpoint-${i}.png`),['now 01','now 02','now 03','now 04']);
for(const k of ['colour','grey','silhouette']){await strip(`4-heavies-${k}`,[`${F}/heavies/trio-crew-checkpoint-${k}.png`,`${C}/base/heavies/trio-crew-checkpoint-${k}.png`,`${C}/w3/heavies/trio-crew-checkpoint-${k}.png`],{left:300,top:300,width:1300,height:560});
 await frames(`4-heavies-${k}-480`,[`${F}/heavies/trio-crew-checkpoint-${k}.png`,`${C}/base/heavies/trio-crew-checkpoint-${k}.png`,`${C}/w3/heavies/trio-crew-checkpoint-${k}.png`],['final18','baseline','now']);}
for(const s of ['calm','charge-windup','charge','wall-stun','recovery','death','ragdoll']){const w=`ktx2-warden-crew-checkpoint-${s}.png`;
 await strip(`5-warden-${s}-native`,[`${F}/bosses/${w}`,`${C}/base/warden/${w}`,`${C}/w3/warden/${w}`],{left:500,top:160,width:960,height:800});
 await frames(`5-warden-${s}-480`,[`${F}/bosses/${w}`,`${C}/base/warden/${w}`,`${C}/w3/warden/${w}`],['final18','baseline','now']);}
console.log('sheets in',out);
