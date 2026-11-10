import type { DepthRenderer } from '../../render/DepthRenderer';
import { projectWorld, type ScreenPoint } from '../gameAdapter';
import type { HudEffect } from './effects';
export const COMBAT_TEXT_CAPACITY = 28;
type Float = {
    node: HTMLDivElement;
    life: number;
    age: number;
    x: number;
    y: number;
    target: number | undefined;
    amount: number;
    kind: string;
    status: string;
    lethal: boolean;
    point: ScreenPoint;
};
const statusLabels: Record<string, string> = { ice: 'CHILLED', freeze: 'FROZEN', frost: 'CHILLED', shatter: 'SHATTER', fire: 'BURNING', burn: 'BURNING', poison: 'ACID', arc: 'SHOCK', overload: 'OVERLOAD' };
/** A bounded DOM pool; same-target pellets merge instead of covering the encounter. */
export class CombatText {
    private readonly pool: Float[] = [];
    private enabled = true;
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
            fragment.append(node);
            this.pool.push({ node, life: 0, age: 0, x: 0, y: 0, target: undefined, amount: 0, kind: 'damage', status: '', lethal: false, point: { x: 0, y: 0, visible: false } });
        }
        host.append(fragment);
    }
    setEnabled(enabled: boolean): void { if (this.enabled && !enabled)
        this.clear(); this.enabled = enabled; }
    effect(e: HudEffect): void {
        if (!this.enabled)
            return;
        const target = e.targetId ?? e.id;
        if ((e.type === 'hit' || e.type === 'acid' || e.contact) && typeof e.damage === 'number' && e.damage > 0 && Number.isFinite(e.damage))
            this.add(e.x, e.y, target, e.damage, 'damage', '', !!e.lethal);
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
    private add(x: number, y: number, target: number | undefined, amount: number, kind: string, status: string, lethal: boolean): void {
        let entry = this.pool.find(p => p.life > 0 && p.age < .18 && p.kind === kind && p.status === status && (target !== undefined ? p.target === target : Math.hypot(p.x - x, p.y - y) < 25));
        if (!entry)
            entry = this.pool.find(p => p.life <= 0);
        if (!entry) {
            entry = this.pool[0];
            for (const p of this.pool)
                if (p.life < entry.life)
                    entry = p;
        }
        const merge = entry.life > 0 && entry.age < .18 && entry.kind === kind && entry.status === status && (target !== undefined ? entry.target === target : Math.hypot(entry.x - x, entry.y - y) < 25);
        entry.amount = (merge ? entry.amount : 0) + amount;
        entry.lethal = lethal || merge && entry.lethal;
        entry.x = x;
        entry.y = y;
        entry.target = target;
        entry.age = merge ? entry.age : 0;
        entry.life = .75;
        entry.kind = kind;
        entry.status = status;
        entry.node.hidden = false;
        entry.node.textContent = kind === 'damage' ? `${Math.round(entry.amount)}${entry.lethal ? ' ×' : ''}` : statusLabels[status];
        entry.node.dataset.kind = kind;
        entry.node.dataset.element = status;
        entry.node.dataset.lethal = String(entry.lethal);
    }
    tick(dt: number, player: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    }): void {
        const w = this.renderer.canvas.clientWidth, h = this.renderer.canvas.clientHeight;
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
            let x = Math.max(10, Math.min(w - 80, point.x - 14)), y = Math.max(10, Math.min(h - 45, point.y - 34 - (this.reducedMotion ? 0 : p.age * 30) - (p.kind === 'status' ? 26 : 0)));
            if (x < player.right + 8 && x + 75 > player.left - 8 && y < player.bottom + 8 && y + 28 > player.top - 8)
                y = Math.max(8, player.top - 40 - (p.kind === 'status' ? 24 : 0));
            p.node.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
            p.node.style.opacity = String(Math.min(1, p.life / .2));
        }
    }
    clear(): void { for (const p of this.pool) {
        p.life = 0;
        p.node.hidden = true;
    } }
    dispose(): void { this.motion.removeEventListener('change', this.onMotion); this.clear(); for (const p of this.pool)
        p.node.remove(); this.pool.length = 0; }
}
