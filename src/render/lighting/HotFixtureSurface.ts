import * as T from 'three';

const installed = new WeakSet<T.MeshStandardMaterial>();
const time = { value: 0 };

/** Give hot reactor fixtures a pearl core, orange falloff and readable energy-band structure. */
export function applyHotFixtureSurface(material: T.MeshStandardMaterial): void {
  if (installed.has(material)) return;
  installed.add(material);
  const previous = material.onBeforeCompile, key = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    shader.uniforms.hotFixtureTime = time;
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vHotFixtureUv;');
    shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nvHotFixtureUv=uv;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vHotFixtureUv;\nuniform float hotFixtureTime;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      float hotFixtureRadius=length((vHotFixtureUv-0.5)*2.0);
      float hotFixturePearl=1.0-smoothstep(0.1,0.6,hotFixtureRadius);
      float hotFixtureBand=0.5+0.5*sin(hotFixtureRadius*48.0-hotFixtureTime*0.85);
      float hotFixtureSeam=1.0-smoothstep(0.025,0.09,abs(fract(hotFixtureRadius*4.5)-0.5));
      vec3 hotFixtureTint=mix(vec3(1.0,0.38,0.1),vec3(1.0,0.96,0.86),hotFixturePearl);
      float hotFixtureEnergy=mix(0.28,0.9,hotFixturePearl)*(0.72+hotFixtureBand*0.28)*(1.0-hotFixtureSeam*0.62);
      totalEmissiveRadiance*=hotFixtureTint*hotFixtureEnergy;`);
  };
  material.customProgramCacheKey = () => `${key}:hot-fixture-bands-v1`;
  material.needsUpdate = true;
}

/** Shared presentation clock; updates no materials and allocates no resources. */
export function updateHotFixtureSurfaces(timeSeconds: number): void {
  time.value = Number.isFinite(timeSeconds) ? timeSeconds : 0;
}
