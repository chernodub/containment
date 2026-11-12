/** Fit amplified repeated-draw throughput; never call the slope ordinary pass latency. */
export function fitGpuMicro(samples, options = {}) {
  const counts = options.counts ?? [1, 8, 32];
  const minimumSamples = options.minimumSamples ?? 2;
  const minimumRSquared = options.minimumRSquared ?? .98;
  const maximumRelativeSpread = options.maximumRelativeSpread ?? .5;
  const groups = counts.map(repeats => {
    const valid = samples.filter(sample => sample.repeats === repeats && sample.status === 'resolved'
      && Number.isFinite(sample.gpuMs) && sample.gpuMs >= 0
      && Number.isFinite(sample.cpuSubmissionMs) && sample.cpuSubmissionMs >= 0);
    const ordered = [...valid].sort((a, b) => a.gpuMs - b.gpuMs);
    const selected = ordered[0];
    const spread = selected ? (ordered.at(-1).gpuMs - selected.gpuMs) / Math.max(selected.gpuMs, .05) : null;
    return {
      repeats, samples: valid.length,
      minimumGpuMs: selected?.gpuMs ?? null,
      pairedCpuSubmissionMs: selected?.cpuSubmissionMs ?? null,
      selectedSample: selected?.sample ?? null,
      relativeSpread: spread,
    };
  });
  const regress = points => {
    const mx = points.reduce((sum, [x]) => sum + x, 0) / points.length;
    const my = points.reduce((sum, [, y]) => sum + y, 0) / points.length;
    const xx = points.reduce((sum, [x]) => sum + (x - mx) ** 2, 0);
    const xy = points.reduce((sum, [x, y]) => sum + (x - mx) * (y - my), 0);
    const slope = xy / xx, intercept = my - slope * mx;
    const total = points.reduce((sum, [, y]) => sum + (y - my) ** 2, 0);
    const residual = points.reduce((sum, [x, y]) => sum + (y - (intercept + slope * x)) ** 2, 0);
    return { slopeMsPerRepeat: slope, interceptMs: intercept, rSquared: total > 1e-12 ? Math.max(0, 1 - residual / total) : 0 };
  };
  const reasons = [];
  if (groups.some(group => group.samples < minimumSamples)) reasons.push('insufficient-resolved-samples');
  const complete = groups.every(group => group.samples > 0);
  const gpuFit = complete ? regress(groups.map(group => [group.repeats, group.minimumGpuMs])) : null;
  const cpuFit = complete ? regress(groups.map(group => [group.repeats, group.pairedCpuSubmissionMs])) : null;
  const amplifiedDeltaMs = complete ? groups.at(-1).minimumGpuMs - groups[0].minimumGpuMs : null;
  const requiredDeltaMs = complete ? Math.max(.2, groups[0].minimumGpuMs * .02) : null;
  if (complete) {
    if (!(gpuFit.slopeMsPerRepeat > 0)) reasons.push('flat-or-negative-slope');
    if (!(amplifiedDeltaMs > requiredDeltaMs)) reasons.push('amplification-below-resolution-floor');
    if (gpuFit.rSquared < minimumRSquared) reasons.push('nonlinear-repeat-response');
    if (groups.some(group => group.relativeSpread > maximumRelativeSpread)) reasons.push('noisy-within-count-samples');
    if (gpuFit.interceptMs < -Math.max(.1, groups[0].minimumGpuMs * .1)) reasons.push('nonphysical-negative-intercept');
    // An elapsed slope no larger than CPU submission cannot distinguish GPU
    // throughput from a coarse command-buffer/CPU scope on this backend.
    if (gpuFit.slopeMsPerRepeat <= Math.max(0, cpuFit.slopeMsPerRepeat) * 1.05) reasons.push('gpu-slope-not-separated-from-cpu-submission');
  }
  return {
    supported: reasons.length === 0,
    timingAcceptanceEligible: false,
    estimateKind: 'amplified same-target throughput estimate, not isolated pass latency',
    estimateMsPerRepeat: reasons.length === 0 ? gpuFit.slopeMsPerRepeat : null,
    reasons, counts: groups, gpuFit, pairedCpuFit: cpuFit,
    amplifiedDeltaMs, requiredDeltaMs,
    criteria: { minimumSamples, minimumRSquared, maximumRelativeSpread, absoluteDeltaFloorMs: .2, relativeDeltaFloor: .02, gpuToCpuSlopeMargin: 1.05 },
  };
}
