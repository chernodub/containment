import sharp from 'sharp';
const [out, crop, ...files] = process.argv.slice(2);
const [l,t,w,h] = crop.split(',').map(Number);
const tiles = [];
for (const f of files) tiles.push(await sharp(f).extract({left:l,top:t,width:w,height:h}).toBuffer());
const cols = 2, rows = Math.ceil(tiles.length/cols);
await sharp({create:{width:w*cols,height:h*rows,channels:4,background:'#000'}}).composite(tiles.map((b,i)=>({input:b,left:(i%cols)*w,top:Math.floor(i/cols)*h}))).png().toFile(out);
