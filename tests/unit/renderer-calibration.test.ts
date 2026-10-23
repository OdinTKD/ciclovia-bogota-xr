import { expect, it } from 'vitest';
import { calibrateRenderer } from '../../src/rendering/renderer-calibration';

it('prepara un equipo lento con tiempos RAF reales antes de jugar y tiene límite de muestras', async () => {
  let time = 0, frames = 0;
  const ratios: number[] = [];
  const result = await calibrateRenderer({ render: () => { frames++; }, setQuality: ratio => ratios.push(ratio) }, 1.5,
    async () => time += 100);
  expect(result).toBe(.375);
  expect(ratios).toEqual([.75, .375]);
  expect(frames).toBe(24);
});

it('conserva la resolución alta si la primera ventana cumple el presupuesto', async () => {
  let time = 0, frames = 0;
  const ratios: number[] = [];
  const result = await calibrateRenderer({ render: () => { frames++; }, setQuality: ratio => ratios.push(ratio) }, 1,
    async () => time += 16);
  expect(result).toBe(1); expect(ratios).toEqual([]); expect(frames).toBe(12);
});
