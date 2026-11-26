import type {IncidentPieces} from './Inc13StoryIncidents';

// Local coordinates at the outer shoe of the original machine. Keep the
// fragments on its service side and below 10 ship units (0.32 m).
export function brokenLaneEnd(p:IncidentPieces,id:string,origin:number){
 const steel=0x909b98,iron=0x47545b,copper=0xbc936b;
 const box=(x:number,z:number,w:number,d:number,h:number,color:number,yaw=0)=>
   p.box(origin+x,h/2,z,w,h,d,color,yaw);
 const tube=(x:number,z:number,h:number,u:number,v:number,k:number,r:number,color:number)=>
   p.rod([origin+x,h,z],[origin+u,k,v],r,color);
 const rim=(x:number,z:number,r:number,h:number,color:number)=>p.rod([origin+x,.5,z],[origin+x,h,z],r,color);
 switch(id){
 case 'crew-checkpoint':
  for(const [x,z] of [[-42,32],[51,56]]){box(x,z,20,16,3,steel,.18);rim(x,z,5,6,iron);}
  tube(-42,32,5,-5,37,8,3.8,steel);tube(-5,37,8,10,55,5,3.8,steel);tube(10,55,5,47,57,5,3.8,copper);break;
 case 'freight-hold':
  box(-27,39,80,17,6,iron,-.23);box(11,44,13,49,8,steel,-.23);
  tube(-60,49,3,-34,61,6,4,copper);tube(-34,61,6,-6,57,5,4,copper);
  for(const x of [-7,8])box(x,58,4,17,7,steel,.17);break;
 case 'transmission-chamber':
  for(const [x,z] of [[-43,31],[-21,31],[1,31]])box(x,z,20,17,7,iron);
  for(const z of [3,59]){
   tube(3,31,5,28,z,7,5,steel);tube(28,z,7,43,z,8,4,copper);
   box(30,z,5,18,9,iron);
  }break;
 case 'awakening-bay':
  box(-19,45,57,35,4,0x607f84,-.21);
  for(let i=0;i<5;i++)tube(-44+i*10,32,4,-37+i*10,60,6,2.6,0xa6c4be);break;
 case 'residential-gallery':
  box(-14,39,48,31,5,0x927d67,-.28);
  for(const [x,z] of [[-3,43],[25,53],[-34,35]]){rim(x,z,9,3,0xa9afa0);rim(x,z,6,4,0x757e77);}break;
 case 'communal-atrium':
  tube(-39,40,6,0,48,6,5,0x716f54);tube(0,48,6,23,39,4,4,0x81795c);
  for(let i=0;i<8;i++){const x=origin-30+i*7,z=44+9*Math.sin(i*2);p.face([[x,4,z],[x+7,9,z-10],[x+17,6,z-11],[x+9,3,z-2]],i%3?0x9da58b:0xc9ab98);}break;
 case 'armory':
  box(-20,42,29,45,5,iron,.27);
  for(let i=0;i<6;i++){const x=-29+i*12,z=44+Math.sin(i*1.9)*9;tube(x,z,4,x+8,z+10,4,3.6,copper);}break;
 case 'breached-loading-bay':
  for(let i=0;i<3;i++){const x=origin-37+i*24;p.face([[x,1,27],[x+23,2,31],[x+31,9,60],[x+18,7,54],[x+8,9,61]],i%2?steel:0x748a91);}break;
 case 'relay-racks':
  box(-15,39,61,15,6,iron,.13);
  for(let i=0;i<7;i++)tube(-40+i*8,39,4,-35+i*9,57+6*Math.sin(i),7,2,copper);break;
 case 'diagnostic-gallery':
  tube(-47,49,4,-16,32,8,3,steel);tube(-16,32,8,22,32,5,3,steel);
  for(const x of [-41,22])rim(x,42,7,5,iron);box(30,45,18,25,5,0x8cb3a6,.33);break;
 case 'safety-interlock-station':
  box(-17,40,48,20,6,0x858b7d,-.25);
  for(const x of [-30,-12]){rim(x,38,7,8,0xb5b3a2);tube(x,39,7,x+17,58,8,3,copper);}break;
 case 'coolant-plant':
  tube(-42,40,5,-7,46,5,5,0x708d95);tube(1,49,6,26,61,4,4,0xa1b8bb);
  for(const x of [-34,-25,-16])tube(x,41,5,x+3,42,5,6,steel);break;
 case 'service-shaft-landing':
  rim(-22,44,19,4,iron);rim(-22,44,15,6,copper);rim(-22,44,8,7,iron);
  tube(-15,58,3,29,48,3,2.6,copper);break;
 case 'infested-workshop':
  rim(-16,43,10,7,iron);for(let i=0;i<4;i++)box(-16+14*Math.cos(i*1.57),43+14*Math.sin(i*1.57),25,8,6,steel,-i*1.57-.4);
  box(34,48,23,8,5,copper,.73);break;
 case 'swarm-junction':
  for(let i=0;i<6;i++){const x=origin-37+i*12,z=45+10*Math.sin(i*1.4);p.face([[x,1,z],[x+3,7,z-9],[x+11,9,z-6],[x+17,1,z+2],[x+9,3,z-1]],i%2?0x9d838e:0xaf9b95);}break;
 case 'shielding-gate':
  box(-16,43,54,24,5,iron,.19);for(let i=0;i<3;i++)box(-35+i*18,50-i*3,12,31,8,steel,.19);break;
 case 'containment-annulus':
  for(let i=0;i<6;i++){const a=.25+i*.23;box(-48+65*Math.sin(a),12+53*Math.cos(a),19,10,7,i%2?steel:0x749a8c,a);}break;
 case 'manual-control-chamber':
  box(-15,45,38,25,6,iron,.16);box(-15,45,25,18,8,0x92ac99,.16);
  for(const x of [-17,-9])tube(x,54,4,x+5,70,4,2,copper);break;
 case 'overload-floor':
  for(const z of [31,47]){tube(-48,z,4,-6,z+6,8,4,copper);tube(6,z+11,7,37,z+5,3,4,copper);}
  for(const x of [-36,-23,25])box(x,41,6,29,7,iron,.14);break;
 case 'passenger-vault':
  box(-28,48,66,35,5,iron,.18);box(-28,48,57,27,7,0x92a9a4,.18);
  box(-48,51,12,26,10,0xb6b6a4,.18);tube(-56,66,3,-1,55,6,3,steel);break;
 }
}
