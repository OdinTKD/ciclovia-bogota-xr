import { describe, expect, it } from 'vitest';
import { createQualityController } from '../../src/rendering/quality';
describe('calidad adaptativa con media de 12 frames válidos',()=>{
 it('limita ratio inicial',()=>{expect(createQualityController().ratio).toBe(1.5);expect(createQualityController(3).ratio).toBe(1.5);expect(createQualityController(.1).ratio).toBe(.5);});
 it('espera una ventana completa antes de reducir a la mitad',()=>{const q=createQualityController();for(let i=0;i<11;i++)expect(q.sample(85)).toBe(false);expect(q.revision).toBe(0);expect(q.sample(85)).toBe(true);expect(q.ratio).toBe(.75);expect(q.revision).toBe(1);});
 it('reduce con frames lentos intercalados aunque no haya racha consecutiva',()=>{const q=createQualityController();const samples=Array.from({length:4},()=>[50,50,16]).flat();for(const ms of samples.slice(0,-1)) expect(q.sample(ms)).toBe(false);expect(q.sample(samples.at(-1)!)).toBe(true);expect(q.ratio).toBe(.75);});
 it('no reduce si la media cumple objetivo y nunca aumenta resolución',()=>{const q=createQualityController(.75);for(let i=0;i<12;i++)expect(q.sample(1000/30)).toBe(false);for(let i=0;i<100;i++)expect(q.sample(10)).toBe(false);expect(q.ratio).toBe(.75);expect(q.revision).toBe(0);});
 it('descarta la ventana anterior tras decidir calidad',()=>{const q=createQualityController();for(let i=0;i<12;i++)q.sample(80);for(let i=0;i<12;i++)expect(q.sample(10)).toBe(false);expect(q.ratio).toBe(.75);});
 it('ignora muestras inválidas sin alterar cantidad ni suma',()=>{const q=createQualityController();for(let i=0;i<11;i++)q.sample(40);for(const ms of [NaN,Infinity,-1,0])expect(q.sample(ms)).toBe(false);expect(q.sample(40)).toBe(true);});
 it('respeta mínimo .5 y revision solo si cambia ratio',()=>{const q=createQualityController(.75);for(let i=0;i<12;i++)q.sample(50);expect(q.ratio).toBe(.5);expect(q.revision).toBe(1);for(let i=0;i<40;i++)expect(q.sample(70)).toBe(false);expect(q.revision).toBe(1);});
});
