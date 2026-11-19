import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {SHIP_ARCHITECTURE_PLANS} from '../../game/roguelike/shipArchitectureLayouts';
import {roomValueProfile} from '../lighting/RoomValueStandard';

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
  material.userData.actorMaterial=true;
  const mesh=new T.Mesh(geometry,material);
  mesh.name='room14-'+kind;mesh.position.set(plan.arena.x/32,.0002,plan.arena.y/32+1.1);
  mesh.rotation.y=yaw;mesh.receiveShadow=true;root.add(mesh);

  const source=roomValueProfile(id)?.landmark;
  if(!source)return;
  // Physical diffuser and protective back at the existing pooled practical.
  const fixture=new T.Group();
  fixture.name='room14-landmark-worklight';
  fixture.position.set(source.at[0]/32,source.height??3.8,source.at[1]/32);
  const casing=new T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>(new T.BoxGeometry(.74,.16,.28),new T.MeshStandardMaterial({color:0x394749,roughness:.64}));
  const diffuser=new T.Mesh(new T.BoxGeometry(.56,.066,.14),new T.MeshStandardMaterial({
    color:source.color,emissive:source.color,emissiveIntensity:.65,roughness:.36
  }));
  casing.material.userData.actorMaterial=true;diffuser.material.userData.actorMaterial=true;
  diffuser.position.set(0,-.057,.091);
  const mastHeight=Math.max(.72,fixture.position.y);
  const post=new T.BoxGeometry(.075,mastHeight,.075).translate(-.30,-mastHeight*.5,0);
  const shoe=new T.BoxGeometry(.25,.08,.29).translate(-.3,-mastHeight+.04,0);
  const housing=mergeGeometries([casing.geometry,post,shoe])!;
  casing.geometry.dispose();post.dispose();shoe.dispose();casing.geometry=housing;
  fixture.add(casing,diffuser);root.add(fixture);
}
