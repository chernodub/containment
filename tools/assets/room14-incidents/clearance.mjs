// Use the same circle sweeps as native movement, including diagonal grid edges.
// Anchor endpoints are exact; the grid only supplies candidate paths between them.
export function reachableFromSpawn(api,geometry,radius){
  const pitch=16,cols=Math.ceil(geometry.bounds.width/pitch),rows=Math.ceil(geometry.bounds.height/pitch);
  const start=geometry.playerSpawn,seen=new Uint8Array(cols*rows),clear=new Int8Array(cols*rows),queue=[];
  const point=i=>({x:(i%cols+.5)*pitch,y:(Math.floor(i/cols)+.5)*pitch});
  const near=p=>{
    const candidates=[];
    for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++){
      const x=Math.floor(p.x/pitch)+i,y=Math.floor(p.y/pitch)+j;
      if(x>=0&&y>=0&&x<cols&&y<rows)candidates.push(y*cols+x);
    }
    return candidates;
  };
  for(const cell of near(start))if(api.traverse(geometry,start,point(cell),radius)){seen[cell]=1;queue.push(cell);}
  for(let head=0;head<queue.length;head++){
    const cell=queue[head],p=point(cell);
    for(const [i,j] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){
      const x=cell%cols+i,y=Math.floor(cell/cols)+j,next=y*cols+x;
      if(x<0||x>=cols||y<0||y>=rows||seen[next]||clear[next]===-1)continue;
      const q=point(next);
      if(!clear[next])clear[next]=api.occupy(geometry,q,radius)?1:-1;
      if(clear[next]===1&&api.traverse(geometry,p,q,radius)){seen[next]=1;queue.push(next);}
    }
  }
  return p=>near(p).some(cell=>seen[cell]&&api.traverse(geometry,point(cell),p,radius));
}

function breachEntry(api,geometry,b,radius){
  const at={x:b.x+(b.facing==='east'?56:-56),y:b.y};
  for(let i=0;i<25;i++){
    const distance=i?20+Math.sqrt(i)*18:0,angle=i*2.399;
    const p={x:at.x+Math.cos(angle)*distance,y:at.y+Math.sin(angle)*distance};
    if(api.occupy(geometry,p,radius)&&Math.hypot(p.x-geometry.playerSpawn.x,p.y-geometry.playerSpawn.y)>radius+16+80)return p;
  }
}

// Diameter of the widest native body that can cross each authored opening.
// Measure at two-unit intervals along the span, capped by its designed width.
function openingWidths(api,g,openings){
  return openings.map(({from,to})=>{
    const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);
    let best=0;
    for(let i=0;i<=Math.ceil(length/2);i++){
      const t=i/Math.ceil(length/2),p={x:from.x+t*dx,y:from.y+t*dy};
      let lo=0,hi=Math.floor(length/2);
      while(lo<hi){const r=Math.ceil((lo+hi)/2);if(api.occupy(g,p,r))lo=r;else hi=r-1;}
      best=Math.max(best,lo*2);
    }
    return best;
  });
}

