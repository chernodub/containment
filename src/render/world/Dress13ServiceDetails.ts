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
    tool(592, 575, .3); tool(600, 604, 1.7);
    for (let i = 0; i < 5; i++) {
      const x = 607 + i * 7;
      line([x, 1.15, 545], [x - 22, .035, 575], .02, 0x677e7d);
      line([x - 20, .035, 583], [x - 7, .035, 610], .02, rubber);
      box(605 + i * 7, .025, 610, .08, .015, .2, 0x5b706c, i * .45);
    }
    scuff(605, 607, .8, .4);
  } else if (id === 'transmission-chamber') {
    tool(885, 431, .7); tool(930, 433, 2);
    line([905, .7, 401], [912, .035, 428], .025, rubber);
    line([915, .035, 432], [938, .035, 417], .025, rubber);
    shards(932, 428, 0x526c6d);
    // Frozen last transmission is part of the abandoned operator station.
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#172a2c'; ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#8ca49a'; ctx.font = 'bold 32px monospace'; ctx.fillText('TRANSMISSION HELD', 22, 48);
    ctx.font = '24px monospace'; ctx.fillText('DO NOT OPEN THE DOCK', 22, 100); ctx.fillText('WE ARE STILL INSIDE', 22, 137);
    ctx.fillStyle = '#5d7770'; ctx.fillText('CARRIER LOST / 00:17', 22, 211);
    const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace;
    const screen = new T.Mesh(new T.PlaneGeometry(1.7, .85), new T.MeshStandardMaterial({map: texture, roughness: 1, metalness: 0, emissive: 0xffffff, emissiveMap: texture, emissiveIntensity: .12, side: T.DoubleSide}));
    (screen.material as T.Material).userData.actorMaterial = true;
    (screen.material as T.Material).addEventListener('dispose', () => texture.dispose());
    screen.name = 'dress13-last-transmission'; screen.rotation.x = -.65; screen.position.set(905 / 32, 1.15, 390 / 32); root.add(screen);
  } else if (id === 'diagnostic-gallery') {
    shards(813, 390, 0x86989a);
    // Torn restraint tongues and severed diagnostic leads leave the empty
    // cradle's mouth open; restrained dark ichor is confined to the bed.
    for (let i = 0; i < 3; i++) {
      line([765 + i * 19, .85, 353], [771 + i * 19, .35, 379], .045, rubber);
      line([774 + i * 19, .35, 384], [781 + i * 19, .035, 394], .035, rubber);
    }
    scuff(807, 398, .9, 1.2, 0x453b43);
  } else if (id === 'safety-interlock-station') {
    // Buckled access leaves close the camera-facing equipment opening. Their
    // plane stays behind the first legal marine centre along this solid.
    box(632, 1.025, 397, 1.12, 1.95, .09, 0x59666a, -.025);
    box(668, 1.025, 397, 1.12, 1.95, .09, 0x637075, .025);
    for (let i = 0; i < 15; i++) box(650 + i % 2, .16 + i * .12, 399, .09, .09, .035, 0x92978c);
    // A silvery weld seam and short stress gouges are on the solid rear
    // interlock frame, rather than a new barrier in either native doorway.
    for (let i = 0; i < 12; i++) box(624 + i * 4.5, .55 + i % 2 * .06, 402, .15, .045, .025, 0x89918b, .1);
    for (let i = 0; i < 5; i++) line([623 + i * 4, 1.15, 399], [628 + i * 4, 1.65 + i % 2 * .1, 399], .025, rubber);
    tool(620, 410, .2); shards(673, 410);
  } else if (id === 'coolant-plant') {
    for (let i = 0; i < 11; i++) {
      const g = new T.SphereGeometry(.23 + i % 3 * .06, 7, 4); g.scale(1, .05, 1.5); g.translate((654 + i * 7) / 32, .022, (389 + i * 2.5 + Math.sin(i * 1.7) * 10) / 32); put(g, frost);
    }
    line([657, .95, 382], [667, .8, 393], .065, steel);
    line([674, .65, 400], [687, .35, 408], .065, steel);
    // Muted buff/charcoal tape, well below danger's saturated palette.
    box(678, .67, 403, 3.2, .11, .025, 0x9a9477, .09);
    for (let i = 0; i < 10; i++) box(631 + i * 10, .67, 407 - i * .9, .11, .12, .03, i % 2 ? rubber : 0x9a9477);
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
