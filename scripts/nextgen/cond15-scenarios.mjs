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
     d.setInput({x:dx/r,y:dy/r,angle:Math.atan2(dy,dx)});d.step(500);g.useAbility('dash');d.step(330);d.setInput({x:0,y:0});d.step(180);
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
