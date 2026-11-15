import * as T from 'three';
import type {Point} from '../../game/roguelike/types';
import type {ShipPlan} from '../../game/roguelike/shipArchitecturePlan';
import type {InteriorProfile} from './RoomInteriorProfiles';
import type {InteriorDeckChart} from './InteriorDeckGeometry';

/** Direction for retained machinery; this module does not activate any room. */
export const ACT2_INTERIOR_PROFILES: Record<string, InteriorProfile> = {
  'safety-interlock-station': {
    kind: 'interlock', deck: 0x284754, zone: 0x456575, trim: 0xd8cda8, key: 0xd3b15c,
    landmark: 'Recorder and AI gallery behind the sealed interlock gate',
  },
  'coolant-plant': {
    kind: 'coolant', deck: 0x9baf9d, zone: 0x748f7c, trim: 0x9ebfc2, key: 0x73cfbd,
    landmark: 'Paired horizontal pump banks with continuous valve headers',
  },
  'service-shaft-landing': {
    kind: 'shaft', deck: 0x5b5747, zone: 0x77705c, trim: 0xb8cbd0, key: 0xd8bd74,
    landmark: 'Open service shaft, docking balconies and local lift console',
  },
  'infested-workshop': {
    kind: 'workshop', deck: 0x4d424e, zone: 0x6d5967, trim: 0xabc3b0, key: 0xb6ca78,
    landmark: 'Lathe and wall gantry workbays consumed along their service seams',
  },
  'shielding-gate': {
    kind: 'shielding', deck: 0x333f5d, zone: 0x53627b, trim: 0xdfddc3, key: 0xb9a3e1,
    landmark: 'Offset shield banks framing the inspection scanner floor',
  },
  'containment-annulus': {
    kind: 'annulus', deck: 0xa6bcc3, zone: 0x809eaa, trim: 0xb6a9c6, key: 0xc1a7e2,
    landmark: 'Intact containment core surrounded by its inspection ring',
  },
  'manual-control-chamber': {
    kind: 'manual-control', deck: 0x8f836a, zone: 0xaa9b7a, trim: 0xa2b6bd, key: 0xd6b268,
    landmark: 'Guarded authorization console beneath the observation aperture',
  },
  'overload-floor': {
    kind: 'overload', deck: 0x23384c, zone: 0x3b5367, trim: 0xd1bea0, key: 0xf1d29e,
    landmark: 'Hot reactor core with reaction feed and exhaust galleries',
  },
};

const rect = (x: number, y: number, width: number, height: number): Point[] => [
  {x, y}, {x: x + width, y}, {x: x + width, y: y + height}, {x, y: y + height},
];

/** Quiet, flush, room-specific engineering diagrams. Exact deck intersections
 * are owned by the supplied chart; no inlay can bridge a void or machine base. */
