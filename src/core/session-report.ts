import { evaluatePerformance, summarizeFrames } from './performance';

export interface RenderMeasurement {
  drawCalls: number; triangles: number; pixelRatio: number;
  width: number; height: number; cssWidth: number; cssHeight: number; devicePixelRatio: number;
}

/** Bounded to over 15 minutes at 120 Hz; reports truncation explicitly. */
export function createSessionReport() {
  const frames: number[] = [];
  const byWeather: Record<string, number[]> = { sun: [], rain: [] };
  const resolutions: Array<RenderMeasurement & { sample: number; weather: string }> = [];
  let maxDrawCalls = 0, maxTriangles = 0, totalSamples = 0;
  let previousResolution = '';
  return {
    sample(ms: number, weather: string, render: RenderMeasurement) {
      if (!Number.isFinite(ms) || ms <= 0) return;
      totalSamples++;
      maxDrawCalls = Math.max(maxDrawCalls, render.drawCalls);
      maxTriangles = Math.max(maxTriangles, render.triangles);
      if (frames.length < 120_000) {
        frames.push(ms);
        (byWeather[weather] ??= []).push(ms);
      }
      const key = [weather, render.width, render.height, render.cssWidth, render.cssHeight, render.pixelRatio].join(':');
      if (key !== previousResolution && resolutions.length < 1000) {
        resolutions.push({ ...render, sample: totalSamples, weather });
        previousResolution = key;
      }
    },
    snapshot() {
      const summary = summarizeFrames(frames);
      return {
        frames: summary,
        byWeather: Object.fromEntries(Object.entries(byWeather).map(([key, value]) => [key, summarizeFrames(value)])),
        maxDrawCalls, maxTriangles, totalSamples,
        truncated: totalSamples > frames.length,
        resolutions: resolutions.map(value => ({ ...value })),
        budgetFailures: summary.samples ? evaluatePerformance({ fps: summary.fps, drawCalls: maxDrawCalls, triangles: maxTriangles }) : [],
      };
    },
  };
}
