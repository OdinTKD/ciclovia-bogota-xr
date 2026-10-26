import { Mesh, type Object3D } from 'three';

// Base-world meshes keep Three's default zero order. Leave space between layers
// without overriding the order among materials within each layer.
export const OPAQUE_DEPTH_ORDER = { bicycle: -20, artSlice: -10, cutout: 10 } as const;

/** Solid occluders run first; alpha-tested cards follow the world's solid depth.
 * A mixed solid/cutout mesh follows the cutout order without splitting its draws.
 * Groups and transparent sorting stay untouched; depth testing stays authoritative.
 */
export function prioritizeOpaqueDepth(root: Object3D, order: number): void {
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (materials.every(material => !material.transparent && material.depthTest && material.depthWrite)) {
      const hasCutout = materials.some(material => material.alphaTest > 0);
      object.renderOrder = hasCutout ? OPAQUE_DEPTH_ORDER.cutout : order;
    }
  });
}
