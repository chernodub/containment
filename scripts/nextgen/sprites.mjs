import assert from 'node:assert/strict';
import { inflateSync, deflateSync } from 'node:zlib';

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const paeth = (a, b, c) => { const p = a + b - c, x = Math.abs(p - a), y = Math.abs(p - b), z = Math.abs(p - c); return x <= y && x <= z ? a : y <= z ? b : c; };

/** Decode Chromium's non-interlaced 8-bit RGB/RGBA screenshots to RGBA pixels. */
export function decodePng(png) {
  assert(png.subarray(0, 8).equals(signature), 'Invalid PNG signature');
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20), channels = png[25] === 6 ? 4 : 3;
  assert(png[24] === 8 && [2, 6].includes(png[25]) && png[28] === 0, 'Unsupported sprite PNG format');
  const chunks = [];
  for (let p = 8; p < png.length;) { const length = png.readUInt32BE(p); if (png.toString('ascii', p + 4, p + 8) === 'IDAT') chunks.push(png.subarray(p + 8, p + 8 + length)); p += length + 12; }
  const raw = inflateSync(Buffer.concat(chunks)), stride = width * channels, pixels = Buffer.alloc(width * height * 4);
  assert.equal(raw.length, (stride + 1) * height, 'Malformed PNG pixel data');
  let previous = Buffer.alloc(stride), offset = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[offset++], row = Buffer.from(raw.subarray(offset, offset + stride)); offset += stride;
    assert(filter <= 4, 'Unsupported PNG row filter');
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? row[x - channels] : 0, b = previous[x], c = x >= channels ? previous[x - channels] : 0;
      row[x] = (row[x] + (filter === 0 ? 0 : filter === 1 ? a : filter === 2 ? b : filter === 3 ? (a + b) >> 1 : paeth(a, b, c))) & 255;
    }
    for (let x = 0; x < width; x++) { const from = x * channels, to = (y * width + x) * 4; pixels[to] = row[from]; pixels[to + 1] = row[from + 1]; pixels[to + 2] = row[from + 2]; pixels[to + 3] = channels === 4 ? row[from + 3] : 255; }
    previous = row;
  }
  return {width, height, pixels};
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
function chunk(type, data) {
  const name = Buffer.from(type), content = Buffer.concat([name, data]); let crc = 0xffffffff;
  for (const value of content) crc = crcTable[(crc ^ value) & 255] ^ (crc >>> 8);
  const head = Buffer.alloc(4), tail = Buffer.alloc(4); head.writeUInt32BE(data.length); tail.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([head, content, tail]);
}

/** Encode an original RGBA sprite sheet without adding a runtime dependency. */
export function encodePng({width, height, pixels}) {
  assert(Number.isInteger(width) && width > 0 && Number.isInteger(height) && height > 0 && pixels.length === width * height * 4, 'Invalid RGBA image');
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6;
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) pixels.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  return Buffer.concat([signature, chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

/** Fixed-step frames stay in row-major order; original PNGs remain alongside. */
export function stitchPngFrames(frames, cellWidth = 960) {
  assert(frames.length > 0 && frames.length <= 30, 'Sprite sheet expects 1..30 frames');
  const images = frames.map(decodePng), first = images[0];
  assert(images.every(image => image.width === first.width && image.height === first.height), 'Burst frame sizes differ');
  const w = Math.min(first.width, cellWidth), h = Math.max(1, Math.round(first.height * w / first.width));
  const columns = Math.min(4, Math.ceil(Math.sqrt(frames.length))), rows = Math.ceil(frames.length / columns);
  const width = w * columns, height = h * rows, pixels = Buffer.alloc(width * height * 4, 0);
  for (let p = 3; p < pixels.length; p += 4) pixels[p] = 255;
  images.forEach((image, index) => {
    const left = index % columns * w, top = Math.floor(index / columns) * h;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const from = (Math.min(image.height - 1, Math.floor((y + .5) * image.height / h)) * image.width + Math.min(image.width - 1, Math.floor((x + .5) * image.width / w))) * 4;
      image.pixels.copy(pixels, ((top + y) * width + left + x) * 4, from, from + 4);
    }
  });
  return {png: encodePng({width, height, pixels}), width, height, columns, rows, cellWidth: w, cellHeight: h, frames: frames.length};
}
