import {test} from 'vitest';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DispatchObservation,readDispatchSample} from '../scripts/nextgen/l8-dispatch-observation.mjs';
import {instrumentDispatchCore} from '../scripts/nextgen/l8-dispatch-observer.mjs';
import {assertObservationParity} from '../scripts/nextgen/l8-dispatch-audit.mjs';
const makeGame=()=>({node:{id:'test'},elapsed:0,director:{plan:{schedule:[{spawnId:'a',atMs:650,enemyId:'carrier'},{spawnId:'b',atMs:740,enemyId:'spitter'}]},snapshot:{elapsedMs:0,dispatched:0,phase:'combat',concurrentCap:15}},enemies:{activeCount:0,reservedCount:0,snapshot:{enemies:[]}},pending:[],stats:{overdrivesUsed:0},abilities:{snapshot:{overdrive:{charge:.8,active:false,activeRemainingMs:0,ready:false}}}});
test('observer copies the original plan and never mutates frozen native reads',()=>{
    const g=makeGame();g.pending.push({type:'carrier'},{type:'spitter'});
    const before=structuredClone(g);const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}};freeze(g);
    const o=new DispatchObservation(g),s=readDispatchSample(g);assert.equal(s.pendingOccupancy,5);assert.deepEqual(g,before);assert.notEqual(o.data.schedule,g.director.plan.schedule);assert.notEqual(o.data.schedule[0],g.director.plan.schedule[0]);
    o.finish(g);assert.deepEqual(g,before);
});
test('actual count delta records every dispatched request and exact native-update bracket',()=>{
    const g=makeGame(),o=new DispatchObservation(g),before=readDispatchSample(g);
    g.elapsed=3;g.director.snapshot={...g.director.snapshot,elapsedMs:3000,dispatched:2};g.enemies.activeCount=10;
    const after=readDispatchSample(g);o.record(before,after,'native-update');
    assert.deepEqual(o.data.dispatches.map(r=>r.request.spawnId),['a','b']);assert.equal(o.data.dispatches[1].eligibilityDelayMaxMs,2260);assert.equal(o.data.dispatches[0].intervalStartMs,0);assert.equal(o.data.dispatches[0].intervalEndMs,3000);assert.equal(o.data.dispatches[0].after.live,10);
    o.record(after,after,'repeat');assert.equal(o.data.dispatches.length,2);
});
test('normal and elite Spitter schedule/live counts stay separate',()=>{
    const g=makeGame();g.director.plan.schedule.push({spawnId:'c',atMs:900,enemyId:'spitter',elite:true});
    g.enemies.snapshot.enemies=[{type:'spitter',health:10,elite:false},{type:'spitter',health:20,elite:true},{type:'spitter',health:0,elite:true},{type:'brute',health:50,elite:true}];
    const o=new DispatchObservation(g);assert.deepEqual(o.data.scheduledSpitters,{normal:1,elite:1});assert.deepEqual(o.data.start.liveSpitters,{normal:1,elite:1});
});
test('accepted key, active interval, ready meter and Whiteout events remain distinct',()=>{
    const g=makeGame(),o=new DispatchObservation(g);g.abilities.snapshot.overdrive={charge:1,ready:true,active:false,activeRemainingMs:0};let before=readDispatchSample(g);
    g.stats.overdrivesUsed=1;g.abilities.snapshot.overdrive.charge=0;g.abilities.snapshot.overdrive.ready=false;o.record(before,readDispatchSample(g),'native-key:v');
    before=readDispatchSample(g);g.elapsed=.1;g.abilities.snapshot.overdrive.active=true;g.abilities.snapshot.overdrive.activeRemainingMs=8000;o.record(before,readDispatchSample(g),'native-update');
    const event={type:'ability',ability:{slot:'overdrive',ability:'whiteout',phase:'impact',durationMs:8000,targetIds:[2,3],totalDamage:40}};o.effect(event,g);event.ability.targetIds.push(4);
    assert.equal(o.data.acceptedOverdrives.length,1);assert.equal(o.data.activeTransitions[0].active,true);assert.equal(o.data.meterTransitions.length,1);assert.deepEqual(o.data.overdriveEvents[0].targetIds,[2,3]);assert.equal(o.data.overdriveEvents[0].elapsedMs,100);
});
test('source instrumentation is deterministic and leaves each native action exactly once',async()=>{
    const core=await readFile('scripts/nextgen/playtest/sim-core.ts','utf8'),out=instrumentDispatchCore(core,'/observer.mjs');assert.equal(instrumentDispatchCore(core,'/observer.mjs'),out);
    for(const anchor of ['game.update(step, input);','applyNativeImmediateKey(game, key, readInput);','const actions = chooseActions(s);'])assert.equal(out.split(anchor).length,2,anchor);
    assert.equal(await readFile('scripts/nextgen/playtest/sim-core.ts','utf8'),core);assert.throws(()=>instrumentDispatchCore('unrecognized','/observer.mjs'),/source anchor/);
});
test('parity permits only observation and receipt fields, rejects gameplay changes',()=>{
    const vanilla={rig:'cryo',seed:1729,wallSeconds:1,head:'original',rooms:[{boons:['cryo'],startHealth:100,seconds:30}],stats:{kills:20},final:{health:90},outcome:'complete'};
    const observed=structuredClone(vanilla);observed.rooms[0].dispatchObservation={events:[]};observed.l8Diagnostic={diagnostic:true};observed.wallSeconds=2;observed.head='observed';assertObservationParity(vanilla,observed);
    for(const mutate of [r=>r.rooms[0].startHealth--,r=>r.rooms[0].boons.push('unexpected'),r=>r.stats.kills++,r=>r.final.health--,r=>r.outcome='dead']){const changed=structuredClone(observed);mutate(changed);assert.throws(()=>assertObservationParity(vanilla,changed),/Original gameplay fields differ/);}
});
