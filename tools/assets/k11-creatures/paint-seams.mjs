/** Relax a painted trim along the mesh surface before packing. Three-way junctions anchor the trim to the anatomy. */
export function fairPaintSeams(primitive) {
  const zones = primitive.getAttribute('_HEAVYZONE');
  if (!zones) return;
  const positions = primitive.getAttribute('POSITION');
  const index = primitive.getIndices().getArray();
  const vertices = [], byPosition = new Map(), vertexIds = [];
  for (let i = 0; i < positions.getCount(); i++) {
    const point = positions.getElement(i, []);
    const key = point.join(',');
    if (!byPosition.has(key)) {
      byPosition.set(key, vertices.length);
      vertices.push({point, start:point,  borders:new Set(), zones:new Set()});
    }
    vertexIds.push(byPosition.get(key));
  }
  // Only shared triangle edges are seams. Two adjacent vertices can both
  // touch the same paints without the diagonal between them being a seam.
  const edges = new Map();
  for (let i = 0; i < index.length; i += 3) {
    const zone = zones.getScalar(index[i]);
    for (let j = 0; j < 3; j++) {
      const a = vertexIds[index[i+j]], b = vertexIds[index[i+(j+1)%3]];
      vertices[a].zones.add(zone);
      const key = Math.min(a,b) + ',' + Math.max(a,b);
      if (!edges.has(key)) edges.set(key,zone);
      else if (edges.get(key) !== zone) {
        vertices[a].borders.add(b);
        vertices[b].borders.add(a);
      }
    }
  }
  // Apply a five-tap binomial filter along the actual boundary, including joins
  // between primitives. Its two-ring stencil rounds marching-cell steps.
  const seam = vertices.filter(v => v.borders.size === 2 && v.zones.size === 2);
  for (const v of seam) {
    const [a,b] = [...v.borders].map(id => vertices[id]);
    const beyond = n => n.borders.size === 2 && n.zones.size === 2
      ? vertices[[...n.borders].find(id => vertices[id] !== v)].start : n.start;
    const aa = beyond(a), bb = beyond(b);
    const delta = v.start.map((x,k) =>
      (aa[k]+4*a.start[k]+6*x+4*b.start[k]+bb[k])/16-x);
    // A narrow bevel can border a much larger triangle. Bound travel by
    // the shorter incident edge, preserving the width of that bevel.
    const length = n => Math.hypot(...v.start.map((x,k) => x-n.start[k]));
    const scale = Math.min(1,.55*Math.min(length(a),length(b))/Math.max(1e-8,Math.hypot(...delta)));
    v.point = v.start.map((x,k) => x+delta[k]*scale);
  }
  vertexIds.forEach((id,i) => positions.setElement(i, vertices[id].point));
}
