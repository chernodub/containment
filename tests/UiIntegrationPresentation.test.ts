import {expect, it, vi} from 'vitest';
import type {DepthRenderer} from '../src/render/DepthRenderer';
import {configureIntegratedRenderer, hasCinematicMenu, presentationCameraBeat} from '../src/ui/integrationPresentation';

it('declares native camera ownership and feature-detects a cinematic menu', () => {
  const renderer = {menuPresentation: 'cinematic'} as unknown as DepthRenderer;
  configureIntegratedRenderer(renderer);
  expect((renderer as unknown as {handlesCameraEffects: boolean}).handlesCameraEffects).toBe(true);
  expect(hasCinematicMenu(renderer)).toBe(true);
  expect(hasCinematicMenu({} as DepthRenderer)).toBe(false);
});

it('adds timing punches once while native impacts remain renderer-owned and comfort scales only once', () => {
  const camera = {punch: vi.fn(), addTrauma: vi.fn()};
  const renderer = camera as unknown as DepthRenderer;
  const idle = {hitStopMs: 0, slowMotionMs: 0}, held = {...idle, hitStopMs: 40};
  presentationCameraBeat(renderer, idle, held, .5, false);
  expect(camera.punch).toHaveBeenLastCalledWith(.008, 90);
  presentationCameraBeat(renderer, held, held, .5, false);
  expect(camera.punch).toHaveBeenCalledTimes(1);
  presentationCameraBeat(renderer, held, {...held, slowMotionMs: 420}, 1, false);
  expect(camera.punch).toHaveBeenLastCalledWith(.025, 420);
  expect(camera.addTrauma).toHaveBeenCalledOnce();
  presentationCameraBeat(renderer, idle, held, 0, false);
  presentationCameraBeat(renderer, idle, held, 1, true);
  expect(camera.punch).toHaveBeenCalledTimes(2);
});
