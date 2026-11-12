import type { GraphicStrength } from '../lighting/GraphicSurface';

export const INK_STRENGTHS: Readonly<Record<GraphicStrength, readonly [number,number,number,number]>> = Object.freeze({
 subtle:[1.85,.85,.72,.26],medium:[2.45,1.4,.92,.50],bold:[3,1.85,1,.72],
});

/** Pixel-space, geometry-only ink shared by both tiers; merged into the grade pass. */
export const inkDeclarations = /* glsl */ `
uniform sampler2D tGeometry;
uniform vec2 inkPixel;
uniform float inkMode;
uniform float inkStrength;
uniform vec4 inkStyle; // actor width, prop width, opacity, crease strength
vec3 inkNormal(vec2 e) {
 e=e*2.0-1.0;vec3 n=vec3(e,1.0-abs(e.x)-abs(e.y));
 if(n.z<0.0)n.xy=(1.0-abs(n.yx))*sign(n.xy);
 return normalize(n);
}
float inkBackdropLuma=1.0;
float inkCoverage(vec2 uv, float depth, vec4 center) {
 inkBackdropLuma=1.0;
 if(inkMode<.5||center.z<.5||center.w<.5||center.w>6.5||abs(center.z-floor(center.z+.5))>.01||abs(center.w-floor(center.w+.5))>.01)return 0.0;
 bool actor=center.w>2.5;
 bool floorSurface=center.w<1.5;
 if(floorSurface)return 0.0;
 // Low's silhouette path performs no normal comparisons.
 float width=actor?inkStyle.x:inkStyle.y;
 if(center.w==3.0||center.w>4.5)width*=mix(1.18,1.06,inkStrength);
 vec3 p=viewPosition(uv,depth);
 float edge=0.0,crease=0.0;
 vec3 normal=vec3(0.0,0.0,1.0);if(inkMode>1.5)normal=inkNormal(center.xy);
 if(!floorSurface||inkStrength<.99)for(int i=0;i<8;i++) {
  float a=float(i)*.7853981634;
  vec2 offset=vec2(cos(a),sin(a))*inkPixel*width;
  vec2 q=clamp(uv+offset,inkPixel,1.0-inkPixel);
  vec4 neighbor=texture2D(tGeometry,q);neighbor.zw*=255.0;
  // Identity compares exact normalized-byte integers, never color/luminance edges.
  float different=step(.5,abs(center.z-neighbor.z));
  float surface=step(.5,neighbor.z)*step(1.0,neighbor.w)*step(neighbor.w,6.5);
  surface*=1.0-step(.01,abs(neighbor.z-floor(neighbor.z+.5)));
  surface*=1.0-step(.01,abs(neighbor.w-floor(neighbor.w+.5)));
  // Cleared background is class 0. Excluded/priority overlays remain class 255,
  // so silhouettes close against empty space without drawing over danger.
  surface=max(surface,1.0-step(.5,neighbor.w));
  // Actor silhouettes depend only on identity. Avoid eight unused depth reads
  // and position reconstructions; major actor creases have their own kernel.
  if(actor) {
   edge=max(edge,different*surface);
   // Only contour fragments inspect adjacent scene radiance. A quiet light line
   // separates dark chitin from dark local scenery without lighting the floor.
   if(different*surface>.5)inkBackdropLuma=min(inkBackdropLuma,dot(texture2D(tScene,q).rgb,vec3(.2126,.7152,.0722)));
   continue;
  }
  float d=texture2D(tDepth,q).x;
  if(inkMode<1.5) {
   float dz=abs(viewPosition(q,d).z-p.z);
   edge=max(edge,mix(smoothstep(.10,.25,dz),smoothstep(.05,.15,dz),inkStrength)*surface);
   continue;
  }
  vec3 delta=viewPosition(q,d)-p;
  float depthEdge=smoothstep(.10,.25,abs(delta.z));
  float graphicDepth=inkMode>1.5?smoothstep(.02,.065,abs(delta.z))*smoothstep(.006,.018,abs(dot(delta,normal))):smoothstep(.05,.15,abs(delta.z));
  depthEdge=mix(depthEdge,graphicDepth,inkStrength);
  // Actors own their inner contour, so a foreground rig also divides a crowd.
  if(!floorSurface)edge=max(edge,actor?different*surface:depthEdge*surface);
  if(!actor&&inkMode>1.5&&different<.5&&surface>.5&&abs(center.w-neighbor.w)<.5) {
   float bend=1.0-dot(normal,inkNormal(neighbor.xy));
   float plane=abs(dot(delta,normal));
   crease=max(crease,smoothstep(.22,.55,bend)*smoothstep(.007,.04,plane)*(1.0-inkStrength));
  }
 }
 // Major geometric forms use a narrower kernel than silhouettes. No texture normals.
 if(inkMode>1.5&&inkStrength>.01) {
  float innerWidth=actor?1.5:1.0;
  for(int i=0;i<8;i++) {
   if(!actor&&i>=4)break;
   float a=float(i)*(actor?.7853981634:1.5707963268);vec2 q=clamp(uv+vec2(cos(a),sin(a))*inkPixel*innerWidth,inkPixel,1.0-inkPixel);
   vec4 neighbor=texture2D(tGeometry,q);neighbor.zw*=255.0;
   if(abs(neighbor.z-center.z)<.5&&abs(neighbor.w-center.w)<.5) {
    vec3 delta=viewPosition(q,texture2D(tDepth,q).x)-p;
    float bend=1.0-dot(normal,inkNormal(neighbor.xy));
    float major=smoothstep(actor?.22:.16,actor?.48:.40,bend)*smoothstep(actor?.005:.0015,actor?.02:.009,abs(dot(delta,normal)));
    crease=max(crease,major*mix(.58,1.0,float(!actor))*inkStrength);
   }
  }
 }
 // Pixel-space geometry edges fade only into actual depth haze.
 float haze=1.0-smoothstep(35.0,80.0,-p.z)*.65;
 edge*=1.0-.18*inkStrength*clamp(fwidth(edge),0.0,1.0);
 return max(edge,crease*inkStyle.w)*haze*inkStyle.z;
}
`;

export const inkComposite = /* glsl */ `
 if(inkMode>.5) {
  vec4 geometry=texture2D(tGeometry,uv);geometry.zw*=255.0;
  float line=inkCoverage(uv,texture2D(tDepth,uv).x,geometry);
  // Hot effects stay above ink; the line inherits a restrained local light tint.
  float hotYield=1.0-smoothstep(1.1,2.4,max(color.r,max(color.g,color.b)));
  line*=mix(hotYield,1.0,inkStrength*step(2.5,geometry.w));
  vec3 neutralInk=min(color*.18,vec3(.006,.008,.011)+min(color,vec3(.5))*.04);
  vec3 boldInk=min(color*.20,vec3(.010,.011,.012)+shadowTint*.0015+min(color,vec3(.5))*.006);
  vec3 contour=mix(neutralInk,boldInk,inkStrength);
  float darkBackdrop=(1.0-smoothstep(.008,.027,inkBackdropLuma))*step(3.5,geometry.w)*step(geometry.w,6.5);
  contour=mix(contour,vec3(.045,.058,.068),darkBackdrop*.82);
  color=mix(color,contour,line);
 }
`;
