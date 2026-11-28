import { WEAPONS as weaponCatalog } from '../../../src/game/combat/catalog';
import {combatPresentationHoldSeconds} from '../../../src/game/observation/combatPresentationClock';
import {PresentationHold} from '../../../src/render/motion/PresentationHold';
import {ENEMIES} from '../../../src/game/enemies/catalog';
import {HudCombatFraming} from '../../../src/render/camera/HudCombatFraming';
import {RoomCombatFraming} from '../../../src/render/camera/RoomCombatFraming';
import {combatPointVisible} from '../../../src/game/observation/combatVisibility';
import * as economy from '../../../src/game/roguelike/economy';
import * as T from 'three';
import { DepthGame, type GameEffect, type GameInput } from '../../../src/DepthGame';
import { GameFeel } from '../../../src/ui/feel';
import { enemyShotRadius } from '../../../src/game/combat/enemyContact';
import { createBreacherPresentation } from '../../../src/render/abilities/breacher';
import { createCryoPresentation } from '../../../src/render/abilities/cryo';
import { createPyroPresentation } from '../../../src/render/abilities/pyro';
import { createArcPresentation } from '../../../src/render/abilities/arc';
import { createSystemPresentation } from '../../../src/render/abilities/system';
import { CameraRig } from '../../../src/render/camera/CameraRig';
import {COMBAT_VIEW_HEIGHT,combatFocusTarget} from '../../../src/render/camera/CombatFraming';
import { roomFocus } from '../../../src/render/roomFraming';
import { canOccupyExpedition, canTraverseExpedition, hasClearExpeditionShot } from '../../../src/game/world/expeditionGeometry';
import { expeditionRewardOffers } from '../../../src/game/roguelike/expedition';
import { generateRun } from '../../../src/game/roguelike/run';
import type { RigId } from '../../../src/game/abilities/contract';
import {observeAbilityAims} from './ability-aim';
import { BOT_POLICY_VERSION, COVERED_RELAY_HEALTH_FRACTION, chooseBoon, chooseRoute, chooseServicePurchase, chooseDetour, chooseRoomOrder, createHumanPolicy, distance } from './policy.mjs';
import {botPursuitLookAhead,botWaypoint, BOT_NAVIGATION_VERSION} from './bot-navigation';
import {applyNativeImmediateKey, recordNativeObservedEvent, nativeWarningHazards, nativeDiagnosticBurst} from './sim-native-emulation';
export const SIM_ACTOR_RADII=Object.fromEntries(Object.entries(ENEMIES).map(([id,enemy])=>[id,id==='queen'?92:enemy.radius]));
const TICK = 1000 / 60;
const {SERVICE_IDS,detourOffers} = economy;
const augmentUpgrades = Reflect.get(economy, 'availableAugmentUpgrades') as typeof economy.availableAugmentUpgrades | undefined;

