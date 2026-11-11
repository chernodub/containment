#!/usr/bin/env node
/** Assemble successful I4 capture batches, retaining source manifests and provenance. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const labels=process.argv.slice(2);
assert(labels.length,'Pass successful capture labels');
assert(labels.every(l=>/^[\w.-]+$/.test(l)));
const root=resolve('artifacts/nextgen'),out=resolve(root,'integration-4');
await mkdir(out,{recursive:true});await mkdir(resolve(out,'sources'),{recursive:true});
const manifest={label:'integration-4',shots:[],sprites:[],sources:[],failures:[],errors:[]};
const names=new Set();let appAssets;
for(const label of labels){
 const source=resolve(root,label),bytes=await readFile(resolve(source,'manifest.json')),m=JSON.parse(bytes);
 assert(m.appAssets,`${label} lacks application fingerprints`);
 appAssets??=m.appAssets;assert.deepEqual(m.appAssets,appAssets,`${label} uses a different application build`);
 assert.equal(m.failures.length,0,`${label} has failed scenarios`);assert.equal(m.errors.length,0,`${label} has browser errors`);
 await writeFile(resolve(out,'sources',label+'.json'),bytes);
 manifest.sources.push({label,gitSHA:m.gitSHA,viewport:m.viewport,renderer:m.renderer,manifestSHA256:createHash('sha256').update(bytes).digest('hex')});
 for(const key of ['shots','sprites'])for(const shot of m[key]??[]){
  const file=`${label}-${shot.file}`;assert(!names.has(file));names.add(file);
  await copyFile(resolve(source,shot.file),resolve(out,file));manifest[key].push({...shot,file,sourceCapture:label,sourceSHA:m.gitSHA});
 }
}
await writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await writeFile(resolve(out,'pngs.txt'),[...manifest.shots,...manifest.sprites].map(s=>resolve(out,s.file)).join('\n')+'\n');
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
await writeFile(resolve(out,'index.html'),`<!doctype html><meta charset="utf-8"><title>Containment / Integration 4</title><style>body{background:#081014;color:#dfedf4;font:15px system-ui;margin:28px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(460px,1fr));gap:18px}figure{margin:0}img{width:100%;display:block}a{color:#aee5ff}figcaption{padding:8px}</style><h1>Integration 4</h1><p>${manifest.shots.length} frames / ${manifest.sprites.length} sheets. Source manifests and SHAs retained in sources/.</p><main>${[...manifest.sprites,...manifest.shots].map(s=>`<figure><a href="${escape(s.file)}"><img loading="lazy" src="${escape(s.file)}" alt="${escape(s.file)}"></a><figcaption>${escape(s.file)}</figcaption></figure>`).join('')}</main>`);
console.log(`${manifest.shots.length} frames / ${manifest.sprites.length} sheets: ${resolve(out,'index.html')}`);
