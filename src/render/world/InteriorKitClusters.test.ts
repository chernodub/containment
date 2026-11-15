import {readFile} from 'node:fs/promises';
import {beforeAll, describe, expect, it, vi} from 'vitest';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {SHIP_ARCHITECTURE_PLANS} from '../../game/roguelike/shipArchitectureLayouts';
import {shipEnvironment} from '../ShipEnvironments';
import {disposeModel} from '../meshParts';
import {buildRoomInteriors, INTERIOR_ROOMS} from './RoomInteriors';
import {addInteriorKitClusters, type InteriorKitClusterProof} from './InteriorKitClusters';
import {attachRoomKits, buildRoomKitDressing, type KitPlacement} from './RoomKitDressing';
import {kitBoundsSupported} from './KitSafety';

const sources: T.Group[] = [];
beforeAll(async () => {
  for (const pack of ['kenney-space-station', 'kenney-furniture', 'kenney-nature', 'quaternius-scifi-essentials']) {
    const bytes = await readFile(`public/assets/kits/${pack}/kit.glb`);
    sources.push((await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')).scene);
  }
});

describe('E9 kit furnishings', () => {
  it.each([...INTERIOR_ROOMS])('%s admits an assembled function workstation per named space in existing material batches', room => {
    const template = ROOM_TEMPLATES[room as keyof typeof ROOM_TEMPLATES], world = new T.Group(), architecture = buildRoomInteriors(room, template)!;
    world.add(architecture);
    const root = buildRoomKitDressing(world, template, shipEnvironment(room)!, room, sources);
    const clusters = root.userData.interiorKitClusters as InteriorKitClusterProof[];
    expect(clusters.map(cluster => cluster.space)).toEqual(SHIP_ARCHITECTURE_PLANS[room as keyof typeof SHIP_ARCHITECTURE_PLANS]!.spaces.map(space => space.name));
    for (const cluster of clusters) {
      const detail = JSON.stringify({cluster, rejected: root.userData.rejected});
      expect(cluster.accepted.length, detail).toBeGreaterThanOrEqual(3);
      expect(cluster.accepted.length, detail).toBeLessThanOrEqual(7);
      expect(cluster.requested.length).toBeGreaterThanOrEqual(cluster.accepted.length);
      expect(cluster.accepted.every(model => cluster.requested.includes(model))).toBe(true);
    }
    const placements = (root.userData.placements as KitPlacement[]).filter(placement => placement.purpose.startsWith('E9 '));
    expect(placements).toHaveLength(clusters.reduce((count, cluster) => count + cluster.accepted.length, 0));
    if (['diagnostic-gallery', 'crew-checkpoint', 'swarm-junction'].includes(room)) {
      expect(placements.some(placement => placement.position[1] >= .6)).toBe(true);
    }
    for (const placement of placements) {
      const bounds = new T.Box3(new T.Vector3().fromArray(placement.bounds[0]), new T.Vector3().fromArray(placement.bounds[1]));
      expect(kitBoundsSupported(template, bounds)).toBe(true);
      expect(bounds.max.y).toBeLessThanOrEqual(.9);
    }
    expect(root.userData.triangles).toBeLessThan(32000);
    expect(root.children.length).toBeLessThanOrEqual(8);
    disposeModel(world);
  });

  it('retains genuine placement rejects in the per-space receipt', () => {
    const world = new T.Group(), architecture = buildRoomInteriors('diagnostic-gallery', ROOM_TEMPLATES['diagnostic-gallery'])!;
    world.add(architecture);
    const place = vi.fn(() => false), result = addInteriorKitClusters(world, 'diagnostic-gallery', 'engineering', place);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(cluster => cluster.accepted.length === 0 && cluster.requested.length >= 3 && cluster.requested.length <= 7)).toBe(true);
    expect(place).toHaveBeenCalledTimes(result.reduce((count, cluster) => count + cluster.requested.length, 0));
    disposeModel(world);
  });

  it('replaces fallback furnishing only after all spaces have three accepted pieces, and restores it on dispose', async () => {
    const world = new T.Group(), architecture = buildRoomInteriors('diagnostic-gallery', ROOM_TEMPLATES['diagnostic-gallery'])!;
    world.add(architecture);
    const fallback = world.getObjectByName('e9-furnishing-fallback')!;
    expect(fallback.visible).toBe(true);
    const load = async (url: string) => {
      const index = url.includes('space-station') ? 0 : url.includes('furniture') ? 1 : url.includes('nature') ? 2 : 3;
      const copy = sources[index].clone(true);
      copy.traverse(object => {if (object instanceof T.Mesh) {
        object.geometry = object.geometry.clone();
        object.material = Array.isArray(object.material) ? object.material.map(material => material.clone()) : object.material.clone();
      }});
      return copy;
    };
    const owner = attachRoomKits(world, ROOM_TEMPLATES['diagnostic-gallery'], 'engineering', 'diagnostic-gallery', vi.fn(), Promise.resolve(), load);
    await owner.ready;
    expect(owner.state).toBe('ready');
    expect(fallback.visible).toBe(false);
    owner.dispose();owner.dispose();
    expect(fallback.visible).toBe(true);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const failed = attachRoomKits(world, ROOM_TEMPLATES['diagnostic-gallery'], 'engineering', 'diagnostic-gallery', () => {throw Error('registration failed');}, Promise.resolve(), load);
      await failed.ready;
      expect(failed.state).toBe('fallback');
      expect(fallback.visible).toBe(true);
      expect(world.getObjectByName('e6-room-kits')).toBeUndefined();
      expect(error).toHaveBeenCalledOnce();
      failed.dispose();
    } finally {error.mockRestore();}
    disposeModel(world);
  });
});
