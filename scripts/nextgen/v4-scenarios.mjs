/** Additive priority overlaps. Real kits plus explicitly staged presentation-only warning receipts. */
export function registerV4Scenarios(scenarios) {
  for (const rig of ['breacher', 'cryo', 'pyro', 'arc']) {
    for (const room of ['containment-annulus', 'infested-workshop']) {
      for (const masked of [true, false]) {
        const base = scenarios.find(s => s.id === `v2-full-${rig}-${room}`);
        scenarios.push({ ...base, id: `v4-yield-${rig}-${masked ? 'masked' : 'reference'}-${room}`,
          setup: new Function(`return (async()=>{
            await (${base.setup.toString()})(${JSON.stringify(base.setupArgument)});
            const d=window.__containmentDebug,g=d.game,r=d.renderer,visuals=r.interimAbilities,mask=visuals.priorityMask;
            const cast=g.abilities.snapshot.slots.overdrive.castRemainingMs;
            d.step(cast+650);d.setInput({fire:false,x:0,y:0});
            const zone=g.abilities.snapshot.zones.find(z=>z.radius>0);
            const wall=g.abilities.snapshot.deployables[0];
            const x=zone?.x??wall?.x??g.player.x+70,y=zone?.y??wall?.y??g.player.y-55;
            r.effect({type:'enemy-warning',x,y,radius:54,targetX:g.player.x,targetY:g.player.y,durationMs:8000});
            if(typeof mask?.update!=='function')throw Error('V4 priority mask missing');
            if(${!masked}){const update=mask.update;mask.update=function(...args){update.apply(this,args);this.clear();};}
            d.v2Proof.priorityStaging={presentationOnly:true,masked:${masked},source:'AttackEffects live stable warning accessor',x,y,radius:54,impactGraceSeconds:.25,heldAfterCastMs:650};
            d.refresh();
            if(${masked}&&!mask.pixels.some(v=>v>200))throw Error('V4 priority texture stayed empty');
          })();`),
        });
      }
    }
  }
}
