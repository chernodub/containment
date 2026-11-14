#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {activeSelectedContactIds,missingSelectedContactIds} from './i10-selected-contacts.mjs';
import {ARMORY_REPLAY_FIXTURE,ARMORY_REPLAY_SHA256} from './i10-armory-replay.mjs';

const finite=n=>typeof n==='number'&&Number.isFinite(n);
const boundsValid=b=>b&&['left','right','top','bottom'].every(k=>finite(b[k]))&&b.left<=b.right&&b.top<=b.bottom;
const inside=(b,v)=>boundsValid(b)&&b.left>=v.insets.left&&b.right<=v.width-v.insets.right&&b.top>=v.insets.top&&b.bottom<=v.height-v.insets.bottom;

/** Keep every raw failure; no bearing-marker substitute for this feasible pair. */
export function assessI10ArmoryReplay(shot,viewport){
 const p=shot?.evidence?.i10ArmoryReplay,c=p?.captureTime,failures=[];
 const require=(value,reason)=>{if(!value)failures.push(reason);};
 require(p?.label?.includes('not organic'),'Replay label/provenance absent');
 require(p?.fixtureSHA256?.length===64&&p.sources?.length===2,'Fixture/source hash receipts absent');
 require(c&&viewport?.width===1920&&viewport?.height===1080,'Original viewport or capture-time receipt absent');
 if(!p||!c||!viewport)return{passed:false,failures};
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),{screen,...sourcePlayer}=ARMORY_REPLAY_FIXTURE.player;
 const sourceEnemies=ARMORY_REPLAY_FIXTURE.enemies.map(({clear,visible,screen,...e})=>e);
 require(p.fixtureSHA256===ARMORY_REPLAY_SHA256&&same(p.sources,ARMORY_REPLAY_FIXTURE.sources),'Replay differs from the fixed source-hash fixture');
 require(same(p.viewport,ARMORY_REPLAY_FIXTURE.viewport),'Original HUD inset/viewport receipt changed');
 require(same(p.originalCamera,ARMORY_REPLAY_FIXTURE.camera)&&same(p.originalFraming,ARMORY_REPLAY_FIXTURE.originalFraming),'Original native camera/failure receipt changed');
 require(p.sourceElapsed===ARMORY_REPLAY_FIXTURE.elapsed&&same(p.presentation,ARMORY_REPLAY_FIXTURE.presentation),'Original source clock or replay timing changed');
 require(same(p.origin,{x:ARMORY_REPLAY_FIXTURE.camera.position[0],z:ARMORY_REPLAY_FIXTURE.camera.position[2]-ARMORY_REPLAY_FIXTURE.camera.position[1]*19/26}),'Original-derived camera origin changed');
 require(same(p.sourcePlayer,sourcePlayer)&&same(c.player,sourcePlayer),'Original player body/pose/velocity changed');
 require(same(p.sourceEnemies,sourceEnemies),'Original enemy values changed');
 require(same(p.sourceAbilities,ARMORY_REPLAY_FIXTURE.abilities)&&same(c.abilities,ARMORY_REPLAY_FIXTURE.abilities),'Original ability values changed');
 require(p.simulationAdvancedMs===0&&c.elapsed===p.sourceElapsed,'Replay advanced simulation');
 require(p.population===7&&p.nativeSpawns?.length===7&&p.nativeSpawns.every(s=>s.legal),'Original seven native spawn/collision receipts lost');
 require(p.sourceEnemies?.length===7&&c.contacts?.length===7,'Original body population changed');
 const required=p.requiredContactId;
 require(required===1&&p.sourceEnemies?.some(e=>e.id===required&&e.type==='brute'&&e.champion==='warden'),'Original Warden identity lost');
 for(const e of p.sourceEnemies??[]){const contact=c.contacts?.find(c=>c.id===e.id);require(contact&&contact.sourceX===e.x&&contact.sourceY===e.y,'Original pose changed/missing: '+e.id);require(boundsValid(contact?.bounds),'Missing/malformed body bounds: '+e.id);}
 require(p.presentation?.settleFrames===12&&p.settleTrace?.length===12&&p.presentation?.settleStepMs===1000/60,'Common production settle timing changed');
 const clock=p.presentationClock,near=(a,b)=>finite(a)&&finite(b)&&Math.abs(a-b)<=1e-5;
 require(clock&&near(clock.timelineStart,p.sourceElapsed-1)&&near(clock.timelineEnd,p.sourceElapsed)&&near(clock.timelineAdvancedMs,1000)&&near(clock.settleStart,clock.timelineEnd)&&near(clock.settleAdvancedMs,200)&&near(clock.settleEnd-clock.settleStart,.2),'Actual production presentation clock did not advance 1000ms timeline plus200ms settle');
 require(clock&&near(c.rendererTime,clock.settleEnd)&&p.settleTrace?.every((row,n)=>row.frame===n+1&&near(row.rendererTime,clock.settleStart+(n+1)/60)),'Actual per-frame settle clock/capture time is inconsistent');
 require(c.camera?.world?.length===16&&c.camera.world.every(finite)&&c.camera?.projection?.length===16&&c.camera.projection.every(finite),'Actual matrix receipt absent/malformed');
 const r=c.roomFraming;
 require(r&&finite(r.heroPixels)&&r.heroPixels>=100*viewport.height/1080-.05,'Hero below 100px floor');
 require(r&&(r.smallX?r.centeredX:finite(r.outsideX)&&r.outsideX<=.18001)&&(r.smallZ?r.centeredZ:finite(r.outsideZ)&&r.outsideZ<=.18001),'Qualified room-axis constraint failed');
 require(r&&(r.smallX||r.smallZ||finite(r.outside)&&r.outside<=.18001),'Room outside area exceeds18%');
 const v={...viewport,insets:p.viewport.insets};
 require(inside(c.marine?.bounds,v),'Marine full body clips usable viewport');
 require(c.marine?.insideUsable===inside(c.marine?.bounds,v),'Marine raw insideUsable disagrees with saved bounds');
 let selected=[];
 try{selected=activeSelectedContactIds(c.framing,'Armory replay');}catch(error){failures.push(String(error));}
 require(selected.length>0,'No selected native contact');
 const missing=missingSelectedContactIds(selected,c.contacts??[]);require(!missing.length,'Missing selected IDs: '+missing.join(','));
 for(const id of new Set([...selected,required])){const contact=c.contacts?.find(c=>c.id===id);require(inside(contact?.bounds,v),'Selected/required body clips usable viewport: '+id);require(contact?.insideUsable===inside(contact?.bounds,v),'Contact raw insideUsable disagrees: '+id);}
 require(c.framing?.fit===true,'Raw native fit=false');
 const original=p.originalFraming,originalSelected=original?.contacts?.filter(e=>e.selected)??[];
 const originalNativeFailure=original?.framing?.fit===false&&originalSelected.some(c=>c.insideUsable===false);
 return {passed:!failures.length,failures,selectedIds:selected,requiredContactId:required,originalNativeFailure,originalNativeFraming:original?.framing??null,originalNativeContacts:originalSelected,raw:{framing:c.framing,roomFraming:r,marine:c.marine,selectedContacts:c.contacts?.filter(e=>selected.includes(e.id)||e.id===required)},fixtureSHA256:p.fixtureSHA256,sources:p.sources,origin:p.origin,presentation:p.presentation};
}

