import { describe, expect, it } from 'vitest';
import { BoxGeometry, Color, Group, Mesh, ShaderMaterial, Vector2 } from 'three';
import { setActorGeometryIdentity } from '../src/render/post/ActorGeometryMaterial';
import { registerGeometry } from '../src/render/post/GeometryBuffer';
import { alienIdentity, marineIdentity } from '../src/render/ActorIdentity';

function compile(material: ShaderMaterial) {
  const shader = { vertexShader: material.vertexShader, fragmentShader: material.fragmentShader,
    uniforms: { ...material.uniforms } };
  material.onBeforeCompile(shader as never, {} as never);
  return shader;
}
function exclude(material: ShaderMaterial) {
  const root = new Group(), geometry = new BoxGeometry();
  root.add(new Mesh(geometry, material)); registerGeometry(root); geometry.dispose();
}
function queen() {
  const root = new Group();
  const identity = alienIdentity(root, 'queen', 2, 3, false);
  return { root, identity, material: identity.mesh.material };
}

describe('physical actor ornaments in the shared geometry buffer', () => {
  it('preserves real Queen hinge deformation, rotated normals, role discards and original color', () => {
    const { material } = queen(); exclude(material);
    const originalVertex = material.vertexShader;
    expect(setActorGeometryIdentity(material, 41, 6)).toBe(true);
    const shader = compile(material);
    expect(shader.vertexShader).toBe(originalVertex);
    expect(shader.vertexShader).toContain('plateNormal.xy=mat2');
    expect(shader.vertexShader).toContain('identityNormal=normalMatrix*plateNormal');
    expect(shader.fragmentShader).toContain('actorGeometryOctNormal(identityNormal)');
    expect(shader.fragmentShader).toContain('if(role>5.5&&role<6.5&&identityChampion<.5)discard;');
    expect(shader.fragmentShader).toContain('if(identityDeath>=1.0)discard;');
    expect(shader.fragmentShader).toContain('if(identityOpening<.08)discard;');
    expect(shader.fragmentShader).toContain('gl_FragColor=vec4(color*light*identityStageLight,1.0);');
    expect(shader.fragmentShader).not.toContain('containmentGeometry=vec4(0.0,0.0,0.0,1.0)');
    expect(shader.fragmentShader.match(/out highp vec4 containmentGeometry/g)).toHaveLength(1);
    expect((shader.uniforms.containmentActorGeometryIdentity.value as Vector2).toArray()).toEqual([41, 6]);
    material.dispose();
  });

  it('keeps owner IDs separate and program keys equal, including copied preparation hooks', () => {
    const a = queen().material, b = queen().material; exclude(a); exclude(b);
    setActorGeometryIdentity(a, 50, 4); setActorGeometryIdentity(b, 51, 5);
    expect(a.customProgramCacheKey()).toBe(b.customProgramCacheKey());
    const compiledA = compile(a), compiledB = compile(b);
    expect(compiledA.uniforms.containmentActorGeometryIdentity).not.toBe(compiledB.uniforms.containmentActorGeometryIdentity);
    const key = a.customProgramCacheKey(), version = a.version;
    setActorGeometryIdentity(a, 52, 6);
    expect((compiledA.uniforms.containmentActorGeometryIdentity.value as Vector2).toArray()).toEqual([52, 6]);
    expect(a.version).toBe(version); expect(a.customProgramCacheKey()).toBe(key);
    const proxy = a.clone(); proxy.onBeforeCompile = a.onBeforeCompile; proxy.customProgramCacheKey = () => key;
    exclude(proxy); setActorGeometryIdentity(proxy, 70, 6);
    const compiledProxy = compile(proxy);
    expect(compiledProxy.fragmentShader.match(/vec2 actorGeometryOctNormal\(/g)).toHaveLength(1);
    expect(compiledProxy.fragmentShader.match(/out highp vec4 containmentGeometry/g)).toHaveLength(1);
    expect(compiledProxy.fragmentShader.match(/uniform vec2 containmentActorGeometryIdentity/g)).toHaveLength(1);
    expect((compiledProxy.uniforms.containmentActorGeometryIdentity.value as Vector2).toArray()).toEqual([70, 6]);
    expect((compiledA.uniforms.containmentActorGeometryIdentity.value as Vector2).toArray()).toEqual([52, 6]);
    expect(proxy.customProgramCacheKey()).toBe(key);
    a.dispose(); b.dispose(); proxy.dispose();
  });

  it('supports the real marine rig accents without changing their rig color or role shading', () => {
    const root = new Group(); marineIdentity(root);
    const material = (root.getObjectByName('marine-rig-accents') as Mesh).material as ShaderMaterial;
    exclude(material); expect(setActorGeometryIdentity(material, 16, 3)).toBe(true);
    const shader = compile(material);
    expect(shader.fragmentShader).toContain('actorGeometryOctNormal(n)');
    expect(shader.fragmentShader).toContain('vec3 color=role<.5?vec3(.65,.93,1.0):rigColor;');
    expect(shader.uniforms.rigColor).toBe(material.uniforms.rigColor);
    material.dispose();
  });

  it('leaves arbitrary particles, generic normals and transparent physical lookalikes excluded', () => {
    const candidates = [
      new ShaderMaterial({ vertexShader:'void main(){gl_Position=vec4(position,1.);}', fragmentShader:'void main(){gl_FragColor=vec4(1.);}' }),
      new ShaderMaterial({ vertexShader:'varying vec3 n;void main(){n=normal;gl_Position=vec4(position,1.);}', fragmentShader:'varying vec3 n;void main(){gl_FragColor=vec4(n,1.);}' }),
      new ShaderMaterial({ transparent: true, uniforms:{rigColor:{value:new Color()}},
        vertexShader:'attribute float identityRole;varying vec3 n;varying float role;void main(){n=normal;role=identityRole;gl_Position=vec4(position,1.);}',
        fragmentShader:'varying vec3 n;varying float role;void main(){gl_FragColor=vec4(n,1.);}' }),
    ];
    for (const material of candidates) {
      exclude(material); const key = material.customProgramCacheKey(), version = material.version;
      expect(setActorGeometryIdentity(material, 40, 4)).toBe(false);
      expect(compile(material).fragmentShader).toContain('containmentGeometry=vec4(0.0,0.0,0.0,1.0)');
      expect(material.customProgramCacheKey()).toBe(key); expect(material.version).toBe(version);
      material.dispose();
    }
  });
});
