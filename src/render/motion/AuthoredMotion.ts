import * as T from 'three';
import type { MarineMotion } from './MarineMotion';
import type { EnemyAttackPhase } from './EnemyMotion';
import type {TargetElement} from './OverdriveReactions';
import type { DeathCue } from '../DeathRagdolls';
const RUNS = Array.from({ length: 8 }, (_, i) => `m10-run-${i * 45}`);
const STARTS = Array.from({ length: 8 }, (_, i) => `m10-start-${i * 45}`);
const STOPS = Array.from({ length: 8 }, (_, i) => `m10-stop-${i * 45}`);
const REVERSALS = Array.from({ length: 8 }, (_, i) => `m10-reversal-${i * 45}`);
const DIRECTIONS = ['front', 'right', 'back', 'left'];
const MARINE_HITS = DIRECTIONS.map(side => `m10-hit-${side}`);
const MARINE_DEATHS = ['m10-death', 'm10-death-right', 'm10-death-back', 'm10-death-left'];
const LIGHT_HITS = DIRECTIONS.map(side => `m10-hit-light-${side}`);
const RIFLE_HITS = DIRECTIONS.map(side => `m10-hit-rifle-${side}`);
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
// All pooled copies of a caste bind the same immutable reaction tracks.
const reactionLayers = new WeakMap<T.AnimationClip,T.AnimationClip>();
function reactionLayer(clip: T.AnimationClip): T.AnimationClip {
    let layer = reactionLayers.get(clip);
    if (!layer) {
        layer = clip.clone();
        layer.name += '-reaction';
        const rifle = clip.name.startsWith('m10-hit-rifle-');
        layer.tracks = layer.tracks.filter(track =>
            (track.name.endsWith('.quaternion') && !/^(?:ik|eye|antenna|finger|tongue)/i.test(track.name))
            || (rifle && /^(?:chest|torso|body|bum)\.position$/.test(track.name)));
        T.AnimationUtils.makeClipAdditive(layer, 0, clip, 60);
        reactionLayers.set(clip, layer);
    }
    return layer;
}
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
                if (localMatrixRoot && (clip.name.startsWith('m10-hit-') || clip.name.startsWith('m10-overdrive-') || clip.name === 'm10-stagger')) {
                    const layer = mixer.clipAction(reactionLayer(clip));
                    layer.setLoop(T.LoopOnce, 1);
                    layer.clampWhenFinished = layer.paused = true;
                    this.upper.set(clip.name, layer);
                }
                if (upperNames.size && (clip.name === 'm10-reload' || clip.name === 'm10-switch' || clip.name.startsWith('m10-fire-'))) {
                    const layer = clip.clone();
                    layer.name = clip.name + '-upper';
                    // Blender optimizes constant channels independently per clip. An absent
                    // reference translation would stay absolute in makeClipAdditive,
                    // adding the rest offset again and separating the limb armor.
                    // Upper actions/grips change articulation; local bone offsets
                    // and scale remain owned by the full base pose.
                    const firing = clip.name.startsWith('m10-fire-');
                    layer.tracks = layer.tracks.filter(track =>
                        (upperNames.has(T.PropertyBinding.parseTrackName(track.name).nodeName) && track.name.endsWith('.quaternion'))
                        || (firing && (track.name === 'spine.quaternion' || track.name === 'shoulderR.position')));
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
                    layer.tracks = layer.tracks.filter(track => upperNames.has(T.PropertyBinding.parseTrackName(track.name).nodeName) && track.name.endsWith('.quaternion'));
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
        // Three's PropertyBinding marks a bone dirty only when the mixer
        // writes a different value. Compose those locals before propagation.
        // The first sample also takes ownership from automatic updates.
        for (const bone of this.localMatrixBones) {
            if (bone.matrixAutoUpdate || bone.matrixWorldNeedsUpdate) {
                bone.matrixAutoUpdate = false;
                bone.updateMatrix();
            }
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
    overlay(name: string, progress: number, amplitude = 1): void {
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
        action.setEffectiveWeight(amplitude);
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
    private burstRise = 0;
    barrelLift = 0;
    carryPitch = 0;
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
        this.burstRise *= Math.exp(-dt * 5.5);
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
            if (weapon === 'rifle') this.burstRise = Math.min(.075, this.burstRise + .033);
            this.fireAge = 0;
            this.switchAge = 10;
        }
        this.motion.rifleLoad = weapon === 'rifle' ? this.burstRise / .075 : 0;
        this.recoil = recoil;
        const kick = weapon === 'rifle' ? .13 : weapon === 'shotgun' ? .24 : 0;
        const rise = Math.min(1, (this.fireAge + 1 / 120) * 56);
        this.barrelLift = !reload && !this.motion.actionName ?
            this.feedback * (kick * rise * Math.exp(-this.fireAge * 28) + (weapon === 'rifle' ? this.burstRise : 0)) : 0;
        this.carryPitch = moving && this.fireAge > .18 && !reload && !this.motion.actionName
            ? .032 * Math.sin((this.gait - .10) * Math.PI * 2) * Math.min(1, speed / 220) * this.feedback : 0;
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
        this.motion.rifleLoad = 0;
        this.burstRise = this.barrelLift = this.carryPitch = this.recoil = 0;
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
    private facing = 0;
    private heavy = false;
    private repeated = false;
    private rifle = false;
    private rifleContactAge = Infinity;
    private layered = false;
    private attackAge = 10;
    private element: TargetElement | undefined;
    private elementAge = 10;
    reactToElement(element: TargetElement): void {
        if (this.feedback <= 0 || this.element === element && this.elementAge < .60) return;
        this.element = element;
        this.elementAge = 0; this.elementFrames = 0;
    }
    private elementFrames = 0;
    get elementalHold(): boolean { return this.element !== undefined && this.elementAge < .62; }
    get flashedOut(): boolean { return this.elementalHold && (this.elementFrames > 2 || this.elementAge >= 2/60); }
    get exposedIce(): boolean { return this.elementalHold && this.element === 'ice' && this.elementAge >= .09; }
    advanceContact(dt: number): void {
        if (!this.elementalHold || dt <= 0) return;
        this.elementFrames++;
        this.elementAge += dt;
    }
    private contactPose(seconds: number, terminal: boolean): number {
        // Keep the graphic silhouette for .31s after the joint break.
        const key = this.element === 'fire' ? .71 : this.element === 'arc' ? .18 : this.element === 'ice' ? .49 : .47;
        const arrival = this.element === 'fire' ? .15 : .105;
        if (seconds < arrival) return key * T.MathUtils.smoothstep(seconds, 0, arrival);
        return T.MathUtils.lerp(key, terminal ? .99 : 1, T.MathUtils.smoothstep(seconds, .415, .62));
    }
    private phase: EnemyAttackPhase = 'approach';
    private progress = 0;
    private feedback = 1;
    private visible = true;
    private renderManaged = false;
    private quietLocomotion = false;
    private idlePoseTime = -Infinity;
    constructor(readonly player: AuthoredMotionPlayer, private readonly family = '') { }
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
    hit(strength: number, direction: number, heavy: boolean, weapon?: string): void {
        if (strength > 0 && this.feedback > 0) {
            // Several pellets delivered in one snapshot belong to one impact.
            if (weapon === 'rifle') {
                const followUp = this.rifleContactAge < .20;
                this.rifleContactAge = 0;
                if (followUp && this.rifle && !this.repeated && this.hitAge < .18) return;
                this.repeated = followUp;
            } else if (this.hitAge > 0) this.repeated = this.hitAge < .20;
            this.hitAge = 0;
            this.hitDirection = direction;
            this.rifle = weapon === 'rifle' && this.player.has(RIFLE_HITS[0]);
            this.heavy = this.rifle ? false : heavy || this.repeated;
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
        this.facing = aim;
        if (frozen) {
            if (this.exposedIce && this.visible) this.player.sample('m10-death-frost', this.contactPose(this.elementAge,true), 1/60, .018, this.feedback);
            return true;
        }
        this.age += dt;
        this.hitAge += dt;
        this.rifleContactAge += dt;
        this.attackAge += dt;
        // Only pose evaluation is suspended. Native phase inputs and all local
        // ages keep advancing, so returning actors never replay missed actions.
        if (!this.visible) return true;
        // A fresh native warning/strike must remain visible after thaw even
        // when an older hit reaction was held by the frozen visual clock.
        const hit = this.family === 'carrier' && this.repeated && this.heavy ? 'm10-stagger'
            : (this.rifle && !this.repeated ? RIFLE_HITS : this.heavy ? HEAVY_HITS : LIGHT_HITS)[directionIndex(this.hitDirection, aim)];
        const durationHit = this.player.duration(hit);
        const reactionWeight = this.feedback * (this.rifle && this.repeated ? .23 : 1);
        const reacting = this.hitAge < durationHit;
        const elementClip = !this.elementalHold ? '' : this.element === 'arc' ? 'm10-overdrive-arc'
            : this.element === 'fire' ? 'm10-overdrive-fire' : this.element === 'kinetic' ? 'm10-overdrive-kinetic' : '';
        if (this.phase !== 'approach' || winding) {
            const windup = this.phase === 'windup' || this.phase === 'approach';
            const base = windup ? 'm10-windup' : this.phase === 'strike' ? 'm10-strike' : 'm10-recovery';
            const progress = this.phase === 'approach' ? anticipation : this.progress;
            if (reacting || elementClip) {
                this.player.beginBatch();
                this.player.clearUpper();
                this.player.sample(base, progress, dt, .025);
                this.player.overlay(elementClip || hit, elementClip ? this.contactPose(this.elementAge,false) : this.hitAge / durationHit, elementClip ? this.feedback * .60 : reactionWeight * .78);
                this.player.endBatch();
                this.layered = true;
                return true;
            }
            this.clearReaction();
            return this.player.sample(base, progress, dt, this.phase === 'strike' ? 0 : .025);
        }
        if (this.rifle && reacting && !elementClip) {
            const base = this.attackAge < .16 ? 'm10-strike' : this.attackAge < .55 ? 'm10-recovery'
                : moving > .3 ? 'm10-run' : 'm10-idle';
            const cycle = this.player.duration(base);
            const progress = this.attackAge < .16 ? this.attackAge / .16 : this.attackAge < .55
                ? (this.attackAge - .16) / .39 : (time * (moving > .3 ? speed : 1) % cycle) / cycle;
            this.player.beginBatch();
            this.player.clearUpper();
            this.player.sample(base, progress, dt, .04);
            this.player.overlay(hit, this.hitAge / durationHit, reactionWeight);
            this.player.endBatch();
            this.layered = true;
            return true;
        }
        this.clearReaction();
        if (this.element === 'ice' && this.elementAge < .09) return true;
        if (this.exposedIce) return this.player.sample('m10-death-frost', this.contactPose(this.elementAge,true), dt, .025, this.feedback);
        if (elementClip) return this.player.sample(elementClip, this.contactPose(this.elementAge,false), dt, .025, this.feedback);
        if (reacting)
            return this.player.sample(hit, this.hitAge / durationHit, dt, this.rifle ? .009 : .026, this.feedback);
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
    private clearReaction(): void {
        if (this.layered) {
            this.player.clearUpper();
            this.layered = false;
        }
    }
    terminalCue(cue: DeathCue): DeathCue {
        if (this.elementalHold) {
            if (this.element === 'ice') cue = 'frost';
            else if (this.element === 'arc') cue = 'arc';
            else if (this.element === 'fire') cue = 'burn';
        }
        return cue;
    }
    death(cue: DeathCue, progress: number): number {
        this.clearReaction();
        this.setVisible(true);
        cue = this.terminalCue(cue);
        if (this.elementalHold) {
            const seconds=progress*.64;
            if (this.element !== 'ice' || seconds >= .08) {
                const take=this.element === 'kinetic' ? 'm10-death-kinetic' : DEATHS[cue];
                this.player.sample(take,this.contactPose(seconds,true),1/60,.027);
            }
            return .64;
        }
        if (cue === 'frost' && progress < .26) return .24;
        const name = DEATHS[cue];
        if (!this.player.has(name))
            return 0;
        const carryHit = cue === 'none' && this.hitAge < .20;
        // A single fatal shotgun contact has no preceding living impact frame.
        // Give its shoulder the first beat. Rapid follow-up shots inherit the skid.
        const contactEnd = this.repeated ? .12 : .21;
        if (carryHit && progress < contactEnd) {
            if (!this.repeated && this.heavy) {
                const hit = HEAVY_HITS[directionIndex(this.hitDirection, this.facing)];
                this.player.sample(hit, .09 + .25 * progress / contactEnd, 1 / 60, .028, this.feedback);
            }
            return .40;
        }
        const phase = carryHit ? (progress - contactEnd) / (1 - contactEnd) : progress;
        this.player.sample(name, phase, 1 / 60, carryHit ? .075 : .025);
        return cue === 'frost' ? .24 : cue === 'burn' ? .65 : cue === 'arc' ? .48 : cue === 'acid' ? .72 : .40;
    }
    reset(): void {
        this.player.reset();
        this.previous = undefined;
        this.age = 0;
        this.element = undefined; this.elementAge = 10;
        this.rifleContactAge = Infinity;
        this.hitAge = this.attackAge = 10;
        this.visible = true;
        this.renderManaged = false;
        this.quietLocomotion = false;
        this.idlePoseTime = -Infinity;
        this.rifle = this.repeated = this.heavy = this.layered = false;
        this.phase = 'approach';
        this.progress = 0;
    }
}
