import type {DepthGame} from '../../DepthGame';
import type {IncomingDamageReceipt, RunStatsSnapshot} from '../../game/abilities/RunStats';
import {ENEMIES} from '../../game/enemies/catalog';
import {generateRun} from '../../game/roguelike/run';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {SACRIFICE_ENDING} from '../../game/roguelike/storyRooms';
import {escapeHtml} from './initialTemplates';
import {endingTransmission} from './endingTransmission';

/** Name only the source carried by the actual hurt receipt, never a nearby threat. */
export function incomingDamageLabel(receipt: Pick<IncomingDamageReceipt, 'source' | 'enemyFamily'>): string {
  const family = receipt.enemyFamily ? ENEMIES[receipt.enemyFamily].label : 'Enemy';
  switch (receipt.source) {
    case 'enemy-contact': return `${family} ${receipt.enemyFamily ? ({crawler:'scythe swipe',stalker:'scythe lunge',brute:'cleaver sweep',spitter:'mortar-mouth bite',carrier:'brood-claw slam',queen:'strike'}[receipt.enemyFamily]) : 'melee strike'}`;
    case 'enemy-projectile': return `${family} ${receipt.enemyFamily === 'spitter' ? 'acid shot' : 'projectile'}`;
    case 'acid-pool': return receipt.enemyFamily ? `${family} acid pool` : 'Acid pool';
    case 'boss-attack': return receipt.enemyFamily ? `${family} area blast` : 'Boss attack';
    default: return 'Unidentified damage';
  }
}

/** Fatal source and the three largest room damage sources lead the debrief. */
export function incomingDamageReport(game: DepthGame, stats: RunStatsSnapshot): string {
  const last = stats.lastDamage;
  if (!last) {
    return '<section class="incoming-report" aria-label="Failure analysis"><span class="eyebrow">FAILURE ANALYSIS</span><h3>Damage source unavailable</h3><p>This run has no recorded incoming-damage history.</p></section>';
  }
  const node = generateRun(game.expedition.run.seed, game.expedition.run.version).nodes.find(candidate => candidate.id === last.room);
  const room = node ? ROOM_TEMPLATES[node.templateId].name : 'Unknown room';
  const sources = new Map<string, number>();
  for (const receipt of game.roomDamage) {
    const label = incomingDamageLabel(receipt);
    sources.set(label, (sources.get(label) ?? 0) + receipt.amount);
  }
  const grouped = [...sources].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3);
  const total = grouped.reduce((sum, [, amount]) => sum + amount, 0);
  const format = (amount: number) => Math.round(amount).toLocaleString('en-US');
  return `<section class="incoming-report" aria-label="Failure analysis"><div class="fatal-source"><span class="eyebrow">FATAL HIT</span><h3>${escapeHtml(incomingDamageLabel(last))}</h3><p>${escapeHtml(room)} <span>· ${format(last.amount)} damage</span></p></div><div class="incoming-breakdown"><div class="telemetry-heading"><span class="eyebrow">THIS ROOM · TOP DAMAGE SOURCES</span><strong>${format(total)} TOP THREE</strong></div>${grouped.length ? `<ol>${grouped.map(([label, amount]) => `<li><span>${escapeHtml(label)}</span><i aria-hidden="true" style="--incoming-share:${total ? amount / total * 100 : 0}%"></i><strong>${format(amount)}</strong></li>`).join('')}</ol>` : '<p>No other recent damage recorded.</p>'}</div></section>`;
}

/** Preserve the authored ending verbatim and give it a full-screen moment. */
export function completionEnding(game: DepthGame): string {
  const story = game.storyRoom;
  const exactEnding = story ? SACRIFICE_ENDING : 'Containment restored.';
  return `<section class="completion-ending" aria-label="Expedition ending" data-ending="${story ? 'sacrifice' : 'restored'}"><span class="eyebrow">${story ? 'FINAL TRANSMISSION' : 'EXPEDITION COMPLETE'}</span>${story ? endingTransmission() : ''}<h2 class="ending-exact">${escapeHtml(exactEnding)}</h2><span class="ending-rule" aria-hidden="true"></span></section>`;
}
