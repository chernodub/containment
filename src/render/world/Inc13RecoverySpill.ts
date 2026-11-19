import * as T from 'three';
import {environmentClock} from '../lighting/HotFixtureSurface';
import {creepingVapour,paintIncidentDeck} from './Inc13DeckPaint';

export function addRecoverySpill(root:T.Group):void {
  paintIncidentDeck(root,'inc13-cryo-fluid',[136,329,788,260],c=>{
    // First a shallow run along the whole failed bank. The lower lobe spreads
    // across the observation aisle, then drains back into two floor joints.
    const water=new Path2D('M448 340 C498 337 657 332 716 342 Q742 348 723 366 Q708 375 736 378 Q760 387 724 400 C669 416 636 394 610 416 Q591 428 618 435 C694 443 672 470 632 478 C596 491 535 467 502 477 C460 495 443 519 397 520 Q358 519 341 534 Q321 548 277 542 Q240 537 222 553 Q186 568 169 548 C148 525 209 515 235 512 Q265 507 247 496 Q230 484 262 470 C287 462 316 470 331 451 C343 432 305 431 310 413 C316 392 368 401 393 383 C408 373 385 362 413 353 Q429 349 448 340 Z');
    c.save();c.clip(water);
    const depth=c.createLinearGradient(416,339,351,545);
    depth.addColorStop(0,'rgba(98,147,155,.69)');depth.addColorStop(.32,'rgba(54,103,115,.65)');
    depth.addColorStop(.68,'rgba(35,68,77,.68)');depth.addColorStop(1,'rgba(40,74,78,.49)');
    c.fillStyle=depth;c.fillRect(136,329,788,260);
    // Broken reflections of the dark canopy stiles fall across the water.
    for(let j=0;j<4;j++){
      const x=467+58*j;
      c.save();c.translate(x,344);c.transform(1,0,-.39,1,0,0);
      const shadow=c.createLinearGradient(0,0,0,90);
      shadow.addColorStop(0,'rgba(23,46,57,.65)');shadow.addColorStop(.55,'rgba(29,62,71,.36)');shadow.addColorStop(1,'transparent');
      c.fillStyle=shadow;c.beginPath();c.moveTo(-12,0);c.lineTo(8,0);c.bezierCurveTo(6,18,14,33,9,47);
      c.lineTo(16,82);c.lineTo(-4,89);c.bezierCurveTo(-11,65,-3,45,-10,30);c.closePath();c.fill();c.restore();
    }
    // Reflected strips from the bank stretch into broken horizontal ripples.
    for(let i=0;i<88;i++){
      const t=i/88,x=470+(i%4)*55-94*t+12*Math.sin(11*i),z=341+126*t;
      const w=(13+29*t)*(.65+.35*Math.cos(i*4.1));
      c.strokeStyle='rgba(181,218,216,'+(.24*(1-t)+.06)+')';c.lineWidth=1.3+1.4*(1-t);
      c.beginPath();c.moveTo(x-w,z);c.quadraticCurveTo(x,z+2,x+w,z-.5);c.stroke();
    }
    c.restore();c.strokeStyle='rgba(134,172,174,.25)';c.lineWidth=1.5;c.stroke(water);
    // The weight of the dragged load cuts two erratic grooves in wet dust.
    for(const [dz,w] of [[0,3.2],[10,1.7]]){
      c.save();c.translate(0,dz);c.lineWidth=w;c.strokeStyle='rgba(20,42,49,.64)';
      c.stroke(new Path2D('M462 361 C445 389 392 417 393 438 S472 472 525 455 S657 426 741 446 Q802 459 874 434'));c.restore();
    }
    // A single set of wet boots turns toward the exit. The fading prints
    // continue beyond the pool; heel and forefoot remain separate.
    for(let i=0;i<29;i++){
      const t=i/28,x=471+t*405,z=372+65*Math.sin(Math.PI*Math.min(1,t*1.4))+t*38+(i%2?5:-5);
      c.save();c.translate(x,z);c.rotate(.70*Math.cos(t*4)-.06);c.fillStyle='rgba(12,30,33,'+(.78-.47*t)+')';
      c.beginPath();c.ellipse(3,0,4.9,2.7,0,0,Math.PI*2);c.fill();c.fillRect(-4,-2.3,3,4.6);c.restore();
    }
  },.022);
  creepingVapour(root,[[479,369,266,70,.17],[557,379,295,63,-.05],[397,409,220,80,.42],[311,482,249,59,.33]]);
  const lens=new T.MeshBasicMaterial({color:0xc1e9ee});
  lens.userData.actorMaterial = true;
  const beacon=new T.Mesh(new T.CylinderGeometry(.091,.10,.23,10),lens);
  beacon.position.set(474/32,1.26,320/32);beacon.name='inc13-medical-strobe';
  beacon.onBeforeRender=()=>{const t=environmentClock.value%2.6;
    lens.color.setHex(t<.12||(t>.31&&t<.40)?0xd2f3f3:0x47646a);};
  root.add(beacon);
}
