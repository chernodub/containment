import {beforeAll, expect, it} from 'vitest';
import * as T from 'three';
import {loadModels} from '../../tests/loadModels';
import {alien, marine, disposeModel} from './models';
import {registerGeometry,GEOMETRY_CLASSES} from './post/GeometryBuffer';
import {inkDeclarations} from './post/Ink';

beforeAll(loadModels);
it('authors a bounded triangle-constant region partition shared across pool clones',()=>{
  for(const family of ['marine','brute','spitter','stalker','carrier','crawler']){
    const a=family==='marine'?marine():alien(family),b=family==='marine'?marine():alien(family);
    try{
      const regions=new Set<number>(),geometries:T.BufferGeometry[]=[];let constant=true;
      a.root.traverse(o=>{if(o instanceof T.SkinnedMesh){
        const g=o.geometry,region=g.getAttribute('actorRegion');expect(region).toBeDefined();
        geometries.push(g);const index=g.index;
        for(let t=0;t<(index?.count??region.count);t+=3){
          const ids=[0,1,2].map(v=>region.getX(index?index.getX(t+v):t+v));
          constant&&=ids[0]===ids[1]&&ids[1]===ids[2];regions.add(ids[0]);
        }
      }});
      expect(constant,family).toBe(true);
      expect(regions.size,family).toBeGreaterThanOrEqual(3);
      expect([...regions].every(id=>id>=1&&id<=8)).toBe(true);
      b.root.traverse(o=>{if(o instanceof T.SkinnedMesh)expect(geometries).toContain(o.geometry);});
    }finally{disposeModel(a.root);disposeModel(b.root);}
  }
});
it('writes region alongside owner ID without new draws, normal channels or program variants',()=>{
  const a=alien('brute'),b=alien('spitter');const scene=new T.Scene();scene.add(a.root,b.root);
  try{
    registerGeometry(a.root,GEOMETRY_CLASSES.enemy);registerGeometry(b.root,GEOMETRY_CLASSES.enemy);
    const materials:T.MeshStandardMaterial[]=[];
    a.root.traverse(o=>{if(o instanceof T.Mesh&&o.material instanceof T.MeshStandardMaterial)materials.push(o.material);});
    const m=materials[0],s={vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader,uniforms:{}};
    m.onBeforeCompile(s as never,{} as never);
    expect(s.fragmentShader).toContain('containmentOctNormal(containmentNormal)');
    expect(s.fragmentShader).toContain('8.0*floor(vActorRegion+.5)');
    expect(s.fragmentShader).toContain('diffuseColor.rgb=graphicActorBase*regionValue');
    expect(s.fragmentShader).toContain('normal=nonPerturbedNormal');
    const actorKernel=inkDeclarations.slice(inkDeclarations.indexOf('// Actor interior ink'),inkDeclarations.indexOf('} else if(inkMode>1.5'));
    expect(actorKernel).toContain('floor(neighbor.w/8.0)-centerRegion');
    expect(actorKernel).not.toContain('inkNormal');expect(actorKernel).not.toContain('tDepth');
  }finally{disposeModel(a.root);disposeModel(b.root);}
});
