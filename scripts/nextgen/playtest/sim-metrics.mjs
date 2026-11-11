import { readFile } from 'node:fs/promises';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
/** Read actor dimensions without images, WebGL, DOM, or animation advancement. */
export async function actorMetrics() {
    globalThis.ProgressEvent ??= class extends Event {
        constructor(type, options) { super(type); Object.assign(this, options); }
    };
    const result = {};
    const families = { crawler: ['dretch', 1.75], stalker: ['basilisk', 2.35], spitter: ['marauder', 2.35], carrier: ['dragoon', 3.05], brute: ['tyrant', 3.1], queen: ['tyrant', 6.5] };
    for (const [family, [name, span]] of Object.entries(families)) {
        const bytes = await readFile(`public/assets/models/${name}.glb`);
        const jsonLength = bytes.readUInt32LE(12), doc = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
        doc.images = [];
        doc.textures = [];
        for (const m of doc.materials ?? []) {
            for (const key of Object.keys(m))
                if (/Texture$/.test(key))
                    delete m[key];
            if (m.pbrMetallicRoughness) {
                delete m.pbrMetallicRoughness.baseColorTexture;
                delete m.pbrMetallicRoughness.metallicRoughnessTexture;
            }
        }
        const binStart = 20 + jsonLength, bin = bytes.subarray(binStart + 8, binStart + 8 + bytes.readUInt32LE(binStart));
        doc.buffers[0].uri = `data:application/octet-stream;base64,${bin.toString('base64')}`;
        const gltf = await new GLTFLoader().parseAsync(JSON.stringify(doc), '');
        const root = gltf.scene;
        root.rotation.y = -Math.PI / 2;
        const mixer = new T.AnimationMixer(root), idle = gltf.animations.find(c => c.name === 'stand' || c.name === 'idle');
        if (idle)
            mixer.clipAction(idle).play();
        mixer.update(0);
        root.updateMatrixWorld(true);
        const bounds = new T.Box3().setFromObject(root, true), size = bounds.getSize(new T.Vector3());
        result[family] = { height: size.y * span / Math.max(size.x, size.z) };
        mixer.stopAllAction();
        mixer.uncacheRoot(root);
    }
    return result;
}
