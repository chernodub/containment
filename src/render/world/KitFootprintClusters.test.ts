import {readFile} from 'node:fs/promises';
import {describe, expect, it, vi} from 'vitest';
import {ROOM_STORY_ROUTE} from '../../game/roguelike/storyRooms';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import type {ShipEnvironment} from '../ShipEnvironments';
import {roomKitURLs} from './RoomKitAssets';
import {addKitFootprintClusters, type KitClusterPlace} from './KitFootprintClusters';

describe('footprint composition admission boundary', () => {
  it('uses only models in the room-loaded atlases and offers an interruption for every original solid', async () => {
    const inventories = new Map<string, Set<string>>();
    for (const pack of ['kenney-space-station', 'kenney-furniture', 'kenney-nature', 'quaternius-scifi-essentials']) {
      const manifest = JSON.parse(await readFile(`public/assets/kits/${pack}/manifest.json`, 'utf8'));
      inventories.set(pack, new Set(manifest.models.map((model: {name: string}) => model.name)));
    }
    for (const [roomId, environment] of [...ROOM_STORY_ROUTE.map(r => [r.templateId, r.environment] as const), ['reactor-vault', 'reactor'] as const]) {
      const template = ROOM_TEMPLATES[roomId];
      const available = new Set(roomKitURLs(environment as ShipEnvironment).flatMap(url => [...inventories.get(url.split('/').at(-2)!)!]));
      const place: KitClusterPlace = name => {
        expect(available.has(name), `${roomId} has no room-loaded ${name}`).toBe(true);
        return true;
      };
      const before = JSON.stringify(template);
      const rows = addKitFootprintClusters({template, environment, roomId, reservations:template.obstacles, place, supportHeight:() => .2});
      expect(JSON.stringify(template)).toBe(before);
      expect(rows).toHaveLength(template.obstacles.length);
      expect(rows.every(row => row.originalObstacle && row.accepted >= 4 && row.fallenAccepted && row.statusAccepted), roomId).toBe(true);
    }
  });

  it('counts only admitted geometry and samples support for each individual component', () => {
    const template = ROOM_TEMPLATES['relay-racks'];
    const supportHeight = vi.fn((x: number, z: number) => .5 + (x % .6) + (z % .4));
    const observed: Array<{x: number; y: number; z: number}> = [];
    const place: KitClusterPlace = (_name, x, y, z) => {
      observed.push({x, y, z});
      return observed.length % 2 === 0;
    };
    const rows = addKitFootprintClusters({template, environment:'communications', roomId:template.id, reservations:template.obstacles, place, supportHeight});
    expect(observed.length).toBeGreaterThan(template.obstacles.length * 3);
    expect(supportHeight).toHaveBeenCalledTimes(observed.length);
    for (const position of observed) expect(position.y).toBeCloseTo(supportHeight(position.x, position.z) + .015);
    expect(rows.reduce((sum, row) => sum + row.accepted, 0)).toBe(Math.floor(observed.length / 2));
    const denied = addKitFootprintClusters({template, environment:'communications', roomId:template.id, reservations:template.obstacles, place:() => false, supportHeight:() => .2});
    expect(denied.every(row => row.accepted === 0 && !row.fallenAccepted && !row.statusAccepted && row.estimatedTriangles === 0)).toBe(true);
  });

  it('bounds accepted atlas cost and prioritizes original solids before extra void reservations', () => {
    const template = ROOM_TEMPLATES['residential-gallery'];
    const additional = Array.from({length:100}, (_, index) => ({x:100 + index, y:100, width:80, height:80}));
    const reservations = [...additional, ...template.obstacles];
    const snapshot = JSON.stringify(reservations);
    const rows = addKitFootprintClusters({template, environment:'habitation', roomId:template.id, reservations, place:() => true, supportHeight:() => .2});
    expect(JSON.stringify(reservations)).toBe(snapshot);
    expect(rows.slice(0, template.obstacles.length).every(row => row.originalObstacle && row.accepted >= 4)).toBe(true);
    expect(rows.reduce((sum, row) => sum + row.estimatedTriangles, 0)).toBeLessThanOrEqual(4000);
    expect(rows.some(row => row.accepted === 0)).toBe(true);
  });
});
