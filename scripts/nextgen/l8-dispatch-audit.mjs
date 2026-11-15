#!/usr/bin/env node
/** Supplemental observer parity first; never a release cohort validator. */
import assert from 'node:assert/strict';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {L8_POLICY,L8_BACKEND,median} from './l8-cohort-summary.mjs';
const rigs=['breacher','cryo','pyro','arc'],seeds=[1729,2718];
const source='c7c75b985a30eb297596680cff9735e2ca86d6de';
const receiptKeys=['head','backendProvenance','gameRef','bundleHash','policyHash','gameHash','wallSeconds','l8Diagnostic'];
export function nativeObservationFields(report) {
    const out=structuredClone(report);
    for(const key of receiptKeys)delete out[key];
    for(const room of out.rooms)delete room.dispatchObservation;
    return out;
}
export function assertObservationParity(vanilla,observed) {
    assert.deepEqual(nativeObservationFields(observed),nativeObservationFields(vanilla),`Original gameplay fields differ: ${vanilla.rig}/${vanilla.seed}`);
}
async function load(dir,filterSeeds=true){const rows=[],receipts=[];for(const file of(await readdir(dir)).sort())if(/^(breacher|cryo|pyro|arc)-\d+\.json$/.test(file)){const path=resolve(dir,file),bytes=await readFile(path),r=JSON.parse(bytes);if(filterSeeds&&!seeds.includes(r.seed))continue;rows.push(r);receipts.push({path,sha256:createHash('sha256').update(bytes).digest('hex')});}return{rows,receipts};}
function roomTimeline(room){
    const o=room.dispatchObservation;assert(o,'Missing observation for earned room '+room.id);
    assert.equal(o.dispatches.length,o.end.dispatched-o.start.dispatched,'Every actual dispatch captured');
    const rel=sample=>sample.elapsedMs-o.start.elapsedMs;
    const tail=o.dispatches.at(-1),lastEnd=o.activeTransitions.filter(t=>!t.active).at(-1);
    return{id:room.id,depth:room.depth,result:room.result,seconds:room.seconds,damageTaken:room.damageTaken,
        damageDealt:room.damageDealt,entryVitality:room.startHealth+room.startArmor,
        requests:o.schedule.length,dispatched:o.dispatches.length,scheduledSpitters:o.scheduledSpitters,
        nominalTailMs:o.schedule.at(-1)?.atMs??null,
        actualTailBracketMs:tail?[tail.intervalStartMs,tail.intervalEndMs]:null,
        medianEligibilityDelayBracketMs:[median(o.dispatches.map(d=>d.eligibilityDelayMinMs)),median(o.dispatches.map(d=>d.eligibilityDelayMaxMs))],
        dispatchDefinitelyWhileOverdriveActive:o.dispatches.filter(d=>d.before.overdrive.active&&d.after.overdrive.active).length,
        dispatchPossiblyWhileOverdriveActive:o.dispatches.filter(d=>d.before.overdrive.active||d.after.overdrive.active).length,
        dispatchAfterLastObservedActiveEnd:lastEnd?o.dispatches.filter(d=>d.before.elapsedMs>=lastEnd.after.elapsedMs).length:null,
        startOverdrive:o.start.overdrive,
        acceptedOverdrives:o.acceptedOverdrives.map(t=>({source:t.source,atRoomMs:[rel(t.before),rel(t.after)],chargeBefore:t.before.overdrive.charge,liveBefore:t.before.live})),
        activeTransitions:o.activeTransitions.map(t=>({active:t.active,atRoomMs:[rel(t.before),rel(t.after)],activeRemainingMs:t.after.overdrive.activeRemainingMs})),
        overdriveEvents:o.overdriveEvents.map(e=>({...e,atRoomMs:e.elapsedMs-o.start.elapsedMs})),
        maxObservedOccupancy:Math.max(...o.liveSeries.map(s=>s.live+s.reserved+s.pendingOccupancy)),
        maxObservedNormalSpitters:Math.max(...o.liveSeries.map(s=>s.liveSpitters.normal)),
        maxObservedEliteSpitters:Math.max(...o.liveSeries.map(s=>s.liveSpitters.elite)),
        limitation:o.limitation};
}
async function main(){
    const args=Object.fromEntries(process.argv.slice(2).map(s=>{const i=s.indexOf('=');return[s.slice(2,i),s.slice(i+1)];}));
    assert(args.control&&args.observed&&args.output,'--control=dir --observed=dir --output=prefix');
    const control=await load(resolve(args.control)),observed=await load(resolve(args.observed),false);
    assert.equal(control.rows.length,8);assert.equal(observed.rows.length,8,'All eight attempts retained');
    for(const rig of rigs)assert.deepEqual(observed.rows.filter(r=>r.rig===rig).map(r=>r.seed).sort((a,b)=>a-b),seeds);
    // Complete parity gate precedes any timeline interpretation or output.
    for(const o of observed.rows){const v=control.rows.find(r=>r.rig===o.rig&&r.seed===o.seed);assert(v);
        assert.equal(v.backendProvenance.backendHash,L8_BACKEND);assert.equal(v.gameRef,source);
        assert.equal(o.gameRef,source);assert.equal(o.policyHash,L8_POLICY);assert.equal(v.policyHash,L8_POLICY);
        assert.equal(o.gameHash,v.gameHash,'Actual gameplay source identical');
        assert.equal(o.l8Diagnostic?.diagnostic,true);assert.equal(o.l8Diagnostic?.acceptance,false);assert.equal(o.l8Diagnostic?.geometryOverride,false);
        assert.equal(o.l8Diagnostic.originalCoreSHA256,v.backendProvenance.sourceHashes['sim-core.ts']);
        assert.equal(o.l8Diagnostic.observedCoreSHA256,o.backendProvenance.sourceHashes['sim-core.ts']);
        for(const file of ['sim.mjs','sim-native-emulation.ts','sim-metrics.mjs','sim-worker.mjs'])assert.equal(o.backendProvenance.sourceHashes[file],v.backendProvenance.sourceHashes[file],file+' untouched');
        assertObservationParity(v,o);
    }
    const allIds=control.rows.find(r=>r.rooms.length===20)?.rooms.map(r=>r.id);assert.equal(allIds?.length,20);
    const rows=observed.rows.map(r=>({rig:r.rig,seed:r.seed,outcome:r.outcome,deathRoom:r.deathRoom,
        earnedRooms:r.rooms.map(roomTimeline),earnedRoomGaps:allIds.filter(id=>!r.rooms.some(room=>room.id===id))}));
    const result={diagnostic:true,acceptance:false,parityPassed:true,attempts:8,source,policyHash:L8_POLICY,
        declaration:'docs/nextgen/plans/L8-navigation-control.md',
        warning:'Supplemental fixed two-seed diagnostic. Actual dispatch times are native-update brackets. No rig-causal or pressure-selection conclusion follows automatically.',rows,receipts:{control:control.receipts,observed:observed.receipts}};
    await writeFile(args.output+'.json',JSON.stringify(result,null,2)+'\n');
    const f=x=>Number.isFinite(x)?x.toFixed(2):'—';let md='SUPPLEMENTAL DIAGNOSTIC ONLY. Eight attempts; exact original gameplay-field parity passed against vanilla c7 before timeline interpretation. No gameplay change selected.\n\n|Rig / seed|Outcome|Earned-room gaps|\n|---|---|---|\n';for(const r of rows)md+=`|${r.rig}/${r.seed}|${r.outcome}${r.deathRoom?' room'+r.deathRoom:''}|${r.earnedRoomGaps.join(', ')||'none'}|\n`;
    md+='\n|Rig / seed / room|Normal / elite Spitters planned|Nominal / actual tail ms|Start OD charge|OD accepted room ms|Dispatches definitely / possibly during OD|\n|---|---:|---|---:|---|---:|\n';
    for(const r of rows)for(const room of r.earnedRooms.filter(x=>x.depth>=10))md+=`|${r.rig}/${r.seed}/${room.id}|${room.scheduledSpitters.normal} / ${room.scheduledSpitters.elite}|${room.nominalTailMs} / ${room.actualTailBracketMs?.map(f).join('–')??'none'}|${f(room.startOverdrive.charge)}|${room.acceptedOverdrives.map(t=>t.atRoomMs.map(f).join('–')).join(', ')||'none'}|${room.dispatchDefinitelyWhileOverdriveActive} / ${room.dispatchPossiblyWhileOverdriveActive}|\n`;
    await writeFile(args.output+'.md',md);console.log(JSON.stringify({parityPassed:true,attempts:8,rows:rows.map(r=>({rig:r.rig,seed:r.seed,outcome:r.outcome,deathRoom:r.deathRoom,gaps:r.earnedRoomGaps}))},null,2));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
