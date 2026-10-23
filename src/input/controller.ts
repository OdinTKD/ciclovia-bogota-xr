import type { InputState } from "../core/simulation";
type Buttons = Partial<
  Record<"pedal" | "left" | "right" | "brake", EventTarget>
>;
export function createInputController(
  target: EventTarget,
  buttons: Buttons = {},
) {
  const keys = new Set<string>(),
    touch = new Set<string>();
  const removers: Array<() => void> = [];
  const on = (el: EventTarget, name: string, fn: EventListener) => {
    el.addEventListener(name, fn);
    removers.push(() => el.removeEventListener(name, fn));
  };
  const reset = () => {
    keys.clear();
    touch.clear();
  };
  for (const type of ["keydown", "keyup"])
    on(target, type, (event) => {
      const key = (event as KeyboardEvent).key.toLowerCase();
      const element = event.target as HTMLElement | null;
      if (
        element?.tagName &&
        ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(element.tagName)
      )
        return;
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowleft",
          "arrowdown",
          "arrowright",
          " ",
        ].includes(key)
      ) {
        event.preventDefault();
        if (type === "keydown") keys.add(key);
        else keys.delete(key);
      }
    });
  on(target, "blur", reset);
  for (const [name, button] of Object.entries(buttons))
    if (button) {
      on(button, "pointerdown", (event) => {
        event.preventDefault();
        touch.add(name);
        const e = event as PointerEvent;
        if (
          e.pointerId !== undefined &&
          (button as HTMLElement).setPointerCapture
        )
          try {
            (button as HTMLElement).setPointerCapture(e.pointerId);
          } catch {
            /* synthetic pointer in test */
          }
      });
      for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
        on(button, type, () => touch.delete(name));
    }
  return {
    reset,
    read(): InputState {
      return {
        throttle:
          keys.has("w") || keys.has("arrowup") || touch.has("pedal") ? 1 : 0,
        steer:
          Number(
            keys.has("d") || keys.has("arrowright") || touch.has("right"),
          ) -
          Number(keys.has("a") || keys.has("arrowleft") || touch.has("left")),
        brake:
          keys.has(" ") ||
          keys.has("s") ||
          keys.has("arrowdown") ||
          touch.has("brake"),
      };
    },
    dispose() {
      removers.forEach((fn) => fn());
      reset();
    },
  };
}
