import * as T from 'three';
import type { MarineMotion } from './MarineMotion';
import type { EnemyAttackPhase } from './EnemyMotion';
import type { DeathCue } from '../DeathRagdolls';
const RUNS = Array.from({ length: 8 }, (_, i) => `m10-run-${i * 45}`);
const STARTS = Array.from({ length: 8 }, (_, i) => `m10-start-${i * 45}`);
const STOPS = Array.from({ length: 8 }, (_, i) => `m10-stop-${i * 45}`);
const REVERSALS = Array.from({ length: 8 }, (_, i) => `m10-reversal-${i * 45}`);
const DIRECTIONS = ['front', 'right', 'back', 'left'];
const MARINE_HITS = DIRECTIONS.map(side => `m10-hit-${side}`);
const MARINE_DEATHS = ['m10-death', 'm10-death-right', 'm10-death-back', 'm10-death-left'];
const LIGHT_HITS = DIRECTIONS.map(side => `m10-hit-light-${side}`);
const HEAVY_HITS = DIRECTIONS.map(side => `m10-hit-heavy-${side}`);
const CASTS: Record<string, string> = Object.fromEntries([
    'ram', 'seismic-slam', 'bulwark', 'railbreaker',
    'frost-trail', 'cryo-nova', 'glacier', 'whiteout',
    'afterburn', 'flashfire', 'napalm-charge', 'meltdown',
    'static-step', 'overload', 'tesla-pylon', 'overclock',
].map(id => [id, `m10-cast-${id}`]));
const FIRES: Record<string, string> = {
    pistol: 'm10-fire-pistol', rifle: 'm10-fire-rifle', shotgun: 'm10-fire-shotgun',
    plasma: 'm10-fire-plasma', rocket: 'm10-fire-rocket',
};
const DEATHS: Record<DeathCue, string> = { none: 'm10-death-none', frost: 'm10-death-frost', burn: 'm10-death-burn', arc: 'm10-death-arc', acid: 'm10-death-acid' };
const directionIndex = (direction: number, aim: number) => ((Math.round((direction - aim + Math.PI) / (Math.PI / 2)) % 4) + 4) % 4;
/** Prepared absolute bone clips, with cached upper layers and an optional reduced-motion base. */
export class AuthoredMotionPlayer {
    private readonly actions = new Map<string, T.AnimationAction>();
    private readonly markers = new Map<string, number>();
    private readonly upper = new Map<string, T.AnimationAction>();
    private upperCurrent: T.AnimationAction | undefined;
    private readonly grips = new Map<string, T.AnimationAction>();
    private gripCurrent: T.AnimationAction | undefined;
    private neutral: T.AnimationAction | undefined;
    private current: T.AnimationAction | undefined;
    private previous: T.AnimationAction | undefined;
    private blend = 1;
    private fade = .06;
    private batching = false;
    private pendingEvaluation = false;
    private deferredUpperClear = false;
    private upperRequested = false;
    private gripRequested = false;
    private immediate = false;
    private readonly localMatrixBones: T.Bone[] = [];
    readonly available: boolean;
    constructor(private readonly mixer: T.AnimationMixer, clips: readonly T.AnimationClip[], root?: T.Object3D, localMatrixRoot?: T.Object3D) {
        localMatrixRoot?.traverse(node => {
            if (node instanceof T.Bone) this.localMatrixBones.push(node);
        });
        const upperNames = new Set<string>();
        root?.getObjectByName('ribs')?.traverse(node => upperNames.add(node.name));
        const ready = clips.find(clip => clip.name === 'm10-ready-shotgun');
        for (const clip of clips)
            if (clip.name.startsWith('m10-')) {
                const action = mixer.clipAction(clip);
                action.setLoop(T.LoopOnce, 1);
                action.clampWhenFinished = true;
                action.paused = true;
                this.actions.set(clip.name, action);
                const extras = (clip as T.AnimationClip & {
                    userData?: {
                        m10ImpactSeconds?: number;
                    };
                }).userData;
                if (extras?.m10ImpactSeconds !== undefined)
                    this.markers.set(clip.name, extras.m10ImpactSeconds / clip.duration);
                if (upperNames.size && (clip.name === 'm10-reload' || clip.name === 'm10-switch' || clip.name.startsWith('m10-fire-'))) {
                    const layer = clip.clone();
                    layer.name = clip.name + '-upper';
                    layer.tracks = layer.tracks.filter(track => upperNames.has(T.PropertyBinding.parseTrackName(track.name).nodeName));
                    T.AnimationUtils.makeClipAdditive(layer, 0, clip, 60);
                    const overlay = mixer.clipAction(layer);
                    overlay.setLoop(T.LoopOnce, 1);
                    overlay.clampWhenFinished = true;
                    overlay.paused = true;
                    this.upper.set(clip.name, overlay);
                }
            }
        if (ready)
            for (const clip of clips)
                if (clip.name.startsWith('m10-ready-') && clip !== ready) {
                    const layer = clip.clone();
                    layer.name = clip.name + '-grip';
                    layer.tracks = layer.tracks.filter(track => upperNames.has(T.PropertyBinding.parseTrackName(track.name).nodeName));
                    T.AnimationUtils.makeClipAdditive(layer, 0, ready, 60);
                    const action = mixer.clipAction(layer);
                    action.setLoop(T.LoopOnce, 1);
                    action.clampWhenFinished = true;
                    action.paused = true;
                    this.grips.set(clip.name.slice(10), action);
                }
        const idle = clips.find(clip => clip.name === 'm10-idle');
        if (idle) {
            const reference = idle.clone();
            reference.name = 'm10-neutral-blend';
            this.neutral = mixer.clipAction(reference);
            this.neutral.paused = true;
        }
        this.available = this.actions.size > 0;
    }
    has(name: string): boolean {
        return this.actions.has(name);
    }
    impact(name: string): number {
        return this.markers.get(name) ?? .32 / .88;
    }
    isCurrent(name: string): boolean {
        return this.current?.getClip().name === name;
    }
    duration(name: string): number {
        return this.actions.get(name)?.getClip().duration ?? 0;
    }
    /** A base pose and its grip/action layers share one final binding pass. */
    beginBatch(): void {
        this.batching = true;
        this.deferredUpperClear = false;
    }
    endBatch(): void {
        if (this.deferredUpperClear) {
            if (!this.upperRequested && this.upperCurrent) {
                this.upperCurrent.stop();
                this.upperCurrent = undefined;
                this.pendingEvaluation = true;
            }
            if (!this.gripRequested && this.gripCurrent) {
                this.gripCurrent.stop();
                this.gripCurrent = undefined;
                this.pendingEvaluation = true;
            }
            this.deferredUpperClear = false;
        }
        this.batching = false;
        if (this.pendingEvaluation) {
            this.pendingEvaluation = false;
            this.evaluateNow();
        }
    }
    /** Resume a hidden actor at its current native phase, without a stale-pose fade. */
    snapNext(): void { this.immediate = true; }
    private evaluate(): void {
        if (this.batching) this.pendingEvaluation = true;
        else this.evaluateNow();
    }
    private evaluateNow(): void {
        this.mixer.update(0);
        // Enemy locals change only when an authored pose is evaluated. Cache
        // them before world propagation, including the final authored death pose.
        // Pool reset restores automatic updates; Rapier receives no more samples.
        for (const bone of this.localMatrixBones) {
            bone.matrixAutoUpdate = false;
            bone.updateMatrix();
        }
    }
    sample(name: string, progress: number, dt: number, fade = .06, amplitude = 1): boolean {
        const next = this.actions.get(name);
        if (!next)
            return false;
        if (next !== this.current) {
            if (!this.current)
                this.mixer.stopAllAction();
            this.previous?.stop();
            this.previous = this.current;
            this.current = next;
            next.reset().play();
            next.paused = true;
            this.fade = fade;
            this.blend = this.previous ? 0 : 1;
        }
        if (this.immediate) {
            this.previous?.stop();
            this.previous = undefined;
            this.blend = 1;
            this.immediate = false;
        }
        this.blend = Math.min(1, this.blend + dt / Math.max(.001, this.fade));
        next.time = T.MathUtils.clamp(progress, 0, 1) * next.getClip().duration;
        next.setEffectiveWeight(this.blend * amplitude);
        if (this.previous) {
            this.previous.setEffectiveWeight((1 - this.blend) * amplitude);
            if (this.blend === 1) {
                this.previous.stop();
                this.previous = undefined;
            }
        }
        if (this.neutral) {
            if (amplitude < 1) {
                this.neutral.play();
                this.neutral.paused = true;
                this.neutral.time = 0;
                this.neutral.setEffectiveWeight(1 - amplitude);
            }
            else
                this.neutral.stop();
        }
        this.evaluate();
        return true;
    }
    clearUpper(): void {
        // The marine reselects its layers inside the existing pose batch.
        // Keep unchanged actions bound; retire only unrequested layers at flush.
        if (this.batching) {
            this.deferredUpperClear = true;
            this.upperRequested = this.gripRequested = false;
            return;
        }
        this.upperCurrent?.stop();
        this.upperCurrent = undefined;
        this.gripCurrent?.stop();
        this.gripCurrent = undefined;
    }
    grip(weapon: string): void {
        const action = this.grips.get(weapon);
        if (!action)
            return;
        this.gripRequested = true;
        if (this.gripCurrent !== action) {
            this.gripCurrent?.stop();
            action.play();
            action.paused = true;
            this.gripCurrent = action;
        }
        action.time = 0;
        action.setEffectiveWeight(1);
        this.evaluate();
    }
    overlay(name: string, progress: number): void {
        const action = this.upper.get(name);
        if (!action)
            return;
        this.upperRequested = true;
        if (this.upperCurrent !== action) {
            this.upperCurrent?.stop();
            action.reset().play();
            action.paused = true;
            this.upperCurrent = action;
        }
        action.time = T.MathUtils.clamp(progress, 0, 1) * action.getClip().duration;
        action.setEffectiveWeight(1);
        this.evaluate();
    }
    reset(): void {
        this.batching = false;
        this.clearUpper();
        this.neutral?.stop();
        this.current?.stop();
        this.previous?.stop();
        this.current = this.previous = undefined;
        this.blend = 1;
        this.batching = this.pendingEvaluation = this.immediate = false;
        this.deferredUpperClear = this.upperRequested = this.gripRequested = false;
    }
}
/** Native clocks select authored marine choreography; roots remain simulation-owned. */
export class AuthoredMarineMotion {
    private previous: number | undefined;
    private gait = 0;
    private hitAge = 10;
    private hitDirection = 0;
    private fireAge = 10;
    private recoil = 0;
    private switchAge = 10;
    private weapon = '';
    private transitionAge = 10;
    private transition = '';
    private lastDirection = 0;
    private wasMoving = false;
    private lastVx = 0;
    private lastVy = 0;
    private aim = 0;
    private feedback = 1;
    constructor(readonly player: AuthoredMotionPlayer, private readonly motion: MarineMotion) { }
    setOptions(strength: number, reduced: boolean): void {
        this.feedback = T.MathUtils.clamp(strength, 0, 1) * (reduced ? .3 : 1);
        if (this.feedback === 0)
            this.hitAge = 10;
    }
    hit(strength: number, direction: number): void {
        if (strength > 0 && this.feedback > 0) {
            this.hitAge = 0;
            this.hitDirection = direction;
        }
    }
    update(time: number, aim: number, recoil: number, reload: number, vx: number, vy: number, weapon: string): boolean {
        if (!this.player.available)
            return false;
        this.player.clearUpper();
        this.aim = aim;
        const dt = this.previous === undefined ? 0 : T.MathUtils.clamp(time - this.previous, 0, .05);
        this.previous = time;
        this.hitAge += dt;
        this.fireAge += dt;
        this.switchAge += dt;
        this.transitionAge += dt;
        const speed = Math.hypot(vx, vy), moving = speed > 3 && speed < 700;
        const direction = moving ? ((Math.round((Math.atan2(vy, vx) - aim) / (Math.PI / 4)) % 8) + 8) % 8 : this.lastDirection;
        this.gait += dt * (speed / 220) / Math.max(.1, this.player.duration(RUNS[direction]) || .4);
        if (moving && !this.wasMoving) {
            this.transition = STARTS[direction];
            this.transitionAge = 0;
        }
        else if (!moving && this.wasMoving) {
            this.transition = STOPS[this.lastDirection];
            this.transitionAge = 0;
        }
        else if (moving && this.wasMoving && vx * this.lastVx + vy * this.lastVy < -.45 * speed * Math.hypot(this.lastVx, this.lastVy)) {
            this.transition = REVERSALS[direction];
            this.transitionAge = 0;
        }
        this.wasMoving = moving;
        this.lastDirection = direction;
        this.lastVx = vx;
        this.lastVy = vy;
        if (this.weapon && this.weapon !== weapon)
            this.switchAge = 0;
        this.weapon = weapon;
        // An accepted shot interrupts the cosmetic lower/equip beat immediately.
        if (recoil > this.recoil + .08) {
            this.fireAge = 0;
            this.switchAge = 10;
        }
        this.recoil = recoil;
        const cast = CASTS[this.motion.actionName];
        if (cast && this.player.has(cast)) {
            const phase = this.motion.actionNormalized;
            // Cast receipts hold overhead anticipation; only accepted impact opens the downbeat.
            const marker = this.player.impact(cast), p = this.motion.actionHeldCast ? (phase < .42 ? phase / .42 * marker : marker + (phase - .42) / .58 * (1 - marker)) : phase;
            return this.player.sample(cast, p, dt, .035);
        }
        const hit = MARINE_HITS[directionIndex(this.hitDirection, aim)], hitName = this.player.has(hit) ? hit : 'm10-hit-front';
        if (this.hitAge < this.player.duration(hitName))
            return this.player.sample(hitName, this.hitAge / this.player.duration(hitName), dt, .025, this.feedback);
        if (moving && this.player.has(RUNS[direction])) {
            const fire = FIRES[weapon];
            const layer = reload > 0 ? 'm10-reload' : this.switchAge < this.player.duration('m10-switch') ? 'm10-switch' : this.fireAge < this.player.duration(fire) ? fire : '';
            if (layer) {
                this.travel(direction, moving, speed, time, dt);
                this.player.grip(weapon);
                this.player.overlay(layer, reload > 0 ? reload : layer === 'm10-switch' ? this.switchAge / this.player.duration(layer) : this.fireAge / this.player.duration(layer));
                return true;
            }
        }
        if (reload > 0 && this.player.has('m10-reload'))
            return this.player.sample('m10-reload', reload, dt);
        if (this.switchAge < this.player.duration('m10-switch'))
            return this.player.sample('m10-switch', this.switchAge / this.player.duration('m10-switch'), dt);
        const fire = FIRES[weapon];
        if (!moving && this.fireAge < this.player.duration(fire))
            return this.player.sample(fire, this.fireAge / this.player.duration(fire), dt, .02);
        const sampled = this.travel(direction, moving, speed, time, dt);
        this.player.grip(weapon);
        return sampled;
    }
    private travel(direction: number, moving: boolean, speed: number, time: number, dt: number): boolean {
        const transitionDuration = this.player.duration(this.transition);
        if (this.transitionAge < transitionDuration)
            return this.player.sample(this.transition, this.transitionAge / transitionDuration, dt);
        if (transitionDuration > 0) {
            // Start/reversal end on cycle zero. Preserve only the real frame overshoot.
            if (moving)
                this.gait = (this.transitionAge - transitionDuration) * (speed / 220) / Math.max(.1, this.player.duration(RUNS[direction]));
            this.transition = '';
        }
        if (moving && this.player.has(RUNS[direction]))
            return this.player.sample(RUNS[direction], this.gait % 1, dt);
        const duration = this.player.duration('m10-idle');
        return this.player.sample('m10-idle', (time % duration) / duration, dt);
    }
    death(cue: DeathCue, progress: number): number {
        this.player.clearUpper();
        const directional = MARINE_DEATHS[directionIndex(this.hitDirection, this.aim)];
        const name = this.player.has(DEATHS[cue]) ? DEATHS[cue] : this.player.has(directional) ? directional : 'm10-death';
        if (!this.player.has(name))
            return 0;
        this.player.sample(name, progress, 1 / 60, .025);
        return .62;
    }
    reset(): void {
        this.player.reset();
        this.previous = undefined;
        this.gait = 0;
        this.hitAge = this.fireAge = this.switchAge = this.transitionAge = 10;
        this.weapon = this.transition = '';
        this.wasMoving = false;
        this.lastVx = this.lastVy = this.aim = 0;
    }
}
/** Each hostile phase samples its own baked action at the simulation's progress. */
export class AuthoredEnemyMotion {
    private previous: number | undefined;
    private age = 0;
    private hitAge = 10;
    private hitDirection = 0;
    private heavy = false;
    private attackAge = 10;
    private phase: EnemyAttackPhase = 'approach';
    private progress = 0;
    private feedback = 1;
    private visible = true;
    private renderManaged = false;
    private quietLocomotion = false;
    private idlePoseTime = -Infinity;
    constructor(readonly player: AuthoredMotionPlayer) { }
    setVisible(visible: boolean, quietLocomotion = false): void {
        this.renderManaged = true;
        this.quietLocomotion = quietLocomotion;
        if (visible && !this.visible) {
            this.player.snapNext();
            this.idlePoseTime = -Infinity;
        }
        this.visible = visible;
    }
    setOptions(strength: number, reduced: boolean): void {
        this.feedback = T.MathUtils.clamp(strength, 0, 1) * (reduced ? .3 : 1);
        if (this.feedback === 0)
            this.hitAge = 10;
    }
    state(phase: EnemyAttackPhase, progress: number): void {
        // Commitment is already native on this frame: enter the held loaded
        // silhouette immediately, instead of spending half a short warning
        // blending out of locomotion and only then beginning to coil.
        if (phase === 'windup' && this.phase !== 'windup') this.player.snapNext();
        this.phase = phase;
        this.progress = progress;
    }
    hit(strength: number, direction: number, heavy: boolean): void {
        if (strength > 0 && this.feedback > 0) {
            this.hitAge = 0;
            this.hitDirection = direction;
            this.heavy = heavy;
        }
    }
    attack(): void {
        this.attackAge = 0;
    }
    update(time: number, moving: number, aim: number, winding: boolean, anticipation: number, frozen: boolean, burning: boolean, shocked: boolean, speed: number): boolean {
        if (!this.player.available)
            return false;
        const dt = this.previous === undefined ? 0 : T.MathUtils.clamp(time - this.previous, 0, .05);
        this.previous = time;
        if (frozen)
            return true;
        this.age += dt;
        this.hitAge += dt;
        this.attackAge += dt;
        // Only pose evaluation is suspended. Native phase inputs and all local
        // ages keep advancing, so returning actors never replay missed actions.
        if (!this.visible) return true;
        // A fresh native warning/strike must remain visible after thaw even
        // when an older hit reaction was held by the frozen visual clock.
        if (this.phase === 'windup' || this.phase === 'strike')
            return this.player.sample(this.phase === 'windup' ? 'm10-windup' : 'm10-strike', this.phase === 'windup' ? .42 + .58 * this.progress : this.progress, dt, this.phase === 'strike' ? 0 : .025);
        if (this.phase === 'recovery')
            return this.player.sample('m10-recovery', this.progress, dt, .025);
        const hit = (this.heavy ? HEAVY_HITS : LIGHT_HITS)[directionIndex(this.hitDirection, aim)];
        if (this.hitAge < this.player.duration(hit))
            return this.player.sample(hit, this.hitAge / this.player.duration(hit), dt, .025, this.feedback);
        if (winding)
            return this.player.sample('m10-windup', anticipation, dt, .04);
        if (this.attackAge < .16)
            return this.player.sample('m10-strike', this.attackAge / .16, dt, .02);
        if (this.attackAge < .55)
            return this.player.sample('m10-recovery', (this.attackAge - .16) / .39, dt);
        const spawnDuration = this.player.duration('m10-spawn');
        if (this.age < spawnDuration)
            return this.player.sample('m10-spawn', this.age / spawnDuration, dt);
        const name = shocked && this.feedback > 0 ? 'm10-shocked' : burning && this.feedback > 0 ? 'm10-burning' : moving > .3 ? 'm10-run' : 'm10-idle';
        const duration = this.player.duration(name);
        // Only renderer-managed waiting locomotion samples at30Hz. Native time,
        // roots and facing stay full rate; combat/status/spawn branches above
        // bypass this pose-only LOD, as do berth owners and direct rig studies.
        let poseDelta = dt;
        if (this.renderManaged && this.quietLocomotion && (name === 'm10-idle' || name === 'm10-run')) {
            const continuing = this.player.isCurrent(name);
            if (continuing && time - this.idlePoseTime < 1 / 30 - 1e-6) return true;
            poseDelta = continuing ? Math.min(.05, Math.max(dt, time - this.idlePoseTime)) : dt;
            this.idlePoseTime = time;
        }
        return this.player.sample(name, (time * (moving > .3 ? speed : 1) % duration) / duration, poseDelta, .06, name === 'm10-shocked' || name === 'm10-burning' ? this.feedback : 1);
    }
    death(cue: DeathCue, progress: number): number {
        this.setVisible(true);
        const name = DEATHS[cue];
        if (!this.player.has(name))
            return 0;
        this.player.sample(name, progress, 1 / 60, .025);
        return cue === 'frost' ? .24 : cue === 'burn' ? .65 : cue === 'arc' ? .48 : cue === 'acid' ? .72 : .40;
    }
    reset(): void {
        this.player.reset();
        this.previous = undefined;
        this.age = 0;
        this.hitAge = this.attackAge = 10;
        this.visible = true;
        this.renderManaged = false;
        this.quietLocomotion = false;
        this.idlePoseTime = -Infinity;
        this.phase = 'approach';
        this.progress = 0;
    }
}
