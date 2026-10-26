interface Pose2D { x: number; z: number; yaw: number }
export const FLOAT32_MARGIN_FACTOR = 1e-6;

/** Conservative 2D broad phase for already angular-padded cuboids.
 * Relative displacement is B minus A over the remaining sweep time.
 * Separate per-axis overlap is necessary, not sufficient: Rapier decides contacts.
 */
export function mayOverlapSweptBoxes(
  a: Pose2D, halfAX: number, halfAZ: number,
  b: Pose2D, halfBX: number, halfBZ: number,
  relativeDeltaX = 0, relativeDeltaZ = 0, margin = 0,
): boolean {
  if (!Number.isFinite(a.x + a.z + a.yaw + b.x + b.z + b.yaw + halfAX + halfAZ + halfBX + halfBZ + relativeDeltaX + relativeDeltaZ + margin)
    || halfAX < 0 || halfAZ < 0 || halfBX < 0 || halfBZ < 0 || margin < 0) return true;
  // Straight road bounds need no trigonometry. Other rotations retain their exact AABB extents.
  const ca = a.yaw === 0 ? 1 : Math.abs(Math.cos(a.yaw)), sa = a.yaw === 0 ? 0 : Math.abs(Math.sin(a.yaw));
  const cb = b.yaw === 0 ? 1 : Math.abs(Math.cos(b.yaw)), sb = b.yaw === 0 ? 0 : Math.abs(Math.sin(b.yaw));
  // Rapier quantizes inputs to float32. A scale-dependent cushion keeps tangencies
  // at large world coordinates and uncertain values on the narrow-phase path.
  const rounding = FLOAT32_MARGIN_FACTOR * (1 + Math.abs(a.x) + Math.abs(a.z) + Math.abs(b.x) + Math.abs(b.z)
    + halfAX + halfAZ + halfBX + halfBZ + Math.abs(relativeDeltaX) + Math.abs(relativeDeltaZ));
  const extentX = ca * halfAX + sa * halfAZ + cb * halfBX + sb * halfBZ + margin + rounding;
  const extentZ = sa * halfAX + ca * halfAZ + sb * halfBX + cb * halfBZ + margin + rounding;
  const dx = b.x - a.x, dz = b.z - a.z;
  return !(Math.min(dx, dx + relativeDeltaX) > extentX || Math.max(dx, dx + relativeDeltaX) < -extentX
    || Math.min(dz, dz + relativeDeltaZ) > extentZ || Math.max(dz, dz + relativeDeltaZ) < -extentZ);
}
