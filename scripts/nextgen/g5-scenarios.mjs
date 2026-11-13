import {stageFamilies} from './i8-scenarios.mjs';
/** G5 staged actor design review. Native actors/camera; no hitbox or simulation changes. */
async function stageStandard(room, close = false) {
  const d=window.__containmentDebug,g=d.game,r=d.renderer;
  await d.gotoRoom(room,{rig:'cryo'});d.invulnerable(true);g.enemies.reset();
  const b=g.geometry.bounds,centers=[];
  for(let y=b.y+100;y<b.y+b.height-100;y+=40)for(let x=b.x+100;x<b.x+b.width-100;x+=40){
    if(!d.canStand(x,y,g.player.radius))continue;
    const marks=[{x:x-105,y:y-35},{x:x+105,y:y-35}];
    if(marks.every(p=>d.canStand(p.x,p.y,28)))centers.push({x,y,distance:Math.hypot(x-g.player.x,y-g.player.y)});
  }
  centers.sort((a,b)=>a.distance-b.distance);if(!centers.length)throw Error('No legal G5 review marks');
  const center=centers[0];Object.assign(g.player,{x:center.x,y:center.y+60,vx:0,vy:0,angle:-Math.PI/2});
  d.setInput({x:0,y:0,fire:false,angle:-Math.PI/2,autoAim:false});d.step(800);g.enemies.reset();
  const ids=[d.spawn('brute',center.x-105,center.y-35,false),d.spawn('spitter',center.x+105,center.y-35,false)];
  if(ids.some(id=>!id))throw Error('G5 standard actors missing');
  d.step(250);d.setInput({x:0,y:0,fire:false,angle:-Math.PI/2,autoAim:false});
  if(close){r.viewHeight/=1.65;r.viewWidth/=1.65;d.refresh();}
  d.g5Proof={presentationOnly:true,actors:['marine','brute','spitter'],ids,room,close};d.refresh();
  d.g5Proof.projected=[r.player,...ids.map(id=>r.actors.get(id))].map(model=>{const p=model.root.position.clone();p.y=model.height*.5;p.project(r.camera);return {name:model.root.name,x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};});
}
export function registerG5Scenarios(scenarios) {
  const kiting=scenarios.find(s=>s.id==='combat-kiting');
  scenarios.push({...kiting,id:'g5-body-only',setup:new Function('room',`return (async()=>{await (${kiting.setup.toString()})(room);const d=window.__containmentDebug;d.renderer.playerBeacon.locatorMaterial.opacity=0;d.g5Proof={presentationOnly:true,groundLocatorHidden:true,bodyAndOcclusionSkinUnchanged:true};d.refresh();})();`)});
  const exposed=scenarios.find(s=>s.id==='g2-queen-exposed');
  scenarios.push({...exposed,id:'g5-queen-status',setup:new Function(`return (async()=>{await (${exposed.setup.toString()})();const d=window.__containmentDebug,q=d.renderer.queen,apply=q.setAffliction;q.setAffliction=status=>apply({...status,chilled:true,frozen:true,burning:true});d.g5Proof={presentationOnly:true,queenStatus:'frozen+burning',noSimulationStatusOverride:true};d.refresh();})();`)});
  scenarios.push({id:'g5-silhouettes',rooms:true,state:'playing',burst:true,stepMs:66,setup:new Function('room',`return (async()=>{await (${stageFamilies.toString()})(room);window.__containmentDebug.g5Proof={presentationOnly:true,silhouette:true};})();`)});
  for(const close of [false,true])scenarios.push({id:close?'g5-standard-close':'g5-standard',rooms:true,state:'playing',burst:true,stepMs:66,setup:new Function('room',`return (${stageStandard.toString()})(room,${close});`)});
}
