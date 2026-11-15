import {expect, it} from 'vitest';
import {PresentationHold} from './PresentationHold';

it('caps and rate limits the presentation clock while consuming real frame time',()=>{
  const hold=new PresentationHold();hold.request(1,1,false);
  expect(hold.advance(.02,1,false)).toBe(0);
  hold.request(.045,1,false);
  expect(hold.advance(.04,1,false)).toBeCloseTo(.015);
  hold.request(.045,1,false);expect(hold.advance(.1,1,false)).toBe(.1);
  hold.advance(.6,1,false);hold.request(.045,.5,false);
  expect(hold.advance(.03,.5,false)).toBeCloseTo(.0075);
});

it('clears latent holds immediately at zero shake or reduced motion',()=>{
  for(const reduced of [true,false]){
    const hold=new PresentationHold();hold.request(.045,1,false);
    expect(hold.advance(.01,reduced?1:0,reduced)).toBe(.01);
    expect(hold.advance(.01,1,false)).toBe(.01);
  }
});
