async function pincer(phase) {
  const d = window.__containmentDebug, game = d.game;
  await d.gotoRoom('containment-annulus', {rig:'cryo'});
  d.invulnerable(true);
  game.skipStory();
  d.setInput({x:0,y:0,fire:false,angle:null,autoAim:false});
  for (let i=0; i<900 && !game.encounter.pincer; i++) {
    for (const enemy of game.enemies.snapshot.enemies) game.damage(enemy.id,10000,undefined,'weapon',false);
    d.stepSimulation(50);
  }
  const flank = game.encounter.pincer?.flankers[0];
  if (!flank) throw Error('Pincer did not stage');
  const breach = game.geometry.breaches.find(point => point.id===flank.breachId);
  const direction = breach.facing==='east' ? 1 : -1;
  const viewpoint = [160,190,130,220].map(distance => ({
    x:breach.x+direction*distance,y:breach.y,
  })).find(point => d.canStand(point.x,point.y,18));
  if (viewpoint) Object.assign(game.player,viewpoint,{angle:direction===1?Math.PI:0});
  d.stepSimulation(2500);
  if (phase==='sealed') {
    for (let i=0; i<120 && game.encounter.pincer?.state!=='sealed'; i++) {
      for (const enemy of game.enemies.snapshot.enemies) game.damage(enemy.id,10000,undefined,'weapon',false);
      d.stepSimulation(50);
    }
  }
  if (phase==='open') {
    for (let i=0; i<260 && game.encounter.pincer?.state!=='open'; i++) d.stepSimulation(50);
    d.stepSimulation(750);
  }
  if(game.encounter.pincer?.state!==phase)throw Error('Requested pincer phase did not occur');
  d.settlePresentation(24);
  d.refresh();
}

export const PLAY16_SCENARIOS = ['staging','sealed','open'].map(phase => ({
  id:`play16-pincer-${phase}`,
  state:'playing',
  room:'containment-annulus',
  diagnosticOnly:true,
  setup:pincer,
  setupArgument:phase,
}));

