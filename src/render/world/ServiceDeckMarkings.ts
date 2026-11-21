import type {Point,RoomTemplate} from '../../game/roguelike/types';

type Profile = readonly [mark:string, pitch:number, span:number, yaw:number];
const profiles: Record<string,Profile> = {
  'awakening-bay':['CRYO 01',318,225,0],
  'passenger-vault':['BERTH 02',242,212,0],
  'residential-gallery':['CABIN 03',265,184,Math.PI/2],
  'communal-atrium':['GARDEN 04',310,245,.10],
  'crew-checkpoint':['SCREEN 05',262,180,0],
  'armory':['ISSUE 06',292,238,-.18],
  'freight-hold':['CARGO 07',290,192,.12],
  'breached-loading-bay':['DOCK 08',305,215,-.30],
  'relay-racks':['BUS 09',255,198,0],
  'transmission-chamber':['ARRAY 10',309,235,.25],
  'diagnostic-gallery':['TRIAGE 11',292,198,0],
  'safety-interlock-station':['LOCK 12',286,207,0],
  'coolant-plant':['DRAIN 13',252,196,-.26],
  'service-shaft-landing':['LIFT 14',256,218,Math.PI/2],
  'infested-workshop':['LATHE 15',288,214,.15],
  'swarm-junction':['DUCT 16',272,209,-.08],
  'shielding-gate':['GATE 17',288,182,.08],
  'containment-annulus':['SEAL 18',320,224,.30],
  'manual-control-chamber':['BYPASS 19',296,185,0],
  'overload-floor':['CORE 20',262,205,-.15],
};
const joint='#263237',lip='#687472',paint='#969888',bed='#455257',inset='#344247';
type Brush=CanvasRenderingContext2D;

function band(c:Brush,x:number,y:number,w:number,h:number,color:string) {
  c.fillStyle=color;c.fillRect(x,y,w,h);
}
function line(c:Brush,points:readonly number[],width:number,color:string) {
  c.beginPath();c.moveTo(points[0],points[1]);
  for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);
  c.lineWidth=width;c.strokeStyle=color;c.stroke();
}
function grate(c:Brush,x:number,y:number,w:number,h:number,slant:number) {
  band(c,x-2,y-3,w+4,h+6,lip);band(c,x,y,w,h,joint);
  c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
  for(let k=-h;k<w+h;k+=13)line(c,[x+k,y,x+k+slant,y+h],4.5,bed);
  c.restore();
}
function socket(c:Brush,x:number,y:number) {
  band(c,x-10,y-7,20,14,lip);band(c,x-8,y-5,16,10,joint);
  line(c,[x-6,y+1,x+6,y-1],2.5,paint);
}

