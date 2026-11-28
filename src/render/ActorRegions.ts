import {shapeBrute} from './HeavyAnatomy';
import {shapeWardenMouth} from './WardenMouth';
import * as T from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

/** Semantic regions are triangle-constant in bind pose, so skinning cannot move a seam. */
export const ACTOR_REGIONS = Object.freeze({ torso: 1, head: 2, left: 3, right: 4, legs: 5, plate: 6, organ: 7, weapon: 8 });

function boneRegion(name: string): number {
  if (/head|neck|jaw|eye|lip|teeth|tongue|mandible/.test(name)) return ACTOR_REGIONS.head;
  if (/tail|butt|bum/.test(name)) return ACTOR_REGIONS.organ;
  if (/leg|foot|shin|thigh|ankle|toe|knee/.test(name)) return ACTOR_REGIONS.legs;
  if (/arm|hand|claw|finger|palm|shoulder/.test(name)) return /\.l|left/.test(name) ? ACTOR_REGIONS.left : ACTOR_REGIONS.right;
  return ACTOR_REGIONS.torso;
}

/** Distance coordinates for the authored seams, including coplanar paint boundaries. */
function authorPlateEdges(geometry: T.BufferGeometry) {
  const position = geometry.getAttribute('position');
  const zones = geometry.getAttribute('_heavyzone');
  if (!zones) return;
  const values = new Uint8Array(position.count * 3).fill(255);
  const edges = new Map<string, { face: number; opposite: number; zone: number }>();
  const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3();
  function expose(face: number, opposite: number) {
    for (let corner = 0; corner < 3; corner++) {
      if (corner !== opposite) values[(face + corner) * 3 + opposite] = 0;
    }
  }
  for (let face = 0; face < position.count; face += 3) {
    const zone = zones.getX(face);
    a.fromBufferAttribute(position, face);
    b.fromBufferAttribute(position, face + 1);
    c.fromBufferAttribute(position, face + 2);
    const keys = [a, b, c].map(v => [v.x, v.y, v.z].map(n => Math.round(n * 10000)).join(','));
    for (let opposite = 0; opposite < 3; opposite++) {
      const x = keys[(opposite + 1) % 3], y = keys[(opposite + 2) % 3];
      const key = x < y ? x + '|' + y : y + '|' + x;
      const other = edges.get(key);
      if (!other) {
        edges.set(key, { face, opposite, zone });
        continue;
      }
      if (zone !== other.zone) {
        expose(face, opposite);
        expose(other.face, other.opposite);
      }
      edges.delete(key);
    }
  }
  for (const edge of edges.values()) expose(edge.face, edge.opposite);
  geometry.setAttribute('plateEdge', new T.Uint8BufferAttribute(values, 3, true));
}

