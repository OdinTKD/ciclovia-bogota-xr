import { expect, it } from 'vitest';
import { calibrateRenderer } from '../../src/rendering/renderer-calibration';

it('prepara un equipo lento con tiempos RAF reales antes de jugar y tiene límite de muestras', async () => {
  let time = 0, frames = 0;
  const ratios: number[] = [];
  const result = await calibrateRenderer({ render: () => { frames++; }, setQuality: ratio => ratios.push(ratio) }, 1.5,
    async () => time += 100);
  expect(result).toBe(.75);
  expect(ratios).toEqual([.75]);
  expect(frames).toBe(24);
});

it('conserva la resolución alta si la primera ventana cumple el presupuesto', async () => {
  let time = 0, frames = 0;
  const ratios: number[] = [];
  const result = await calibrateRenderer({ render: () => { frames++; }, setQuality: ratio => ratios.push(ratio) }, 1,
    async () => time += 16);
  expect(result).toBe(1); expect(ratios).toEqual([]); expect(frames).toBe(12);
});

it('prepara una ventana completa en la calidad final antes de permitir jugar', async () => {
  let time = 0, ratio = 1.5;
  const renderedRatios: number[] = [];
  const result = await calibrateRenderer({
    render: () => { renderedRatios.push(ratio); },
    setQuality: value => { ratio = value; },
  }, ratio, async () => time += ratio === .75 ? 16 : 100);
  expect(result).toBe(.75);
  expect(renderedRatios.filter(value => value === .75)).toHaveLength(12);
  expect(renderedRatios.length).toBeLessThanOrEqual(25);
});
