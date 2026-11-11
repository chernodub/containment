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
import { roomFocus } from '../../../src/render/roomFraming';
import { canOccupyExpedition, hasClearExpeditionShot } from '../../../src/game/world/expeditionGeometry';
import { expeditionRewardOffers } from '../../../src/game/roguelike/expedition';
import {progressionFor} from '../../../src/game/roguelike/progression';
import { generateRun } from '../../../src/game/roguelike/run';
import type { RigId } from '../../../src/game/abilities/contract';
import {observeAbilityAims} from './ability-aim';
import { BOT_POLICY_VERSION, chooseBoon, chooseRoute, chooseTarget, chooseMovement, chooseActions, distance } from './policy.mjs';
import {botWaypoint, BOT_NAVIGATION_VERSION} from './bot-navigation';
const TICK = 1000 / 60;
const WIDTH = 1920, HEIGHT = 1080, VIEW = 13;
const WEAPONS = ['pistol', 'rifle', 'shotgun', 'plasma', 'rocket'] as const;
/** CPU-only observer using the same framing, perspective projection and follow spring. */
class CameraObserver {
    readonly camera = new T.PerspectiveCamera(28, WIDTH / HEIGHT, .1, 160);
    readonly rig = new CameraRig();
    private revision = -1;
    private raycaster = new T.Raycaster();
    private point = new T.Vector3();
    update(game: DepthGame, dt: number) {
        const bounds = game.geometry.bounds;
        if (this.revision !== game.roomRevision) {
            this.revision = game.roomRevision;
            const f = roomFocus(game.geometry.playerSpawn.x / 32, game.geometry.playerSpawn.y / 32, bounds.width / 32, bounds.height / 32, VIEW * WIDTH / HEIGHT, VIEW, game.node.templateId);
            this.rig.reset(f.x, f.z);
        }
        const b = game.boss.snapshot, weight = b.active && !b.defeated ? .43 : 0, zoom = weight ? .92 : 1;
        const p = game.player;
        const f = roomFocus(p.x / 32 * (1 - weight) + b.x / 32 * weight + Math.cos(p.angle) * .6, p.y / 32 * (1 - weight) + b.y / 32 * weight + Math.sin(p.angle) * .6, bounds.width / 32, bounds.height / 32, VIEW * WIDTH / HEIGHT / zoom, VIEW / zoom, game.node.templateId);
        this.rig.update(dt, f.x, f.z, 1, false);
        this.rig.apply(this.camera, zoom, VIEW, 1);
        // Same projected marine headroom correction as the production renderer.
        let left = 1, right = -1, top = -1, bottom = 1;
        for (const dx of [-p.radius / 32, p.radius / 32])
            for (const dz of [-p.radius / 32, p.radius / 32])
                for (const height of [0, 2.05]) {
                    const v = this.point.set(p.x / 32 + dx, height, p.y / 32 + dz).project(this.camera);
                    left = Math.min(left, v.x);
                    right = Math.max(right, v.x);
                    top = Math.max(top, v.y);
                    bottom = Math.min(bottom, v.y);
                }
        const cx = left < -.94 ? left + .94 : right > .94 ? right - .94 : 0, cy = top > .88 ? top - .88 : bottom < -.92 ? bottom + .92 : 0;
        if (cx || cy) {
            const from = new T.Vector3(p.x / 32, 1, p.y / 32).project(this.camera), to = from.clone();
            to.x -= cx;
            to.y -= cy;
            from.unproject(this.camera);
            to.unproject(this.camera);
            from.sub(to);
            from.z -= from.y * this.camera.matrixWorld.elements[10] / this.camera.matrixWorld.elements[9];
            from.y = 0;
            this.camera.position.add(from);
            this.rig.focus.add(from);
            this.camera.updateMatrixWorld();
        }
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
        return p.z >= -1 && p.z <= 1 && Math.abs(p.x) < .9 && Math.abs(p.y) < .8;
    }
}
export type SimOptions = {
    rig: RigId;
    seed: number;
    rooms?: number;
    assisted?: boolean;
    legacy?: boolean;
    maxRoomSeconds?: number;
    trace?: boolean;
    metrics?: Record<string, {
        height: number;
    }>;
};
export type SimReport = ReturnType<typeof runSimulation>;
/** Fight a complete earned campaign with the browser player's pure decision helpers. */
export function runSimulation(options: SimOptions) {
    const started = performance.now(), feel = new GameFeel(), camera = new CameraObserver();
    let game: DepthGame;
    const events: Array<GameEffect & {
        at: number;
    }> = [];
    const kit = new Proxy({ time: 0, low: false, reducedMotion: false, camera(weight = .12, angle?: number) { camera.rig.addTrauma(weight); if (weight > .2)
            camera.rig.punch(Math.min(.035, weight * .06), 220); if (angle !== undefined)
            camera.rig.kick(angle, weight * .1); }, anticipate(ms: number, amount = .012) { camera.rig.punch(amount, ms); } }, { get: (target, key) => key in target ? Reflect.get(target, key) : () => { } }) as any;
    const presentations = { breacher: createBreacherPresentation(kit), cryo: createCryoPresentation(kit), pyro: createPyroPresentation(kit), arc: createArcPresentation(kit) };
    const systemPresentation = createSystemPresentation(kit);
    const context = () => ({ dashing: game.abilities.dashing, critical: game.combat.snapshot.health <= 25, remaining: game.encounterRemaining });
    const onEffect = (e: GameEffect) => {
        events.push({ ...e, at: game.elapsed });
        if (events.length > 300)
            events.shift();
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
    game = new DepthGame(onEffect);
    game.newRun(options.seed, { rigSelect: true });
    game.chooseRig(options.rig);
    if (options.legacy)
        game.newRun(options.seed, { version: 2, rig: options.rig });
    if (options.assisted) {
        const hurt = game.hurt.bind(game);
        game.hurt = (n, origin) => hurt(n * .15, origin);
    }
    const report = { mode: 'sim-policy-v5', policyVersion: BOT_POLICY_VERSION, navigationVersion: BOT_NAVIGATION_VERSION, rig: options.rig, seed: options.seed, assisted: !!options.assisted, legacy: !!options.legacy,
        policy: 'Shared policy.mjs; 250ms decisions, 60Hz GameFeel, real DepthGame actions; analytic camera observer.',
        limitations: ['No GPU, audio or DOM. Uses shared camera follow/framing/ability-event hooks, exact actor metrics and held-screen ray/torso selection; resource preparation and RAF synchronization are omitted. Matched browser validation remains required before using campaign outcomes as native-policy predictions.'],
        rooms: [] as any[], outcome: 'running', deathRoom: null as number | null, stats: null as any, final: null as any, wallSeconds: 0, trace: options.trace ? [] as any[] : undefined };
    let room: any, previous = { x: 0, y: 0 }, input: GameInput = { x: 0, y: 0, fire: false, angle: null, autoAim: false }, decisions = 0, hardest = -1;
    let screen: {
        x: number;
        y: number;
    } | null = null;
    const recentDecisions: Array<Record<string, unknown>> = [];
    let progressSignature = '', lastProgressElapsed = 0;
    function snapshot() {
        const clear = (x: number, y: number, from: {x: number; y: number} = game.player) => hasClearExpeditionShot(game.geometry, from, { x, y });
        const enemies: any[] = game.enemies.snapshot.enemies.filter(e => e.health > 0).map(e => ({ ...e, clear: clear(e.x, e.y), visible: camera.visible(e.x, e.y) }));
        for (const t of game.targets().filter(t => t.id < 0 && t.health > 0))
            enemies.push({ ...t, type: 'queen', clear: clear(t.x, t.y), visible: camera.visible(t.x, t.y), vulnerable: t.id !== -1 || game.boss.snapshot.vulnerable });
        const nearest = [...enemies].sort((a, b) => distance(a, game.player) - distance(b, game.player))[0];
        const waypoint = nearest ? botWaypoint(game, nearest) ?? nearest : null;
        const candidates = [];
        for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
            const len = Math.hypot(dx, dy) || 1, x = game.player.x + dx / len * 90, y = game.player.y + dy / len * 90;
            let legal = true;
            for (let i = 1; i <= 6; i++)
                if (!canOccupyExpedition(game.geometry, { x: game.player.x + (x - game.player.x) * i / 6, y: game.player.y + (y - game.player.y) * i / 6 }, 19))
                    legal = false;
            if (game.abilities.blocksMovement(game.player, { x, y }, 19))
                legal = false;
            candidates.push({ x, y, dx, dy, legal, waypoint, clear: nearest ? clear(nearest.x, nearest.y, { x, y }) : false });
        }
        const telegraph = game.boss.snapshot.pendingTelegraph;
        return { rig: options.rig, player: { ...game.player }, combat: { ...game.combat.snapshot, weapon: game.combat.snapshot.weaponId }, enemies, candidates,
            abilityAims: observeAbilityAims(game,enemies,point=>{
                const projected=camera.project(point.x,point.y,0);
                return camera.pointer({x:Math.max(4,Math.min(1916,projected.x)),y:Math.max(4,Math.min(1000,projected.y))},game,options.metrics??{});
            }), abilities: game.abilities.snapshot, hazards: [...(telegraph ? [{ x: telegraph.targetX, y: telegraph.targetY, radius: telegraph.radius }] : []), ...game.pools,
                ...game.bullets.filter(b => b.kind === 'hazard').map(b => ({ x: b.x, y: b.y, radius: 35 })),
                ...events.filter(e => e.type === 'enemy-warning' && game.elapsed - e.at < (e.durationMs ?? 800) / 1000).map(e => ({ x: e.targetX ?? e.x, y: e.targetY ?? e.y, radius: e.radius ?? 50 }))] };
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
                game.update(step, input);
            });
            camera.update(game, dt / 1000);
            kit.time += dt / 1000;
            remaining -= dt;
        }
        camera.update(game, 0);
    }
    function finish(result: string) {
        if (!room)
            return;
        const stats = game.stats;
        Object.assign(room, { result, seconds: game.elapsed - room.startedElapsed, damageTaken: stats.damageTaken - room.startStats.damageTaken,
            damageDealt: Object.fromEntries(Object.entries(stats.damageDealt).map(([key, value]) => [key, value - room.startStats.damageDealt[key]])),
            abilityUses: Object.fromEntries(Object.entries(stats.abilityUses).map(([key, value]) => [key, value - room.startStats.abilityUses[key]])),
            overdrives: stats.overdrivesUsed - room.startStats.overdrivesUsed, endHealth: game.combat.snapshot.health, endArmor: game.combat.snapshot.armor });
        delete room.startStats;
        room = null;
    }
    // The bound is simulation decisions rather than wall time, preserving deterministic outcomes under load.
    while (decisions++ < 30000) {
        camera.update(game, 0);
        if (game.status === 'dead' || game.status === 'complete') {
            finish(game.status);
            report.outcome = game.status;
            report.deathRoom = game.status === 'dead' ? game.node.depth + 1 : null;
            break;
        }
        if (game.status !== 'playing') {
            if (game.status === 'reward' && ['medical', 'armory'].includes(game.node.kind) && game.expedition.run.completedNodeIds.includes(game.node.id) && !report.rooms.some(r => r.nodeId === game.node.id))
                report.rooms.push({ id: game.node.templateId, nodeId: game.node.id, depth: game.node.depth, nodeKind:game.node.kind, holdout:!options.legacy&&[9,19].includes(game.node.depth), guardian:progressionFor(game.node).guardianKind, result: 'clear', autoClear: true, seconds: 0, damageTaken: 0, damageDealt: { weapon: 0, ability: 0, status: 0, boon: 0 }, abilityUses: { dash: 0, tactical: 0, power: 0, overdrive: 0 }, overdrives: 0, boons: [...game.expedition.build.mutations] });
            input = { x: 0, y: 0, fire: false, angle: null, autoAim: false };
            previous = { x: 0, y: 0 };
            screen = null;
            if (game.status === 'reward') {
                const offers = expeditionRewardOffers(game.expedition);
                if (offers.length)
                    game.chooseMutation(chooseBoon(offers.map(o => o.id), options.rig, [...game.expedition.build.mutations]));
                else
                    game.claimResources(game.combat.snapshot.health < 70 && game.canPurchaseService('heal') ? 'heal' : null);
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
                    game.route(choice.id);
                }
                feel.reset();
                events.length = 0;
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
            if (report.rooms.filter(r => ['clear', 'complete'].includes(r.result)).length >= (options.rooms ?? 20)) {
                report.outcome = 'room-limit';
                break;
            }
            progressSignature = ''; lastProgressElapsed = game.elapsed;
            room = { id: game.node.templateId, nodeId: game.node.id, depth: game.node.depth, nodeKind:game.node.kind, holdout:!options.legacy&&[9,19].includes(game.node.depth), guardian:progressionFor(game.node).guardianKind, result: 'playing', startedElapsed: game.elapsed, startStats: game.stats,
                startHealth: game.combat.snapshot.health, startArmor: game.combat.snapshot.armor, boons: [...game.expedition.build.mutations] };
            report.rooms.push(room);
        }
        const statsBefore = game.stats, playerBefore = { ...game.player };
        const s = snapshot(), target = chooseTarget(s.enemies, s.player), move = chooseMovement(s, previous);
        previous = { x: move.dx, y: move.dy };
        const ammo = game.combat.getRunResources().ammo, near = Math.min(Infinity, ...s.enemies.map(e => distance(e, s.player)));
        const weapon = near < 180 && ammo.shotgun.magazine + ammo.shotgun.reserve > 0 ? 'shotgun' : ammo.rifle.magazine + ammo.rifle.reserve > 0 ? 'rifle' : ammo.plasma.magazine + ammo.plasma.reserve > 0 ? 'plasma' : 'pistol';
        game.switchWeapon(weapon);
        if (target) {
            const projected = camera.project(target.x, target.y);
            screen = { x: Math.max(4, Math.min(1916, projected.x)), y: Math.max(4, Math.min(1000, projected.y)) };
        }
        const point = screen ? camera.pointer(screen, game, options.metrics ?? {}) : null;
        input = { x: move.dx, y: move.dy / .81, fire: !!target, angle: point ? Math.atan2(point.y - game.player.y, point.x - game.player.x) : null, aimPoint: point, autoAim: false };
        const actions = chooseActions(s);
        recentDecisions.push({elapsed: game.elapsed, nodeId: game.node.id, player: playerBefore,
            target: target ? {id: target.id, type: target.type, x: target.x, y: target.y, health: target.health, clear: target.clear, visible: target.visible} : null,
            movement: {...move}, input: {...input}, actions: [...actions], abilityAims: s.abilityAims, weapon,
            remaining: game.encounterRemaining, visibleClearTargets: s.enemies.filter(e => e.visible && e.clear && e.vulnerable !== false).length});
        if (recentDecisions.length > 20) recentDecisions.shift();
        game.setAimPoint(input.aimPoint ?? null);
        if (input.angle !== null)
            game.player.angle = input.angle;
        for (const key of actions) {
            const slot = ({ Shift: 'dash', q: 'tactical', f: 'power', v: 'overdrive' } as const)[key];
            if (slot) {
                const aim = s.abilityAims[slot];
                if (aim) {
                    const projected = camera.project(aim.x, aim.y, 0);
                    const abilityPoint = camera.pointer({x: Math.max(4,Math.min(1916,projected.x)),y: Math.max(4,Math.min(1000,projected.y))}, game, options.metrics ?? {});
                    if (!abilityPoint) continue;
                    game.player.angle = Math.atan2(abilityPoint.y-game.player.y, abilityPoint.x-game.player.x);
                    game.setAimPoint(abilityPoint);
                    game.abilities.setIntent(input.x,input.y,abilityPoint);
                } else game.abilities.setIntent(input.x, input.y, input.aimPoint ?? null);
                game.useAbility(slot);
                game.setAimPoint(input.aimPoint ?? null);
                if(input.angle!==null)game.player.angle=input.angle;
            }
            else if (key === 'e')
                game.heal();
            else if (key === 'g')
                game.grenade();
            else if (key === 'r')
                game.reload();
        }
        report.trace?.push({ elapsed: game.elapsed, depth: game.node.depth, input: { ...input }, keys: actions, weapon, stats: statsBefore, player: playerBefore, enemies: s.enemies.map(e => ({ id: e.id, type: e.type, x: e.x, y: e.y, health: e.health, clear: e.clear, visible: e.visible })), screen: { ...screen } });
        advance(250);
        const pressure = game.enemies.snapshot.enemies.filter(e => e.health > 0).length * 5 + (100 - game.combat.snapshot.health) * 2;
        if (pressure > hardest + 40 && game.status === 'playing') {
            hardest = pressure;
            for (let frame = 0; frame < 3 && game.status === 'playing'; frame++)
                advance(1000 / 15);
        }
        const progressStats = game.stats;
        const signature = `${progressStats.kills.total}:${game.encounterRemaining}:${Math.round(Object.values(progressStats.damageDealt).reduce((a, b) => a + b, 0))}`;
        if (signature !== progressSignature) {progressSignature = signature; lastProgressElapsed = game.elapsed;}
        if (game.status !== 'playing')
            finish(game.status === 'dead' ? 'dead' : game.status === 'complete' ? 'complete' : 'clear');
        else if (game.elapsed - room.startedElapsed > (options.maxRoomSeconds ?? 240)) {
            finish('stalled');
            report.outcome = 'stalled';
            break;
        }
    }
    if (report.outcome === 'running')
        report.outcome = 'decision-limit';
    report.stats = game.stats;
    const finalState = snapshot();
    report.final = {...finalState, node: {...game.node}, status: game.status, phase: game.expedition.run.phase,
        elapsed: game.elapsed, remaining: game.encounterRemaining, stats: game.stats, resources: game.combat.getRunResources(),
        reason: report.outcome === 'stalled' ? 'max-room-seconds' : report.outcome,
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
            medianRoomsPerOverdrive: median(rs.map(r => r.rooms.filter(room => ['clear', 'complete'].includes(room.result)).length / r.stats.overdrivesUsed)),
            medianRoomSeconds: median(clears.filter(r => ![9, 19].includes(r.depth) && !r.autoClear).map(r => r.seconds)),
            sources: Object.fromEntries(['weapon', 'ability', 'status', 'boon'].map(source => [source, rs.reduce((n, r) => n + r.stats.damageDealt[source], 0)])),
            byDepth: Array.from({ length: 20 }, (_, depth) => { const all = rooms.filter(r => r.depth === depth), done = all.filter(r => ['clear', 'complete'].includes(r.result)); return { room: depth + 1, entered: all.length, cleared: done.length, medianSeconds: median(done.map(r => r.seconds)), medianDamageTaken: median(all.map(r => r.damageTaken)), medianOverdrives: median(all.map(r => r.overdrives)), maxOverdrives: Math.max(0, ...all.map(r => r.overdrives)) }; }),
            wallSeconds: rs.reduce((n, r) => n + r.wallSeconds, 0) };
    };
    return { total: describe(reports), rigs: Object.fromEntries(rigs.map(rig => [rig, describe(reports.filter(r => r.rig === rig))])) };
}
