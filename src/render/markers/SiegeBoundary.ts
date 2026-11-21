import {BufferAttribute, DynamicDrawUsage, Group, Mesh, MeshBasicMaterial} from 'three';
import type {DepthGame} from '../../DepthGame';

import {dashedRing} from './dashedRing';

export class SiegeBoundary {
    readonly root = new Group();
    private readonly track = new Mesh(dashedRing(.995, 1, 128), this.material());
    private readonly sweep = new Mesh(dashedRing(.973, .978, 128), this.material());

    private readonly sweepPositions = this.sweep.geometry.getAttribute("position") as BufferAttribute;
    private readonly originalSweepPositions = this.sweepPositions.clone();

    constructor(private readonly unit: number) {
        this.sweepPositions.setUsage(DynamicDrawUsage);
        for (const mesh of [this.track, this.sweep]) {
            mesh.rotation.x = -Math.PI / 2;
            mesh.frustumCulled = false; mesh.renderOrder = -2;
            this.root.add(mesh);
        }
        this.root.visible = false;
    }

    private material() {
        return new MeshBasicMaterial({color: 0x68c9b0, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1});
    }

    update(siege: DepthGame['siege'], player: DepthGame['player'], enemies: DepthGame['enemies']['snapshot']['enemies']) {
        this.root.visible = !!siege;
        if (!siege) return;
        const radius = siege.radius / this.unit;
        this.root.position.set(siege.x / this.unit, .026, siege.y / this.unit);
        this.root.scale.setScalar(radius);
        const inside = Math.hypot(player.x - siege.x, player.y - siege.y) <= siege.radius;
        this.track.material.opacity = inside ? .25 : .18;
        this.sweep.material.opacity = inside ? .30 : .22;
        const positions = this.originalSweepPositions;
        const winding = enemies.filter(enemy => enemy.health > 0 && (enemy.windupMs > 0 || enemy.meleePhase === 'windup'));
        for (let i = 0; i < positions.count; i++) {
            const x = siege.x + positions.getX(i) * siege.radius;
            const y = siege.y - positions.getY(i) * siege.radius;
            let alpha = 1;
            for (const enemy of winding) {
                const distance = Math.hypot(x - enemy.x, y - enemy.y);
                alpha = Math.min(alpha, Math.max(0, Math.min(1, (distance - enemy.radius) / (this.unit * .3))));
            }
            const vx = positions.getX(i), vy = positions.getY(i);
            const scale = alpha + (1-alpha)*.978/Math.hypot(vx,vy);
            this.sweepPositions.setXY(i,vx*scale,vy*scale);
        }
        this.sweepPositions.needsUpdate = true;
        this.sweep.geometry.setDrawRange(0, Math.floor(128 * (1 - siege.remainingMs / siege.durationMs)) * 6);
    }

    dispose() {
        this.root.removeFromParent();
        for (const mesh of [this.track, this.sweep]) {
            mesh.geometry.dispose();
            mesh.material.dispose();
        }
    }
}
