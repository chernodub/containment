import {inflateSync,deflateSync} from 'node:zlib';
export function decode(png){
 const width=png.readUInt32BE(16),height=png.readUInt32BE(20),channels=png[25]===6?4:3,chunks=[];
 if(png[24]!==8||![2,6].includes(png[25])||png[28])throw Error('Unsupported PNG');
 for(let p=8;p<png.length;){const n=png.readUInt32BE(p);if(png.toString('ascii',p+4,p+8)==='IDAT')chunks.push(png.subarray(p+8,p+8+n));p+=n+12;}
 const raw=inflateSync(Buffer.concat(chunks)),stride=width*channels,pixels=Buffer.alloc(height*stride);let offset=0;
 for(let y=0;y<height;y++){const filter=raw[offset++],row=y*stride;for(let x=0;x<stride;x++){
  const a=x>=channels?pixels[row+x-channels]:0,b=y?pixels[row+x-stride]:0,c=y&&x>=channels?pixels[row+x-stride-channels]:0;
  let prediction=0;if(filter===1)prediction=a;else if(filter===2)prediction=b;else if(filter===3)prediction=(a+b)>>1;else if(filter===4){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);prediction=pa<=pb&&pa<=pc?a:pb<=pc?b:c;}
  pixels[row+x]=(raw[offset++]+prediction)&255;
 }}
 return{width,height,pixels,channels,luma(x,y){const i=(Math.max(0,Math.min(height-1,Math.round(y)))*width+Math.max(0,Math.min(width-1,Math.round(x))))*channels;return pixels[i]*.2126+pixels[i+1]*.7152+pixels[i+2]*.0722;}};
}
const glyphs={
  A:'01110/10001/10001/11111/10001/10001/10001',B:'11110/10001/10001/11110/10001/10001/11110',C:'01111/10000/10000/10000/10000/10000/01111',
  D:'11110/10001/10001/10001/10001/10001/11110',E:'11111/10000/10000/11110/10000/10000/11111',F:'11111/10000/10000/11110/10000/10000/10000',
  G:'01111/10000/10000/10111/10001/10001/01110',H:'10001/10001/10001/11111/10001/10001/10001',I:'11111/00100/00100/00100/00100/00100/11111',
  J:'00111/00010/00010/00010/10010/10010/01100',K:'10001/10010/10100/11000/10100/10010/10001',L:'10000/10000/10000/10000/10000/10000/11111',
  M:'10001/11011/10101/10101/10001/10001/10001',N:'10001/11001/10101/10011/10001/10001/10001',O:'01110/10001/10001/10001/10001/10001/01110',
  P:'11110/10001/10001/11110/10000/10000/10000',Q:'01110/10001/10001/10001/10101/10010/01101',R:'11110/10001/10001/11110/10100/10010/10001',
  S:'01111/10000/10000/01110/00001/00001/11110',T:'11111/00100/00100/00100/00100/00100/00100',U:'10001/10001/10001/10001/10001/10001/01110',
  V:'10001/10001/10001/10001/10001/01010/00100',W:'10001/10001/10001/10101/10101/10101/01010',X:'10001/10001/01010/00100/01010/10001/10001',
  Y:'10001/10001/01010/00100/00100/00100/00100',Z:'11111/00001/00010/00100/01000/10000/11111',
'0':'01110/10001/10011/10101/11001/10001/01110','1':'00100/01100/00100/00100/00100/00100/01110','2':'01110/10001/00001/00010/00100/01000/11111','3':'11110/00001/00001/01110/00001/00001/11110','4':'00010/00110/01010/10010/11111/00010/00010','5':'11111/10000/10000/11110/00001/00001/11110','6':'01110/10000/10000/11110/10001/10001/01110','7':'11111/00001/00010/00100/01000/01000/01000','8':'01110/10001/10001/01110/10001/10001/01110','9':'01110/10001/10001/01111/00001/00001/01110','-':'00000/00000/00000/11111/00000/00000/00000','.':'00000/00000/00000/00000/00000/00100/00100','/':'00001/00001/00010/00100/01000/10000/10000'};

export function canvas(width,height){return{width,height,pixels:Buffer.alloc(width*height*3,18),channels:3};}
export function drawText(target,text,x,y,color=[216,233,238],scale=2){
 for(const char of text.toUpperCase()){const rows=glyphs[char]?.split('/');if(rows)for(let cy=0;cy<7;cy++)for(let cx=0;cx<5;cx++)if(rows[cy][cx]==='1')for(let sy=0;sy<scale;sy++)for(let sx=0;sx<scale;sx++){const px=x+cx*scale+sx,py=y+cy*scale+sy;if(px<0||px>=target.width||py<0||py>=target.height)continue;const i=(py*target.width+px)*3;for(let c=0;c<3;c++)target.pixels[i+c]=color[c];}x+=6*scale;}
}
export function drawImage(target,source,x,y,width,height){
 // A native-size copy must preserve every column/row. Floating division then
 // multiplication can put an exact integer just below its value before floor.
 for(let dy=0;dy<height;dy++)for(let dx=0;dx<width;dx++){const sy=source.height===height?dy:Math.min(source.height-1,Math.floor(dy/height*source.height)),sx=source.width===width?dx:Math.min(source.width-1,Math.floor(dx/width*source.width)),s=(sy*source.width+sx)*source.channels,t=((y+dy)*target.width+x+dx)*3;target.pixels[t]=source.pixels[s];target.pixels[t+1]=source.pixels[s+1];target.pixels[t+2]=source.pixels[s+2];}
}
const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function chunk(name,data){const type=Buffer.from(name),body=Buffer.concat([type,data]),result=Buffer.alloc(data.length+12);result.writeUInt32BE(data.length);body.copy(result,4);let crc=0xffffffff;for(const b of body)crc=crcTable[(crc^b)&255]^(crc>>>8);result.writeUInt32BE((crc^0xffffffff)>>>0,result.length-4);return result;}
export function encode(image){const header=Buffer.alloc(13);header.writeUInt32BE(image.width);header.writeUInt32BE(image.height,4);header[8]=8;header[9]=2;const stride=image.width*3,raw=Buffer.alloc((stride+1)*image.height);for(let y=0;y<image.height;y++)image.pixels.copy(raw,y*(stride+1)+1,y*stride,(y+1)*stride);return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw,{level:2})),chunk('IEND',Buffer.alloc(0))]);}
