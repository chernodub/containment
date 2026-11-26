import {exchangeEnemy, exchangeMarine} from './exchangeGlyphs';
import {ENEMY_ATTACK_SHAPES} from '../../game/enemies/attackShapes';
import {WEAPONS} from '../../game/combat/catalog';
import {AREA_ATTACK_RADIUS} from '../../game/enemies/QueenBossSystem';
import {getRoomDamage} from '../gameAdapter';
import {MELEE_ATTACKS, meleeStrikeContains} from '../../game/enemies/meleeAttacks';
import type {DepthGame} from '../../DepthGame';
import type {AttackFootprint, LastExchange} from "../../game/enemies/LastExchange";
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
    return `<section class="incoming-report" aria-label="Failure analysis"><div class="fatal-details"><span class="eyebrow">FAILURE ANALYSIS</span><h3>Damage source unavailable</h3><p>This run has no recorded incoming-damage history.</p>${actions}</div>${lastExchangeDiagram(game)}</section>`;
  }
  const diagram = lastExchangeDiagram(game);
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
  return `<section class="incoming-report" aria-label="Failure analysis"><div class="fatal-details"><div class="fatal-source"><span class="eyebrow">FATAL HIT</span><h3>${escapeHtml(incomingDamageLabel(last))}</h3><p>${escapeHtml(room)} <span>· ${format(last.amount)} HP + armor lost on final hit</span></p>${escape}</div>${actions}</div>${diagram}</section><section class="incoming-breakdown" aria-label="Cumulative room loss"><div class="telemetry-heading"><span class="eyebrow">CUMULATIVE ROOM LOSS BY SOURCE</span></div>${grouped.length ? `<ol>${grouped.map(([label, amount]) => `<li><span>${escapeHtml(label)}</span><i aria-hidden="true" style="--incoming-share:${total ? amount / total * 100 : 0}%"></i><strong>${format(amount)}</strong></li>`).join('')}</ol>` : '<p>No room damage totals recorded.</p>'}</section>`;
}

/** Preserve the authored ending verbatim and give it a full-screen moment. */
export function completionEnding(game: DepthGame): string {
  const story = game.storyRoom;
  const exactEnding = story ? SACRIFICE_ENDING : 'Containment restored.';
  return `<section class="completion-ending" aria-label="Expedition ending" data-ending="${story ? 'sacrifice' : 'restored'}"><span class="eyebrow">${story ? 'FINAL TRANSMISSION' : 'EXPEDITION COMPLETE'}</span>${story ? endingTransmission() : ''}<h2 class="ending-exact">${escapeHtml(exactEnding)}</h2><span class="ending-rule" aria-hidden="true"></span></section>`;
}

/** A cause-specific illustration for old or incomplete receipts. */
function attackGuide(receipt: RunStatsSnapshot['lastDamage']): LastExchange {
  const source = receipt?.source;
  const family = receipt?.enemyFamily ?? (source==='enemy-projectile'?'spitter':source==='enemy-charge'?'brute':'queen');
  const marine = {x:55,y:0,angle:Math.PI,radius:16};
  const earlier = {...marine,x:65,y:40};
  let shape: AttackFootprint['shape'] = {kind:'circle',range:AREA_ATTACK_RADIUS};
  if (source==='enemy-contact' && family!=='queen') shape=MELEE_ATTACKS[family].shape;
  if (source==='enemy-charge') shape={kind:'line',range:ENEMY_ATTACK_SHAPES.chargeSpeed*ENEMY_ATTACK_SHAPES.chargeDurationMs/1000,width:2*ENEMIES.brute.radius,halfAngle:0};
  if (source==='enemy-projectile') shape={kind:'line',range:ENEMY_ATTACK_SHAPES.spitterProjectileSpeed*ENEMY_ATTACK_SHAPES.spitterProjectileLife,width:2*ENEMY_ATTACK_SHAPES.spitterProjectileRadius,halfAngle:0};
  if(source==='acid-pool') shape={kind:'circle',range:AREA_ATTACK_RADIUS*.75};
  if(source==='self-blast') shape={kind:'circle',range:WEAPONS.rocket.splashRadius};
  const known=source && source!=='scripted' && source!=='unknown';
  const x=source==='enemy-projectile'?-90:source==='enemy-contact'?marine.x-Math.min(shape.range*.72,75):0;
  return {marine,earlier,attacks:[],blockers:source==='enemy-projectile'?[{x:-25,y:-90,width:104,height:20}]:[],
    fatal:known?{owner:-1,family,x,y:0,angle:0,shape,at:0,committed:true}:undefined};
}

