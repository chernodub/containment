import { patchGraphicSurface } from '../lighting/GraphicSurface';
import { Material, Mesh, MeshStandardMaterial, Object3D, Vector2, WebGLRenderer } from 'three';

export const GEOMETRY_CLASSES = Object.freeze({ floor: 1, architecture: 2, marine: 3, enemy: 4, elite: 5, boss: 6 });
export type GeometryClass = typeof GEOMETRY_CLASSES[keyof typeof GEOMETRY_CLASSES];
const identities = new WeakMap<MeshStandardMaterial, { value: Vector2 }>();
let nextActorId = 16;
const actors = new Map<number, WeakRef<Object3D>>();
function actorIdentity(root:Object3D):number {
 const existing=root.userData.containmentGeometryId as number|undefined;
 if(existing&&actors.get(existing)?.deref()===root)return existing;
 // RGBA8 stores each actor ID exactly. Reclaim detached
 // pool owners; re-registration gives a borrowed owner a fresh identity.
 for(let attempt=0;attempt<239;attempt++) {
  const id=nextActorId++;if(nextActorId>254)nextActorId=16;
  const owner=actors.get(id)?.deref();
  if(!owner||!owner.parent) { actors.set(id,new WeakRef(root));root.userData.containmentGeometryId=id;return id; }
 }
 throw new Error('Geometry identity capacity exceeded');
}

const drawBufferHooks=new WeakSet<Material>();
const drawStates=new WeakMap<WebGLRenderer,{target:unknown;frame:number;write:boolean}>();
const allBuffers=[0x8ce0,0x8ce1],colorOnly=[0x8ce0,0];
function installDrawBufferPolicy(material:Material):void {
 if(drawBufferHooks.has(material))return;drawBufferHooks.add(material);
 const previous=material.onBeforeRender;
 material.onBeforeRender=function(renderer,...args) {
  previous.call(this,renderer,...args);
  const target=renderer.getRenderTarget();
  if(target?.textures[1]?.name!=='Containment geometry normal + identity')return;
  const write=!material.transparent,frame=renderer.info.render.frame,state=drawStates.get(renderer);
  if(!state||state.target!==target||state.frame!==frame||state.write!==write) {
   (renderer.getContext() as WebGL2RenderingContext).drawBuffers(write?allBuffers:colorOnly);
   if(state){state.target=target;state.frame=frame;state.write=write;}else drawStates.set(renderer,{target,frame,write});
  }
 };
}

/** Geometry is emitted alongside HDR color: no extra traversal, draw or texture samples. */
export function patchGeometryMaterial(material: MeshStandardMaterial): void {
  installDrawBufferPolicy(material);
  if (identities.has(material) || material.transparent) return;
  patchGraphicSurface(material);
  const identity = { value: new Vector2(2, GEOMETRY_CLASSES.architecture) };
  identities.set(material, identity);
  const previous = material.onBeforeCompile;
  const key = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    shader.uniforms.containmentIdentity = identity;
    if (shader.fragmentShader.includes('out highp vec4 containmentGeometry')) return;
    shader.fragmentShader = `layout(location = 1) out highp vec4 containmentGeometry;
uniform vec2 containmentIdentity;
vec2 containmentOctNormal(vec3 n) {
 n /= abs(n.x) + abs(n.y) + abs(n.z);
 return n.z >= 0.0 ? n.xy : (1.0 - abs(n.yx)) * sign(n.xy);
}
` + shader.fragmentShader.replace('#include <opaque_fragment>', `#include <opaque_fragment>
// Geometric normals intentionally omit photographic normal-map detail.
#ifdef FLAT_SHADED
 vec3 containmentNormal = normalize(cross(dFdx(vViewPosition), dFdy(vViewPosition)));
#else
 vec3 containmentNormal = normalize(vNormal);
#endif
containmentGeometry = vec4(containmentOctNormal(containmentNormal) * .5 + .5, containmentIdentity / 255.0);
`);
  };
  material.customProgramCacheKey = () => key.includes(':geometry-mrt-v1')?key:`${key}:geometry-mrt-v1`;
  material.needsUpdate = true;
}

const excluded = new WeakSet<Material>();
/** Every enabled MRT draw buffer needs an output, including effect programs. */
function patchExcludedMaterial(material: Material): void {
  installDrawBufferPolicy(material);
  if (excluded.has(material)) return;
  excluded.add(material);
  const previous = material.onBeforeCompile, key = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    if (shader.fragmentShader.includes('containmentGeometry')) return;
    const source = shader.fragmentShader;
    const start = source.indexOf('{', source.indexOf('void main'));
    let depth = 1, end = start + 1;
    while (end < source.length && depth) { if (source[end] === '{') depth++; if (source[end] === '}') depth--; end++; }
    shader.fragmentShader = 'layout(location = 1) out highp vec4 containmentGeometry;\n' + source.slice(0, end - 1) + '\ncontainmentGeometry=vec4(0.0,0.0,0.0,clamp(gl_FragColor.a,0.0,1.0));\n' + source.slice(end - 1);
  };
  material.customProgramCacheKey = () => key.includes(':geometry-excluded-v1')?key:`${key}:geometry-excluded-v1`;
  material.needsUpdate = true;
}

/** Register prepared world surfaces or a single actor, never the HUD/effect scene. */
export function registerGeometry(root: Object3D, kind?: GeometryClass): void {
  if(kind)root.userData.containmentGeometryClass=kind;
  let id = root.userData.containmentGeometryId as number | undefined;
  if (kind) id=actorIdentity(root);
  const effectsOnly=root.name==='shared-affliction-batches';
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    let effect=effectsOnly;for(let owner: Object3D|null=object;owner&&!effect;owner=owner.parent)effect=owner.name==='shared-affliction-batches';
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (effect || !(material instanceof MeshStandardMaterial) || material.transparent) { patchExcludedMaterial(material); continue; }
      patchGeometryMaterial(material);
      const identity = identities.get(material)!;
      if(!kind&&identity.value.y>=GEOMETRY_CLASSES.marine)continue;
      const floor = /floor|deck/.test(material.name);
      identity.value.set(id ?? (floor ? 1 : 2), kind ?? (floor ? GEOMETRY_CLASSES.floor : GEOMETRY_CLASSES.architecture));
    }
  });
}
