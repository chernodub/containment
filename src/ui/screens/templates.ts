import {escapeHtml,controlsScreen} from './initialTemplates';
export {escapeHtml,controlsScreen,titleScreen,systemScreen} from './initialTemplates';
export type {ContinueSummary} from './initialTemplates';
import type {DepthGame} from '../../DepthGame';
import {ABILITY_CATALOG, ABILITY_KEYS, ABILITY_SLOTS, RIG_CATALOG, RIG_IDS} from '../../game/abilities/catalog';
import type {RigId} from '../../game/abilities/contract';
import {familyCount} from '../../game/roguelike/builds';
import {boonHint, pathFor} from '../../game/roguelike/boonPaths';
import {MUTATION_CATALOG, type MutationDefinition} from '../../game/roguelike/mutationCatalog';
import {expeditionRewardOffers, rerollCost} from '../../game/roguelike/expedition';
import {progressionFor} from '../../game/roguelike/progression';
import {generateRun, ROOM_REWARD_LABELS, runLength} from '../../game/roguelike/run';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {storyRoomFor} from '../../game/roguelike/storyRooms';
import {getAbilities, getRunStats} from '../gameAdapter';
import {icon} from '../icons';
import {boonElement, boonIcon, boonPath, boonRuleLabel} from '../boonPresentation';
import {boonBenefit, boonNumbers} from '../boonBenefits';
import {formatDistance, playerFacingText, playerFacingStat} from '../units';
import {abilityVignette} from './abilityVignettes';
import {completionEnding, incomingDamageReport} from './damageReport';

/** Text coming from snapshots or saved state must never become HTML. */

const tag = (text: string) => `<span class="eyebrow">${text}</span>`;
const arrow = () => icon('arrow', 'screen-arrow');
const total = (game: DepthGame) => runLength(game.expedition.run.version);
const serial = (value: number) => String(value).padStart(2, '0');
const profiles: Readonly<Record<RigId, readonly [number, number, number]>> = {
  breacher: [2, 3, 2], cryo: [3, 2, 2], pyro: [1, 3, 3], arc: [3, 2, 3],
};
/** Qualitative combat identity, rather than a damage or cooldown statistic. */
function rigProfile(id: RigId): string {
  const names = ['Control', 'Burst', 'Mobility'];
  return `<span class="rig-profile" aria-label="Playstyle: ${names.map((name,index)=>`${name} ${['','low','medium','high'][profiles[id][index]]}`).join(', ')}">${names.map((name,index)=>`<span><small>${name}</small><span class="rig-profile-pips" aria-hidden="true">${[1,2,3].map(level=>`<i class="${level<=profiles[id][index]?'lit':''}"></i>`).join('')}</span></span>`).join('')}</span>`;
}


/** Four glanceable cards with complete rules available to both focus and pointer. */
export function abilityPreview(rig: RigId, owned: readonly string[] = []): string {
  return `<div class="ability-preview" role="region" aria-label="Ability manifest">${ABILITY_SLOTS.map(slot => {
    const ability = ABILITY_CATALOG[RIG_CATALOG[rig].abilities[slot]];
    const augments=owned.filter(id=>{const boon=MUTATION_CATALOG[id as keyof typeof MUTATION_CATALOG];return augmentSlots[id]===slot&&(!boon?.rig||boon.rig===rig);});
    const statValue=(label:string,value:string)=>{
      if(slot==='dash'&&label==='Charges'&&augments.includes('reserve-thruster'))value=String(ability.charges+1);
      if(label==='Duration'&&augments.includes('reinforced-bulwark'))value=`${ability.durationMs/1000+2} s`;
      if(label==='Radius'&&augments.includes('napalm-triplet'))value='80';
      if(label==='Targets'&&augments.includes('forked-overload')&&ability.shape.kind==='chain')value=String(ability.shape.maxTargets+2);
      return playerFacingStat(label,value);
    };
    return `<article class="ability-detail" tabindex="0" data-element="${ability.element}" aria-label="${escapeHtml(`${ability.name}. ${playerFacingText(ability.description)}`)}"><header><kbd>${ABILITY_KEYS[slot]}</kbd><span>${slot==='overdrive'?'OVERDRIVE':slot.toUpperCase()}</span>${augments.length?`<span class="ability-augment-badge">${augments.length} AUGMENT${augments.length>1?'S':''}</span>`:''}${icon(ability.id,'ability-detail-icon')}</header>${abilityVignette(ability)}<h3>${ability.name}</h3><p>${ability.summary}</p>${augments.length?`<p class="ability-changed-value">${augments.map(id=>augmentChange(id,rig)).join(' · ')}</p>`:''}<dl>${ability.stats.map(stat=>`<div><dt>${stat.label}</dt><dd>${statValue(stat.label,stat.value)}</dd></div>`).join('')}</dl><span class="ability-rules" role="tooltip">${playerFacingText(ability.description)}</span></article>`;
  }).join('')}</div>`;
}

