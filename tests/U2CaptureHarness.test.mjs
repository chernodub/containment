import {describe, it, expect} from 'vitest';
import {inflateSync} from 'node:zlib';
import {mkdtemp, mkdir, writeFile, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {decodePng, encodePng, stitchPngFrames} from '../scripts/nextgen/sprites.mjs';
import {matchGalleryShots, compareGalleries} from '../scripts/nextgen/gallery.mjs';
import {SCENARIOS, DEFAULT_ROOMS} from '../scripts/nextgen/scenarios.mjs';

const solid = (r, g, b) => ({width: 4, height: 2, pixels: Buffer.from(Array.from({length: 8}, () => [r, g, b, 255]).flat())});

describe('portable fixed-step motion evidence', () => {
  it('encodes real lossless PNG rows and round-trips RGBA pixels', () => {
    const image = solid(159, 232, 255), png = encodePng(image);
    expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const idat = [];
    for (let offset = 8; offset < png.length;) {
      const size = png.readUInt32BE(offset);
      if (png.toString('ascii', offset + 4, offset + 8) === 'IDAT') idat.push(png.subarray(offset + 8, offset + 8 + size));
      offset += size + 12;
    }
    const rows = inflateSync(Buffer.concat(idat));
    expect(rows[0]).toBe(0);
    expect(rows.subarray(1, 17)).toEqual(image.pixels.subarray(0, 16));
    expect(decodePng(png)).toEqual(image);
  });
  it('keeps burst order left-to-right then top-to-bottom and original aspect', () => {
    const sprite = stitchPngFrames([solid(255, 0, 0), solid(0, 255, 0), solid(0, 0, 255)].map(encodePng), 4);
    expect(sprite).toMatchObject({width: 8, height: 4, columns: 2, rows: 2, cellWidth: 4, cellHeight: 2, frames: 3});
    const image = decodePng(sprite.png), pixel = (x, y) => [...image.pixels.subarray((y * image.width + x) * 4, (y * image.width + x) * 4 + 4)];
    expect(pixel(0, 0)).toEqual([255, 0, 0, 255]);
    expect(pixel(4, 0)).toEqual([0, 255, 0, 255]);
    expect(pixel(0, 2)).toEqual([0, 0, 255, 255]);
    expect(pixel(4, 2)).toEqual([0, 0, 0, 255]);
    expect(() => stitchPngFrames([])).toThrow('1..30');
  });
  it('registers canonical live kiting for every default room while retaining the old stress fixture', () => {
    const scenario = SCENARIOS.find(s => s.id === 'combat-kiting');
    expect(scenario).toMatchObject({rooms: true, state: 'playing', kiting: true, burst: true});
    expect(DEFAULT_ROOMS).toHaveLength(10);
    expect(SCENARIOS.find(s => s.id === 'combat-kiting-fixture')).toMatchObject({room: 'breached-loading-bay', state: 'playing', burst: true});
    expect(SCENARIOS.find(s => s.id === 'combat-heavy')).toMatchObject({rooms: true, combat: true});
    for (const kind of ['room-enter','room-clear','boss-intro','boss-defeated','overdrive-ready','death']) {
      expect(SCENARIOS.find(s => s.id === `beat-${kind}-fixture`)).toMatchObject({state: 'playing', burst: true, required: ['#presentation-beat']});
    }
  });
});

describe('honest gallery comparison', () => {
  it('matches room/frame identity and preserves missing views', () => {
    const a = [{scenario:'combat-kiting',room:'armory',frame:1,file:'a.png'}, {scenario:'title',frame:null,file:'title.png'}];
    const b = [{scenario:'combat-kiting',room:'armory',frame:2,file:'b.png'}, {scenario:'title',frame:null,file:'new-title.png'}];
    const pairs = matchGalleryShots(a, b);
    expect(pairs).toHaveLength(3);
    expect(pairs[0]).toEqual({left:a[0],right:null});
    expect(pairs[1]).toEqual({left:a[1],right:b[1]});
    expect(pairs[2]).toEqual({left:null,right:b[0]});
  });
  it('writes a standalone HTML sheet with both galleries embedded and no invented match', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'containment-gallery-'));
    try {
      for (const label of ['before','after']) {
        await mkdir(join(directory,label));
        await writeFile(join(directory,label,'shot.png'), encodePng(solid(label==='before'?20:200,100,150)));
        await writeFile(join(directory,label,'manifest.json'), JSON.stringify({gitSHA:'abc',viewport:{width:1280,height:720},shots:[{scenario:label==='before'?'title':'route',file:'shot.png',simulationMs:0}]}));
      }
      const result = await compareGalleries(directory,['before','after'],join(directory,'comparison'));
      const html = await readFile(result.file,'utf8');
      expect(result.pairs).toBe(2);
      expect(html.match(/data:image\/png;base64/g)).toHaveLength(2);
      expect(html.match(/Not captured in this gallery/g)).toHaveLength(2);
      expect(html).toContain('1280×720');
      expect(html).not.toContain('http://');
      await expect(compareGalleries(directory,['../secret','after'],join(directory,'comparison'))).rejects.toThrow('two safe');
    } finally {await rm(directory,{recursive:true,force:true});}
  });
});
