#!/usr/bin/env node
/** Preserve a full gallery while replacing exact fixtures after a scoped CSS correction. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile,open} from 'node:fs/promises';
import {resolve,basename} from 'node:path';
const destination=resolve(process.argv[2]),source=resolve(process.argv[3]);
assert.notEqual(destination,source);
const base=JSON.parse(await readFile(resolve(destination,'manifest.json'),'utf8'));
const overlay=JSON.parse(await readFile(resolve(source,'manifest.json'),'utf8'));
assert.deepEqual(overlay.errors,[]);assert.deepEqual(overlay.failures,[]);
assert.deepEqual(base.viewport,overlay.viewport);assert.equal(base.deviceScaleFactor,overlay.deviceScaleFactor);
const js=assets=>Object.fromEntries(Object.entries(assets).filter(([file])=>file.endsWith('.js')));
assert.deepEqual(js(base.appAssets),js(overlay.appAssets),'A CSS-only overlay must preserve every application JS asset');
const backup=resolve(destination,'pre-readability-correction');await mkdir(backup,{recursive:true});
await writeFile(resolve(backup,'manifest.json'),JSON.stringify(base,null,2)+'\n');
for(const shot of overlay.shots) {
 assert.equal(basename(shot.file),shot.file);
 const index=base.shots.findIndex(item=>item.file===shot.file&&item.scenario===shot.scenario&&item.room===shot.room&&item.frame===shot.frame);
 assert(index>=0,`Missing exact fixture ${shot.file}`);
 await copyFile(resolve(destination,shot.file),resolve(backup,shot.file));
 await copyFile(resolve(source,shot.file),resolve(destination,shot.file));
 base.shots[index]={...shot,presentationSourceSHA:overlay.distSnapshot?.sourceSHA??overlay.gitSHA,sourceCapture:overlay.label};
}
base.assembly={baseCapture:base.label,baseSourceSHA:base.distSnapshot?.sourceSHA??base.gitSHA,correction:overlay.label,correctionSourceSHA:overlay.distSnapshot?.sourceSHA??overlay.gitSHA,files:overlay.shots.map(shot=>shot.file),originalManifest:'pre-readability-correction/manifest.json',appAssets:overlay.appAssets,note:'Scoped CSS-only augment sentence removal. All application JavaScript bytes verified identical.'};
await writeFile(resolve(destination,'manifest.json'),JSON.stringify(base,null,2)+'\n');
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const html=await open(resolve(destination,'index.html'),'w');
try {
 await html.writeFile(`<!doctype html><meta charset="utf-8"><title>Containment ${escape(base.label)}</title><style>body{background:#10171d;color:#dae8ed;font:15px system-ui;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(440px,1fr));gap:16px}figure{margin:0;background:#19242e}img{width:100%;height:auto}figcaption{padding:12px}a{color:#b2dcf3}</style><h1>${escape(base.label)}</h1><p>${base.shots.length} verified frames. Base ${escape(base.assembly.baseSourceSHA)}; CSS-only correction ${escape(base.assembly.correctionSourceSHA)}. Original evidence and per-shot provenance retained.</p><main>`);
 for(const shot of base.shots) await html.writeFile(`<figure><a href="${escape(shot.file)}"><img alt="${escape(shot.file)}" src="data:image/png;base64,${(await readFile(resolve(destination,shot.file))).toString('base64')}"></a><figcaption>${escape(shot.file)} · ${escape(shot.presentationSourceSHA??base.assembly.baseSourceSHA)}</figcaption></figure>`);
 await html.writeFile('</main>');
} finally {await html.close();}
console.log(`${base.label}: retained ${base.shots.length} frames; replaced ${overlay.shots.length} exact fixtures; application JS identical`);
