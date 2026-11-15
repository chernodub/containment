import {assertNativeWarning} from './capture-warning-contract.mjs';
/** File-only warning/growth review. Keeps native parents untouched. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {canvas,decode,encode,drawImage,drawText} from './g2-png.mjs';
import {review480,grayscale} from './l8-review-images.mjs';
import {selectL8Evidence} from './l8-evidence-selection.mjs';
import {L8_CAPTURE_ROOMS} from './l8-capture-data.mjs';
const directory=resolve(process.argv[2]??'artifacts/nextgen/l8-warning-review-raw1'),out=resolve(process.argv[3]??'artifacts/nextgen/l8-warning-review'),bytes=await readFile(resolve(directory,'manifest.json')),manifest=JSON.parse(bytes),hash=b=>createHash('sha256').update(b).digest('hex');
const ids=['diagnostic-gallery','safety-interlock-station','manual-control-chamber','infested-workshop','swarm-junction'],rooms=L8_CAPTURE_ROOMS.filter(r=>ids.includes(r.id)),sourceSHA=manifest.distSnapshot.sourceSHA,capture={directory,manifest,manifestSHA256:hash(bytes)},selected=selectL8Evidence([capture],rooms,sourceSHA);
assert.deepEqual(manifest.failures,[]);assert.deepEqual(manifest.errors,[]);
const hasArena=manifest.shots.some(s=>s.scenario==='l8-arena-calm');
if(hasArena)selected.push(...selectL8Evidence([capture],rooms,sourceSHA,{calmScenario:'l8-arena-calm'}).filter(e=>e.scenario==='l8-arena-calm'));
for(const p of [out,resolve(out,'review480'),resolve(out,'grayscale'),resolve(out,'storyboards')])await mkdir(p,{recursive:true});
const overview=canvas(hasArena?2880:1920,rooms.length*294),receipts=[];
for(const [i,id]of ids.entries()){
 const entries=selected.filter(s=>s.room.id===id),story=canvas(960,588);
 for(const entry of entries)for(const shot of entry.shots){
  const raw=await readFile(resolve(directory,shot.file)),im=decode(raw),small=review480(im),gray=grayscale(small),proof=shot.evidence.warningProof;
  if(!shot.frame)assert.equal(shot.evidence.l8PointerProof.previewCount,0,'Native HUD hover must retire preview');
  assertNativeWarning(shot.evidence,shot.file,{quiet:!shot.frame});
  await writeFile(resolve(out,'review480',shot.file),encode(small));await writeFile(resolve(out,'grayscale',shot.file),encode(grayscale(im)));await writeFile(resolve(out,'grayscale','480-'+shot.file),encode(gray));
  receipts.push({file:shot.file,native:resolve(directory,shot.file),nativeSHA256:hash(raw),warning:proof,arenaCalm:shot.evidence.l8ArenaCalmProof??null,performance:{drawCalls:shot.performance?.drawCalls,triangles:shot.performance?.triangles},budgetFailure:(shot.performance?.drawCalls??Infinity)>330});
  if(!shot.frame||shot.frame===2){const x=shot.frame?(hasArena?1920:960):entry.scenario==='l8-arena-calm'?960:0,y=i*294;for(const [offset,image]of [[0,small],[480,gray]]){drawText(overview,id+(shot.frame?' / G6-02':entry.scenario==='l8-arena-calm'?' / arena calm':' / entry calm'),x+offset+4,y+5,undefined,1);drawImage(overview,image,x+offset,y+24,480,270);}}
  if(shot.frame){const x=(shot.frame-1)%2*480,y=Math.floor((shot.frame-1)/2)*294;drawText(story,id+' / G6 '+shot.frame,x+5,y+5,undefined,1);drawImage(story,small,x,y+24,480,270);}
 }
 await writeFile(resolve(out,'storyboards',id+'.png'),encode(story));
}
await writeFile(resolve(out,'critical-five-color-gray.png'),encode(overview));await writeFile(resolve(out,'review-receipts.json'),JSON.stringify({sourceSHA,parentManifest:resolve(directory,'manifest.json'),parentManifestSHA256:capture.manifestSHA256,method:'Native bytes unchanged; exact480x270 area reduction; Rec709 code-value gray; full original actor/HUD/action guards plus actual projected warning safe-quad checks',receipts},null,2)+'\n');
console.log(`Critical-five review: ${receipts.length} guarded PNGs; warnings HUD-safe, native calm preview absent; ${out}`);
