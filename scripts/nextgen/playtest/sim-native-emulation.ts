import {ENEMY_ATTACK_SHAPES} from '../../../src/game/enemies/attackShapes';
import type {DepthGame, GameEffect, GameInput} from '../../../src/DepthGame';

const SLOTS = {Shift: 'dash', q: 'tactical', f: 'power', v: 'overdrive'} as const;
const WEAPONS = ['pistol', 'rifle', 'shotgun', 'plasma', 'rocket'] as const;

/** The immediate keydown portion of InputController, after a fresh gameplay key is admitted. */
export function applyNativeImmediateKey(game: DepthGame, key: string, read: () => GameInput): void {
    const slot = SLOTS[key as keyof typeof SLOTS];
    if (slot) {
        const intent = read();
        if (intent.angle !== null) game.player.angle = intent.angle;
        game.setAimPoint(intent.aimPoint ?? null);
        game.abilities.setIntent(intent.x, intent.y, intent.aimPoint ?? null);
        game.useAbility(slot);
    }
    if (key === 'r') game.reload();
    if (key === 'g') game.grenade();
    if (key === 'e') game.heal();
    if (/^[1-5]$/.test(key)) game.switchWeapon(WEAPONS[Number(key) - 1]);
}

export type NativeObservedEvent = GameEffect & {at: number};

/** application.effect bypasses renderer.effect for sync-corpse; debug retains the latest300 others. */
export function recordNativeObservedEvent(events: NativeObservedEvent[], event: GameEffect, elapsed: number): void {
    if (event.type === 'sync-corpse') return;
    events.push({...event, at: elapsed});
    if (events.length > 300) events.shift();
}

/** The native debug event observer persists across ordinary route/load-room boundaries. */
export function nativeWarningHazards(events: readonly NativeObservedEvent[], elapsed: number, enemies?:DepthGame['enemies']['snapshot']['enemies']) {
    const live=(enemies??[]).filter(e=>e.health>0&&e.pendingAttack==='spit'&&e.windupMs>0).map(e=>({id:`native:${e.id}`,x:e.lockX,y:e.lockY,radius:ENEMY_ATTACK_SHAPES.spitterProjectileRadius,kind:'warning',warningRemainingMs:e.windupMs}));
    const arrivals=events.filter(e=>e.type==='enemy-warning'&&!e.meleeShape&&(enemies===undefined||e.id===undefined)&&elapsed-e.at<(e.durationMs??800)/1000)
        .map(e=>({x:e.targetX??e.x,y:e.targetY??e.y,radius:e.radius??50,kind:'warning',warningRemainingMs:Math.max(0,(e.durationMs??800)-(elapsed-e.at)*1000)}));
    return [...live,...arrivals];
}

/** runner.snapshot includes living standard enemies and living negative-id Queen/nest targets. */
export function nativePressure(game: DepthGame): number {
    const ordinary = game.enemies.snapshot.enemies.filter(e => e.health > 0).length;
    const bossTargets = game.targets().filter(t => t.id < 0 && t.health > 0).length;
    return (ordinary + bossTargets) * 5 + (100 - game.combat.snapshot.health) * 2;
}

/** The native runner evaluates this before its diagnostic hardest-moment burst. */
export function nativeStallReason(elapsed: number, lastProgress: number, roomStarted: number, roomLimit: number) {
    if (elapsed - lastProgress > 45) return 'no-combat-progress-45s';
    if (elapsed - roomStarted > roomLimit) return 'max-room-seconds';
    return null;
}

/** Match runner order: progress/deadline check first, then at most three held-input diagnostic advances. */
export function nativeDiagnosticBurst(game: DepthGame, lastProgress: number, roomStarted: number, roomLimit: number, hardest: number, advance: (ms: number) => void) {
    const reason = nativeStallReason(game.elapsed,lastProgress,roomStarted,roomLimit);
    if (reason) return {reason, hardest};
    const pressure = nativePressure(game);
    if (pressure > hardest + 40 && game.status === 'playing') {
        hardest = pressure;
        for(let frame=0;frame<3 && game.status==='playing';frame++) advance(1000/15);
    }
    return {reason:null, hardest};
}
