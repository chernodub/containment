/** Diagnostic-only reads. Never changes game state, inputs or native time. */
export function readDispatchSample(game) {
    const director = game.director.snapshot, od = game.abilities.snapshot.overdrive;
    const pending = game.pending;
    if (!Array.isArray(pending)) throw Error('Unrecognized native pending spawn queue');
    const spitters=game.enemies.snapshot.enemies.filter(e=>e.health>0&&e.type==='spitter');
    return {
        nodeId: game.node.id, elapsedMs: game.elapsed * 1000,
        directorElapsedMs: director.elapsedMs, dispatched: director.dispatched,
        phase: director.phase, concurrentCap: director.concurrentCap,
        live: game.enemies.activeCount, reserved: game.enemies.reservedCount,
        liveSpitters: {normal:spitters.filter(e=>!e.elite).length,elite:spitters.filter(e=>e.elite).length},
        pendingRequests: pending.length,
        pendingOccupancy: pending.reduce((n, p) => n + (p.type === 'carrier' ? 4 : 1), 0),
        overdrivesUsed: game.stats.overdrivesUsed,
        overdrive: {charge: od.charge, active: od.active, activeRemainingMs: od.activeRemainingMs,
            ready: od.ready, roomLimited: !!od.roomLimited},
    };
}

export class DispatchObservation {
    constructor(game) {
        const plan = game.director.plan;
        if (!Array.isArray(plan.schedule)) throw Error('Unrecognized native encounter schedule');
        this.data = {
            version: 1,
            limitation: 'Dispatch is bracketed by native game.update calls, including any internal split; live counts are observed before/after, not the exact internal cap argument. Ability phase events retain native elapsed timestamps.',
            schedule: plan.schedule.map(r => ({...r})),
            scheduledSpitters: {normal:plan.schedule.filter(r=>r.enemyId==='spitter'&&!r.elite).length,
                elite:plan.schedule.filter(r=>r.enemyId==='spitter'&&r.elite).length},
            start: readDispatchSample(game), end: null,
            dispatches: [], acceptedOverdrives: [], activeTransitions: [],
            meterTransitions: [], overdriveEvents: [], liveSeries: [],
        };
        this.data.liveSeries.push(this.data.start);
    }

    record(before, after, source) {
        if (before.nodeId !== after.nodeId || before.nodeId !== this.data.start.nodeId)
            throw Error('Observer crossed an unrecorded room transition');
        if (after.dispatched < before.dispatched) throw Error('Director dispatch count moved backwards');
        for (let index = before.dispatched; index < after.dispatched; index++) {
            const request = this.data.schedule[index];
            if (!request) throw Error('Dispatched request absent from original plan');
            this.data.dispatches.push({index, request, source,
                intervalStartMs: before.directorElapsedMs, intervalEndMs: after.directorElapsedMs,
                eligibilityDelayMinMs: Math.max(0, before.directorElapsedMs - request.atMs),
                eligibilityDelayMaxMs: Math.max(0, after.directorElapsedMs - request.atMs),
                before, after});
        }
        if (after.overdrivesUsed !== before.overdrivesUsed)
            this.data.acceptedOverdrives.push({source, before, after});
        if (after.overdrive.active !== before.overdrive.active)
            this.data.activeTransitions.push({source, active: after.overdrive.active, before, after});
        if (after.overdrive.ready !== before.overdrive.ready ||
            after.overdrive.roomLimited !== before.overdrive.roomLimited)
            this.data.meterTransitions.push({source, before, after});
        const last = this.data.liveSeries.at(-1);
        if (after.elapsedMs - last.elapsedMs >= 250 || after.live !== last.live ||
            after.reserved !== last.reserved || after.pendingOccupancy !== last.pendingOccupancy ||
            after.liveSpitters.normal !== last.liveSpitters.normal || after.liveSpitters.elite !== last.liveSpitters.elite)
            this.data.liveSeries.push(after);
        this.data.end = after;
    }

    effect(effect, game) {
        const a = effect.ability;
        if (effect.type !== 'ability' || a?.slot !== 'overdrive') return;
        this.data.overdriveEvents.push({elapsedMs: game.elapsed * 1000, ability: a.ability,
            phase: a.phase, durationMs: a.durationMs ?? null, totalDamage: a.totalDamage ?? null,
            targetIds: [...(a.targetIds ?? [])], denial: a.denial ?? null});
    }

    finish(game) {
        this.data.end = readDispatchSample(game);
        return this.data;
    }
}
