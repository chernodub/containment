// Use the regular capture lifecycle with the native actor/obstacle overlay.
import {SCENARIOS} from '../../../scripts/nextgen/scenarios.mjs';
import {L8_CAPTURE_API} from '../../../scripts/nextgen/l8-capture-data.mjs';
const solids=Object.fromEntries(Object.entries(L8_CAPTURE_API.templates).filter(([,room])=>room.incidentObstacles?.length).map(([id,t])=>[id,t.incidentObstacles]));
SCENARIOS.push({id:'incident-cover',rooms:true,state:'playing',nativePointerHover:'#pause',setup:new Function('room',`return (async()=>{
 const d=window.__containmentDebug,g=d.game,rects=${JSON.stringify(solids)}[room];
 await d.gotoRoom(room);g.enemies.reset();d.invulnerable(true);
 const target={x:rects.reduce((n,r)=>n+r.x+r.width/2,0)/rects.length,y:rects.reduce((n,r)=>n+r.y+r.height/2,0)/rects.length};
 const candidates=[];
 for(let i=0;i<64;i++)for(let dist=100;dist<=260;dist+=8){
   const a=i*Math.PI/32,x=target.x+dist*Math.cos(a),y=target.y+dist*Math.sin(a);
   if(d.canStand(x,y,32))candidates.push({x,y,score:Math.hypot(x-target.x,y-target.y-130)});
 }
 const p=room==='manual-control-chamber'?{x:617,y:616}:candidates.sort((a,b)=>a.score-b.score)[0];if(!p)throw Error('No reachable viewing position');
 const angle=Math.atan2(target.y-p.y,target.x-p.x);
 Object.assign(g.player,{x:p.x,y:p.y,vx:0,vy:0,angle});
 d.setInput({x:0,y:0,angle,fire:false,autoAim:false});d.settlePresentation(120);
 d.renderer.setColliderDebug(true);d.refresh();
 })();`)});
// Native marine mark and aim point. Overload uses the open approach beside
// the relocated vents. Occupied historical marks resolve to the nearest floor.
const views={
  'passenger-vault': [277.983, 580.492, 366, 368],
  'residential-gallery': [410, 471, 410, 241],
  'communal-atrium': [565, 545, 565, 425],
  'crew-checkpoint': [606, 568, 606, 338],
  'armory': [273, 566, 273, 336],
  'freight-hold': [276.736, 439.118, 306, 292],
  'breached-loading-bay': [485, 657, 485, 427],
  'relay-racks': [539.129, 646.581, 584, 421],
  'transmission-chamber': [903, 627, 903, 397],
  'diagnostic-gallery': [362, 568, 362, 338],
  'safety-interlock-station': [550, 541, 550, 351],
  'coolant-plant': [401, 530, 401, 300],
  'service-shaft-landing': [332, 686, 332, 456],
  'infested-workshop': [515, 555, 515, 325],
  'swarm-junction': [310, 607, 310, 377],
  'shielding-gate': [455, 562, 455, 332],
  'containment-annulus': [552, 740, 552, 510],
  'manual-control-chamber': [617, 616, 617, 386],
  'overload-floor': [485, 522, 485, 477],
  'awakening-bay': [640, 495, 640, 295],
};
SCENARIOS.push({id:'incident-facing',rooms:true,state:'playing',nativePointerHover:'#pause',setup:new Function('room',`return (async()=>{
 const d=window.__containmentDebug,g=d.game;
 const [startX,startY,aimX,aimY]=${JSON.stringify(views)}[room];
 d.measureLuminance=true;
 await d.gotoRoom(room);g.enemies.reset();d.invulnerable(true);
 let mark;
 for(let distance=0;distance<=100&&!mark;distance+=2){
   for(let i=0;i<32;i++){
     const angle=Math.PI/2+i*Math.PI/16,x=startX+distance*Math.cos(angle),y=startY+distance*Math.sin(angle);
     if(d.canStand(x,y,g.player.radius)){mark={x,y};break;}
   }
 }
 if(!mark)throw Error('No legal facing position');
 const angle=Math.atan2(aimY-mark.y,aimX-mark.x);
 Object.assign(g.player,{x:mark.x,y:mark.y,vx:0,vy:0,angle});
 d.setInput({x:0,y:0,fire:false,angle,autoAim:false});d.settlePresentation(120);d.refresh();
 })();`)});

// The Manual station uses its existing centre-start kiting fixture.
const kiting=SCENARIOS.find(s=>s.id==='g6-kiting');
const centred=SCENARIOS.find(s=>s.id==='dress13-kiting');
SCENARIOS.push({...kiting,id:'incident-kiting',setup:new Function('room',
  'return room==="manual-control-chamber"?('+centred.setup.toString()+')(room):('+kiting.setup.toString()+')(room);')});
for(const side of ['front','behind']){
  SCENARIOS.push({id:'incident-'+side,rooms:true,state:'playing',nativePointerHover:'#pause',setup:new Function('room',`return (async()=>{
    const d=window.__containmentDebug,g=d.game,r=${JSON.stringify(solids)}[room][0];
    await d.gotoRoom(room);g.enemies.reset();d.invulnerable(true);
    const candidates=[];
    for(let offset=18;offset<=80;offset+=2)for(let i=1;i<20;i++){
      const x=r.x+r.width*i/20,y=${side==='front'?'r.y+r.height+offset':'r.y-offset'};
      if(d.canStand(x,y,g.player.radius))candidates.push({x,y,score:offset+Math.abs(i-10)*2});
    }
    const mark=candidates.sort((a,b)=>a.score-b.score)[0];if(!mark)throw Error('No walkable face');
    Object.assign(g.player,{x:mark.x,y:mark.y,vx:0,vy:0,angle:-Math.PI/2});
    d.setInput({x:0,y:0,fire:false,angle:-Math.PI/2,autoAim:false});d.settlePresentation(120);d.refresh();
  })();`)});
}
await import('../../../scripts/nextgen/capture.mjs');

