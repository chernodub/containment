/** Additive V2 fixtures: real ability actions, immutable shape receipts and full animation timelines. */
const rigs = {
 breacher:['ram','seismic-slam','bulwark','railbreaker'],cryo:['frost-trail','cryo-nova','glacier','whiteout'],
 pyro:['afterburn','flashfire','napalm-charge','meltdown'],arc:['static-step','overload','tesla-pylon','overclock'],
};
const slots=['dash','tactical','power','overdrive'];
async function stageV2({rig,id,slot,room,tier='high',heavy=false,baseline=false,showcase=false}) {
 const d=window.__containmentDebug,g=d.game;
 await d.gotoRoom(room,{rig});d.renderer.setQuality(tier);await d.prepare();d.invulnerable(true);g.enemies.reset();
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
 candidates.sort((a,b)=>b.score-a.score);if(!candidates.length)throw Error('No V2 legal lane');
 const p=candidates[0];Object.assign(g.player,{x:p.x,y:p.y,angle:p.angle,vx:0,vy:0});d.setInput({x:0,y:0,fire:false,angle:p.angle,autoAim:false});d.step(3800);g.enemies.reset();d.refresh();
 const population=heavy?(showcase&&room!=='armory'?12:25):5;
 const placed=[];
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
 if(placed.length<(heavy?population:3))throw Error('V2 encounter population '+placed.length);
 g.setAimPoint({x:p.x+Math.cos(p.angle)*150,y:p.y+Math.sin(p.angle)*150});
 d.v2Proof={rig,tier,room,stagedEnemies:placed.length,baseline};d.kitingProof=d.v2Proof;
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
 if(slot==='overdrive')d.fillOverdrive();
 if(!g.useAbility(slot))throw Error('V2 ability denied '+id);
 const cast=g.abilities.snapshot.slots[slot].castRemainingMs;
 const duration=g.abilities.snapshot.slots[slot].activeMs||({bulwark:6000,glacier:5000,'tesla-pylon':9000,'frost-trail':2500,afterburn:2500,whiteout:8000,meltdown:8000,overclock:6000}[id]??0);
 const samples=[0,Math.max(16,cast*.5),Math.max(35,cast+30),Math.max(170,cast+150),cast+600,cast+Math.max(1200,duration*.5),cast+Math.max(1800,duration+300)];
 const original=d.step;let sample=0,elapsed=0;
 // The runner samples at fixed 150ms; map those sampling requests to explicit art-review phases.
 d.step=ms=>{if(ms!==150)return original(ms);sample++;const t=samples[Math.min(sample,samples.length-1)];original(Math.max(0,t-elapsed));elapsed=t;d.v2Proof.sampleMs=t;d.v2Proof.programs=programs;d.shaderCompilations=programs;if(programs)throw Error('V2 timeline shader compiles '+programs);};
 d.refresh();
}
export const V2_SCENARIOS=[];
for(const [rig,ids]of Object.entries(rigs)){
 for(let i=0;i<ids.length;i++)for(const room of ['awakening-bay','containment-annulus','infested-workshop'])V2_SCENARIOS.push({
  id:`v2-${ids[i]}`,rooms:false,room,state:'playing',burst:true,setupArgument:{rig,id:ids[i],slot:slots[i],room},setup:stageV2,
 });
 // Unique room-qualified IDs allow choosing three lighting moods independently.
 for(const tier of ['high','low'])for(const room of ['awakening-bay','communal-atrium','armory','breached-loading-bay','relay-racks','safety-interlock-station','service-shaft-landing','infested-workshop','containment-annulus','overload-floor'])V2_SCENARIOS.push({id:`v2-kit-${rig}-${tier}-${room}`,room,state:'playing',burst:true,setupArgument:{rig,room,tier,heavy:true},setup:stageV2});
 for(const room of ['awakening-bay','communal-atrium','armory','breached-loading-bay','relay-racks','safety-interlock-station','service-shaft-landing','infested-workshop','containment-annulus','overload-floor'])V2_SCENARIOS.push({id:`v2-full-${rig}-${room}`,room,state:'playing',burst:true,setupArgument:{rig,room,heavy:true,showcase:true},setup:stageV2});
 V2_SCENARIOS.push({id:`v2-before-${rig}`,room:'armory',state:'playing',burst:true,setupArgument:{rig,room:'armory',heavy:true,baseline:true},setup:stageV2});
}
// Each room variant needs a unique selector; retain the compact default for Cryogenics.
for(const s of V2_SCENARIOS)if(s.id.startsWith('v2-')&&!s.id.startsWith('v2-kit-')&&!s.id.startsWith('v2-before-')&&!s.id.startsWith('v2-full-')&&s.room!=='awakening-bay')s.id+=`-${s.room}`;
