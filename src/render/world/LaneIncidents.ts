import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {passengerObservationTexture} from './EquipmentDetail';
import {IncidentPieces} from './Inc13StoryIncidents';

type Pin = [number,number,number];
const iron=0x3e4a51, steel=0x859397, cut=0xb6bdaf, brass=0xad9167;
function cable(p:IncidentPieces,path:Pin[],r:number,color:number) {
  for(let i=1;i<path.length;i++)p.rod(path[i-1],path[i],r,color);
}

// Build the visible lens in the same coordinate system as its fixed light slot.
function lit(root:T.Group,p:IncidentPieces,id:string,x:number,z:number,lamps:Pin[],color:number){
  const body=p.finish(root,id,x,z,undefined,true);
  const glass=new IncidentPieces();
  for(const [u,h,v] of lamps)glass.box(u,h,v,10,2,4,color);
  const lens=glass.finish(root,id+'-lens',x,z,new T.MeshBasicMaterial({vertexColors:true}));
  lens.castShadow=false;
  const [u,h,v]=lamps[0];
  body.userData.lightFixtures=[{x:u/32,y:h/32+.2,z:v/32,color,nativeColor:true,gain:.68,distance:4.8,poolWidth:1.15,poolDepth:3.2}];
}

export function addLaneIncident(root:T.Group,id:string){
  const p=new IncidentPieces();
  switch(id){
    case 'shielding-gate': {
      // The U-shaped guide shoe has lost one roller and torn its studs in shear.
      p.box(0,4,0,62,8,34,iron,-.14);
      for(const s of [-1,1]){
        p.face([[-32,6,s*14],[-18,20,s*17],[18,19,s*13],[31,10,s*12],[29,6,s*13]],steel);
        p.rod([-18,17,s*16],[18,16,s*13],2.2,cut);
        p.rod([12,10,s*10],[12,10,s*16],7,iron);
        for(const x of [-23,24])p.rod([x,5,s*11],[x+2,10,s*11],3,brass);
      }
      p.rod([-12,10,-10],[-12,10,9],7,steel);
      p.box(-22,14,-3,17,5,8,iron);
      lit(root,p,'fractured-guide-shoe',574,515,[[-22,17,-3]],0xc2d5ce);
      break;
    }
    case 'freight-hold': {
      // Trace a wide length of folded webbing from the old eye to a sprung ratchet.
      const path:Pin[]=[[0,3,0],[22,6,22],[61,3,38],[86,7,67],[101,3,75],[121,3,84]];
      for(let i=1;i<path.length;i++){
        const [a,h,b]=path[i-1],[c,k,d]=path[i];
        p.face([[a-5,h,b+5],[a+5,h,b-5],[c+5,k,d-5],[c-5,k,d+5]],i%2?0xb29770:0x937858);
        p.rod([a-4,h+.6,b+4],[c-4,k+.6,d+4],.9,cut);
      }
      for(let j=0;j<6;j++)p.rod([118+j*1.7,3,89-j*1.5],[124+j*2.5,2,97-j*1.3],1.1,brass);
      p.box(155,3,106,42,5,33,iron,-.48);
      for(const j of [-1,1])p.box(150+j*9,8,104,4,11,27,steel,-.35);
      p.rod([138,10,105],[157,10,111],6,brass);
      p.face([[137,6,100],[148,6,93],[138,4,88],[131,4,91],[130,4,88],[126,4,93]],0xab906c);
      cable(p,[[143,12,108],[153,24,125],[164,24,122],[156,12,106]],2.5,cut);
      lit(root,p,'cargo-web-ratchet',550,531,[[169,7,112]],0xe4c891);
      break;
    }
    case 'infested-workshop': {
      // Split casting, exposed spindle, and a branching root mat leaving its jaws.
      p.box(0,16,0,54,30,43,iron);
      p.box(-20,39,0,15,29,43,steel);
      p.rod([-16,35,0],[18,35,0],8,brass);
      p.box(19,22,0,12,19,35,steel,.17);
      for(let i=0;i<5;i++){
        const a=i-2;
        const stem:Pin[]=[[a*5,36,3],[a*8,24,22],[a*11,5,46],[19+a*8,3,77],[28+a*13,2,112],[60+a*10,2,145],[69+a*15,1,174]];
        for(let k=1;k<stem.length;k++){
          const [x,h,z]=stem[k-1],[u,y,v]=stem[k],w=8-k*.85;
          p.face([[x-w,h,z],[x,h+w,z],[u,y+w*.7,v],[u-w,y,v]],i%2?0x895373:0x653f60);
          p.face([[x,h+w,z],[x+w,h,z],[u+w,y,v],[u,y+w*.7,v]],0xa16b83);
          if(k===4||k===5)p.rod([u,y+1,v],[u+a*13,y,v+15],1.8,0x825169);
        }
      }
      lit(root,p,'split-mill-and-roots',577,319,[[-20,55,8]],0xcfb5cc);
      break;
    }
    case 'manual-control-chamber': {
      // The berth repeater uses a pillow, dark canopy and separate life lamp per passenger.
      p.box(0,11,0,114,21,34,iron);
      const lamps:Pin[]=[];
      for(let i=0;i<5;i++){
        const x=-44+i*22;
        p.box(x,23,0,18,5,28,steel);
        p.box(x,26,0,13,3,20,0x324956);
        p.box(x,29,-7,10,3,6,0xd1d6c6);
        lamps.push([x,28,9]);
      }
      for(const z of [-5,4])cable(p,[[-56,15,z],[-68,5,z+2],[-84,4,z-12],[-105,14,z-13],[-117,27,z-14]],2.6,brass);
      p.box(-117,26,-13,21,7,21,iron);
      p.rod([-123,30,-12],[-109,30,-12],3,cut);
      // Fit the vault's actual occupied-window image into each status bezel.
      const windows=Array.from({length:5},(_,i)=>new T.PlaneGeometry(14/32,20/32)
        .rotateX(-Math.PI/2).translate((547+i*22)/32,28/32,585/32));
      const texture=passengerObservationTexture();
      const material=new T.MeshBasicMaterial({map:texture,color:0xa5c3c3});
      material.userData.actorMaterial=true;
      material.addEventListener('dispose',()=>texture.dispose());
      const bank=new T.Mesh(mergeGeometries(windows)!,material);
      windows.forEach(g=>g.dispose());bank.name='inc13-occupied-berth-windows';root.add(bank);
      lit(root,p,'wired-berth-repeater',591,585,lamps,0x9bd6c2);
      break;
    }
  }
}
