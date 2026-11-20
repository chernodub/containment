import {BufferAttribute, DynamicDrawUsage, Group, Mesh, MeshBasicMaterial, RingGeometry} from 'three';
import type {DepthGame} from '../../DepthGame';

export class SiegeBoundary {
    readonly root = new Group();
    private readonly track = new Mesh(new RingGeometry(.98, 1, 128), this.material());
    private readonly sweep = new Mesh(new RingGeometry(.947, .976, 128), this.material());

    private readonly sweepAlpha = new BufferAttribute(new Float32Array(this.sweep.geometry.attributes.position.count).fill(1), 1).setUsage(DynamicDrawUsage);

    constructor(private readonly unit: number) {
        this.sweep.geometry.setAttribute('sweepAlpha', this.sweepAlpha);
        this.sweep.material.onBeforeCompile = shader => {
            shader.vertexShader = 'attribute float sweepAlpha; varying float vSweepAlpha;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvSweepAlpha=sweepAlpha;');
            shader.fragmentShader = 'varying float vSweepAlpha;\n' + shader.fragmentShader.replace('#include <alphatest_fragment>', 'diffuseColor.a*=vSweepAlpha;\n#include <alphatest_fragment>');
        };
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

    update(siege: DepthGame['siege'], player: DepthGame['player'], enemies: DepthGame['enemies']['snapshot']['enemies']) {
        this.root.visible = !!siege;
        if (!siege) return;
        const radius = siege.radius / this.unit;
        this.root.position.set(siege.x / this.unit, .026, siege.y / this.unit);
        this.root.scale.setScalar(radius);
        const inside = Math.hypot(player.x - siege.x, player.y - siege.y) <= siege.radius;
        this.track.material.opacity = inside ? .34 : .23;
        this.sweep.material.opacity = inside ? .76 : .56;
        const positions = this.sweep.geometry.attributes.position;
        const winding = enemies.filter(enemy => enemy.health > 0 && (enemy.windupMs > 0 || enemy.meleePhase === 'windup'));
        for (let i = 0; i < positions.count; i++) {
            const x = siege.x + positions.getX(i) * siege.radius;
            const y = siege.y - positions.getY(i) * siege.radius;
            let alpha = 1;
            for (const enemy of winding) {
                const distance = Math.hypot(x - enemy.x, y - enemy.y);
                alpha = Math.min(alpha, Math.max(0, Math.min(1, (distance - enemy.radius) / (this.unit * .3))));
            }
            this.sweepAlpha.setX(i, alpha);
        }
        this.sweepAlpha.needsUpdate = true;
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
