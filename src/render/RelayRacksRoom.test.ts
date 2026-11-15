import {afterEach,describe,expect,it} from 'vitest';
import * as T from 'three';
import {shipArchitectureRoom} from './world/ShipArchitectureRoom';
import {authoredRoom} from './AuthoredRooms';
import {disposeModel} from './models';
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import {generateRun} from '../game/roguelike/run';
import {canOccupyExpedition,canTraverseExpedition,createExpeditionGeometry,hasClearExpeditionShot} from '../game/world/expeditionGeometry';
import {FacilityNavigation} from '../game/world/FacilityNavigation';
const template=ROOM_TEMPLATES['relay-racks'];
const node=generateRun(1729,3).nodes.find(n=>n.templateId==='relay-racks')!;
const geometry=createExpeditionGeometry(node);
const expected=[[300,160,100,240],[300,550,100,190],[800,160,100,240],[800,550,100,190],[550,360,100,150]];
const owned:T.Group[]=[];
const make=()=>{const g=authoredRoom('relay-racks',template);expect(g).not.toBeNull();owned.push(g!);g!.updateMatrixWorld(true);return g!;};
afterEach(()=>{for(const g of owned)disposeModel(g);owned.length=0;});
describe('Room9 source manufacture and live architectural placement',()=>{
 it('uses dark rack rails, pale ceramic and restrained non-animated link indicators',()=>{
  const g=make(),materials=new Map<string,T.MeshStandardMaterial>();
  g.traverse(o=>{if(o instanceof T.Mesh&&o.material instanceof T.MeshStandardMaterial)materials.set(o.material.name,o.material);});
  const rail=materials.get('relay-rail-metal')!,ceramic=materials.get('relay-ceramic')!,fiber=materials.get('relay-fiber')!;
  expect(rail.color.getHSL({h:0,s:0,l:0}).l).toBeLessThan(.18);
  expect(rail.metalness).toBeGreaterThanOrEqual(.65);
  expect(ceramic.metalness).toBeLessThan(.2);
  expect(ceramic.color.getHSL({h:0,s:0,l:0}).l).toBeGreaterThan(.4);
  expect(fiber.emissiveIntensity).toBeLessThanOrEqual(.3);
 });
 it('adds perimeter service panels and flush deck seams without occupying the aisle',()=>{
  const g=make(),panels=g.getObjectByName('relay-shell-panels'),seams=g.getObjectByName('relay-deck-seams');
  expect(panels).toBeDefined();expect(seams).toBeDefined();
  panels!.traverse(o=>{if(o instanceof T.Mesh){const p=o.geometry.getAttribute('position');for(let i=0;i<p.count;i++){
   const x=p.getX(i)*32,z=p.getZ(i)*32;expect(x<=0||x>=1200||z<=0||z>=880).toBe(true);
  }}});
  expect(new T.Box3().setFromObject(seams!).max.y*32).toBeLessThanOrEqual(.1);
 });
 it('gives each rack a low cooling plenum inside its existing footprint',()=>{
  const g=make();for(let i=0;i<4;i++){
   const rack=g.getObjectByName(`relay-fixture-${i}`)!,plenum=rack.getObjectByName(`relay-cooling-plenum-${i}`);
   expect(plenum).toBeDefined();const b=new T.Box3().setFromObject(plenum!);
   expect(b.max.y*32).toBeLessThanOrEqual(25);
   expect(b.min.x*32).toBeGreaterThanOrEqual(expected[i][0]);expect(b.max.x*32).toBeLessThanOrEqual(expected[i][0]+expected[i][2]);
   expect(b.min.z*32).toBeGreaterThanOrEqual(expected[i][1]);expect(b.max.z*32).toBeLessThanOrEqual(expected[i][1]+expected[i][3]);
  }
 });
 it('uses hull-attached cooling vaults, a service spine and a console bay in the live plan',()=>{
  expect(template.obstacles.map(r=>[r.x,r.y,r.width,r.height])).toEqual([[40,0,160,340],[40,660,160,340],[1080,0,160,340],[1080,660,160,340],[590,300,100,400],[400,960,480,40]]);
  expect([template.width,template.height]).toEqual([1280,1000]);
  expect(template.spawn).toEqual({x:300,y:500});expect(template.exit).toEqual({x:1180,y:500});
  expect(template.breaches).toEqual([{x:300,y:220},{x:980,y:220},{x:300,y:780},{x:980,y:780}]);
 });
 it.each([16,28,38])('keeps both rack aisles and north/south cross-links clear at radius %i',radius=>{
  const routes=[[[300,500],[395,500],[395,160],[885,160],[885,500],[1180,500]],[[300,500],[395,500],[395,840],[885,840],[885,500],[1180,500]],[[300,220],[980,220]],[[300,780],[980,780]],...template.breaches.map(p=>[[p.x+(p.x<640?56:-56),p.y],[p.x<640?356:924,p.y],[p.x<640?356:924,500]])];
  for(const route of routes)for(let i=1;i<route.length;i++){
   const a={x:route[i-1][0],y:route[i-1][1]},b={x:route[i][0],y:route[i][1]};
   expect(canTraverseExpedition(geometry,a,b,radius)).toBe(true);expect(hasClearExpeditionShot(geometry,a,b)).toBe(true);
  }
  expect(canOccupyExpedition(geometry,{x:640,y:500},radius)).toBe(false);
  expect(hasClearExpeditionShot(geometry,{x:395,y:500},{x:885,y:500})).toBe(false);
 });
 it('connects all breach approaches and both aisles through shipping FacilityNavigation',()=>{
  const nav=new FacilityNavigation(geometry);nav.prepare(template.exit,0);
  for(const p of [...template.breaches,template.spawn,{x:640,y:160},{x:640,y:840}])expect(nav.reachable(p)).toBe(true);
  const from={x:395,y:500,radius:28},target={x:885,y:500},next=nav.waypoint(from,target,0);expect(next).not.toBeNull();
  expect(Math.hypot(next!.x-from.x,next!.y-from.y)).toBeGreaterThan(1);expect(canTraverseExpedition(geometry,from,next!,from.radius)).toBe(true);
 });
 it('fits complete cutaway assemblies to all six live solids and retires phantom source-shell fixtures',()=>{
  const g=shipArchitectureRoom('relay-racks',template)!;owned.push(g);g.updateMatrixWorld(true);
  for(const [i,r]of template.obstacles.entries()){
   const rack=g.getObjectByName(`relay-fixture-${i}`)!;expect(rack).toBeDefined();const b=new T.Box3().setFromObject(rack,true);
   expect(b.min.x*32).toBeCloseTo(r.x,3);expect(b.max.x*32).toBeCloseTo(r.x+r.width,3);expect(b.min.z*32).toBeCloseTo(r.y,3);expect(b.max.z*32).toBeCloseTo(r.y+r.height,3);
   expect(b.min.y).toBeCloseTo(0,4);expect(b.max.y).toBeLessThanOrEqual(1.02);expect(b.max.y).toBeGreaterThan(.2);
  }
  const source=g.getObjectByName('authored-relay-racks')!;expect(source.userData.lightFixtures).toEqual([]);
  expect(source.getObjectByName('relay-neutral-shell')!.children).toHaveLength(0);
 });
 it('places grounded rough assemblies inside their exact collision footprints',()=>{
  const g=make();
  for(const [i,r]of expected.entries()){
   const model=g.getObjectByName(`relay-fixture-${i}`);expect(model).toBeDefined();
   const b=new T.Box3().setFromObject(model!);
   expect(b.min.x*32).toBeCloseTo(r[0],3);expect(b.max.x*32).toBeCloseTo(r[0]+r[2],3);
   expect(b.min.z*32).toBeCloseTo(r[1],3);expect(b.max.z*32).toBeCloseTo(r[1]+r[3],3);
   expect(b.min.y).toBeCloseTo(0,4);expect(b.max.y*32).toBeGreaterThan(45);expect(b.max.y*32).toBeLessThanOrEqual(86);
  }
  const channels=g.getObjectByName('relay-flush-channels')!;expect(channels).toBeDefined();
  expect(new T.Box3().setFromObject(channels).max.y*32).toBeLessThanOrEqual(.4);
 });
 it('has open rails, patch loops and a lower damaged bank without success animation',()=>{
  const g=make(),intact=g.getObjectByName('relay-fixture-0')!,damaged=g.getObjectByName('relay-fixture-1')!;
  expect(new T.Box3().setFromObject(damaged).max.y).toBeLessThan(new T.Box3().setFromObject(intact).max.y);
  for(const name of ['relay-open-rails','relay-fiber-loops','relay-bridge-coupler','relay-distribution-drum'])expect(g.getObjectByName(name)).toBeDefined();
  expect(g.animations).toEqual([]);
 });
 it('builds a flanged drum with separated fork feeds and an open manual coupler',()=>{
  const g=make(),drum=g.getObjectByName('relay-drum-flanges'),fork=g.getObjectByName('relay-fork-guides');
  expect(drum).toBeDefined();expect(fork).toBeDefined();
  const flanges=new T.Box3().setFromObject(drum!);expect((flanges.max.x-flanges.min.x)*32).toBeGreaterThanOrEqual(80);
  const feeds=new T.Box3().setFromObject(fork!);expect((feeds.max.x-feeds.min.x)*32).toBeGreaterThan(50);
  const left=g.getObjectByName('relay-coupler-left'),right=g.getObjectByName('relay-coupler-right'),lever=g.getObjectByName('relay-manual-lever');
  expect(left).toBeDefined();expect(right).toBeDefined();expect(lever).toBeDefined();
  const lb=new T.Box3().setFromObject(left!),rb=new T.Box3().setFromObject(right!),handle=new T.Box3().setFromObject(lever!);
  expect((rb.min.x-lb.max.x)*32).toBeGreaterThanOrEqual(14);
  expect(handle.min.x*32).toBeGreaterThan(617);
  expect(handle.max.y*32).toBeGreaterThan(55);
  expect(g.animations).toEqual([]);
 });
 it('owns finite bounded geometry and releases its resources once',()=>{
  const g=make(),geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();let vertices=0;
  g.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);const p=o.geometry.getAttribute('position');vertices+=p.count;for(const n of p.array)expect(Number.isFinite(n)).toBe(true);}});
  expect(vertices).toBeLessThan(50000);expect(materials.size).toBeLessThanOrEqual(8);
  let disposed=0;for(const x of [...geometries,...materials])x.addEventListener('dispose',()=>disposed++);
  disposeModel(g);owned.pop();expect(disposed).toBe(geometries.size+materials.size);
 });
});
