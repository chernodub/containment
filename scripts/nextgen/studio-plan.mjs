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
  plan['portrait-'+rig]={source:'selection24',rig,width:640,height:640,transparent:true};
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
const supply=id=>({kind:'supply',id,aim:.46});
const serviceModels={heal:'health',medkit:'medkit',armor:'armor',ammo:'ammo',grenade:'grenade',
  reroll:'reroll',upgrade:'upgrade',revive:'resuscitator'};
for(const [service,id] of Object.entries(serviceModels)){
  add('service-'+service,[supply(id)],{width:560,height:224,card:true,frameSubject:true,webpQuality:.84});
}
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
const opener=(family,champion)=>({kind:'enemy',family,champion,aim:2.3});
add('route-legacy-queen',[opener('queen')],{frameSubject:true});
for(const name of ['crawler','stalker','spitter','brute','carrier','warden','matron']){
  const family=name==='warden'?'brute':name==='matron'?'carrier':name;
  add('route-threat-'+name,[opener(family,name===family?undefined:name)],{frameSubject:true});
}
const nodes=L8_CAPTURE_API.generateRun(1729,3).nodes;
for(const {id,arena} of L8_CAPTURE_ROOMS){
  const node=nodes.find(node=>node.templateId===id);
  const {enemyId,guardian}=L8_CAPTURE_API.createEncounterPlan({seed:1729,node,breachIds:['studio']}).schedule[0];
  const space=L8_CAPTURE_API.plans[id].spaces.find(space=>space.name===landmarks[id]);
  const mark=space?.anchor??arena;
  add('route-'+id,[opener(enemyId,guardian)],{
    room:id,origin:[mark.x/32,mark.y/32],frameSubject:true,
  });
}
const lane={view:'gameplay',span:4.7};
const roomLane=(room,x,z)=>({...lane,room,origin:[x/32,z/32]});
const light=(color,mark)=>({kind:'light',color,intensity:8,distance:2.1,...mark});
// First-junction cards share the isolated studio ground; the projectile points
// back to the guarded plate or clutch without a second full-size silhouette.
add('route-plate-breaker',[
  {kind:'enemy',family:'brute',champion:'warden',pose:'attack',frame:.4,aim:1.38,x:.35,z:-.12},
  {kind:'ordnance',weapon:'plasma',from:[-3.0,.46,1.04],x:-.38,y:.91,z:.94},
  light(0x74baff,{x:-.45,y:1.30,z:.64,intensity:5,distance:1.85}),
],{span:4.0,focus:[0,1.24,0],cameraDirection:[0,.56,1]});
add('route-brood',[
  {kind:'enemy',family:'carrier',champion:'matron',aim:.63,x:-.5,z:-.18},
  {kind:'pod',x:.7,z:.45,scale:.55,shadow:.33},
  {kind:'pod',swollen:true,x:1.25,z:.36,scale:.68,shadow:.38},
  {kind:'ordnance',weapon:'rocket',from:[3.5,1.92,.75],x:1.65,y:1.05,z:.53},
  light(0xff9a5d,{x:1.55,y:.89,z:.56,intensity:2,distance:1.8}),
],{span:4.58,focus:[0,1.65,0],cameraDirection:[0,1.05,1]});
add('route-cache',[supply('cache-open')],{frameSubject:true});
add('route-locker',[{...supply('health'),x:-.85},{...supply('grenade'),x:.78,z:.14}],{span:2.25,focus:[0,.38,0]});
add('route-armor',[{...supply('armor'),x:-.85},{...supply('grenade'),x:.78,z:.14}],{span:2.25,focus:[0,.32,0]});
add('route-medicine',[supply('health')],{frameSubject:true});
add('route-warden-cache',[
  {kind:'enemy',family:'brute',champion:'warden',aim:2.12,x:-.7,z:.18,shadow:1.5},
  {...supply('cache-closed'),x:1.53,z:.21,shadow:.72},
],{...roomLane('swarm-junction',600,520),span:4.25,focus:[.05,.85,-.2]});
add('route-protected-passage',[opener('brute')],{frameSubject:true});
add('route-capacitor',[supply('overdrive')],{frameSubject:true});
add('route-meltdown-capacitor',[supply('overdrive'),light(0xff7435,{y:.7,z:.4})],{frameSubject:true});
for(const name of ['siege-plow','fault-line','shard-harvest','ice-road','ember-relay','meltdown-core','pilgrim-pylon','live-wire']){
  const reward=plan['reward-'+name];
  const reach=name==='ice-road'||name==='live-wire';
  plan['route-workshop-'+name]={
    ...reward,span:reach?3.92:3.55,focus:reach?[-.12,.83,-.10]:[-.12,.69,0],
    subjects:reward.subjects.map(subject=>subject.kind==='marine'?{...subject,scale:1.6}:subject),
  };
}
add('route-upgrade',[supply('upgrade')],{frameSubject:true});
for(const [name,shot] of Object.entries(plan)){
  if(!name.startsWith('route-'))continue;
  Object.assign(shot,{width:1120,height:476,card:true,view:'gameplay',webpQuality:.79});
}
export default plan;
