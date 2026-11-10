type Marker = {
    hidden: boolean | string;
    style: {
        left: string;
        top: string;
        opacity: string;
        width?: string;
        height?: string;
        setProperty?: (name: string, value: string) => void;
    };
    dataset: {
        contact?: string;
        kill?: string;
        reloading?: string;
    };
    appendChild?: (node: Node) => Node;
};
export type ReticleSnapshot = Readonly<{
    spread?: number;
    spreadRadians?: number;
    bloomRadians?: number;
    reload?: number;
    reloadProgress?: number;
    reloading?: boolean;
    playing?: boolean;
    kill?: boolean;
}>;
/** One silent pointer reticle. Snapshot mode adds live spread/reload to hit ticks. */
export class HitConfirmation {
    private life = 0;
    private active = false;
    private reticle = false;
    private playing = true;
    private ring: SVGCircleElement | null = null;
    constructor(private marker: Marker) {
        if (marker.appendChild) {
            const dot = document.createElement('i');
            dot.className = 'reticle-dot';
            marker.appendChild(dot);
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 40 40');
            svg.setAttribute('class', 'reticle-ring');
            svg.setAttribute('aria-hidden', 'true');
            this.ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            this.ring.setAttribute('cx', '20');
            this.ring.setAttribute('cy', '20');
            this.ring.setAttribute('r', '17');
            this.ring.setAttribute('pathLength', '100');
            svg.append(this.ring);
            marker.appendChild(svg);
        }
    }
    point(x: number, y: number): void { this.active = true; this.marker.style.left = `${x}px`; this.marker.style.top = `${y}px`; if (this.reticle && this.playing) {
        this.marker.hidden = false;
        this.marker.style.opacity = '.9';
    } }
    confirm(contact: 'damage' | 'armor' | 'blocked', kill = false): void {
        if (!this.active)
            return;
        this.life = kill ? .16 : .1;
        this.marker.dataset.contact = contact;
        this.marker.dataset.kill = String(kill);
        this.marker.hidden = false;
        this.marker.style.opacity = this.reticle ? '.9' : '.65';
        this.marker.style.setProperty?.('--contact-opacity', '1');
    }
    /** Inputs are the actual weapon cone and reload fraction, never a simulated shot. */
    snapshot(state: ReticleSnapshot): void {
        this.reticle = true;
        this.playing = state.playing !== false;
        const cone = Math.max(0, (state.spreadRadians ?? state.spread ?? 0) + (state.bloomRadians ?? 0));
        const size = Math.round(Math.max(26, Math.min(64, 28 + cone * 100)));
        this.marker.style.width = `${size}px`;
        this.marker.style.height = `${size}px`;
        const reload = Math.max(0, Math.min(1, state.reloadProgress ?? state.reload ?? 0));
        this.marker.dataset.reloading = String(state.reloading ?? reload > 0);
        if (this.ring)
            this.ring.style.strokeDashoffset = String(100 * (1 - reload));
        if (state.kill)
            this.confirm('damage', true);
        this.marker.hidden = !this.active || !this.playing;
    }
    update(dt: number, playing: boolean): void {
        this.playing = playing;
        this.life = playing ? Math.max(0, this.life - dt) : 0;
        const fade = .65 * Math.min(1, this.life / .1);
        this.marker.hidden = this.reticle ? !this.active || !playing : this.life === 0;
        this.marker.style.opacity = this.reticle && this.active && playing ? '.9' : String(fade);
        this.marker.style.setProperty?.('--contact-opacity', String(Math.min(1, this.life / .1)));
        if (!this.life)
            this.marker.dataset.kill = 'false';
    }
    clear(): void { this.life = 0; this.active = false; this.marker.hidden = true; this.marker.dataset.kill = 'false'; this.marker.style.setProperty?.('--contact-opacity', '0'); }
}
