import { invalidateHudLayout, hudLayoutRevision } from './layout';
import type { DepthGame } from '../../DepthGame';
import type { DepthRenderer } from '../../render/DepthRenderer';
import { familyCount } from '../../game/roguelike/builds';
import { MUTATION_CATALOG } from '../../game/roguelike/mutationCatalog';
import { conciseStoryStatus } from '../../game/roguelike/storyRooms';
import { ACT_NAMES, runLength } from '../../game/roguelike/run';
import { ROOM_TEMPLATES } from '../../game/roguelike/roomTemplates';
import { ABILITY_CATALOG } from '../../game/abilities/catalog';
import type { AbilitySlotSnapshot, AbilitiesSnapshot } from '../../game/abilities/contract';
import { boonElement, boonIcon } from '../boonPresentation';
import { playerFacingText } from '../units';
import { getAbilities, showInvalidAbilityPlacement } from '../gameAdapter';
import { icon } from '../icons';
import { el } from '../shell';
import { CombatText } from './CombatText';
import { ThreatIndicators } from './ThreatIndicators';
import { HudToasts } from './Toasts';
import { Radar } from './Radar';
import type { HudEffect } from './effects';
import { ContextualOnboarding } from '../onboarding';
import { AbilityHints } from './AbilityHints';
export type HudPreferences = Readonly<{
    combatText?: boolean;
    radar?: boolean;
}>;
export type HudController = (() => void) & {
    effect: (effect: HudEffect) => void;
    tick: (dt: number) => void;
    dispose: () => void;
};
const clamp = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const seconds = (ms: number) => ms >= 10000 ? `${Math.ceil(ms / 1000)}s` : `${(Math.ceil(ms / 100) / 10).toFixed(1)}s`;
const familyColors: Record<string, string> = { Kinetic: '#ffb454', Cryo: '#7fd6ff', Reactor: '#b79cff', Recovery: '#9fe8ff' };
const abilityColors: Record<string, string> = { kinetic: '#ffb454', cryo: '#7fd6ff', pyro: '#ff7a2e', arc: '#b79cff', recovery: '#d7ffdb', acid: '#9dff5a' };
const familyIcons: Record<string, string> = { Kinetic: 'kinetic', Cryo: 'cryo', Reactor: 'arc', Recovery: 'health' };
/** Cached DOM snapshots; events and frame ticks feed bounded presentation pools. */
export function createHud(game: DepthGame, renderer: DepthRenderer, positionHud: () => void, preferences: () => HudPreferences = () => ({ combatText: true, radar: false }), storage: Pick<Storage,'getItem'|'setItem'> | null = null): HudController {
    const ids = ['hud', 'story-hud', 'story-status', 'room-objective', 'story-presentation', 'story-line', 'health', 'armor', 'hp-bar', 'hp-lag', 'armor-bar', 'armor-lag', 'weapon-name', 'current-weapon-icon', 'magazine', 'reserve', 'reload-label', 'reload-bar', 'depth-label', 'room-name', 'boss-hud', 'boss-phase', 'boss-bar', 'build-strip', 'credits', 'medkit-count', 'grenade-count', 'encounter-count', 'vital-state', 'ability-bar'] as const;
    let layoutDirty = true;
    const nodes = Object.fromEntries(ids.map(id => [id, el(id)])) as Record<typeof ids[number], HTMLElement>;
    const text = (id: typeof ids[number], value: string) => {
        if (nodes[id].textContent !== value) {
            if (nodes[id].textContent?.length !== value.length)
                layoutDirty = true;
            nodes[id].textContent = value;
        }
    };
    const hidden = (id: typeof ids[number], value: boolean) => {
        if (nodes[id].hidden !== value) {
            nodes[id].hidden = value;
            layoutDirty = true;
        }
    };
    const width = (id: typeof ids[number], value: number) => {
        const next = `${Math.round(clamp(value) * 1000) / 10}%`;
        if (nodes[id].style.width !== next)
            nodes[id].style.width = next;
    };
    const weaponPanel = document.querySelector<HTMLElement>('.weapon-hud')!;
    const weapons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-weapon]'));
    const phases = Array.from(document.querySelectorAll<HTMLElement>('[data-boss-phase]'));
    const slots = (['dash', 'tactical', 'power', 'overdrive'] as const).map(slot => {
        const node = document.querySelector<HTMLElement>(`[data-ability="${slot}"]`)!;
        return { slot, node, icon: node.querySelector<HTMLElement>('.ability-icon')!, title: node.querySelector<HTMLElement>('.ability-title')!, value: node.querySelector<HTMLElement>('.ability-value')!, charges: node.querySelector<HTMLElement>('.ability-charges'), progress: node.querySelector<SVGCircleElement>('.dial-progress'), meter: node.querySelector<HTMLElement>('.overdrive-meter i'), pips: Array.from(node.querySelectorAll<HTMLElement>('.dash-pips i')), ability: '', denied: 0, denial: 'No charge', flash: 0 };
    });
    const weaponBank = document.querySelector<HTMLElement>('.weapon-bank')!;
    const statusPanel = el('status-hud');
    const denial = document.createElement('aside');
    denial.id = 'ability-denial'; denial.className = 'reticle-denial'; denial.hidden = true;
    denial.setAttribute('role','status'); denial.setAttribute('aria-live','polite');
    (document.getElementById('app') ?? nodes.hud).append(denial);
    let weaponInspect = 0, roomIntro = 4, inspectObjective = false, objectiveHover = false, weaponHover = false, denialLife = 0;
    let pointerX = innerWidth * .64, pointerY = innerHeight * .48, inspectionRevision=-1;
    let weaponBounds={left:0,right:0,top:0,bottom:0}, objectiveBounds={left:0,right:0,top:0,bottom:0};
    const refreshInspection = () => {
        const expanded = weaponInspect > 0 || weaponHover;
        const narrative = roomIntro > 0 || inspectObjective || objectiveHover;
        if (weaponBank.dataset.expanded !== String(expanded)) {weaponBank.dataset.expanded=String(expanded);layoutDirty=true;}
        if (statusPanel.dataset.expanded !== String(narrative)) {statusPanel.dataset.expanded=String(narrative);layoutDirty=true;}
    };
    const onKey = (event: KeyboardEvent) => {
        const target=event.target as HTMLElement | null;
        if (game.status!=='playing' || target?.matches('input,textarea,select,[contenteditable=true]')) return;
        if (event.code==='Tab') {inspectObjective=event.type==='keydown';refreshInspection();}
        if (event.type==='keydown' && /^Digit[1-5]$/.test(event.code)) {weaponInspect=1.5;refreshInspection();}
    };
    const onBlur = () => {inspectObjective=false;weaponHover=false;objectiveHover=false;refreshInspection();};
    const onPointer = (event: PointerEvent) => {
        if(event.pointerType!=='mouse')return;pointerX=event.clientX;pointerY=event.clientY;
        const inside=(box:typeof weaponBounds)=>pointerX>=box.left&&pointerX<=box.right&&pointerY>=box.top&&pointerY<=box.bottom;
        weaponHover=inside(weaponBounds);objectiveHover=inside(objectiveBounds);refreshInspection();
    };
    const enterWeapon = () => {weaponHover=true;refreshInspection();};
    const leaveWeapon = () => {weaponHover=false;weaponInspect=1.5;refreshInspection();};
    const enterObjective = () => {objectiveHover=true;refreshInspection();};
    const leaveObjective = () => {objectiveHover=false;refreshInspection();};
    weaponBank.addEventListener('pointerenter',enterWeapon);weaponBank.addEventListener('pointerleave',leaveWeapon);
    statusPanel.addEventListener('pointerenter',enterObjective);statusPanel.addEventListener('pointerleave',leaveObjective);
    document.addEventListener('keydown',onKey);document.addEventListener('keyup',onKey);
    document.addEventListener('pointermove',onPointer,{passive:true});window.addEventListener('blur',onBlur);
    const showDenial = (reason:string) => {
        denialLife=.9;denial.textContent=reason;denial.hidden=false;
        denial.style.left=`${Math.max(85,Math.min(innerWidth-85,pointerX))}px`;
        denial.style.top=`${Math.max(10,Math.min(innerHeight-80,pointerY))}px`;
    };
    const combatText = new CombatText(el('combat-text'), renderer);
    const threats = new ThreatIndicators(el('threat-indicators'), el('damage-directions'), renderer);
    const toasts = new HudToasts(el('hud-toasts'));
    const radar = new Radar(el('radar-hud'), el('radar-map') as unknown as SVGSVGElement, renderer);
    const onboarding = new ContextualOnboarding(el('action-bar'), storage);
    const abilityHints = new AbilityHints(slots);
    const encounterTrack = document.createElement('div');
    encounterTrack.className = 'encounter-progress'; encounterTrack.hidden = true;
    encounterTrack.setAttribute('role','progressbar'); encounterTrack.setAttribute('aria-label','Room enemies defeated');
    const encounterFill = document.createElement('i'); encounterTrack.append(encounterFill); el('run-stock').after(encounterTrack);
    const overdriveEntry = slots.find(entry => entry.slot === 'overdrive')!;
    const activeDial = document.createElementNS('http://www.w3.org/2000/svg','svg');
    activeDial.setAttribute('viewBox','0 0 48 48'); activeDial.setAttribute('class','overdrive-duration'); activeDial.setAttribute('aria-hidden','true');
    activeDial.innerHTML = '<circle cx="24" cy="24" r="21"/>';
    overdriveEntry.node.querySelector('.overdrive-body')!.append(activeDial);
    const activeRing = activeDial.firstElementChild as SVGCircleElement;
    const dashActiveDial = activeDial.cloneNode(true) as SVGSVGElement;
    dashActiveDial.setAttribute('class','dash-duration');
    slots.find(entry => entry.slot === 'dash')!.node.append(dashActiveDial);
    const dashActiveRing = dashActiveDial.firstElementChild as SVGCircleElement;
    let health = 100, armor = 50, maxArmor = 50, hpGhost = 100, armorGhost = 50, hpDelay = 0, armorDelay = 0;
    let lastWeapon = '', lastBuild = '__unbound__', buildSeen = false, lastCheckpoint = '', revision = game.roomRevision, disposed = false, wasPlaying = false;
    let roomPeak = 0, streak = 0, streakWindow = 0, streakCooldown = 0, killCursor = 0;
    const recentKills = new Int32Array(16).fill(-1);
    const owned = new Set<string>();
    const bounds = { left: 0, right: 0, top: 0, bottom: 0 };
    const protect = () => Object.assign(bounds, renderer.playerScreenBounds(game.player.radius));
    const updateAbility = (entry: typeof slots[number], s: AbilitySlotSnapshot, snapshot: AbilitiesSnapshot) => {
        const definition = ABILITY_CATALOG[s.id];
        if (entry.ability !== s.id) {
            layoutDirty = true;
            entry.icon.innerHTML = icon(s.id);
            entry.title.textContent = definition.name;
            entry.node.title = `${definition.name} · ${playerFacingText(definition.summary)}`;
            entry.node.setAttribute('aria-label', `${definition.name}: ${playerFacingText(definition.summary)}`);
            entry.ability = s.id;
            abilityHints.update(entry.slot, s.id);
            entry.node.style.setProperty('--ability-color', abilityColors[definition.element]);
            entry.node.dataset.element = definition.element;
        }
        const overdrive = entry.slot === 'overdrive';
        let state = entry.denied > 0 ? 'denied' : s.castRemainingMs > 0 ? 'casting' : s.activeRemainingMs > 0 ? 'active' : (overdrive ? snapshot.overdrive.ready : s.ready) ? 'ready' : 'cooling';
        const previous = entry.node.dataset.state;
        if (previous && previous !== state && state === 'ready')
            entry.flash = entry.slot === 'overdrive' ? 0 : .22;
        if (entry.node.dataset.state !== state)
            entry.node.dataset.state = state;
        entry.node.dataset.flash = String(entry.flash > 0);
        let value = 'READY';
        if (state === 'denied')
            value = entry.denial;
        else if (s.castRemainingMs > 0)
            value = `Casting ${seconds(s.castRemainingMs)}`;
        else if (s.activeRemainingMs > 0)
            value = seconds(s.activeRemainingMs);
        else if (overdrive)
            value = snapshot.overdrive.roomLimited && snapshot.overdrive.charge >= 1 ? 'NEXT ROOM' : snapshot.overdrive.ready ? 'READY' : `${Math.floor(clamp(snapshot.overdrive.charge) * 100)}%`;
        else if (!s.ready)
            value = s.cooldownRemainingMs > 0 ? seconds(s.cooldownRemainingMs) : s.charges <= 0 ? 'No charge' : snapshot.dashing || snapshot.slots && (snapshot.slots.dash.castRemainingMs > 0 || snapshot.slots.tactical.castRemainingMs > 0 || snapshot.slots.power.castRemainingMs > 0 || snapshot.slots.overdrive.castRemainingMs > 0) ? 'Casting' : entry.slot === 'power' ? 'Need clear ground' : 'Unavailable';
        entry.node.dataset.reason = state === 'cooling' && s.cooldownRemainingMs > 0 ? 'Recharging' : '';
        if (entry.node.dataset.reason) entry.node.setAttribute('data-state-label','Recharging');
        else entry.node.removeAttribute('data-state-label');
        if (entry.value.textContent !== value)
            entry.value.textContent = value;
        entry.node.dataset.charges = String(s.charges);
        entry.node.dataset.cooldown = String(Math.ceil(s.cooldownRemainingMs));
        entry.node.setAttribute('aria-label', `${definition.name}, ${entry.node.dataset.reason ? `${entry.node.dataset.reason} ` : ''}${value}${s.maxCharges > 1 ? `, ${s.charges} of ${s.maxCharges} charges` : ''}`);
        if (entry.charges)
            entry.charges.textContent = s.maxCharges > 1 ? String(s.charges) : '';
        if (entry.progress) {
            const progress = s.castRemainingMs > 0 ? 1 - s.castRemainingMs / Math.max(1, definition.castMs) : s.activeRemainingMs > 0 ? s.activeRemainingMs / Math.max(1, s.activeMs) : s.ready ? 1 : 1 - s.cooldownRemainingMs / Math.max(1, s.cooldownMs);
            entry.progress.style.strokeDashoffset = String(132 * (1 - clamp(progress)));
            entry.node.style.setProperty('--cooldown-remaining', String(1 - clamp(progress)));
        }
        if (entry.meter)
            entry.meter.style.width = `${clamp(snapshot.overdrive.charge) * 100}%`;
        if (overdrive) {
            activeDial.style.display = s.activeRemainingMs > 0 ? '' : 'none';
            activeRing.style.strokeDashoffset = String(132 * (1 - clamp(s.activeRemainingMs / Math.max(1, s.activeMs))));
        }
        if (entry.slot === 'dash') {
            dashActiveDial.style.display = s.activeRemainingMs > 0 ? '' : 'none';
            dashActiveRing.style.strokeDashoffset = String(132 * (1 - clamp(s.activeRemainingMs / Math.max(1, s.activeMs))));
        }
        for (let i = 0; i < entry.pips.length; i++) {
            entry.pips[i].hidden = i >= s.maxCharges;
            entry.pips[i].dataset.empty = String(i >= s.charges);
            // The snapshot exposes the next independent recharge; subsequent pips remain empty.
            const recharge = i < s.charges ? 1 : i === s.charges ? 1 - s.cooldownRemainingMs / Math.max(1, s.cooldownMs) : 0;
            entry.pips[i].style.setProperty('--pip-charge', `${clamp(recharge) * 100}%`);
        }
    };
    const hud = (() => {
        if (disposed)
            return;
        const s = game.combat.snapshot, playing = game.status === 'playing';
        if (revision !== game.roomRevision) {
            revision = game.roomRevision;
            roomIntro=4;denialLife=0;denial.hidden=true;showInvalidAbilityPlacement(renderer,null);
            combatText.clear();
            threats.clear();
            toasts.clear();
            roomPeak = 0; streak = 0; streakWindow = 0; streakCooldown = 0; recentKills.fill(-1);
            for (const entry of slots) {
                entry.denied = 0;
                entry.flash = 0;
            }
        }
        hidden('story-hud', !game.storyRoom || !playing);
        // Story text remains authored verbatim; the optional line alone is skippable.
        text('story-status', conciseStoryStatus(game.storyStatus));
        text('room-objective', game.storyRoom?.objective ?? '');
        hidden('story-presentation', !game.storyPresentation);
        text('story-line', game.storyPresentation ?? '');
        if (s.health < health)
            hpDelay = .35;
        else if (s.health > health)
            hpGhost = s.health;
        if (s.armor < armor)
            armorDelay = .35;
        else if (s.armor > armor)
            armorGhost = s.armor;
        health = s.health;
        armor = s.armor;
        maxArmor = s.maxArmor;
        text('health', String(Math.ceil(s.health)));
        text('armor', String(Math.ceil(s.armor)));
        width('hp-bar', s.health / 100);
        width('armor-bar', s.armor / Math.max(1, s.maxArmor));
        const low = s.health <= 25;
        const medkitAvailable=String(low&&s.medkits>0);
        if(nodes.hud.dataset.medkitAvailable!==medkitAvailable){
            nodes.hud.dataset.medkitAvailable=medkitAvailable;
            el('desktop-stock').setAttribute('aria-label', medkitAvailable==='true' ? 'Low health. E: use a medkit.' : 'Medical and grenade supplies');
        }
        nodes.hud.classList.toggle('low-health', low);
        text('vital-state', low ? 'CRITICAL' : s.health <= 50 ? 'DAMAGED' : 'NOMINAL');
        if (lastWeapon !== s.weaponId) {
            weaponInspect=1.5;
            lastWeapon = s.weaponId;
            text('weapon-name', s.weaponId);
            nodes['current-weapon-icon'].innerHTML = icon(s.weaponId);
            for (const button of weapons) {
                const selected = button.dataset.weapon === s.weaponId;
                button.classList.toggle('selected', selected);
                button.setAttribute('aria-pressed', String(selected));
            }
        }
        text('magazine', String(s.magazine).padStart(2, '0'));
        weaponPanel.dataset.ammo = s.magazine === 0 ? 'empty' : s.magazine / Math.max(1, s.magazineCapacity) <= .25 ? 'low' : 'normal';
        weaponPanel.dataset.reloading = String(s.reloading);
        weaponPanel.style.setProperty('--reload-progress', `${s.reloading ? clamp(1 - s.reloadRemainingMs / Math.max(1, s.reloadDurationMs)) * 100 : 0}%`);
        text('reserve', `/ ${Number.isFinite(s.reserve) ? s.reserve : '∞'}`);
        text('reload-label', s.reloading ? 'RELOADING' : s.magazine === 0 ? (s.reserve === 0 ? 'EMPTY · SWITCH WEAPON' : 'R · RELOAD') : '');
        width('reload-bar', s.reloading ? 1 - s.reloadRemainingMs / Math.max(1, s.reloadDurationMs) : 0);
        text('depth-label', `${(game.storyRoom?.environment ?? ACT_NAMES[Math.min(2, Math.floor(game.node.depth / 4))]).toUpperCase()} · ${String(game.node.depth + 1).padStart(2, '0')} / ${runLength(game.expedition.run.version)}`);
        text('room-name', ROOM_TEMPLATES[game.node.templateId].name);
        const q = game.boss.snapshot;
        hidden('boss-hud', !q.active);
        const phase = q.vulnerable ? 'exposed' : q.phase === 'nest-spawn' ? 'nests' : 'armored';
        text('boss-phase', `${phase.toUpperCase()} · ${Math.ceil(q.phaseRemainingMs / 1000)}s`);
        width('boss-bar', q.health / Math.max(1, q.maxHealth));
        nodes['boss-hud'].classList.toggle('exposed', q.vulnerable);
        for (const node of phases)
            node.dataset.active = String(node.dataset.bossPhase === phase);
        const build = game.expedition.build, buildKey = build.mutations.join('|');
        if (buildKey !== lastBuild) {
            lastBuild = buildKey;
            layoutDirty = true;
            nodes['build-strip'].replaceChildren();
            for (const family of ['Kinetic', 'Cryo', 'Reactor', 'Recovery']) {
                const count = familyCount(build, family);
                if (!count)
                    continue;
                const group = document.createElement('span');
                group.className = 'boon-group';
                group.dataset.family = family;
                group.dataset.bonus = String(count >= 3);
                group.style.setProperty('--family-color', familyColors[family]);
                const familyBoons = build.mutations.filter(id => MUTATION_CATALOG[id].family === family);
                const names = familyBoons.map(id => MUTATION_CATALOG[id].name);
                group.title = `${family}: ${names.join(', ')}${count >= 3 ? ' · Set bonus active' : ''}`;
                group.setAttribute('aria-label', group.title);
                group.innerHTML = `${icon(familyIcons[family])}<span>${family}</span><b>${count}</b><span class="boon-set">${count >= 3 ? '◆ SET' : `${count}/3`}</span>`;
                const stack = document.createElement('span');
                stack.className = 'boon-owned-stack';
                for (const id of familyBoons.slice(0, 3)) {
                    const boon = MUTATION_CATALOG[id];
                    const glyph = document.createElement('span');
                    glyph.className = 'boon-owned';
                    glyph.dataset.boon = id;
                    glyph.dataset.rarity = boon.rarity;
                    glyph.title = `${boon.name} · ${playerFacingText(boon.description)} · Counts toward ${boon.family} set`;
                    glyph.style.color=abilityColors[boonElement(boon)];
                    glyph.style.borderColor=abilityColors[boonElement(boon)];
                    glyph.setAttribute('aria-label', glyph.title);
                    glyph.innerHTML = icon(boonIcon(boon));
                    stack.append(glyph);
                }
                if (familyBoons.length > 3) {
                    const more = document.createElement('span');
                    more.className = 'boon-more';
                    more.textContent = `+${familyBoons.length - 3}`;
                    more.title = familyBoons.slice(3).map(id => `${MUTATION_CATALOG[id].name} · ${playerFacingText(MUTATION_CATALOG[id].description)}`).join(' / ');
                    stack.append(more);
                }
                group.insertBefore(stack, group.querySelector('.boon-set'));
                nodes['build-strip'].append(group);
            }
            // A new expedition drops the previous build. Forget removed ownership so
            // the same boon can announce its successful acquisition on a later run.
            for (const id of owned) if (!build.mutations.some(mutation => mutation === id)) owned.delete(id);
            for (const id of build.mutations) {
                if (buildSeen && !owned.has(id))
                    toasts.show(`${MUTATION_CATALOG[id].name} acquired`, boonIcon(MUTATION_CATALOG[id]), 'reward', `boon:${id}`, abilityColors[boonElement(MUTATION_CATALOG[id])]);
                owned.add(id);
            }
        }
        buildSeen = true;
        text('credits', `${s.credits} CR`);
        text('medkit-count', String(s.medkits));
        text('grenade-count', String(s.grenades));
        text('encounter-count', playing && game.node.kind !== 'boss' ? `${game.encounterRemaining} remaining` : '');
        roomPeak = Math.max(roomPeak, game.encounterRemaining);
        encounterTrack.hidden = !playing || game.node.kind === 'boss' || roomPeak === 0;
        const defeated = Math.max(0, roomPeak - game.encounterRemaining);
        encounterFill.style.width = `${roomPeak ? defeated / roomPeak * 100 : 0}%`;
        encounterTrack.setAttribute('aria-valuemin','0'); encounterTrack.setAttribute('aria-valuemax',String(roomPeak)); encounterTrack.setAttribute('aria-valuenow',String(defeated));
        encounterTrack.setAttribute('aria-valuetext',`${game.encounterRemaining} enemies remaining`);
        const abilities = getAbilities(game);
        hidden('ability-bar', !abilities?.rig || !abilities.slots);
        if (abilities?.slots)
            for (const entry of slots)
                updateAbility(entry, abilities.slots[entry.slot], abilities);
        onboarding.update(game, abilities);
        const pref = preferences();
        combatText.setEnabled(pref.combatText !== false);
        radar.update(game, pref.radar === true && playing);
        const checkpoint = `${game.checkpointStatus}:${game.roomRevision}`;
        if (checkpoint !== lastCheckpoint) {
            if (lastCheckpoint && playing) {
                if (game.checkpointWarning)
                    toasts.show(game.checkpointWarning, 'warning', 'warning', 'checkpoint');
                else if (game.checkpointStatus === 'saved')
                    toasts.show('Checkpoint saved', 'check', 'info', 'checkpoint');
            }
            lastCheckpoint = checkpoint;
        }
        refreshInspection();
        if (layoutDirty) {
            invalidateHudLayout();
            layoutDirty = false;
        }
        if (playing) {
            protect();
            positionHud();
            if(inspectionRevision!==hudLayoutRevision()){
                inspectionRevision=hudLayoutRevision();
                const copy=(node:HTMLElement)=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};};
                weaponBounds=copy(weaponBank);objectiveBounds=copy(statusPanel);
            }
            threats.update(game.enemies.snapshot.enemies, game.player, bounds, game.bullets, q);
        }
        else if (wasPlaying) {
            combatText.clear();
            threats.clear();
        }
        wasPlaying = playing;
    }) as HudController;
    hud.effect = (event: HudEffect) => {
        if (disposed || game.status !== 'playing')
            return;
        combatText.setEnabled(preferences().combatText !== false);
        combatText.effect(event);
        threats.effect(event, game.player);
        onboarding.effect(event);
        if (event.lethal && (event.type === 'hit' || event.type === 'acid' || event.contact)) {
            const id = event.targetId ?? event.id;
            if (id !== undefined && !recentKills.includes(id)) {
                recentKills[killCursor++ % recentKills.length] = id;
                streak = streakWindow > 0 ? streak + 1 : 1; streakWindow = 1;
                if (streak >= 3 && streakCooldown <= 0) {
                    toasts.show(`SWARM BROKEN · ${streak} down`, 'combat', 'combat', 'multikill'); streakCooldown = 2;
                }
            }
        }
        if (event.type === 'pickup')
            toasts.show('Supplies collected', 'credits', 'reward', 'pickup');
        if (event.type === 'ability' && event.ability) {
            const entry = slots.find(s => s.slot === event.ability!.slot);
            if (!entry)
                return;
            if (event.ability.phase === 'denied') {
                entry.denied = .32;
                entry.flash = 0;
                entry.node.dataset.flash = 'false';
                entry.node.dataset.state = 'denied';
                const reason = event.ability.denial as string | undefined;
                const definition=ABILITY_CATALOG[event.ability.ability];
                entry.denial = reason==='blocked' ? entry.slot==='overdrive'&&getAbilities(game)?.overdrive.roomLimited ? 'Next room' : entry.slot==='power' ? 'Need clear ground' : 'Unavailable' : ({cooldown:'Recharging',casting:'Casting','no-charge':'No charge','no-rig':'Choose a rig','no-target':'No target'} as Record<string,string>)[reason??'no-charge'] ?? 'No target';
                showDenial(entry.denial);
                if(reason==='blocked'&&definition.targeting==='point')showInvalidAbilityPlacement(renderer,definition.id,event.ability.targetX,event.ability.targetY);
                entry.value.textContent = entry.denial;
            }
            if (event.ability.phase === 'ready' || event.ability.phase === 'overdrive-ready') {
                entry.flash = entry.slot === 'overdrive' ? 0 : .22;
                entry.node.dataset.flash = 'true';
            }
            if (event.ability.phase === 'overdrive-ready')
                toasts.show('Overdrive ready · V', event.ability.ability, 'reward', 'overdrive');
            else if (entry.slot === 'overdrive' && (event.ability.phase === 'cast' || event.ability.phase === 'impact'))
                toasts.dismiss('overdrive');
            const abilities = getAbilities(game);
            if (abilities?.slots) updateAbility(entry, abilities.slots[entry.slot], abilities);
        }
    };
    hud.tick = (dt: number) => {
        if (disposed)
            return;
        const elapsed = Number.isFinite(dt) ? Math.max(0, Math.min(dt, .1)) : 0;
        weaponInspect=Math.max(0,weaponInspect-elapsed);roomIntro=Math.max(0,roomIntro-elapsed);
        denialLife=Math.max(0,denialLife-elapsed);
        if(!denialLife&&!denial.hidden){denial.hidden=true;showInvalidAbilityPlacement(renderer,null);}
        refreshInspection();
        streakWindow = Math.max(0, streakWindow - elapsed); streakCooldown = Math.max(0, streakCooldown - elapsed);
        for (const entry of slots) {
            entry.denied = Math.max(0, entry.denied - elapsed);
            entry.flash = Math.max(0, entry.flash - elapsed);
            if (!entry.flash && entry.node.dataset.flash === 'true')
                entry.node.dataset.flash = 'false';
        }
        if (game.status !== 'playing') {
            denial.hidden=true;denialLife=0;inspectObjective=false;showInvalidAbilityPlacement(renderer,null);
            combatText.clear();
            threats.clear();
            abilityHints.tick(bounds, false);
            return;
        }
        hpDelay = Math.max(0, hpDelay - elapsed);
        armorDelay = Math.max(0, armorDelay - elapsed);
        if (!hpDelay)
            hpGhost = Math.max(health, hpGhost - elapsed * 45);
        if (!armorDelay)
            armorGhost = Math.max(armor, armorGhost - elapsed * 55);
        width('hp-lag', hpGhost / 100);
        width('armor-lag', armorGhost / Math.max(1, maxArmor));
        protect();
        onboarding.tick(elapsed, bounds);
        abilityHints.tick(bounds, true);
        combatText.tick(elapsed, bounds);
        threats.tick(elapsed);
        toasts.tick(elapsed);
    };
    hud.dispose = () => {
        if (disposed)
            return;
        disposed = true;
        document.removeEventListener('keydown',onKey);document.removeEventListener('keyup',onKey);document.removeEventListener('pointermove',onPointer);window.removeEventListener('blur',onBlur);
        weaponBank.removeEventListener('pointerenter',enterWeapon);weaponBank.removeEventListener('pointerleave',leaveWeapon);
        statusPanel.removeEventListener('pointerenter',enterObjective);statusPanel.removeEventListener('pointerleave',leaveObjective);denial.remove();showInvalidAbilityPlacement(renderer,null);
        combatText.dispose();
        threats.dispose();
        toasts.dispose();
        radar.dispose();
        onboarding.dispose(); abilityHints.dispose(); encounterTrack.remove(); activeDial.remove(); dashActiveDial.remove();
    };
    return hud;
}
