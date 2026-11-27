import {MeshBasicMaterial,type Group} from 'three';
import {IncidentPieces} from './Inc13StoryIncidents';

/** Ship-plan coordinates along the service edges. These are fragments of the
 * displaced equipment, with the centre aisle reserved for the encounter. */
export function addFightLaneDamage(root:Group,id:string){
  const p=new IncidentPieces();
  switch(id){
    case 'passenger-vault':{
      // The exposed south wall cap is at 32 ship units. Torn pan ribs
      // straddle it where the displaced berth train caught the bulkhead.
      const rack=new IncidentPieces();
      for(const [x,z,turn] of [[359,794,-.22],[446,790,.10],[533,795,-.09]]){
        rack.box(x,33,z,73,2,35,0x384650,turn);
        rack.box(x,35,z,60,2,25,0x58686b,turn);
        rack.box(x-14,38,z,8,5,32,0x87938e,turn);
        rack.rod([x-31,36,z-17],[x+14,41,z-19],2.7,0x718683);
        rack.rod([x+14,41,z-19],[x+29,37,z-8],2.7,0x718683);
      }
      rack.finish(root,'berth-train-wall-impact',0,0,new MeshBasicMaterial({vertexColors:true}));
      for(const [x,z,h] of [[148,527,16],[366,523,22],[588,516,28],[810,517,17],[323,794,41]]){
        // A deep folded berth pan, a torn padded back and two empty rail eyes.
        p.box(x,h*.5,z,72,h,12,0x445660,-.07);
        p.box(x,h,z-4,66,5,22,0x7e9292,-.07,-.05);
        for(const dx of [-27,27])p.box(x+dx,h*.6,z-10,6,9,10,0x39464b);
      }
      break;
    }
    case 'crew-checkpoint':
      for(const [x,z,h] of [[272,342,8],[469,344,17],[658,341,12],[867,343,23]]){
        p.box(x,3,z,26,6,22,0x45494a);
        p.rod([x,4,z],[x+7,h+7,z],4,0x61686a);
        p.rod([x+7,h+7,z],[x+54,7,z+9],3.7,0x9a8763);
      }
      break;
    case 'transmission-chamber':
      for(const [x,z] of [[435,575],[573,591],[735,590],[899,575]]){
        // Broken rectangular guides retain a hollow mouth and bolted flange.
        p.box(x,3,z,77,6,21,0x474e51);
        for(const side of [-1,1])p.box(x,9,z+side*10,77,13,3,0x766e60);
        p.box(x-8,16,z,60,3,22,0x7f8176);
        p.box(x-29,10,z,6,20,28,0x5c6462);
      }
      break;
    case 'overload-floor':{
      // The shot enters from the south-east. Keep the right-hand upper
      // corner on the native clipped ray and run the feed west behind it.
      const lip=new IncidentPieces();
      // A battered steel sill straddles the feed. The sloping end and
      // recessed panel breaks expose the stopping face from the approach.
      for(let panel=0;panel<4;panel++){
        const x=-98+panel*24.5,end=x+24.5,mid=(x+end)/2;
        const top=-x/7,endTop=-end/7,foot=-x*.22,endFoot=-end*.22;
        lip.box(mid,17,-8,24.5,34,16,0x485352);
        lip.face([[x,35,-18],[x,35,0],[end,35,0],[end,35,-18]],0x9b9e8b);
        lip.face([[x,32,top],[end,32,endTop],[end,35,0],[x,35,0]],0x777c6b);
        lip.face([[x,2,foot],[end,2,endFoot],[end,32,endTop],[x,32,top]],0x556264);
        lip.rod([x,32,top],[end,32,endTop],1.8,0xd7ac69);
      }
      lip.face([[0,2,0],[0,2,-18],[0,35,-18],[0,35,0]],0x364043);
      lip.box(-2,18,-7,5,35,24,0x796446);
      for(const x of [-90,-64,-38]){
        const front=-x*.092;
        lip.face([[x,22,front+.6],[x+19,22,front-1.2],[x+19,29,front-1.2],[x,29,front+.6]],0x353b3d);
        lip.box(x+7,35.2,-2,16,.7,2.6,0xab6335);
        lip.box(x+2,35.3,-11,1.3,.6,8,0x3e4645);
      }
      lip.rod([-95,12,-10],[-163,6,-27],4,0x58605a);
      lip.rod([-95,9,-18],[-160,5,-34],3,0x805f4c);
      // Painted steel values stay readable on the dark feeder bank. The
      // short orange return around the corner follows the reactor casing.
      lip.rod([0,32,0],[0,35,0],1.8,0xd7ac69);
      lip.rod([0,35,0],[0,35,-18],2.2,0xd7ac69);
      lip.rod([0,35,-18],[0,1,-19],2.2,0xd7ac69);
      lip.rod([0,1,-19],[0,1,-64],2.2,0xbfa278);
      lip.rod([0,1,-64],[-58,1,-64],2.2,0xbfa278);
      for(const dx of [-89,-69,-36,-16])lip.box(dx,35.3,-14,4,.8,2,0x59605a);
      const steel=new MeshBasicMaterial({vertexColors:true});
      const sill=lip.finish(root,'reactor-feeder-refuge',833.71249,349.81813,steel,true);
      sill.scale.y=1.48;
      sill.castShadow=true;sill.receiveShadow=true;
      for(const [x,z] of [[185,648],[382,660],[575,700],[816,704],[1014,649]]){
        p.box(x,3,z,54,6,32,0x374245);
        for(const dx of [-15,0,15]){
          p.rod([x+dx,6,z],[x+dx,15,z],6,0x556d6b);
          p.box(x+dx,16,z+4,8,5,38,0x937557,0,.12);
        }
      }
      break;
    }
    default:return;
  }
  p.finish(root,'lane-edge-'+id,0,0,undefined,true);
}

