import type { MeshLambertMaterial } from 'three';

const states = new WeakMap<MeshLambertMaterial, { enabled: boolean }>();
const varyings = 'varying vec3 vVertexDiffuseFront;\n#ifdef DOUBLE_SIDED\nvarying vec3 vVertexDiffuseBack;\n#endif\n';
const vertexLighting = `
vec3 diffuseNormal = normalize( transformedNormal );
vec3 diffuseFront = ambientLightColor;
#ifdef DOUBLE_SIDED
vec3 diffuseBack = ambientLightColor;
#endif
#if NUM_HEMI_LIGHTS > 0
 for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
  diffuseFront += getHemisphereLightIrradiance( hemisphereLights[i], diffuseNormal );
  #ifdef DOUBLE_SIDED
  diffuseBack += getHemisphereLightIrradiance( hemisphereLights[i], -diffuseNormal );
  #endif
 }
#endif
#if NUM_DIR_LIGHTS > 0
 for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
  float cosine = dot( diffuseNormal, directionalLights[i].direction );
  diffuseFront += max( cosine, 0.0 ) * directionalLights[i].color;
  #ifdef DOUBLE_SIDED
  diffuseBack += max( -cosine, 0.0 ) * directionalLights[i].color;
  #endif
 }
#endif
vVertexDiffuseFront = diffuseFront * RECIPROCAL_PI;
#ifdef DOUBLE_SIDED
vVertexDiffuseBack = diffuseBack * RECIPROCAL_PI;
#endif
`;

/** Low profile: interpolate Lambert lighting, retaining the same maps, alpha and light uniforms.
 * Intended for this scene's hemisphere/directional lights, without normal maps or shadows.
 * Full profile restores Three's original shader; topology and resolution are unchanged.
 */
export function setVertexDiffuse(material: MeshLambertMaterial, enabled: boolean) {
 let state = states.get(material);
 if (!state) {
  state = { enabled: false };
  states.set(material, state);
  const current = state;
  const originalCompile = material.onBeforeCompile.bind(material);
  const originalKey = material.customProgramCacheKey();
  material.customProgramCacheKey = () => `${originalKey}:vertex-diffuse-${current.enabled ? 1 : 0}`;
  material.onBeforeCompile = (shader, renderer) => {
   originalCompile(shader, renderer);
   if (!current.enabled) return;
   shader.vertexShader = varyings + shader.vertexShader
    .replace('#include <common>', '#include <common>\n#include <lights_pars_begin>')
    .replace('#include <normal_vertex>', '#include <normal_vertex>\n' + vertexLighting);
   shader.fragmentShader = varyings + shader.fragmentShader;
   for (const chunk of ['normal_fragment_begin', 'normal_fragment_maps', 'lights_fragment_maps', 'lights_fragment_end']) {
    shader.fragmentShader = shader.fragmentShader.replace(`#include <${chunk}>`, '');
   }
   shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_begin>',
    `#ifdef DOUBLE_SIDED
reflectedLight.directDiffuse = diffuseColor.rgb * ( gl_FrontFacing ? vVertexDiffuseFront : vVertexDiffuseBack );
#else
reflectedLight.directDiffuse = diffuseColor.rgb * vVertexDiffuseFront;
#endif`);
  };
 }
 if (state.enabled !== enabled) {
  state.enabled = enabled;
  material.needsUpdate = true;
 }
}
