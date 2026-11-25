#!/usr/bin/env node
/** CREATURE29: print a packed creature GLB's rig fingerprint (joint names, parents, rest TRS, inverse binds) and each
 * mesh's vertical extent, so a geometry pass can show the skeleton and heights did not move.
 * node tools/assets/k11-creatures/creature26/rig.mjs public/assets/models/tyrant.glb */
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'meshoptimizer';
import {createHash} from 'node:crypto';
await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
const doc=await io.read(process.argv[2]);const root=doc.getRoot();
for(const skin of root.listSkins()){const joints=skin.listJoints();const h=createHash('sha256');
 for(const j of joints)h.update(JSON.stringify([j.getName(),j.getParentNode()?.getName()??null,j.getTranslation().map(v=>v.toFixed(6)),j.getRotation().map(v=>v.toFixed(6)),j.getScale().map(v=>v.toFixed(6))]));
 const ibm=skin.getInverseBindMatrices();if(ibm)h.update(Array.from(ibm.getArray(),v=>v.toFixed(6)).join(','));
 console.log(`skin ${skin.getName()||'-'} joints=${joints.length} rig=${h.digest('hex').slice(0,16)}`);}
for(const node of root.listNodes()){const mesh=node.getMesh();if(!mesh)continue;let lo=Infinity,hi=-Infinity,n=0;
 for(const p of mesh.listPrimitives()){const a=p.getAttribute('POSITION');const e=[0,0,0];for(let i=0;i<a.getCount();i++){a.getElement(i,e);lo=Math.min(lo,e[1]);hi=Math.max(hi,e[1]);}n+=a.getCount();}
 console.log(`mesh ${node.getName()} verts=${n} y=[${lo.toFixed(6)}, ${hi.toFixed(6)}] height=${(hi-lo).toFixed(6)}`);}
