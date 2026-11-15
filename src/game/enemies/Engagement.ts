import {MELEE_ATTACKS} from './meleeAttacks';
import type {StandardEnemyId} from './types';

/** Stable local attack berths. The forward half-plane remains an escape lane. */
export type EngagementState = 'engaged' | 'waiting' | 'ranged';
export type AttackSlot = Readonly<{
    angle: number;
    radius: number;
}>;
export type EngagementBody = {
    id: number;
    type: string;
    x: number;
    y: number;
    radius: number;
    speed?: number;
    contactCooldownRemainingMs?: number;
    attackSlot?: AttackSlot;
    engagement?: EngagementState;
    meleePhase?: 'approach'|'windup'|'strike'|'recovery';
};
const angleDistance = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
const heavy = (body: EngagementBody) => MELEE_ATTACKS[body.type as StandardEnemyId]?.heavy === true;
export class Engagement {
    #escape = 0;
    #anchorX = Infinity;
    #anchorY = Infinity;
    readonly #bodies: EngagementBody[] = [];
    readonly #legalSamples = new Map<number, Uint8Array>();
    readonly #occupied: EngagementBody[] = [];
    #heavyOccupied = 0;
    readonly #occupiedX = new Float64Array(3);
    readonly #occupiedY = new Float64Array(3);
    readonly #candidates: EngagementBody[] = [];
    reset(): void {
        this.#escape = 0;
        this.#anchorX = Infinity;
        this.#anchorY = Infinity;
        this.#bodies.length = this.#occupied.length = this.#candidates.length = 0;
        this.#heavyOccupied = 0;
        this.#legalSamples.clear();
    }
    update<T extends EngagementBody>(bodies: Iterable<T>, player: {
        x: number;
        y: number;
        radius?: number;
        angle?: number;
    }, legal: (body: T, x: number, y: number) => boolean, escapeLegal: (x: number, y: number) => boolean): void {
        const actors = this.#bodies as T[];
        actors.length = 0;
        for (const body of bodies)
            actors.push(body);
        const pr = player.radius ?? 16;
        // Keep the lane stable while the marine stands still. Reconsider after moving
        // a body width; prefer a legal straight lane over pointing into architecture.
        const hasClose = actors.some(body => Math.hypot(body.x - player.x, body.y - player.y) <= 240);
        if (hasClose && Math.hypot(player.x - this.#anchorX, player.y - this.#anchorY) > 48) {
            this.#anchorX = player.x;
            this.#anchorY = player.y;
            const first = actors[0] as T | undefined;
            if (first)
                for (let i = 0; i < 16; i++) {
                    const a = (player.angle ?? 0) + i * Math.PI / 8;
                    if (escapeLegal(player.x + Math.cos(a) * 110, player.y + Math.sin(a) * 110)) {
                        this.#escape = a;
                        break;
                    }
                }
        }
        this.#occupied.length = 0;
        this.#heavyOccupied = 0;
        this.#candidates.length = 0;
        for (const samples of this.#legalSamples.values())
            samples.fill(0);
        const occupy = (body: EngagementBody, active = false) => {
            const i = this.#occupied.length, slot = body.attackSlot!;
            this.#occupiedX[i] = active ? body.x - player.x : Math.cos(slot.angle) * slot.radius;
            this.#occupiedY[i] = active ? body.y - player.y : Math.sin(slot.angle) * slot.radius;
            this.#occupied.push(body);
            if (heavy(body)) this.#heavyOccupied++;
        };
        const fits = (body: T, angle: number, radius: number, sample?: number) => {
            // Tangent enemies on the other half-plane leave >= one marine diameter
            // between the two bordering discs, including mixed crawler/brute radii.
            if (angleDistance(angle, this.#escape) < Math.PI / 2 + .025)
                return false;
            if (this.#occupied.length >= 3)
                return false;
            // A waiting heavy must not monopolize a berth that another family
            // can use while the one permitted heavy attack is in progress.
            if (heavy(body) && this.#heavyOccupied >= 1)
                return false;
            const rx = Math.cos(angle) * radius, ry = Math.sin(angle) * radius;
            for (let i = 0; i < this.#occupied.length; i++) {
                const other = this.#occupied[i];
                if (Math.hypot(rx - this.#occupiedX[i], ry - this.#occupiedY[i]) < body.radius + other.radius + 2)
                    return false;
            }
            const x = player.x + rx, y = player.y + ry;
            if (sample === undefined) {
                if (!legal(body, x, y))
                    return false;
            }
            else {
                let samples = this.#legalSamples.get(body.radius);
                if (!samples) {
                    samples = new Uint8Array(48);
                    this.#legalSamples.set(body.radius, samples);
                }
                if (samples[sample] === 0)
                    samples[sample] = legal(body, x, y) ? 1 : 2;
                if (samples[sample] === 2)
                    return false;
            }
            return true;
        };
        // An announced attack owns its berth through recovery. Player movement
        // must not recycle that ownership or steer its fixed strike origin.
        for (const body of actors) {
            if (!body.meleePhase || body.meleePhase === 'approach' || !body.attackSlot) continue;
            if (this.#occupied.length >= 3) {
                body.attackSlot = undefined;
                body.engagement = 'waiting';
                continue;
            }
            body.engagement = 'engaged';
            occupy(body, true);
        }
        for (const body of actors) {
            if (body.meleePhase && body.meleePhase !== 'approach' && body.attackSlot) continue;
            // Rest/control is not an attack reservation. Ready actors may take
            // these berths while the former owner holds the outer ring.
            if ((body.contactCooldownRemainingMs ?? 0) > 0 || body.speed === 0) {
                body.attackSlot = undefined;
                body.engagement = body.type === 'spitter' || body.type === 'carrier' ? 'ranged' : 'waiting';
                continue;
            }
            const ranged = (body.type === 'spitter' || body.type === 'carrier')&&
                Math.hypot(body.x-player.x,body.y-player.y)>pr+body.radius+20&&
                (!body.meleePhase||body.meleePhase==='approach');
            if (ranged) {
                body.attackSlot = undefined;
                body.engagement = 'ranged';
                continue;
            }
            if (Math.hypot(body.x - player.x, body.y - player.y) > 240) {
                body.attackSlot = undefined;
                body.engagement = 'waiting';
                continue;
            }
            const slot = body.attackSlot, radius = pr + body.radius + .25;
            if (slot && fits(body as T, slot.angle, radius)) {
                if (slot.radius !== radius)
                    body.attackSlot = Object.freeze({ angle: slot.angle, radius });
                body.engagement = 'engaged';
                occupy(body);
            }
            else {
                body.attackSlot = undefined;
                body.engagement = 'waiting';
                this.#candidates.push(body);
            }
        }
        // Nearest first, numeric ID breaks exact ties; existing owners are retained.
        this.#candidates.sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y) || a.id - b.id);
        for (const body of this.#candidates) {
            if (this.#occupied.length >= 3)
                break;
            if (heavy(body) && this.#heavyOccupied >= 1)
                continue;
            const radius = pr + body.radius + .25;
            let best = Infinity, angle: number | undefined;
            for (let i = 0; i < 48; i++) {
                const a = this.#escape + Math.PI / 2 + .025 + i * (Math.PI - .05) / 47;
                if (!fits(body as T, a, radius, i))
                    continue;
                const distance = Math.hypot(player.x + Math.cos(a) * radius - body.x, player.y + Math.sin(a) * radius - body.y);
                const rear = body.type === 'stalker' ? angleDistance(a, (player.angle ?? 0) + Math.PI) * 12 : 0;
                if (distance + rear < best) {
                    best = distance + rear;
                    angle = a;
                }
            }
            if (angle !== undefined) {
                body.attackSlot = Object.freeze({ angle, radius });
                body.engagement = 'engaged';
                occupy(body);
            }
        }
    }
    goal(body: EngagementBody, player: {
        x: number;
        y: number;
    }): {
        x: number;
        y: number;
    } | undefined {
        const slot = body.attackSlot;
        if (slot)
            return { x: player.x + Math.cos(slot.angle) * slot.radius, y: player.y + Math.sin(slot.angle) * slot.radius };
        if (body.type === 'spitter' || Math.hypot(body.x - player.x, body.y - player.y) > 240)
            return undefined;
        const radius = body.type === 'carrier' ? 170 : 100 + body.radius;
        const current = Math.atan2(body.y - player.y, body.x - player.x);
        // Waiting enemies hold a second ring instead of seeking the marine's center.
        const offset = Math.atan2(Math.sin(current - this.#escape), Math.cos(current - this.#escape));
        const angle = this.#escape + (offset < 0 ? -1 : 1) * Math.max(Math.PI / 2 + .15, Math.abs(offset));
        return { x: player.x + Math.cos(angle) * radius, y: player.y + Math.sin(angle) * radius };
    }
}
