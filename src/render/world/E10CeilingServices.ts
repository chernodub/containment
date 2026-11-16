import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { RoomTemplate } from '../../game/roguelike/types';
import { shipEnvironment } from '../ShipEnvironments';
import { deckLightSources, setDeckQuality } from './E10DeckSurfaces';
import { INTERIOR_PROFILES } from './RoomInteriorProfiles';
import { registerOriginalInteriorCutaways, type InteriorCutaway } from './OriginalInteriorCutaways';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

type Bucket = { material: T.MeshStandardMaterial; geometries: T.BufferGeometry[]; count: number };
/** Manufactured overhead source/rack assemblies, merged into four finish draws.
 * No deck collision; opaque vertex cutaways share the original kit lifecycle. */
export function addCeilingServices(root: T.Group, t: RoomTemplate): void {
  const environment = shipEnvironment(t.id) ?? 'cryogenics', profile = INTERIOR_PROFILES[t.id];
  if (!profile) return;
  const domestic = environment === 'habitation', industrial = ['cargo', 'engineering', 'maintenance', 'infested'].includes(environment);
  const finishes = [
    new T.MeshStandardMaterial({ name: 'e10-overhead-steel', color: industrial ? 0x52615c : 0x55646c, roughness: .7, metalness: .45, vertexColors: true, alphaTest: .3 }),
    new T.MeshStandardMaterial({ name: 'e10-overhead-cap', color: domestic ? 0xc5b897 : 0xadc1bd, roughness: .8, metalness: .15, vertexColors: true, alphaTest: .3 }),
    new T.MeshStandardMaterial({ name: 'e10-overhead-service', color: industrial ? 0x967d52 : 0x314b53, roughness: .6, metalness: .55, vertexColors: true, alphaTest: .3 }),
    new T.MeshStandardMaterial({ name: 'e10-fixture-source', color: profile.key, emissive: profile.key, emissiveIntensity: 2.8, roughness: .7, vertexColors: true, alphaTest: .3 }),
  ];
  const buckets: Bucket[] = finishes.map(material => { material.userData.actorMaterial = true; if (material.emissiveIntensity > 1) material.userData.motivatedEmitter = true; return { material, geometries: [], count: 0 }; });
  const pieces: { bounds: T.Box3; ranges: { finish: number; start: number; end: number }[] }[] = [];
  let piece: typeof pieces[number];
  const append = (g: T.BufferGeometry, finish: number, x: number, y: number, z: number) => {
    const geometry = g.index ? g.toNonIndexed() : g.clone(); g.dispose(); geometry.translate(x, y, z);
    geometry.deleteAttribute('uv');
    const p = geometry.getAttribute('position'), colors = new Float32Array(p.count * 4);
    const normals = geometry.getAttribute('normal');
    for (let i = 0; i < p.count; i++) {
      const ao = normals.getY(i) > .5 ? 1 : normals.getY(i) < -.5 ? .62 : .82;
      colors[i * 4] = colors[i * 4 + 1] = colors[i * 4 + 2] = ao; colors[i * 4 + 3] = 1;
    }
    geometry.setAttribute('color', new T.BufferAttribute(colors, 4)); geometry.computeBoundingBox();
    const b = buckets[finish];
    if (piece) { piece.bounds.union(geometry.boundingBox!); piece.ranges.push({ finish, start: b.count, end: b.count + p.count }); }
    b.count += p.count; b.geometries.push(geometry);
  };
  const box = (finish: number, x: number, y: number, z: number, w: number, h: number, d: number) => append(new RoundedBoxGeometry(w, h, d, 1, Math.min(.045,w/5,h/5,d/5)), finish, x, y, z);
  const pipe = (x: number, y: number, z: number, length: number, radius: number) => {
    const g = new T.CylinderGeometry(radius, radius, length, 8); g.rotateZ(Math.PI / 2); append(g, 2, x, y, z);
  };
  const fixtures = root.userData.lightFixtures ??= [];
  for (const [index, source] of deckLightSources(t).entries()) {
    if (source.z < 1) continue;
    const x = source.x, z = source.y + 2.4, y = domestic ? 6.4 : 6.9;
    piece = { bounds: new T.Box3(), ranges: [] }; pieces.push(piece);
    const span = domestic ? 3.4 : industrial ? 6.6 : 5.8;
    box(0, x, y + .35, z, span, .28, .48);
    box(1, x, y + .52, z, span + .12, .075, .57);
    for(let n=-2;n<=2;n++){
      box(2,x+n*span/5,y+.57,z,span/5-.10,.024,.34);
      for(const side of [-1,1])box(1,x+n*span/5,y+.36,z+side*.25,.075,.23,.065);
    }
    if(!domestic)for(const side of [-1,1])pipe(x,y+.74,z+side*.20,span-.35,.055);
    for (const side of [-1, 1]) {
      box(0, x + side * span * .43, y + .9, z, .11, .9, .14);
      if (industrial) {
        for (const dz of [-.28, .28]) pipe(x, y + .12, z + dz, span, .11);
        for (let n = -2; n <= 2; n++) box(1, x + n * span / 5, y, z, .09, .09, 1.05);
      }
      const lampX = x + side * span * .30;
      box(0, lampX, y - .12, z, domestic ? .90 : 1.32, .23, domestic ? .7 : .65);
      box(1, lampX, y, z, domestic ? 1 : 1.42, .08, domestic ? .8 : .76);
      box(3, lampX, y - .25, z, domestic ? .68 : 1.12, .03, .43);
      // A tiny visible top witness allows the manufactured lamp to read from above.
      box(3, lampX, y + .06, z - .22, .45, .025, .055);
      fixtures.push({ x: lampX, y: y - .25, z, color: profile.key, nativeColor: true, gain: .3, poolWidth: 2.2, poolDepth: 4.4, distance: 10, poolStyle: 1 });
    }
    if (environment === 'communications') for (let n = 0; n < 5; n++) {
      box(2, x + (n - 2) * .25, y + .06, z + .5, .16, .14, 1.15);
      box(3, x + (n - 2) * .25, y + .15, z + .92, .07, .02, .16);
    }
    if (environment === 'containment') {
      box(1, x, y + .65, z, 1.3, .18, 1.2);
      for (const side of [-1, 1]) box(3, x + side * .52, y + .76, z, .08, .025, .8);
    }
    if (index === 0) root.userData.e10Ceiling = { environment, sourceCount: deckLightSources(t).filter(s => s.z > 1).length };
  }
  const meshes = buckets.map((b, i) => {
    if (!b.geometries.length) { b.material.dispose(); return undefined; }
    const g = mergeGeometries(b.geometries, false)!; b.geometries.forEach(p => p.dispose());
    const mesh = new T.Mesh(g, b.material); mesh.name = b.material.name;
    mesh.castShadow = i !== 3; mesh.receiveShadow = i !== 3; mesh.userData.bakedEnvironment = true; mesh.userData.e10HighDetail = true;
    (g.getAttribute('color') as T.BufferAttribute).setUsage(T.DynamicDrawUsage); root.add(mesh); return mesh;
  });
  const cutaways: InteriorCutaway[] = pieces.map(p => ({ bounds: p.bounds, hidden: false, parts: p.ranges.map(r => ({ colors: meshes[r.finish]!.geometry.getAttribute('color') as T.BufferAttribute, start: r.start, end: r.end })) }));
  registerOriginalInteriorCutaways(root, cutaways);
}

/** Low retains baked decks and recessed kit hardware, without overhead extras. */
export function setCeilingQuality(world: T.Object3D, high: boolean): void {
  world.userData.e10LowTier = !high; setDeckQuality(world, high);
  world.traverse(o => { if (o.userData.e10HighDetail) o.visible = high; });
}
