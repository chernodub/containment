/** Native cursor/F-key evidence. No geometry, placement rule or ability snapshot is overridden. */
export function registerV7PlacementScenarios(scenarios) {
  for (const [rig, ability] of [['breacher','bulwark'],['cryo','glacier'],['pyro','napalm-charge'],['arc','tesla-pylon']]) {
    for (const blocked of [false,true]) scenarios.push({
      id:`v7-placement-${ability}-${blocked?'blocked':'valid'}`,
      room:'awakening-bay',state:'playing',burst:true,stepMs:100,
      v7Placement:true,nativeFocus:'#world',...(blocked?{nativeHold:['f'],required:['#ability-denial']} : {}),
      setupArgument:{rig,ability,blocked},
      setup:async({rig,ability,blocked})=>{
        const d=window.__containmentDebug,g=d.game,r=d.renderer;
        await d.gotoRoom('awakening-bay',{rig});d.invulnerable(true);g.enemies.reset();
        const build=Object.freeze({mutations:Object.freeze([]),rig});g.expedition=Object.freeze({...g.expedition,build});g.combat.setBuild(build);
        const b=g.geometry.bounds,targets=[];
        if(blocked) for(const rect of g.geometry.blockers){
          if(g.geometry.boundaryWalls.includes(rect))continue;
          targets.push({x:rect.x+rect.width/2,y:rect.y+rect.height/2},
            {x:rect.x-2,y:rect.y+rect.height/2},{x:rect.x+rect.width+2,y:rect.y+rect.height/2},
            {x:rect.x+rect.width/2,y:rect.y-2},{x:rect.x+rect.width/2,y:rect.y+rect.height+2});
        }
        else for(let y=b.y+180;y<b.y+b.height-180;y+=64)for(let x=b.x+180;x<b.x+b.width-180;x+=64)targets.push({x,y});
        if(blocked)for(const polygon of g.geometry.voids??[]){
          targets.push({x:polygon.reduce((n,p)=>n+p.x,0)/polygon.length,y:polygon.reduce((n,p)=>n+p.y,0)/polygon.length});
          for(let i=0;i<polygon.length;i++){const a=polygon[i],c=polygon[(i+1)%polygon.length];targets.push(a,{x:(a.x+c.x)/2,y:(a.y+c.y)/2});}
        }
        targets.sort((a,c)=>Math.hypot(a.x-b.width/2,a.y-b.height/2)-Math.hypot(c.x-b.width/2,c.y-b.height/2));
        let mark=null;
        search:for(const target of targets)for(const distance of [110,160,220,280,70])for(let i=0;i<16;i++){
          const angle=i*Math.PI/8,x=target.x-Math.cos(angle)*distance,y=target.y-Math.sin(angle)*distance;
          if(Math.min(x-b.x,y-b.y,b.x+b.width-x,b.y+b.height-y)<140||!d.canStand(x,y,32))continue;
          Object.assign(g.player,{x,y,angle,vx:0,vy:0});g.setAimPoint(target);
          const ready=g.abilities.snapshot.slots.power.ready;
          if(ready===!blocked){mark={x,y,angle,target};break search;}
        }
        if(!mark)throw Error('No authored native V7 placement mark '+ability+'/'+blocked);
        d.setInput({x:0,y:0,fire:false,angle:mark.angle,autoAim:false,aimPoint:mark.target});
        d.step(3800);g.enemies.reset();await d.prepare();d.refresh();
        // Project the actual authored target using the prepared public camera.
        const v=r.camera.matrixWorldInverse.elements,p=r.camera.projectionMatrix.elements;
        const wx=mark.target.x/32,wz=mark.target.y/32;
        const vx=v[0]*wx+v[8]*wz+v[12],vy=v[1]*wx+v[9]*wz+v[13],vz=v[2]*wx+v[10]*wz+v[14];
        const qx=p[0]*vx+p[4]*vy+p[8]*vz+p[12],qy=p[1]*vx+p[5]*vy+p[9]*vz+p[13],qw=p[3]*vx+p[7]*vy+p[11]*vz+p[15];
        const box=r.canvas.getBoundingClientRect();
        d.v7PlacementPointer={x:box.left+(qx/qw*.5+.5)*box.width,y:box.top+(1-(qy/qw*.5+.5))*box.height};
        const point=r.pointer(d.v7PlacementPointer.x,d.v7PlacementPointer.y);
        if(!point||Math.hypot(point.x-mark.target.x,point.y-mark.target.y)>.05)throw Error('Native V7 pointer projection disagrees with the authored target');
        g.player.angle=Math.atan2(point.y-g.player.y,point.x-g.player.x);g.setAimPoint(point);
        if(g.abilities.snapshot.slots.power.ready!==!blocked)throw Error('Settled native placement changed validity');
        d.v7PlacementProof={ability,rig,blocked,mark,target:point,nativeFKey:0,nativeDenied:0,usesBefore:g.stats.abilityUses.power};
        const effect=r.effect.bind(r);r.effect=event=>{
          if(event.type==='ability'&&event.ability?.ability===ability&&event.ability.phase==='denied'&&event.ability.denial==='blocked')d.v7PlacementProof.nativeDenied++;
          return effect(event);
        };
        document.addEventListener('keydown',event=>{if(event.isTrusted&&event.code==='KeyF'&&!event.repeat)d.v7PlacementProof.nativeFKey++;});
        const gl=r.renderer.getContext();gl.createProgram=function(){throw Error('V7 placement combat shader compile');};
        d.refresh();
      },
    });
  }
}

/** Page-evaluated proof from the actual prepared renderer owner and native denial receipts. */
export function inspectV7Placement() {
  const d=window.__containmentDebug,r=d.renderer,g=d.game,proof=d.v7PlacementProof;
  const owner=r.interimAbilities.owner.placementPreview,mesh=owner.mesh,data=mesh.geometry.getAttribute('preview');
  const valid=[];for(let i=0;i<mesh.count;i++)valid.push(!!data.getY(i));
  const label=document.querySelector('#ability-denial'),slot=document.querySelector('[data-ability="power"] .ability-value');
  return {...proof,meshCount:mesh.count,valid,label:label?.hidden?null:label?.textContent,slot:slot?.textContent,
    charges:g.abilities.snapshot.slots.power.charges,usesAfter:g.stats.abilityUses.power,bridge:typeof r.scene.userData.setPlacementPreview==='function'};
}
