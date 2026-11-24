import type {DepthGame} from '../../DepthGame';
import type {DepthRenderer} from '../../render/DepthRenderer';
import {projectWorld} from '../gameAdapter';
import {hudObstructs} from './layout';

export class SiegeLabel {
    private readonly node = document.createElement('div');
    private readonly point = {x: 0, y: 0, visible: false};

    constructor(host: HTMLElement) {
        this.node.hidden = true;
        this.node.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;padding:4px 9px;background:#0d201f;color:#acf1dc;border:1px solid #689e91;font:600 18px Barlow,sans-serif;white-space:nowrap';
        host.append(this.node);
    }

    update(renderer: DepthRenderer, siege: DepthGame['siege'], player: DepthGame['player'], marine: {left: number; right: number; top: number; bottom: number}, cover?: DepthGame['relayCoverPreview']) {
        this.node.hidden = true;
        if (!cover && (!siege || siege.choosing)) return;
        const anchor = cover ?? siege!;
        const {x, y: anchorY, visible} = projectWorld(renderer, anchor.x, anchor.y, this.point, .48);
        const overlapsMarine = x + 100 > marine.left && x - 100 < marine.right &&
            anchorY + 16 > marine.top && anchorY - 16 < marine.bottom;
        const y = overlapsMarine ? marine.bottom + 22 : anchorY;
        if (!visible || hudObstructs(x - 100, y - 15, x + 100, y + 15)) return;
        const inside = siege && Math.hypot(player.x - siege.x, player.y - siege.y) <= siege.radius;
        this.node.hidden = false;
        this.node.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
        this.node.style.fontSize = cover ? 'clamp(16px, 2.8vw, 48px)' : '18px';
        const label = cover ? '⬢ Cover' : siege!.remainingMs <= 0 ? 'Relay charged' : `${inside ? 'Charging' : 'Outside hold area'} · ${Math.ceil(siege!.remainingMs / 1000)}s`;
        if (label !== this.node.textContent) this.node.textContent = label;
    }

    dispose() { this.node.remove(); }
}
