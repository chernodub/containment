import assert from 'node:assert/strict';
import {assertPlayingMarine} from './capture-marine-contract.mjs';
const key=(scenario,room)=>scenario+':'+room;
/** Select complete guarded scenarios. Failed raw parents remain explicit receipts;
 * only a later complete replacement may supply their failed scenario. */
export function selectL8Evidence(captures,rooms,sourceSHA,{calmScenario='combat-calm'}={}){
 assert(['combat-calm','l8-arena-calm'].includes(calmScenario));
 assert(captures.length,'No captures');const reference=captures[0].manifest,selected=new Map(),expected=[];
 assert.equal(reference.viewport.width,1920);assert.equal(reference.viewport.height,1080);assert.equal(reference.deviceScaleFactor,1);
 for(const room of rooms)for(const scenario of [calmScenario,'g6-kiting'])expected.push(key(scenario,room.id));
 for(const capture of captures){
  const m=capture.manifest;
  for(const field of ['viewport','deviceScaleFactor','seed','appAssets','burstStepMs'])assert.deepEqual(m[field],reference[field],`${capture.directory}: mismatched ${field}`);
  assert(m.appAssets&&Object.keys(m.appAssets).length,'No asset hashes');assert(m.distSnapshot?.sourceSHA&&sourceSHA.startsWith(m.distSnapshot.sourceSHA),'Wrong frozen source');
  const failed=new Set((m.failures??[]).map(f=>key(f.scenario,f.room))),knownErrors=(m.failures??[]).flatMap(f=>f.errors??[]).map(e=>JSON.stringify(e));
  for(const error of m.errors??[])assert(knownErrors.includes(JSON.stringify(error)),'Unattributed parent error');
  if(m.fatalError)assert(failed.size,'Unattributed fatal parent failure');
  for(const room of rooms)for(const scenario of [calmScenario,'g6-kiting']){
   const id=key(scenario,room.id);if(failed.has(id))continue;
   const shots=m.shots.filter(s=>s.scenario===scenario&&s.room===room.id).sort((a,b)=>(a.frame??0)-(b.frame??0));
   if(!shots.length)continue;
   assert.deepEqual(shots.map(s=>s.frame),scenario!=='g6-kiting'?[null]:[1,2,3,4],id+' incomplete scenario');
   for(const s of shots){
    assert.match(s.file,/^[\w.-]+\.png$/);assert.deepEqual(s.errors??[],[]);const e=s.evidence;
    assert.equal(e.state,'playing');assert.equal(e.templateId,room.id);assert.deepEqual(e.hudOverlaps,[]);assertPlayingMarine(e,m.viewport,id);
    if(scenario!=='g6-kiting'){
     assert.equal(e.enemies,0);
     if(scenario==='l8-arena-calm'){const p=e.l8ArenaCalmProof;assert(p?.nativeStep&&p.settledTicks===120&&p.cameraOverride===false);assert.deepEqual(p.arena,room.arena);assert.deepEqual({x:e.player.x,y:e.player.y},room.arena);assert.equal(e.phase,'combat');}
    }
    else{
     const p=e.l8FixtureProof;assert(p,'Missing authored G6 proof');assert.deepEqual(p.arena,room.arena);assert.equal(p.cameraOverride,false);assert.equal(p.minimumSpreadActors,10);assert(p.actors.length>=10);assert.equal(new Set(p.actors.map(a=>a.family)).size,5);assert(p.grenadeThrown&&p.shotsAfter>p.shotsBefore);assert(e.stats.shotsFired>=p.shotsAfter);assert.equal(e.phase,'combat');
    }
   }
   if(scenario==='g6-kiting'){assert(shots.some(s=>s.evidence.playerBullets>0),'No real firing projectile');assert(shots.some(s=>s.evidence.muzzle>0),'No real muzzle feedback');}
   selected.set(id,{room,scenario,shots,capture});
  }
 }
 for(const id of expected)assert(selected.has(id),id+' has no complete guarded source');
 return expected.map(id=>selected.get(id));
}
