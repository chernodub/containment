/** Renderer-only HUD contract fixtures. Native game actions and legal kiting; never organic balance evidence. */
export function registerG6Scenarios(scenarios,stageGraphicsKiting,arenas={}){
 const insets=`const d=window.__containmentDebug,r=d.renderer;const w=r.viewportWidth,h=r.viewportHeight;r.setHudInsets?.({top:0,right:300*w/1920,bottom:160*h/1080,left:280*w/1920});`;
 scenarios.push({id:'g6-calm',rooms:true,state:'playing',setup:new Function('room',`return (async()=>{${insets}await d.gotoRoom(room);d.invulnerable(true);d.measureLuminance=true;d.refresh();})();`)});
 scenarios.push({id:'dress13-kiting',diagnosticOnly:true,rooms:true,state:'playing',phase:'combat',burst:true,setup:new Function('room',`return (async()=>{${insets}await (${stageGraphicsKiting.toString()})(room,{tier:'high',count:20,arena:${JSON.stringify(arenas)}[room]});d.step(['communal-atrium','manual-control-chamber'].includes(room)?300:650);d.refresh();})();`)});
 scenarios.push({id:'g6-kiting',rooms:true,state:'playing',phase:'combat',burst:true,setup:new Function('room',`return (async()=>{${insets}await (${stageGraphicsKiting.toString()})(room,{tier:'high',arena:${JSON.stringify(arenas)}[room]});d.step(650);d.refresh();})();`)});
}
