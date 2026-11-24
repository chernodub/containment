/** Additive V2 fixtures: real ability actions, immutable shape receipts and full animation timelines. */
const rigs = {
 breacher:['ram','seismic-slam','bulwark','railbreaker'],cryo:['frost-trail','cryo-nova','glacier','whiteout'],
 pyro:['afterburn','flashfire','napalm-charge','meltdown'],arc:['static-step','overload','tesla-pylon','overclock'],
};
const slots=['dash','tactical','power','overdrive'];
export async function stageV2({rig,id,slot,room,tier='high',heavy=false,baseline=false,showcase=false,boons=[],setupOnly=false,castStudy=false,conditionSeed}) {
 const d=window.__containmentDebug,g=d.game;
 const clearStagingActors=()=>{
  if(conditionSeed===undefined||g.conditionState?.condition.id!=='brood'){g.enemies.reset();return;}
  for(const enemy of g.enemies.snapshot.enemies)if(!g.conditionState.eggs.has(enemy.id))g.enemies.remove(enemy.id);
 };
 await d.gotoRoom(room,conditionSeed===undefined?{rig}:{rig,seed:conditionSeed,runStructure:true});d.renderer.setQuality(tier);await d.prepare();if(boons.length)d.grantBoons(boons);d.invulnerable(true);clearStagingActors();
 const bounds=g.geometry.bounds,candidates=[];
 for(let y=170;y<bounds.height-170;y+=50)for(let x=170;x<bounds.width-170;x+=50)for(const angle of [-Math.PI/2,0,Math.PI/2,Math.PI]){
  if(!d.canStand(x,y,28)||!d.canStand(x+Math.cos(angle)*150,y+Math.sin(angle)*150,28))continue;
  let placement=true;for(const forward of [70,150])for(const side of [-125,0,125])if(!d.canStand(x+Math.cos(angle)*forward-Math.sin(angle)*side,y+Math.sin(angle)*forward+Math.cos(angle)*side,20))placement=false;
  if(!placement)continue;
  let score=0;for(const r of [170,230,290,350])for(let k=-3;k<=3;k++){
   const a=angle+k*.22,tx=x+Math.cos(a)*r,ty=y+Math.sin(a)*r;
   if(d.canStand(tx,ty,28)&&d.clearShot(tx,ty,{x,y}))score++;
  }candidates.push({x,y,angle,score});
 }
 // Wall studies prefer a legal lane that presents the field face to the production camera.
 const wallStudy=id==='bulwark'||id==='glacier';
 candidates.sort((a,b)=>(b.score+(wallStudy?Math.abs(Math.sin(b.angle))*20:0))-(a.score+(wallStudy?Math.abs(Math.sin(a.angle))*20:0)));if(!candidates.length)throw Error('No V2 legal lane');
 let p;for(const candidate of candidates){Object.assign(g.player,{x:candidate.x,y:candidate.y,angle:candidate.angle,vx:0,vy:0});g.setAimPoint({x:candidate.x+Math.cos(candidate.angle)*150,y:candidate.y+Math.sin(candidate.angle)*150});if(g.abilities.snapshot.slots.power.ready){p=candidate;break;}}
 if(!p)throw Error('No authoritative V2 power placement');Object.assign(g.player,{x:p.x,y:p.y,angle:p.angle,vx:0,vy:0});d.setInput({x:0,y:0,fire:false,angle:p.angle,autoAim:false});d.step(3800);clearStagingActors();d.refresh();
 const population=heavy?(showcase&&room!=='armory'?12:25):5;
 const placed=g.enemies.snapshot.enemies.map(({x,y,id})=>({x,y,id}));
 for(const r of (heavy?[170,230,290,350,410,470]:slot==='power'?[300,380]:[170,230,290]))for(const k of (heavy?[-5,-4,-3,-2,-1,0,1,2,3,4,5]:[0,-2,2,-1,1])){
  if(placed.length>=population)break;
  const a=p.angle+k*.22,x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r;
  if(!d.canStand(x,y,26)||!d.clearShot(x,y)||placed.some(e=>Math.hypot(e.x-x,e.y-y)<43))continue;
  const eid=d.spawn(heavy?['brute','spitter','crawler','stalker','carrier'][placed.length%5]:slot==='power'?'spitter':'brute',x,y,heavy&&placed.length%6===0);
  if(eid)placed.push({x,y,id:eid});
 }
 // Larger rooms can place remaining stress actors around the rear half of the lane.
 if(heavy)for(let r=180;r<=420&&placed.length<population;r+=60)for(let k=0;k<24&&placed.length<population;k++){
  const a=k*Math.PI/12,x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r;
  if(!d.canStand(x,y,26)||placed.some(e=>Math.hypot(e.x-x,e.y-y)<43))continue;
  const eid=d.spawn('brute',x,y);if(eid)placed.push({x,y,id:eid});
 }
 // Benchmark-only completion keeps the 25-actor gate in irregular rooms. The
 // original visible lane and all production spawn/collision checks remain intact.
 if(heavy&&setupOnly&&placed.length<population){
  const fallback=[];
  for(let y=(bounds.y??0)+70;y<bounds.height-70;y+=45)for(let x=(bounds.x??0)+70;x<bounds.width-70;x+=45){
   if(Math.hypot(x-p.x,y-p.y)<140||!d.canStand(x,y,28)||placed.some(e=>Math.hypot(e.x-x,e.y-y)<43))continue;
   fallback.push({x,y,distance:Math.hypot(x-p.x,y-p.y)});
  }
  fallback.sort((a,b)=>a.distance-b.distance);
  for(const point of fallback){if(placed.length>=population)break;if(placed.some(e=>Math.hypot(e.x-point.x,e.y-point.y)<43))continue;const eid=d.spawn('brute',point.x,point.y);if(eid)placed.push({...point,id:eid});}
 }
 if(placed.length<(heavy?population:3))throw Error('V2 encounter population '+placed.length);
 g.setAimPoint({x:p.x+Math.cos(p.angle)*150,y:p.y+Math.sin(p.angle)*150});
 d.v2Proof={rig,tier,room,stagedEnemies:placed.length,baseline};d.kitingProof=d.v2Proof;
 if(setupOnly){d.benchmarkLane=p;return;}
 if(baseline){g.switchWeapon('rifle');d.setInput({fire:true,x:-Math.cos(p.angle)*.2,y:-Math.sin(p.angle)*.2});g.grenade();d.step(300);return;}
 const gl=d.renderer.renderer.getContext(),create=gl.createProgram;let programs=0;
 gl.createProgram=function(){programs++;return create.call(gl);};
 d.v2Proof.before=window.__containmentPerformance;
 if(showcase){
  g.switchWeapon('rifle');d.setInput({fire:true,x:-Math.cos(p.angle)*.12,y:-Math.sin(p.angle)*.12});
  if(!g.useAbility('power'))throw Error('Full kit power denied');d.step(g.abilities.snapshot.slots.power.castRemainingMs+150);
  if(!g.useAbility('dash'))throw Error('Full kit dash denied');d.step(150);
  if(!g.useAbility('tactical'))throw Error('Full kit tactical denied');d.step(g.abilities.snapshot.slots.tactical.castRemainingMs+30);
  d.fillOverdrive();if(!g.useAbility('overdrive'))throw Error('Full kit Overdrive denied');
  const cast=g.abilities.snapshot.slots.overdrive.castRemainingMs;
  const samples=[0,Math.max(16,cast*.5),cast+30,cast+150,cast+600,cast+1800,cast+3200];
  const step=d.step;let sample=0,elapsed=0;
  d.step=ms=>{if(ms!==150)return step(ms);const t=samples[Math.min(++sample,samples.length-1)];step(t-elapsed);elapsed=t;d.v2Proof.sampleMs=t;d.shaderCompilations=programs;if(programs)throw Error('Full kit shader compiles '+programs);};
  d.v2Proof.instances=d.renderer.interimAbilities?.kit?.counts??null;d.refresh();return;
 }
 if(heavy){
  const visuals=d.renderer.interimAbilities,updateVisuals=visuals.update;let peakInstances=0,peakLights=0,instances=0;
  function visit(object){if(!object.visible)return;if(object.isMesh)instances+=object.isInstancedMesh?object.count:1;for(const child of object.children)visit(child);}
  visuals.update=function(snapshot,dt,visible,game,marine,camera,body){updateVisuals.call(this,snapshot,dt,visible,game,marine,camera,body);instances=0;visit(this.root);peakInstances=Math.max(peakInstances,instances);let lights=0;for(const light of d.renderer.lighting.pool.lights)if(light.intensity>0)lights++;peakLights=Math.max(peakLights,lights);};
  g.switchWeapon('rifle');
  if(!g.useAbility('power'))throw Error('V2 power denied');d.step(g.abilities.snapshot.slots.power.castRemainingMs+40);
  if(!g.useAbility('dash'))throw Error('V2 initial dash denied');d.step(150);if(!g.useAbility('tactical'))throw Error('V2 tactical denied');d.step(g.abilities.snapshot.slots.tactical.castRemainingMs+30);
  d.fillOverdrive();if(!g.useAbility('overdrive'))throw Error('V2 ultimate denied');d.step(g.abilities.snapshot.slots.overdrive.castRemainingMs+30);
  d.setInput({fire:true,x:-Math.cos(p.angle)*.08,y:-Math.sin(p.angle)*.08});
  const from=g.elapsed;let redash=0;d.realtime(true);try{for(let i=0;i<1000&&g.elapsed-from<3;i++){if(g.elapsed-from>2.6+redash*.18&&redash<2){if(!g.useAbility('dash'))throw Error('V2 cooldown dash denied');redash++;}await new Promise(requestAnimationFrame);}}finally{d.realtime(false);}
  d.v2Proof.liveSeconds=g.elapsed-from;d.v2Proof.performance=window.__containmentPerformance;
  if(g.abilities.snapshot.slots.dash.charges!==0)throw Error('V2 dash cooldown fixture failed');
  d.v2Proof.remainingEnemies=g.enemies.activeCount;d.v2Proof.cooldowns=g.abilities.snapshot.slots;
  d.v2Proof.instances=d.renderer.interimAbilities?.kit?.counts??null;
  d.v2Proof.peakObservedInstances=peakInstances;d.v2Proof.peakObservedLights=peakLights;visuals.update=updateVisuals;
  d.v2Proof.lights=d.renderer.lighting.pool.lights.filter(l=>l.intensity>0).length;
  d.v2Proof.programs=programs;gl.createProgram=create;d.shaderCompilations=programs;
  if(programs)throw Error('V2 combat shader compiles '+programs);d.refresh();return;
 }
 if(castStudy){
  const a=p.angle;
  d.spawn('brute',p.x+Math.cos(a)*70,p.y+Math.sin(a)*70);
  g.setAimPoint({x:p.x+Math.cos(a)*85,y:p.y+Math.sin(a)*85});
  d.step(16);
 }
 if(slot==='overdrive')d.fillOverdrive();
 if(!g.useAbility(slot))throw Error('V2 ability denied '+id);
 const cast=g.abilities.snapshot.slots[slot].castRemainingMs;
 const duration=g.abilities.snapshot.slots[slot].activeMs||({bulwark:6000,glacier:5000,'tesla-pylon':9000,'frost-trail':2500,afterburn:2500,whiteout:8000,meltdown:8000,overclock:6000}[id]??(boons.includes('scorched-fan')?2500:0));
 const resolution=slot==='dash'?140:cast;
 if(castStudy){
  const advance=d.step;
  const record=phase=>{
   d.v2Proof.phase=phase;
   d.v2Proof.attackers=g.enemies.snapshot.enemies.filter(e=>e.meleePhase==='windup'||e.windupMs>0).map(e=>e.id);
   d.refresh();
  };
  advance(resolution+85);record('peak');
  let index=0;
  d.step=ms=>{
   if(ms!==150)return advance(ms);
   if(++index===1){
    // These two casts stun their original targets. A fresh legal approach can
    // commit during the residual without altering the hit or a warning timer.
    if(id==='flashfire'||id==='overload'){
     const a=p.angle+.22;
     d.spawn('stalker',g.player.x+Math.cos(a)*65,g.player.y+Math.sin(a)*65);
    }
    advance(150);
    for(let i=0;i<8&&!g.enemies.snapshot.enemies.some(e=>e.meleePhase==='windup'||e.windupMs>0);i++)advance(16);
    record('residual');
   }else{
    clearStagingActors();advance(500);clearStagingActors();record('rest');
   }
  };
  return;
 }
 const samples=[0,Math.max(16,resolution*.5),resolution+30,resolution+150,resolution+600,resolution+Math.max(1200,duration*.5),resolution+Math.max(1800,duration+300)];
 const original=d.step;let sample=0,elapsed=0;
 // The runner samples at fixed 150ms; map those sampling requests to explicit art-review phases.
 d.step=ms=>{if(ms!==150)return original(ms);sample++;const t=samples[Math.min(sample,samples.length-1)];original(Math.max(0,t-elapsed));elapsed=t;d.v2Proof.sampleMs=t;
 if(id==='frost-trail'){
  const fx=d.renderer.interimAbilities?.kit?.fx;
  d.v2Proof.surfaces=fx?.slots.filter(s=>s.live).map(s=>({mode:s.mode,range:s.range,inner:s.inner,x:s.x,z:s.z,h0:s.h0,param:s.param,age:s.age,life:s.life,visible:s.mesh.visible,uniformRange:s.material.uniforms.fxRange.value}))??[];
  d.v2Proof.nativeZones=g.abilities.snapshot.zones;
 }
 d.v2Proof.programs=programs;d.shaderCompilations=programs;if(programs)throw Error('V2 timeline shader compiles '+programs);};
 d.refresh();
}
export const V2_SCENARIOS=[];
for(const [rig,ids]of Object.entries(rigs)){
 for(let i=0;i<ids.length;i++)for(const room of ['awakening-bay','containment-annulus','infested-workshop','crew-checkpoint','relay-racks'])V2_SCENARIOS.push({
  id:`v2-${ids[i]}`,rooms:false,room,state:'playing',burst:true,setupArgument:{rig,id:ids[i],slot:slots[i],room},setup:stageV2,
 });
 // Unique room-qualified IDs allow choosing three lighting moods independently.
 for(const tier of ['high','low'])for(const room of ['awakening-bay','communal-atrium','armory','breached-loading-bay','relay-racks','safety-interlock-station','service-shaft-landing','infested-workshop','containment-annulus','overload-floor'])V2_SCENARIOS.push({id:`v2-kit-${rig}-${tier}-${room}`,room,state:'playing',burst:true,setupArgument:{rig,room,tier,heavy:true},setup:stageV2});
 for(const room of ['awakening-bay','communal-atrium','armory','breached-loading-bay','relay-racks','safety-interlock-station','service-shaft-landing','infested-workshop','containment-annulus','overload-floor'])V2_SCENARIOS.push({id:`v2-full-${rig}-${room}`,room,state:'playing',burst:true,setupArgument:{rig,room,heavy:true,showcase:true},setup:stageV2});
 V2_SCENARIOS.push({id:`v2-before-${rig}`,room:'armory',state:'playing',burst:true,setupArgument:{rig,room:'armory',heavy:true,baseline:true},setup:stageV2});
}
// Each room variant needs a unique selector; retain the compact default for Cryogenics.
for(const s of V2_SCENARIOS)if(s.id.startsWith('v2-')&&!s.id.startsWith('v2-kit-')&&!s.id.startsWith('v2-before-')&&!s.id.startsWith('v2-full-')&&s.room!=='awakening-bay')s.id+=`-${s.room}`;

