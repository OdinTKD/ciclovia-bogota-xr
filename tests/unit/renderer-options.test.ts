import { it, expect } from 'vitest';
import { rendererOptions } from '../../src/rendering/renderer-options';

it('evita multisampling adicional en pantallas densas y conserva el de escritorio 1x', () => {
  expect(rendererOptions(2.625).antialias).toBe(false);
  expect(rendererOptions(2).antialias).toBe(false);
  expect(rendererOptions(1).antialias).toBe(true);
  expect(rendererOptions(1).powerPreference).toBe('high-performance');
});
