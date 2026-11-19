import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {environmentClock} from '../lighting/HotFixtureSurface';
import {paintIncidentDeck} from './Inc13DeckPaint';
import type {OriginalKitInstance} from './OriginalShipKitAssets';

const dais = new T.Matrix4().makeScale(1.17, 1.32, 1.01).setPosition(550 / 32, 0, 411 / 32);

export function inc13ManualPlacement(): OriginalKitInstance {
  return {
    pack: 'p11-inc13-manual', asset: 'burned-manual-dais', matrix: dais.clone(),
    purpose: 'P11 / burned-manual-dais', cutaway: true,
  };
}

export function addInc13Manual(root: T.Group): void {
  paintIncidentDeck(root,'room14-manual-scorch',[425,360,140,73],c=>{
    const ash=c.createRadialGradient(480,392,4,480,392,35);
    ash.addColorStop(0,'rgba(24,24,24,.85)');ash.addColorStop(1,'rgba(35,35,35,0)');
    c.fillStyle=ash;c.fillRect(435,355,90,76);
  });

  // Blender (x, y, z) exports to glTF (x, z, -y). These endpoints are the
  // two stripped conductor tips in manual.py, under the same transform as the dais.
  const points = [
    [-2.60, 1.65, .21],
    [-2.63, 1.67, .14],
    [-2.60, 1.64, .087],
    [-2.64, 1.66, .025],
    [-2.60, 1.65, -.03],
  ].map(([x, y, z]) => new T.Vector3(x, y, z).applyMatrix4(dais));
  const segments = points.slice(1).map((tip, i) => {
    const direction = tip.clone().sub(points[i]);
    const segment = new T.CylinderGeometry(.009, .009, direction.length() + .008, 5);
    segment.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), direction.normalize()));
    return segment.translate(...tip.clone().lerp(points[i], .5).toArray());
  });
  const geometry = mergeGeometries(segments, false)!;
  segments.forEach(segment => segment.dispose());
  const material = new T.MeshBasicMaterial({
    color: 0xd9efff, transparent: true, depthWrite: false, toneMapped: false,
  });
  material.userData.actorMaterial = true;
  const arc = new T.Mesh(geometry, material);
  arc.name = 'inc13-manual-conductor-arc';
  arc.onBeforeRender = () => {
    const t = environmentClock.value;
    const flicker = Math.sin(t * 53) + .55 * Math.sin(t * 89 + 1.7);
    material.opacity = flicker < -.35 ? .04 : .65 + .35 * Math.sin(t * 31) ** 2;
  };
  root.add(arc);
}
