import "./style.css";
import { createUI } from "./ui";
import { buildScene, assetGeometryStats } from "./rendering/scene";
import { loadArtTextures } from './rendering/art-slice';
import { createSimulation } from "./core/simulation";
import { summarizeFrames } from "./core/performance";
import { createInputController } from "./input/controller";
import { preparePhysics } from "./physics/preparation";
import { createTraffic, parseTrafficConfig, type Obstacle } from "./traffic";
import { parseHumor, humorLine } from "./config/humor";
import { parseLevel } from "./levels";
import { detectAR } from "./xr/capabilities";
import { parseWeather } from "./weather";
import { createQualityController } from "./rendering/quality";
import { createSessionReport } from "./core/session-report";
import { loadBicycleAsset } from './rendering/assets';
import { warmRendererVariants } from './rendering/renderer-warmup';
import { calibrateRenderer } from './rendering/renderer-calibration';
import type { PhysicsActorMotion } from "./physics/world";

const GATE_ROUTE_LENGTH = 200;
const ui = createUI(document.querySelector<HTMLElement>("#app")!, GATE_ROUTE_LENGTH);
const simulation = createSimulation({ routeLength: GATE_ROUTE_LENGTH });
const input = createInputController(window, {
  pedal: ui.elements.touchPedal,
  left: ui.elements.touchLeft,
  right: ui.elements.touchRight,
  brake: ui.elements.touchBrake,
});
const frames: number[] = [];
let ready = false,
  renderStats = { drawCalls: 0, triangles: 0, pixelRatio: 1, width: 0, height: 0, cssWidth: 0, cssHeight: 0, devicePixelRatio: window.devicePixelRatio, shadows: true, materialQuality: 'pbr', antialias: false, artDetail: 'high' },
  obstacles: Obstacle[] = [];
const session = createSessionReport();
let physicsSteps = 0;
let assetStats: ReturnType<typeof assetGeometryStats> | null = null;
const encounters: Array<{ tick: number; distance: number; contact: unknown }> = [];
let arCapability = { supported: false, reason: "unavailable" };
Object.defineProperty(window, "__game", {
  get: () => ({
    ready,
    gate: 'A', routeLength: GATE_ROUTE_LENGTH, physicsSteps,
    state: structuredClone(simulation.state),
    render: { ...renderStats },
    performance: summarizeFrames(frames),
    traffic: obstacles.map((o) => ({ ...o })),
    ar: { ...arCapability },
    assets: assetStats ? { ...assetStats, source: 'blender-glb' } : null,
    artSlice: { start: 0, end: 40 },
  }),
});
async function json(path: string): Promise<unknown> {
  const response = await fetch(import.meta.env.BASE_URL + path);
  if (!response.ok) throw new Error(`No se pudo cargar ${path}`);
  return response.json();
}

