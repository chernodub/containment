/** I8 family/line review: legal native actors, no statuses or combat overrides. */
export async function stageFamilies(room) {
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
  const b=g.geometry.bounds,probe=r.player.root.position.clone(),i=r.hudInsets,centers=[];
  let points=[],origin;
  // The former door mark/normalized crop assumed the old distant camera.
  // Search legal interior marks against the actual closer native viewport.
  for(let y=b.y+64;y<b.y+b.height-64;y+=64)for(let x=b.x+64;x<b.x+b.width-64;x+=64){
    if(d.canStand(x,y,g.player.radius))centers.push({x,y});
  }
  centers.sort((a,c)=>Math.hypot(a.x-b.x-b.width/2,a.y-b.y-b.height/2)-Math.hypot(c.x-b.x-b.width/2,c.y-b.y-b.height/2));
  for(const center of centers){
    Object.assign(g.player,{x:center.x,y:center.y,vx:0,vy:0});
    r.cameraRig.reset(center.x/32,center.y/32);r.roomCombatFraming.reset();d.refresh();
    const candidates=[];
    for(let y=b.y+40;y<b.y+b.height-40;y+=26)for(let x=b.x+40;x<b.x+b.width-40;x+=26){
      const distance=Math.hypot(x-center.x,y-center.y);
      if(!d.canStand(x,y,32)||distance<64||distance>420)continue;
      let fits=true;
      for(const dx of [-32,32])for(const dz of [-32,32])for(const h of [0,1.2]){
        probe.set((x+dx)/32,h,(y+dz)/32).project(r.camera);
        const sx=(probe.x+1)*innerWidth/2,sy=(1-probe.y)*innerHeight/2;
        if(sx<i.left+12||sx>innerWidth-i.right-12||sy<i.top+12||sy>innerHeight-i.bottom-12)fits=false;
      }
      if(fits&&candidates.every(p=>Math.hypot(p.x-x,p.y-y)>=76))candidates.push({x,y});
    }
    if(candidates.length>points.length){points=candidates;origin=center;}
    if(points.length>=13)break;
  }
  // Preserve all adequate old marks. Only a deficient closer-camera crop
  // gets the same76unit hex phase search, with identical native floor/body pads.
  let packingMode='legacy-grid';const fallbackTrials=[];
  if(points.length<13)for(const center of centers){
    Object.assign(g.player,{x:center.x,y:center.y,vx:0,vy:0});
    r.cameraRig.reset(center.x/32,center.y/32);r.roomCombatFraming.reset();d.refresh();
    let centerBest=0;
    for(let layout=0;layout<32;layout++){
      const candidates=[],spacing=76,row=spacing*Math.sqrt(3)/2;
      for(let iy=-9;iy<=9;iy++)for(let ix=-9;ix<=9;ix++){
        const u=(ix+(iy&1)*.5+(layout&3)*.25)*spacing,w=(iy+((layout>>2)&3)*.25)*row;
        const x=center.x+(layout<16?u:w),y=center.y+(layout<16?w:u),distance=Math.hypot(x-center.x,y-center.y);
        if(!d.canStand(x,y,32)||distance<64||distance>420)continue;
        let fits=true;
        for(const dx of [-32,32])for(const dz of [-32,32])for(const h of [0,1.2]){
          probe.set((x+dx)/32,h,(y+dz)/32).project(r.camera);
          const sx=(probe.x+1)*innerWidth/2,sy=(1-probe.y)*innerHeight/2;
          if(sx<i.left+12||sx>innerWidth-i.right-12||sy<i.top+12||sy>innerHeight-i.bottom-12)fits=false;
        }
        if(fits)candidates.push({x,y});
      }
      centerBest=Math.max(centerBest,candidates.length);
      if(candidates.length>points.length){points=candidates;origin=center;packingMode='hex-fallback';}
      if(points.length>=13)break;
    }
    fallbackTrials.push({x:center.x,y:center.y,best:centerBest});if(points.length>=13)break;
  }
  if(points.length<13)throw Error('Not enough legal corpse comparison marks');
  Object.assign(g.player,{x:origin.x,y:origin.y,vx:0,vy:0});
  r.cameraRig.reset(origin.x/32,origin.y/32);r.roomCombatFraming.reset();d.refresh();
  let killed=0;
  for(const p of points){
    const id=d.spawn(['crawler','spitter','brute','carrier','stalker'][killed%5],p.x,p.y,false);
    if(!id)continue;d.refresh();g.damage(id,100000);if(++killed===13)break;
  }
  if(killed!==13)throw Error('Expected thirteen legal native deaths; got '+killed);
  d.step(600);d.refresh();
  d.i8CorpseProof={nativeDeaths:13,retained:r.corpses.length,ids:r.corpses.map(c=>c.id),packingMode,fallbackTrials,marks:points.slice(0,13),origin};
}
