/** Capture-only deformed bounds. Root collision cylinders do not enclose long
 * presentation lunges; measuring vertices keeps native strip crops honest. */
function installDeformedBounds(){
  const d=window.__containmentDebug,r=d.renderer,proof=d.g5Proof;
  const ids=proof.actors?.map(a=>a.id)??[proof.enemyId];
  const models=[{id:'marine',model:r.player},...ids.filter(id=>Number.isInteger(id)).map(id=>({id,model:r.actors.get(id)}))];
  const point=r.player.root.position.clone(),bounds={};
  for(const owner of models)bounds[owner.id]={left:0,top:0,right:0,bottom:0};
  Object.defineProperty(proof,'deformedBounds',{enumerable:true,get(){
    for(const owner of models){
      const b=bounds[owner.id],root=owner.model?.root;
      b.left=b.top=Infinity;b.right=b.bottom=-Infinity;
      if(!root)continue;root.updateWorldMatrix(true,true);
      root.traverseVisible(o=>{
        if(!o.isMesh||!o.geometry?.attributes.position)return;
        if(o.isSkinnedMesh)o.skeleton.update();
        for(let i=0;i<o.geometry.attributes.position.count;i++){
          o.getVertexPosition(i,point);point.applyMatrix4(o.matrixWorld).project(r.camera);
          const x=(point.x+1)*innerWidth*.5,y=(1-point.y)*innerHeight*.5;
          b.left=Math.min(b.left,x);b.right=Math.max(b.right,x);b.top=Math.min(b.top,y);b.bottom=Math.max(b.bottom,y);
        }
      });
    }
    return bounds;
  }});
}

