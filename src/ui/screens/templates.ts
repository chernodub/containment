import {studioImage} from '../studioArt';
import {WEAPONS, WEAPON_JOBS} from '../../game/combat/catalog';
import type {WeaponId} from '../../game/combat/types';
import type {MutationId} from "../../game/roguelike/types";
import {GUARDIAN_ROUTES,GUARDIAN_ROUTE_DEPTH,GUARDIAN_SUPPLY_DEPTH,GUARDIAN_SUPPLIES} from "../../game/roguelike/economy";
import {AUGMENT_UPGRADE_RULES,TRANSFORMATIVE_AUGMENT_PAIRS,type AugmentId} from '../../game/abilities/augmentCatalog';
import {EARLY_LOCKER,SERVICE_IDS,SERVICE_CATALOG,serviceRepairAmounts,serviceCost,serviceStock,availableAugmentUpgrades,fieldWorkshopDepth,detourOffers} from '../../game/roguelike/economy';
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
import {generateRun, ROOM_KIND_LABELS, ROOM_REWARD_LABELS, runLength} from '../../game/roguelike/run';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {contractFor, CONTRACT_ENDS} from '../../game/roguelike/contracts';
import {junctionConsequence, runHeader} from '../../game/roguelike/shipConditions';
import {routeVignette} from './routeVignettes';
import {storyRoomFor} from '../../game/roguelike/storyRooms';
import {getWeaponInventory, getAbilities, getRunStats, getRoomOpening, getRouteThreat, getShipCondition} from '../gameAdapter';
import {icon} from '../icons';
import {boonElement, boonIcon, boonPath, boonRuleLabel} from '../boonPresentation';
import {boonChips} from '../boonChips';
import {boonBenefit, boonNumbers} from '../boonBenefits';
import {rewardArt} from '../rewardArt';
import {formatDistance, playerFacingText, playerFacingStat} from '../units';
import {serviceArt} from './serviceArt';
import {abilityVignette, transformationPreview, supplyTransformation} from './abilityVignettes';
import {completionEnding, incomingDamageReport} from './damageReport';
import {pauseRoomRecords} from '../storyPresentation';
import {rigPortrait, marinePortrait, RIG_FANTASIES} from './rigPortraits';

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
export function abilityPreview(rig: RigId, owned?: readonly string[]): string {
  return `<div class="ability-preview" role="region" aria-label="Ability manifest">${ABILITY_SLOTS.map(slot => {
    const ability = ABILITY_CATALOG[RIG_CATALOG[rig].abilities[slot]];
    const augments=(owned ?? []).filter(id=>{const boon=MUTATION_CATALOG[id as keyof typeof MUTATION_CATALOG];return augmentSlots[id]===slot&&(!boon?.rig||boon.rig===rig);});
    const statValue=(label:string,value:string)=>{
      if(slot==='dash'&&label==='Charges'&&augments.includes('reserve-thruster'))value=String(ability.charges+1);
      if(label==='Duration'&&augments.includes('reinforced-bulwark'))value=`${ability.durationMs/1000+2} s`;
      if(label==='Radius'&&augments.includes('napalm-triplet'))value='80';
      if(label==='Targets'&&augments.includes('forked-overload')&&ability.shape.kind==='chain')value=String(ability.shape.maxTargets+2);
      return playerFacingStat(label,value);
    };
    if (owned) {
      const change = augments.map(id => transformationPreview(id)).find(Boolean);
      const stats = ability.stats.map(stat => `${stat.label} ${statValue(stat.label,stat.value)}`).join(' · ');
      const briefing = augments.map(id => augmentChange(id,rig)).filter(Boolean).join(' · ');
      return `<article class="ability-detail equipped-ability" tabindex="0" data-element="${ability.element}">
        <header><kbd>${ABILITY_KEYS[slot]}</kbd><h3>${ability.name}</h3></header>
        ${change || abilityVignette(ability)}
        <p>${briefing || ability.summary}</p>
        <span class="ability-rules" role="tooltip">${playerFacingText(ability.description)}<br>${stats}</span>
      </article>`;
    }
    return `<article class="ability-detail" tabindex="0" data-element="${ability.element}" aria-label="${escapeHtml(`${ability.name}. ${playerFacingText(ability.description)}`)}"><header><kbd>${ABILITY_KEYS[slot]}</kbd><span>${slot==='overdrive'?'OVERDRIVE':slot.toUpperCase()}</span>${augments.length?`<span class="ability-augment-badge">${augments.length} AUGMENT${augments.length>1?'S':''}</span>`:''}${icon(ability.id,'ability-detail-icon')}</header>${abilityVignette(ability)}<h3>${ability.name}</h3><p>${ability.summary}</p>${augments.length?`<p class="ability-changed-value">${augments.map(id=>augmentChange(id,rig)).join(' · ')}</p>`:''}<dl>${ability.stats.map(stat=>`<div><dt>${stat.label}</dt><dd>${statValue(stat.label,stat.value)}</dd></div>`).join('')}</dl><span class="ability-rules" role="tooltip">${playerFacingText(ability.description)}</span></article>`;
  }).join('')}</div>`;
}

const RIG_EXAMPLES = {
  breacher: ['dash', 'Ram a pursuer into your barricade.'],
  cryo: ['tactical', 'Freeze a pack with Cryo Nova and shoot while it is still.'],
  pyro: ['tactical', 'Sweep Flashfire across a crowded approach.'],
  arc: ['tactical', 'Chain Overload through a cluster of pursuers.'],
} as const;

