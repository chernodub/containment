import * as T from 'three';
import {AnatomicalFrost} from './motion/AnatomicalFrost';

export type Rank = 'base' | 'elite' | 'boss';
type CreatureSkin = {
  mesh: T.SkinnedMesh;
  variants: Partial<Record<Rank, T.BufferGeometry>>;
  rank: Rank;
  height: number;
  root: T.Object3D;
};
const skins = new WeakMap<T.Object3D, CreatureSkin>();
const frostGeometry = new WeakMap<T.BufferGeometry, T.BufferGeometry>();

function rankOf(name: string): Rank | undefined {
  return name.match(/^k11-[a-z]+-(base|elite|boss)(?:_\d+)?$/)?.[1] as Rank | undefined;
}

export type CreatureEmissionRegion = 'warden-ram' | 'matron-vents';

/** Source-space masks follow the skin. No atlas copies, extra draws or pose queries. */
function prepareEmissionRegions(mesh: T.SkinnedMesh, rank: Rank): void {
  const geometry = mesh.geometry;
  if (geometry.hasAttribute('k11EmissionRegion')) return;
  // Third pass: masks are authored in the sculpture and exported as _K11REGION (x warden-ram, y matron-vents).
  const authored = geometry.getAttribute('_k11region');
  if (authored) {
    const values = new Uint8Array(authored.count * 2);
    for (let i = 0; i < authored.count; i++) {
      values[i * 2] = Math.round(255 * T.MathUtils.clamp(authored.getX(i), 0, 1));
      values[i * 2 + 1] = Math.round(255 * T.MathUtils.clamp(authored.getY(i), 0, 1));
    }
    geometry.setAttribute('k11EmissionRegion', new T.Uint8BufferAttribute(values, 2, true));
    return;
  }
  const positions = geometry.getAttribute('position');
  const values = new Uint8Array(positions.count * 2);
  const family = mesh.userData.k11Family;
  const aspect = Number(mesh.userData.k11Aspect) || 1;
  const point = new T.Vector3();
  // These are the second-pass carrier.py ellipsoid_surface vent centres,
  // evaluated in design space; the exporter removes aspect from source Z.
  const vents: T.Vector3[] = [];
  if (family === 'carrier' && rank === 'boss') {
    const forward = new T.Vector3(1, 0, .3).normalize();
    const side = new T.Vector3(0, 1, 0), up = new T.Vector3().crossVectors(forward, side);
    for (const phi of [-1.2, .4, 1.2]) {
      const u = -.55, radius = Math.sqrt(1 - u * u);
      const q = new T.Vector3(u * 4.6, -Math.sin(phi) * radius * 4.2, Math.cos(phi) * radius * 2.9 * aspect);
      const normal = new T.Vector3(q.x / (4.6 ** 2), q.y / (4.2 ** 2), q.z / ((2.9 * aspect) ** 2)).normalize();
      const worldNormal = forward.clone().multiplyScalar(normal.x).addScaledVector(side, normal.y).addScaledVector(up, normal.z);
      vents.push(new T.Vector3(-5.4, 0, 8.2 * aspect).addScaledVector(forward, q.x).addScaledVector(side, q.y).addScaledVector(up, q.z).addScaledVector(worldNormal, -.35));
    }
  }
  for (let i = 0; i < positions.count; i++) {
    point.fromBufferAttribute(positions, i);point.z *= aspect;
    if (rank === 'boss' && family === 'brute') {
      // Brow ram is forward of the ordinary prow; retain its pale bone finish.
      const forward = T.MathUtils.smoothstep(point.x, 1.8, 2.35);
      const width = 1 - T.MathUtils.smoothstep(Math.abs(point.y), .6, 1.0);
      const height = 1 - T.MathUtils.smoothstep(Math.abs(point.z / aspect - 4.12), .45, .8);
      values[i * 2] = Math.round(255 * forward * width * height);
    }
    if (vents.length) {
      const distance = Math.min(...vents.map(centre => point.distanceTo(centre)));
      values[i * 2 + 1] = Math.round(255 * (1 - T.MathUtils.smoothstep(distance, .7, 1.3)));
    }
  }
  geometry.setAttribute('k11EmissionRegion', new T.Uint8BufferAttribute(values, 2, true));
}

