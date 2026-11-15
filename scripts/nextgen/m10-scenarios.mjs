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
      let e;for(let n=0;n<180;n++){d.step(1000/60);e=g.enemies.getSnapshot(id);if(e?.meleePhase==='windup')break;}
      if(e?.meleePhase!=='windup')throw Error('M10 native windup never started');
      d.g5Proof={presentationOnly:false,stagedNativeEncounter:true,invulnerable:true,enemyId:id,family:'${family}'};
      Object.defineProperty(d.g5Proof,'warningTimeline',{enumerable:true,get(){const e=g.enemies.getSnapshot(id),footprints=[];r.effects.forEachHostilePriority(s=>footprints.push({...s}));return {phase:e?.meleePhase,progress:e?.meleeProgress,angle:e?.meleeAngle,originX:e?.meleeOriginX,originY:e?.meleeOriginY,shape:e?.meleeShape,locked:e?.meleeFacingLocked,remainingMs:e?.meleeRemainingMs,elapsed:g.elapsed,footprints};}});
      d.refresh();
    })();`),
  });
}
