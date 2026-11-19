import type {HudEffect} from './effects';

type Cue = {x: number; y: number; life: number; kind: HudEffect['encounterCue']; beat: number};

export class EncounterCues {
    readonly locations: Cue[] = Array.from({length: 3}, () => ({x: 0, y: 0, life: 0, kind: undefined, beat: -1}));
    private canceled = 0;
    private beat = -1;

    effect(event: HudEffect, beat: number) {
        const kind = event.encounterCue;
        if (!kind) return;
        const x = event.cueX ?? event.x, y = event.cueY ?? event.y;
        if (kind === 'priority' || kind === 'escort-broken' || kind === 'pincer-broken') {
            this.set(this.locations[2], x, y, kind === 'priority' ? 0 : 2, kind, beat);
            return;
        }
        let slot: Cue | undefined;
        for (let i = 0; i < 2; i++) {
            const cue = this.locations[i];
            if (cue.beat === beat && Math.hypot(cue.x - x, cue.y - y) < 100) return;
            if (cue.beat !== beat && !slot) slot = cue;
        }
        if (slot) this.set(slot, x, y, 1, kind, beat);
    }

    private set(cue: Cue, x: number, y: number, life: number, kind: Cue['kind'], beat: number) {
        cue.x = x;
        cue.y = y;
        cue.kind = kind;
        cue.life = life;
        cue.beat = beat;
    }

    update(beat: number, canceled: number): string {
        if (beat !== this.beat) {
            this.beat = beat;
            this.canceled = 0;
        }
        const leader = this.locations[2];
        if (canceled > this.canceled && leader.beat === beat && leader.kind === 'priority') leader.life = 1;
        this.canceled = canceled;
        if (leader.life > 0 && leader.kind === 'pincer-broken') return 'PINCER BROKEN — flank sealed';
        if (leader.life > 0) return leader.kind === 'escort-broken' ? 'ESCORT BROKEN' : 'Leader down · reinforcements stopped';
        for (const cue of this.locations) {
            if (cue.life <= 0) continue;
            if (cue.kind === 'crossfire') return 'Crossfire opening · break a firing lane';
            if (cue.kind === 'flank') return 'Flank arriving · watch the side breach';
        }
        return '';
    }

    tick(dt: number) {
        for (const cue of this.locations) cue.life = Math.max(0, cue.life - dt);
    }

    clear() {
        this.beat = -1;
        this.canceled = 0;
        for (const cue of this.locations) this.set(cue, 0, 0, 0, undefined, -1);
    }
}