V2_SCENARIOS.push({id:'v2-recovery',room:'armory',state:'playing',setup:async()=>{
 const d=window.__containmentDebug,r=d.renderer,g=d.game;await d.gotoRoom('armory',{rig:'pyro'});d.invulnerable(true);
 const cycles=[];
 for(let i=0;i<3;i++){
  r.setQuality('low');await d.prepare();r.setQuality('high');await d.gotoRoom('infested-workshop',{rig:'cryo'});await d.gotoRoom('armory',{rig:'pyro'});d.refresh();cycles.push({...r.renderer.info.memory});
 }
 if(JSON.stringify(cycles[1])!==JSON.stringify(cycles[2]))throw Error('V2 GPU inventory grew '+JSON.stringify(cycles));
 d.fillOverdrive();if(!g.useAbility('overdrive'))throw Error('Recovery Overdrive denied');d.step(60);
 const gl=r.renderer.getContext(),ext=gl.getExtension('WEBGL_lose_context');if(!ext)throw Error('No context-loss extension');
 await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('V2 recovery timeout')),30000);r.canvas.addEventListener('webglcontextrestored',()=>{clearTimeout(timeout);resolve();},{once:true});ext.loseContext();setTimeout(()=>ext.restoreContext(),250);});
 for(let i=0;i<900&&r.roomLoading;i++)await new Promise(requestAnimationFrame);if(r.roomLoading)throw Error('V2 preparation did not recover');
 g.resume();d.refresh();await d.gotoRoom('infested-workshop',{rig:'cryo'});await d.gotoRoom('armory',{rig:'pyro'});d.refresh();
 const postRestoreCycles=[];for(let i=0;i<2;i++){await d.gotoRoom('infested-workshop',{rig:'cryo'});await d.gotoRoom('armory',{rig:'pyro'});d.refresh();postRestoreCycles.push({...r.renderer.info.memory});}
 if(JSON.stringify(postRestoreCycles[0])!==JSON.stringify(postRestoreCycles[1]))throw Error('V2 post-restore resources grew '+JSON.stringify(postRestoreCycles));
 d.recoveryProof={roomCycles:cycles,postRestoreCycles,afterRestore:{...r.renderer.info.memory},programs:r.renderer.info.programs.length,contextLost:gl.isContextLost(),abilityInstances:r.interimAbilities.kit.counts};
}});

