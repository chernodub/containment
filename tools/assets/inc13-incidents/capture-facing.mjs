// Add a quiet, incident-facing native-camera frame to the normal capture CLI.
// node tools/assets/inc13-incidents/capture-facing.mjs --label=... --scenarios=inc13-facing --rooms=...
import {SCENARIOS} from '../../../scripts/nextgen/scenarios.mjs';

SCENARIOS.push({
  id:'inc13-facing', rooms:true, state:'playing', phase:'combat', diagnosticOnly:true,
  setup:async room=>{
    const marks={
      'awakening-bay':[507,440,547,312],
      'residential-gallery':[270,375,410,242],
      'coolant-plant':[408,459,401,299],
      'infested-workshop':[453,471,515,325],
      'manual-control-chamber':[288,519,585,380],
    };
    const d=window.__containmentDebug,g=d.game;
    await d.gotoRoom(room);d.invulnerable(true);g.enemies.reset();
    const [x,y,tx,ty]=marks[room];
    if(!d.canStand(x,y,32))throw Error('Illegal incident inspection mark in '+room);
    const angle=Math.atan2(ty-y,tx-x);
    Object.assign(g.player,{x,y,vx:0,vy:0,angle});
    d.setInput({x:0,y:0,fire:false,angle,autoAim:false});
    d.settlePresentation(120);d.refresh();
  }
});
await import('../../../scripts/nextgen/capture.mjs');
