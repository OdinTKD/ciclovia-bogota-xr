export interface BicycleContact {
  actorId: string;
  normal: { x: number; z: number }; // world-space outward normal of bicycle
  normalSpeed: number; // positive relative closing speed, m/s
  kind: "frontal" | "lateral";
}

/** Shape-cast normals are local to the bicycle, unlike contactShape normals. */
export function normalToWorld(normal: { x: number; z: number }, yaw: number) {
  return {
    x: Math.cos(yaw) * normal.x - Math.sin(yaw) * normal.z,
    z: Math.sin(yaw) * normal.x + Math.cos(yaw) * normal.z,
  };
}

export function classifyContact(actorId: string, normal: { x: number; z: number }, relativeVelocity: { x: number; z: number }, yaw: number): BicycleContact {
  const alignment = Math.abs(Math.sin(yaw) * normal.x - Math.cos(yaw) * normal.z);
  return {
    actorId, normal,
    normalSpeed: Math.max(0, relativeVelocity.x * normal.x + relativeVelocity.z * normal.z),
    kind: alignment >= 0.65 ? "frontal" : "lateral",
  };
}
