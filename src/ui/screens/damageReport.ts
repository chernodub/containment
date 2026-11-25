import {studioImage} from '../studioArt';
import {getRoomDamage} from '../gameAdapter';
import {MELEE_ATTACKS, meleeStrikeContains} from '../../game/enemies/meleeAttacks';
import type {DepthGame} from '../../DepthGame';
import type {AttackFootprint} from "../../game/enemies/LastExchange";
import type {IncomingDamageReceipt, RunStatsSnapshot} from '../../game/abilities/RunStats';
import {ENEMIES} from '../../game/enemies/catalog';
import {generateRun} from '../../game/roguelike/run';
import {canTraverseExpedition} from '../../game/world/expeditionGeometry';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {SACRIFICE_ENDING} from '../../game/roguelike/storyRooms';
import {escapeHtml} from './initialTemplates';
import {endingTransmission} from './endingTransmission';

/** Name only the source carried by the actual hurt receipt, never a nearby threat. */
export function incomingDamageLabel(receipt: Pick<IncomingDamageReceipt, 'source' | 'enemyFamily'>): string {
  const family = receipt.enemyFamily ? ENEMIES[receipt.enemyFamily].label : 'Enemy';
  switch (receipt.source) {
    case 'enemy-contact': return `${family} ${receipt.enemyFamily ? ({crawler:'scythe swipe',stalker:'scythe lunge',brute:'cleaver sweep',spitter:'mortar-mouth bite',carrier:'brood-claw slam',queen:'strike'}[receipt.enemyFamily]) : 'melee strike'}`;
    case 'enemy-charge': return `${family} charge`;
    case 'enemy-projectile': return `${family} ${receipt.enemyFamily === 'spitter' ? 'acid shot' : 'projectile'}`;
    case 'acid-pool': return receipt.enemyFamily ? `${family} acid pool` : 'Acid pool';
    case 'boss-attack': return receipt.enemyFamily ? `${family} area blast` : 'Boss attack';
    case 'self-blast': return 'Your own blast';
    case 'scripted': return 'Scripted damage';
    case 'unknown': return 'Unknown damage source';
  }
}

/** Fatal source and the three largest room damage sources lead the debrief. */
export function incomingDamageReport(game: DepthGame, stats: RunStatsSnapshot): string {
  const last = stats.lastDamage;
  if (!last) {
    return '<section class="incoming-report" aria-label="Failure analysis"><span class="eyebrow">FAILURE ANALYSIS</span><h3>Damage source unavailable</h3><p>This run has no recorded incoming-damage history.</p></section>';
  }
  const dodge = fatalDodge(last);
  const ready=game.deathReadyAbility;
  const escape=ready?`<p class="fatal-escape">${ready[0].toUpperCase()+ready.slice(1)} was ready</p>`:'';
  const node = generateRun(game.expedition.run.seed, game.expedition.run.version).nodes.find(candidate => candidate.id === last.room);
  const room = node ? ROOM_TEMPLATES[node.templateId].name : 'Unknown room';
  const sources = new Map<string, number>();
  for (const receipt of getRoomDamage(game)) {
    const label = receipt.guardian ? `${receipt.guardian==='warden'?'Warden':'Matron'} ${receipt.source==='enemy-charge'?'charge':'strike'}` : incomingDamageLabel(receipt);
    sources.set(label, (sources.get(label) ?? 0) + receipt.amount);
  }
  const grouped = [...sources].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3);
  const total = grouped.reduce((sum, [, amount]) => sum + amount, 0);
  const format = (amount: number) => Math.round(amount).toLocaleString('en-US');
  return `<section class="incoming-report" aria-label="Failure analysis"><div class="fatal-source"><span class="eyebrow">FATAL HIT</span><h3>${escapeHtml(incomingDamageLabel(last))}</h3><p>${escapeHtml(room)} <span>· ${format(last.amount)} HP + armor lost on final hit</span></p>${dodge ? `<p class="fatal-escape">${escapeHtml(dodge)}</p>` : ''}${escape}</div><div class="incoming-breakdown"><div class="telemetry-heading"><span class="eyebrow">THIS ROOM · LOSS BY SOURCE</span></div>${grouped.length ? `<ol>${grouped.map(([label, amount]) => `<li><span>${escapeHtml(label)}</span><i aria-hidden="true" style="--incoming-share:${total ? amount / total * 100 : 0}%"></i><strong>${format(amount)}</strong></li>`).join('')}</ol>` : '<p>No room damage totals recorded.</p>'}</div></section>`;
}

/** Preserve the authored ending verbatim and give it a full-screen moment. */
export function completionEnding(game: DepthGame): string {
  const story = game.storyRoom;
  const exactEnding = story ? SACRIFICE_ENDING : 'Containment restored.';
  return `<section class="completion-ending" aria-label="Expedition ending" data-ending="${story ? 'sacrifice' : 'restored'}"><span class="eyebrow">${story ? 'FINAL TRANSMISSION' : 'EXPEDITION COMPLETE'}</span>${story ? endingTransmission() : ''}<h2 class="ending-exact">${escapeHtml(exactEnding)}</h2><span class="ending-rule" aria-hidden="true"></span></section>`;
}