export function rigScreen(selected: RigId): string {
  const rig = RIG_CATALOG[selected];
  return `<section class="panel rig-panel screen-enter" data-element="${rig.element}" aria-labelledby="rig-title">${tag('COMBAT SYSTEMS / 01')}<div class="screen-heading"><div><h2 id="rig-title">Choose your rig.</h2><p class="panel-intro">Four systems. One way through.</p></div><span class="keyboard-guide"><kbd>←</kbd><kbd>→</kbd> inspect · <kbd>1–4</kbd> select · <kbd>Enter</kbd> equip</span></div>
    <div class="rig-grid" role="group" aria-label="Combat rigs">${RIG_IDS.map((id,index)=>`<button class="rig-card ${id===selected?'selected':''}" data-rig="${id}" data-element="${RIG_CATALOG[id].element}" aria-pressed="${id===selected}"><span class="rig-number">${serial(index+1)} <kbd>${index+1}</kbd></span>${icon(id,'rig-emblem')}<h3>${RIG_CATALOG[id].name}</h3><p>${RIG_CATALOG[id].tagline}</p>${rigProfile(id)}<span class="rig-path sr-only">${RIG_CATALOG[id].boonPath}</span></button>`).join('')}</div>
    <div class="rig-detail-head" data-element="${rig.element}"><div><span class="eyebrow">${rig.boonPath}</span><h3>${rig.name} / ${rig.tagline}</h3><p>${rig.description}</p></div><button id="equip-rig" class="primary">Equip ${rig.name} ${arrow()}</button></div>${abilityPreview(selected)}<p class="screen-footnote rig-footnote"><span>WHITE: MARINE · ORANGE: HOSTILE · FOCUS FOR RULES</span>Dash passes through enemies, never walls. Overdrive charges through damage and kills and carries between rooms.</p></section>`;
}

const augmentSlots: Record<string, 'dash'|'tactical'|'power'|'overdrive'> = {'reserve-thruster':'dash','slide-loader':'dash','tactical-salvage':'tactical','drive-dynamo':'overdrive',afterquake:'tactical','reinforced-bulwark':'power','spreading-nova':'tactical','twin-glacier':'power','scorched-fan':'tactical','napalm-triplet':'power','forked-overload':'tactical','twin-pylon':'power'};
/** Changed-value readout mirrors catalog augment rules without altering mechanics. */
function augmentChange(id: string, rig: RigId): string {
  const kit=RIG_CATALOG[rig].abilities;
  const tactical=ABILITY_CATALOG[kit.tactical],power=ABILITY_CATALOG[kit.power];
  const changes:Record<string,string>={
    'reserve-thruster':`${ABILITY_CATALOG[kit.dash].charges} → ${ABILITY_CATALOG[kit.dash].charges+1} dash charges`,
    'tactical-salvage':'−0.35 s cooldown per kill',
    'drive-dynamo':'+30% Overdrive generation',
    'slide-loader':'Dash → instant reserve reload',
    afterquake:'1 → 2 shockwaves · echo 35 damage',
    'reinforced-bulwark':`${power.durationMs/1000} → ${power.durationMs/1000+2} s · +100% health`,
    'spreading-nova':`+${formatDistance(20)} radius per chilled enemy · max +${formatDistance(100)}`,
    'twin-glacier':'1 → 2 ice walls',
    'scorched-fan':`Adds ${formatDistance(120)} fire pool · 2.5 s`,
    'napalm-triplet':`1 → 3 pools · ${formatDistance(120)} → ${formatDistance(80)} radius`,
    'forked-overload':`${tactical.shape.kind==='chain'?tactical.shape.maxTargets:6} → ${(tactical.shape.kind==='chain'?tactical.shape.maxTargets:6)+2} chain targets`,
    'twin-pylon':'1 → 2 linked pylons',
  };
  return changes[id]??'';
}

