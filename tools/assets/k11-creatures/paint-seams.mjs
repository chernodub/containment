/** Relax a painted trim along the mesh surface before packing. Junctions and
 * borders between different pieces of anatomy keep their authored positions. */
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
      vertices.push({point, start:point, neighbours:new Set(), borders:new Set(), zones:new Set()});
    }
    vertexIds.push(byPosition.get(key));
  }
  for (let i = 0; i < index.length; i += 3) {
    const zone = zones.getScalar(index[i]);
    for (let j = 0; j < 3; j++) {
      const vertex = vertices[vertexIds[index[i + j]]];
      vertex.zones.add(zone);
      vertex.neighbours.add(vertexIds[index[i + (j + 1) % 3]]);
      vertex.neighbours.add(vertexIds[index[i + (j + 2) % 3]]);
    }
  }
  for (const vertex of vertices) {
    if (vertex.zones.size !== 2) continue;
    const [a,b] = vertex.zones;
    if ((a >> 4) !== (b >> 4)) continue;
    for (const id of vertex.neighbours) {
      const adjacent = vertices[id].zones;
      if (adjacent.has(a) && adjacent.has(b)) vertex.borders.add(id);
    }
  }
  // The short local chord removes sawteeth. Limit travel to a fraction
  // of the original span so a narrow bevel cannot collapse into its crown.
  const seam = vertices.filter(v => v.borders.size === 2);
  for (let pass = 0; pass < 5; pass++) {
    const next = seam.map(v => {
      const [a,b] = [...v.borders].map(i => vertices[i].point);
      const span = Math.hypot(...a.map((x,k) => x-b[k]));
      const delta = a.map((x,k) => .70*((x+b[k])*.5-v.point[k])+v.point[k]-v.start[k]);
      const scale = Math.min(1, .50*span/Math.max(.00001,Math.hypot(...delta)));
      return v.start.map((x,k) => x+scale*delta[k]);
    });
    seam.forEach((v,i) => { v.point = next[i]; });
  }
  vertexIds.forEach((id,i) => positions.setElement(i, vertices[id].point));
}
