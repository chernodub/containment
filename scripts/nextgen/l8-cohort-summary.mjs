#!/usr/bin/env node
/** Fixed L8 release cohort, including every attempt and exact provenance receipts. */
import assert from 'node:assert/strict';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

export const L8_PRIMARY_SEEDS=Object.freeze([1729,2718,31415,42,137,8675309,2026,9001,65537,123456]);
export const L8_RELEASE_SEEDS=Object.freeze([...L8_PRIMARY_SEEDS,1000,1001,1002,1003,1004,1005,1006,1007,1008,1009,2646007777,2400273476,1420519048,926231573,3293539470,302625857,3031516705,315632507,3763819556,1353316589,2570684887,2825160470,676147701,1074335564,1576486972,719510212,1190535481,3640216177,3344254954,2595108862]);
export const L8_POLICY='976eb173f26b67e0d02806b91b316a13fc11eecee94ba0310ac2287a7e402502';
export const L8_BACKEND='f7c6d801718b743ed275aac6a15fe7227e72af5e29d714f6a3806e540201d4d6';
const rigs=['breacher','cryo','pyro','arc'];
export const median=values=>{const xs=values.filter(Number.isFinite).sort((a,b)=>a-b),n=xs.length;return n?n%2?xs[(n-1)/2]:(xs[n/2-1]+xs[n/2])/2:null;};
const cleared=r=>['clear','complete'].includes(r.result),ordinary=r=>r.nodeKind==='combat'&&r.guardian==null&&!r.holdout;

export function validateCohort(reports,{seeds=L8_RELEASE_SEEDS,source,baseline=false}={}){
 assert.equal(reports.length,seeds.length*4,'Every declared attempt must be retained');
 const expected=[...seeds].sort((a,b)=>a-b),first=reports[0];
 for(const rig of rigs)assert.deepEqual(reports.filter(r=>r.rig===rig).map(r=>r.seed).sort((a,b)=>a-b),expected,rig+' exact declared seeds, no duplicate attempts');
 for(const r of reports){
  assert.equal(r.policyHash,L8_POLICY,'Frozen policy');assert.equal(r.backendProvenance.backendHash,L8_BACKEND,'Vanilla backend');
  assert.equal(r.backendProvenance.dirtyBackend,false,'Clean backend');assert.equal(r.assisted,false,'Unassisted');assert.equal(r.legacy,false,'Current story');
  assert.equal(r.l8Diagnostic,undefined,'Diagnostic overrides are never release acceptance');assert.equal(r.tuningEnabled,true,'Shipped I5 production profile');
  for(const key of ['gameHash','bundleHash'])assert.equal(r[key],first[key],'Single '+key);
  assert.deepEqual(r.backendProvenance.sourceHashes,first.backendProvenance.sourceHashes,'Identical metrics and backend source');
  assert.equal(r.navigationVersion,first.navigationVersion,'Single navigation observer');
  if(baseline&&r.gameRef==='working-tree')assert.equal(r.backendProvenance.workspaceHead,source,'Original clean baseline HEAD');
  else assert.equal(r.gameRef,source,'Explicit committed game source');
  if(baseline){assert.equal(r.gameHash,'2803f6d9f1adde0199c7b2713db8f4f26815f9a0e1139b588fccd5529bb6868a','Frozen baseline game');assert.equal(r.bundleHash,'fd3232e5cb79d125fab946cea1f9d12d5d303afdb1030f858d21881683618f74','Frozen baseline actor metrics and bundle');}
 }
 return {source,gameHash:first.gameHash,bundleHash:first.bundleHash,policyHash:first.policyHash,backendHash:first.backendProvenance.backendHash,navigationVersion:first.navigationVersion,backendSourceHashes:first.backendProvenance.sourceHashes};
}

