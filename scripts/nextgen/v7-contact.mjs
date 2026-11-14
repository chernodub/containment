/** File-only critique contact; preserves exact480 frames and records every selected source/hash. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {decode,encode,canvas,drawImage,drawText} from './g2-png.mjs';
const root=resolve(process.argv[2]),out=resolve(process.argv[3]??root);
const m=JSON.parse(await readFile(resolve(root,'manifest.json')));
assert.deepEqual(m.errors,[]);assert.deepEqual(m.failures,[]);
const groups=[...new Set(m.shots.map(s=>`${s.scenario}:${s.room}`))];
const selected=groups.flatMap(key=>{
 const shots=m.shots.filter(s=>`${s.scenario}:${s.room}`===key).sort((a,b)=>a.frame-b.frame);
 return shots.length>=6?[shots[2],shots[5]]:[shots[0]];
});
const sheet=canvas(1920,294*Math.ceil(selected.length/4)),sources=[];
for(let i=0;i<selected.length;i++){
 const s=selected[i],path=resolve(root,'review',s.file),bytes=await readFile(path),png=decode(bytes);
 assert.equal(png.width,480);assert.equal(png.height,270);
 const x=i%4*480,y=Math.floor(i/4)*294;drawImage(sheet,png,x,y,480,270);
 drawText(sheet,`${s.scenario} /${s.frame}`,x+5,y+276,undefined,1);
 sources.push({path,sha256:createHash('sha256').update(bytes).digest('hex'),native:resolve(root,s.file),frame:s.frame,simulationMs:s.simulationMs});
}
await mkdir(out,{recursive:true});await writeFile(resolve(out,'contact.png'),encode(sheet));
await writeFile(resolve(out,'contact-sources.json'),JSON.stringify({root,sources,qualification:'Prepared contact, not an assertion that pixels were reviewed.'},null,2));
console.log(`${selected.length} exact480 frames in one critique contact: ${out}`);