export function rigScreen(selected: RigId, previous?: RigId): string {
  const rig = RIG_CATALOG[selected];
  const quick = previous ? `<button id="recommended-loadout" class="secondary">Repeat last rig · ${RIG_CATALOG[previous].name} ${arrow()}</button>` : '';
  const [exampleSlot,example]=RIG_EXAMPLES[selected];
  const equip = `<button id="equip-rig" class="primary">Equip ${rig.name} ${arrow()}</button>`;
  return `<section class="panel rig-panel screen-enter" data-element="${rig.element}" aria-labelledby="rig-title">${tag('COMBAT SYSTEMS / 01')}<div class="screen-heading"><div><h2 id="rig-title">Choose your rig.</h2><p class="panel-intro">Four systems. One way through.</p></div><span class="keyboard-guide"><kbd>←</kbd><kbd>→</kbd> browse · <kbd>1–4</kbd> select · <kbd>Enter</kbd> confirm</span></div>
    <div class="rig-grid" role="group" aria-label="Combat rigs">${RIG_IDS.map((id,index)=>`<button class="rig-card ${id===selected?'selected':''}" data-rig="${id}" data-element="${RIG_CATALOG[id].element}" aria-pressed="${id===selected}"><span class="rig-number">${serial(index+1)} <kbd>${index+1}</kbd></span>${icon(id,'rig-emblem')}<h3>${RIG_CATALOG[id].name}</h3><p>${RIG_CATALOG[id].tagline}</p>${rigProfile(id)}<span class="rig-path sr-only">${RIG_CATALOG[id].boonPath}</span></button>`).join('')}</div>
    <div class="rig-identity" data-element="${rig.element}">${rigPortrait(selected)}<div class="rig-identity-copy"><span class="eyebrow">${rig.name.toUpperCase()} / ${rig.boonPath}</span><h3>${RIG_FANTASIES[selected]}</h3><p>${example}</p><div class="rig-example">${abilityVignette(ABILITY_CATALOG[rig.abilities[exampleSlot]])}</div>${equip}${quick}</div></div><details class="rig-inspect"><summary>Inspect all abilities</summary>${abilityPreview(selected)}<p class="screen-footnote rig-footnote">White marks the marine. Red marks enemies.</p></details></section>`;
}

const augmentSlots: Record<string, 'dash'|'tactical'|'power'|'overdrive'> = {'reserve-thruster':'dash','slide-loader':'dash','tactical-salvage':'tactical','drive-dynamo':'overdrive',afterquake:'tactical','reinforced-bulwark':'power','spreading-nova':'tactical','twin-glacier':'power','scorched-fan':'tactical','napalm-triplet':'power','forked-overload':'tactical','twin-pylon':'power','siege-plow':'power','fault-line':'tactical','ice-road':'power','meltdown-core':'overdrive','pilgrim-pylon':'power','live-wire':'tactical'};
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
  return changes[id]??MUTATION_CATALOG[id as keyof typeof MUTATION_CATALOG]?.whatChanges??'';
}

function augmentTarget(mutation: MutationDefinition, rig?: RigId): string {
  const passive=mutation.id==='shard-harvest'?{glyph:'cryo',label:'FROZEN KILLS'}:mutation.id==='ember-relay'?{glyph:'pyro',label:'FIRE ZONES'}:null;
  if(passive)return `<span class="augment-target">${icon(passive.glyph)}<span>MODIFIES <b>${passive.label}</b></span></span>`;
  const slot=augmentSlots[mutation.id], selected=mutation.rig??rig;
  if(!slot) return '';
  const ability=selected?ABILITY_CATALOG[RIG_CATALOG[selected].abilities[slot]]:null;
  return `<span class="augment-target">${icon(ability?.id??'loadout')}<span>MODIFIES <b>${ability?.name??slot.toUpperCase()}</b></span><kbd>${ABILITY_KEYS[slot]}</kbd></span>`;
}

/** Existing tactical diagram provides context; the change label states the authored delta. */
function augmentDiagram(mutation: MutationDefinition, rig?: RigId): string {
  const transformation = transformationPreview(mutation.id);
  if (transformation) return transformation;
  const slot=augmentSlots[mutation.id], selected=mutation.rig??rig;
  if(!mutation.abilityOnly||!slot||!selected)return '';
  const ability=ABILITY_CATALOG[RIG_CATALOG[selected].abilities[slot]];
  return `<span class="reward-diagram"><small>BASE / ${ability.name}</small>${abilityVignette(ability)}<small>AFTER / ${boonBenefit(mutation)}</small></span>`;
}

const starterDiagrams: Partial<Record<MutationId,string>> = {
  incendiary: 'M87 31c-8-9-1-17 1-22 1 9 12 12 10 21-1 8-13 10-15 0',
  cryogenic: 'M90 11v30m-13-23 26 16m-26 0 26-16M109 20h14m-14 12h8',
  breacher: 'M88 26h31m-9-6 9 6-9 6m18-21v30m-8-5 4-6m-4-14 5 6',
  'hot-reload': 'M83 28a13 13 0 1 1 25 4m-25-4-4-6m4 6 6-4m7 3h7l-6 10',
};

