import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/** Static incident evidence, all built before preparation. Geometry has no
 * collision ownership and each room owns its one vertex-colour finish. */
export function addDress13ServiceDetails(root: T.Group, id: string): void {
  const parts: T.BufferGeometry[] = [];
  const steel = 0x657174, rubber = 0x202b30, stain = 0x343739, frost = 0x829ca4;
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
    for (let i = 0; i < 4; i++) box(x + i * 3, .024 + i * .0003, z + i * 2, .025 + i * .007, .003, length * (1 - i * .12), color, yaw);
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
    scuff(370, 345, 2.5, 1.1); scuff(424, 349, 1.4, 1.1);
    shards(405, 342, 0x697374);
    for (let i = 0; i < 4; i++) box(405 + i * 15, .04, 339 - i % 2 * 10, .3, .07, .22, 0x65716b, i * .6);
  } else if (id === 'breached-loading-bay') {
    scuff(345, 522, 3.2, -.58); scuff(382, 485, 3.0, -.58); scuff(415, 434, 2.8, -.58);
    box(399, .024, 451, .075, .002, 2.5, stain, -.58);
    box(412, .025, 443, .06, .002, 2.2, stain, -.58);
    // Suppression foam follows the torn shoulder instead of spilling into the
    // lower turning floor. Low irregular scallops read differently from ice.
    for (let i = 0; i < 14; i++) {
      const g = new T.SphereGeometry(.18 + i % 3 * .04, 7, 4); g.scale(1, .13, .7); g.translate((470 + i * 5) / 32, .026, (400 + i * 4 + Math.sin(i * 1.7) * 4) / 32); put(g, 0xa3aaa0);
    }
    shards(590, 438, steel);
  } else if (id === 'relay-racks') {
    tool(545, 422, .3); tool(548, 462, 1.7);
    for (let i = 0; i < 5; i++) {
      const x = 589 + i * 3;
      line([x + 12, 1.15, 398], [x - 20, .035, 430], .035, 0x677e7d);
      line([x - 20, .035, 442], [x - 26, .035, 468], .03, rubber);
      box(566 + i * 7, .025, 465, .14, .025, .28, 0x5b706c, i * .45);
    }
    box(603, 1.2, 410, .04, 1.5, 1.3, rubber);
    scuff(550, 435, 1.1, .4); shards(554, 456);
  } else if (id === 'transmission-chamber') {
    tool(885, 431, .7); tool(930, 433, 2);
    scuff(883, 447, 1.8, .6);
    for (let i = 0; i < 4; i++) box(859 + i * 12, .04, 431 + i % 2 * 10, .22, .035, .3, 0x778280, i * .5);
    line([905, .7, 401], [912, .035, 428], .025, rubber);
    line([915, .035, 432], [938, .035, 417], .025, rubber);
    shards(932, 428, 0x526c6d);
    // Frozen last transmission is part of the abandoned operator station.
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#172a2c'; ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#b1c2b6'; ctx.font = 'bold 32px monospace'; ctx.fillText('TRANSMISSION HELD', 22, 48);
    ctx.font = '24px monospace'; ctx.fillText('DO NOT OPEN THE DOCK', 22, 100); ctx.fillText('WE ARE STILL INSIDE', 22, 137);
    ctx.fillStyle = '#5d7770'; ctx.fillText('CARRIER LOST / 00:17', 22, 211);
    const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace;
    const screen = new T.Mesh(new T.PlaneGeometry(2.1, 1.05), new T.MeshStandardMaterial({map: texture, roughness: 1, metalness: 0, emissive: 0xffffff, emissiveMap: texture, emissiveIntensity: .12, side: T.DoubleSide}));
    (screen.material as T.Material).userData.actorMaterial = true;
    (screen.material as T.Material).addEventListener('dispose', () => texture.dispose());
    screen.name = 'dress13-last-transmission'; screen.rotation.x = -.65; screen.position.set(905 / 32, 1.15, 390 / 32); root.add(screen);
  } else if (id === 'diagnostic-gallery') {
    shards(385, 377, 0x86989a);
    // Transport cradle lid and restraint tongues were torn toward the aisle.
    for (let i = 0; i < 3; i++) {
      line([332 + i * 19, .65, 337], [343 + i * 19, .25, 366], .055, rubber);
      line([346 + i * 19, .25, 369], [354 + i * 19, .035, 390], .035, rubber);
    }
    scuff(386, 396, 1.5, 1.2, 0x453b43);
    scuff(360, 365, 1.2, .25, 0x4b3744);
  } else if (id === 'safety-interlock-station') {
    // A narrow service door is welded across the cage's existing north wall,
    // left of the cylinder machine, with its face toward the spawn camera.
    box(565, 1.025, 350, 1.4, 1.95, .09, 0x839095);
    for (let i = 0; i < 15; i++) box(565 + i % 2, .16 + i * .12, 352, .09, .09, .035, 0xa8ad9f);
    for (let i = 0; i < 10; i++) box(545 + i * 4.2, .55 + i % 2 * .06, 353, .15, .045, .025, 0x89918b);
    for (let i = 0; i < 5; i++) line([546 + i * 4, 1.15, 353], [551 + i * 4, 1.65 + i % 2 * .1, 353], .025, rubber);
    tool(490, 369, .2); tool(484, 340, 1.4); shards(479, 353);
    scuff(481, 353, 1.5, .5);
  } else if (id === 'coolant-plant') {
    for (let i = 0; i < 11; i++) {
      const g = new T.SphereGeometry(.23 + i % 3 * .06, 7, 4); g.scale(1, .05, 1.5); g.translate((284 + i * 7) / 32, .024, (308 + i * 2 + Math.sin(i * 1.7) * 8) / 32); put(g, frost);
    }
    line([268, 1.5, 282], [279, .8, 294], .09, steel);
    line([285, .65, 301], [307, .25, 313], .08, steel);
    box(347, .67, 326, 3.2, .2, .05, 0xb6b19a, .09);
    for (let i = 0; i < 10; i++) box(300 + i * 10, .67, 330 - i * .9, .16, .21, .07, i % 2 ? rubber : 0xb6b19a);
    tool(354, 306, .7); shards(325, 333, frost);
  } else if (id === 'service-shaft-landing') {
    line([430, 1.1, 324], [417, -.7, 465], .045, steel);
    line([471, 1, 328], [440, .25, 420], .04, rubber);
    for (let i = 0; i < 6; i++) line([440, .25, 420], [447 + i * 2, .1 - i * .05, 425 + i * 2], .008, steel);
    tool(403, 326, .4, .2); tool(435, 324, 1.4, .2);
    shards(458, 318, steel, .17);
  }
  if (!parts.length) return;
  const geometry = mergeGeometries(parts, false)!; for (const p of parts) p.dispose();
  const material = new T.MeshStandardMaterial({vertexColors: true, roughness: .94, metalness: .08}); material.name = 'dress13-incident-evidence'; material.userData.actorMaterial = true;
  const mesh = new T.Mesh(geometry, material); mesh.name = 'dress13-service-details'; mesh.receiveShadow = true; mesh.userData.visualOnly = true;
  root.add(mesh);
}