async function stagedConsequence(kind) {
  const d=window.__containmentDebug, game=d.game;
  const room=kind==='escort'?'communal-atrium':kind==='cover'?'passenger-vault'
    :kind==='warden'?'armory':kind==='brood'?'swarm-junction':'awakening-bay';
  await d.gotoRoom(room,{rig:'cryo'});
  d.invulnerable(true);
  game.skipStory();
  d.setInput({x:0,y:0,fire:false,angle:null,autoAim:false});
  if (kind==='cover'||kind==='escort'||kind==='brood') {
    for(let i=0;i<1600;i++){
      const all=game.enemies.snapshot.enemies;
      const relevant=kind==='cover'?all.find(enemy=>enemy.type==='spitter'):kind==='escort'
        ?all.find(enemy=>enemy.type==='carrier'&&enemy.priority):all.find(enemy=>enemy.champion==='matron');
      if(relevant){
        if(kind==='escort'&&all.length>1){
          game.damage(relevant.id,10000,undefined,'weapon',false);
          for(let frame=0;frame<9;frame++)d.stepSimulation(50);
          const runner=game.enemies.snapshot.enemies.find(enemy=>game.getEscortRetreat(enemy.id));
          if(runner){
            const point=[100,130,160].flatMap(distance=>[0,Math.PI,Math.PI/2,-Math.PI/2].map(angle=>({
              x:runner.x+Math.cos(angle)*distance,y:runner.y+Math.sin(angle)*distance,
            }))).find(p=>d.canStand(p.x,p.y,18));
            if(point)Object.assign(game.player,point);
          }
          break;
        }
        if(kind==='brood'&&relevant.broodRemainingMs>0){
          game.damage(relevant.id,150,undefined,'weapon',false);
          for(let frame=0;frame<9;frame++)d.stepSimulation(50);
          if(game.broodInterruption)break;
        }
        if(kind==='cover'){
          const pickup=game.pickups.snapshot.find(item=>item.kind==='armor');
          if(pickup){
            const position=[0,Math.PI,Math.PI/2,-Math.PI/2].map(angle=>({
              x:pickup.x+Math.cos(angle)*38,y:pickup.y+Math.sin(angle)*38,
            })).find(point=>d.canStand(point.x,point.y,18));
            if(position)Object.assign(game.player,position,{angle:Math.atan2(relevant.y-position.y,relevant.x-position.x)});
          }
          break;
        }
      }else if(kind==='cover'||(kind==='escort'&&game.encounter.grammar!=='priority')||(kind==='brood'&&game.encounter.grammar!=='priority')){
        for(const enemy of all)game.damage(enemy.id,10000,undefined,'weapon',false);
      }
      d.stepSimulation(50);
    }
  }
  if(kind==='warden'){
    game.enemies.reset();
    const b=game.geometry.bounds;
    const lanes=[];
    for(let y=80;y<b.height-80;y+=24)for(let x=80;x<b.width-80;x+=24){
      if(!d.canStand(x,y,64))continue;
      for(let i=0;i<16;i++){
        const angle=i*Math.PI/8, dx=Math.cos(angle), dy=Math.sin(angle);
        const p={x:x+dx*168,y:y+dy*168};
        if(!d.canStand(p.x,p.y,game.player.radius)||!d.clearShot(x,y,p)
          ||![60,100,140].every(t=>d.canStand(x+dx*t,y+dy*t,64))
          ||d.canStand(x+dx*192,y+dy*192,64))continue;
        lanes.push({x,y,p,angle});
      }
    }
    const centrality=lane=>Math.hypot(lane.x-b.width/2,lane.y-b.height/2);
    const lane=lanes.sort((a,b)=>centrality(a)-centrality(b))[0];
    if(!lane)throw Error('No legal Warden wall-stun lane');
    Object.assign(game.player,lane.p,{angle:lane.angle+Math.PI});
    const id=d.spawn('brute',lane.x,lane.y,true);
    game.enemies.promote(id,'warden');
    let sidestepped=false;
    for(let i=0;i<220;i++){
      d.stepSimulation(50);
      const warden=game.enemies.getSnapshot(id);
      if(warden?.wallStunAngle!==undefined)break;
      if(!sidestepped&&warden?.pendingAttack==='charge'){
        const angle=Math.atan2(warden.lockY,warden.lockX)+Math.PI/2;
        const position=[92,-92,70,-70].map(distance=>({
          x:game.player.x+Math.cos(angle)*distance,y:game.player.y+Math.sin(angle)*distance,
        })).find(point=>d.canStand(point.x,point.y,18));
        if(position){
          Object.assign(game.player,position,{angle:Math.atan2(warden.y-position.y,warden.x-position.x)});
          sidestepped=true;
        }
      }
    }
  }
  const enemies=game.enemies.snapshot.enemies;
  const consequence=kind==='cover'?enemies.some(enemy=>enemy.type==='spitter')&&game.encounterObjective.includes('line of sight')
    :kind==='escort'?enemies.some(enemy=>game.getEscortRetreat(enemy.id))
    :kind==='brood'?game.broodInterruption:enemies.some(enemy=>enemy.wallStunAngle!==undefined);
  if(!consequence)throw Error('Requested consequence did not occur: '+kind);
  d.step(0);
  d.settlePresentation(30);
  d.refresh();
}

PLAY16_SCENARIOS.push(...['escort','brood','cover','warden'].map(kind=>({
  id:`play16-${kind}`, state:'playing', diagnosticOnly:true,
  setup:stagedConsequence,setupArgument:kind,
})));

async function rigDrill(rig) {
  const d=window.__containmentDebug, game=d.game;
  await d.gotoRoom('residential-gallery',{rig,phase:'route'});
  const candidates={breacher:['siege-plow','fault-line'],cryo:['shard-harvest','ice-road'],
    pyro:['meltdown-core','ember-relay'],arc:['live-wire','pilgrim-pylon']}[rig];
  const augment=candidates.find(id=>game.expedition.build.mutations.includes(id))??candidates[0];
  d.grantBoons([augment]);
  game.nextRigDrill={augment,depth:game.node.depth+1};
  game.route(game.node.next[0],'direct');
  if(!game.augmentDrillActive)throw Error('No walkable drill setup for '+rig);
  await d.prepare();
  game.skipStory();
  d.step(50);
  d.refresh();
}

PLAY16_SCENARIOS.push(...['breacher','cryo','pyro','arc'].map(rig=>({
  id:`play16-drill-${rig}`, state:'playing', diagnosticOnly:true,
  setup:rigDrill,setupArgument:rig,required:['#room-objective'],
})));

PLAY16_SCENARIOS.push({
  id:'play16-protected-passage', diagnosticOnly:true, state:'route',
  required:['[data-detour="direct"]','[data-detour="salvage"]'],
  setup:async()=>{await window.__containmentDebug.gotoRoom('containment-annulus',{rig:'pyro',phase:'route'});},
});
