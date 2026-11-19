/** Capture-only. Place all five native drops along a legal chord beside the marine. */
async function stage(room, fight) {
  const d=window.__containmentDebug;
  await d.gotoRoom(room);
  d.invulnerable(true);
  const g=d.game,p=g.player;
  if(fight){
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6;
      d.spawn(i%3?'crawler':'spitter',p.x+Math.cos(a)*140,p.y+Math.sin(a)*140);
    }
    d.setInput({fire:true});d.step(300);
  }
  const kinds=['health','armor','ammo','grenade','credits'];
  let points;
  for(const distance of [58,80,104]) {
    for(let i=0;i<16;i++){
      const a=i*Math.PI/8,c=Math.cos(a),s=Math.sin(a);
      const row=kinds.map((_,j)=>({x:p.x+c*distance-s*(j-2)*33,y:p.y+s*distance+c*(j-2)*33}));
      if(row.every(q=>d.canStand(q.x,q.y,12))){points=row;break;}
    }
    if(points)break;
  }
  if(!points)throw Error('No legal pickup row');
  for(const [i,q] of points.entries())g.pickups.spawn(kinds[i],20,q.x,q.y);
  d.refresh();
}
export const propScenarios=[false,true].map(fight=>({
  id:'props14-'+(fight?'fight':'floor'),rooms:true,state:'playing',diagnosticOnly:true,
  setup:new Function('room',`return (${stage.toString()})(room,${fight})`),
}));

propScenarios.push({
  id:'props14-lineup',room:'crew-checkpoint',state:'playing',diagnosticOnly:true,
  setup:async()=>{
    const d=window.__containmentDebug;
    await d.gotoRoom('crew-checkpoint');await d.prepare();
    const pool=d.renderer.pickupInstances;
    const names=['health','medkit','armor','ammo','grenade','credits','cache-closed','cache-open','reroll','upgrade','resuscitator','overdrive'];
    const p=d.game.player;
    for(const [i,name] of names.entries()){
      const body=pool.root.getObjectByName('pickup-health-0').clone();
      const source=pool.templates.getObjectByName(name);
      body.geometry=source.geometry;body.material=source.material;
      const matrix=body.matrix.clone().makeScale(.86,.86,.86);
      matrix.setPosition(p.x/32+1.9+(i%4)*1.65,.08,p.y/32-1.65+Math.floor(i/4)*1.65);
      body.setMatrixAt(0,matrix);body.count=1;body.visible=true;
      d.renderer.world.add(body);
    }
    d.refresh();
  },
});
