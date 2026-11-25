import type {Point} from '../../game/roguelike/types';

type Brush=CanvasRenderingContext2D;
function patch(c:Brush,path:string,color:string){
  c.fillStyle=color;c.fill(new Path2D(path));
}
function seam(c:Brush,path:string,width:number,color:string){
  c.strokeStyle=color;c.lineWidth=width;c.stroke(new Path2D(path));
}

// Folded rubber, chipped enamel and torn fabric keep a contact edge. These
// silhouettes are baked into the supported deck at the actual fight location.
function fragment(c:Brush,path:string,color:string){
  c.save();c.translate(2.5,3.5);patch(c,path,'rgba(14,20,22,.77)');c.restore();
  patch(c,path,color);
}
export function paintLaneAftermath(c:Brush,id:string,arena:Point){
  c.save();c.translate(arena.x,arena.y);c.lineCap='round';c.lineJoin='round';
  switch(id){
    case 'freight-hold':
      // The runners lead to the actual cargo cradle at (741,725).
      for(const offset of [-18,19]){
        c.save();c.translate(0,offset);
        seam(c,'M-40 24 Q-2 24 24 13 T113 -23 Q143 -31 157 -29',7,'#41403a');
        seam(c,'M-40 22 Q-2 22 24 11 T101 -21',2.6,'#95927c');
        c.restore();
      }
      fragment(c,'M-41 23 Q-20 53 9 52 L36 38 62 48 95 35 101 38 91 43 98 42 73 55 59 57 36 47 12 63 Q-29 65 -49 29Z','#938365');
      seam(c,'M-44 28Q-20 59 9 57L36 43 60 52 88 41',1.8,'#c4ac83');
      fragment(c,'M29 35l15 1 3 13 -16 1Z','#51585a');
      patch(c,'M33 38l8 1 2 7 -9 0Z','#9a907b');
      for(const [x,y,a] of [[80,60,.4],[99,67,-.65],[124,61,.18]]){
        c.save();c.translate(x,y);c.rotate(a);
        fragment(c,'M-13 -7h22l5 4v8l-5 3h-22Z','#768b81');
        c.fillStyle='#b9b49a';c.fillRect(-8,-7,4,15);c.fillRect(6,-6,3,13);c.restore();
      }
      break;
    case 'diagnostic-gallery':
      // One rail is still socketed at the foot, the broken mate lies across a caster arc.
      seam(c,'M-46 86Q-6 77 10 56T82 13',4,'#414c4c');
      fragment(c,'M-14 75L4 69 37 40 61 37 67 40 83 34 85 39 65 47 58 43 42 47 12 76 -11 82Z','#91a39d');
      seam(c,'M-10 76L6 71 39 43 58 40',1.8,'#bcc7b5');
      fragment(c,'M36 49Q47 48 48 57 L43 69 49 81 35 80 29 87 24 77 31 63Z','#768d90');
      seam(c,'M33 78Q41 70 39 60',2,'#a7b8ad');
      break;
    case 'transmission-chamber':
      patch(c,'M-20 -27Q12 -41 24 -15L44 6 82 9 91 35 66 36 27 19 4 -6Z','#313d48');
      seam(c,'M-24 -25Q7 -35 17 -12T53 15L71 18',12,'#434d55');
      seam(c,'M-24 -27Q7 -37 17 -14T53 13L70 16',3,'#87989d');
      for(const d of ['M68 16q10 -9 16 -5','M70 19l14 -1 7 5','M70 22q14 5 23 1'])seam(c,d,2.4,'#b89c7d');
      break;
  }
  c.restore();
}
