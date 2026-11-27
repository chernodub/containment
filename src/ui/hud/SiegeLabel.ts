import type {DepthGame} from '../../DepthGame';
import type {DepthRenderer} from '../../render/DepthRenderer';
import {projectWorld} from '../gameAdapter';
import {hudObstructs} from './layout';

export class SiegeLabel {
    private readonly node = document.createElement('div');
    private leftDuringTeaching = false;
    private readonly point = {x: 0, y: 0, visible: false};

    constructor(host: HTMLElement) {
        this.node.hidden = true;
        this.node.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;padding:4px 9px;background:#0d201f;color:#acf1dc;border:1px solid #689e91;font:600 18px Barlow,sans-serif;white-space:nowrap';
        host.append(this.node);
    }

    update(renderer: DepthRenderer, siege: DepthGame['siege'], player: DepthGame['player'], marine: {left: number; right: number; top: number; bottom: number}, grace?: DepthGame['storyHoldGrace'], cover?: DepthGame['relayCoverPreview']) {
        this.node.hidden = true;
        const inside = siege && Math.hypot(player.x - siege.x, player.y - siege.y) <= siege.radius;
        const teaching = siege && siege.remainingMs > 0 && grace?.id === 'siege' && grace.teaching;
        if (!teaching) this.leftDuringTeaching = false;
        const cue = teaching && !(inside && this.leftDuringTeaching);
        if (teaching && !inside) this.leftDuringTeaching = true;
        if (!cover && (!siege || siege.choosing)) return;
        const anchor = cover ?? siege!;
        const {x, y: anchorY, visible} = projectWorld(renderer, anchor.x, anchor.y, this.point, .48);
        const label = cover ? '⬢ Cover' : cue ? 'Step off · charge holds' : siege!.remainingMs <= 0 ? 'Relay charged' : `${inside ? 'Charging' : 'Outside hold area'} · ${Math.ceil(siege!.remainingMs / 1000)}s`;
        if (label !== this.node.textContent) this.node.textContent = label;
        if (!visible) return;
        this.node.style.fontSize = cover ? 'clamp(16px, 2.8vw, 48px)' : cue ? 'clamp(24px, 1.875vw, 36px)' : '18px';
        this.node.style.color = cue ? '#9ee8da' : '#acf1dc';
        this.node.style.borderColor = cue ? '#9ee8da' : '#689e91';
        this.node.hidden = false;
        const halfWidth = cue ? this.node.offsetWidth / 2 : 100;
        const halfHeight = cue ? this.node.offsetHeight / 2 : 16;
        const overlapsMarine = x + halfWidth > marine.left && x - halfWidth < marine.right &&
            anchorY + halfHeight > marine.top && anchorY - halfHeight < marine.bottom;
        const y = overlapsMarine ? marine.bottom + halfHeight + 6 : anchorY;
        this.node.hidden = hudObstructs(x - halfWidth, y - halfHeight, x + halfWidth, y + halfHeight);
        this.node.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
    }

    dispose() { this.node.remove(); }
}
