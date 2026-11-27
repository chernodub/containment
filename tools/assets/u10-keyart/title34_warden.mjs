// Use the game's oral surfaces and skin weights before bringing the posed cast into Blender.
import {readFileSync, writeFileSync} from 'node:fs';
import {BufferAttribute, Vector3} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {shapeWardenMouth} from '../../../src/render/WardenMouth.ts';

const file = readFileSync('public/assets/models/tyrant.glb');
const jsonEnd = 20 + file.readUInt32LE(12);
const doc = JSON.parse(file.subarray(20, jsonEnd));
// Decode just the geometry. Blender supplies the key-art materials.
delete doc.images;
delete doc.textures;
delete doc.materials;
delete doc.animations;
for (const mesh of doc.meshes) {
    for (const primitive of mesh.primitives) delete primitive.material;
}
doc.buffers[0].uri = 'data:application/octet-stream;base64,' + file.subarray(jsonEnd + 8).toString('base64');
globalThis.ProgressEvent ??= class {
    constructor(type, init) { Object.assign(this, init, {type}); }
};
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const gltf = await loader.parseAsync(JSON.stringify(doc), '');
const mesh = gltf.scene.getObjectByName('k11-brute-boss');
const geometry = mesh.geometry;
const {position, skinIndex, skinWeight, uv, _heavyzone: zone} = geometry.attributes;
for (const [name, size] of [['actorRegion', 1], ['plateEdge', 3]]) {
    geometry.setAttribute(name, new BufferAttribute(new Float32Array(position.count * size), size));
}
shapeWardenMouth(mesh);

// The source skin buffer uses local Z up, as does the Blender sculpture.
const hinge = new Vector3(3.1, 0, 3.52);
const axis = new Vector3(0, 1, 0);
const jaw = mesh.skeleton.bones.findIndex(bone => bone.name === 'jaw');
const mouthCells = {9: 10, 12: 11, 13: 12, 14: 13};
const vertices = [], cells = [];
for (let i = 0; i < position.count; i++) {
    let weight = 0;
    for (let k = 0; k < 4; k++) {
        if (skinIndex.getComponent(i, k) === jaw) weight += skinWeight.getComponent(i, k);
    }
    const point = new Vector3().fromBufferAttribute(position, i);
    const code = zone.getX(i);
    // Slide the shipped tongue into view over the lowered lip.
    if ((code >> 4) === 83) point.x += .43;
    point.sub(hinge).applyAxisAngle(axis, weight * .32).add(hinge);
    vertices.push(point.toArray());
    const atlasCell = Math.floor(4 * uv.getX(i)) + 4 * Math.floor(4 * (1 - uv.getY(i)));
    cells.push((code >> 4) >= 80 ? mouthCells[code % 16] ?? 0 : atlasCell);
}
const indices = Array.from(geometry.index.array);
writeFileSync(process.argv[2], JSON.stringify({vertices, cells, indices}));
