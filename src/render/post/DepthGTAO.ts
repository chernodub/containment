import { Camera, DepthTexture, Matrix4, ShaderMaterial, UniformsUtils } from 'three';
import { generateMagicSquareNoise, GTAOShader } from 'three/addons/shaders/GTAOShader.js';
import {
  generatePdSamplePointInitializer, PoissonDenoiseShader,
} from 'three/addons/shaders/PoissonDenoiseShader.js';
import { screenVertex } from './shaders';

type ProjectionCamera = Camera & { near?: number; far?: number; isPerspectiveCamera?: boolean };

/** Three's horizon-integrated GTAO and bilateral Poisson denoise, using existing depth. */
export class DepthGTAO {
  readonly noise = generateMagicSquareNoise(5);
  readonly denoiseNoise = generateMagicSquareNoise(7);
  readonly material: ShaderMaterial;
  readonly denoiseMaterial: ShaderMaterial;

  constructor(depth: DepthTexture, camera: Camera) {
    this.material = new ShaderMaterial({
      name: 'Containment depth GTAO', vertexShader: screenVertex,
      fragmentShader: GTAOShader.fragmentShader,
      defines: { ...GTAOShader.defines, NORMAL_VECTOR_TYPE: 0, SAMPLES: 12 },
      uniforms: UniformsUtils.clone(GTAOShader.uniforms),
      depthTest: false, depthWrite: false, toneMapped: false,
    });
    const u = this.material.uniforms;
    u.tDepth.value = depth;
    u.tNoise.value = this.noise;
    // @types/three predates this runtime uniform in Three 0.185.
    u.cameraWorldMatrix ??= { value: new Matrix4() };
    u.radius.value = 0.7;
    u.thickness.value = 0.8;
    u.distanceExponent.value = 1.3;
    u.distanceFallOff.value = 1;
    u.scale.value = 1;
    this.denoiseMaterial = new ShaderMaterial({
      name: 'Containment GTAO Poisson denoise', vertexShader: screenVertex,
      fragmentShader: PoissonDenoiseShader.fragmentShader,
      defines: {
        ...PoissonDenoiseShader.defines, NORMAL_VECTOR_TYPE: 0,
        SAMPLES: 8, SAMPLE_VECTORS: generatePdSamplePointInitializer(8, 2, 1),
      },
      uniforms: UniformsUtils.clone(PoissonDenoiseShader.uniforms),
      depthTest: false, depthWrite: false, toneMapped: false,
    });
    const denoise = this.denoiseMaterial.uniforms;
    denoise.tDepth.value = depth;
    denoise.tNoise.value = this.denoiseNoise;
    denoise.radius.value = 4;
    denoise.lumaPhi.value = 0.4;
    denoise.depthPhi.value = 0.3;
    denoise.normalPhi.value = 8;
    this.setCamera(camera);
  }

  /** A projection change invalidates only the relevant shader define. */
  setCamera(camera: ProjectionCamera): void {
    const perspective = camera.isPerspectiveCamera ? 1 : 0;
    if (this.material.defines.PERSPECTIVE_CAMERA !== perspective) {
      this.material.defines.PERSPECTIVE_CAMERA = perspective;
      this.material.needsUpdate = true;
    }
    this.update(camera);
  }

  /** Refreshes projection and view uniforms after camera movement, without allocating. */
  update(camera: ProjectionCamera): void {
    const u = this.material.uniforms;
    u.cameraNear.value = camera.near ?? 0.1;
    u.cameraFar.value = camera.far ?? 1000;
    u.cameraProjectionMatrix.value.copy(camera.projectionMatrix);
    u.cameraProjectionMatrixInverse.value.copy(camera.projectionMatrixInverse);
    u.cameraWorldMatrix.value.copy(camera.matrixWorld);
    this.denoiseMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(camera.projectionMatrixInverse);
  }

  setSize(width: number, height: number): void {
    this.material.uniforms.resolution.value.set(width, height);
    this.denoiseMaterial.uniforms.resolution.value.set(width, height);
  }

  dispose(): void {
    this.material.dispose();
    this.denoiseMaterial.dispose();
    this.noise.dispose();
    this.denoiseNoise.dispose();
  }
}
