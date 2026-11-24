// HERO24: per rig, portrait | calm play crop | fight crop (padded marineBounds), through hero19_sheet.py.
// node tools/assets/k12-hero/hero24_sheet.mjs <capture-label> [room=relay-racks] [frame=04]
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const [label, room = 'relay-racks', frame = '04'] = process.argv.slice(2);
const dir = `artifacts/nextgen/${label}`;
const man = JSON.parse(readFileSync(`${dir}/manifest.json`, 'utf8'));
const shots = Object.values(man).filter(v => Array.isArray(v) && v[0]?.scenario).flat();
const find = o => { if (o && typeof o === 'object') { if (o.marineBounds?.left !== undefined) return o.marineBounds; for (const x of Object.values(o)) { const r = find(x); if (r) return r; } } };
const box = (file, b, pad = 34) => `${dir}/${file}:${Math.round(b.left - pad)}:${Math.round(b.top - pad)}:${Math.round(b.right + pad)}:${Math.round(b.bottom + pad)}`;
const specs = [];
for (const rig of ['breacher', 'cryo', 'pyro', 'arc']) {
  specs.push(`public/assets/ui/studio/portrait-${rig}.png:0:0:640:640`);
  const calm = shots.find(s => s.scenario === `k10-calm-${rig}` && s.file.includes(room));
  const fight = shots.find(s => s.scenario === `value14-overlap-${rig}` && s.file.endsWith(`-${frame}.png`));
  if (calm) specs.push(box(calm.file, find(calm)));
  if (fight) specs.push(box(fight.file, find(fight)));
}
execFileSync('blender', ['-b', '-P', 'tools/assets/k12-hero/hero19_sheet.py', '--', `artifacts/nextgen/hero24/${label}-sheet.png`, '240', ...specs], { stdio: 'ignore' });
console.log(`artifacts/nextgen/hero24/${label}-sheet.png`);