/** Only changes that can be represented faithfully reuse the tactical geometry. */
function augmentCombatPreview(mutation: MutationDefinition, rig?: RigId): string {
  const transformation = transformationPreview(mutation.id);
  if (transformation) return transformation;
  const slot=augmentSlots[mutation.id], selected=mutation.rig??rig;
  if(!mutation.abilityOnly){
    const diagram=starterDiagrams[mutation.id];
    return diagram?`<span class="starter-diagram" aria-hidden="true"><svg viewBox="0 0 142 50" fill="none" stroke="currentColor" stroke-width="2"><circle cx="31" cy="26" r="7"/><path d="M40 26h26m-7-5 7 5-7 5"/><path d="${diagram}"/></svg></span>`:'';
  }
  if(!mutation.abilityOnly||!slot||!selected)return '';
  const ability=ABILITY_CATALOG[RIG_CATALOG[selected].abilities[slot]];
  const before=abilityVignette(ability);
  let after=before;
  if(mutation.id==='spreading-nova')after=before.replace('r="27"','r="35"');
  else if(mutation.id==='forked-overload')after=before.replace('</g></svg>','<path d="m171 52 13-17-9-14"/><circle class="vignette-enemy" cx="184" cy="35" r="4"/><circle class="vignette-enemy" cx="175" cy="21" r="4"/></g></svg>');
  else if(mutation.id==='scorched-fan')after=before.replace('</g></svg>','<ellipse class="shape-fill" cx="108" cy="57" rx="35" ry="15"/></g></svg>');
  else if(mutation.id==='napalm-triplet')after=before.replace('<ellipse cx="134" cy="49" rx="34" ry="20" class="shape-fill"/>','<ellipse cx="116" cy="45" rx="19" ry="13" class="shape-fill"/><ellipse cx="145" cy="32" rx="19" ry="13" class="shape-fill"/><ellipse cx="148" cy="62" rx="19" ry="13" class="shape-fill"/>');
  else if(mutation.id==='afterquake')after=before.replace('</g></svg>','<circle cx="99" cy="42" r="34" stroke-dasharray="3 3"/></g></svg>');
  else if(mutation.id==='twin-glacier')after=before.replace('<path class="shape-fill" d="m88 42 9-12 9 8 8-11 11 12 11-9 10 12v9H88Z"/>','<path class="shape-fill" transform="translate(0 -13)" d="m88 42 9-12 9 8 8-11 11 12 11-9 10 12v9H88Z"/><path class="shape-fill" transform="translate(0 13)" d="m88 42 9-12 9 8 8-11 11 12 11-9 10 12v9H88Z"/>');
  else if(mutation.id==='twin-pylon')after=before.replace('</g></svg>','<path class="shape-fill" d="m90 55 8-13 8 13-8 13Z"/><path d="M98 63v8m-9 0h18M50 52l21 7 19-4"/></g></svg>');
  else {
    const badges:Record<string,string>={'reinforced-bulwark':'+100% HP','reserve-thruster':'+1 CHARGE','tactical-salvage':'KILL: −0.35s','drive-dynamo':'+30% CHARGE','slide-loader':'DASH: RELOAD'};
    const badge=badges[mutation.id];
    if(!badge)return '';
    after=before.replace('</g></svg>',`<rect x="46" y="57" width="143" height="18" fill="#102330" stroke="none"/><text x="117" y="70" text-anchor="middle" font-size="11" fill="currentColor" stroke="none">${badge}</text></g></svg>`);
  }
  return `<span class="reward-combat-preview" aria-label="${escapeHtml(boonBenefit(mutation))}"><span><small>BEFORE</small>${before}</span><b aria-hidden="true">→</b><span><small>AFTER</small>${after}</span></span>`;
}

function contractPayout(game: DepthGame) {
  const run=game.expedition.run;
  if(!run.contract||!CONTRACT_ENDS.some(depth=>depth===game.node.depth))return '';
  const contract=contractFor(run.seed);
  const detail=run.contract.lastPayout?contract.reward:'Objective missed this act';
  return `<p class="panel-intro">${escapeHtml(contract.name)} · ${escapeHtml(detail)}</p>`;
}

export function draftScreen(game: DepthGame): string {
  const offers = expeditionRewardOffers(game.expedition);
  const rig = getAbilities(game)?.rig;
  const starting = game.expedition.run.phase==='starting-boon';
  const cost = rerollCost(game.expedition);
  const exhausted = (game.expedition.run.draftRoll??0)>=2;
  return `<section class="panel choice-panel draft-panel screen-enter" data-draft-kind="${offers.filter(offer=>offer.abilityOnly).length>offers.length/2?'augment':'boon'}">${tag(`SECTOR ${serial(game.node.depth+1)} / ${total(game)} · ${starting?'BEFORE COMBAT':'CLEAR'}`)}<div class="screen-heading"><div><h2>Choose a boon.</h2><p class="panel-intro">Choose one. Keep it for this descent.</p>${contractPayout(game)}</div><span class="draft-signal" data-draft-rig="${rig??''}">${icon(rig??'boon-reactor')} ${rig?`${RIG_CATALOG[rig].name.toUpperCase()} RIG · `:''}SUIT REWRITE AVAILABLE</span></div>
    <div class="choice-grid">${offers.map((mutation,index)=>`<button class="choice-card ${mutation.rarity}" data-family="${mutation.family}" data-element="${boonElement(mutation)}" data-path="${pathFor(mutation.id)?.name??mutation.family}" data-mutation="${mutation.id}" data-risk="${mutation.risk===true}" data-augment="${mutation.abilityOnly===true}" data-augment-rig="${mutation.rig??'universal'}" aria-describedby="benefit-${mutation.id} numbers-${mutation.id}" style="--reveal-order:${index}">${rewardArt(mutation)}<span class="boon-card-top">${icon(boonIcon(mutation),'boon-emblem')}<span class="boon-rarity">${icon(mutation.rarity==='rare'?'rarity-rare':'rarity-common')} ${mutation.rarity.toUpperCase()}</span><kbd>${index+1}</kbd></span><span class="boon-path">${mutation.rig?icon(mutation.rig):mutation.abilityOnly?icon('loadout'):''}${boonPath(mutation)}</span><span class="reward-taxonomy">${mutation.abilityOnly?'ABILITY AUGMENT':'WEAPON BOON'} · ${mutation.family.toUpperCase()} SET</span><h3>${mutation.name}</h3><p class="boon-benefit" id="benefit-${mutation.id}">${boonBenefit(mutation)}</p><p class="boon-numbers" id="numbers-${mutation.id}">${boonNumbers(mutation)}</p>${augmentCombatPreview(mutation,rig??undefined)}<span class="boon-inspect-hint">Focus + <kbd>I</kbd> for rules</span><span class="boon-inspect-detail" role="tooltip"><span class="eyebrow">EXACT VALUES / ${mutation.name}</span>${mutation.abilityOnly?augmentTarget(mutation,rig??undefined):''}${augmentDiagram(mutation,rig??undefined)}<p>${playerFacingText(mutation.description)}</p>${boonChips(mutation,familyCount(game.expedition.build,mutation.family))}<span class="boon-condition"><span>${boonRuleLabel(mutation)}</span>${playerFacingText(mutation.tradeoff)}</span><span class="boon-hint">${icon('check')}${boonHint(mutation,game.expedition.build)}</span><small>Release inspection key or press I / Esc to close.</small></span><span class="boon-select">INSTALL BOON ${arrow()}</span></button>`).join('')}</div>
    <div class="reward-footer"><span class="credit-balance">${icon('credits')} <b>${game.combat.snapshot.credits}</b> CREDITS <small><kbd>1–3</kbd> install · <kbd>R</kbd> reroll</small></span><button id="reroll" class="secondary" ${game.expedition.run.version===1||exhausted||game.combat.snapshot.credits<cost?'disabled':''}>${exhausted?'No rerolls left':`Reroll · ${cost} credits`}</button></div></section>`;
}

