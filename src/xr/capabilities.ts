export interface ARCapability {
  supported: boolean;
  reason: "unavailable" | "unsupported" | "supported" | "error";
}

/** Capability check only. MVP play always uses the normal screen. */
export async function detectAR(xr?: {
  isSessionSupported(mode: string): Promise<boolean>;
}): Promise<ARCapability> {
  if (!xr) return { supported: false, reason: "unavailable" };
  try {
    const supported = await xr.isSessionSupported("immersive-ar");
    return { supported, reason: supported ? "supported" : "unsupported" };
  } catch {
    return { supported: false, reason: "error" };
  }
}
