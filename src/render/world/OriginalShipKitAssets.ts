import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoomModelCache} from '../RoomModelCache';
import {registerOriginalInteriorCutaways,type InteriorCutaway} from './OriginalInteriorCutaways';

export type OriginalKitPack = 'clinical' | 'security' | 'industrial' | 'structure' | 'p11-comms' | 'p11-habitation' | 'p11-infested' | 'p11-reactor' | 'p11-control' | 'p11-clinical-security' | 'p11-cargo' | 'p11-service' | 'p11-maintenance';

const base = import.meta.env.BASE_URL + 'assets/e9-ship-kit/';
const URLs: Record<OriginalKitPack, string> = {
  'p11-comms': import.meta.env.BASE_URL + 'assets/p11/comms-engineering/comms-engineering.glb',
  'p11-habitation': import.meta.env.BASE_URL + 'assets/p11/habitation/habitation.glb',
  'p11-infested': import.meta.env.BASE_URL + 'assets/p11/infested/infested.glb',
  'p11-reactor': import.meta.env.BASE_URL + 'assets/p11/reactor/reactor.glb',
  'p11-control': import.meta.env.BASE_URL + 'assets/p11/control/control.glb',
  'p11-clinical-security': import.meta.env.BASE_URL + 'assets/p11/clinical-security/clinical-security.glb',
  'p11-cargo': import.meta.env.BASE_URL + 'assets/p11/cargo/cargo.glb',
  'p11-service': import.meta.env.BASE_URL + 'assets/p11/service-kit/service-kit.glb',
  'p11-maintenance': import.meta.env.BASE_URL + 'assets/p11/maintenance-containment/maintenance-containment.glb',
  clinical: base + 'clinical/clinical.glb',
  security: base + 'security/security.glb',
  industrial: base + 'industrial/kit.glb',
  structure: base + 'structure/structure.glb',
};
const functionPacks = new RoomModelCache(
  (['clinical', 'security', 'industrial'] as const).map(pack => ({
    url: URLs[pack], maxBytes: 2_000_000, label: 'Original ' + pack + ' ship kit',
  })),
);
const structurePack = new RoomModelCache([
  {url: URLs.structure, maxBytes: 2_000_000, label: 'Original ship structure kit'},
]);

const p11Packs = new Map<OriginalKitPack,RoomModelCache>();

/** Fixed, lazy session templates. The caller retires each returned borrow. */
export function acquireOriginalShipKit(pack: OriginalKitPack, signal?: AbortSignal): Promise<T.Group> {
  const url = URLs[pack];
  if (!url) return Promise.reject(Error('Unknown original ship kit pack: ' + pack));
  if(pack.startsWith('p11-')) {
    let cache=p11Packs.get(pack);
    if(!cache){cache=new RoomModelCache([{url,maxBytes:2_000_000,label:'Original '+pack+' set pieces'}]);p11Packs.set(pack,cache);}
    return cache.acquire(url,signal);
  }
  return (pack === 'structure' ? structurePack : functionPacks).acquire(url, signal);
}

export type OriginalKitInstance = {
  pack: OriginalKitPack;
  asset: string;
  matrix: T.Matrix4;
  purpose: string;
  castShadow?: boolean;
  cutaway?: boolean;
  /** Secondary fittings are omitted from the existing batches on Low. */
  highDetail?: boolean;
};

type Bucket = {material: T.MeshStandardMaterial; geometries: T.BufferGeometry[]; castShadow: boolean; vertices:number; lowVertices:number; cutaway:boolean};
type QualityRange = {geometry:T.BufferGeometry; high:number; low:number};
const qualityRanges = new WeakMap<T.Object3D, QualityRange[]>();

/** Reuse warmed geometry/materials when switching tiers; no rebakes or batches. */
export function setOriginalShipKitQuality(world:T.Object3D, high:boolean):void {
  world.traverse(owner=>{
    const ranges=qualityRanges.get(owner);
    if(!ranges)return;
    for(const range of ranges)range.geometry.setDrawRange(0,high?range.high:range.low);
    owner.userData.submittedTriangles=ranges.reduce((sum,r)=>sum+(high?r.high:r.low)/3,0);
  });
}

type Emitter = {position: T.Vector3; area: number};
type Fixture = {
  x: number; y: number; z: number; color: number;
  nativeColor: true; poolStyle: 1; gain: number;
  poolWidth: number; poolDepth: number; poolAngle: number;
};

