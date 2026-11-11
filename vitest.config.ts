import {defineConfig, mergeConfig} from 'vitest/config';
import viteConfig from './vite.config';

// Geometry raycasts and real Chromium tests share a desktop CPU. Bound worker
// contention rather than relaxing their existing assertion or timeout budgets.
export default mergeConfig(viteConfig, defineConfig({
  test: {maxWorkers: 2},
}));
