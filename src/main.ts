import "./style.css";
import { createUI } from "./ui";
import { buildScene } from "./rendering/scene";
import { createSimulation } from "./core/simulation";
import { summarizeFrames } from "./core/performance";
import { createInputController } from "./input/controller";
import { createPhysics } from "./physics/world";
import { createTraffic, parseTrafficConfig, type Obstacle } from "./traffic";
import { parseHumor, humorLine } from "./config/humor";
import { parseLevel } from "./levels";
import { detectAR } from "./xr/capabilities";
import { parseWeather } from "./weather";
import { createQualityController } from "./rendering/quality";

const ui = createUI(document.querySelector<HTMLElement>("#app")!);
const simulation = createSimulation();
const input = createInputController(window, {
  pedal: ui.elements.touchPedal,
  left: ui.elements.touchLeft,
  right: ui.elements.touchRight,
  brake: ui.elements.touchBrake,
});
const frames: number[] = [];
let ready = false,
  renderStats = { drawCalls: 0, triangles: 0, pixelRatio: 1 },
  obstacles: Obstacle[] = [];
let arCapability = { supported: false, reason: "unavailable" };
Object.defineProperty(window, "__game", {
  get: () => ({
    ready,
    state: { ...simulation.state },
    render: { ...renderStats },
    performance: summarizeFrames(frames),
    traffic: obstacles.map((o) => ({ ...o })),
    ar: { ...arCapability },
  }),
});
async function json(path: string): Promise<unknown> {
  const response = await fetch(import.meta.env.BASE_URL + path);
  if (!response.ok) throw new Error(`No se pudo cargar ${path}`);
  return response.json();
}

async function boot() {
  const level = parseLevel(await json("config/levels/virrey.json"));
  const [physics, rawTraffic, rawHumor] = await Promise.all([
    createPhysics(),
    json(level.traffic),
    json("config/humor/bogota.json"),
  ]);
  simulation.config.routeLength = level.length;
  const traffic = createTraffic(parseTrafficConfig(rawTraffic), level.seed),
    lines = parseHumor(rawHumor);
  void detectAR(navigator.xr).then((result) => {
    arCapability = result;
  });
  const world = buildScene(ui.elements.canvas);
  const quality = createQualityController(world.renderer.getPixelRatio());
  let last = performance.now(),
    bubble = "",
    bubbleUntil = 0;
  function pause() {
    simulation.pause();
    input.reset();
  }
  ui.elements.start.addEventListener("click", () => {
    if (ready && ui.elements.safety.checked) {
      simulation.start();
      input.reset();
      frames.length = 0;
    }
  });
  ui.elements.pause.addEventListener("click", pause);
  ui.elements.resume.addEventListener("click", () => {
    simulation.resume();
    input.reset();
    frames.length = 0;
  });
  ui.elements.restart.addEventListener("click", () => {
    simulation.restart();
    traffic.reset();
    input.reset();
    bubble = "";
    frames.length = 0;
  });
  ui.elements.weather.addEventListener("change", () => {
    simulation.setWeather(parseWeather(ui.elements.weather.value));
    frames.length = 0;
  });
  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "p" || event.key === "Escape") {
      if (simulation.state.phase === "playing") pause();
      else if (simulation.state.phase === "paused") simulation.resume();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
  });
  window.addEventListener("blur", pause);
  window.addEventListener("resize", world.resize);
  ready = true;
  ui.setReady(true);
  let lastUiAt = -Infinity;
  let lastUiPhase: string = "";
  function frame(now: number) {
    const ms = now - last;
    last = now;
    if (simulation.state.phase === "playing" && quality.sample(ms)) {
      world.renderer.setPixelRatio(quality.ratio);
      world.resize();
      frames.length = 0;
    }
    const before = simulation.state.elapsed;
    simulation.update(ms / 1000, input.read());
    const dt = simulation.state.elapsed - before;
    obstacles = traffic.update(simulation.state.distance, dt);
    if (dt > 0) {
      physics.player(simulation.state.x, simulation.state.distance);
      for (const obstacle of obstacles)
        if (
          obstacle.active &&
          Math.abs(obstacle.z - simulation.state.distance) < 5 &&
          physics.overlaps(
            obstacle.x,
            obstacle.z,
            obstacle.halfX,
            obstacle.halfZ,
          )
        ) {
          const previous = simulation.state.collisions;
          simulation.hit();
          if (simulation.state.collisions > previous) {
            bubble = humorLine(lines, previous, ui.elements.humor.checked);
            bubbleUntil = simulation.state.elapsed + 3;
          }
        }
      if (ms > 0) {
        frames.push(ms);
        if (frames.length > 180) frames.shift();
      }
    }
    const state = simulation.state;
    world.update(state, obstacles);
    world.render();
    renderStats = {
      drawCalls: world.renderer.info.render.calls,
      triangles: world.renderer.info.render.triangles,
      pixelRatio: world.renderer.getPixelRatio(),
    };
    if (state.phase !== lastUiPhase || now - lastUiAt >= 100) {
      ui.update({
        status: state.phase === "playing" ? "running" : state.phase,
        ...state,
        humor: state.elapsed < bubbleUntil ? bubble : "",
      });
      lastUiAt = now;
      lastUiPhase = state.phase;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
boot().catch((error) => {
  ui.showError(
    `No se pudo iniciar el juego. ${error instanceof Error ? error.message : "Intenta recargar."}`,
  );
  ui.elements.start.disabled = true;
});
