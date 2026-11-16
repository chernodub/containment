/**
 * Contact-sheet helper for K11 reviews (art evidence only).
 * usage: node sheet.mjs out.png --cols=3 --cell=400 [--bg=#1d2228] img1.png[=label] img2.png ...
 * Cells keep aspect ratio (contain), labels are drawn under each cell.
 */
import sharp from 'sharp';

const args = process.argv.slice(2);
const out = args.shift();
const opt = (key, fallback) => {
  const hit = args.find(value => value.startsWith(`--${key}=`));
  return hit ? hit.split('=').slice(1).join('=') : fallback;
};
const files = args.filter(value => !value.startsWith('--'));
const cols = Number(opt('cols', 3));
const cell = Number(opt('cell', 400));
const cellH = Number(opt('cellh', cell));
const bg = opt('bg', '#1d2228');
const label = 22;
const rows = Math.ceil(files.length / cols);
const width = cols * cell;
const height = rows * (cellH + label);
const escape = text => text.replace(/[&<>]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;'}[c]));
const layers = [];
for (const [index, entry] of files.entries()) {
  const [file, text = file.split('/').pop()] = entry.split('=');
  const x = (index % cols) * cell;
  const y = Math.floor(index / cols) * (cellH + label);
  const fit = opt('fit', 'contain');
  const image = await sharp(file).resize(cell, cellH, {fit, background: bg, kernel: opt('kernel', 'lanczos3')}).png().toBuffer();
  layers.push({input: image, left: x, top: y});
  const svg = `<svg width="${cell}" height="${label}"><text x="6" y="16" font-family="Helvetica" font-size="14" fill="#d8dee4">${escape(text)}</text></svg>`;
  layers.push({input: Buffer.from(svg), left: x, top: y + cellH});
}
await sharp({create: {width, height, channels: 4, background: bg}}).composite(layers).png().toFile(out);
console.log(out, width, height);
