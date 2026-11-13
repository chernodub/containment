import {beforeAll,expect,it} from 'vitest';
import * as T from 'three';
import {loadModels} from '../../tests/loadModels';
import {alien,marine,freezeCorpse,disposeModel} from './models';
import {registerGeometry,GEOMETRY_CLASSES} from './post/GeometryBuffer';
import {styleTitleActor} from './world/TitlePresentation';

beforeAll(loadModels);
function materialFor(root:T.Object3D){let result:T.MeshStandardMaterial|undefined;root.traverse(o=>{if(o instanceof T.SkinnedMesh&&!result)result=o.material as T.MeshStandardMaterial;});return result!;}
function compile(material:T.MeshStandardMaterial){const shader={vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader,uniforms:{} as Record<string,{value:unknown}>};material.onBeforeCompile(shader as never,{} as never);return shader;}

it('applies flat frost/death treatments after region color and resets the same uniforms on pooled reuse',()=>{
 for(const family of ['crawler','brute','spitter','stalker','carrier']){
  const model=alien(family);registerGeometry(model.root,GEOMETRY_CLASSES.enemy);
  try{
   const material=materialFor(model.root),shader=compile(material),key=material.customProgramCacheKey();
   const palette=shader.fragmentShader.indexOf('diffuseColor.rgb=graphicActorBase*regionValue');
   const glaze=shader.fragmentShader.indexOf('float frostAmount=');
   const death=shader.fragmentShader.indexOf('if(actorDeathStyle>.5');
   expect(palette).toBeGreaterThan(0);expect(glaze).toBeGreaterThan(palette);expect(death).toBeGreaterThan(glaze);
   expect(shader.fragmentShader).not.toContain('frostPatch');expect(shader.fragmentShader).not.toContain('sp*6.0');
   for(const [status,finish] of [[{chilled:true,frozen:true,burning:false},1],[{chilled:false,burning:true},2],[{chilled:false,burning:false,poisoned:true},3]] as const){
    model.reset!();model.setAffliction!(status);freezeCorpse(model);
    expect(shader.uniforms.actorDeathStyle.value).toBe(finish);expect(material.customProgramCacheKey()).toBe(key);
    model.reset!();expect(shader.uniforms.actorDeathStyle.value).toBe(0);expect(shader.uniforms.statusFrost.value).toBe(0);
   }
  }finally{disposeModel(model.root);}
 }
});
it('keeps title creature color authored by the same head/limb/torso region partition',()=>{
 const model=alien('brute');styleTitleActor(model.root,false);registerGeometry(model.root,GEOMETRY_CLASSES.enemy);
 try{const shader=compile(materialFor(model.root));expect(shader.fragmentShader).toContain('float titleRegion=floor(vActorRegion+.5)');expect(shader.fragmentShader).toContain('outgoingLight=titleBodyColor*titleTone*titleLight');expect(shader.fragmentShader).not.toContain('abs(titleNormal.x)');}finally{disposeModel(model.root);}
});
it('retains cyan-white marine material signature independently of rig and physical lamps',()=>{
 const model=marine();registerGeometry(model.root,GEOMETRY_CLASSES.marine);
 try{const shader=compile(materialFor(model.root));expect(shader.fragmentShader).toContain('vec3(.42,.76,.86)');expect(shader.fragmentShader).toContain('totalEmissiveRadiance+=vec3(.025,.07,.09)');const key=materialFor(model.root).customProgramCacheKey();for(const rig of ['breacher','cryo','pyro','arc']){model.setRig!(rig);expect(materialFor(model.root).customProgramCacheKey()).toBe(key);}}finally{disposeModel(model.root);}
});
it('reports elevated family/rank anatomy to health bars and priority without inflating its rig',()=>{
 for(const [family,elite,multiplier]of [['crawler',false,1],['spitter',false,1.55],['brute',true,1.28],['queen',false,1.4]] as const){
  const model=alien(family,elite),identity=model.root.getObjectByName(`${family}-identity`) as T.Mesh<T.BufferGeometry,T.ShaderMaterial>;
  try{const rigHeight=identity.material.uniforms.identityHeight.value as number;expect(model.height).toBeCloseTo(rigHeight*multiplier);if(family!=='queen'){model.setThreat!(0,null,'warden');expect(model.height).toBeCloseTo(rigHeight*1.72);model.reset!();expect(model.height).toBeCloseTo(rigHeight*multiplier);}}finally{disposeModel(model.root);}
 }
});
