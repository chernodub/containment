import {describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {MaterialWarmup} from '../src/render/MaterialWarmup';

it('retains future-room materials between prepares and releases owned resources without disposing borrowed surfaces',()=>{
 const map=new T.Texture(),surfaces={floor:new T.MeshStandardMaterial({map}),wall:new T.MeshStandardMaterial({map}),cover:new T.MeshStandardMaterial({map})},borrowed=Object.values(surfaces).map(m=>vi.spyOn(m,'dispose'));
 const library=new MaterialWarmup(surfaces),meshes=library.root.children as T.Mesh[],identities=meshes.map(m=>m.material);
 expect(library.root.visible).toBe(false);expect(meshes.length).toBeGreaterThan(6);
 for(const [i,source] of Object.values(surfaces).entries()){expect(meshes[i].material).not.toBe(source);expect((meshes[i].material as T.MeshStandardMaterial).map).not.toBe(map);expect(source.map).toBe(map);}
 for(let i=0;i<2;i++){const restore=library.prepare();expect(library.root.visible).toBe(true);restore();expect(library.root.visible).toBe(false);expect(meshes.map(m=>m.material)).toEqual(identities);for(const spy of borrowed)expect(spy).not.toHaveBeenCalled();}
 const owned=meshes.flatMap(m=>Array.isArray(m.material)?m.material:[m.material]).filter(m=>m.userData.actorMaterial).map(m=>vi.spyOn(m,'dispose'));
 library.dispose();library.dispose();for(const spy of owned)expect(spy).toHaveBeenCalledOnce();for(const spy of borrowed)expect(spy).not.toHaveBeenCalled();
 Object.values(surfaces).forEach(m=>m.dispose());
});

function library() {
  return new MaterialWarmup({ floor: new T.MeshStandardMaterial(), wall: new T.MeshStandardMaterial(), cover: new T.MeshStandardMaterial() });
}

function mesh(material: T.Material = new T.MeshPhysicalMaterial()) {
  return new T.Mesh(new T.PlaneGeometry(2, 2, 12, 12), material);
}

describe('room shader topology registration', () => {
  it('deduplicates equivalent new material instances while retaining the exact material class and hooks', () => {
    const warmup = library();
    const shaderHook: T.Material['onBeforeCompile'] = shader => { shader.fragmentShader += '\n// authored surface'; };
    const key = () => 'authored-surface-v1';
    const source = new T.MeshPhysicalMaterial({ clearcoat: 0.4, roughness: 0.7 });
    source.onBeforeCompile = shaderHook; source.customProgramCacheKey = key;
    const original = mesh(source);
    expect(warmup.register(original)).toBe(1);
    const proxy = warmup.root.children.at(-1) as T.Mesh;
    const retained = proxy.material as T.MeshPhysicalMaterial;
    expect(retained).toBeInstanceOf(T.MeshPhysicalMaterial);
    expect(retained).not.toBe(source);
    expect(retained.onBeforeCompile).toBe(source.onBeforeCompile);
    expect(retained.customProgramCacheKey()).toBe(source.customProgramCacheKey());
    expect(retained.userData).toMatchObject({ actorMaterial: true, retainedRoomWarmup: true });
    expect(proxy.geometry).not.toBe(original.geometry);
    expect(proxy.geometry.getAttribute('position').count).toBe(4);
    expect(original.geometry.getAttribute('position').count).toBe(169);
    const equivalent = new T.MeshPhysicalMaterial({ clearcoat: 0.9, roughness: 0.1, color: 0xff0000 });
    equivalent.onBeforeCompile = shaderHook; equivalent.customProgramCacheKey = key;
    expect(warmup.register(mesh(equivalent))).toBe(0);
    expect(warmup.register(original)).toBe(0);
    expect(warmup.root.children.at(-1)).toBe(proxy);
    warmup.dispose();
  });

  it('distinguishes physical features, map channels/color spaces, sidedness, defines and alpha-test topology', () => {
    const warmup = library();
    const base = new T.MeshPhysicalMaterial();
    expect(warmup.register(mesh(base))).toBe(1);
    const variants: T.MeshPhysicalMaterial[] = [
      new T.MeshPhysicalMaterial({ clearcoat: 0.2 }),
      new T.MeshPhysicalMaterial({ transmission: 0.1 }),
      new T.MeshPhysicalMaterial({ side: T.DoubleSide }),
      new T.MeshPhysicalMaterial({ transparent: true }),
      new T.MeshPhysicalMaterial({ flatShading: true }),
      new T.MeshPhysicalMaterial({ vertexColors: true }),
      new T.MeshPhysicalMaterial({ alphaTest: 0.2 }),
    ];
    const defined = new T.MeshPhysicalMaterial(); defined.defines = { ROOM_FEATURE: 1 }; variants.push(defined);
    for (const channel of [0, 1]) {
      const map = new T.Texture(); map.channel = channel;
      variants.push(new T.MeshPhysicalMaterial({ map }));
    }
    const srgb = new T.Texture(); srgb.colorSpace = T.SRGBColorSpace;
    variants.push(new T.MeshPhysicalMaterial({ map: srgb }));
    for (const material of variants) {
      expect(warmup.register(mesh(material))).toBe(1);
      expect((warmup.root.children.at(-1) as T.Mesh<T.BufferGeometry, T.MeshPhysicalMaterial>).material.defines).toEqual(material.defines);
    }
    expect(warmup.register(mesh(new T.MeshPhysicalMaterial({ alphaTest: 0.8 })))).toBe(0);
    const normal = new T.Texture(); normal.channel = 2;
    const normalSource = mesh(new T.MeshPhysicalMaterial({ normalMap: normal }));
    expect(warmup.register(normalSource)).toBe(1);
    const proxy = warmup.root.children.at(-1) as T.Mesh;
    expect(proxy.geometry.getAttribute('uv2').count).toBe(4);
    const retainedNormal = (proxy.material as T.MeshPhysicalMaterial).normalMap as T.DataTexture;
    expect(retainedNormal).not.toBe(normal);
    expect(retainedNormal.channel).toBe(normal.channel);
    expect([retainedNormal.image.width, retainedNormal.image.height]).toEqual([1, 1]);
    warmup.dispose();
  });

  it('matches vertex alpha, tangent and UV layouts without borrowing source buffers', () => {
    const warmup = library();
    const material = new T.MeshPhysicalMaterial({ vertexColors: true, normalMap: new T.Texture() });
    const original = mesh(material);
    original.geometry.setAttribute('color', new T.Float32BufferAttribute(new Float32Array(169 * 4).fill(1), 4));
    original.geometry.setAttribute('tangent', new T.Float32BufferAttribute(new Float32Array(169 * 4), 4));
    original.geometry.setAttribute('uv3', new T.Float32BufferAttribute(new Float32Array(169 * 2), 2));
    expect(warmup.register(original)).toBe(1);
    const proxy = warmup.root.children.at(-1) as T.Mesh;
    for (const name of ['color', 'tangent', 'uv3']) {
      expect(proxy.geometry.getAttribute(name)).not.toBe(original.geometry.getAttribute(name));
      expect(proxy.geometry.getAttribute(name).count).toBe(4);
      expect(proxy.geometry.getAttribute(name).itemSize).toBe(original.geometry.getAttribute(name).itemSize);
    }
    const rgb = mesh(new T.MeshPhysicalMaterial({ vertexColors: true, normalMap: new T.Texture() }));
    rgb.geometry.setAttribute('color', new T.Float32BufferAttribute(new Float32Array(169 * 3), 3));
    expect(warmup.register(rgb)).toBe(1);
    warmup.dispose();
  });

  it('retains instancing and instance color separately from ordinary meshes', () => {
    const warmup = library();
    const material = new T.MeshPhysicalMaterial();
    const geometry = new T.PlaneGeometry(1, 1, 5, 5);
    const plain = new T.Mesh(geometry, material);
    const uncolored = new T.InstancedMesh(geometry, material, 200);
    const colored = new T.InstancedMesh(geometry, material, 300);
    colored.setColorAt(0, new T.Color(0xff0000));
    expect(warmup.register(plain)).toBe(1);
    expect(warmup.register(uncolored)).toBe(1);
    expect(warmup.register(colored)).toBe(1);
    const proxy = warmup.root.children.at(-1) as T.InstancedMesh;
    expect(proxy).toBeInstanceOf(T.InstancedMesh);
    expect(proxy.count).toBe(1);
    expect(proxy.instanceColor).not.toBeNull();
    expect(proxy.instanceColor).not.toBe(colored.instanceColor);
    expect(proxy.geometry.getAttribute('position').count).toBe(4);
    warmup.dispose();
  });

  it('owns one-bone skinned proxies and never disposes original materials, geometry, maps or skeletons', () => {
    const warmup = library();
    const map = new T.Texture();
    const material = new T.MeshPhysicalMaterial({ map });
    material.userData.actorMaterial = true;
    const original = new T.SkinnedMesh(new T.PlaneGeometry(2, 2, 5, 5), material);
    const bone = new T.Bone(); original.add(bone); original.bind(new T.Skeleton([bone]));
    const borrowed = [material, map, original.geometry, original.skeleton].map(value => vi.spyOn(value, 'dispose'));
    expect(warmup.register(original)).toBe(1);
    const proxy = warmup.root.children.at(-1) as T.SkinnedMesh;
    expect(proxy).toBeInstanceOf(T.SkinnedMesh);
    expect(proxy.skeleton).not.toBe(original.skeleton);
    expect(proxy.skeleton.bones).toHaveLength(1);
    expect(proxy.geometry.getAttribute('skinIndex').count).toBe(4);
    expect(proxy.geometry.getAttribute('skinWeight').getX(0)).toBe(1);
    const owned = [proxy.geometry, proxy.material as T.Material, proxy.skeleton].map(value => vi.spyOn(value, 'dispose'));
    warmup.dispose(); warmup.dispose();
    for (const spy of owned) expect(spy).toHaveBeenCalledOnce();
    for (const spy of borrowed) expect(spy).not.toHaveBeenCalled();
    expect(warmup.register(original)).toBe(0);
    expect(warmup.root.children).toHaveLength(0);
  });

  it('handles multi-material meshes and replaces shader texture uniforms with owned valid samplers', () => {
    const warmup = library();
    const map = new T.Texture();
    const shader = new T.ShaderMaterial({ uniforms: { colorMap: { value: map } }, vertexShader: 'void main(){gl_Position=vec4(position,1.0);}', fragmentShader: 'void main(){gl_FragColor=vec4(1.0);}' });
    const root = new T.Group(); root.add(new T.Mesh(new T.PlaneGeometry(), [shader, new T.MeshPhysicalMaterial()]));
    expect(warmup.register(root)).toBe(2);
    const proxy = warmup.root.children.at(-2) as T.Mesh<T.BufferGeometry, T.ShaderMaterial>;
    const sampler = proxy.material.uniforms.colorMap.value as T.DataTexture;
    expect(sampler).not.toBe(map);
    expect([sampler.image.width, sampler.image.height]).toEqual([1, 1]);
    expect(sampler.image.data!.byteLength).toBe(4);
    const samplerDispose = vi.spyOn(sampler, 'dispose');
    const dispose = vi.spyOn(map, 'dispose'); warmup.dispose(); expect(dispose).not.toHaveBeenCalled();
    expect(samplerDispose).toHaveBeenCalledOnce();
  });

  it('pools independent sampler data by topology and remains valid after room image retirement', () => {
    const warmup = library();
    const image = { width: 512, height: 256 };
    const source = new T.Texture(image as unknown as TexImageSource);
    source.colorSpace = T.SRGBColorSpace; source.channel = 1;
    const other = new T.Texture({ width: 64, height: 64 } as unknown as TexImageSource);
    other.colorSpace = T.SRGBColorSpace; other.channel = 1;
    const first = new T.MeshPhysicalMaterial({ map: source });
    const second = new T.MeshPhysicalMaterial({ map: other, side: T.DoubleSide });
    expect(warmup.register(mesh(first))).toBe(1);
    const firstProxy = warmup.root.children.at(-1) as T.Mesh<T.BufferGeometry, T.MeshPhysicalMaterial>;
    expect(warmup.register(mesh(second))).toBe(1);
    const secondProxy = warmup.root.children.at(-1) as T.Mesh<T.BufferGeometry, T.MeshPhysicalMaterial>;
    const sampler = firstProxy.material.map as T.DataTexture;
    expect(secondProxy.material.map).toBe(sampler);
    expect(sampler).toBeInstanceOf(T.DataTexture);
    expect(sampler.image).not.toBe(image);
    expect(sampler).toMatchObject({ channel: 1, colorSpace: T.SRGBColorSpace, mapping: source.mapping, format: source.format, type: source.type });
    expect(sampler.image.data).toBeInstanceOf(Uint8Array);
    image.width = image.height = 0; source.dispose();
    expect([sampler.image.width, sampler.image.height]).toEqual([1, 1]);
    expect(sampler.image.data!.byteLength).toBe(4);
    expect(first.map).toBe(source); expect(second.map).toBe(other);
    const ownDispose = vi.spyOn(sampler, 'dispose');
    const originalDispose = vi.spyOn(other, 'dispose');
    warmup.dispose(); warmup.dispose();
    expect(ownDispose).toHaveBeenCalledOnce();
    expect(originalDispose).not.toHaveBeenCalled();
  });

  it('preserves data format/type, nested uniform samplers, valid cube faces and CubeUV atlas height', () => {
    const warmup = library();
    const half = new T.DataTexture(new Uint16Array(32), 4, 4, T.RGFormat, T.HalfFloatType);
    half.channel = 2;
    const cube = new T.CubeTexture();
    const atlas = new T.DataTexture(new Float32Array(336 * 256 * 4), 336, 256, T.RGBAFormat, T.FloatType);
    atlas.mapping = T.CubeUVReflectionMapping;
    const shader = new T.ShaderMaterial({
      uniforms: { maps: { value: [half, cube] }, nested: { value: { atlas } } },
      vertexShader: 'void main(){gl_Position=vec4(position,1.0);}', fragmentShader: 'void main(){gl_FragColor=vec4(1.0);}',
    });
    expect(warmup.register(mesh(shader))).toBe(1);
    const proxy = warmup.root.children.at(-1) as T.Mesh<T.BufferGeometry, T.ShaderMaterial>;
    const [small, smallCube] = proxy.material.uniforms.maps.value as [T.DataTexture, T.CubeTexture];
    const smallAtlas = proxy.material.uniforms.nested.value.atlas as T.DataTexture;
    expect(small).not.toBe(half);
    expect(small).toMatchObject({ format: T.RGFormat, type: T.HalfFloatType, channel: 2 });
    expect(small.image.data).toBeInstanceOf(Uint16Array);
    expect(small.image.data!.byteLength).toBe(4);
    expect(smallCube).not.toBe(cube);
    expect(smallCube).toBeInstanceOf(T.CubeTexture);
    expect(smallCube.images).toHaveLength(6);
    for (const face of smallCube.images as T.DataTexture[]) {
      expect([face.image.width, face.image.height]).toEqual([1, 1]);
      expect(face.image.data!.byteLength).toBe(4);
    }
    expect(smallAtlas).not.toBe(atlas);
    expect(smallAtlas.image.height).toBe(256);
    expect(smallAtlas.image.data).toBeInstanceOf(Float32Array);
    expect(smallAtlas.image.data!.length).toBe(smallAtlas.image.width * 256 * 4);
    const retained = [small, smallCube, smallAtlas, ...smallCube.images] as T.Texture[];
    const disposals = retained.map(value => vi.spyOn(value, 'dispose'));
    const originals = [half, cube, atlas].map(value => vi.spyOn(value, 'dispose'));
    warmup.dispose(); warmup.dispose();
    for (const dispose of disposals) expect(dispose).toHaveBeenCalledOnce();
    for (const dispose of originals) expect(dispose).not.toHaveBeenCalled();
    expect(shader.uniforms.maps.value).toEqual([half, cube]);
    expect(shader.uniforms.nested.value.atlas).toBe(atlas);
  });
});
