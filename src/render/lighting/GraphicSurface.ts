import { Color, type ColorRepresentation, MeshStandardMaterial, ShaderChunk, Vector2, Vector4 } from 'three';

export type GraphicSurfaceTuning = Readonly<{
  rampStrength: number;
  actorMipBias: number;
  actorDetail: number;
  specularGain: number;
  actorNormalGain: number;
  floorNormalGain: number;
}>;

export type GraphicStrength = 'subtle' | 'medium' | 'bold';

export const GRAPHIC_SURFACE_STRENGTHS: Readonly<Record<GraphicStrength, GraphicSurfaceTuning>> = Object.freeze({
  subtle: Object.freeze({ rampStrength: .62, actorMipBias: 1.9, actorDetail: .55, specularGain: .76, actorNormalGain: .34, floorNormalGain: .38 }),
  medium: Object.freeze({ rampStrength: .82, actorMipBias: 2.45, actorDetail: .78, specularGain: .50, actorNormalGain: .32, floorNormalGain: .22 }),
  bold: Object.freeze({ rampStrength: 1, actorMipBias: 3, actorDetail: .96, specularGain: .25, actorNormalGain: .30, floorNormalGain: .10 }),
});
export const DEFAULT_GRAPHIC_SURFACE_TUNING = GRAPHIC_SURFACE_STRENGTHS.bold;

const installed = new WeakSet<MeshStandardMaterial>();
const actorBases = new WeakMap<MeshStandardMaterial, { value: Color }>();
const enabled = { value: 1 };
const strength = { value: 1 };
// Shared references also work on MaterialWarmup's retained hook copies.
const response = { value: new Vector4(1, .25, 3, .96) };
const normalGain = { value: new Vector2(.30, .10) };

/** Select an art direction using uniforms; subtle reproduces the first review. */
export function setGraphicStrength(value: GraphicStrength): void {
  strength.value = value === 'bold' ? 1 : value === 'medium' ? .5 : 0;
  setGraphicSurfaceTuning(GRAPHIC_SURFACE_STRENGTHS[value]);
}

/** Assign the actor family's broad plate color without changing its program. */
export function setGraphicActorBase(material: MeshStandardMaterial, color: ColorRepresentation): void {
  let base = actorBases.get(material);
  if (!base) { base = { value: new Color(0x647b8b) }; actorBases.set(material, base); }
  base.value.set(color);
}

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
uniform float graphicStrength;
uniform vec3 graphicActorBase;

// Four broad lit values. Soft transition zones and an analytic terminator
// preserve movement continuity instead of hard quantization or screen noise.
float graphicDiffuseRamp(float value) {
  float band = .12 + .27 * smoothstep(.12, .27, value)
    + .31 * smoothstep(.42, .57, value) + .30 * smoothstep(.73, .89, value);
  float subtle = band * smoothstep(0.0, .09, value);
  // Three clear values, with 12% transition zones between their plateaus.
  float bold = (.16 + .35 * smoothstep(.24, .36, value)
    + .49 * smoothstep(.62, .74, value)) * smoothstep(0.0, .07, value);
  return mix(subtle, bold, graphicStrength);
}
vec3 graphicDiffuseTint(float value) {
  return mix(vec3(1.0), mix(vec3(.64, .81, 1.12), vec3(1.0), smoothstep(.23, .45, value)), graphicStrength);
}
float graphicActorTone(float value) {
  return .46 + .53 * smoothstep(.12, .17, value) + .55 * smoothstep(.34, .39, value);
}
float graphicSoftValue(float value) {
  float scaled = value * 7.0;
  return (floor(scaled) + smoothstep(.18, .82, fract(scaled))) / 7.0;
}
`;

// Change angular diffuse response, not source light energy or shadow visibility.
const directResponse = ShaderChunk.lights_physical_pars_fragment.replace(
  'reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );',
  `vec3 graphicIrradiance = mix(irradiance, graphicDiffuseRamp(dotNL) * directLight.color * graphicDiffuseTint(dotNL),
    graphicEnabled * graphicResponse.x);
  reflectedLight.directDiffuse += graphicIrradiance * BRDF_Lambert( material.diffuseContribution );`,
);
const directCall = 'if ( directLight.visible ) { RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight ); }';
const minorPointResponse = /* glsl */ `
// The first four point slots are authored practicals. Minor pooled flashes and
// status lights retain colored diffuse energy but skip GGX/DFG texture work.
#if UNROLLED_LOOP_INDEX >= 4
 if ( directLight.visible ) {
  if (graphicEnabled > .5) {
   float graphicMinorDot = saturate(dot(geometryNormal, directLight.direction));
   float graphicMinorDiffuse = mix(graphicMinorDot, graphicDiffuseRamp(graphicMinorDot), graphicResponse.x);
   reflectedLight.directDiffuse += graphicMinorDiffuse * directLight.color * graphicDiffuseTint(graphicMinorDot) * BRDF_Lambert(material.diffuseContribution);
  } else {
   RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
  }
 }
#else
 ${directCall}
