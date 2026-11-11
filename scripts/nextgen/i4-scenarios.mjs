/** Integration-only evidence for native breach scheduling and an authored exit. */
export const I4_SCENARIOS=[{
 id:'i4-boss-beat-fixture',state:'playing',room:'reactor-vault',required:['#presentation-beat:not([hidden])','#boss-hud'],
 setup:async()=>{const d=window.__containmentDebug;await d.gotoRoom('reactor-vault',{version:2});d.invulnerable(true);d.step(600);d.uiFixture({preferences:{radar:true,combatText:true}});d.presentation(true);d.presentationEvent({type:'beat',kind:'boss-intro'});d.i4Proof={kind:'explicit-boss-intro-presentation-over-native-queen'};d.refresh();},
},{
 id:'i4-breach',state:'playing',room:'awakening-bay',burst:true,
 setup:async()=>{
  const d=window.__containmentDebug,g=d.game;await d.gotoRoom('awakening-bay');d.invulnerable(true);
  for(let i=0;i<120&&!g.pending.length;i++)d.step(1000/60);
  const pending=g.pending[0];if(!pending||!d.events.some(e=>e.type==='enemy-warning'))throw Error('Native breach warning absent');
  let placed=false;
  for(let k=0;k<16;k++){const a=k*Math.PI/8,x=pending.x+Math.cos(a)*170,y=pending.y+Math.sin(a)*170;if(!d.canStand(x,y,16))continue;Object.assign(g.player,{x,y,vx:0,vy:0,angle:Math.atan2(pending.y-y,pending.x-x)});placed=true;break;}
  if(!placed)throw Error('No legal breach observation point');
  d.setInput({x:0,y:0,fire:false,angle:g.player.angle,autoAim:false});
  const settle=Math.min(250,Math.max(0,pending.delay*.25));d.step(settle);
  const delay=Math.max(0,pending.delay),samples=[0,delay*.5,Math.max(0,delay-20),delay+30,delay+100,delay+180,delay+300];
  const step=d.step;let sample=0,elapsed=0;
  d.step=ms=>{if(ms!==150)return step(ms);const t=samples[Math.min(++sample,samples.length-1)];step(Math.max(0,t-elapsed));elapsed=t;};
  d.i4Proof={kind:'native-breach',nativeWarning:true,spawnPoint:{x:pending.x,y:pending.y},pendingAtStart:g.pending.length,delayMs:delay,settleMs:settle};d.refresh();
 },
},{
 id:'i4-exit-standby',state:'playing',room:'awakening-bay',
 setup:async()=>{
  const d=window.__containmentDebug,g=d.game;await d.gotoRoom('awakening-bay');d.invulnerable(true);
  const target=g.geometry.exitPoint;let placed=false;
  for(let k=0;k<16;k++){const a=k*Math.PI/8,x=target.x+Math.cos(a)*160,y=target.y+Math.sin(a)*160;if(!d.canStand(x,y,16)||!d.clearShot(target.x,target.y,{x,y}))continue;Object.assign(g.player,{x,y,vx:0,vy:0,angle:Math.atan2(target.y-y,target.x-x)});placed=true;break;}
  if(!placed)throw Error('No legal exit observation point');d.setInput({x:0,y:0,fire:false,angle:g.player.angle,autoAim:false});d.step(1000);
  d.i4Proof={kind:'authored-exit-standby',exit:{...target},visible:d.renderer.visible(target.x,target.y)};if(!d.i4Proof.visible)throw Error('Authored exit is outside native framing');d.refresh();
 },
}];
