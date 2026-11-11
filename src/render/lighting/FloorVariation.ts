import * as T from 'three';
import type { ShipEnvironment } from '../ShipEnvironments';

const surfaces = new WeakMap<T.MeshStandardMaterial, { wetness: { value: number }; grime: { value: number }; albedoGain: { value: number } }>();

/** World-scale grime and uneven wetness break texture repetition without another texture or draw. */
export function applyFloorVariation(material: T.MeshStandardMaterial, environment: ShipEnvironment) {
  let uniforms = surfaces.get(material);
  if (!uniforms) {
    uniforms = { wetness: { value: 0 }, grime: { value: .15 }, albedoGain: { value: 4.8 } };
    surfaces.set(material, uniforms);
    const previous = material.onBeforeCompile;
    const params = uniforms;
    material.onBeforeCompile = (shader, renderer) => {
      previous.call(material, shader, renderer);
      shader.uniforms.roomFloorWetness = params.wetness;
      shader.uniforms.roomFloorGrime = params.grime;
      shader.uniforms.roomFloorAlbedoGain = params.albedoGain;
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
        float roomFloorHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float roomFloorNoise(vec2 p){
          vec2 cell=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
          return mix(mix(roomFloorHash(cell),roomFloorHash(cell+vec2(1.0,0.0)),f.x),
            mix(roomFloorHash(cell+vec2(0.0,1.0)),roomFloorHash(cell+vec2(1.0,1.0)),f.x),f.y);
        }`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        ${material.name === 'environment-floor' ? 'diffuseColor.rgb=mix(vec3(.065,.072,.078),diffuseColor.rgb*roomFloorAlbedoGain,.86);' : ''}
        vec2 roomFloorP=vRoomFloorPosition.xz;
        float roomFloorMacro=roomFloorNoise(roomFloorP*0.24);
        float roomFloorStain=smoothstep(0.36,0.78,roomFloorMacro+roomFloorNoise(roomFloorP*0.73)*0.22);
        float roomFloorScuff=roomFloorNoise(roomFloorP*vec2(0.11,2.8));
        float roomFloorWet=smoothstep(0.46,0.72,roomFloorMacro)*roomFloorWetness;
        diffuseColor.rgb*=1.0-roomFloorGrime*(roomFloorStain*0.5+roomFloorScuff*0.15)-roomFloorWet*0.08;`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        // Rubbed dry paint has broad specular variation without turning the deck into a mirror.
        float roomFloorPolish=smoothstep(0.28,0.82,roomFloorMacro)*(1.0-roomFloorStain*0.25);
        roughnessFactor=clamp(roughnessFactor-roomFloorPolish*0.34-roomFloorScuff*0.08+roomFloorStain*0.06-roomFloorWet*0.19,mix(0.38,0.14,roomFloorWetness),1.0);`);
    };
    material.customProgramCacheKey = () => 'room-floor-macro-v2';
    material.needsUpdate = true;
  }
  uniforms.albedoGain.value = ({cryogenics:4.8,habitation:6.4,security:6.8,cargo:4.8,communications:4.8,engineering:7.2,maintenance:9,infested:7.4,containment:8,reactor:3.2} as const)[environment];
  uniforms.wetness.value = environment === 'maintenance' ? 1 : environment === 'infested' ? .28 : environment === 'cryogenics' ? .18 : 0;
  uniforms.grime.value = environment === 'reactor' ? .3 : environment === 'cargo' || environment === 'engineering' ? .32 : environment === 'infested' ? .32 : environment === 'containment' ? .1 : .2;
}
