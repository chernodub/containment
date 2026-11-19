import {L8_CAPTURE_API,L8_CAPTURE_ROOMS} from './l8-capture-data.mjs';
const rigKit = {
  breacher:['kinetic','ram','seismic-slam','bulwark','railbreaker','shotgun'],
  cryo:['cryo','frost-trail','cryo-nova','glacier','whiteout','rifle'],
  pyro:['pyro','afterburn','flashfire','napalm-charge','meltdown','rocket'],
  arc:['arc','static-step','overload','tesla-pylon','overclock','plasma'],
};
const slots=['dash','tactical','power','overdrive'];
const plan={};
const add=(name,subjects,settings={})=>{plan[name]={width:640,height:360,span:3,subjects,...settings};};
const marine=(rig,pose)=>({kind:'marine',rig,weapon:rigKit[rig][5],pose});
const pickup=id=>({kind:'pickup',id});
const prop=name=>({kind:'prop',kit:'industrial',name});
for(const rig of Object.keys(rigKit)){
  add('portrait-'+rig,[marine(rig)],{width:640,height:640,focus:[0,1.23,0],span:2.55,transparent:true});
}
const rewards={
  'reserve-thruster':['breacher',0],'slide-loader':['breacher',0],'tactical-salvage':['cryo',1],
  'drive-dynamo':['arc',3],afterquake:['breacher',1],'reinforced-bulwark':['breacher',2],
  'spreading-nova':['cryo',1],'twin-glacier':['cryo',2],'scorched-fan':['pyro',1],
  'napalm-triplet':['pyro',2],'forked-overload':['arc',1],'twin-pylon':['arc',2],
  'siege-plow':['breacher',2],'fault-line':['breacher',1],'shard-harvest':['cryo',1],
  'ice-road':['cryo',2],'ember-relay':['pyro',1],'meltdown-core':['pyro',3],
  'pilgrim-pylon':['arc',2],'live-wire':['arc',1],
  kinetic:['breacher',1],cryo:['cryo',1],pyro:['pyro',1],arc:['arc',1],
  acid:['arc',1],universal:['breacher',0],recovery:['cryo',1],
  demolition:['breacher',1],executioner:['cryo',1],wildfire:['pyro',1],cycling:['arc',1],
};
for(const [name,[rig,slot]] of Object.entries(rewards)){
  const [element,...kit]=rigKit[rig], ability=kit[slot];
  const construct=(id,x,y,kind)=>({id,x,y,kind,ability,element,angle:.12,length:95,thickness:24,radius:42,
    remainingMs:4000,durationMs:5000,health:80,maxHealth:100});
  const kind={bulwark:'barrier',glacier:'ice-wall','tesla-pylon':'pylon'}[ability];
  const deployables=kind&&name!=='ice-road'?[construct(1,name==='pilgrim-pylon'?-91:12,-8,kind)]:[];
  if(name==='twin-glacier'||name==='twin-pylon')deployables.push(construct(2,46,26,kind));
  const duration={remainingMs:3800,durationMs:5000,attached:false};
  const strip=(ability,x,y,x2,y2,width)=>({id:1,ability,element,shape:'strip',x,y,x2,y2,width,radius:0,...duration});
  const pool=(id,x,y,radius)=>({id,ability,element,shape:'circle',x,y,radius,x2:x,y2:y,width:0,...duration});
  const zones=name==='ice-road'?[strip('frost-trail',-80,-12,95,12,70)]
    :name==='fault-line'?[strip(ability,-30,0,95,14,29)]
    :name==='napalm-triplet'?[pool(1,32,-24,28),pool(2,50,4,28),pool(3,27,30,28)]
    :name==='meltdown-core'?[pool(1,25,0,55)]:[];
  const links=name==='live-wire'?[{id:1,ability:'overload',element:'arc',x:-40,y:0,targetX:52,targetY:12,width:28}]:[];
  add('reward-'+name,[
    {...marine(rig,ability),x:-1.25,aim:.12},
    {kind:'enemy',family:'crawler',pose:rig==='cryo'?'frozen':'hit',x:1.15,z:-.6},
    {kind:'enemy',family:'crawler',pose:'hit',x:1.65,z:.45},
  ],{span:4.12,focus:[-.18,.68,0],deployables,zones,links,effect:{ability,rig,element,slot:slots[slot],
    phase:name==='shard-harvest'?'burst':ability==='overload'?'link':slot===0?'dash-end':'impact',
    angle:.12,targetX:48,targetY:4,length:110,width:52,...(ability==='flashfire'?{arcRadians:1.25}:{}),radius:name==='shard-harvest'?125:70,durationMs:700,maxTargets:3}});
}
const shards=plan['reward-shard-harvest'];
const shardTargets=[[1.6,-1.65],[2.2,-.2],[1.8,1.3]];
Object.assign(shards,{
  effect:undefined,effectFrames:4,
  subjects:[{...marine('cryo','cryo-nova'),x:-2.15,aim:.2},
    {kind:'enemy',family:'crawler',pose:'frozen',x:0,z:0},
    ...shardTargets.map(([x,z])=>({kind:'enemy',family:'crawler',pose:'hit',x,z}))],
  boonEffects:[{type:'boon',boon:'shatter',x:0,y:0,radius:46},
    ...shardTargets.map(([x,z])=>({type:'boon',boon:'frost',x:0,y:0,targetX:x*32,targetY:z*32}))],
});
for(const [service,id] of Object.entries({heal:'health',medkit:'health',armor:'armor',ammo:'ammo',grenade:'grenade',reroll:'credits'})){
  add('service-'+service,[pickup(id)],{width:448,height:168,span:id==='grenade'?.78:.52,focus:[0,.13,0]});
}
add('service-upgrade',[prop('Prop_Desk_Medium')],{width:448,height:168,span:1.78});
add('service-revive',[prop('Prop_HealthPack_Tube')],{width:448,height:168,span:.54,focus:[0,.16,0]});
for(const id of ['pistol','rifle','shotgun','plasma','rocket']){
  add('weapon-'+id,[{kind:'weapon',id}],{span:.95,focus:[0,0,0]});
}
for(const id of ['crawler','stalker','spitter','brute','carrier','warden','matron']){
  const family=id==='warden'?'brute':id==='matron'?'carrier':id;
  const champion=id==='warden'||id==='matron'?id:undefined;
  add('lesson-'+id,[{kind:'enemy',family,champion,pose:'attack',aim:0,x:-1.45,z:-.6},
    {...marine('breacher','ram'),x:1.25,z:1.35,aim:Math.PI/2,ghost:true}],{view:'gameplay',span:id==='warden'?5.7:4.6,lesson:true});
}
const landmarks={
  'awakening-bay':'Pod aisle','passenger-vault':'Cryo aisle','residential-gallery':'Common nook',
  'crew-checkpoint':'Scanner hall',armory:'Issue court','freight-hold':'Loading control booth',
  'breached-loading-bay':'Freight turning floor','relay-racks':'Console bay','transmission-chamber':'Uplink chancel',
  'diagnostic-gallery':'Recorder workbay','safety-interlock-station':'Interlock cage','coolant-plant':'Port pump gallery',
  'service-shaft-landing':'Local lift landing','infested-workshop':'Lathe service workbay','swarm-junction':'Growth crossing',
  'shielding-gate':'Scanner floor','containment-annulus':'East status ring','manual-control-chamber':'Authorization booth',
  'overload-floor':'Reaction feed threshold',
};
for(const {id,arena} of L8_CAPTURE_ROOMS){
  const space=L8_CAPTURE_API.plans[id].spaces.find(space=>space.name===landmarks[id]);
  const mark=id==='communal-atrium'?{x:650,y:375}:space?.anchor??arena;
  add('route-'+id,[],{view:'gameplay',room:id,span:9,focus:[mark.x/32,.25,mark.y/32]});
}
const lane={view:'gameplay',span:3.85};
add('route-warden-cache',[{kind:'enemy',family:'brute',champion:'warden',x:-.6},{...prop('Prop_Crate_Large'),x:1.2}],lane);
add('route-cache',[prop('Prop_Crate_Large'),{...pickup('credits'),x:-1.1,z:.5}],{...lane,span:3});
add('route-medicine',[prop('Prop_Crate'),{...pickup('health'),x:.92}],{...lane,span:2.4});
add('route-armor',[pickup('armor'),{...pickup('grenade'),x:.64}],{...lane,span:1.05,focus:[.3,.16,0]});
add('route-capacitor',[{kind:'prop',kit:'station',name:'computer-system'}],{...lane,span:2});
for(const name of ['siege-plow','fault-line','shard-harvest','ice-road','ember-relay','meltdown-core','pilgrim-pylon','live-wire']){
  const reward=plan['reward-'+name];
  const subjects=[...reward.subjects,{...prop('Prop_Desk_Medium'),x:1.25,z:-1.9}];
  plan['route-workshop-'+name]={...reward,subjects,view:'gameplay'};
}
add('route-upgrade',[prop('Prop_Desk_Medium')],{...lane,span:1.6});
add('title-hero',[{...marine('breacher',''),aim:2.62}],{
  width:1280,height:720,span:2.2,focus:[-.88,1.43,.63],transparent:true,
  key:[-2,4,3],rim:[4,3,-6],
});
export default plan;
