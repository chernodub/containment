import {Group, Mesh, MeshBasicMaterial, RingGeometry} from 'three';
import type {DepthGame} from '../../DepthGame';

export class SiegeBoundary {
    readonly root = new Group();
    private readonly track = new Mesh(new RingGeometry(.98, 1, 128), this.material());
    private readonly sweep = new Mesh(new RingGeometry(.947, .976, 128), this.material());

    constructor(private readonly unit: number) {
        for (const mesh of [this.track, this.sweep]) {
            mesh.rotation.x = -Math.PI / 2;
            mesh.frustumCulled = false;
            this.root.add(mesh);
        }
        this.root.visible = false;
    }

    private material() {
        return new MeshBasicMaterial({color: 0x68c9b0, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1});
    }

    update(siege: DepthGame['siege'], player: DepthGame['player']) {
        this.root.visible = !!siege;
        if (!siege) return;
        const radius = siege.radius / this.unit;
        this.root.position.set(siege.x / this.unit, .026, siege.y / this.unit);
        this.root.scale.setScalar(radius);
        const inside = Math.hypot(player.x - siege.x, player.y - siege.y) <= siege.radius;
        this.track.material.opacity = inside ? .34 : .23;
        this.sweep.material.opacity = inside ? .76 : .56;
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
