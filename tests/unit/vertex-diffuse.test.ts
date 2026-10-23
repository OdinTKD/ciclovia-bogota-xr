import {expect,it} from 'vitest';
import {MeshLambertMaterial,ShaderLib} from 'three';
import {setVertexDiffuse} from '../../src/rendering/vertex-diffuse';
function compile(material:MeshLambertMaterial){
 const shader={vertexShader:ShaderLib.lambert.vertexShader,fragmentShader:ShaderLib.lambert.fragmentShader,uniforms:{}};
 material.onBeforeCompile(shader as any,null as any);return shader;
}
it('mueve iluminación difusa a vértices en low conservando textura, alpha y niebla',()=>{
 const material=new MeshLambertMaterial();setVertexDiffuse(material,true);const shader=compile(material);
 expect(shader.vertexShader).toContain('getHemisphereLightIrradiance');
 expect(shader.vertexShader).toContain('directionalLights');
 expect(shader.fragmentShader).not.toContain('#include <lights_fragment_begin>');
 for(const chunk of ['map_fragment','alphatest_fragment','fog_fragment','tonemapping_fragment'])expect(shader.fragmentShader).toContain(`#include <${chunk}>`);
 expect(shader.fragmentShader).toContain('gl_FrontFacing');
});
it('restaura shader high exacto y reutiliza caché sin recompilar cada frame',()=>{
 const material=new MeshLambertMaterial();const original=compile(material);setVertexDiffuse(material,true);
 const lowKey=material.customProgramCacheKey(),revision=material.version;
 setVertexDiffuse(material,true);expect(material.version).toBe(revision);
 setVertexDiffuse(material,false);expect(material.customProgramCacheKey()).not.toBe(lowKey);
 expect(compile(material)).toEqual(original);
});
