import * as T from 'three';
import type { ShipEnvironment } from '../ShipEnvironments';
import { getEnvironmentMood } from './EnvironmentMoods';

type Polygon = readonly Readonly<{ x: number; y: number }>[];
type InteriorPlan = Readonly<{ obstacles: readonly Readonly<{ x: number; y: number; width: number; height: number }>[]; voids?: readonly Polygon[] }>;

function inside(polygon: Polygon, x: number, z: number): boolean {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j], ax = a.x / 32, az = a.y / 32, bx = b.x / 32, bz = b.y / 32;
    const cross = (x - ax) * (bz - az) - (z - az) * (bx - ax);
    if (Math.abs(cross) < 1e-5 && x >= Math.min(ax,bx)-1e-5 && x <= Math.max(ax,bx)+1e-5 && z >= Math.min(az,bz)-1e-5 && z <= Math.max(az,bz)+1e-5) return true;
    if ((az > z) !== (bz > z) && x < (bx - ax) * (z - az) / (bz - az) + ax) result = !result;
  }
  return result;
}
function fits(polygon: Polygon, x: number, z: number, clearance: number): boolean {
  return inside(polygon,x,z) && inside(polygon,x-clearance,z-clearance) && inside(polygon,x+clearance,z-clearance) && inside(polygon,x-clearance,z+clearance) && inside(polygon,x+clearance,z+clearance);
}

function place(anchor: T.Vector3, polygon: Polygon | undefined, x0: number, z0: number, x1: number, z1: number, clearance: number): boolean {
  if(x1-x0<clearance*2||z1-z0<clearance*2)return false;
  const startX=anchor.x,startZ=anchor.z,cx=(x0+x1)/2,cz=(z0+z1)/2;
  const accept=(x:number,z:number)=>{
    if(x<x0+clearance||x>x1-clearance||z<z0+clearance||z>z1-clearance||polygon&&!fits(polygon,x,z,clearance))return false;
    anchor.x=x;anchor.z=z;return true;
  };
  if(accept(Math.max(x0+clearance,Math.min(x1-clearance,startX)),Math.max(z0+clearance,Math.min(z1-clearance,startZ))))return true;
  for(let step=1;step<=10;step++){const amount=step/10;if(accept(startX+(cx-startX)*amount,startZ+(cz-startZ)*amount))return true;}
  // A concave ring's centroid may be ordinary floor. Search around the source first.
  for(let ring=1;ring<=4;ring++)for(let angle=0;angle<16;angle++){
    const radians=angle*Math.PI/8,radius=clearance*ring*1.2;
    if(accept(startX+Math.cos(radians)*radius,startZ+Math.sin(radians)*radius))return true;
  }
  if(polygon)for(let i=0;i<polygon.length;i++){
    const a=polygon[i],b=polygon[(i+1)%polygon.length],mx=(a.x+b.x)/64,mz=(a.y+b.y)/64;
    for(let angle=0;angle<16;angle++){
      const radians=angle*Math.PI/8;
      if(accept(mx+Math.cos(radians)*clearance*1.5,mz+Math.sin(radians)*clearance*1.5))return true;
    }
  }
  return false;
}

