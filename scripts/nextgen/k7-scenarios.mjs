/** K7 standard uses the existing legal three-actor fixture and production camera. */
export function registerK7Scenarios(scenarios) {
  const standard = scenarios.find(s => s.id === 'g5-standard');
  for (const rig of ['breacher', 'cryo', 'pyro', 'arc']) {
    const source = standard.setup.toString().replace("rig:'cryo'", `rig:'${rig}'`);
    scenarios.push({
      ...standard,
      id: `k7-standard-${rig}`,
      setup: new Function('room', `return (async()=>{
        await (${source})(room);
        const d=window.__containmentDebug;
        d.g5Proof.silhouette=true;
        d.g5Proof.reviewRig='${rig}';
        d.refresh();
      })();`),
    });
  }
  const route = scenarios.find(s => s.id === 'k7-standard-breacher');
  scenarios.push({...route,id:'k7-route-a',setup:new Function('room',`return (async()=>{
    await (${route.setup.toString()})(room);
    const d=window.__containmentDebug;
    const before=d.renderer.scene.onBeforeRender;
    d.renderer.scene.onBeforeRender=function(...args){
      before.apply(this,args);
      for(const model of d.renderer.actors.values())if(model.root.name==='alien-brute'){
        const ornament=model.root.getObjectByName('brute-identity');ornament.visible=false;
      }
    };
    d.g5Proof.route='CC0 Quaternius Alien, retained animation clips, no procedural anatomy';
    d.refresh();
  })();`)});
  for(const [id,base] of [['k7-queen-armored-study','boss'],['k7-queen-exposed-study','g2-queen-exposed']]){
    const source=scenarios.find(s=>s.id===base);
    scenarios.push({...source,id,setup:new Function(`return (async()=>{
      await (${source.setup.toString()})();
      const d=window.__containmentDebug,before=d.renderer.scene.onBeforeRender;
      d.renderer.scene.onBeforeRender=function(...args){before.apply(this,args);const q=d.renderer.queen;if(q){const m=q.root.getObjectByName('queen-identity');m.material.uniforms.identityStudy.value=1;q.root.traverse(o=>{if(o.isSkinnedMesh&&o.material.isMeshStandardMaterial)o.visible=false;});}};
      d.g5Proof={presentationOnly:true,silhouette:true,flatQueenValueStudy:true};d.refresh();
    })();`)});
  }

  const families=scenarios.find(s=>s.id==='c6-silhouettes');
  for(const status of ['frozen','burning'])scenarios.push({...families,id:`k7-${status}-families`,setup:new Function('room',`return (async()=>{
    await (${families.setup.toString()})(room);
    const d=window.__containmentDebug,wrap=model=>{if(model.root.userData.k7StatusWrapped)return;model.root.userData.k7StatusWrapped=true;const apply=model.setAffliction;model.setAffliction=s=>apply({...s,chilled:${status==='frozen'},frozen:${status==='frozen'},burning:${status==='burning'}});};
    for(const m of d.renderer.actors.values())wrap(m);
    const take=d.renderer.actorPool.take;d.renderer.actorPool.take=function(...args){const model=take.apply(this,args);wrap(model);return model;};
    d.g5Proof={presentationOnly:true,silhouette:true,status:'${status}',noSimulationStatusOverride:true};d.refresh();
  })();`)});

  for(const kind of ['brute','spitter'])scenarios.push({id:`k7-windup-${kind}`,room:'awakening-bay',state:'playing',burst:true,stepMs:300,setup:new Function(`return (async()=>{
    const d=window.__containmentDebug,g=d.game,r=d.renderer;
    await d.gotoRoom('awakening-bay',{rig:'breacher'});d.invulnerable(true);g.enemies.reset();
    const b=g.geometry.bounds,pairs=[];
    for(let y=b.y+80;y<b.y+b.height-80;y+=40)for(let x=b.x+80;x<b.x+b.width-80;x+=40){
      if(!d.canStand(x,y,20))continue;
      for(const radius of [320,280,240])for(let n=0;n<16;n++){
        const a=n*Math.PI/8,ex=x+Math.cos(a)*radius,ey=y+Math.sin(a)*radius;
        if(!d.canStand(ex,ey,28)||!d.clearShot(ex,ey,{x,y}))continue;
        pairs.push({x,y,ex,ey,score:Math.hypot(x-b.x-b.width/2,y-b.y-b.height/2)});
      }
    }
    pairs.sort((a,b)=>a.score-b.score);if(!pairs.length)throw Error('K7 native warning lane unavailable');
    const p=pairs[0];Object.assign(g.player,{x:p.x,y:p.y,vx:0,vy:0,angle:Math.atan2(p.ey-p.y,p.ex-p.x)});
    d.setInput({x:0,y:0,fire:false,angle:g.player.angle,autoAim:false});
    const id=d.spawn('${kind}',p.ex,p.ey,${kind==='brute'});if(!id)throw Error('K7 native warning actor rejected');
    let enemy;
    for(let n=0;n<300;n++){d.step(1000/60);enemy=g.enemies.getSnapshot(id);if(enemy?.pendingAttack)break;}
    if(!enemy?.pendingAttack)throw Error('K7 native warning did not occur');
    d.g5Proof={presentationOnly:true,silhouette:true,nativeWarning:true,enemyId:id,initialDurationMs:enemy.windupMs};
    Object.defineProperty(d.g5Proof,'warningTimeline',{enumerable:true,get(){const e=g.enemies.getSnapshot(id),m=r.actors.get(id);return {remainingMs:e?.windupMs??0,pending:e?.pendingAttack??null,progress:m?.root.getObjectByName('${kind}-identity').material.uniforms.identityWindup.value,elapsed:g.elapsed};}});
    d.refresh();
  })();`)});

}
