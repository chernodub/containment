/** Additive arena floor receipts; preserve all original native setup/actions/assertions. */
export function registerI10Scenarios(scenarios){
  if(scenarios.some(scenario=>scenario.id==='i10-arena-calm-motion'))return;
  const calm=scenarios.find(scenario=>scenario.id==='combat-calm');
  const boss=scenarios.find(scenario=>scenario.id==='boss');
  if(!calm||!boss)throw Error('I10 arena evidence requires the original calm and boss scenarios');
  scenarios.push({
    ...calm,id:'i10-arena-calm-motion',rooms:false,room:'reactor-vault',burst:true,stepMs:150,
    setup:new Function(`return (async()=>{
      await (${calm.setup.toString()})('reactor-vault');
      const d=window.__containmentDebug;d.measureLuminance=true;d.refresh();
    })();`),
  });
  // Serialize the existing function directly: none of its legal-placement,
  // native firing, phase, weapon or readiness behavior is replaced.
  boss.setup=new Function(`return (async()=>{
    await (${boss.setup.toString()})();
    const d=window.__containmentDebug;d.measureLuminance=true;d.refresh();
  })();`);
}
