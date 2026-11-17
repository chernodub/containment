/**
 * K11 creature art fixtures: legal native spawns, frozen simulation clocks.
 * `k11-calm-<family>:<room>` places one ordinary, one elite and (Brute/Carrier)
 * one champion beside the marine. `k11-crowd-<family>:<room>` packs twenty of one
 * family (three elites, a champion for Brute/Carrier) on visible legal floor.
 * Art evidence only: never balance, collision or performance evidence.
 */
export function registerK11Scenarios(scenarios) {
  for (const family of ['crawler', 'stalker', 'spitter', 'brute', 'carrier']) {
    for (const forcedRank of ['mixed', 'base', 'elite', ...(['brute','carrier'].includes(family)?['boss']:[])]) {
    for (const crowd of [false, true]) {
      scenarios.push({
        id: forcedRank==='mixed'?`k11-${crowd ? 'crowd' : 'calm'}-${family}`:`i11b-${crowd ? 'crowd' : 'calm'}-${family}-${forcedRank}`,
        rooms: true,
        state: 'playing',
        diagnosticOnly: true,
        i11NativePointer: forcedRank!=='mixed',
        setup: new Function('room', `return (async()=>{
          const family='${family}',crowd=${crowd},forcedRank='${forcedRank}';
          const d=window.__containmentDebug,g=d.game,r=d.renderer;
          d.i11NativePointer={x:innerWidth/2,y:innerHeight/2};
          await d.gotoRoom(room,{rig:'breacher'});d.invulnerable(true);g.enemies.reset();
          d.setInput({x:0,y:0,fire:false,angle:0,autoAim:false});
          const radius=({crawler:14,brute:28,spitter:18,stalker:17,carrier:24})[family];
          const want=crowd?20:forcedRank!=='mixed'?1:(family==='brute'||family==='carrier'?3:2);
          let captureHeight=0;
          if(crowd&&forcedRank!=='mixed'&&(family==='brute'||family==='carrier')){
            const study=r.actorPool.take(family,forcedRank!=='base');study.reset?.();
            study.setThreat?.(0,null,forcedRank==='boss'?(family==='brute'?'warden':'matron'):undefined,1);
            for(let tick=0;tick<90;tick++)study.animate(tick/60,0,0);study.root.updateMatrixWorld(true);
            const vertex=study.root.position.clone();
            study.root.traverseVisible(object=>{if(!object.isSkinnedMesh)return;const positions=object.geometry.getAttribute('position');for(let i=0;i<positions.count;i++){object.getVertexPosition(i,vertex).applyMatrix4(object.matrixWorld);captureHeight=Math.max(captureHeight,vertex.y-study.root.position.y);}});
            captureHeight+=.08;r.actorPool.release(study);
          }
          const projection=r.player.root.position.clone();
          const fullBodyVisible=(x,y)=>{
            for(const h of [0,captureHeight])for(let i=0;i<8;i++){
              const angle=i*Math.PI/4;projection.set((x+Math.cos(angle)*radius)/32,h,(y+Math.sin(angle)*radius)/32).project(r.camera);
              if(projection.z < -1||projection.z > 1||Math.abs(projection.x)>.98||Math.abs(projection.y)>.98)return false;
            }
            return true;
          };
          const bounds=g.geometry.bounds,centers=[];
          const playerClearance=crowd&&forcedRank!=='mixed'?radius+g.player.radius+14:radius+70;
          for(let y=bounds.y+90;y<bounds.y+bounds.height-90;y+=48)for(let x=bounds.x+90;x<bounds.x+bounds.width-90;x+=48){
            if(!d.canStand(x,y,g.player.radius))continue;
            let floor=0;for(let i=0;i<16;i++)for(const ring of [90,160,240]){
              const a=i*Math.PI/8;if(d.canStand(x+Math.cos(a)*ring,y+Math.sin(a)*ring,radius))floor++;
            }
            centers.push({x,y,score:floor-Math.hypot(x-bounds.x-bounds.width*.5,y-bounds.y-bounds.height*.5)/1000});
          }
          centers.sort((a,b)=>b.score-a.score);
          const lanes=[];for(const c of centers){if(lanes.every(p=>Math.hypot(p.x-c.x,p.y-c.y)>=96))lanes.push(c);if(lanes.length===10)break;}
          let choice=null;
          for(const gap of crowd&&forcedRank!=='mixed'?[2,.05]:[14]){
          const spacing=radius*2+gap,row=spacing*Math.sqrt(3)/2;
          for(const center of lanes){
            Object.assign(g.player,{x:center.x,y:center.y,vx:0,vy:0,angle:0});g.setAimPoint?.({x:center.x+200,y:center.y});d.settlePresentation(48);
            for(let layout=0;layout<(forcedRank==='mixed'?16:32);layout++){
              const points=[];
              for(let iy=-8;iy<=8;iy++)for(let ix=-8;ix<=8;ix++){
                const u=(ix+(iy&1)*.5+(layout&3)*.25)*spacing,v=(iy+((layout>>2)&3)*.25)*row;
                const x=center.x+(layout<16?u:v)+(crowd?0:radius+70),y=center.y+(layout<16?v:u),distance=Math.hypot(x-center.x-(crowd?40:0),y-center.y);
                if(Math.hypot(x-center.x,y-center.y)<playerClearance||!d.canStand(x,y,radius)||!r.visible(x,y)||(captureHeight>0&&!fullBodyVisible(x,y)))continue;
                if(![[-radius,0],[radius,0],[0,-radius],[0,radius]].every(([dx,dy])=>r.visible(x+dx,y+dy)))continue;
                points.push({x,y,distance});
              }
              points.sort((a,b)=>a.distance-b.distance||a.y-b.y||a.x-b.x);
              const packed=[];for(const p of points){if(packed.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>=spacing-1))packed.push(p);if(packed.length===want)break;}
              const score=packed.length*100000-packed.reduce((s,p)=>s+p.distance,0);
              if(!choice||score>choice.score)choice={center,points:packed,score,spacing};
            }
            if(choice?.points.length===want)break;
          }
          if(choice?.points.length===want)break;
          }
          if(!choice||choice.points.length<(forcedRank==='mixed'?Math.min(want,10):want))throw Error('K11 insufficient legal visible floor: '+(choice?.points.length??0)+'/'+want);
          Object.assign(g.player,{x:choice.center.x,y:choice.center.y,vx:0,vy:0,angle:0});g.setAimPoint?.({x:choice.center.x+200,y:choice.center.y});d.settlePresentation(72);
          const champion=family==='brute'?'warden':family==='carrier'?'matron':undefined;
          const actors=[];
          choice.points.forEach((p,i)=>{
            const rank=forcedRank!=='mixed'?(forcedRank==='boss'?'champion':forcedRank):crowd?(i<2&&champion?'champion':i<5?'elite':'base'):(i===0?'base':i===1?'elite':'champion');
            const id=d.spawn(family,p.x,p.y,rank!=='base');if(!id)return;
            if(rank==='champion'&&champion)g.enemies.promote(id,champion);
            actors.push({id,rank,x:p.x,y:p.y});
          });
          d.step(0);d.settlePresentation(90);if(forcedRank!=='mixed')r.hudScene.visible=false;d.refresh();
          // Native contact framing settles only after actors exist. Repack any
          // edge contacts on legal floor against that settled camera, without
          // changing the camera or hiding actors.
          if(captureHeight>0){
            for(let pass=0;pass<8;pass++){
              r.camera.updateMatrixWorld(true);
              const outside=actors.filter(a=>!fullBodyVisible(a.x,a.y));if(!outside.length)break;
              for(const actor of outside){
                const points=[];
                for(let y=bounds.y+radius;y<bounds.y+bounds.height-radius;y+=8)for(let x=bounds.x+radius;x<bounds.x+bounds.width-radius;x+=8){
                  if(Math.hypot(x-g.player.x,y-g.player.y)<playerClearance||!d.canStand(x,y,radius)||!fullBodyVisible(x,y))continue;
                  if(actors.some(a=>a!==actor&&Math.hypot(a.x-x,a.y-y)<radius*2+.01))continue;
                  points.push({x,y,distance:Math.hypot(x-actor.x,y-actor.y)});
                }
                points.sort((a,b)=>a.distance-b.distance);const point=points[0];
                if(point){g.enemies.remove(actor.id);const id=d.spawn(family,point.x,point.y,actor.rank!=='base');if(actor.rank==='champion'&&champion)g.enemies.promote(id,champion);Object.assign(actor,{id,x:point.x,y:point.y});}
              }
              d.step(0);d.settlePresentation(120);r.hudScene.visible=false;d.refresh();
            }
          }
          d.g5Proof={presentationOnly:true,k11:true,family,crowd,rank:forcedRank,captureHeight,edgeContacts:captureHeight>0?actors.filter(a=>!fullBodyVisible(a.x,a.y)).map(a=>a.id):[],spacing:choice.spacing,playerClearance,withoutUI:forcedRank!=='mixed',room,requested:want,spawned:actors.length,actors};
        })();`),
      });
    }
    }
  }
  // Reuse native melee staging and phase clocks; only select the requested rank.
  for(const family of ['crawler','stalker','spitter','brute','carrier']) {
    const source=scenarios.find(s=>s.id===`m10-melee-${family}`);
    if(!source)continue;
    for(const rank of ['base','elite',...(['brute','carrier'].includes(family)?['boss']:[])]) {
      const text=source.setup.toString();
      let body=text.slice(text.indexOf('{')+1,text.lastIndexOf('}'));
      if(rank!=='base')body=body.replace('p.x+spacing,p.y,false','p.x+spacing,p.y,true');
      if(rank==='boss')body=body.replace('// The ranged Spitter',`g.enemies.promote(id,'${family==='brute'?'warden':'matron'}');\n      // The ranged Spitter`);
      body=body.replace('d.g5Proof={',`r.setColliderDebug(true);\n      d.g5Proof={`);
      scenarios.push({...source,id:`i11b-strike-${family}-${rank}`,diagnosticOnly:true,setup:new Function(body)});
    }
  }

}
