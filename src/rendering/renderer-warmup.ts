interface RendererPreparation {
  setQuality(ratio: number): void;
  compile(): Promise<unknown>;
  render(): void;
}
/** Compile both real variants before play, including the first static shadow pass. */
export async function warmRendererVariants(renderer: RendererPreparation, initialRatio: number) {
  renderer.setQuality(.375);
  await renderer.compile();
  renderer.setQuality(initialRatio);
  await renderer.compile();
  renderer.render();
}
