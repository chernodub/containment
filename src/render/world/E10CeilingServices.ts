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
  if (!profile || ['diagnostic-gallery','safety-interlock-station','manual-control-chamber'].includes(t.id)) return;
  const domestic = environment === 'habitation', industrial = ['cargo', 'engineering', 'maintenance', 'infested'].includes(environment);
  const finishes = [
    new T.MeshStandardMaterial({ name: 'e10-overhead-steel', color: industrial ? 0x52615c : 0x55646c, roughness: .7, metalness: .45, vertexColors: true, alphaTest: .3 }),
    new T.MeshStandardMaterial({ name: 'e10-overhead-cap', color: domestic ? 0xc5b897 : 0xadc1bd, roughness: .8, metalness: .15, vertexColors: true, alphaTest: .3 }),
    new T.MeshStandardMaterial({ name: 'e10-overhead-service', color: environment === 'infested' ? 0x685467 : industrial ? 0x967d52 : 0x314b53, roughness: .6, metalness: .55, vertexColors: true, alphaTest: .3 }),
    new T.MeshStandardMaterial({ name: 'e10-fixture-source', color: profile.key, emissive: profile.key, emissiveIntensity: 2.8, roughness: .7, vertexColors: true, alphaTest: .3 }),
    new T.MeshStandardMaterial({ name: 'e10-status-lamps', color:0xd6a36a, emissive:0xffb65a, emissiveIntensity:2.5, roughness:.7, vertexColors:true, alphaTest:.3 }),
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
    if (t.id === 'transmission-chamber' && source.x < 6.25) {
      const ring = new T.TorusGeometry(1.55,.13,8,24); ring.rotateX(-Math.PI/2); append(ring,1,x,y+.3,z);
      const gasket = new T.TorusGeometry(1.34,.055,6,24); gasket.rotateX(-Math.PI/2); append(gasket,2,x,y+.3,z);
      for(let n=0;n<8;n++){
        const angle=n*Math.PI/4,lx=x+Math.cos(angle)*1.55,lz=z+Math.sin(angle)*1.55;
        box(0,lx,y+.32,lz,.18,.20,.18);
      }
      for(const side of [-1,1]){
        box(0,x+side*2.0,y+.15,z,.52,.35,1.1);box(3,x+side*2.0,y+.34,z,.23,.035,.62);
        fixtures.push({x:x+side*2.0,y:y+.2,z,color:profile.key,nativeColor:true,gain:.3,poolWidth:2.2,poolDepth:4.4,distance:10,poolStyle:1});
      }
      continue;
    }
    if (domestic) {
      for (const side of [-1,1]) {
        const lx=x+side*1.1;
        append(new T.CylinderGeometry(.53,.78,.3,16),1,lx,y,z);
        append(new T.CylinderGeometry(.66,.66,.045,16),3,lx,y-.17,z);
        append(new T.CylinderGeometry(.16,.16,.14,12),0,lx,y+.23,z);
        box(0,lx,y+.78,z,.055,1.05,.055);
        box(1,lx,y+1.31,z,.42,.055,.42);
        fixtures.push({x:lx,y:y-.2,z,color:profile.key,nativeColor:true,gain:.3,poolWidth:2.2,poolDepth:4.4,distance:10,poolStyle:1});
      }
      continue;
    }
    const span = environment === 'communications' ? 4.8 : industrial ? 6.2 : 5.2;
    box(0, x, y + .35, z, span, .28, .48);
    box(1, x, y + .52, z, span + .12, .075, .57);
    for(let n=-2;n<=2;n++){
      box(2,x+n*span/5,y+.57,z,span/5-.10,.024,.34);
      for(const side of [-1,1])box(1,x+n*span/5,y+.36,z+side*.25,.075,.23,.065);
    }
    if(!domestic)for(const side of [-1,1])pipe(x,y+.74,z+side*.20,span-.35,.055);
    for (const side of [-1, 1]) {
      box(0, x + side * span * .43, y + 1.55, z, .075, 2.4, .09);
      if (industrial) {
        for (const dz of [-.28, .28]) pipe(x, y + .12, z + dz, span, .11);
        for (let n = -2; n <= 2; n++) box(1, x + n * span / 5, y, z, .09, .09, 1.05);
      }
      const lampX = x + side * span * .30;
      if(['containment','communications','maintenance'].includes(environment))box(4,lampX,y+.13,z+.25,.18,.08,.14);
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
    if (environment === 'cryogenics') for(const side of [-1,1]) {
      const tube=new T.CylinderGeometry(.20,.20,1.5,12);tube.rotateZ(Math.PI/2);append(tube,1,x+side*1.35,y+.78,z);
      for(const dx of [-.55,.55])box(0,x+side*1.35+dx,y+.78,z,.08,.44,.46);
    }
    if (environment === 'cargo' || environment === 'maintenance') for(const side of [-1,1]) {
      const wheel=new T.TorusGeometry(environment==='cargo'?.38:.29,.055,6,16);wheel.rotateX(-Math.PI/2);append(wheel,2,x+side*1.55,y+.85,z);
      box(1,x+side*1.55,y+.85,z,.055,.055,.54);box(1,x+side*1.55,y+.85,z,.54,.055,.055);
    }
    if (environment === 'engineering' || environment === 'reactor') {
      box(2,x,y+.8,z,1.7,.35,.72);
      for(let n=-4;n<=4;n++)box(1,x+n*.17,y+1.0,z,.045,.22,.82);
    }
    if (environment === 'infested') {
      const curve=new T.CatmullRomCurve3([new T.Vector3(-span/2,.7,-.3),new T.Vector3(-1,1,.36),new T.Vector3(.9,.67,-.27),new T.Vector3(span/2,.91,.16)]);
      append(new T.TubeGeometry(curve,16,.13,6,false),2,x,y,z);
      for(const side of [-1,1])append(new T.SphereGeometry(.17,10,6),3,x+side*1.3,y+.99,z+.13);
    }
    if (environment === 'containment') {
      box(1, x, y + .65, z, 1.3, .18, 1.2);
      for (const side of [-1, 1]) box(3, x + side * .52, y + .76, z, .08, .025, .8);
      append(new T.CylinderGeometry(.38,.44,.13,16),0,x,y+.82,z);
      const lens=new T.TorusGeometry(.28,.045,6,16);lens.rotateX(-Math.PI/2);append(lens,3,x,y+.90,z);
    }

  }
  root.userData.e10Ceiling = { environment, sourceCount: pieces.length };
  const meshes = buckets.map((b, i) => {
    if (!b.geometries.length) { b.material.dispose(); return undefined; }
    const g = mergeGeometries(b.geometries, false)!; b.geometries.forEach(p => p.dispose());
    const mesh = new T.Mesh(g, b.material); mesh.name = b.material.name;
    mesh.castShadow = i < 3; mesh.receiveShadow = i < 3; mesh.userData.bakedEnvironment = true; mesh.userData.e10HighDetail = true;
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
