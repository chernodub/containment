/** Configure before staging so scenario compile guards cover only prepared combat. */
export async function configureCaptureGraphics(options) {
  const d = window.__containmentDebug;
  const r = d.renderer;
  if (!Object.keys(options).length) return;
  // A scenario can explicitly select Low/High while staging. Keep requested
  // overrides on that native tier and let its normal prepare() hold settle.
  const selectTier = r.setQuality.bind(r);
  r.setQuality = (...args) => {
    selectTier(...args);
    r.setGraphicsOptions(options);
  };
  r.setGraphicsOptions(options);
  await d.prepare();
  d.refresh();
}