function augmentTarget(mutation: MutationDefinition, rig?: RigId): string {
  const slot=augmentSlots[mutation.id], selected=mutation.rig??rig;
  if(!slot) return '';
  const ability=selected?ABILITY_CATALOG[RIG_CATALOG[selected].abilities[slot]]:null;
  return `<span class="augment-target">${icon(ability?.id??'loadout')}<span>MODIFIES <b>${ability?.name??slot.toUpperCase()}</b></span><kbd>${ABILITY_KEYS[slot]}</kbd></span>`;
}

export function draftScreen(game: DepthGame): string {
  const offers = expeditionRewardOffers(game.expedition);
  const rig = getAbilities(game)?.rig;
  const starting = game.expedition.run.phase==='starting-boon';
  const cost = rerollCost(game.expedition);
  const exhausted = (game.expedition.run.draftRoll??0)>=2;
  return `<section class="panel choice-panel draft-panel screen-enter">${tag(`SECTOR ${serial(game.node.depth+1)} / ${total(game)} · ${starting?'BEFORE COMBAT':'CLEAR'}`)}<div class="screen-heading"><div><h2>Choose a boon.</h2><p class="panel-intro">Choose one. Keep it for this descent.</p></div><span class="draft-signal" data-draft-rig="${rig??''}">${icon(rig??'boon-reactor')} ${rig?`${RIG_CATALOG[rig].name.toUpperCase()} RIG · `:''}SUIT REWRITE AVAILABLE</span></div>
    <div class="choice-grid">${offers.map((mutation,index)=>`<button class="choice-card ${mutation.rarity}" data-family="${mutation.family}" data-element="${boonElement(mutation)}" data-path="${pathFor(mutation.id)?.name??mutation.family}" data-mutation="${mutation.id}" data-risk="${mutation.risk===true}" data-augment="${mutation.abilityOnly===true}" data-augment-rig="${mutation.rig??'universal'}" aria-describedby="benefit-${mutation.id} numbers-${mutation.id}" style="--reveal-order:${index}"><span class="boon-card-top">${icon(boonIcon(mutation),'boon-emblem')}<span class="boon-rarity">${icon(mutation.rarity==='rare'?'rarity-rare':'rarity-common')} ${mutation.rarity.toUpperCase()}</span><kbd>${index+1}</kbd></span><span class="boon-path">${mutation.rig?icon(mutation.rig):mutation.abilityOnly?icon('loadout'):''}${boonPath(mutation)}</span><h3>${mutation.name}</h3><p class="boon-benefit" id="benefit-${mutation.id}">${boonBenefit(mutation)}</p><p class="boon-numbers" id="numbers-${mutation.id}">${boonNumbers(mutation)}</p><span class="boon-card-footer">${mutation.abilityOnly?augmentTarget(mutation,rig??undefined):`<span class="augment-target">${icon(boonIcon(mutation))}<span>MODIFIES <b>${mutation.family==='Recovery'&&mutation.id!=='blood-price'?'SUIT SYSTEMS':'WEAPON HITS'}</b></span></span>`}<span class="family-progress" aria-label="${mutation.family} family: ${familyCount(game.expedition.build,mutation.family)} of 3 installed"><span>${mutation.family} set</span><b>${Math.min(3,familyCount(game.expedition.build,mutation.family))} / 3</b><i style="--set-progress:${Math.min(1,familyCount(game.expedition.build,mutation.family)/3)*100}%"></i></span></span><span class="boon-inspect-hint">Hold <kbd>Alt</kbd> / <kbd>Tab</kbd> · focus + <kbd>I</kbd> for rules</span><span class="boon-inspect-detail" role="tooltip"><span class="eyebrow">EXACT VALUES / ${mutation.name}</span><p>${playerFacingText(mutation.description)}</p><span class="boon-condition"><span>${boonRuleLabel(mutation)}</span>${playerFacingText(mutation.tradeoff)}</span><span class="boon-hint">${icon('check')}${boonHint(mutation,game.expedition.build)}</span><small>Release inspection key or press I / Esc to close.</small></span><span class="boon-select">INSTALL BOON ${arrow()}</span></button>`).join('')}</div>
    <div class="reward-footer"><span class="credit-balance">${icon('credits')} <b>${game.combat.snapshot.credits}</b> CREDITS <small><kbd>1–3</kbd> install · <kbd>R</kbd> reroll</small></span><button id="reroll" class="secondary" ${game.expedition.run.version===1||exhausted||game.combat.snapshot.credits<cost?'disabled':''}>${exhausted?'No rerolls left':`Reroll · ${cost} credits`}</button></div></section>`;
}

