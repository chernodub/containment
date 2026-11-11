import { invalidateHudLayout } from './layout';
import type { DepthGame } from '../../DepthGame';
import type { DepthRenderer } from '../../render/DepthRenderer';
import { familyCount } from '../../game/roguelike/builds';
import { MUTATION_CATALOG } from '../../game/roguelike/mutationCatalog';
import { conciseStoryStatus } from '../../game/roguelike/storyRooms';
import { ACT_NAMES, runLength } from '../../game/roguelike/run';
import { ROOM_TEMPLATES } from '../../game/roguelike/roomTemplates';
import { ABILITY_CATALOG } from '../../game/abilities/catalog';
import type { AbilitySlotSnapshot, AbilitiesSnapshot } from '../../game/abilities/contract';
import { getAbilities } from '../gameAdapter';
import { icon } from '../icons';
import { el } from '../shell';
import { CombatText } from './CombatText';
import { ThreatIndicators } from './ThreatIndicators';
import { HudToasts } from './Toasts';
import { Radar } from './Radar';
import type { HudEffect } from './effects';
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
const abilityColors: Record<string, string> = { kinetic: '#ffb454', cryo: '#7fd6ff', pyro: '#ff7a2e', arc: '#b79cff' };
const familyIcons: Record<string, string> = { Kinetic: 'kinetic', Cryo: 'cryo', Reactor: 'arc', Recovery: 'health' };
/** Cached DOM snapshots; events and frame ticks feed bounded presentation pools. */
export function createHud(game: DepthGame, renderer: DepthRenderer, positionHud: () => void, preferences: () => HudPreferences = () => ({ combatText: true, radar: false })): HudController {
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
        return { slot, node, icon: node.querySelector<HTMLElement>('.ability-icon')!, title: node.querySelector<HTMLElement>('.ability-title')!, value: node.querySelector<HTMLElement>('.ability-value')!, charges: node.querySelector<HTMLElement>('.ability-charges'), progress: node.querySelector<SVGCircleElement>('.dial-progress'), meter: node.querySelector<HTMLElement>('.overdrive-meter i'), pips: Array.from(node.querySelectorAll<HTMLElement>('.dash-pips i')), ability: '', denied: 0, denial: 'DENIED', flash: 0 };
    });
    const combatText = new CombatText(el('combat-text'), renderer);
    const threats = new ThreatIndicators(el('threat-indicators'), el('damage-directions'), renderer);
    const toasts = new HudToasts(el('hud-toasts'));
    const radar = new Radar(el('radar-hud'), el('radar-map') as unknown as SVGSVGElement, renderer);
    let health = 100, armor = 50, maxArmor = 50, hpGhost = 100, armorGhost = 50, hpDelay = 0, armorDelay = 0;
    let lastWeapon = '', lastBuild = '__unbound__', buildSeen = false, lastCheckpoint = '', revision = game.roomRevision, disposed = false, wasPlaying = false;
    const owned = new Set<string>();
    const bounds = { left: 0, right: 0, top: 0, bottom: 0 };
    const protect = () => Object.assign(bounds, renderer.playerScreenBounds(game.player.radius));
    const updateAbility = (entry: typeof slots[number], s: AbilitySlotSnapshot, snapshot: AbilitiesSnapshot) => {
        const definition = ABILITY_CATALOG[s.id];
        if (entry.ability !== s.id) {
            layoutDirty = true;
            entry.icon.innerHTML = icon(s.id);
            entry.title.textContent = definition.name;
            entry.node.title = `${definition.name} · ${definition.summary}`;
            entry.node.setAttribute('aria-label', `${definition.name}: ${definition.summary}`);
            entry.ability = s.id;
            entry.node.style.setProperty('--ability-color', abilityColors[definition.element]);
            entry.node.dataset.element = definition.element;
        }
        const overdrive = entry.slot === 'overdrive';
        let state = entry.denied > 0 ? 'denied' : s.castRemainingMs > 0 ? 'casting' : s.activeRemainingMs > 0 ? 'active' : (overdrive ? snapshot.overdrive.ready : s.ready) ? 'ready' : 'cooling';
        const previous = entry.node.dataset.state;
        if (previous && previous !== state && state === 'ready')
            entry.flash = .22;
        if (entry.node.dataset.state !== state)
            entry.node.dataset.state = state;
        entry.node.dataset.flash = String(entry.flash > 0);
        let value = 'READY';
        if (state === 'denied')
            value = entry.denial;
        else if (s.castRemainingMs > 0)
            value = `CAST ${seconds(s.castRemainingMs)}`;
        else if (s.activeRemainingMs > 0)
            value = seconds(s.activeRemainingMs);
        else if (overdrive)
            value = snapshot.overdrive.ready ? 'READY' : `${Math.floor(clamp(snapshot.overdrive.charge) * 100)}%`;
        else if (!s.ready)
            value = s.cooldownRemainingMs > 0 ? seconds(s.cooldownRemainingMs) : s.charges > 0 ? 'BLOCKED' : 'NO CHARGE';
        if (entry.value.textContent !== value)
            entry.value.textContent = value;
        entry.node.dataset.charges = String(s.charges);
        entry.node.dataset.cooldown = String(Math.ceil(s.cooldownRemainingMs));
        entry.node.setAttribute('aria-label', `${definition.name}, ${value}${s.maxCharges > 1 ? `, ${s.charges} of ${s.maxCharges} charges` : ''}`);
        if (entry.charges)
            entry.charges.textContent = s.maxCharges > 1 ? String(s.charges) : '';
        if (entry.progress) {
            const progress = s.castRemainingMs > 0 ? 1 - s.castRemainingMs / Math.max(1, definition.castMs) : s.activeRemainingMs > 0 ? s.activeRemainingMs / Math.max(1, s.activeMs) : s.ready ? 1 : 1 - s.cooldownRemainingMs / Math.max(1, s.cooldownMs);
            entry.progress.style.strokeDashoffset = String(132 * (1 - clamp(progress)));
            entry.node.style.setProperty('--cooldown-remaining', String(1 - clamp(progress)));
        }
        if (entry.meter)
            entry.meter.style.width = `${clamp(snapshot.overdrive.charge) * 100}%`;
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
            combatText.clear();
            threats.clear();
            toasts.clear();
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
        nodes.hud.classList.toggle('low-health', low);
        text('vital-state', low ? 'CRITICAL' : s.health <= 50 ? 'DAMAGED' : 'NOMINAL');
        if (lastWeapon !== s.weaponId) {
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
                    glyph.title = `${boon.name} · ${boon.description}`;
                    glyph.setAttribute('aria-label', glyph.title);
                    glyph.innerHTML = icon(boon.abilityOnly ? boon.id : familyIcons[family]);
                    stack.append(glyph);
                }
                if (familyBoons.length > 3) {
                    const more = document.createElement('span');
                    more.className = 'boon-more';
                    more.textContent = `+${familyBoons.length - 3}`;
                    more.title = familyBoons.slice(3).map(id => `${MUTATION_CATALOG[id].name} · ${MUTATION_CATALOG[id].description}`).join(' / ');
                    stack.append(more);
                }
                group.insertBefore(stack, group.querySelector('.boon-set'));
                nodes['build-strip'].append(group);
            }
            for (const id of build.mutations) {
                if (buildSeen && !owned.has(id))
                    toasts.show(`${MUTATION_CATALOG[id].name} acquired`, MUTATION_CATALOG[id].abilityOnly ? id : familyIcons[MUTATION_CATALOG[id].family], 'reward', `boon:${id}`);
                owned.add(id);
            }
        }
        buildSeen = true;
        text('credits', `${s.credits} CR`);
        text('medkit-count', String(s.medkits));
        text('grenade-count', String(s.grenades));
        text('encounter-count', playing && game.node.kind !== 'boss' ? `${game.encounterRemaining} remaining` : '');
        const abilities = getAbilities(game);
        hidden('ability-bar', !abilities?.rig || !abilities.slots);
        if (abilities?.slots)
            for (const entry of slots)
                updateAbility(entry, abilities.slots[entry.slot], abilities);
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
        if (layoutDirty) {
            invalidateHudLayout();
            layoutDirty = false;
        }
        if (playing) {
            protect();
            positionHud();
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
                entry.denial = ({blocked: 'BLOCKED', cooldown: 'COOLDOWN', casting: 'CASTING', 'no-charge': 'NO CHARGE', 'no-rig': 'NO RIG'} as const)[event.ability.denial ?? 'no-charge'];
                entry.value.textContent = entry.denial;
            }
            if (event.ability.phase === 'ready' || event.ability.phase === 'overdrive-ready') {
                entry.flash = .22;
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
        for (const entry of slots) {
            entry.denied = Math.max(0, entry.denied - elapsed);
            entry.flash = Math.max(0, entry.flash - elapsed);
            if (!entry.flash && entry.node.dataset.flash === 'true')
                entry.node.dataset.flash = 'false';
        }
        if (game.status !== 'playing') {
            combatText.clear();
            threats.clear();
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
        combatText.tick(elapsed, bounds);
        threats.tick(elapsed);
        toasts.tick(elapsed);
    };
    hud.dispose = () => {
        if (disposed)
            return;
        disposed = true;
        combatText.dispose();
        threats.dispose();
        toasts.dispose();
        radar.dispose();
    };
    return hud;
}
