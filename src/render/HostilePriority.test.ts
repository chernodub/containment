import { expect, it, vi } from 'vitest';
import * as T from 'three';
import type { Bullet } from '../DepthGame';
import { AttackEffects,PRIORITY_ACTOR_LIMIT } from './AttackEffects';
import { TelegraphBatch } from './vfx/TelegraphBatch';
import { AcidPoolMaterial } from './acidPool';

it('uses normal-blended dark-backed timing fills above friendly effects in a single warning draw', () => {
  const scene = new T.Scene(), fx = new AttackEffects(scene), camera = new T.Camera();
  try {
    fx.event({type:'enemy-warning', x:64, y:96, radius:96, durationMs:1000});
    fx.update(.1, camera, []);
    const mesh = scene.children.find(o => o instanceof T.InstancedMesh && (o.material as T.ShaderMaterial).uniforms.style?.value === 6) as T.InstancedMesh;
    const mat = mesh.material as T.ShaderMaterial;
    expect(mat.blending).toBe(T.NormalBlending); expect(mat.depthTest).toBe(false);
    expect(mesh.renderOrder).toBeGreaterThan(20); expect(mesh.count).toBe(1);
    expect(mat.fragmentShader).toContain('float hatch='); expect(mat.fragmentShader).toContain('vec3(.012,.008,.010)');
    expect(mat.fragmentShader).toContain('smoothstep(.95,.975,d)');expect(mat.fragmentShader).toContain('.92+edge*.08');
    expect(mesh.geometry.getAttribute('effectFrame').getX(0)).toBeCloseTo(1.1);
    // Friendly effects keep their original ring geometry, additive blending and
    // floor depth test rather than entering the incoming-danger overlay.
    const friendly=scene.children.find(o=>o instanceof T.InstancedMesh&&o.geometry instanceof T.RingGeometry&&(o.geometry as T.RingGeometry).parameters.innerRadius===.955) as T.InstancedMesh;
    expect(friendly.renderOrder).toBe(20);expect((friendly.material as T.Material).depthTest).toBe(true);expect((friendly.material as T.Material).blending).toBe(T.AdditiveBlending);
    fx.event({type:'explosion',x:64,y:96,radius:96});fx.update(.01,camera,[]);
    expect(friendly.count).toBeGreaterThan(0);expect(mesh.count).toBe(1);
    fx.setBossWarning(2, 3, 4, .75); fx.update(.1, camera, []);
    expect(mesh.count).toBe(2);
  } finally { fx.dispose(); }
});

it('moves only hostile batches to the prepared priority scene and retires both scene owners exactly once',()=>{
  const world=new T.Scene(),priority=new T.Scene(),fx=new AttackEffects(world);
  const warning=world.getObjectByName('hostile-warning-fills') as T.InstancedMesh,projectile=world.getObjectByName('hostile-projectiles') as T.InstancedMesh;
  const inventory=[...world.children],warningGeometry=vi.spyOn(warning.geometry,'dispose'),projectileGeometry=vi.spyOn(projectile.geometry,'dispose');
  fx.setPriorityScene(priority);
  expect(priority.children).toEqual([warning,projectile]);
  expect(world.children).toEqual(inventory.filter(o=>o!==warning&&o!==projectile));
  expect(world.children.some(o=>o instanceof T.InstancedMesh&&(o.material as T.ShaderMaterial).uniforms.style?.value===2)).toBe(true);
  fx.setPriorityScene(priority);expect(priority.children).toHaveLength(2);
  fx.dispose();fx.dispose();expect(priority.children).toHaveLength(0);expect(world.children).toHaveLength(0);
  expect(warningGeometry).toHaveBeenCalledOnce();expect(projectileGeometry).toHaveBeenCalledOnce();
});

