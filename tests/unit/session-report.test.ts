import { expect, it } from 'vitest';
import { createSessionReport } from '../../src/core/session-report';

it('preserva frames lentos, máximos y cambios de resolución del teléfono', () => {
  const report = createSessionReport();
  const render = { drawCalls: 25, triangles: 20000, pixelRatio: 1, width: 400, height: 800, cssWidth: 400, cssHeight: 800, devicePixelRatio: 2 };
  report.sample(16, 'sun', render);
  report.sample(120, 'sun', { ...render, drawCalls: 101, pixelRatio: .75, width: 300, height: 600 });
  report.sample(33, 'rain', { ...render, triangles: 100001 });
  const result = report.snapshot();
  expect(result.frames.maxMs).toBe(120);
  expect(result.maxDrawCalls).toBe(101);
  expect(result.maxTriangles).toBe(100001);
  expect(result.resolutions).toHaveLength(3);
  expect(result.resolutions[1]).toMatchObject({ pixelRatio: .75, width: 300, height: 600 });
  expect(result.byWeather.sun.samples).toBe(2);
  expect(result.byWeather.rain.samples).toBe(1);
  expect(result.budgetFailures).toEqual(expect.arrayContaining(['drawCalls', 'triangles', 'fps']));
});

it('no contamina el registro con muestras inválidas y permite un informe vacío', () => {
  const report = createSessionReport();
  expect(report.snapshot().frames.samples).toBe(0);
  expect(report.snapshot().budgetFailures).toEqual([]);
});
