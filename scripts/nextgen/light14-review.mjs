import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import {canvas,decode,encode,drawImage,drawText} from './g2-png.mjs';
import {review480,grayscale} from './l8-review-images.mjs';
const room=process.argv[2],root=process.argv[3]??`artifacts/nextgen/light14-final/room-reviews/${room}`,out='artifacts/nextgen/light14-final';
await mkdir(out,{recursive:true});
const files=(await readdir(root)).filter(f=>f.endsWith('.png')&&!f.includes('sprite')&&(!f.startsWith('room-tour')||f.endsWith('-03.png'))&&(!f.startsWith('combat-heavy')||f.endsWith('-01.png')));
const sheet=canvas(960,294*files.length);
for(const [i,file]of files.entries()){const im=review480(decode(await readFile(`${root}/${file}`)));drawText(sheet,file,4,i*294+4,undefined,1);drawImage(sheet,im,0,i*294+24,480,270);drawImage(sheet,grayscale(im),480,i*294+24,480,270);}
await writeFile(`${out}/${room}-review.png`,encode(sheet));
