/** Pixel-space, geometry-only ink shared by both tiers; merged into the grade pass. */
export const inkDeclarations = /* glsl */ `
uniform sampler2D tGeometry;
uniform vec2 inkPixel;
uniform float inkMode;
uniform vec4 inkStyle; // actor width, prop width, opacity, crease strength
vec3 inkNormal(vec2 e) {
 e=e*2.0-1.0;vec3 n=vec3(e,1.0-abs(e.x)-abs(e.y));
 if(n.z<0.0)n.xy=(1.0-abs(n.yx))*sign(n.xy);
 return normalize(n);
}
float inkCoverage(vec2 uv, float depth, vec4 center) {
 if(inkMode<.5||center.z<.5||center.w<1.5||center.w>6.5||abs(center.z-floor(center.z+.5))>.01||abs(center.w-floor(center.w+.5))>.01)return 0.0;
 bool actor=center.w>2.5;
 // Low's silhouette path performs no normal comparisons.
 float width=actor?inkStyle.x:inkStyle.y;
 if(center.w==3.0||center.w>4.5)width*=1.18;
 vec3 p=viewPosition(uv,depth);
 float edge=0.0,crease=0.0;
 vec3 normal=inkNormal(center.xy);
 for(int i=0;i<8;i++) {
  float a=float(i)*.7853981634;
  vec2 offset=vec2(cos(a),sin(a))*inkPixel*width;
  vec2 q=clamp(uv+offset,inkPixel,1.0-inkPixel);
  vec4 neighbor=texture2D(tGeometry,q);neighbor.zw*=255.0;
  float d=texture2D(tDepth,q).x;
  vec3 delta=viewPosition(q,d)-p;
  // Identity compares exact normalized-byte integers, never color/luminance edges.
  float different=step(.5,abs(center.z-neighbor.z));
  float surface=step(.5,neighbor.z)*step(1.0,neighbor.w)*step(neighbor.w,6.5);
  surface*=1.0-step(.01,abs(neighbor.z-floor(neighbor.z+.5)));
  surface*=1.0-step(.01,abs(neighbor.w-floor(neighbor.w+.5)));
  float depthEdge=smoothstep(.10,.25,abs(delta.z));
  // Actors own their inner contour, so a foreground rig also divides a crowd.
  edge=max(edge,actor?different*surface:depthEdge*surface);
  if(!actor&&inkMode>1.5&&different<.5&&surface>.5&&abs(center.w-neighbor.w)<.5) {
   float bend=1.0-dot(normal,inkNormal(neighbor.xy));
   float plane=abs(dot(delta,normal));
   crease=max(crease,smoothstep(.22,.55,bend)*smoothstep(.007,.04,plane));
  }
 }
 // No normal crease hatching on detailed skins, no lines on floors/effects.
 float haze=1.0-smoothstep(35.0,80.0,-p.z)*.65;
 return max(edge,crease*inkStyle.w)*haze*inkStyle.z;
}
`;

export const inkComposite = /* glsl */ `
 if(inkMode>.5) {
  vec4 geometry=texture2D(tGeometry,uv);geometry.zw*=255.0;
  float line=inkCoverage(uv,texture2D(tDepth,uv).x,geometry);
  // Hot effects stay above ink; the line inherits a restrained local light tint.
  line*=1.0-smoothstep(1.1,2.4,max(color.r,max(color.g,color.b)));
  vec3 neutralInk=min(color*.18,vec3(.006,.008,.011)+min(color,vec3(.5))*.04);
  color=mix(color,neutralInk,line);
 }
`;
