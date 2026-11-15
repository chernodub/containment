/** File-only final evidence. Raw captures and failed parent manifests are never edited. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,relative} from 'node:path';
import {canvas,decode,encode,drawImage,drawText} from './g2-png.mjs';
import {review480,grayscale} from './l8-review-images.mjs';
import {selectL8Evidence} from './l8-evidence-selection.mjs';
import {L8_CAPTURE_ROOMS} from './l8-capture-data.mjs';
const args=process.argv.slice(2),value=(name,fallback)=>args.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3)??fallback;
const output=resolve(value('out','artifacts/nextgen/l8-final')),plans=resolve(value('plans',output+'/plans')),sourceSHA=value('sha',''),history=resolve(value('before','/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final5'));
assert.match(sourceSHA,/^[a-f0-9]{40}$/,'Supply full frozen --sha');const directories=args.filter(a=>!a.startsWith('--')).map(p=>resolve(p)),hash=b=>createHash('sha256').update(b).digest('hex'),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const captures=await Promise.all(directories.map(async directory=>{const bytes=await readFile(resolve(directory,'manifest.json'));return{directory,manifest:JSON.parse(bytes),manifestSHA256:hash(bytes)};}));
const rejected=await Promise.all(args.filter(a=>a.startsWith('--failed-parent=')).map(async arg=>{const directory=resolve(arg.slice(16)),bytes=await readFile(resolve(directory,'manifest.json')),manifest=JSON.parse(bytes);assert(manifest.fatalError||manifest.failures?.length||manifest.errors?.length,'Extra parent is not a failed attempt');return{directory,manifest,manifestSHA256:hash(bytes),role:'rejected parent; no PNGs selected'};}));
const parents=[...captures,...rejected];
const selected=selectL8Evidence(captures,L8_CAPTURE_ROOMS,sourceSHA),receipts=[],rows=[],native=resolve(output,'native'),review=resolve(output,'review480'),gray=resolve(output,'grayscale'),before=resolve(output,'before');
for(const p of [output,native,review,gray,before,resolve(output,'parents'),resolve(output,'storyboards')])await mkdir(p,{recursive:true});
for(const [i,parent]of parents.entries())await writeFile(resolve(output,'parents',`capture-${i+1}.json`),JSON.stringify({directory:parent.directory,manifestSHA256:parent.manifestSHA256,manifest:parent.manifest},null,2)+'\n');
const sheets=Object.fromEntries(['twenty-calm','twenty-calm-grayscale','twenty-kiting02','twenty-kiting02-grayscale'].map(k=>[k,canvas(2400,1176)]));
for(const [index,room]of L8_CAPTURE_ROOMS.entries()){
 const calm=selected.find(s=>s.room.id===room.id&&s.scenario==='combat-calm'),fight=selected.find(s=>s.room.id===room.id&&s.scenario==='g6-kiting'),story=canvas(960,588),files=[];
 for(const entry of [calm,fight])for(const shot of entry.shots){
  const original=resolve(entry.capture.directory,shot.file),bytes=await readFile(original),image=decode(bytes);assert.equal(image.width,1920);assert.equal(image.height,1080);
  const small=review480(image),smallGray=grayscale(small);await copyFile(original,resolve(native,shot.file),constants.COPYFILE_FICLONE);await writeFile(resolve(review,shot.file),encode(small));await writeFile(resolve(gray,shot.file),encode(grayscale(image)));await writeFile(resolve(gray,'480-'+shot.file),encode(smallGray));
  receipts.push({file:shot.file,source:original,native:resolve(native,shot.file),sha256:hash(bytes),parentManifestSHA256:entry.capture.manifestSHA256});files.push(shot.file);
  if(!shot.frame||shot.frame===2){const prefix=shot.frame?'twenty-kiting02':'twenty-calm',x=index%5*480,y=Math.floor(index/5)*294;for(const [name,im]of [[prefix,small],[prefix+'-grayscale',smallGray]]){drawText(sheets[name],room.id,x+5,y+5,undefined,1);drawImage(sheets[name],im,x,y+24,480,270);}}
  if(shot.frame){const x=(shot.frame-1)%2*480,y=Math.floor((shot.frame-1)/2)*294;drawText(story,room.id+' / native G6 '+shot.frame,x+5,y+5,undefined,1);drawImage(story,small,x,y+24,480,270);}
 }
 await writeFile(resolve(output,'storyboards',room.id+'.png'),encode(story));
 const oldPath=resolve(history,'combat-calm-'+room.id+'.png'),old=await readFile(oldPath);await copyFile(oldPath,resolve(before,'combat-calm-'+room.id+'.png'),constants.COPYFILE_FICLONE);
 rows.push({...room,before:oldPath,beforeSHA256:hash(old),after:resolve(native,calm.shots[0].file),files,visibleEnemies:fight.shots.map(s=>s.evidence.visibleEnemies),nativePlayer:fight.shots.map(s=>s.evidence.player)});
}
for(const [name,sheet]of Object.entries(sheets))await writeFile(resolve(output,name+'.png'),encode(sheet));
const planPath=resolve(plans,'twenty-old-new.png'),planBytes=await readFile(planPath);await copyFile(planPath,resolve(output,'twenty-old-new-plans.png'),constants.COPYFILE_FICLONE);
const report={sourceSHA,method:'Native source PNG bytes preserved; I11 exact pixel-area480×270 reduction; Rec.709-weighted sRGB code-value grayscale, no exposure normalization. G6 is staged native movement/fire, not canonical12-visible Cryo or organic balance.',parents:parents.map(c=>({directory:c.directory,role:c.role??'guarded scenario source',manifestSHA256:c.manifestSHA256,failures:c.manifest.failures,errors:c.manifest.errors})),plans:{path:planPath,sha256:hash(planBytes)},rooms:rows,receipts};
await writeFile(resolve(output,'gallery.json'),JSON.stringify(report,null,2)+'\n');
await writeFile(resolve(output,'index.html'),`<!doctype html><meta charset="utf-8"><title>L8 final room evidence</title><style>body{background:#111820;color:#dfebe6;font:16px system-ui;margin:24px}img{max-width:100%;height:auto}a{color:#9ddacb}.room{margin:32px 0}.row{display:flex;gap:12px}.row>*{width:49%}</style><h1>L8 / twenty ship rooms</h1><p>${escape(sourceSHA)}. ${escape(report.method)}</p><a href="gallery.json">Exact source receipts and per-room paths</a><h2>Twenty native calm views</h2><a href="twenty-calm.png"><img src="twenty-calm.png"></a><h2>Twenty old/new plans</h2><a href="twenty-old-new-plans.png"><img src="twenty-old-new-plans.png"></a>${rows.map(r=>`<section class="room"><h2>${escape(r.name)}</h2><p>Spawn ${r.spawn.x}/${r.spawn.y}; fight arena ${r.arena.x}/${r.arena.y}. G6 visible actors per frame: ${r.visibleEnemies.join('/')}. <a href="native/${r.files[0]}">native calm</a> · <a href="storyboards/${r.id}.png">staged G6 phases</a></p><div class="row"><a href="before/combat-calm-${r.id}.png"><img src="before/combat-calm-${r.id}.png"></a><a href="native/${r.files[0]}"><img src="review480/${r.files[0]}"></a></div></section>`).join('')}`);
console.log(`L8 gallery: ${rows.length} rooms, ${receipts.length} complete guarded native PNGs; ${output}`);
