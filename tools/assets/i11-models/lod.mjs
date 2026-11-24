/** PERF13: append index-only skinned LODs without rewriting authored geometry or textures. */
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder, MeshoptSimplifier} from 'meshoptimizer';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

await Promise.all([MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({'meshopt.decoder': MeshoptDecoder});
const root = resolve(process.argv.find(value => value.startsWith('--models='))?.slice(9) ?? 'public/assets/models');
const output = resolve(process.argv.find(value => value.startsWith('--out='))?.slice(6) ?? 'artifacts/nextgen/perf13-final/lod-assets.json');
const names = ['dretch', 'basilisk', 'marauder', 'dragoon', 'tyrant', 'marine'];
const ratio = .30;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

function readGLB(bytes) {
  const jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength));
  const bin = bytes.subarray(28 + jsonLength, 28 + jsonLength + bytes.readUInt32LE(20 + jsonLength));
  // Rebuilding twice replaces our appended data, never simplifies a prior LOD.
  const previous = json.asset.extras?.perf13ActorLOD;
  if (previous) {
    json.meshes.length = previous.meshes;
    json.nodes.length = previous.nodes;
    json.accessors.length = previous.accessors;
    json.bufferViews.length = previous.bufferViews;
    for (const node of json.nodes) if (node.children) node.children = node.children.filter(index => index < previous.nodes);
    for (const scene of json.scenes ?? []) scene.nodes = scene.nodes.filter(index => index < previous.nodes);
    json.buffers[0].byteLength = previous.bufferByteLength;
    delete json.asset.extras.perf13ActorLOD;
    return {json, bin: bin.subarray(0, previous.binByteLength)};
  }
  return {json, bin};
}
function writeGLB(json, bin) {
  const text = Buffer.from(JSON.stringify(json));
  const jsonPadding = (4 - text.length % 4) % 4;
  const binPadding = (4 - bin.length % 4) % 4;
  const header = Buffer.alloc(20), binaryHeader = Buffer.alloc(8);
  header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + text.length + jsonPadding + bin.length + binPadding, 8);
  header.writeUInt32LE(text.length + jsonPadding, 12);header.writeUInt32LE(0x4e4f534a, 16);
  binaryHeader.writeUInt32LE(bin.length + binPadding);binaryHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, text, Buffer.alloc(jsonPadding, 32), binaryHeader, bin, Buffer.alloc(binPadding)]);
}
const receipt = [];
for (const name of names) {
 if(process.env.K11_PACK_MODEL && name!==process.env.K11_PACK_MODEL) continue;
  const original = await readFile(resolve(root, name + '.glb'));
  const source = readGLB(original);
  // NodeIO is used solely for read-only decompression of source accessors.
  const document = await io.readBinary(writeGLB(source.json, source.bin));
  const sourceMeshes = document.getRoot().listMeshes();
  const lowMeshes = [];
  for (const [meshIndex, mesh] of source.json.meshes.entries()) {
    if (name !== 'marine' && !mesh.name?.endsWith('-base')) continue;
    const primitiveResults = [];
    for (const [primitiveIndex, primitive] of sourceMeshes[meshIndex].listPrimitives().entries()) {
      if (primitive.getMode() !== 4 || !primitive.getIndices()) throw Error('Expected indexed triangles: ' + mesh.name);
      const position = primitive.getAttribute('POSITION');
      const count = position.getCount();
      const positions = new Float32Array(count * 3);
      const normal = primitive.getAttribute('NORMAL'), uv = primitive.getAttribute('TEXCOORD_0');
      const joints = primitive.getAttribute('JOINTS_0'), weights = primitive.getAttribute('WEIGHTS_0');
      if (!joints || !weights) throw Error('Expected retained skin weights: ' + mesh.name);
      // Existing vertex records are never moved or averaged. Attribute error
      // penalizes changes to normals, UVs and the original ordered skin influences.
      const attributes = new Float32Array(count * 13);
      const p = [], n = [], t = [], j = [], w = [];
      for (let vertex = 0; vertex < count; vertex++) {
        position.getElement(vertex, p);positions.set(p, vertex * 3);
        normal?.getElement(vertex, n);uv?.getElement(vertex, t);
        joints.getElement(vertex, j);weights.getElement(vertex, w);
        attributes.set([n[0] ?? 0,n[1] ?? 0,n[2] ?? 0,t[0] ?? 0,t[1] ?? 0,
          j[0]/64,j[1]/64,j[2]/64,j[3]/64,w[0],w[1],w[2],w[3]], vertex * 13);
      }
      const indices = Uint32Array.from(primitive.getIndices().getArray());
      const target = Math.max(3, Math.floor(indices.length * ratio / 3) * 3);
      const [low, error] = MeshoptSimplifier.simplifyWithAttributes(indices, positions, 3, attributes, 13,
        [1,1,1,10,10,10,10,10,10,10,10,10,10], null, target, .01, []);
      primitiveResults.push({primitiveIndex, low, sourceTriangles: indices.length / 3,
        triangles: low.length / 3, ratio: low.length / indices.length, relativeError: error});
    }
    lowMeshes.push({meshIndex, name: mesh.name + '__lod_low', primitives: primitiveResults});
  }
  const fileResults = [];
  for (const directory of [root, resolve(root, 'plain')]) {
    const path = resolve(directory, name + '.glb');
    const before = await readFile(path), {json, bin} = readGLB(before);
    const contract = {version: 1, ratio, meshes: json.meshes.length, nodes: json.nodes.length,
      accessors: json.accessors.length, bufferViews: json.bufferViews.length,
      bufferByteLength: json.buffers[0].byteLength, binByteLength: bin.length};
    const chunks = [bin];let offset = bin.length;
    for (const low of lowMeshes) {
      const originalMesh = json.meshes[low.meshIndex];
      const mesh = structuredClone(originalMesh);mesh.name = low.name;
      mesh.extras = {...mesh.extras, perf13LOD: 'low', perf13SourceMesh: low.meshIndex};
      for (const result of low.primitives) {
        const maximum = result.low.reduce((value, index) => Math.max(value, index), 0);
        const array = maximum <= 65535 ? Uint16Array.from(result.low) : result.low;
        const payload = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
        const padding = (4 - offset % 4) % 4;chunks.push(Buffer.alloc(padding), payload);offset += padding;
        const view = json.bufferViews.length;
        json.bufferViews.push({buffer: 0, byteOffset: offset, byteLength: payload.length, target: 34963});
        const accessor = json.accessors.length;
        json.accessors.push({bufferView: view, componentType: maximum <= 65535 ? 5123 : 5125,
          count: result.low.length, type: 'SCALAR'});
        mesh.primitives[result.primitiveIndex].indices = accessor;offset += payload.length;
      }
      const meshIndex = json.meshes.length;json.meshes.push(mesh);
      // Runtime extracts the sibling geometry, then removes the extra node.
      // No animation channel, skin, inverse bind or source node is rewritten.
      for (let index = 0; index < contract.nodes; index++) {
        const node = json.nodes[index];if (node.mesh !== low.meshIndex) continue;
        const extra = {name: node.name + '__lod_low', mesh: meshIndex, skin: node.skin,
          extras: {...node.extras, perf13LOD: 'low', perf13SourceNode: node.name,
            perf13SourceMesh: low.meshIndex, perf13Purpose: name === 'marine' ? 'shadow' : 'distance'}};
        for (const key of ['translation','rotation','scale','matrix','weights']) if (key in node) extra[key] = structuredClone(node[key]);
        const lowIndex = json.nodes.length;json.nodes.push(extra);
        const parent = json.nodes.slice(0, contract.nodes).find(parent => parent.children?.includes(index));
        if (parent) parent.children.push(lowIndex);
        else for (const scene of json.scenes ?? []) if (scene.nodes.includes(index)) scene.nodes.push(lowIndex);
      }
    }
    json.buffers[0].byteLength = offset;
    json.asset.extras = {...json.asset.extras, perf13ActorLOD: contract};
    const bytes = writeGLB(json, Buffer.concat(chunks));await writeFile(path, bytes);
    fileResults.push({path, beforeBytes: before.length, afterBytes: bytes.length, sha256: hash(bytes),
      originalBinSHA256: hash(bin), originalBinPrefixSHA256: hash(Buffer.concat(chunks).subarray(0, bin.length))});
  }
  receipt.push({name, simplifier: 'meshoptimizer simplifyWithAttributes; seam-preserving default; UV/skin weight10 normal1; target30%; relative attribute error cap1%',
    geometryPolicy: 'Index-only: original vertex records, normals, UVs, JOINTS_0/WEIGHTS_0, materials, clips and texture bytes unchanged',
    meshes: lowMeshes.map(mesh => ({name: mesh.name, sourceMesh: mesh.meshIndex,
      primitives: mesh.primitives.map(({low, ...metrics}) => metrics)})), files: fileResults});
  console.log(name, JSON.stringify(receipt.at(-1).meshes));
}
await mkdir(resolve(output, '..'), {recursive: true});
await writeFile(output, JSON.stringify(receipt, null, 2) + '\n');
