import {ENEMY_BODY_COLORS} from '../ActorIdentity';
import { setActorGeometryIdentity } from './ActorGeometryMaterial';
import { optimizeLocalLights } from '../lighting/LocalLightShading';
import { patchGraphicSurface, setGraphicActorBase } from '../lighting/GraphicSurface';
import { ReplaceStencilOp, Material, Mesh, MeshStandardMaterial, Object3D, ShaderMaterial, Vector2, WebGLRenderer } from 'three';

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

// A frame-scoped observer used by the marine silhouette to compare the
// already resolved opaque color with the final effect-composited color.
const transparentObservers = new WeakMap<WebGLRenderer, () => void>();
export function observeTransparentDraws(renderer:WebGLRenderer, observer?:()=>void):void {
 if(observer)transparentObservers.set(renderer,observer);
 else transparentObservers.delete(renderer);
}

const drawBufferHooks=new WeakMap<Material,{hook:Material['onBeforeRender'];stockBase:boolean}>();
const drawStates=new WeakMap<WebGLRenderer,{target:unknown;frame:number;write:boolean}>();
const allBuffers=[0x8ce0,0x8ce1],colorOnly=[0x8ce0,0];
const geometryClear=new Float32Array(4);
const clearHooks=new WeakMap<WebGLRenderer,{original:WebGLRenderer['clear'];hook:WebGLRenderer['clear'];users:number;generation:number}>();
/** Clear scene color/depth normally, and clear geometry to its reserved zero ID
 * once before the first mesh. This also survives Three's shadow-target restores. */
export function installGeometryClearPolicy(renderer:WebGLRenderer):()=>void {
 if(!renderer.clear||!renderer.getContext)return ()=>{};
 let entry=clearHooks.get(renderer);
 if(!entry) {
  const original=renderer.clear;
  const hook:WebGLRenderer['clear']=function(this:WebGLRenderer,color,depth,stencil) {
   if(color!==false&&renderer.getRenderTarget()?.textures[1]?.name==='Containment geometry normal + identity') {
    (renderer.getContext() as WebGL2RenderingContext).drawBuffers(colorOnly);
    const clear=clearHooks.get(renderer);if(clear)clear.generation++;
    const state=drawStates.get(renderer);if(state)state.frame=-1;
   }
   original.call(this,color,depth,stencil);
  };
  entry={original,hook,users:0,generation:0};clearHooks.set(renderer,entry);renderer.clear=hook;
 }
 entry.users++;const owned=entry;let released=false;
 return ()=>{if(released)return;released=true;if(--owned.users===0){if(renderer.clear===owned.hook)renderer.clear=owned.original;clearHooks.delete(renderer);}};
}
function installDrawBufferPolicy(material:Material):void {
 if(drawBufferHooks.has(material))return;
 const previous=material.onBeforeRender;
 const hook:Material['onBeforeRender']=function(this:Material,renderer,...args) {
  previous.call(this,renderer,...args);
  const target=renderer.getRenderTarget();
  if(target?.textures[1]?.name!=='Containment geometry normal + identity')return;
  if(material.transparent)transparentObservers.get(renderer)?.();
  const write=material.userData.containmentInkBlock===true||(!material.transparent&&material.userData.containmentPreserveGeometry!==true),frame=clearHooks.get(renderer)?.generation??renderer.info.render.frame,state=drawStates.get(renderer);
  const first=!state||state.target!==target||state.frame!==frame;
  if(first||state.write!==write) {
   const gl=renderer.getContext() as WebGL2RenderingContext;
   if(first) { gl.drawBuffers(allBuffers);gl.clearBufferfv(gl.COLOR,1,geometryClear);if(!write)gl.drawBuffers(colorOnly); }
   else gl.drawBuffers(write?allBuffers:colorOnly);
   if(state){state.target=target;state.frame=frame;state.write=write;}else drawStates.set(renderer,{target,frame,write});
  }
 };
 material.onBeforeRender=hook;
 drawBufferHooks.set(material,{hook,stockBase:previous===Material.prototype.onBeforeRender});
}

/** This retained policy depends only on the material/target, not a mesh's local
 * transform. Rigid architecture using the same material may share one draw. */
export function hasStaticGeometryPolicy(material:Material):boolean {
 const policy=drawBufferHooks.get(material);
 return !!policy?.stockBase&&material.onBeforeRender===policy.hook;
}