export function shopScreen(game: DepthGame): string {
  const run=game.expedition.run, resources=game.combat.snapshot;
  const allocated=run.service?.nodeId===run.currentNodeId&&run.service.allocationClaimed;
  const upgrades=availableAugmentUpgrades(game.expedition.build);
  const repair=serviceRepairAmounts(game.difficulty);
  const outcomes = {
    heal: `Restore up to ${repair.heal} health.`,
    armor: `Restore up to ${repair.armor} armor.`,
    ammo: '80 rifle · 16 shells · 32 plasma · 2 rockets.',
    medkit: 'Add one medkit.',
    grenade: 'Add up to two grenades.',
    reroll: 'Bank one free boon reroll.',
    upgrade: 'Improve an installed augment.',
    revive: SERVICE_CATALOG.revive.description,
    'rig-return':SERVICE_CATALOG['rig-return'].description,
    'route-ammo':SERVICE_CATALOG['route-ammo'].description,
  };
  const amounts = {heal: [repair.heal, 'HP'], armor: [repair.armor, 'armor'], ammo: [130, 'rounds'],
    medkit: [1, 'medkit'], grenade: [2, 'grenades'], reroll: [1, 'reroll'], upgrade: [1, 'upgrade'],
    revive: [1, 'revive'], 'route-ammo': [0, ''], 'rig-return': [0, '']} as const;
  const pair=game.returningRigAugments;
  const rig=game.expedition.build.rig??'breacher';
  const chosen=run.service?.nodeId===run.currentNodeId&&run.service.purchases.includes('rig-return')
    ? TRANSFORMATIVE_AUGMENT_PAIRS[rig].find(id=>game.expedition.build.mutations.includes(id))
    : undefined;
  const services=(upgradesOnly:boolean)=>SERVICE_IDS.filter(id=>id!=='route-ammo'&&id!=='rig-return'&&(id==='upgrade')===upgradesOnly&&(id!=='revive'||game.node.depth===18&&run.version===3))
    .flatMap<{id:(typeof SERVICE_IDS)[number];upgrade?:typeof upgrades[number]}>(id=>id==='upgrade'&&upgrades.length?upgrades.map(upgrade=>({id,upgrade})): [{id,upgrade:undefined}]);
  const cards=(items:ReturnType<typeof services>)=>items.map(({id,upgrade})=>{
    const cost=serviceCost(id,game.node.depth), stock=serviceStock(run,id), enabled=game.canPurchaseService(id,upgrade);
    const name=id==='upgrade'&&upgrade?`Upgrade ${MUTATION_CATALOG[upgrade].name}`:SERVICE_CATALOG[id].name;
    let status=`${stock} in stock`;
    if(!stock) status='Sold out';
    else if(!enabled) {
      if(id==='upgrade'&&!upgrade) status='Requires an eligible augment';
      else if(id==='reroll'&&run.version===1) status='Rerolls unavailable';
      else if(resources.credits<cost) status=`Need ${cost-resources.credits} more credits`;
      else if(id==='reroll') status='Reroll bank full';
      else status='Full after allocation';
    }
    const [gain, unit]=amounts[id];
    const medicalLabel=id==='heal'?'Immediate':id==='medkit'?'Inventory':undefined;
    return `<button id="purchase-${upgrade??id}" class="requisition-item" data-purchase="${id}" ${upgrade?`data-augment="${upgrade}"`: ''} ${enabled?'':'disabled'}>
      ${medicalLabel?`<span class="requisition-medical-art">${serviceArt(id)}<span class="requisition-medical-label">${medicalLabel}</span></span>`:serviceArt(id)}
      <span class="requisition-title-row"><span class="requisition-terms"><b class="requisition-amount">+${gain} <small>${unit}</small></b><span class="requisition-price">${cost} <small>CR</small></span></span><strong class="requisition-name">${escapeHtml(name)}</strong></span>
      <span class="requisition-outcome">${escapeHtml(upgrade?playerFacingText(AUGMENT_UPGRADE_RULES[upgrade]??''):outcomes[id])}</span>
      <span class="requisition-item-footer"><span class="requisition-status">${status}</span></span>
    </button>`;
  }).join('');
  const stockGroup=(name:string, upgradesOnly:boolean)=>{
    const items=services(upgradesOnly);
    const hasReserveAmmo=!upgradesOnly&&!!routeSupply;
    const cheapest=Math.min(...items.map(({id})=>serviceCost(id,game.node.depth)),hasReserveAmmo?supplyCost:Infinity);
    const summary=pair.length===2||chosen?`<span class="stock-summary"> · ${items.length+Number(hasReserveAmmo)} · from ${cheapest} CR</span>`:'';
    return `<section class="${upgradesOnly?'requisition-upgrades':''}" aria-label="${name}"><h3>${name}${summary}</h3><div class="requisition-grid">${cards(items)}</div></section>`;
  };
  const pairOption=(id:AugmentId)=>`<button id="purchase-${id}" class="supply-doctrine-option" data-purchase="rig-return" data-augment="${id}" ${game.canPurchaseService('rig-return',id)?'':'disabled'}>
    <strong>${escapeHtml(MUTATION_CATALOG[id].name)}</strong>
    <span>${escapeHtml(playerFacingText(MUTATION_CATALOG[id].whatChanges ?? MUTATION_CATALOG[id].description))}</span>
    ${supplyTransformation(id,'after')}
  </button>`;
  const pairRow=pair.length===2?`<section class="supply-doctrine" aria-label="Free · choose one">
    <h3>Free · choose one</h3>
    ${pairOption(pair[0])}
    <div class="supply-original"><small>Before</small>${pair.map(id=>supplyTransformation(id,'before')).join('')}</div>
    ${pairOption(pair[1])}
  </section>`:'';
  const route=game.node.depth===GUARDIAN_SUPPLY_DEPTH?run.guardianRoute:undefined;
  const supply=route?GUARDIAN_SUPPLIES[route]:undefined;
  const supplyCost=serviceCost('route-ammo',game.node.depth);
  const supplyStock=serviceStock(run,'route-ammo');
  const supplyEnabled=game.canPurchaseService('route-ammo');
  const supplyStatus=!supplyStock?'Sold out':resources.credits<supplyCost?`Need ${supplyCost-resources.credits} more credits`:supplyEnabled?'Reserve ammunition':'Ammunition full';
  const routeSupply=route&&supply?`<section class="route-supply">
    <div class="route-supply-heading">${studioImage(`route-threat-${route==='brood'?'matron':'warden'}`,'route-supply-guardian',160,90)}
      <div><strong>Coolant Plant · ${GUARDIAN_ROUTES[route].fight}</strong><p>${supply.guidance}</p></div>
    </div>
    <button id="purchase-route-ammo" data-purchase="route-ammo" class="secondary" ${supplyEnabled?'':'disabled'}>
      ${serviceArt("route-ammo")} ${supply.name} <span class="requisition-terms"><b class="requisition-amount">+${supply.rounds}</b><span class="requisition-price">${supplyCost} CR</span></span><small>${supplyStatus}</small>
    </button>
  </section>`:'';
  return `<section class="panel requisition-panel screen-enter" aria-labelledby="requisition-title">
    <header class="requisition-header">
      <div>${tag(`SECTOR ${serial(game.node.depth+1)}`)}<h2 id="requisition-title">Supply stop</h2>${contractPayout(game)}</div>
      <span class="requisition-credits" role="status">${icon('credits')} <b>${resources.credits}</b> credits available</span>
    </header>
    <p class="requisition-inventory" role="status">${resources.health} health · ${resources.armor} armor · ${resources.medkits} medkits · ${resources.grenades} grenades</p>
    ${pairRow}
    <div class="service-shop requisition-groups" data-pair-pending="${pair.length===2||!!chosen}">
      ${stockGroup('Consumables',false)}
      ${stockGroup('Paid upgrades',true)}
      ${routeSupply}
    </div>
    <footer class="requisition-footer">
      <p>${allocated?'Free allocation collected.':'Free supplies come with your first purchase or when you leave.'}</p>
      <button id="claim" class="${pairRow?'secondary':'primary'}" ${pairRow?'disabled':''}>
        ${pairRow?'Choose one to continue':chosen?`Install ${escapeHtml(MUTATION_CATALOG[chosen].name)} and leave ${augmentTarget(MUTATION_CATALOG[chosen],rig)}`:allocated?'Leave supply stop':'Collect allocation and leave'} ${arrow()}
      </button>
    </footer>
  </section>`;
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
  const run=game.expedition.run;
  const graph=generateRun(run.seed,run.version);
  const destinations=game.node.next.map(id=>graph.nodes.find(node=>node.id===id)!);
  const booked = run.guardianRoute && game.node.depth < GUARDIAN_ROUTE_DEPTH
    ? run.guardianRoute === 'brood' ? 'Matron' : 'Warden' : undefined;
  const guardian = booked ? `<span class="route-booked-guardian">${studioImage(`route-threat-${booked.toLowerCase()}`,'',64,36)}<span>${booked} · Sector ${GUARDIAN_ROUTE_DEPTH+1}</span></span>` : '';
  const offers=detourOffers(run);
  const contract=game.contractOffer;
  const next=destinations[0];
  const nextName=escapeHtml(ROOM_TEMPLATES[next.templateId].name);
  if (!offers.length && destinations.length===1 && !getShipCondition(game,next.depth)) {
    return `<section class="panel screen-enter"><h2>${nextName}</h2><p>${escapeHtml(getRoomOpening(game,next.depth,false)??'')}</p>${guardian}<button class="primary" data-route="${next.id}">Continue ${arrow()}</button></section>`;
  }
  const workshop=game.node.depth===fieldWorkshopDepth;
  const options=offers.length
    ? offers.flatMap<{destination:typeof next;detour?:(typeof offers)[number]['id'];title:string;risk?:string;reward?:string;vignette?:string;augment?:ReturnType<typeof availableAugmentUpgrades>[number];disabled:boolean;cost?:number}>(offer=>{
      const augments=offer.id==='salvage'&&workshop?availableAugmentUpgrades(game.expedition.build):[];
      const rigId=game.expedition.build.rig;
      const capacitor=game.node.depth===17&&offer.id==='salvage'&&rigId
        ? ABILITY_CATALOG[RIG_CATALOG[rigId].abilities.overdrive].name : undefined;
      const base={destination:next,detour:offer.id,title:capacitor?`${capacitor} capacitor`:offer.name,risk:offer.risk,cost:offer.id==='salvage'?(workshop?180:game.node.depth===6?70:undefined):undefined,reward:capacitor?`Fully charge ${capacitor} on clear`:offer.reward,vignette:offer.id==='salvage'?({2:'cache',6:'armor',10:'upgrade',14:'warden-cache',17:rigId==='pyro'?'meltdown-capacitor':'capacitor'} as Record<number,string>)[game.node.depth]??'cache':workshop?'medicine':game.node.depth===17?'protected-passage':undefined};
      if(augments.length)return augments.map(augment=>({...base,augment,vignette:augment,title:`Upgrade ${MUTATION_CATALOG[augment].name}`,
        reward:playerFacingText(AUGMENT_UPGRADE_RULES[augment]??''),disabled:game.combat.snapshot.credits<180}));
      return [{...base,augment:undefined,disabled:offer.id==='salvage'&&(workshop||game.node.depth===6&&game.combat.snapshot.credits<70)}];
    })
    : destinations.map(destination=>({destination, title:ROOM_TEMPLATES[destination.templateId].name,
      detour:undefined, risk:undefined, reward:undefined,vignette:undefined,augment:undefined,disabled:false,cost:undefined}));
  return `<section class="panel route-briefing screen-enter" aria-labelledby="route-title">
    ${tag(`SECTOR ${serial(next.depth+1)} / ${total(game)}`)}
    ${runHeader(run)?`<p>${escapeHtml(runHeader(run)!)}</p>`:''}
    <h2 id="route-title">${offers.length?nextName:'Choose your next sector'}</h2>
    ${offers.length&&!run.runStructure?'<p class="panel-intro">Both approaches enter the same sector.</p>':''}
    ${run.runStructure&&next.depth===3?`<p>45 CR now · 35 CR after Breached Loading Bay · 35 HP and 25 armor after Coolant Plant</p>`:''}
    ${contract?`<aside><strong>Optional contract · ${escapeHtml(contract.name)}</strong><p>${escapeHtml(contract.objective)} Each sector pays ${escapeHtml(contract.reward.toLowerCase())}.</p><button id="accept-contract" class="secondary">Accept contract</button></aside>`:run.contract?`<p>Contract · ${escapeHtml(contractFor(run.seed).name)} · ${run.contract.earned}/3 payouts earned</p>`:''}
    <div class="route-briefing-grid">
      ${options.map(({destination,detour,title,risk,reward:deal,vignette,augment,disabled,cost},index)=>{
        const firstJunction=run.runStructure&&destination.depth===3;
        const condition=getShipCondition(game,destination.depth,detour==='salvage');
        const variant=getRoomOpening(game,destination.depth,detour==='salvage');
        const consequence=run.runStructure?junctionConsequence(destination.depth,detour==='salvage'):undefined;
        const inventory = game.combat.getRunResources();
        const direct = detour === 'direct';
        const salvage = detour === 'salvage';
        const legacyArt = destination.kind==='medical' ? 'medicine'
          : destination.kind==='armory' ? 'cache' : destination.kind==='boss' ? 'legacy-queen' : undefined;
        const routeArt = firstJunction && detour ? (salvage ? 'brood' : 'plate-breaker')
          : direct && game.node.depth===2 ? 'locker' : legacyArt ?? vignette;
        const showOpening = !routeArt || routeArt==='protected-passage';
        const threat = showOpening && (run.runStructure || game.difficulty==='story' || run.version!==3)
          ? getRouteThreat(game,destination,salvage) : undefined;
        const depth = game.node.depth;
        const health = Math.min(100, inventory.health + (direct && depth === 2 ? EARLY_LOCKER.health : direct && workshop ? 35 : 0));
        const armor = Math.min(game.combat.snapshot.maxArmor, inventory.armor + (salvage && depth === 6 ? 25 : 0));
        const grenades = Math.min(6, inventory.grenades + (direct && depth === 2 ? EARLY_LOCKER.grenades : salvage && depth === 6 ? 2 : 0));
        const credits = inventory.credits + (salvage && depth === 2 ? EARLY_LOCKER.salvageCredits : 0) - (cost ?? 0);
        const later = firstJunction?undefined:consequence ?? (salvage && (depth === 14 || depth === 17) ? deal : undefined);
        const conditionTerms = condition && {
          dark: 'Ambush damage / − hidden hostiles',
          coolant: 'Stronger shoves / − slippery deck',
          vent: 'Eject hostiles / − breach suction',
          conduit: 'Longer Arc chains / − live wires',
          brood: 'More credits, fewer arrivals / − crawler eggs',
          sealed: 'Known breaches / − timed exit',
        }[condition.id];
        const outcome = disabled ? (credits < 0 ? `Need ${-credits} CR` : 'Requires eligible augment')
          : `${Math.ceil(health)} HP · ${Math.ceil(armor)} armor · ${credits} CR${grenades !== inventory.grenades ? ` · ${grenades} grenades` : ''}`;
        return `<div class="route-choice"><button id="route-option-${index}" class="route-option" data-route="${destination.id}" ${disabled?'aria-disabled="true"':''} ${augment?`data-augment="${augment}"`:''} ${detour?`data-detour="${detour}"`:`data-inspected="${destination.id===selected}"`}>
          <span class="route-option-visual">${routeVignette(destination.templateId,routeArt,threat)}<kbd aria-hidden="true">${index+1}</kbd></span>
          <span class="route-option-copy">
            ${augment?transformationPreview(augment,true):''}
            ${guardian}
            <span class="route-title-row"><strong class="route-option-title">${escapeHtml(title)}</strong>${cost ? `<span class="route-option-price">${cost} CR</span>` : ''}</span>
            <span class="route-option-terms" data-route-term="reward">${firstJunction?escapeHtml(deal??''):outcome}</span>
            <span class="route-option-subtitle">${escapeHtml((firstJunction?risk:variant ?? risk) ?? ROOM_KIND_LABELS[destination.kind])}${condition&&!firstJunction ? ` <small class="condition-chip" title="${condition.name}">+ ${conditionTerms}</small>` : ''}</span>
          </span>
        </button>${later ? `<details class="route-later"><summary>Later</summary><p>${escapeHtml(later)}</p></details>` : ''}</div>`;
      }).join('')}
    </div>
  </section>`;
}

