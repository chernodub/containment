import * as T from 'three';

const installed = new WeakSet<T.MeshStandardMaterial>();
export const environmentClock = { value: 0 };
const time = environmentClock;

/** Give hot reactor fixtures a pearl core, orange falloff and readable energy-band structure. */
export function applyHotFixtureSurface(material: T.MeshStandardMaterial,core?:{x:number;z:number;radius:number}): void {
  if (installed.has(material)) return;
  installed.add(material);
  const previous = material.onBeforeCompile, key = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    shader.uniforms.hotFixtureTime = time;
    shader.uniforms.hotFixtureCore={value:new T.Vector3(core?.x??0,core?.z??0,core?.radius??1)};
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vHotFixtureUv;\nvarying vec3 vHotFixturePosition;');
    shader.vertexShader = shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvHotFixturePosition=(modelMatrix*vec4(transformed,1.0)).xyz;');
    shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nvHotFixtureUv=uv;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vHotFixtureUv;\nvarying vec3 vHotFixturePosition;\nuniform vec3 hotFixtureCore;\nuniform float hotFixtureTime;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      float hotFixtureRadius=length(vHotFixturePosition.xz-hotFixtureCore.xy)/max(.1,hotFixtureCore.z);
      float hotFixturePearl=1.0-smoothstep(0.05,0.25,hotFixtureRadius);
      float hotFixtureBand=0.5+0.5*sin(hotFixtureRadius*15.0-hotFixtureTime*2.8+sin(atan(vHotFixtureUv.y-.5,vHotFixtureUv.x-.5)*3.0+hotFixtureTime)*1.3);
      float hotFixtureSeam=1.0-smoothstep(0.025,0.09,abs(fract(hotFixtureRadius*2.0-hotFixtureTime*.07)-0.5));
      vec3 hotFixtureTint=mix(vec3(1.0,0.12,0.012),vec3(1.0,0.99,0.96),hotFixturePearl);
      float hotFixtureEnergy=mix(0.22,2.4,hotFixturePearl)*(0.72+hotFixtureBand*0.28)*(1.0-hotFixtureSeam*0.36);
      totalEmissiveRadiance*=hotFixtureTint*hotFixtureEnergy;`);
  };
  material.customProgramCacheKey = () => `${key}:hot-fixture-bands-v3`;
  material.needsUpdate = true;
}

/** Shared presentation clock; updates no materials and allocates no resources. */
export function updateHotFixtureSurfaces(timeSeconds: number): void {
  time.value = Number.isFinite(timeSeconds) ? timeSeconds : 0;
}