export function shopScreen(game: DepthGame): string {
  const healing = game.node.reward==='healing';
  const act = progressionFor(game.node).act;
  const services=([['heal','30 health',100,'health'],['armor','25 armor',90,'armor'],['ammo','Extra ammunition',100,'rifle']] as const).map(([id,label,cost,symbol])=>{
    const affordable=game.combat.snapshot.credits>=cost,available=game.canPurchaseService?.(id)??affordable;
    const reason=!affordable?`Need ${cost-game.combat.snapshot.credits} credits`:!available?id==='armor'?'Armor full after allocation.':'No extra recovery after allocation.':`Supplies + ${label}`;
    return `<button class="service-card" data-purchase="${id}" aria-describedby="service-${id}-reason" ${available?'':'disabled'}>${icon(symbol)}<span><b>${label}</b><small id="service-${id}-reason">${reason}</small></span><strong>${cost} <small>CR</small></strong>${arrow()}</button>`;
  }).join('');
  return `<section class="panel shop-panel screen-enter"><div class="supply-hero">${icon(healing?'medkit':'armory','supply-emblem')}${tag(`RECOVERY STATION / SECTOR ${serial(game.node.depth+1)}`)}<h2>${healing?'Infirmary':'Supply cache'}</h2><p class="panel-intro">${healing?`Restore ${35+act*5} health and ${15+act*5} armor.`:'Rifle, shotgun, plasma and rocket ammunition. One grenade.'}</p><button id="claim" class="primary">Collect supplies ${arrow()}</button><span class="supply-label">STANDARD ALLOCATION / NO COST</span></div>
    <div class="service-shop"><div class="shop-heading">${tag('OPTIONAL REQUISITION')}<h3>Take what you need.</h3><span class="credit-balance">${icon('credits')} ${game.combat.snapshot.credits} credits</span><p>Standard supplies plus one service. Purchasing also collects the standard allocation.</p></div>${services}</div></section>`;
}

