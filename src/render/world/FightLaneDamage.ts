import type {Group} from 'three';
import {IncidentPieces} from './Inc13StoryIncidents';

/** Ship-plan coordinates along the service edges. These are fragments of the
 * displaced equipment, with the centre aisle reserved for the encounter. */
export function addFightLaneDamage(root:Group,id:string){
  const p=new IncidentPieces();
  switch(id){
    case 'passenger-vault':
      for(const [x,z,h] of [[148,527,16],[366,523,22],[588,516,28],[810,517,17],[323,794,41]]){
        // A deep folded berth pan, a torn padded back and two empty rail eyes.
        p.box(x,h*.5,z,72,h,12,0x445660,-.07);
        p.box(x,h,z-4,66,5,22,0x7e9292,-.07,-.05);
        for(const dx of [-27,27])p.box(x+dx,h*.6,z-10,6,9,10,0x39464b);
      }
      break;
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
      lip.box(-40,11,-7,80,22,14,0x344346);
      lip.box(-40,22,-7,80,3,14,0x83918a);
      for(const dx of [-73,-50,-27]){
        lip.box(dx,12,-9,5,23,16,0x556263);
        lip.box(dx,24,-15,7,3,29,0x92806a);
      }
      lip.rod([-76,10,-12],[-167,7,-26],5,0x596768);
      lip.rod([-76,10,-18],[-165,7,-32],3,0x83735f);
      lip.finish(root,'reactor-feeder-refuge',833.71249,349.81813);
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
      for(const gauge of [-29,29]){
        c.save();c.translate(0,gauge);
        const path='M72 419Q178 430 292 470T483 484Q573 465 686 472T1000 465';
        line(path,9,'#434d50');c.translate(0,3);line(path,2.5,'#7a8581');c.restore();
      }break;
    case 'crew-checkpoint':
      line('M205 432Q276 378 414 429T648 444Q750 405 832 432',12,'#4e5050');
      line('M205 437Q276 383 414 434T648 449Q750 410 832 437',3,'#928575');
      break;
    case 'transmission-chamber':
      for(const z of [-7,7]){
        c.save();c.translate(0,z);line('M365 497H551L610 551H743L814 482H888',9,'#424345');c.restore();
      }
      for(let x=620;x<741;x+=17)line('M'+x+' 540v22',4,'#817563');
      break;
    case 'overload-floor':
      for(const [x,z] of [[172,512],[315,538],[449,562],[615,680],[832,684],[950,568]]){
        c.save();c.translate(x,z);
        for(const [i,s] of [-31,-13,8,29].entries()){
          c.fillStyle=i%2?'rgba(63,49,40,.64)':'rgba(71,57,49,.71)';
          c.fill(new Path2D('M-49 -6Q-12 -9 48 '+s+'L16 '+(s+2)+' -45 3Z'));
        }c.restore();
      }break;
  }
  c.restore();
}