for(const rig of Object.keys(rigs))V2_SCENARIOS.push({id:`v2-full-${rig}-low-armory`,room:'armory',state:'playing',burst:true,setupArgument:{rig,room:'armory',tier:'low',heavy:true,showcase:true},setup:stageV2});

V2_SCENARIOS.push({id:'v2-scorched-fan',room:'overload-floor',state:'playing',burst:true,setupArgument:{rig:'pyro',id:'flashfire',slot:'tactical',room:'overload-floor',boons:['scorched-fan']},setup:stageV2});

// Time the three-frame gallery around actual contact. Overclock has no
// damaging cast, so its target reacts to a rifle hit during slowed time.
async function stageGalleryOverdrive({rig}){
 const d=window.__containmentDebug,g=d.game;
 await d.gotoRoom('armory',{rig});
 d.invulnerable(true);
 g.enemies.reset();
 const {width,height}=g.geometry.bounds;
 let lane;
 search:for(let y=height*.45;y<height-135;y+=24)for(let x=width*.34;x<width-135;x+=24){
  if(!d.canStand(x,y,32))continue;
  for(const angle of [-Math.PI/2,0,Math.PI,Math.PI/2]){
   const offsets=rig==='breacher'?[[86,0],[158,0]]:[[86,0],[86,58],[86,-58]];
   const targets=offsets.map(([along,across])=>({
    x:x+Math.cos(angle)*along-Math.sin(angle)*across,
    y:y+Math.sin(angle)*along+Math.cos(angle)*across,
   }));
   if(targets.every(p=>d.canStand(p.x,p.y,28)&&d.clearShot(p.x,p.y,{x,y}))){
    lane={x,y,angle,targets};
    break search;
   }
  }
 }
 if(!lane)throw Error('No legal gallery contact lane');
 const {x,y,angle,targets}=lane;
 Object.assign(g.player,{x,y,angle,vx:0,vy:0});
 d.setInput({x:0,y:0,angle,fire:false,autoAim:false});
 g.setAimPoint(targets[0]);
 for(const p of targets)if(!d.spawn('brute',p.x,p.y))throw Error('Gallery target placement denied');
 d.step(1);
 d.fillOverdrive();
 if(!g.useAbility('overdrive'))throw Error('Gallery Overdrive denied');
 if(rig==='arc'){
  d.step(g.abilities.snapshot.slots.overdrive.castRemainingMs+1);
  g.switchWeapon('rifle');
  d.setInput({fire:true});
 }
 const damageSource=rig==='arc'?'weapon':'ability';
 const previous=g.stats.damageDealt[damageSource];
 for(let frame=0;frame<100&&g.stats.damageDealt[damageSource]===previous;frame++)d.step(1000/60);
 if(g.stats.damageDealt[damageSource]===previous)throw Error('Gallery target never received damage');
 d.setInput({fire:false});
 d.refresh();
}

