/**
 * K11 creature art fixtures: legal native spawns, frozen simulation clocks.
 * `k11-calm-<family>:<room>` places one ordinary, one elite and (Brute/Carrier)
 * one champion beside the marine. `k11-crowd-<family>:<room>` packs twenty of one
 * family (three elites, a champion for Brute/Carrier) on visible legal floor.
 * Art evidence only: never balance, collision or performance evidence.
 */
export function registerK11Scenarios(scenarios) {
  for (const family of ['crawler', 'stalker', 'spitter', 'brute', 'carrier']) {
    for (const crowd of [false, true]) {
      scenarios.push({
        id: `k11-${crowd ? 'crowd' : 'calm'}-${family}`,
        rooms: true,
        state: 'playing',
        diagnosticOnly: true,
        setup: new Function('room', `return (async()=>{
          const family='${family}',crowd=${crowd};
          const d=window.__containmentDebug,g=d.game,r=d.renderer;
          await d.gotoRoom(room,{rig:'breacher'});d.invulnerable(true);g.enemies.reset();
          d.setInput({x:0,y:0,fire:false,angle:0,autoAim:false});
          const radius=({crawler:14,brute:28,spitter:18,stalker:17,carrier:24})[family];
          const want=crowd?20:(family==='brute'||family==='carrier'?3:2);
          const spacing=radius*2+14,row=spacing*Math.sqrt(3)/2,bounds=g.geometry.bounds,centers=[];
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
          for(const center of lanes){
            Object.assign(g.player,{x:center.x,y:center.y,vx:0,vy:0,angle:0});g.setAimPoint?.({x:center.x+200,y:center.y});d.settlePresentation(48);
            for(let layout=0;layout<16;layout++){
              const points=[];
              for(let iy=-8;iy<=8;iy++)for(let ix=-8;ix<=8;ix++){
                const u=(ix+(iy&1)*.5+(layout&3)*.25)*spacing,v=(iy+((layout>>2)&3)*.25)*row;
                const x=center.x+u+(crowd?0:radius+70),y=center.y+v,distance=Math.hypot(x-center.x-(crowd?40:0),y-center.y);
                if(Math.hypot(x-center.x,y-center.y)<radius+70||!d.canStand(x,y,radius)||!r.visible(x,y))continue;
                if(![[-radius,0],[radius,0],[0,-radius],[0,radius]].every(([dx,dy])=>r.visible(x+dx,y+dy)))continue;
                points.push({x,y,distance});
              }
              points.sort((a,b)=>a.distance-b.distance||a.y-b.y||a.x-b.x);
              const packed=[];for(const p of points){if(packed.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>=spacing-1))packed.push(p);if(packed.length===want)break;}
              const score=packed.length*100000-packed.reduce((s,p)=>s+p.distance,0);
              if(!choice||score>choice.score)choice={center,points:packed,score};
            }
            if(choice?.points.length===want)break;
          }
          if(!choice||choice.points.length<want)throw Error('K11 insufficient legal visible floor: '+(choice?.points.length??0)+'/'+want);
          Object.assign(g.player,{x:choice.center.x,y:choice.center.y,vx:0,vy:0,angle:0});g.setAimPoint?.({x:choice.center.x+200,y:choice.center.y});d.settlePresentation(72);
          const champion=family==='brute'?'warden':family==='carrier'?'matron':undefined;
          const actors=[];
          choice.points.forEach((p,i)=>{
            const rank=crowd?(i<2&&champion?'champion':i<5?'elite':'base'):(i===0?'base':i===1?'elite':'champion');
            const id=d.spawn(family,p.x,p.y,rank!=='base');if(!id)return;
            if(rank==='champion'&&champion)g.enemies.promote(id,champion);
            actors.push({id,rank,x:p.x,y:p.y});
          });
          d.step(0);d.settlePresentation(90);d.refresh();
          d.g5Proof={presentationOnly:true,k11:true,family,crowd,room,requested:want,spawned:actors.length,actors};
        })();`),
      });
    }
  }
}
