import {addLaneMachine} from './LaneMachines';
import {addLaneIncident} from './LaneIncidents';
import {addFrame16Incidents} from './Frame16Incidents';
import {addFrame16Deck} from './Frame16Deck';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {SHIP_ARCHITECTURE_PLANS} from '../../game/roguelike/shipArchitectureLayouts';
import {INCIDENT_OBSTACLES} from '../../game/roguelike/incidentObstacles';
import {landmarkHousing,laneWorklight} from '../lighting/LaneWorklight';

type Insert = readonly [kind:'drain'|'hatch'|'rails'|'trench', length:number, width:number, yaw:number, bays:number];
const inserts:Record<string,Insert>={
  'awakening-bay':['drain',3.6,.52,0,13],
  'passenger-vault':['rails',4.2,.92,0,4],
  'residential-gallery':['hatch',1.5,1.1,.04,2],
  'communal-atrium':['drain',2.7,.72,Math.PI/2,9],
  'crew-checkpoint':['trench',3.3,.74,0,5],
  'armory':['hatch',2.8,.84,Math.PI/2,4],
  'freight-hold':['rails',5.1,1.65,.16,5],
  'breached-loading-bay':['hatch',2.6,1.52,-.28,2],
  'relay-racks':['trench',4.2,.67,Math.PI/2,7],
  'transmission-chamber':['trench',3.1,.44,-.38,3],
  'diagnostic-gallery':['drain',2.48,.48,Math.PI/2,16],
  'safety-interlock-station':['hatch',1.92,1.56,0,3],
  'coolant-plant':['drain',4.25,.86,0,16],
  'service-shaft-landing':['rails',2.8,.76,Math.PI/2,4],
  'infested-workshop':['trench',2.38,.86,-.15,4],
  'swarm-junction':['drain',2.92,1.14,Math.PI/2,7],
  'shielding-gate':['rails',3.9,1.22,Math.PI/2,6],
  'containment-annulus':['hatch',2.2,1.34,.56,3],
  'manual-control-chamber':['trench',3.76,.57,-.1,5],
  'overload-floor':['rails',3.15,1.53,-.4,3],
};

/** Floor inserts fit within the known clear arena disc. The bed, lip and
 * removable covers have separate heights; only the top 20 mm are visible. */