export function compareI10ArmoryReplay(before,beforeViewport,after,afterViewport){
 const a=assessI10ArmoryReplay(before,beforeViewport),b=assessI10ArmoryReplay(after,afterViewport);
 const common=JSON.stringify([a.fixtureSHA256,a.sources,a.origin,a.presentation])===JSON.stringify([b.fixtureSHA256,b.sources,b.origin,b.presentation]);
 const expectedBeforeFailure=reason=>reason==='Raw native fit=false'||/^Selected\/required body clips usable viewport: -?\d+$/.test(reason);
 const beforeIntegrityFailures=a.failures.filter(reason=>!expectedBeforeFailure(reason)),beforeIntegrityPassed=beforeIntegrityFailures.length===0;
 return {passed:common&&beforeIntegrityPassed&&a.originalNativeFailure===true&&b.passed,commonFixtureOriginTiming:common,beforeIntegrityPassed,beforeIntegrityFailures,beforeReplayReproducedBoundsFailure:a.failures.some(expectedBeforeFailure),qualification:!beforeIntegrityPassed?'Before replay has integrity failures beyond the expected selected-body clipping/raw fit=false. Reject this comparison; preserve the failed receipt and recapture the unchanged fixture.':a.passed?'AA replay settles to a fit; it does not reproduce the organic failure. Retain original organic PNG/JSON and independent exact CPU regression as direct failure evidence.':'AA replay retains raw bounds/fit failures; original organic PNG/JSON remains the direct native failure evidence.',before:a,after:b};
}

async function main(){
 const opts=Object.fromEntries(process.argv.slice(2).map(arg=>{assert(/^--(before|after|out)=/.test(arg),'Use --before=manifest.json --after=manifest.json [--out=result.json]');const n=arg.indexOf('=');return[arg.slice(2,n),arg.slice(n+1)];}));
 assert(opts.before&&opts.after,'Both original-source and corrected-source manifests are required');
 const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
 const read=async file=>{const bytes=await readFile(resolve(file)),m=JSON.parse(bytes),shots=m.shots.filter(s=>s.scenario==='i10-organic-armory-replay');assert(shots.length===1,'Expected one unchanged single-frame Armory replay per manifest');assert(!m.errors.length&&!m.failures.length,'Capture itself failed');const pngPath=resolve(dirname(resolve(file)),shots[0].file),png=await readFile(pngPath);return{m,shot:shots[0],receipt:{path:resolve(file),sha256:hash(bytes),png:{path:pngPath,sha256:hash(png)},sourceSHA:m.distSnapshot?.sourceSHA??m.gitSHA,appAssets:m.appAssets}};};
 const a=await read(opts.before),b=await read(opts.after);
 const differentApplicationSource=a.receipt.sourceSHA!==b.receipt.sourceSHA;
 const result={...compareI10ArmoryReplay(a.shot,a.m.viewport,b.shot,b.m.viewport),differentApplicationSource,manifests:{before:a.receipt,after:b.receipt},note:'Scoped native-earned-state presentation replay; no organic campaign, complete simulation restoration or universal camera acceptance is inferred.'};
 const source=ARMORY_REPLAY_FIXTURE.sources[0],sourceBytes=await readFile(resolve(source.path)),organicPNG=source.path.replace(/\.json$/,'.png'),organicBytes=await readFile(resolve(organicPNG));
 result.originalOrganicFailureEvidence={json:{path:resolve(source.path),sha256:hash(sourceBytes),expectedSHA256:source.sha256},png:{path:resolve(organicPNG),sha256:hash(organicBytes)},framing:ARMORY_REPLAY_FIXTURE.originalFraming};
 result.passed&&=hash(sourceBytes)===source.sha256;
 result.passed&&=differentApplicationSource;
 if(opts.out)await writeFile(resolve(opts.out),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));process.exitCode=result.passed?0:1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