export function paintFightLaneDamage(c:CanvasRenderingContext2D,id:string){
  function line(path:string,width:number,color:string){
    c.strokeStyle=color;c.lineWidth=width;c.stroke(new Path2D(path));
  }
  c.save();
  switch(id){
    case 'passenger-vault':
      // Each torn wheel channel is 16 ship units (0.5 m) wide. The two
      // displaced lips retain the gauge even where one wheel skipped.
      for(const gauge of [-24,24]){
        c.save();c.translate(0,gauge);
        const path='M70 414Q163 412 271 452T480 449Q572 430 684 449T1000 444';
        line(path,19,'#a9a899');line(path,15,'#242d31');
        c.translate(0,2);line(path,7,'#485355');
        for(const x of [201,376,502,698,850,972]){
          c.fillStyle='#7b8480';c.fill(new Path2D('M'+x+' 447l12 -5 4 2 -14 7Z'));
        }
        c.restore();
      }
      // The empty bed stays straight. The displaced continuous steel rail
      // climbs out of it, leaving its slotted mounting shoes behind.
      line('M80 421H990',14,'#202a30');
      for(let x=100;x<990;x+=53){c.fillStyle='#6a797b';c.fillRect(x,415,13,12);c.fillStyle='#242a2c';c.fillRect(x+3,418,7,6);}
      line('M80 422L318 423 522 458 684 470 990 441',13,'#20272a');
      line('M80 417L318 418 522 453 684 465 990 436',8,'#aec0b7');
      break;
    case 'crew-checkpoint':{
      const arc='M178 453Q255 369 384 405T634 456Q747 399 885 441T1128 421';
      line('M180 454H1100',12,'#30343a');
      line(arc,36,'#252b30');line(arc,30,'#96958a');
      c.save();c.translate(0,-5);line(arc,8,'#616567');c.restore();
      for(const x of [302,517,731,945]){
        c.save();c.translate(x,421);c.rotate(.17);
        c.fillStyle='#353438';c.fillRect(-25,-11,50,24);
        c.fillStyle='#ac966f';c.fill(new Path2D('M-25 7L-8 -14 3 -16 24 6 13 7 -6 -6 -18 9Z'));
        c.restore();
      }
      // One shoe pivots, skids and tears loose, leaving a fan of rubber.
      for(const [x,z,a] of [[284,397,-.28],[461,430,.25],[700,436,-.31],[926,447,.14],[1098,428,-.25]]){
        c.save();c.translate(x,z);c.rotate(a);
        c.fillStyle='#353536';c.fill(new Path2D('M-36 -6Q-21 -12 5 -11L26 -8 17 -5 32 -3 17 -1 23 4 -9 7Z'));
        c.fillStyle='#73726a';c.fillRect(-6,-10,14,18);
        c.fillStyle='#232b2c';c.fillRect(-3,-6,8,10);c.restore();
      }break;
    }
    case 'transmission-chamber':{
      const channel='M326 494H472L518 534H593L614 554H755L822 484H893';
      c.lineJoin='bevel';
      line(channel,41,'#8b8f8a');line(channel,34,'#233038');
      line(channel,20,'#38474a');
      const bus='M323 491H471L518 531H594L615 551H753L820 481H925';
      line(bus,10,'#39271e');line(bus,6,'#ca9974');
      line('M739 550l6 -6 4 4 4 -3',9,'#202830');
      // Bolted lengths of twin conductor are interrupted at each turnout.
      for(const [x,z,length] of [[336,494,122],[528,534,55],[623,554,119],[830,484,52]]){
        for(const rail of [-7,7])for(let dx=0;dx<length;dx+=27){
          c.fillStyle=rail<0?'#b2aaa0':'#9f9280';c.fillRect(x+dx,z+rail-2,Math.min(21,length-dx),5);
        }
        for(let dx=23;dx<length;dx+=27){
          c.fillStyle='#596970';c.fillRect(x+dx,z-14,4,28);
        }
      }break;
    }
    case 'overload-floor':
      const feed='M190 533L326 551 468 568 591 683 833 683 994 645V519L832 355';
      line(feed,26,'#252a2c');line(feed,18,'#80705f');line(feed,8,'#413e39');
      for(const [x,z] of [[257,542],[393,560],[531,628],[657,683],[756,683],[896,668],[994,590],[919,444]]){
        c.fillStyle='#43494a';c.fillRect(x-7,z-17,14,34);c.fillStyle='#b57c48';c.fillRect(x-4,z-12,5,24);
      }
      c.save();c.translate(833.71249,349.81813);
      c.fillStyle='#172126';c.fill(new Path2D('M-98 -15H-2V-67H-98Z'));
      line('M1 3V-65H-61',5,'#b6976e');
      const shade=c.createLinearGradient(0,-14,0,-56);
      shade.addColorStop(0,'rgba(6,11,13,.90)');shade.addColorStop(1,'rgba(6,11,13,0)');
      c.fillStyle=shade;c.fill(new Path2D('M-101 2H0L-25 -54 -123 -49Z'));c.restore();
      for(const [x,z] of [[172,512],[315,538],[449,562],[615,680],[832,684],[950,568]]){
        c.save();c.translate(x,z);
        for(const [i,s] of [-31,-13,8,29].entries()){
          c.fillStyle=i%2?'rgba(63,49,40,.64)':'rgba(71,57,49,.71)';
          c.fill(new Path2D('M-49 -6Q-12 -9 48 '+s+'L16 '+(s+2)+' -45 3Z'));
        }c.restore();
      }break;
  }
  // The return legs cross the approach and retreat banks. Paint the hardware
  // into the clipped deck atlas so a broken track never bridges a void.
  const banks:Record<string,readonly [number,number,number][]>={
    'passenger-vault':[[270,450,-.36],[806,447,.29]],
    'crew-checkpoint':[[358,405,.24],[874,441,-.34]],
    'transmission-chamber':[[423,494,-.37],[851,484,.43]],
    'overload-floor':[[356,554,.42],[764,683,-.24]],
  };
  for(const [x,y,turn] of banks[id]??[]){
    c.save();c.translate(x,y);c.rotate(turn);
    if(id==='passenger-vault'){
      for(const rail of [-23,23]){
        c.save();c.translate(rail,0);
        line('M0 -288V-80L7 -15V280',17,'#29363a');
        line('M-4 -288V-80L3 -15V280',5,'#97a59e');
        for(let y=-267;y<279;y+=53){
          c.fillStyle='#687a79';c.fillRect(-10,y,26,8);
          c.fillStyle='#263336';c.fillRect(-6,y+2,6,4);
        }
        c.restore();
      }
    }else if(id==='crew-checkpoint'){
      for(const [offset,angle] of [[-193,-.19],[-63,.05],[70,.36],[198,-.12]]){
        c.save();c.translate(0,offset);c.rotate(angle);
        const shoe='M-17 -60Q23 0 2 58';
        line(shoe,31,'#333839');line(shoe,22,'#8a8473');line(shoe,9,'#383e40');
        for(const y of [-51,48]){c.fillStyle='#363938';c.fillRect(-14,y,21,5);}
        c.restore();
      }
    }else if(id==='transmission-chamber'){
      line('M0 -295V275',19,'#253239');line('M0 -295V275',7,'#bd8060');
      for(let y=-260;y<275;y+=67){
        c.fillStyle='#394d51';c.fillRect(-14,y-11,28,22);
        c.fillStyle='#9eafa8';
        for(const dy of [-9,-1,7])c.fillRect(-13,y+dy,26,3);
      }
    }else{
      line('M0 -270V266',29,'#353b39');line('M-3 -270V266',16,'#8a6a50');
      for(let y=-247;y<260;y+=77){
        c.fillStyle='#343b3e';c.fillRect(-24,y-12,48,24);
        c.fillStyle='#a49b88';c.fillRect(-23,y-8,46,9);
        c.fillStyle='#353a38';for(const x of [-20,15])c.fillRect(x,y-6,5,5);
      }
    }
    c.restore();
  }
  c.restore();
}
