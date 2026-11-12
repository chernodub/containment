/** G4 renderer-only evidence through the existing opt-in fixture API. */
async function stageFootprints({queen=false,low=false,family=null}={}) {
  const d=window.__containmentDebug,g=d.game;
  await d.gotoRoom(queen?'reactor-vault':family?'armory':'containment-annulus',queen?{version:2}:{rig:'breacher'});
  if(low){d.renderer.setQuality('low');await d.prepare();}
  d.invulnerable(true);d.setInput({x:0,y:0,fire:false,angle:0,autoAim:false});
  d.renderer.setColliderDebug(true);
  if(queen){d.step(650);d.refresh();return;}
  g.enemies.reset();
  const b=g.geometry.bounds,candidates=[];
  for(let y=b.y+90;y<b.y+b.height-90;y+=48)for(let x=b.x+90;x<b.x+b.width-90;x+=48){
    if(!d.canStand(x,y,28))continue;let score=0;
    for(let i=0;i<16;i++){const a=i*Math.PI/8;if(d.canStand(x+Math.cos(a)*140,y+Math.sin(a)*140,28))score++;}
    candidates.push({x,y,score});
  }
  candidates.sort((a,b)=>b.score-a.score);
  if(!candidates.length)throw Error('No legal footprint evidence center');
  Object.assign(g.player,{x:candidates[0].x,y:candidates[0].y,vx:0,vy:0});d.step(700);g.enemies.reset();d.refresh();
  const placed=[],proof=[],probe=d.renderer.player.root.position.clone();
  for(const [kind,radius] of [['brute',28],['carrier',24],['spitter',18],['stalker',17],['crawler',14]].filter(([kind])=>!family||kind===family)){
    let pair;
    for(let y=b.y+48;y<b.y+b.height-48&&!pair;y+=24)for(let x=b.x+48;x<b.x+b.width-48;x+=24){
      const points=[{x,y},{x:x+radius*2+2,y}];
      if(points.some(p=>Math.hypot(p.x-g.player.x,p.y-g.player.y)<radius+g.player.radius+24||!d.canStand(p.x,p.y,radius)||!d.renderer.visible(p.x,p.y)||placed.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<radius+q.radius+12)))continue;
      if(family&&points.some(p=>{
        probe.set(p.x/32,0,p.y/32).project(d.renderer.camera);if(probe.x<-.65||probe.x>.62||probe.y<-.50)return true;
        probe.set(p.x/32,3.4,p.y/32).project(d.renderer.camera);return probe.y>.60;
      }))continue;
      pair=points;break;
    }
    if(!pair)throw Error('No legal touching pair for '+kind);
    for(let i=0;i<2;i++){
      const p=pair[i],id=d.spawn(kind,p.x,p.y,i===1);if(!id)throw Error('Footprint spawn rejected '+kind);
      if(i===1&&kind==='brute')g.enemies.promote(id,'warden');
      if(i===1&&kind==='carrier')g.enemies.promote(id,'matron');
      placed.push({...p,radius});proof.push({id,kind,elite:i===1,radius,...p});
    }
  }
  // Render the actual rest pose without advancing enemies into one another.
  d.step(1);d.g4FootprintProof={marineRadius:g.player.radius,actors:proof,touchGap:2,presentationOnly:true};d.refresh();
}

async function stageDanger({ability,low=false}) {
  const d=window.__containmentDebug,g=d.game,rig=ability==='whiteout'?'cryo':'pyro';
  await d.gotoRoom('containment-annulus',{rig});d.invulnerable(true);g.enemies.reset();
  if(low){d.renderer.setQuality('low');await d.prepare();}
  const b=g.geometry.bounds;let lane;
  for(let y=b.y+90;y<b.y+b.height-90&&!lane;y+=32)for(let x=b.x+90;x<b.x+b.width-90&&!lane;x+=32){
    if(!d.canStand(x,y,28))continue;
    for(let i=0;i<16;i++){const a=i*Math.PI/8,p={x:x+Math.cos(a)*180,y:y+Math.sin(a)*180};if(d.canStand(p.x,p.y,28)&&d.clearShot(p.x,p.y,{x,y})){lane={x,y,target:p,angle:a};break;}}
  }
  if(!lane)throw Error('No legal hostile-priority lane');
  Object.assign(g.player,{x:lane.x,y:lane.y,vx:0,vy:0,angle:lane.angle});d.setInput({x:0,y:0,fire:false,angle:lane.angle,autoAim:false});d.step(700);g.enemies.reset();d.refresh();
  const id=d.spawn('spitter',lane.target.x,lane.target.y,true);if(!id)throw Error('Priority spitter rejected');
  g.setAimPoint({x:lane.x+Math.cos(lane.angle)*55,y:lane.y+Math.sin(lane.angle)*55});
  const slot=ability==='napalm-charge'?'power':'overdrive';if(slot==='overdrive')d.fillOverdrive();
  if(!g.useAbility(slot))throw Error('Native '+ability+' rejected');
  d.step(g.abilities.snapshot.slots[slot].castRemainingMs+30);
  for(let i=0;i<120&&!g.enemies.snapshot.enemies.some(e=>e.id===id&&e.pendingAttack==='spit');i++)d.step(30);
  const spitter=g.enemies.snapshot.enemies.find(e=>e.id===id);
  if(!spitter||spitter.pendingAttack!=='spit')throw Error('Native spitter warning absent');
  d.step(150);d.g4DangerProof={ability,rig,spitter:id,nativeWarning:true,invulnerable:true,presentationOnly:true};d.refresh();
}

export const G4_SCENARIOS=[
  ...['brute','carrier','spitter','stalker','crawler'].flatMap(family=>[false,true].map(low=>({id:`g4-footprints-${family}${low?'-low':''}`,state:'playing',room:'armory',setup:stageFootprints,setupArgument:{family,low}}))),
  {id:'g4-footprints',state:'playing',room:'containment-annulus',setup:stageFootprints,setupArgument:{}},
  {id:'g4-footprints-low',state:'playing',room:'containment-annulus',setup:stageFootprints,setupArgument:{low:true}},
  {id:'g4-queen-footprint',state:'playing',room:'reactor-vault',setup:stageFootprints,setupArgument:{queen:true}},
  ...['whiteout','meltdown','napalm-charge'].flatMap(ability=>[false,true].map(low=>({
    id:`g4-danger-${ability}${low?'-low':''}`,state:'playing',room:'containment-annulus',burst:true,
    setup:stageDanger,setupArgument:{ability,low},
  }))),
];
