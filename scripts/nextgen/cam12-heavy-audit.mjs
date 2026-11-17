#!/usr/bin/env node
/** Read-only native capture diagnostics; no acceptance gate. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(process.argv.find(a=>a.startsWith('--root='))?.slice(7)??'artifacts/nextgen/cam12-final');
const rooms=['awakening-bay','crew-checkpoint','armory','communal-atrium','service-shaft-landing','containment-annulus'],report={scope:'Native capture observations; nearest3 active native windup/strike/ranged pending/charging contacts. Missing phase receipts remain unknown, never counted as no attacks.',cohorts:[]};
for(const directory of ['heavy1080','heavy720']){
 let m;try{m=JSON.parse(await readFile(resolve(root,directory,'manifest.json'),'utf8'));}catch(e){report.cohorts.push({directory,error:e.message});continue;}
 const cohort={directory,viewport:m.viewport,errors:m.errors,failures:m.failures,rooms:[]};
 for(const room of rooms){const shots=m.shots.filter(s=>s.room===room),frames=shots.map(s=>{const e=s.evidence??{},p=e.g6FramingProof,b=e.marineBounds,v=m.viewport,insets=p?.insets;const attackers=(p?.contacts??[]).filter(c=>c.meleePhase==='windup'||c.meleePhase==='strike'||c.windupMs>0||c.chargeMs>0||c.pendingAttack).sort((a,b)=>a.distance-b.distance).slice(0,3);return {file:s.file,simulationMs:s.simulationMs,phaseReceiptsAvailable:p?.contacts?.every(c=>'meleePhase'in c)??false,nearestAttackers:attackers.map(c=>({id:c.id,type:c.type,phase:c.meleePhase,windupMs:c.windupMs,chargeMs:c.chargeMs,pendingAttack:c.pendingAttack,distance:c.distance,insideUsable:c.insideUsable})),screenMargin:b?Math.min(b.left,v.width-b.right,b.top,v.height-b.bottom):null,usableMargin:b&&insets?Math.min(b.left-insets.left,v.width-insets.right-b.right,b.top-insets.top,v.height-insets.bottom-b.bottom):null,roomAABB:e.roomFraming};});cohort.rooms.push({room,frames,minimumScreenMargin:frames.length?Math.min(...frames.map(f=>f.screenMargin??Infinity)):null,minimumUsableMargin:frames.length?Math.min(...frames.map(f=>f.usableMargin??Infinity)):null});}
 report.cohorts.push(cohort);
}
await mkdir(root,{recursive:true});await writeFile(resolve(root,'heavy-audit.json'),JSON.stringify(report,null,2));
const lines=['| Cohort | Room | Frames | Min screen px | Min reserved viewport px | Attacker frames |','|---|---|---:|---:|---:|---:|'];for(const c of report.cohorts)for(const r of c.rooms??[])lines.push(`| ${c.directory} | ${r.room} | ${r.frames.length} | ${r.minimumScreenMargin?.toFixed(2)??'unknown'} | ${r.minimumUsableMargin?.toFixed(2)??'unknown'} | ${r.frames.filter(f=>f.nearestAttackers.length).length} |`);await writeFile(resolve(root,'heavy-audit.md'),lines.join('\n')+'\n');console.log(lines.join('\n'));