export function summarizeCohort(reports){
 const rooms=reports.flatMap(r=>r.rooms),done=rooms.filter(cleared),complete=reports.filter(r=>r.outcome==='complete').length,pct=100*complete/reports.length;
 const deathRooms={},outcomes={};for(const r of reports){outcomes[r.outcome]=(outcomes[r.outcome]??0)+1;if(r.outcome==='dead')deathRooms[r.deathRoom]=(deathRooms[r.deathRoom]??0)+1;}
 const sources=Object.fromEntries(['weapon','ability','status','boon'].map(k=>[k,reports.reduce((n,r)=>n+r.stats.damageDealt[k],0)])),total=Object.values(sources).reduce((a,b)=>a+b,0);
 const byDepth=depthSummary(rooms);
 const byRig=Object.fromEntries(rigs.map(rig=>{const rows=reports.filter(r=>r.rig===rig);return[rig,rows.length?summarizeRig(rows):null];}));
 const rates=Object.values(byRig).filter(Boolean).map(r=>r.completionPct);
 return{attempts:reports.length,complete,completionPct:pct,outcomes,deathRooms,maxRigDistancePp:Math.max(...rates.map(x=>Math.abs(x-pct))),rigRangePp:Math.max(...rates)-Math.min(...rates),...timing(reports,done),sources,directAbilityShare:sources.ability/total,abilityPlusStatusShare:(sources.ability+sources.status)/total,nonweaponShare:1-sources.weapon/total,ordinaryCapViolations:rooms.filter(r=>ordinary(r)&&r.overdrives>1).map(r=>({nodeId:r.nodeId,uses:r.overdrives})),byRig,byDepth};
}
function depthSummary(rooms){return Array.from({length:20},(_,depth)=>{const rows=rooms.filter(r=>r.depth===depth),good=rows.filter(cleared);return{room:depth+1,id:rows[0]?.id,attempts:rows.length,clears:good.length,medianClearSeconds:median(good.map(r=>r.seconds)),incomingDamage:median(rows.map(r=>r.damageTaken)),entryHealthDebt:median(rows.map(r=>100-r.startHealth)),entryArmor:median(rows.map(r=>r.startArmor)),entryVitality:median(rows.map(r=>r.startHealth+r.startArmor)),abilityUses:Object.fromEntries(['dash','tactical','power','overdrive'].map(k=>[k,rows.reduce((s,r)=>s+(r.abilityUses[k]??0),0)]))};});
}
function timing(reports,done){return{strictOrdinarySeconds:median(done.filter(ordinary).map(r=>r.seconds)),broadNonholdoutSeconds:median(done.filter(r=>!r.holdout).map(r=>r.seconds)),transmissionSeconds:median(done.filter(r=>r.id==='transmission-chamber').map(r=>r.seconds)),zeroOverdriveAttempts:reports.filter(r=>!r.stats.overdrivesUsed).length,roomsPerOverdrive:median(reports.map(r=>r.stats.overdrivesUsed?r.rooms.filter(cleared).length/r.stats.overdrivesUsed:NaN))};}
function summarizeRig(reports){const sources=Object.fromEntries(['weapon','ability','status','boon'].map(k=>[k,reports.reduce((s,r)=>s+r.stats.damageDealt[k],0)])),total=Object.values(sources).reduce((a,b)=>a+b,0);return{byDepth:depthSummary(reports.flatMap(r=>r.rooms)),attempts:reports.length,complete:reports.filter(r=>r.outcome==='complete').length,completionPct:100*reports.filter(r=>r.outcome==='complete').length/reports.length,sources,directAbilityShare:sources.ability/total,abilityPlusStatusShare:(sources.ability+sources.status)/total,nonweaponShare:1-sources.weapon/total,...timing(reports,reports.flatMap(r=>r.rooms).filter(cleared))};}
export function cohortTargets(s){return{completion40to60:s.completionPct>=40&&s.completionPct<=60,rigDistance15:s.maxRigDistancePp<=15,strictOrdinary30to45:s.strictOrdinarySeconds>=30&&s.strictOrdinarySeconds<=45,transmission60to75:s.transmissionSeconds>=60&&s.transmissionSeconds<=75,allRigCadence:Object.values(s.byRig).every(r=>r&&r.roomsPerOverdrive>=1.2&&r.roomsPerOverdrive<=1.7),ordinaryCap:s.ordinaryCapViolations.length===0,naturalTerminalsOnly:Object.keys(s.outcomes).every(k=>['complete','dead'].includes(k)),deathRooms9to20:Object.keys(s.deathRooms).every(k=>+k>=9&&+k<=20),welcomingFirstFive:s.byDepth.slice(0,5).every(r=>r.attempts===s.attempts&&r.clears===s.attempts)};}

