/** I8 family/line review: legal native actors, no statuses or combat overrides. */
async function stageFamilies(room) {
  const d=window.__containmentDebug,g=d.game,r=d.renderer;
  await d.gotoRoom(room,{rig:'breacher'});d.invulnerable(true);g.enemies.reset();
  const b=g.geometry.bounds,probe=r.player.root.position.clone(),centers=[];
  for(let y=b.y+64;y<b.y+b.height-64;y+=48)for(let x=b.x+64;x<b.x+b.width-64;x+=48){
    if(!d.canStand(x,y,g.player.radius))continue;
    let open=0;for(let a=0;a<16;a++)if(d.canStand(x+Math.cos(a*Math.PI/8)*180,y+Math.sin(a*Math.PI/8)*180,28))open++;
    centers.push({x,y,open,distance:Math.hypot(x-g.player.x,y-g.player.y)});
  }
  centers.sort((a,b)=>b.open-a.open||a.distance-b.distance);
  if(!centers.length)throw Error('No legal family review center');
  Object.assign(g.player,{x:centers[0].x,y:centers[0].y,vx:0,vy:0,angle:0});
  d.setInput({x:0,y:0,fire:false,angle:0,autoAim:false});d.step(800);g.enemies.reset();d.refresh();
  const candidates=[];
  for(let y=b.y+36;y<b.y+b.height-36;y+=24)for(let x=b.x+36;x<b.x+b.width-36;x+=24){
    const distance=Math.hypot(x-g.player.x,y-g.player.y);if(distance<105||distance>420||!d.canStand(x,y,28))continue;
    probe.set(x/32,1.4,y/32).project(r.camera);
    if(Math.abs(probe.x)>.83||probe.y<-.52||probe.y>.62)continue;
    candidates.push({x,y,distance});
  }
  candidates.sort((a,b)=>a.distance-b.distance||a.y-b.y||a.x-b.x);
  const families=['crawler','spitter','brute','carrier','stalker'],placed=[];
  for(const p of candidates){
    if(placed.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<76))continue;
    const family=families[placed.length%families.length],elite=placed.length>=10;
    const id=d.spawn(family,p.x,p.y,elite);if(!id)continue;
    if(elite&&family==='brute')g.enemies.promote(id,'warden');
    if(elite&&family==='carrier')g.enemies.promote(id,'matron');
    placed.push({...p,family,id,elite});if(placed.length===15)break;
  }
  if(placed.length<12||new Set(placed.map(p=>p.family)).size!==5)throw Error('Insufficient spread family coverage '+placed.length);
  d.i8FamilyProof={actors:placed,presentationOnly:true,invulnerable:true,spacing:76};
  d.setInput({x:.35,y:.15,fire:false,angle:0,autoAim:false});d.step(1);d.refresh();
}
export function registerI8Scenarios(scenarios) {
  scenarios.push({id:'i8-corpse-budget',state:'playing',setup:stageCorpseBudget});
  scenarios.push({id:'i8-families',rooms:true,state:'playing',burst:true,setup:stageFamilies});
}

/** Matched presentation-retention comparison; deaths use the public damage path. */
export async function stageCorpseBudget() {
  const d=window.__containmentDebug,g=d.game,r=d.renderer;
  await d.gotoRoom('relay-racks',{rig:'pyro'});d.invulnerable(true);g.enemies.reset();
  d.setInput({x:0,y:0,fire:false,angle:0,autoAim:false});d.step(600);
  const b=g.geometry.bounds,points=[],probe=r.player.root.position.clone();
  marks: for(let y=b.y+40;y<b.y+b.height-40;y+=40)for(let x=b.x+40;x<b.x+b.width-40;x+=40){
    if(!d.canStand(x,y,20)||Math.hypot(x-g.player.x,y-g.player.y)>320)continue;
    probe.set(x/32,.8,y/32).project(r.camera);
    if(Math.abs(probe.x)>.7||probe.y<-.4||probe.y>.5)continue;
    if(points.some(p=>Math.hypot(p.x-x,p.y-y)<62))continue;points.push({x,y});
    if(points.length===13)break marks;
  }
  if(points.length<13)throw Error('Not enough legal corpse comparison marks');
  for(const [i,p]of points.slice(0,13).entries()){
    const id=d.spawn(['crawler','spitter','brute','carrier','stalker'][i%5],p.x,p.y,false);
    if(!id)throw Error('Native corpse spawn denied');d.refresh();g.damage(id,100000);
  }
  d.step(600);d.refresh();
  d.i8CorpseProof={nativeDeaths:13,retained:r.corpses.length,ids:r.corpses.map(c=>c.id)};
}
