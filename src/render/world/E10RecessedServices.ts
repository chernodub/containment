import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { RoomTemplate } from '../../game/roguelike/types';
import { interiorFloorServices } from './RoomInteriors';
import { INTERIOR_PROFILES } from './RoomInteriorProfiles';

/** Actual half-metre service depth below flush covers; the simulation floor is
 * continuous. Captive side lights expose pipes rather than becoming strip lamps. */
export function addRecessedServices(root: T.Group, t: RoomTemplate): void {
  const services = interiorFloorServices(t.id, t), profile = INTERIOR_PROFILES[t.id];
  if (!services.length || !profile) return;
  const materials = [
    new T.MeshStandardMaterial({ name: 'e10-channel-frames', color: 0x6e8184, roughness: .7, metalness: .5 }),
    new T.MeshStandardMaterial({ name: 'e10-channel-bed', color: 0x1e3539, roughness: .83, metalness: .25 }),
    new T.MeshStandardMaterial({ name: 'e10-channel-pipes', color: 0x897b60, roughness: .58, metalness: .55 }),
    new T.MeshStandardMaterial({ name: 'e10-channel-pilot', color: profile.key, emissive: profile.key, emissiveIntensity: 3.2, roughness: .7 }),
    new T.MeshStandardMaterial({ name: 'e10-channel-glass', color: 0x93b6c1, transparent: true, opacity: .13, roughness: .5, metalness: .1, depthWrite: false }),
  ];
  const buckets: T.BufferGeometry[][] = materials.map(m => { m.userData.actorMaterial = true; return []; });
  materials[3].userData.motivatedEmitter = true;
  const put = (g: T.BufferGeometry, slot: number, x: number, y: number, z: number) => {
    const p = g.index ? g.toNonIndexed() : g.clone(); g.dispose(); p.translate(x, y, z); buckets[slot].push(p);
  };
  const box = (slot: number, x: number, y: number, z: number, w: number, h: number, d: number) => put(new T.BoxGeometry(w, h, d), slot, x, y, z);
  for (const service of services) {
    const x = service.x / 32, z = service.z / 32, width = service.width, depth = service.depth;
    box(1, x, -.56, z, width, .035, depth);
    for (const side of [-1, 1]) {
      box(1, x, -.28, z + side * (depth / 2 - .018), width, .56, .036);
      box(0, x, -.015, z + side * (depth / 2 - .04), width, .06, .08);
      box(0, x + side * (width / 2 - .04), -.015, z, .08, .06, depth);
      const pipe = new T.CylinderGeometry(.075, .075, width - .20, 8); pipe.rotateZ(Math.PI / 2);
      put(pipe, 2, x, -.32, z + side * depth * .22);
      for (const dx of [-.9, 0, .9]) {
        const collar = new T.CylinderGeometry(.096, .096, .06, 8); collar.rotateZ(Math.PI / 2);
        put(collar, 0, x + dx, -.32, z + side * depth * .22);
      }
    }
    box(3, x, -.535, z, width - .24, .012, depth * .40);
    box(3, x, -.40, z - depth * .36, width - .28, .035, .065);
    if (service.asset === 'drainage-grating') {
      for (let i = 0; i < 13; i++) box(0, x - width / 2 + .14 + i * (width - .28) / 12, -.005, z, .045, .04, depth - .12);
      box(0, x, -.005, z, width - .12, .04, .045);
    } else {
      box(4, x, .006, z, width - .16, .009, depth - .16);
      for (const dx of [-1.2, 1.2]) for (const side of [-1, 1]) box(0, x + dx, .012, z + side * (depth / 2 - .10), .045, .014, .045);
    }
  }
  for (const [i, parts] of buckets.entries()) {
    if (!parts.length) { materials[i].dispose(); continue; }
    const g = mergeGeometries(parts, false)!; parts.forEach(p => p.dispose());
    const mesh = new T.Mesh(g, materials[i]); mesh.name = materials[i].name;
    mesh.userData.bakedEnvironment = true; mesh.receiveShadow = i < 3; root.add(mesh);
  }
  root.userData.e10Recessed = { count: services.length, bottom: -.58, walkingCover: .015, colliders: false };
}
