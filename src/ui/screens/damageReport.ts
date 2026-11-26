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
export function incomingDamageReport(game: DepthGame, stats: RunStatsSnapshot, actions: string): string {
  const last = stats.lastDamage;
  if (!last) {
    return `<section class="incoming-report" aria-label="Failure analysis"><div class="fatal-details"><span class="eyebrow">FAILURE ANALYSIS</span><h3>Damage source unavailable</h3><p>This run has no recorded incoming-damage history.</p>${actions}</div></section>`;
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
  return `<section class="incoming-report" aria-label="Failure analysis"><div class="fatal-details"><div class="fatal-source"><span class="eyebrow">FATAL HIT</span><h3>${escapeHtml(incomingDamageLabel(last))}</h3><p>${escapeHtml(room)} <span>· ${format(last.amount)} HP + armor lost on final hit</span></p>${!game.deathExchange && dodge ? `<p class="fatal-escape">${escapeHtml(dodge)}</p>` : ''}${escape}</div>${actions}</div>${lastExchangeDiagram(game) || retryLesson(game)}</section><section class="incoming-breakdown" aria-label="Cumulative room loss"><div class="telemetry-heading"><span class="eyebrow">CUMULATIVE ROOM LOSS BY SOURCE</span></div>${grouped.length ? `<ol>${grouped.map(([label, amount]) => `<li><span>${escapeHtml(label)}</span><i aria-hidden="true" style="--incoming-share:${total ? amount / total * 100 : 0}%"></i><strong>${format(amount)}</strong></li>`).join('')}</ol>` : '<p>No room damage totals recorded.</p>'}</section>`;
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
  const top=game.stats.lastDamage;
  const key=top?.enemyFamily;
  if(!top||!key||key==='queen'||!Object.hasOwn(lessons,key))return '';
  const copy=lessons[key];
  return `<aside class="retry-lesson">${studioImage(`lesson-${key}`,'retry-lesson-art',320,180)}<p>${escapeHtml(copy)}</p></aside>`;
}

/** Plot local collision geometry and the footprints retained by the death receipt. */
export function lastExchangeDiagram(game: DepthGame): string {
  const exchange = game.deathExchange;
  if (!exchange?.fatal) return '';
  const {marine, earlier, fatal, attacks, blockers} = exchange;
  const shapes = [...attacks, fatal];
  const xy = (x: number, y: number) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  const contains = (attack: AttackFootprint, x: number, y: number) => attack.shape.kind === 'circle'
    ? Math.hypot(x-attack.x,y-attack.y) <= attack.shape.range+marine.radius
    : meleeStrikeContains(attack.shape, attack.x, attack.y, attack.angle, x, y, marine.radius);
  // Search outward from the impact. Keep steps traversable from the earlier pose
  // when available, so an obstacle crossed later does not suggest an escape.
  let step: {x:number;y:number} | undefined;
  for (let distance=4; distance<=240 && !step; distance+=4) {
    for (let direction=0; direction<64; direction++) {
      const angle = direction * Math.PI / 32;
      const point = {x:marine.x+distance*Math.cos(angle),y:marine.y+distance*Math.sin(angle)};
      if (shapes.some(attack => contains(attack,point.x,point.y))) continue;
      if (!canTraverseExpedition(game.geometry, marine, point, marine.radius)) continue;
      if (earlier && !canTraverseExpedition(game.geometry, earlier, point, marine.radius)) continue;
      step = point;
      break;
    }
  }
  const left = Math.min(marine.x-105, fatal.x-40, earlier?.x??marine.x, step?.x??marine.x)-24;
  const right = Math.max(marine.x+105, fatal.x+40, earlier?.x??marine.x, step?.x??marine.x)+24;
  const top = Math.min(marine.y-90, fatal.y-36, earlier?.y??marine.y, step?.y??marine.y)-24;
  const bottom = Math.max(marine.y+90, fatal.y+36, earlier?.y??marine.y, step?.y??marine.y)+24;
  const mapAttack = (attack: AttackFootprint) => {
    const {shape, x, y, angle} = attack;
    const point = (direction: number) => xy(x + Math.cos(direction) * shape.range, y + Math.sin(direction) * shape.range);
    const body = shape.kind === 'circle' ? `<circle cx="${x}" cy="${y}" r="${shape.range}"/>`
      : shape.kind === 'line' ? `<path d="M${xy(x,y)} L${point(angle)}" stroke-width="${shape.width}" stroke-linecap="round"/>`
      : `<path d="M${xy(x,y)} L${point(angle-shape.halfAngle)} A${shape.range} ${shape.range} 0 0 1 ${point(angle+shape.halfAngle)} Z"/>`;
    return `<g class="exchange-attack" data-fatal="${attack === fatal}">${body}</g>`;
  };
  const pose = (position: typeof marine, ghost = false) => `<path class="exchange-marine${ghost?' exchange-ghost':''}" transform="translate(${xy(position.x,position.y)}) rotate(${position.angle*180/Math.PI})" d="M14 0 -10 -9 -7 0 -10 9Z"/>`;
  const held = earlier && Math.hypot(earlier.x-marine.x,earlier.y-marine.y) < 1;
  const path = held ? `<circle class="exchange-held" cx="${earlier.x}" cy="${earlier.y}" r="${marine.radius+7}"/>` : earlier ? `<path class="exchange-trail" d="M${xy(earlier.x,earlier.y)} L${xy(marine.x,marine.y)}"/>${pose(earlier,true)}` : '';
  const exit = step ? `<path class="exchange-exit" marker-end="url(#exchange-arrow)" d="M${xy(marine.x,marine.y)} L${xy(step.x,step.y)}"/>` : '';
  const advice = step ? 'Take the marked step before the attack lands.' : 'Reposition earlier, before the attack lanes close.';
  const family = game.stats.lastDamage?.source === 'self-blast' ? 'Your blast' : ENEMIES[fatal.family].label;
  return `<figure class="last-exchange" aria-label="Last exchange">
    <div class="exchange-key"><b>${family} · fatal attack</b><span>${held?'Earlier and impact coincide':earlier?'◇ Earlier · ◆ Impact':'◆ Impact'}${step?' · → Step':''}</span></div>
    <svg role="img" aria-label="Coral fatal footprint, muted nearby attacks, marine at impact and one second earlier, and a clear step when available." viewBox="${left} ${top} ${right-left} ${bottom-top}">
      <defs><marker id="exchange-arrow" markerWidth="5" markerHeight="5" refX="4.5" refY="2.5" orient="auto"><path fill="#b5ffcb" d="M0 0 5 2.5 0 5Z"/></marker></defs>
      ${blockers.map(b=>`<rect class="exchange-cover" x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}"/>`).join('')}
      ${shapes.map(mapAttack).join('')}${path}${pose(marine)}${exit}
    </svg><figcaption>${advice}</figcaption></figure>`;
}
