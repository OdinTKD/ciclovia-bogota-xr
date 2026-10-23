export const formatSpeed = (metersPerSecond: number) =>
  String(Math.round(Math.max(0, metersPerSecond) * 3.6));
export const formatDistance = (meters: number) =>
  `${Math.floor(Math.max(0, meters))} m`;
export const canStart = (safetyConfirmed: boolean) => safetyConfirmed;
export const routeProgress = (distance: number) =>
  Math.min(100, Math.max(0, (distance / 1200) * 100));
