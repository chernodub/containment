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
};

export function paintWorkingLane(c:CanvasRenderingContext2D,room:RoomTemplate,arena:Point){
 const surface=surfaces[room.id];if(!surface)return;
 const [bearing,width,tread,trail,contents]=surface;
 c.save();c.translate(arena.x,arena.y);c.rotate(bearing);
 const reach=Math.hypot(room.width,room.height);
 // Long working aisles alternate between worn paint, bare plate and inset service panels.
 for(let y=-960;y<=960;y+=320){
  c.fillStyle='rgba(149,148,131,.15)';c.fillRect(-reach,y-width/2,reach*2,width);
  c.fillStyle='rgba(18,29,33,.26)';c.fillRect(-reach,y+width/2+8,reach*2,68);
  const shape=new Path2D(tread);
  for(let x=-Math.ceil(reach/80)*80;x<reach;x+=80){
   c.save();c.translate(x,y+width/2+42);c.strokeStyle='rgba(137,147,139,.45)';c.lineWidth=2.4;c.stroke(shape);c.restore();
  }
 }
 c.restore();c.save();c.translate(arena.x,arena.y);
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