/** Real-room melee clocks: normal simulation earns each warning/strike/recovery. */
export function registerM10Scenarios(scenarios) {
  for(const family of ['crawler','stalker','brute','spitter','carrier'])scenarios.push({
    id:`m10-melee-${family}`,room:'awakening-bay',state:'playing',burst:true,stepMs:50,
    setup:new Function(`return (async()=>{
      const d=window.__containmentDebug,g=d.game,r=d.renderer;
      await d.gotoRoom('awakening-bay',{rig:'breacher'});d.invulnerable(true);g.enemies.reset();
      const bounds=g.geometry.bounds,points=[];
      for(let y=bounds.y+140;y<bounds.y+bounds.height-140;y+=32)for(let x=bounds.x+140;x<bounds.x+bounds.width-140;x+=32){
        if(d.canStand(x,y,125)&&d.canStand(x+58,y,32)&&d.clearShot(x+58,y,{x,y}))points.push({x,y,score:Math.hypot(x-bounds.x-bounds.width*.5,y-bounds.y-bounds.height*.5)});
      }
      points.sort((a,b)=>a.score-b.score);if(!points.length)throw Error('M10 native melee lane unavailable');
      const p=points[0];Object.assign(g.player,{x:p.x,y:p.y,vx:0,vy:0,angle:0});d.setInput({x:0,y:0,fire:false,angle:0,autoAim:false});
      d.step(1000);g.enemies.reset();d.settlePresentation(120);
      const spacing='${family}'==='brute'?64:'${family}'==='carrier'?56:48;const id=d.spawn('${family}',p.x+spacing,p.y,false);if(!id)throw Error('M10 native spawn rejected');
      // The ranged Spitter retreats; close the last gap with ordinary walking.
      if('${family}'==='spitter'){d.setInput({x:1,y:0,fire:false,angle:0,autoAim:false});d.step(120);d.setInput({x:0,y:0,fire:false,angle:0,autoAim:false});}
      let e;for(let n=0;n<180;n++){d.step(1000/60);e=g.enemies.getSnapshot(id);if(e?.meleePhase==='windup')break;}
      if(e?.meleePhase!=='windup')throw Error('M10 native windup never started');
      d.g5Proof={presentationOnly:false,stagedNativeEncounter:true,invulnerable:true,enemyId:id,family:'${family}'};
      Object.defineProperty(d.g5Proof,'warningTimeline',{enumerable:true,get(){const e=g.enemies.getSnapshot(id),footprints=[];r.effects.forEachHostilePriority(s=>footprints.push({...s}));return {phase:e?.meleePhase,progress:e?.meleeProgress,angle:e?.meleeAngle,originX:e?.meleeOriginX,originY:e?.meleeOriginY,shape:e?.meleeShape,locked:e?.meleeFacingLocked,remainingMs:e?.meleeRemainingMs,elapsed:g.elapsed,footprints};}});
      d.refresh();
    })();`),
  });
  scenarios.push({
    id:'m10-melee-crowd',room:'communal-atrium',state:'playing',diagnosticOnly:true,burst:true,stepMs:50,
    setup:async()=>{
      const d=window.__containmentDebug,g=d.game,r=d.renderer;
      await d.gotoRoom('communal-atrium',{rig:'breacher'});d.invulnerable(true);g.enemies.reset();
      d.setInput({x:0,y:0,fire:false,angle:0,autoAim:false});
      const bounds=g.geometry.bounds,centers=[];
      for(let y=bounds.y+100;y<bounds.y+bounds.height-100;y+=64)for(let x=bounds.x+100;x<bounds.x+bounds.width-100;x+=64){
        if(!d.canStand(x,y,g.player.radius))continue;
        let floor=0;for(let i=0;i<24;i++)for(const radius of [80,140,200]){
          const angle=i*Math.PI/12,px=x+Math.cos(angle)*radius,py=y+Math.sin(angle)*radius;
          if(d.canStand(px,py,28)&&d.clearShot(px,py,{x,y}))floor++;
        }
        centers.push({x,y,score:floor-Math.hypot(x-bounds.x-bounds.width*.5,y-bounds.y-bounds.height*.5)/1000});
      }
      centers.sort((a,b)=>b.score-a.score);
      const lanes=[];for(const center of centers){if(lanes.every(p=>Math.hypot(p.x-center.x,p.y-center.y)>=96))lanes.push(center);if(lanes.length===12)break;}
      // Pack actual walkable, native HUD-visible floor. Presentation settling
      // moves only the ordinary follow camera; encounter clocks remain frozen.
      const spacing=58.01,row=spacing*Math.sqrt(3)/2;let choice=null;
      for(const center of lanes){
        Object.assign(g.player,{x:center.x,y:center.y,vx:0,vy:0,angle:0});d.settlePresentation(48);
        for(let layout=0;layout<32;layout++){
          const points=[];
          for(let iy=-7;iy<=7;iy++)for(let ix=-7;ix<=7;ix++){
            const u=(ix+(iy&1)*.5+(layout&3)*.25)*spacing,v=(iy+((layout>>2)&3)*.25)*row;
            const x=center.x+(layout<16?u:v),y=center.y+(layout<16?v:u),distance=Math.hypot(x-center.x,y-center.y);
            if(distance<62||distance>320||!d.canStand(x,y,28)||!d.clearShot(x,y)||!r.visible(x,y))continue;
            if(![[-28,0],[28,0],[0,-28],[0,28]].every(([dx,dy])=>r.visible(x+dx,y+dy)))continue;
            points.push({x,y,distance});
          }
          points.sort((a,b)=>a.distance-b.distance||a.y-b.y||a.x-b.x);
          const packed=points.slice(0,20),score=packed.length*100000-packed.reduce((sum,p)=>sum+p.distance,0);
          if(!choice||score>choice.score)choice={center,points:packed,score};
        }
        if(choice?.points.length===20)break;
      }
      if(!choice||choice.points.length<20)throw Error('M10 crowd has insufficient legal visible floor');
      Object.assign(g.player,{x:choice.center.x,y:choice.center.y,vx:0,vy:0,angle:0});d.settlePresentation(72);
      const families=['crawler','crawler','crawler','crawler','crawler','crawler','crawler','crawler','crawler','crawler','brute','stalker','spitter','carrier','brute','stalker','spitter','carrier','brute','stalker'];
      const actors=choice.points.map((p,i)=>({id:d.spawn(families[i],p.x,p.y,false),family:families[i]}));
      const started=g.elapsed;
      // A real approach earns the first crawler warning. No forced phase,
      // timer, health, speed or damage edits are used to synchronize the crowd.
      for(let frame=0;frame<36;frame++){
        d.step(1000/60);
        if(actors.some(a=>a.family==='crawler'&&g.enemies.getSnapshot(a.id)?.meleePhase==='windup'))break;
      }
      d.g5Proof={presentationOnly:false,stagedNativeEncounter:true,invulnerable:true,requestedEnemies:20,requestedFamilies:{crawler:10,brute:3,stalker:3,spitter:2,carrier:2},nativeApproachMs:(g.elapsed-started)*1000,actors};
      Object.defineProperty(d.g5Proof,'crowd',{enumerable:true,get(){
        const enemies=g.enemies.snapshot.enemies,families={},windups={},phases={};
        for(const e of enemies){families[e.type]=(families[e.type]??0)+1;phases[e.meleePhase]=(phases[e.meleePhase]??0)+1;if(e.meleePhase==='windup')windups[e.type]=(windups[e.type]??0)+1;}
        return {elapsed:g.elapsed,total:enemies.length,visible:enemies.filter(e=>r.visible(e.x,e.y)).length,families,windups,phases};
      }});
      d.refresh();
    },
  });
}