/** Visible compact build, with complete boon rules on pointer hover or keyboard focus. */
export function buildIcons(game: DepthGame): string {
  const inventory = game.expedition.build.mutations;
  if (!inventory.length) return '<p class="build-empty">No augments or boons installed.</p>';
  return [true, false].map(augments => {
    const ids = inventory.filter(id => Boolean(MUTATION_CATALOG[id].abilityOnly) === augments);
    if (!ids.length) return '';
    const label = augments ? 'Augments' : 'Boons';
    return `<section class="installed-group"><h3>${label} <b>${ids.length}</b></h3><div class="owned-boons" aria-label="Installed ${label.toLowerCase()}">${ids.map(id => {
      const m=MUTATION_CATALOG[id];return `<article class="owned-boon" tabindex="0" data-family="${m.family}" data-element="${boonElement(m)}" data-boon="${m.id}" data-augment="${m.abilityOnly===true}" aria-label="${escapeHtml(`${m.name}. ${boonPath(m)}. ${playerFacingText(m.description)} ${playerFacingText(m.tradeoff)}. Counts toward ${m.family} set`)}">${rewardArt(m,true)}${icon(boonIcon(m))}<span class="owned-boon-name">${m.name}${game.expedition.build.augmentUpgrades?.includes(m.id as AugmentId)?' · UPGRADED':''}</span><span class="boon-tooltip" role="tooltip" data-element="${boonElement(m)}"><span>${boonPath(m)} / ${m.rarity}</span><h4>${m.name}</h4>${transformationPreview(m.id, game.expedition.build.augmentUpgrades?.includes(m.id as AugmentId))}<p>${playerFacingText(m.description)}</p>${game.expedition.build.augmentUpgrades?.includes(m.id as AugmentId)?`<p><b>Upgraded:</b> ${escapeHtml(AUGMENT_UPGRADE_RULES[m.id as AugmentId]??'')}</p>`:''}<small>${playerFacingText(m.tradeoff)}</small>${boonChips(m,familyCount(game.expedition.build,m.family))}</span></article>`;
    }).join('')}</div></section>`;
  }).join('');

}

