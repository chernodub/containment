import type { ScreenBox } from './weaponInput';
type Group = {
    element: HTMLElement;
    box: ScreenBox;
    previous?: ScreenBox;
    dx: number;
    dy: number;
};
const applied = new WeakMap<HTMLElement, {
    x: number;
    y: number;
    box: ScreenBox;
}>();
const intersects = (a: ScreenBox, b: ScreenBox, pad = 0) => a.left - pad < b.right && a.right + pad > b.left && a.top - pad < b.bottom && a.bottom + pad > b.top;
let cached: Group[] = [];
let cachedWidth = 0, cachedHeight = 0, valid = false;
let fontsObserved = false;
/** Call after content or visibility can change the measured HUD geometry. */
export function invalidateHudLayout(): void { valid = false; }
/** Cached chrome bounds let pooled overlays avoid panels without layout reads. */
export function hudObstructs(left: number, top: number, right: number, bottom: number): boolean {
    for (const group of cached) {
        const box = group.previous!;
        if (left < box.right + 6 && right > box.left - 6 && top < box.bottom + 6 && bottom > box.top - 6)
            return true;
    }
    return false;
}
const presentationObstacles = new Map<string, ScreenBox>();
/** Passive prompt/beat rectangles are already measured by their owners. */
export function setPresentationObstacle(id: string, box: ScreenBox | null): void {
    if (box) presentationObstacles.set(id, box);
    else presentationObstacles.delete(id);
}
/** Combat decoration yields to passive instructional copy as well as opaque chrome. */
export function presentationObstructs(left: number, top: number, right: number, bottom: number, except?: string): boolean {
    for (const [id, box] of presentationObstacles)
        if (id !== except && left < box.right + 6 && right > box.left - 6 && top < box.bottom + 6 && bottom > box.top - 6) return true;
    return false;
}
const distance = (a: ScreenBox, b: ScreenBox) => Math.abs(a.left - b.left) + Math.abs(a.top - b.top);
/** Edge anchored chrome yields to the actual renderer-projected marine bounds.
 * Read all boxes before writing; offsets are never accumulated across resize. */
export function positionHudPanels(player: ScreenBox, width: number, height: number): boolean {
    if (!fontsObserved) {
        document.fonts?.addEventListener('loadingdone', invalidateHudLayout);
        fontsObserved = true;
    }
    if (valid && width === cachedWidth && height === cachedHeight) {
        let clear = true;
        for (const group of cached) {
            const box = group.previous!;
            if (intersects(box, player, 10)) {
                clear = false;
                break;
            }
            const preferred = group.box;
            if (distance(preferred, box) > .1 && !intersects(preferred, player, 48) && preferred.left >= 8 && preferred.top >= 8 && preferred.right <= width - 8 && preferred.bottom <= height - 8) {
                let available = true;
                for (const other of cached)
                    if (other !== group && intersects(preferred, other.previous!, 8)) {
                        available = false;
                        break;
                    }
                if (available) {
                    clear = false;
                    break;
                }
            }
        }
        if (clear)
            return true;
    }
    const selectors = ['#status-hud', '#action-bar', '.vitals', '#boss-hud', '#radar-hud', '#hud-toasts'];
    const groups: Group[] = [];
    for (const selector of selectors) {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element || element.hidden || !element.getClientRects().length || selector === '#hud-toasts' && !element.children.length)
            continue;
        const r = element.getBoundingClientRect(), last = applied.get(element);
        if (r.width <= 0 || r.height <= 0)
            continue;
        const dx = last?.x ?? 0, dy = last?.y ?? 0;
        let box = { left: r.left - dx, right: r.right - dx, top: r.top - dy, bottom: r.bottom - dy };
        // The keyboard legend now belongs to the action bar's padded lower lip.
        groups.push({ element, box, previous: last?.box, dx, dy });
    }
    groups.sort((a, b) => (b.box.right - b.box.left) * (b.box.bottom - b.box.top) - (a.box.right - a.box.left) * (a.box.bottom - a.box.top));
    let attempts = 0;
    const place = (index: number, placed: ScreenBox[]): ScreenBox[] | null => {
        if (index === groups.length)
            return placed;
        if (++attempts > 25000)
            return null;
        const g = groups[index], w = g.box.right - g.box.left, h = g.box.bottom - g.box.top;
        const xs = [g.box.left, 8, width - w - 8, player.right + 12, player.left - w - 12], ys = [g.box.top, 8, height - h - 8, player.bottom + 12, player.top - h - 12];
        for (const box of placed) {
            xs.push(box.right + 8, box.left - w - 8);
            ys.push(box.bottom + 8, box.top - h - 8);
        }
        const candidates: ScreenBox[] = [];
        const add = (left: number, top: number) => {
            const box = { left, right: left + w, top, bottom: top + h };
            if (left >= 7.99 && top >= 7.99 && box.right <= width - 7.99 && box.bottom <= height - 7.99 && !intersects(box, player, 10) && !placed.some(other => intersects(box, other, 7.99)) && !candidates.some(other => other.left === left && other.top === top))
                candidates.push(box);
        };
        if (g.previous)
            add(g.previous.left, g.previous.top);
        for (const x of xs)
            for (const y of ys)
                add(x, y);
        const retain = g.previous && intersects(g.box, player, 48);
        candidates.sort((a, b) => {
            const score = (box: ScreenBox) => distance(box, g.box) + (g.previous ? distance(box, g.previous) * .1 : 0) - (retain && g.previous && distance(box, g.previous) < .1 ? 10000 : 0);
            return score(a) - score(b);
        });
        for (const candidate of candidates) {
            const result = place(index + 1, [...placed, candidate]);
            if (result)
                return result;
        }
        return null;
    };
    const layout = place(0, []);
    if (!layout) {
        valid = false;
        return false;
    }
    groups.forEach((g, i) => {
        const box = layout[i], x = box.left - g.box.left, y = box.top - g.box.top;
        if (x !== g.dx || y !== g.dy)
            g.element.style.translate = `${x}px ${y}px`;
        applied.set(g.element, { x, y, box });
        g.previous = box;
    });
    cached = groups;
    cachedWidth = width;
    cachedHeight = height;
    valid = true;
    return true;
}
