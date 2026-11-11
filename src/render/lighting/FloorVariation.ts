import * as T from 'three';
import type { ShipEnvironment } from '../ShipEnvironments';

type FloorUniforms = {
  wetness: { value: number };
  grime: { value: number };
  albedoGain: { value: number };
  pattern: { value: T.Vector4 };
};
const surfaces = new WeakMap<T.MeshStandardMaterial, FloorUniforms>();
const patterns: Readonly<Record<ShipEnvironment, readonly [number, number, number, number]>> = {
  cryogenics: [4.6, 3.2, 0, .035], habitation: [3.8, 2.4, 1, .025],
  security: [3.6, 4.8, 2, .05], cargo: [5.4, 3.4, 3, .075],
  communications: [2.2, 2.2, 4, .04], engineering: [3.2, 4.4, 5, .075],
  maintenance: [4.2, 3.0, 6, .06], infested: [3.8, 4.6, 7, .08],
  containment: [4.4, 4.4, 8, .018], reactor: [5.0, 3.4, 9, .065],
};

/** World-space plate, wear and environment identity; no repeating image motif or extra draw. */
export function applyFloorVariation(material: T.MeshStandardMaterial, environment: ShipEnvironment) {
  let uniforms = surfaces.get(material);
  if (!uniforms) {
    uniforms = { wetness: { value: 0 }, grime: { value: .15 }, albedoGain: { value: 4.8 }, pattern: { value: new T.Vector4() } };
    surfaces.set(material, uniforms);
    const previous = material.onBeforeCompile;
    const previousKey = material.customProgramCacheKey();
    const params = uniforms;
    const genericDeck = material.name === 'environment-floor';
    material.onBeforeCompile = (shader, renderer) => {
      previous.call(material, shader, renderer);
      shader.uniforms.roomFloorWetness = params.wetness;
      shader.uniforms.roomFloorGrime = params.grime;
      shader.uniforms.roomFloorAlbedoGain = params.albedoGain;
      shader.uniforms.roomFloorPattern = params.pattern;
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vRoomFloorPosition;');
      shader.vertexShader = shader.vertexShader.replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vec4 roomFloorLocal=vec4(transformed,1.0);
        #ifdef USE_INSTANCING
          roomFloorLocal=instanceMatrix*roomFloorLocal;
        #endif
        vRoomFloorPosition=(modelMatrix*roomFloorLocal).xyz;`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
        varying vec3 vRoomFloorPosition;
        uniform float roomFloorWetness;
        uniform float roomFloorGrime;
        uniform float roomFloorAlbedoGain;
        uniform vec4 roomFloorPattern;
        float roomFloorHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float roomFloorNoise(vec2 p){
          vec2 cell=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
          return mix(mix(roomFloorHash(cell),roomFloorHash(cell+vec2(1.0,0.0)),f.x),
            mix(roomFloorHash(cell+vec2(0.0,1.0)),roomFloorHash(cell+vec2(1.0,1.0)),f.x),f.y);
        }
        float roomFloorLine(float d,float width){return 1.0-smoothstep(width,width+max(fwidth(d),.0008),d);}`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        ${genericDeck ? 'diffuseColor.rgb=mix(vec3(.065,.072,.078),diffuseColor.rgb*roomFloorAlbedoGain,.86);' : ''}
        vec2 roomFloorP=vRoomFloorPosition.xz;
        float roomFloorMacro=roomFloorNoise(roomFloorP*0.24);
        float roomFloorStain=smoothstep(0.36,0.78,roomFloorMacro+roomFloorNoise(roomFloorP*0.73)*0.22);
        float roomFloorScuff=roomFloorNoise(roomFloorP*vec2(0.11,2.8));
        float roomFloorWet=smoothstep(0.46,0.72,roomFloorMacro)*roomFloorWetness;
        diffuseColor.rgb*=1.0-roomFloorGrime*(roomFloorStain*0.5+roomFloorScuff*0.15)-roomFloorWet*0.08;
        // Large un-staggered ship plates replace the small brick image. Individual
        // plates vary by their world position; scratches cross their boundaries.
        vec2 deckCell=floor(roomFloorP/roomFloorPattern.xy);
        vec2 deckUV=fract(roomFloorP/roomFloorPattern.xy);
        vec2 deckEdge=min(deckUV,1.0-deckUV)*roomFloorPattern.xy;
        float deckJoint=roomFloorLine(min(deckEdge.x,deckEdge.y),.013);
        float deckWear=roomFloorLine(min(deckEdge.x,deckEdge.y),.032)-deckJoint;
        float deckIdentity=roomFloorPattern.z;
        float deckGrain=roomFloorNoise(roomFloorP*vec2(2.3,37.0))-.5;
        float deckScrape=smoothstep(.71,.87,roomFloorNoise(roomFloorP*vec2(.14,6.7)))*roomFloorNoise(roomFloorP*.57);
        float deckPanel=roomFloorHash(deckCell+vec2(7.0,29.0));
        ${genericDeck ? `diffuseColor.rgb*=.96+deckPanel*.08;
        diffuseColor.rgb*=1.0-deckJoint*.35;
        diffuseColor.rgb+=vec3(.006,.008,.009)*deckWear;` : ''}
        diffuseColor.rgb*=1.0+deckGrain*roomFloorPattern.w+deckScrape*.045;
        if(deckIdentity<.5){
          float frost=smoothstep(.58,.83,roomFloorNoise(roomFloorP*.45)+deckWear*.18);
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.08,1.13,1.16),frost*.35);
        }else if(deckIdentity<1.5){
          diffuseColor.rgb*=1.0+sin(roomFloorP.x*15.0+roomFloorNoise(roomFloorP*.4))*.008;
        }else if(deckIdentity<2.5){
          float tread=roomFloorLine(abs(fract((roomFloorP.x+roomFloorP.y)*7.5)-.5),.025);
          diffuseColor.rgb*=1.0-tread*.045;
        }else if(deckIdentity<3.5){
          diffuseColor.rgb*=1.0-deckScrape*.11;
        }else if(deckIdentity<4.5){
          float access=roomFloorLine(abs(fract(roomFloorP.x/2.2)-.5),.006)*roomFloorLine(abs(fract(roomFloorP.y/2.2)-.5),.035);
          diffuseColor.rgb*=1.0-access*.2;
        }else if(deckIdentity<5.5){
          vec2 grateUV=fract(roomFloorP*vec2(1.35,8.0));
          float grate=smoothstep(.18,.23,grateUV.x)*(1.0-smoothstep(.77,.82,grateUV.x))*smoothstep(.2,.28,grateUV.y)*(1.0-smoothstep(.64,.72,grateUV.y));
          diffuseColor.rgb*=1.0-grate*.11;
        }else if(deckIdentity<6.5){
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.91,1.015,1.035),roomFloorWet*.16);
        }else if(deckIdentity<7.5){
          float tissue=roomFloorNoise(roomFloorP*.34+vec2(roomFloorNoise(roomFloorP*.7)*1.8));
          float vein=1.0-smoothstep(.018,.055,abs(tissue-.54));
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.72,.94,.78),vein*.22+smoothstep(.6,.82,tissue)*.14);
        }else if(deckIdentity<8.5){
          diffuseColor.rgb*=1.0-deckGrain*.012;
        }else{
          float heat=smoothstep(.42,.8,roomFloorNoise(roomFloorP*.22)+deckScrape*.18);
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.09,.94,.89),heat*.35);
        }`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        float roomFloorPolish=smoothstep(0.28,0.82,roomFloorMacro)*(1.0-roomFloorStain*0.25);
        roughnessFactor=clamp(roughnessFactor-roomFloorPolish*0.34-roomFloorScuff*0.08+roomFloorStain*0.06-roomFloorWet*0.19+deckGrain*.035,mix(0.38,0.14,roomFloorWetness),1.0);`);
    };
    material.customProgramCacheKey = () => `${previousKey}:room-floor-macro-v3:${genericDeck ? 'plates' : 'authored'}`;
    material.needsUpdate = true;
  }
  uniforms.pattern.value.fromArray(patterns[environment]);
  uniforms.albedoGain.value = ({cryogenics:4.8,habitation:6.4,security:6.8,cargo:4.8,communications:4.8,engineering:7.2,maintenance:9,infested:7.4,containment:8,reactor:3.2} as const)[environment];
  uniforms.wetness.value = environment === 'maintenance' ? 1 : environment === 'infested' ? .28 : environment === 'cryogenics' ? .18 : 0;
  uniforms.grime.value = environment === 'reactor' ? .3 : environment === 'cargo' || environment === 'engineering' ? .32 : environment === 'infested' ? .32 : environment === 'containment' ? .1 : .2;
}