/** Compact sectional map: environment decks descend, actual graph edges remain intact. */
export function deckMap(game: DepthGame, selected = game.node.next[0]): string {
  const run = game.expedition.run, graph = generateRun(run.seed,run.version), count=total(game);
  const positions = new Map<string,{x:number;y:number}>();
  const layers = Array.from({length:count},(_,depth)=>graph.nodes.filter(node=>node.depth===depth));
  layers.forEach((layer,depth)=>layer.forEach((node,index)=>positions.set(node.id,count===20?{x:365+(depth%2)*112,y:30+Math.floor(depth/2)*36}:{x:420+(index-(layer.length-1)/2)*88,y:24+depth*31})));
  const height=count===20?394:count*31+16;
  const bands=count===20?layers.filter((_,i)=>i%2===0).map((layer,i)=>({name:storyRoomFor(layer[0].templateId)?.environment??`DECK ${i+1}`,y:30+i*36})):Array.from({length:3},(_,i)=>({name:['OUTER DECKS','INNER SYSTEMS','REACTOR CORE'][i],y:24+i*4*31}));
  return `<div class="deck-map" role="group" aria-label="Full ship descent map. ${count} sectors. Arrows inspect available destinations."><svg class="deck-connections" viewBox="0 0 720 ${height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><linearGradient id="deck-hull" x2="1" y2="1"><stop stop-color="#24434e" stop-opacity=".5"/><stop offset="1" stop-color="#08141c"/></linearGradient></defs><path class="deck-hull" d="M420 4 584 30 617 ${height-65} 535 ${height-9} 305 ${height-9} 224 ${height-65} 257 30Z" fill="url(#deck-hull)"/>${bands.map(band=>`<g class="deck-band"><path d="M250 ${band.y+17}H590"/><text x="205" y="${band.y+4}" text-anchor="end">${escapeHtml(band.name.toUpperCase())}</text><path d="M220 ${band.y}H238"/></g>`).join('')}${graph.nodes.flatMap(node=>node.next.map(id=>{const a=positions.get(node.id)!,b=positions.get(id)!;return `<path data-edge="${node.id}/${id}" d="M${a.x} ${a.y}C${a.x} ${(a.y+b.y)/2} ${b.x} ${(a.y+b.y)/2} ${b.x} ${b.y}" class="map-edge ${run.completedNodeIds.includes(node.id)&&(run.completedNodeIds.includes(id)||id===game.node.id)?'traversed':''} ${node.id===game.node.id?'reachable':''}"/>`;})).join('')}</svg><div class="deck-node-layer" style="aspect-ratio:720/${height}">${graph.nodes.map(node=>{
    const point=positions.get(node.id)!;
    const state=node.id===game.node.id?'current':run.completedNodeIds.includes(node.id)?'visited':game.node.next.includes(node.id)?'available':'locked';
    const name=ROOM_TEMPLATES[node.templateId].name, label=`Sector ${node.depth+1}: ${name}. ${state}. ${playerFacingText(ROOM_REWARD_LABELS[node.reward])}`;
    const contents=`${icon(state==='visited'?'check':node.kind)}<b>${serial(node.depth+1)}</b>`;
    return state==='available'?`<button id="inspect-route-${game.node.next.indexOf(node.id)}" class="deck-node available ${node.id===selected?'selected':''}" data-map-state="${state}" data-node-id="${node.id}" data-inspect-route="${node.id}" aria-pressed="${node.id===selected}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}" style="left:${point.x/7.2}%;top:${point.y/height*100}%">${contents}</button>`:`<div class="deck-node ${state}" data-map-state="${state}" data-node-id="${node.id}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}" style="left:${point.x/7.2}%;top:${point.y/height*100}%">${contents}</div>`;
  }).join('')}</div><div class="map-descent-label">WAKE DECK <span>↓ DESCENT</span> REACTOR</div></div>`;
}

