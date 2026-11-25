async function stageDrill(phase) {
  const d=window.__containmentDebug,g=d.game;
  await d.startRun(1729,{rig:'cryo'});
  document.querySelector('[data-mutation]').click();
  await d.prepare();
  d.invulnerable(true);
  g.skipStory();
  for(let step=0;step<240&&!g.awakeningDrill;step++){
    for(const enemy of g.enemies.snapshot.enemies)g.damage(enemy.id,10000,undefined,'weapon',false);
    d.step(50);
  }
  const drill=g.awakeningDrill;
  if(!drill)throw Error('Awakening drill did not start');
  if(phase==='before')return;
  for(let step=0;step<180;step++){
    const enemy=g.enemies.getSnapshot(drill.id);
    if(!enemy)break;
    if(enemy.meleePhase==='windup'){
      if(phase==='during')return;
      if(enemy.meleeRemainingMs<450){
        const angle=Math.atan2(g.player.y-enemy.y,g.player.x-enemy.x);
        d.setInput({x:Math.cos(angle),y:Math.sin(angle)});
      }else d.setInput({x:0,y:0});
    }else if(enemy.meleePhase==='recovery'&&g.awakeningDrill.evaded){
      d.setInput({x:0,y:0,fire:true,angle:Math.atan2(enemy.y-g.player.y,enemy.x-g.player.x)});
    }else if(enemy.meleePhase==='approach'){
      const angle=Math.atan2(enemy.y-g.player.y,enemy.x-g.player.x);
      d.setInput({x:Math.cos(angle),y:Math.sin(angle),fire:false});
    }
    d.step(33);
    if(g.awakeningDrill?.confirmation>0)return;
  }
  throw Error('Requested dodge drill phase did not occur');
}

async function stageDeath(family){
  const d=window.__containmentDebug,g=d.game;
  await d.gotoRoom('awakening-bay',{rig:'cryo'});
  for(let step=0;step<20&&g.status!=='dead';step++){
    g.hurt(90,undefined,{source:family==='spitter'?'enemy-projectile':'enemy-contact',enemyFamily:family});
    if(g.status==='playing')d.step(240);
  }
  d.refresh();
}

async function stagePod(phase){
  const d=window.__containmentDebug,g=d.game;
  await d.gotoRoom('awakening-bay',{rig:'cryo'});
  const point=[{x:320,y:280},{x:350,y:260},{x:290,y:230}].find(p=>d.canStand(p.x,p.y,24));
  if(!point||!g.enemies.spawn('crawler',point.x,point.y,false,{pod:true}).spawned)throw Error('Pod staging failed');
  d.invulnerable(true);
  d.step(phase==='sealed'?50:phase==='swelling'?1500:2050);
}

export const ONB14_SCENARIOS=[
  ...['before','during','after'].map(phase=>({diagnosticOnly:true,id:`onb14-drill-${phase}`,state:'playing',room:'awakening-bay',setup:stageDrill,setupArgument:phase})),
  ...['crawler','stalker','spitter'].map(family=>({diagnosticOnly:true,id:`onb14-death-${family}`,state:'dead',nativeKeys:[['Tab',0],['Tab',0]],required:['#retry-rig','.retry-lesson'],setup:stageDeath,setupArgument:family})),
  ...['sealed','swelling','opening'].map(phase=>({diagnosticOnly:true,id:`onb14-pod-${phase}`,state:'playing',room:'awakening-bay',setup:stagePod,setupArgument:phase})),
];

async function stageMastery(rig){
  const d=window.__containmentDebug,g=d.game;
  await d.gotoRoom('awakening-bay',{rig:rig==='resisted'?'cryo':rig});
  d.invulnerable(true);
  g.skipStory();
  Object.assign(g.player,{x:320,y:440,angle:-Math.PI/2});
  if(rig==='cryo'||rig==='breacher'){
    g.setAimPoint({x:320,y:345});
    if(!g.useAbility('power'))throw Error('Mastery wall placement failed');
    d.step(170);
  }
  const [x,y]=rig==='breacher'?[365,423]:rig==='cryo'?[320,309]:[320,310];
  const spawned=g.enemies.spawn('brute',x,y,false,{controlResistant:rig==='resisted',priority:rig==='resisted'});
  if(!spawned.spawned)throw Error('Mastery target unavailable');
  if(rig==='breacher')g.player.angle=0;
  const target=g.targets().find(t=>t.id===spawned.enemy.id);
  if(rig==='pyro')g.mutations.applyAbilityStatus(target,'burn',1);
  if(rig==='resisted')g.mutations.applyAbilityStatus(target,'freeze',1500);
  d.settlePresentation(40);
  d.refresh();
}

ONB14_SCENARIOS.push(...['cryo','pyro','breacher','arc','resisted'].map(rig=>({
  diagnosticOnly:true,id:`onb14-mastery-${rig}`,state:'playing',room:'awakening-bay',setup:stageMastery,setupArgument:rig,
})));
