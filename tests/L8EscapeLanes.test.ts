import {describe,it,expect} from 'vitest';
import {generateRun} from '../src/game/roguelike/run';
import {createExpeditionGeometry,canOccupyExpedition,canTraverseExpedition} from '../src/game/world/expeditionGeometry';

/** Engagement reserves a forward half-plane after finding one of sixteen
 * swept-clear110-unit marine escape rays. Cover the actual layout input to
 * that invariant independently of a successful enemy-contact opportunity. */
describe('L8 dense marine escape-lane geometry',()=>{
 it.each(generateRun(1729,3).nodes)('$templateId offers a native escape ray from dense legal marine positions',node=>{
  const g=createExpeditionGeometry(node),failures:unknown[]=[];let positions=0;
  for(let y=48;y<g.bounds.height;y+=80)for(let x=48;x<g.bounds.width;x+=80){
   const p={x,y};if(!canOccupyExpedition(g,p,16))continue;positions++;
   for(const phase of [0,Math.PI/16]){
    let clear=false;
    for(let i=0;i<16;i++){const a=phase+i*Math.PI/8;
     if(canTraverseExpedition(g,p,{x:x+Math.cos(a)*110,y:y+Math.sin(a)*110},16)){clear=true;break;}
    }
    if(!clear)failures.push({x,y,phase});
   }
  }
  expect(positions).toBeGreaterThan(20);expect(failures).toEqual([]);
 });
});
