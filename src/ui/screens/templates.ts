import type {DepthGame} from '../../DepthGame';
import {ABILITY_CATALOG, ABILITY_KEYS, ABILITY_SLOTS, RIG_CATALOG, RIG_IDS} from '../../game/abilities/catalog';
import type {RigId} from '../../game/abilities/contract';
import {boonHint, pathFor} from '../../game/roguelike/boonPaths';
import {MUTATION_CATALOG} from '../../game/roguelike/mutationCatalog';
import {expeditionRewardOffers, rerollCost} from '../../game/roguelike/expedition';
import {progressionFor} from '../../game/roguelike/progression';
import {generateRun, ROOM_REWARD_LABELS, runLength} from '../../game/roguelike/run';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {SACRIFICE_ENDING, storyRoomFor} from '../../game/roguelike/storyRooms';
import {getAbilities, getRunStats} from '../gameAdapter';
import {icon} from '../icons';
import {version} from '../../../package.json';

/** Text coming from snapshots or saved state must never become HTML. */
export const escapeHtml = (value: unknown): string => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
const tag = (text: string) => `<span class="eyebrow">${text}</span>`;
const arrow = () => icon('arrow', 'screen-arrow');
const total = (game: DepthGame) => runLength(game.expedition.run.version);
const serial = (value: number) => String(value).padStart(2, '0');
const familyIcon = (family: string) => `boon-${family}`;

/** Standalone schematic keeps the title composed even without the 3D background. */
export function titleScreen(game: DepthGame, settings: string, settingsOpen: boolean, creditsOpen: boolean): string {
  return `<main class="title-screen screen-enter">
    <div class="title-instrument-clip" aria-hidden="true"><div class="title-instrument"><div class="orbital orbital-one"></div><div class="orbital orbital-two"></div><svg viewBox="0 0 640 640"><g fill="none" stroke="currentColor"><path d="M320 40v560M40 320h560" stroke-dasharray="3 9"/><path d="m320 94 88 124v204L320 546l-88-124V218Z"/><path d="M278 172h84v296h-84zM246 238h148v164H246zM300 110h40v420h-40z"/><path d="m232 270-72 36v74l72-10m176-100 72 36v74l-72-10M252 416l-50 80h54l32-40m100-40 50 80h-54l-32-40"/><circle cx="320" cy="320" r="206" stroke-dasharray="58 8 2 8"/><circle cx="320" cy="320" r="250" stroke-dasharray="1 14"/></g></svg><span class="schematic-label schematic-top">COLONY VESSEL / SYSTEMS SCAN</span><span class="schematic-label schematic-bottom">LIFE SIGNS DETECTED<br><b>CONTAINMENT COMPROMISED</b></span></div></div>
    <div class="title-copy"><div class="edition"><i></i> COLONY SHIP // EMERGENCY WAKE PROTOCOL</div><h1 aria-label="Containment Depth"><span class="title-word">CONTAINMENT</span><span class="title-depth">DEPTH<span class="title-index">20 / 01</span></span></h1><p class="premise">Twenty rooms aboard a colony ship.<br>Wake up. Restore the uplink. Warn New Earth.</p>
    <div class="menu-buttons"><button class="primary" id="start"><span><small>BEGIN EXPEDITION</small>Wake up</span>${arrow()}</button>${game.canContinue?`<button class="secondary" id="continue">Continue expedition ${arrow()}</button>`:''}<div class="title-utilities"><button id="settings" class="quiet" aria-expanded="${settingsOpen}">${icon('settings')} ${settingsOpen?'Close settings':'Settings & controls'}</button><button id="credits" class="quiet" aria-expanded="${creditsOpen}">Credits</button></div></div>
    <div class="title-version">CONTAINMENT / DEPTH <span>BUILD ${version} · DESKTOP EDITION</span></div></div>
    ${settingsOpen?`<aside class="title-drawer" aria-label="Settings"><div class="drawer-heading">${tag('SHIP SYSTEMS')}<h2>Configuration</h2></div>${settings}<details class="title-controls"><summary>Keyboard &amp; mouse controls</summary>${controlsScreen()}</details></aside>`:''}
    ${creditsOpen?`<aside class="title-drawer credits-drawer" aria-label="Credits">${tag('ORIGINAL EXPEDITION')}<h2>Transmission credits</h2><p>Containment / Depth</p><p>An original desktop action expedition.</p><p>Typography: Barlow and Barlow Condensed by Jeremy Tribby, licensed under SIL Open Font License 1.1.</p><a href="${import.meta.env.BASE_URL}fonts/OFL.txt" target="_blank" rel="noopener">Font license</a><br><a href="${import.meta.env.BASE_URL}audio-credits.html" target="_blank" rel="noopener">Audio credits ${arrow()}</a><button id="close-credits" class="secondary">Close credits</button></aside>`:''}
  </main>`;
}