it('cuts only projected torsos from warnings while preserving the exact ground radius and projectile priority',()=>{
  const scene=new T.Scene(),fx=new AttackEffects(scene),camera=new T.OrthographicCamera(-10,10,6,-6,.1,100);
  camera.position.set(0,26,19);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
  const warning=scene.getObjectByName('hostile-warning-fills') as T.InstancedMesh,projectiles=scene.getObjectByName('hostile-projectiles') as T.InstancedMesh;
  const uniforms=(warning.material as T.ShaderMaterial).uniforms,inventory=[...scene.children];
  try{
    fx.setPriorityViewport(1920,1080);fx.beginPriorityActors(camera);fx.addPriorityActor(0,0,.5,2.05);
    const ellipses=uniforms.priorityActors.value as T.Vector4[],ellipse=ellipses[0],entries=[...ellipses];
    const projected=new T.Vector3(0,2.05*.58,0).project(camera);
    expect(ellipses).toHaveLength(PRIORITY_ACTOR_LIMIT);expect(uniforms.priorityActorCount.value).toBe(1);
    expect(ellipse.x).toBeCloseTo(projected.x);expect(ellipse.y).toBeCloseTo(projected.y);
    expect(ellipse.z).toBeGreaterThan(0);expect(ellipse.w).toBeGreaterThan(0);
    // Actual framebuffer fragment coordinates reconstruct the same torso center.
    const fragmentX=(ellipse.x+1)*1920/2,fragmentY=(ellipse.y+1)*1080/2;
    expect((fragmentX/1920*2-1-ellipse.x)/ellipse.z).toBeCloseTo(0);
    expect((fragmentY/1080*2-1-ellipse.y)/ellipse.w).toBeCloseTo(0);
    fx.event({type:'enemy-warning',x:0,y:0,radius:96,durationMs:1000});fx.update(.1,camera,[]);
    const matrix=new T.Matrix4();warning.getMatrixAt(0,matrix);expect(new T.Vector3().setFromMatrixScale(matrix).x).toBe(3);
    const shader=(warning.material as T.ShaderMaterial).fragmentShader;
    const maskPosition=shader.indexOf('vec2 screen=gl_FragCoord.xy');
    expect(maskPosition).toBeGreaterThan(shader.indexOf('else if(style>5.5)'));
    expect(maskPosition).toBeGreaterThan(shader.indexOf('if(style>6.5)'));
    expect(shader.slice(shader.indexOf('if(style>6.5)'),shader.indexOf('else if(style>5.5)'))).not.toContain('priorityActorCount');
    expect((projectiles.material as T.ShaderMaterial).uniforms.priorityActors).toBeUndefined();
    fx.beginPriorityActors(camera);expect(uniforms.priorityActorCount.value).toBe(0);
    for(let i=0;i<1000;i++)fx.addPriorityActor(0,0,.5,2.05);
    expect(uniforms.priorityActorCount.value).toBe(PRIORITY_ACTOR_LIMIT);
    expect(uniforms.priorityActors.value).toBe(ellipses);expect(ellipses.every((entry,i)=>entry===entries[i])).toBe(true);
    expect(scene.children).toEqual(inventory);fx.clear();expect(uniforms.priorityActorCount.value).toBe(0);
  }finally{fx.dispose();}
});

it('preallocates a single hostile projectile batch with a dark core and ground shadow', () => {
  const scene = new T.Scene(), fx = new AttackEffects(scene), camera = new T.Camera();
  const inventory = [...scene.children];
  const bullet = {x:64,y:96,life:2,kind:'hazard',request:{weaponId:'plasma',angle:0,speed:260}} as Bullet;
  try {
    fx.update(.016, camera, [bullet]);
    const mesh = scene.getObjectByName('hostile-projectiles') as T.InstancedMesh;
    expect(mesh.count).toBe(2); expect(scene.children).toEqual(inventory);
    expect((mesh.material as T.Material).depthTest).toBe(false);
    expect((mesh.material as T.ShaderMaterial).fragmentShader).toContain('vec3(.055,.008,.006)');
    expect(mesh.geometry.getAttribute('effectFrame').getX(1)).toBe(-1);
    const geometry = vi.spyOn(mesh.geometry, 'dispose');
    fx.clear(); expect(mesh.count).toBe(0); fx.dispose(); expect(geometry).toHaveBeenCalledOnce();
  } finally { fx.dispose(); }
});

it('never evicts an active warning to make room for friendly impact rings',()=>{
  const scene=new T.Scene(),fx=new AttackEffects(scene),camera=new T.Camera();
  try{
    fx.event({type:'enemy-warning',x:0,y:0,radius:64,durationMs:1000});
    for(let i=0;i<100;i++)fx.event({type:'explosion',x:0,y:0,radius:96});
    fx.update(.05,camera,[]);
    expect((scene.getObjectByName('hostile-warning-fills') as T.InstancedMesh).count).toBe(1);
    expect(fx.counts.pulses).toBeLessThanOrEqual(24);
  }finally{fx.dispose();}
});

it('keeps reusable warnings backed and gives acid a dark perimeter through one shader family', () => {
  const batch = new TelegraphBatch(new T.Scene()), acid = new AcidPoolMaterial(1);
  const shader = {uniforms:{},vertexShader:T.ShaderLib.basic.vertexShader,fragmentShader:T.ShaderLib.basic.fragmentShader};
  try {
    expect((batch.mesh.material as T.Material).depthTest).toBe(false);
    expect(batch.mesh.renderOrder).toBeGreaterThan(18);
    acid.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms, {} as T.WebGLRenderer);
    expect(shader.fragmentShader).toContain('float acidRim=');
    expect(shader.fragmentShader).toContain('acidRim*min(1.0,diffuseColor.a*3.2)');
  } finally { batch.dispose(); acid.dispose(); }
});

it('exposes the rendered enemy and Queen footprints to sustained friendly yield',()=>{
 const fx=new AttackEffects(new T.Scene()),camera=new T.Camera();
 const shapes:Array<{shape:string;x:number;z:number;radius?:number}>=[];
 const read=()=>{shapes.length=0;fx.forEachHostilePriority(shape=>shapes.push({...shape}));};
 try{
  fx.event({type:'enemy-warning',x:64,y:96,radius:96,durationMs:1000});
  fx.setBossWarning(5,7,4,.5);fx.update(.1,camera,[]);read();
  expect(shapes).toEqual([{shape:'circle',x:2,z:3,radius:3},{shape:'circle',x:5,z:7,radius:4}]);
  fx.setBossWarning(5,7,4,1,false);fx.update(1,camera,[]);read();expect(shapes).toEqual([]);
  fx.setBossWarning(5,7,4,.5);fx.clear();read();expect(shapes).toEqual([]);
 }finally{fx.dispose();}
});
