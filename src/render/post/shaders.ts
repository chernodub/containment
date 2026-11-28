import { inkDeclarations, inkComposite } from './Ink';
/** One full-screen triangle is shared by all pipeline stages. */
export const screenVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const reconstruct = /* glsl */ `
uniform sampler2D tDepth;
uniform mat4 projectionInverse;
vec3 viewPosition(vec2 uv, float depth) {
  vec4 p = projectionInverse * vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
  return p.xyz / p.w;
}`;

/** Invalid AO must leave scene lighting intact rather than contaminate HDR color. */
export const finiteOcclusionGLSL = /* glsl */ `
float finiteOcclusion(float value) {
  if (value >= 0.0 && value <= 1.0) return value;
  return 1.0;
}`;

/** Depth-derived contact AO: no normals prepass or additional scene traversal. */
export const occlusionFragment = /* glsl */ `
varying vec2 vUv;
uniform vec2 invSize;
uniform mat4 projection;
${reconstruct}
void main() {
  float depth = texture2D(tDepth, vUv).x;
  if (depth >= 0.999999) { gl_FragColor = vec4(1.0); return; }
  vec3 p = viewPosition(vUv, depth);
  // A cross-product of derivatives also works for the orthographic camera.
  vec3 normal = normalize(cross(dFdx(p), dFdy(p)));
  if (normal.z < 0.0) normal = -normal;
  float viewScale = abs(projection[1][1]);
  float perspectiveDivisor = abs(projection[3][3]) < 0.5 ? max(-p.z, 0.01) : 1.0;
  float radiusUV = clamp(0.8 * viewScale / perspectiveDivisor, 2.0 * invSize.y, 0.075);
  float angle = fract(sin(dot(floor(vUv / invSize), vec2(12.9898, 78.233))) * 43758.5453) * 6.283185;
  float ao = 0.0;
  for (int i = 0; i < 12; i++) {
    float fi = float(i) + 0.5;
    float a = angle + fi * 2.399963;
    vec2 offset = vec2(cos(a) * invSize.x / invSize.y, sin(a)) * radiusUV * sqrt(fi / 12.0);
    vec2 qUV = clamp(vUv + offset, invSize, 1.0 - invSize);
    vec3 delta = viewPosition(qUV, texture2D(tDepth, qUV).x) - p;
    float distanceSquared = dot(delta, delta);
    float horizon = max(dot(normal, delta) - 0.035, 0.0) / sqrt(distanceSquared + 0.001);
    ao += horizon * (1.0 - smoothstep(0.08, 2.3, distanceSquared));
  }
  gl_FragColor = vec4(vec3(clamp(1.0 - ao * 0.16, 0.55, 1.0)), 1.0);
}`;

export const bloomExtractFragment = /* glsl */ `
varying vec2 vUv;
uniform sampler2D tInput;
void main() {
  vec3 color = texture2D(tInput, vUv).rgb;
  float brightness = max(color.r, max(color.g, color.b));
  // HDR-only bloom: a white diffuse surface never becomes a light source.
  float hot = smoothstep(1.25, 2.25, brightness);
  gl_FragColor = vec4(color * hot, 1.0);
}`;

export const bloomBlurFragment = /* glsl */ `
varying vec2 vUv;
uniform sampler2D tInput;
uniform vec2 direction;
void main() {
  vec3 c = texture2D(tInput, vUv).rgb * 0.227027;
  c += texture2D(tInput, vUv + direction * 1.384615).rgb * 0.316216;
  c += texture2D(tInput, vUv - direction * 1.384615).rgb * 0.316216;
  c += texture2D(tInput, vUv + direction * 3.230769).rgb * 0.070270;
  c += texture2D(tInput, vUv - direction * 3.230769).rgb * 0.070270;
  gl_FragColor = vec4(c, 1.0);
}`;

