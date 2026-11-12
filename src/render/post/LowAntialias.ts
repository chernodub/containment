/**
 * Low's final presentation filter has five fixed reads and no edge search.
 * Blend along the local edge tangent; the original pixel retains at least 68%
 * weight so one-pixel prop ink and two-pixel actor contours remain deliberate.
 * The sRGB presentation texture decodes on sampling, then output converts once.
 */
export const lowAntialiasFragment = /* glsl */ `
uniform sampler2D tDiffuse;
uniform vec2 resolution;
varying vec2 vUv;
void main() {
  vec4 center = texture2D(tDiffuse, vUv);
  vec3 north = texture2D(tDiffuse, vUv + vec2(0.0, resolution.y)).rgb;
  vec3 south = texture2D(tDiffuse, vUv - vec2(0.0, resolution.y)).rgb;
  vec3 east = texture2D(tDiffuse, vUv + vec2(resolution.x, 0.0)).rgb;
  vec3 west = texture2D(tDiffuse, vUv - vec2(resolution.x, 0.0)).rgb;
  const vec3 luma = vec3(.299, .587, .114);
  float lc = dot(center.rgb, luma);
  float ln = dot(north, luma), ls = dot(south, luma);
  float le = dot(east, luma), lw = dot(west, luma);
  float minimum = min(lc, min(min(ln, ls), min(le, lw)));
  float maximum = max(lc, max(max(ln, ls), max(le, lw)));
  float contrast = maximum - minimum;
  vec2 gradient = abs(vec2(le - lw, ln - ls));
  vec2 tangent = (gradient.yx + vec2(.0001)) / (gradient.x + gradient.y + .0002);
  vec3 adjacent = .5 * ((east + west) * tangent.x + (north + south) * tangent.y);
  float localMean = (ln + ls + le + lw) * .25;
  float subpixel = abs(localMean - lc) / max(contrast, .0001);
  // Flat fields and linear lighting gradients are exact pass-through. Convex
  // blending cannot add overshoot, halos or a darker line than the input.
  float blend = .32 * smoothstep(.06, .4, subpixel)
    * smoothstep(max(.025, maximum * .08), max(.05, maximum * .2), contrast);
  gl_FragColor = vec4(mix(center.rgb, adjacent, blend), center.a);
  #include <colorspace_fragment>
}
`;
