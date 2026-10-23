import { it, expect } from 'vitest';
import { warmRendererVariants } from '../../src/rendering/renderer-warmup';

it('prepara ambas variantes antes de dejar disponible el render de juego', async () => {
  const events: string[] = [];
  let quality = 1;
  await warmRendererVariants({
    setQuality: value => { quality = value; events.push(`quality:${value}`); },
    compile: async () => { await Promise.resolve(); events.push(`compile:${quality}`); },
    render: () => events.push(`render:${quality}`),
  }, 1);
  expect(events).toEqual(['quality:0.75', 'compile:0.75', 'quality:1', 'compile:1', 'render:1']);
});
