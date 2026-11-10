import * as T from 'three';

/** A motivated suit spotlight and restrained, depth-tested scattering cone. */
export class MarineLamp {
  readonly root = new T.Group();
  readonly light = new T.SpotLight(0xccefff, 12, 11, Math.PI / 7, .65, 2);
  readonly cone: T.Mesh<T.CylinderGeometry, T.ShaderMaterial>;
  private readonly direction = new T.Vector3();
  private readonly down = new T.Vector3(0, -1, 0);
  constructor() {
    const geometry = new T.CylinderGeometry(0, 1.75, 7.5, 20, 1, true);
    geometry.translate(0, -3.75, 0);
    const material = new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending,
      uniforms: { color: { value: new T.Color(0x9fe8ff) }, strength: { value: .018 } },
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'uniform vec3 color;uniform float strength;varying vec2 vUv;void main(){float a=pow(vUv.y,1.4)*smoothstep(0.0,0.12,vUv.y)*strength;gl_FragColor=vec4(color,a);}',
    });
    this.cone = new T.Mesh(geometry, material);
    this.root.name = 'marine-lamp'; this.cone.name = 'marine-lamp-scattering'; this.cone.renderOrder = 2;
    this.root.add(this.light, this.light.target, this.cone);
  }
  update(x: number, z: number, angle: number) {
    const dx = Math.cos(angle), dz = Math.sin(angle);
    this.light.position.set(x, 1.45, z);
    this.light.target.position.set(x + dx * 8, .15, z + dz * 8);
    this.cone.position.copy(this.light.position);
    this.direction.subVectors(this.light.target.position, this.light.position).normalize();
    this.cone.quaternion.setFromUnitVectors(this.down, this.direction);
  }
  setQuality(high: boolean, atmosphere = true) { this.cone.visible = high && atmosphere; }
  dispose() { this.cone.geometry.dispose(); this.cone.material.dispose(); this.root.removeFromParent(); }
}
