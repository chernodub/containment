/** Legal native contacts cross each yielding HUD panel; no opacity override. */
export const U7_SCENARIOS = ['action-bar','vitals','status-hud','radar-hud'].map(panel=>({
 id:`u7-crossing-${panel}`,state:'playing',burst:true,stepMs:40,
 u7Crossing:true,
 required:[`${panel==='vitals'?'.vitals':'#'+panel}[data-obscures-threat=true]`],
 setupArgument:panel,
 setup:async panel=>{
  const d=window.__containmentDebug,g=d.game,r=d.renderer,selector=panel==='vitals'?'.vitals':'#'+panel;
  for(const room of ['awakening-bay','armory','containment-annulus','overload-floor']) {
   await d.gotoRoom(room,{rig:'cryo'});d.invulnerable(true);g.enemies.reset();
   d.uiFixture({preferences:{combatText:true,radar:true}});d.step(4500);d.refresh();
   const bounds=g.geometry.bounds;
   const origins=panel==='vitals'?[[.72,.72],[.5,.72],[.72,.5],[.5,.5]]:[[null,null]];
   for(const [fx,fy] of origins){
   if(fx!==null){
    const wanted={x:bounds.x+bounds.width*fx,y:bounds.y+bounds.height*fy},marks=[];
    for(let y=bounds.y+35;y<bounds.y+bounds.height-35;y+=25)for(let x=bounds.x+35;x<bounds.x+bounds.width-35;x+=25)if(d.canStand(x,y,g.player.radius))marks.push({x,y,score:Math.hypot(x-wanted.x,y-wanted.y)});
    marks.sort((a,b)=>a.score-b.score);if(!marks.length)continue;
    Object.assign(g.player,{x:marks[0].x,y:marks[0].y,vx:0,vy:0});d.setInput({x:0,y:0,fire:false,angle:0,autoAim:false});d.step(900);g.enemies.reset();d.refresh();
   }
   const candidates=[];
   let box=document.querySelector(selector).getBoundingClientRect();
   // Search legal floor in native camera space, including anatomy reaching above its feet.
   const point=r.camera.position.clone();
   for(let y=bounds.y+30;y<bounds.y+bounds.height-30;y+=22)for(let x=bounds.x+30;x<bounds.x+bounds.width-30;x+=22){
    if(!d.canStand(x,y,28)||Math.hypot(x-g.player.x,y-g.player.y)<120)continue;
    point.set(x/32,.8,y/32).project(r.camera);
    const sx=(point.x+1)*innerWidth/2,sy=(1-point.y)*innerHeight/2;
    if(sx<box.left-25||sx>box.right+25||sy<box.top-25||sy>box.bottom+90)continue;
    candidates.push({x,y,score:Math.hypot(sx-(box.left+box.width/2),sy-(box.top+box.height/2+15))});
   }
   candidates.sort((a,b)=>a.score-b.score);
   for(const p of candidates.slice(0,40)){
    const id=d.spawn('brute',p.x,p.y);if(!id)continue;
    d.refresh();
    if(document.querySelector(selector).dataset.obscuresThreat!=='true'){g.enemies.reset();d.refresh();continue;}
    g.switchWeapon('rifle');g.setAimPoint({x:p.x,y:p.y});g.useAbility('tactical');
    d.setInput({x:0,y:0,fire:true,angle:Math.atan2(p.y-g.player.y,p.x-g.player.x),autoAim:false});d.step(40);d.refresh();
    let stable=true;
    for(let frame=0;frame<6;frame++){d.step(40);d.refresh();if(document.querySelector(selector).dataset.obscuresThreat!=='true'){stable=false;break;}}
    if(stable){
     await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));d.refresh();
     const body={},box=document.querySelector(selector).getBoundingClientRect();
     const alive=g.enemies.snapshot.enemies.some(enemy=>enemy.id===id&&enemy.health>0);
     stable=alive&&r.actorScreenBounds(id,p.x,p.y,28,body)&&body.left<box.right&&body.right>box.left&&Math.min(body.bottom,box.bottom)-Math.max(body.top,box.top)>Math.min(24,box.height*.4)&&Math.min(body.right,box.right)-Math.max(body.left,box.left)>20&&document.querySelector(selector).dataset.obscuresThreat==='true';
    }
    if(stable){d.u7Crossing={panel,room,enemy:id,player:{x:g.player.x,y:g.player.y},contact:p,rifleShots:g.stats.shotsFired,method:'Legal floor contact; native rifle and Cryo Nova; six settled fixed steps without fade override'};return;}
    g.enemies.reset();d.refresh();
   }
   }
  }
  throw Error(`No legal native fight crossing ${panel}`);
 },
}));

const crossing=U7_SCENARIOS[0];
U7_SCENARIOS.push({...crossing,id:'u7-crossing-reload',nativeReload:true,required:[...crossing.required,'#reload-label'],setup:new Function('panel',`return(async()=>{await (${crossing.setup.toString()})(panel);window.__containmentDebug.game.reload();window.__containmentDebug.refresh();})();`)});
