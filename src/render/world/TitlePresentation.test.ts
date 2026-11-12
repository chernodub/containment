import {beforeAll,expect,it,vi} from 'vitest';
import * as T from 'three';
import {loadModels} from '../../../tests/loadModels';
import {marine} from '../models';
import {disposeModel} from '../meshParts';
import {styleTitleActor,TitlePresentation,TITLE_STAGE} from './TitlePresentation';
import {SceneLighting} from '../SceneLighting';

beforeAll(loadModels);

it('fits bounded armor to the actual title torso and follows rig color without material churn',()=>{
  const model=marine();styleTitleActor(model.root,true);
  const armor=model.root.getObjectByName('title-marine-armor')!;
  expect(armor.parent!.name).toBe('ribs');expect(armor.children).toHaveLength(3);
  const original=model.root.getObjectByName('marine-rig-accents') as T.Mesh<T.BufferGeometry,T.ShaderMaterial>;
  const bands=model.root.getObjectByName('title-armor-rig-bands') as T.Mesh<T.BufferGeometry,T.ShaderMaterial>;
  expect(bands.material.uniforms.rigColor).toBe(original.material.uniforms.rigColor);
  const geometry=bands.geometry,material=bands.material;model.setRig!('cryo');
  expect(bands.material.uniforms.rigColor.value.getHex()).toBe(0x7fd6ff);
  model.animate(0,0,-1.1);model.root.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(armor),size=bounds.getSize(new T.Vector3());
  expect(size.x).toBeLessThan(1);expect(size.y).toBeLessThan(.65);expect(size.z).toBeLessThan(.8);
  expect(bounds.min.y).toBeGreaterThan(1);expect(bounds.max.y).toBeLessThan(1.9);
  expect(bands.geometry).toBe(geometry);expect(bands.material).toBe(material);
  let triangles=0;const resources:Array<ReturnType<typeof vi.spyOn>>=[];
  armor.traverse(o=>{if(o instanceof T.Mesh){triangles+=o.geometry.getAttribute('position').count/3;resources.push(vi.spyOn(o.geometry,'dispose'),vi.spyOn(o.material,'dispose'));}});
  expect(triangles).toBeLessThan(3000);disposeModel(model.root);
  for(const resource of resources)expect(resource).toHaveBeenCalledOnce();
});

it('reuses fixed menu lights with a cool directional reveal and a restrained warm practical',()=>{
  const lighting=new SceneLighting();lighting.loadRoom(new T.Group(),40,30,'cryogenics');
  const children=lighting.root.children.slice();lighting.setMenu(true);
  expect(lighting.key.color.b).toBeGreaterThan(lighting.key.color.r);
  expect(lighting.rim.intensity).toBeGreaterThan(1);
  expect(lighting.fill.intensity).toBeGreaterThan(.3);
  expect(lighting.fixtures[0].color.r).toBeGreaterThan(lighting.fixtures[0].color.b);
  expect(lighting.fixtures[0].distance).toBeLessThanOrEqual(7);
  expect(lighting.root.children).toEqual(children);
  lighting.setMenu(false);expect(lighting.root.children).toEqual(children);lighting.dispose();
});

it('keeps real rig bands visible outside the assembled suit from the native title camera',()=>{
  const model=marine(),title=new TitlePresentation(),camera=new T.PerspectiveCamera(28,16/9);
  model.root.scale.setScalar(1.9);styleTitleActor(model.root,true);model.setAimPitch!(TITLE_STAGE.marine.aimPitch);
  model.root.position.set(TITLE_STAGE.marine.x,0,TITLE_STAGE.marine.z);model.animate(0,0,TITLE_STAGE.marine.angle);model.root.updateMatrixWorld(true);title.apply(camera,0,true);
  const bands=model.root.getObjectByName('title-armor-rig-bands') as T.Mesh;
  const vertices=bands.geometry.getAttribute('position'),point=new T.Vector3(),ray=new T.Raycaster();let visible=0;
  for(let i=0;i<vertices.count;i+=36){
    point.fromBufferAttribute(vertices,i).applyMatrix4(bands.matrixWorld);
    ray.set(camera.position,point.sub(camera.position).normalize());
    if(ray.intersectObject(model.root,true)[0]?.object===bands)visible++;
  }
  expect(visible).toBeGreaterThan(2);disposeModel(model.root);title.dispose();
});
