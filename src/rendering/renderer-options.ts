import type { WebGLRendererParameters } from 'three';
const STANDARD_PIXEL_DENSITY = 1;

/** Dense displays avoid an additional multisample buffer; the draw resolution is unchanged. */
export function rendererOptions(pixelDensity: number): WebGLRendererParameters {
  return { antialias: pixelDensity <= STANDARD_PIXEL_DENSITY, powerPreference: 'high-performance' };
}
