import * as T from 'three';

/** A motivated suit spotlight and restrained, depth-tested scattering cone. */
export class MarineLamp {
  readonly root = new T.Group();
  readonly light = new T.SpotLight(0xccefff, 12, 11, Math.PI / 6, .92, 2);
  readonly suitFill = new T.PointLight(0xabc7df, 0, 4.8, 2);
  readonly cone: T.Mesh<T.CylinderGeometry, T.ShaderMaterial>;
  private readonly direction = new T.Vector3();
  private readonly down = new T.Vector3(0, -1, 0);
  constructor() {
    const geometry = new T.CylinderGeometry(0, 1.75, 7.5, 20, 1, true);
    geometry.translate(0, -3.75, 0);
    const material = new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending,
      uniforms: { color: { value: new T.Color(0x9fe8ff) }, strength: { value: .009 } },
      vertexShader: 'varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;void main(){vUv=uv;vNormal=normalMatrix*normal;vec4 view=modelViewMatrix*vec4(position,1.0);vView=-view.xyz;gl_Position=projectionMatrix*view;}',
      // Clamping matters at the open cone end: tiny interpolated negative UVs
      // raised to a fractional power otherwise poison the HDR buffer with NaNs.
      fragmentShader: 'uniform vec3 color;uniform float strength;varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;void main(){float y=clamp(vUv.y,0.0,1.0);float facing=abs(dot(normalize(vNormal),normalize(vView)));float a=pow(y,1.4)*smoothstep(0.0,0.12,y)*pow(max(0.0,facing),.8)*strength;gl_FragColor=vec4(color,a);}',
    });
    this.cone = new T.Mesh(geometry, material);
    this.root.name = 'marine-lamp'; this.cone.name = 'marine-lamp-scattering'; this.cone.renderOrder = 2;
    this.root.add(this.light, this.light.target, this.suitFill, this.cone);this.suitFill.visible=false;
  }
  update(x: number, z: number, angle: number) {
    const dx = Math.cos(angle), dz = Math.sin(angle);
    this.light.position.set(x, 1.65, z);
    this.suitFill.position.set(x-dx*.28, 2.65, z-dz*.28);
    this.light.target.position.set(x + dx * 5.5, .04, z + dz * 5.5);
    this.cone.position.copy(this.light.position);
    this.direction.subVectors(this.light.target.position, this.light.position).normalize();
    this.cone.quaternion.setFromUnitVectors(this.down, this.direction);
  }
  /** Stable local illumination keeps the full movement neighborhood readable in every room. */
  setRoom(intensity=24) { this.suitFill.visible=true;this.suitFill.intensity=intensity*1.55;this.suitFill.distance=6.4; }
  setReactor(_reactor: boolean) { this.setRoom(); }
  setQuality(high: boolean, atmosphere = true) { this.cone.visible = high && atmosphere; }
  dispose() { this.cone.geometry.dispose(); this.cone.material.dispose(); this.root.removeFromParent(); }
}
