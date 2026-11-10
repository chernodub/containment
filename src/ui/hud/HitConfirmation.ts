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
    dataset: {contact?: string; kill?: string; reloading?: string};
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
const finite = (value: number | undefined): number => typeof value === 'number' && Number.isFinite(value) ? value : 0;
const svgNamespace = 'http://www.w3.org/2000/svg';

/** A precise pointer core with independent spread, reload and transient contact layers. */
export class HitConfirmation {
    private life = 0;
    private active = false;
    private reticle = false;
    private playing = true;
    private ring: SVGCircleElement | null = null;

    constructor(private marker: Marker) {
        if (!marker.appendChild) return;
        const svg = (className: string): SVGSVGElement => {
            const node = document.createElementNS(svgNamespace, 'svg');
            node.setAttribute('viewBox', '0 0 40 40');
            node.setAttribute('class', className);
            node.setAttribute('aria-hidden', 'true');
            marker.appendChild!(node);
            return node;
        };
        const spread = svg('reticle-spread');
        for (let quadrant = 0; quadrant < 4; quadrant++) {
            for (const layer of ['reticle-outline', 'reticle-arc']) {
                const arc = document.createElementNS(svgNamespace, 'path');
                arc.setAttribute('d', 'M13.2 5.5A16 16 0 0 1 26.8 5.5');
                arc.setAttribute('transform', `rotate(${quadrant * 90} 20 20)`);
                arc.setAttribute('class', layer);
                arc.setAttribute('vector-effect', 'non-scaling-stroke');
                spread.append(arc);
            }
        }
        const reload = svg('reticle-reload');
        for (const layer of ['reticle-reload-track', 'reticle-reload-progress']) {
            const ring = document.createElementNS(svgNamespace, 'circle');
            for (const [key, value] of Object.entries({cx: '20', cy: '20', r: '17', pathLength: '100', class: layer})) ring.setAttribute(key, value);
            ring.setAttribute('vector-effect', 'non-scaling-stroke');
            reload.append(ring);
            if (layer === 'reticle-reload-progress') this.ring = ring;
        }
        const dot = document.createElement('i');
        dot.className = 'reticle-dot';
        dot.setAttribute('aria-hidden', 'true');
        marker.appendChild(dot);
        const contact = svg('reticle-contact');
        for (const layer of ['reticle-outline', 'reticle-contact-ticks']) {
            const ticks = document.createElementNS(svgNamespace, 'path');
            ticks.setAttribute('d', 'M8 8L13 13M27 27L32 32M8 32L13 27M27 13L32 8');
            ticks.setAttribute('class', layer);
            ticks.setAttribute('vector-effect', 'non-scaling-stroke');
            contact.append(ticks);
        }
    }

    point(x: number, y: number): void {
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        this.active = true;
        this.marker.style.left = `${x}px`;
        this.marker.style.top = `${y}px`;
        if (this.reticle && this.playing) {
            this.marker.hidden = false;
            this.marker.style.opacity = '1';
        }
    }
    confirm(contact: 'damage' | 'armor' | 'blocked', kill = false): void {
        if (!this.active || !this.playing) return;
        this.life = kill ? .18 : .12;
        this.marker.dataset.contact = contact;
        this.marker.dataset.kill = String(kill);
        this.marker.hidden = false;
        this.marker.style.opacity = this.reticle ? '1' : '.65';
        this.marker.style.setProperty?.('--contact-opacity', '1');
    }
    /** Spread and reload are read from the weapon; this component never predicts a shot. */
    snapshot(state: ReticleSnapshot): void {
        this.reticle = true;
        this.playing = state.playing !== false;
        const cone = Math.max(0, finite(state.spreadRadians ?? state.spread) + finite(state.bloomRadians));
        const size = Math.round(Math.max(26, Math.min(64, 28 + cone * 100)));
        this.marker.style.width = `${size}px`;
        this.marker.style.height = `${size}px`;
        const reload = Math.max(0, Math.min(1, finite(state.reloadProgress ?? state.reload)));
        this.marker.dataset.reloading = String(state.reloading ?? reload > 0);
        if (this.ring) this.ring.style.strokeDashoffset = String(100 * (1 - reload));
        if (state.kill) this.confirm('damage', true);
        this.marker.hidden = !this.active || !this.playing;
    }
    update(dt: number, playing: boolean): void {
        this.playing = playing;
        this.life = playing ? Math.max(0, this.life - Math.max(0, finite(dt))) : 0;
        const fade = Math.min(1, this.life / .12);
        this.marker.hidden = this.reticle ? !this.active || !playing : this.life === 0;
        this.marker.style.opacity = this.reticle && this.active && playing ? '1' : String(.65 * fade);
        this.marker.style.setProperty?.('--contact-opacity', String(fade));
        if (!this.life) this.marker.dataset.kill = 'false';
    }
    clear(): void {
        this.life = 0;
        this.active = false;
        this.marker.hidden = true;
        this.marker.style.opacity = '0';
        this.marker.dataset.contact = '';
        this.marker.dataset.kill = 'false';
        this.marker.dataset.reloading = 'false';
        this.marker.style.setProperty?.('--contact-opacity', '0');
        if (this.ring) this.ring.style.strokeDashoffset = '100';
    }
}
