import {expect,it} from 'vitest';
// @ts-expect-error Capture tooling intentionally stays plain JavaScript.
import {assertPriorityPair} from '../scripts/nextgen/i10-framing-contract.mjs';
const viewport={width:1920,height:1080};
function proof(){return{g6FramingProof:{framing:{focusedPair:true,focusContactId:1,selectedIds:[1],fit:false},contacts:[{id:1,insideUsable:false}]},roomFraming:{heroPixels:111.2181868,smallX:false,smallZ:false,outsideX:0,outsideZ:0,outside:0},marineBounds:{top:500,bottom:705},ui:{threatMarkers:[{enemyId:1,opacity:1,bounds:{left:500,top:1000,right:532,bottom:1032}}]}};}
it('retains remote danger through its native bearing while preserving C6 scale and room constraints',()=>{expect(()=>assertPriorityPair(proof(),viewport)).not.toThrow();});
it('rejects a lost, faded or unrelated remote danger bearing',()=>{for(const change of ['missing','faded','wrong'] as const){const p=proof();if(change==='missing')p.ui.threatMarkers=[];if(change==='faded')p.ui.threatMarkers[0].opacity=.3;if(change==='wrong')p.ui.threatMarkers[0].enemyId=2;expect(()=>assertPriorityPair(p,viewport)).toThrow(/danger bearing/);}});
it('does not trade the hero floor or room area for a remote contact',()=>{for(const change of ['size','area'] as const){const p=proof();if(change==='size')p.roomFraming.heroPixels=70;else p.roomFraming.outside=.3;expect(()=>assertPriorityPair(p,viewport)).toThrow();}});
it('requires native selected-body receipts even when the camera reports a fit',()=>{const p=proof();p.g6FramingProof.framing.fit=true;p.g6FramingProof.contacts=[];expect(()=>assertPriorityPair(p,viewport)).toThrow(/missing selected contact/);});
it('accepts a genuinely fitted body without requiring an offscreen warning',()=>{const p=proof();p.g6FramingProof.contacts[0].insideUsable=true;p.ui.threatMarkers=[];expect(()=>assertPriorityPair(p,viewport)).not.toThrow();});
