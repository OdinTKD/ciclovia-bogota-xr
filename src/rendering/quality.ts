export const MIN_RATIO = 0.375;
const MAX_RATIO = 1.5;
const FRAME_TARGET_MS = 1000 / 30;
export const WINDOW_SIZE = 12;
/** Uses genuine frame times to reduce GPU work; never changes reported FPS. */
export function createQualityController(initialRatio = 1.5) {
  let ratio = Math.min(
    MAX_RATIO,
    Math.max(
      MIN_RATIO,
      Number.isFinite(initialRatio) ? initialRatio : MAX_RATIO,
    ),
  );
  let revision = 0;
  let sampleCount = 0;
  let totalMs = 0;
  return {
    get ratio() {
      return ratio;
    },
    get revision() {
      return revision;
    },
    sample(ms: number): boolean {
      if (!Number.isFinite(ms) || ms <= 0) return false;
      sampleCount++;
      totalMs += ms;
      if (sampleCount < WINDOW_SIZE) return false;
      const missedFrameBudget = totalMs / WINDOW_SIZE > FRAME_TARGET_MS;
      sampleCount = 0;
      totalMs = 0;
      if (!missedFrameBudget) return false;
      const next = Math.max(MIN_RATIO, ratio / 2);
      if (next === ratio) return false;
      ratio = next;
      revision++;
      return true;
    },
  };
}