/** Split a source's joined emissive finish into real connected lamps. A scanner
 * gate's two sensor panels must never create a light floating in its aperture. */
function sourceEmitters(geometry: T.BufferGeometry): Emitter[] {
  const position = geometry.getAttribute('position'), index = geometry.index;
  const weld = new Map<string, number>(), parent: number[] = [];
  const vertexNodes = new Map<number, number>(), triangles: number[][] = [];
  const root = (node: number): number => {
    while (parent[node] !== node) {parent[node] = parent[parent[node]]; node = parent[node];}
    return node;
  };
  const vertex = (i: number): number => {
    let node = vertexNodes.get(i);
    if (node !== undefined) return node;
    const key = [position.getX(i), position.getY(i), position.getZ(i)]
      .map(value => Math.round(value * 100_000)).join('/');
    node = weld.get(key);
    if (node === undefined) {node = parent.length; parent.push(node); weld.set(key, node);}
    vertexNodes.set(i, node);
    return node;
  };
  const count = index?.count ?? position.count;
  for (let i = 0; i < count; i += 3) {
    const points = [0, 1, 2].map(offset => index ? index.getX(i + offset) : i + offset);
    const nodes = points.map(vertex), head = root(nodes[0]);
    parent[root(nodes[1])] = head; parent[root(nodes[2])] = head;
    triangles.push(points);
  }
  const components = new Map<number, {bounds: T.Box3; triangles: number[][]; area: number}>();
  const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), triangle = new T.Triangle();
  for (const points of triangles) {
    const key = root(vertex(points[0]));
    let component = components.get(key);
    if (!component) {component = {bounds: new T.Box3(), triangles: [], area: 0}; components.set(key, component);}
    a.fromBufferAttribute(position, points[0]); b.fromBufferAttribute(position, points[1]); c.fromBufferAttribute(position, points[2]);
    component.bounds.expandByPoint(a).expandByPoint(b).expandByPoint(c);
    component.area += triangle.set(a, b, c).getArea(); component.triangles.push(points);
  }
  const emitters: Emitter[] = [], nearest = new T.Vector3();
  for (const component of components.values()) {
    if (component.area <= 0) continue;
    const center = component.bounds.getCenter(new T.Vector3()), point = center.clone();
    let distance = Infinity;
    // A ring's bounds center is empty space. Anchor to the nearest actual
    // emissive triangle instead, including for narrow cyan service pipes.
    for (const points of component.triangles) {
      a.fromBufferAttribute(position, points[0]); b.fromBufferAttribute(position, points[1]); c.fromBufferAttribute(position, points[2]);
      triangle.set(a, b, c).closestPointToPoint(center, nearest);
      const next = center.distanceToSquared(nearest);
      if (next < distance) {distance = next; point.copy(nearest);}
    }
    emitters.push({position: point, area: component.area});
  }
  return emitters;
}

/** Build room-owned stock-PBR batches, preserving native origins and baked AO.
 * Source graphs, immutable source buffers and source materials remain untouched.
 * Dispose the returned group with disposeModel; retire borrowed sources separately. */
