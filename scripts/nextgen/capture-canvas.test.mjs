import {describe,it,expect} from 'vitest';
import {assertCaptureCanvas} from './capture-canvas.mjs';

const viewport={width:1920,height:1080};
const normalOptions={scenarioId:'combat-calm',viewport,dpr:1,name:'normal'};
const voidOptions={scenarioId:'g3-void-contours',viewport,dpr:1,name:'void'};
function evidence(colors=6){
  return{
    canvas:{colors,litSamples:576,contextLost:false,error:0},
    voidContourProof:{width:1920,height:1080,actorPixels:1500,darkenedActorPixels:100,backgroundPixels:1920*1080-1500,compiled:0},
  };
}

describe('capture canvas liveness contracts',()=>{
  it('retains the greater-than-eight palette guard for ordinary captures',()=>{
    const rich=evidence(9);delete rich.voidContourProof;
    expect(()=>assertCaptureCanvas(rich,normalOptions)).not.toThrow();
    expect(()=>assertCaptureCanvas(evidence(8),normalOptions)).toThrow(/missing\/invalid canvas pixels/);
    expect(()=>assertCaptureCanvas(evidence(6),{...normalOptions,scenarioId:'g3-geometry-coverage'})).toThrow(/missing\/invalid canvas pixels/);
  });

  it('accepts the isolated gray void only with a full native contour proof',()=>{
    expect(()=>assertCaptureCanvas(evidence(),voidOptions)).not.toThrow();
    const boundary=evidence(2);Object.assign(boundary.voidContourProof,{actorPixels:100,darkenedActorPixels:30,backgroundPixels:1920*1080-100});boundary.canvas.litSamples=1;
    expect(()=>assertCaptureCanvas(boundary,voidOptions)).not.toThrow();
  });

  it('compares proof dimensions to viewport times DPR, rather than a hardcoded resolution',()=>{
    const highDpr=evidence();Object.assign(highDpr.voidContourProof,{width:3840,height:2160,backgroundPixels:3840*2160-1500});
    expect(()=>assertCaptureCanvas(highDpr,{...voidOptions,dpr:2})).not.toThrow();
    expect(()=>assertCaptureCanvas(evidence(),{...voidOptions,dpr:2})).toThrow(/dimensions do not match/);
  });

  it.each([0,1])('rejects a blank void palette of %i bins despite a stale-looking contour proof',colors=>{
    expect(()=>assertCaptureCanvas(evidence(colors),voidOptions)).toThrow(/blank isolated void canvas/);
  });

  it('rejects black samples and missing proof even when the gray palette has several bins',()=>{
    const black=evidence();black.canvas.litSamples=0;
    expect(()=>assertCaptureCanvas(black,voidOptions)).toThrow(/blank isolated void canvas/);
    const missing=evidence();delete missing.voidContourProof;
    expect(()=>assertCaptureCanvas(missing,voidOptions)).toThrow(/missing native void contour proof/);
    expect(()=>assertCaptureCanvas({},voidOptions)).toThrow(/missing canvas evidence/);
  });

  it.each([normalOptions,voidOptions])('never bypasses a lost context or WebGL error for $name',options=>{
    const lost=evidence(12);lost.canvas.contextLost=true;
    expect(()=>assertCaptureCanvas(lost,options)).toThrow(/invalid canvas context\/GL state/);
    const error=evidence(12);error.canvas.error=1282;
    expect(()=>assertCaptureCanvas(error,options)).toThrow(/invalid canvas context\/GL state/);
    const absent=evidence(12);delete absent.canvas.contextLost;
    expect(()=>assertCaptureCanvas(absent,options)).toThrow(/invalid canvas context\/GL state/);
  });

  it.each([
    ['width',1280],['height',720],['width',undefined],['height',1080.5],
  ])('rejects missing or stale native dimensions: %s=%s',(field,value)=>{
    const stale=evidence();stale.voidContourProof[field]=value;
    expect(()=>assertCaptureCanvas(stale,voidOptions)).toThrow(/void contour|dimensions do not match/);
  });

  it.each([
    ['actorPixels',99],['darkenedActorPixels',29],['darkenedActorPixels',1501],
    ['backgroundPixels',1920*1080*.5-1],['backgroundPixels',1920*1080],['compiled',1],
  ])('rejects an invalid full-native contour proof: %s=%s',(field,value)=>{
    const invalid=evidence(12);invalid.voidContourProof[field]=value;
    expect(()=>assertCaptureCanvas(invalid,voidOptions)).toThrow();
  });

  it.each([
    ['actorPixels',NaN],['actorPixels',Infinity],['actorPixels',100.5],['actorPixels',-1],
    ['darkenedActorPixels','100'],['backgroundPixels',NaN],['compiled',.5],
  ])('requires finite integer proof counts: %s=%s',(field,value)=>{
    const invalid=evidence();invalid.voidContourProof[field]=value;
    expect(()=>assertCaptureCanvas(invalid,voidOptions)).toThrow(/invalid void contour/);
  });

  it.each([NaN,Infinity,-1,2.5])('rejects malformed palette counts: %s',colors=>{
    expect(()=>assertCaptureCanvas(evidence(colors),voidOptions)).toThrow(/invalid canvas color count/);
  });

  it('rejects invalid viewport/DPR values instead of accepting a dimensionless proof',()=>{
    expect(()=>assertCaptureCanvas(evidence(),{...voidOptions,viewport:{width:0,height:1080}})).toThrow(/invalid native viewport\/DPR/);
    expect(()=>assertCaptureCanvas(evidence(),{...voidOptions,dpr:NaN})).toThrow(/invalid native viewport\/DPR/);
  });
});
