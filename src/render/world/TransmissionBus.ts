import type {Point} from '../../game/roguelike/types';

// Feed and return diverge around the middle gland. A narrow stripe on the
// upper shoulder of each jacket gives the bundle a round section at play scale.
export function paintTransmissionBus(c:CanvasRenderingContext2D,arena:Point,roomWidth:number,accents:boolean){
 c.save();c.translate(arena.x,arena.y);
 for(const aisle of [-320,320]){
  c.save();c.translate(0,aisle+92);
  for(let x=Math.floor(-arena.x/160)*160;x<roomWidth-arena.x;x+=160){
   c.save();c.translate(x,0);
   for(const [index,offset] of [-15,0,15].entries()){
    const path=new Path2D();
    path.moveTo(0,offset);path.bezierCurveTo(50,offset,61,offset+12,88,offset+12);
    path.bezierCurveTo(115,offset+12,126,offset,160,offset);
    if(!accents){
     c.strokeStyle='#18262c';c.lineWidth=14;c.stroke(path);
     c.strokeStyle=index===1?'#8e614a':'#566b72';c.lineWidth=10;c.stroke(path);
    }
    c.save();c.translate(0,-3);c.strokeStyle=index===1?'#be8e68':'#889f9f';
    c.lineWidth=accents?3:4;c.stroke(path);c.restore();
   }
   if(!accents){
    c.fillStyle='#323d40';c.fillRect(18,-24,17,49);c.fillRect(106,-16,14,46);
    c.fillStyle='#9c9782';c.fillRect(20,-22,6,45);c.fillRect(108,-14,5,42);
   }else{
    c.clearRect(18,-24,17,49);c.clearRect(106,-16,14,46);
    c.fillStyle='#aca389';c.fillRect(20,-22,5,45);c.fillRect(108,-14,4,42);
   }
   c.restore();
  }
  c.restore();
 }
 c.restore();
}
