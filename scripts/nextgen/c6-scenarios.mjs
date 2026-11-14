/** Legal native family packing for the closer hero camera; no hitbox/status edits. */
export async function stageC6Families(room) {
 const d=window.__containmentDebug,g=d.game,r=d.renderer;
 await d.gotoRoom(room,{rig:'breacher'});d.invulnerable(true);g.enemies.reset();
 d.setInput({x:0,y:0,fire:false,angle:0,autoAim:false});
 const b=g.geometry.bounds,centers=[],probe=r.player.root.position.clone();
 for(let y=b.y+80;y<b.y+b.height-80;y+=64)for(let x=b.x+80;x<b.x+b.width-80;x+=64){
  if(!d.canStand(x,y,g.player.radius))continue;
  let open=0;for(let n=0;n<16;n++)if(d.canStand(x+Math.cos(n*Math.PI/8)*180,y+Math.sin(n*Math.PI/8)*180,28))open++;
  centers.push({x,y,open});
 }
 centers.sort((a,b)=>b.open-a.open);let selected=[],origin,packingMode='legacy-grid';const fallbackTrials=[];
 for(const center of centers.slice(0,48)){
  Object.assign(g.player,{x:center.x,y:center.y,vx:0,vy:0,angle:0});
  r.cameraRig.reset(center.x/32,center.y/32);r.roomCombatFraming.reset();d.refresh();
  // Candidate search may use the valid100px threat floor; every saved frame
  // is subsequently solved by the unmodified production camera.
  r.camera.zoom*=100/122;r.camera.updateProjectionMatrix();
  const candidates=[],i=r.hudInsets,v={left:-1+2*i.left/innerWidth,right:1-2*i.right/innerWidth,top:1-2*i.top/innerHeight,bottom:-1+2*i.bottom/innerHeight};
  for(let y=b.y+40;y<b.y+b.height-40;y+=26)for(let x=b.x+40;x<b.x+b.width-40;x+=26){
   const distance=Math.hypot(x-center.x,y-center.y);if(distance<105||distance>600||!d.canStand(x,y,28))continue;
   let visible=true;
   for(const dx of [-28,28])for(const dz of [-28,28])for(const h of [0,3.2]){
    probe.set((x+dx)/32,h,(y+dz)/32).project(r.camera);
    if(probe.x<v.left+.025||probe.x>v.right-.025||probe.y<v.bottom+.025||probe.y>v.top-.025)visible=false;
   }
   if(visible)candidates.push({x,y,distance});
  }
  candidates.sort((a,b)=>a.y-b.y||a.x-b.x);const points=[];
  for(const p of candidates){if(points.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=76))points.push(p);if(points.length===15)break;}
  if(points.length>selected.length){selected=points;origin=center;}
  if(selected.length===15)break;
 }
 // Preserve adequate legacy marks. A deficient narrow viewport instead uses
 // real loaded family heights and the final production matrix, never a crop.
 if(selected.length<12&&nativeFamilyFallback())return;
 if(selected.length<12)throw Error('C6 legal family spread below twelve: '+selected.length);
 Object.assign(g.player,{x:origin.x,y:origin.y,vx:0,vy:0,angle:0});
 r.cameraRig.reset(origin.x/32,origin.y/32);r.roomCombatFraming.reset();d.refresh();
 // Keep the tall Warden away from the near-left perspective edge. The
 // smaller Crawler and a shifted bottom row keep the same legal spacing.
 if(packingMode==='legacy-grid'&&selected.length===15){[selected[10],selected[12]]=[selected[12],selected[10]];for(const n of [10,13,14]){const p=selected[n];if(d.canStand(p.x+26,p.y,28))selected[n]={...p,x:p.x+26};}}
 // Put the tall Carrier on the deeper row and its shorter Brute on the
 // northern mark; all native footprints and76-unit separation remain.
 if(packingMode==='legacy-grid'&&selected.length===15){[selected[3],selected[7]]=[selected[7],selected[3]];const row=selected[5].y,shifted=selected.map(p=>p.y===row?{...p,x:p.x+26}:p);if(shifted.every(p=>d.canStand(p.x,p.y,28))&&shifted.every((p,n)=>shifted.every((q,m)=>m===n||Math.hypot(p.x-q.x,p.y-q.y)>=76)))selected=shifted;}
 if(packingMode==='legacy-grid'&&selected.length===15){const p=selected[11],q={...p,x:p.x-52,y:p.y+78};if(d.canStand(q.x,q.y,28)&&selected.every((a,n)=>n===11||Math.hypot(a.x-q.x,a.y-q.y)>=76))selected[11]=q;}
 const families=['crawler','spitter','brute','carrier','stalker'],placed=[];
 for(const p of selected){const family=families[placed.length%5],elite=placed.length>=10,id=d.spawn(family,p.x,p.y,elite);
  if(!id)throw Error('C6 legal family spawn rejected');
  if(elite&&family==='brute')g.enemies.promote(id,'warden');if(elite&&family==='carrier')g.enemies.promote(id,'matron');
  placed.push({...p,family,id,elite});
 }
 if(new Set(placed.map(p=>p.family)).size!==5)throw Error('C6 missing family');
 d.i8FamilyProof={actors:placed,presentationOnly:true,invulnerable:true,spacing:76,closerCameraPacking:true,packingMode,fallbackTrials};
 d.g5Proof={presentationOnly:true,silhouette:true};d.refresh();if(innerHeight<=720)for(let n=0;n<4;n++)d.refresh();
 const i=r.hudInsets,box={left:0,right:0,top:0,bottom:0};
 const radiusOf=p=>g.enemies.snapshot.enemies.find(e=>e.id===p.id).radius;
 const fits=(p,x=p.x,y=p.y,pad=0)=>r.actorScreenBounds(p.id,x,y,radiusOf(p),box)&&box.left>=i.left+pad&&box.right<=innerWidth-i.right-pad&&box.top>=i.top+pad&&box.bottom<=innerHeight-i.bottom-pad;
 // Recheck the actual native matrix after threat framing, then respawn the same
 // actors on legal marks if a peripheral body was pushed beyond HUD.
 for(let attempt=0;attempt<8;attempt++){
  const bad=placed.find(p=>!fits(p));if(!bad)break;
  let best,bestDistance=Infinity;
  for(let y=b.y+40;y<b.y+b.height-40;y+=13)for(let x=b.x+40;x<b.x+b.width-40;x+=13){
   const distance=Math.hypot(x-bad.x,y-bad.y);
   if(distance>=bestDistance||Math.hypot(x-g.player.x,y-g.player.y)<105||!d.canStand(x,y,28)||placed.some(p=>p!==bad&&Math.hypot(x-p.x,y-p.y)<76)||!fits(bad,x,y,18))continue;
   best={x,y};bestDistance=distance;
  }
  if(!best){
   if((placed.length<=12||placed.filter(p=>p.family===bad.family).length<=1)&&nativeFamilyFallback())return;
   if(placed.length<=12||placed.filter(p=>p.family===bad.family).length<=1)throw Error('C6 no legal full-body replacement mark for '+bad.family);
   placed.splice(placed.indexOf(bad),1);
  }else Object.assign(bad,best);
  g.enemies.reset();
  for(const p of placed){p.id=d.spawn(p.family,p.x,p.y,p.elite);if(!p.id)throw Error('C6 replacement native spawn rejected');if(p.elite&&p.family==='brute')g.enemies.promote(p.id,'warden');if(p.elite&&p.family==='carrier')g.enemies.promote(p.id,'matron');}
  r.cameraRig.reset(origin.x/32,origin.y/32);r.roomCombatFraming.reset();d.refresh();
 }
 for(const p of placed)if(!fits(p)){if(nativeFamilyFallback())return;throw Error('C6 staged family body clips usable viewport: '+p.family+' '+p.id+' '+JSON.stringify(box));}
 if(placed.length<12||new Set(placed.map(p=>p.family)).size!==5)throw Error('C6 lost required native family coverage');
 d.i8FamilyProof.actors=placed;d.i8FamilyProof.requested=15;d.i8FamilyProof.fullBodyCount=placed.length;

 // Only entered after the old search or actual-body validation is deficient.
 // Hex marks are exactly76 apart; matching uses each native actor's complete
 // eight-corner bounds. No simulation tick, status, health or camera override.
 function nativeFamilyFallback(){
  const families=['crawler','spitter','brute','carrier','stalker'],i=r.hudInsets,box={left:0,right:0,top:0,bottom:0};
  const trials=[];d.i8FamilyProof={actors:[],requested:15,fullBodyCount:0,presentationOnly:true,invulnerable:true,spacing:76,packingMode:'native-hex-fallback',fallbackTrials:trials,stagingFailed:true};
  for(const center of centers.slice(0,48)){
   Object.assign(g.player,{x:center.x,y:center.y,vx:0,vy:0,angle:0});g.enemies.reset();
   const seed=[],seedCandidates=[];
   for(let y=b.y+40;y<b.y+b.height-40;y+=38)for(let x=b.x+40;x<b.x+b.width-40;x+=38){
    if(Math.hypot(x-center.x,y-center.y)>=105&&d.canStand(x,y,28))seedCandidates.push({x,y});
   }
   // A far north-row bootstrap can select zero contacts in the annular room,
   // leaving no real nearby engagement for production framing to solve.
   // Keep all already passing other-room seed order; Annulus alone begins
   // with the nearest legal105-reserve marks, still at least76 apart.
   if(room==='containment-annulus')seedCandidates.sort((a,b)=>Math.hypot(a.x-center.x,a.y-center.y)-Math.hypot(b.x-center.x,b.y-center.y)||a.y-b.y||a.x-b.x);
   for(const p of seedCandidates)if(seed.length<15&&seed.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=76))seed.push(p);
   if(seed.length<15)continue;
   let actors=seed.map((p,n)=>({...p,family:families[n%5],elite:n>=10,id:0}));
   const spawn=()=>{g.enemies.reset();for(const p of actors){p.id=d.spawn(p.family,p.x,p.y,p.elite);if(!p.id)return false;if(p.elite&&p.family==='brute')g.enemies.promote(p.id,'warden');if(p.elite&&p.family==='carrier')g.enemies.promote(p.id,'matron');}return true;};
   if(!spawn())continue;
   r.cameraRig.reset(center.x/32,center.y/32);r.roomCombatFraming.reset();for(let n=0;n<5;n++)d.refresh();
   for(let pass=0;pass<8;pass++){
    let best=[],bestLayout=-1;
    for(let layout=0;layout<32;layout++){
     const marks=[],spacing=76,row=spacing*Math.sqrt(3)/2;
     for(let iy=-12;iy<=12;iy++)for(let ix=-12;ix<=12;ix++){
      const u=(ix+(iy&1)*.5+(layout&3)*.25)*spacing,w=(iy+((layout>>2)&3)*.25)*row;
      const x=center.x+(layout<16?u:w),y=center.y+(layout<16?w:u);
      if(Math.hypot(x-center.x,y-center.y)<105||Math.hypot(x-center.x,y-center.y)>600||!d.canStand(x,y,28))continue;
      marks.push({x,y});
     }
     const edges=actors.map(p=>{const e=g.enemies.snapshot.enemies.find(e=>e.id===p.id);return marks.flatMap((q,n)=>d.canStand(q.x,q.y,e.radius)&&r.actorScreenBounds(p.id,q.x,q.y,e.radius,box)&&box.left>=i.left+6&&box.right<=innerWidth-i.right-6&&box.top>=i.top+6&&box.bottom<=innerHeight-i.bottom-6?[n]:[]);});
     const owner=new Map(),assigned=new Map();
     const match=(a,seen)=>{for(const m of edges[a]){if(seen.has(m))continue;seen.add(m);const prior=owner.get(m);if(prior===undefined||match(prior,seen)){owner.set(m,a);assigned.set(a,m);return true;}}return false;};
     // Base five family representatives precede redundant variants if the
     // viewport cannot retain all fifteen. Native minimum remains twelve.
     const order=actors.map((_,n)=>n).sort((a,b)=>(a<5?0:1)-(b<5?0:1)||edges[a].length-edges[b].length);
     for(const n of order)match(n,new Set());
     const packed=[...assigned].map(([n,m])=>({...actors[n],...marks[m]}));
     if(packed.length>best.length&&new Set(packed.map(p=>p.family)).size===5){best=packed;bestLayout=layout;}
     if(best.length===15)break;
    }
    trials.push({x:center.x,y:center.y,pass,matched:best.length,layout:bestLayout,seedMode:room==='containment-annulus'?'nearby-annulus':'legacy-north-row',seedNearest:Math.min(...seed.map(p=>Math.hypot(p.x-center.x,p.y-center.y))),seedFarthest:Math.max(...seed.map(p=>Math.hypot(p.x-center.x,p.y-center.y)))});
    if(best.length<12)break;
    actors=best;if(!spawn())break;for(let n=0;n<5;n++)d.refresh();
    let stable=true;
    for(let sample=0;sample<4;sample++){
     d.refresh();for(const p of actors){const e=g.enemies.snapshot.enemies.find(e=>e.id===p.id);if(!r.actorScreenBounds(p.id,p.x,p.y,e.radius,box)||box.left<i.left||box.right>innerWidth-i.right||box.top<i.top||box.bottom>innerHeight-i.bottom)stable=false;}
    }
    if(stable){d.i8FamilyProof={actors,requested:15,fullBodyCount:actors.length,presentationOnly:true,invulnerable:true,spacing:76,closerCameraPacking:true,packingMode:'native-hex-fallback',fallbackTrials:trials};d.g5Proof={presentationOnly:true,silhouette:true};return true;}
   }
  }
  return false;
 }

}

