import { MeshStandardMaterial, ShaderChunk, Vector2, Vector4 } from 'three';

export type GraphicSurfaceTuning = Readonly<{
  rampStrength: number;
  actorMipBias: number;
  actorDetail: number;
  specularGain: number;
  actorNormalGain: number;
  floorNormalGain: number;
}>;

export const DEFAULT_GRAPHIC_SURFACE_TUNING: GraphicSurfaceTuning = Object.freeze({
  rampStrength: .72,
  actorMipBias: 1.65,
  actorDetail: .45,
  specularGain: .76,
  actorNormalGain: .34,
  floorNormalGain: .38,
});

const installed = new WeakSet<MeshStandardMaterial>();
const enabled = { value: 1 };
// Shared references also work on MaterialWarmup's retained hook copies.
const response = { value: new Vector4(.72, .76, 1.65, .45) };
const normalGain = { value: new Vector2(.34, .38) };

/** Toggle the complete surface treatment without recompilation or material churn. */
export function setGraphicShadingEnabled(value: boolean): void { enabled.value = value ? 1 : 0; }

/** Art-direction knobs are uniforms, never new shader defines or program variants. */
export function setGraphicSurfaceTuning(partial: Partial<GraphicSurfaceTuning>): void {
  const bounded = (value: number | undefined, previous: number, max = 1) =>
    typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(max, value)) : previous;
  response.value.set(
    bounded(partial.rampStrength, response.value.x),
    bounded(partial.specularGain, response.value.y),
    bounded(partial.actorMipBias, response.value.z, 3),
    bounded(partial.actorDetail, response.value.w),
  );
  normalGain.value.set(
    bounded(partial.actorNormalGain, normalGain.value.x),
    bounded(partial.floorNormalGain, normalGain.value.y),
  );
}

const declarations = /* glsl */ `
uniform float graphicEnabled;
uniform vec4 graphicResponse;
uniform vec2 graphicNormalGain;
uniform vec2 graphicSurfaceKind;

// Four broad lit values. Soft transition zones and an analytic terminator
// preserve movement continuity instead of hard quantization or screen noise.
float graphicDiffuseRamp(float value) {
  float band = .12 + .27 * smoothstep(.12, .27, value)
    + .31 * smoothstep(.42, .57, value) + .30 * smoothstep(.73, .89, value);
  return band * smoothstep(0.0, .09, value);
}
float graphicSoftValue(float value) {
  float scaled = value * 7.0;
  return (floor(scaled) + smoothstep(.18, .82, fract(scaled))) / 7.0;
}
`;

// Change angular diffuse response, not source light energy or shadow visibility.
const directResponse = ShaderChunk.lights_physical_pars_fragment.replace(
  'reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );',
  `vec3 graphicIrradiance = mix(irradiance, graphicDiffuseRamp(dotNL) * directLight.color,
    graphicEnabled * graphicResponse.x);
  reflectedLight.directDiffuse += graphicIrradiance * BRDF_Lambert( material.diffuseContribution );`,
);
const mapResponse = ShaderChunk.map_fragment
  .replace('texture2D( map, vMapUv )',
    'texture2D( map, vMapUv, graphicEnabled * graphicSurfaceKind.x * graphicResponse.z )')
  .replace('diffuseColor *= sampledDiffuseColor;', `
  float graphicMapLuma = dot(sampledDiffuseColor.rgb, vec3(.2126, .7152, .0722));
  float graphicMapValue = graphicSoftValue(graphicMapLuma);
  sampledDiffuseColor.rgb *= mix(1.0, graphicMapValue / max(graphicMapLuma, .0001),
    graphicEnabled * graphicSurfaceKind.x * graphicResponse.w);
  diffuseColor *= sampledDiffuseColor;`);
const normals = ShaderChunk.normal_fragment_maps.replace(
  'mapN.xy *= normalScale;',
  `float graphicNormal = mix(1.0, graphicNormalGain.y, graphicSurfaceKind.y);
  graphicNormal = mix(graphicNormal, graphicNormalGain.x, graphicSurfaceKind.x);
  mapN.xy *= normalScale * mix(1.0, graphicNormal, graphicEnabled);`,
);

/**
 * One central standard-material patch for actors and architecture. Existing
 * geometry, actor dissolve/hit, floor, local-light and authored hooks are chained.
 * No textures, render targets or disposal obligations are introduced.
 */
export function patchGraphicSurface(material: MeshStandardMaterial): void {
  if (installed.has(material) || material.transparent) return;
  const key = material.customProgramCacheKey();
  // Retained preparation proxies copy an already-patched hook and cache key.
  if (key.includes(':graphic-surface-v1')) return;
  installed.add(material);
  const previous = material.onBeforeCompile;
  // actorMaterial is an ownership marker also used by room props; use the
  // explicit actor shader family instead of flattening every owned material.
  const kind = { value: new Vector2(key.includes(':actor-surface-') ? 1 : 0,
    /floor|deck/.test(material.name) ? 1 : 0) };
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    Object.assign(shader.uniforms, {
      graphicEnabled: enabled, graphicResponse: response,
      graphicNormalGain: normalGain, graphicSurfaceKind: kind,
    });
    shader.fragmentShader = declarations + shader.fragmentShader
      .replace('#include <map_fragment>', mapResponse)
      .replace('#include <normal_fragment_maps>', normals)
      .replace('#include <lights_physical_pars_fragment>', directResponse)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        float graphicRoughnessFloor = mix(.38, .28, graphicSurfaceKind.y);
        graphicRoughnessFloor = mix(graphicRoughnessFloor, .56, graphicSurfaceKind.x);
        roughnessFactor = mix(roughnessFactor, max(roughnessFactor, graphicRoughnessFloor), graphicEnabled);`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        float graphicSpecularGain = mix(1.0, graphicResponse.y, graphicEnabled);
        reflectedLight.directSpecular *= graphicSpecularGain;
        reflectedLight.indirectSpecular *= graphicSpecularGain;`);
  };
  material.customProgramCacheKey = () => `${key}:graphic-surface-v1`;
  material.needsUpdate = true;
}
