import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile,access,open} from 'node:fs/promises';
import {resolve,basename} from 'node:path';

// Assemble a final gallery after a focused correction without losing the complete
// earlier round, changing evidence, or implying every shot used one renderer SHA.
const destination=resolve(process.argv[2]??'artifacts/nextgen/g2-final');
const source=resolve(process.argv[3]??'artifacts/nextgen/g2-final-calibration');
const read=async dir=>JSON.parse(await readFile(resolve(dir,'manifest.json'),'utf8'));
const base=await read(destination),overlay=await read(source);
assert.equal(overlay.errors.length,0);assert.equal(overlay.failures.length,0);
assert(overlay.shots.length>0&&source!==destination);
const backup=resolve(destination,'round4-original');await mkdir(backup,{recursive:true});
try{await access(resolve(backup,'manifest.json'));}catch{await writeFile(resolve(backup,'manifest.json'),JSON.stringify(base,null,2)+'\n');}
const sourceSHA=overlay.distSnapshot?.sourceSHA??overlay.gitSHA;
for(const shot of overlay.shots){
 assert.equal(basename(shot.file),shot.file);
 const index=base.shots.findIndex(s=>s.file===shot.file&&s.room===shot.room&&s.scenario===shot.scenario&&s.frame===shot.frame);
 assert(index>=0,`Overlay must replace an existing exact fixture: ${shot.file}`);
 try{await access(resolve(backup,shot.file));}catch{await copyFile(resolve(destination,shot.file),resolve(backup,shot.file));}
 await copyFile(resolve(source,shot.file),resolve(destination,shot.file));
 base.shots[index]={...shot,rendererSourceSHA:sourceSHA,sourceCapture:overlay.label};
}
base.assembly={baseCaptureSHA:base.gitSHA,overlayCapture:overlay.label,overlaySHA:sourceSHA,overlayFiles:overlay.shots.map(s=>s.file),originalManifest:'round4-original/manifest.json'};
await writeFile(resolve(destination,'manifest.json'),JSON.stringify(base,null,2)+'\n');
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const html=await open(resolve(destination,'index.html'),'w');
try{
 await html.writeFile(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Containment G2 final</title><style>body{margin:0;background:#10171d;color:#dae8ed;font:15px system-ui}header{padding:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(440px,1fr));gap:16px;padding:16px}figure{margin:0;background:#19242e}img{width:100%;height:auto;display:block}figcaption{padding:12px}a{color:#b2dcf3}</style><header><h1>Containment / G2 final</h1><p>${base.shots.length} verified story/boss/title/detail/recovery shots. Base renderer ${escape(base.gitSHA)}; focused correction ${escape(sourceSHA)}. Per-shot provenance is retained in manifest.json; original round4 evidence is preserved.</p><p><a href="comparison/index.html">Twenty-room baseline / before / after</a> · <a href="legacy/index.html">Legacy High/Low</a> · <a href="value-tables.md">Value tables</a></p></header><main>`);
 for(const shot of base.shots){
  const png=(await readFile(resolve(destination,shot.file))).toString('base64');
  await html.writeFile(`<figure><a href="${escape(shot.file)}"><img alt="${escape(shot.file)}" src="data:image/png;base64,${png}"></a><figcaption>${escape(shot.file)} · ${escape(shot.performance?.quality??'')} · renderer ${escape(shot.rendererSourceSHA??base.gitSHA)}</figcaption></figure>`);
 }
 await html.writeFile('</main></html>');
}finally{await html.close();}
console.log(`Assembled ${base.shots.length} shots with ${overlay.shots.length} verified replacements from ${sourceSHA}; original round retained.`);
