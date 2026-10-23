import { createQualityController, MIN_RATIO, WINDOW_SIZE } from './quality';

interface CalibrationRenderer {
  render(): void;
  setQuality(ratio: number): void;
}

/** Measure actual rendered frames before enabling play; at most 24 samples. */
export async function calibrateRenderer(
  renderer: CalibrationRenderer,
  initialRatio: number,
  nextFrame: () => Promise<number> = () => new Promise(requestAnimationFrame),
): Promise<number> {
  const quality = createQualityController(initialRatio);
  let previous = await nextFrame();
  for (let window = 0; window < 2; window++) {
    const before = quality.ratio;
    for (let sample = 0; sample < WINDOW_SIZE; sample++) {
      renderer.render();
      const now = await nextFrame();
      if (quality.sample(now - previous)) renderer.setQuality(quality.ratio);
      previous = now;
    }
    if (quality.ratio === before || quality.ratio === MIN_RATIO) break;
  }
  return quality.ratio;
}
