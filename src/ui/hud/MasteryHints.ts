import type {AbilityEvent} from '../../game/abilities/contract';
import type {DepthRenderer} from '../../render/DepthRenderer';
import {projectWorld, type getMasteryPreview} from '../gameAdapter';
import '../styles/mastery.css';

const prompt = {
    cryo: 'F — shatter for 100',
    pyro: 'Detonate',
    kinetic: 'Shift — Ram into Bulwark',
    arc: 'Link ends here',
};
type RigColor = keyof typeof prompt;
type MarkColor = RigColor | 'bonus';
type Point = {x: number; y: number};

export class MasteryHints {
    private readonly layer = document.createElement('div');
    private readonly callout = document.createElement('span');
    private readonly marks: HTMLElement[] = [];
    private readonly seen = new Set<string>();
    private readonly point = {x: 0, y: 0, visible: false};
    private shown: RigColor | null = null;
    private remaining = 0;
    private room = -1;
    private shownInRoom = new Set<RigColor>();
    private enabled = true;

    constructor(host: HTMLElement, private readonly storage: Pick<Storage, 'getItem' | 'setItem'> | null) {
        this.layer.className = 'mastery-layer';
        this.callout.className = 'mastery-callout';
        this.callout.setAttribute('role', 'status');
        this.layer.append(this.callout);
        host.append(this.layer);
        try {
            for (const rig of Object.keys(prompt)) if (storage?.getItem(`containment.mastery.${rig}`)==='learned') this.seen.add(rig);
        } catch {}
    }

    tick(renderer: DepthRenderer, preview: ReturnType<typeof getMasteryPreview> | null, enabled: boolean, dt: number) {
        this.enabled = enabled;
        this.callout.hidden = true;
        for (const mark of this.marks) mark.hidden = true;
        this.remaining -= dt;
        if (!preview) {this.remaining=0; return;}
        if (preview.roomRevision !== this.room) {
            this.room=preview.roomRevision;
            this.shownInRoom.clear();
            this.remaining=0;
        }
        let count = 0;
        const anchor = (point: Point, height: number) => projectWorld(renderer, point.x, point.y, this.point, height);
        const showMark = (rig: MarkColor, point: Point, text: string, height: number, from?: Point) => {
            const start = from && {...anchor(from,.1)};
            const end = anchor(point,height);
            if (!end.visible || start && !start.visible) return;
            let node = this.marks[count++];
            if (!node) {
                node = document.createElement('span');
                this.layer.append(node);
                this.marks.push(node);
            }
            node.className = start ? 'mastery-link' : 'mastery-mark';
            node.dataset.rig = rig;
            node.textContent = text;
            node.hidden = false;
            node.style.left = `${start?.x ?? end.x}px`;
            node.style.top = `${start?.y ?? end.y}px`;
            node.style.width = start ? `${Math.hypot(end.x-start.x,end.y-start.y)}px` : '';
            node.style.transform = start ? `rotate(${Math.atan2(end.y-start.y,end.x-start.x)}rad)` : '';
        };
        if (preview.drill) showMark('bonus',preview.drill,'20 CR',1.8);
        if (preview.augmentDrill) showMark('bonus',preview.augmentDrill,'15 CR',1.8);
        for (const target of preview.ignite) showMark('pyro',target,'◇',1.1);
        if (preview.crush) {
            showMark('kinetic',preview.crush,'',.1,preview.player);
            showMark('kinetic',preview.crush,'Crush 68',.35);
        }
        if (preview.dashOrigin) showMark('arc',preview.dashOrigin,'',.1,preview.player);
        if (preview.link) {
            showMark('arc',preview.link,'',.45,preview.linkFrom);
            showMark('arc',preview.link,'◆',.45);
        }
        const opportunities: [RigColor, Point | undefined][] = [
            ['cryo',preview.shatter], ['pyro',preview.ignite[0]], ['kinetic',preview.crush], ['arc',preview.link??undefined],
        ];
        if (!enabled) {this.remaining=0; return;}
        for (const [rig, point] of opportunities) {
            if (!point || !anchor(point,1.3).visible) continue;
            if (this.seen.has(rig)) continue;
            if (!this.shownInRoom.has(rig)) {
                this.shownInRoom.add(rig);
                this.shown=rig;
                this.remaining=2.5;
            }
            if (this.shown!==rig || this.remaining<=0) continue;
            this.callout.dataset.rig=rig;
            this.callout.textContent=rig==='pyro' ? `Q · Detonate ${preview.ignite.length}` : prompt[rig];
            this.callout.style.left=`${this.point.x+16}px`;
            this.callout.style.top=`${this.point.y}px`;
            this.callout.hidden=false;
            break;
        }
    }

    effect(event: AbilityEvent) {
        if (!this.enabled || !event.targetIds?.length) return;
        const rig: RigColor | undefined =
            event.phase === 'burst' && event.ability === 'glacier' && event.deliberate ? 'cryo' :
            event.phase === 'burst' && event.ability === 'flashfire' ? 'pyro' :
            event.phase === 'burst' && event.ability === 'ram' ? 'kinetic' :
            event.phase === 'link' && (event.ability === 'overload' || event.ability === 'static-step') ? 'arc' : undefined;
        if (!rig) return;
        this.seen.add(rig);
        try {this.storage?.setItem(`containment.mastery.${rig}`, 'learned');} catch {}
    }

    dispose() {this.layer.remove();}
}