/** C10 repeats the native lane on the contrast extremes; clutter is a labelled
 * presentation replay over native melee clocks, never collision or damage data. */
export function registerC10Scenarios(scenarios) {
  const crowd=scenarios.find(s=>s.id==='m10-melee-crowd');
  scenarios.push({...crowd,id:'c10-melee-swarm',setup:new Function('return ('+crowd.setup.toString().replace(/const families=\[[^;]+;/,"const families=Array(20).fill('crawler');").replace('requestedFamilies:{crawler:10,brute:3,stalker:3,spitter:2,carrier:2}','requestedFamilies:{crawler:20}')+')()')});
  // FEEL12: repeat each native family lane on both contrast extremes. These
  // aliases retain ordinary simulation phase clocks and the original proof.
  for(const family of ['crawler','stalker','brute','spitter','carrier'])for(const room of ['crew-checkpoint','relay-racks']){
    const base=scenarios.find(s=>s.id===`m10-melee-${family}`);
    scenarios.push({...base,id:`feel12-melee-${family}-${room}`,room,diagnosticOnly:true,
      setup:new Function(`return (async()=>{await (${base.setup.toString().replaceAll('awakening-bay',room)})();(${installDeformedBounds.toString()})();})();`)});
  }
  const nativeCrowd=scenarios.find(s=>s.id==='m10-melee-crowd');
  scenarios.push({...nativeCrowd,id:'feel12-melee-crowd',
    setup:new Function(`return (async()=>{await (${nativeCrowd.setup.toString()})();(${installDeformedBounds.toString()})();})();`)});
  const nativeSwarm=scenarios.find(s=>s.id==='c10-melee-swarm');
  scenarios.push({...nativeSwarm,id:'feel12-melee-swarm',
    setup:new Function(`return (async()=>{await (${nativeSwarm.setup.toString()})();(${installDeformedBounds.toString()})();})();`)});
  // Incoming-side markers are presentation replays, clearly separate from the
  // invulnerable native-warning fixture's damage acceptance.
  for(const [side,dx,dy] of [['east',100,0],['south',0,100],['west',-100,0],['north',0,-100]]){
    const base=scenarios.find(s=>s.id==='feel12-melee-crawler-crew-checkpoint');
    scenarios.push({...base,id:`feel12-hit-${side}`,frameCount:8,
      setup:new Function(`return (async()=>{await (${base.setup.toString()})();
       const d=window.__containmentDebug,p=d.game.player;
       d.renderer.effect({type:'hurt',x:p.x,y:p.y,sourceX:p.x+${dx},sourceY:p.y+${dy}});
       d.g5Proof.incomingSidePresentationReplay='${side}';d.refresh();
      })();`)});
  }
  for(const id of ['feel12-melee-crawler-relay-racks','feel12-hit-east']){
    const base=scenarios.find(s=>s.id===id);
    scenarios.push({...base,id:id+'-reduced',reducedMotion:true});
  }
  for(const room of ['crew-checkpoint','relay-racks']) {
    const base=scenarios.find(s=>s.id==='m10-melee-crawler');
    scenarios.push({...base,id:`c10-melee-${room}`,room,setup:new Function(`return (async()=>{
      const setup=${base.setup.toString().replaceAll('awakening-bay',room)};
      await setup();
      const d=window.__containmentDebug,g=d.game,r=d.renderer,p=g.player;
      // Replay corpse and friendly arc/white feedback through production owners.
      // The hostile Crawler and its phase/shape remain entirely native.
      r.effect({type:'corpse',id:900001,family:'crawler',x:p.x+12,y:p.y+20,vx:0,vy:0});
      r.effect({type:'ability',x:p.x,y:p.y,ability:{ability:'overload',rig:'arc',slot:'tactical',phase:'impact',x:p.x,y:p.y,radius:100,durationMs:500}});
      r.effect({type:'ability',x:p.x-25,y:p.y+15,ability:{ability:'overload',rig:'arc',slot:'tactical',phase:'link',targetX:p.x+60,targetY:p.y-20}});
      d.g5Proof.clutterPresentationReplay=true;d.refresh();
    })();`)});
  }
}
