import { Color, type ColorRepresentation, MeshStandardMaterial, ShaderChunk, Vector2, Vector4 } from 'three';

export type GraphicSurfaceTuning = Readonly<{
  rampStrength: number;
  /** Retained art-review metadata; actor sampling itself always uses the native mip. */
  actorMipBias: number;
  actorDetail: number;
  specularGain: number;
  actorNormalGain: number;
  floorNormalGain: number;
}>;

export type GraphicStrength = 'subtle' | 'medium' | 'bold';

export const GRAPHIC_SURFACE_STRENGTHS: Readonly<Record<GraphicStrength, GraphicSurfaceTuning>> = Object.freeze({
  subtle: Object.freeze({ rampStrength: .62, actorMipBias: 0, actorDetail: .55, specularGain: .76, actorNormalGain: .34, floorNormalGain: .38 }),
  medium: Object.freeze({ rampStrength: .82, actorMipBias: 0, actorDetail: .78, specularGain: .50, actorNormalGain: .32, floorNormalGain: .22 }),
  bold: Object.freeze({ rampStrength: 1, actorMipBias: 0, actorDetail: 1, specularGain: .25, actorNormalGain: .30, floorNormalGain: .10 }),
});
export const DEFAULT_GRAPHIC_SURFACE_TUNING = GRAPHIC_SURFACE_STRENGTHS.bold;

const installed = new WeakSet<MeshStandardMaterial>();
const actorBases = new WeakMap<MeshStandardMaterial, { value: Color }>();
const shadowPlanes = new WeakMap<MeshStandardMaterial, { value: number }>();
const enabled = { value: 1 };
const strength = { value: 1 };
// Shared references also work on MaterialWarmup's retained hook copies.
const response = { value: new Vector4(1, .25, 0, 1) };
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

