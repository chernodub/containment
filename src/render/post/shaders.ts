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
uniform float atmosphereEnabled;
uniform float useAgX;
uniform float saturation;
uniform float contrast;
uniform vec3 lift;
uniform vec3 gain;
uniform vec3 shadowTint;
uniform vec3 highlightTint;
uniform vec3 fogColor;
uniform float fogDensity;
uniform float fogHeight;
${reconstruct}
float noise(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}
void main() {
  vec2 uv = clamp(vUv + texture2D(tDistortion, vUv).rg * distortionEnabled, invSize, 1.0 - invSize);
  vec2 fringe = (uv - 0.5) * pow(length(uv - 0.5), 3.0) * 0.0015 * lensEnabled;
  vec3 color = texture2D(tScene, uv).rgb;
  color.r = texture2D(tScene, uv + fringe).r;
  color.b = texture2D(tScene, uv - fringe).b;
  // Restrained unsharp mask in HDR: preserve fine industrial surface edges.
  vec3 average = (texture2D(tScene, uv + vec2(invSize.x, 0.0)).rgb
    + texture2D(tScene, uv - vec2(invSize.x, 0.0)).rgb
    + texture2D(tScene, uv + vec2(0.0, invSize.y)).rgb
    + texture2D(tScene, uv - vec2(0.0, invSize.y)).rgb) * 0.25;
  color = max(color + clamp(color - average, -0.15, 0.15) * 0.12, 0.0);
  float ao = texture2D(tAO, uv).r;
  color *= mix(1.0, ao, aoEnabled * 0.8);
  color += texture2D(tBloom, uv).rgb * bloomEnabled * 0.13;
  float depth = texture2D(tDepth, uv).x;
  if (depth < 0.999999) {
    vec3 view = viewPosition(uv, depth);
    vec3 world = (cameraWorld * vec4(view, 1.0)).xyz;
    // Orthographic cameras sit far away: use camera-relative depth variation,
    // not absolute distance from the eye, which would blanket the whole room.
    float altitude = exp(-max(world.y, 0.0) / max(fogHeight, 0.1));
    float path = min(length(view.xy) + max(fogHeight - world.y, 0.0) * 2.0, 24.0);
    float haze = min(0.17, 1.0 - exp(-fogDensity * path * altitude));
    color = mix(color, fogColor, haze * atmosphereEnabled);
  }
  color = max((color + lift) * gain, 0.0);
  color = useAgX > 0.5 ? AgXToneMapping(color) : ACESFilmicToneMapping(color);
  float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(luminance), color, saturation);
  color = (color - 0.18) * contrast + 0.18;
  color += (shadowTint - 0.5) * (1.0 - smoothstep(0.0, 0.35, luminance)) * 0.018;
  color += (highlightTint - 0.5) * smoothstep(0.45, 1.0, luminance) * 0.012;
  float vignette = smoothstep(0.23, 0.76, length((vUv - 0.5) * vec2(1.0, 0.85)));
  color *= 1.0 - vignette * 0.11 * lensEnabled;
  gl_FragColor = vec4(max(color, 0.0), 1.0);
  #include <colorspace_fragment>
  float grain = noise(gl_FragCoord.xy + mod(time * 43.0, 4096.0));
  float dither = noise(gl_FragCoord.yx + 19.0);
  gl_FragColor.rgb += (grain - 0.5) * 0.003 * lensEnabled + (dither - 0.5) / 255.0;
}`;
