import {beforeAll,expect,it,vi} from 'vitest';
import * as T from 'three';
import {loadModels} from '../../tests/loadModels';
import {alien,marine,disposeModel,freezeCorpse} from './models';
import {familyAnatomy} from './FamilyAnatomy';

beforeAll(loadModels);

it('builds three readable masses and actual bone-bound contact segments for every family',()=>{
  for(const kind of ['crawler','brute','spitter','stalker','carrier']){
    const model=alien(kind),mesh=model.root.getObjectByName(`${kind}-identity`) as T.SkinnedMesh<T.BufferGeometry,T.ShaderMaterial>;
    try{
      const parts=familyAnatomy(kind,1,1);
      expect(parts.some(p=>p.role===2)).toBe(true);
      expect(parts.filter(p=>p.role===4||p.role===11).length).toBeGreaterThanOrEqual(3);
      expect(parts.some(p=>p.role===12&&p.position[2]>.2)).toBe(true);
      expect(parts.filter(p=>p.end&&p.scale[0]>=.04).length).toBeGreaterThanOrEqual(6);
      expect(mesh).toBeInstanceOf(T.SkinnedMesh);
      expect(mesh.skeleton.bones.length).toBeGreaterThan(4);
      expect(mesh.skeleton.bones.every(b=>b instanceof T.Bone)).toBe(true);
      expect(mesh.geometry.getAttribute('skinIndex').count).toBe(mesh.geometry.getAttribute('position').count);
      expect(mesh.geometry.getAttribute('position').count/3).toBeLessThan(3000);
      const indices=mesh.geometry.getAttribute('skinIndex'),weights=mesh.geometry.getAttribute('skinWeight');
      for(let i=0;i<indices.count;i++){
        expect(indices.getX(i)).toBeLessThan(mesh.skeleton.bones.length);
        expect(weights.getX(i)).toBe(1);
      }
      const sourceSkeletons=new Set<T.Skeleton>();model.root.traverse(o=>{if(o instanceof T.SkinnedMesh&&o!==mesh)sourceSkeletons.add(o.skeleton);});
      for(const bone of mesh.skeleton.bones)expect([...sourceSkeletons].some(s=>s.bones.includes(bone))).toBe(true);
      expect(mesh.material.vertexShader).toContain('#include <skinnormal_vertex>');
      expect(mesh.material.vertexShader).toContain('#include <skinning_vertex>');
    }finally{disposeModel(model.root);}
  }
});

it('retains anatomy buffers, joint ownership and status identity through hits, death and pool reuse',()=>{
  const model=alien('brute'),mesh=model.root.getObjectByName('brute-identity') as T.SkinnedMesh<T.BufferGeometry,T.ShaderMaterial>;
  const geometry=mesh.geometry,material=mesh.material,skeleton=mesh.skeleton,key=material.customProgramCacheKey(),bone=skeleton.bones[1],dispose=vi.spyOn(skeleton,'dispose');
  try{
    model.animate(0,0,0);const rest=bone.quaternion.clone();
    for(let i=1;i<30;i++)model.animate(i/60,1,.5);
    expect(bone.quaternion.angleTo(rest)).toBeGreaterThan(.001);
    for(const status of [{chilled:true,frozen:true,burning:false},{chilled:false,burning:true},{chilled:false,burning:false,poisoned:true}]){
      model.setAffliction!(status);model.hit!(1);model.animate(1,0,0);
      expect(material.uniforms.identityStatus.value).toBeGreaterThan(0);
      freezeCorpse(model);expect(material.uniforms.identityDeath.value).toBe(1);
      model.reset!();expect(material.uniforms.identityStatus.value).toBe(0);
      expect(mesh.geometry).toBe(geometry);expect(mesh.material).toBe(material);expect(mesh.skeleton).toBe(skeleton);expect(material.customProgramCacheKey()).toBe(key);
    }
  }finally{disposeModel(model.root);expect(dispose).toHaveBeenCalledOnce();}
});

it('switches four resident marine module silhouettes with the existing rig setter and unchanged height',()=>{
  const model=marine(),mesh=model.root.getObjectByName('marine-rig-accents') as T.Mesh<T.BufferGeometry,T.ShaderMaterial>;
  try{
    const geometry=mesh.geometry,material=mesh.material,key=material.customProgramCacheKey(),roles=geometry.getAttribute('identityRole'),p=geometry.getAttribute('position');
    const signatures=new Set<string>();
    for(const [n,rig] of ['breacher','cryo','pyro','arc'].entries()){
      model.setRig!(rig);expect(material.uniforms.rigKind.value).toBe(13+n);
      const bounds=new T.Box3(),point=new T.Vector3();
      for(let i=0;i<p.count;i++)if(roles.getX(i)===13+n)bounds.expandByPoint(point.fromBufferAttribute(p,i));
      expect(bounds.min.y).toBeGreaterThan(.8);expect(bounds.max.y).toBeLessThan(2.05);
      expect(Math.max(Math.abs(bounds.min.x),Math.abs(bounds.max.x))).toBeLessThan(.51);
      signatures.add(bounds.min.toArray().join('/')+'/'+bounds.max.toArray().join('/'));
      expect(model.height).toBeCloseTo(2.05);expect(mesh.geometry).toBe(geometry);expect(mesh.material).toBe(material);expect(material.customProgramCacheKey()).toBe(key);
    }
    expect(signatures.size).toBe(4);
    expect(material.fragmentShader).toContain('abs(role-rigKind)>.25');
  }finally{disposeModel(model.root);}
});