// Paint an uninterrupted functional system in a strip, with the next bay joined
// exactly at pitch. All measures are ship units. The caller owns the hull clip.
function bay(c:Brush,id:string,w:number) {
  switch(id){
    case 'shielding-gate':
      band(c,0,0,w,39,joint);band(c,0,3,w,6,lip);band(c,0,28,w,5,lip);
      for(let x=0;x<w-25;x+=38)line(c,[x,15,x+20,25],7,'#a19b79');
      band(c,12,42,76,4,paint);break;
    case 'breached-loading-bay':
      band(c,0,0,w,42,bed);band(c,0,3,w,4,paint);band(c,0,34,w*.62,5,paint);
      socket(c,42,19);socket(c,w-45,19);line(c,[82,40,104,55,156,55],3,lip);break;
    case 'freight-hold':
      for(const x of [18,w-52]){band(c,x,0,32,90,bed);socket(c,x+16,13);socket(c,x+16,75);}
      for(const y of [27,57]){band(c,0,y,w,7,joint);band(c,0,y+1,w,2,lip);}
      break;
    case 'relay-racks':
      band(c,0,0,w,35,joint);
      for(const y of [6,14,22])line(c,[0,y,w*.34,y,w*.43,y+7,w*.65,y+7,w*.72,y,w,y],3,lip);
      grate(c,0,-2,w*.24,39,17);grate(c,w*.74,-2,w*.26,39,17);break;
    case 'crew-checkpoint':
      band(c,0,0,w,57,bed);
      for(const y of [3,49])band(c,0,y,w,4,paint);
      for(let x=15;x<w*.68;x+=17)band(c,x,10,6,32,inset);
      line(c,[w*.78,13,w-12,13,w-12,43,w*.78,43],3,lip);break;
    case 'swarm-junction':
      grate(c,0,0,w*.56,38,28);
      for(const y of [6,20,33])line(c,[w*.55,y,w*.67,y-4,w*.72,y+10,w*.85,y-8,w,y+3],5,inset);
      for(const side of [-1,1])line(c,[w*.76,20,w*.78,20+side*17,w*.86,20+side*30,w*.93,20+side*38],3,'#7f8375');
      break;
    case 'coolant-plant':
      band(c,0,0,w,52,bed);grate(c,0,16,w,18,-10);
      for(const x of [18,w*.48])line(c,[x,73,x+24,50,x+24,35],4,lip);break;
    case 'awakening-bay':
      band(c,0,0,w,38,bed);grate(c,w*.18,8,w*.54,21,0);
      line(c,[0,2,w*.76,2,w*.82,13,w,13],4,lip);break;
    case 'passenger-vault':
      for(const y of [0,50]){band(c,0,y,w,8,joint);band(c,0,y,w,2,lip);}
      for(const x of [10,w*.52]){band(c,x,12,w*.42,34,bed);socket(c,x+12,29);}break;
    case 'residential-gallery':
      band(c,0,0,w,58,'#736d60');band(c,0,5,w,3,lip);band(c,0,50,w,3,lip);
      for(let x=8;x<w;x+=23)line(c,[x,11,x+7,23,x,36],2,inset);break;
    case 'communal-atrium':
      band(c,0,0,w,40,'#687267');
      for(let x=0;x<w;x+=52){line(c,[x,0,x+18,20,x,40],5,inset);line(c,[x+18,20,x+46,20],3,lip);}break;
    case 'armory':
      band(c,0,0,w,47,bed);
      for(let x=12;x<w-20;x+=38){band(c,x,7,23,29,joint);band(c,x+4,11,15,5,lip);}break;
    case 'transmission-chamber':
      for(const y of [0,12,24])line(c,[0,y,w*.25,y,w*.45,y+35,w*.66,y+35,w*.85,y,w,y],3,lip);
      grate(c,w*.45,23,w*.2,52,0);break;
    case 'diagnostic-gallery':
      band(c,0,0,w,54,'#606e73');line(c,[0,27,72,27,84,16,99,39,110,26,w,26],3,lip);
      for(let x=18;x<w;x+=48)band(c,x,3,16,4,joint);break;
    case 'safety-interlock-station':
      for(const y of [0,27]){band(c,0,y,w,14,joint);band(c,0,y+3,w,3,lip);}
      for(const x of [44,w*.66]){band(c,x,-8,36,56,bed);socket(c,x+18,18);}break;
    case 'service-shaft-landing':
      grate(c,0,0,w,51,0);for(const x of [32,w*.66])band(c,x,-4,9,60,paint);break;
    case 'infested-workshop':
      band(c,0,0,w,46,bed);
      for(const y of [9,30]){band(c,0,y,w,6,joint);line(c,[17,y,49,y-7,62,y-15],3,lip);}break;
    case 'containment-annulus':
      for(const y of [0,14,26]){c.beginPath();c.moveTo(0,y);c.quadraticCurveTo(w/2,y+48,w,y);c.strokeStyle=y===14?lip:joint;c.lineWidth=y===14?8:5;c.stroke();}break;
    case 'manual-control-chamber':
      band(c,0,0,w,46,joint);
      for(const x of [4,w*.34,w*.67]){band(c,x,3,w*.30,40,bed);band(c,x+7,12,15,4,lip);}
      break;
    case 'overload-floor':
      for(const y of [0,15,30])line(c,[0,y,w*.30,y,w*.38,y+19,w*.63,y+19,w*.72,y,w,y],7,y===15?'#877d69':joint);
      break;
  }
}

export function paintServiceDeck(c:Brush,room:RoomTemplate,arena:Point):void {
  const profile=profiles[room.id];if(!profile)return;
  const [label,pitch,span,yaw]=profile, reach=Math.hypot(room.width,room.height);
  c.save();c.translate(arena.x,arena.y);c.rotate(yaw);
  for(let row=-Math.ceil(reach/span);row<=Math.ceil(reach/span);row++){
    for(let col=-Math.ceil(reach/pitch);col<=Math.ceil(reach/pitch);col++){
      const x=col*pitch+(row%2)*pitch*.28-68,y=row*span-48;
      // Cull in unrotated room coordinates before painting into the small mask.
      const cx=arena.x+x*Math.cos(yaw)-y*Math.sin(yaw),cy=arena.y+x*Math.sin(yaw)+y*Math.cos(yaw);
      if(cx < -pitch || cy < -pitch || cx>room.width+pitch || cy>room.height+pitch)continue;
      c.save();c.translate(x,y);
      c.globalAlpha=.85;bay(c,room.id,pitch);
      // Registration is rolled into the plates and worn where carts pass.
      if((row+col)%2===0){
        c.globalAlpha=.57;c.fillStyle='#a8aea2';c.font='bold 28px Barlow, sans-serif';
        c.fillText(label,8,96);
        c.globalAlpha=.63;band(c,29,70,2,28,bed);band(c,66,70,2,28,bed);
      }
      c.globalAlpha=.35;
      for(let i=0;i<5;i++){
        const xx=13+((i*47+Math.abs(row*17+col*31))%163);
        line(c,[xx,13+i*3,xx+23+i*4,12+i*3],1.8,'#b6b6a8');
      }
      c.restore();
    }
  }
  c.restore();
}
