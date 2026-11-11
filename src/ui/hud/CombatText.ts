import type { DepthRenderer } from '../../render/DepthRenderer';
import { projectWorld, type ScreenPoint } from '../gameAdapter';
import type { HudEffect } from './effects';
import {hudObstructs} from './layout';
import {icon} from '../icons';
export const COMBAT_TEXT_CAPACITY = 28;
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
    amount: number;
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
};
const sourceLanes: Record<string, number> = {weapon: 0, ability: 1, status: 2, boon: 3};
const statusLabels: Record<string, string> = { ice: 'CHILLED', freeze: 'FROZEN', frost: 'CHILLED', shatter: 'SHATTER', fire: 'BURNING', burn: 'BURNING', poison: 'ACID', acid: 'ACID', shock: 'SHOCK', arc: 'SHOCK', overload: 'OVERLOAD' };
const statusGlyphs: Record<string, string> = {ice:'chill',frost:'chill',freeze:'freeze',shatter:'freeze',fire:'burn',burn:'burn',poison:'acid',acid:'acid',shock:'shock',arc:'shock',overload:'shock'};
/** A bounded DOM pool; same-target pellets merge instead of covering the encounter. */
export class CombatText {
    private readonly pool: Float[] = [];
    private enabled = true;
    private disposed = false;
    private motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    private reducedMotion = this.motion.matches;
    private onMotion = () => { this.reducedMotion = this.motion.matches; };
    constructor(private host: HTMLElement, private renderer: DepthRenderer) {
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
            this.pool.push({ node,glyph,label,glyphs,life: 0, age: 0, x: 0, y: 0, target: undefined, amount: 0, kind: 'damage', status: '', source: '', lethal: false, critical: false, width: 75, height: 40, baseWidth:75,baseHeight:40,fontSize:34,scale:1,placedX:0,placedY:0,placed:false,point: { x: 0, y: 0, visible: false },floor:{x:0,y:0,visible:false} });
        }
        host.append(fragment);
    }
    setEnabled(enabled: boolean): void { if (this.enabled && !enabled)
        this.clear(); this.enabled = enabled; }
    effect(e: HudEffect): void {
        if (!this.enabled || this.disposed)
            return;
        const target = e.targetId ?? e.id;
        const element = e.elements?.find(value => !!statusLabels[value]) ?? (typeof e.source === 'string' && statusLabels[e.source] ? e.source : e.type === 'acid' && !e.source ? 'acid' : '');
        if ((e.type === 'hit' || e.type === 'acid' || e.contact) && typeof e.damage === 'number' && e.damage > 0 && Number.isFinite(e.damage))
            this.add(e.x, e.y, target, e.damage, 'damage', element, !!e.lethal, !!e.critical, typeof e.source === 'string' && Object.hasOwn(sourceLanes, e.source) ? e.source : '');
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
    private add(x: number, y: number, target: number | undefined, amount: number, kind: string, status: string, lethal: boolean, critical = false, source = ''): void {
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        // Reuse a visible receipt until there is a quiet gap. Repeated zone/status ticks
        // cannot stack new labels faster than old ones expire.
        let entry = this.pool.find(p => p.life > 0 && p.kind === kind && p.source === source && (kind === 'damage' || p.status === status) && (target !== undefined ? p.target === target : Math.hypot(p.x - x, p.y - y) < (kind === 'status' ? 72 : 25)));
        if (!entry)
            entry = this.pool.find(p => p.life <= 0);
        if (!entry) {
            entry = this.pool[0];
            for (const p of this.pool)
                if (p.life < entry.life)
                    entry = p;
        }
        const merge = entry.life > 0 && entry.kind === kind && entry.source === source && (kind === 'damage' || entry.status === status) && (target !== undefined ? entry.target === target : Math.hypot(entry.x - x, entry.y - y) < (kind === 'status' ? 72 : 25));
        entry.amount = (merge ? entry.amount : 0) + amount;
        entry.lethal = lethal || merge && entry.lethal;
        entry.critical = critical || merge && entry.critical;
        const color = status || (merge ? entry.status : '');
        entry.x = x;
        entry.y = y;
        entry.target = target;
        entry.age = merge ? entry.age : 0;
        entry.life = .75;
        entry.kind = kind;
        entry.status = color;
        entry.source = source;
        entry.node.dataset.source = source;
        entry.node.hidden = false;
        const label = kind === 'damage' ? `${Math.round(entry.amount)}${entry.lethal ? ' ×' : ''}` : statusLabels[status];
        entry.label.textContent = label;
        entry.glyph.hidden = kind !== 'status';
        if (kind === 'status') for (const glyph of entry.glyphs) glyph.toggleAttribute('hidden', glyph.dataset.icon !== statusGlyphs[status]);
        entry.node.dataset.kind = kind;
        entry.node.dataset.element = color;
        entry.node.dataset.critical = String(entry.critical);
        const fontSize = kind === 'status' ? 12 : entry.lethal ? 42 : entry.critical ? 40 : 34;
        entry.fontSize = fontSize;
        entry.baseWidth = Math.max(28, Math.ceil(label.length * fontSize * .7) + (kind === 'status' ? 30 : 6));
        entry.baseHeight = kind === 'status' ? 26 : fontSize + 5;
        entry.width = entry.baseWidth; entry.height = entry.baseHeight;
        entry.node.dataset.lethal = String(entry.lethal);
    }
    tick(dt: number, player: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    }): void {
        const w = this.renderer.canvas.clientWidth, h = this.renderer.canvas.clientHeight;
        for (const p of this.pool) p.placed = false;
        for (const p of this.pool) {
            if (p.life <= 0)
                continue;
            p.life = Math.max(0, p.life - dt);
            p.age += dt;
            if (!p.life) {
                p.node.hidden = true;
                continue;
            }
            const point = projectWorld(this.renderer, p.x, p.y, p.point, 1.2);
            if (!point.visible || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
                p.node.hidden = true;
                continue;
            }
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
            let lane = 0;
            if (p.kind === 'damage' && p.target !== undefined) {
                for (const other of this.pool) {
                    if (other === p || other.life <= 0 || other.kind !== 'damage' || other.target !== p.target) continue;
                    if ((sourceLanes[other.source] ?? 0) < (sourceLanes[p.source] ?? 0)) lane++;
                }
            }
            let y = Math.max(8, Math.min(h - p.height - 8, point.y - p.height - 10 - rise - (p.kind === 'status' ? 48 : lane * 36)));
            if (x < player.right + 8 && x + p.width > player.left - 8 && y < player.bottom + 8 && y + p.height > player.top - 8) {
                if (player.top >= p.height + 20) y = player.top - p.height - 12 - (p.kind === 'status' ? 20 : 0);
                else if (player.bottom + p.height + 20 <= h) y = player.bottom + 12;
                else if (player.left >= p.width + 20) x = player.left - p.width - 12;
                else if (player.right + p.width + 20 <= w) x = player.right + 12;
                else {p.node.hidden = true; continue;}
                y = Math.max(8, y);
            }
            // Enemy feedback yields to opaque furniture rather than covering vital copy.
            if(hudObstructs(x,y,x+p.width,y+p.height)) {p.node.hidden=true;continue;}
            // Nearby enemies have independent receipts; deterministic fan-out
            // preserves each total while preventing cross-target text piles.
            const originX = x, originY = y;
            let placed = false;
            for (let attempt = 0; attempt < 33; attempt++) {
                const row = Math.floor((attempt + 1) / 3);
                const side = attempt % 3;
                x = Math.max(8, Math.min(w - p.width - 8, originX + (side === 1 ? -1 : side === 2 ? 1 : 0) * (p.width + 8)));
                y = Math.max(8, Math.min(h - p.height - 8, originY - row * (p.height + 6)));
                if (x < player.right + 8 && x + p.width > player.left - 8 && y < player.bottom + 8 && y + p.height > player.top - 8) continue;
                if (hudObstructs(x,y,x+p.width,y+p.height)) continue;
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
    clear(): void { for (const p of this.pool) {
        p.life = 0;
        p.node.hidden = true;
    } }
    dispose(): void { this.disposed = true; this.motion.removeEventListener('change', this.onMotion); this.clear(); for (const p of this.pool)
        p.node.remove(); this.pool.length = 0; }
}
