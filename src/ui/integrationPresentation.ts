import type {DepthRenderer} from '../render/DepthRenderer';

type IntegratedRenderer = {
  handlesCameraEffects?: boolean;
  menuPresentation?: string;
  addTrauma?: (amount: number) => void;
  punch?: (amount: number, ms: number) => void;
};
type FeelSnapshot = Readonly<{hitStopMs: number; slowMotionMs: number}>;

/** G1 already owns weapon, hurt, explosion and authoritative ability-impact feedback. */
export function configureIntegratedRenderer(renderer: DepthRenderer): void {
  (renderer as unknown as IntegratedRenderer).handlesCameraEffects = true;
}

/** Retain renderer capability reporting beneath the authored, opaque title artwork. */
export function hasCinematicMenu(renderer: DepthRenderer): boolean {
  return (renderer as unknown as IntegratedRenderer).menuPresentation === 'cinematic';
}

/** Answer new timing beats once; G1 applies the persisted shake strength when posing the camera. */
export function presentationCameraBeat(renderer: DepthRenderer, before: FeelSnapshot, after: FeelSnapshot, strength: number, reducedMotion: boolean): void {
  if (reducedMotion || strength <= 0) return;
  const camera = renderer as unknown as IntegratedRenderer;
  if (after.slowMotionMs > before.slowMotionMs) {
    camera.addTrauma?.(.08);
    camera.punch?.(.025, 420);
  } else if (after.hitStopMs > before.hitStopMs) {
    camera.punch?.(.008, 90);
  }
}
