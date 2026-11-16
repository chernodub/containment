import * as T from 'three';
import {AnatomicalFrost} from './motion/AnatomicalFrost';

type Rank = 'base' | 'elite' | 'boss';
type CreatureSkin = {
  mesh: T.SkinnedMesh;
  variants: Partial<Record<Rank, T.BufferGeometry>>;
  rank: Rank;
};
const skins = new WeakMap<T.Object3D, CreatureSkin>();
const frostGeometry = new WeakMap<T.BufferGeometry, T.BufferGeometry>();

function rankOf(name: string): Rank | undefined {
  return name.match(/^k11-[a-z]+-(base|elite|boss)(?:_\d+)?$/)?.[1] as Rank | undefined;
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
  skin.mesh.computeBoundingBox();
  skin.mesh.computeBoundingSphere();
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
  const skin: CreatureSkin = {mesh, variants, rank: 'base'};
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