/** Named presentation controls; encounter code can drive these without changing the atlas. */
export function originalCreatureEmission(materials: readonly T.MeshStandardMaterial[]) {
  const strength = {value: new T.Vector2()};
  for (const material of materials) {
    if (!material.userData.k11Original) continue;
    const previous = material.onBeforeCompile, key = material.customProgramCacheKey();
    material.onBeforeCompile = (shader, renderer) => {
      previous.call(material, shader, renderer);
      shader.uniforms.k11EmissionStrength = strength;
      shader.vertexShader = 'attribute vec2 k11EmissionRegion; varying vec2 vK11EmissionRegion;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvK11EmissionRegion=k11EmissionRegion;');
      shader.fragmentShader = 'uniform vec2 k11EmissionStrength; varying vec2 vK11EmissionRegion;\n' + shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance*=1.0+vK11EmissionRegion.y*k11EmissionStrength.y;\ntotalEmissiveRadiance+=vec3(1.0,.36,.0)*vK11EmissionRegion.x*k11EmissionStrength.x;');
    };
    material.customProgramCacheKey = () => key + ':k11-named-emission-v1';
    material.needsUpdate = true;
  }
  return {
    set(region: CreatureEmissionRegion, value: number) {
      const channel = region === 'warden-ram' ? 'x' : 'y';
      strength.value[channel] = Number.isFinite(value) ? T.MathUtils.clamp(value, 0, 4) : 0;
    },
    reset() {strength.value.set(0, 0);},
  };
}

/** Keep alternate ranks resident but out of template metrics and skin batching. */
export function prepareOriginalCreature(root: T.Object3D): boolean {
  let found = false;
  root.traverse(object => {
    if (!(object instanceof T.SkinnedMesh)) return;
    const rank = rankOf(object.name);
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (!rank || !materials.some(material => material.userData.k11Original)) return;
    found = true;
    prepareEmissionRegions(object, rank);
    object.visible = rank === 'base';
    for (const material of materials) {
      material.userData.k11Original = true;
      // Existing authored-atlas capability also keeps GraphicSurface's family
      // remap off. Reuse that capability without changing E10 lighting code.
      material.userData.k10Original = true;
    }
  });
  if (found) root.userData.k11Original = true;
  return found;
}

function select(skin: CreatureSkin, rank: Rank, force = false): void {
  const resolved = skin.variants[rank] ? rank : rank === 'boss' && skin.variants.elite ? 'elite' : 'base';
  if (!force && resolved === skin.rank) return;
  skin.rank = resolved;
  skin.mesh.geometry = skin.variants[resolved]!;
  skin.root.updateMatrixWorld(true);
  // Both bounds use the same deformed vertices. Preserve Three's incremental
  // sphere and box accumulation while skinning each vertex only once.
  const mesh = skin.mesh;
  const bounds = (mesh.boundingBox ??= new T.Box3()).makeEmpty();
  const sphere = (mesh.boundingSphere ??= new T.Sphere()).makeEmpty();
  const point = new T.Vector3();
  const positions = mesh.geometry.getAttribute('position');
  for (let index = 0; index < positions.count; index++) {
    mesh.getVertexPosition(index, point);
    bounds.expandByPoint(point);
    sphere.expandByPoint(point);
  }
  skin.mesh.updateWorldMatrix(true, false);
  const root = skin.root;
  const toRoot = root.matrixWorld.clone().invert().multiply(skin.mesh.matrixWorld);
  // The first rank sample may be a compressed spawn/wind-up pose. Keep the
  // fixed-idle reference, including authored uniform boss scale, as a floor.
  const reference = rankHeights.get(String(skin.mesh.userData.k11Family))?.[resolved] ?? 0;
  skin.height = Math.max(reference, skin.mesh.boundingBox!.clone().applyMatrix4(toRoot).max.y);

}

