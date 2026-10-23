import { describe, expect, it, vi } from "vitest";
import { detectAR } from "../../src/xr/capabilities";

describe("AR capability detection with normal screen fallback", () => {
  it("handles absent WebXR without blocking normal play", async () => {
    expect(await detectAR()).toEqual({
      supported: false,
      reason: "unavailable",
    });
  });

  it("queries immersive-ar and reports unsupported devices", async () => {
    const isSessionSupported = vi.fn().mockResolvedValue(false);
    expect(await detectAR({ isSessionSupported })).toEqual({
      supported: false,
      reason: "unsupported",
    });
    expect(isSessionSupported).toHaveBeenCalledExactlyOnceWith("immersive-ar");
  });

  it("contains rejected checks, including permissions errors", async () => {
    const isSessionSupported = vi
      .fn()
      .mockRejectedValue(new Error("Permission denied"));
    await expect(detectAR({ isSessionSupported })).resolves.toEqual({
      supported: false,
      reason: "error",
    });
  });

  it("reports capability without requesting a session, sensors or camera", async () => {
    const requestSession = vi.fn();
    const xr = {
      isSessionSupported: vi.fn().mockResolvedValue(true),
      requestSession,
    };
    expect(await detectAR(xr)).toEqual({
      supported: true,
      reason: "supported",
    });
    expect(requestSession).not.toHaveBeenCalled();
  });
});
