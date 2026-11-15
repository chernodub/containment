#!/usr/bin/env node
/** Crop existing guarded production captures; this script never starts a browser. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {decodePng,encodePng} from './sprites.mjs';

const source=resolve(process.argv[2]??''),out=resolve(process.argv[3]??resolve(source,'motion-strips'));
assert(process.argv[2],'Usage: node scripts/nextgen/m9-native-strips.mjs <guarded-capture-root> [output-dir]');
const bytes=await readFile(resolve(source,'manifest.json')),original=JSON.parse(bytes);
assert.equal(original.failures?.length??0,0,'Native strip source has failed guard scenarios; retain it and recapture under a new label');
assert.equal(original.errors?.length??0,0,'Native strip source has browser errors');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifest={method:'Unresized crops from original guarded production PNGs; no browser, re-render or simulation changes.',source:relative(out,source)||'.',sourceManifestSHA256:hash(bytes),sourceGitSHA:original.gitSHA,sourceDist:original.distSnapshot??null,viewport:original.viewport,shots:[],limitations:['Crop bounds come from the original per-frame projected marine or enemy AABBs; surrounding world and nearby actors remain untouched.','Presentation and simulation clocks are copied verbatim. Scenario-specific step spacing may override the capture CLI, including K7 warning300ms phases.','This derivative does not add action, phase, actor, priority or performance certification beyond the original guarded manifest.']};
await mkdir(out,{recursive:true});await writeFile(resolve(out,'source-manifest.json'),bytes);
const groups=new Map();
for(const shot of original.shots){
 if(shot.evidence?.state!=='playing'||!Number.isInteger(shot.frame))continue;
 const key=`${shot.scenario}:${shot.room??''}`;
 if(!groups.has(key))groups.set(key,[]);groups.get(key).push(shot);
}
for(const shots of groups.values()){
 shots.sort((a,b)=>a.frame-b.frame);assert(shots.length>=2&&shots.length<=30,'Native motion strip needs2–30 original frames');
 const sprite=original.sprites?.find(s=>s.scenario===shots[0].scenario&&s.room===shots[0].room);
 assert(sprite&&sprite.frames===shots.length,'Original native burst is incomplete');
 shots.forEach((shot,i)=>{assert.equal(shot.frame,i+1,'Native capture frame gap');if(i)assert(shot.simulationMs>shots[i-1].simulationMs,'Native simulation did not advance between frames');});
 const ids=new Set();for(const shot of shots){const proof=shot.evidence.g5Proof;if(proof?.nativeWarning&&Number.isInteger(proof.enemyId))ids.add(proof.enemyId);for(const id of proof?.ids??[])if(Number.isInteger(id))ids.add(id);}
 const subjects=[{name:'marine',bounds:shot=>shot.evidence.marineBounds},...Array.from(ids,id=>({name:`enemy-${id}`,bounds:shot=>shot.evidence.g6FramingProof?.contacts.find(e=>e.id===id)?.bounds}))];
 const frames=await Promise.all(shots.map(async shot=>{const png=await readFile(resolve(source,shot.file));return {shot,image:decodePng(png),sha256:hash(png)};}));
 for(const subject of subjects){
  const first=frames[0].image,scaleX=first.width/original.viewport.width,scaleY=first.height/original.viewport.height;
  assert(Math.abs(scaleX-scaleY)<1e-6,'Native PNG scales differ by axis');
  let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
  const receipts=frames.map(({shot,image,sha256})=>{
   assert(image.width===first.width&&image.height===first.height,'Original frame dimensions differ');
   const b=subject.bounds(shot);assert(b&&['left','top','right','bottom'].every(k=>Number.isFinite(b[k])),`${subject.name} bounds absent in ${shot.file}`);
   assert(b.left>=0&&b.top>=0&&b.right<=original.viewport.width&&b.bottom<=original.viewport.height,`${subject.name} full AABB leaves original viewport in ${shot.file}`);
   const crop={left:Math.max(0,Math.floor(b.left*scaleX)-12),top:Math.max(0,Math.floor(b.top*scaleY)-12),right:Math.min(image.width,Math.ceil(b.right*scaleX)+12),bottom:Math.min(image.height,Math.ceil(b.bottom*scaleY)+12)};
   left=Math.min(left,crop.left);top=Math.min(top,crop.top);right=Math.max(right,crop.right);bottom=Math.max(bottom,crop.bottom);
   return {file:shot.file,sha256,frame:shot.frame,presentationMs:shot.presentationMs,simulationMs:shot.simulationMs,bounds:b,crop};
  });
  const cellWidth=right-left,cellHeight=bottom-top,columns=4,width=columns*cellWidth,height=Math.ceil(frames.length/columns)*cellHeight,pixels=Buffer.alloc(width*height*4);
  for(let i=3;i<pixels.length;i+=4)pixels[i]=255;
  frames.forEach(({image},index)=>{for(let y=0;y<cellHeight;y++){const from=((top+y)*image.width+left)*4,to=((Math.floor(index/columns)*cellHeight+y)*width+(index%columns)*cellWidth)*4;image.pixels.copy(pixels,to,from,from+cellWidth*4);}});
  const file=`${shots[0].scenario}${shots[0].room?'-'+shots[0].room:''}-${subject.name}-native-strip.png`,png=encodePng({width,height,pixels});await writeFile(resolve(out,file),png);
  manifest.shots.push({scenario:shots[0].scenario,room:shots[0].room,subject:subject.name,file,sha256:hash(png),frames:frames.length,columns,cellWidth,cellHeight,unionCrop:{left,top,right,bottom},sourceFrames:receipts});
 }
}
assert(manifest.shots.length,'No complete native playing bursts found');
await writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
await writeFile(resolve(out,'index.html'),`<!doctype html><meta charset="utf-8"><title>M9 native simulation strips</title><style>body{background:#11181d;color:#dce6eb;font:15px/1.5 system-ui;margin:24px}figure{margin:30px 0}img{max-width:100%;height:auto}a{color:#9fe8ff}</style><h1>M9 native simulation strips</h1><p>${esc(manifest.method)}</p><p>${manifest.limitations.map(esc).join('</p><p>')}</p><p><a href="source-manifest.json">Unchanged original guard manifest</a> · <a href="manifest.json">Crops, clocks and hashes</a></p>${manifest.shots.map(s=>`<figure><figcaption>${esc(s.scenario)} / ${esc(s.subject)} · ${s.frames} frames · simulation ${s.sourceFrames.map(f=>f.simulationMs).join('/')}ms</figcaption><a href="${s.file}"><img src="${s.file}" loading="lazy"></a></figure>`).join('')}`);
console.log(`${manifest.shots.length} unresized native simulation strips from ${groups.size} complete guarded bursts. ${out}/index.html`);