export function routeScreen(game: DepthGame, selected = game.node.next[0]): string {
  const graph = generateRun(game.expedition.run.seed,game.expedition.run.version);
  const choices=game.node.next.map(id=>graph.nodes.find(node=>node.id===id)!);
  const node=choices.find(node=>node.id===selected)??choices[0];
  const environment=node?storyRoomFor(node.templateId)?.environment??'ship systems':'ship systems';
  return `<section class="panel route-panel screen-enter">${tag('NAVIGATION / COLONY VESSEL')}<div class="screen-heading"><div><h2>${choices.length>1?'Chart the descent.':'Continue the descent.'}</h2><p class="panel-intro">${escapeHtml(game.storyRoom?game.storyStatus:'Reach the next sector.')}</p></div><span class="route-position">${serial(game.node.depth+1)} <small>/ ${total(game)} SECTORS</small></span></div><div class="route-layout"><div class="map-column"><div class="map-legend"><span>✓ VISITED</span><span>◎ CURRENT</span><span>◇ AVAILABLE</span></div>${deckMap(game,node?.id)}</div>${node?`<aside class="route-destination" aria-label="Selected destination"><span class="destination-kicker">${choices.length>1?'SELECT A DESTINATION':'NEXT DESTINATION'}</span><div class="destination-identity">${icon(node.kind)}<span>SECTOR ${serial(node.depth+1)}<small>${escapeHtml(environment.toUpperCase())} / ${node.kind.toUpperCase()}</small></span></div><h3>${ROOM_TEMPLATES[node.templateId].name}</h3><p>${escapeHtml(storyRoomFor(node.templateId)?.objective??'Reach the next sector.')}</p><span class="route-reward">${icon(node.reward==='healing'?'medkit':node.reward==='supplies'?'rifle':'credits')}${playerFacingText(ROOM_REWARD_LABELS[node.reward])}</span>${choices.length>1?`<div class="destination-choices" role="group" aria-label="Available paths">${choices.map((choice,index)=>`<button data-inspect-route="${choice.id}" aria-pressed="${choice.id===node.id}" aria-label="${escapeHtml(`${ROOM_TEMPLATES[choice.templateId].name}. ${choice.kind}. ${playerFacingText(ROOM_REWARD_LABELS[choice.reward])}`)}"><kbd>${index+1}</kbd><span><b>${ROOM_TEMPLATES[choice.templateId].name}</b><small>${choice.kind.toUpperCase()} · ${playerFacingText(ROOM_REWARD_LABELS[choice.reward]).toUpperCase()}</small></span>${icon(choice.kind)}</button>`).join('')}</div>`:''}<button class="primary route-depart" data-route="${node.id}">Enter sector ${arrow()}</button><span class="route-keyboard"><kbd>←</kbd><kbd>→</kbd> inspect · <kbd>${choices.length>1?`1–${choices.length}`:'1'}</kbd> enter · <kbd>Enter</kbd> depart</span></aside>`:''}</div><p class="screen-footnote map-footnote">${icon('check')} Completed sectors stay on the ship record. Your next choice is saved at the boundary.</p></section>`;
}

/** Visible compact build, with complete boon rules on pointer hover or keyboard focus. */
export function buildIcons(game: DepthGame): string {
  return `<div class="owned-boons" aria-label="Installed boons">${game.expedition.build.mutations.map(id=>{const m=MUTATION_CATALOG[id];return `<article class="owned-boon" tabindex="0" data-family="${m.family}" data-element="${boonElement(m)}" data-boon="${m.id}" data-augment="${m.abilityOnly===true}" aria-label="${escapeHtml(`${m.name}. ${boonPath(m)}. ${playerFacingText(m.description)} ${playerFacingText(m.tradeoff)}. Counts toward ${m.family} set`)}">${icon(boonIcon(m))}<span class="owned-boon-name">${m.name}</span><span class="owned-set-badge" aria-label="Counts toward ${m.family} set">${m.family} set</span><span class="boon-tooltip" role="tooltip"><span>${boonPath(m)} / ${m.rarity}</span><h4>${m.name}</h4><p>${playerFacingText(m.description)}</p><small>${playerFacingText(m.tradeoff)}</small><span class="boon-set-badge">Counts toward ${m.family} set</span></span></article>`;}).join('')||'<p class="build-empty">No boons installed yet.</p>'}</div>`;
}

export function buildRecap(game: DepthGame): string {
  const rig=getAbilities(game)?.rig;
  return `<div class="build-recap">${rig?`<div class="loadout-rig" data-element="${RIG_CATALOG[rig].element}">${icon(rig)}<div>${tag('COMBAT RIG')}<h3>${RIG_CATALOG[rig].name}</h3><p>${RIG_CATALOG[rig].description}</p></div></div>${abilityPreview(rig,game.expedition.build.mutations)}`:'<p class="screen-footnote">Standard marine loadout · weapon systems online.</p>'}<div class="build-summary-heading"><h3 class="build-heading">Installed boons <span>${game.expedition.build.mutations.length}</span></h3><span>FOCUS A GLYPH TO INSPECT</span></div>${buildIcons(game)}<p class="screen-footnote">Three in a family: Kinetic +12% damage · Cryo longer, stronger chill · Reactor 10% faster reload · Recovery stronger magnet and 6 armor each room.</p></div>`;
}

