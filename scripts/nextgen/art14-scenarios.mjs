async function stageLesson(family) {
  const d=window.__containmentDebug,g=d.game;
  await d.gotoRoom('breached-loading-bay',{rig:'cryo'});
  g.enemies.reset();
  const origin={x:g.player.x+60,y:g.player.y};
  const source={source:family==='spitter'?'enemy-projectile':'enemy-contact',enemyFamily:family};
  for(let i=0;i<28&&g.status==='playing';i++){
    g.hurt(90,origin,source);
    if(g.status==='playing')d.step(300);
  }
  d.refresh();
}
export const ART14_SCENARIOS=[
  {id:'art14-route-requisition',diagnosticOnly:true,state:'route',required:['[data-detour="direct"]','[data-detour="salvage"]'],
    setup:async()=>{await window.__containmentDebug.gotoRoom('freight-hold',{phase:'route',rig:'cryo'});}},
  {id:'route-field-workshop',diagnosticOnly:true,state:'route',required:['[data-detour="direct"]','[data-detour="salvage"]'],
    setup:async()=>{await window.__containmentDebug.gotoRoom('diagnostic-gallery',{phase:'route',rig:'cryo'});}},
  ...['crawler','stalker','spitter'].map(family=>({
    id:`art14-results-${family}`,state:'dead',diagnosticOnly:true,required:['#retry-rig','.retry-lesson'],
    setup:stageLesson,setupArgument:family,
  })),
];

// Route and supply art receipts for branches outside the first three junctions.
ART14_SCENARIOS.push(
  {id:'art21-legacy-branch',diagnosticOnly:true,state:'route',setup:async()=>{
    const d=window.__containmentDebug;
    for(const room of ['receiving','forklift-loop','freight-crossing','rail-depot']){
      await d.gotoRoom(room,{version:2,phase:'route'});
      if(d.game.node.next.length>1)return;
    }
  }},
  ...[
    ['warden-cache','infested-workshop','cryo'],
    ['capacitor','containment-annulus','arc'],
    ['meltdown-capacitor','containment-annulus','pyro'],
  ].map(([name,room,rig])=>({
    id:`art21-${name}`,diagnosticOnly:true,state:'route',
    setupArgument:{room,rig},
    setup:async({room,rig})=>{await window.__containmentDebug.gotoRoom(room,{rig,phase:'route',runStructure:true});},
  })),
  {id:'art21-finale-supply',diagnosticOnly:true,state:'reward',phase:'reward',setup:async()=>{
    const d=window.__containmentDebug;
    await d.gotoRoom('manual-control-chamber',{phase:'reward',runStructure:true});
    const resources=d.game.combat.getRunResources();
    d.game.combat.restoreRunResources({...resources,credits:900,health:62,armor:60});
    d.refresh();
  }},
  ...[
    ['breacher',['siege-plow','fault-line']],
    ['cryo',['shard-harvest','ice-road']],
    ['pyro',['ember-relay','meltdown-core']],
    ['arc',['pilgrim-pylon','live-wire']],
  ].flatMap(([rig,augments])=>augments.map(augment=>({
    id:`art21-workshop-${augment}`,diagnosticOnly:true,state:'route',setupArgument:{rig,augment},
    setup:async({rig,augment})=>{
      const d=window.__containmentDebug;
      await d.gotoRoom('diagnostic-gallery',{rig,phase:'route',runStructure:true});
      d.grantBoons([augment]);
      d.game.combat.setCredits(300);
      d.refresh();
    },
  }))),
);
