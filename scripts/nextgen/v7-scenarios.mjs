/** Native V7 state inspections; uses the legal open-room marks from the V6 supplemental fixture. */
export function registerV7Scenarios(scenarios) {
  for (const [rig, ability] of [['breacher','railbreaker'],['cryo','whiteout'],['pyro','meltdown'],['arc','overclock']]) {
    for (const room of ['containment-annulus','infested-workshop']) for (const low of [false,true]) {
      scenarios.push({
        id:`v7-state-${ability}${low?'-low':''}-${room}`,room,state:'playing',burst:true,
        stepMs:ability==='railbreaker'?30:150,
        setupArgument:{rig,ability,room,low},
        setup:async({rig,ability,room,low,timeline=false})=>{
          const d=window.__containmentDebug,g=d.game,r=d.renderer;
          await d.gotoRoom(room,{rig});d.invulnerable(true);g.enemies.reset();
          if(low){r.setQuality('low');await d.prepare();}
          const b=g.geometry.bounds;let score=-1,px=g.player.x,py=g.player.y;
          for(let y=b.y+320;y<b.y+b.height-320;y+=48)for(let x=b.x+320;x<b.x+b.width-320;x+=48){
            if(!d.canStand(x,y,32))continue;
            const clearance=Math.min(x-b.x,y-b.y,b.x+b.width-x,b.y+b.height-y);
            if(clearance>score){score=clearance;px=x;py=y;}
          }
          if(score<0)throw Error('No legal open V7 state mark');
          Object.assign(g.player,{x:px,y:py,angle:-.4,vx:0,vy:0});
          d.setInput({fire:false,x:0,y:0,angle:-.4,autoAim:false});d.step(3800);g.enemies.reset();
          await r.interimAbilities.prepare();d.refresh();d.fillOverdrive();
          const gl=r.renderer.getContext();gl.createProgram=function(){throw Error('V7 state combat shader compile');};
          if(!g.useAbility('overdrive'))throw Error('Native V7 ultimate denied '+ability);
          const cast=g.abilities.snapshot.slots.overdrive.castRemainingMs;
          // Rail captures the violent impact; sustained states have already settled.
          d.step(cast+(timeline||ability==='railbreaker'?30:650));
          if(ability!=='railbreaker'&&!g.abilities.snapshot.overdrive.active)throw Error('V7 state did not activate');
          if(ability==='overclock'||ability==='meltdown')d.setInput({fire:true,x:timeline?.04:.32,y:timeline?.02:.12,angle:-.4,autoAim:false});
          d.g4DangerProof={presentationOnly:true,nativeAbility:ability,room,low,mark:{x:px,y:py},boundaryClearance:score,assetWait:true,shaderGuard:true,fixture:'v7-state'};
          d.refresh();
        },
      });
    }
  }
}