/** Catalog-driven descriptions are shared by rig preview and paused loadout. */
export function abilityPreview(rig: RigId): string {
  return `<div class="ability-preview">${ABILITY_SLOTS.map(slot => {
    const ability = ABILITY_CATALOG[RIG_CATALOG[rig].abilities[slot]];
    return `<article class="ability-detail" data-element="${ability.element}"><div class="ability-detail-icon">${icon(ability.id)}</div><div><header><kbd>${ABILITY_KEYS[slot]}</kbd><span>${slot==='overdrive'?'OVERDRIVE':slot.toUpperCase()}</span><h3>${ability.name}</h3></header><p>${ability.description}</p><dl>${ability.stats.map(stat=>`<div><dt>${stat.label}</dt><dd>${stat.value}</dd></div>`).join('')}</dl></div></article>`;
  }).join('')}</div>`;
}

export function rigScreen(selected: RigId): string {
  const rig = RIG_CATALOG[selected];
  return `<section class="panel rig-panel screen-enter" aria-labelledby="rig-title">${tag('COMBAT SYSTEMS / 01')}<div class="screen-heading"><div><h2 id="rig-title">Choose your rig.</h2><p class="panel-intro">Four systems. One way through.</p></div><span class="keyboard-guide"><kbd>←</kbd><kbd>→</kbd> inspect · <kbd>1–4</kbd> select · <kbd>Enter</kbd> equip</span></div>
    <div class="rig-grid" role="group" aria-label="Combat rigs">${RIG_IDS.map((id,index)=>`<button class="rig-card ${id===selected?'selected':''}" data-rig="${id}" data-element="${RIG_CATALOG[id].element}" aria-pressed="${id===selected}"><span class="rig-number">${serial(index+1)} <kbd>${index+1}</kbd></span>${icon(id,'rig-emblem')}<h3>${RIG_CATALOG[id].name}</h3><p>${RIG_CATALOG[id].tagline}</p><span class="rig-path">${RIG_CATALOG[id].boonPath}</span></button>`).join('')}</div>
    <div class="rig-detail-head" data-element="${rig.element}"><div><span class="eyebrow">${rig.boonPath}</span><h3>${rig.name} / ${rig.tagline}</h3><p>${rig.description}</p></div><button id="equip-rig" class="primary">Equip ${rig.name} ${arrow()}</button></div>${abilityPreview(selected)}<p class="screen-footnote">Dash passes through enemies, never walls. Overdrive charges through damage and kills and carries between rooms.</p></section>`;
}

export function draftScreen(game: DepthGame): string {
  const offers = expeditionRewardOffers(game.expedition);
  const starting = game.expedition.run.phase==='starting-boon';
  const cost = rerollCost(game.expedition);
  const exhausted = (game.expedition.run.draftRoll??0)>=2;
  return `<section class="panel choice-panel draft-panel screen-enter">${tag(`SECTOR ${serial(game.node.depth+1)} / ${total(game)} · ${starting?'BEFORE COMBAT':'CLEAR'}`)}<div class="screen-heading"><div><h2>Choose a boon.</h2><p class="panel-intro">Choose one. Keep it for this descent.</p></div><span class="draft-signal">${icon('boon-reactor')} SUIT REWRITE AVAILABLE</span></div>
    <div class="choice-grid">${offers.map((mutation,index)=>`<button class="choice-card ${mutation.rarity}" data-family="${mutation.family}" data-path="${pathFor(mutation.id)?.name??mutation.family}" data-mutation="${mutation.id}" data-risk="${mutation.risk===true}"><span class="boon-card-top">${icon(pathFor(mutation.id)?.name==='Wildfire'?'pyro':familyIcon(mutation.family),'boon-emblem')}<span class="boon-rarity">${icon(mutation.rarity==='rare'?'rarity-rare':'rarity-common')} ${mutation.rarity.toUpperCase()}</span><kbd>${index+1}</kbd></span><span class="boon-path">${pathFor(mutation.id)?.name??mutation.family}</span><h3>${mutation.name}</h3><p>${mutation.description}</p><span class="boon-condition"><span>TRADE-OFF / RULE</span>${mutation.tradeoff}</span><span class="boon-hint">${icon('check')}${boonHint(mutation,game.expedition.build)}</span><span class="boon-select">INSTALL BOON ${arrow()}</span></button>`).join('')}</div>
    <div class="reward-footer"><span class="credit-balance">${icon('credits')} <b>${game.combat.snapshot.credits}</b> CREDITS <small><kbd>1–3</kbd> install · <kbd>R</kbd> reroll</small></span><button id="reroll" class="secondary" ${game.expedition.run.version===1||exhausted||game.combat.snapshot.credits<cost?'disabled':''}>${exhausted?'No rerolls left':`Reroll · ${cost} credits`}</button></div></section>`;
}