const WIDTH = 1920, HEIGHT = 1080, VIEW = COMBAT_VIEW_HEIGHT;
const WEAPONS = ['pistol', 'rifle', 'shotgun', 'plasma', 'rocket'] as const;
/** CPU-only observer using the same framing, perspective projection and follow spring. */
export class CameraObserver {
    readonly camera = new T.PerspectiveCamera(28, WIDTH / HEIGHT, .1, 160);
    readonly rig = new CameraRig();
    readonly hud = new HudCombatFraming();
    readonly roomFraming = new RoomCombatFraming();
    private revision = -1;
    private presentationHold = new PresentationHold();
    private raycaster = new T.Raycaster();
    private point = new T.Vector3();
    private target = new T.Vector3();
    private desired = new T.Vector3();
    private framed = {x:0,z:0};
    constructor(private readonly metrics:Record<string,{height:number}> = {}) {
        // Calibrated shipping HUD reservations at the runner's1920x1080 desktop viewport.
        this.hud.resize(WIDTH,HEIGHT);this.hud.setInsets({top:182,right:292,bottom:120,left:0});
        // Native title establishes this focus; room loads retain spring/impulse state.
        this.rig.reset(22,14);
    }
    observeEffect(effect:GameEffect) {const seconds=combatPresentationHoldSeconds(effect);if(seconds)this.presentationHold.request(seconds,1,false);}
    private get queenHeight(){return this.metrics.queen?.height??4.5;}
    update(game: DepthGame, dt: number) {
        const bounds = game.geometry.bounds;
        if (this.revision !== game.roomRevision) {
            this.revision = game.roomRevision;
            this.presentationHold.reset();
        }
        const b = game.boss.snapshot, bossActive = b.active && !b.defeated, zoom = bossActive ? .78 : 1;
        const p = game.player;
        combatFocusTarget(p.x/32,p.y/32,p.angle,b.x/32,b.y/32,bossActive,false,this.desired);
        this.hud.selectContacts(p.x/32,p.y/32,p.angle,game.enemies.snapshot.enemies,32,id=>{const e=game.enemies.getSnapshot(id);return e?(this.metrics[e.type]?.height??3.2)*(e.elite?1.12:1):3.2;});
        if(bossActive)this.hud.selectPrimaryContact(-1,b.x/32,b.y/32,3.4,this.queenHeight);
        this.hud.biasTarget(p.x/32,p.y/32,p.angle,false,bossActive,this.desired);
        const f = roomFocus(this.desired.x,this.desired.z,bounds.width/32,bounds.height/32,VIEW*WIDTH/HEIGHT/zoom,VIEW/zoom,game.node.templateId,this.framed);
        const rawDelta = game.status === 'paused' || game.status === 'reward' || game.status === 'route' ? 0 : Math.min(dt,.05);
        const delta = this.presentationHold.advance(rawDelta,1,false);
        if(!this.hud.hasEngagement||bossActive)this.desired.set(f.x,0,f.z);
        const bait = game.recoveryGrille ?? game.manualExchange?.bait;
        if (bait) {
            const dx = bait.x/32-this.desired.x, dz = bait.y/32-this.desired.z;
            const weight = Math.min(.55,4/Math.max(1,Math.hypot(dx,dz)));
            this.desired.x += dx*weight;
            this.desired.z += dz*weight;
        }
        this.rig.update(delta, this.desired.x, this.desired.z, 1, false);
        this.rig.apply(this.camera, zoom, VIEW, 1);
        this.hud.center(this.camera,this.rig.focus,this.point,this.target);
        this.roomFraming.apply(this.camera,this.rig.focus,p.x/32,p.y/32,p.radius/32,2.05,bounds.width/32,bounds.height/32,this.hud.viewport,HEIGHT,delta,false,game.geometry.boundary,this.hud,2.05,p.angle);
        this.hud.refreshFit(this.camera,this.point);
        return delta;
    }
    project(x: number, y: number, height = .65) { const p = this.point.set(x / 32, height, y / 32).project(this.camera); return { x: (p.x + 1) * WIDTH / 2, y: (1 - p.y) * HEIGHT / 2 }; }
    pointer(screen: {
        x: number;
        y: number;
    }, game: DepthGame, metrics: Record<string, {
        height: number;
    }>) {
        this.raycaster.setFromCamera(new T.Vector2(screen.x / WIDTH * 2 - 1, 1 - screen.y / HEIGHT * 2), this.camera);
        let nearest = Infinity, selected: {
            x: number;
            y: number;
        } | null = null;
        for (const t of game.targets()) {
            if (!hasClearExpeditionShot(game.geometry, game.player, t))
                continue;
            const enemy = t.id > 0 ? game.enemies.getSnapshot(t.id) : null;
            if (!enemy && t.id !== -1)
                continue;
            const family = enemy?.type ?? 'queen', radius = (enemy ? enemyShotRadius(enemy.type, enemy.elite) : t.radius) / 32;
            const height = (metrics[family]?.height ?? 1) * (enemy?.elite ? 1.12 : 1), center = new T.Vector3(t.x / 32, height * .5, t.y / 32), scale = new T.Vector3(radius, Math.max(.15, height * .48), radius);
            const ray = this.raycaster.ray.clone();
            ray.origin.sub(center).divide(scale);
            ray.direction.divide(scale).normalize();
            const contact = ray.intersectSphere(new T.Sphere(new T.Vector3(), 1), new T.Vector3());
            if (!contact)
                continue;
            const d = contact.multiply(scale).add(center).distanceToSquared(this.raycaster.ray.origin);
            if (d < nearest) {
                nearest = d;
                selected = { x: t.x, y: t.y };
            }
        }
        if (selected)
            return selected;
        const result = new T.Vector3();
        return this.raycaster.ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), 0), result) ? { x: result.x * 32, y: result.z * 32 } : null;
    }
    visible(x: number, y: number) {
        const p = this.point.set(x / 32, .6, y / 32).project(this.camera);
        return combatPointVisible(p,this.hud.viewport);
    }
}
export type SimOptions = {
    rig: RigId;
    seed: number;
    difficulty?: "story" | "standard" | "veteran";
    profile?: string;
    roomOrder?: 'direct'|'salvage'|'policy';
    rooms?: number;
    assisted?: boolean;
    legacy?: boolean;
    maxRoomSeconds?: number;
    trace?: boolean;
    readExchange?: boolean;
    recoveryGrilles?: ConstructorParameters<typeof DepthGame>[2];
    metrics?: Record<string, {
        height: number;
    }>;
};
export type SimReport = ReturnType<typeof runSimulation>;
/** Fight a complete earned campaign with the browser player's pure decision helpers. */
export function runSimulation(options: SimOptions) {
    const started = performance.now(), feel = new GameFeel(), camera = new CameraObserver(options.metrics??{});
    const human = createHumanPolicy(options.seed, options.profile ?? 'competent', options.readExchange);
    let game: DepthGame;
    const events: Array<GameEffect & {
        at: number;
    }> = [];
    const kit = new Proxy({ fx: { spawn: () => ({ seed: 0, live: true }) }, time: 0, low: false, reducedMotion: false, camera(weight = .12, angle?: number) { camera.rig.addTrauma(weight); if (weight > .2)
            camera.rig.punch(Math.min(.035, weight * .06), 220); if (angle !== undefined)
            camera.rig.kick(angle, weight * .1); }, anticipate(ms: number, amount = .012) { camera.rig.punch(amount, ms); } }, { get: (target, key) => key in target ? Reflect.get(target, key) : () => { } }) as any;
    const presentations = { breacher: createBreacherPresentation(kit), cryo: createCryoPresentation(kit), pyro: createPyroPresentation(kit), arc: createArcPresentation(kit) };
    const systemPresentation = createSystemPresentation(kit);
    const context = () => ({ dashing: game.abilities.dashing, critical: game.combat.snapshot.health <= 25, remaining: game.encounterRemaining });
    // Observers only: these counters never enter policy snapshots or game decisions.
    type FamilyPressure = {windups:number;strikes:number;contacts:number;hits:number;meleeHits:number;damage:number};
    const pressure = new Map<string, {hitsTaken:number;firstHitElapsed:number|null;hitTimes:number[];byFamily:Record<string,FamilyPressure>}>();
    let observedDamage = 0, lastFullHealthElapsed: number | null = null;
    const roomPressure = () => {
        let row = pressure.get(game.node.id);
        if (!row) {row = {hitsTaken:0,firstHitElapsed:null,hitTimes:[],byFamily:{}};pressure.set(game.node.id,row);}
        return row;
    };
    const familyPressure = (family:string) => {
        const row = roomPressure();
        return row.byFamily[family] ??= {windups:0,strikes:0,contacts:0,hits:0,meleeHits:0,damage:0};
    };
    const weaponUsage = Object.fromEntries(['pistol', 'rifle', 'shotgun', 'plasma', 'rocket'].map(id => [id, {
        shots: 0, equippedMs: 0, damage: 0, kills: 0, families: {} as Record<string, {damage: number; kills: number}>,
    }]));
    const weaponHits = {total:0, exposed:0};
    const featuredGuardians = new Set<number>();
    const onEffect = (e: GameEffect) => {
        if(e.type==='sync-corpse') return;
        if(room&&e.type==='corpse'&&e.id!==undefined&&featuredGuardians.has(e.id)){
            room.featuredKill={elapsed:game.elapsed,suit:game.stats.damageTaken};
        }
        if(room?.id==='transmission-chamber'&&e.ability?.transformation){
            room.transformedHits=(room.transformedHits??0)+1;
        }
        if(room&&e.type==='recovery-grille-closed'){
            room.grilleClosures++;
            room.grilleEscortsCancelled+=e.grilleEscorts??0;
        }
        if(room&&room.depth>=2&&room.depth<=3&&e.type==='enemy-warning'){
            const opening=room.openingPressure??={fanWarnings:0,followUpWarnings:0};
            if(e.family===undefined&&e.radius===128)opening.fanWarnings++;
            if(e.family===undefined&&e.durationMs===80&&e.radius===32)opening.followUpWarnings++;
        }
        if(e.type==='hit'&&e.source==='weapon'&&(e.damage??0)>0){
            weaponHits.total++;
            if(e.exposedHit)weaponHits.exposed++;
        }
        if (e.type === 'shot' && e.weapon) weaponUsage[e.weapon].shots++;
        camera.observeEffect(e);
        recordNativeObservedEvent(events, e, game.elapsed);
        if (e.type === 'ability' && e.ability) {
            presentations[e.ability.rig].event(e.ability, e.x, e.y);
            systemPresentation.event(e.ability, e.x, e.y);
        }
        const before = feel.snapshot;
        feel.effect(e, context());
        const after = feel.snapshot;
        if (after.slowMotionMs > before.slowMotionMs) {
            camera.rig.addTrauma(.08);
            camera.rig.punch(.025, 420);
        }
        else if (after.hitStopMs > before.hitStopMs)
            camera.rig.punch(.008, 90);
        if (e.type === 'hurt') {
            const stats = game.stats, amount = stats.damageTaken - observedDamage;
            observedDamage = stats.damageTaken;
            if (amount > 0) {
                const receipt = stats.lastDamage, row = roomPressure();
                const family = familyPressure(receipt?.enemyFamily ?? receipt?.source ?? 'unknown');
                row.hitsTaken++;row.firstHitElapsed ??= game.elapsed;row.hitTimes.push(game.elapsed);family.hits++;family.damage += amount;
                if (receipt?.source === 'enemy-contact') family.meleeHits++;
            }
            camera.rig.addTrauma(.34);
            camera.rig.punch(.015, 180);
        }
        if (e.type === 'explosion' || e.type === 'boon' && (e.boon === 'blast' || e.boon === 'overload' && e.radius !== undefined)) {
            camera.rig.addTrauma(.32);
            camera.rig.punch(.035, 240);
        }
        if (e.type === 'shot')
            camera.rig.kick(e.angle ?? 0, e.weapon === 'shotgun' ? .08 : e.weapon === 'rocket' ? .12 : .025);
    };
    game = new DepthGame(onEffect, null, options.recoveryGrilles);
    game.observeWeaponDamage = (weapon, family, damage, lethal) => {
        const usage = weaponUsage[weapon];
        const target = usage.families[family] ??= {damage: 0, kills: 0};
        usage.damage += damage;
        target.damage += damage;
        usage.kills += Number(lethal);
        target.kills += Number(lethal);
    };
    game.newRun(options.seed, { rigSelect: true, difficulty: options.difficulty, shipConditions:!options.conditionsOff });
    game.chooseRig(options.rig);
    if (options.legacy)
        game.newRun(options.seed, { version: 2, rig: options.rig, difficulty: options.difficulty });
    if (options.assisted) {
        const hurt = game.hurt.bind(game);
        game.hurt = (n, ...context) => hurt(n * .15, ...context);
    }
    const report = { mode: 'sim-human-v1', difficulty: options.difficulty ?? 'standard', policyVersion: BOT_POLICY_VERSION, navigationVersion: BOT_NAVIGATION_VERSION, rig: options.rig, seed: options.seed, profile:human.profile, humanParameters:human.config, assisted: !!options.assisted, legacy: !!options.legacy,
        policy: 'Shared seeded human policy; 100ms observations, rate-limited inputs, 60Hz GameFeel, real DepthGame actions; analytic camera observer.',
        limitations: ['No GPU, audio or DOM. Uses shared camera follow/framing/ability-event hooks, exact actor metrics and held-screen ray/torso selection; resource preparation and RAF synchronization are omitted. Matched browser validation remains required before using campaign outcomes as native-policy predictions.'],
        weaponUsage, weaponHits, rooms: [] as any[], outcome: 'running', finalReason: null as string | null, deathRoom: null as number | null, stats: null as any, final: null as any, wallSeconds: 0, trace: options.trace ? [] as any[] : undefined };
    let room: any, input: GameInput = { x: 0, y: 0, fire: false, angle: null, autoAim: false }, decisions = 0, hardest = -1;
    let stopEnemyObserver: (()=>void)|undefined;
    const observeRoomAttacks = () => {
        stopEnemyObserver?.();
        stopEnemyObserver = game.enemies.subscribe(event => {
            if (event.type === 'melee-warning') familyPressure(event.enemyType).windups++;
            else if (event.type === 'melee-strike') familyPressure(event.enemyType).strikes++;
            else if (event.type === 'contact-attack') familyPressure(event.enemyType).contacts++;
        });
    };
    let screen: {
        x: number;
        y: number;
    } | null = null;
    const recentDecisions: Array<Record<string, unknown>> = [];
    let progressSignature = '', lastProgressElapsed = 0;
    let committedToCover=false;
    function snapshot() {
        const clear = (x: number, y: number, from: {x: number; y: number} = game.player) => canTraverseExpedition(game.geometry, from, { x, y }, weaponCatalog[game.combat.snapshot.weaponId].projectileRadius);
        const enemies: any[] = game.enemies.snapshot.enemies.filter(e => e.health > 0).map(e => ({ ...e, reserveLeader:!!game.encounter.reserve&&e.priority,vulnerable:!game.isShutterProtected(e.id), clear: clear(e.x, e.y), plasmaClear:canTraverseExpedition(game.geometry,game.player,e,weaponCatalog.plasma.projectileRadius), visible: camera.visible(e.x, e.y), screen:camera.project(e.x,e.y) }));
        for (const t of game.targets().filter(t => t.id < 0 && t.health > 0))
            enemies.push({ ...t, type: 'queen', clear: clear(t.x, t.y), visible: camera.visible(t.x, t.y), screen:camera.project(t.x,t.y), vulnerable: t.id !== -1 || game.boss.snapshot.vulnerable });
        const nearest = [...enemies].sort((a, b) => distance(a, game.player) - distance(b, game.player))[0];
        const objective=game.siege;
    const suit=game.combat.snapshot;
    const suitFraction=(suit.health+suit.armor)/(suit.maxHealth+suit.maxArmor);
    const dashReady=game.abilities.snapshot.slots?.dash?.ready;
    const takeCover=committedToCover||suitFraction<COVERED_RELAY_HEALTH_FRACTION ||
      (!dashReady&&objective?.nearLaneWindup) ||
      (!!objective?.nearMeleePressure&&(suitFraction<.9||!dashReady));
    committedToCover=objective?.choosing===true&&!!takeCover;
    const bank=takeCover?objective?.farBank:objective?.nearBank;
    const siege=bank?{...objective!,...bank,coveredIntent:!!takeCover}:objective;
    const gate=game.floorControls.filter(p=>p.kind==='gate'&&Number.isFinite(p.threats)).sort((a,b)=>b.threats-a.threats)[0];
    const shutterBait=game.shutterBait;
    const goal=gate??shutterBait??(siege&&siege.remainingMs>0?siege:nearest);
        const waypoint = goal ? botWaypoint(game, goal) ?? goal : null;
        for (const enemy of enemies) Object.assign(enemy, { burning: game.boonStatuses(enemy.id).burning });
        const seeking = waypoint && !enemies.some(e => e.visible && e.clear);
        const pursuitRecovery=!!seeking&&game.node.templateId==='overload-floor'&&game.elapsed-lastProgressElapsed>30;
        const lookAhead = seeking
            ? botPursuitLookAhead(game,waypoint,90,pursuitRecovery||!!siege?.choosing&&!enemies.length&&!game.encounterRemaining) : 90;
        const candidates = [];
        for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
            const len = Math.hypot(dx, dy) || 1, x = game.player.x + dx / len * lookAhead, y = game.player.y + dy / len * lookAhead;
            let legal = true;
            for (let i = 1; i <= 6; i++)
                if (!canOccupyExpedition(game.geometry, { x: game.player.x + (x - game.player.x) * i / 6, y: game.player.y + (y - game.player.y) * i / 6 }, game.player.radius))
                    legal = false;
            const blockedByFriendlyWall=legal&&game.abilities.blocksMovement(game.player,{x,y},game.player.radius);
            candidates.push({ x, y, dx, dy, legal:legal&&!blockedByFriendlyWall, blockedByFriendlyWall, waypoint, rangedSightlines:enemies.filter(e=>e.type==='spitter'&&e.visible&&clear(e.x,e.y,{x,y})).map(e=>e.id), clear: nearest ? clear(nearest.x, nearest.y, { x, y }) : false });
        }
        const exchange = game.manualExchange;
        const mark = (p: {x:number;y:number}) => {
            const screen = camera.project(p.x,p.y,.08);
            return camera.visible(p.x,p.y) ? {...p,screen,waypoint:canTraverseExpedition(game.geometry,game.player,p,game.player.radius)?p:botWaypoint(game,p)} : undefined;
        };
        const landing = exchange && mark(exchange.landing), endpoint = exchange && mark(exchange.target);
        const drawnExchange = exchange && {bait:mark(exchange.bait),landing,lane:landing&&endpoint?{from:landing,to:endpoint}:undefined};
        const telegraph = game.boss.snapshot.pendingTelegraph;
        const grille = game.recoveryGrille;
        const returnPoint=grille?.returnPosition??(grille?.returnRange===undefined&&!grille?.returnAisleSide?grille:{x:grille.x+Math.cos(grille.angle)*195,y:grille.y+Math.sin(grille.angle)*195});
        return { storyHoldGrace:game.storyHoldGrace, pursuitRecovery, recoveryGrille:grille&&camera.visible(grille.x,grille.y)?{...grille,waypoint:options.readExchange&&returnPoint&&(grille.returnPosition||grille.returnRange!==undefined||grille.returnArcCosine!==undefined||grille.returnAisleSide)?(botWaypoint(game,returnPoint)??returnPoint):undefined}:undefined, drawnExchange, build:game.expedition.build, elapsed:game.elapsed, drill:game.awakeningDrill, difficulty:game.difficulty, nodeId:game.node.id, node:game.node, resources:game.combat.getRunResources(), reloadingWeapons: Object.keys(game.combat.getRunResources().ammo).filter(id => game.combat.isWeaponReloading(id as import('../../../src/game/combat/types').WeaponId)), rig: options.rig, plateLessonTarget:game.weaponLessonPrompt?.target?.id, gate,shutterBait,siege, player: { ...game.player, screen:camera.project(game.player.x,game.player.y) }, weaponRange:weaponCatalog[game.combat.snapshot.weaponId].projectileSpeed*2, combat: { ...game.combat.snapshot, weapon: game.combat.snapshot.weaponId }, enemies, candidates,
            abilityAims: observeAbilityAims(game,enemies,point=>{
                const projected=camera.project(point.x,point.y,0);
                return camera.pointer({x:Math.max(4,Math.min(1916,projected.x)),y:Math.max(4,Math.min(1000,projected.y))},game,options.metrics??{});
            }), abilities: game.abilities.snapshot, conditionObservation:game.conditionObservation??null, hazards: [...(telegraph ? [{ x: telegraph.targetX, y: telegraph.targetY, radius: telegraph.radius, kind:'warning', visible:camera.visible(telegraph.targetX,telegraph.targetY) }] : []),
                ...game.pools.map(p=>({id:`pool:${p.id}`,x:p.x,y:p.y,radius:p.radius,kind:'pool',visible:camera.visible(p.x,p.y),warningRemainingMs:Math.max(0,p.warning)*1000})),
                ...game.bullets.filter(b => b.kind === 'hazard' && !b.preview).map(b => ({ id:`shot:${b.sourceX}:${b.sourceY}:${b.request.angle}`,x:b.x,y:b.y,radius:35,collisionRadius:b.request.radius,kind:'projectile',visible:camera.visible(b.x,b.y),vx:Math.cos(b.request.angle)*b.request.speed*game.abilities.hostileTimeScale,vy:Math.sin(b.request.angle)*b.request.speed*game.abilities.hostileTimeScale })),
                ...nativeWarningHazards(events.filter(e=>e.id===undefined||enemies.some(enemy=>enemy.id===e.id&&Math.hypot(enemy.x-e.x,enemy.y-e.y)<2)),game.elapsed,game.enemies.snapshot.enemies).map(h=>({...h,visible:camera.visible(h.x,h.y)}))] };
    }
    function advance(ms: number) {
        for (let remaining = ms; remaining > 1e-7;) {
            const dt = Math.min(TICK, remaining);
            feel.advance(dt, context(), step => {
                // A held screen pointer changes its world projection as the camera/player move.
                if (screen) {
                    const point = camera.pointer(screen, game, options.metrics ?? {});
                    if (point)
                        input = { ...input, aimPoint: point, angle: Math.atan2(point.y - game.player.y, point.x - game.player.x) };
                }
                const vitals=game.combat.mutationResources();
                if(vitals.health>=vitals.maxHealth)lastFullHealthElapsed=game.elapsed;
                if (room && game.status === 'playing') {
                    weaponUsage[vitals.weapon].equippedMs += step;
                    const encounter = game.encounter;
                    if (encounter.beat !== undefined && !(encounter.lullRemainingMs ?? 0)) {
                        const enemies = game.enemies.snapshot.enemies.filter(enemy => enemy.beat === encounter.beat);
                        const objectiveSatisfied = game.siege ? game.siege.remainingMs <= 0
                            : encounter.grammar === 'priority' && (encounter.canceledReinforcements ?? 0) > 0;
                        if (objectiveSatisfied || (!encounter.beatRemaining && enemies.length <= 3 && enemies.length > 0)) {
                            room.cleanupByBeat ??= {};
                            room.cleanupByBeat[encounter.beat] = (room.cleanupByBeat[encounter.beat] ?? 0) + step / 1000;
                        }
                    }
                }
                if(room?.id==='coolant-plant'||room?.id==='swarm-junction'){
                    for(const enemy of game.enemies.snapshot.enemies)
                        if(enemy.champion)featuredGuardians.add(enemy.id);
                }
                game.update(step, input);
            });
            kit.time += camera.update(game, dt / 1000);
            remaining -= dt;
        }
        camera.update(game, 0);
    }
    function finish(result: string) {
        if (!room)
            return;
        const stats = game.stats;
        Object.assign(room, { result, meleeLockDelays:game.encounter.meleeLockDelays, cleanupSeconds: Object.values<number>(room.cleanupByBeat ?? {}).reduce((sum, value) => sum + value, 0), topDamageSources:game.roomDamage, seconds: game.elapsed - room.startedElapsed, damageTaken: stats.damageTaken - room.startStats.damageTaken,
            hitsTaken: pressure.get(game.node.id)?.hitsTaken ?? 0, firstHitElapsed:pressure.get(game.node.id)?.firstHitElapsed??null, timeToDeathFromFullHealth:result==='dead'&&lastFullHealthElapsed!==null?game.elapsed-lastFullHealthElapsed:null, timeToDeathFromFirstHit:result==='dead'&&pressure.get(game.node.id)?.firstHitElapsed!=null?game.elapsed-pressure.get(game.node.id)!.firstHitElapsed!:null, hitTimes:pressure.get(game.node.id)?.hitTimes??[], pressure: pressure.get(game.node.id)?.byFamily ?? {},
            damageDealt: Object.fromEntries(Object.entries(stats.damageDealt).map(([key, value]) => [key, value - room.startStats.damageDealt[key]])),
            abilityUses: Object.fromEntries(Object.entries(stats.abilityUses).map(([key, value]) => [key, value - room.startStats.abilityUses[key]])),
            overdrives: stats.overdrivesUsed - room.startStats.overdrivesUsed, endCredits: game.combat.snapshot.credits, endHealth: game.combat.snapshot.health, endArmor: game.combat.snapshot.armor });
        if(room.featuredKill){
            room.postGuardianSeconds=game.elapsed-room.featuredKill.elapsed;
            room.postGuardianSuit=stats.damageTaken-room.featuredKill.suit;
        }
        featuredGuardians.clear();
        delete room.startStats;
        room = null;
    }
    // The bound is simulation decisions rather than wall time, preserving deterministic outcomes under load.
    while (decisions++ < 75000) {
        camera.update(game, 0);
        if (game.status === 'dead' || game.status === 'complete') {
            finish(game.status);
            report.outcome = game.status;
            report.deathRoom = game.status === 'dead' ? game.node.depth + 1 : null;
            break;
        }
        if (game.status !== 'playing') {
            if (game.status === 'reward' && ['medical', 'armory'].includes(game.node.kind) && game.expedition.run.completedNodeIds.includes(game.node.id) && !report.rooms.some(r => r.nodeId === game.node.id))
                report.rooms.push({ id: game.node.templateId, nodeId: game.node.id, depth: game.node.depth, nodeKind:game.node.kind, openingGrammar:game.encounter.grammar, holdout:!options.legacy&&[9,19].includes(game.node.depth), guardian:game.encounterGuardian, result: 'clear', autoClear: true, seconds: 0, damageTaken: 0, hitsTaken: 0, pressure: {}, damageDealt: { weapon: 0, ability: 0, status: 0, boon: 0 }, abilityUses: { dash: 0, tactical: 0, power: 0, overdrive: 0 }, overdrives: 0, boons: [...game.expedition.build.mutations] });
            input = { x: 0, y: 0, fire: false, angle: null, autoAim: false };
            screen = null;
            if (game.status === 'reward') {
                const offers = expeditionRewardOffers(game.expedition);
                if (offers.length)
                    game.chooseMutation(chooseBoon(offers.map(o => o.id), options.rig, [...game.expedition.build.mutations]));
                else {const purchase=chooseServicePurchase(SERVICE_IDS.filter(id=>game.canPurchaseService(id)),game.combat.snapshot,game.expedition.build,game.expedition.run);if(purchase)game.purchaseService(purchase,purchase==='rig-return'?game.returningRigAugments.at(-1):augmentUpgrades?.(game.expedition.build).at(-1));else game.claimResources();}
            }
            else if (game.status === 'route') {
                const graph = generateRun(options.seed, game.expedition.run.version);
                if (game.node.templateId === 'manual-control-chamber')
                    game.authorizeDestruction();
                else {
                    const choices = graph.nodes.filter(n => game.node.next.includes(n.id));
                    const choice = chooseRoute(choices, game.combat.snapshot.health);
                    if (!choice)
                        throw Error('No earned route');
                    const augment=augmentUpgrades?.(game.expedition.build).at(-1);
                    const detour=game.expedition.run.roomOrder&&[5,13].includes(game.node.depth)?chooseRoomOrder(game.expedition.run,game.node.depth,options.rig,options.roomOrder):detourOffers(game.expedition.run).length?chooseDetour(game.combat.snapshot,game.node.depth,['direct','salvage'].map(detour=>({detour,condition:game.conditionFor?.(choice.depth,detour==='salvage'),variant:game.openingName?.(choice.depth,detour==='salvage'),disabled:detour==='salvage'&&(game.node.depth===6&&game.combat.snapshot.credits<70||game.node.depth===10&&(!augment||game.combat.snapshot.credits<180))})),options.profile,game.expedition.run.runStructure?options.seed:undefined):undefined;
                    game.route(choice.id,augmentUpgrades&&game.node.depth===10&&(!augment||game.combat.snapshot.credits<180)?'direct':detour,augment);
                }
                feel.reset();
                for (const presentation of Object.values(presentations))
                    presentation.clear();
                systemPresentation.clear();
                camera.update(game, 0);
            }
            else
                throw Error(`Unexpected simulation screen ${game.status}`);
            continue;
        }
        if (!room) {
            observeRoomAttacks();
            if (report.rooms.filter(r => ['clear', 'complete'].includes(r.result)).length >= (options.rooms ?? 20)) {
                report.outcome = 'room-limit';
                break;
            }
            progressSignature = ''; lastProgressElapsed = game.elapsed;
            room = { id: game.node.templateId, nodeId: game.node.id, depth: game.node.depth, nodeKind:game.node.kind, openingGrammar:game.encounter.grammar, holdout:!options.legacy&&[9,19].includes(game.node.depth), guardian:game.encounterGuardian, variant:game.openingName?.(), condition:game.condition?.name, result: 'playing', grilleClosures:0, grilleEscortsCancelled:0, startedElapsed: game.elapsed, startStats: game.stats,
                startCredits: game.combat.snapshot.credits, startHealth: game.combat.snapshot.health, startArmor: game.combat.snapshot.armor, boons: [...game.expedition.build.mutations] };
            report.rooms.push(room);
        }
        const statsBefore = game.stats, playerBefore = { ...game.player };
        const s = snapshot(), decision = human.decide(s), target = decision.target, move = decision.movement;
        const weapon = decision.weapon;
        if (s.combat.weapon !== weapon) game.switchWeapon(weapon);
        if (target) {
            const projected = target.screen ?? camera.project(target.x, target.y);
            screen = { x: Math.max(4, Math.min(1916, projected.x)), y: Math.max(4, Math.min(1000, projected.y)) };
        }
        const weaponScreen: {x:number;y:number}|null = screen;
        const readInput = (): GameInput => {
            const point = screen ? camera.pointer(screen, game, options.metrics ?? {}) : null;
            return {x: move.dx, y: move.dy / .81, fire: !!target, angle: point ? Math.atan2(point.y-game.player.y,point.x-game.player.x) : null, aimPoint: point, autoAim: false};
        };
        input = readInput();
        const actions = decision.actions;
        recentDecisions.push({elapsed: game.elapsed, nodeId: game.node.id, player: playerBefore,
            target: target ? {id: target.id, type: target.type, x: target.x, y: target.y, health: target.health, clear: target.clear, visible: target.visible} : null,
            movement: {...move}, input: {...input}, actions: [...actions], abilityAims: s.abilityAims, weapon,
            remaining: game.encounterRemaining, visibleClearTargets: s.enemies.filter(e => e.visible && e.clear && e.vulnerable !== false).length});
        if (recentDecisions.length > 20) recentDecisions.shift();
        // Mouse moves do not immediately change game facing. Only ability keydowns call read().
        for (const key of actions) {
            const slot = ({q: 'tactical', f: 'power', v: 'overdrive'} as const)[key];
            const aim = slot ? s.abilityAims[slot] : null;
            if (aim) {
                const projected = camera.project(aim.x, aim.y, 0);
                screen = {x: Math.max(4,Math.min(1916,projected.x)), y: Math.max(4,Math.min(1000,projected.y))};
            }
            applyNativeImmediateKey(game, key, readInput);
            if (aim && target) screen = weaponScreen;
        }
        if (target) screen = weaponScreen;
        input = readInput();
        report.trace?.push({ elapsed: game.elapsed, depth: game.node.depth, objective: game.encounterObjective, siege: game.siege, encounter: game.encounter, remaining: game.encounterRemaining, input: { ...input }, keys: actions, weapon, stats: statsBefore, player: playerBefore,
            suit: {health:s.combat.health,armor:s.combat.armor,medkits:s.combat.medkits},
            abilitySlots:s.abilities.slots,deployables:s.abilities.deployables,
            legalMoves:s.candidates.filter(candidate=>candidate.legal).map(({dx,dy})=>({dx,dy})),
            movesRejectedByFriendlyWall:s.candidates.filter(candidate=>candidate.blockedByFriendlyWall).map(({dx,dy})=>({dx,dy})),
            enemies: s.enemies.map(e => ({ id: e.id, type: e.type, x: e.x, y: e.y, health: e.health, clear: e.clear, visible: e.visible, meleePhase: e.meleePhase, meleeAngle:e.meleeAngle, meleeShape:e.meleeShape, meleeRemainingMs:e.meleeRemainingMs, pendingAttack: e.pendingAttack, chargeMs: e.chargeMs })), screen: { ...screen } });
        advance(decision.stepMs);
        const progressStats = game.stats;
        const crossing=game.siege;
        if(crossing?.choosing&&!room.relayCrossing)room.relayCrossing={startDamage:progressStats.damageTaken,
          startHealth:game.combat.snapshot.health,startArmor:game.combat.snapshot.armor,
          dashReady:game.abilities.snapshot.slots?.dash?.ready,nearMeleePressure:crossing.nearMeleePressure};
        if(room.relayCrossing&&!room.relayCrossing.bank&&crossing?.selectedBank){
            room.relayCrossing.bank=crossing.selectedBank;
            room.relayCrossing.damageTaken=progressStats.damageTaken-room.relayCrossing.startDamage;
        }
        const signature = `${Math.ceil((game.siege?.remainingMs??0)/1000)}:${progressStats.kills.total}:${game.encounterRemaining}:${Math.round(Object.values(progressStats.damageDealt).reduce((a, b) => a + b, 0))}`;
        if (signature !== progressSignature) {progressSignature = signature; lastProgressElapsed = game.elapsed;}
        const diagnostic = nativeDiagnosticBurst(game,lastProgressElapsed,room.startedElapsed,options.maxRoomSeconds ?? 240,hardest,advance);
        hardest = diagnostic.hardest;
        if (diagnostic.reason) {
            report.finalReason = diagnostic.reason;
            finish('stalled'); report.outcome = 'stalled'; break;
        }
        if (game.status !== 'playing')
            finish(game.status === 'dead' ? 'dead' : game.status === 'complete' ? 'complete' : 'clear');
    }
    if (report.outcome === 'running')
        report.outcome = 'decision-limit';
    report.stats = game.stats;
    const finalState = snapshot();
    report.final = {...finalState, node: {...game.node}, status: game.status, phase: game.expedition.run.phase,
        elapsed: game.elapsed, objective: game.encounterObjective, encounter: game.encounter, remaining: game.encounterRemaining, stats: game.stats, resources: game.combat.getRunResources(),
        reason: report.finalReason ?? report.outcome,
        noCombatProgressSeconds: game.elapsed - lastProgressElapsed,
        noCombatProgressOver45s: game.elapsed - lastProgressElapsed > 45,
        recentDecisions};
    report.wallSeconds = (performance.now() - started) / 1000;
    return report;
}
function median(values: number[]) { const a = values.filter(Number.isFinite).sort((a, b) => a - b), i = Math.floor(a.length / 2); return a.length ? a.length % 2 ? a[i] : (a[i - 1] + a[i]) / 2 : null; }
/** Preserve per-run and per-depth distributions for an explicitly selected cohort. */
export function summarizeSimulations(reports: ReturnType<typeof runSimulation>[]) {
    const rigs = [...new Set(reports.map(r => r.rig))];
    const describe = (rs: typeof reports) => {
        const rooms = rs.flatMap(r => r.rooms), clears = rooms.filter(r => ['clear', 'complete'].includes(r.result));
        const histogram: Record<string, number> = {};
        for (const r of rs)
            if (r.deathRoom !== null)
                histogram[r.deathRoom] = (histogram[r.deathRoom] ?? 0) + 1;
        return { runs: rs.length, seeds: rs.map(r => r.seed), completed: rs.filter(r => r.outcome === 'complete').length, completionPct: rs.filter(r => r.outcome === 'complete').length / rs.length * 100,
            deaths: histogram, outcomes: Object.fromEntries([...new Set(rs.map(r => r.outcome))].map(outcome => [outcome, rs.filter(r => r.outcome === outcome).length])),
            medianTimeToDeathFromFirstHit:median(rooms.filter(r=>r.result==='dead').map(r=>r.timeToDeathFromFirstHit)),
            fullHealthDeathSeconds:rooms.filter(r=>r.result==='dead'&&Number.isFinite(r.timeToDeathFromFullHealth)).map(r=>r.timeToDeathFromFullHealth),
            medianRoomsPerOverdrive: median(rs.map(r => r.rooms.filter(room => ['clear', 'complete'].includes(room.result)).length / r.stats.overdrivesUsed)),
            medianRoomSeconds: median(clears.filter(r => ![9, 19].includes(r.depth) && !r.autoClear).map(r => r.seconds)),
            sources: Object.fromEntries(['weapon', 'ability', 'status', 'boon'].map(source => [source, rs.reduce((n, r) => n + r.stats.damageDealt[source], 0)])),
            byDepth: Array.from({ length: 20 }, (_, depth) => { const all = rooms.filter(r => r.depth === depth), done = all.filter(r => ['clear', 'complete'].includes(r.result)); return { room: depth + 1, entered: all.length, cleared: done.length, medianSeconds: median(done.map(r => r.seconds)), medianDamageTaken: median(all.map(r => r.damageTaken)), medianHitsTaken: median(all.map(r => r.hitsTaken)), hitHistogram:Object.fromEntries([...new Set(all.map(r=>r.hitsTaken))].sort((a,b)=>a-b).map(hits=>[hits,all.filter(r=>r.hitsTaken===hits).length])), medianOverdrives: median(all.map(r => r.overdrives)), maxOverdrives: Math.max(0, ...all.map(r => r.overdrives)) }; }),
            wallSeconds: rs.reduce((n, r) => n + r.wallSeconds, 0) };
    };
    return { total: describe(reports), rigs: Object.fromEntries(rigs.map(rig => [rig, describe(reports.filter(r => r.rig === rig))])) };
}
