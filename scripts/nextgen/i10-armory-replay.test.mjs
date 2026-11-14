import {test,afterEach} from 'vitest';
import assert from 'node:assert/strict';
import {Vector3,Quaternion,Matrix4} from 'three';
import {ARMORY_REPLAY_FIXTURE as fixture,ARMORY_REPLAY_SHA256,stageI10ArmoryReplay,inspectI10ArmoryReplay,registerI10ArmoryReplay} from './i10-armory-replay.mjs';
import {assessI10ArmoryReplay,compareI10ArmoryReplay} from './i10-armory-replay-proof.mjs';

const clone=x=>structuredClone(x),payload=()=>({fixture:clone(fixture),fixtureSHA256:ARMORY_REPLAY_SHA256});
afterEach(()=>{delete globalThis.window;});
function harness({illegal=-1,rejectRestore=false,wrongId=false,stuckClock=false,throwRender=false}={}){
 let serial=1,renders=0,prepared=0,spawns=0,realtime=false;const live=new Map(),calls=[];
 const enemies={get activeCount(){return live.size;},get snapshot(){return{activeCount:live.size,reservedCount:0,enemies:[...live.values()]};},reset(){live.clear();serial=1;},remove(id){return live.delete(id);},getSnapshot(id){return live.get(id);},promote(id,champion){live.get(id).champion=champion;}};
 const g={player:{},enemies,combat:{restoreRunResources(value){this.resources=clone(value);return!rejectRestore;}},abilities:{},skipStory(){},update(){throw Error('Simulation must not advance');}};
 const room={heroPixels:100,outside:.03,outsideX:.03,outsideZ:0,smallX:false,smallZ:false,centeredX:false,centeredZ:false};
 const framing={contacts:2,selectedIds:[1,3,-1,-1,-1,-1],focusedPair:true,focusContactId:1,fit:true};
 const r={viewportWidth:1920,viewportHeight:1080,hudInsets:clone(fixture.viewport.insets),camera:{position:new Vector3(),quaternion:new Quaternion(),matrixWorld:new Matrix4(),projectionMatrix:new Matrix4(),projectionMatrixInverse:new Matrix4(),zoom:1},cameraRig:{reset(x,z){calls.push(['origin',x,z]);}},roomCombatFraming:{reset(){calls.push(['roomReset']);},diagnostics:room},get combatFramingDiagnostics(){return framing;},time:0,setHudInsets(i){this.hudInsets=i;},effect(e){calls.push(['effect',clone(e),g.elapsed]);},render(game,dt){assert.equal(game,g);renders++;this.time+=dt;},actorScreenBounds(id,x,y,radius,box){Object.assign(box,{left:50,right:300,top:250+id*10,bottom:500+id*10});return true;},playerScreenBounds(){return{left:250,right:380,top:230,bottom:390};}};
 const productionRender=r.render.bind(r);
 // Model installDebug's exact renderer delta boundary. A direct instance
 // render call in capture mode advances0 even when its caller requests dt>0.
 r.render=(game,dt)=>{if(throwRender)throw Error('Synthetic renderer failure');productionRender(game,realtime&&!stuckClock?dt:0);};
 const d={game:g,renderer:r,events:[],async gotoRoom(room,options){calls.push(['goto',room,options]);},realtime(value){realtime=value;calls.push(['realtime',value]);},setInput(value){calls.push(['input',value]);},grantBoons(values){calls.push(['build',clone(values)]);},canStand(x,y,radius){return x!==illegal;},spawn(type,x,y,elite){spawns++;const id=serial++;live.set(id,{id,type,x,y,elite,radius:fixture.enemies.find(e=>e.type===type)?.radius});return wrongId?id+1:id;},refresh(){calls.push(['refresh']);},async prepare(){prepared++;},step(){throw Error('Simulation must not advance');}};
 globalThis.window={__containmentDebug:d};return{g,r,d,calls,get renders(){return renders;},get prepared(){return prepared;},get spawns(){return spawns;},get realtime(){return realtime;}};
}
test('native-earned Armory replay retains all seven source bodies/IDs, source clock, effect values, and no simulation ticks',async()=>{
 const h=harness(),p=payload();await stageI10ArmoryReplay(p);
 const proof=inspectI10ArmoryReplay();
 assert.equal(h.prepared,1);assert.equal(h.spawns,8);assert.equal(h.g.enemies.activeCount,7);
 assert.deepEqual(proof.sourceEnemies.map(e=>e.id),[1,2,3,4,5,7,8]);
 assert.deepEqual(proof.sourceEnemies.map(e=>[e.id,e.x,e.y,e.health,e.windupMs,e.velocityX,e.velocityY]),fixture.enemies.map(e=>[e.id,e.x,e.y,e.health,e.windupMs,e.velocityX,e.velocityY]));
 assert.deepEqual(h.g.abilities.snapshot,fixture.abilities);assert.deepEqual(h.g.combat.snapshot,fixture.combat);
 assert.equal(proof.simulationAdvancedMs,0);assert.equal(h.g.elapsed,fixture.elapsed);
 assert.deepEqual(h.calls.filter(c=>c[0]==='effect').map(c=>[c[1],c[2]]),[...fixture.events].sort((a,b)=>a.at-b.at).map(e=>[e,e.at]));
 assert.equal(proof.settleTrace.length,12);assert(h.renders>=72);
 assert(Math.abs(proof.presentationClock.timelineAdvancedMs-1000)<1e-5);assert(Math.abs(proof.presentationClock.settleAdvancedMs-200)<1e-5);assert.equal(h.realtime,false);
 assert.deepEqual(proof.sources,fixture.sources);assert.equal(proof.fixtureSHA256,ARMORY_REPLAY_SHA256);
 assert.deepEqual(proof.originalCamera,fixture.camera);assert.equal(proof.originalFraming.framing.fit,false);
 assert.equal(assessI10ArmoryReplay({evidence:{i10ArmoryReplay:proof}},fixture.viewport).passed,true);
 assert.deepEqual(p,payload(),'stage must not rewrite embedded source fixture');
});
test('actual debug-wrapper zero-delta regression fails clock acceptance and realtime mode restores after a renderer throw',async()=>{
 let h=harness({stuckClock:true});await stageI10ArmoryReplay(payload());
 const result=assessI10ArmoryReplay({evidence:{i10ArmoryReplay:inspectI10ArmoryReplay()}},fixture.viewport);
 assert.equal(result.passed,false);assert(result.failures.some(s=>s.includes('clock')));assert.equal(h.realtime,false);
 h=harness({throwRender:true});await assert.rejects(stageI10ArmoryReplay(payload()),/Synthetic renderer failure/);assert.equal(h.realtime,false);
});
test('illegal original marine or enemy poses are rejected without searching/repositioning',async()=>{
 for(const illegal of [fixture.player.x,fixture.enemies[0].x]){const h=harness({illegal});await assert.rejects(stageI10ArmoryReplay(payload()),/no longer legal/);assert.equal(h.calls.some(c=>c[0]==='origin'),false);}
});
test('overlap, changed source IDs, refused native resources and a different viewport fail loudly',async()=>{
 let h=harness(),p=payload();Object.assign(p.fixture.enemies[1],{x:p.fixture.enemies[0].x,y:p.fixture.enemies[0].y});await assert.rejects(stageI10ArmoryReplay(p),/overlap/);
 h=harness({wrongId:true});await assert.rejects(stageI10ArmoryReplay(payload()),/spawn\/ID rejected/);
 h=harness({rejectRestore:true});await assert.rejects(stageI10ArmoryReplay(payload()),/resources were rejected/);
 h=harness();h.r.viewportWidth=1280;await assert.rejects(stageI10ArmoryReplay(payload()),/original 1920x1080/);
});
test('registration is additive, single-frame and idempotent; existing scenarios stay unchanged',()=>{
 const old={id:'old',setup(){return 1;}},scenarios=[old];registerI10ArmoryReplay(scenarios);registerI10ArmoryReplay(scenarios);
 assert.equal(scenarios.length,2);assert.equal(scenarios[0],old);assert.equal(scenarios[1].burst,false);assert.equal(scenarios[1].setupArgument.fixture.enemies.length,7);
});
async function good(){harness();await stageI10ArmoryReplay(payload());return{evidence:{i10ArmoryReplay:inspectI10ArmoryReplay()}};}
test('strict acceptance rejects clipped Warden, clipped marine and selected-ID holes independently of raw fit=true',async()=>{
 for(const mutate of [p=>{p.captureTime.contacts[0].bounds.left=-1;},p=>{p.captureTime.marine.bounds.top=181;},p=>{p.captureTime.marine=null;},p=>{p.captureTime.contacts=p.captureTime.contacts.filter(c=>c.id!==1);}]){const s=await good();mutate(s.evidence.i10ArmoryReplay);assert.equal(assessI10ArmoryReplay(s,fixture.viewport).passed,false);}
});
test('strict acceptance preserves raw fit=false, room-area/axis failures, scale loss and malformed matrices',async()=>{
 for(const mutate of [p=>{p.captureTime.framing.fit=false;},p=>{p.captureTime.roomFraming.outside=.181;},p=>{p.captureTime.roomFraming.outsideX=.181;},p=>{p.captureTime.roomFraming.heroPixels=99;},p=>{p.captureTime.camera.world[2]=NaN;},p=>{p.captureTime.framing.contacts=0;}]){const s=await good();mutate(s.evidence.i10ArmoryReplay);assert.equal(assessI10ArmoryReplay(s,fixture.viewport).passed,false);}
});
test('strict acceptance rejects source pose, ability, hash and inset substitutions',async()=>{
 for(const mutate of [p=>{p.captureTime.player.x+=1;},p=>{p.sourceEnemies[0].windupMs=0;},p=>{p.captureTime.abilities.overdrive.charge=1;},p=>{p.fixtureSHA256='0'.repeat(64);},p=>{p.viewport.insets.top=0;}]){const s=await good();mutate(s.evidence.i10ArmoryReplay);assert.equal(assessI10ArmoryReplay(s,fixture.viewport).passed,false);}
});
test('source comparison acknowledges AA replay non-reproduction and retains direct organic failure; rejects changed timing/origin',async()=>{
 const before=await good(),after=clone(before);let pair=compareI10ArmoryReplay(before,fixture.viewport,after,fixture.viewport);
 assert.equal(pair.passed,true);assert.equal(pair.beforeReplayReproducedBoundsFailure,false);assert.match(pair.qualification,/does not reproduce/);assert.equal(pair.before.originalNativeFailure,true);
 before.evidence.i10ArmoryReplay.captureTime.framing.fit=false;pair=compareI10ArmoryReplay(before,fixture.viewport,after,fixture.viewport);assert.equal(pair.beforeReplayReproducedBoundsFailure,true);assert.equal(pair.passed,true);assert(pair.before.failures.includes('Raw native fit=false'));
 after.evidence.i10ArmoryReplay.origin.x+=1;assert.equal(compareI10ArmoryReplay(before,fixture.viewport,after,fixture.viewport).passed,false);
});
test('malformed before evidence rejects the complete comparison even when corrected after passes',async()=>{
 const after=await good();
 for(const mutate of [p=>{delete p.captureTime.player;},p=>{delete p.captureTime.abilities;},p=>{p.sourceEnemies[0].health=999;},p=>{p.captureTime.marine=null;},p=>{p.captureTime.roomFraming.heroPixels=99;},p=>{p.captureTime.contacts[0].insideUsable=false;},p=>{p.captureTime.contacts[0].bounds=null;p.captureTime.contacts[0].insideUsable=false;},p=>{p.originalFraming.framing.fit=true;},p=>{p.sourceElapsed+=1;p.captureTime.elapsed+=1;}]){
  const before=clone(after);before.evidence.i10ArmoryReplay.captureTime.framing.fit=false;mutate(before.evidence.i10ArmoryReplay);
  const pair=compareI10ArmoryReplay(before,fixture.viewport,after,fixture.viewport);
  assert.equal(pair.after.passed,true);assert.equal(pair.commonFixtureOriginTiming,true);assert.equal(pair.beforeIntegrityPassed,false);assert.equal(pair.passed,false);assert(pair.beforeIntegrityFailures.length>0);
 }
});