/** Author once on asset templates before skin batching; clones share the prepared buffers. */
export function authorActorRegions(root: T.Object3D, human: boolean): void {
  root.traverse(object => {
    if (!(object instanceof T.Mesh) || object.geometry.hasAttribute('actorRegion')) return;
    const source = object.geometry;
    const geometry = source.index ? source.toNonIndexed() : source.clone();
    const count = geometry.getAttribute('position').count, regions = new Float32Array(count);
    const skin = geometry.getAttribute('skinIndex'), weights = geometry.getAttribute('skinWeight');
    const bones = object instanceof T.SkinnedMesh ? object.skeleton.bones : [];
    const scores = new Float32Array(9), name = object.name.toLowerCase();
    for (let triangle = 0; triangle < count; triangle += 3) {
      scores.fill(0);
      for (let v = triangle; v < Math.min(triangle + 3, count); v++) {
        if (skin && weights) for (let component = 0; component < 4; component++) {
          const bone = bones[skin.getComponent(v, component)];
          scores[boneRegion(bone?.name.toLowerCase() ?? '')] += weights.getComponent(v, component);
        }
      }
      let region = ACTOR_REGIONS.torso as number;
      for (let id = 2; id < scores.length; id++) if (scores[id] > scores[region]) region = id;
      // Separate authored armor meshes retain deliberate panel hierarchy after merging.
      if (human) {
        if (/helmet|head|eye|teeth/.test(name)) region = ACTOR_REGIONS.head;
        else if (/armor_shoulder|armor_neck/.test(name)) region = ACTOR_REGIONS.plate;
        else if (/armor_chest/.test(name)) region = ACTOR_REGIONS.torso;
        else if (/armor_/.test(name)) region = ACTOR_REGIONS.legs;
      }
      regions.fill(region, triangle, Math.min(triangle + 3, count));
    }
    // Open the front-leg stance in the bind pose. Use skin weights to
    // feather the displacement into the shoulder, including the Low mesh.
    if (/^k11-(crawler|spitter|carrier|stalker)-/.test(name) && skin && weights) {
      const foreleg = bones.map(bone => /^(leg_front|leg[05]_|leg_m|arm_(up|mid)|upper_arm)/i.test(bone.name));
      // The ambusher's narrow thorax disappears end-on between its scythes.
      // Carry the paired shoulders into one wide shield between the wrists.
      const keel = bones.map(bone => name.startsWith('k11-stalker-') && /^(torso|chest|big_butt|mid_butt)$/.test(bone.name));
      const position = geometry.getAttribute('position');
      for (let v = 0; v < count; v++) {
        let spread = 0;
        for (let joint = 0; joint < 4; joint++) {
          const index = skin.getComponent(v, joint);
          const gain = foreleg[index] ? .24 : keel[index] ? .85 : 0;
          spread += gain * weights.getComponent(v, joint);
        }
        position.setY(v, position.getY(v) * (1 + spread));
      }
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
    }
    if (name.startsWith('k11-brute-base') || name === 'k11-brute-elite') shapeBrute(geometry, name.endsWith('elite'));
    if(/^k11-brute-/.test(object.name))authorPlateEdges(geometry);
    geometry.setAttribute('actorRegion', new T.BufferAttribute(regions, 1));
    // Reindex equal vertices including region: only seam vertices stay split.
    object.geometry = source.index ? mergeVertices(geometry,1e-6) : geometry;
    if (name === 'k11-brute-boss' && object instanceof T.SkinnedMesh) shapeWardenMouth(object);
    if(object.geometry!==geometry)geometry.dispose();
  });
}

/** Standard material path, also retained by frozen skins and baked ragdolls. */
export function patchActorRegions(material: T.MeshStandardMaterial, friendly: boolean): void {
  const previous = material.onBeforeCompile;
  const authoredFinish = (friendly && material.userData.k10Original) || material.userData.k11Original;
  const previousKey = authoredFinish ? material.customProgramCacheKey() : '';
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    shader.vertexShader = 'attribute float actorRegion;varying float vActorRegion;\n' + shader.vertexShader
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvActorRegion=actorRegion;');
    shader.fragmentShader = 'varying float vActorRegion;\n' + shader.fragmentShader;
    // Original art owns its palette, baked normals and emission mask.
    // Region data still feeds the shared hit/death finish through ActorSurface.
    if (authoredFinish) return;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      // Source textures never determine a value boundary in the designed actor standard.
      float region=floor(vActorRegion+.5);
      ${friendly ? `vec3 regionColor=vec3(.038,.052,.066);
      if(region==1.0)regionColor=vec3(.11,.16,.19);
      if(region==2.0||region==6.0)regionColor=vec3(.42,.76,.86);
      if(region==5.0)regionColor=vec3(.065,.088,.105);
      diffuseColor.rgb=regionColor;` : `float regionValue=region==2.0?1.28:region==5.0?.50:region==3.0||region==4.0?.72:1.0;
      diffuseColor.rgb=graphicActorBase*regionValue;`}
    `).replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal=nonPerturbedNormal;');
    if(friendly)shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\nif(vActorRegion==2.0||vActorRegion==6.0)totalEmissiveRadiance+=vec3(.025,.07,.09);');
  };
  if (authoredFinish) material.customProgramCacheKey = () => `${previousKey}:${material.userData.k11Original?'k11':'k10'}-authored-regions-v1`;
}