function pauseWeapons(game: DepthGame): string {
  const {weapon, ammo} = getWeaponInventory(game);
  const targets: Record<WeaponId, string> = {
    pistol: 'Best against isolated light enemies.',
    rifle: 'Best against spread-out, unarmored enemies.',
    shotgun: 'Best against enemies at close range.',
    plasma: 'Best against plated enemies.',
    rocket: 'Best against packs. Your blast can hurt you.',
  };
  const ids = Object.keys(WEAPON_JOBS) as WeaponId[];
  return `<section class="pause-weapons">
    <div class="pause-weapon-picker" aria-label="Inspect weapons">${ids.map((id, index) =>
      `<button type="button" id="inspect-weapon-${id}" data-weapon="${id}" aria-controls="pause-weapon-${id}" aria-pressed="${id === weapon}"><kbd>${index + 1}</kbd> ${WEAPONS[id].label}</button>`
    ).join('')}</div>
    ${ids.map(id => `<article class="pause-weapon-detail" id="pause-weapon-${id}" ${id === weapon ? '' : 'hidden'}>
      ${studioImage(`weapon-${id}`, 'pause-weapon-art')}
      <div><h3>${WEAPONS[id].label}</h3><p>${WEAPON_JOBS[id]}</p><p>${targets[id]}</p>
      <p><strong>${ammo[id].magazine} / ${ammo[id].reserve === -1 ? '∞' : ammo[id].reserve}</strong> loaded / reserve</p></div>
    </article>`).join('')}
  </section>`;
}