export type PauseTab = 'resume'|'loadout'|'settings'|'controls';
export function pauseScreen(game: DepthGame, active: PauseTab, settings: string, graphicsLost: boolean): string {
  return `<section class="panel pause-panel screen-enter">${tag(ROOM_TEMPLATES[game.node.templateId].name)}<div class="screen-heading"><h2>${graphicsLost?'Restoring graphics…':'Expedition paused.'}</h2><span class="paused-indicator">${icon('pause')} SIMULATION HELD</span></div><div class="pause-tabs" role="tablist" aria-label="Pause menu">${(['resume','loadout','settings','controls'] as const).map(tab=>`<button id="tab-${tab}" role="tab" data-tab="${tab}" data-pause-tab="${tab}" aria-selected="${active===tab}" aria-controls="pause-tabpanel" tabindex="${active===tab?'0':'-1'}">${tab}</button>`).join('')}</div><div id="pause-tabpanel" role="tabpanel" aria-labelledby="tab-${active}" tabindex="0">${active==='resume'?`<div class="resume-content"><div class="resume-coordinate">${serial(game.node.depth+1)}<span>/ ${total(game)}<small>SECTORS</small></span></div><div><h3>${ROOM_TEMPLATES[game.node.templateId].name}</h3><p class="resume-run-state">${game.combat.snapshot.health} health · ${game.combat.snapshot.credits} credits · ${game.expedition.build.mutations.length} boons</p><p>${escapeHtml(game.storyRoom?game.storyStatus:'Return when you are ready.')}</p><p>${escapeHtml(game.storyRoom?.objective??'')}</p></div></div>`:active==='loadout'?buildRecap(game):active==='settings'?settings:controlsScreen()}</div><footer class="pause-footer"><button id="resume" class="primary" ${graphicsLost?'disabled':''}>Back to the fight ${arrow()}</button>${graphicsLost?'<button id="recover" class="secondary">Reload game</button>':''}<button id="menu" class="quiet">Return to title ${arrow()}</button><p class="save-note" role="status">${escapeHtml(game.checkpointNote)}</p></footer></section>`;
}

/** Destruction is only ever dispatched from the visible, explicit consent button. */
export function destroyScreen(): string {
  return `<section class="panel result-panel destroy-panel screen-enter">${icon('warning','destroy-emblem')}${tag('MANUAL CONTROL / OVERLOAD NOT ARMED')}<h2>Destroy the ship?</h2><p class="panel-intro">The passengers are alive. Overload will kill them and you. New Earth has received the warning.</p><div class="destroy-divider"></div><button id="destroy-ship" class="primary">Destroy ship</button><button id="menu" class="secondary destroy-alternative">Not yet · return to title</button></section>`;
}

