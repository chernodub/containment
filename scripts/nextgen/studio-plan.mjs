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
// Face across the lens so the receiver and near-side rig hardware stay visible.
const portraitPose={
  breacher:{aim:1.62,pose:'',frame:0,span:2.10,rimColor:0xffd063},
  cryo:{aim:2.0,pose:'',frame:0,span:2.13,rimColor:0x7fd6ff},
  pyro:{aim:1.90,pose:'',frame:0,span:2.13,rimColor:0xff7a2e},
  arc:{aim:-.10,pose:'overload',frame:.12,span:2.17,rimColor:0xb79cff},
};
for(const rig of Object.keys(rigKit)){
  const {aim,pose,frame,span,rimColor}=portraitPose[rig];
  add('portrait-'+rig,[{...marine(rig,pose),frame,aim,reload:rig === 'pyro' ? .32 : 0}],{
    width:640,height:640,focus:[0,.99,0],span,rimColor,key:[-3,5,2],framePortrait:true,transparent:true,
  });
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
  ],{span:kind==='barrier'?4.75:4.12,focus:[-.18,.68,0],deployables,zones,links,effect:{ability,rig,element,slot:slots[slot],
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
  add('weapon-'+id,[{kind:'weapon',id}],{span:id==='pistol'?.56:.95,focus:[0,0,0]});
}
for(const id of ['crawler','stalker','spitter','brute','carrier','warden','matron']){
  const family=id==='warden'?'brute':id==='matron'?'carrier':id;
  const champion=id==='warden'||id==='matron'?id:undefined;
  if(id==='spitter'){
    add('lesson-spitter',[
      {kind:'enemy',family,pose:'attack',aim:0,x:-2.1,z:.15},
      {...prop('Prop_Crate_Large'),x:0,z:.15,scale:.44},
      {...marine('breacher','ram'),x:1.85,z:.15,aim:Math.PI},
    ],{view:'gameplay',span:3.65,lesson:'blocked-shot'});
    continue;
  }
  add('lesson-'+id,[{kind:'enemy',family,champion,pose:'attack',aim:0,x:-1.45,z:champion?-.15:-.6},
    {...marine('breacher','ram'),x:1.25,z:1.35,aim:Math.PI/2,ghost:true}],{view:'gameplay',span:champion?6.65:4.6,lesson:true});
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
const lane={view:'gameplay',span:4.7};
const roomLane=(room,x,z)=>({...lane,room,origin:[x/32,z/32]});
const kit=(name,tint,mark={})=>({...prop(name),tint,...mark});
const station=(name,tint,mark={})=>({kind:'prop',kit:'station',name,tint,...mark});
const observer=(rig='breacher')=>({...marine(rig),x:-1.55,z:.42,aim:-.5});
const crate=(mark={})=>kit('Prop_Crate',0x385965,{scale:.8,shadow:.85,...mark});
const lamp=(glow,mark={})=>station('wall-switch',0x35494a,{scale:.72,glow,...mark});
const light=(color,mark)=>({kind:'light',color,intensity:8,distance:2.1,...mark});
add('route-cache',[
  observer(),station('container-flat-open',0x8c925a,{x:.78,z:-.65,aim:Math.PI/2,scale:1.38,shadow:1.1}),
  station('container-wide',0x5c6b58,{x:1.64,z:-.61,scale:.52}),
  light(0xf7b53c,{x:.89,z:.3,y:.61}),
  ...[[.4,.32],[.9,.57],[1.26,.27]].map(([x,z])=>({...pickup('credits'),x,z,scale:.85})),
  lamp(0xb37c24,{x:.7,z:-.02,y:.29}),
],roomLane('communal-atrium',765,487));
add('route-armor',[
  observer(),kit('Prop_Shelves_WideShort',0x3e6067,{x:.7,z:-.9,scale:.88,shadow:1}),
  ...[-.02,.47,1].map(x=>({...pickup('armor'),x:x+.28,z:-.8,y:.42})),
  crate({x:.46,z:.72,tint:0x72603e}),
  {...pickup('grenade'),x:1.58,z:.6,scale:1.3},{...pickup('grenade'),x:1.84,z:1.18,scale:1.22},
  light(0xa8c9f7,{x:1.58,z:.86,y:.73}),
],roomLane('breached-loading-bay',600,680));
add('route-medicine',[
  observer('cryo'),station('computer-wide',0x396766,{x:.78,z:-.52,shadow:1}),
  lamp(0x28ec91,{x:1.22,z:.12,y:1.05}),light(0x2af391,{x:1.25,z:.36,y:1.2}),
  crate({x:.32,z:.48,tint:0x37645a}),
  {...pickup('health'),x:1.58,z:.71,y:.14,scale:1.15},
],roomLane('safety-interlock-station',640,730));
add('route-warden-cache',[
  {kind:'enemy',family:'brute',champion:'warden',aim:.9,x:-.75,z:.24,shadow:1.5},
  kit('Prop_Crate_Large',0x66513a,{x:1.45,z:.46,scale:.68,shadow:1}),
  lamp(0xc98a27,{x:1.38,z:.72,y:.61}),
],{...roomLane('swarm-junction',600,520),span:6.4});
add('route-protected-passage',[
  {...observer('pyro'),x:-.8,z:.5},
  station('wall',0x667d87,{x:.85,z:-1.36,scale:1.55}),
  ...[-.5,2.2].map(x=>station('wall-pillar',0x4b646d,{x,z:-1.36,scale:1.4})),
  station('wall-detail',0x4a6268,{x:.85,z:-.98,y:.48,scale:.62}),
  lamp(0x70ebc1,{x:1.82,z:-.91,y:.88}),
  light(0x83efd3,{x:1.02,z:-.33,y:1.35,intensity:15,distance:4}),
  light(0xc9e5ff,{x:-1.04,z:.42,y:1.56,intensity:12,distance:4}),
],roomLane('manual-control-chamber',640,550));
add('route-capacitor',[
  observer('arc'),station('computer-system',0x435e75,{x:.94,z:-.33,shadow:1.2}),
  lamp(0x56b6fd,{x:.99,z:-.13,y:.8}),
  {kind:'ring',radius:1.18,color:0x75aefa,x:.94,z:-.33,y:.038},
  {kind:'ring',radius:.95,color:0x87ceda,x:.94,z:-.33,y:.037},
],roomLane('manual-control-chamber',640,550));
add('route-meltdown-capacitor',[
  observer('pyro'),station('computer-system',0x665449,{x:.94,z:-.88,shadow:1.2}),
  lamp(0xff9b55,{x:.99,z:-.48,y:.8}),
  light(0xff9149,{x:.94,z:-.28,y:1,intensity:14,distance:3}),
  {kind:'ring',radius:.69,color:0xffb061,x:.94,z:.20,y:.052},
  {kind:'glyph',name:'meltdown',color:0xffc485,x:.94,z:.20,y:.055,scale:1.12},
],roomLane('manual-control-chamber',640,550));
for(const name of ['siege-plow','fault-line','shard-harvest','ice-road','ember-relay','meltdown-core','pilgrim-pylon','live-wire']){
  const reward=plan['reward-'+name];
  const subjects=[...reward.subjects,kit('Prop_Desk_Medium',0x243c43,{x:.6,z:-1.38,scale:.74,shadow:1.1}),
    station('computer',0x345850,{x:.57,z:-1.43,y:.71,scale:.5}),lamp(0x438f89,{x:.99,z:-1.37,y:.76})];
  plan['route-workshop-'+name]={...reward,subjects,...roomLane('diagnostic-gallery',620,563),span:5.35};
}
add('route-upgrade',[observer(),kit('Prop_Desk_Medium',0x495f66,{x:.6,z:-.8,shadow:1.1}),station('computer',0x487379,{x:.77,z:-.8,y:.73})],roomLane('diagnostic-gallery',620,563));
export default plan;
