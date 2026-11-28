import {paintArenaReceiver} from './IncidentLightFootprints';
import {roomValueProfile} from '../lighting/RoomValueStandard';
import {paintIncidentClusters} from './IncidentDeckClusters';
import {paintFightLaneDamage} from './FightLaneDamage';
import {paintWorkingLane} from './WorkingLane';
import {paintLaneAftermath} from './LaneAftermath';
import {paintLaneContacts} from './LaneContactPaint';
import {clipFightingDeck,paintFightingDeck} from './FightingDeck';
import {landmarkHousing,laneTerminal,laneWorklight} from '../lighting/LaneWorklight';
import type {Group} from 'three';
import type {Point, RoomTemplate} from '../../game/roguelike/types';
import {shipInteriorFurnishings} from '../../game/roguelike/shipInteriorFurnishings';
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

// Two remnants of the local accident, centred on the authored fight position.
// Offsets and angles follow the traffic direction of each deck.
const centreMarks:Record<string,readonly [string,string,number,number,number]>={
  'passenger-vault':['drag','B-06',-65,84,-.12],
  'crew-checkpoint':['drag','P-04',74,-67,.48],
  'transmission-chamber':['burn','TX-3',-50,-61,-.39],
  'overload-floor':['burn','BUS 9',-86,67,.64],
  'awakening-bay':['spill','THAW',-76,59,.26],
  'residential-gallery':['drag','C-12',53,-73,-.47],
  'communal-atrium':['drag','MESS 4',64,82,.26],
  'manual-control-chamber':['chevron','CTRL',-80,63,-.23],
  'armory':['chevron','AM-2',-53,76,.08],
  'freight-hold':['drag','LOAD',-86,-42,.56],
  'breached-loading-bay':['drag','L-03',72,63,1.1],
  'relay-racks':['burn','R-14',47,-64,.15],
  'diagnostic-gallery':['spill','DX 4',-82,-58,-.78],
  'safety-interlock-station':['chevron','LOCK',85,56,-.46],
  'coolant-plant':['spill','CL-8',-63,72,-.55],
  'service-shaft-landing':['drag','LIFT',44,68,1.24],
  'infested-workshop':['spill','OIL',65,-88,.82],
  'swarm-junction':['spill','J-07',-52,83,.42],
  'shielding-gate':['chevron','G-12',65,-73,.72],
  'containment-annulus':['burn','HV-8',-78,51,-.84],
};
function paintCentreMarks(c:CanvasRenderingContext2D,room:RoomTemplate,arena:Point){
  const mark=centreMarks[room.id];if(!mark)return;
  const [kind,label,x,y,angle]=mark;
  const paths:Record<string,string>={
    drag:'M-90 -18L82 -9 64 -3 -77 -11Z M-78 6L60 11 77 17 -88 14Z',
    burn:'M-94 -5L-19 -12 -47 -26 6 -16 20 -30 34 -11 76 -16 49 -4 91 8 21 11 -6 24 -22 12 -78 17 -43 4Z',
    spill:'M-84 0Q-69 -22 -34 -15L-10 -25Q9 -28 24 -13L69 -9 83 2 47 9Q37 25 4 17L-30 21 -40 11 -68 13Z',
    chevron:'M-65 -21L-39 -21 -18 0 -42 23 -69 23 -44 0Z M-13 -21H13L35 0 10 23H-17L8 0Z',
  };
  c.save();c.translate(arena.x+x,arena.y+y);c.rotate(angle);
  c.fillStyle=kind==='chevron'?'#84785b':'rgba(26,31,30,.79)';
  c.fill(new Path2D(paths[kind]));
  c.translate(-x*1.65,-y*1.65);c.rotate(-.19);
  c.fillStyle='#555e5f';c.fill(new Path2D('M-51 -19L39 -19 54 -8 47 18 -49 18Z'));
  c.fillStyle='#273134';c.fillRect(-47,9,92,3);c.fillRect(27,-17,3,25);
  c.font='bold 14px monospace';c.fillStyle='#a9aa98';c.fillText(label,-41,3);
  c.restore();
}

/** Bake contact shadows, service joints and traffic wear into one lit relief sheet. */
export function addFrame16Deck(root: Group, room: RoomTemplate, arena: Point): void {
  const fixtures=[laneWorklight(room.id),landmarkHousing(room.id)];
  function paintDeckResponse(c:CanvasRenderingContext2D){
    c.save();c.globalAlpha=.47;paintFightingDeck(c,room,arena);c.restore();
    if(room.id==='safety-interlock-station'){
      const profile=roomValueProfile(room.id)!;
      c.save();clipFightingDeck(c,room);
      paintArenaReceiver(c,arena,profile.perimeter.inner,profile.landmark!.color);
      c.restore();
    }
  }
  paintIncidentDeck(root, 'frame16-deck-wear', [0, 0, room.width, room.height], c => {
    c.save();
    paintFightingDeck(c,room,arena);
    c.save();clipFightingDeck(c,room);paintWorkingLane(c,room,arena);c.restore();
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
    if(centreMarks[room.id]){
      c.save();clipFightingDeck(c,room);
      for(const lamp of fixtures){
        if(!lamp)continue;
        const unlit=new Path2D();unlit.rect(0,0,room.width,room.height);
        unlit.ellipse(lamp.x,lamp.z,48,76,-lamp.angle,0,2*Math.PI);
        c.clip(unlit,'evenodd');
      }
      c.fillStyle='rgba(7,12,14,.10)';c.fillRect(0,0,room.width,room.height);c.restore();
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

    c.save();clipFightingDeck(c,room);paintIncidentClusters(c,room.id);paintFightLaneDamage(c,room.id);paintLaneAftermath(c,room.id,arena);paintCentreMarks(c,room,arena);c.restore();

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
  }, .0214, paintDeckResponse);
}