/**
 * Consolidate only after SkeletonUtils has cloned the template. Every rank is a
 * complete surface using the same bones, bind transforms, material and atlas.
 * A rank change swaps one shared buffer; spare skins never enter corpse fitting.
 */
function consolidate(root: T.Object3D, elite: boolean): CreatureSkin | undefined {
  const meshes: T.SkinnedMesh[] = [];
  root.traverse(object => {
    if (object instanceof T.SkinnedMesh && rankOf(object.name)) meshes.push(object);
  });
  const mesh = meshes.find(object => rankOf(object.name) === 'base');
  if (!mesh) return;
  const variants: Partial<Record<Rank, T.BufferGeometry>> = {};
  for (const candidate of meshes) {
    variants[rankOf(candidate.name)!] = candidate.geometry;
    if (candidate !== mesh) candidate.removeFromParent();
  }
  mesh.visible = true;
  mesh.userData.geometryVariants = Object.values(variants);
  const skin: CreatureSkin = {mesh, variants, rank: 'base', height: 0, root};
  skins.set(root, skin);
  select(skin, elite ? 'elite' : 'base', true);
  return skin;
}

/** Original meshes replace K7's extra anatomy draw while preserving its API. */
export function originalCreatureIdentity(root: T.Group, kind: string, elite: boolean, span: number, height: number) {
  if (!root.getObjectByProperty('type', 'SkinnedMesh')) return;
  let original = false;
  root.traverse(object => { if (object.userData.k11Original) original = true; });
  if (!original) return;
  const skin = consolidate(root, elite);
  if (!skin || kind === 'queen') return;
  const uniforms: Record<string, T.IUniform> = {};
  for (const name of ['Study', 'Charge', 'StageLight', 'Pulse', 'Time', 'Shimmer', 'Elite', 'Champion', 'Exposed', 'Opening', 'Windup', 'OrganMotion', 'Dissolve', 'Status', 'Alpha', 'Death']) {
    uniforms['identity' + name] = {value: ['StageLight', 'Pulse', 'Alpha'].includes(name) ? 1 : 0};
  }
  uniforms.identityColor = {value: new T.Color(0xffffff)};
  uniforms.identitySpan = {value: span};
  uniforms.identityHeight = {value: height};
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute([], 3));
  const material = new T.ShaderMaterial({
    uniforms,
    vertexShader: 'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'void main(){gl_FragColor=vec4(0.0);}',
  });
  material.userData.actorMaterial = true;
  const mesh = new T.Mesh(geometry, material);
  mesh.name = `${kind}-identity`;
  mesh.visible = false;
  root.add(mesh);
  return {
    mesh,
    update(time: number, windup: number, champion: string | undefined, exposed: boolean, alpha: number, dead: boolean) {
      if (!dead) select(skin, champion ? 'boss' : elite ? 'elite' : 'base');
      uniforms.identityTime.value = time;
      uniforms.identityWindup.value = windup;
      uniforms.identityChampion.value = champion === 'warden' ? 1 : champion === 'matron' ? 2 : 0;
      uniforms.identityElite.value = elite || champion ? 1 : 0;
      uniforms.identityExposed.value = exposed ? 1 : 0;
      uniforms.identityAlpha.value = alpha;
      uniforms.identityDeath.value = dead ? 1 : 0;
    },
    reset() {
      select(skin, elite ? 'elite' : 'base', true);
      mesh.visible = false;
      for (const name of ['Dissolve', 'Status', 'Opening', 'Windup', 'Champion', 'Exposed', 'Death']) uniforms['identity' + name].value = 0;
      uniforms.identityStageLight.value = uniforms.identityPulse.value = uniforms.identityAlpha.value = 1;
      uniforms.identityElite.value = elite ? 1 : 0;
    },
  };
}

