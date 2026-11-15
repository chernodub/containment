/** Hash and pair canonical V8 evidence; consumes successful saved PNGs only. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const roots=process.argv.slice(2,4).map(p=>resolve(p));
assert.equal(roots.length,2,'Usage: v8-evidence.mjs <before> <final>');
const manifests=await Promise.all(roots.map(async root=>JSON.parse(await readFile(resolve(root,'manifest.json')))));
for(const m of manifests){assert.deepEqual(m.errors,[]);assert.deepEqual(m.failures,[]);assert.equal(m.shots.length,280);assert.equal(m.sprites.length,40);}
const hash=async path=>createHash('sha256').update(await readFile(path)).digest('hex');
const rows=['# V8 matched canonical ability evidence','','All sixteen abilities and four full kits in bright/dark rooms. Native captures and exact480×270 reductions; fixed simulation clocks, not hardware FPS.','','| Ability / room | Before native /480 | Final native /480 |','|---|---|---|'];
const records=[];
for(const sprite of manifests[0].sprites){
 const key=`${sprite.scenario}:${sprite.room}`;
 const phases=manifests.map(m=>m.shots.filter(s=>`${s.scenario}:${s.room}`===key).sort((a,b)=>a.frame-b.frame));
 assert.equal(phases[0].length,7);assert.equal(phases[1].length,7);
 const pairs=[];
 for(let i=0;i<7;i++){
  assert.equal(phases[0][i].simulationMs,phases[1][i].simulationMs,`${key} phase${i+1}`);
  const sources=await Promise.all(roots.map(async(root,j)=>{
   const native=resolve(root,phases[j][i].file),thumbnail=resolve(root,'review',phases[j][i].file);
   return{native,thumbnail,nativeSHA256:await hash(native),thumbnailSHA256:await hash(thumbnail)};
  }));
  pairs.push({phase:i+1,simulationMs:phases[0][i].simulationMs,sources});
 }
 const sheets=await Promise.all(roots.map(async root=>{
  const native=resolve(root,sprite.file),thumbnail=resolve(root,'review',sprite.file.replace('-sprite.png','-sheet.png'));
  return{native,thumbnail,nativeSHA256:await hash(native),thumbnailSHA256:await hash(thumbnail)};
 }));
 rows.push(`| ${key} | [native](${sheets[0].native}) /[480](${sheets[0].thumbnail}) | [native](${sheets[1].native}) /[480](${sheets[1].thumbnail}) |`);
 records.push({key,sheets,pairs});
}
const out=resolve('artifacts/nextgen/v8');await mkdir(out,{recursive:true});
await writeFile(resolve(out,'evidence.md'),rows.join('\n')+'\n');
await writeFile(resolve(out,'evidence.json'),JSON.stringify({roots,records,qualification:'Hash/pair audit only; actual-open review witnesses are separate.'},null,2));
console.log('40 matched native/480 sheets /280 phase pairs: clocks and both PNG hashes verified');