/** Add bounded practical emitters on real non-walkable equipment surfaces, never in circulation lanes. */
export function addInteriorPracticals(world: T.Group, template: InteriorPlan, environment: ShipEnvironment, domesticTaskLights=false): void {
  if (environment === 'reactor' || environment === 'cryogenics' || environment === 'habitation'&&!domesticTaskLights || world.userData.interiorPracticals) return;
  const anchors: {point:T.Vector3;tiny:boolean}[] = [];
  const point = new T.Vector3(), relative = new T.Matrix4(), objectRelative = new T.Matrix4(), instance = new T.Matrix4(), inverse = new T.Matrix4();
  world.updateWorldMatrix(true, true); inverse.copy(world.matrixWorld).invert();
  const footprints = template.obstacles.map(obstacle => ({...obstacle, polygon: undefined as Polygon | undefined}));
  for (const polygon of template.voids ?? []) {
    if (polygon.length < 3) continue;
    const xs=polygon.map(point=>point.x),zs=polygon.map(point=>point.y),x=Math.min(...xs),y=Math.min(...zs);
    footprints.push({x,y,width:Math.max(...xs)-x,height:Math.max(...zs)-y,polygon});
  }
  for (const obstacle of footprints) {
    if (anchors.length === 8) break;
    const x0 = obstacle.x / 32, z0 = obstacle.y / 32, x1 = (obstacle.x + obstacle.width) / 32, z1 = (obstacle.y + obstacle.height) / 32;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    let bestY = .35, bestDistance = Infinity, anchor: T.Vector3 | null = null;
    world.traverse(object => {
      if (!(object instanceof T.Mesh) || (object.material as T.Material).name === 'environment-contact') return;
      const vertices = object.geometry.getAttribute('position'); if (!vertices) return;
      objectRelative.multiplyMatrices(inverse, object.matrixWorld);
      const count=object instanceof T.InstancedMesh?object.count:1;
      for(let slot=0;slot<count;slot++){
       if(object instanceof T.InstancedMesh){object.getMatrixAt(slot,instance);relative.multiplyMatrices(objectRelative,instance);}else relative.copy(objectRelative);
       for (let i = 0; i < vertices.count; i++) {
        point.fromBufferAttribute(vertices, i).applyMatrix4(relative);
        if (point.x < x0-1e-5 || point.x > x1+1e-5 || point.z < z0-1e-5 || point.z > z1+1e-5 || point.y < .35 || point.y > 3.5) continue;
        if (obstacle.polygon && !inside(obstacle.polygon,point.x,point.z)) continue;
        const distance = (point.x - cx) ** 2 + (point.z - cz) ** 2;
        if (point.y > bestY + .08 || point.y >= bestY - .08 && distance < bestDistance) {
          bestY = point.y; bestDistance = distance;
          if (!anchor) anchor = new T.Vector3(); anchor.copy(point);
        }
       }
      }
    });
    if (anchor) {
      const mounted = anchor as T.Vector3;
      let tiny=false;
      if(!place(mounted,obstacle.polygon,x0,z0,x1,z1,.35)){
        if(!place(mounted,obstacle.polygon,x0,z0,x1,z1,.065))continue;
        tiny=true;
      }
      anchors.push({point:mounted,tiny});
    }
  }
  if (!anchors.length) return;
  world.userData.interiorPracticals = true;
  const organic = environment === 'infested';
  const geometry = organic ? new T.SphereGeometry(1, 10, 6) : new T.BoxGeometry(1, 1, 1);
  const material = new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: organic ? 1.3 : 1.5, roughness: .45, metalness: .15 });
  material.userData.actorMaterial = true; material.userData.motivatedEmitter = true;
  material.onBeforeCompile = shader => { shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#ifdef USE_COLOR\n totalEmissiveRadiance*=vColor.rgb;\n#endif'); };
  material.customProgramCacheKey = () => 'interior-practical-emission-v1';
  const emitters = new T.InstancedMesh(geometry, material, anchors.length);
  const housingMaterial = new T.MeshStandardMaterial({ color: 0x28363b, roughness: .65, metalness: .6 }); housingMaterial.userData.actorMaterial = true;
  const housings = new T.InstancedMesh(organic?new T.SphereGeometry(1,10,6):new T.BoxGeometry(1, 1, 1), housingMaterial, anchors.length);
  if(organic){housingMaterial.color.setHex(0x392c35);housingMaterial.metalness=.05;housingMaterial.roughness=.85;}
  emitters.name = 'interior-practical-emitters'; housings.name = 'interior-practical-housings';
  const dummy = new T.Object3D(), color = new T.Color(), fixtures = world.userData.lightFixtures ??= [];
  for (let i = 0; i < anchors.length; i++) {
    const {point:anchor,tiny} = anchors[i];
    const tint = organic ? i % 3 === 1 ? 0xdc68ca : 0xa1ef72 : environment === 'communications' ? i % 2 ? 0x58e4bc : 0x69d9ef : environment === 'security' ? 0xe8f1ff : environment === 'containment' && i % 2 ? 0xe5eaff : getEnvironmentMood(environment).practical.color;
    dummy.position.copy(anchor); dummy.position.y += .045; dummy.scale.set(tiny?.12:.65, .09, tiny?.12:.42); dummy.updateMatrix(); housings.setMatrixAt(i, dummy.matrix);
    dummy.position.y += organic ? tiny?.035:.05 : .09; dummy.scale.set(tiny?organic?.025:.09:organic?.075:environment==='communications'?.12:.5, organic?tiny?.025:.055:.08, tiny?organic?.045:.09:organic?.18:environment==='communications'?.1:.25); dummy.updateMatrix(); emitters.setMatrixAt(i, dummy.matrix); emitters.setColorAt(i, color.setHex(tint));
    fixtures.push({ x: dummy.position.x, y: dummy.position.y, z: dummy.position.z, color: tint, nativeColor: true });
  }
  for (const mesh of [housings, emitters]) { mesh.frustumCulled = false; mesh.instanceMatrix.needsUpdate = true; mesh.geometry.addEventListener('dispose', () => mesh.dispose()); }
  world.add(housings, emitters);
}
