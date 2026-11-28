import {paintTransmissionBus} from './TransmissionBus';
import type {Point,RoomTemplate} from '../../game/roguelike/types';
import {shipInteriorFurnishings} from '../../game/roguelike/shipInteriorFurnishings';

// Profiles are cross-sections of the actual working surface: the route, a
// worn edge and the small hardware repeated along the adjacent service bay.
type Surface=readonly [bearing:number,width:number,tread:string,trail:string,contents:string];
const surfaces:Record<string,Surface>={
 'awakening-bay':[.1,102,'M0 -30h44v60H0 M7 -24v48','M-297 114Q-182 109 -137 51T-59 -8','M-4 0l3 -9 9 2 -1 5Z'],
 'passenger-vault':[-.45,124,'M0 -38h49v76H0 M5 -26h38','M-152 202Q-117 130 -84 96T35 14','M-4 -8q9 -1 9 8l-4 9 -6 -2Z'],
 'residential-gallery':[0,96,'M0 -29h66v58H0Z M8 -19l13 19 -13 19 M31 -19l13 19 -13 19','M-273 81Q-175 104 -112 64T47 12','M-6 0q4 -8 12 -4l-7 10Z'],
 'communal-atrium':[.17,118,'M0 0q12 -16 24 0t24 0 M12 -9q-6 -20 -16 -18q0 15 16 18 M32 8q6 15 18 14q-3 -12 -18 -14','M-228 -119Q-136 -111 -84 -42T37 45','M-8 0Q1 -10 10 -2Q5 6 -8 0Z'],
 'crew-checkpoint':[Math.PI/2,85,'M0 -30h18v60H0Z M24 -31h5v62h-5 M37 -22l12 22 -12 22','M-129 -205Q-147 -120 -65 -46T60 40','M-5 -3h11v6H-5Z'],
 armory:[0,88,'M0 -24h37l10 5 -10 5H0Z M0 1h49l13 6 -13 6H0Z','M-258 -122Q-131 -102 -86 -51T4 6','M-6 -2h10l4 2 -4 2H-6Z'],
 'freight-hold':[.12,138,'M0 -42h30v12H9v13H0Z M0 42h30V30H9V17H0Z','',''],
 'coolant-plant':[-.16,108,'M0 -28h51v56H0Z M8 -22v44m8 -44v44m8 -44v44m8 -44v44m8 -44v44','',''],
 'transmission-chamber':[0,120,'M0 -25h22l21 25 -21 25H0 M9 -17h10l14 17 -14 17H9 M43 0h20','',''],
 'breached-loading-bay':[-.32,129,'M0 -28h38l21 14 M0 28h31l17 -18','M-134 -245Q-101 -179 -61 -110T39 40','M-8 -3l15 -4 -6 10Z'],
 'relay-racks':[0,97,'M0 -20h24l14 14h25 M0 -12h20l14 14h29 M0 -4h16l14 14h33','M-190 147Q-95 137 -68 78T26 -21','M-4 -7h9v8l-4 6Z'],
 'diagnostic-gallery':[1.57,105,'M0 -30q-9 0 -9 12v32q0 15 10 15h49v-59Z M5 -19h14v37H5Z','M-204 171Q-137 148 -93 122T-4 66','M-6 1l4 -6 9 1 -3 8Z'],
 'safety-interlock-station':[0,84,'M0 -23h15v15h-15Z M48 -23h15v15H48Z M9 -11l32 -17 M55 -9v30H9v-22','M-230 -83Q-171 -86 -100 -36T32 20','M-6 -2l7 -3 5 5 -8 4Z'],
 'service-shaft-landing':[.72,99,'M0 -27v54 M8 -27v54 M19 -22l15 -8 15 8 M34 -30v58','M235 204Q157 121 92 93T4 12','M-10 0q7 -5 17 1l-7 2Z'],
 'infested-workshop':[0,122,'M0 -19h42v38H0Z M7 -10h28v7H7Z M7 4h28v7H7Z M48 -19v38','M-212 102Q-110 114 -53 67T26 -9','M-7 0q2 -8 10 -6l-3 3 -4 2 9 4 -4 3Z'],
 'swarm-junction':[-.37,98,'M0 -15q15 -23 30 -1l-7 -2 -4 6 -6 -5 -7 6Z M35 9q13 -18 26 0l-8 -3 -4 5Z','M-148 -121Q-118 -69 -54 6T22 114','M-8 1q5 -13 16 -3l-3 4 -5 -3 -2 3Z'],
 'shielding-gate':[0,105,'M0 -23h64 M0 23h64 M9 -18h22l-5 18H15Z','M-209 99Q-122 79 -77 54T57 -38','M-5 -2h11v5H-5Z'],
 'containment-annulus':[-.58,117,'M0 -23q32 8 61 3 M0 -12q35 9 61 3 M12 -25v20 M45 -23v20','M-233 -114Q-174 -70 -102 -47T38 22','M-11 -1q11 2 18 -3l-2 5 -13 2Z'],
 'manual-control-chamber':[0,93,'M0 -19h26v37H0Z M5 -13h13v13H5Z M26 3h15v12h24 M46 -12h17v12H46Z','M-236 73Q-164 102 -103 49T21 24','M-7 -3h10v3h5v4H-7Z'],
 'overload-floor':[.13,121,'M0 -19h52v38H0Z M9 -23v46 M21 -23v46 M33 -23v46 M45 -23v46','M-194 -114Q-148 -64 -94 -44T36 48','M-7 -4l11 2 3 6 -13 -2Z'],
};

