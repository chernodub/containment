#!/usr/bin/env node
/** Merge complete successful harness runs only; keep their original manifests. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,copyFile,stat} from 'node:fs/promises';
import {basename,resolve} from 'node:path';
const [targetArg,sourceArg]=process.argv.slice(2);
assert(targetArg&&sourceArg,'Usage: node scripts/nextgen/k7-merge-evidence.mjs <target-gallery> <successful-source>');
const target=resolve(targetArg),source=resolve(sourceArg);assert.notEqual(target,source);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const canonical=object=>JSON.stringify(Object.fromEntries(Object.entries(object).sort(([a],[b])=>a.localeCompare(b))));
const manifestPath=resolve(target,'manifest.json'),targetBytes=await readFile(manifestPath),sourcePath=resolve(source,'manifest.json'),sourceBytes=await readFile(sourcePath);
const first=JSON.parse(targetBytes),second=JSON.parse(sourceBytes),sourceSHA256=sha(sourceBytes);
for(const [name,m]of [['target',first],['source',second]]){
  assert(Array.isArray(m.errors)&&m.errors.length===0,`${name} contains errors; a failed raw run cannot be relabeled successful`);
  assert(Array.isArray(m.failures)&&m.failures.length===0,`${name} contains failures; a failed raw run cannot be relabeled successful`);
  assert(!m.fatalError,`${name} contains a fatal error`);
  assert(m.shots.length>0&&m.appAssets&&Object.keys(m.appAssets).length>0,`${name} missing source assets or shots`);
  for(const sprite of m.sprites??[]){
    const shots=m.shots.filter(s=>s.scenario===sprite.scenario&&s.room===sprite.room).toSorted((a,b)=>a.frame-b.frame);
    assert.equal(shots.length,sprite.frames,`${name} incomplete burst ${sprite.file}`);
    assert.deepEqual(shots.map(s=>s.frame),Array.from({length:sprite.frames},(_,n)=>n+1),`${name} missing burst phase`);
    assert.deepEqual(shots.map(s=>s.simulationMs),sprite.simulationMs,`${name} sprite phase receipts differ`);
  }
}
assert.equal(canonical(first.appAssets),canonical(second.appAssets),'Application JS/CSS hashes differ');
assert.deepEqual(first.viewport,second.viewport,'Desktop viewport differs');assert.equal(first.deviceScaleFactor,second.deviceScaleFactor,'DPR differs');assert.equal(first.seed,second.seed,'Seed differs');
assert.deepEqual(first.distSnapshot,second.distSnapshot,'Frozen distribution/source identity differs');
const safe=file=>{assert(/^[A-Za-z0-9._-]+\.png$/.test(file),'Unsafe evidence filename');return file;};
const retainedManifest=`manifest-source-${basename(source)}.json`,files=[];
for(const item of [...second.shots,...(second.sprites??[])]){
  const file=safe(item.file),bytes=await readFile(resolve(source,file)),targetFile=resolve(target,file),hash=sha(bytes);
  let existing;try{existing=await readFile(targetFile);}catch(error){if(error.code!=='ENOENT')throw error;}
  if(existing)assert.equal(sha(existing),hash,'Existing target evidence differs: '+file);
  files.push({file,bytes:bytes.length,sha256:hash,sourcePath:resolve(source,file),retainedPath:targetFile,exists:!!existing});
}
const prior=first.evidenceMerges?.find(m=>m.sourceManifestSHA256===sourceSHA256);
if(prior){
  assert(files.every(f=>f.exists),'Previously merged evidence file is absent');
  console.log(`K7 evidence merge: already complete; ${files.length} retained files rehashed.`);
  process.exit(0);
}
for(const name of ['manifest.json','index.html','pngs.txt']){
  const original=resolve(target,name.replace(/\.(json|html|txt)$/, '-initial.$1'));
  try{await stat(original);}catch(error){if(error.code!=='ENOENT')throw error;await copyFile(resolve(target,name),original);}
}
const existingNames=new Set([...first.shots,...(first.sprites??[])].map(s=>s.file));
for(const file of files)if(!file.exists)await copyFile(file.sourcePath,file.retainedPath);
await writeFile(resolve(target,retainedManifest),sourceBytes);
const addedShots=second.shots.filter(s=>!existingNames.has(s.file)),addedSprites=(second.sprites??[]).filter(s=>!existingNames.has(s.file));
assert(addedShots.length>0,'No new complete shots to merge');
first.shots.push(...addedShots);first.sprites.push(...addedSprites);
first.evidenceMerges??=[];
first.evidenceMerges.push({sourceGallery:source,sourceManifestPath:sourcePath,retainedSourceManifestPath:resolve(target,retainedManifest),sourceManifestSHA256:sourceSHA256,targetManifestBeforeSHA256:sha(targetBytes),appAssetsSHA256:sha(Buffer.from(canonical(first.appAssets))),sameAppAssets:true,allSourcePhasesComplete:true,addedShots:addedShots.map(s=>s.file),addedSprites:addedSprites.map(s=>s.file),files:files.map(({exists,...f})=>f)});
await writeFile(manifestPath,JSON.stringify(first,null,2)+'\n');
await writeFile(resolve(target,'pngs.txt'),[...first.shots,...first.sprites].map(s=>resolve(target,s.file)).join('\n')+'\n');
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const card=(s,sprite)=>`<figure><a href="${encodeURIComponent(s.file)}" target="_blank"><img loading="lazy" src="${encodeURIComponent(s.file)}" alt="${escape(s.file)}"></a><figcaption>${escape(s.file)}${sprite?' - native harness phase sheet':` - simulation ${s.simulationMs}ms`}</figcaption></figure>`;
await writeFile(resolve(target,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Containment / ${escape(first.label)}</title><style>body{margin:0;background:#0c1015;color:#dbe7ee;font:15px system-ui}header{padding:24px}p{color:#a8bec9}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(440px,1fr));gap:18px;padding:24px}figure{margin:0;border:1px solid #34404c;background:#17202a}img{display:block;width:100%;height:auto}figcaption{padding:12px;font-size:12px}</style><header><h1>Containment / ${escape(first.label)}</h1><p>${first.shots.length} verified native frames / ${first.sprites.length} harness phase sheets / ${first.viewport.width}x${first.viewport.height}. Completed source runs merged only after identical application asset hashes, viewport, DPR, seed and frozen distribution checks. Original and source manifests remain linked below. Images link to actual PNG files; no browser capture is generated here.</p><p><a href="manifest.json">Combined receipt</a> / <a href="manifest-initial.json">Original receipt</a> / ${first.evidenceMerges.map(m=>`<a href="${encodeURIComponent(basename(m.retainedSourceManifestPath))}">${escape(basename(m.sourceGallery))} receipt</a>`).join(' / ')}</p></header><main class="grid">${first.sprites.map(s=>card(s,true)).join('')}${first.shots.map(s=>card(s,false)).join('')}</main></html>`);
console.log(`K7 evidence merge: PASS; ${addedShots.length} complete shots + ${addedSprites.length} sprites added; ${first.shots.length} total shots; appAssets identical.`);
console.log(manifestPath);
