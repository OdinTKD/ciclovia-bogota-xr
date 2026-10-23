import { MIN_RATIO } from './quality';
interface RendererPreparation {
  setQuality(ratio: number): void;
  compile(): Promise<unknown>;
  render(): void;
}
/** Compile both real variants before play, including the first static shadow pass. */
export async function warmRendererVariants(renderer: RendererPreparation, initialRatio: number) {
  renderer.setQuality(MIN_RATIO);
  await renderer.compile();
  renderer.setQuality(initialRatio);
  await renderer.compile();
  renderer.render();
}