export function paintWorkingLane(c:CanvasRenderingContext2D,room:RoomTemplate,arena:Point){
 const surface=surfaces[room.id];if(!surface)return;
 const [bearing,width,tread,trail,contents]=surface;
 c.save();c.translate(arena.x,arena.y);c.rotate(bearing);
 const reach=Math.hypot(room.width,room.height);
 // Long working aisles alternate between worn paint, bare plate and inset service panels.
 for(let y=-960;y<=960;y+=320){
  c.fillStyle='rgba(167,165,149,.32)';c.fillRect(-reach,y-width/2,reach*2,width);
  c.fillStyle='rgba(14,23,29,.58)';c.fillRect(-reach,y+width/2+8,reach*2,68);
  const shape=new Path2D(tread);
  for(let x=-Math.ceil(reach/80)*80;x<reach;x+=80){
   if(y!==0 && x%160===0){
    const z=y+width/2+32;
    if(room.id==='passenger-vault'){
     c.fillStyle='#768384';c.fillRect(x,z-10,44,32);
     c.fillStyle='#27343b';c.fillRect(x+7,z-5,30,17);
     c.fillStyle='#a19479';c.fillRect(x+8,z+13,9,4);
    }else if(room.id==='overload-floor'){
     c.fillStyle='#917052';c.fillRect(x,z,160,13);
     c.fillStyle='#86908c';c.fillRect(x+24,z-14,11,29);c.fillRect(x+41,z+12,11,16);
    }else if(room.id==='freight-hold'){
     for(const rail of [-13,13]){
      c.fillStyle='#849496';c.fillRect(x,z+rail,145,6);
      c.fillStyle='#343c42';c.fillRect(x+23,z+rail-4,13,14);
     }
    }
   }
   if(Math.abs(y)<160 && Math.abs(x)<280){
    c.fillStyle='rgba(136,145,141,.56)';
    for(let rib=0;rib<80;rib+=10)c.fillRect(x+rib,y+width/2+11,3,60);
    continue;
   }
   c.save();c.translate(x,y+width/2+42);c.strokeStyle='rgba(137,147,139,.45)';c.lineWidth=2.4;c.stroke(shape);c.restore();
  }
 }
 c.restore();
 if(room.id==='transmission-chamber')paintTransmissionBus(c,arena,room.width,false);
 c.save();c.translate(arena.x,arena.y);
 if(trail){
  const line=new Path2D(trail);
  c.strokeStyle='rgba(32,32,28,.45)';c.lineWidth=12;c.stroke(line);
  c.translate(2,-3);c.strokeStyle='rgba(155,146,122,.49)';c.lineWidth=2.5;c.stroke(line);
  // Deposit along the curve, with increasingly sparse fragments toward its tail.
  const n=trail.match(/-?\d+/g)!.map(Number);
  const [ax,ay,bx,by,cx,cy,ex,ey]=n;
  for(let i=1;i<24;i++){
   const t=Math.sqrt(i/24)*2,u=t%1,v=1-u;
   const x=t<1?v*v*ax+2*u*v*bx+u*u*cx:v*v*cx+2*u*v*(2*cx-bx)+u*u*ex;
   const y=t<1?v*v*ay+2*u*v*by+u*u*cy:v*v*cy+2*u*v*(2*cy-by)+u*u*ey;
   c.save();c.translate(x+9*Math.sin(i*2),y+13*Math.cos(i*4));c.rotate(i*2.4);
   c.fillStyle=i%3?'#7f8378':'#9a9381';c.fill(new Path2D(contents));c.restore();
  }
 }
 c.restore();
 for(const f of shipInteriorFurnishings(room)){
  if(!/console|locker|cabinet|terminal/.test(f.asset))continue;
  c.save();c.translate(f.x,f.z);c.rotate(-f.angle);c.fillStyle='rgba(161,152,132,.19)';
  c.fill(new Path2D('M-32 18Q-6 10 33 18L26 42Q3 54 -26 40Z'));c.restore();
 }
}
