import type {Point} from '../../game/roguelike/types';

export const coolantRunoff='M-18 -37Q-32 -11 -14 2T-20 25Q-43 38 -70 27T-107 43Q-100 61 -77 53T-30 58Q-9 61 10 36T8 7Q-14 -3 -8 -25Z';

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
    case 'awakening-bay':
      // An opened pod has shed its foil liner. Water follows the flattened pleats.
      patch(c,'M-67 -12Q-42 -9 -43 7T-23 22Q7 23 20 55Q8 50 -6 46T-39 34Q-55 25 -67 -12Z','#647e80');
      fragment(c,'M-58 -6l22 5 10 11 25 6 18 23 -20 -3 -14 4 -14 -13 -16 -5Z','#94a8a2');
      for(const d of ['M-49 1l17 12 11 2','M-32 14l16 13 14 2','M-17 20l14 11 13 5'])seam(c,d,2,'#637f83');
      break;
    case 'passenger-vault':
      // A knitted scarf has caught on the berth latch; a pair of shoes fell apart.
      fragment(c,'M39 15Q17 24 15 41T-13 54Q-38 50 -55 63L-62 52Q-42 39 -18 43T3 28Q12 14 34 9Z','#a28b73');
      for(const x of [-53,-47,-40])seam(c,`M${x} 48l5 11`,2,'#666d68');
      for(const [x,y,a] of [[-19,20,.4],[-43,28,-.7]]){
        c.save();c.translate(x,y);c.rotate(a);fragment(c,'M-6 -9Q-1 -14 5 -9L7 4Q12 14 3 16Q-8 17 -7 8Z','#727575');
        patch(c,'M-3 -6q3 -4 6 0v7h-6Z','#3d4546');c.restore();
      }break;
    case 'residential-gallery':
      patch(c,'M48 -5Q39 14 14 18T-45 39Q-33 56 -9 43T45 24Z','#635d55');
      fragment(c,'M-30 19Q-8 2 5 25L-10 25 -16 35Z','#adb1a4');
      fragment(c,'M-14 39l8 -10 15 0Q6 45 -14 39Z','#979f99');
      fragment(c,'M22 18l-4 -12 8 -7 11 4 3 12 -10 7Z','#959d92');
      seam(c,'M35 3q15 -5 8 9l-5 2',3,'#9aa399');break;
    case 'communal-atrium':
      patch(c,'M42 54Q18 46 9 36T-32 17L-22 12 -50 3 -39 -4 -61 -14Q-34 -19 -14 -7T29 9Q49 26 42 54Z','#615547');
      for(let i=0;i<29;i++){
        const x=25-i*2.65+8*Math.sin(i*4),y=31-i*1.65+15*Math.sin(i*1.87);
        c.save();c.translate(x,y);c.rotate(i*2.4);fragment(c,'M-7 0Q-2 -7 9 -3Q6 4 -7 0Z',i%4===0?'#baa699':'#88967b');c.restore();
      }break;
    case 'crew-checkpoint':
      seam(c,'M-39 6Q-2 16 21 32T58 39',7,'#716b5c');
      fragment(c,'M-37 -2l13 3 8 8 -6 8 -15 -2 -9 -9Z','#85877b');
      seam(c,'M-33 6l39 14',5,'#a3a79a');break;
    case 'armory':
      for(const [x,y,a] of [[-30,-21,.4],[-15,-12,.9],[12,-7,-.3],[19,10,-1],[33,27,.3],[55,22,.8]]){
        c.save();c.translate(x,y);c.rotate(a);fragment(c,'M-8 -3h13l5 3 -5 3h-13Z','#a79570');c.fillStyle='#626657';c.fillRect(-6,-3,2,6);c.restore();
      }break;
    case 'breached-loading-bay':
      patch(c,'M-28 -109L-15 -64 -18 -46 5 -22 4 -9 29 10 46 52 25 19 9 14 -8 -9 -11 -23 -28 -41 -23 -65Z','#38454b');
      fragment(c,'M-17 -52l23 23 12 31 -18 -20 -7 -1Z','#879ca0');
      for(const d of ['M-9 -26Q-32 -60 -35 -110','M14 3Q-13 -28 -16 -63','M29 18Q10 2 2 -14'])seam(c,d,2.6,'#a2b3b2');break;
    case 'relay-racks':
      fragment(c,'M30 -29l8 9 -17 22 -11 0 -19 16 -13 -4 22 -22 12 0Z','#5e7071');
      for(let i=0;i<5;i++)seam(c,`M${-14+i*3} ${9+i}q-13 12 -34 ${10+i*2}`,2,'#b69b81');
      break;
    case 'safety-interlock-station':
      fragment(c,'M39 27L22 24 -7 9 -22 9 -36 -2 -29 -5 -18 2 -13 -3 -23 -12 -18 -17 -2 -6 1 2 30 13Z','#aa9677');
      for(const [x,y] of [[-37,12],[-49,20],[-25,15]]){c.save();c.translate(x,y);fragment(c,'M-6 1l4 -7 9 4 -3 7Z','#adaca2');c.restore();}break;
    case 'coolant-plant':
      patch(c,coolantRunoff,'#66848a');
      seam(c,'M-104 45Q-91 55 -75 48T-31 53Q-14 56 1 38',3.3,'#a5bbb6');
      seam(c,'M-84 37q16 6 26 4m9 3q13 4 25 0',2.5,'#aab9b3');break;
    case 'service-shaft-landing':
      seam(c,'M34 32Q5 22 -21 -5T-71 -29Q-91 -23 -79 -11T-49 -13Q-42 -29 -57 -35',6,'#888273');
      for(const d of ['M-57 -35l-9 -5','M-57 -34q-10 1 -14 -4','M-58 -33l-12 1'])seam(c,d,1.8,'#afa58f');break;
    case 'infested-workshop':
      fragment(c,'M29 -19Q49 -3 33 12L20 16 25 4 18 -4Z','#85928f');
      fragment(c,'M15 19l-13 7 -11 -2 8 -12Z','#9caaa2');
      for(let i=0;i<9;i++){
        c.save();c.translate(-8-i*4,24+10*Math.sin(i*2));c.rotate(i*.79);
        seam(c,'M-4 0q1 -7 6 -4t-1 7',2.3,'#9c9c87');c.restore();
      }break;
    case 'swarm-junction':
      // Shed translucent shells lead out of the pipe mouth. The centre stays free of veins.
      for(const [x,y,a,r] of [[-40,29,.3,1],[-17,36,-.5,.7],[-5,57,1,.6],[4,77,-.3,.8],[20,111,.4,.85]]){
        c.save();c.translate(x,y);c.rotate(a);c.scale(r,r);
        fragment(c,'M-14 3Q-10 -18 6 -14Q19 -8 16 2L9 -2 5 5 0 0 -5 6Z','#968978');
        seam(c,'M-8 -4q6 -10 14 -7',2,'#b0a18b');c.restore();
      }break;
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