export function shopScreen(game: DepthGame): string {
  const healing = game.node.reward==='healing';
  const act = progressionFor(game.node).act;
  return `<section class="panel shop-panel screen-enter"><div class="supply-hero">${icon(healing?'medkit':'armory','supply-emblem')}${tag(`RECOVERY STATION / SECTOR ${serial(game.node.depth+1)}`)}<h2>${healing?'Infirmary':'Supply cache'}</h2><p class="panel-intro">${healing?`Restore ${35+act*5} health and ${15+act*5} armor.`:'Rifle, shotgun, plasma and rocket ammunition. One grenade.'}</p><button id="claim" class="primary">Collect supplies ${arrow()}</button><span class="supply-label">STANDARD ALLOCATION / NO COST</span></div>
    <div class="service-shop"><div class="shop-heading">${tag('OPTIONAL REQUISITION')}<h3>Take what you need.</h3><span class="credit-balance">${icon('credits')} ${game.combat.snapshot.credits} credits</span><p>Standard supplies plus one service. Purchasing also collects the standard allocation.</p></div>${([['heal','30 health',100,'health'],['armor','25 armor',90,'armor'],['ammo','Extra ammunition',100,'rifle']] as const).map(([id,label,cost,symbol])=>`<button class="service-card" data-purchase="${id}" ${game.combat.snapshot.credits<cost?'disabled':''}>${icon(symbol)}<span><b>${label}</b><small>Supplies + ${label}</small></span><strong>${cost} <small>CR</small></strong>${arrow()}</button>`).join('')}</div></section>`;
}

/** Draw the actual seeded graph, including branches, without inventing map progression. */
export function deckMap(game: DepthGame): string {
  const run = game.expedition.run;
  const graph = generateRun(run.seed,run.version);
  const positions = new Map<string,{x:number;y:number}>();
  const layers = Array.from({length:total(game)},(_,depth)=>graph.nodes.filter(node=>node.depth===depth));
  layers.forEach((layer,depth)=>layer.forEach((node,index)=>positions.set(node.id,{x:110+depth*210,y:56+index*122})));
  const height = Math.max(1,...layers.map(layer=>layer.length))*122+16;
  const width = total(game)*210+10;
  return `<div class="deck-map-scroll" tabindex="0" role="region" aria-label="Full ship deck map. Scroll horizontally to inspect all sectors."><div class="deck-map" style="width:${width}px;height:${height}px"><svg class="deck-connections" width="${width}" height="${height}" aria-hidden="true">${graph.nodes.flatMap(node=>node.next.map(id=>{const a=positions.get(node.id)!,b=positions.get(id)!;return `<path d="M${a.x} ${a.y}H${(a.x+b.x)/2}V${b.y}H${b.x}" class="${run.completedNodeIds.includes(node.id)?'traversed':''}"/>`;})).join('')}</svg>${graph.nodes.map(node=>{
    const point=positions.get(node.id)!;
    const state=node.id===game.node.id?'current':run.completedNodeIds.includes(node.id)?'visited':game.node.next.includes(node.id)?'available':'locked';
    return `<div class="deck-node ${state}" data-map-state="${state}" data-node-id="${node.id}" style="left:${point.x-92}px;top:${point.y-43}px"><span class="deck-node-top">${icon(node.kind)} ${serial(node.depth+1)} <small>${state.toUpperCase()}</small></span><b>${ROOM_TEMPLATES[node.templateId].name}</b><span>${ROOM_REWARD_LABELS[node.reward]}</span></div>`;
  }).join('')}</div></div>`;
}

