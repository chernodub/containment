/** Native firing lanes: legal staged actors, ordinary weapon and projectile rules. */
export function registerFeel12WeaponScenarios(scenarios){
 for(const weapon of ['rifle','shotgun','pistol','plasma','rocket'])for(const room of ['crew-checkpoint','relay-racks'])scenarios.push({
  id:`feel12-weapon-${weapon}-${room}`,room,state:'playing',diagnosticOnly:true,burst:true,stepMs:50,
  setup:new Function(`return (async()=>{
   const d=window.__containmentDebug,g=d.game,r=d.renderer;
   await d.gotoRoom('${room}',{rig:'breacher'});d.invulnerable(true);g.enemies.reset();
   d.setInput({x:0,y:0,fire:false,angle:0,autoAim:false});
   const bounds=g.geometry.bounds,lanes=[];
   const formation=[{family:'crawler',forward:112,side:0,radius:14},{family:'brute',forward:235,side:0,radius:28},{family:'stalker',forward:170,side:-65,radius:18},{family:'spitter',forward:250,side:70,radius:18},{family:'carrier',forward:325,side:-50,radius:28}];
   for(let y=bounds.y+128;y<bounds.y+bounds.height-128;y+=48)for(let x=bounds.x+128;x<bounds.x+bounds.width-128;x+=48){
    if(!d.canStand(x,y,40))continue;
    for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2]){
     const c=Math.cos(angle),s=Math.sin(angle),points=formation.map(a=>({...a,x:x+c*a.forward-s*a.side,y:y+s*a.forward+c*a.side}));
     if(points.some(a=>!d.canStand(a.x,a.y,a.radius)||!d.clearShot(a.x,a.y,{x,y})))continue;
     const centerX=x+c*150,centerY=y+s*150;
     lanes.push({x,y,angle,points,score:Math.hypot(centerX-bounds.x-bounds.width*.5,centerY-bounds.y-bounds.height*.5)});
    }
   }
   lanes.sort((a,b)=>a.score-b.score);if(!lanes.length)throw Error('FEEL12 native weapon lane unavailable');
   const lane=lanes[0];Object.assign(g.player,{x:lane.x,y:lane.y,vx:0,vy:0,angle:lane.angle});
   d.setInput({x:0,y:0,fire:false,angle:lane.angle,autoAim:false});d.step(1000);g.enemies.reset();d.settlePresentation(120);
   const actors=lane.points.map(p=>({id:d.spawn(p.family,p.x,p.y,false),family:p.family,x:p.x,y:p.y}));
   if(actors.some(a=>!a.id))throw Error('FEEL12 native weapon spawn rejected');
   g.switchWeapon('${weapon}');const started=g.elapsed,shotsBefore=g.stats.shotsFired;
   d.g5Proof={presentationOnly:false,stagedNativeEncounter:true,invulnerable:true,weapon:'${weapon}',actors,lane:{x:lane.x,y:lane.y,angle:lane.angle},scope:'Public switch/fire with native projectile, damage and corpse receipts; stationary staged firing lane, not campaign balance or human feel evidence'};
   Object.defineProperty(d.g5Proof,'weaponTimeline',{enumerable:true,get(){
    return {elapsed:g.elapsed,shotsBefore,shotsAfter:g.stats.shotsFired,selectedWeapon:g.combat.snapshot.weaponId,
     receipts:d.events.filter(e=>e.at>=started&&(e.type==='shot'||e.contact||e.type==='corpse'||e.type==='explosion')).map(e=>({...e})),
     targets:actors.map(a=>({id:a.id,family:a.family,snapshot:g.enemies.getSnapshot(a.id)??null}))};
   }});
   d.setInput({x:0,y:0,fire:true,angle:lane.angle,autoAim:false});d.step(1000/60);d.refresh();
  })();`),
 });
}
