import type {Group} from 'three';
import type {Point, RoomTemplate} from '../../game/roguelike/types';
import {shipInteriorFurnishings} from '../../game/roguelike/shipInteriorFurnishings';
import {roomValueProfile} from '../lighting/RoomValueStandard';
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
    c.strokeStyle = 'rgba(9,15,17,.12)';
    for (const width of [108, 84, 64, 46, 30, 16, 7]) {
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
  paintIncidentDeck(root, 'frame16-deck-wear', [0, 0, room.width, room.height], c => {
    c.save();
    contactShadows(c, room);
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
        c.strokeStyle = 'rgba(22,29,31,.40)';
        c.lineWidth = offset === 14 ? 6 : 3;
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
      'freight-hold':[[439,463],[424,478],[414,479],[395,493]],
    };
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
  }, .016);
}
