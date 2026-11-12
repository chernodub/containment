import { Camera, DepthTexture, Matrix4, ShaderMaterial, Texture, UniformsUtils } from 'three';
import { generateMagicSquareNoise, GTAOShader } from 'three/addons/shaders/GTAOShader.js';
import {
  generatePdSamplePointInitializer, PoissonDenoiseShader,
} from 'three/addons/shaders/PoissonDenoiseShader.js';
import { screenVertex } from './shaders';

type ProjectionCamera = Camera & { near?: number; far?: number; isPerspectiveCamera?: boolean };

// Sample one stored normal, never a bilinear blend across a silhouette. If the
// selected half-resolution pixel belongs to a different depth surface, retain
// the original full-resolution reconstruction for that edge sample.
const packedNormalLookup = /* glsl */ `
  ivec2 size = textureSize(tNormal, 0);
  ivec2 pixel = clamp(ivec2(uv * vec2(size)), ivec2(0), size - ivec2(1));
  vec3 normal = normalize(unpackRGBToNormal(texelFetch(tNormal, pixel, 0).gba));
  vec2 packedUv = (vec2(pixel) + 0.5) / vec2(size);
  vec3 packedPosition = getViewPosition(packedUv, getDepth(packedUv));
  vec3 samplePosition = getViewPosition(uv, getDepth(uv));
  float planeError = abs(dot(packedPosition - samplePosition, normal));
  if (planeError > 0.015) return computeNormalFromDepth(uv);
  return normal;`;
const packedDenoiseFragment = PoissonDenoiseShader.fragmentShader.replace(
  'return unpackRGBToNormal(textureLod(tNormal, uv, 0.).rgb);', packedNormalLookup,
);

/** Three's horizon-integrated GTAO and bilateral Poisson denoise, using existing depth. */
export class DepthGTAO {
  readonly noise = generateMagicSquareNoise(5);
  readonly denoiseNoise = generateMagicSquareNoise(7);
  readonly material: ShaderMaterial;
  readonly denoiseMaterial: ShaderMaterial;

  constructor(depth: DepthTexture, camera: Camera, packedAO: Texture, geometry?: Texture) {
    this.material = new ShaderMaterial({
      name: 'Containment depth GTAO', vertexShader: screenVertex,
      fragmentShader: GTAOShader.fragmentShader.replace('return unpackRGBToNormal(textureLod(tNormal, uv, 0.).rgb);', `vec4 geometry=textureLod(tNormal,uv,0.);geometry.zw*=255.0; if(geometry.z<.5||geometry.w>6.5||abs(geometry.z-floor(geometry.z+.5))>.01||abs(geometry.w-floor(geometry.w+.5))>.01)return computeNormalFromDepth(uv); vec2 e=geometry.rg*2.0-1.0; vec3 n=vec3(e,1.0-abs(e.x)-abs(e.y)); if(n.z<0.0)n.xy=(1.0-abs(n.yx))*sign(n.xy); return normalize(n);`),
      defines: {
        ...GTAOShader.defines, NORMAL_VECTOR_TYPE: geometry ? 1 : 0, SAMPLES: 12,
        FRAGMENT_OUTPUT: 'vec4(ao, packNormalToRGB(viewNormal))',
      },
      uniforms: UniformsUtils.clone(GTAOShader.uniforms),
      depthTest: false, depthWrite: false, toneMapped: false,
    });
    const u = this.material.uniforms;
    u.tDepth.value = depth;
    u.tNormal.value = geometry ?? null;
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
      fragmentShader: packedDenoiseFragment,
      defines: {
        ...PoissonDenoiseShader.defines, NORMAL_VECTOR_TYPE: 1,
        SAMPLES: 8, SAMPLE_VECTORS: generatePdSamplePointInitializer(8, 2, 1),
        SAMPLE_LUMINANCE: 'a.r', FRAGMENT_OUTPUT: 'vec4(vec3(denoised.r), 1.0)',
      },
      uniforms: UniformsUtils.clone(PoissonDenoiseShader.uniforms),
      depthTest: false, depthWrite: false, toneMapped: false,
    });
    const denoise = this.denoiseMaterial.uniforms;
    denoise.tDepth.value = depth;
    denoise.tDiffuse.value = packedAO;
    denoise.tNormal.value = packedAO;
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