export function buildRecap(game: DepthGame): string {
  const rig=getAbilities(game)?.rig;
  return `<div class="build-recap">${rig?`<div class="loadout-rig" data-element="${RIG_CATALOG[rig].element}">${marinePortrait(rig)}<div><h3>${RIG_CATALOG[rig].name}</h3><p>Rig abilities</p></div></div>${abilityPreview(rig,game.expedition.build.mutations)}`:'<p class="screen-footnote">Standard marine loadout · weapon systems online.</p>'}${buildIcons(game)}</div>`;
}

export type PauseTab = 'resume'|'loadout'|'weapons'|'settings'|'controls';
export function pauseScreen(game: DepthGame, active: PauseTab, settings: string, graphicsLost: boolean): string {
  return `<section class="panel pause-panel screen-enter">${tag(ROOM_TEMPLATES[game.node.templateId].name)}<div class="screen-heading"><h2>${graphicsLost?'Restoring graphics…':'Expedition paused.'}</h2><span class="paused-indicator">${icon('pause')} SIMULATION HELD</span></div><div class="pause-tabs" role="tablist" aria-label="Pause menu">${(['resume','loadout','weapons','settings','controls'] as const).map(tab=>`<button id="tab-${tab}" role="tab" data-tab="${tab}" data-pause-tab="${tab}" aria-selected="${active===tab}" aria-controls="pause-tabpanel" tabindex="${active===tab?'0':'-1'}">${tab}</button>`).join('')}</div><div id="pause-tabpanel" role="tabpanel" aria-labelledby="tab-${active}" tabindex="0">${active==='resume'?`<div class="resume-content">${marinePortrait(getAbilities(game)?.rig??'breacher','pause-marine')}<div class="resume-coordinate">${serial(game.node.depth+1)}<span>/ ${total(game)}<small>SECTORS</small></span></div><div><h3>${ROOM_TEMPLATES[game.node.templateId].name}</h3><p class="resume-run-state">${game.combat.snapshot.health} health · ${game.combat.snapshot.credits} credits · ${game.expedition.build.mutations.length} boons</p><p>${escapeHtml(game.storyRoom?game.storyStatus:'Return when you are ready.')}</p><p>${escapeHtml(game.storyRoom?.objective??'')}</p></div></div>${pauseRoomRecords(game)}`:active==='loadout'?buildRecap(game):active==='weapons'?pauseWeapons(game):active==='settings'?settings:controlsScreen()}</div><footer class="pause-footer"><button id="resume" class="primary" ${graphicsLost?'disabled':''}>Back to the fight ${arrow()}</button>${graphicsLost?'<button id="recover" class="secondary">Reload game</button>':''}<button id="menu" class="quiet">Return to title ${arrow()}</button><p class="save-note" role="status">${escapeHtml(game.checkpointNote)}</p></footer></section>`;
}

/** Destruction is only ever dispatched from the visible, explicit consent button. */
export function destroyScreen(): string {
  return `<section class="panel result-panel destroy-panel screen-enter">${icon('warning','destroy-emblem')}${tag('MANUAL CONTROL / OVERLOAD NOT ARMED')}<h2>Destroy the ship?</h2><p class="panel-intro">The passengers are alive. Overload will kill them and you. New Earth has received the warning.</p><div class="destroy-divider"></div><button id="destroy-ship" class="primary">Destroy ship</button><button id="menu" class="secondary destroy-alternative">Not yet · return to title</button></section>`;
}

