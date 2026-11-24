import {addIncidentLane} from './IncidentLaneMachines';
import {incidentLanes} from '../lighting/IncidentLaneLayouts';
import type {Group} from 'three';
import {IncidentPieces} from './Inc13StoryIncidents';

import {laneTerminal} from '../lighting/LaneWorklight';

type Pin=[number,number];

export function addLaneMachine(root:Group,id:string){
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
      for(const z of [-7,0,7])run([[216,-56+z],[132,-56+z],[86,-12+z],[5,-12+z]],4,2.8,rubber);
      p.box(0,5,0,57,9,35,metal);p.box(0,10,-1,48,2,28,0x35474d);
      for(const x of [-16,-5,6,17])p.box(x,13,-1,7,6,22,0x697e77);
      p.box(0,12,18,29,5,4,edge);break;
    case 'service-shaft-landing':
      run([[140,220],[109,174],[81,121],[18,9],[-13,-14],[-72,-29]],3,2.8,0x827769);
      p.rod([0,1,0],[0,6,0],25,rubber);p.rod([0,6,0],[0,8,0],21,metal);
      for(let k=0;k<3;k++){const a=k*Math.PI/3;p.box(0,9,0,40,3,4,edge,a);}
      p.rod([0,9,0],[0,13,0],5,0xb6a578);break;
    case 'armory':
      for(const x of [-11,11])run([[-57+x,-118],[-55+x,-78],[-23+x,-48],[x,0],[x+23,28]],3,2.5,metal);
      p.box(0,4,0,37,7,49,rubber,-.45);
      for(const x of [-9,9])p.box(x,10,0,6,14,37,metal,-.45);
      p.box(1,12,8,17,8,29,0x9b8969,-.45);break;
    case 'transmission-chamber':
      for(const z of [-5,5])run([[170,-61+z],[84,-61+z],[48,-24+z],[z,0],[z-45,18]],6,5,0x746c59);
      p.box(0,8,0,32,14,31,metal,.42);
      for(const x of [-14,14])p.box(x,10,-x*.35,5,19,35,edge,.42);
      break;
    case 'crew-checkpoint':
      p.box(34,4,-9,112,7,35,rubber,.20);
      for(let k=0;k<9;k++)p.box(-13+k*12,8,-k*2.4,4,3,33,metal,.20);
      p.box(0,12,0,43,7,29,edge,-.2);p.box(0,16,0,35,2,22,rubber,-.2);
      p.box(4,20,-1,19,8,13,0x847053,-.38);break;
    case 'shielding-gate':
      for(let i=0;i<17;i++){
        const x=-104+i*9,z=10*Math.sin(i*.32);
        p.box(x,3,z,14,5,9,i%2?metal:0x555c60,.17*Math.cos(i*.32));
        if(i%2===0)p.box(x,6,z,7,1,4,rubber);
      }
      p.rod([0,1,0],[0,8,0],17,metal);
      for(let k=0;k<6;k++)p.box(0,6,0,38,5,6,edge,k*Math.PI/6);
      p.rod([0,8,0],[0,12,0],8,rubber);break;
    case 'manual-control-chamber':
      for(const z of [-7,0,7])run([[-182,-4+z],[-145,24+z],[-64,26+z],[-29,10+z],[0,z]],4,3,z===0?0x928170:rubber);
      p.box(0,6,0,38,12,27,metal);
      for(let i=0;i<5;i++)p.box(-14+i*7,14,0,4,4,15,0x84ad9c);
      break;
    case 'coolant-plant':
      for(const x of [-10,10])run([[-32+x,-144],[-32+x,-88],[x,-49],[x,0],[x+10,44]],2,2.6,metal);
      for(let i=0;i<10;i++){
        const x=-7+5*Math.sin(i*2),z=-48+i*9;
        p.face([[x-5,2,z],[x+5,3,z-8],[x+9,2,z+4],[x+1,2,z+8]],i%2?0x899fa1:0x70898c);
      }
      for(const z of [-8,-2,4,10])p.box(0,4,z,24,3,3,edge);
  }
  p.finish(root,'lane-machine-'+id,end[0],end[1]);
}
