import {getRoomDamage} from '../gameAdapter';
import {MELEE_ATTACKS} from '../../game/enemies/meleeAttacks';
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
    case 'enemy-charge': return `${family} charge`;
    case 'enemy-projectile': return `${family} ${receipt.enemyFamily === 'spitter' ? 'acid shot' : 'projectile'}`;
    case 'acid-pool': return receipt.enemyFamily ? `${family} acid pool` : 'Acid pool';
    case 'boss-attack': return receipt.enemyFamily ? `${family} area blast` : 'Boss attack';
    default: return 'Direct damage · source unrecorded';
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
  for (const receipt of getRoomDamage(game)) {
    const label = receipt.guardian ? `${receipt.guardian==='warden'?'Warden':'Matron'} ${receipt.source==='enemy-charge'?'charge':'strike'}` : incomingDamageLabel(receipt);
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

const lessons = {
  crawler: [`Back off the swipe fan. Use the Crawler’s ${MELEE_ATTACKS.crawler.recoveryMs} ms base recovery to shoot.`, 'M23 27 61 8Q81 27 61 46ZM57 27h25m-8-6 8 6-8 6'],
  stalker: ['Step sideways when the lunge line locks.', 'M23 21h54v12H23zM55 29V6m-6 6 6-6 6 6'],
  spitter: ['Break the sightline behind solid cover.', 'M24 26h23m19 0h14m-32-15h16v30H48zm30 17v17m-6-6 6 6 6-6'],
  brute: ['Sidestep the overhead strike, then shoot during recovery.', 'M24 16h43v22H24zm31 11v17m-6-6 6 6 6-6m19-17h13'],
  warden: ['Bait the charge into a wall, then shoot while the Warden is stunned.', 'M24 27h53m-9-7 9 7-9 7m14-23v32M58 27V8m-6 6 6-6 6 6'],
  carrier: ['Back away from the brood-claw slam and shoot during recovery.', 'M24 16h43v22H24zm31 11v17m-6-6 6 6 6-6'],
  matron: ['Shoot the pods or focus the Matron to interrupt its brood.', 'M26 27h16m14 0h21m-17-10-7 10 7 10m20-10-7-9m7 9-7 9'],
} as const;

export function retryLesson(game: DepthGame): string {
  const top=getRoomDamage(game)[0];
  const family=top?.enemyFamily;
  const key=top?.guardian??family;
  if(!key||key==='queen'||!Object.hasOwn(lessons,key))return '';
  const [copy,path]=lessons[key];
  return `<aside class="retry-lesson"><svg viewBox="0 0 96 54" width="96" height="54" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><circle cx="15" cy="27" r="8"/><path d="${path}"/></svg><p><b>TRY NEXT RUN</b><br>${escapeHtml(copy)}</p></aside>`;
}
