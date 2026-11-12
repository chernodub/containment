import * as T from 'three';

/** Stable presentation variation; independent of frame order and simulation RNG. */
export function authoredVariation(seed: number, lane = 0): number {
  const n = Math.sin(seed * 12.9898 + lane * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

/** The hot beat lasts two to three 60Hz frames, then the body rapidly takes over. */
export function impactBeat(age: number): number {
  return age < .05 ? 1 : Math.max(0, 1 - (age - .05) / .12);
}

/** Clipped armor section, with broad top/side/bevel planes instead of a bare cube. */
export function createArmorSection(): T.BufferGeometry {
  const section = new T.Shape();
  section.moveTo(-.5, -.34); section.lineTo(-.34, -.5);
  section.lineTo(.34, -.5); section.lineTo(.5, -.34);
  section.lineTo(.5, .34); section.lineTo(.34, .5);
  section.lineTo(-.34, .5); section.lineTo(-.5, .34); section.closePath();
  const g = new T.ExtrudeGeometry(section, { depth: .84, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: .04, bevelThickness: .08, curveSegments: 1 });
  g.translate(0, 0, -.42);
  // Normalize the public unit bounds so existing exact footprint scales stay valid.
  g.computeBoundingBox();
  const box = g.boundingBox!, size = box.getSize(new T.Vector3()), center = box.getCenter(new T.Vector3());
  g.translate(-center.x, -center.y, -center.z); g.scale(1 / size.x, 1 / size.y, 1 / size.z);
  const positions = g.getAttribute('position'), normals = g.getAttribute('normal'), uv = g.getAttribute('uv');
  for (let i = 0; i < positions.count; i++) {
    const nx = Math.abs(normals.getX(i)), ny = Math.abs(normals.getY(i)), nz = Math.abs(normals.getZ(i));
    uv.setXY(i, (nx > ny && nx > nz ? positions.getZ(i) : positions.getX(i)) + .5,
      (ny > nx && ny > nz ? positions.getZ(i) : positions.getY(i)) + .5);
  }
  g.computeBoundingBox();
  return g;
}

/** A fractured block with unequal planes and a broken crown; no pyramid apex. */
export function createFractureMass(): T.BufferGeometry {
  const bottom = [[-.9, -1, -.76], [.68, -1, -.92], [1, -1, .43], [.17, -1, 1], [-.87, -1, .62]];
  const top = [[-.66, .72, -.57], [.39, 1, -.73], [.83, .48, .29], [.12, .87, .76], [-.7, .35, .42]];
  const vertices: number[] = [], uv: number[] = [], edge: number[] = [];
  const triangle = (a: number[], b: number[], c: number[]) => {
    vertices.push(...a, ...c, ...b); uv.push(0, 0, 1, 0, .5, 1);
    edge.push(1, 0, 0, 0, 1, 0, 0, 0, 1);
  };
  for (let i = 0; i < 5; i++) {
    const n = (i + 1) % 5;
    triangle(bottom[i], bottom[n], top[n]); triangle(bottom[i], top[n], top[i]);
  }
  for (let i = 1; i < 4; i++) { triangle(top[0], top[i], top[i + 1]); triangle(bottom[0], bottom[i + 1], bottom[i]); }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setAttribute('fractureEdge', new T.Float32BufferAttribute(edge, 3));
  g.computeVertexNormals(); g.computeBoundingBox();
  return g;
}

/** One authored marine contour: helmet, pauldron, aimed weapon, split stride. */
export function createMarineEcho(): T.BufferGeometry {
  const points = [
    [-.10,.50],[.08,.50],[.13,.43],[.12,.33],[.27,.27],[.28,.18],
    [.48,.18],[.50,.13],[.47,.09],[.23,.09],[.18,.03],[.15,-.12],
    [.28,-.41],[.25,-.49],[.11,-.50],[-.02,-.19],[-.10,-.45],
    [-.21,-.50],[-.30,-.46],[-.25,-.34],[-.21,-.08],[-.24,.08],
    [-.34,.11],[-.32,.26],[-.18,.31],[-.15,.41],
  ];
  const shape = new T.Shape(points.map(([x,y]) => new T.Vector2(x,y)));
  const g = new T.ExtrudeGeometry(shape, { depth: .16, bevelEnabled: false, steps: 1, curveSegments: 1 });
  g.translate(0, 0, -.08);
  return g;
}

/** Three deliberate combustion values; silhouette bites move without boiling noise. */
export const GRAPHIC_FLAME_FRAGMENT = `
 float t=uvLocal.y;float jet=step(100.,phase);float seed=phase-jet*100.;
 float clock=abilityTime*2.4;
 float bend=sin(t*5.4+seed-clock)*(.035+t*.12)+sin(t*12.7-seed+clock*.7)*.045*t;
 float envelope=mix(pow(max(.001,1.-t),.65),(.14+sin(t*3.141593)*.86)*pow(max(.001,1.-t),.25),jet);
 float lobes=.79+.16*sin(t*15.-seed+clock)+.09*sin(t*29.+seed*.7-clock*.6);
 float width=max(.012,envelope*lobes*.77);
 float side=p.x-bend;
 float distance=abs(side)/width;
 // Asymmetric bites interrupt the outside; the pressure throat stays connected.
 float bite1=length(vec2((side-width*.8)/max(.025,width*.45),(t-(.48+.06*sin(seed+clock)))*8.));
 float bite2=length(vec2((side+width*.9)/max(.025,width*.43),(t-(.72+.05*cos(seed-clock)))*10.));
 float contour=max(distance,max(1.-bite1,1.-bite2)*1.45);
 float aa=max(.009,fwidth(contour)*.8);
 float coverage=(1.-smoothstep(1.-aa,1.+aa,contour))*smoothstep(0.,.035,t)*(1.-smoothstep(.94,1.,t));
 if(coverage<.01)discard;
 float body=1.-smoothstep(.70,.74,contour);
 float hot=(1.-smoothstep(.28,.33,distance))*(1.-smoothstep(.28,.70,t));
 c=mix(vec3(.24,.012,.002),vec3(1.65,.25,.008),body);
 c=mix(c,vec3(3.3,2.1,.48),hot*clamp(.55+ink.g,.55,1.));
 a*=coverage*(.90+.10*body)*(.35+.65*flash);
`;

/** Solid-only crease/edge treatment. Gases and electrical light never use this. */
export const GRAPHIC_SOLID_FRAGMENT = `
 float lightBand=dot(normalize(facetNormal),normalize(vec3(-.3,.7,.6)));
 float value=lightBand<.18?.32:(lightBand<.64?.65:1.12);
 c*=value;
 float edge=min(uvLocal.x, min(uvLocal.y,min(1.-uvLocal.x,1.-uvLocal.y)));
 float edgeWidth=max(.004,min(.018,fwidth(edge)*.85));
 float inkEdge=1.-smoothstep(0.,edgeWidth,edge);
 c=mix(c,vec3(.018,.033,.043),inkEdge*.62);
`;
