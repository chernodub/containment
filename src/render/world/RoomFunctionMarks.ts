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
};

export function paintRoomFunction(c:CanvasRenderingContext2D,room:RoomTemplate,arena:Point){
  const stamp=stamps[room.id];
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
