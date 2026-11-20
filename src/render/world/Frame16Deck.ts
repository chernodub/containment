import type {Group} from 'three';
import type {Point, RoomTemplate} from '../../game/roguelike/types';
import {shipInteriorFurnishings} from '../../game/roguelike/shipInteriorFurnishings';
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
    c.strokeStyle = 'rgba(9,17,22,.11)';
    for (const width of [24, 14, 6]) {
      c.lineWidth = width;
      c.stroke();
    }
  }

  const furniture = shipInteriorFurnishings(room).flatMap(item => item.colliders);
  for (const rect of [...room.obstacles, ...(room.incidentObstacles ?? []), ...furniture]) {
    for (let spread = 20; spread >= 2; spread -= 3) {
      c.fillStyle = 'rgba(10,17,23,.065)';
      c.fillRect(rect.x - spread, rect.y - spread, rect.width + 2 * spread, rect.height + 2 * spread);
    }
  }
}

function serviceJoints(c: CanvasRenderingContext2D, room: string): void {
  c.lineWidth = 3;
  c.strokeStyle = 'rgba(22,32,37,.56)';
  switch (room) {
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
    c.save();
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
