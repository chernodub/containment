import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const fixtureBytes=readFileSync(new URL('./fixtures/i10-organic-armory-replay.json',import.meta.url));
export const ARMORY_REPLAY_FIXTURE=JSON.parse(fixtureBytes);
export const ARMORY_REPLAY_SHA256=createHash('sha256').update(fixtureBytes).digest('hex');

/** Saved native-earned values, frozen for presentation; never a simulated campaign. */
export async function stageI10ArmoryReplay(payload){
 const {fixture:f,fixtureSHA256}=payload,d=window.__containmentDebug,g=d.game,r=d.renderer;
 const clone=value=>JSON.parse(JSON.stringify(value));
 const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const w=r.viewportWidth,h=r.viewportHeight;
 if(w!==f.viewport.width||h!==f.viewport.height)throw Error('Armory replay requires the original 1920x1080 desktop viewport');
 await d.gotoRoom(f.room,{rig:f.rig,version:f.run.version,seed:f.seed});
 d.realtime(false);d.setInput({x:0,y:0,fire:false,angle:f.player.angle,autoAim:false});
 d.grantBoons(f.build.mutations);g.skipStory();g.enemies.reset();
 const {screen,...player}=f.player;Object.assign(g.player,clone(player));
 if(!d.canStand(player.x,player.y,player.radius))throw Error('Original Armory marine position is no longer legal');
 const enemies=clone(f.enemies).map(({clear,visible,screen,...enemy})=>enemy),nativeSpawns=[];
 let next=1;
 for(const e of enemies){
  if(!d.canStand(e.x,e.y,e.radius))throw Error('Original Armory enemy position is no longer legal: '+e.id);
  // Native IDs are part of the source, including the deceased ID6 gap. The
  // temporary allocator entry is immediately removed, never a saved actor.
  while(next<e.id){const skipped=d.spawn(e.type,e.x,e.y,e.elite);if(skipped!==next||!g.enemies.remove(skipped))throw Error('Armory native ID gap allocation failed');next++;}
  const id=d.spawn(e.type,e.x,e.y,e.elite);if(id!==e.id)throw Error('Armory native spawn/ID rejected '+e.id);next++;
  if(e.champion)g.enemies.promote(id,e.champion);
  const native=g.enemies.getSnapshot(id);
  if(!native||native.radius!==e.radius)throw Error('Armory native footprint changed '+e.id);
  nativeSpawns.push({id,type:e.type,x:e.x,y:e.y,radius:e.radius,champion:e.champion??null,legal:true});
 }
 if(g.enemies.activeCount!==f.enemies.length)throw Error('Armory replay lost original population');
 for(let n=0;n<enemies.length;n++)for(let m=n+1;m<enemies.length;m++){
  const a=enemies[n],b=enemies[m];if(Math.hypot(a.x-b.x,a.y-b.y)<a.radius+b.radius-.05)throw Error('Original Armory enemy footprints overlap: '+a.id+','+b.id);
 }
 if(!g.combat.restoreRunResources(clone(f.resources)))throw Error('Original Armory resources were rejected');
 const savedEnemies=freeze(enemies),enemySnapshot=freeze({activeCount:enemies.length,reservedCount:enemies.reduce((n,e)=>n+e.reservedChildren,0),enemies:savedEnemies});
 // EnemySystem's private AI state is not serializable from the observation.
 // Exact saved presentation snapshots explicitly replace getters only in this
 // debug page, with simulation unadvanced. No application behavior is patched.
 Object.defineProperty(g.enemies,'snapshot',{configurable:true,get:()=>enemySnapshot});
 g.enemies.getSystemSnapshot=()=>enemySnapshot;g.enemies.getSnapshot=id=>savedEnemies.find(e=>e.id===id)??null;
 const abilities=freeze(clone(f.abilities)),combat=freeze(clone(f.combat)),stats=freeze(clone(f.stats));
 Object.defineProperty(g.abilities,'snapshot',{configurable:true,get:()=>abilities});
 Object.defineProperty(g.combat,'snapshot',{configurable:true,get:()=>combat});
 Object.defineProperty(g,'stats',{configurable:true,get:()=>stats});
 g.elapsed=f.elapsed;g.bullets=[];g.pools=[];g.pending=[];
 d.refresh();await d.prepare();
 r.setHudInsets(clone(f.viewport.insets));d.events.length=0;
 const events=clone(f.events).sort((a,b)=>a.at-b.at),start=f.elapsed-f.presentation.timelineMs/1000;
 let eventIndex=0,elapsed=start;r.time=start;
 const presentationClock={timelineStart:r.time,timelineEnd:0,settleStart:0,settleEnd:0,timelineAdvancedMs:0,settleAdvancedMs:0};
 const trace=[];
 // installDebug normally forces renderer delta0. Enable its supported realtime
 // mode only for this synchronous renderer-only span: no awaits, RAF callbacks
 // or game updates can interleave; always restore capture mode on failure.
 d.realtime(true);
 try{
 while(elapsed<f.elapsed-1e-9){
  const nextTime=Math.min(f.elapsed,elapsed+f.presentation.stepMs/1000);
  while(eventIndex<events.length&&events[eventIndex].at<=nextTime+1e-9){g.elapsed=events[eventIndex].at;r.effect(clone(events[eventIndex++]));}
  g.elapsed=nextTime;r.render(g,nextTime-elapsed,false);elapsed=nextTime;
 }
 g.elapsed=f.elapsed;
 presentationClock.timelineEnd=r.time;presentationClock.timelineAdvancedMs=(r.time-presentationClock.timelineStart)*1000;
 // Same original ground-look origin, with explicitly zeroed unknown spring
 // velocity/impulses. Every subsequent pose is solved by production render.
 const origin={x:f.camera.position[0],z:f.camera.position[2]-f.camera.position[1]*19/26};
 r.cameraRig.reset(origin.x,origin.z);r.roomCombatFraming.reset();
 const matrix=()=>({position:r.camera.position.toArray(),quaternion:r.camera.quaternion.toArray(),zoom:r.camera.zoom,world:r.camera.matrixWorld.toArray(),projection:r.camera.projectionMatrix.toArray(),inverseProjection:r.camera.projectionMatrixInverse.toArray()});
 presentationClock.settleStart=r.time;
 for(let n=0;n<f.presentation.settleFrames;n++){
  r.render(g,f.presentation.settleStepMs/1000,false);
  trace.push({frame:n+1,rendererTime:r.time,camera:matrix(),framing:clone(r.combatFramingDiagnostics),roomFraming:clone(r.roomCombatFraming.diagnostics)});
 }
 presentationClock.settleEnd=r.time;presentationClock.settleAdvancedMs=(r.time-presentationClock.settleStart)*1000;
 }finally{d.realtime(false);}
 d.refresh();
 if(!same(player,Object.fromEntries(Object.keys(player).map(k=>[k,g.player[k]])))||!same(savedEnemies,enemies)||g.elapsed!==f.elapsed)throw Error('Armory replay moved original state');
 const boundsFor=(id,x,y,radius)=>{const bounds={left:0,right:0,top:0,bottom:0};if(!r.actorScreenBounds(id,x,y,radius,bounds))return null;const i=r.hudInsets;return{bounds,insideUsable:bounds.left>=i.left&&bounds.right<=w-i.right&&bounds.top>=i.top&&bounds.bottom<=h-i.bottom};};
 const contacts=enemies.map(e=>({id:e.id,type:e.type,sourceX:e.x,sourceY:e.y,...boundsFor(e.id,e.x,e.y,e.radius)}));
 const marineBounds={...r.playerScreenBounds(player.radius)},i=r.hudInsets;
 const marine={bounds:marineBounds,insideUsable:marineBounds.left>=i.left&&marineBounds.right<=w-i.right&&marineBounds.top>=i.top&&marineBounds.bottom<=h-i.bottom};
 const origin={x:f.camera.position[0],z:f.camera.position[2]-f.camera.position[1]*19/26};
 const matrix=()=>({position:r.camera.position.toArray(),quaternion:r.camera.quaternion.toArray(),zoom:r.camera.zoom,world:r.camera.matrixWorld.toArray(),projection:r.camera.projectionMatrix.toArray(),inverseProjection:r.camera.projectionMatrixInverse.toArray()});
 d.i10ArmoryReplayProof={label:f.label,fixtureSHA256,sources:clone(f.sources),limitations:clone(f.limitations),sourceElapsed:f.elapsed,simulationAdvancedMs:0,population:enemies.length,nativeSpawns,sourcePlayer:clone(player),sourceEnemies:clone(savedEnemies),sourceAbilities:clone(abilities),originalFraming:clone(f.originalFraming),originalCamera:clone(f.camera),origin,viewport:clone(f.viewport),presentation:clone(f.presentation),presentationClock,rendererTime:r.time,settleTrace:trace,camera:matrix(),framing:clone(r.combatFramingDiagnostics),roomFraming:clone(r.roomCombatFraming.diagnostics),requiredContactId:f.requiredContactId,contacts,marine};
}

