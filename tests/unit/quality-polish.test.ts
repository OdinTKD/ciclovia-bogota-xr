import { expect, it } from 'vitest';
import { createQualityController, MIN_RATIO, initialPixelRatio } from '../../src/rendering/quality';
it('aplica el suelo visual también al arrancar con zoom y DPR menor que uno',()=>{
 expect(initialPixelRatio(.5)).toBe(.75);expect(initialPixelRatio(3)).toBe(1.5);
 expect(initialPixelRatio(1)).toBe(1);expect(initialPixelRatio(NaN)).toBe(1);
});
it('mantiene al menos tres cuartos de la resolución CSS aunque falten FPS',()=>{
  const q=createQualityController(1.5);
  for(let i=0;i<120;i++)q.sample(80);
  expect(MIN_RATIO).toBe(.75);expect(q.ratio).toBe(.75);
});
it('recupera gradualmente tras ocho segundos rápidos sin saltar a calidad máxima',()=>{
  const q=createQualityController(.75);
  for(let i=0;i<480;i++)q.sample(16);
  expect(q.ratio).toBe(.75);
  for(let i=0;i<24;i++)q.sample(16);
  expect(q.ratio).toBe(.875);
});
it('una recuperación fallida revierte y espera antes de probar de nuevo',()=>{
  const q=createQualityController(.75);
  for(let i=0;i<504;i++)q.sample(16);
  expect(q.ratio).toBe(.875);
  for(let i=0;i<12;i++)q.sample(45);
  expect(q.ratio).toBe(.75);
  for(let i=0;i<1000;i++)q.sample(16);
  expect(q.ratio).toBe(.75);
});
it('respeta el techo del dispositivo y no recupera con margen insuficiente',()=>{
 const marginal=createQualityController(.75,1);
 for(let i=0;i<1200;i++)marginal.sample(25);
 expect(marginal.ratio).toBe(.75);
 const fast=createQualityController(.75,1);
 for(let i=0;i<3000;i++)fast.sample(16);
 expect(fast.ratio).toBe(1);
});
