import { it, expect } from "vitest";
import { createInputController } from "../../src/input/controller";
function key(target: EventTarget, type: string, value: string) {
  const e = new Event(type);
  Object.defineProperty(e, "key", { value });
  target.dispatchEvent(e);
}
it("mantiene teclado y limpia controles al perder foco", () => {
  const target = new EventTarget();
  const input = createInputController(target);
  key(target, "keydown", "w");
  key(target, "keydown", "ArrowLeft");
  expect(input.read()).toEqual({ throttle: 1, steer: -1, brake: false });
  target.dispatchEvent(new Event("blur"));
  expect(input.read().throttle).toBe(0);
  key(target, "keydown", " ");
  expect(input.read().brake).toBe(true);
  input.dispose();
});
it("mantiene controles táctiles hasta soltar o cancelar el puntero", () => {
  const pedal = new EventTarget(),
    right = new EventTarget();
  const input = createInputController(new EventTarget(), { pedal, right });
  pedal.dispatchEvent(new Event("pointerdown"));
  right.dispatchEvent(new Event("pointerdown"));
  expect(input.read()).toEqual({ throttle: 1, steer: 1, brake: false });
  pedal.dispatchEvent(new Event("pointercancel"));
  expect(input.read().throttle).toBe(0);
  input.dispose();
});
