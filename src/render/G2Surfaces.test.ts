import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { ROOM_TEMPLATES } from '../game/roguelike/roomTemplates';
import { ROOM_STORY_ROUTE } from '../game/roguelike/storyRooms';
import { applyFloorVariation } from './lighting/FloorVariation';
import { addDeckMarkings, deckMarkingSupported } from './world/DeckMarkings';
import { disposeModel } from './meshParts';

describe('G2 physical deck identities', () => {
  it('switches all ten identities through uniform values without shader topology changes', () => {
    const material = new T.MeshStandardMaterial();material.name='environment-floor';
    applyFloorVariation(material,'cryogenics');const key=material.customProgramCacheKey(),hook=material.onBeforeCompile;
    const shader={uniforms:{} as Record<string,{value:unknown}>,vertexShader:'#include <common>\n#include <worldpos_vertex>',fragmentShader:'#include <common>\n#include <color_fragment>\n#include <roughnessmap_fragment>'};
    hook(shader as Parameters<T.Material['onBeforeCompile']>[0],{} as T.WebGLRenderer);
    const styles=new Set<number>();
    for(const room of ROOM_STORY_ROUTE){
      applyFloorVariation(material,room.environment);
      styles.add((shader.uniforms.roomFloorPattern.value as T.Vector4).z);
      expect(material.onBeforeCompile).toBe(hook);expect(material.customProgramCacheKey()).toBe(key);
      expect((shader.uniforms.roomFloorPattern.value as T.Vector4).toArray().every(Number.isFinite)).toBe(true);
    }
    expect(styles.size).toBe(10);expect(shader.fragmentShader).toContain('deckJoint');expect(shader.fragmentShader).toContain('fwidth(d)');
    material.dispose();
  });
  it('chains existing shader hooks and retains authored base charts',()=>{
    const material=new T.MeshStandardMaterial();material.name='painted-steel-deck';
    material.onBeforeCompile=shader=>{shader.uniforms.original={value:1};};material.customProgramCacheKey=()=> 'original';
    applyFloorVariation(material,'reactor');const shader={uniforms:{} as Record<string,{value:unknown}>,vertexShader:'#include <common>\n#include <worldpos_vertex>',fragmentShader:'#include <common>\n#include <color_fragment>\n#include <roughnessmap_fragment>'};
    material.onBeforeCompile(shader as Parameters<T.Material['onBeforeCompile']>[0],{} as T.WebGLRenderer);
    expect(shader.uniforms.original.value).toBe(1);expect(material.customProgramCacheKey()).toContain('original:');
    expect(shader.fragmentShader).not.toContain('diffuseColor.rgb*roomFloorAlbedoGain');material.dispose();
  });
});

describe('G2 supported deck stencils and wall relief',()=>{
  for(const room of ROOM_STORY_ROUTE)it(`${room.templateId} remains deterministic, bounded and on the actual deck`,()=>{
    const world=new T.Group(),t=ROOM_TEMPLATES[room.templateId];
    const first=addDeckMarkings(world,t,room.environment,room.templateId),second=addDeckMarkings(world,t,room.environment,room.templateId);
    const paint=first.getObjectByName('supported-deck-stencils') as T.Mesh;
    const duplicate=second.getObjectByName('supported-deck-stencils') as T.Mesh;
    expect(paint).toBeDefined();expect(first.children.length).toBeLessThanOrEqual(2);
    const positions=paint.geometry.getAttribute('position');
    expect([...positions.array]).toEqual([...duplicate.geometry.getAttribute('position').array]);
    expect(positions.count).toBeLessThanOrEqual(30006);
    for(let i=0;i<positions.count;i++){
      expect(positions.getY(i)).toBeCloseTo(.016,5);
      expect(deckMarkingSupported(t,positions.getX(i),positions.getZ(i))).toBe(true);
    }
    const retired=new Set<T.Material|T.BufferGeometry>();first.traverse(o=>{if(o instanceof T.Mesh){for(const resource of [o.geometry,...(Array.isArray(o.material)?o.material:[o.material])])resource.addEventListener('dispose',()=>retired.add(resource));}});
    disposeModel(first);expect(first.parent).toBeNull();expect(retired.size).toBe(first.children.length*2);disposeModel(second);
  });
  it('does not paint voids, occupied footprints or beyond the hull',()=>{
    const template={...ROOM_TEMPLATES.armory,width:320,height:320,boundary:[{x:0,y:0},{x:320,y:0},{x:320,y:320},{x:0,y:320}],obstacles:[{x:64,y:64,width:32,height:32}],voids:[[{x:128,y:128},{x:192,y:128},{x:192,y:192},{x:128,y:192}]]};
    expect(deckMarkingSupported(template,-1,2)).toBe(false);expect(deckMarkingSupported(template,2.5,2.5)).toBe(false);expect(deckMarkingSupported(template,5,5)).toBe(false);expect(deckMarkingSupported(template,7,7)).toBe(true);
  });
});
