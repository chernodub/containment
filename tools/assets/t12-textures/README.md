# T12 texture inventory

Run `node tools/assets/t12-textures/inventory.mjs [output-directory]` from the repository root. Defaults to `artifacts/nextgen/t12-final`. Uses Node built-ins only. Reads assets without modifying them.

The JSON includes GLB file sizes and embedded/loose PNG/JPEG image payload sizes. Markdown contains one row per image. GPU bytes assume RGBA8 plus a complete mip chain; these are estimates, not measured driver allocations. This is a folder inventory, not a runtime residency inventory: unused assets, duplicate image payloads and UI assets under this folder can appear. Unknown formats have null dimensions/storage and need separate inspection. External GLB image URIs are not resolved. Do not sum this table and describe it as gameplay memory.
