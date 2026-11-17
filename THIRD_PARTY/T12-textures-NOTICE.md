# T12 texture tools and transcoder

No new runtime npm dependency is added. `KTX2Loader` is supplied by Three.js 0.185.0 (MIT; Three-LICENSE.txt). `public/assets/basis/basis_transcoder.js` and `.wasm` are copied verbatim from that installed Three package. Basis Universal is Apache-2.0 (Basis-Universal-LICENSE.txt); its bundled Zstd decoder retains the Zstd BSD notice (Basis-Zstd-LICENSE.txt).

The offline encoder is Khronos KTX-Software 4.4.2 `toktx`, from the official Khronos release. Its project notice and Apache-2.0 text are retained in KTX-Software-LICENSE.md and KTX-Apache-2.0.txt. The encoder executable and its libraries are not shipped. Its complete third-party license inventory is included in the official distribution/source LICENSES directory; see https://github.com/KhronosGroup/KTX-Software/tree/v4.4.2/LICENSES .

Image resizing uses the platform's installed macOS `sips` utility; no Apple binary is redistributed. Existing original-art MIT and third-party model notices continue to apply. The converter does not change kit, floor or UI artwork ownership.

KTX2Loader also bundles Three's copies of `ktx-parse` and `zstddec`; their MIT notices are retained in ktx-parse-LICENSE.txt and zstddec-LICENSE.txt (the latter also includes the decoder's Zstd notice). These are Three-provided helpers, not additional runtime npm dependencies.