export function addRoom14Fittings(root:T.Group,id:string):void {
  const plan=SHIP_ARCHITECTURE_PLANS[id as keyof typeof SHIP_ARCHITECTURE_PLANS],insert=inserts[id];
  if(!plan||!insert)return;
  addFrame16Incidents(root,id);
  addLaneIncident(root,id);
  addLaneMachine(root,id);
  const room = ROOM_TEMPLATES[id as keyof typeof ROOM_TEMPLATES];
  addFrame16Deck(root,room,plan.arena);
  // A recessed diffuser follows the top of each original hull module.
  // Keep the line outboard of the deck, with a short break at each joint.
  const rim: number[] = [];
  const hull = room.boundary ?? [];
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i], b = hull[(i + 1) % hull.length];
    const dx = (b.x-a.x)/32, dz = (b.y-a.y)/32, length = Math.hypot(dx,dz);
    if (length < .25) continue;
    const tx = dx/length, tz = dz/length, y = (dx < 0 ? .65 : 1.20) + .006;
    const point = (t:number, out:number) => [a.x/32+t*tx+out*tz, y, a.y/32+t*tz-out*tx];
    const count = Math.ceil(length/4.1);
    for (let j = 0; j < count; j++) {
      const start = length*j/count+.08, end = length*(j+1)/count-.08;
      const near = point(start,.18), far = point(end,.26);
      rim.push(...near,...point(end,.18),...far,...near,...far,...point(start,.26));
    }
  }
  if (rim.length) {
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(rim,3));
    const material = new T.MeshBasicMaterial({color:0x667577});
    material.userData.actorMaterial = true;
    const mesh = new T.Mesh(geometry,material);
    mesh.name = 'hull-cap-diffusers';
    root.add(mesh);
  }
  // These approaches expose the torn hull, torn guide or split duct directly.
  if (!['shielding-gate','breached-loading-bay','swarm-junction'].includes(id)) {
    addArenaInsert(root,plan.arena,insert);
  }
  if(id==='passenger-vault'||id==='freight-hold'){
    // The luggage and cargo spilled onto their transport bases. The broad
    // blocking footprint is visible even between individual loose pieces.
    const cover=INCIDENT_OBSTACLES[id][id==='passenger-vault'?1:0];
    const base=new T.Mesh(new T.BoxGeometry((cover.width-1.4)/32,.24,(cover.height-1.4)/32),
      new T.MeshStandardMaterial({color:id==='passenger-vault'?0x687b83:0x253c4e,roughness:.82,metalness:.18}));
    base.name='room14-displaced-transport-base';
    base.position.set((cover.x+cover.width*.5)/32,.12,(cover.y+cover.height*.5)/32);
    base.receiveShadow=true;
    base.material.userData.actorMaterial=true;
    root.add(base);
  }
  // Two restrained pools originate at actual diffusers already in the kit.
  // The existing distance-ranked light pool owns their allocation and Low fallback.
  const lamps=root.userData.lightFixtures as {x:number;z:number;color:number;nativeColor:boolean;gain:number}[]|undefined;
  if(lamps?.length){
    const distance=(p:{x:number;z:number})=>Math.hypot(p.x-plan.arena.x/32,p.z-plan.arena.y/32);
    const sorted=[...lamps].sort((a,b)=>distance(a)-distance(b));
    const work=sorted[0],consoleLamp=sorted.find(p=>Math.hypot(p.x-work.x,p.z-work.z)>3);
    Object.assign(work,{color:0xebcc99,nativeColor:true,gain:.56});
    if(consoleLamp)Object.assign(consoleLamp,{color:0x9bcad5,nativeColor:true,gain:.47});
  }
  const source=laneWorklight(id);
  if(source)addWorklightHousing(root,source);
  const landmark=landmarkHousing(id);
  if(landmark)addWorklightHousing(root,landmark);
}
function addWorklightHousing(root:T.Group,source:NonNullable<ReturnType<typeof laneWorklight>>){
  // Physical diffuser and protective back at the existing pooled practical.
  const fixture=new T.Group();
  fixture.name='room14-landmark-worklight';
  fixture.rotation.y=source.angle;
  fixture.position.set(source.x/32,source.y,source.z/32);
  const casing=new T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>(new T.BoxGeometry(1.06,.22,.40),new T.MeshStandardMaterial({color:0x394749,roughness:.64}));
  const lens = new T.Color(source.color);
  lens.multiplyScalar(.68);
  const diffuser=new T.Mesh(new T.BoxGeometry(.93,.07,.31),new T.MeshStandardMaterial({
    color:lens,emissive:lens,emissiveIntensity:.46,roughness:.36
  }));
  casing.material.userData.actorMaterial=true;diffuser.material.userData.actorMaterial=true;
  diffuser.position.set(0,.122,.07);
  const mastHeight=Math.max(.72,fixture.position.y);
  const post=new T.BoxGeometry(.075,mastHeight,.075).translate(-.30,-mastHeight*.5,0);
  const shoe=new T.BoxGeometry(.25,.08,.29).translate(-.3,-mastHeight+.04,0);
  const louvres=[-.12,.12].map(x=>new T.BoxGeometry(.025,.10,.19).translate(x,-.056,.11));
  const housing=mergeGeometries([casing.geometry,post,shoe,...louvres])!;
  louvres.forEach(g=>g.dispose());
  casing.geometry.dispose();post.dispose();shoe.dispose();casing.geometry=housing;
  fixture.add(casing,diffuser);root.add(fixture);
}

function addArenaInsert(root:T.Group,arena:{x:number;y:number},insert:Insert):void {
  const [kind,length,width,yaw,bays]=insert,parts:T.BufferGeometry[]=[];
  const plate=(x:number,z:number,w:number,d:number,bottom:number,top:number,tone:number)=>{
    const g=new T.BoxGeometry(w,top-bottom,d);
    g.translate(x,(top+bottom)/2,z);
    const c=new T.Color(tone),rgb=new Float32Array(g.attributes.position.count*3);
    for(let i=0;i<rgb.length;i+=3)c.toArray(rgb,i);
    g.setAttribute('color',new T.BufferAttribute(rgb,3));parts.push(g);
  };
  const pitch=length/bays;
  if(kind!=='rails')plate(0,0,length,width,.001,.009,0x252b2e);
  for(const side of [-1,1])plate(0,side*width*.48,length,.048,.009,.021,0x666967);
  for(let i=0;i<bays;i++){
    const x=-length*.5+(i+.5)*pitch;
    if(kind==='rails')plate(x,0,.10,width,.004,.013,0x40484a);
    else if(kind==='drain')plate(x,0,pitch*.37,width*.90,.009,.019,0x596265);
    else {
      plate(x,0,pitch-.038,width-.095,.010,.019,kind==='hatch'?0x535959:0x464f51);
      plate(x,kind==='hatch'?width*.26:0,.15,.045,.019,.021,0x303637);
    }
  }
  const geometry=mergeGeometries(parts)!;parts.forEach(g=>g.dispose());
  const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.81,metalness:.26});
  // The recessed machined faces sit between the named-space paint and wet decals.
  material.polygonOffset=true;
  material.polygonOffsetFactor=-3;
  material.polygonOffsetUnits=-3;
  material.userData.actorMaterial=true;
  const mesh=new T.Mesh(geometry,material);
  mesh.name='room14-'+kind;mesh.position.set(arena.x/32,.0002,arena.y/32+1.1);
  mesh.rotation.y=yaw;mesh.receiveShadow=true;root.add(mesh);

}
