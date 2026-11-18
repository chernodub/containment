import * as T from 'three';
import {paintIncidentDeck} from './Inc13DeckPaint';

/** Tension silk sweeps out of the machine beds toward the vestibule. The
 * pale edges are restrained highlights on dark ground, with deck in the gaps. */
export function addWorkshopResin(root:T.Group):void {
  paintIncidentDeck(root,'inc13-resin-runout',[115,248,622,324],c=>{
    const mantle=new Path2D('M 686 299 Q668 323 715 346 Q672 342 633 367 Q601 355 575 378 Q559 386 541 386 C514 380 497 392 472 411 Q438 423 422 453 C403 477 365 457 329 487 Q283 512 263 506 Q236 498 210 524 L172 544 Q217 496 227 483 Q255 473 253 461 C259 438 303 445 313 415 Q328 396 355 392 Q388 377 390 355 Q411 346 418 317 Q443 333 461 304 Q497 319 512 284 Q552 327 600 303 Q634 327 686 299 Z');
    const skin=c.createLinearGradient(523,293,275,499);
    skin.addColorStop(0,'rgba(74,47,76,.96)');skin.addColorStop(.37,'rgba(67,48,71,.91)');
    skin.addColorStop(.78,'rgba(55,39,57,.87)');skin.addColorStop(1,'rgba(52,41,56,.61)');
    c.fillStyle=skin;c.fill(mantle);
    c.save();c.clip(mantle);
    for(let i=0;i<54;i++){
      const x=240+(i*71)%354,z=330+(i*31)%160,r=8+(i*13)%22;
      c.save();c.translate(x,z);c.rotate(-.61);c.scale(1.75,.75);
      const pocket=c.createRadialGradient(-r*.25,-r*.31,1,0,0,r);
      pocket.addColorStop(0,'rgba(127,91,116,.39)');pocket.addColorStop(.66,'rgba(73,46,71,.20)');
      pocket.addColorStop(.82,'rgba(30,21,34,.35)');pocket.addColorStop(1,'transparent');
      c.fillStyle=pocket;c.fillRect(-r,-r,r*2,r*2);c.restore();
    }
    c.restore();
    // Open stretched windows through the growing resin. Each leaves a rolled
    // edge and an amber-grey glimpse of ordinary deck beneath.
    const windows=[
      'M378 408 Q393 402 421 394 Q399 415 391 430 Q385 435 367 435 Q380 417 378 408Z',
      'M467 354 Q489 354 512 340 Q502 361 470 369 Q460 370 459 367Z',
      'M297 469 Q326 446 340 447 Q326 466 303 477 Q296 476 297 469Z',
      'M526 360 Q539 347 559 345 Q548 359 538 365Z'
    ];
    for(const d of windows){
      const hole=new Path2D(d);c.globalCompositeOperation='destination-out';c.fillStyle='#000';c.fill(hole);
      c.globalCompositeOperation='source-over';c.strokeStyle='rgba(104,82,105,.64)';c.lineWidth=1.8;c.stroke(hole);
    }
    const strands=[
      ['M548 326 C490 350 499 377 442 386 S379 428 328 453 S254 459 221 491 Q199 513 148 520',9],
      ['M598 326 C551 345 535 382 486 385 S427 408 404 431 Q366 473 332 470 T253 510 Q232 523 194 540',6],
      ['M526 318 C487 327 463 357 435 365 S400 392 371 395 Q335 403 310 439 T249 457 Q213 467 182 482',4],
      ['M448 373 Q414 352 384 359 T321 349',3],['M371 421 Q350 416 330 420 T275 409',3],
      ['M326 451 Q289 448 270 427 Q257 417 241 416',2],
      ['M462 401 Q450 432 417 451 T374 499 Q350 519 329 522',3],
    ] as const;
    c.lineJoin='round';c.lineCap='round';
    for(const [d,width] of strands){
      const path=new Path2D(d);
      c.strokeStyle='rgba(31,24,34,.82)';c.lineWidth=width+3;c.stroke(path);
      c.strokeStyle='rgba(77,54,75,.83)';c.lineWidth=width;c.stroke(path);
      c.save();c.translate(0,-1.2);c.strokeStyle='rgba(128,99,125,.31)';c.lineWidth=width*.21;c.stroke(path);c.restore();
    }
  });
}
