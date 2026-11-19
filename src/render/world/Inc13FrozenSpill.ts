import * as T from 'three';
import {creepingVapour,paintIncidentDeck} from './Inc13DeckPaint';

/** Solid ice follows the north header and pours through the west opening. */
export function addFrozenSpill(root:T.Group):void {
  paintIncidentDeck(root,'inc13-frozen-discharge',[24,164,800,426],c=>{
    // The lip spreads around the turbine pad and breaks into separate fingers
    // at the west entrance. The deck remains visible through the thin grey rim.
    const rim=new Path2D('M 263 183 Q 320 197 370 219 Q 520 193 620 250 L 784 276 760 299 650 302 602 319 594 360 557 370 519 366 504 384 479 382 460 402 417 398 388 414 362 407 333 427 309 426 Q 262 449 232 482 L 209 487 171 523 147 522 115 545 82 549 105 531 78 536 117 507 99 501 146 474 137 463 177 430 159 427 171 404 147 406 182 374 173 365 206 349 205 340 248 329 261 318 Z');
    c.save();c.clip(rim);
    const ice=c.createLinearGradient(389,243,207,516);
    ice.addColorStop(0,'rgba(131,158,164,.93)');ice.addColorStop(.46,'rgba(106,140,149,.87)');
    ice.addColorStop(.79,'rgba(92,125,133,.72)');ice.addColorStop(1,'rgba(107,144,150,.49)');
    c.fillStyle=ice;c.fillRect(24,164,800,426);
    // Broad interlocking plates give the sheet body well before the cracks resolve.
    let seed=20463;
    const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    for(let row=0;row<7;row++)for(let col=0;col<11;col++){
      const x=34+col*73+row%2*31,y=170+row*58;
      c.fillStyle=rand()>.46?'rgba(200,220,222,.10)':'rgba(48,82,95,.10)';
      c.beginPath();c.moveTo(x-28,y+5);c.lineTo(x-11,y-21);c.lineTo(x+32,y-16);
      c.lineTo(x+47,y+10);c.lineTo(x+24,y+31);c.lineTo(x-15,y+25);c.closePath();c.fill();
    }
    for(const d of ['M405 301l-37 31-30 3-18 27-53 15-16 17-53 23-43 39','M341 336l-19-18-28-2-15-14',
      'M319 362l11 22-18 30','M402 308l29 14 12 28 26 5 11 26','M441 349l-20 11-12 26',
      'M486 279l26 17 4 19 36 14 15 26','M199 417l6 22-39 31-10 32','M598 274l31 4 13 13 44-1']){
      const crack=new Path2D(d);c.strokeStyle='rgba(35,65,75,.66)';c.lineWidth=2.3;c.stroke(crack);
      c.save();c.translate(-1,.9);c.strokeStyle='rgba(203,221,223,.65)';c.lineWidth=.9;c.stroke(crack);c.restore();
    }
    for(let i=0;i<1300;i++){
      const x=54+rand()*730,y=174+rand()*398;
      c.fillStyle='rgba(217,233,230,.15)';c.fillRect(x,y,.6+rand()*2,.5+rand()*.8);
    }
    // The oil-stained deck shows through near the perimeter. A soft mask
    // leaves a translucent band, interrupted by islands of granular frost.
    c.globalCompositeOperation='destination-out';c.strokeStyle='rgba(0,0,0,.38)';
    c.lineJoin='round';c.lineWidth=16;c.stroke(rim);c.lineWidth=6;c.stroke(rim);
    c.globalCompositeOperation='source-over';
    c.strokeStyle='rgba(171,195,197,.41)';c.lineWidth=1.3;c.stroke(rim);
    c.restore();
  },.022);
  creepingVapour(root,[[396,320,210,74,-.14],[310,374,232,75,.47],[215,430,170,58,.63]]);
}
