import {test} from 'vitest';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {activeSelectedContactIds,missingSelectedContactIds} from './i10-selected-contacts.mjs';
const receipt=(contacts,selectedIds,focusedPair=false,focusContactId=-1)=>({contacts,selectedIds,focusedPair,focusContactId,fit:true});

test('zero-contact six-slot padding does not invent a missing Queen; raw receipt is retained',()=>{
 const f=receipt(0,[-1,-1,-1,-1,-1,-1]),raw=structuredClone(f);
 const selected=activeSelectedContactIds(f);
 assert.deepEqual(selected,[]);assert.deepEqual(missingSelectedContactIds(selected,[]),[]);assert.deepEqual(f,raw);
});
test('only the active positive prefix is selected and missing active positives fail',()=>{
 const selected=activeSelectedContactIds(receipt(2,[21,34,-1,-1,-1,-1]));
 assert.deepEqual(selected,[21,34]);assert.deepEqual(missingSelectedContactIds(selected,[{id:21}]),[34]);
 assert.deepEqual(missingSelectedContactIds(selected,[{id:21},{id:34}]),[]);
});
test('focused Queen -1 remains active and requires actual body evidence',()=>{
 const selected=activeSelectedContactIds(receipt(1,[-1,-1,-1,-1,-1,-1],true,-1));
 assert.deepEqual(selected,[-1]);assert.deepEqual(missingSelectedContactIds(selected,[]),[-1]);
 assert.deepEqual(missingSelectedContactIds(selected,[{id:-1,bounds:{left:10,right:20,top:10,bottom:30}}]),[]);
});
test('nonfocused active -1 is a real selection, never discarded by sign',()=>{
 const selected=activeSelectedContactIds(receipt(2,[4,-1,-1,-1,-1,-1]));
 assert.deepEqual(selected,[4,-1]);assert.deepEqual(missingSelectedContactIds(selected,[{id:4}]),[-1]);
});
test('focused fallback selects its active contact while preserving the full raw prefix',()=>{
 const f=receipt(3,[3,7,9,-1,-1,-1],true,7),raw=structuredClone(f);
 assert.deepEqual(activeSelectedContactIds(f),[7]);assert.deepEqual(f,raw);
});
test('malformed counts, IDs or focused slots throw rather than silently passing',()=>{
 for(const count of [undefined,null,-1,.5,7,NaN,Infinity,'0'])assert.throws(()=>activeSelectedContactIds(receipt(count,[-1,-1,-1,-1,-1,-1])),/count/);
 assert.throws(()=>activeSelectedContactIds(receipt(2,[4])),/count/);
 assert.throws(()=>activeSelectedContactIds(receipt(1,[undefined])),/ID/);
 assert.throws(()=>activeSelectedContactIds(receipt(1,[-2])),/ID/);
 assert.throws(()=>activeSelectedContactIds(receipt(0,[-1],true,-1)),/focused contact/);
 assert.throws(()=>activeSelectedContactIds(receipt(1,[4,-1],true,-1)),/focused contact/);
 assert.throws(()=>activeSelectedContactIds(undefined),/missing framing/);
});
test('both acceptance consumers use the shared prefix and missing-ID contracts',async()=>{
 for(const name of ['i10-summary.mjs','i10-art-audit.mjs']){
  const source=await readFile(new URL(name,import.meta.url),'utf8');
  assert.match(source,/import \{activeSelectedContactIds,missingSelectedContactIds\} from '\.\/i10-selected-contacts\.mjs'/);
  assert.match(source,/selected(?:Ids)?=activeSelectedContactIds\(/);
  assert.match(source,/missingSelectedIds=missingSelectedContactIds\(/);
 }
});