async function load(dirs){const reports=[],receipts=[];for(const dir of dirs)for(const file of (await readdir(dir)).sort())if(/^(breacher|cryo|pyro|arc)-\d+\.json$/.test(file)){const path=resolve(dir,file),bytes=await readFile(path);reports.push(JSON.parse(bytes));receipts.push({path,sha256:createHash('sha256').update(bytes).digest('hex')});}return{reports,receipts};}
async function main(){
 const opts=Object.fromEntries(process.argv.slice(2).map(s=>{const i=s.indexOf('=');return[s.slice(2,i),s.slice(i+1)];}));
 assert(opts.before&&opts.after&&opts['after-source']&&opts.output,'--before=dir[,dir] --after=dir --after-source=SHA --output=prefix');
 const before=await load(opts.before.split(',')),after=await load(opts.after.split(','));
 const provenance={before:validateCohort(before.reports,{source:'7ceefa5a52cc74a6b95712f29653d9bf523906be',baseline:true}),after:validateCohort(after.reports,{source:opts['after-source']})};
 assert.deepEqual(provenance.before.backendSourceHashes,provenance.after.backendSourceHashes,'Matched backend metrics');
 const describe=rs=>({combined:summarizeCohort(rs),primary:summarizeCohort(rs.filter(r=>L8_PRIMARY_SEEDS.includes(r.seed))),additional:summarizeCohort(rs.filter(r=>!L8_PRIMARY_SEEDS.includes(r.seed)))});
 const result={declaration:'docs/nextgen/plans/L8-N40-VALIDATION.md',provenance,before:describe(before.reports),after:describe(after.reports),receipts:{before:before.receipts,after:after.receipts},matched:before.reports.map(b=>{const a=after.reports.find(r=>r.rig===b.rig&&r.seed===b.seed);return{rig:b.rig,seed:b.seed,before:{outcome:b.outcome,deathRoom:b.deathRoom},after:{outcome:a.outcome,deathRoom:a.deathRoom}};})};
 result.targets={before:cohortTargets(result.before.combined),after:cohortTargets(result.after.combined)};
 const f=x=>x==null?'—':x.toFixed(3);let md=`Fixed forty seeds per rig,160 matched attempts per profile. Full-kit attribution and native browser campaigns remain separate evidence.\n\n|Cohort|Profile|Completion|Max rig distance / range pp|Ordinary s|Transmission s|Rooms / OD|\n|---|---|---|---|---|---|---|\n`;
 for(const set of ['primary','additional','combined'])for(const label of ['before','after']){const s=result[label][set];md+=`|${set}|${label}|${s.complete}/${s.attempts} (${f(s.completionPct)}%)|${f(s.maxRigDistancePp)} / ${f(s.rigRangePp)}|${f(s.strictOrdinarySeconds)}|${f(s.transmissionSeconds)}|${f(s.roomsPerOverdrive)}|\n`;}
 md+='\n|Rig|Before completion|After completion|Before ordinary / Tx / OD|After ordinary / Tx / OD|\n|---|---|---|---|---|\n';for(const rig of rigs){const b=result.before.combined.byRig[rig],a=result.after.combined.byRig[rig];md+=`|${rig}|${b.complete}/${b.attempts}|${a.complete}/${a.attempts}|${f(b.strictOrdinarySeconds)} / ${f(b.transmissionSeconds)} / ${f(b.roomsPerOverdrive)}|${f(a.strictOrdinarySeconds)} / ${f(a.transmissionSeconds)} / ${f(a.roomsPerOverdrive)}|\n`;}
 md+='\n|Room|Before clears / attempts|After clears / attempts|Before seconds / incoming / entry debt|After seconds / incoming / entry debt|\n|---|---|---|---|---|\n';for(let i=0;i<20;i++){const b=result.before.combined.byDepth[i],a=result.after.combined.byDepth[i];md+=`|${i+1} ${a.id}|${b.clears}/${b.attempts}|${a.clears}/${a.attempts}|${f(b.medianClearSeconds)} / ${f(b.incomingDamage)} / ${f(b.entryHealthDebt)}|${f(a.medianClearSeconds)} / ${f(a.incomingDamage)} / ${f(a.entryHealthDebt)}|\n`;}
 md+='\nAcceptance targets (full-kit guard separate):\n\n'+JSON.stringify(result.targets,null,2)+'\n';
 await writeFile(opts.output+'.json',JSON.stringify(result,null,2)+'\n');await writeFile(opts.output+'.md',md);console.log(JSON.stringify(result.targets,null,2));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
