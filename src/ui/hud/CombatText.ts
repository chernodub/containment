import type { DepthRenderer } from '../../render/DepthRenderer';
import { projectWorld, getViewportWidth, getViewportHeight, type ScreenPoint } from '../gameAdapter';
import type { HudEffect } from './effects';
import {hudObstructs, presentationObstructs} from './layout';
import {icon} from '../icons';
import {damageToken} from '../damageTokens';
export const COMBAT_TEXT_CAPACITY = 8;
export const COMBAT_TEXT_MERGE_SECONDS = .25;
type BodyBounds = {left:number;right:number;top:number;bottom:number};
type ActorBounds = BodyBounds & {id:number};
type Float = {
    node: HTMLDivElement;
    glyph: HTMLSpanElement;
    label: HTMLSpanElement;
    glyphs: SVGSVGElement[];
    life: number;
    age: number;
    x: number;
    y: number;
    target: number | undefined;
    clusterSize: number;
    amount: number;
    displayed: number;
    fromAmount: number;
    countAge: number;
    quiet: number;
    priority: number;
    kind: string;
    status: string;
    source: string;
    lethal: boolean;
    critical: boolean;
    width: number;
    height: number;
    point: ScreenPoint;
    floor: ScreenPoint;
    placedX: number;
    placedY: number;
    placed: boolean;
    baseWidth: number;
    baseHeight: number;
    fontSize: number;
    scale: number;
    ticks: number;
    pipsOnly: boolean;
};
const sourceLanes: Record<string, number> = {weapon: 0, ability: 1, status: 2, boon: 3};
const statusLabels: Record<string, string> = { ice: 'CHILLED', freeze: 'FROZEN', frost: 'CHILLED', shatter: 'SHATTER', fire: 'BURNING', burn: 'BURNING', poison: 'ACID', acid: 'ACID', shock: 'SHOCK', arc: 'SHOCK', overload: 'OVERLOAD' };
const statusGlyphs: Record<string, string> = {ice:'chill',frost:'chill',freeze:'freeze',shatter:'freeze',fire:'burn',burn:'burn',poison:'acid',acid:'acid',shock:'shock',arc:'shock',overload:'shock'};
const statusPriority: Record<string, number> = {freeze:6,shatter:6,shock:5,arc:5,overload:5,poison:4,acid:4,fire:3,burn:3,ice:2,frost:2};
/** A bounded DOM pool for direct hits and one aggregate per eligible cast. */
export class CombatText {
    private readonly pool: Float[] = [];
    private readonly pendingAbilityHits: HudEffect[] = [];
    private readonly clusterPoint: ScreenPoint = {x:0,y:0,visible:false};
    private readonly periodicHits = new Map<number,{effect:HudEffect;count:number;remaining:number}>();
    private readonly castHits = new Map<string, HudEffect[]>();
    private readonly eligibleCasts = new Set<string>();
    // Half-integers keep synthetic anchors distinct from native enemy and nest IDs.
    private clusterId = -.5;
    private enabled = true;
    private disposed = false;
    private reduced = false;
    private motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    private reducedMotion = this.motion.matches;
    private onMotion = () => { this.reducedMotion = this.motion.matches; };
    constructor(private host: HTMLElement, private renderer: DepthRenderer,
        private locateTarget: (id:number) => {x:number;y:number;elite?:boolean;armor?:number} | null,
        private playerPosition: () => {x:number;y:number}) {
        this.motion.addEventListener('change', this.onMotion);
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < COMBAT_TEXT_CAPACITY; i++) {
            const node = document.createElement('div');
            node.className = 'combat-float';
            node.hidden = true;
            const glyph = document.createElement('span'), label = document.createElement('span');
            glyph.className = 'status-chip-icon'; glyph.hidden = true;
            glyph.innerHTML = ['chill','freeze','burn','acid','shock'].map(name => icon(name)).join('');
            const glyphs = Array.from(glyph.querySelectorAll('svg'));
            for (const glyph of glyphs) glyph.setAttribute('hidden','');
            node.append(glyph, label);
            fragment.append(node);
            this.pool.push({ node,glyph,label,glyphs,life: 0, age: 0, x: 0, y: 0, target: undefined, clusterSize: 0, amount: 0, displayed: 0, fromAmount: 0, countAge: 0, quiet: 0, priority: 0, kind: 'damage', status: '', source: '', lethal: false, critical: false, width: 75, height: 40, baseWidth:75,baseHeight:40,fontSize:34,scale:1,ticks:0,pipsOnly:false,placedX:0,placedY:0,placed:false,point: { x: 0, y: 0, visible: false },floor:{x:0,y:0,visible:false} });
        }
        host.append(fragment);
    }
    setEnabled(enabled: boolean): void { if (this.enabled && !enabled)
        this.clear(); this.enabled = enabled; }
    /** Reduced feedback retains damage totals and kills, with no status chips. */
    setReduced(reduced: boolean): void { if (this.reduced !== reduced) this.clear(); this.reduced = reduced; }
    get needsAggregateClearance() {
        return this.castHits.size > 0 || this.pool.some(entry => entry.clusterSize > 1 && entry.life > 0);
    }
    effect(e: HudEffect): void {
        if (!this.enabled || this.disposed)
            return;
        if (e.type === 'hit' && e.source === 'status' && this.queuePeriodic(e)) return;
        if (e.type === 'hit' && e.source === 'ability') {
            this.pendingAbilityHits.push(e);
            return;
        }
        const event = e.ability;
        if (event) {
            const key = event.ability;
            if (event.phase === 'cast' && (event.slot === 'power' || event.slot === 'overdrive')) {
                this.eligibleCasts.add(key);
            }
            if (event.targetIds?.length) {
                const matched = this.castHits.get(key) ?? [];
                let remaining = 0;
                for (const hit of this.pendingAbilityHits) {
                    if (!event.targetIds.includes(hit.targetId ?? hit.id ?? Infinity)) {
                        this.pendingAbilityHits[remaining++] = hit;
                        continue;
                    }
                    if (event.phase !== 'tick' && this.eligibleCasts.has(key)) matched.push(hit);
                    else if (event.phase !== 'tick' || !this.queuePeriodic({...hit,source:'status'})) this.hitPips(hit);
                }
                this.pendingAbilityHits.length = remaining;
                if (matched.length) this.castHits.set(key, matched);
            }
            if (event.phase === 'end') this.eligibleCasts.delete(key);
        }
        this.showEffect(e);
    }
    private hitPips(effect: HudEffect): void {
        const target = effect.targetId ?? effect.id;
        if (target !== undefined && effect.damage && effect.damage > 0) this.renderer.noteHitPips(target);
    }
    private queuePeriodic(effect: HudEffect): boolean {
        const target = effect.targetId ?? effect.id;
        if (target === undefined || !effect.damage || !Number.isFinite(effect.damage) || effect.damage <= 0) return false;
        const pending = this.periodicHits.get(target);
        const count = (pending?.count ?? 0) + 1;
        if (effect.lethal) {
            this.periodicHits.delete(target);
            if (count === 1) this.showEffect(effect);
            else this.renderer.noteHitPips(target,count);
        } else {
            this.periodicHits.set(target,{effect,count,remaining:pending?.remaining ?? .5});
        }
        return true;
    }
    private showAggregate(hits: readonly HudEffect[]): void {
        const damaging = hits.filter(hit => hit.damage && hit.damage > 0);
        if (!damaging.length) return;
        if (damaging.length === 1) { this.showEffect(damaging[0]); return; }
        const x = damaging.reduce((sum, hit) => sum + hit.x, 0)/damaging.length;
        const y = damaging.reduce((sum, hit) => sum + hit.y, 0)/damaging.length;
        const player = this.playerPosition();
        const angle = Math.atan2(y-player.y,x-player.x);
        const dx = Math.cos(angle), dy = Math.sin(angle);
        let reach = Math.max(...damaging.map(hit => (hit.x-x)*dx+(hit.y-y)*dy)) + 45;
        for (let step = 0; step < 4 && !projectWorld(this.renderer,x+dx*reach,y+dy*reach,this.clusterPoint,1.2).visible; step++) reach *= .5;
        const total = damaging.reduce((sum, hit) => sum + hit.damage!, 0);
        this.add(x+dx*reach,y+dy*reach,this.clusterId--,total,'damage',
            damaging[0].damageElement ?? damaging[0].element ?? '',damaging.some(hit=>hit.lethal),
            false,'ability',false,damaging.length);
    }
    private showEffect(e: HudEffect, periodic = e.source === 'status'): void {
        const target = e.targetId ?? e.id;
        const element = e.source === 'weapon' ? 'weapon' : e.damageElement ?? e.element ?? (e.elements?.length === 1 ? e.elements[0] : undefined) ?? (typeof e.source === 'string' && statusLabels[e.source] ? e.source : e.type === 'acid' && !e.source ? 'acid' : '');
        const victim = target === undefined ? null : this.locateTarget(target);
        const chip = e.source === 'weapon' && !e.lethal && !e.critical && !e.elite && !victim?.elite &&
            !(e.contact === 'armor' && victim?.armor === 0);
        if (!chip && (e.type === 'hit' || e.type === 'acid' || e.contact) && typeof e.damage === 'number' && e.damage > 0 && Number.isFinite(e.damage))
            this.add(e.x, e.y, target, e.damage, 'damage', element, !!e.lethal, !!e.critical, typeof e.source === 'string' && Object.hasOwn(sourceLanes, e.source) ? e.source : '', periodic);
        if (chip) this.hitPips(e);
        // Never invent damage totals for old events. Element labels acknowledge real status events.
        if (e.type === 'hit' && e.elements)
            for (const element of e.elements) {
                const label = statusLabels[element];
                if (label)
                    this.add(e.x, e.y, target, 0, 'status', element, false);
            }
        if (e.type === 'boon' && e.boon && statusLabels[e.boon])
            this.add(e.x, e.y, target, 0, 'status', e.boon, false);
    }
    private add(x: number, y: number, target: number | undefined, amount: number, kind: string, status: string, lethal: boolean, critical = false, source = '', periodic = false, clusterSize = 0): void {
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        if (this.reduced && kind === 'status') return;
        const sameTarget = (p: Float) => target !== undefined ? p.target === target : Math.hypot(p.x-x,p.y-y)<(kind === 'status'?72:25);
        // A target receives one terminal mark. Late duplicate status/area receipts
        // must not recreate a cloud around an actor already confirmed killed.
        const killed = this.pool.find(p => p.life > 0 && p.lethal && sameTarget(p));
        if (killed) return;
        const currentStatus = kind === 'status' ? this.pool.find(p => p.life > 0 && p.kind === 'status' && sameTarget(p)) : undefined;
        if (currentStatus && (statusPriority[currentStatus.status] ?? 0) > (statusPriority[status] ?? 0)) return;
        let entry = currentStatus ?? this.pool.find(p => p.life > 0 && p.kind === kind && sameTarget(p) && (p.source === 'status') === periodic);
        const merge = !periodic && !!entry && entry.quiet <= COMBAT_TEXT_MERGE_SECONDS;
        if (merge && kind === 'damage' && target !== undefined) {
            this.renderer.noteHitPips(target, entry!.pipsOnly ? 1 : 2);
            entry!.pipsOnly = true;
            entry!.node.hidden = true;
            entry!.quiet = 0;
            entry!.life = .4;
            return;
        }
        const total = amount;
        const priority = lethal ? 4 : !periodic && (critical || total >= 30) ? 3 : !periodic && kind === 'damage' ? 2 : periodic ? 1 : 0;
        if (!entry) entry = this.pool.find(p => p.life <= 0);
        if (!entry) {
            // Kills outrank substantial hits, which outrank routine ticks/chips.
            // Within a tier retire the oldest receipt, never a newer higher tier.
            let lowest = this.pool[0];
            for (const p of this.pool) if (p.priority < lowest.priority || p.priority === lowest.priority && (p.amount < lowest.amount || p.amount === lowest.amount && p.quiet > lowest.quiet)) lowest = p;
            if (lowest.priority > priority || lowest.priority === priority && lowest.amount > total) return;
            entry = lowest;
        }
        if (lethal) for (const p of this.pool) if (p !== entry && p.life > 0 && sameTarget(p)) {p.life=0;p.node.hidden=true;}
        entry.pipsOnly = false;
        entry.fromAmount = merge ? entry.displayed : amount;
        entry.amount = total;
        entry.displayed = this.reducedMotion || lethal ? total : entry.fromAmount;
        entry.countAge = 0;
        entry.quiet = 0;
        entry.priority = priority;
        entry.lethal = lethal;
        entry.critical = critical || merge && entry.critical;
        const color = status || (merge ? entry.status : '');
        entry.x = x;
        entry.y = y;
        entry.target = target;
        entry.clusterSize = clusterSize;
        entry.age = merge ? entry.age : 0;
        entry.life = clusterSize > 1 ? .55 : kind === 'damage' ? .4 : .8;
        entry.node.dataset.aggregate = String(clusterSize > 1);
        entry.ticks = periodic ? (merge ? entry.ticks : 0) + 1 : 0;
        entry.node.dataset.ticks = String(entry.ticks);
        entry.kind = kind;
        entry.status = color;
        entry.source = source;
        entry.node.dataset.source = source;
        entry.node.dataset.target = target === undefined ? '' : String(target);
        entry.node.dataset.total = String(Math.round(entry.amount));
        entry.node.dataset.settled = String(entry.lethal);
        entry.node.dataset.priority = String(priority);
        entry.node.hidden = false;
        const label = kind === 'damage' ? this.damageLabel(entry, entry.amount) : statusLabels[status];
        entry.label.textContent = kind === 'damage' ? this.damageLabel(entry, entry.displayed) : label;
        if (kind === 'status') {entry.node.title = label; entry.node.setAttribute('aria-label', label);}
        else {entry.node.removeAttribute('title'); entry.node.removeAttribute('aria-label');}
        entry.glyph.hidden = kind !== 'status';
        if (kind === 'status') for (const glyph of entry.glyphs) glyph.toggleAttribute('hidden', glyph.dataset.icon !== statusGlyphs[status]);
        entry.node.dataset.kind = kind;
        entry.node.dataset.element = color;
        entry.node.dataset.damageToken = damageToken(color);
        entry.node.dataset.critical = String(entry.critical);
        const fontSize = clusterSize > 1 ? 13 : kind === 'status' ? 12 : entry.lethal ? 29 : entry.critical ? 28 : 18;
        entry.fontSize = fontSize;
        entry.baseWidth = kind === 'status' ? 26 : Math.max(28, Math.ceil(label.length * fontSize * .7) + 6);
        entry.baseHeight = kind === 'status' ? 26 : fontSize + 5;
        entry.width = entry.baseWidth; entry.height = entry.baseHeight;
        entry.node.dataset.lethal = String(entry.lethal);
    }
    private damageLabel(entry: Float, amount: number): string {
        const hits = entry.clusterSize;
        const value = hits > 1 ? `${Math.round(amount)} (${hits} hits)` : String(Math.round(amount));
        return entry.lethal ? `${value} ×` : value;
    }
    tick(dt: number, player: BodyBounds, threats: readonly ActorBounds[], bodies: readonly ActorBounds[]): void {
        for (const [ability,hits] of this.castHits) {
            this.showAggregate(hits);
            this.eligibleCasts.delete(ability);
        }
        this.castHits.clear();
        for (const hit of this.pendingAbilityHits) this.hitPips(hit);
        this.pendingAbilityHits.length = 0;
        for (const [id,pending] of this.periodicHits) {
            pending.remaining -= dt;
            if (pending.remaining > 0) continue;
            this.periodicHits.delete(id);
            if (pending.count === 1) this.showEffect(pending.effect);
            else this.renderer.noteHitPips(id,pending.count);
        }
        const w = getViewportWidth(this.renderer), h = getViewportHeight(this.renderer);
        for (const p of this.pool) p.placed = false;
        for (const p of [...this.pool].sort((a,b) => b.priority-a.priority || b.amount-a.amount)) {
            if (p.life <= 0)
                continue;
            p.life = Math.max(0, p.life - dt);
            p.age += dt;
            p.quiet += dt;
            p.countAge += dt;
            if (p.kind === 'damage') {
                const progress = this.reducedMotion || p.lethal ? 1 : Math.min(1, p.countAge / .12);
                p.displayed = p.fromAmount + (p.amount - p.fromAmount) * (1 - (1-progress) ** 3);
                p.label.textContent = this.damageLabel(p, p.displayed);
                p.node.dataset.settled = String(p.lethal || p.quiet >= COMBAT_TEXT_MERGE_SECONDS);
            }
            if (!p.life || p.pipsOnly) {
                p.node.hidden = true;
                continue;
            }
            const point = projectWorld(this.renderer, p.x, p.y, p.point, 1.2);
            if (!point.visible || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
                p.node.hidden = true;
                continue;
            }
            if (this.reduced && !p.lethal && p.source === 'status' && p.amount < 30) {p.node.hidden=true;continue;}
            p.node.hidden = false;
            // G1 projects world height through its follow camera. Legacy facades
            // that do not project height keep the authored one-to-one font sizes.
            projectWorld(this.renderer, p.x, p.y, p.floor, 0);
            const projectedHeight = Math.abs(point.y - p.floor.y);
            p.scale = projectedHeight > 1 ? Math.max(.9, Math.min(1.25, projectedHeight / 44)) : 1;
            p.width = Math.ceil(p.baseWidth * p.scale); p.height = Math.ceil(p.baseHeight * p.scale);
            p.node.style.fontSize = `${p.fontSize * p.scale}px`;
            p.node.style.setProperty('--actor-scale', String(p.scale));
            const rise = this.reducedMotion ? 0 : 26 * (1 - Math.exp(-p.age * 6));
            let x = Math.max(8, Math.min(w - p.width - 8, point.x - p.width / 2));
            let y = Math.max(8, Math.min(h - p.height - 8, point.y - p.height - 10 - rise - (p.kind === 'status' ? 48 : 0)));
            const attacker = threats.find(threat => threat.id === p.target);
            if (attacker) {
                if (p.ticks || p.source === 'status') {p.node.hidden = true;continue;}
                const centerX = (attacker.left + attacker.right) / 2;
                const centerY = (attacker.top + attacker.bottom) / 2;
                const dx = centerX - (player.left + player.right) / 2;
                const dy = centerY - (player.top + player.bottom) / 2;
                if (Math.abs(dx) >= Math.abs(dy)) {
                    x = dx >= 0 ? attacker.right + 14 : attacker.left - p.width - 14;
                    y = centerY - p.height / 2;
                } else {
                    x = centerX - p.width / 2;
                    y = dy >= 0 ? attacker.bottom + 14 : attacker.top - p.height - 14;
                }
            }
            if (x < player.right + 8 && x + p.width > player.left - 8 && y < player.bottom + 8 && y + p.height > player.top - 8) {
                if (player.top >= p.height + 20) y = player.top - p.height - 12 - (p.kind === 'status' ? 20 : 0);
                else if (player.bottom + p.height + 20 <= h) y = player.bottom + 12;
                else if (player.left >= p.width + 20) x = player.left - p.width - 12;
                else if (player.right + p.width + 20 <= w) x = player.right + 12;
                else {p.node.hidden = true; continue;}
                y = Math.max(8, y);
            }
            // Enemy feedback yields to opaque furniture rather than covering vital copy.

            // Nearby enemies have independent receipts; deterministic fan-out
            // preserves each total while preventing cross-target text piles.
            const originX = x, originY = y;
            let placed = false;
            for (let attempt = 0; attempt < (attacker ? 1 : 9); attempt++) {
                const row = p.clusterSize > 1 ? [0,-1,1][Math.floor(attempt/3)] : -Math.floor((attempt+1)/3);
                const side = attempt % 3;
                x = Math.max(8, Math.min(w - p.width - 8, originX + (side === 1 ? -1 : side === 2 ? 1 : 0) * (p.width + 8)));
                y = Math.max(8, Math.min(h - p.height - 8, originY + row * (p.height + 6)));
                if (x < player.right + 8 && x + p.width > player.left - 8 && y < player.bottom + 8 && y + p.height > player.top - 8) continue;
                if (hudObstructs(x,y,x+p.width,y+p.height) || presentationObstructs(x,y,x+p.width,y+p.height)) continue;
                if (this.renderer.warningObstructs(x-8,y-8,x+p.width+8,y+p.height+8)) continue;
                if ((p.clusterSize > 1 ? bodies : threats).some(body => x < body.right + 8 && x + p.width > body.left - 8 &&
                    y < body.bottom + 8 && y + p.height > body.top - 8)) continue;
                let occupied = false;
                for (const other of this.pool) {
                    if (!other.placed) continue;
                    if (x < other.placedX + other.width + 4 && x + p.width + 4 > other.placedX && y < other.placedY + other.height + 4 && y + p.height + 4 > other.placedY) {occupied = true;break;}
                }
                if (occupied) continue;
                placed = true; break;
            }
            if (!placed) {p.node.hidden=true;continue;}
            p.placed = true; p.placedX = x; p.placedY = y;
            p.node.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
            p.node.style.opacity = String(Math.min(1, p.life / .2));
        }
    }
    clear(): void { this.castHits.clear(); this.eligibleCasts.clear(); this.periodicHits.clear(); this.pendingAbilityHits.length = 0; for (const p of this.pool) {
        p.life = 0;
        p.node.hidden = true;
    } }
    dispose(): void { this.disposed = true; this.motion.removeEventListener('change', this.onMotion); this.clear(); for (const p of this.pool)
        p.node.remove(); this.pool.length = 0; }
}