async function boot() {
  const level = parseLevel(await json("config/levels/virrey.json"));
  const [physics, rawTraffic, rawHumor, bicycle, artTextures] = await Promise.all([
    preparePhysics(),
    json(level.traffic),
    json("config/humor/bogota.json"),
    loadBicycleAsset(import.meta.env.BASE_URL),
    loadArtTextures(import.meta.env.BASE_URL),
  ]);
  simulation.config.routeLength = Math.min(GATE_ROUTE_LENGTH, level.length);
  const traffic = createTraffic(parseTrafficConfig(rawTraffic), level.seed),
    lines = parseHumor(rawHumor);
  let previousState = { ...simulation.state };
  let previousTraffic = traffic.update(0, 0);
  simulation.setWorld(physics, {
    step(dt, state) {
      previousState = { ...state };
      const next = traffic.update(state.distance, dt);
      const motions: PhysicsActorMotion[] = [];
      for (let i = 0; i < next.length; i++) {
        const before = previousTraffic[i], after = next[i];
        if (!(before.active || after.active) || Math.abs(after.z - state.distance) > 35) continue;
        motions.push({ id: after.id, kind: after.kind,
          from: { x: before.x, z: -before.z, yaw: 0 },
          to: { x: after.x, z: -after.z, yaw: 0 },
          halfX: after.halfX, halfZ: after.halfZ });
      }
      previousTraffic = next;
      obstacles = next;
      return motions;
    },
    reset() {
      traffic.reset();
      previousTraffic = traffic.update(0, 0);
      obstacles = previousTraffic;
      previousState = { ...simulation.state };
    },
  });
  void detectAR(navigator.xr).then((result) => {
    arCapability = result;
  });
  const world = buildScene(ui.elements.canvas, { bicycle, artTextures });
  const antialias = world.renderer.getContext().getContextAttributes()?.antialias ?? false;
  await warmRendererVariants({
    setQuality: world.setQuality,
    compile: () => world.renderer.compileAsync(world.scene, world.camera),
    render: world.render,
  }, world.renderer.getPixelRatio());
  const setQuality = (ratio: number) => {
    world.renderer.setPixelRatio(ratio);
    world.setQuality(ratio);
    world.resize();
  };
  await calibrateRenderer({ render: world.render, setQuality }, world.renderer.getPixelRatio());
  assetStats = assetGeometryStats(world.scene.getObjectByName('bicycle') ?? world.scene);
  const quality = createQualityController(world.renderer.getPixelRatio(), Math.min(window.devicePixelRatio, 1.5));
  let last = performance.now(),
    bubble = "",
    bubbleUntil = 0;
  const startedAt = new Date().toISOString();
  ui.downloadReport.addEventListener('click', () => {
    const report = { version: '0.3.0-alpha.3', gate: 'A', startedAt, exportedAt: new Date().toISOString(),
      userAgent: navigator.userAgent, hardwareConcurrency: navigator.hardwareConcurrency,
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
      state: structuredClone(simulation.state), physicsSteps: physics.steps,
      session: session.snapshot(), encounters, assets: assetStats, render: { ...renderStats },
      note: 'Mediciones del navegador. Modelo de teléfono, batería, calor y sensación de conducción se reportan por separado. Solo frames jugando; incluye reinicios.' };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'ciclovia-gate-a-report.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
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
    input.reset();
    bubble = "";
    frames.length = 0;
  });
  const syncWeather = () => simulation.setWeather(parseWeather(ui.elements.weather.value));
  syncWeather();
  ui.elements.weather.addEventListener("change", () => {
    syncWeather();
    frames.length = 0;
  });
  window.addEventListener("keydown", (event) => {
    const isPauseKey = event.key.toLowerCase() === "p" || event.key === "Escape";
    if (!isPauseKey || event.repeat) return;
    if (simulation.state.phase === "playing") pause();
    else if (simulation.state.phase === "paused") simulation.resume();
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
      setQuality(quality.ratio);
      frames.length = 0;
    }
    const before = simulation.state.elapsed;
    const wasPlaying = simulation.state.phase === 'playing';
    const previousCollisions = simulation.state.collisions;
    simulation.update(ms / 1000, input.read());
    const dt = simulation.state.elapsed - before;
    physicsSteps = physics.steps;
    if (dt > 0) {
      if (simulation.state.collisions > previousCollisions) {
        bubble = humorLine(lines, previousCollisions, ui.elements.humor.checked);
        bubbleUntil = simulation.state.elapsed + 3;
        if (encounters.length < 200) encounters.push({ tick: simulation.state.tick, distance: simulation.state.distance, contact: simulation.state.lastContact });
      }
    }
    if (wasPlaying && ms > 0) {
      frames.push(ms);
      if (frames.length > 180) frames.shift();
    }
    const state = simulation.state;
    const alpha = state.phase === 'playing' ? simulation.interpolationAlpha : 1;
    const smooth = { ...state, pedalEffort: input.read().throttle };
    for (const key of ['x', 'worldZ', 'yaw', 'steeringAngle', 'roll'] as const)
      smooth[key] = previousState[key] + (state[key] - previousState[key]) * alpha;
    world.update(smooth, obstacles);
    world.render();
    renderStats = {
      drawCalls: world.renderer.info.render.calls,
      triangles: world.renderer.info.render.triangles,
      pixelRatio: world.renderer.getPixelRatio(),
      width: ui.elements.canvas.width, height: ui.elements.canvas.height,
      cssWidth: ui.elements.canvas.clientWidth, cssHeight: ui.elements.canvas.clientHeight,
      devicePixelRatio: window.devicePixelRatio,
      shadows: world.renderer.shadowMap.enabled,
      materialQuality: world.renderer.shadowMap.enabled ? 'pbr' : 'diffuse',
      antialias,
      artDetail: world.getArtDetail(),
    };
    if (wasPlaying) session.sample(ms, state.weather, renderStats);
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
