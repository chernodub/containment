/** Native firing lanes: legal staged actors, ordinary weapon and projectile rules. */
export function registerFeel12WeaponScenarios(scenarios){
 for(const focus of ['crawler','stalker','brute'])for(const weapon of ['rifle','shotgun','pistol','plasma','rocket'])for(const room of ['crew-checkpoint','relay-racks']){
  if(focus!=='crawler'&&weapon!=='rifle'&&weapon!=='shotgun')continue;
  const setup = (rocketGallery = false) => new Function(`return (async()=>{
   const d=window.__containmentDebug,g=d.game,r=d.renderer;
   await d.gotoRoom('${room}',{rig:'breacher'});d.invulnerable(true);g.enemies.reset();
   d.setInput({x:0,y:0,fire:false,angle:0,autoAim:false});
   const bounds=g.geometry.bounds,lanes=[];
   const radii={crawler:14,stalker:18,brute:28,spitter:18,carrier:28};
   const groupBreak=[{family:'brute',forward:260,side:0},{family:'crawler',forward:260,side:-65},{family:'crawler',forward:260,side:65}];
   const formation=(${rocketGallery} ? groupBreak : [{family:'crawler',forward:112,side:0},{family:'brute',forward:235,side:0},{family:'stalker',forward:170,side:-65},{family:'spitter',forward:250,side:70},{family:'carrier',forward:325,side:-50}]).filter((_,i)=>'${focus}'==='crawler'||i===0).map(a=>{
    const family=a.family==='crawler'?'${focus}':a.family==='${focus}'?'crawler':a.family;
    return {...a,family,radius:radii[family]};
   });
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
   d.setInput({x:0,y:0,fire:false,angle:lane.angle,autoAim:false});if(${rocketGallery})g.switchWeapon('rocket');d.step(1000);g.enemies.reset();d.settlePresentation(120);
   const actors=lane.points.map(p=>({id:d.spawn(p.family,p.x,p.y,false),family:p.family,x:p.x,y:p.y}));
   if(actors.some(a=>!a.id))throw Error('FEEL12 native weapon spawn rejected');
   g.switchWeapon('${weapon}');const started=g.elapsed,shotsBefore=g.stats.shotsFired;
   d.g5Proof={presentationOnly:false,stagedNativeEncounter:true,invulnerable:true,weapon:'${weapon}',focusFamily:'${focus}',captureOnlyTracking:${focus!=='crawler'},actors,lane:{x:lane.x,y:lane.y,angle:lane.angle},scope:'Public switch/fire with native projectile, damage and corpse receipts; focused victims use existing debug aim tracking, not campaign balance or human feel evidence'};
   Object.defineProperty(d.g5Proof,'weaponTimeline',{enumerable:true,get(){
    return {elapsed:g.elapsed,shotsBefore,shotsAfter:g.stats.shotsFired,selectedWeapon:g.combat.snapshot.weaponId,
     receipts:d.events.filter(e=>e.at>=started&&(e.type==='shot'||e.contact||e.type==='corpse'||e.type==='explosion')).map(e=>({...e})),
     targets:actors.map(a=>({id:a.id,family:a.family,snapshot:g.enemies.getSnapshot(a.id)??null}))};
   }});
   d.setInput({x:0,y:0,fire:true,angle:${focus==='crawler'?'lane.angle':'null'},autoAim:${focus!=='crawler'}});d.step(1000/60);d.refresh();
  })();`);
  // Keep the first live shot and a longer native kill/settle tail for heavy health.
  scenarios.push({
   id:`feel12-weapon-${focus==='crawler'?'':`${focus}-`}${weapon}-${room}`,room,state:'playing',diagnosticOnly:true,burst:true,stepMs:focus==='crawler'?50:focus==='brute'&&room==='relay-racks'?500:250,...(focus==='crawler'?{}:{frameCount:30}),
   setup:setup(),
  });
  if(weapon==='rocket'&&room==='crew-checkpoint')scenarios.push({
   id:'gallery-weapon-rocket',room,state:'playing',diagnosticOnly:true,
   setup:new Function(`return (async()=>{
    await (${setup(true).toString()})();
    const d=window.__containmentDebug;
    d.setInput({fire:false});
    const hitGroup=()=>new Set(d.g5Proof.weaponTimeline.receipts.filter(e=>
     e.type==='hit'&&e.weapon==='rocket'&&e.damage>0).map(e=>e.targetId)).size>1;
    for(let frame=0;frame<60&&!hitGroup();frame++)d.step(1000/60);
    if(!hitGroup())throw Error('Rocket did not damage multiple targets');
    d.refresh();
   })();`),
  });
 }
}
