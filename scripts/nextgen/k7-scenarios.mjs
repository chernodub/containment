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

}
