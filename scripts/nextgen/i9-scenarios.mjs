/** Actual seed1729 organic failure coordinates, replayed as native presentation fixtures. */
async function priorityPair(room, sample) {
 const d=window.__containmentDebug,g=d.game;
 await d.gotoRoom(room,{rig:'breacher'});d.invulnerable(true);g.enemies.reset();g.skipStory();
 d.setInput({x:0,y:0,fire:false,angle:sample.angle,autoAim:false});d.step(800);g.enemies.reset();
 if(!d.canStand(sample.x,sample.y,g.player.radius)||!d.canStand(sample.ex,sample.ey,sample.radius))throw Error('Organic replay positions are no longer legal');
 Object.assign(g.player,{x:sample.x,y:sample.y,angle:sample.angle,vx:0,vy:0});
 d.setInput({x:0,y:0,fire:false,angle:sample.angle,autoAim:false});
 const id=d.spawn(sample.type,sample.ex,sample.ey,sample.elite);if(!id)throw Error('Organic replay actor failed to spawn');
 for(let frame=0;frame<8;frame++)d.refresh();
 d.i9PriorityPair={source:'Unassisted a94f seed1729 Breacher organic mid-fight coordinates',sample,id,presentationOnly:true};
}
export function registerI9Scenarios(scenarios){
 const samples=[{id:'i9-remote-spitter',room:'infested-workshop',x:322.3842405618243,y:592.9199102514939,angle:1.4820376670167805,ex:190.48293549557826,ey:857.8569938652564,radius:18,type:'spitter',elite:true},
  {id:'i9-remote-stalker',room:'swarm-junction',x:167.90905765161747,y:495.7129016217312,angle:1.3617798661837357,ex:260.0662478226219,ey:834.1510276377002,radius:17,type:'stalker',elite:false}];
 for(const sample of samples)scenarios.push({id:sample.id,room:sample.room,state:'playing',burst:true,stepMs:150,priorityPair:true,setup:new Function(`return (${priorityPair.toString()})(${JSON.stringify(sample.room)},${JSON.stringify(sample)});`)});
}
