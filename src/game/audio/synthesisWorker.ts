import { synthesize, SYNTH_SAMPLE_RATE, type CueRecipe } from './synthesis';

/** Original PCM generation stays off the rendering/input thread. Transfers own the buffer. */
const worker = self as unknown as {
  onmessage: ((event: MessageEvent<{ key: string; recipe: CueRecipe; variant: number }>) => void) | null;
  postMessage(message: unknown, transfer: Transferable[]): void;
};
worker.onmessage = event => {
  const { key, recipe, variant } = event.data;
  try {
    const samples = synthesize(recipe, SYNTH_SAMPLE_RATE, variant);
    worker.postMessage({ key, samples: samples.buffer }, [samples.buffer]);
  } catch { worker.postMessage({ key, error: true }, []); }
};