export function resultsScreen(game: DepthGame): string {
  const complete=game.status==='complete', stats=getRunStats(game), rig=getAbilities(game)?.rig;
  const format = (value: number) => value.toLocaleString('en-US',{maximumFractionDigits:0});
  const elapsedSeconds=Math.floor(Object.values(stats.roomTimeMs).reduce((sum,ms)=>sum+ms,0)/1000);
  const time=`${Math.floor(elapsedSeconds/60)}:${String(elapsedSeconds%60).padStart(2,'0')}`;
  const uses=ABILITY_SLOTS.reduce((sum,slot)=>sum+stats.abilityUses[slot],0);
  const damage=Object.values(stats.damageDealt).reduce((sum,value)=>sum+value,0);
  const cell=(id:string,value:string,label:string,detail='')=>`<div data-stat="${id}"><b>${value}</b><span>${label}</span>${detail?`<small class="stat-detail">${detail}</small>`:''}</div>`;
  return `<section class="panel result-panel debrief-panel screen-enter" data-outcome="${complete?'complete':'dead'}">${complete?completionEnding(game):`<header class="debrief-heading"><div>${tag('EXPEDITION LOST')}<h2>Mission lost.</h2></div><div class="debrief-rig" data-element="${rig?RIG_CATALOG[rig].element:'kinetic'}">${icon(rig??'armor')}<span>${rig?RIG_CATALOG[rig].name:'MARINE'}<small>COMBAT RECORD</small></span></div></header>${incomingDamageReport(game,stats)}`}<details class="result-details"><summary>${complete?'View expedition statistics':'Damage dealt & expedition build'}</summary><div class="result-stats hero-stats">${cell('rooms',`${game.expedition.run.completedNodeIds.length}<small>/${total(game)}</small>`,'SECTORS CLEARED')}${cell('kills',format(stats.kills.total),'HOSTILES ELIMINATED')}${cell('time',time,'COMBAT TIME')}${cell('damage',format(damage),'DAMAGE DEALT')}</div><div class="debrief-body"><div class="debrief-telemetry"><section class="damage-summary"><div class="telemetry-heading">${tag('DAMAGE COMPOSITION')}<span>${format(damage)} TOTAL</span></div><p class="damage-source-note">Totals by source · statuses and boons may mix elements.</p><div class="damage-source-bar" role="img" aria-label="${Object.entries(stats.damageDealt).map(([source,value])=>`${source} ${format(value)}`).join(', ')}">${Object.entries(stats.damageDealt).map(([source,value])=>`<i data-damage-source="${source}" style="flex:${damage?value/damage:0}"></i>`).join('')}</div><div class="damage-source-legend">${Object.entries(stats.damageDealt).map(([source,value])=>cell(source,format(value),source.toUpperCase())).join('')}</div></section><div class="secondary-stat-groups"><section><h3>Combat</h3><div class="result-secondary">${cell('accuracy',stats.shotsFired?`${Math.round(stats.shotsHit/stats.shotsFired*100)}%`:'—','ACCURACY')}${cell('shots',format(stats.shotsFired),'SHOTS FIRED',`${format(stats.shotsHit)} confirmed hits`)}${cell('taken',format(stats.damageTaken),'DAMAGE TAKEN')}${cell('multi-kill',format(stats.highestMultiKill),'BEST MULTI-KILL')}</div></section><section><h3>Rig & economy</h3><div class="result-secondary">${cell('uses',format(uses),'ABILITY USES',ABILITY_SLOTS.map(slot=>`${ABILITY_KEYS[slot]} ${stats.abilityUses[slot]}`).join(' · '))}${cell('overdrives',format(stats.overdrivesUsed),'OVERDRIVES')}${cell('credits',format(stats.creditsEarned),'CREDITS EARNED')}${cell('boons',String(game.expedition.build.mutations.length),'BOONS')}</div></section></div></div><aside class="debrief-build"><div class="telemetry-heading">${tag('EXPEDITION BUILD')}<span>${game.expedition.build.mutations.length} INSTALLED</span></div>${rig?`<div class="result-ability-icons" aria-label="Equipped abilities">${ABILITY_SLOTS.map(slot=>{const a=ABILITY_CATALOG[RIG_CATALOG[rig].abilities[slot]];return `<span tabindex="0" title="${escapeHtml(`${a.name}. ${playerFacingText(a.description)}`)}" aria-label="${escapeHtml(`${a.name}. ${playerFacingText(a.description)}`)}">${icon(a.id)}<kbd>${ABILITY_KEYS[slot]}</kbd></span>`;}).join('')}</div>`:''}${buildIcons(game)}<p class="screen-footnote">Focus a build glyph for its rules.</p></aside></div></details><div class="result-actions"><button id="start" class="primary">${complete?'Play again':'New expedition'} ${arrow()}</button><button id="menu" class="quiet">Return to title</button><span class="debrief-signoff">${complete?'SIGNAL CLOSED / EXPEDITION ARCHIVED':'SUIT SIGNAL LOST / RECORD PRESERVED'}</span></div></section>`;
}

/** Recovery templates keep system messaging consistent when the bootstrap needs them. */
