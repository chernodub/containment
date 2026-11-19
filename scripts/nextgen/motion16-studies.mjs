// Native debug-fixture inputs. All positions and contacts in the resulting
// sheets come from the running game. Colour and grayscale use identical pixels.
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {registerM10Scenarios} from './m10-scenarios.mjs';
import {registerValue14Scenarios} from './value14-scenarios.mjs';

export async function recordMotion16Scenes(page,out,selection) {
 const dir=resolve(out,'scenes');await mkdir(dir,{recursive:true});
 const scenarios=[];registerM10Scenarios(scenarios);registerValue14Scenarios(scenarios);
 const supported=['crowd','crowd-stalker','crowd-spitter','crowd-carrier','pack-crawler','pack-stalker'];
 for(const name of selection.split(',')){
  if(!supported.includes(name))throw Error('Unknown motion study '+name);
  if(name.startsWith('crowd')){
   const scene=scenarios.find(s=>s.id==='value14-crowd-crew-checkpoint');
   const family=name.slice(6);
   if(family){
    // Repeat the same twenty legal floor positions and family counts with
    // the featured animal in the inner berth. Native AI still earns the lock.
    const setup=scene.setup.toString()
     .replace('const actors=choice.points',`const owner=families.indexOf('${family}');[families[0],families[owner]]=[families[owner],families[0]];const actors=choice.points`)
     .replace("a.family==='crawler'&&",`a.family==='${family}'&&`);
    await page.evaluate(new Function('return ('+setup+')()'));
   }else await page.evaluate(scene.setup);
  }
  const study=await page.evaluate(async name=>{
   const d=window.__containmentDebug,g=d.game,r=d.renderer;
   let target=0,aim=0;
   if(!name.startsWith('crowd')){
    const family=name.endsWith('stalker')?'stalker':'crawler';
    await d.gotoRoom('crew-checkpoint',{rig:'breacher'});d.invulnerable(true);g.enemies.reset();
    const b=g.geometry.bounds;let lane;
    const offsets=[[185,0],[210,-68],[263,-24],[295,-105],[327,150]];
    for(let y=b.y+150;!lane&&y<b.y+b.height-120;y+=36)for(let x=b.x+120;!lane&&x<b.x+b.width-330;x+=36){
     if(d.canStand(x,y,25)&&offsets.every(([dx,dy])=>d.canStand(x+dx,y+dy,25)&&d.clearShot(x+dx,y+dy,{x,y})))lane={x,y};
    }
    if(!lane)throw Error('No clear rifle lane');
    Object.assign(g.player,lane,{angle:0,vx:0,vy:0});g.switchWeapon('rifle');
    d.setInput({x:0,y:0,fire:false,autoAim:false,angle:0});d.step(750);g.enemies.reset();d.settlePresentation(90);
    for(const [i,[dx,dy]] of offsets.entries()){
     const id=d.spawn(i%2===0?family:family==='crawler'?'stalker':'crawler',lane.x+dx,lane.y+dy,false);
     if(!i)target=id;
    }
    // Let the same identified Stalker survive one round and die to the next
    // burst before another pack member crosses between it and the muzzle.
    if(family==='stalker'){
     const marked=g.enemies.getSnapshot(target);
     g.damage(target,Math.max(0,marked.health-19),undefined,'weapon',false);
    }
    d.step(50);
   }
   if(name==='crowd-carrier'||name==='crowd-spitter'){
    const family=name.slice(6);
    for(let tick=0;tick<180;tick++){
     const owner=g.enemies.snapshot.enemies.find(e=>e.type===family);
     if(!owner || (family==='spitter'?owner.pendingAttack==='spit':owner.meleePhase==='windup'))break;
     const dx=owner.x-g.player.x,dy=owner.y-g.player.y,length=Math.max(1,Math.hypot(dx,dy));
     // Close into the swipe; give the ranged owner space to acquire the marine.
     const move=family==='carrier'?1:length<132?-1:0;
     d.setInput({x:move*dx/length,y:move*dy/length,angle:0,fire:false,autoAim:false});
     d.step(1000/60);
    }
    d.setInput({x:0,y:0,angle:0,fire:false,autoAim:false});
   }
   d.uiFixture({preferences:{combatText:false}});
   const samples=[],start=g.elapsed;
   const sheet=document.createElement('canvas');sheet.width=1920;sheet.height=2160;const ctx=sheet.getContext('2d');
   for(let i=0;i<32;i++){
    if(target){
     const live=g.enemies.getSnapshot(target);
     if(live)aim=Math.atan2(live.y-g.player.y,live.x-g.player.x);
     // A single tangent pass, a separated body hit, then a short killing burst.
     d.setInput({x:0,y:0,angle:aim+(i<4?.21:0),autoAim:false,fire:i===0||i===6||i>=16&&i<27&&!!live});
    }
    d.step(50);d.refresh();ctx.drawImage(r.canvas,i%4*480,Math.floor(i/4)*270,480,270);
    samples.push({time:g.elapsed-start,deckSkips:r.effects.skipCursor??0,actors:g.enemies.snapshot.enemies.map(e=>({id:e.id,kind:e.type,x:e.x,y:e.y,phase:e.meleePhase,ranged:e.pendingAttack,windupMs:e.windupMs}))});
   }
   return {image:sheet.toDataURL('image/webp',.95).split(',')[1],target,samples,
    events:d.events.filter(e=>e.at>=start&&(e.contact||e.type==='corpse'||e.type==='shot'))};
  },name);
  await writeFile(resolve(dir,name+'.webp'),Buffer.from(study.image,'base64'));delete study.image;
  await writeFile(resolve(dir,name+'.json'),JSON.stringify(study));
 }
}
