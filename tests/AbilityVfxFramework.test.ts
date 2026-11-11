import * as T from 'three';
import { describe,it,expect,vi } from 'vitest';
import { ABILITY_CATALOG } from '../src/game/abilities/catalog';
import type { AbilityEvent } from '../src/game/abilities/contract';
import { bindAbilityShape } from '../src/render/abilities/shape';
import { ElementKit,ABILITY_VFX_LIMITS } from '../src/render/abilities/ElementKit';
import { AbilityVisuals } from '../src/render/abilities/AbilityVisuals';
import { GRAPHICS_PRESETS } from '../src/render/graphicsOptions';
import { MaterialWarmup } from '../src/render/MaterialWarmup';
import type { Telegraph } from '../src/render/vfx';

describe('V2 shared framework',()=>{
 it('binds every catalog footprint without inventing chain or dash hit areas',()=>{
  for(const d of Object.values(ABILITY_CATALOG)){
   const e:AbilityEvent={ability:d.id,rig:d.rig,slot:d.slot,element:d.element,phase:'cast',angle:.7,targetX:640,targetY:320};
   const out:Telegraph={shape:'circle',x:0,z:0};const drawn=bindAbilityShape(out,e,64,96),s=d.shape;
   if(s.kind==='chain'||s.kind==='dash'){expect(drawn).toBe(false);continue;}
   if(s.kind==='circle'){expect(drawn).toBe(s.radius>0);expect(out.radius).toBe(s.radius/32);}
   else if(s.kind==='wall'){
    expect(out.length).toBe(s.length/32);expect(out.width).toBe(s.thickness/32);
    expect(out.x+Math.cos(out.angle!)*out.length!/2).toBeCloseTo(20);
    expect(out.z+Math.sin(out.angle!)*out.length!/2).toBeCloseTo(10);
   }else if(s.kind==='line'){expect(out.length).toBe(s.length/32);expect(out.width).toBe(s.width/32);}
   else if(s.kind==='cone'){expect(out.radius).toBe(s.range/32);expect(out.arc).toBe(s.arcRadians);}
  }
 });
 it('uses authoritative augmented receipt dimensions and rejects nonfinite geometry',()=>{
  const out:Telegraph={shape:'circle',x:0,z:0};
  const e:AbilityEvent={ability:'cryo-nova',rig:'cryo',slot:'tactical',element:'cryo',phase:'impact',radius:310};
  expect(bindAbilityShape(out,e,0,0)).toBe(true);expect(out.radius).toBe(310/32);
  expect(bindAbilityShape(out,{...e,radius:NaN},0,0)).toBe(false);
 });
 it('saturates pools, freezes on zero delta, and clears without replacing GPU inventory',()=>{
  const k=new ElementKit(new T.Scene());const geometry=k.batches.shard.mesh.geometry;
  for(let i=0;i<2000;i++){k.mote('shard',0,.4,0,1,2,3,.1,1,0x7fd6ff);k.ring(0,0,3,0x7fd6ff);k.beam(0,1,0,2,1,2,0xb79cff);}
  k.begin(.1);k.end();expect(k.counts.particles).toBe(ABILITY_VFX_LIMITS.particles);expect(k.counts.rings).toBe(ABILITY_VFX_LIMITS.rings);
  const before=k.batches.shard.mesh.instanceMatrix.array.slice();k.begin(0);k.end();expect(k.batches.shard.mesh.instanceMatrix.array).toEqual(before);
  expect(k.batches.shard.mesh.geometry).toBe(geometry);k.clear();expect(k.counts.particles).toBe(0);expect(k.batches.shard.mesh.count).toBe(0);k.dispose();k.dispose();
 });
 it('suppresses extra light, distortion and camera motion on Low/reduced motion',()=>{
  const k=new ElementKit(new T.Scene());const flash=vi.fn(),attach=vi.fn(),shockwave=vi.fn(),heat=vi.fn(),addTrauma=vi.fn(),punch=vi.fn(),kick=vi.fn();
  k.bind({lights:{flash,attach} as never,distortion:{shockwave,heat} as never,camera:{addTrauma,punch,kick}});
  k.setOptions(GRAPHICS_PRESETS.low,'low',true);k.flash(0,0,0xffffff);k.lightAt(1,0,0,0xffffff);k.distort(0,0,3);k.camera(.3,0);
  expect(flash).not.toHaveBeenCalled();expect(attach).not.toHaveBeenCalled();expect(shockwave).not.toHaveBeenCalled();expect(addTrauma).not.toHaveBeenCalled();
  k.setOptions(GRAPHICS_PRESETS.high,'high',false);k.flash(0,0,0xffffff);k.distort(0,0,3);k.camera(.3,0);expect(flash).toHaveBeenCalledOnce();expect(shockwave).toHaveBeenCalledOnce();expect(addTrauma).toHaveBeenCalledOnce();k.dispose();
 });
 it('places all dash arrival feedback at actual endpoint coordinates',()=>{
  const v=new AbilityVisuals(new T.Scene()),burst=vi.spyOn(v.kit,'burst');
  for(const [ability,rig,element] of [['ram','breacher','kinetic'],['frost-trail','cryo','cryo'],['afterburn','pyro','pyro'],['static-step','arc','arc']] as const){
   burst.mockClear();v.event({ability,rig,element,slot:'dash',phase:'dash-end',targetX:320,targetY:224},64,96);
   expect(burst.mock.calls.some(c=>c[0]===10&&c[2]===7)).toBe(true);
  }v.dispose();
 });
 it('clears world loops at death/menu and retains cheap pause-stable state',()=>{
  const v=new AbilityVisuals(new T.Scene());v.kit.mote('spark',0,0,0,1,1,1,.1,2,0xffb454);
  v.update(undefined,0);expect(v.kit.counts.particles).toBe(1);
  v.update(undefined,.05,true,{status:'dead'} as never);expect(v.root.visible).toBe(false);expect(v.kit.counts.particles).toBe(0);
  v.update(undefined,0,true);expect(v.root.visible).toBe(true);v.dispose();
 });
 it('keeps soft particles camera-facing for every aim direction',()=>{
  const k=new ElementKit(new T.Scene()),camera=new T.PerspectiveCamera();camera.position.set(0,8,10);k.setView(camera);k.begin(0);
  k.draw('flame',0,0,0,1,1,1,0xff7a2e,1,Math.PI/2);const m=new T.Matrix4();k.batches.flame.mesh.getMatrixAt(0,m);
  const q=new T.Quaternion(),p=new T.Vector3(),scale=new T.Vector3();m.decompose(p,q,scale);
  expect(new T.Vector3(0,0,1).applyQuaternion(q).z).toBeCloseTo(1);k.dispose();
 });
 it('retains all instance/material topologies for preparation, and disposes each resource once',()=>{
  const scene=new T.Scene(),v=new AbilityVisuals(scene),surface=new T.MeshStandardMaterial(),warm=new MaterialWarmup({floor:surface,wall:surface,cover:surface});
  expect(warm.register(v.root)).toBeGreaterThan(7);v.kit.burst(0,0,0,'cryo');v.kit.begin(.1);v.kit.end();expect(warm.register(v.root)).toBe(0);
  const resources=new Set<T.BufferGeometry|T.Material>();v.root.traverse(o=>{if(o instanceof T.Mesh){resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])resources.add(m);}});
  const spies=[...resources].map(r=>vi.spyOn(r,'dispose'));v.dispose();v.dispose();for(const spy of spies)expect(spy).toHaveBeenCalledOnce();expect(scene.children.length).toBe(0);warm.dispose();surface.dispose();
 });
});
