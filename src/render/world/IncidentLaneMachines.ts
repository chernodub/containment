import type {Group} from 'three';
import {IncidentPieces} from './Inc13StoryIncidents';

import type {IncidentLaneLayout} from '../lighting/IncidentLaneLayouts';

/** Longitudinal coordinates put the machine socket at zero and the lane fitting at L. */
export function addIncidentLane(root:Group,id:string,layout:IncidentLaneLayout):void {
  const [sx,sz,ex,ez]=layout;
  const L=Math.hypot(ex-sx,ez-sz),angle=Math.atan2(ez-sz,ex-sx);
  const p=new IncidentPieces(), steel=0x859694, iron=0x4e6061, boot=0x354447;
  const ochre=0x9c8666, ice=0x8caeb1, green=0x617a58;
  function box(x:number,y:number,z:number,w:number,h:number,d:number,color:number,turn=0){
    p.box(x,y,z,w,h,d,color,turn);
  }
  function pipe(x:number,z:number,end:number,side:number,h:number,r:number,color:number){
    p.rod([x,h,z],[end,h,side],r,color);
  }
  function disc(x:number,y:number,z:number,r:number,h:number,color:number){
    p.rod([x,y,z],[x,y+h,z],r,color);
  }
  function rails(gauge:number){
    for(const side of [-1,1])box(L/2,3,side*gauge,L,5,5,steel);
  }
  switch(id){
    case 'awakening-bay':{
      // The insulated hose sags between the pod outlet and a twist-lock thaw head.
      const knots=[[0,0],[L*.23,14],[L*.46,9],[L*.68,-17],[L*.83,-21],[L,0]];
      for(let i=1;i<knots.length;i++){
        const [x,z]=knots[i-1],[end,side]=knots[i];
        pipe(x,z,end,side,5,6,boot);pipe(x,z+6,end,side+6,3,2.6,ice);
        box(x,6,z,9,11,15,steel);
      }
      // Empty thaw blanket lies open along the hose, with two raised bolsters.
      box(L-37,4,22,80,6,46,0x749c9d,-.16);
      for(const z of [4,41])pipe(L-72,z-6,L-4,z+5,7,4.5,ice);
      disc(L,1,0,20,5,iron);disc(L,6,0,14,6,ice);
      box(L+6,12,0,26,5,8,steel);break;
    }
    case 'passenger-vault':
      box(L/2,4,0,L,8,35,boot);rails(18);
      for(let x=8;x<L;x+=13)pipe(x,-14,x,14,8,3,iron);
      for(const [x,z,t,c] of [[L-34,0,.12,ochre],[L+2,17,-.48,0x657784]]){
        box(x,12,z,33,13,19,c,t);box(x,19,z,4,2,19,boot,t);
        box(x+3,18,z-10,11,3,4,steel,t);
      }
      // A child's coat spills over the open case, sleeves hanging off both edges.
      p.face([[L-50,20,-8],[L-39,22,-13],[L-33,21,-6],[L-25,22,-10],[L-13,12,1],[L-19,10,6],[L-27,18,1],[L-25,19,16],[L-45,20,19],[L-47,16,4],[L-54,11,8],[L-59,10,4]],0xbb8067);
      break;
    case 'residential-gallery':
      rails(21);
      for(const x of [L-110,L-40])for(const z of [-21,21])disc(x,2,z,9,7,iron);
      box(L-75,10,0,94,8,52,ochre);box(L-75,15,0,83,3,42,steel);
      box(L-116,19,0,6,12,50,iron);
      box(L,6,0,44,8,26,iron,.1);
      for(const x of [L-16,L+16])for(const z of [-10,10])
        p.rod([x,7,z],[x,16,z],2,steel);
      box(L,16,0,44,3,27,ochre);disc(L-9,18,2,7,2,0xa5aea4);
      disc(L+7,18,-3,5,7,0x748385);break;
    case 'communal-atrium':
      pipe(0,0,L,0,4,4,0x756e53);
      for(let x=22;x<L;x+=40){pipe(x,0,x+9,13,3,2.5,iron);disc(x+9,4,13,4,3,steel);}
      p.rod([L-13,10,-8],[L+15,8,3],13,0x85745d);
      p.rod([L+12,8,2],[L+17,8,4],15,0x9a8b70);
      for(let i=0;i<9;i++){
        const a=i*2.4,tip=L+22+Math.cos(a)*19,z=5+Math.sin(a)*18;
        p.face([[L+12,8,3],[tip-4,6,z-4],[tip,11,z],[tip+6,5,z+4]],i%2?green:0x86926d);
      }break;
    case 'freight-hold':
      rails(17);
      for(let x=12;x<L;x+=38)box(x,4,0,9,6,36,iron);
      for(const z of [-17,17]){box(L-10,8,z,43,11,9,ochre);box(L-3,15,z,22,3,9,steel);}
      box(L-22,8,0,10,10,42,boot);
      for(const [x,z,t] of [[L-6,0,0],[L+10,4,.25],[L+27,18,-.43],[L+43,28,.72]]){
        box(x,5,z,11,10,26,0x9cae91,t);
        box(x,11,z,10,2,8,0xd8c693,t);
      }
      break;
    case 'breached-loading-bay':
      for(const s of [-1,1]){
        pipe(0,s*6,L*.46,s*20,5,3.8,0x8a8271);
        pipe(L*.46,s*20,L,s*8,4,3.8,0x8a8271);
      }
      // Fallen open-web gantry spans the direction of travel.
      for(const x of [L-49,L-21])box(x,7,0,6,10,138,iron);
      for(let i=0;i<6;i++)pipe(L-49,-68+i*22,L-21,-46+i*22,8,3.4,steel);
      box(L,4,0,34,7,32,iron);disc(L,7,0,10,10,boot);
      box(L,18,0,31,5,10,steel,.32);break;
    case 'diagnostic-gallery':
      box(L/2,3,0,L,6,14,iron);box(L/2,7,0,L,2,5,steel);
      disc(L,5,0,15,7,boot);disc(L,12,0,10,4,steel);
      p.rod([L,15,0],[L+16,19,25],4,steel);
      box(L+17,17,25,25,9,15,0x648785,-.35);
      for(const x of [-6,6])disc(L+17+x,22,25,4,2,ice);
      disc(L+26,1,41,20,4,iron);
      p.rod([L+37,4,46],[L+37,22,46],4,steel);
      p.rod([L+37,22,46],[L+21,22,40],3,steel);
      disc(L+21,14,40,6,8,ice);
      // Patient cradle crosses the probe axis. A scalloped headrest and paired
      // restraint straps interrupt the continuous pale upholstered bed.
      box(L+17,7,79,47,9,105,iron);box(L+17,14,79,39,6,99,0x9fb9b2);
      for(const x of [L-2,L+36])pipe(x,43,x,120,17,3.5,steel);
      for(const x of [L+7,L+27])box(x,19,41,9,8,15,ice);
      for(const z of [72,103])box(L+17,18,z,40,2,6,boot);
      break;
    case 'safety-interlock-station':
      box(L/2,3,0,L,5,23,boot);rails(12);
      box(L*.66,6,0,L*.67,7,11,ochre);
      for(const x of [L-28,L-10,L+8])box(x,8,0,8,9,26,steel);
      box(L+13,5,0,12,9,36,iron);
      for(let i=0;i<4;i++){
        const x=L-49,z=i*32-33;
        disc(x,1,z,10,4,iron);
        p.rod([x,5,z],[x+8+i*5,21-i*3,z+6],4,ochre);
      }
      break;
    case 'infested-workshop':
      box(L/2,4,0,L,6,29,iron);rails(15);
      for(let i=0;i<15;i++){
        const x=L-16+i*2,z=12*Math.sin(i*.8)+i*.6;
        pipe(x,z,x+8,z+5*Math.cos(i),7,2.6,i%3?steel:ochre);
      }
      box(L+10,3,0,39,4,42,boot);break;
    case 'swarm-junction':
      pipe(0,0,L,0,6,9,iron);pipe(L*.68,0,L-4,-34,6,7,iron);
      for(let x=14;x<L;x+=32)pipe(x,0,x+5,0,6,11,steel);
      disc(L,1,0,17,8,boot);
      for(let i=0;i<5;i++)box(L-9+i*4,10,0,2.5,4,23,0x977e91);
      break;
    case 'containment-annulus':
      for(let i=0;i<5;i++){
        const x=(i+.5)*L/5,z=18*Math.sin((i+.5)*Math.PI/5);
        const turn=-Math.atan(18*Math.PI/L*Math.cos((i+.5)*Math.PI/5));
        box(x,5,z,L/5+4,9,26,iron,turn);
        box(x,11,z+6,L/5-3,4,7,steel,turn);
      }
      for(let i=0;i<7;i++){
        const a=i*.20,x=L-12+56*Math.sin(a),z=56*(Math.cos(a)-1);
        box(x,8,z,15,13,28,0x648884,a);
        box(x,16,z,12,3,18,0x93b7ad,a);
      }
      disc(L-12,10,0,9,6,0x749589);break;
    case 'overload-floor':
      pipe(0,0,L,0,6,10,0x697d78);
      for(let x=14;x<L;x+=41)pipe(x,0,x+7,0,6,12,iron);
      pipe(L-3,0,L+17,16,6,10,0x697d78);
      box(L,3,0,66,6,42,boot);
      for(const z of [-20,20])box(L,12,z,68,21,4,iron);
      p.box(L+5,13,-33,65,4,22,steel,.08,.22);
      for(const x of [-22,-11,0,11,22])pipe(L+x,-15,L+x,15,10,4,0xffb56c);
      break;
  }
  const mesh=p.finish(root,'lane-machine-'+id,sx,sz);
  mesh.rotation.y=-angle;
}