/** Read the actual capture-time matrix as later native refreshes may solve again. */
export function inspectI10ArmoryReplay(){
 const d=window.__containmentDebug,g=d.game,r=d.renderer,p=d.i10ArmoryReplayProof;
 if(!p)throw Error('Armory replay setup receipt is missing');
 const i=r.hudInsets,w=r.viewportWidth,h=r.viewportHeight;
 const inside=b=>b.left>=i.left&&b.right<=w-i.right&&b.top>=i.top&&b.bottom<=h-i.bottom;
 const marineBounds={...r.playerScreenBounds(g.player.radius)};
 return {...p,captureTime:{rendererTime:r.time,elapsed:g.elapsed,player:Object.fromEntries(Object.keys(p.sourcePlayer).map(k=>[k,g.player[k]])),abilities:JSON.parse(JSON.stringify(g.abilities.snapshot)),camera:{position:r.camera.position.toArray(),quaternion:r.camera.quaternion.toArray(),zoom:r.camera.zoom,world:r.camera.matrixWorld.toArray(),projection:r.camera.projectionMatrix.toArray(),inverseProjection:r.camera.projectionMatrixInverse.toArray()},framing:JSON.parse(JSON.stringify(r.combatFramingDiagnostics)),roomFraming:{...r.roomCombatFraming.diagnostics},marine:{bounds:marineBounds,insideUsable:inside(marineBounds)},contacts:g.enemies.snapshot.enemies.map(e=>{const bounds={left:0,right:0,top:0,bottom:0},valid=r.actorScreenBounds(e.id,e.x,e.y,e.radius,bounds);return{id:e.id,type:e.type,sourceX:e.x,sourceY:e.y,bounds:valid?bounds:null,insideUsable:valid&&inside(bounds)};})}};
}

export function registerI10ArmoryReplay(scenarios){
 if(scenarios.some(s=>s.id==='i10-organic-armory-replay'))return;
 scenarios.push({id:'i10-organic-armory-replay',room:'armory',state:'playing',burst:false,i10ArmoryReplay:true,setupArgument:{fixture:ARMORY_REPLAY_FIXTURE,fixtureSHA256:ARMORY_REPLAY_SHA256},setup:stageI10ArmoryReplay});
}
