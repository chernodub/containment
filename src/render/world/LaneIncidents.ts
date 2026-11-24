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
  for(const [u,h,v] of lamps){
    if(id==='forked-safety-isolator')glass.box(u,h,v,21,2.5,16,color);
    else glass.box(u,h,v,10,2,4,color);
  }
  const lens=glass.finish(root,id+'-lens',x,z,new T.MeshBasicMaterial({vertexColors:true}));
  lens.castShadow=false;
  const [u,h,v]=lamps[0];
  body.userData.lightFixtures=[{x:u/32,y:h/32+.2,z:v/32,color,nativeColor:true,gain:.68,distance:4.8,poolWidth:1.15,poolDepth:3.2}];
}

export function addLaneIncident(root:T.Group,id:string){
  const p=new IncidentPieces();
  switch(id){
    case 'armory': {
      // Seat the loading shoes on the visible imported carousel's upper hoop.
      // Its 1.02 m bearing radius and 2.2 m height use a 1.65 / 1.3 placement.
      for(let i=0;i<8;i++){
        const a=i*Math.PI/4,x=54*Math.cos(a),z=54*Math.sin(a);
        p.box(x,92,z,17,4,11,0x455b61,-a);
        p.box(x*.96,95,z*.96,12,3,10,0x2b3734,-a);
        p.box(x*1.12,95,z*1.12,5,3,12,0x9eaa9d,-a);
      }
      p.finish(root,'carousel-handling-shoes',515,488).userData.cutawayAsset='armory-weapon-carousel';
      break;
    }
    case 'residential-gallery': {
      // A wall-folding supper table has landed on its side with two stools.
      p.box(0,20,0,72,5,46,0x80644e,-.20,1.05);
      for(const z of [-16,17]){
        p.rod([4,23,z],[30,7,z-4],3,iron);
        p.rod([30,7,z-4],[36,8,z+6],2,steel);
      }
      for(const [x,z] of [[-30,19],[31,-29]]){
        p.box(x,8,z,21,8,20,0x586865,.3,.36);
        p.rod([x,6,z],[x+9,2,z+9],2,steel);
      }
      for(const [x,z] of [[12,31],[19,48],[-9,39]]){
        p.rod([x,1,z],[x,3,z],7,0xaaa798);
        p.rod([x,3,z],[x,3.8,z],4.7,0x747872);
      }
      lit(root,p,'overturned-supper-table',531,432,[[-18,29,-14]],0xbca781);
      break;
    }
    case 'crew-checkpoint': {
      // Rubber conveyor slats pass between the scanner's two uprights.
      p.box(0,3,0,88,5,45,iron);
      for(let x=-37;x<40;x+=10)p.box(x,6,0,7,2,38,0x414f51);
      for(const side of [-1,1]){
        p.box(0,23,side*25,22,45,9,0x526d74);
        p.box(0,37,side*20,12,16,3,steel);
        p.rod([-16,8,side*23],[17,8,side*23],2,cut);
      }
      p.box(0,48,0,23,9,59,0x60777a);
      lit(root,p,'inspection-throat',503,395,[[0,53,0],[26,8,0]],0x9cccc4);
      break;
    }
    case 'breached-loading-bay': {
      // The rolled tear is attached to the existing rib, with exposed
      // sandwich construction visible along the lifted, serrated free lip.
      const sections:Pin[]=[[-25,21,-84],[-21,19,-48],[-12,15,-16],[0,20,12],[14,11,48],[19,5,67]];
      for(let i=1;i<sections.length;i++){
        const [x,h,z]=sections[i-1],[u,k,v]=sections[i];
        p.face([[x-9,2,z],[x,h,z],[u,k,v],[u-9,2,v]],0x899ca5);
        p.face([[x,h,z],[x+8,h-3,z],[u+8,k-3,v],[u,k,v]],cut);
        p.face([[x+8,h-3,z],[x+3,3,z],[u+3,3,v],[u+8,k-3,v]],iron);
        p.rod([u-8,3,v],[u+1,k,v-4],2.1,steel);
      }
      p.box(-12,15,-13,19,5,11,iron,-.28);
      p.box(-12,19,-19,17,4,6,0x344348,-.28);
      lit(root,p,'peeled-laminated-lip',602,612,[[-12,18,-13]],0xc7e3e0);
      break;
    }
    case 'swarm-junction': {
      // Three duct throats converge on a bolted valve chest and handwheel.
      p.box(0,10,0,57,18,41,iron);
      for(const [u,v] of [[-65,4],[51,-39],[52,42]]){
        p.rod([0,10,0],[u,7,v],9,steel);
        p.rod([u*.68,8,v*.68],[u*.75,8,v*.75],13,brass);
      }
      p.rod([1,13,1],[1,24,1],4,brass);
      for(let i=0;i<8;i++){
        const a=i*Math.PI/4,b=a+Math.PI/4;
        p.rod([1+17*Math.cos(a),25,1+17*Math.sin(a)],[1+17*Math.cos(b),25,1+17*Math.sin(b)],2.3,cut);
        if(i%2===0)p.rod([1,24,1],[1+16*Math.cos(a),25,1+16*Math.sin(a)],1.7,steel);
      }
      for(let j=0;j<4;j++){
        const s=j*5;
        cable(p,[[-91,2,47+s],[-47,3,27+s],[-28,15,14+s],[-12,22,6+s],[7,18,12+s],[26,7,16+s],[49,3,27+s]],3.2-j*.35,0x94607c);
      }
      p.rod([-15,25,1],[-11,25,12],3.4,0x353b38);
      p.box(17,21,-12,14,4,9,iron);
      lit(root,p,'colonised-duct-manifold',552,432,[[17,24,-12]],0xbecfa8);
      break;
    }
    case 'diagnostic-gallery': {
      // An open examination hoop has a cyan emitter over the recorder bed.
      p.box(0,18,0,47,7,63,steel);
      const arc:Pin[]=[];
      for(let k=0;k<=8;k++){
        const a=k*Math.PI/8;
        arc.push([25*Math.cos(a),22+30*Math.sin(a),-11]);
      }
      cable(p,arc,5,cut);
      p.box(0,24,7,20,3,35,iron);
      lit(root,p,'diagnostic-read-head',425,481,[[0,55,-11],[0,26,14]],0x8cdbe6);
      break;
    }
    case 'safety-interlock-station': {
      // A forked mechanical isolator with two sleeved uprights and a bridging blade.
      for(const x of [-22,22]){
        p.rod([x,2,0],[x,33,0],7,iron);
        for(const h of [12,21,30])p.rod([x,h,0],[x,h+4,0],10,0xa09270);
      }
      p.rod([-22,35,0],[15,53,5],4.4,brass);
      p.box(14,53,5,18,8,12,iron);
      lit(root,p,'forked-safety-isolator',509,453,[[-22,36,0],[22,36,0]],0xffe5a1);
      break;
    }
    case 'shielding-gate': {
      // The U-shaped guide shoe has lost one roller and torn its studs in shear.
      p.box(0,4,0,62,8,34,iron,-.14);
      for(const s of [-1,1]){
        p.face([[-32,6,s*14],[-18,20,s*17],[18,19,s*13],[31,10,s*12],[29,6,s*13]],steel);
        p.rod([-18,17,s*16],[18,16,s*13],2.2,cut);
        p.rod([12,10,s*10],[12,10,s*16],7,iron);
        for(const x of [-23,24])p.rod([x,5,s*11],[x+2,10,s*11],3,brass);
      }
      // A cocked bogie still straddles the guide behind the detached shoe.
      p.box(-64,13,-28,57,12,37,0x636b76,-.39,.10);
      for(const side of [-1,1]){
        p.rod([-73,10,-29+side*14],[-73,10,-29+side*22],10,iron);
        p.rod([-47,9,-19+side*13],[-47,9,-19+side*20],8,steel);
      }
      p.face([[-83,20,-46],[-48,23,-33],[-38,23,-20],[-59,21,-24],[-84,19,-33]],0x9c997f);
      p.rod([-46,16,-18],[-28,11,-6],4,steel);
      p.box(-62,22,-29,23,5,14,0x444c47,-.39);
      // The flanges diverge where the carriage pulled the guide out of gauge.
      for(const side of [-1,1]){
        cable(p,[[-118,3,-38+side*6],[-77,3,-40+side*6],[-50,5,-24+side*8],[-32,7,-4+side*10]],2.8,side<0?steel:cut);
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
      p.rod([151,24,125],[164,24,122],4.1,0x393e38);
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
        const stem:Pin[]=[[a*5,36,3],[a*8,24,22+i*3],[a*12,5,46+i*5],
          [9+a*12+12*Math.sin(i*2),4,79-i*4],[32+a*17,3,108+i*5],
          [51+a*16+16*Math.cos(i),2,138+i*5],[58+a*24,1,153+i*9]];
        for(let k=1;k<stem.length;k++){
          const [x,h,z]=stem[k-1],[u,y,v]=stem[k],w=8-k*.85;
          p.face([[x-w,h,z],[x,h+w,z],[u,y+w*.7,v],[u-w,y,v]],i%2?0x895373:0x653f60);
          p.face([[x,h+w,z],[x+w,h,z],[u+w,y,v],[u,y+w*.7,v]],0x865669);
          if(k===4||k===5)p.rod([u,y+1,v],[u+a*13,y,v+15],1.8,0x825169);
        }
      }
      // Blistered tissue bridges the veins in patches, leaving open deck between lobes.
      for(const [x,y,z,w,h,d] of [[0,31,9,23,15,27],[-23,12,42,29,11,15],[17,8,42,8,6,10],
        [-11,4,80,7,4,19],[65,6,98,23,9,13],[46,4,119,9,5,7],[101,2,157,6,3,11]]){
        p.add(new T.IcosahedronGeometry(1,1).scale(w,h,d).rotateY(z*.03).translate(x,y,z),0x76475e);
        p.add(new T.IcosahedronGeometry(1,0).scale(w*.38,h*.35,d*.5).translate(x-w*.3,y+h*.78,z-d*.14),0x895b70);
      }
      p.face([[-31,6,57],[10,11,44],[27,5,78],[10,4,70],[-9,7,83]],0x8e627c);
      p.face([[17,5,90],[47,8,100],[66,4,136],[48,5,118],[29,4,122]],0x98697e);
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
      for(const x of [-49,0,49])p.box(x,20,17,14,8,4,0x394641);
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
