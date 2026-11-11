import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { encode } from './g2-png.mjs';

/** Original neutral microfinish; structural plate seams and wear are world-space shaders. */
export function deckFinish(kind) {
  if (!['albedo', 'normal', 'arm'].includes(kind)) throw new Error(`Unknown deck finish: ${kind}`);
  const size = 128, pixels = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 3;
    const h = ((Math.imul(x + 17, 374761393) ^ Math.imul(y + 31, 668265263)) >>> 0) % 7 - 3;
    if (kind === 'albedo') pixels[i] = pixels[i + 1] = pixels[i + 2] = 73 + h;
    else if (kind === 'normal') { pixels[i] = 128 + h % 2; pixels[i + 1] = 128; pixels[i + 2] = 255; }
    else { pixels[i] = 255; pixels[i + 1] = 238 + h; pixels[i + 2] = 255; }
  }
  return { width: size, height: size, pixels, channels: 3 };
}

/** Regenerate the shipping texture pack without external tools or source images. */
export async function generateDeckFinishes(destination = fileURLToPath(new URL('../../public/assets/environment/', import.meta.url))) {
  await mkdir(destination, { recursive: true });
  for (const kind of ['albedo', 'normal', 'arm']) {
    const file = resolve(destination, `g2_deck_${kind}.png`);
    const bytes = encode(deckFinish(kind));
    await writeFile(file, bytes);
    console.log(`${file}: ${bytes.length} bytes`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await generateDeckFinishes(process.argv[2]);
