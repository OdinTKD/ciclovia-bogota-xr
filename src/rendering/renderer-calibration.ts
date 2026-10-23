import { createQualityController, MIN_RATIO, WINDOW_SIZE } from './quality';

interface CalibrationRenderer {
  render(): void;
  setQuality(ratio: number): void;
}

/** At most 24 measured frames, plus one render if the final frame changed quality. */
export async function calibrateRenderer(
  renderer: CalibrationRenderer,
  initialRatio: number,
  nextFrame: () => Promise<number> = () => new Promise(requestAnimationFrame),
): Promise<number> {
  const quality = createQualityController(initialRatio);
  const renderFrame = async () => { renderer.render(); return nextFrame(); };
  let previous = await nextFrame();
  let renderedRatio = quality.ratio;
  for (let window = 0; window < 2; window++) {
    const before = quality.ratio;
    for (let sample = 0; sample < WINDOW_SIZE; sample++) {
      renderedRatio = quality.ratio;
      const now = await renderFrame();
      if (quality.sample(now - previous)) renderer.setQuality(quality.ratio);
      previous = now;
    }
    if (quality.ratio === before || quality.ratio === MIN_RATIO) break;
  }
  if (renderedRatio !== quality.ratio) {
    await renderFrame();
  }
  return quality.ratio;
}