const lessons = {
  crawler: `Back off the swipe fan. Use the Crawler’s ${MELEE_ATTACKS.crawler.recoveryMs} ms base recovery to shoot.`,
  stalker: 'Step sideways when the lunge line locks.',
  spitter: 'Break the sightline behind solid cover.',
  brute: 'Sidestep the overhead strike, then shoot during recovery.',
  warden: 'Bait the charge into a wall, then shoot while the Warden is stunned.',
  carrier: 'Back away from the brood-claw slam and shoot during recovery.',
  matron: 'Shoot the pods or focus the Matron to interrupt its brood.',
} as const;

function fatalDodge(receipt: IncomingDamageReceipt): string {
  switch (receipt.source) {
    case 'enemy-charge': return 'Step sideways out of the locked charge lane.';
    case 'enemy-contact':
      return receipt.enemyFamily === 'brute' ? 'Sidestep the sweep before it lands.'
        : receipt.enemyFamily === 'stalker' ? lessons.stalker : 'Move out of the marked strike area.';
    case 'enemy-projectile': return 'Break the sightline behind solid cover.';
    case 'acid-pool': return 'Step off the acid before it ticks.';
    case 'boss-attack': return 'Leave the marked blast area.';
    case 'self-blast': return 'Back away from the blast radius.';
    default: return '';
  }
}

export function retryLesson(game: DepthGame): string {
  const top=getRoomDamage(game)[0];
  const family=top?.enemyFamily;
  const key=top?.guardian??family;
  if(!top||!key||key==='queen'||!Object.hasOwn(lessons,key))return '';
  const copy=lessons[key];
  return `<aside class="retry-lesson">${studioImage(`lesson-${key}`,'retry-lesson-art',320,180)}<p><b>Most damage — ${escapeHtml(top.guardian ? `${top.guardian==='warden'?'Warden':'Matron'} ${top.source==='enemy-charge'?'charge':'strike'}` : incomingDamageLabel(top))}</b><br>${escapeHtml(copy)}</p></aside>`;
}

/** Plot local collision geometry and the footprints retained by the death receipt. */
export function lastExchangeDiagram(game: DepthGame): string {
  const exchange = game.deathExchange;
  if (!exchange) return '';
  const {marine, fatal, attacks, blockers} = exchange;
  const shapes = fatal ? [...attacks, fatal] : attacks;
  const xy = (x: number, y: number) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  const mapAttack = (attack: AttackFootprint) => {
    const {shape, x, y, angle} = attack;
    const point = (direction: number) => xy(x + Math.cos(direction) * shape.range, y + Math.sin(direction) * shape.range);
    const body = shape.kind === 'line'
      ? `<path d="M${xy(x,y)} L${point(angle)}" stroke-width="${shape.width}" stroke-linecap="round"/>`
      : `<path d="M${xy(x,y)} L${point(angle-shape.halfAngle)} A${shape.range} ${shape.range} 0 0 1 ${point(angle+shape.halfAngle)} Z"/>`;
    const labelX = Math.max(marine.x - 176, Math.min(marine.x + 176, x));
    const labelY = Math.max(marine.y - 73, Math.min(marine.y + 90, y - 12));
    return `<g class="exchange-attack" data-fatal="${attack === fatal}" data-committed="${attack.committed}">${body}<circle cx="${x}" cy="${y}" r="4"/><text x="${labelX}" y="${labelY}">${ENEMIES[attack.family].label}</text></g>`;
  };
  const contains = (attack: AttackFootprint, x: number, y: number) =>
    meleeStrikeContains(attack.shape, attack.x, attack.y, attack.angle, x, y, marine.radius);
  const escapes = fatal ? [1, -1].map(side => {
    const angle = fatal.angle + side * Math.PI / 2;
    const dx = Math.cos(angle) * 74, dy = Math.sin(angle) * 74;
    const blocked = !canTraverseExpedition(game.geometry, marine, {x:marine.x+dx,y:marine.y+dy}, marine.radius)
      || [0.25, .5, .75, 1].some(step => {
      const x = marine.x + dx * step, y = marine.y + dy * step;
      return attacks.some(attack => contains(attack, x, y)) || step === 1 && contains(fatal, x, y);
    });
    return {dx, dy, blocked};
  }) : [];
  const recommended = escapes.find(escape => !escape.blocked);
  const lesson = recommended && escapes.some(escape => escape.blocked) ? 'Use the clear side of the strike.'
    : recommended ? 'Leave the marked strike before it lands.'
    : fatal && attacks.length ? 'Move before the lanes overlap.' : 'Review the marked attack lanes.';
  const exit = recommended ? `<path class="exchange-exit" d="M0 0 L${xy(recommended.dx,recommended.dy)}"/><circle class="exchange-exit" cx="${recommended.dx}" cy="${recommended.dy}" r="5"/>` : '';
  return `<figure class="last-exchange retry-lesson"><figcaption><b>Last exchange</b><span>${lesson}</span></figcaption>
    <svg role="img" aria-label="Local map. White arrowhead: marine. Coral: fatal attack. Amber: other attack footprints. Green dotted line: clear side when available." viewBox="${marine.x-190} ${marine.y-93} 380 190">
      ${blockers.map(b=>`<rect class="exchange-cover" x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}"/>`).join('')}
      ${shapes.map(mapAttack).join('')}
      <g transform="translate(${marine.x} ${marine.y})">${exit}<path class="exchange-marine" transform="rotate(${marine.angle * 180 / Math.PI})" d="M13 0 -9 -8 -6 0 -9 8Z"/></g>
    </svg></figure>`;
}
