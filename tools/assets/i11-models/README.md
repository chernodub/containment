# I11 actor packing

Run `sh tools/assets/k11-creatures/rebuild.sh`, then `sh tools/assets/k12-hero/rebuild.sh`, then `node tools/assets/i11-models/optimize.mjs`, then `npm run build`. It uses the existing MIT glTF Transform and meshoptimizer development dependencies (notices in `THIRD_PARTY/`). The runtime uses Three.js's bundled meshopt decoder, covered by the retained Three/meshoptimizer MIT notices.

Positions, joints, inverse binds and animations retain full precision. Normal/tangent/UV/weight attributes use 16-bit quantization, then all buffers receive lossless meshopt compression. Deduplication shares identical resources; only orphan accessors are pruned. Named rank skins are preserved. Texture image payloads remain byte-identical and shared between ranks. There is no GPU texture compression or texture-memory saving: adding a KTX2 pipeline is deferred rather than silently introducing lossy textures or a new transcoder.

The size receipt goes to `artifacts/nextgen/i11-final/asset-sizes.json`. Repacking an already packed file is supported, but before values then describe that packed input; rebuild generators first for a source-to-packed comparison.