/** Geometry is emitted alongside HDR color: no extra traversal, draw or texture samples. */
export function patchGeometryMaterial(material: MeshStandardMaterial): void {
  installDrawBufferPolicy(material);
  if (identities.has(material) || material.transparent) return;
  optimizeLocalLights(material);
  patchGraphicSurface(material);
  const identity = { value: new Vector2(2, GEOMETRY_CLASSES.architecture) };
  identities.set(material, identity);
  const previous = material.onBeforeCompile;
  const key = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    shader.uniforms.containmentIdentity = identity;
    if (shader.fragmentShader.includes('out highp vec4 containmentGeometry')) return;
    if(!shader.vertexShader.includes('varying float vActorRegion;'))shader.vertexShader='attribute float actorRegion;varying float vActorRegion;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvActorRegion=actorRegion;');
    shader.fragmentShader = `layout(location = 1) out highp vec4 containmentGeometry;
uniform vec2 containmentIdentity;
${shader.fragmentShader.includes('varying float vActorRegion;')?'':'varying float vActorRegion;'}
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
float geometryRegion=floor(vActorRegion+.5)*step(2.5,containmentIdentity.y);
#if defined(HAS_CREATURE_LANTERN) && defined(USE_EMISSIVEMAP)
 // Reserved region for the emitting texels of the authored organ mask.
 if(lanternPeak>.04)geometryRegion=30.;
#endif
#ifdef BROOD_PLANES
 // Regions 9–27 belong to the separate actor identity meshes.
 geometryRegion=(broodMark || ridgeGlow>0.)?28.:31.;
 if(actorContact.y>.13 || actorStrikeLight.w>0. &&
    distance(-vViewPosition,(viewMatrix*vec4(actorStrikeLight.xyz,1.)).xyz)<.27)geometryRegion=30.;
#endif
#ifdef BROOD_POD_SURFACE
 geometryRegion=podMark?28.:31.;
#endif
#ifdef BRUTE_PLANES
 if(bruteFace)geometryRegion=29.;
 if(wardenMaw)geometryRegion=30.;
#endif
containmentGeometry = vec4(containmentOctNormal(containmentNormal) * .5 + .5, vec2(containmentIdentity.x,containmentIdentity.y+8.0*geometryRegion) / 255.0);
`);
  };
  material.customProgramCacheKey = () => key.includes(':geometry-mrt-v2')?key:`${key}:geometry-mrt-v2`;
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
    shader.fragmentShader = 'layout(location = 1) out highp vec4 containmentGeometry;\n' + source.slice(0, end - 1) + '\ncontainmentGeometry=vec4(0.0,0.0,0.0,1.0);\n' + source.slice(end - 1);
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
    let effect=effectsOnly,inkBlock=false;for(let owner: Object3D|null=object;owner;owner=owner.parent){effect ||= owner.name==='shared-affliction-batches';inkBlock ||= owner.userData.containmentHostilePriority===true||owner.name==='hostile-warning-fills'||owner.name==='hostile-projectiles';}
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      // The closest opaque surface owns bit zero of the HDR scene stencil.
      if (!material.transparent && material.depthWrite && !effect) {
        material.stencilWrite = true;
        material.stencilWriteMask = 3;
        material.stencilRef = kind && kind >= GEOMETRY_CLASSES.enemy ? 1 : kind === GEOMETRY_CLASSES.marine ? 2 : 0;
        material.stencilZPass = ReplaceStencilOp;
      }
      material.userData.containmentInkBlock=inkBlock;
      material.userData.containmentPreserveGeometry=!inkBlock&&(effect||!(material instanceof MeshStandardMaterial)||material.transparent);
      if (effect || !(material instanceof MeshStandardMaterial) || material.transparent) {
        patchExcludedMaterial(material);
        if(kind&&!effect&&material instanceof ShaderMaterial&&setActorGeometryIdentity(material,inkBlock?0:id!,inkBlock?255:kind)&&!material.transparent)material.userData.containmentPreserveGeometry=false;
        continue;
      }
      if(kind) {
        const family=root.name.replace('alien-','');
        const palette:Record<string,number>={marine:0x3d4348,...ENEMY_BODY_COLORS};
        setGraphicActorBase(material,root.userData.graphicActorBase??palette[family]??(kind===GEOMETRY_CLASSES.marine?0x3d4348:0xa05235));
      }
      patchGeometryMaterial(material);
      const identity = identities.get(material)!;
      if(inkBlock){identity.value.set(0,255);continue;}
      if(!kind&&identity.value.y>=GEOMETRY_CLASSES.marine&&identity.value.y<=GEOMETRY_CLASSES.boss)continue;
      const floor = /floor|deck/.test(material.name);
      identity.value.set(id ?? (floor ? 1 : 2), kind ?? (floor ? GEOMETRY_CLASSES.floor : GEOMETRY_CLASSES.architecture));
    }
  });
}