export function routeScreen(game: DepthGame): string {
  const graph = generateRun(game.expedition.run.seed,game.expedition.run.version);
  const choices=game.node.next.map(id=>graph.nodes.find(node=>node.id===id)!);
  return `<section class="panel route-panel screen-enter">${tag('NAVIGATION / COLONY VESSEL')}<div class="screen-heading"><div><h2>${choices.length>1?'Choose your route.':'Next room'}</h2><p class="panel-intro">${escapeHtml(game.storyRoom?game.storyStatus:'Reach the next sector.')}</p></div><span class="route-position">${serial(game.node.depth+1)} <small>/ ${total(game)} SECTORS</small></span></div><div class="map-legend"><span>✓ VISITED</span><span>◎ CURRENT</span><span>◇ AVAILABLE</span><span>· AHEAD</span><small>SCROLL TO INSPECT SHIP</small></div>${deckMap(game)}<div class="route-grid">${choices.map((node,index)=>`<button class="route-card ${node.kind==='elite'?'danger':''}" data-route="${node.id}"><div class="route-card-top">${icon(node.kind)}<span class="eyebrow">${node.kind.toUpperCase()} / ${serial(node.depth+1)}</span><kbd>${index+1}</kbd></div><h3>${ROOM_TEMPLATES[node.templateId].name}</h3><p>${escapeHtml(storyRoomFor(node.templateId)?.objective??'Reach the next sector.')}</p><span class="route-reward">${icon('credits')}${ROOM_REWARD_LABELS[node.reward]}</span><span class="card-arrow">${arrow()}</span></button>`).join('')}</div></section>`;
}

export function buildRecap(game: DepthGame): string {
  const rig=getAbilities(game)?.rig;
  return `<div class="build-recap">${rig?`<div class="loadout-rig" data-element="${RIG_CATALOG[rig].element}">${icon(rig)}<div>${tag('COMBAT RIG')}<h3>${RIG_CATALOG[rig].name}</h3><p>${RIG_CATALOG[rig].description}</p></div></div>${abilityPreview(rig)}`:'<p class="screen-footnote">Standard marine loadout · weapon systems online.</p>'}<h3 class="build-heading">Boons <span>${game.expedition.build.mutations.length}</span></h3><div class="owned-boons">${game.expedition.build.mutations.map(id=>{const m=MUTATION_CATALOG[id];return `<article class="owned-boon" data-family="${m.family}">${icon(familyIcon(m.family))}<div><span>${pathFor(id)?.name??m.family} / ${m.rarity}</span><h4>${m.name}</h4><p>${m.description}</p><small>${m.tradeoff}</small></div></article>`;}).join('')||'<p>No boons installed yet.</p>'}</div><p class="screen-footnote">Three in a family: Kinetic +12% damage · Cryo longer, stronger chill · Reactor 10% faster reload · Recovery stronger magnet and 6 armor each room.</p></div>`;
}

export function controlsScreen(): string {
  const groups = [
    ['MOVEMENT & WEAPONS',[['W A S D','Move'],['Mouse','Aim / fire'],['Space','Aim-assisted fire'],['1–5','Equip weapon'],['R','Reload'],['G','Throw grenade'],['E','Use medkit']]],
    ['COMBAT RIG & SYSTEMS',[['Shift','Dash'],['Q','Tactical ability'],['F','Power ability'],['V','Overdrive'],['Esc','Pause / resume'],['Tab','Navigate menu controls'],['Enter / Space','Activate focused control']]],
  ] as const;
  return `<div class="controls-reference">${groups.map(([name,entries])=>`<section>${tag(name)}<dl>${entries.map(([key,label])=>`<div><dt><kbd>${key}</kbd></dt><dd>${label}</dd></div>`).join('')}</dl></section>`).join('')}</div><p class="screen-footnote">Weapon reserves replenish during combat and refill between rooms. Overdrive charge persists between rooms.</p>`;
}

