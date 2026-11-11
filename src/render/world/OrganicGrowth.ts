import * as T from 'three';
import {MAT,box,geometry,shell,ball} from '../meshParts';

/** Stable room-seeded growth; this never consumes the simulation random stream. */
function randomSource(seed:number,index:number){
  let state=(seed^Math.imul(index+1,0x9e3779b1))>>>0;
  return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}
const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
const up=new T.Vector3(0,1,0);
// Seeded dimensions live in transforms, never dimension-keyed global geometry entries.
function rod(parent:T.Group,a:T.Vector3,b:T.Vector3,r:number,_r2:number,material:T.Material){
  const mesh=new T.Mesh(geometry('x2-organic-taper',()=>new T.CylinderGeometry(.65,1,1,8)),material);
  mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.set(r,a.distanceTo(b),r);mesh.quaternion.setFromUnitVectors(up,b.clone().sub(a).normalize());mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function lobe(parent:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,material:T.Material){
  const mesh=shell(parent,x,y,z,1,1,1,material);mesh.scale.set(w,h,d);return mesh;
}

/** Irregular brood tissue consumes a retained equipment chassis inside its fitted cell. */
export function addBroodCell(cell:T.Group,seed:number,index:number):void {
  const random=randomSource(seed,index),bias=random()*.7-.35;
  const wreck=box(cell,-.12,.19,-.11,1.38,.27,1.5,MAT.steel,.07);wreck.rotation.y=.12+bias*.17;
  // One damaged console is still recognizable beneath the connected tissue.
  box(cell,-.44,.65,-.55,.63,.8,.66,MAT.black,.04);
  const face=box(cell,-.44,1.06,-.55,.52,.035,.5,MAT.edge,.015);face.rotation.x=.23;
  for(let wire=0;wire<3;wire++)rod(cell,v(-.6+wire*.1,.96,-.28),v(-.7+wire*.11,.36,.14),.026,.02,MAT.copper);
  lobe(cell,bias,.48,.05,.83,.3,2.2,MAT.flesh);
  const sacs=3+Math.floor(random()*3);
  for(let n=0;n<sacs;n++){
    const x=(random()-.5)*.98,z=(random()-.5)*1.6;
    const size=.26+random()*.33,height=.35+random()*.57,turn=random()*Math.PI;
    const sac=lobe(cell,x,.64+height*.35,z,size,height,size*1.6,MAT.shellDark);sac.rotation.y=turn;sac.rotation.z=(random()-.5)*.55;
    // Light leaks from fissures inside each lobe, never a separate decorative bulb.
    const opening=lobe(cell,x+.07,.76+height*.45,z,size*.48,height*.46,size*.6,MAT.acid);opening.rotation.y=turn;
    for(let rib=0;rib<4;rib++){
      const angle=turn+rib*Math.PI/2,dx=Math.cos(angle)*size,dz=Math.sin(angle)*size*.7;
      rod(cell,v(x+dx,.56,z+dz),v(x+dx*.55,.8+height*.6,z+dz*.55),.034,.06,MAT.flesh);
    }
    // Attached membranes span lobes and chassis, with tapered irregular roots.
    rod(cell,v(bias,.51,.12),v(x,.73,z),.15,.075,MAT.flesh);
    const edge=n%2?- .77:.77;
    rod(cell,v(x,.7,z),v(edge,.08,z+(random()-.5)*.4),.09,.035,MAT.flesh);
  }
  cell.userData.growthSeed=seed;cell.userData.broodSacs=sacs;
}

/** Wall-root mesh stays behind the enclosure plane; branching crosses panel seams. */
export function addWallRoots(parent:T.Group,x:number,seed:number,index:number):void {
  const random=randomSource(seed,index),lean=(random()-.5)*1.1;
  lobe(parent,x+lean,1.3,-.38,.65,.95,.42,MAT.flesh);
  for(let branch=0;branch<5;branch++){
    const base=x+(random()-.5)*2.8,top=x+lean+(random()-.5)*1.3;
    const mid=v((base+top)/2,.75+random()*.6,-.15-random()*.08);
    rod(parent,v(base,.05,-.15),mid,.06,.11,MAT.flesh);
    rod(parent,mid,v(top,1.8+random()*.7,-.17),.085,.025,MAT.flesh);
    if(branch%2===0)ball(parent,mid.x,mid.y,-.145,.07,.18,.045,MAT.acid);
  }
}
