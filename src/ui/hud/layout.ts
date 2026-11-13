import type { ScreenBox } from './weaponInput';
import type {HudInsets} from '../gameAdapter';
type Group = {
    element: HTMLElement;
    box: ScreenBox;
    previous?: ScreenBox;
    dx: number;
    dy: number;
    obscured?: boolean;
    threatX?: number;
    threatY?: number;
    threatDistance?: number;
    edge?: HTMLElement;
};
const applied = new WeakMap<HTMLElement, {
    x: number;
    y: number;
    box: ScreenBox;
}>();
const intersects = (a: ScreenBox, b: ScreenBox, pad = 0) => a.left - pad < b.right && a.right + pad > b.left && a.top - pad < b.bottom && a.bottom + pad > b.top;
let cached: Group[] = [];
let cachedWidth = 0, cachedHeight = 0, valid = false;
let revision = 0;
/** Revision changes only when measured HUD placement changes. */
export const hudLayoutRevision = () => revision;
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
const insets = {top: 0, right: 0, bottom: 0, left: 0};
/** Cached edge occupancy: cameras receive CSS pixels, never internal render dimensions. */
export function getHudInsets(): HudInsets { return insets; }
function updateInsets(width: number, height: number): void {
    insets.top = insets.right = insets.bottom = insets.left = 0;
    for (const group of cached) {
        if (group.element.id === 'hud-toasts') continue;
        const box = group.previous!;
        const preferred = group.element.id === 'action-bar' ? 'bottom' : group.element.id === 'status-hud' || group.element.id === 'radar-hud' ? 'right' : 'top';
        // A relocated panel reserves its nearest edge instead of swallowing the playfield.
        const costs = {top: box.bottom, right: width - box.left, bottom: height - box.top, left: box.right};
        const gaps = {top: box.top, right: width - box.right, bottom: height - box.bottom, left: box.left};
        let side: keyof typeof costs = preferred;
        for (const candidate of ['top','right','bottom','left'] as const) if (gaps[candidate] + 40 < gaps[side]) side = candidate;
        insets[side] = Math.max(insets[side], Math.ceil(costs[side] + 8));
    }
}
/** Begin one projection pass; reused panel records avoid DOM measurements. */
export function beginHudOcclusion(): void { for (const group of cached) {group.obscured = false; group.threatDistance = Infinity;} }
/** Threat footprints include bodies, hostile warning areas and the marine. */
export function markHudOcclusion(left: number, top: number, right: number, bottom: number): void {
    if (!Number.isFinite(left) || !Number.isFinite(top) || !Number.isFinite(right) || !Number.isFinite(bottom)) return;
    for (const group of cached) {
        const id = group.element.id;
        if (id !== 'action-bar' && id !== 'status-hud' && id !== 'radar-hud' && !group.element.classList.contains('vitals')) continue;
        const box = group.previous!;
        if (left >= box.right || right <= box.left || top >= box.bottom || bottom <= box.top) continue;
        const x = (left + right) / 2, y = (top + bottom) / 2;
        const dx = x - (box.left + box.right) / 2, dy = y - (box.top + box.bottom) / 2, distance = dx * dx + dy * dy;
        if (!group.obscured || distance < group.threatDistance!) {group.threatX = x; group.threatY = y; group.threatDistance = distance; group.obscured = true;}
    }
}
/** A separate passive edge marker keeps full danger contrast while panel chrome fades. */
export function finishHudOcclusion(): void {
    for (const group of cached) {
        const active = !!group.obscured;
        const state = String(active);
        if (group.element.dataset.obscuresThreat !== state) group.element.dataset.obscuresThreat = state;
        if (!active) {if (group.edge) group.edge.hidden = true; continue;}
        if (!group.edge) {
            group.edge = document.createElement('i'); group.edge.className = 'hud-panel-threat';
            group.edge.dataset.panel = group.element.id || 'vitals'; group.edge.setAttribute('aria-hidden','true');
            document.getElementById('hud')?.append(group.edge);
        }
        const box = group.previous!;
        const x = Math.max(box.left + 8, Math.min(box.right - 8, group.threatX!));
        const y = Math.max(box.top + 8, Math.min(box.bottom - 8, group.threatY!));
        let side = 0, distance = Math.abs(y - box.top);
        if (Math.abs(x - box.right) < distance) {side = 1; distance = Math.abs(x - box.right);}
        if (Math.abs(y - box.bottom) < distance) {side = 2; distance = Math.abs(y - box.bottom);}
        if (Math.abs(x - box.left) < distance) side = 3;
        const edgeX = side === 1 ? box.right : side === 3 ? box.left : x;
        const edgeY = side === 0 ? box.top : side === 2 ? box.bottom : y;
        group.edge.style.left = `${edgeX}px`; group.edge.style.top = `${edgeY}px`;
        group.edge.style.setProperty('--hud-threat-angle', `${Math.atan2(group.threatY! - edgeY, group.threatX! - edgeX)}rad`);
        group.edge.hidden = false;
    }
}
/** Clear presentation and camera occupancy when combat ends or the HUD is disposed. */
export function clearHudOcclusion(): void {
    for (const group of cached) {group.element.dataset.obscuresThreat = 'false'; group.edge?.remove(); group.edge = undefined;}
    insets.top = insets.right = insets.bottom = insets.left = 0;
    valid = false;
}
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
        const previous = cached.find(group => group.element === element);
        groups.push({ element, box, previous: last?.box, dx, dy, edge: previous?.edge });
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
    for (const group of cached) if (!groups.some(next => next.element === group.element)) group.edge?.remove();
    revision++;
    cached = groups;
    cachedWidth = width;
    cachedHeight = height;
    valid = true;
    updateInsets(width, height);
    return true;
}
