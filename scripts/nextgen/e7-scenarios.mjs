import fixtures from './e7-landmark-fixtures.json' with {type:'json'};

/** Saved organic positions, followed by real firing/actor movement. Presentation replay, not a campaign. */
async function stageLandmark(sample){
 const d=window.__containmentDebug,g=d.game;
 await d.gotoRoom(sample.room,{rig:sample.rig});d.invulnerable(true);g.skipStory();g.enemies.reset();
 if(!d.canStand(sample.x,sample.y,g.player.radius))throw Error('E7 saved marine mark is no longer legal');
 Object.assign(g.player,{x:sample.x,y:sample.y,vx:0,vy:0,angle:sample.angle});
 d.setInput({x:0,y:0,fire:false,angle:sample.angle,autoAim:false});d.step(800);g.enemies.reset();
 const ids=[];
 for(const e of sample.enemies){if(!d.canStand(e.x,e.y,e.radius))throw Error('E7 saved contact is no longer legal');const id=d.spawn(e.type,e.x,e.y,e.elite);if(!id)throw Error('E7 saved contact rejected');ids.push(id);}
 d.setInput({x:0,y:0,fire:true,angle:sample.angle,autoAim:false});d.step(160);
 d.e7LandmarkProof={source:sample.source,initial:sample,spawnedIds:ids,nativeFiring:true,presentationOnly:true};d.refresh();
}
export function registerE7Scenarios(scenarios){
 for(const sample of fixtures)scenarios.push({id:sample.id,room:sample.room,state:'playing',burst:true,setup:stageLandmark,setupArgument:sample});
}
