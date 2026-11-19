/**
 * BOSS14 before/after review sheets (art evidence only).
 * node pairs.mjs <beforeDir> <afterDir> <outDir> name1 name2 ...   (names are PNG basenames present in both dirs)
 * Writes <name>-pair.png: before|after at 960 wide (colour) and a row at 480x270 (colour + greyscale).
 */
import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
const [before, after, out, ...names] = process.argv.slice(2);
await mkdir(out, {recursive: true});
for (const name of names) {
  const tiles = [];
  for (const dir of [before, after]) {
    const src = `${dir}/${name}`;
    tiles.push(await sharp(src).resize(960, 540).toBuffer());
    tiles.push(await sharp(src).resize(480, 270).toBuffer());
    tiles.push(await sharp(src).resize(480, 270).greyscale().toBuffer());
  }
  await sharp({create: {width: 1920, height: 810, channels: 4, background: '#000'}}).composite([
    {input: tiles[0], left: 0, top: 0}, {input: tiles[3], left: 960, top: 0},
    {input: tiles[1], left: 0, top: 540}, {input: tiles[2], left: 480, top: 540},
    {input: tiles[4], left: 960, top: 540}, {input: tiles[5], left: 1440, top: 540},
  ]).png().toFile(`${out}/${name.replace(/\.png$/, '')}-pair.png`);
}
console.log('pairs', names.length);
