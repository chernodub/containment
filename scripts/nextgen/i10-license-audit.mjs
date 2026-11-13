#!/usr/bin/env node
/** File-only audit of wave 6 shipped CC0 data, provenance and dependency notices. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';

const option=(name,fallback)=>process.argv.find(arg=>arg.startsWith(`--${name}=`))?.slice(name.length+3)??fallback;
const baseline=option('baseline','0cfcecb');
const output=resolve(option('out','artifacts/nextgen/i10/license-audit.json'));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const isHash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const json=async file=>JSON.parse(await readFile(file,'utf8'));
const credits=await readFile('public/asset-credits.html','utf8');
const readme=await readFile('README.md','utf8');
const report={baseline:git('rev-parse',baseline),head:git('rev-parse','HEAD'),at:new Date().toISOString(),
  scope:'Added/modified public asset files relative to the U7 starting revision; retained BY-SA models are unchanged and remain separately licensed.',
  packs:[],atlas:null,files:[],dependencies:[],sourceArchives:[],qualifications:[]};
const allowedPacks=['kenney-space-station','kenney-furniture','kenney-nature','quaternius-scifi-essentials'];
assert.deepEqual((await readdir('public/assets/kits')).sort(),[...allowedPacks].sort());
for(const pack of allowedPacks){
  const root=`public/assets/kits/${pack}`,manifest=await json(`${root}/manifest.json`);
  const notice=await readFile(`${root}/CREDITS.md`,'utf8'),license=await readFile(`${root}/LICENSE.txt`,'utf8');
  assert.equal(manifest.license,'CC0-1.0',`${pack}: third-party source must be CC0`);
  assert.match(manifest.sourceURL,/^https:\/\//);assert(notice.includes(manifest.sourceURL));assert.match(license,/CC0|Creative Commons Zero/);
  assert(readme.includes(manifest.sourceURL));
  for(const file of ['CREDITS.md','LICENSE.txt','manifest.json'])assert(credits.includes(`assets/kits/${pack}/${file}`),`${pack}: public ${file} link`);
  const inventory=await readFile(`${root}/source-files.json`),entries=JSON.parse(inventory);
  assert.equal(sha(inventory),manifest.archiveFileListSHA256,`${pack}: archive inventory hash`);
  assert(isHash(manifest.archiveSHA256));assert(notice.includes(manifest.archiveSHA256));
  assert(Array.isArray(entries)&&entries.length>0);
  for(const entry of entries){assert.equal(typeof entry.path,'string');assert(!entry.path.split(/[\\/]/).includes('..'));assert(!/^(?:\/|[A-Za-z]:)/.test(entry.path));assert(Number.isInteger(entry.bytes)&&entry.bytes>=0);}
  const bytes=await readFile(`${root}/${manifest.output.file}`);
  assert.equal(bytes.length,manifest.output.bytes);assert.equal(sha(bytes),manifest.output.sha256);assert(notice.includes(manifest.output.sha256));
  assert.equal(bytes.subarray(0,4).toString(),'glTF');
  for(const model of manifest.models){
    assert(model.sourceFile.startsWith('tools/assets-src/'));assert(isHash(model.sourceSHA256));assert(model.sourceBytes>0);assert(notice.includes(model.sourceSHA256));
    for(const dependency of model.dependencies){assert(dependency.file.startsWith('tools/assets-src/'));assert(isHash(dependency.sha256));assert(dependency.bytes>0);}
  }
  const extra=pack==='quaternius-scifi-essentials'?await json(`${root}/license-evidence.json`):null;
  if(extra){assert(isHash(extra.authorPageSHA256));assert(isHash(extra.authorUploadPageSHA256));assert.equal(extra.textureArchiveUsed,false);assert(manifest.licenseEvidence.includes('https://opengameart.org/content/sci-fi-essentials-kit'));}
  report.packs.push({pack,sourceURL:manifest.sourceURL,license:manifest.license,archiveSHA256:manifest.archiveSHA256,inventorySHA256:sha(inventory),selectedModels:manifest.models.length,output:manifest.output,licenseEvidence:manifest.licenseEvidence,sourcePageHashes:extra});
}
const atlasRoot='public/assets/vfx/containment-v6',atlas=await json(`${atlasRoot}/atlas.json`),atlasBytes=await readFile(`${atlasRoot}/${atlas.output.file}`);
assert.equal(atlasBytes.length,atlas.output.bytes);assert.equal(sha(atlasBytes),atlas.output.sha256);
assert.equal(atlas.width,atlasBytes.readUInt32BE(16));assert.equal(atlas.height,atlasBytes.readUInt32BE(20));assert(atlasBytes.length<=3_000_000);
assert.match(await readFile(`${atlasRoot}/LICENSE.txt`,'utf8'),/MIT License/);
assert.match(await readFile(`${atlasRoot}/CREDITS.md`,'utf8'),/CC0[\s\S]*MIT/);
const sources=[];
for(const source of atlas.sources){
  assert.equal(source.license,'CC0-1.0');assert(isHash(source.sha256));assert.match(source.source,/^https:\/\//);
  const pack=source.author==='Kenney'?'kenney-particle-v6':'unity-labs-v6',root=`public/assets/vfx/${pack}`;
  const notice=await readFile(`${root}/CREDITS.md`,'utf8'),license=await readFile(`${root}/LICENSE.txt`,'utf8');
  assert(notice.includes(source.source));assert(notice.includes(source.sha256));assert.match(license,/CC0|Creative Commons Zero/);
  for(const file of ['CREDITS.md','LICENSE.txt'])assert(credits.includes(`assets/vfx/${pack}/${file}`),`${pack}: public ${file} link`);
  let rehashed=false;
  if(source.file.startsWith('public/')){assert.equal(sha(await readFile(source.file)),source.sha256);rehashed=true;}
  else assert(source.file.startsWith('tools/assets-src/'));
  sources.push({...source,rehashed,verification:rehashed?'Rehashed retained shipped source PNG':'Recorded source hash; excluded download unavailable in this worktree'});
}
assert.equal(sources.length,7);
for(const file of ['atlas.json','CREDITS.md','LICENSE.txt'])assert(credits.includes(`assets/vfx/containment-v6/${file}`));
report.atlas={output:atlas.output,width:atlas.width,height:atlas.height,sources,originalPatternsLicense:'MIT',thirdPartySourcesLicense:'CC0-1.0'};
const changed=git('diff','--name-status',baseline,'--','public/assets').split('\n').filter(Boolean);
for(const row of changed){
  const [status,file]=row.split('\t');assert(['A','M'].includes(status),`Audit unexpected asset status ${row}`);
  assert(file.startsWith('public/assets/kits/')||file.startsWith('public/assets/vfx/'),`Unclassified new media ${file}`);
  assert(/\.(?:glb|png|md|txt|json)$/.test(file),`Unexpected shipped file ${file}`);
  const bytes=await readFile(file);let baselineBytes=0;
  if(status==='M')baselineBytes=execFileSync('git',['show',`${baseline}:${file}`]).length;
  report.files.push({status,file,bytes:bytes.length,baselineBytes,netBytes:bytes.length-baselineBytes,sha256:sha(bytes)});
}
report.addedFiles=report.files.filter(file=>file.status==='A').length;
report.changedFiles=report.files.length;
report.addedFileBytes=report.files.filter(file=>file.status==='A').reduce((sum,file)=>sum+file.bytes,0);
report.changedFileBytes=report.files.reduce((sum,file)=>sum+file.bytes,0);
report.netPublicAssetBytes=report.files.reduce((sum,file)=>sum+file.netBytes,0);
const added=git('diff','--name-only','--diff-filter=A',baseline,'--').split('\n').filter(Boolean);
report.sourceArchives=added.filter(file=>/\.(?:zip|tar|tgz|7z|rar|tar\.gz)$/i.test(file)||file.startsWith('tools/assets-src/'));
assert.deepEqual(report.sourceArchives,[],'No new art source archive/download may be tracked');
const packageJSON=await json('package.json'),priorPackage=JSON.parse(git('show',`${baseline}:package.json`));
assert.deepEqual(packageJSON.dependencies,priorPackage.dependencies,'Runtime dependencies unchanged');
const dependencyNotices={'three':'THIRD_PARTY/Three-LICENSE.txt','@dimforge/rapier3d-compat':'THIRD_PARTY/Rapier-LICENSE.txt','@gltf-transform/core':'THIRD_PARTY/glTF-Transform-LICENSE.txt','@gltf-transform/functions':'THIRD_PARTY/glTF-Transform-LICENSE.txt','meshoptimizer':'THIRD_PARTY/meshoptimizer-LICENSE.txt'};
for(const [name,notice] of Object.entries(dependencyNotices)){
  const meta=await json(`node_modules/${name}/package.json`),text=await readFile(notice,'utf8');assert(['MIT','Apache-2.0'].includes(meta.license));assert(text.length>500);assert.match(text,meta.license==='MIT'?/MIT License|Permission is hereby granted/:/Apache License/);
  report.dependencies.push({name,version:meta.version,license:meta.license,runtime:name in packageJSON.dependencies,notice,noticeSHA256:sha(Buffer.from(text))});
}
report.qualifications.push('Archives and selected source/dependency bytes under ignored tools/assets-src are not present in this worktree. Their recorded hashes and complete inventories were validated structurally; they were not re-downloaded or rehashed. Shipped outputs, three retained Unity source PNGs and inventories were rehashed.');
report.qualifications.push('Publisher CC0 declarations were rechecked independently by I10 root. Source-page evidence hashes are retained provenance, not proof that current web bytes equal the historic download.');
report.passed=true;
await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log(`License audit passed: ${report.packs.length} CC0 kits, ${sources.length} CC0 atlas sources, ${report.addedFiles} added/${report.changedFiles} changed files; added ${report.addedFileBytes} bytes, net ${report.netPublicAssetBytes} bytes. ${output}`);
