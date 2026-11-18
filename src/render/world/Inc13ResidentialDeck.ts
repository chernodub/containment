import * as T from 'three';
import {paintIncidentDeck} from './Inc13DeckPaint';

export function residentialRunnerGeometry(): T.BufferGeometry {
  const path = new T.CatmullRomCurve3([
    new T.Vector3(115, 0, 160), new T.Vector3(170, 0, 237),
    new T.Vector3(230, 0, 301), new T.Vector3(319, 0, 311),
    new T.Vector3(402, 0, 263),
  ]);
  const rows = 96, columns = 40;
  // Extra samples at the selvage keep the woven stripes narrow through the bends.
  const cross = [.0, .017, .032, .049,
    ...Array.from({length: columns - 7}, (_, i) => .065 + .87 * i / (columns - 8)),
    .951, .968, .983, 1];
  const positions: number[] = [], colors: number[] = [], indices: number[] = [];
  const linen = new T.Color(0x557c79), hem = new T.Color(0xa58b6b), binding = new T.Color(0x605446);
  const color = new T.Color();
  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    const center = path.getPoint(t), tangent = path.getTangent(t);
    const width = 65 + 40 * Math.sin(Math.PI * t) ** 2 + 7 * Math.sin(16 * t);
    for (let col = 0; col < cross.length; col++) {
      const u = cross[col];
      const edge = Math.abs(2 * u - 1) ** 5;
      const offset = (u - .5) * width + edge * (2.6 * Math.sin(43 * t + u * 6) + 1.1 * Math.sin(109 * t));
      const fray = (1 - t) ** 18 - t ** 18;
      const tear = fray * (4 + 4 * Math.sin(29 * u) + 2 * Math.sin(103 * u) + 7 * Math.max(0, 1 - Math.abs(u - .62) * 13));
      const fold = .5 + .5 * Math.sin(29 * u + 8 * t + 1.7 * Math.sin(17 * t + u * 4));
      const crease = .5 + .5 * Math.sin(47 * t - 10 * u + 2 * Math.sin(u * 8));
      const height = .042 + .045 * fold ** 4 + .028 * crease ** 5 * (.3 + .7 * edge);
      positions.push(
        (center.x + tangent.z * offset + tangent.x * tear) / 32,
        height,
        (center.z - tangent.x * offset + tangent.z * tear) / 32,
      );
      const border = Math.min(u, 1 - u);
      color.copy(border < .02 ? binding : border < .05 ? hem : linen);
      // The woven blanket has crossbands at its ends and a broken check.
      // Keep broad patches of solid cloth between the bands.
      if(border>.05){
        const band=row%23;
        if(band===2||band===3)color.lerp(hem,.56);
        if((col===9||col===10||col===29)&&band>3)color.lerp(hem,.29);
      }
      color.multiplyScalar(.76 + .3 * fold + .12 * crease + .065 * Math.sin(row * 2.1 + col * 3.4));
      colors.push(color.r, color.g, color.b);
      if (row && col) {
        const d = row * cross.length + col, c = d - 1;
        const b = d - cross.length, a = b - 1;
        indices.push(a, c, b, b, c, d);
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function addResidentialCasterDust(root: T.Group): void {
  const trail = new T.CubicBezierCurve(
    new T.Vector2(188, 235), new T.Vector2(256, 339),
    new T.Vector2(324, 337), new T.Vector2(418, 272),
  );
  paintIncidentDeck(root, 'inc13-residential-caster-scuffs', [158, 209, 292, 145], c => {
    for (let i = 0; i <= 38; i++) {
      const t = i / 38;
      const point = trail.getPoint(t), direction = trail.getTangent(t);
      const spread = 8 + 10 * Math.sin(i * 1.73);
      const radius = 12 + 8 * (.5 + .5 * Math.sin(i * 2.3));
      c.save();
      c.translate(point.x - direction.y * spread, point.y + direction.x * spread);
      c.rotate(Math.atan2(direction.y, direction.x));
      c.scale(1.6, 1);
      const dust = c.createRadialGradient(0, 0, 0, 0, 0, radius);
      dust.addColorStop(0, 'rgba(149,124,98,.22)');
      dust.addColorStop(.55, 'rgba(132,112,91,.15)');
      dust.addColorStop(1, 'rgba(132,112,91,0)');
      c.fillStyle = dust;
      c.fillRect(-radius, -radius, radius * 2, radius * 2);
      c.restore();
    }
  }, .032);
}
