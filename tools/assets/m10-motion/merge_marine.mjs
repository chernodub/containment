#!/usr/bin/env node
/** Package independently authored action/locomotion clips on the same original nodes. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
const option=(name,fallback)=>process.argv.find(arg=>arg.startsWith(`--${name}=`))?.slice(name.length+3)??fallback;
const inputs=[option('actions','tools/assets/m10-motion/.build/marine-actions-motion.glb'),option('locomotion','tools/assets/m10-motion/.build/marine-locomotion-motion.glb')];
const output=resolve(option('out','public/assets/models/motion/marine-motion.glb'));
function decode(bytes){
 let offset=12,document,binary;
 while(offset<bytes.length){const size=bytes.readUInt32LE(offset),kind=bytes.readUInt32LE(offset+4),data=bytes.subarray(offset+8,offset+8+size);offset+=8+size;if(kind===0x4e4f534a)document=JSON.parse(data.toString());else if(kind===0x004e4942)binary=data;}
 return {document,binary};
}
let combined,parts=[],length=0;
for(const path of inputs){
 const {document,binary}=decode(await readFile(resolve(path)));
 if(!combined){combined=document;parts.push(binary);length=binary.length;continue;}
 const viewOffset=combined.bufferViews.length,accessorOffset=combined.accessors.length;
 const nodes=new Map(combined.nodes.map((node,index)=>[node.name,index]));
 for(const view of document.bufferViews){view.byteOffset=(view.byteOffset??0)+length;view.buffer=0;combined.bufferViews.push(view);}
 for(const accessor of document.accessors){accessor.bufferView+=viewOffset;combined.accessors.push(accessor);}
 for(const animation of document.animations){
  for(const sampler of animation.samplers){sampler.input+=accessorOffset;sampler.output+=accessorOffset;}
  for(const channel of animation.channels){const name=document.nodes[channel.target.node].name;channel.target.node=nodes.get(name);if(channel.target.node===undefined)throw Error(`Animation bone absent from marine skeleton: ${name}`);}
  combined.animations.push(animation);
 }
 parts.push(binary);length+=binary.length;
}
combined.asset.generator='M10 Blender-authored marine actions and eight-way footwork; original source rest retained';
combined.buffers=[{byteLength:length}];
let json=Buffer.from(JSON.stringify(combined));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);
const binary=Buffer.concat(parts),header=Buffer.alloc(12),jHeader=Buffer.alloc(8),bHeader=Buffer.alloc(8);
header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(12+8+json.length+8+binary.length,8);
jHeader.writeUInt32LE(json.length);jHeader.writeUInt32LE(0x4e4f534a,4);bHeader.writeUInt32LE(binary.length);bHeader.writeUInt32LE(0x004e4942,4);
await mkdir(dirname(output),{recursive:true});await writeFile(output,Buffer.concat([header,jHeader,json,bHeader,binary]));
console.log(`${combined.animations.length} authored marine clips → ${output}`);
