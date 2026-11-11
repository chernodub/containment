/** Structural lighting contract: a complete environment mood can be passed directly. */
export interface PostMood {
  grade: {
    exposure: number;
    saturation: number;
    contrast: number;
    lift: readonly [number, number, number];
    gain: readonly [number, number, number];
    shadowTint: number;
    highlightTint: number;
  };
  fog: { color: number; density: number; height: number };
}

export const DEFAULT_POST_MOOD: PostMood = {
  grade: {
    exposure: 1.22, saturation: 0.94, contrast: 1.02,
    lift: [0.002, 0.004, 0.006], gain: [1, 1, 1],
    shadowTint: 0x658291, highlightTint: 0xffe6ca,
  },
  fog: { color: 0x182b34, density: 0.008, height: 1.6 },
};
