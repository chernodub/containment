import {conditionChip} from '../conditionChip';
import {getWeaponSituation} from '../gameAdapter';
import type {WeaponId} from '../../game/combat/types';
import {captureWeaponPointer} from './weaponInput';
import {MasteryHints} from './MasteryHints';
import {getAwakeningDrill, getMasteryPreview, getRoomOpening, getShipCondition} from '../gameAdapter';
import {EncounterCues} from './EncounterCues';
import {TargetMarkers} from './TargetMarkers';
import {SiegeLabel} from './SiegeLabel';
import {getCombatDamageElement} from '../gameAdapter';
import { invalidateHudLayout, getHudInsets, beginHudOcclusion, markHudOcclusion, markHudWarningOcclusion, finishHudOcclusion, clearHudOcclusion } from './layout';
import type { DepthGame } from '../../DepthGame';
import type { DepthRenderer } from '../../render/DepthRenderer';
import { familyCount } from '../../game/roguelike/builds';
import { MUTATION_CATALOG } from '../../game/roguelike/mutationCatalog';
import { conciseStoryStatus } from '../../game/roguelike/storyRooms';
import {combatObjective, combatStoryWarning} from '../storyPresentation';
export {combatObjective} from '../storyPresentation';
import { ACT_NAMES, runLength } from '../../game/roguelike/run';
import { ROOM_TEMPLATES } from '../../game/roguelike/roomTemplates';
import { ABILITY_CATALOG } from '../../game/abilities/catalog';
import type { AbilitySlotSnapshot, AbilitiesSnapshot } from '../../game/abilities/contract';
import {setChip, effectChip} from '../boonChips';
import { boonElement, boonIcon } from '../boonPresentation';
import { playerFacingText } from '../units';
import { getAbilities, setPlacementPreview, createPlacementPreview, readPlacementPreview, placementPointer, setHudCoachedTarget, setHudInsets, projectWorld, projectActorBounds } from '../gameAdapter';
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
    combatTextDensity?: 'full' | 'reduced';
    radar?: boolean;
    hints?: boolean;
    masteryHints?: boolean;
}>;
export type HudController = (() => void) & {
    effect: (effect: HudEffect) => void;
    tick: (dt: number) => void;
    dispose: () => void;
};
const clamp = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const seconds = (ms: number) => ms >= 10000 ? `${Math.ceil(ms / 1000)}s` : `${(Math.ceil(ms / 100) / 10).toFixed(1)}s`;
function setHudAttribute(node:Element,name:string,value:string):void {
    if(node.getAttribute(name)!==value)node.setAttribute(name,value);
}
function setHudProperty(style:CSSStyleDeclaration,name:string,value:string):void {
    if(style.getPropertyValue(name)!==value)style.setProperty(name,value);
}
const abilityColors: Record<string, string> = { kinetic: '#ffd063', cryo: '#7fd6ff', pyro: '#ff7a2e', arc: '#b79cff', recovery: '#d7ffdb', acid: '#9dff5a' };
/** Cached DOM snapshots; events and frame ticks feed bounded presentation pools. */
export function createHud(game: DepthGame, renderer: DepthRenderer, positionHud: () => void, preferences: () => HudPreferences = () => ({ combatText: true, radar: false }), storage: Pick<Storage,'getItem'|'setItem'> | null = null): HudController {
    const ids = ['hud', 'suit-vitals', 'story-hud', 'story-status', 'room-objective', 'story-presentation', 'story-line', 'health', 'armor', 'hp-bar', 'hp-lag', 'armor-bar', 'armor-lag', 'weapon-name', 'current-weapon-icon', 'magazine', 'reserve', 'reload-label', 'reload-bar', 'depth-label', 'room-name', 'room-condition', 'boss-hud', 'boss-phase', 'boss-bar', 'build-strip', 'credits', 'medkit-count', 'grenade-count', 'encounter-count', 'vital-state', 'ability-bar'] as const;
    let layoutDirty = true;
    const nodes = Object.fromEntries(ids.map(id => [id, el(id)])) as Record<typeof ids[number], HTMLElement>;
    // Font/content/CSS changes can resize a panel without resizing the canvas.
    // Observe those edges once; ordinary projection frames keep the cached fast path.
    const panelResize = typeof ResizeObserver === 'function' ? new ResizeObserver(() => {layoutDirty = true;}) : null;
    for (const panel of document.querySelectorAll('#action-bar,.vitals,#status-hud,#radar-hud,#boss-hud')) panelResize?.observe(panel);
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
    const weapons = Array.from(document.querySelectorAll<HTMLButtonElement>('#weapon-picker [data-weapon]'));
    const phases = Array.from(document.querySelectorAll<HTMLElement>('[data-boss-phase]'));
    const slots = (['dash', 'tactical', 'power', 'overdrive'] as const).map(slot => {
        const node = document.querySelector<HTMLElement>(`[data-ability="${slot}"]`)!;
        return { slot, node, icon: node.querySelector<HTMLElement>('.ability-icon')!, title: node.querySelector<HTMLElement>('.ability-title')!, value: node.querySelector<HTMLElement>('.ability-value')!, charges: node.querySelector<HTMLElement>('.ability-charges'), progress: node.querySelector<SVGCircleElement>('.dial-progress'), meter: node.querySelector<HTMLElement>('.overdrive-meter i'), pips: Array.from(node.querySelectorAll<HTMLElement>('.dash-pips i')), ability: '', denied: 0, denial: 'No charge', flash: 0 };
    });
    const weaponBank = document.querySelector<HTMLElement>('.weapon-bank')!;
    const dockSegments = [weaponBank, ...slots.map(slot => slot.node)];
    const statusPanel = el('status-hud');
    const denial = document.createElement('aside');
    denial.id = 'ability-denial'; denial.className = 'reticle-denial'; denial.hidden = true;
    denial.setAttribute('role','status'); denial.setAttribute('aria-live','polite');
    (document.getElementById('app') ?? nodes.hud).append(denial);
    let buildReveal = 0, denialLife = 0;
    let pointerX = innerWidth * .64, pointerY = innerHeight * .48, pointerActive=false, pointerKnown=false, aimPointerX=0, aimPointerY=0, powerAim=false, deniedPlacementLife=0;
    const placement=createPlacementPreview(),deniedPlacement=createPlacementPreview(),deniedAim={x:0,y:0};
    let fighting = false;
    const refreshInspection = () => {
        const expanded = !fighting;
        const narrative = false;
        const reveal = buildReveal > 0;
        if (statusPanel.dataset.buildReveal !== String(reveal)) {statusPanel.dataset.buildReveal=String(reveal);layoutDirty=true;}
        if (weaponBank.dataset.expanded !== String(expanded)) {weaponBank.dataset.expanded=String(expanded);layoutDirty=true;}
        if (statusPanel.dataset.expanded !== String(narrative)) {statusPanel.dataset.expanded=String(narrative);layoutDirty=true;}
    };
    const onKey = (event: KeyboardEvent) => {
        const target=event.target as HTMLElement | null;
        if (event.type === 'keyup' && event.code === 'KeyF') powerAim = false;
        if (game.status!=='playing' || target?.matches('input,textarea,select,[contenteditable=true]')) return;
        if(event.code==='KeyF'&&event.type==='keydown')powerAim=true;
    };
    const onBlur = () => {pointerActive=false;pointerKnown=false;powerAim=false;denialLife=0;deniedPlacementLife=0;denial.hidden=true;setPlacementPreview(renderer,null);refreshInspection();};
    const onPointer = (event: PointerEvent) => {
        if(event.pointerType!=='mouse')return;pointerX=event.clientX;pointerY=event.clientY;
        pointerActive=event.target===renderer.canvas;
        if(pointerActive){pointerKnown=true;aimPointerX=pointerX;aimPointerY=pointerY;}
    };
    document.addEventListener('keydown',onKey);document.addEventListener('keyup',onKey);
    document.addEventListener('pointermove',onPointer,{passive:true});window.addEventListener('blur',onBlur);window.addEventListener('resize',onBlur);
    const showDenial = (reason:string) => {
        denialLife=.9;denial.textContent=reason;
        denial.style.left=`${Math.max(85,Math.min(innerWidth-85,pointerX))}px`;
        denial.style.top=`${Math.max(10,Math.min(innerHeight-80,pointerY))}px`;
    };
    const combatText = new CombatText(el('combat-text'), renderer, id => game.enemies.getSnapshot(id), () => game.player);
    const encounterCues = new EncounterCues();
    const targetMarkers = new TargetMarkers(el('threat-indicators'));
    const siegeLabel = new SiegeLabel(el('threat-indicators'));
    const threats = new ThreatIndicators(el('threat-indicators'), el('damage-directions'), renderer);
    const toasts = new HudToasts(el('hud-toasts'));
    const radar = new Radar(el('radar-hud'), el('radar-map') as unknown as SVGSVGElement, renderer);
    const skipDrill = document.createElement('button');
    captureWeaponPointer(skipDrill);
    skipDrill.style.pointerEvents = 'auto';
    skipDrill.className = 'quiet';
    skipDrill.textContent = 'Skip bonus drill';
    skipDrill.hidden = true;
    skipDrill.onclick = () => game.skipAwakeningDrill();
    nodes['story-hud'].append(skipDrill);
    const masteryHints = new MasteryHints(nodes.hud, storage);
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
    const shownLessonAnchors = new Set<string>();
    let lessonAnchorKey = '', lessonAnchorUntil = 0;
    let suggestionUntil = 0;
    let plateHit: {id: number; until: number} | undefined;
    let shownSituation: string | undefined;
    let suggestionClock = -1;
    const situationCount = new Map<WeaponId, number>();
    for (const weapon of ['pistol', 'plasma', 'rocket'] as const) {
        try {
            const count = Number(storage?.getItem(`containment.weapon-lesson.${weapon}`));
            if (Number.isInteger(count) && count >= 0 && count <= 3) situationCount.set(weapon, count);
        } catch {}
    }
    let lastWeapon = '', lastBuild = '__unbound__', buildSeen = false, lastCheckpoint = '', revision = game.roomRevision, disposed = false, wasPlaying = false;
    let roomPeak = 0, streak = 0, streakWindow = 0, streakCooldown = 0, killCursor = 0;
    const recentKills = new Int32Array(16).fill(-1);
    const owned = new Set<string>();
    const bounds = { left: 0, right: 0, top: 0, bottom: 0 };
    const onboardingObstacles: Array<{left:number;right:number;top:number;bottom:number}> = [];
    const actorBounds = { left: 0, right: 0, top: 0, bottom: 0 };
    const projected = {x: 0, y: 0, visible: false};
    const projectedRadius = {x: 0, y: 0, visible: false};
    const warnings = Array.from({length:32}, () => ({x:0,y:0,targetX:0,targetY:0,radius:0,life:0}));
    const obscureWorld = (x: number, y: number, radius = 0, height = .8) => {
        projectWorld(renderer, x, y, projected, height);
        if (!Number.isFinite(projected.x) || !Number.isFinite(projected.y)) return;
        let size = 24;
        if (radius > 0) {
            projectWorld(renderer, x + radius, y, projectedRadius, height);
            size = Math.max(size, Math.hypot(projectedRadius.x - projected.x, projectedRadius.y - projected.y));
            projectWorld(renderer, x, y + radius, projectedRadius, height);
            size = Math.max(size, Math.hypot(projectedRadius.x - projected.x, projectedRadius.y - projected.y));
        }
        onboardingObstacles.push({left:projected.x-size,top:projected.y-size,right:projected.x+size,bottom:projected.y+size});
        markHudOcclusion(projected.x - size, projected.y - size, projected.x + size, projected.y + size);
    };
    const obscureWarning = (x: number, y: number, radius: number, endX: number, endY: number) => {
        obscureWorld(x, y, radius, .05);
        if (x !== endX || y !== endY) for (let step = 1; step <= 8; step++) obscureWorld(x + (endX - x) * step / 8, y + (endY - y) * step / 8, radius, .05);
    };
    const obscureActor = (id: number, x: number, y: number, radius: number) => {
        if (projectActorBounds(renderer, id, x, y, radius, actorBounds)) {
            onboardingObstacles.push({...actorBounds});
            markHudOcclusion(actorBounds.left, actorBounds.top, actorBounds.right, actorBounds.bottom);
        }
        else obscureWorld(x, y, radius);
    };
    const warningOverlaps = (left: number, top: number, right: number, bottom: number) =>
        renderer.warningObstructs(left, top, right, bottom);
    const updateDockYield = (playing: boolean) => {
        let nearest = Infinity;
        let yielding = 0;
        const rectangles = dockSegments.map(segment => segment.getBoundingClientRect());
        if (playing && fighting) for (const enemy of game.enemies.snapshot.enemies) {
            if (enemy.health <= 0 || enemy.alpha < .2 || !(enemy.pendingAttack || enemy.windupMs > 0 ||
                enemy.chargeMs > 0 || enemy.meleePhase === 'windup' || enemy.meleePhase === 'strike')) continue;
            const distance = Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y);
            if (distance >= nearest || !projectActorBounds(renderer, enemy.id, enemy.x, enemy.y, enemy.radius, actorBounds)) continue;
            // Include the visible upper body and the forward portion of a committed melee pose.
            const {left, right, top} = actorBounds;
            let bottom = top + (actorBounds.bottom - top) * .7;
            let limb: typeof projected | undefined;
            if (enemy.meleePhase === 'windup' || enemy.meleePhase === 'strike') {
                const reach = Math.min(enemy.radius * 1.5, enemy.meleeShape.range);
                limb = projectWorld(renderer, enemy.x + Math.cos(enemy.meleeAngle) * reach,
                    enemy.y + Math.sin(enemy.meleeAngle) * reach, projected, .55);
                bottom = Math.max(bottom, limb.y + 8);
            }
            let segments = 0;
            for (const [index, rect] of rectangles.entries()) {
                if (rect.width && rect.height && rect.left < (limb ? Math.max(right, limb.x + 8) : right) &&
                    rect.right > (limb ? Math.min(left, limb.x - 8) : left) && rect.top < bottom && rect.bottom > top)
                    segments |= 1 << index;
            }
            if (segments) {nearest = distance; yielding = segments;}
        }
        dockSegments.forEach((segment, index) => segment.toggleAttribute('data-dock-yield', Boolean(yielding & (1 << index))));
    };
    const protectPanels = () => {
        onboardingObstacles.length = 0;
        beginHudOcclusion();
        markHudOcclusion(bounds.left, bounds.top, bounds.right, bounds.bottom);
        for (const enemy of game.enemies.snapshot.enemies) if (enemy.health > 0 && enemy.alpha >= .2) obscureActor(enemy.id, enemy.x, enemy.y, enemy.radius);
        const boss = game.boss.snapshot;
        if (boss.active) obscureActor(-1, boss.x, boss.y, 92);
        for (const warning of warnings) if (warning.life > 0) {
            obscureWarning(warning.x, warning.y, warning.radius, warning.targetX, warning.targetY);
        }
        for (const pool of game.pools) if (pool.life > 0) obscureWorld(pool.x, pool.y, pool.radius, .05);
        for (const bullet of game.bullets) if (bullet.kind === 'hazard') obscureWorld(bullet.x, bullet.y, bullet.request.radius, .15);
        markHudWarningOcclusion(warningOverlaps);
        finishHudOcclusion();
    };
    const protect = () => Object.assign(bounds, renderer.playerScreenBounds(game.player.radius));
    let lessonActive = false;
    let mastery: ReturnType<typeof getMasteryPreview> | null = null;
    const updateAbility = (entry: typeof slots[number], s: AbilitySlotSnapshot, snapshot: AbilitiesSnapshot) => {
        const definition = ABILITY_CATALOG[s.id];
        if (entry.ability !== s.id) {
            layoutDirty = true;
            entry.icon.innerHTML = icon(s.id);
            entry.title.textContent = definition.name;
            entry.node.removeAttribute('title');
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
        setHudAttribute(entry.node,'data-flash',String(entry.flash>0));
        const mastering = (s.id==='glacier'&&!!mastery?.walls.length)||(s.id==='flashfire'&&s.ready&&!!mastery?.ignite.length);
        const title = definition.name;
        if(entry.title.textContent!==title)entry.title.textContent=title;
        setHudAttribute(entry.node,'data-mastery',String(mastering));
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
            value = s.cooldownRemainingMs > 0 ? seconds(s.cooldownRemainingMs) : s.charges <= 0 ? 'No charge' : snapshot.dashing || snapshot.slots && (snapshot.slots.dash.castRemainingMs > 0 || snapshot.slots.tactical.castRemainingMs > 0 || snapshot.slots.power.castRemainingMs > 0 || snapshot.slots.overdrive.castRemainingMs > 0) ? 'Casting' : entry.slot === 'power' ? 'BLOCKED' : 'Unavailable';
        const reason = state === 'cooling' && s.cooldownRemainingMs > 0 ? 'Recharging' : '';
        setHudAttribute(entry.node,'data-reason',reason);
        if(reason)setHudAttribute(entry.node,'data-state-label',reason);
        else if(entry.node.hasAttribute('data-state-label'))entry.node.removeAttribute('data-state-label');
        if (entry.value.textContent !== value)
            entry.value.textContent = value;
        const charges=String(s.charges),chargeText=s.maxCharges>1?charges:'';
        setHudAttribute(entry.node,'data-charges',charges);
        setHudAttribute(entry.node,'data-cooldown',String(Math.ceil(s.cooldownRemainingMs)));
        setHudAttribute(entry.node,'aria-label',`${title}, ${reason ? `${reason} ` : ''}${value}${s.maxCharges > 1 ? `, ${charges} of ${s.maxCharges} charges` : ''}`);
        if(entry.charges&&entry.charges.textContent!==chargeText)entry.charges.textContent=chargeText;
        if (entry.progress) {
            const progress = s.castRemainingMs > 0 ? 1 - s.castRemainingMs / Math.max(1, definition.castMs) : s.activeRemainingMs > 0 ? s.activeRemainingMs / Math.max(1, s.activeMs) : s.ready ? 1 : 1 - s.cooldownRemainingMs / Math.max(1, s.cooldownMs);
            entry.progress.style.strokeDashoffset = String(132 * (1 - clamp(progress)));
            setHudProperty(entry.node.style,'--cooldown-remaining',String(1-clamp(progress)));
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
            const pip=entry.pips[i],hidden=i>=s.maxCharges;
            if(pip.hidden!==hidden)pip.hidden=hidden;
            setHudAttribute(pip,'data-empty',String(i>=s.charges));
            // The snapshot exposes the next independent recharge; subsequent pips remain empty.
            const recharge = i < s.charges ? 1 : i === s.charges ? 1 - s.cooldownRemainingMs / Math.max(1, s.cooldownMs) : 0;
            setHudProperty(pip.style,'--pip-charge',`${clamp(recharge)*100}%`);
        }
    };
    const hud = (() => {
        if (disposed)
            return;
        const s = game.combat.snapshot, playing = game.status === 'playing';
        hidden('suit-vitals', game.status === 'complete');
        if (revision !== game.roomRevision) {
            revision = game.roomRevision;
            encounterCues.clear();
            for (const warning of warnings) warning.life = 0;
            buildReveal=0;denialLife=0;deniedPlacementLife=0;denial.hidden=true;setPlacementPreview(renderer,null);
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
        const storyStatus = conciseStoryStatus(game.storyStatus);
        text('story-status', storyStatus);
        const encounter = game.encounter, encounterRemaining = game.encounterRemaining;
        fighting = playing && (game.enemies.activeCount > 0 || game.boss.snapshot.active);
        const cue = playing ? encounterCues.update(encounter.beat ?? -1, encounter.canceledReinforcements ?? 0) : '';
        const drill = getAwakeningDrill(game);
        const lesson = !!drill || game.augmentDrillActive || game.coverLessonActive && !game.siege;
        lessonActive = playing && lesson;
        const objective = game.encounterObjective || cue || getRoomOpening(game)
            || combatObjective(game.storyRoom?.templateId, game.storyRoom?.objective ?? '');
        const critical = combatStoryWarning(game.storyRoom);
        let criticalNode = document.getElementById('objective-critical');
        if (!criticalNode) {criticalNode = document.createElement('p');criticalNode.id='objective-critical';criticalNode.setAttribute('data-hud-critical','');nodes['story-hud'].append(criticalNode);}
        criticalNode.textContent=critical;criticalNode.hidden=!critical;
        hidden('story-status', playing);
        hidden('story-presentation', true);
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
        text('reserve', `/ ${Number.isFinite(s.reserve) ? s.reserve : '∞'}${s.weaponId==='plasma'?` · HEAT ${Math.round(s.heatFraction * 100)}%`:''}`);
        if (game.elapsed < suggestionClock) {
            shownSituation = undefined;
            plateHit = undefined;
        }
        suggestionClock = game.elapsed;
        const situation = playing && preferences().masteryHints !== false
            ? getWeaponSituation(game, plateHit && plateHit.until > game.elapsed ? plateHit.id : undefined) : undefined;
        const suggestionKey = situation && `${situation.weapon}:${situation.target?.id ?? ''}`;
        if (!suggestionKey) shownSituation = undefined;
        const suggest = situation && (suggestionKey === shownSituation
            ? suggestionUntil > game.elapsed : (situationCount.get(situation.weapon) ?? 0) < 3);
        text('reload-label', s.swapRemainingMs > 0 ? 'DRAWING' : s.reloading
            ? (s.weaponId === 'plasma' ? 'VENTING' : 'RELOADING') : !s.magazine ? 'EMPTY' : '');
        width('reload-bar', s.reloading ? 1 - s.reloadRemainingMs / Math.max(1, s.reloadDurationMs) : 0);
        text('depth-label', `${(game.storyRoom?.environment ?? ACT_NAMES[Math.min(2, Math.floor(game.node.depth / 4))]).toUpperCase()} · ${String(game.node.depth + 1).padStart(2, '0')} / ${runLength(game.expedition.run.version)}`);
        text('room-name', ROOM_TEMPLATES[game.node.templateId].name);
        const condition=getShipCondition(game),state=game.conditionState;
        const conditionPhase=state?.ventLive?'Vent ':condition?.id==='conduit'?(state?.conduitLive?'Live ':'Live in '):'';
        const chip=condition?conditionChip(condition,state?.countdown,conditionPhase):'';
        if(nodes['room-condition'].dataset.chip!==chip){
            nodes['room-condition'].dataset.chip=chip;
            nodes['room-condition'].innerHTML=chip;
        }
        nodes['room-condition'].hidden=!condition;
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
            if (buildSeen && build.mutations.length > 0) buildReveal = 2;
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
                const familyBoons = build.mutations.filter(id => MUTATION_CATALOG[id].family === family);
                const names = familyBoons.map(id => MUTATION_CATALOG[id].name);
                group.title = `${family}: ${names.join(', ')}${count >= 3 ? ' · Set bonus active' : ''}`;
                group.setAttribute('aria-label', group.title);
                group.innerHTML = setChip(family,count);
                const stack = document.createElement('span');
                stack.className = 'boon-owned-stack';
                const shownEffects = new Set<string>();
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
                    const effect = boonElement(boon);
                    glyph.dataset.repeatEffect = String(shownEffects.has(effect));
                    shownEffects.add(effect);
                    glyph.innerHTML = effectChip(boon);
                    stack.append(glyph);
                }
                if (familyBoons.length > 3) {
                    const more = document.createElement('span');
                    more.className = 'boon-more';
                    more.textContent = `+${familyBoons.length - 3}`;
                    more.title = familyBoons.slice(3).map(id => `${MUTATION_CATALOG[id].name} · ${playerFacingText(MUTATION_CATALOG[id].description)}`).join(' / ');
                    stack.append(more);
                }
                group.append(stack);
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
        text('encounter-count', playing && game.node.kind !== 'boss' ? `${encounterRemaining} remaining` : '');
        roomPeak = Math.max(roomPeak, encounterRemaining);
        encounterTrack.hidden = !playing || game.node.kind === 'boss' || roomPeak === 0;
        const defeated = Math.max(0, roomPeak - encounterRemaining);
        encounterFill.style.width = `${roomPeak ? defeated / roomPeak * 100 : 0}%`;
        encounterTrack.setAttribute('aria-valuemin','0'); encounterTrack.setAttribute('aria-valuemax',String(roomPeak)); encounterTrack.setAttribute('aria-valuenow',String(defeated));
        encounterTrack.setAttribute('aria-valuetext',`${encounterRemaining} enemies remaining`);
        const abilities = getAbilities(game);
        hidden('ability-bar', !abilities?.rig || !abilities.slots);
        mastery = playing ? getMasteryPreview(game) : null;
        if (abilities?.slots)
            for (const entry of slots)
                updateAbility(entry, abilities.slots[entry.slot], abilities);
        skipDrill.hidden = !playing || !(drill && !drill.confirmation || game.augmentDrillTarget);
        const lessonTarget = drill ? game.enemies.getSnapshot(drill.id)
            : game.augmentDrillTarget ?? (game.coverLessonActive
                ? game.enemies.snapshot.enemies.find(enemy => enemy.health > 0 && enemy.type === 'spitter') : undefined);
        const interrupted = game.broodInterruption;
        const matron = interrupted && game.enemies.getSnapshot(interrupted.id);
        const weaponLesson=preferences().hints!==false?game.weaponLessonPrompt:undefined;
        const lessonDanger=game.enemies.snapshot.enemies.some(enemy=>enemy.meleePhase==='windup'||enemy.windupMs>0
            ||enemy.chargeMs>0||enemy.pod);
        const prompts = [lesson && 'lesson', matron && 'brood', (encounter.pincer || game.siege || game.escortExitOpen || cue === 'ESCORT BROKEN') && 'objective', denialLife > 0 && 'denial',
            weaponLesson && !lessonDanger && 'weapon-lesson', suggest && 'weapon', 'mastery', 'onboarding', 'objective'];
        let prompt = '';
        for (const candidate of prompts) {
            if (!candidate || !playing) continue;
            if (candidate === 'mastery' && !masteryHints.visible) continue;
            if (candidate === 'onboarding') {
                onboarding.update(game, abilities, !abilityHints.visible, preferences().hints !== false);
                if (!onboarding.visible) continue;
            }
            prompt = candidate;
            break;
        }
        if (prompt !== 'onboarding') onboarding.update(game, abilities, false, preferences().hints !== false);
        masteryHints.suppress(prompt !== 'mastery');
        denial.hidden = prompt !== 'denial';
        if (prompt === 'weapon' && situation && shownSituation !== suggestionKey) {
            shownSituation = suggestionKey;
            suggestionUntil = game.elapsed + 2.2;
            const count = (situationCount.get(situation.weapon) ?? 0) + 1;
            situationCount.set(situation.weapon, count);
            try { storage?.setItem(`containment.weapon-lesson.${situation.weapon}`, String(count)); } catch {}
        }
        const encounterTarget = game.enemies.snapshot.enemies.find(enemy => enemy.health > 0
            && (enemy.champion === 'warden' && !!enemy.stunRemainingMs
                || enemy.champion === 'matron' && !!enemy.broodRemainingMs || enemy.pod));
        const target = prompt === 'lesson' ? lessonTarget : prompt === 'brood' ? matron
            : prompt === 'weapon-lesson' ? weaponLesson?.target : prompt === 'weapon' ? situation?.target : prompt === 'objective' && !game.siege && !encounter.pincer ? encounterTarget : undefined;
        const anchor = target && projectWorld(renderer, target.x, target.y, projected, prompt === 'brood' ? 2.65 : 1.4);
        let anchored = anchor && (projected.visible || prompt === 'brood'
            && projected.x > 0 && projected.x < innerWidth && projected.y > 0 && projected.y < innerHeight + 60);
        if (prompt === 'lesson' || prompt === 'weapon-lesson') {
            const key = prompt === 'lesson'
                ? `${game.roomRevision}:${drill ? 'dodge' : game.coverLessonActive ? 'cover' : 'augment'}`
                : `${game.roomRevision}:${weaponLesson?.text}`;
            if (anchored && !shownLessonAnchors.has(key)) {
                shownLessonAnchors.add(key);
                lessonAnchorKey = key;
                lessonAnchorUntil = game.elapsed + 2.2;
            }
            anchored = anchored && key === lessonAnchorKey && game.elapsed < lessonAnchorUntil;
        } else {
            lessonAnchorKey = '';
        }
        const objectiveNode = nodes['room-objective'];
        const coaching = prompt === 'lesson' || prompt === 'weapon-lesson' || prompt === 'weapon';
        const plate = weaponLesson?.target;
        objectiveNode.classList.toggle('plate-key-pulse', prompt==='weapon-lesson' && !!plate && plate.armor>0 && plate.armor<plate.maxArmor*.9);
        text('room-objective', prompt === 'weapon-lesson' ? weaponLesson?.text ?? '' : prompt === 'weapon' ? situation?.text ?? '' : prompt==='lesson' && game.coverLessonActive && !game.siege ? 'Break the Spitter’s line of sight' : ['lesson','brood','objective'].includes(prompt) ? objective : '');
        objectiveNode.classList.toggle('anchored-objective', !!anchored || coaching);
        objectiveNode.classList.toggle('coaching-objective', coaching);
        if (coaching) {
            const dockTop = el('action-bar').getBoundingClientRect().top;
            const width = objectiveNode.offsetWidth;
            const height = objectiveNode.offsetHeight;
            const marine = renderer.playerScreenBounds(game.player.radius);
            let side = '';
            let left = (innerWidth - width) / 2;
            let top = dockTop - height - 12;
            const hasTargetBounds = target && projectActorBounds(renderer, target.id, target.x, target.y, target.radius, actorBounds);
            const clears = (x: number, y: number, body: typeof bounds) =>
                x + width + 8 <= body.left || x >= body.right + 8 || y + height + 8 <= body.top || y >= body.bottom + 8;
            if (anchored && hasTargetBounds) {
                const right = actorBounds.left + actorBounds.right >= marine.left + marine.right;
                const x = right ? actorBounds.right + 24 : actorBounds.left - width - 24;
                const y = (actorBounds.top + actorBounds.bottom - height) / 2;
                if (clears(x, y, marine) && x >= 16 && x + width <= innerWidth - 16 && y >= 24 && y + height <= dockTop - 12) {
                    side = right ? 'right' : 'left';
                    left = x;
                    top = y;
                }
            }
            if (!side) {
                const dock = el('action-bar').getBoundingClientRect();
                const clearSlot = [left, dock.left, dock.right - width].find(x => x >= 16 && x + width <= innerWidth - 16
                    && clears(x, top, marine) && (!hasTargetBounds || clears(x, top, actorBounds)));
                if (clearSlot !== undefined) left = clearSlot;
                objectiveNode.classList.toggle('coaching-obstructed', clearSlot === undefined);
            } else objectiveNode.classList.remove('coaching-obstructed');
            objectiveNode.dataset.leader = side;
            objectiveNode.style.left = `${left}px`;
            objectiveNode.style.top = `${top}px`;
        } else {
            objectiveNode.classList.remove('coaching-obstructed');
        }
        if (!coaching && anchored) {
            objectiveNode.style.left = `${Math.max(155, Math.min(innerWidth - 155, projected.x))}px`;
            objectiveNode.style.top = `${Math.max(32, Math.min(innerHeight - getHudInsets().bottom - 12, projected.y - 20))}px`;
        }
        const pref = preferences();
        combatText.setEnabled(pref.combatText !== false);
        combatText.setReduced(pref.combatTextDensity === 'reduced');
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
            setHudInsets(renderer, getHudInsets());
            protectPanels();
            updateDockYield(true);
            const flank = encounter.pincer;
            const flankLocations = flank?.state === 'staging'
                ? game.geometry.breaches.filter(breach=>flank.flankers.some(enemy=>enemy.breachId===breach.id))
                    .map(breach=>({x:breach.x,y:breach.y,life:1,kind:'flank' as const,beat:encounter.beat??-1}))
                : [];
            threats.update(game.enemies.snapshot.enemies, game.player, bounds, game.bullets, q, [...encounterCues.locations,...flankLocations], encounterRemaining - encounter.remaining + (encounter.beatRemaining ?? encounter.remaining) <= 3, game.clipHostileLane);
        }
        siegeLabel.update(renderer, playing ? game.siege : null, game.player, bounds, playing ? game.relayCoverPreview : undefined);
        setHudCoachedTarget(renderer, playing ? onboarding.markedEnemyId ?? (prompt === 'weapon' ? situation?.target?.id ?? null : null) : null);
        targetMarkers.update(game, renderer, encounterCues.locations, onboarding.markedEnemyId);
        if (!playing && wasPlaying) {
            updateDockYield(false);
            for (const warning of warnings) warning.life = 0;
            clearHudOcclusion(); setHudInsets(renderer, getHudInsets());
            combatText.clear();
            threats.clear();
        }
        wasPlaying = playing;
    }) as HudController;
    hud.effect = (event: HudEffect) => {
        if (disposed || game.status !== 'playing')
            return;
        combatText.setEnabled(preferences().combatText !== false);
        combatText.setReduced(preferences().combatTextDensity === 'reduced');
        // Identified attacks are read from native snapshots, so death/cancel and
        // Overclock cannot leave a stale timer. Unidentified spawn warnings retain their receipt.
        if (event.type === 'enemy-warning' && event.id === undefined) {
            let warning = warnings.find(entry => entry.life <= 0);
            if (!warning) warning = warnings.reduce((a,b) => a.life < b.life ? a : b);
            const area = event as HudEffect & {radius?: number; targetX?: number; targetY?: number};
            warning.x = event.x; warning.y = event.y;
            warning.targetX = area.targetX ?? event.x; warning.targetY = area.targetY ?? event.y;
            warning.radius = area.radius ?? 32; warning.life = Math.max(.05, (event.durationMs ?? 650) / 1000);
        }
        if (event.type === 'hit' && event.contact === 'armor' && event.targetId !== undefined
            && 'weapon' in event && event.weapon === 'rifle') {
            plateHit = {id: event.targetId, until: game.elapsed + 3};
        }
        combatText.effect({...event, damageElement: getCombatDamageElement(game, event)});
        threats.effect(event, game.player);
        encounterCues.effect(event, game.encounter.beat ?? -1);
        onboarding.effect(event);
        if(event.selfBlast)toasts.show(`Your own blast · ${Math.round(event.selfBlast.radius-event.selfBlast.distance)} inside radius`, 'warning', 'warning', 'self-blast');
        if (event.rocketUnarmed) showDenial('Inside arming distance');
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
            masteryHints.effect(event.ability);
            const entry = slots.find(s => s.slot === event.ability!.slot);
            if (!entry)
                return;
            if (event.ability.phase === 'denied') {
                entry.denied = .32;
                entry.flash = 0;
                entry.node.dataset.flash = 'false';
                entry.node.dataset.state = 'denied';
                const reason = event.ability.denial as string | undefined;
                entry.denial = reason==='blocked' ? entry.slot==='overdrive'&&getAbilities(game)?.overdrive.roomLimited ? 'Next room' : entry.slot==='power' ? 'Need clear ground' : 'Unavailable' : ({cooldown:'Recharging',casting:'Casting','no-charge':'No charge','no-rig':'Choose a rig','no-target':'No target'} as Record<string,string>)[reason??'no-charge'] ?? 'No target';
                let cursorReason=entry.denial;
                let attempted=pointerKnown?placementPointer(renderer,game,aimPointerX,aimPointerY):null;
                if(Number.isFinite(event.ability.targetX)&&Number.isFinite(event.ability.targetY)) {deniedAim.x=event.ability.targetX!;deniedAim.y=event.ability.targetY!;attempted=deniedAim;}
                if(reason==='blocked'&&entry.slot==='power'&&readPlacementPreview(game,attempted,deniedPlacement)) {
                    deniedPlacement.valid=false;
                    deniedPlacement.intent='denied';
                    for(let i=0;i<deniedPlacement.pointCount;i++)deniedPlacement.points[i].valid=false;
                    cursorReason=deniedPlacement.reason??'Need clear ground';
                    deniedPlacement.reason=cursorReason;deniedPlacementLife=.95;
                    setPlacementPreview(renderer,deniedPlacement);
                }
                entry.denial = 'Unavailable';
                showDenial(cursorReason);
                entry.value.textContent = entry.denial;
            }
            if (event.ability.phase === 'ready' || event.ability.phase === 'overdrive-ready') {
                entry.flash = entry.slot === 'overdrive' ? 0 : .22;
                entry.node.dataset.flash = 'true';
            }
            if (event.ability.phase === 'overdrive-ready')
                toasts.show('Overdrive ready', event.ability.ability, 'reward', 'overdrive');
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
        if (game.status === 'playing') encounterCues.tick(elapsed);
        for (const warning of warnings) warning.life = Math.max(0, warning.life - elapsed);
        buildReveal=Math.max(0,buildReveal-elapsed);
        denialLife=Math.max(0,denialLife-elapsed);deniedPlacementLife=Math.max(0,deniedPlacementLife-elapsed);
        if(!denialLife&&!denial.hidden){denial.hidden=true;setPlacementPreview(renderer,null);}
        refreshInspection();
        streakWindow = Math.max(0, streakWindow - elapsed); streakCooldown = Math.max(0, streakCooldown - elapsed);
        for (const entry of slots) {
            entry.denied = Math.max(0, entry.denied - elapsed);
            entry.flash = Math.max(0, entry.flash - elapsed);
            if (!entry.flash && entry.node.dataset.flash === 'true')
                entry.node.dataset.flash = 'false';
        }
        if (game.status !== 'playing') {
            denial.hidden=true;denialLife=0;deniedPlacementLife=0;powerAim=false;setPlacementPreview(renderer,null);
            combatText.clear();
            threats.clear();
            abilityHints.tick(bounds, false);
            return;
        }
        if(lessonActive && !powerAim) setPlacementPreview(renderer,null);
        else if(deniedPlacementLife>0) setPlacementPreview(renderer,deniedPlacement);
        else {
            const snapshot=getAbilities(game),power=snapshot?.slots?.power;
            const casting=snapshot?.slots&&(snapshot.slots.dash.castRemainingMs>0||snapshot.slots.tactical.castRemainingMs>0||snapshot.slots.power.castRemainingMs>0||snapshot.slots.overdrive.castRemainingMs>0);
            const aiming=(pointerActive||powerAim)&&power&&power.charges>0&&!casting&&!snapshot?.dashing;
            placement.intent=powerAim?'aiming':'idle';
            setPlacementPreview(renderer,aiming&&readPlacementPreview(game,pointerKnown?placementPointer(renderer,game,aimPointerX,aimPointerY):null,placement)?placement:null);
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
        masteryHints.tick(renderer, game.status==='playing' ? mastery : null, !lessonActive && preferences().masteryHints !== false, elapsed);
        const marked = onboarding.markedEnemyId;
        const markedEnemy = marked === null ? undefined : game.enemies.getSnapshot(marked);
        const anchor = markedEnemy && projectWorld(renderer, markedEnemy.x, markedEnemy.y, projected, 1.5);
        onboarding.tick(elapsed, bounds, onboardingObstacles, anchor?.visible ? anchor : undefined);
        abilityHints.tick(bounds, true);
        const committedBodies = [];
        for (const enemy of game.enemies.snapshot.enemies) {
            if (enemy.health <= 0 || !(enemy.pendingAttack || enemy.windupMs > 0 || enemy.chargeMs > 0 ||
                enemy.meleePhase === 'windup' || enemy.meleePhase === 'strike')) continue;
            const body = {id: enemy.id, left: 0, right: 0, top: 0, bottom: 0};
            if (projectActorBounds(renderer, enemy.id, enemy.x, enemy.y, enemy.radius, body)) committedBodies.push(body);
        }
        combatText.tick(elapsed, bounds, committedBodies);
        threats.tick(elapsed);
        toasts.tick(elapsed);
    };
    hud.dispose = () => {
        if (disposed)
            return;
        disposed = true;
        document.removeEventListener('keydown',onKey);document.removeEventListener('keyup',onKey);document.removeEventListener('pointermove',onPointer);window.removeEventListener('blur',onBlur);window.removeEventListener('resize',onBlur);
        denial.remove();setPlacementPreview(renderer,null);
        combatText.dispose();
        threats.dispose();
        siegeLabel.dispose();
        targetMarkers.dispose();
        toasts.dispose();
        radar.dispose();
        panelResize?.disconnect();
        clearHudOcclusion(); setHudInsets(renderer, getHudInsets());
        masteryHints.dispose(); skipDrill.remove(); onboarding.dispose(); abilityHints.dispose(); encounterTrack.remove(); activeDial.remove(); dashActiveDial.remove();
    };
    return hud;
}