export function buildAct2InteriorInlay(
  id: string, plan: ShipPlan, chart: InteriorDeckChart, base: T.Color, trim: T.Color,
): boolean {
  if (!Object.hasOwn(ACT2_INTERIOR_PROFILES, id)) return false;
  const a = plan.arena;
  const ink = base.clone().lerp(trim, .15);
  const recess = base.clone().multiplyScalar(.84);
  const faint = base.clone().lerp(trim, .07);
  const at = (x: number, y: number): Point => ({x: a.x + x, y: a.y + y});
  const line = (points: readonly (readonly [number, number])[], width: number, color = ink, y = .018) => {
    for (let i = 1; i < points.length; i++) chart.strip(at(...points[i - 1]), at(...points[i]), width, color, y);
  };
  const plate = (x: number, y: number, width: number, height: number, color = recess) =>
    chart.polygon(rect(a.x + x, a.y + y, width, height), color, .016);
  const arc = (x: number, y: number, radius: number, start: number, end: number, width: number, color = ink) => {
    const steps = Math.max(3, Math.ceil(Math.abs(end - start) * radius / 23));
    for (let i = 0; i < steps; i++) {
      const p = start + (end - start) * i / steps, q = start + (end - start) * (i + 1) / steps;
      chart.strip(at(x + radius * Math.cos(p), y + radius * Math.sin(p)), at(x + radius * Math.cos(q), y + radius * Math.sin(q)), width, color, .018);
    }
  };

  if (id === 'safety-interlock-station') {
    // Two staggered mechanical latches feed one closed authorization circuit.
    // A solid socket and an open keyway distinguish the two sequence stages.
    line([[-206, -76], [-136, -76], [-136, -30], [-66, -30], [-66, 30], [42, 30], [42, 76], [206, 76]], 7, recess, .016);
    line([[-206, -76], [-136, -76], [-136, -30], [-66, -30], [-66, 30], [42, 30], [42, 76], [206, 76]], 2.5, ink, .019);
    for (const [x, y] of [[-118, -76], [118, 76]]) {
      plate(x - 27, y - 22, 54, 44);
      line([[x - 20, y - 15], [x + 20, y - 15], [x + 20, y + 15], [x - 20, y + 15], [x - 20, y - 15]], 3, faint);
      line([[x - 12, y], [x + 12, y]], 5, ink);
    }
    line([[-30, -70], [-30, -48], [18, -48], [18, -70]], 4, faint);
    line([[58, -28], [80, -28], [80, 14]], 4, faint);
  } else if (id === 'coolant-plant') {
    // A pump inspection loop returns through a broad inset drain mouth.
    line([[-210, -66], [-116, -66], [-116, -96], [116, -96], [116, -66], [210, -66]], 11, recess, .016);
    line([[-210, 66], [-116, 66], [-116, 96], [116, 96], [116, 66], [210, 66]], 11, recess, .016);
    for (const x of [-116, 116]) {
      arc(x, 0, 39, Math.PI * .65, Math.PI * 2.35, 5, ink);
      line([[x - 14, -11], [x + 14, 0], [x - 14, 11]], 4, faint);
    }
    plate(-40, -32, 80, 64);
    line([[-32, -22], [32, -22], [32, 22], [-32, 22], [-32, -22]], 3, faint);
    for (const x of [-20, 0, 20]) line([[x - 5, -14], [x + 5, 14]], 5, ink);
  } else if (id === 'service-shaft-landing') {
    // Three broad, dogleg anti-slip treads identify the lift transfer apron.
    // Their interrupted middle leaves the marine on a calm material field.
    for (const y of [-86, -22, 42]) {
      chart.polygon([at(-114, y), at(54, y), at(78, y + 18), at(114, y + 18), at(114, y + 30), at(72, y + 30), at(48, y + 12), at(-114, y + 12)], recess, .016);
      line([[-108, y + 3], [50, y + 3], [74, y + 21], [108, y + 21]], 2, faint);
    }
    // One docking alignment frame reaches toward the actual balcony mouths.
    line([[-142, -116], [-142, 102], [-112, 102]], 4, ink);
    line([[142, -116], [142, 102], [112, 102]], 4, ink);
    plate(-26, 104, 52, 14, faint);
  } else if (id === 'infested-workshop') {
    // A three-jaw workholding chuck and its long lathe axis survive the growth.
    line([[-220, 0], [-104, 0]], 5, recess);
    line([[104, 0], [220, 0]], 5, recess);
    for (let jaw = 0; jaw < 3; jaw++) {
      const angle = jaw * Math.PI * 2 / 3;
      arc(0, 0, 97, angle + .15, angle + 1.75, 4, faint);
      const rotate = (x: number, y: number) => at(x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle));
      chart.polygon([[40, -17], [88, -17], [98, -9], [98, 9], [88, 17], [40, 17]].map(([x, y]) => rotate(x, y)), recess, .016);
      chart.strip(rotate(49, 0), rotate(86, 0), 3, ink, .018);
    }
    arc(0, 0, 37, 0, Math.PI * 2, 3, faint);
  } else if (id === 'shielding-gate') {
    // An open calibration bed, with unequal scales rather than a threat radius.
    for (const side of [-1, 1]) {
      line([[-184, side * 44], [-184, side * 104], [-94, side * 104]], 5, recess);
      line([[184, side * 44], [184, side * 104], [94, side * 104]], 5, recess);
      for (const x of [-132, -66, 0, 66, 132]) line([[x, side * 92], [x, side * (x === 0 ? 71 : 81)]], 3, faint);
    }
    plate(-52, -37, 104, 74, base.clone().multiplyScalar(.94));
    line([[-41, -26], [-41, 26]], 3, ink);
    line([[41, -26], [41, 26]], 3, ink);
    line([[-14, -26], [14, -26]], 3, faint);
    line([[-14, 26], [14, 26]], 3, faint);
  } else if (id === 'containment-annulus') {
    // Four broad status sectors reference the intact ring without drawing a
    // bright combat radius. The centre is left quiet below the marine.
    for (let sector = 0; sector < 4; sector++) {
      const start = sector * Math.PI / 2 + .11, end = (sector + 1) * Math.PI / 2 - .11;
      const ring: Point[] = [];
      for (let i = 0; i <= 7; i++) { const angle = start + (end - start) * i / 7; ring.push(at(125 * Math.cos(angle), 125 * Math.sin(angle))); }
      for (let i = 7; i >= 0; i--) { const angle = start + (end - start) * i / 7; ring.push(at(107 * Math.cos(angle), 107 * Math.sin(angle))); }
      chart.polygon(ring, sector % 2 ? recess : base.clone().multiplyScalar(.91), .016);
      const angle = (start + end) / 2;
      chart.strip(at(94 * Math.cos(angle), 94 * Math.sin(angle)), at(77 * Math.cos(angle), 77 * Math.sin(angle)), 5, faint, .018);
    }
    line([[-28, -22], [-28, 22], [28, 22]], 3, ink);
    line([[28, 7], [28, -22], [-13, -22]], 3, ink);
  } else if (id === 'manual-control-chamber') {
    // Two opposed physical keyways must meet one authorization socket.
    for (const sign of [-1, 1]) {
      const y = sign * 57, x = sign * -112;
      arc(x, y, 25, 0, Math.PI * 2, 6, recess);
      line([[x + sign * 25, y], [sign * 82, y], [sign * 82, y - sign * 16], [sign * 104, y - sign * 16]], 8, recess, .016);
      line([[sign * 29, y], [sign * 29, y + sign * 16]], 6, faint);
      line([[sign * 56, y], [sign * 56, y + sign * 12]], 6, faint);
    }
    line([[-31, -22], [-31, 22], [31, 22], [31, -22]], 4, faint);
    line([[-10, -31], [10, -31]], 4, ink);
  } else {
    // Long interlocking expansion joints flex toward the reaction feed.
    // Broad doglegs give a mechanical heat story without hot floor graphics.
    for (const row of [-1, 1]) {
      const y = row * 75;
      const joint: [number, number][] = [[-220, y], [-158, y], [-133, y - row * 22], [-78, y - row * 22], [-53, y + row * 14], [30, y + row * 14], [55, y - row * 22], [127, y - row * 22], [152, y], [220, y]];
      line(joint, 10, recess, .016);
      line(joint.map(([x, z]) => [x, z + row * 3]), 2, faint, .019);
    }
    // A slotted datum separates the joint halves at the central anchor.
    chart.polygon([at(-39, -22), at(30, -22), at(39, -13), at(39, 22), at(-30, 22), at(-39, 13)], base.clone().multiplyScalar(.93), .016);
    line([[-24, 0], [24, 0]], 4, ink);
  }
  return true;
}