export function roomClearance(api,t,plan,radius){
  const before=api.geometry({...t,incidentObstacles:[]},t.id),after=api.geometry(t,t.id);
  const rows=[before,after].map(g=>{
    const reachable=reachableFromSpawn(api,g,radius);
    const entries=g.breaches.map(b=>breachEntry(api,g,b,radius));
    const anchors=[g.exitPoint,...entries];
    if(t.id==='safety-interlock-station')anchors.push({x:t.spawn.x+48,y:t.spawn.y});
    const reachFromArena=reachableFromSpawn(api,{...g,playerSpawn:plan.arena},radius);
    const reachFromEntrance=reachableFromSpawn(api,g,16);
    const nativeReached=[reachFromEntrance(g.exitPoint),...entries.map(p=>Boolean(p&&reachFromArena(p)))];
    if(t.id==='safety-interlock-station')nativeReached.push(reachFromEntrance({x:t.spawn.x+48,y:t.spawn.y}));
    const reached=anchors.map(p=>Boolean(p&&reachable(p)));
    const markers=g.breaches.map(p=>reachable(p));
    return {entries,reached,nativeReached,markers,reachable:reached.filter(Boolean).length,total:anchors.length,
      marker:markers.filter(Boolean).length,
      width:openingWidths(api,g,plan.openings)};
  });
  const [base,head]=rows,oldMinimum=Math.min(...base.width.filter(w=>w>=2*radius));
  let loss=0;
  for(let i=0;i<base.width.length;i++)if(base.width[i]>=2*radius&&head.width[i]<oldMinimum)loss++;
  return {id:t.id,radius,base,head,oldMinimum,loss,anchorsLost:base.reached.some((was,i)=>was&&!head.reached[i])||base.nativeReached.some((was,i)=>was&&!head.nativeReached[i])||base.markers.some((was,i)=>was&&!head.markers[i])};
}

// A charge locks a direction. Check straight approaches from each legal
// Warden breach entry and from the arena toward that entry or a cardinal wall.
export function chargeLanes(api,t,plan){
  const before=api.geometry({...t,incidentObstacles:[]},t.id),after=api.geometry(t,t.id);
  const r=64,start=plan.arena,entries=before.breaches.map(b=>breachEntry(api,before,b,r)).filter(Boolean);
  let checked=0,shortened=0;const segments=[];
  for(const p of [start,...entries]){
    const toward=p===start?entries:[start];
    const angles=[0,Math.PI/2,Math.PI,Math.PI*1.5,...toward.map(q=>Math.atan2(q.y-p.y,q.x-p.x))];
    for(const a of angles){
      if(!api.occupy(before,p,r))continue;
      let length=0;
      for(let n=4;n<=216;n+=4){
        if(!api.traverse(before,p,{x:p.x+n*Math.cos(a),y:p.y+n*Math.sin(a)},r))break;
        length=n;
      }
      if(!length||length===216)continue; // Only a charge that reaches a wall can earn the wall stun.
      checked++;segments.push([p.x,p.y,p.x+length*Math.cos(a),p.y+length*Math.sin(a)]);
      if(!api.traverse(after,p,{x:p.x+length*Math.cos(a),y:p.y+length*Math.sin(a)},r))shortened++;
    }
  }
  return {checked,shortened,segments};
}

// Measure wall-to-wall cross sections in both deck axes. Include every
// change of rectangular edge and samples along chamfers. Reject blind tips
// that cannot contain a marine. Authored openings are checked separately.
export function deckLaneWidth(api,g){
  const rect=r=>[{x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x+r.width,y:r.y+r.height},{x:r.x,y:r.y+r.height}];
  const polys=[g.boundary??rect(g.bounds),...g.voids??[],...g.blockers.map(rect)];
  let minimum=Infinity;
  for(const [across,along] of [['x','y'],['y','x']]){
    const size=across==='x'?g.bounds.width:g.bounds.height,stations=new Set();
    for(let i=0;i<size;i+=4)stations.add(i+.01);
    for(const poly of polys)for(const p of poly)for(const d of [-.01,.01])if(p[across]+d>0&&p[across]+d<size)stations.add(p[across]+d);
    for(const station of stations){
      const ends=[];
      for(const poly of polys)for(let i=0;i<poly.length;i++){
        const p=poly[i],q=poly[(i+1)%poly.length];
        if((p[across]>station)===(q[across]>station))continue;
        ends.push(p[along]+(station-p[across])*(q[along]-p[along])/(q[across]-p[across]));
      }
      ends.sort((a,b)=>a-b);
      for(let i=1;i<ends.length;i++){
        const w=ends[i]-ends[i-1];if(w<32||w>=minimum)continue;
        if(api.occupy(g,{[across]:station,[along]:(ends[i]+ends[i-1])/2},16))minimum=w;
      }
    }
  }
  return minimum;
}