/** Plot local collision geometry and the footprints retained by the death receipt. */
export function lastExchangeDiagram(game: DepthGame): string {
  const receipt = game.stats.lastDamage;
  if (!receipt || receipt.source === 'scripted' || receipt.source === 'unknown') {
    return `<div class="exchange-facts"><h3>Recorded damage</h3><p>${receipt ? `${incomingDamageLabel(receipt)} · ${Math.round(receipt.amount)} HP + armor lost` : 'No damage receipt available.'}</p><p>Attack position and direction unavailable.</p></div>`;
  }
  const recorded = !!game.deathExchange?.fatal;
  const exchange = recorded ? game.deathExchange! : attackGuide(game.stats.lastDamage);
  const {marine, earlier, fatal, attacks, blockers} = exchange;
  const shapes = fatal ? [...attacks, fatal] : attacks;
  const xy = (x: number, y: number) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  const contains = (attack: AttackFootprint, x: number, y: number) => attack.shape.kind === 'circle'
    ? Math.hypot(x-attack.x,y-attack.y) <= attack.shape.range+marine.radius
    : meleeStrikeContains(attack.shape, attack.x, attack.y, attack.angle, x, y, marine.radius);
  // Search outward from the impact. Keep steps traversable from the earlier pose
  // when available, so an obstacle crossed later does not suggest an escape.
  let step: {x:number;y:number} | undefined = fatal ? undefined : {x:marine.x,y:marine.y-45};
  const away = earlier ? Math.atan2(marine.y-earlier.y,marine.x-earlier.x) : 0;
  for (let distance=52; distance<=240 && !step; distance+=4) {
    for (let direction=0; direction<64; direction++) {
      const angle = away + Math.ceil(direction/2) * (direction%2 ? 1 : -1) * Math.PI / 32;
      const point = {x:marine.x+distance*Math.cos(angle),y:marine.y+distance*Math.sin(angle)};
      if (shapes.some(attack => contains(attack,point.x,point.y) ||
        contains(attack,point.x-8*Math.cos(angle),point.y-8*Math.sin(angle)))) continue;
      if (recorded && (!canTraverseExpedition(game.geometry, marine, point, marine.radius)
        || earlier && !canTraverseExpedition(game.geometry, earlier, point, marine.radius))) continue;
      if (!recorded && blockers.some(b => point.x>=b.x-marine.radius&&point.x<=b.x+b.width+marine.radius
        && point.y>=b.y-marine.radius&&point.y<=b.y+b.height+marine.radius)) continue;
      step = point;
      break;
    }
  }
  const focus: {x:number;y:number}[] = [marine, ...(earlier ? [earlier] : []), ...(step ? [step] : [])];
  if (fatal) {
    const reach = fatal.shape.range;
    if (fatal.shape.kind === 'circle') {
      focus.push({x:fatal.x-reach,y:fatal.y-reach},{x:fatal.x+reach,y:fatal.y+reach});
    } else {
      const trailing = fatal.shape.kind === 'line' ? Math.min(reach, 120) : reach;
      focus.push({x:marine.x-Math.cos(fatal.angle)*trailing,y:marine.y-Math.sin(fatal.angle)*trailing});
      for (const angle of [fatal.angle-fatal.shape.halfAngle,fatal.angle+fatal.shape.halfAngle]) {
        const length = fatal.shape.kind === 'line' ? Math.min(reach, Math.hypot(marine.x-fatal.x,marine.y-fatal.y)+30) : reach;
        focus.push({x:fatal.x+Math.cos(angle)*length,y:fatal.y+Math.sin(angle)*length});
      }
    }
  }
  const left = Math.min(...focus.map(p=>p.x))-25;
  const right = Math.max(...focus.map(p=>p.x))+25;
  const top = Math.min(...focus.map(p=>p.y))-25;
  const bottom = Math.max(...focus.map(p=>p.y))+25;
  const glyphScale = Math.max(1.1,(bottom-top)/217,(right-left)/548);
  const mapAttack = (attack: AttackFootprint) => {
    const {shape, x, y, angle} = attack;
    const point = (direction: number) => xy(x + Math.cos(direction) * shape.range, y + Math.sin(direction) * shape.range);
    const body = shape.kind === 'circle' ? `<circle cx="${x}" cy="${y}" r="${shape.range}"/>`
      : shape.kind === 'line' ? `<path d="M${xy(x,y)} L${point(angle)}" stroke-width="${shape.width}" stroke-linecap="round"/>`
      : `<path d="M${xy(x,y)} L${point(angle-shape.halfAngle)} A${shape.range} ${shape.range} 0 0 1 ${point(angle+shape.halfAngle)} Z"/>`;
    return `<g class="exchange-attack" data-fatal="${attack === fatal}">${body}</g>`;
  };
  const pose = (p: typeof marine, ghost = false) => exchangeMarine(p.x,p.y,p.angle,ghost,glyphScale);
  const movement = earlier ? Math.hypot(earlier.x-marine.x,earlier.y-marine.y) : 0;
  const held = earlier && movement < 29*glyphScale;
  const tracePoint = (distance:number) => xy(
    marine.x-Math.cos(away)*distance*glyphScale, marine.y-Math.sin(away)*distance*glyphScale);
  const path = held
    ? movement > 1 ? `<path class="exchange-trail" d="M${tracePoint(23)} L${tracePoint(14)}"/>` : ''
    : earlier ? `<path class="exchange-trail" d="M${xy(earlier.x,earlier.y)} L${xy(marine.x,marine.y)}"/>${pose(earlier,true)}` : '';
  const exit = step ? `<path class="exchange-exit" marker-end="url(#exchange-arrow)" d="M${xy(marine.x,marine.y)} L${xy(step.x,step.y)}"/>` : '';
  const coverEdge = (blocker: typeof blockers[number]) => {
    if (!fatal || !step || fatal.shape.kind === 'circle') return '';
    const dx = step.x-fatal.x, dy = step.y-fatal.y;
    const edges = [
      [blocker.x,blocker.y,blocker.x+blocker.width,blocker.y],
      [blocker.x,blocker.y+blocker.height,blocker.x+blocker.width,blocker.y+blocker.height],
      [blocker.x,blocker.y,blocker.x,blocker.y+blocker.height],
      [blocker.x+blocker.width,blocker.y,blocker.x+blocker.width,blocker.y+blocker.height],
    ];
    return edges.map(([x,y,endX,endY])=>{
      const horizontal = y===endY;
      const t = horizontal ? (y-fatal.y)/dy : (x-fatal.x)/dx;
      const crossing = horizontal ? fatal.x+t*dx : fatal.y+t*dy;
      if (!(t>0 && t<1 && crossing >= (horizontal?x:y) && crossing <= (horizontal?endX:endY))) return '';
      return `<path d="M${xy(x,y)} L${xy(endX,endY)}" stroke="#d4e7ef" stroke-width="5" vector-effect="non-scaling-stroke"/>`;
    }).join('');
  };
  const advice = !fatal ? 'Move toward clear ground when the danger cue appears.' : step ? 'Take the marked step before the attack lands.' : 'Reposition earlier, before the attack lanes close.';
  const family = game.stats.lastDamage?.source === 'self-blast' ? 'Your blast' : fatal ? ENEMIES[fatal.family].label : 'Unrecorded attack';
  const reachLabel = fatal ? `${recorded&&receipt.source==='enemy-projectile'?'Shot travelled':'Reach'} ${(fatal.shape.range/32).toFixed(1)} m` : '';
  return `<figure class="last-exchange" aria-label="Last exchange">
    <div class="exchange-key"><b>${family} · ${recorded?'fatal attack':'attack guide'}</b><span>${held?(movement>1?'Short movement · ◆ Impact':'Held position · ◆ Impact'):earlier?'◇ Earlier · ◆ Impact':'◆ Impact'}${step?' · → Step':''}${blockers.length?' · ▰ Cover':''}</span></div>
    <svg role="img" aria-label="${recorded?'Recorded fatal footprint, nearby attacks, marine poses and clearing step when available.':'Illustrated attack guide and clearing step.'}" viewBox="${left} ${top} ${right-left} ${bottom-top}">
      <defs><marker id="exchange-arrow" markerWidth="5" markerHeight="5" refX="4.5" refY="2.5" orient="auto"><path fill="#b5ffcb" d="M0 0 5 2.5 0 5Z"/></marker></defs>
      ${blockers.map(b=>`<rect class="exchange-cover" x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}"/>`).join('')}
      ${shapes.map(mapAttack).join('')}${fatal?`<circle class="exchange-range" cx="${fatal.x}" cy="${fatal.y}" r="${fatal.shape.kind==='line'?Math.min(fatal.shape.range,marine.radius*2):fatal.shape.range}"/>`:''}
      ${shapes.filter(attack=>attack.shape.kind!=='circle').map(attack=>exchangeEnemy(attack.family,attack.x,attack.y,attack.angle,glyphScale)).join('')}${blockers.map(coverEdge).join('')}${path}${pose(marine)}${exit}
    </svg><figcaption>${advice} ${reachLabel?`<span class="exchange-reach-label"> · ${reachLabel}</span>`: ''}</figcaption></figure>`;
}