function resultsRunRecord(game: DepthGame) {
  const run=game.expedition.run, header=runHeader(run);
  if(!header)return '';
  const decisions=Object.entries(run.junctions??{}).map(([key,choice])=>{
    const depth=Number(key);
    const names:Readonly<Record<number,string>>={3:'Early salvage',7:'Field requisition',11:'Field workshop'};
    if(depth===3&&run.guardianRoute){
      const route=GUARDIAN_ROUTES[run.guardianRoute];
      return `<li>${route.name} · Coolant Plant · ${route.fight}</li>`;
    }
    const name=choice==='salvage'?names[depth]:depth===fieldWorkshopDepth+1?'Field infirmary':depth===3?'Emergency supply locker':depth===18?'Protected passage':'Stay on mission';
    return `<li>Sector ${depth+1} · ${escapeHtml(name)} · ${escapeHtml(getRoomOpening(game,depth,choice==='salvage')??'')}</li>`;
  });
  const contract=run.contract;
  return `<section class="run-record" aria-label="Expedition record"><h3>${escapeHtml(header)}</h3>
    ${decisions.length?`<ul>${decisions.join('')}</ul>`:''}
    ${contract?`<p>${escapeHtml(contractFor(run.seed).name)} · ${contract.earned}/3 payouts earned</p>`:''}
  </section>`;
}

export function resultsScreen(game: DepthGame): string {
  const complete=game.status==='complete', stats=getRunStats(game), rig=getAbilities(game)?.rig;
  const format = (value: number) => value.toLocaleString('en-US',{maximumFractionDigits:0});
  const elapsedSeconds=Math.floor(Object.values(stats.roomTimeMs).reduce((sum,ms)=>sum+ms,0)/1000);
  const time=`${Math.floor(elapsedSeconds/60)}:${String(elapsedSeconds%60).padStart(2,'0')}`;
  const uses=ABILITY_SLOTS.reduce((sum,slot)=>sum+stats.abilityUses[slot],0);
  const damage=Object.values(stats.damageDealt).reduce((sum,value)=>sum+value,0);
  const cell=(id:string,value:string,label:string,detail='')=>`<div data-stat="${id}"><b>${value}</b><span>${label}</span>${detail?`<small class="stat-detail">${detail}</small>`:''}</div>`;
  const actions=`<div class="result-actions">${complete?'':'<button id="retry-rig" class="primary">Retry — same rig</button>'}<button id="start" class="${complete?'primary':'secondary'}">${complete?'Play again':'Choose new loadout'} ${arrow()}</button><button id="menu" class="quiet">Return to title</button></div>`;
  return `<section class="panel result-panel debrief-panel screen-enter" data-outcome="${complete?'complete':'dead'}">${complete?completionEnding(game):`<header class="debrief-heading"><div>${tag('EXPEDITION LOST')}<h2>Mission lost.</h2></div><div class="debrief-rig" data-element="${rig?RIG_CATALOG[rig].element:'kinetic'}">${marinePortrait(rig??'breacher')}<span>${rig?RIG_CATALOG[rig].name:'MARINE'}<small>COMBAT RECORD</small></span></div></header>${incomingDamageReport(game,stats,actions)}`}${resultsRunRecord(game)}<details class="result-details"><summary>${complete?'View expedition statistics':'Damage dealt & expedition build'}</summary><div class="result-stats hero-stats">${cell('rooms',`${game.expedition.run.completedNodeIds.length}<small>/${total(game)}</small>`,'SECTORS CLEARED')}${cell('kills',format(stats.kills.total),'HOSTILES ELIMINATED')}${cell('time',time,'COMBAT TIME')}${cell('damage',format(damage),'DAMAGE DEALT')}</div><div class="debrief-body"><div class="debrief-telemetry"><section class="damage-summary"><div class="telemetry-heading">${tag('DAMAGE COMPOSITION')}<span>${format(damage)} TOTAL</span></div><p class="damage-source-note">Totals by source · statuses and boons may mix elements.</p><div class="damage-source-bar" role="img" aria-label="${Object.entries(stats.damageDealt).map(([source,value])=>`${source} ${format(value)}`).join(', ')}">${Object.entries(stats.damageDealt).filter(([,value])=>value>0).map(([source,value])=>`<i data-damage-source="${source}" style="flex:${value/damage};min-width:3%"></i>`).join('')}</div><div class="damage-source-legend">${Object.entries(stats.damageDealt).map(([source,value])=>cell(source,format(value),source.toUpperCase())).join('')}</div></section><details class="combat-ledger"><summary>Combat and economy details</summary><div class="secondary-stat-groups"><section><h3>Combat</h3><div class="result-secondary">${cell('accuracy',stats.shotsFired?`${Math.round(stats.shotsHit/stats.shotsFired*100)}%`:'—','ACCURACY')}${cell('shots',format(stats.shotsFired),'SHOTS FIRED',`${format(stats.shotsHit)} confirmed hits`)}${cell('taken',format(stats.damageTaken),'DAMAGE TAKEN',stats.selfBlastDamage?`${format(stats.selfBlastDamage)} from your own blast`:'')}${cell('multi-kill',format(stats.highestMultiKill),'BEST MULTI-KILL')}</div></section><section><h3>Rig & economy</h3><div class="result-secondary">${cell('uses',format(uses),'ABILITY USES',ABILITY_SLOTS.map(slot=>`${ABILITY_KEYS[slot]} ${stats.abilityUses[slot]}`).join(' · '))}${cell('overdrives',format(stats.overdrivesUsed),'OVERDRIVES')}${cell('credits',format(stats.creditsEarned),'CREDITS EARNED')}${cell('boons',String(game.expedition.build.mutations.length),'BOONS')}</div></section></div></details></div><aside class="debrief-build">${marinePortrait(rig??'breacher','record-marine')}<div class="telemetry-heading">${tag('EXPEDITION BUILD')}<span>${game.expedition.build.mutations.length} INSTALLED</span></div>${rig?`<div class="result-ability-icons" aria-label="Equipped abilities">${ABILITY_SLOTS.map(slot=>{const a=ABILITY_CATALOG[RIG_CATALOG[rig].abilities[slot]];return `<span tabindex="0" title="${escapeHtml(`${a.name}. ${playerFacingText(a.description)}`)}" aria-label="${escapeHtml(`${a.name}. ${playerFacingText(a.description)}`)}">${icon(a.id)}<kbd>${ABILITY_KEYS[slot]}</kbd></span>`;}).join('')}</div>`:''}${buildIcons(game)}</aside></div></details>${complete?actions:''}</section>`;
}

/** Recovery templates keep system messaging consistent when the bootstrap needs them. */