export type PauseTab = 'resume'|'loadout'|'settings'|'controls';
export function pauseScreen(game: DepthGame, active: PauseTab, settings: string, graphicsLost: boolean): string {
  return `<section class="panel pause-panel screen-enter">${tag(ROOM_TEMPLATES[game.node.templateId].name)}<div class="screen-heading"><h2>${graphicsLost?'Restoring graphics…':'Expedition paused.'}</h2><span class="paused-indicator">${icon('pause')} SIMULATION HELD</span></div><div class="pause-tabs" role="tablist" aria-label="Pause menu">${(['resume','loadout','settings','controls'] as const).map(tab=>`<button id="tab-${tab}" role="tab" data-tab="${tab}" data-pause-tab="${tab}" aria-selected="${active===tab}" aria-controls="pause-tabpanel" tabindex="${active===tab?'0':'-1'}">${tab}</button>`).join('')}</div><div id="pause-tabpanel" role="tabpanel" aria-labelledby="tab-${active}" tabindex="0">${active==='resume'?`<div class="resume-content"><div class="resume-coordinate">${serial(game.node.depth+1)}<span>/ ${total(game)}<small>SECTORS</small></span></div><div><h3>Your expedition is on hold.</h3><p>${escapeHtml(game.storyRoom?game.storyStatus:'Return when you are ready.')}</p></div></div>`:active==='loadout'?buildRecap(game):active==='settings'?settings:controlsScreen()}</div><footer class="pause-footer"><button id="resume" class="primary" ${graphicsLost?'disabled':''}>Back to the fight ${arrow()}</button>${graphicsLost?'<button id="recover" class="secondary">Reload game</button>':''}<button id="menu" class="quiet">Return to title ${arrow()}</button><p class="save-note" role="status">${escapeHtml(game.checkpointNote)}</p></footer></section>`;
}

/** Destruction is only ever dispatched from the visible, explicit consent button. */
export function destroyScreen(): string {
  return `<section class="panel result-panel destroy-panel screen-enter">${icon('warning','destroy-emblem')}${tag('MANUAL CONTROL / OVERLOAD NOT ARMED')}<h2>Destroy the ship?</h2><p class="panel-intro">The passengers are alive. Overload will kill them and you. New Earth has received the warning.</p><div class="destroy-divider"></div><button id="destroy-ship" class="primary">Destroy ship</button><button id="menu" class="quiet">Not yet · return to title</button></section>`;
}

export function resultsScreen(game: DepthGame): string {
  const complete=game.status==='complete';
  const stats=Object.entries(getRunStats(game)).filter(([,value])=>typeof value==='number'&&Number.isFinite(value));
  const count=2+stats.length, columns=Math.ceil(count/Math.ceil(count/4));
  return `<section class="panel result-panel debrief-panel screen-enter" data-outcome="${complete?'complete':'dead'}"><div class="debrief-heading">${tag(`EXPEDITION ${complete?'COMPLETE':'LOST'}`)}<h2>${complete?(game.storyRoom?'Ship destroyed.':'The core is silent.'):'Mission lost.'}</h2><p class="panel-intro">${complete?(game.storyRoom?SACRIFICE_ENDING:'Containment restored.'):'You died before the mission was complete.'}</p></div><div class="result-stats" style="--stat-columns:${columns}"><div><b>${game.expedition.run.completedNodeIds.length}<small>/${total(game)}</small></b><span>ROOMS</span></div><div><b>${game.expedition.build.mutations.length}</b><span>BOONS</span></div>${stats.map(([name,value])=>`<div><b>${Number(value).toLocaleString('en-US',{maximumFractionDigits:1})}</b><span>${escapeHtml(name.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/_/g,' ').toUpperCase())}</span></div>`).join('')}</div><details class="build-details"><summary>Expedition build recap</summary>${buildRecap(game)}</details><div class="result-actions"><button id="start" class="primary">${complete?'Play again':'New expedition'} ${arrow()}</button><button id="menu" class="quiet">Return to title</button></div></section>`;
}

/** Recovery templates keep system messaging consistent when the bootstrap needs them. */
export function systemScreen(title: string, message: string, action?: {id: string; label: string}): string {
  return `<section class="panel system-panel" role="status">${icon('warning')}${tag('SHIP SYSTEMS')}<h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p>${action?`<button class="primary" id="${escapeHtml(action.id)}">${escapeHtml(action.label)}</button>`:''}</section>`;
}
