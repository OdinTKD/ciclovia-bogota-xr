export const FIXED_STEP = 1 / 60;
/** The only game accumulator; a false callback stops at a terminal state. */
export function createFixedLoop() {
  let accumulator = 0;
  return {
    advance(dt: number, tick: (dt: number) => boolean | void) {
      if (!Number.isFinite(dt) || dt <= 0) return;
      accumulator += Math.min(dt, 0.25);
      while (accumulator + 1e-10 >= FIXED_STEP) {
        accumulator = Math.max(0, accumulator - FIXED_STEP);
        if (tick(FIXED_STEP) === false) { accumulator = 0; break; }
      }
    },
    reset() { accumulator = 0; },
    get alpha() { return accumulator / FIXED_STEP; },
  };
}
