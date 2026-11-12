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
      // The central heart stays white; raised energy cages retain orange structure.
      float hotFixturePearl=(1.0-smoothstep(0.14,0.36,hotFixtureRadius))*(1.0-smoothstep(.86,1.12,vHotFixturePosition.y));
      float hotFixtureAzimuth=atan(vHotFixturePosition.z-hotFixtureCore.y,vHotFixturePosition.x-hotFixtureCore.x+.00001);
      float hotFixtureBand=0.5+0.5*sin(hotFixtureRadius*15.0+vHotFixturePosition.y*9.0-hotFixtureTime*2.8+sin(hotFixtureAzimuth*3.0+hotFixtureTime)*1.3);
      float hotFixtureSeam=1.0-smoothstep(0.025,0.09,abs(fract(hotFixtureRadius*2.0-hotFixtureTime*.07)-0.5));
      vec3 hotFixtureTint=mix(vec3(1.0,0.055,0.002),vec3(1.0,0.995,0.98),hotFixturePearl);
      float hotFixtureEnergy=mix(0.28,3.0,hotFixturePearl)*(0.32+hotFixtureBand*0.68)*(1.0-hotFixtureSeam*0.48);
      totalEmissiveRadiance*=hotFixtureTint*hotFixtureEnergy;`);
  };
  material.customProgramCacheKey = () => `${key}:hot-fixture-bands-v4`;
  material.needsUpdate = true;
}

/** Shared presentation clock; updates no materials and allocates no resources. */
export function updateHotFixtureSurfaces(timeSeconds: number): void {
  time.value = Number.isFinite(timeSeconds) ? timeSeconds : 0;
}