for(const rig of Object.keys(rigs)){
 V2_SCENARIOS.push({id:`gallery-overdrive-${rig}`,room:'armory',state:'playing',
  diagnosticOnly:true,burst:true,frameCount:3,stepMs:1000/60,setupArgument:{rig},setup:stageGalleryOverdrive});
}

for(const [rig, ids] of Object.entries(rigs))for(const [i,id] of ids.entries()){
 if(!['afterburn','flashfire','napalm-charge','meltdown','whiteout','overload'].includes(id))continue;
 V2_SCENARIOS.push({id:'v2-fx26-'+id,room:'crew-checkpoint',state:'playing',burst:true,frameCount:3,
  setup:stageV2,setupArgument:{rig,id,slot:slots[i],room:'crew-checkpoint',castStudy:true}});
}

V2_SCENARIOS.push({
 id:'v2-fx26-plate',room:'crew-checkpoint',state:'playing',burst:true,frameCount:3,
 setup:new Function(`return (async()=>{
  await (${stageV2.toString()})({room:'crew-checkpoint',rig:'pyro',setupOnly:true});
  const d=window.__containmentDebug,g=d.game,lane=d.benchmarkLane;
  g.enemies.reset();
  const x=lane.x+Math.cos(lane.angle)*125,y=lane.y+Math.sin(lane.angle)*125;
  if(!d.canStand(x,y,28))throw Error('Plate target lane is obstructed');
  // Priority enemies remain in the encounter while an escort ordinarily retreats.
  const spawned=g.enemies.spawn('brute',x,y,false,{priority:true});
  if(!spawned.spawned)throw Error('Plate target unavailable');
  const id=spawned.enemy.id;
  g.switchWeapon('plasma');d.step(450);
  for(let i=0;i<180;i++){
   const e=g.enemies.getSnapshot(id);
   if(!e||e.armor<=0)break;
   const angle=Math.atan2(e.y-g.player.y,e.x-g.player.x);
   d.setInput({x:0,y:0,angle,fire:true,autoAim:false});d.step(1000/60);
  }
  d.v2Proof.armorAfter=g.enemies.getSnapshot(id)?.armor;
  d.setInput({fire:false});d.refresh();
 })();`),
 advanceFrame:frame=>window.__containmentDebug.step(frame===1?230:1400),
});
