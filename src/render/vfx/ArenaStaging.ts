import * as T from 'three';

/** Original reactor dais for the legacy Queen encounter; decoration never changes hit geometry. */
export class ArenaStaging {
  readonly root = new T.Group();
  private readonly deck: T.Mesh<T.CylinderGeometry, T.MeshStandardMaterial>;
  private readonly rim: T.Mesh<T.TorusGeometry, T.MeshStandardMaterial>;
  private readonly vents: T.InstancedMesh<T.BoxGeometry, T.MeshBasicMaterial>;
  private readonly dummy = new T.Object3D();
  private time = 0;
  private disposed = false;

  constructor(scene?: T.Scene) {
    const steel = new T.MeshStandardMaterial({color: 0x172126, metalness: .72, roughness: .56});
    steel.onBeforeCompile = shader => {
      shader.vertexShader = 'varying vec3 daisPosition;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ndaisPosition=position;');
      shader.fragmentShader = 'varying vec3 daisPosition;\n' + shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        float r=length(daisPosition.xz);
        float groove=smoothstep(.94,.99,abs(sin(r*74.0)));
        float wedge=smoothstep(.985,1.0,abs(sin(atan(daisPosition.z,daisPosition.x)*12.0)));
        diffuseColor.rgb*=1.0-groove*.23-wedge*.25;
      `);
    };
    steel.customProgramCacheKey = () => 'queen-reactor-dais-v1';
    this.deck = new T.Mesh(new T.CylinderGeometry(1, 1, .16, 64), steel);
    this.deck.receiveShadow = true;
    this.rim = new T.Mesh(new T.TorusGeometry(1, .014, 8, 96), new T.MeshStandardMaterial({color: 0x8c704d, emissive: 0xff9a46, emissiveIntensity: 1.4, roughness: .32, metalness: .6}));
    this.rim.rotation.x = -Math.PI / 2;
    this.vents = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({color: new T.Color(0xffd49a).multiplyScalar(1.6)}), 32);
    this.vents.count = 32;
    this.vents.frustumCulled = false;
    this.root.name = 'queen-reactor-staging';
    this.root.add(this.deck, this.rim, this.vents);
    this.root.visible = false;
    scene?.add(this.root);
  }

  /** A shallow decorative surface and powered recess surround the boss, without a central occluder. */
  loadRoom(templateId: string, width: number, height: number) {
    this.root.visible = !this.disposed && templateId === 'reactor-vault';
    this.time = 0;
    const radius = 4.9;
    this.root.position.set(width / 2, 0, height / 2);
    this.deck.position.y = -.06;
    this.deck.scale.set(radius, 1, radius);
    this.rim.position.y = .045;
    this.rim.scale.setScalar(radius);
    for (let i = 0; i < 32; i++) {
      const angle = i * Math.PI / 16;
      this.dummy.position.set(Math.cos(angle) * (radius + .24), .025, Math.sin(angle) * (radius + .24));
      this.dummy.rotation.set(0, -angle, 0);
      this.dummy.scale.set(.18, .035, .56);
      this.dummy.updateMatrix();
      this.vents.setMatrixAt(i, this.dummy.matrix);
    }
    this.vents.instanceMatrix.needsUpdate = true;
  }

  /** Gentle motivated power fluctuation, held still for reduced motion. */
  update(dt: number, flashIntensity: number, reducedMotion: boolean) {
    if (!this.root.visible || this.disposed) return;
    if (!reducedMotion) this.time += Math.max(0, Math.min(.05, dt));
    this.rim.material.emissiveIntensity = 1.4 * (1 + Math.sin(this.time * 1.7) * .06 * flashIntensity);
  }

  /** Include the otherwise hidden boss shaders in every initial preparation. */
  prepare() {
    const visible = this.root.visible;
    this.root.visible = !this.disposed;
    return () => { this.root.visible = visible && !this.disposed; };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const mesh of [this.deck, this.rim, this.vents]) { mesh.geometry.dispose(); mesh.material.dispose(); }
    this.root.removeFromParent();
  }
}
