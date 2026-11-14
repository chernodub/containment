#!/usr/bin/env node
/** Rehash the review-only CC0 candidate and distinguish failed source downloads. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const sourceRoot=resolve(process.argv[2]??'tools/assets-src/k7-quaternius-monsters');
const candidate=resolve(process.argv[3]??'artifacts/nextgen/k7-standard/route-a-final-dist');
const out=resolve(process.argv[4]??'artifacts/nextgen/k7-standard/provenance');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const files={};
for(const name of ['pack-page.html','drive-folder.html','gltf-folder.html','Alien.gltf','Alien-direct.gltf','License.txt','Alien-mirror.glb','mirror-CREDITS.md']){
  const bytes=await readFile(resolve(sourceRoot,name));
  files[name]={bytes:bytes.length,sha256:sha(bytes),kind:name.endsWith('.glb')?'model data':name.endsWith('.html')?'archived page':name.endsWith('.md')?'mirror provenance':'download response',quotaExceeded:/Google Drive - Quota exceeded/.test(bytes.toString('utf8',0,3000))};
}
assert.equal(files['Alien-mirror.glb'].sha256,'e032f24296ab40779f00367362b62b665ee1e228b17abf36e9dd4144aef96412');
assert.equal(files['Alien.gltf'].quotaExceeded,true,'Do not treat quota HTML as a glTF source');
assert.equal(files['License.txt'].quotaExceeded,true,'Do not treat quota HTML as a pack license text');
const page=await readFile(resolve(sourceRoot,'pack-page.html'),'utf8');
assert(/https:\/\/creativecommons\.org\/publicdomain\/zero\/1\.0\//.test(page),'Author pack page must link CC0-1.0');
const credits=await readFile(resolve(sourceRoot,'mirror-CREDITS.md'),'utf8');
assert(/Ultimate Monsters/.test(credits)&&/by Quaternius/.test(credits)&&/Alien/.test(credits)&&/CC0 1\.0 Universal/.test(credits),'Mirror must identify same author/pack/license');
const outputPath=resolve(candidate,'assets/models/tyrant.glb'),output=await readFile(outputPath),conversion=JSON.parse(await readFile(resolve(candidate,'k7-candidate-receipt.json'),'utf8'));
assert.equal(output.subarray(0,4).toString(),'glTF');assert.equal(sha(output),conversion.outputSHA256);assert.equal(output.length,conversion.outputBytes);
const gltf=JSON.parse(output.subarray(20,20+output.readUInt32LE(12)).toString());
const clips=gltf.animations.map(a=>a.name);
for(const name of ['stand','run','walk','attack','hit','death'])assert(clips.includes(name),'Native animation mapping missing '+name);
const canonicalPath=resolve('public/assets/kits/quaternius-scifi-essentials/LICENSE.txt'),canonical=await readFile(canonicalPath);
assert(canonical.toString().includes('CC0 1.0 Universal'));
await mkdir(out,{recursive:true});await copyFile(canonicalPath,resolve(out,'LICENSE.txt'));
const receipt={author:'Quaternius',pack:'Ultimate Monsters',license:'CC0-1.0',licenseEvidence:{authorPage:'https://quaternius.com/packs/ultimatemonsters.html',canonicalLicense:'https://creativecommons.org/publicdomain/zero/1.0/legalcode',copiedCanonicalTextFrom:canonicalPath,canonicalTextSHA256:sha(canonical),packLicenseDownload:'Unavailable: author-linked Drive download returned quota-exceeded HTML; response retained.'},mirror:{url:'https://raw.githubusercontent.com/Hakhyun-Kim/constellation-defense/main/assets/models/quaternius-alien.glb',creditsURL:'https://raw.githubusercontent.com/Hakhyun-Kim/constellation-defense/main/CREDITS.md',attributionBasis:'Author pack page plus mirror explicit pack/model identification; original Drive glTF could not be independently byte-matched.'},sourceRoot,files,conversion,output:{path:outputPath,bytes:output.length,sha256:sha(output),clips},shipping:{selectedRoute:'B - rebuilt retained rigs',newShippedActorAssetBytes:0,candidateShipped:false,reason:'A/B candidate is review-only; upright long-necked humanoid does not fit armored siege predator role.'},safety:{sourceCodeExecuted:false,conversion:'Repository-authored NodeIO data conversion only; no downloaded scripts/plugins/executables.'},limitations:['Mirror-to-author original byte identity remains unverified because Drive was quota-blocked.','Candidate retained native animation clips; no validated Unvanquished ragdoll mapping. Frozen-pose corpse fallback is specified.','CC0 license text is canonical; it is not falsely represented as a successful pack-archive license download.']};
await writeFile(resolve(out,'provenance.json'),JSON.stringify(receipt,null,2)+'\n');
await writeFile(resolve(out,'CREDITS.md'),`# K7 review-only creature candidate\n\nUltimate Monsters — Alien model and animation by Quaternius, CC0-1.0.\n\nAuthor license declaration: https://quaternius.com/packs/ultimatemonsters.html\nCanonical license: https://creativecommons.org/publicdomain/zero/1.0/\n\nThe author-linked Google Drive glTF and License.txt downloads returned quota-exceeded HTML. Those responses are retained and are not model/license source files. The comparison uses a public mirror whose CREDITS.md names this pack and model: https://github.com/Hakhyun-Kim/constellation-defense/blob/main/CREDITS.md\n\nThe original author glTF could not be byte-matched. All available source/page/output hashes are recorded in provenance.json. LICENSE.txt here is canonical CC0 text copied from the repository's existing Quaternius kit notice, not a pack-archive receipt.\n\nCandidate output: ${output.length} bytes; SHA-256 ${sha(output)}. It is used only in a frozen review distribution under artifacts, never the production public assets. Route B ships no new actor asset bytes. Existing Unvanquished models/animations and their Creative Commons notices remain in force. New anatomy is original repository MIT artwork.\n`);
console.log(`K7 candidate audit: PASS; source ${files['Alien-mirror.glb'].bytes} bytes; review output ${output.length} bytes; new shipped actor assets 0 bytes.`);
console.log(resolve(out,'provenance.json'));
