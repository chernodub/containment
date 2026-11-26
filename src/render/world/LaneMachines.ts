import {addFightLaneDamage} from './FightLaneDamage';
import {brokenLaneEnd} from './BrokenLaneEnds';
import {addIncidentLane} from './IncidentLaneMachines';
import {incidentLanes} from '../lighting/IncidentLaneLayouts';
import {CylinderGeometry,type Group} from 'three';
import {IncidentPieces} from './Inc13StoryIncidents';

import {laneTerminal} from '../lighting/LaneWorklight';

type Pin=[number,number];

export function addLaneMachine(root:Group,id:string){
  addFightLaneDamage(root,id);
  const incident=incidentLanes[id];
  if(incident){addIncidentLane(root,id,incident);return;}
  const end=laneTerminal(id);if(!end)return;
  const p=new IncidentPieces(),metal=0x657779,edge=0x949e98,rubber=0x343e43;
  // Offsets are relative to the service end, in the same ship units as the room plan.
  function run(path:Pin[],height:number,radius:number,color:number){
    for(let i=1;i<path.length;i++)p.rod([path[i-1][0],height,path[i-1][1]],[path[i][0],height,path[i][1]],radius,color);
  }
  switch(id){
    case 'relay-racks':
      // An open cable trench exposes alternating removable combs along the aisle.
      p.box(94,2,-49,158,4,47,rubber);
      for(const side of [-1,1])p.box(94,5,-49+side*23,166,6,4,edge);
      for(let x=24;x<168;x+=17)p.box(x,7,-49,7,4,42,metal);
      p.box(9,4,-75,39,6,43,metal,.34);
      for(const z of [-7,0,7])run([[216,-56+z],[132,-56+z],[86,-12+z],[5,-12+z]],4,2.8,rubber);
      p.box(0,5,0,57,9,35,metal);p.box(0,10,-1,48,2,28,0x35474d);
      for(const x of [-16,-5,6,17])p.box(x,16,-1,7,15,22,0x988d6c,.26);
      p.box(0,12,18,29,5,4,edge);break;
    case 'service-shaft-landing':
      // A taut standing part meets the sheave, then doubles back to the sling.
      for(let i=0;i<16;i++){
        const point=(t:number):[number,number,number]=>[126-120*t,4+17*(Math.cosh((t-.5)*2.4)-1),153-144*t];
        p.rod(point(i/16),point((i+1)/16),3.3,0xb1a18a);
      }
      p.rod([98,19,146],[144,19,146],16,metal);
      for(const x of [98,144])p.rod([x,19,146],[x+4,19,146],22,edge);
      const coil:Pin[]=[];
      for(let i=0;i<=48;i++){
        const a=i*Math.PI/12,r=19+i*.31;
        coil.push([-24+Math.cos(a)*r,7+Math.sin(a)*r*.78]);
      }
      run(coil,4,3.2,0x958875);
      p.rod([0,2,0],[0,12,0],21,rubber);
      p.rod([0,12,0],[0,16,0],18,edge);
      p.box(0,19,0,58,6,11,0xb3985c,.79);
      for(const x of [-70,-49,-28])p.box(x,4,49,9,8,59,metal,-.18);
      for(const [x,z,a] of [[-51,28,-.18],[-48,43,-.2],[-44,59,-.13],[-16,76,.66]])
        p.box(x,10,z,63,7,11,0xbd9866,a);
      p.box(-60,17,39,34,14,24,0x748c80,-.29);
      break;
    case 'armory':{
      function cartridge(x:number,y:number,z:number,yaw:number){
        // The flared case head and tapered copper nose survive the incident crop.
        for(const [start,length,base,tip,color] of [
          [-21,3,5.8,5.8,0xe0b45b],[-18,23,5,4.8,0xc9953f],
          [5,4,4.8,3.6,0xdcb767],[9,12,3.6,.4,0xb26a4e]
        ]){
          const geometry=new CylinderGeometry(tip,base,length,8);
          geometry.rotateZ(-Math.PI/2);geometry.translate(start+length/2,0,0);
          geometry.rotateY(yaw);geometry.translate(x,y,z);p.add(geometry,color);
        }
      }
      const belt:Pin[]=[[-57,-175],[-57,-99],[-37,-59],[5,4]];
      for(let i=1;i<belt.length;i++){
        const [x,z]=belt[i-1],[ex,ez]=belt[i];
        const dx=ex-x,dz=ez-z,length=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz);
        p.box((x+ex)/2,.38,(z+ez)/2,39,.55,length+2,rubber,yaw);
        for(let step=7;step<length;step+=15){
          const cx=x+dx*step/length,cz=z+dz*step/length;
          cartridge(cx,6,cz,yaw+.28*Math.sin(step*.11));
          p.box(cx,11,cz,8,4,12,rubber,yaw);
        }
      }
      p.box(7,4,11,54,7,43,metal,-.54);
      for(const x of [-13,29])p.box(x,11,14,7,14,45,edge,-.54);
      for(const [x,z,yaw] of [[5,15,.84],[15,22,-.62],[-14,43,.28],[-33,35,1.23],[12,55,-.12]])
        cartridge(x,z<30?16:6,z,yaw);
      break;
    }
    case 'transmission-chamber':
      // Flat reel beside the severed line; the broken end curls back on the flanges.
      p.rod([99,1,43],[99,3,43],22,rubber);p.rod([99,3,43],[99,6,43],18,0x81755d);
      p.rod([99,6,43],[99,8,43],21,metal);p.rod([99,8,43],[99,9,43],8,rubber);
      for(const x of [-12,12])p.box(99+x,8.6,43,5,1,16,rubber,.5);
      run([[101,61],[89,69],[67,67],[61,56],[69,44]],2,2.1,0x8d806c);
      for(const z of [-5,5])run([[170,-61+z],[84,-61+z],[48,-24+z],[z,0],[z-45,18]],6,5,0x746c59);
      // An offset reflector cups the waveguide. Its exposed back has three radial ribs.
      for(let i=0;i<16;i++){
        const rim=(n:number):[number,number,number]=>{
          const a=n*Math.PI/8;
          return [-43+10*Math.cos(a),22+18*Math.cos(a),24*Math.sin(a)];
        };
        p.face([[-25,19,0],rim(i),rim(i+1)],i%4?0x91a4a6:0x778e94);
        p.rod(rim(i),rim(i+1),1.5,edge);
        if(i%5===0)p.rod(rim(i),[-53,24,0],1.2,metal);
      }
      // Flared receiver horn with an exposed throat on the guide axis.
      for(const side of [-1,1]){
        p.face([[5,8,side*7],[-42,4,side*31],[-42,23,side*31],[5,18,side*7]],0xa9bbbe);
        p.rod([-42,23,side*31],[5,18,side*7],2,edge);
      }
      p.face([[-42,4,-31],[-42,4,31],[5,8,7],[5,8,-7]],metal);
      p.rod([-24,15,0],[14,15,0],5,0x95c9dc);
      for(const x of [-14,14])p.box(x,10,-x*.35,5,19,35,edge,.42);
      break;
    case 'crew-checkpoint':
      // A toppled queue post rests on its weighted shoe below the recessed lamp.
      p.rod([76,1,66],[76,3,66],14,rubber);
      p.rod([76,3,66],[42,4,54],3,edge);
      p.box(76,3,66,22,3,13,metal,-.27);
      for(const z of [-23,23])p.box(8,20,z,9,39,8,metal);
      p.box(8,41,0,12,7,55,edge);
      p.box(36,25,-18,67,9,11,0xb79867,.19,-.42);
      p.box(34,4,-9,112,7,35,rubber,.20);
      for(let k=0;k<9;k++)p.box(-13+k*12,8,-k*2.4,4,3,33,metal,.20);
      p.box(0,12,0,43,7,29,edge,-.2);p.box(0,16,0,35,2,22,0x799ba4,-.2);
      p.box(4,20,-1,19,8,13,0xd5b37e,-.38);break;
    case 'shielding-gate':
      // Detached tongue and pin rest beneath the inspection lamp.
      p.face([[70,2,-54],[103,4,-76],[117,5,-66],[94,4,-45]],metal);
      p.rod([79,3,-54],[102,3,-70],3,edge);
      p.box(92,4,-64,18,4,10,rubber,.18);
      p.face([[-133,4,-37],[-133,42,-37],[-100,42,-37],[-84,22,-37],[-84,4,-37]],metal);
      p.rod([-133,42,-37],[-100,42,-37],4,edge);
      p.box(-122,36,-36,14,63,14,metal);
      for(const y of [47,58])p.box(-122,y,-36,15,5,15,0xc3a461);
      for(const side of [-1,1]){
        p.box(-59,5,side*36,140,9,16,metal);
        for(let i=0;i<6;i++){
          const x=-122+i*23+(side+1)*5;
          p.face([[x,10,side*29],[x+19,10,side*29],[x+14,9,side*4],[x+4,9,side*4]],0xb0b0ad);
          p.face([[x+4,9,side*4],[x+14,9,side*4],[x+14,2,side*4],[x+4,2,side*4]],rubber);
        }
      }
      for(let i=0;i<17;i++){
        const x=-104+i*9,z=10*Math.sin(i*.32);
        p.box(x,3,z,14,5,9,i%2?metal:0x555c60,.17*Math.cos(i*.32));
        if(i%2===0)p.box(x,6,z,7,1,4,rubber);
      }
      p.rod([0,1,0],[0,8,0],17,metal);
      for(let k=0;k<6;k++)p.box(0,6,0,38,5,6,edge,k*Math.PI/6);
      p.rod([0,8,0],[0,12,0],8,rubber);
      for(const z of [-16,16])p.box(29,6,z,76,10,6,edge,.15);
      p.box(29,14,0,69,13,34,0x78839b,.15);
      for(const x of [8,30,52])p.box(x,22,-(x-30)*.15,7,4,35,metal,.15);
      break;
    case 'manual-control-chamber':
      for(const z of [-7,0,7])run([[-182,-4+z],[-145,24+z],[-64,26+z],[-29,10+z],[0,z]],4,3,z===0?0x928170:rubber);
      p.box(0,7,0,58,14,42,metal);
      p.box(0,15,0,50,2,35,rubber);
      p.box(0,17,-23,53,5,25,0x344448,0,.18);
      for(const x of [-19,-8,7])p.rod([x,17,-12],[x+8,19,14],2.3,0xd69a69);
      for(let i=0;i<5;i++)p.box(-14+i*7,14,0,4,4,15,0x84ad9c);
      break;
    case 'coolant-plant':
      // The split return header fans rivulets and ice plates sideways.
      for(const [dx,dz] of [[-78,39],[-56,67],[-23,78],[18,66]]){
        p.face([[-12,2,-15],[dx*.5-8,2,dz*.4],[dx,1,dz],[dx*.53+7,2,dz*.55],[5,3,-7]],0x628084);
      }
      for(const x of [-10,10])run([[-32+x,-144],[-32+x,-88],[x,-49],[x,0],[x+10,44]],2,2.6,metal);
      for(let i=0;i<10;i++){
        const x=-7+5*Math.sin(i*2),z=-48+i*9;
        p.face([[x-5,2,z],[x+5,3,z-8],[x+9,2,z+4],[x+1,2,z+8]],i%2?0x899fa1:0x70898c);
      }
      p.rod([-26,11,4],[26,11,4],11,0x6e939a);
      for(const x of [-23,-14,-5,4,13,22])p.rod([x,11,4],[x+3,11,4],13,0x82999a);
      for(const z of [-89,-78])p.box(-33,8,z,28,5,5,0xc7aa77);
      p.rod([-20,22,8],[21,22,8],2.8,0x8b9d9b);
  }
  brokenLaneEnd(p,id,0);
  const articulated=['transmission-chamber','crew-checkpoint','shielding-gate'].includes(id);
  p.finish(root,'lane-machine-'+id,end[0],end[1],undefined,articulated);
}
