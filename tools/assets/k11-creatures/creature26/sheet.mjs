#!/usr/bin/env node
/** CREATURE26 preview contact sheet: rows = poses, columns = plan views per facing then silhouettes.
 * node sheet.mjs <dir> [--w=440] */
import sharp from 'sharp';
import {readdirSync} from 'node:fs';
import {join} from 'node:path';
const dir=process.argv[2],W=+(process.argv.find(a=>a.startsWith('--w='))?.slice(4)??440),H=Math.round(W*9/16);
const files=readdirSync(dir).filter(f=>/^(plan|sil)-.*\.png$/.test(f));
const poses=[...new Set(files.filter(f=>f.startsWith('plan-')).map(f=>f.replace(/^plan-/,'').replace(/-(left|down|right|up)\.png$/,'')))];
const facings=[...new Set(files.map(f=>f.match(/-(left|down|right|up)\.png$/)[1]))];
const cols=facings.flatMap(f=>[`plan-%-${f}.png`,`sil-%-${f}.png`]);
const tiles=[];
for(const [r,p] of poses.entries())for(const [c,t] of cols.entries()){const f=join(dir,t.replace('%',p));tiles.push({input:await sharp(f).resize(W,H,{fit:'contain',background:'#000'}).png().toBuffer(),left:c*(W+4),top:r*(H+4)});}
await sharp({create:{width:cols.length*(W+4),height:poses.length*(H+4),channels:3,background:'#ff00ff'}}).composite(tiles).png().toFile(join(dir,'sheet.png'));
console.log(poses.join(','),facings.join(','));
