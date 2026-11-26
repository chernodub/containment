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
 case 'passenger-vault':
  box(-28,48,66,35,5,iron,.18);box(-28,48,57,27,7,0x92a9a4,.18);
  box(-48,51,12,26,10,0xb6b6a4,.18);tube(-56,66,3,-1,55,6,3,steel);break;
 }
}
