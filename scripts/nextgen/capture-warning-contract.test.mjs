import assert from 'node:assert/strict';
import {test} from 'vitest';
import {assertNativeWarning} from './capture-warning-contract.mjs';
const evidence=()=>({g6FramingProof:{insets:{left:0,right:292,top:182,bottom:120},viewport:{width:1920,height:1080}},warningProof:{faded:false,opacity:.96,panels:[{corners:[[-.2,-.2,.99],[.2,-.2,.99],[.2,.2,.99],[-.2,.2,.99]]}]}});
test('native warning accepts complete quiet quads and preserves actor-aware combat fading',()=>{
 const e=evidence();assertNativeWarning(e,'quiet',{quiet:true});e.warningProof.faded=true;e.warningProof.opacity=.04;assertNativeWarning(e,'combat');assert.throws(()=>assertNativeWarning(e,'quiet',{quiet:true}),/quiet marine/);
});
test('native warning rejects a real right-HUD overrun independently of player and CPU point guards',()=>{
 const e=evidence();e.warningProof.panels[0].corners[2][0]=.728;assert.throws(()=>assertNativeWarning(e,'clipped'),/complete actual warning quad/);
 e.warningProof.panels.push({corners:[[-.5,-.3,.99],[-.1,-.3,.99],[-.1,.1,.99],[-.5,.1,.99]]});assertNativeWarning(e,'second physical repeater',{quiet:true});
});
