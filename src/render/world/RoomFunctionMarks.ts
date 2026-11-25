import type {Point,RoomTemplate} from '../../game/roguelike/types';

// Each stamp is drawn in ship-plan coordinates into the existing clipped deck skin.
interface Stamp {
  pitch: [number,number];
  grooves: string;
  inset?: string;
  label?: string;
}
const stamps:Record<string,Stamp>={
  'passenger-vault':{pitch:[164,122],grooves:'M12 100V18Q12 10 20 10H102Q111 10 111 18V100 M19 83H104 M19 90H104 M129 9V47 M129 64V103',inset:'M17 16H106V34H17Z',label:'EV'},
  'freight-hold':{pitch:[182,147],grooves:'M12 45V13H50 M132 13H170V45 M170 100V132H132 M50 132H12V100',inset:'M19 20h26l-13 12h-13Z M163 20h-26l13 12h13Z M19 125h26l-13 -12h-13Z M163 125h-26l13 -12h13Z',label:'BAY'},
  'breached-loading-bay':{pitch:[272,168],grooves:'M0 118L37 110 49 114 90 85 108 88 152 63 182 66 216 47 272 43 M90 85L83 60 70 47 M152 63L167 87 192 96',inset:'M39 111L91 78 108 83 153 57 108 91 90 88Z'},
  'transmission-chamber':{pitch:[205,183],grooves:'M21 102A74 74 0 0 1 162 52 M34 106A61 61 0 0 1 152 59 M48 109A47 47 0 0 1 139 66 M90 17V32 M36 38L47 50 M151 34L143 46',label:'RF'},
  'diagnostic-gallery':{pitch:[140,201],grooves:'M22 153V36Q22 17 40 17H88Q106 17 106 36V153 M28 136H100 M35 45Q65 32 94 45',inset:'M42 24H86V32H42Z M16 81H28V101H16Z M100 81H112V101H100Z',label:'BED'},
  'communal-atrium':{pitch:[195,141],grooves:'M0 96H195 M0 103H195 M43 96V59Q43 40 66 40H99 M125 104V125H161',inset:'M62 34Q82 10 105 24Q94 44 62 34Z M149 125Q165 105 180 114Q172 130 149 125Z'},
  'awakening-bay':{pitch:[169,128],grooves:'M18 64Q12 21 48 20H91Q125 22 120 64 M32 59Q29 33 50 32H90 M73 66L49 76 36 72 M50 76L40 88',label:'POD'},
  'residential-gallery':{pitch:[153,168],grooves:'M16 60H127V100H16Z M22 67H121V93H22Z M17 51H126',inset:'M30 80l10 -7 10 7 -10 7Z M54 80l10 -7 10 7 -10 7Z M78 80l10 -7 10 7 -10 7Z',label:'CAB'},
  'crew-checkpoint':{pitch:[130,188],grooves:'M12 0V188 M102 0V188 M17 68H97 M17 74H97 M44 44L58 28 72 44',label:'STOP'},
  armory:{pitch:[195,138],grooves:'M0 30H195 M0 42H195 M18 70h29l13 5 -13 5H18Z M18 88h44l16 6 -16 6H18Z',label:'7.62'},
  'relay-racks':{pitch:[202,163],grooves:'M0 38H61L114 91H202 M0 44H59L112 97H202 M0 50H57L110 103H202 M152 91V58L175 35V0',inset:'M29 30h7v28h-7Z M138 84h7v28h-7Z'},
  'safety-interlock-station':{pitch:[191,124],grooves:'M0 55H58V40H85 M97 40h33v39h61 M58 55v23h42 M72 40l18 -13 M98 78l18 -13',label:'ISO'},
  'coolant-plant':{pitch:[175,147],grooves:'M20 72H119V97H20Z M33 75v19 M47 75v19 M61 75v19 M75 75v19 M89 75v19 M103 75v19 M67 73l-9 -19 -20 -16 M58 54l3 -16',inset:'M23 68Q65 46 99 65T143 95Q119 83 94 74Z'},
  'service-shaft-landing':{pitch:[176,150],grooves:'M20 53h55 M42 38L22 53l20 15 M89 53h55 M123 38l20 15 -20 15',label:'SWL 4t'},
  'infested-workshop':{pitch:[178,144],grooves:'M22 36q0 19 17 17l37 38 8 -9 -37 -36q4 -18 -13 -19l7 12 -9 6Z M89 41l17 -15 14 15 -8 8 -5 -5 -35 39 -5 -5 35 -39 -5 -5Z'},
  'swarm-junction':{pitch:[214,154],grooves:'M0 92Q36 73 58 88T110 72Q125 43 155 57T214 48 M46 84q24 -26 49 -21 M97 87q21 11 32 37 M144 55q7 -14 22 -17',inset:'M60 85q24 -15 38 -6 -22 14 -38 6Z M132 60q10 -22 24 -17 -8 19 -24 17Z'},
  'shielding-gate':{pitch:[202,161],grooves:'M0 38H202 M0 45H202 M0 104H202 M0 111H202',inset:'M49 37h42v10H49Z M124 103h42v10h-42Z'},
  'manual-control-chamber':{pitch:[182,156],grooves:'M0 65H57l24 -26h51 M0 72h62l24 -26h46 M116 32h39v24h-39Z M39 73v30h52',label:'BUS'},
  'overload-floor':{pitch:[178,137],grooves:'M0 34h43l18 18h57l18 -18h42 M0 42h40l18 18h63l18 -18h39 M63 78h53 M63 84h53',label:'BANK'},
};

export function paintRoomFunction(c:CanvasRenderingContext2D,room:RoomTemplate,arena:Point){
  const stamp=stamps[room.id];
  if(room.id==='containment-annulus'){
    // These witness lines share the centre of the sealed core.
    c.save();c.strokeStyle='rgba(152,165,156,.54)';c.lineWidth=3;
    for(let radius=160;radius<990;radius+=87){
      for(const offset of [0,9]){
        c.beginPath();c.ellipse(800,520,radius+offset,(radius+offset)*.76,0,0,2*Math.PI);c.stroke();
      }
    }
    c.restore();return;
  }
  if(!stamp)return;
  const [w,h]=stamp.pitch, grooves=new Path2D(stamp.grooves),inset=new Path2D(stamp.inset??'');
  c.save();c.translate(arena.x%w-w/2,arena.y%h-h/2);
  c.font='bold 17px monospace';
  for(let row=-1;row*h<room.height+h;row++)for(let col=-1;col*w<room.width+w;col++){
    c.save();c.translate(col*w,row*h);
    c.strokeStyle='rgba(12,21,25,.75)';c.lineWidth=6;c.stroke(grooves);
    c.translate(0,2);c.strokeStyle='rgba(156,162,151,.59)';c.lineWidth=2.5;c.stroke(grooves);
    c.fillStyle='rgba(53,63,65,.85)';c.fill(inset);
    if(stamp.label){
      const number=String(1+(row+2)*9+col).padStart(2,'0');
      c.fillStyle='rgba(168,171,154,.65)';c.fillText(stamp.label+' '+number,20,h-9);
    }
    c.restore();
  }
  c.restore();
}