export function buildOriginalShipKit(
  sources: ReadonlyMap<OriginalKitPack, T.Group>,
  instances: readonly OriginalKitInstance[],
): T.Group {
  const result = new T.Group();
  result.name = 'e9-original-ship-kit'; result.userData.visualOnly = true;
  const buckets = new Map<string, Bucket>(), emitterCache = new Map<T.BufferGeometry, Emitter[]>();
  const ownedGeometry = new Set<T.BufferGeometry>(), ownedMaterials = new Set<T.Material>();
  const placements: {pack: OriginalKitPack; asset: string; purpose: string; matrix: number[]; bounds: number[][]; triangles: number}[] = [];
  const fixtures: Fixture[] = [];
  const cutaways:{bounds:T.Box3;parts:{finish:string;start:number;end:number}[]}[]=[];
  const mergedColors=new Map<string,T.BufferAttribute>();
  let totalTriangles = 0;
  const ranges:QualityRange[]=[];
  try {
    const heroBounds=instances.filter(i=>i.pack.startsWith('p11-') && i.pack!=='p11-service').map(i=>{
      const asset=sources.get(i.pack)?.getObjectByName(i.asset);
      return asset ? new T.Box3().setFromObject(asset).applyMatrix4(i.matrix) : null;
    }).filter((b):b is T.Box3=>b!==null);
    // Tail geometry can be omitted with drawRange without another material pass.
    const ordered=[...instances.filter(i=>!i.highDetail),...instances.filter(i=>i.highDetail)];
    for (const instance of ordered) {
      // Retire a stock furnishing only when its origin lies inside a new hero.
      // Hulls and portal structure retain their independent ownership.
      if(!instance.pack.startsWith('p11-') && instance.pack!=='structure' &&
         heroBounds.some(b=>b.containsPoint(new T.Vector3().setFromMatrixPosition(instance.matrix)))) continue;

      // Roof fittings follow their stock support when a hero replaces it.
      if(instance.pack==='p11-service'){
        const support=new T.Vector3().setFromMatrixPosition(instance.matrix);support.y=0;
        if(heroBounds.some(b=>b.containsPoint(support)))continue;
      }
      const source = sources.get(instance.pack), asset = source?.getObjectByName(instance.asset);
      if (!source || !asset) throw Error(`Original ${instance.pack} ship kit asset missing: ${instance.asset}`);
      if (!instance.matrix.elements.every(Number.isFinite) || Math.abs(instance.matrix.determinant()) < 1e-12)
        throw Error('Invalid original ship kit instance transform: ' + instance.asset);
      const bounds = new T.Box3(), lamps: {position: T.Vector3; area: number; color: number}[] = [];
      const parts:{finish:string;start:number;end:number}[]=[];
      let instanceTriangles = 0, meshCount = 0;
      const visit = (object: T.Object3D, relative: T.Matrix4): void => {
        if (object instanceof T.SkinnedMesh || object instanceof T.InstancedMesh)
          throw Error('Original ship kit requires static primitives: ' + instance.asset);
        if (object instanceof T.Mesh) {
          meshCount++;
          const sourceMaterial = object.material, original = object.geometry;
          if (!(sourceMaterial instanceof T.MeshStandardMaterial) || !sourceMaterial.name)
            throw Error('Original ship kit requires named stock-PBR finishes: ' + instance.asset);
          if (Object.entries(sourceMaterial).some(([key,value]) => value instanceof T.Texture && key !== 'normalMap'))
            throw Error('Original ship kit has an unexpected texture: ' + instance.asset);
          const position = original.getAttribute('position'), normal = original.getAttribute('normal'), color = original.getAttribute('color');
          const vertexCount = original.index?.count ?? position?.count ?? 0;
          if (!position || !normal || !color || color.itemSize < 3 || vertexCount === 0 || vertexCount % 3 !== 0)
            throw Error('Original ship kit lacks triangle positions, normals or AO: ' + instance.asset);
          const combined = new T.Matrix4().multiplyMatrices(instance.matrix, relative);
          const geometry = original.index ? original.toNonIndexed() : original.clone();
          geometry.userData = {}; ownedGeometry.add(geometry);
          const sourceColor = geometry.getAttribute('color'), rgb = new Float32Array(geometry.getAttribute('position').count * 4);
          for (let i = 0; i < sourceColor.count; i++) {
            rgb[i * 4] = sourceColor.getX(i); rgb[i * 4 + 1] = sourceColor.getY(i); rgb[i * 4 + 2] = sourceColor.getZ(i);rgb[i*4+3]=1;
          }
          for (const name of Object.keys(geometry.attributes)) if (name !== 'position' && name !== 'normal' && !(name === 'uv' && sourceMaterial.normalMap)) geometry.deleteAttribute(name);
          geometry.setAttribute('color', new T.BufferAttribute(rgb, 4));
          geometry.applyMatrix4(combined); geometry.computeBoundingBox(); bounds.union(geometry.boundingBox!);
          const count = geometry.getAttribute('position').count / 3;
          totalTriangles += count; instanceTriangles += count;
          const finish = sourceMaterial.name;
          // Each pack owns a distinct UV atlas; equal finish names cannot merge across it.
          const bucketKey = sourceMaterial.normalMap ? instance.pack + '/' + finish : finish;
          let bucket = buckets.get(bucketKey);
          if (!bucket) {
            const material = sourceMaterial.clone();
            ownedMaterials.add(material); material.name = finish; material.vertexColors = true;
            material.userData.actorMaterial = true; material.userData.originalShipKitFinish = finish;
            if (finish.startsWith('e9-floor-')) material.userData.floorDressing = true;
            if (material.emissive.getHex() !== 0 && material.emissiveIntensity > 0) material.userData.motivatedEmitter = true;
            if (material.transparent || material.opacity < 1) material.depthWrite = false;
            bucket = {material, geometries: [], castShadow: false,vertices:0,lowVertices:0,cutaway:false}; buckets.set(bucketKey, bucket);
          }
          const vertices=geometry.getAttribute('position').count;
          if(instance.cutaway&&!bucket.material.transparent){parts.push({finish:bucketKey,start:bucket.vertices,end:bucket.vertices+vertices});bucket.cutaway=true;}
          bucket.vertices+=vertices;
          if(!instance.highDetail)bucket.lowVertices+=vertices;
          bucket.geometries.push(geometry);
          bucket.castShadow ||= instance.castShadow !== false;
          if (sourceMaterial.emissive.getHex() !== 0 && sourceMaterial.emissiveIntensity > 0 && !sourceMaterial.transparent) {
            let emitters = emitterCache.get(original);
            if (!emitters) {emitters = sourceEmitters(original); emitterCache.set(original, emitters);}
            for (const emitter of emitters) lamps.push({
              position: emitter.position.clone().applyMatrix4(combined), area: emitter.area,
              color: sourceMaterial.emissive.getHex(),
            });
          }
        }
        for (const child of object.children) {
          const local = child.matrixAutoUpdate
            ? new T.Matrix4().compose(child.position, child.quaternion, child.scale)
            : child.matrix;
          visit(child, new T.Matrix4().multiplyMatrices(relative, local));
        }
      };
      // The instance matrix replaces the named asset group's placement. Child
      // transforms remain relative to that native bottom-centred group.
      visit(asset, new T.Matrix4());
      if (meshCount === 0 || bounds.isEmpty()) throw Error('Original ship kit asset has no geometry: ' + instance.asset);
      placements.push({pack: instance.pack, asset: instance.asset, purpose: instance.purpose,
        matrix: instance.matrix.toArray(), bounds: [bounds.min.toArray(), bounds.max.toArray()], triangles: instanceTriangles});
      if(parts.length)cutaways.push({bounds:bounds.clone(),parts});
      const angle = Math.atan2(-instance.matrix.elements[2], instance.matrix.elements[0]);
      for (const lamp of (instance.highDetail?[]:lamps).sort((a, b) => b.area - a.area).slice(0, 2)) fixtures.push({
        x: lamp.position.x, y: lamp.position.y, z: lamp.position.z, color: lamp.color,
        nativeColor: true, poolStyle: 1, poolAngle: angle, gain: .18, poolWidth: .35, poolDepth: 1.4,
      });
    }
    for (const [finish, bucket] of buckets) {
      const geometry = mergeGeometries(bucket.geometries, false);
      if (!geometry) throw Error('Original ship kit finish merge failed: ' + finish);
      ownedGeometry.add(geometry);
      ranges.push({geometry,high:bucket.vertices,low:bucket.lowVertices});
      for (const part of bucket.geometries) {part.dispose(); ownedGeometry.delete(part);}
      geometry.computeBoundingBox(); geometry.computeBoundingSphere();
      const colors=geometry.getAttribute('color') as T.BufferAttribute;mergedColors.set(finish,colors);
      if(bucket.cutaway){bucket.material.alphaTest=.3;colors.setUsage(T.DynamicDrawUsage);}
      const mesh = new T.Mesh(geometry, bucket.material);
      mesh.name = finish; mesh.userData.bakedEnvironment = true; mesh.userData.visualOnly = true;
      const glass = bucket.material.transparent || bucket.material.opacity < 1;
      mesh.castShadow = !glass && bucket.castShadow; mesh.receiveShadow = !glass;
      result.add(mesh);
    }
    result.userData.instancePlacements = placements; result.userData.placements = placements;
    result.userData.triangles = totalTriangles; result.userData.lightFixtures = fixtures;
    registerOriginalInteriorCutaways(result,cutaways.map(piece=>({bounds:piece.bounds,hidden:false,
      parts:piece.parts.map(part=>({colors:mergedColors.get(part.finish)!,start:part.start,end:part.end})),
    } satisfies InteriorCutaway)));
    qualityRanges.set(result,ranges);
    setOriginalShipKitQuality(result,true);
    return result;
  } catch (error) {
    ownedGeometry.forEach(geometry => geometry.dispose()); ownedMaterials.forEach(material => material.dispose());
    result.clear();
    throw error;
  }
}
