import {paintLaneContacts} from './LaneContactPaint';
import {paintMachineSpill} from './MachineEmitters';
import {clipFightingDeck,paintFightingDeck} from './FightingDeck';
import {landmarkHousing,laneTerminal,laneWorklight} from '../lighting/LaneWorklight';
import type {Group} from 'three';
import type {Point, RoomTemplate} from '../../game/roguelike/types';
import {shipInteriorFurnishings} from '../../game/roguelike/shipInteriorFurnishings';
import {roomValueProfile} from '../lighting/RoomValueStandard';
import {paintServiceDeck} from './ServiceDeckMarkings';
import {paintIncidentDeck} from './Inc13DeckPaint';

function contactShadows(c: CanvasRenderingContext2D, room: RoomTemplate): void {
  c.beginPath();
  for (const polygon of [room.boundary, ...(room.voids ?? [])]) {
    if (!polygon?.length) continue;
    polygon.forEach((point, index) => {
      if (index === 0) c.moveTo(point.x, point.y);
      else c.lineTo(point.x, point.y);
    });
    c.closePath();
  }
  if (room.boundary) {
    c.clip('evenodd');
    c.strokeStyle = 'rgba(6,10,12,.16)';
    for (const width of [142, 112, 86, 64, 46, 30, 16, 7]) {
      c.lineWidth = width;
      c.stroke();
    }
  }

  const furniture = shipInteriorFurnishings(room).flatMap(item => item.colliders);
  for (const rect of [...room.obstacles, ...(room.incidentObstacles ?? []), ...furniture]) {
    for (let spread = 34; spread >= 2; spread -= 4) {
      c.fillStyle = ['diagnostic-gallery','crew-checkpoint','residential-gallery','relay-racks'].includes(room.id) ? 'rgba(9,14,18,.11)' : 'rgba(10,17,23,.065)';
      c.fillRect(rect.x - spread, rect.y - spread, rect.width + 2 * spread, rect.height + 2 * spread);
    }
  }
}

function serviceJoints(c: CanvasRenderingContext2D, room: string): void {
  c.lineWidth = 3;
  c.strokeStyle = 'rgba(22,32,37,.56)';
  switch (room) {
    case 'diagnostic-gallery':
      for(const offset of [-8,8]){
        c.beginPath();c.moveTo(-114,73+offset);c.bezierCurveTo(-78,45+offset,-84,-23+offset,-24,-57+offset);c.stroke();
      }
      break;
    case 'containment-annulus':
      for (const radius of [92, 104, 172]) {
        c.beginPath();
        c.arc(74, -48, radius, .13, 3.52);
        c.stroke();
      }
      break;
    case 'relay-racks':
    case 'transmission-chamber':
      for (const offset of [-5, 0, 5]) {
        c.beginPath();
        c.moveTo(-190, -78 + offset);
        c.lineTo(-50, -78 + offset);
        c.quadraticCurveTo(18, -78 + offset, 18 + offset, -130);
        c.lineTo(18 + offset, -192);
        c.stroke();
      }
      break;
    case 'armory':
    case 'crew-checkpoint':
      for (let i = 0; i < 5; i++) {
        c.strokeRect(-150 + i * 54, -89, 48, 32);
        c.fillRect(-146 + i * 54, -85, 5, 2);
      }
      break;
    case 'residential-gallery':
      for (const x of [-136, -18, 100]) {
        c.strokeRect(x, -62, 92, 105);
        c.fillStyle = 'rgba(119,101,81,.15)';
        c.fillRect(x + 5, -57, 82, 95);
      }
  }
}

