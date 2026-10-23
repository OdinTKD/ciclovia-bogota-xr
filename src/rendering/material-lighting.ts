import { LinearMipmapNearestFilter, Material, Mesh, MeshLambertMaterial, MeshStandardMaterial, Scene, Texture, type MinificationTextureFilter } from 'three';
const REFLECTION_STRENGTH = .35;
const REFLECTIVE_METALNESS = .3;
const alternatives = new WeakMap<Material, Material>();
const textureFilters = new WeakMap<Texture, { anisotropy: number; minFilter: MinificationTextureFilter }>();
export const materialAlternative = (material: Material) => alternatives.get(material);

function applyTextureFiltering(map: Texture, fullEffects: boolean) {
  if (!textureFilters.has(map)) textureFilters.set(map, { anisotropy: map.anisotropy, minFilter: map.minFilter });
  const original = textureFilters.get(map)!;
  const anisotropy = fullEffects ? original.anisotropy : 1;
  const minFilter = fullEffects ? original.minFilter : LinearMipmapNearestFilter;
  if (map.anisotropy !== anisotropy || map.minFilter !== minFilter) {
    map.anisotropy = anisotropy; map.minFilter = minFilter; map.needsUpdate = true;
  }
}

function selectMaterial(material: Material, fullEffects: boolean): Material {
  if (fullEffects) return material instanceof MeshLambertMaterial ? alternatives.get(material) ?? material : material;
  if (!(material instanceof MeshStandardMaterial)) return material;
  let diffuse = alternatives.get(material);
  if (!diffuse) {
    const replacement = new MeshLambertMaterial({ map: material.map, vertexColors: material.vertexColors,
      side: material.side, alphaTest: material.alphaTest, transparent: material.transparent, opacity: material.opacity });
    // Shared color preserves the existing weather tint updates without per-frame copying.
    replacement.color = material.color;
    replacement.name = `${material.name}-diffuse`;
    diffuse = replacement;
    alternatives.set(material, diffuse); alternatives.set(diffuse, material);
  }
  return diffuse;
}
/** Matte textures retain direct/hemisphere light; only metal/glazing samples the cubemap. */
export function applyMaterialLighting(scene: Scene, reflection: Texture | null) {
  scene.environment = null;
  scene.traverse(object => {
    if (!(object instanceof Mesh)) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!(material instanceof MeshStandardMaterial)) continue;
      const next = material.metalness >= REFLECTIVE_METALNESS ? reflection : null;
      if (material.envMap !== next) { material.envMap = next; material.needsUpdate = true; }
      material.envMapIntensity = REFLECTION_STRENGTH;
    }
  });
}

/** At the existing minimum resolution, favor response over reflection/shadow effects. */
export function applyRenderQuality(renderer: { shadowMap: { enabled: boolean } }, scene: Scene, reflection: Texture, ratio: number) {
  const fullEffects = ratio > .375;
  renderer.shadowMap.enabled = fullEffects;
  // Restore originals before assigning their reflection state; cache fallback materials.
  scene.traverse(object => {
    if (object instanceof Mesh) object.material = Array.isArray(object.material)
      ? object.material.map(material => selectMaterial(material, true)) : selectMaterial(object.material, true);
  });
  applyMaterialLighting(scene, fullEffects ? reflection : null);
  if (!fullEffects) scene.traverse(object => {
    if (object instanceof Mesh) object.material = Array.isArray(object.material)
      ? object.material.map(material => selectMaterial(material, false)) : selectMaterial(object.material, false);
  });
  scene.traverse(object => {
    if (!(object instanceof Mesh)) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      const map = (material as MeshLambertMaterial).map;
      if (map) applyTextureFiltering(map, fullEffects);
    }
  });
}