/** SHADER25b: a creature's shadow plane as a fraction of its lit plane (uniform, no program change). */
export function setGraphicShadowPlane(material: MeshStandardMaterial, value: number): void {
  let plane = shadowPlanes.get(material);
  if (!plane) { plane = { value: .30 }; shadowPlanes.set(material, plane); }
  plane.value = Math.max(0, Math.min(1, value));
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
uniform float graphicMarine;
uniform vec4 graphicResponse;
uniform vec2 graphicNormalGain;
uniform vec2 graphicSurfaceKind;
uniform float graphicStrength;
uniform vec3 graphicActorBase;
uniform float graphicShadowPlane;

// Four broad lit values. Soft transition zones and an analytic terminator
// preserve movement continuity instead of hard quantization or screen noise.
float graphicDiffuseRamp(float value) {
  float band = .12 + .27 * smoothstep(.12, .27, value)
    + .31 * smoothstep(.42, .57, value) + .30 * smoothstep(.73, .89, value);
  float subtle = band * smoothstep(0.0, .09, value);
  // Three clear values with narrow, stable transitions between plateaus.
  float bold = (.16 + .35 * smoothstep(.285, .315, value)
    + .49 * smoothstep(.665, .695, value)) * smoothstep(0.0, .07, value);
  return mix(subtle, bold, graphicStrength);
}
vec3 graphicDiffuseTint(float value) {
  return mix(vec3(1.0), mix(vec3(.64, .81, 1.12), vec3(1.0), smoothstep(.23, .45, value)), graphicStrength);
}
float graphicActorTone(float value) {
  return .38 + .48 * smoothstep(.18, .195, value) + .40 * smoothstep(.42, .44, value);
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
    'texture2D( map, vMapUv, graphicEnabled * graphicSurfaceKind.y * graphicStrength * 2.5 )')
  .replace('diffuseColor *= sampledDiffuseColor;', `
  float graphicMapLuma = dot(sampledDiffuseColor.rgb, vec3(.2126, .7152, .0722));
  float graphicMapValue = graphicSoftValue(graphicMapLuma);
  sampledDiffuseColor.rgb *= mix(1.0, graphicMapValue / max(graphicMapLuma, .0001),
    graphicEnabled * graphicSurfaceKind.x * graphicResponse.w);
  // Preserve only genuinely green sacs. The former yellow/green test also
  // exempted beige chitin, erasing family colors across most large enemies.
  float graphicSac = smoothstep(.055, .16, sampledDiffuseColor.g - max(sampledDiffuseColor.r, sampledDiffuseColor.b))
    * smoothstep(.12, .30, sampledDiffuseColor.g);
  vec3 graphicFamilyTone = graphicActorBase * graphicActorTone(graphicMapLuma);
  diffuseColor *= sampledDiffuseColor;
  if(graphicMarine>.5){
    // HERO19: two calm values, as on the title: ceramic plates and a warm dark-grey undersuit
    // (not black), split above the gunmetal/grime range so worn plates never break into patches.
    // Chromatic atlas zones (cyan visor, glow strips) keep their colour; rig paint is applied by
    // the actor material using the authored mask.
    float marineValue=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
    float marineAtlasChroma=max(diffuseColor.r,max(diffuseColor.g,diffuseColor.b))-min(diffuseColor.r,min(diffuseColor.g,diffuseColor.b));
    vec3 marineFlat=mix(vec3(.060,.055,.050),vec3(.76,.78,.80),smoothstep(.30,.42,marineValue));
    diffuseColor.rgb=mix(marineFlat,diffuseColor.rgb,smoothstep(.12,.22,marineAtlasChroma));
  }
  // Family values replace the inherited photographic/material tint together;
  // a pale source multiply must not bleach graphite armor or a russet crawler.
  diffuseColor.rgb = mix(diffuseColor.rgb, graphicFamilyTone,
    graphicEnabled * graphicStrength * graphicSurfaceKind.x * graphicResponse.w * (1.0 - graphicSac));`);
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
  if (key.includes(':graphic-surface-v4') || key.includes(':graphic-surface-hero19')) return;
  installed.add(material);
  const previous = material.onBeforeCompile;
  // K10's original flat zones replace inherited photographic skins. Keep the
  // common lighting bands, but let their authored atlas define material values.
  const authoredMapResponse = material.userData.k10Original ? mapResponse.replace(
    'graphicEnabled * graphicStrength * graphicSurfaceKind.x * graphicResponse.w * (1.0 - graphicSac)', '0.0',
  ) : mapResponse;
  let actorBase = actorBases.get(material);
  if (!actorBase) { actorBase = { value: new Color(0x647b8b) }; actorBases.set(material, actorBase); }
  // actorMaterial is an ownership marker also used by room props; use the
  // explicit actor shader family instead of flattening every owned material.
  let shadowPlane = shadowPlanes.get(material);
  if (!shadowPlane) { shadowPlane = { value: .30 }; shadowPlanes.set(material, shadowPlane); }
  const kind = { value: new Vector2(key.includes(':actor-surface-') ? 1 : 0,
    /floor|deck/.test(material.name)||material.userData.floorDressing===true ? 1 : 0) };
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    Object.assign(shader.uniforms, {
      graphicEnabled: enabled, graphicMarine:{value:material.userData.containmentMarineSurface?1:0}, graphicResponse: response,
      graphicNormalGain: normalGain, graphicSurfaceKind: kind,
      graphicStrength: strength, graphicActorBase: actorBase, graphicShadowPlane: shadowPlane,
    });
    shader.fragmentShader = declarations + shader.fragmentShader
      .replace('#include <map_fragment>', authoredMapResponse)
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
        // SHADE15: no clipped specular on characters (it read as blown highlights / pattern).
        float graphicSpecularGain = mix(1.0, graphicResponse.y, graphicEnabled) * (1.0 - .92 * graphicSurfaceKind.x);
        reflectedLight.directSpecular *= graphicSpecularGain;
        reflectedLight.indirectSpecular *= graphicSpecularGain;
        float graphicShadowBand = 1.0 - smoothstep(.018, .11,
          dot(reflectedLight.directDiffuse + reflectedLight.indirectDiffuse, vec3(.2126, .7152, .0722)));
        reflectedLight.indirectDiffuse *= mix(vec3(1.0), vec3(.64, .81, 1.12),
          graphicEnabled * graphicStrength * graphicShadowBand);
        // Three broad actor lighting values retain the room's light hue while
        // bounding the suit-fill response. Hit, status and dissolve emission is
        // intentionally outside this diffuse-only treatment.
        vec3 graphicActorDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
        float graphicActorAlbedo = max(.008, dot(diffuseColor.rgb, vec3(.2126,.7152,.0722)));
        float graphicActorIncident = dot(graphicActorDiffuse, vec3(.2126,.7152,.0722)) / graphicActorAlbedo;
        // SHADE15: characters get two soft bands (shadow ~62% of lit, short smooth terminator), no
        // third highlight step; architecture keeps its own hard response elsewhere.
        float graphicActorLight = .62 + .38 * smoothstep(.30,.62,graphicActorIncident);
        vec3 graphicActorHue = clamp(graphicActorDiffuse / max(.008,dot(graphicActorDiffuse,vec3(.2126,.7152,.0722))),vec3(.55),vec3(1.4));
        // Marine value steps are diffuse reflectance, not emission. Mostly neutral
        // incident hue preserves ivory/graphite and the saturated authored rig panels.
        if(graphicMarine>.5){graphicActorLight=.66+.34*smoothstep(.30,.62,graphicActorIncident);graphicActorHue=vec3(1.);}
        // SHADER25: creatures share the marine's two-plane grammar with a harder step: a lit
        // plane and a shadow plane at 30 % of it (linear, ≈25 % display value), one pixel-wide antialiased terminator.
        // The plane is chosen by a fixed screen key from the upper left (the rake the old
        // gradient used), so every room splits a dorsal dome into one lit and one shadow plane.
        else if(graphicSurfaceKind.x>.5){
          float graphicKeyFacing=dot(geometryNormal,vec3(-.52,.42,.74));
          float graphicTerminator=max(fwidth(graphicKeyFacing),.02);
          graphicActorLight=mix(graphicShadowPlane,1.0,smoothstep(.64-graphicTerminator,.64+graphicTerminator,graphicKeyFacing));}
        vec3 graphicActorBands = diffuseColor.rgb * graphicActorLight * graphicActorHue;
        reflectedLight.directDiffuse = mix(reflectedLight.directDiffuse, graphicActorBands,
          graphicEnabled * graphicStrength * graphicSurfaceKind.x);
        reflectedLight.indirectDiffuse *= 1.0 - graphicEnabled * graphicStrength * graphicSurfaceKind.x;
        // A narrow highlight on upper-facing bevels, without normal-map noise.
        #ifdef FLAT_SHADED
          vec3 graphicBevelNormal = normalize(cross(dFdx(vViewPosition), dFdy(vViewPosition)));
        #else
          vec3 graphicBevelNormal = normalize(vNormal);
        #endif
        float graphicBevel = pow(1.0 - clamp(dot(graphicBevelNormal, normalize(vViewPosition)), 0.0, 1.0), 5.0)
          * smoothstep(.08, .50, dot(graphicBevelNormal, normalize(viewMatrix[1].xyz)));
        totalEmissiveRadiance += vec3(.16, .21, .24) * graphicBevel * graphicEnabled * graphicStrength * mix(1.0,.12,graphicSurfaceKind.x);`);
  };
  material.customProgramCacheKey = () => `${key}:${material.userData.containmentMarineSurface ? "graphic-surface-hero19" : "graphic-surface-v4"}`;
  material.needsUpdate = true;
}