/** Share prepared rigid frost buffers across the pool, including every rank. */
export function originalCreatureFrost(root: T.Group, family: string) {
  const skin = skins.get(root);
  if (!skin) return;
  for (const original of Object.values(skin.variants)) {
    if (frostGeometry.has(original)) continue;
    skin.mesh.geometry = original;
    const frost = new AnatomicalFrost(root, family);
    frost.use();
    const geometry = skin.mesh.geometry;
    geometry.userData.sharedAsset = true;
    frostGeometry.set(original, geometry);
  }
  skin.mesh.userData.geometryVariants = [...new Set([
    ...Object.values(skin.variants),
    ...Object.values(skin.variants).map(geometry => frostGeometry.get(geometry)!),
  ])];
  skin.mesh.geometry = skin.variants[skin.rank]!;
  return {
    use() { skin.mesh.geometry = frostGeometry.get(skin.variants[skin.rank]!)!; },
    reset() { skin.mesh.geometry = skin.variants[skin.rank]!; },
  };
}

/** Cached on rank selection, after that rank's deformed skin bounds are known. */
export function originalCreatureHeight(root: T.Object3D): number {
  return skins.get(root)?.height ?? 0;
}

const footprintFits = new Map<string, Partial<Record<Rank, number>>>();
const rankScales = new Map<string, Partial<Record<Rank, number>>>();
const rankHeights = new Map<string, Partial<Record<Rank, number>>>();
/** Boss-tier uniform scale authored per rank skin (mesh extras k11RankScale); 1 when absent. */
export function originalCreatureRankScale(family: string, rank: Rank): number {
  return rankScales.get(family)?.[rank] ?? 1;
}
export function originalCreatureRankHeight(family: string, rank: Rank): number {
  return rankHeights.get(family)?.[rank] ?? 0;
}
/** Construction-only fixed M10 idle sample; never depends on the first combat pose. */
export function originalCreatureFootprints(root: T.Group, asset: T.Object3D, clips: readonly T.AnimationClip[], family: string, radius: number) {
  const key = family + ':' + radius;
  const cached = footprintFits.get(key);if (cached) return cached;
  const idle = clips.find(clip => clip.name === 'm10-idle');
  const fits: Partial<Record<Rank, number>> = {};
  if (!idle) return fits;
  const poses: Array<{bone:T.Bone;position:T.Vector3;quaternion:T.Quaternion;scale:T.Vector3}> = [];
  asset.traverse(object => {if(object instanceof T.Bone)poses.push({bone:object,position:object.position.clone(),quaternion:object.quaternion.clone(),scale:object.scale.clone()});});
  const mixer = new T.AnimationMixer(asset);
  mixer.clipAction(idle).play();mixer.setTime(Math.min(.5, idle.duration));
  for(const pose of poses)pose.bone.updateMatrix();
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert(), point = new T.Vector3();
  asset.traverse(object => {
    if (!(object instanceof T.SkinnedMesh)) return;
    const rank = rankOf(object.name);if(!rank)return;
    let radial = 0, top = -Infinity;
    const positions = object.geometry.getAttribute('position');
    for(let i=0;i<positions.count;i++) {
      object.getVertexPosition(i,point).applyMatrix4(object.matrixWorld).applyMatrix4(inverse);
      radial = Math.max(radial,Math.hypot(point.x,point.z));
      top = Math.max(top, point.y);
    }
    const scale = Number(object.userData.k11RankScale) || 1;
    const scales = rankScales.get(family) ?? {};scales[rank] = scale;rankScales.set(family, scales);
    // fitFootprint scales from the grounded actor origin, preserving floor contact.
    const heights = rankHeights.get(family) ?? {};heights[rank] = Math.max(0,top)*scale;rankHeights.set(family,heights);
    // A scaled boss rank owns a proportionally larger collider (integration scales the native radius by the same factor).
    if(radial>0&&rank!=='elite')fits[rank]=scale*radius*.94/radial;
  });
  // Elite skins share the base anatomy. Added blades and armour must not rescale it.
  if(fits.base!==undefined)fits.elite=fits.base*originalCreatureRankScale(family,'elite');
  mixer.stopAllAction();mixer.uncacheRoot(asset);
  for(const pose of poses){pose.bone.position.copy(pose.position);pose.bone.quaternion.copy(pose.quaternion);pose.bone.scale.copy(pose.scale);pose.bone.updateMatrix();}
  root.updateMatrixWorld(true);
  footprintFits.set(key,fits);return fits;
}
