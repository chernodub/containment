import * as T from 'three';
import type { ShipEnvironment } from '../ShipEnvironments';

type FloorUniforms = {
  wetness: { value: number };
  grime: { value: number };
  albedoGain: { value: number };
  pattern: { value: T.Vector4 };
  leaks: { value: T.Vector4[] };
  practicals: { value:T.Vector4[] };
};
const surfaces = new WeakMap<T.MeshStandardMaterial, FloorUniforms>();
const patterns: Readonly<Record<ShipEnvironment, readonly [number, number, number, number]>> = {
  cryogenics: [1.3, 3.4, 0, .035], habitation: [3.8, 2.4, 1, .025],
  security: [2.9, 1.25, 2, .05], cargo: [6.4, 2.3, 3, .075],
  communications: [2.2, 2.2, 4, .04], engineering: [3.0, 5.4, 5, .075],
  maintenance: [4.8, 1.6, 6, .06], infested: [3.8, 4.6, 7, .08],
  containment: [4.2, 4.2, 8, .018], reactor: [8.0, 1.6, 9, .065],
};

/** World-space plate, wear and environment identity; no repeating image motif or extra draw. */
export function applyFloorVariation(material: T.MeshStandardMaterial, environment: ShipEnvironment, practicalShapes?:T.Vector4[]) {
  let uniforms = surfaces.get(material);
  if (!uniforms) {
    uniforms = { wetness: { value: 0 }, grime: { value: .15 }, albedoGain: { value: 4.8 }, pattern: { value: new T.Vector4() }, leaks:{value:Array.from({length:4},()=>new T.Vector4())},practicals:{value:Array.from({length:4},()=>new T.Vector4(1,0,.82,3.4))} };
    surfaces.set(material, uniforms);
    const previous = material.onBeforeCompile;
    const previousKey = material.customProgramCacheKey();
    const params = uniforms;
    const genericDeck = material.name === 'environment-floor';
    material.onBeforeCompile = (shader, renderer) => {
      previous.call(material, shader, renderer);
      shader.uniforms.roomFloorWetness = params.wetness;
      shader.uniforms.roomFloorPracticalShapes=params.practicals;
      shader.uniforms.roomFloorGrime = params.grime;
      shader.uniforms.roomFloorAlbedoGain = params.albedoGain;
      shader.uniforms.roomFloorPattern = params.pattern;
      shader.uniforms.roomFloorLeaks = params.leaks;
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
        uniform vec4 roomFloorPracticalShapes[4];
        uniform vec4 roomFloorLeaks[4];
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
        float roomFloorScuff=roomFloorNoise(roomFloorP*vec2(0.31,.73));
        float leakMask=0.0;
        for(int leak=0;leak<4;leak++){
          vec4 source=roomFloorLeaks[leak];
          vec2 delta=(roomFloorP-source.xy)*vec2(.8,1.15);
          leakMask=max(leakMask,(1.0-smoothstep(.22,1.25,length(delta)))*source.w);
        }
        float roomFloorWet=smoothstep(0.36,0.7,roomFloorMacro+leakMask*.25)*roomFloorWetness;
        if(roomFloorPattern.z>5.5&&roomFloorPattern.z<6.5)roomFloorWet*=leakMask;
        diffuseColor.rgb*=1.0-roomFloorGrime*(roomFloorStain*0.5+roomFloorScuff*0.15)-roomFloorWet*0.08;
        // Large replacement plates have irregular service cuts rather than a
        // second perfectly regular grid. Wear crosses those structural joints.
        float deckRow=floor(roomFloorP.y/roomFloorPattern.y);
        float deckSpan=roomFloorPattern.x*(.88+roomFloorHash(vec2(deckRow,17.0))*.24);
        float deckOffset=roomFloorHash(vec2(deckRow,73.0))*deckSpan*.7;
        vec2 deckSize=vec2(deckSpan,roomFloorPattern.y);
        vec2 deckChart=vec2(roomFloorP.x+deckOffset,roomFloorP.y)/deckSize;
        vec2 deckCell=floor(deckChart);
        vec2 deckUV=fract(deckChart);
        vec2 deckEdge=min(deckUV,1.0-deckUV)*deckSize;
        float deckJoint=roomFloorLine(min(deckEdge.x,deckEdge.y),.013);
        // Distinct fabrication visible in grayscale, including authored deck finishes.
        float construction=roomFloorPattern.z;
        if(construction<.5){
          vec2 cassette=fract(roomFloorP/vec2(1.3,3.4));
          vec2 edge=min(cassette,1.0-cassette)*vec2(1.3,3.4);
          deckJoint=roomFloorLine(min(edge.x,edge.y),.018);
          float supply=roomFloorLine(abs(edge.x-.11),.035)*(1.0-smoothstep(.10,.22,edge.y));
          diffuseColor.rgb*=1.0-supply*.22;
        }else if(construction<1.5){
          float course=floor(roomFloorP.y/.52);
          vec2 q=fract(vec2(roomFloorP.x/3.9+mod(course,3.0)*.31,roomFloorP.y/.52));
          deckJoint=roomFloorLine(min(min(q.x,1.0-q.x)*3.9,min(q.y,1.0-q.y)*.52),.012);
          diffuseColor.rgb*=.83+roomFloorHash(vec2(floor(roomFloorP.x/3.9+mod(course,3.0)*.31),course))*.12;
        }else if(construction<2.5){
          vec2 inspection=fract(roomFloorP/vec2(2.9,1.25));
          vec2 edge=min(inspection,1.0-inspection)*vec2(2.9,1.25);
          deckJoint=roomFloorLine(min(edge.x,edge.y),.023);
          float stop=roomFloorLine(abs(mod(roomFloorP.y,5.0)-.18),.11);
          diffuseColor.rgb*=1.0-stop*.26;
        }else if(construction<3.5){
          float freightRow=floor(roomFloorP.y/2.3);
          vec2 freight=fract(vec2(roomFloorP.x/6.4+mod(freightRow,2.0)*.14,roomFloorP.y/2.3));
          vec2 edge=min(freight,1.0-freight)*vec2(6.4,2.3);
          deckJoint=roomFloorLine(min(edge.x,edge.y),.022);
          float rail=roomFloorLine(abs(mod(roomFloorP.x,6.4)-.34),.065);
          diffuseColor.rgb*=1.0-rail*.32;
        }else if(construction<4.5){
          vec2 access=fract(roomFloorP/vec2(1.45,2.9));
          vec2 edge=min(access,1.0-access)*vec2(1.45,2.9);
          deckJoint=roomFloorLine(min(edge.x,edge.y),.022);
          float socket=roomFloorLine(abs(edge.x-.14),.036)*roomFloorLine(abs(edge.y-.21),.09);
          diffuseColor.rgb*=1.0-socket*.42;
        }else if(construction<5.5){
          vec2 service=fract(roomFloorP/vec2(3.0,5.4));
          vec2 edge=min(service,1.0-service)*vec2(3.0,5.4);
          deckJoint=roomFloorLine(min(edge.x,edge.y),.020);
          float channel=1.0-smoothstep(.24,.31,abs(mod(roomFloorP.x,3.0)-1.5));
          float grate=roomFloorLine(abs(fract(roomFloorP.y*2.8)-.5),.12);
          diffuseColor.rgb*=1.0-channel*(.11+grate*.14);
        }else if(construction<6.5){
          vec2 drain=fract(roomFloorP/vec2(4.8,1.6));
          vec2 edge=min(drain,1.0-drain)*vec2(4.8,1.6);
          deckJoint=roomFloorLine(min(edge.x,edge.y),.017);
          float gutter=1.0-smoothstep(.16,.23,abs(mod(roomFloorP.y,4.8)-2.4));
          diffuseColor.rgb*=1.0-gutter*.25;
        }else if(construction<7.5){
          float eaten=smoothstep(.36,.68,roomFloorNoise(roomFloorP*.20+vec2(12.0,4.0)));
          diffuseColor.rgb*=1.0-eaten*.36;
          deckJoint*=1.0-eaten*.85;
        }else if(construction<8.5){
          vec2 cell=fract(roomFloorP/4.2)*2.0-1.0;
          vec2 edge=(1.0-abs(cell))*2.1;
          float chamfer=abs(abs(cell.x)+abs(cell.y)-1.72)*1.48;
          deckJoint=max(roomFloorLine(min(edge.x,edge.y),.016),roomFloorLine(chamfer,.017));
          diffuseColor.rgb*=.96+roomFloorLine(min(edge.x,edge.y),.075)*.025;
        }else{
          float chevron=roomFloorP.y+abs(mod(roomFloorP.x,8.0)-4.0)*.38;
          float seam=abs(fract(chevron/1.6)-.5)*1.6;
          deckJoint=roomFloorLine(seam,.021);
          float expansion=roomFloorLine(abs(mod(roomFloorP.x,8.0)-.19),.10);
          diffuseColor.rgb*=1.0-expansion*.24;
        }
        diffuseColor.rgb*=1.0-deckJoint*.19;
        float deckWear=roomFloorLine(min(deckEdge.x,deckEdge.y),.032)-deckJoint;
        float deckIdentity=roomFloorPattern.z;
        float deckGrain=(roomFloorNoise(roomFloorP*vec2(2.3,3.7))-.5)/(1.0+length(fwidth(roomFloorP))*18.0);
        float deckRub=roomFloorNoise(roomFloorP*vec2(.34,.67));
        float deckCloud=roomFloorNoise(roomFloorP*.57);
        float deckScrape=smoothstep(.58,.78,deckRub)*deckCloud;
        float deckSilt=smoothstep(.42,.78,roomFloorStain+roomFloorScuff*.2);
        float deckScratchPatch=smoothstep(.52,.76,roomFloorNoise(roomFloorP*vec2(2.7,.19)+vec2(17.0,9.0)));
        float deckScratch=smoothstep(.76,.9,roomFloorNoise(roomFloorP*vec2(.63,3.1)))*deckScratchPatch*smoothstep(.22,.72,deckCloud);
        float deckPanel=roomFloorHash(deckCell+vec2(7.0,29.0));
        ${genericDeck ? `diffuseColor.rgb*=.96+deckPanel*.08;
        diffuseColor.rgb+=vec3(.006,.008,.009)*deckWear;` : ''}
        // Centered masks retain the calibrated average reflectance while worn
        // islands and wheel scrapes become visible under broad practical light.
        diffuseColor.rgb*=1.0+(deckCloud-.5)*.10+(deckScrape-.12)*.08-(deckSilt-.58)*.095+deckGrain*roomFloorPattern.w;
        diffuseColor.rgb+=vec3(.002,.0023,.0023)*deckScratch;
        if(deckIdentity<.5){
          float frost=smoothstep(.58,.83,roomFloorNoise(roomFloorP*.45)+deckWear*.18);
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.08,1.13,1.16),frost*.5);
        }else if(deckIdentity<1.5){
          diffuseColor.rgb*=1.0+sin(roomFloorP.x*15.0+roomFloorNoise(roomFloorP*.4))*.014;
        }else if(deckIdentity<2.5){
          float tread=roomFloorLine(abs(fract((roomFloorP.x+roomFloorP.y)*7.5)-.5),.025);
          diffuseColor.rgb*=1.0-tread*.045;
        }else if(deckIdentity<3.5){
          diffuseColor.rgb*=1.0-(deckScrape-.12)*.18;
        }else if(deckIdentity<4.5){
          float access=roomFloorLine(abs(fract(roomFloorP.x/2.2)-.5),.006)*roomFloorLine(abs(fract(roomFloorP.y/2.2)-.5),.035);
          diffuseColor.rgb*=1.0-access*.2;
        }else if(deckIdentity<5.5){
          vec2 grateUV=fract(roomFloorP*vec2(1.35,8.0));
          float grate=smoothstep(.18,.23,grateUV.x)*(1.0-smoothstep(.77,.82,grateUV.x))*smoothstep(.2,.28,grateUV.y)*(1.0-smoothstep(.64,.72,grateUV.y));
          diffuseColor.rgb*=1.0-(grate-.13)*.06;
        }else if(deckIdentity<6.5){
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.91,1.015,1.035),roomFloorWet*.16);
        }else if(deckIdentity<7.5){
          float tissue=roomFloorNoise(roomFloorP*.34+vec2(roomFloorNoise(roomFloorP*.7)*1.8));
          float vein=1.0-smoothstep(.018,.055,abs(tissue-.54));
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.72,.94,.78),vein*.34+smoothstep(.6,.82,tissue)*.2);
        }else if(deckIdentity<8.5){
          diffuseColor.rgb*=1.0-deckGrain*.012;
        }else{
          float heat=smoothstep(.42,.8,roomFloorNoise(roomFloorP*.22)+deckScrape*.18);
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.09,.94,.89),heat*.15);
        }`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        float roomFloorPolish=smoothstep(0.28,0.82,roomFloorMacro)*(1.0-roomFloorStain*0.25);
        roughnessFactor=clamp(roughnessFactor-roomFloorPolish*0.12-roomFloorScuff*0.025+roomFloorStain*0.06-roomFloorWet*0.27-(deckScrape-.12)*.06+(deckSilt-.58)*.06+deckGrain*.008,mix(0.64,0.28,roomFloorWet),1.0);`);
    };
    material.customProgramCacheKey = () => `${previousKey}:room-floor-macro-v8:${genericDeck ? 'plates' : 'authored'}`;
    material.needsUpdate = true;
  }
  if(practicalShapes)uniforms.practicals.value=practicalShapes;
  uniforms.pattern.value.fromArray(patterns[environment]);
  uniforms.albedoGain.value = ({cryogenics:4.8,habitation:6.4,security:6.8,cargo:4.8,communications:4.8,engineering:7.2,maintenance:9,infested:7.4,containment:8,reactor:3.2} as const)[environment];
  uniforms.wetness.value = environment === 'maintenance' ? 1 : environment === 'infested' ? .28 : environment === 'cryogenics' ? .18 : 0;
  uniforms.grime.value = environment === 'reactor' ? .3 : environment === 'cargo' || environment === 'engineering' ? .32 : environment === 'infested' ? .32 : environment === 'containment' ? .1 : .2;
}

/** Fixed uniform slots tie the wet deck finish to visible coolant outlets. */
export function setFloorLeaks(material:T.MeshStandardMaterial,positions:readonly {x:number;z:number}[]):void {
  const uniforms=surfaces.get(material);if(!uniforms)return;
  for(let i=0;i<4;i++){
    const source=positions[i];uniforms.leaks.value[i].set(source?.x??0,source?.z??0,0,source?1:0);
  }
}