/** Bake contact shadows, service joints and traffic wear into one lit relief sheet. */
export function addFrame16Deck(root: Group, room: RoomTemplate, arena: Point): void {
  const fixtures=[laneWorklight(room.id),landmarkHousing(room.id)];
  function paintLights(c:CanvasRenderingContext2D, materialResponse=false){
    if(materialResponse){c.save();c.globalAlpha=.47;paintFightingDeck(c,room,arena);c.restore();}
    c.save();clipFightingDeck(c,room);paintMachineSpill(c,room.id);c.restore();
    for(const lamp of fixtures){
      if(!lamp)continue;
      c.save();c.translate(lamp.x,lamp.z);c.rotate(-lamp.angle);
      const tint='#'+lamp.color.toString(16).padStart(6,'0');
      const wash=c.createRadialGradient(0,12,4,0,28,71);
      wash.addColorStop(0,tint+'db');wash.addColorStop(.34,tint+'ac');
      wash.addColorStop(.75,tint+'48');wash.addColorStop(1,tint+'00');
      c.fillStyle=wash;c.beginPath();c.moveTo(-15,-3);
      c.quadraticCurveTo(-22,19,-55,82);c.lineTo(55,82);
      c.quadraticCurveTo(22,19,15,-3);c.closePath();c.fill();c.restore();
    }
  }
  paintIncidentDeck(root, 'frame16-deck-wear', [0, 0, room.width, room.height], c => {
    c.save();
    paintFightingDeck(c,room,arena);
    contactShadows(c, room);
    paintServiceDeck(c, room, arena);
    paintLaneContacts(c,room,root);
    const terminal=laneTerminal(room.id);
    if(terminal){
      c.save();c.translate(...terminal);c.scale(1,.69);
      const shadow=c.createRadialGradient(0,0,5,0,0,43);
      shadow.addColorStop(0,'rgba(9,12,15,.76)');shadow.addColorStop(1,'rgba(9,12,15,0)');
      c.fillStyle=shadow;c.fillRect(-43,-43,86,86);c.restore();
    }
    if(room.id==='service-shaft-landing'){
      for(const offset of [-17,16]){
        c.beginPath();c.moveTo(300+offset,318);c.quadraticCurveTo(216+offset,229,153+offset,247);
        c.lineWidth=5;c.strokeStyle='#3d4744';c.stroke();
        c.translate(1,1);c.lineWidth=1.5;c.strokeStyle='#82908a';c.stroke();c.translate(-1,-1);
      }
    }
    paintLights(c);
    // Scuffed wheel tracks taper toward the workshop light. Their bend is
    // offset from the straight sightline so the marine stays on clear deck.
    const source = roomValueProfile(room.id)?.landmark?.at;
    if (source) {
      const dx = source[0] - room.spawn.x, dy = source[1] - room.spawn.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      const nx = -dy / length, ny = dx / length;
      c.save();
      for (const offset of [14, 26]) {
        c.beginPath();
        c.moveTo(room.spawn.x + nx * offset, room.spawn.y + ny * offset);
        c.bezierCurveTo(room.spawn.x + dx * .43 + nx * (offset + 35),
          room.spawn.y + dy * .43 + ny * (offset + 35),
          source[0] - dx * .28 + nx * (offset - 24),
          source[1] - dy * .28 + ny * (offset - 24), source[0] + nx * offset, source[1] + ny * offset);
        c.strokeStyle = 'rgba(12,18,19,.51)';
        c.lineWidth = offset === 14 ? 7 : 3.5;
        c.stroke();
        c.setLineDash([19, 9, 6, 17]);
        c.strokeStyle = 'rgba(132,137,131,.27)';
        c.lineWidth = 1.6;
        c.stroke();
        c.setLineDash([]);
      }
      c.restore();
    }
    c.save();
    const scars:Record<string,number[][]>={
      'breached-loading-bay':[[560,491],[568,538],[581,589],[594,620]],
      'shielding-gate':[[425,340],[446,366],[493,390],[532,397]],
      'manual-control-chamber':[[462,573],[491,587],[508,611],[477,644]],
    };
    // An alternating three-toed trail leads out of the opening. Its tarry
    // deposit thins as the creature crosses the surviving turning apron.
    if (room.id === 'breached-loading-bay') {
      for (let step = 0; step < 8; step++) {
        c.save();
        const side = step % 2 ? 1 : -1;
        c.translate(549 + step * 5 + side * 14, 499 + step * 23);
        c.rotate(-.23 + side * .18);
        c.fillStyle = `rgba(30,42,39,${.83 - step * .053})`;
        c.beginPath();
        c.moveTo(-5,-7); c.lineTo(1,-10); c.lineTo(6,-4);
        c.lineTo(10,9); c.lineTo(4,4); c.lineTo(2,13);
        c.lineTo(-1,5); c.lineTo(-6,10); c.lineTo(-4,1);
        c.closePath(); c.fill(); c.restore();
      }
    }
    // Continue the physical assemblies in shallow, hull-clipped deck relief.
    const plate=(path:string,color:string)=>{c.fillStyle=color;c.fill(new Path2D(path));};
    if(room.id==='shielding-gate'){
      plate('M409 475 L491 469 546 451 655 461 731 472 731 490 646 478 545 469 494 486 409 493Z','#475760');
      plate('M411 479 L491 473 545 455 638 463 638 469 546 462 492 480 411 487Z','#939e9e');
      plate('M649 464 L707 469 693 474 731 480 727 486 659 475Z','#85949b');
      // Three separated, creased pieces of door skin still share a shear line.
      for(const [x,y,angle] of [[495,483,-.18],[550,467,.09],[614,470,.15]]){
        c.save();c.translate(x,y);c.rotate(angle);
        plate('M0 -11 L42 -12 53 -5 45 -2 51 6 23 10 0 7Z','#74818a');
        plate('M0 4 L26 4 48 -3 46 2 23 10 0 7Z','#a4aba4');
        for(const px of [5,31]){c.fillStyle='#354349';c.fillRect(px,-8,4,3);}
        c.restore();
      }
    }else if(room.id==='breached-loading-bay'){
      plate('M589 624 L607 630 639 680 658 706 655 716 643 711 649 724 627 702 605 665Z','#81959a');
      plate('M607 630 L640 675 658 706 644 696 626 675Z','#abb5ad');
      plate('M612 650 L624 664 619 664Z M628 681 L638 692 633 692Z','#394649');
      plate('M573 552 Q570 602 592 651 T631 731 L620 720 Q588 685 584 655 T570 570Z','rgba(33,40,36,.66)');
    }else if(room.id==='freight-hold'){
      // The torn corner travelled northwest from the tow lane to the pallet.
      plate('M492 477 Q544 511 600 568 T768 686 L772 689 Q669 625 600 576 T490 483Z','#524e44');
      c.save();c.translate(550,531);c.rotate(.48);
      plate('M-22 -13 L17 -13 24 -6 24 12 -22 12Z','#949489');
      plate('M-16 -8 L17 -8 17 7 -16 7Z','#354247');
      plate('M-12 -3 L13 -3 13 1 -12 1Z','#a5a799');
      c.restore();
    }
    const track=scars[room.id];
    if(track){
      for(const shift of [-3,3]){
        c.beginPath();track.forEach(([x,y],i)=>i?c.lineTo(x+shift,y):c.moveTo(x+shift,y));
        c.lineWidth=shift<0?5:2;c.strokeStyle=shift<0?'rgba(26,34,39,.77)':'rgba(124,143,146,.48)';c.stroke();
      }
    }
    c.translate(arena.x, arena.y);
    serviceJoints(c, room.id);
    c.restore();

    const dx = arena.x - room.spawn.x, dy = arena.y - room.spawn.y;
    c.translate(room.spawn.x, room.spawn.y);
    c.rotate(Math.atan2(dy, dx));
    const length = Math.hypot(dx, dy), spacing = room.id === 'freight-hold' ? 46 : 31;
    for (let distance = 20; distance < length + 96; distance += 64) {
      for (const side of [-1, 1]) {
        const x = distance + 9 * Math.sin(distance * .12 + side);
        const y = side * spacing, width = 25 + 13 * Math.cos(distance * .25);
        c.fillStyle = 'rgba(92,104,108,.19)';
        c.fillRect(x, y, width, 5);
        c.fillStyle = 'rgba(18,25,29,.38)';
        c.fillRect(x + 2, y + 4, width - 4, 2);
      }
    }
    c.restore();
  }, .0214, c=>paintLights(c,true));
}
