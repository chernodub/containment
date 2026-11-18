import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {environmentClock} from '../lighting/HotFixtureSurface';
import {paintIncidentDeck} from './Inc13DeckPaint';
import type {OriginalKitInstance} from './OriginalShipKitAssets';

const dais = new T.Matrix4().makeScale(1.28, 1.10, 1.01).setPosition(617 / 32, 0, 386 / 32);

export function inc13ManualPlacement(): OriginalKitInstance {
  return {
    pack: 'p11-inc13-manual', asset: 'burned-manual-dais', matrix: dais.clone(),
    purpose: 'P11 / burned-manual-dais', cutaway: true,
  };
}

export function addInc13Manual(root: T.Group): void {
  paintIncidentDeck(root, 'inc13-manual-explosion-fan', [105, 334, 417, 350], c => {
    c.save();
    c.translate(-42, 7);
    let seed=13013;
    const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    // Smoke is deposited in overlapping, downwind wisps. Their ends feather
    // independently, so clean patches of original floor survive at the fringe.
    for(let i=0;i<290;i++){
      const t=random(),a=.18+random()*.74,r=32+360*t;
      const x=550-r*Math.cos(a),z=380+r*Math.sin(a);
      c.save();c.translate(x,z);c.rotate(-a);c.scale(1.9,.78);
      const radius=13+random()*26;
      const ash=c.createRadialGradient(0,0,0,0,0,radius);
      ash.addColorStop(0,'rgba(16,13,14,'+(.55-.22*t)+')');
      ash.addColorStop(.58,'rgba(26,23,24,'+(.34-.15*t)+')');ash.addColorStop(1,'rgba(39,35,34,0)');
      c.fillStyle=ash;c.fillRect(-radius,-radius,2*radius,2*radius);c.restore();
    }
    for(let i=0;i<38;i++){
      const angle=.09+random()*.89,length=80+random()*310;
      const x=550-length*Math.cos(angle),z=380+length*Math.sin(angle);
      const ash=c.createLinearGradient(550,380,x,z);
      ash.addColorStop(0,'rgba(105,98,88,.36)');ash.addColorStop(.62,'rgba(87,77,68,.14)');ash.addColorStop(1,'transparent');
      c.strokeStyle=ash;c.lineWidth=.7+random()*2.3;c.beginPath();
      c.moveTo(550-random()*22,380+random()*7);c.quadraticCurveTo((550+x)/2+5,(380+z)/2+4,x,z);c.stroke();
    }
    // The upturned seat and bent back interrupt the deposit on their lee side.
    c.globalCompositeOperation = 'destination-out';
    c.fillStyle = 'rgba(0,0,0,.75)';
    c.fill(new Path2D('M555 401 L543 415 531 415 523 420 516 416 Q471 461 428 478 Q453 453 482 428 L517 400 537 395Z'));
    c.restore();
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
