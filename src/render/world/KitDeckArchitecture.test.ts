import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { readFile } from 'node:fs/promises';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ROOM_TEMPLATES } from '../../game/roguelike/roomTemplates';
import { buildKitFloorSurface } from './KitFloorSurface';
import { addKitDeckArchitecture } from './KitDeckArchitecture';
import { equipmentReservations } from './WorldDressing';
import { kitHull, kitInside } from './KitSafety';
import { buildRoomKitDressing } from './RoomKitDressing';
import { disposeModel } from '../meshParts';

const rooms = [
  ['residential-gallery', 'habitation'],
  ['crew-checkpoint', 'security'],
  ['transmission-chamber', 'communications'],
] as const;

describe('flush room-specific deck architecture prototype', () => {
  it.each(rooms)('%s adds bounded, legal, deterministic connected floor geometry', (id, environment) => {
    const t = ROOM_TEMPLATES[id];
    const before = JSON.stringify(t);
    const reservations = equipmentReservations(t, id);
    const raw = new T.Color();
    const legal = (x: number, z: number) =>
      kitInside(x * 32, z * 32, kitHull(t)) &&
      !t.voids?.some(poly => kitInside(x * 32, z * 32, poly)) &&
      !t.obstacles.some(r =>
        x * 32 > r.x && x * 32 < r.x + r.width &&
        z * 32 > r.y && z * 32 < r.y + r.height);
    const admitted: {
      corners: number[][];
      height: number;
      color: number;
      kind: string;
    }[] = [];
    const quad = (
      x: number, z: number, w: number, d: number,
      angle: number, color: number, kind: string, y = 0,
    ) => {
      const ca = Math.cos(angle);
      const sa = Math.sin(angle);
      const at = (u: number, v: number) => [x + u * ca - v * sa, z + u * sa + v * ca];
      const corners = [at(-w / 2, -d / 2), at(-w / 2, d / 2), at(w / 2, d / 2), at(w / 2, -d / 2)];
      if (!corners.every(([px, pz]) => legal(px, pz)))
        return false;
      for (let u = -w / 2; u <= w / 2; u += .1)
        for (let v = -d / 2; v <= d / 2; v += .1) {
          const q = at(u, v);
          if (!legal(q[0], q[1]))
            return false;
        }
      admitted.push({
        corners,
        height: y * .75,
        color,
        kind,
      });
      return true;
    };
    const painter = {
      quad,
      segment: (
        ax: number, az: number, bx: number, bz: number,
        width: number, color: number, kind: string, y?: number,
      ) => quad(
        (ax + bx) / 2, (az + bz) / 2,
        Math.hypot(bx - ax, bz - az), width,
        Math.atan2(bz - az, bx - ax), color, kind, y,
      ),
    };
    const proof = addKitDeckArchitecture(t, id, reservations, painter);
    expect(proof.bays).toBeGreaterThanOrEqual(1);
    expect(admitted.some(q=>q.kind==='deck-bay-frame'||q.kind==='deck-hatch-rib')).toBe(false);
    for(const q of admitted.filter(q=>q.kind==='deck-access-bay')){
      const cx=q.corners.reduce((n,p)=>n+p[0],0)/4,cz=q.corners.reduce((n,p)=>n+p[1],0)/4;
      expect(reservations.some(r=>Math.abs(cx-(r.x+r.width*.5)/32)<.01&&Math.min(Math.abs(cz-r.y/32),Math.abs(cz-(r.y+r.height)/32))<.7)).toBe(true);
    }
    expect(proof.connections).toBeGreaterThanOrEqual(1);
    expect(proof.triangles).toBe(admitted.length * 2);
    expect(proof.triangles).toBeLessThanOrEqual(800);
    expect(proof.triangles).toBeGreaterThan(30);
    expect(proof.baseArea).toBeGreaterThan(0);
    expect(proof.baseArea / (t.width * t.height / 1024)).toBeLessThan(.01);
    expect(proof.maxHeight).toBeLessThanOrEqual(.022);
    const points = admitted.flatMap(q => q.corners);
    expect(Math.max(...points.map(p => p[0])) - Math.min(...points.map(p => p[0]))).toBeGreaterThan(10);
    for (const q of admitted) {
      expect(q.height).toBeGreaterThan(0);
      expect(q.height).toBeLessThanOrEqual(.022);
      raw.setHex(q.color);
      expect(raw.r + raw.g + raw.b).toBeGreaterThan(.1);
    }
    // Rejected hull/void/solid spans must not become orphan ribs or end plates.
    const reject = {
      quad: () => false,
      segment: () => false,
    };
    expect(addKitDeckArchitecture(t, id, reservations, reject)).toMatchObject({
      bays: 0,
      connections: 0,
      triangles: 0,
      baseArea: 0,
      maxHeight: 0,
    });
    const a = buildKitFloorSurface(t, environment, id, reservations);
    const b = buildKitFloorSurface(t, environment, id, reservations);
    expect(a.proof.architecture.bays).toBeGreaterThan(0);
    expect(a.proof.architecture.triangles).toBeLessThanOrEqual(800);
    expect(a.geometry.getAttribute('position').array).toEqual(b.geometry.getAttribute('position').array);
    expect(a.geometry.getAttribute('color').array).toEqual(b.geometry.getAttribute('color').array);
    expect(a.geometry.getAttribute('color').count).toBe(a.geometry.getAttribute('position').count);
    const p = a.geometry.getAttribute('position');
    for (let n = 0; n < p.count; n++) {
      expect(legal(p.getX(n), p.getZ(n))).toBe(true);
      expect(p.getY(n)).toBeLessThanOrEqual(.022);
    }
    // One owner continues to dispose the merged floor; the helper owns no Three resource.
    let disposed = 0;
    a.geometry.addEventListener('dispose', () => disposed++);
    a.geometry.dispose();
    b.geometry.dispose();
    expect(disposed).toBe(1);
    expect(JSON.stringify(t)).toBe(before);
  });
  it('leaves every other room entirely outside the new architecture policy', () => {
    const ids = Object.keys(ROOM_TEMPLATES) as (keyof typeof ROOM_TEMPLATES)[];
    for (const id of ids.filter(id => !rooms.some(r => r[0] === id))) {
      let calls = 0;
      const painter = {
        quad: () => {
          calls++;
          return true;
        },
        segment: () => {
          calls++;
          return true;
        },
      };
      expect(addKitDeckArchitecture(ROOM_TEMPLATES[id], id, [], painter)).toMatchObject({
        triangles: 0,
        bays: 0,
        connections: 0,
      });
      expect(calls).toBe(0);
    }
  });
  it('keeps each complete affected kit below the shipping 30000-triangle budget', async () => {
    const sources: T.Group[] = [];
    for (const pack of ['kenney-space-station', 'kenney-furniture', 'kenney-nature', 'quaternius-scifi-essentials']) {
      const bytes = await readFile(`public/assets/kits/${pack}/kit.glb`);
      sources.push((await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')).scene);
    }
    for (const [id, environment] of rooms) {
      const root = buildRoomKitDressing(new T.Group(), ROOM_TEMPLATES[id], environment, id, sources);
      let triangles = 0;
      root.traverse(o => {
        if (o instanceof T.Mesh) {
          triangles += (o.geometry.index?.count ?? o.geometry.getAttribute('position').count) / 3;
        }
      });
      expect(triangles, id).toBeLessThan(30000);
      expect(root.children.length, id).toBeLessThanOrEqual(8);
      expect(root.userData.floorSurface.architecture.triangles).toBeLessThanOrEqual(800);
      disposeModel(root);
    }
    sources.forEach(disposeModel);
  });
});
