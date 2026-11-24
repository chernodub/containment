// Reuse RUN15's native condition seeds for the Atrium and direct-route seeds for cargo.
const conditions=[
 ['dark',6,12,1800],['coolant',5,2,1400],['vent',10,1,13100],
 ['conduit',2,5,3360],['brood',1,4,9750],['sealed',4,6,45100],
];
export const COND15_SCENARIOS=conditions.flatMap(([condition,atrium,cargo,clock])=>
 ['communal-atrium','breached-loading-bay'].flatMap((room,i)=>
 (i?['entry','active','heavy']:['entry','active','heavy','low']).map(stage=>({
  id:`cond15-${condition}-${stage}-${i?'cargo':'atrium'}`,room,state:'playing',diagnosticOnly:true,
  setup:new Function('room',`return (async()=>{
   const d=window.__containmentDebug,g=d.game;
   await d.gotoRoom(room,{rig:'${stage==='heavy'?'arc':'breacher'}',seed:${i?cargo:atrium},runStructure:true});
   if('${stage}'==='low'){d.renderer.setQuality('low');await d.prepare();}
   d.invulnerable(true);
   const s=g.conditionState,p=g.player,gl=d.renderer.renderer.getContext(),create=gl.createProgram;
   let programs=0;gl.createProgram=function(){programs++;return create.call(this);};
   try{
    if('${stage}'==='heavy'){
     let placed=0;
     for(let k=0;k<96&&placed<20;k++){
      const a=k*2.4,r=95+((k*41)%140),x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r;
      if(d.canStand(x,y,22)&&d.renderer.visible(x,y)&&d.spawn(['spitter','brute','crawler','stalker'][placed%4],x,y,false))placed++;
     }
     d.setInput({fire:true,autoAim:true});
     if('${condition}'==='conduit'){g.useAbility('tactical');}
    }
    if('${stage}'!=='entry'&&'${condition}'==='coolant'){
     const target=s.zones[0],dx=target.x-p.x,dy=target.y-p.y,r=Math.hypot(dx,dy)||1;
     let aim=Math.atan2(dy,dx);
     if('${stage}'==='active'&&${i}){
      // Land at the centre of the first spill so the native camera can show its whole footprint.
      const x=target.x+225*Math.SQRT1_2,y=target.y+225*Math.SQRT1_2;
      if(d.canStand(x,y,p.radius)&&d.clearShot(target.x,target.y,{x,y})){
       aim=-3*Math.PI/4;
       Object.assign(p,{x,y,vx:0,vy:0,angle:aim});
      }
      d.setInput({x:0,y:0,angle:aim});d.step(500);
     }else{
      d.setInput({x:dx/r,y:dy/r,angle:aim});d.step(500);
     }
     g.useAbility('dash');d.step(330);d.setInput({x:0,y:0});d.step(180);
    }else {
     const duration=${stage==='entry'?100:stage==='heavy'&&condition==='sealed'?3600:clock};
     if('${stage}'==='active'&&'${condition}'==='sealed'){
      const exit=g.geometry.exitPoint;
      Object.assign(p,{x:exit.x,y:exit.y});
      s.advance(Math.max(0,s.countdown-500));d.step(680);
     }else d.step(duration);
    }
    d.refresh();
   }finally{gl.createProgram=create;}
   d.g5Proof={condition:s.condition.id,clock:s.elapsed,eggs:s.eggs.size,ventLive:s.ventLive,conduitLive:s.conduitLive,programsAfterReady:programs,actors:g.enemies.activeCount};
  })();`),
 }))));

for(const [id,seed,clock] of [['vent-warning',10,11300],['conduit-charging',2,2540],['brood-swelling',1,6900],['conduit-arc-overlap',2,2870]]){
 COND15_SCENARIOS.push({
  id:'cond15-'+id,room:'communal-atrium',state:'playing',diagnosticOnly:true,
  setup:new Function('room',`return (async()=>{
   const d=window.__containmentDebug,g=d.game;
   await d.gotoRoom(room,{rig:'arc',seed:${seed},runStructure:true});
   d.invulnerable(true);d.step(${clock});
   let accepted=false;
   if('${id}'==='conduit-arc-overlap'){
    const z=g.conditionState.zones[0],p=g.player;
    Object.assign(p,{x:z.x,y:z.y});
    for(let i=0;i<4;i++){
     const k=.2+i*.15,x=z.x+(z.end.x-z.x)*k,y=z.y+(z.end.y-z.y)*k;
     if(d.canStand(x,y,18))d.spawn('brute',x,y,false);
    }
    p.angle=Math.atan2(z.end.y-z.y,z.end.x-z.x);
    g.setAimPoint(z.end);accepted=g.useAbility('tactical');d.step(220);
   }
   d.refresh();const s=g.conditionState;
   d.g5Proof={condition:s.condition.id,clock:s.elapsed,conduitLive:s.conduitLive,ventWarning:s.ventWarning,arcTacticalAccepted:accepted};
  })();`),
 });
}

// Matched close-up of the emergency-light fight, including live and falling bodies.
async function stageLook25(rig, dark) {
 const d=window.__containmentDebug,g=d.game,room='breached-loading-bay';
 await d.gotoRoom(room,{rig,seed:12,runStructure:dark});
 d.invulnerable(true);
 g.enemies.reset();
 Object.assign(g.player,{x:779,y:698,angle:-.83});
 const cases=[['crawler',865,583,true],['stalker',915,600,false],['spitter',815,603,false],
  ['crawler',875,670,false],['stalker',945,600,true],['crawler',982,745,false],
  ['spitter',920,760,false],['crawler',974,544,false]];
 const ids=[];
 for(const [family,x,y,elite] of cases)ids.push(d.spawn(family,x,y,elite));
 d.step(120);
 g.setAimPoint({x:875,y:610});g.useAbility('tactical');
 d.step(340);
 const targets=g.targets();
 ids.forEach((id,i)=>{
  const t=targets.find(target=>target.id===id);if(!t)return;
  if(i!==1&&i!==4)g.mutations.applyAbilityStatus(t,rig==='pyro'?'burn':i%2?'chill':'freeze',rig==='pyro'||i%2?2:2400);
 });
 d.step(75);
 for(const i of [3,5,6])if(ids[i])g.damage(ids[i],10000);
 d.step(170);d.refresh();
 d.g5Proof={condition:g.conditionState?.condition.id??'ordinary',rig,ids,corpseCount:d.renderer.corpses.length,
  states:g.enemies.snapshot.enemies.map(e=>({id:e.id,...g.boonStatuses(e.id)}))};
}
for(const [rig,dark] of [['cryo',true],['pyro',true],['cryo',false]]){
 COND15_SCENARIOS.push({id:'look25-'+(dark?'dark-':'ordinary-')+rig,room:'breached-loading-bay',state:'playing',diagnosticOnly:true,
  setup:new Function('return ('+stageLook25.toString()+')('+JSON.stringify(rig)+','+dark+')')});
}
