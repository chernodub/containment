let renderDiagnostics: (()=>unknown) | undefined;
/** Presentation diagnostics are folded into the existing public performance snapshot. */
export function setRenderDiagnostics(provider?:()=>unknown):void { renderDiagnostics=provider; }
/** Cap presentation at 60 Hz while retaining elapsed time on 120/144 Hz displays. */
export class FramePacer {
 private previous:number|null=null;private credit=0;private sinceRender=0;
 reset(){this.previous=null;this.credit=this.sinceRender=0;}
 sample(now:number):number|null{
  if(this.previous===null){this.previous=now;return 1/60;}
  const elapsed=Math.max(0,(now-this.previous)/1000);this.previous=now;
  this.credit+=elapsed;this.sinceRender+=elapsed;
  // RAF timestamps on high-refresh desktops jitter around the 60 Hz boundary.
  // Permit at most2ms of early presentation and carry that debt; clamping it
  // away produces repeated25ms/8ms pairs despite a healthy60fps average.
  if(this.credit<1/60-.002)return null;
  const dt=this.sinceRender;this.sinceRender=0;this.credit=elapsed>.1?0:(this.credit-1/60)%(1/60);return dt;
 }
}
export type GraphicsTier='high'|'low';

/** Local, on-demand diagnostics. No per-frame logging, network calls, or HUD allocation. */
export class FrameDiagnostics {
 private frame=new Float32Array(120);private update=new Float32Array(120);private render=new Float32Array(120);private cursor=0;private count=0;private stalls=0;
 record(frameMs:number,updateMs:number,renderMs:number){const i=this.cursor++%120;this.frame[i]=frameMs;this.update[i]=updateMs;this.render[i]=renderMs;this.count=Math.min(120,this.count+1);if(frameMs>50)this.stalls++;}
 get snapshot(){const stats=(a:Float32Array)=>{const values=Array.from(a.subarray(0,this.count)).sort((a,b)=>a-b);return{average:values.reduce((n,x)=>n+x,0)/(values.length||1),p95:values[Math.max(0,Math.ceil(values.length*.95)-1)]??0};};return{renderPipeline:renderDiagnostics?.(),samples:this.count,stallsOver50ms:this.stalls,frameMs:stats(this.frame),updateMs:stats(this.update),renderSubmissionMs:stats(this.render)};}
}

/** Deterministic resource guards and measured desktop timing acceptance targets. */
export const RENDER_BUDGET = Object.freeze({
 highFrameP50Ms: 16.7,
 highFrameP95Ms: 20,
 lowFrameP50Ms: 16.7,
 // Adaptive operating point, not the external frame acceptance limit. Keep
 // ~1.2ms nominal GPU headroom at60Hz; overload remains target+1ms.
 gpuTargetMs: 15.5,
 drawCalls: 330,
 programs: 400,
 materialFamilies: 160,
 compilePasses: 12,
 preparationMs: 3000,
 adaptiveMinScale: .8,
 adaptiveMaxScale: 1,
});
