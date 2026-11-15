import {beforeAll,expect,it} from 'vitest';
import {loadModels} from './loadModels';
import {WARNING_FRAME_LOWEST} from '../src/render/world/WarningRepeaters';
import {alien,disposeModel} from '../src/render/models';
beforeAll(loadModels);
it('records native ordinary, elite and champion body height envelopes for the overhead clearance',()=>{
 let max=0;
 for(const family of ['crawler','stalker','spitter','brute','carrier'])for(const elite of [false,true]){
  const model=alien(family,elite);max=Math.max(max,model.height);
  if(family==='brute'||family==='carrier'){model.setThreat?.(0,null,family==='brute'?'warden':'matron');max=Math.max(max,model.height);}disposeModel(model.root);
 }
 expect(max+.5).toBeLessThan(WARNING_FRAME_LOWEST);
});
