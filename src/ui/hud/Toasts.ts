import { invalidateHudLayout } from './layout';
import { icon } from '../icons';
type Toast = {
    node: HTMLDivElement;
    label: HTMLSpanElement;
    glyph: HTMLSpanElement;
    life: number;
    key: string;
};
/** Three reusable announcements, including exact checkpoint failure wording. */
export class HudToasts {
    private pool: Toast[] = [];
    constructor(host: HTMLElement) {
        for (let i = 0; i < 3; i++) {
            const node = document.createElement('div');
            node.className = 'hud-toast';
            node.hidden = true;
            const glyph = document.createElement('span'), label = document.createElement('span');
            node.append(glyph, label);
            host.append(node);
            this.pool.push({ node, label, glyph, life: 0, key: '' });
        }
    }
    show(text: string, glyph = 'check', kind = 'info', key = text, elementColor = ''): void {
        let toast = this.pool.find(t => t.key === key && t.life > 0) ?? this.pool.find(t => !t.life);
        if (!toast) {
            toast = this.pool[0];
            for (const item of this.pool)
                if (item.life < toast.life)
                    toast = item;
        }
        invalidateHudLayout();
        toast.key = key;
        toast.life = kind === 'warning' ? 7 : 3.5;
        toast.label.textContent = text;
        toast.glyph.innerHTML = icon(glyph);
        toast.glyph.style.color = elementColor;
        toast.node.dataset.kind = kind;
        toast.node.hidden = false;
    }
    /** Remove a keyed announcement when its live condition is consumed. */
    dismiss(key: string): void {
        for (const toast of this.pool) {
            if (toast.life <= 0 || toast.key !== key) continue;
            toast.life = 0;
            toast.node.hidden = true;
            toast.key = '';
            invalidateHudLayout();
        }
    }
    tick(dt: number): void { for (const t of this.pool) {
        if (!t.life)
            continue;
        t.life = Math.max(0, t.life - dt);
        t.node.hidden = !t.life;
        if (!t.life)
            invalidateHudLayout();
    } }
    clear(): void { invalidateHudLayout(); for (const t of this.pool) {
        t.life = 0;
        t.node.hidden = true;
        t.key = '';
    } }
    dispose(): void { this.clear(); for (const t of this.pool)
        t.node.remove(); this.pool.length = 0; }
}
