import { readFileSync } from 'node:fs';
import { expect,it } from 'vitest';
import { parseTrafficConfig } from '../../src/traffic';
it('ofrece carro y peatón con espacio antes de terminar los 200 metros',()=>{
 const config=parseTrafficConfig(JSON.parse(readFileSync('public/config/traffic.json','utf8')));
 for(const kind of ['car','pedestrian'])expect(config.hazards.some(h=>h.kind===kind && h.z>=60 && h.z<=170)).toBe(true);
});