#endif
`;
const mapResponse = ShaderChunk.map_fragment
  .replace('texture2D( map, vMapUv )',
    'texture2D( map, vMapUv, graphicEnabled * (graphicSurfaceKind.x * graphicResponse.z + graphicSurfaceKind.y * graphicStrength * 2.5) )')
  .replace('diffuseColor *= sampledDiffuseColor;', `
  float graphicMapLuma = dot(sampledDiffuseColor.rgb, vec3(.2126, .7152, .0722));
  float graphicMapValue = graphicSoftValue(graphicMapLuma);
  sampledDiffuseColor.rgb *= mix(1.0, graphicMapValue / max(graphicMapLuma, .0001),
    graphicEnabled * graphicSurfaceKind.x * graphicResponse.w);
  // Preserve yellow/green organic sacs; family plate color replaces photographic
  // chitin while the independent identity accents retain their authored hues.
  float graphicSac = smoothstep(.12, .35, min(sampledDiffuseColor.r, sampledDiffuseColor.g) - sampledDiffuseColor.b)
    * smoothstep(.65, 1.0, sampledDiffuseColor.g / max(sampledDiffuseColor.r, .001));
  vec3 graphicFamilyTone = graphicActorBase * graphicActorTone(graphicMapLuma);
  sampledDiffuseColor.rgb = mix(sampledDiffuseColor.rgb, graphicFamilyTone,
    graphicEnabled * graphicStrength * graphicSurfaceKind.x * graphicResponse.w * (1.0 - graphicSac));
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
  let actorBase = actorBases.get(material);
  if (!actorBase) { actorBase = { value: new Color(0x647b8b) }; actorBases.set(material, actorBase); }
  // actorMaterial is an ownership marker also used by room props; use the
  // explicit actor shader family instead of flattening every owned material.
  const kind = { value: new Vector2(key.includes(':actor-surface-') ? 1 : 0,
    /floor|deck/.test(material.name) ? 1 : 0) };
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    Object.assign(shader.uniforms, {
      graphicEnabled: enabled, graphicResponse: response,
      graphicNormalGain: normalGain, graphicSurfaceKind: kind,
      graphicStrength: strength, graphicActorBase: actorBase,
    });
    shader.fragmentShader = declarations + shader.fragmentShader
      .replace('#include <map_fragment>', mapResponse)
      .replace('#include <normal_fragment_maps>', normals)
      .replace('#include <lights_physical_pars_fragment>', directResponse)
      .replace('float deckGrain=', 'float deckGrain=0.0;if(graphicEnabled*graphicStrength<.99)deckGrain=')
      .replace('float deckScratchPatch=', 'float deckScratchPatch=0.0;if(graphicEnabled*graphicStrength<.99)deckScratchPatch=')
      .replace('float deckScratch=', 'float deckScratch=0.0;if(graphicEnabled*graphicStrength<.99)deckScratch=')
      .replace('deckGrain*roomFloorPattern.w', 'deckGrain*roomFloorPattern.w*(1.0-graphicEnabled*graphicStrength)')
      .replace('vec3(.002,.0023,.0023)*deckScratch', 'vec3(.002,.0023,.0023)*deckScratch*(1.0-graphicEnabled*graphicStrength)')
      .replace('deckGrain*.008', 'deckGrain*.008*(1.0-graphicEnabled*graphicStrength)')
      // LocalLightShading expands point → spot → directional loops first. Only
      // its first direct call belongs to point lights; later calls stay intact.
      .replace(directCall, minorPointResponse)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        float graphicRoughnessFloor = mix(.38, .28, graphicSurfaceKind.y);
        graphicRoughnessFloor = mix(graphicRoughnessFloor, .56, graphicSurfaceKind.x);
        roughnessFactor = mix(roughnessFactor, max(roughnessFactor, graphicRoughnessFloor), graphicEnabled);`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        float graphicSpecularGain = mix(1.0, graphicResponse.y, graphicEnabled);
        reflectedLight.directSpecular *= graphicSpecularGain;
        reflectedLight.indirectSpecular *= graphicSpecularGain;
        float graphicShadowBand = 1.0 - smoothstep(.018, .11,
          dot(reflectedLight.directDiffuse + reflectedLight.indirectDiffuse, vec3(.2126, .7152, .0722)));
        reflectedLight.indirectDiffuse *= mix(vec3(1.0), vec3(.64, .81, 1.12),
          graphicEnabled * graphicStrength * graphicShadowBand);
        // A narrow highlight on upper-facing bevels, without normal-map noise.
        #ifdef FLAT_SHADED
          vec3 graphicBevelNormal = normalize(cross(dFdx(vViewPosition), dFdy(vViewPosition)));
        #else
          vec3 graphicBevelNormal = normalize(vNormal);
        #endif
        float graphicBevel = pow(1.0 - clamp(dot(graphicBevelNormal, normalize(vViewPosition)), 0.0, 1.0), 5.0)
          * smoothstep(.08, .50, dot(graphicBevelNormal, normalize(viewMatrix[1].xyz)));
        totalEmissiveRadiance += vec3(.16, .21, .24) * graphicBevel * graphicEnabled * graphicStrength;`);
  };
  material.customProgramCacheKey = () => `${key}:graphic-surface-v1`;
  material.needsUpdate = true;
}
