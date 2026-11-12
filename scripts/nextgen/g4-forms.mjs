/** Legal settled inspection marks complement the ordinary room-entry camera shots. */
async function stageForms({room,low=false,mark=null}) {
  const d=window.__containmentDebug,g=d.game;
  await d.gotoRoom(room);
  if(low){d.renderer.setQuality('low');await d.prepare();}
  const b=g.geometry.bounds,marks={armory:[300,600],'communal-atrium':[440,520],'relay-racks':[600,280],'diagnostic-gallery':[550,440],'safety-interlock-station':[560,440]};
  const target=mark??marks[room]??[b.x+b.width*.48,b.y+b.height*.53],candidates=[];
  for(let y=b.y+40;y<b.y+b.height-40;y+=16)for(let x=b.x+40;x<b.x+b.width-40;x+=16)if(d.canStand(x,y,g.player.radius))candidates.push({x,y,distance:Math.hypot(x-target[0],y-target[1])});
  candidates.sort((a,b)=>a.distance-b.distance);if(!candidates.length)throw Error('No legal form inspection mark');
  Object.assign(g.player,{x:candidates[0].x,y:candidates[0].y,vx:0,vy:0});
  d.invulnerable(true);d.setInput({x:0,y:0,fire:false,angle:0,autoAim:false});d.step(800);g.enemies.reset();d.renderer.effects.clear();d.refresh();
}

export const G4_FORM_SCENARIOS=['high','low'].map(tier=>({
  id:`g4-forms-${tier}`,rooms:true,state:'playing',
  setup:new Function('room',`return (${stageForms.toString()})({room,low:${tier==='low'}});`),
}));

for(const low of [false,true])G4_FORM_SCENARIOS.push({id:`g4-habitation-vignette-${low?'low':'high'}`,state:'playing',room:'communal-atrium',setup:stageForms,setupArgument:{room:'communal-atrium',low,mark:[800,520]}});
