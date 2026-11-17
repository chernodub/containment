import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/** Static incident evidence, all built before preparation. Geometry has no
 * collision ownership and each room owns its one vertex-colour finish. */
export function addDress13ServiceDetails(root: T.Group, id: string): void {
  const parts: T.BufferGeometry[] = [];
  const steel = 0x657174, rubber = 0x202b30, stain = 0x343739, frost = 0x9baeb3;
  const put = (g: T.BufferGeometry, color: number) => {
    const p = g.getAttribute('position'), c = new T.Color(color), colors = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) c.toArray(colors, i * 3);
    g.setAttribute('color', new T.BufferAttribute(colors, 3));
    parts.push(g.index ? g.toNonIndexed() : g);
    if (g.index) g.dispose();
  };
  const box = (x: number, y: number, z: number, w: number, h: number, d: number, color: number, yaw = 0) => {
    const g = new T.BoxGeometry(w, h, d); g.rotateY(yaw); g.translate(x / 32, y, z / 32); put(g, color);
  };
  const line = (a: number[], b: number[], r: number, color: number) => {
    const from = new T.Vector3(a[0] / 32, a[1], a[2] / 32), to = new T.Vector3(b[0] / 32, b[1], b[2] / 32), v = to.clone().sub(from);
    const g = new T.CylinderGeometry(r, r, v.length(), 5); g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), v.normalize()));
    g.translate(...from.add(to).multiplyScalar(.5).toArray()); put(g, color);
  };
  // Flush dragged/scuffed paths use broken narrow strokes, not luminous marks.
  const scuff = (x: number, z: number, length: number, yaw: number, color = stain) => {
    for (let i = 0; i < 4; i++) box(x + i * 3, .012 + i * .0003, z + i * 2, .025 + i * .007, .003, length * (1 - i * .12), color, yaw);
  };
  const tool = (x: number, z: number, yaw: number, y = .035) => {
    box(x, y, z, .055, .035, .42, steel, yaw);
    box(x - Math.sin(yaw) * 5, y + .006, z - Math.cos(yaw) * 5, .13, .045, .1, rubber, yaw);
  };
  const shards = (x: number, z: number, color = steel, y = .035) => {
    for (let i = 0; i < 7; i++) {
      const g = new T.CircleGeometry(.09 + i % 3 * .04, 3); g.rotateX(-Math.PI / 2); g.rotateY(i * 1.37); g.translate((x + Math.sin(i * 2.3) * 19) / 32, y + i * .001, (z + Math.cos(i * 1.7) * 10) / 32); put(g, color);
    }
  };
  if (id === 'freight-hold') {
    scuff(794, 513, 2.2, 1.3); scuff(835, 514, 1.2, 1.1);
    shards(804, 510, 0x697374);
    for (let i = 0; i < 3; i++) box(815 + i * 10, .035, 500 - i * 4, .24, .05, .18, 0x65716b, i * .6);
  } else if (id === 'breached-loading-bay') {
    scuff(391, 457, 2.8, -.58); scuff(415, 434, 2.8, -.58);
    box(399, .013, 451, .075, .003, 2.5, stain, -.58);
    box(412, .014, 443, .06, .003, 2.2, stain, -.58);
    // Suppression foam follows the torn shoulder instead of spilling into the
    // lower turning floor. Low irregular scallops read differently from ice.
    for (let i = 0; i < 14; i++) {
      const g = new T.SphereGeometry(.18 + i % 3 * .04, 7, 4); g.scale(1, .13, .7); g.translate((548 + i * 8) / 32, .025, (433 + Math.sin(i * 1.7) * 8) / 32); put(g, 0xa3aaa0);
    }
    shards(590, 438, steel);
  } else if (id === 'relay-racks') {
    tool(622, 538, .3, .29); tool(680, 533, 1.7, .29);
    for (let i = 0; i < 5; i++) {
      const x = 628 + i * 7;
      line([x, .5, 452], [x + 5, .26, 479], .014, 0x677e7d);
      line([x + 3, .26, 490], [x + 10, .24, 511], .014, rubber);
      box(638 + i * 7, .27, 558, .08, .015, .2, 0x5b706c, i * .45);
    }
    scuff(640, 571, .8, .4);
  } else if (id === 'transmission-chamber') {
    tool(801, 394, .7, .18); tool(849, 395, 2, .18);
    line([813, .2, 389], [821, .15, 401], .025, rubber);
    line([823, .15, 402], [837, .18, 391], .025, rubber);
    shards(850, 399, 0x526c6d, .14);
    // Frozen last transmission is part of the abandoned operator station.
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#172a2c'; ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#8ca49a'; ctx.font = 'bold 32px monospace'; ctx.fillText('TRANSMISSION HELD', 22, 48);
    ctx.font = '24px monospace'; ctx.fillText('DO NOT OPEN THE DOCK', 22, 100); ctx.fillText('WE ARE STILL INSIDE', 22, 137);
    ctx.fillStyle = '#5d7770'; ctx.fillText('CARRIER LOST / 00:17', 22, 211);
    const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace;
    const screen = new T.Mesh(new T.PlaneGeometry(1.5, .75), new T.MeshStandardMaterial({map: texture, roughness: 1, metalness: 0, side: T.DoubleSide}));
    (screen.material as T.Material).userData.actorMaterial = true;
    (screen.material as T.Material).addEventListener('dispose', () => texture.dispose());
    screen.name = 'dress13-last-transmission'; screen.rotation.x = -.65; screen.position.set(835 / 32, 1.15, 365 / 32); root.add(screen);
  } else if (id === 'diagnostic-gallery') {
    shards(788, 351, 0x86989a, .18);
    // Torn restraint tongues and severed diagnostic leads leave the empty
    // cradle's mouth open; restrained dark ichor is confined to the bed.
    for (let i = 0; i < 3; i++) {
      line([765 + i * 19, .35, 335], [771 + i * 19, .7, 350], .035, rubber);
      line([774 + i * 19, .7, 352], [781 + i * 19, .3, 358], .025, rubber);
    }
    scuff(777, 355, .7, 1.2, 0x453b43);
  } else if (id === 'safety-interlock-station') {
    // A silvery weld seam and short stress gouges are on the solid rear
    // interlock frame, rather than a new barrier in either native doorway.
    for (let i = 0; i < 12; i++) box(624 + i * 4.5, .45 + i % 2 * .06, 344, .15, .045, .025, 0x89918b, .1);
    for (let i = 0; i < 5; i++) line([641 + i * 4, .7, 344], [646 + i * 4, 1.1 + i % 2 * .2, 344], .012, steel);
    tool(620, 367, .2); shards(673, 369);
  } else if (id === 'coolant-plant') {
    for (let i = 0; i < 11; i++) {
      const g = new T.SphereGeometry(.23 + i % 3 * .06, 7, 4); g.scale(1, .05, 1.5); g.translate((654 + i * 7) / 32, .022, (386 + Math.sin(i * 1.7) * 14) / 32); put(g, frost);
    }
    line([641, .95, 340], [651, .8, 351], .065, steel);
    line([657, .75, 357], [670, .65, 365], .065, steel);
    // Muted buff/charcoal tape, well below danger's saturated palette.
    line([626, .67, 407], [729, .67, 398], .016, 0x9a9477);
    for (let i = 0; i < 10; i++) box(631 + i * 10, .67, 406 - i * .9, .11, .055, .025, i % 2 ? rubber : 0x9a9477);
  } else if (id === 'service-shaft-landing') {
    line([430, 1.1, 324], [455, -.7, 370], .045, steel);
    line([471, 1, 328], [491, .25, 347], .04, rubber);
    for (let i = 0; i < 6; i++) line([491, .25, 347], [498 + i * 2, .1 - i * .05, 352 + i * 2], .008, steel);
    tool(403, 326, .4, .2); tool(435, 324, 1.4, .2);
    shards(458, 318, steel, .17);
  }
  if (!parts.length) return;
  const geometry = mergeGeometries(parts, false)!; for (const p of parts) p.dispose();
  const material = new T.MeshStandardMaterial({vertexColors: true, roughness: .94, metalness: .08}); material.name = 'dress13-incident-evidence'; material.userData.actorMaterial = true;
  const mesh = new T.Mesh(geometry, material); mesh.name = 'dress13-service-details'; mesh.receiveShadow = true; mesh.userData.visualOnly = true;
  root.add(mesh);
}