/** C6 organic-style native kiting with exact deck projection for offline overlays. */
export function registerC6Scenarios(scenarios) {
 // The closer camera supersedes the old wide-view packing. Preserve every
 // family/spacing/minimum-count check and add actual full-body HUD clearance.
 for(const id of ['i8-families','g5-silhouettes']){const entry=scenarios.find(s=>s.id===id);if(entry)entry.setup=stageC6Families;}

 const source=scenarios.find(s=>s.id==='g6-kiting');
 scenarios.push({...source,id:'c6-kiting',setup:new Function('room',`return (async()=>{
  await (${source.setup.toString()})(room);
  const d=window.__containmentDebug;d.measureLuminance=true;d.refresh();
 })();`)});
 scenarios.push({id:'c6-silhouettes',rooms:true,state:'playing',burst:true,stepMs:66,setup:stageC6Families});
 scenarios.push({id:'c6-frozen-silhouettes',rooms:true,state:'playing',burst:true,stepMs:66,setup:new Function('room',`return (async()=>{
  await (${stageC6Families.toString()})(room);
  const d=window.__containmentDebug;
  for(const model of d.renderer.actors.values()){
   const apply=model.setAffliction;model.setAffliction=status=>apply({...status,chilled:true,frozen:true,burning:false});
  }
  d.g5Proof={presentationOnly:true,silhouette:true,frozenFamilyPalette:true,noSimulationStatusOverride:true};d.refresh();
 })();`)});
}
