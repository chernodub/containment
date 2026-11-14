/** Focused room correction with explicit mixed-source provenance; raw captures stay immutable. */
import assert from 'node:assert/strict';
import{readFile,writeFile,copyFile,mkdir}from'node:fs/promises';
import{createHash}from'node:crypto';
import{constants}from'node:fs';
import{resolve}from'node:path';
const destination=resolve(process.argv[2]),source=resolve(process.argv[3]);
const read=async d=>JSON.parse(await readFile(resolve(d,'manifest.json'),'utf8'));
const base=await read(destination),overlay=await read(source),backup=resolve(destination,'before-armory-correction');
assert.deepEqual(base.errors,[]);assert.deepEqual(base.failures,[]);assert.deepEqual(overlay.errors,[]);assert.deepEqual(overlay.failures,[]);
for(const manifest of[base,overlay]){
 assert.match(manifest.distSnapshot.sourceSHA,/^[a-f0-9]{40}$/);assert(!manifest.distSnapshot.selection);
 assert.equal((await readFile(resolve(manifest.distSnapshot.path,'SOURCE_SHA'),'utf8')).trim(),manifest.distSnapshot.sourceSHA);
 const patch=await readFile(resolve(manifest.distSnapshot.path,'SOURCE.patch'),'utf8').catch(e=>{if(e.code==='ENOENT')return'';throw e;});assert.equal(patch.trim(),'','Room correction requires a committed source receipt');
}
for(const key of['viewport','deviceScaleFactor','seed'])assert.deepEqual(base[key],overlay[key]);
assert(overlay.shots.every(s=>s.room==='armory'));assert.equal(overlay.shots.length,5);
await mkdir(backup,{recursive:true});await writeFile(resolve(backup,'manifest.json'),JSON.stringify(base,null,2),{flag:'wx'}).catch(e=>{if(e.code!=='EEXIST')throw e;});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),sourceManifest=await readFile(resolve(source,'manifest.json'));
for(const kind of['shots','sprites'])for(const entry of overlay[kind]??[]){
 const n=base[kind].findIndex(s=>s.file===entry.file);assert(n>=0);const prior=base[kind][n];
 for(const key of['scenario','room','frame','simulationMs','presentationMs'])assert.deepEqual(entry[key],prior[key]);
 await copyFile(resolve(destination,entry.file),resolve(backup,entry.file),constants.COPYFILE_EXCL).catch(e=>{if(e.code!=='EEXIST')throw e;});
 const bytes=await readFile(resolve(source,entry.file));await writeFile(resolve(destination,entry.file),bytes);
 base[kind][n]={...entry,evidenceSource:{original:resolve(source,entry.file),sha256:hash(bytes),sourceSHA:overlay.distSnapshot.sourceSHA,manifestSHA256:hash(sourceManifest)}};
}
base.assembly={baseDirectory:resolve(destination,'..','e7-final-primary'),baseSourceSHA:base.distSnapshot.sourceSHA,primaryAppAssets:base.appAssets,correctionDirectory:source,correctionSourceSHA:overlay.distSnapshot.sourceSHA,correctionAppAssets:overlay.appAssets,correctionScope:'Armory floor gain1→.95 only; no other application source change',originalManifest:'before-armory-correction/manifest.json',manifestSHA256:hash(sourceManifest)};
base.distSnapshot={selection:true,mixedRoomSources:true,sourceSHA:null,note:'Per-shot provenance retains the complete primary plus five exact Armory replacements. This is not a single-source capture.'};
await writeFile(resolve(destination,'manifest.json'),JSON.stringify(base,null,2)+'\n');
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
await writeFile(resolve(destination,'index.html'),`<!doctype html><meta charset="utf-8"><title>Containment E7 final</title><style>body{background:#111923;color:#e4edf4;font:16px system-ui;margin:24px}main{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}img{width:100%}a{color:#a4e0ef}figure{margin:0}</style><h1>Containment E7 final</h1><p>140 native frames; primary ${base.assembly.baseSourceSHA}; five Armory floor corrections ${base.assembly.correctionSourceSHA}. Per-shot source receipts and unchanged primary retained.</p><p><a href="lighting-ten-color.png">Ten lighting moods</a> · <a href="lighting-ten-grayscale.png">Grayscale</a> · <a href="deck-luminance.md">Values</a> · <a href="manifest.json">Manifest</a></p><main>${base.shots.map(s=>`<figure><a href="${esc(s.file)}"><img src="review480/${esc(s.file)}" alt="${esc(s.file)}"></a><figcaption>${esc(s.file)}</figcaption></figure>`).join('')}</main>`);
console.log(`Preserved140-frame primary; replaced${overlay.shots.length} exact native frames plus its sprite with mixed-source receipts.`);
