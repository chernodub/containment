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
