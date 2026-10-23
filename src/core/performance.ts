export const PERFORMANCE_BUDGET = Object.freeze({
  minimumFps: 30,
  drawCalls: 100,
  triangles: 100_000,
});
export interface FrameMetrics {
  drawCalls: number;
  triangles: number;
  fps: number;
}
export function evaluatePerformance(metrics: FrameMetrics): string[] {
  const failures: string[] = [];
  if (
    !Number.isFinite(metrics.drawCalls) ||
    metrics.drawCalls > PERFORMANCE_BUDGET.drawCalls
  )
    failures.push("drawCalls");
  if (
    !Number.isFinite(metrics.triangles) ||
    metrics.triangles > PERFORMANCE_BUDGET.triangles
  )
    failures.push("triangles");
  if (
    !Number.isFinite(metrics.fps) ||
    metrics.fps < PERFORMANCE_BUDGET.minimumFps
  )
    failures.push("fps");
  return failures;
}
export function summarizeFrames(samples: number[]): {
  fps: number;
  p95Ms: number;
  samples: number;
} {
  const valid = samples.filter((value) => Number.isFinite(value) && value > 0);
  if (!valid.length) return { fps: 0, p95Ms: 0, samples: 0 };
  const sorted = [...valid].sort((a, b) => a - b);
  return {
    fps: 1000 / (valid.reduce((a, b) => a + b, 0) / valid.length),
    p95Ms: sorted[Math.ceil(valid.length * 0.95) - 1],
    samples: valid.length,
  };
}
