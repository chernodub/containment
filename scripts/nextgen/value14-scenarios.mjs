/** Paired art review on the existing native melee and crowd fixtures. */
export function registerValue14Scenarios(scenarios) {
  const crowd = scenarios.find(scenario => scenario.id === 'm10-melee-crowd');
  for (const room of ['relay-racks', 'swarm-junction', 'crew-checkpoint', 'transmission-chamber', 'coolant-plant']) {
    scenarios.push({
      ...crowd, id: `value14-crowd-${room}`,
      setup: new Function(`return (${crowd.setup.toString().replace("'communal-atrium'", JSON.stringify(room))})();`),
      room,
    });
    if(room==='swarm-junction'){
      const setup=crowd.setup.toString().replace("'communal-atrium'",JSON.stringify(room));
      for(const variant of ['rest','burning','chilled','frozen','shocked']){
        const staged=setup.replace('frame<36','frame<0').replace('d.refresh();',`
          for(const model of r.actors.values()){
            const apply=model.setAffliction;
            if(apply && '${variant}'!=='rest')model.setAffliction=s=>apply({...s,['${variant}']:true});
          }
          d.settlePresentation(40);
          d.refresh();`);
        scenarios.push({...crowd,id:`brood43-crowd-${variant}`,room,burst:false,
          setup:new Function(`return (${staged})();`)});
      }
    }
    for (const family of ['crawler', 'stalker', 'spitter', 'brute', 'carrier']) {
      const melee = scenarios.find(scenario => scenario.id === `m10-melee-${family}`);
      const setup = melee.setup.toString().replaceAll('awakening-bay', room);
      const recoveryStudy=family==='stalker'&&room==='crew-checkpoint';
      const attack=recoveryStudy?setup.replace('d.refresh();',`
      for(let i=0;i<30&&!g.enemies.getSnapshot(id)?.meleeFacingLocked;i++)d.step(1000/60);
      d.setInput({x:0,y:1,fire:false,angle:0,autoAim:false});
      d.refresh();`):setup;
      scenarios.push({...melee, id: `value14-${family}-attack-${room}`, room, diagnosticOnly: true,
        ...(recoveryStudy?{frameCount:14}:{}),
        setup: new Function(`return (${attack})();`)});
      const calm = setup.replace(/\/\/ The ranged Spitter.*?(?=d\.g5Proof=)/s, '');
      scenarios.push({...melee, id: `value14-${family}-calm-${room}`, room, diagnosticOnly: true, burst: false,
        setup: new Function(`return (${calm})();`)});
    }
  }
  for (const rig of ['breacher', 'cryo', 'pyro', 'arc']) {
    const setup = crowd.setup.toString().replace("'breacher'", JSON.stringify(rig)).replace(
      'd.refresh();',
      `g.setAimPoint({x:g.player.x+64,y:g.player.y});
      g.useAbility('tactical');
      ${rig === 'pyro' ? "g.useAbility('power');" : ''}
      d.refresh();`,
    );
    scenarios.push({...crowd, id: `value14-overlap-${rig}`, frameCount: 8,
      setup: new Function(`return (${setup})();`)});
  }
}
