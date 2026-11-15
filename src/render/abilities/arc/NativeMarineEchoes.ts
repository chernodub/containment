import * as T from 'three';
import { instantiateAsset } from '../../assets';

type EchoMesh = {
  mesh: T.SkinnedMesh;
  source?: T.SkinnedMesh;
  base: T.Matrix4;
};
type EchoSlot = {
  meshes: EchoMesh[];
  skeletons: T.Skeleton[];
  valid: boolean;
  x: number;
  z: number;
  opacity: number;
  priority: number;
};

/** Exact native skin poses with borrowed geometry and one private skeleton. */
export class NativeMarineEchoes {
  readonly material?: T.ShaderMaterial;
  readonly slots: readonly EchoSlot[];
  private sourceRoot?: T.Object3D;
  private readonly liveMeshes: T.SkinnedMesh[] = [];
  private readonly translation = new T.Matrix4();
  private readonly correction = new T.Matrix4();
  private disposed = false;

  constructor(root: T.Object3D) {
    // Actor assets already exist before lazy ability construction. Standalone
    // unit fixtures intentionally lack them; their existing contour fallback stays.
    let first: ReturnType<typeof instantiateAsset>;
    try { first = instantiateAsset('marine'); } catch { this.slots = []; return; }
    const material = this.material = new T.ShaderMaterial({
      name: 'overclock-native-time-image',
      uniforms: { echoAlpha: { value: 0 }, echoPriority: { value: 0 }, echoTime: { value: 0 } },
      transparent: true, premultipliedAlpha: true, depthWrite: false,
      blending: T.NormalBlending, side: T.FrontSide,
      vertexShader: `
#include <common>
#include <skinning_pars_vertex>
varying vec3 echoNormal;varying float echoHeight;
void main(){
 #include <skinbase_vertex>
 vec3 objectNormal=normal;
 #include <skinnormal_vertex>
 echoNormal=normalize(normalMatrix*objectNormal);
 vec3 transformed=position;
 #include <skinning_vertex>
 echoHeight=(modelMatrix*vec4(transformed,1.)).y;
 gl_Position=projectionMatrix*modelViewMatrix*vec4(transformed,1.);
}`,
      fragmentShader: `
uniform float echoAlpha;uniform float echoPriority;uniform float echoTime;
varying vec3 echoNormal;varying float echoHeight;
void main(){
 float face=abs(normalize(echoNormal).z);
 float band=face<.28?.32:(face<.70?.46:.60);
 float rim=1.-smoothstep(.12,.45,face);
 vec3 color=vec3(.48,.40,.68)*band+vec3(.18,.13,.30)*rim;
 gl_FragColor=vec4(color,echoAlpha*(.58+rim*.42));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 gl_FragColor.rgb*=gl_FragColor.a;
}`,
    });
    // AbilityVisuals installs its shared mask after all rig constructors. This
    // fixed hook gives the native skin the same impact grace as pooled instances.
    material.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace('priority*1.*.97', 'priority*echoPriority*.97');
    };
    material.customProgramCacheKey = () => 'v8-overclock-native-skin-v1';
    const slots: EchoSlot[] = [];
    for (let i = 0; i < 1; i++) {
      const asset = first;
      const meshes: T.SkinnedMesh[] = [];
      asset.root.traverse(node => { if (node instanceof T.SkinnedMesh) meshes.push(node); });
      const skeletons = [...new Set(meshes.map(mesh => mesh.skeleton))];
      for (let skeletonIndex = 0; skeletonIndex < skeletons.length; skeletonIndex++) {
        const skeleton = skeletons[skeletonIndex];
        // SkeletonUtils shares inverse bind matrices with its source; privatize
        // these before copying any live bind data and allocate textures now.
        skeleton.boneInverses = skeleton.boneInverses.map(matrix => matrix.clone());
        for (const bone of skeleton.bones) {
          bone.matrixAutoUpdate = false; bone.matrixWorldAutoUpdate = false;
        }
        skeleton.computeBoneTexture();
        // Existing renderer preparation/context tracking enumerates direct
        // material texture owners, including hidden meshes. Expose the already
        // allocated pose textures there so GPU upload/recovery precedes combat.
        (material as unknown as Record<string, unknown>)[`overclockPose${i}_${skeletonIndex}`] = skeleton.boneTexture;
      }
      const slot: EchoSlot = { meshes: [], skeletons, valid: false, x: 0, z: 0, opacity: 0, priority: 0 };
      for (const mesh of meshes) {
        mesh.material = material;
        mesh.name = `ability-overclock-native-${i}-${slot.meshes.length}`;
        mesh.bindMode = T.DetachedBindMode;
        mesh.castShadow = mesh.receiveShadow = false;
        mesh.matrixAutoUpdate = false;
        mesh.frustumCulled = false;
        mesh.visible = false;
        mesh.onBeforeRender = () => {
          material.uniforms.echoAlpha.value = slot.opacity;
          material.uniforms.echoPriority.value = slot.priority;
          material.uniformsNeedUpdate = true;
        };
        slot.meshes.push({ mesh, base: new T.Matrix4() });
        root.add(mesh);
      }
      for (const owned of asset.materials) owned.dispose();
      slots.push(slot);
    }
    this.slots = slots;
  }

  begin(): void { for (const slot of this.slots) for (const record of slot.meshes) record.mesh.visible = false; }

  capture(index: number, root: T.Object3D | undefined, x: number, z: number): boolean {
    const slot = this.slots[index];
    if (!slot || !root || this.disposed) return false;
    if (this.sourceRoot !== root) {
      this.sourceRoot = root; this.liveMeshes.length = 0;
      root.traverse(node => { if (node instanceof T.SkinnedMesh) this.liveMeshes.push(node); });
      for (const target of this.slots) for (const record of target.meshes)
        record.source = this.liveMeshes.find(source => source.geometry === record.mesh.geometry);
    }
    slot.valid = slot.meshes.length > 0 && slot.meshes.every(record => !!record.source);
    if (!slot.valid) return false;
    root.updateWorldMatrix(true, true);
    slot.x = x; slot.z = z;
    for (const record of slot.meshes) {
      const source = record.source!, mesh = record.mesh;
      source.updateMatrixWorld(true);
      // Preserve the actual live skin's complete world transform, including
      // skeleton animation, upper-body aim/recoil and presentation brace poses.
      for (let i = 0; i < mesh.skeleton.bones.length; i++) {
        mesh.skeleton.bones[i].matrixWorld.copy(source.skeleton.bones[i].matrixWorld);
        mesh.skeleton.boneInverses[i].copy(source.skeleton.boneInverses[i]);
      }
      mesh.bindMatrix.copy(source.bindMatrix);
      mesh.bindMatrixInverse.copy(source.bindMatrix).invert();
      this.correction.multiplyMatrices(source.matrixWorld, source.bindMatrixInverse);
      record.base.multiplyMatrices(this.correction, mesh.bindMatrix);
    }
    for (const skeleton of slot.skeletons) skeleton.update();
    return true;
  }

  draw(index: number, x: number, z: number, opacity: number, priority: number, time: number, low: boolean): boolean {
    const slot = this.slots[index];
    if (!slot?.valid || this.disposed) return false;
    // Low retains one full native silhouette rather than degrading its anatomy.
    if (low && index !== 0) return true;
    slot.opacity = opacity; slot.priority = priority;
    this.material!.uniforms.echoTime.value = time;
    this.translation.makeTranslation(x - slot.x, 0, z - slot.z);
    for (const record of slot.meshes) {
      record.mesh.matrix.multiplyMatrices(this.translation, record.base);
      record.mesh.matrixWorldNeedsUpdate = true;
      record.mesh.visible = opacity > .004;
    }
    return true;
  }

  clear(): void {
    this.begin(); this.sourceRoot = undefined; this.liveMeshes.length = 0;
    for (const slot of this.slots) { slot.valid = false; slot.opacity = 0; }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; this.clear();
    for (const slot of this.slots) {
      for (const skeleton of slot.skeletons) skeleton.dispose();
      for (const record of slot.meshes) record.mesh.removeFromParent();
    }
    // All geometries are borrowed from prepared actor templates, never disposed.
    this.material?.dispose();
  }
}
