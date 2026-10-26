import { Mesh, type Object3D } from 'three';

// Base-world meshes keep Three's default zero order. Leave space between layers
// without overriding the order among materials within each layer.
export const OPAQUE_DEPTH_ORDER = { bicycle: -20, artSlice: -10 } as const;

/** Depth-writing opaque occluders can run before the surfaces they hide.
 * Group order and transparent sorting remain untouched; depth testing remains authoritative.
 */
export function prioritizeOpaqueDepth(root: Object3D, order: number): void {
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (materials.every(material => !material.transparent && material.depthTest && material.depthWrite)) {
      object.renderOrder = order;
    }
  });
}