export const compositeFragment = /* glsl */ `
#include <tonemapping_pars_fragment>
varying vec2 vUv;
uniform sampler2D tScene;
uniform sampler2D tAO;
uniform sampler2D tBloom;
uniform sampler2D tDistortion;
uniform mat4 cameraWorld;
uniform vec2 invSize;
uniform float time;
uniform float aoEnabled;
uniform float bloomEnabled;
uniform float distortionEnabled;
uniform float lensEnabled;
uniform float focusDistance;
uniform float menuPresentation;
uniform float atmosphereEnabled;
uniform float useAgX;
uniform float saturation;
uniform vec3 abilityPresentation;
uniform vec3 flameGrade;
uniform float contrast;
uniform vec3 lift;
uniform vec3 gain;
uniform vec3 shadowTint;
uniform vec3 highlightTint;
uniform vec3 fogColor;
uniform float fogDensity;
uniform float fogHeight;
${reconstruct}
${finiteOcclusionGLSL}
${inkDeclarations}
float noise(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}
void main() {
  vec2 uv = vUv;
  if (distortionEnabled > 0.5) uv += texture2D(tDistortion, vUv).rg;
  uv = clamp(uv, invSize, 1.0 - invSize);
  vec3 color = texture2D(tScene, uv).rgb;
  vec3 sharpColor=color;
  float centerDepth=texture2D(tDepth,uv).x;
  if (lensEnabled > 0.5) {
    // Far-field-only gameplay defocus never softens actors inside the marine's
    // movement/aim neighborhood. Menu's close lens has a narrower focal zone.
    float focalDepth=-viewPosition(uv,centerDepth).z;
    float coc=smoothstep(mix(7.0,2.5,menuPresentation),mix(15.0,7.0,menuPresentation),abs(focalDepth-focusDistance));
    coc*=mix(smoothstep(.56,.93,abs(vUv.y-.5)*2.0),1.0,menuPresentation);
    if(coc>.001){
      vec2 radius=invSize*coc*mix(1.2,3.5,menuPresentation);
      vec3 soft=color*2.0;float weight=2.0;
      for(int i=0;i<6;i++){
        float angle=float(i)*1.04719755;vec2 q=clamp(uv+vec2(cos(angle),sin(angle))*radius,invSize,1.0-invSize);
        float sampleDepth=-viewPosition(q,texture2D(tDepth,q).x).z;
        float w=1.0-smoothstep(.2,1.2,abs(sampleDepth-focalDepth));
        soft+=texture2D(tScene,q).rgb*w;weight+=w;
      }
      color=mix(color,soft/weight,coc*.65);
    }
    vec2 fringe = (uv - 0.5) * pow(length(uv - 0.5), 3.0) * 0.0015;
    color.r += texture2D(tScene, uv + fringe).r-sharpColor.r;
    color.b += texture2D(tScene, uv - fringe).b-sharpColor.b;
    // Restrained unsharp mask in HDR: preserve fine industrial surface edges.
    vec3 average = (texture2D(tScene, uv + vec2(invSize.x, 0.0)).rgb
      + texture2D(tScene, uv - vec2(invSize.x, 0.0)).rgb
      + texture2D(tScene, uv + vec2(0.0, invSize.y)).rgb
      + texture2D(tScene, uv - vec2(0.0, invSize.y)).rgb) * 0.25;
    color = max(color + clamp(color - average, -0.15, 0.15) * 0.12, 0.0);
  }
  if (aoEnabled > 0.5) {
    float ao = finiteOcclusion(texture2D(tAO, uv).r);
    color *= mix(1.0, ao, 0.8);
  }
  if (bloomEnabled > 0.5) color += texture2D(tBloom, uv).rgb * 0.13;
  if (atmosphereEnabled > 0.5) {
    if (centerDepth < 0.999999) {
      vec3 view = viewPosition(uv, centerDepth);
      vec3 world = (cameraWorld * vec4(view, 1.0)).xyz;
      // Orthographic cameras sit far away: use camera-relative depth variation,
      // not absolute distance from the eye, which would blanket the whole room.
      float altitude = exp(-max(world.y, 0.0) / max(fogHeight, 0.1));
      float path = min(length(view.xy) + max(fogHeight - world.y, 0.0) * 2.0, 24.0);
      float haze = min(0.075, 1.0 - exp(-fogDensity * path * altitude * 0.55));
      color = mix(color, fogColor * 0.36, haze);
    }
  }
${inkComposite}
  color = max((color + lift) * gain, 0.0);
  color *= 1.0 + abilityPresentation.x * 2.4;
  color*=1.0-menuPresentation*(1.0-smoothstep(.30,.59,vUv.x))*.78;
  // Title exposure is localized to the cast; the left45% remains calm.
  color*=1.0+menuPresentation*smoothstep(.45,.60,vUv.x)*.65;
  color = useAgX > 0.5 ? AgXToneMapping(color) : ACESFilmicToneMapping(color);
  float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(luminance), color, saturation);
  float packedClass=floor(actorGeometry.w+.5);
  float actorClass=mod(packedClass,8.0);
  // Restore combustion chroma lost in the filmic shoulder. Only colored flame
  // texels in the live fan qualify; the white core and inked actors keep their grade.
  if(flameGrade.z>0. && actorClass<2.5 && sharpColor.r>.23){
    vec3 world=(cameraWorld*vec4(viewPosition(uv,centerDepth),1.)).xyz;
    float local=1.-smoothstep(flameGrade.z*.85,flameGrade.z,distance(world.xz,flameGrade.xy));
    float green=sharpColor.g/max(.001,sharpColor.r);
    float fire=local*smoothstep(.035,.09,green)*(1.-smoothstep(.84,.98,green))
      *(1.-smoothstep(.06,.19,sharpColor.b/sharpColor.r));
    color*=mix(vec3(1.),vec3(1.42,.92,.09),fire);
  }
  // Preserve hot hostile red/orange hues while cooling the time-dilated world.
  float hostileHue = smoothstep(.08,.23,color.r-max(color.g,color.b));
  float coolState = abilityPresentation.z * (1.0-hostileHue);
  color = mix(color,vec3(luminance)*vec3(.88,.97,1.08),coolState*.32);
  color *= vec3(1.0+abilityPresentation.y*.065,1.0,1.0-abilityPresentation.y*.045);
  float abilityEdge = smoothstep(.28,.74,length((vUv-.5)*vec2(1.,.85)));
  color += vec3(.035,.008,.07)*coolState*abilityEdge;
  // A toe-preserving contrast curve retains information in industrial shadows.
  color = pow(max(color, vec3(0.0)), vec3(contrast));
  color += (shadowTint - 0.5) * (1.0 - smoothstep(0.0, 0.35, luminance)) * 0.018;
  color += (highlightTint - 0.5) * smoothstep(0.45, 1.0, luminance) * 0.012;
  if (lensEnabled > 0.5) {
    float vignette = smoothstep(0.23, 0.76, length((vUv - 0.5) * vec2(1.0, 0.85)));
    color *= 1.0 - vignette * 0.11;
  }
  // Roll graded creature highlights into a shoulder without crushing shadows.
  if(actorClass>=4.0 && actorClass<=6.0){
    float region=floor(packedClass/8.0);
    float value=dot(color,vec3(.2126,.7152,.0722));
    // Grade the final shadow as well as the paint. Room lift can push a
    // channel below zero on a nearly black shell, yielding saturated blue ink.
    bool broodZone=region==31.;
    if(broodZone && max(sharpColor.r,max(sharpColor.g,sharpColor.b))<.55){
      color=mix(vec3(max(.010,value)),max(vec3(.006),color),.20);
    }
    // HEAVY47: Brute, elite and Warden bodies keep their skeletal regions (0–8). On their
    // near-black planes the room lift and shadow tint become saturated blue or red, and the
    // rust and slate paints gain chroma through the filmic curve. Resting heavy paint keeps
    // its hue under the marine visor's chroma; statuses and lit telegraphs paint brighter
    // than any resting band and keep their colour.
    if(region<8.5){
      float resting=1.-smoothstep(.24,.34,max(sharpColor.r,max(sharpColor.g,sharpColor.b)));
      // Measured on the encoded sRGB value: near black its curve is linear, not a power.
      vec3 linearPart=max(color,vec3(0.));
      vec3 shown=mix(1.055*pow(linearPart,vec3(1./2.4))-.055,linearPart*12.92,step(linearPart,vec3(.0031308)));
      float top=max(shown.r,max(shown.g,shown.b)),chroma=(top-min(shown.r,min(shown.g,shown.b)))/max(top,.0001);
      // Near black one 8-bit step is a large share of the value, so the allowed chroma falls
      // with value; a floor of 14/255 keeps quantisation and dither off the ink.
      // The Warden (boss class) keeps a little more rust than the slate Brutes. The visor's
      // lowest measured peak is .32; 8-bit steps and review reduction add up to ~.05.
      float allowed=mix(.06,actorClass>5.5?.25:.22,smoothstep(.06,.24,top));
      shown=max(mix(vec3(top),shown,min(1.,allowed/max(chroma,.0001))),vec3(.055));
      color=mix(color,mix(pow((shown+.055)/1.055,vec3(2.4)),shown/12.92,step(shown,vec3(.04045))),resting);
    }
    bool ornament=region==28.0 || region==9.0 || region==10.0 || region==12.0 || region==15.0 || region==30.0;
    bool danger=color.r>color.g*2.6 && color.r>color.b*2.0;
    if(!ornament && !danger && value>.145){
      // Region 29 is the Brute bone mark. Preserve warm ivory through the final grade.
      float bounded=region==29.0?min(value,.29):.145+.057*(1.-exp(-(value-.145)/.057));
      color*=bounded/value;
    }
  }
  // Committed attack ownership stays legible over the graded body and elemental FX.
  color=mix(color,vec3(.52,.59,.65),combatSilhouette*.88);
  gl_FragColor = vec4(max(color, 0.0), 1.0);
  #include <colorspace_fragment>
  float dither = noise(gl_FragCoord.yx + 19.0);
  gl_FragColor.rgb += (dither - 0.5) / 255.0;
  if (lensEnabled > 0.5) {
    float grain = noise(gl_FragCoord.xy + mod(time * 43.0, 4096.0));
    gl_FragColor.rgb += (grain - 0.5) * 0.003;
  }
}`;
